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

