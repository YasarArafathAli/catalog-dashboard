/**
 * WebSocket Connection Manager
 * Handles WebSocket lifecycle, retry logic, and prevents multiple connections
 */

import { logger } from '../utils/logger.js';

class ConnectionManager {
  constructor() {
    this.connection = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryTimeout = null;
    this.isConnecting = false;
    this.isDestroyed = false;
    this.connectionTimeout = null;
    this.pingInterval = null;
    this.lastPingTime = null;
    
    // Store callbacks to prevent memory leaks
    this.callbacks = {
      onMessage: null,
      onError: null,
      onConnect: null,
      onDisconnect: null
    };
    
    // Configuration
    this.config = {
      connectionTimeout: 10000, // 10 seconds
      retryDelay: 2000, // 2 seconds base delay
      maxRetryDelay: 30000, // 30 seconds max delay
      pingInterval: 30000, // 30 seconds ping interval
      pingTimeout: 5000, // 5 seconds ping timeout
    };
  }

  /**
   * Create a new WebSocket connection
   * @param {Function} onMessage - Message handler
   * @param {Function} onError - Error handler
   * @param {Function} onConnect - Connection success handler
   * @param {Function} onDisconnect - Disconnect handler
   * @returns {Object} Connection object
   */
  createConnection(onMessage, onError, onConnect, onDisconnect) {
    // Prevent multiple connections
    if (this.isConnecting || (this.connection && this.connection.readyState === WebSocket.OPEN)) {
      logger.log('Connection already exists or is connecting, skipping new connection');
      return this.connection;
    }

    // Clean up existing connection
    this.cleanup();

    // Store callbacks to prevent memory leaks
    this.callbacks = {
      onMessage,
      onError,
      onConnect,
      onDisconnect
    };

    this.isConnecting = true;
    this.isDestroyed = false;

    const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
    
    if (!apiKey || apiKey === 'your_finnhub_api_key_here') {
      const error = new Error('Finnhub API key not configured. Please set VITE_FINNHUB_API_KEY in .env file');
      onError(error);
      this.isConnecting = false;
      return null;
    }

    if (apiKey.length < 10) {
      const error = new Error('Invalid Finnhub API key format. Please check your VITE_FINNHUB_API_KEY in .env file');
      onError(error);
      this.isConnecting = false;
      return null;
    }

    const wsUrl = `wss://ws.finnhub.io?token=${apiKey}`;
    logger.log('Creating WebSocket connection:', wsUrl);
    logger.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
    
    try {
      this.connection = new WebSocket(wsUrl);
      this.setupEventHandlers();
      this.setupConnectionTimeout();
      
      return {
        ws: this.connection,
        unsubscribe: () => this.unsubscribe(),
        close: () => this.close(),
        getReadyState: () => this.connection?.readyState,
        getUrl: () => this.connection?.url,
        isConnecting: () => this.isConnecting,
        isConnected: () => this.connection?.readyState === WebSocket.OPEN
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.isConnecting = false;
      onError(error);
      return null;
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    this.connection.onopen = () => {
      logger.log('WebSocket connected successfully');
      this.isConnecting = false;
      this.retryCount = 0; // Reset retry count on successful connection
      this.clearConnectionTimeout();
      this.setupPingInterval();
      
      // Subscribe to Bitcoin data
      this.subscribe();
      this.callbacks.onConnect?.();
    };

    this.connection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'trade') {
          const tradeData = data.data?.[0];
          if (tradeData && tradeData.p) {
            const priceData = {
              time: new Date().toISOString(),
              price: tradeData.p
            };
            this.callbacks.onMessage?.(priceData);
          }
        } else if (data.type === 'ping') {
          this.handlePing();
        } else if (data.type === 'error') {
          logger.error('WebSocket server error:', data.msg);
          this.callbacks.onError?.(new Error(data.msg));
        }
      } catch (error) {
        logger.error('Error parsing WebSocket message:', error);
        this.callbacks.onError?.(error);
      }
    };

    this.connection.onerror = (error) => {
      logger.error('WebSocket error:', error);
      this.isConnecting = false;
      this.clearConnectionTimeout();
      this.clearPingInterval();
      
      if (!this.isDestroyed) {
        this.callbacks.onError?.(new Error('WebSocket connection error'));
      }
    };

