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

  const wsUrl = `${FINNHUB_WS_URL}?token=${apiKey}`;
  console.log('Connecting to Finnhub WebSocket:', wsUrl);
  
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('Connected to Finnhub WebSocket');
    
    // Subscribe to Bitcoin data
    const subscribeMessage = {
      type: 'subscribe',
      symbol: 'BINANCE:BTCUSDT'
    };
    
    ws.send(JSON.stringify(subscribeMessage));
    console.log('Subscribed to BINANCE:BTCUSDT');
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
            time: new Date().toLocaleTimeString(),
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
    onError(error);
  };
  
  ws.onclose = (event) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
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
    }
  };
};
