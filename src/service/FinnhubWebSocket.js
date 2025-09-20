/**
 * Finnhub WebSocket service for live Bitcoin data
 * Now uses ConnectionManager for better connection handling
 */

import { connectionManager } from './ConnectionManager.js';

/**
 * Create and manage Finnhub WebSocket connection for live Bitcoin data
 * @param {Function} onMessage - Callback function to handle incoming messages
 * @param {Function} onError - Callback function to handle errors
 * @param {Function} onConnect - Callback function for successful connection
 * @param {Function} onDisconnect - Callback function for disconnection
 * @returns {Object} WebSocket connection object with methods
 */
export const createFinnhubConnection = (onMessage, onError, onConnect, onDisconnect) => {
  console.log('Creating Finnhub WebSocket connection via ConnectionManager');
  
  return connectionManager.createConnection(
    onMessage,
    onError,
    onConnect,
    onDisconnect
  );
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
