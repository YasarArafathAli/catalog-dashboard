/**
 * Finnhub WebSocket service for live Bitcoin data
 */

const FINNHUB_WS_URL = 'wss://ws.finnhub.io';

/**
 * Create and manage Finnhub WebSocket connection for live Bitcoin data
 * @param {Function} onMessage - Callback function to handle incoming messages
 * @param {Function} onError - Callback function to handle errors
 * @returns {Object} WebSocket connection object with methods
 */
export const createFinnhubConnection = (onMessage, onError) => {
  const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
  
  if (!apiKey || apiKey === 'your_finnhub_api_key_here') {
    const error = new Error('Finnhub API key not configured. Please set VITE_FINNHUB_API_KEY in .env file');
    onError(error);
    return null;
  }

  // Validate API key format (Finnhub keys are typically 20 characters)
  if (apiKey.length < 10) {
    const error = new Error('Invalid Finnhub API key format. Please check your VITE_FINNHUB_API_KEY in .env file');
    onError(error);
    return null;
  }

  const wsUrl = `${FINNHUB_WS_URL}?token=${apiKey}`;
  console.log('Connecting to Finnhub WebSocket:', wsUrl);
  console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
  
  const ws = new WebSocket(wsUrl);
  
  // Connection timeout
  const connectionTimeout = setTimeout(() => {
    if (ws.readyState === WebSocket.CONNECTING) {
      console.error('WebSocket connection timeout');
      ws.close();
      onError(new Error('WebSocket connection timeout'));
    }
  }, 10000); // 10 second timeout
  
  ws.onopen = () => {
    console.log('Connected to Finnhub WebSocket');
    clearTimeout(connectionTimeout);
    
    // Subscribe to Bitcoin data
    const subscribeMessage = {
      type: 'subscribe',
      symbol: 'BINANCE:BTCUSDT'
    };
    
    try {
      ws.send(JSON.stringify(subscribeMessage));
      console.log('Subscribed to BINANCE:BTCUSDT');
    } catch (error) {
      console.error('Failed to send subscription message:', error);
      onError(new Error('Failed to subscribe to price updates'));
    }
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle different message types
      if (data.type === 'trade') {
        // Live trade data
        const tradeData = data.data?.[0];
        if (tradeData && tradeData.p) {
          const priceData = {
            time: new Date().toISOString(), // Use ISO string for proper date handling
            price: tradeData.p
          };
          onMessage(priceData);
        }
      } else if (data.type === 'ping') {
        // Respond to ping to keep connection alive
        ws.send(JSON.stringify({ type: 'pong' }));
      } else if (data.type === 'error') {
        console.error('WebSocket error:', data.msg);
        onError(new Error(data.msg));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      onError(error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    console.error('WebSocket readyState:', ws.readyState);
    console.error('WebSocket URL:', ws.url);
    clearTimeout(connectionTimeout);
    
    let errorMessage = 'WebSocket connection failed';
    if (ws.readyState === WebSocket.CONNECTING) {
      errorMessage = 'Failed to establish WebSocket connection';
    } else if (ws.readyState === WebSocket.CLOSED) {
      errorMessage = 'WebSocket connection was closed';
    } else if (ws.readyState === WebSocket.CLOSING) {
      errorMessage = 'WebSocket connection is closing';
    }
    
    onError(new Error(errorMessage));
  };
  
  ws.onclose = (event) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
    clearTimeout(connectionTimeout);
    
    // Only trigger error if it's not a normal closure
    if (event.code !== 1000) {
      console.error('WebSocket closed unexpectedly with code:', event.code);
      let errorMessage = 'WebSocket connection lost';
      
      switch (event.code) {
        case 1006:
          errorMessage = 'WebSocket connection lost (abnormal closure)';
          break;
        case 1011:
          errorMessage = 'WebSocket server error';
          break;
        case 1012:
          errorMessage = 'WebSocket server restart';
          break;
        case 1013:
          errorMessage = 'WebSocket server overloaded';
          break;
        case 1014:
          errorMessage = 'WebSocket gateway timeout';
          break;
        case 1015:
          errorMessage = 'WebSocket TLS handshake failed';
          break;
        default:
          errorMessage = `WebSocket closed unexpectedly: ${event.code} - ${event.reason || 'No reason provided'}`;
      }
      
      onError(new Error(errorMessage));
    }
  };
  
  // Return connection object with methods
  return {
    ws,
    unsubscribe: () => {
      if (ws.readyState === WebSocket.OPEN) {
        const unsubscribeMessage = {
          type: 'unsubscribe',
          symbol: 'BINANCE:BTCUSDT'
        };
        ws.send(JSON.stringify(unsubscribeMessage));
        console.log('Unsubscribed from BINANCE:BTCUSDT');
      }
    },
    close: () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
        console.log('WebSocket connection closed');
      }
    },
    getReadyState: () => ws.readyState,
    getUrl: () => ws.url
  };
};

/**
 * Test WebSocket connection
 */
export const testFinnhubConnection = () => {
  return new Promise((resolve, reject) => {
    const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
    
    if (!apiKey || apiKey === 'your_finnhub_api_key_here') {
      reject(new Error('Finnhub API key not configured'));
      return;
    }

    const wsUrl = `${FINNHUB_WS_URL}?token=${apiKey}`;
    const ws = new WebSocket(wsUrl);
    
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Connection timeout'));
    }, 5000);

    ws.onopen = () => {
      clearTimeout(timeout);
      ws.close();
      resolve('Connection successful');
    };

    ws.onerror = (error) => {
      clearTimeout(timeout);
      reject(new Error(`Connection failed: ${error.type}`));
    };
  });
};
