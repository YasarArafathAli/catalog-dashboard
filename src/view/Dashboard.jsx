import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './dashboard.scss';

import { Tabs, Button, Alert, Spin } from 'antd';
import BitcoinChart from '../components/BitcoinChart/BitcoinChart';
import ThemeToggle from '../components/ThemeToggle/ThemeToggle';
import { fetchHistoricData } from '../service/PolygonAPI';
import { createFinnhubConnection } from '../service/FinnhubWebSocket';
import { getPlaceholderData } from '../data/placeholderData';
import { throttle } from '../utils/debounce';
import { useTheme } from '../contexts/ThemeContext';

const onChange = (key) => {
  console.log(key);
};

const Dashboard = () => {
  const { isDarkMode } = useTheme();
  
  // Bitcoin data state
  const [chartData, setChartData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('1D');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isStaleData, setIsStaleData] = useState(false);
  const [livePrice, setLivePrice] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [hasReceivedLiveData, setHasReceivedLiveData] = useState(false);
  const [storedLivePrice, setStoredLivePrice] = useState(null); // Store the last successful live price
  const wsConnectionRef = useRef(null);
  const lastPriceRef = useRef(null); // Track last price to prevent unnecessary updates

  // Load initial historic data on mount and start live updates
  useEffect(() => {
    const initializeDashboard = async () => {
      // First load historic data
      await fetchHistoricDataForRange('1D');
      // Then start live updates
      startLiveData();
    };
    
    initializeDashboard();
  }, []);

  // Cleanup WebSocket connection on unmount
  useEffect(() => {
    return () => {
      if (wsConnectionRef.current) {
        wsConnectionRef.current.unsubscribe();
        wsConnectionRef.current.close();
        wsConnectionRef.current = null;
      }
    };
  }, []);

  // Handle range selection
  const handleRangeChange = async (range) => {
    setSelectedRange(range);
    setError(null);
    
    // Don't close WebSocket connection for range changes
    // Keep live data flowing while showing historic chart data
    
    // Always use historic data for range changes - no loading state
    await fetchHistoricDataForRange(range);
  };


  // Start live data stream
  const startLiveData = () => {
    // Prevent multiple simultaneous connections
    if (wsConnectionRef.current && wsConnectionRef.current.isConnecting()) {
      console.log('WebSocket connection already in progress, skipping');
      return;
    }

    setError(null);
    setIsLiveConnected(false);
    setLivePrice(null); // Clear any previous live price
    
    const onMessage = (priceData) => {
      // Only update if price has actually changed significantly
      if (lastPriceRef.current !== null) {
        const priceDifference = Math.abs(priceData.price - lastPriceRef.current);
        const priceChangePercent = (priceDifference / lastPriceRef.current) * 100;
        
        // Skip update if price change is less than 0.01% (noise threshold)
        if (priceChangePercent < 0.01) {
          return;
        }
      }
      
      console.log('Live data received:', priceData);
      setError(null);
      setIsLiveConnected(true);
      setHasReceivedLiveData(true); // Mark that we've received live data
      
      // Update last price to track changes
      lastPriceRef.current = priceData.price;
      
      // Set live price for display, don't modify chart data
      setLivePrice(priceData);
      // Store the live price so we can keep showing it even if WebSocket disconnects
      setStoredLivePrice(priceData);
    };

    // Throttle the onMessage handler to prevent excessive updates
    const throttledOnMessage = throttle(onMessage, 100); // Max 10 updates per second
    
    const onError = (error) => {
      console.error('WebSocket error:', error);
      setIsLiveConnected(false);
      // Don't clear hasReceivedLiveData - we want to keep showing stored price
      // The ConnectionManager handles retries automatically
    };

    const onConnect = () => {
      console.log('WebSocket connected successfully');
      setIsLiveConnected(true);
      setError(null);
    };

    const onDisconnect = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setIsLiveConnected(false);
      // Keep stored live data, don't clear hasReceivedLiveData
    };
    
    try {
      wsConnectionRef.current = createFinnhubConnection(throttledOnMessage, onError, onConnect, onDisconnect);
      
      if (!wsConnectionRef.current) {
        console.error('Failed to create WebSocket connection');
        setError('Failed to create WebSocket connection');
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setError('Failed to create WebSocket connection');
    }
  };


  // Fetch historic data
  const fetchHistoricDataForRange = async (range) => {
    setError(null);
    setIsStaleData(false); // Reset stale data state
    
    try {
      console.log(`Fetching historic data for range: ${range}`);
      
      // All ranges are now supported by the improved Polygon API
      const apiRange = range;
      
      const data = await fetchHistoricData(apiRange);
      console.log('Historic data received:', data);
      
      if (!data || data.length === 0) {
        setError('No historic data available for the selected range');
        setChartData([]);
      } else {
        console.log('Setting chart data:', data.length, 'points');
        setChartData(data);
        setIsStaleData(false); // Real data, not stale
      }
    } catch (err) {
      console.error('Error fetching historic data:', err);
      
      // Show placeholder data instead of empty chart
      console.log('Using placeholder data due to API error');
      const placeholderData = getPlaceholderData();
      console.log('Setting placeholder data:', placeholderData.length, 'points');
      setChartData(placeholderData);
      setIsStaleData(true); // Mark as stale data
      
      // Provide user-friendly error messages based on error type
      let errorMessage = 'Using sample data - API temporarily unavailable';
      
      if (err.message.includes('429')) {
        errorMessage = 'API limit exceeded. Showing sample data. Please try again later.';
      } else if (err.message.includes('401') || err.message.includes('403')) {
        errorMessage = 'API key issue. Showing sample data. Please check your API configuration.';
      } else if (err.message.includes('404')) {
        errorMessage = 'API endpoint not found. Showing sample data.';
      } else if (err.message.includes('500') || err.message.includes('502') || err.message.includes('503')) {
        errorMessage = 'API is unreachable. Showing sample data. Please try again later.';
      } else if (err.message.includes('NetworkError') || err.message.includes('fetch')) {
        errorMessage = 'Network error. Showing sample data. Please check your internet connection.';
      } else if (err.message.includes('API key not configured')) {
        errorMessage = 'API key not configured. Showing sample data. Please set up your API keys.';
      } else {
        errorMessage = `API is unreachable. Showing sample data. ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      // Cleanup completed
    }
  };


  const getCurrentPrice = useCallback(() => {
    // First priority: Current live price if WebSocket is connected
    if (isLiveConnected && livePrice && livePrice.price) {
      return livePrice.price;
    }
    
    // Second priority: Stored live price if we've ever received live data
    if (hasReceivedLiveData && storedLivePrice && storedLivePrice.price) {
      return storedLivePrice.price;
    }
    
    // Only fallback to historic data if we never received live data
    if (chartData.length === 0) {
      return null;
    }
    
    return chartData[chartData.length - 1].price;
  }, [isLiveConnected, livePrice, hasReceivedLiveData, storedLivePrice, chartData]);

  const getPriceChange = useCallback(() => {
    // Use live price if available, otherwise use historic data
    const current = getCurrentPrice();
    if (!current || chartData.length < 2) return null;
    
    const previous = chartData[chartData.length - 2].price;
    const change = current - previous;
    const changePercent = (change / previous) * 100;
    return { change, changePercent };
  }, [getCurrentPrice, chartData]);

  const currentPrice = useMemo(() => getCurrentPrice(), [getCurrentPrice]);
  const priceChange = useMemo(() => getPriceChange(), [getPriceChange]);

  // Create dynamic items for tabs
  const items = [
    {
      key: '1',
      label: 'Chart',
      children: (
        <div className="chart-section">
          <BitcoinChart
            chartData={chartData}
            loading={loading}
            error={error}
            selectedRange={selectedRange}
            onRangeChange={handleRangeChange}
            isLiveConnected={isLiveConnected}
            isStaleData={isStaleData}
          />
        </div>
      ),
    },
    {
      key: '2',
      label: 'Summary',
      children: (
        <div className="summary-content">
          <div className="summary-stats">
            <div className="stat-card">
              <h4>Data Points</h4>
              <p>{chartData.length}</p>
            </div>
            <div className="stat-card">
              <h4>Data Source</h4>
              <p>
                {isLiveConnected && livePrice && livePrice.price ? 'Live WebSocket (Real-time)' : 
                 hasReceivedLiveData && storedLivePrice && storedLivePrice.price ? 'Live WebSocket (Cached)' : 
                 'Historic API (Polygon)'}
              </p>
            </div>
            <div className="stat-card">
              <h4>Time Range</h4>
              <p>{selectedRange}</p>
            </div>
            <div className="stat-card">
              <h4>Current Price</h4>
              <p>{currentPrice ? `$${currentPrice.toFixed(2)}` : 'N/A'}</p>
            </div>
            <div className="stat-card">
              <h4>Status</h4>
              <p>
                {loading ? 'Loading...' : 
                 (isLiveConnected && livePrice && livePrice.price) ? 'Live' : 
                 (hasReceivedLiveData && storedLivePrice && storedLivePrice.price) ? 'Cached Live' : 
                 'Ready'}
              </p>
            </div>
            <div className="stat-card">
              <h4>Price Change Today</h4>
              <p>
                {priceChange ? 
                  `${priceChange.change >= 0 ? '+' : ''}${priceChange.change.toFixed(2)} (${priceChange.changePercent >= 0 ? '+' : ''}${priceChange.changePercent.toFixed(2)}%)` : 
                  'N/A'
                }
              </p>
            </div>
          </div>
          
          {error && (
            <Alert
              message={error.includes('retrying') ? "Connection Issue" : "Error"}
              description={
                <div>
                  <p>{error}</p>
                  {(error.includes('retrying') || error.includes('API') || error.includes('unreachable')) && (
                    <Button 
                      size="small" 
                      type="primary" 
                      onClick={() => {
                        setError(null);
                        if (error.includes('retrying')) {
                          startLiveData();
                        } else {
                          fetchHistoricDataForRange(selectedRange); // Show switching state
                        }
                      }}
                      style={{ marginTop: 8 }}
                    >
                      {error.includes('retrying') ? 'Retry Live Data' : 'Retry Historic Data'}
                    </Button>
                  )}
                </div>
              }
              type={error.includes('retrying') ? "warning" : "error"}
              showIcon
              closable
              onClose={() => setError(null)}
              style={{ marginTop: 20 }}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={`dashboard-container ${isDarkMode ? 'dark' : 'light'}`}>
      <header className="dashboard-header">
        <div className="header-top">
          <ThemeToggle />
        </div>
        <div className="bitcoin-header">
          <div className="bitcoin-logo">
            <div className="bitcoin-icon">₿</div>
            <h2>Bitcoin Dashboard</h2>
          </div>
          <p>Real-time & Historical Price Analysis</p>
        </div>
        <div className="price-info">
          <div className="current-price-display">
            <h3>Current Price</h3>
            <div className="price-value">
              {currentPrice ? `$${currentPrice.toFixed(2)}` : 'Loading...'}
              <span className="currency">USD</span>
            </div>
            {priceChange && (
              <div className={`price-change ${priceChange.change >= 0 ? 'positive' : 'negative'}`}>
                {priceChange.change >= 0 ? '+' : ''}{priceChange.change.toFixed(2)} 
                ({priceChange.changePercent >= 0 ? '+' : ''}{priceChange.changePercent.toFixed(2)}%)
              </div>
            )}
            <div className="live-indicator">
              <span className="live-dot"></span>
              <div className="indicator-content">
                <div className="indicator-label">
                Last Updated:
                </div>
                <div className="indicator-time">
                  <span className="time-value">
                    {useMemo(() => {
                      // Get the time to display
                      let timeToShow;
                      
                      // First try current live price
                      if (isLiveConnected && livePrice && livePrice.time) {
                        const liveTime = new Date(livePrice.time);
                        if (!isNaN(liveTime.getTime())) {
                          timeToShow = liveTime;
                        } else {
                          timeToShow = new Date();
                        }
                      }
                      // Then try stored live price
                      else if (hasReceivedLiveData && storedLivePrice && storedLivePrice.time) {
                        const storedTime = new Date(storedLivePrice.time);
                        if (!isNaN(storedTime.getTime())) {
                          timeToShow = storedTime;
                        } else {
                          timeToShow = new Date();
                        }
                      }
                      // Fallback to current time
                      else {
                        timeToShow = new Date();
                      }
                      
                      return timeToShow.toLocaleTimeString('en-US', {
                        hour12: true,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      });
                    }, [isLiveConnected, livePrice, hasReceivedLiveData, storedLivePrice])}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* <div className="range-info">
            <h4>Current Range</h4>
            <div className="range-display">
              <span className="current-range">{selectedRange}</span>
              <span className="data-source">
                {isLiveConnected ? 'Live Data (Real-time)' : 'Historic Data (Polygon)'}
              </span>
            </div>
          </div> */}
        </div>
      </header>
      <div className="tabs">
        <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
      </div>
      
      <footer className="dashboard-footer">
        <p>Built by <strong>Yasar Arafath</strong> using React, Recharts, Polygon API and Finnhub WebSocket</p>
      </footer>
    </div>
  );
};

export default Dashboard;