    this.connection.onclose = (event) => {
      logger.log('WebSocket connection closed:', event.code, event.reason);
      this.isConnecting = false;
      this.clearConnectionTimeout();
      this.clearPingInterval();
      
      if (!this.isDestroyed && event.code !== 1000) {
        this.callbacks.onDisconnect?.(event);
        this.handleReconnection();
      }
    };
  }

  /**
   * Handle reconnection with exponential backoff
   */
  handleReconnection() {
    if (this.isDestroyed || this.retryCount >= this.maxRetries) {
      logger.log('Max retries reached or connection destroyed, stopping reconnection attempts');
      return;
    }

    this.retryCount++;
    const delay = Math.min(
      this.config.retryDelay * Math.pow(2, this.retryCount - 1),
      this.config.maxRetryDelay
    );

    logger.log(`WebSocket reconnection attempt ${this.retryCount}/${this.maxRetries} in ${delay}ms`);
    
    this.retryTimeout = setTimeout(() => {
      if (!this.isDestroyed && this.callbacks.onMessage) {
        this.createConnection(
          this.callbacks.onMessage,
          this.callbacks.onError,
          this.callbacks.onConnect,
          this.callbacks.onDisconnect
        );
      }
    }, delay);
  }

  /**
   * Setup connection timeout
   */
  setupConnectionTimeout() {
    this.connectionTimeout = setTimeout(() => {
      if (this.connection && this.connection.readyState === WebSocket.CONNECTING) {
        logger.error('WebSocket connection timeout');
        this.connection.close();
      }
    }, this.config.connectionTimeout);
  }

  /**
   * Clear connection timeout
   */
  clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  /**
   * Setup ping interval to keep connection alive
   */
  setupPingInterval() {
    this.clearPingInterval();
    this.lastPingTime = Date.now();
    
    this.pingInterval = setInterval(() => {
      if (this.connection && this.connection.readyState === WebSocket.OPEN) {
        // Check if we haven't received a ping response
        if (this.lastPingTime && Date.now() - this.lastPingTime > this.config.pingTimeout) {
          logger.warn('WebSocket ping timeout, reconnecting...');
          this.reconnect();
        }
      }
    }, this.config.pingInterval);
  }

  /**
   * Clear ping interval
   */
  clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Handle ping from server
   */
  handlePing() {
    this.lastPingTime = Date.now();
    if (this.connection && this.connection.readyState === WebSocket.OPEN) {
      this.connection.send(JSON.stringify({ type: 'pong' }));
    }
  }

  /**
   * Subscribe to Bitcoin data
   */
  subscribe() {
    if (this.connection && this.connection.readyState === WebSocket.OPEN) {
      const subscribeMessage = {
        type: 'subscribe',
        symbol: 'BINANCE:BTCUSDT'
      };
      
      try {
        this.connection.send(JSON.stringify(subscribeMessage));
        logger.log('Subscribed to BINANCE:BTCUSDT');
      } catch (error) {
        logger.error('Failed to send subscription message:', error);
      }
    }
  }

  /**
   * Unsubscribe from Bitcoin data
   */
  unsubscribe() {
    if (this.connection && this.connection.readyState === WebSocket.OPEN) {
      const unsubscribeMessage = {
        type: 'unsubscribe',
        symbol: 'BINANCE:BTCUSDT'
      };
      
      try {
        this.connection.send(JSON.stringify(unsubscribeMessage));
        logger.log('Unsubscribed from BINANCE:BTCUSDT');
      } catch (error) {
        logger.error('Failed to send unsubscription message:', error);
      }
    }
  }

  /**
   * Close the connection
   */
  close() {
    this.isDestroyed = true;
    this.cleanup();
    
    if (this.connection) {
      this.connection.close(1000, 'Client closing connection');
      this.connection = null;
    }
  }

  /**
   * Reconnect the connection
   */
  reconnect() {
    if (this.connection) {
      this.connection.close();
    }
    this.retryCount = 0; // Reset retry count for manual reconnection
  }

  /**
   * Clean up timeouts and intervals
   */
  cleanup() {
    this.clearConnectionTimeout();
    this.clearPingInterval();
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    
    // Clear callback references to prevent memory leaks
    this.callbacks = {
      onMessage: null,
      onError: null,
      onConnect: null,
      onDisconnect: null
    };
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnecting: this.isConnecting,
      isConnected: this.connection?.readyState === WebSocket.OPEN,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      readyState: this.connection?.readyState
    };
  }
}

// Export singleton instance
export const connectionManager = new ConnectionManager();

// Export class for testing
export { ConnectionManager };
