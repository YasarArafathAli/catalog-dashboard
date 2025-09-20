import React, { useState, useEffect, useRef } from 'react';
import './dashboard.scss';

import { Tabs, Button, Alert, Spin } from 'antd';
import LineGraph from '../components/LineGraph/LineGraph';
import BitcoinChart from '../components/BitcoinChart/BitcoinChart';
import SkeletonPlaceHolder from '../components/Skeleton';
import { fetchHistoricData } from '../service/PolygonAPI';
import { createFinnhubConnection } from '../service/FinnhubWebSocket';

const onChange = (key) => {
  console.log(key);
};

const Dashboard = () => {
  // Bitcoin data state
  const [chartData, setChartData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('1D');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isSwitchingAPI, setIsSwitchingAPI] = useState(false);
  
  const wsConnectionRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Load initial historic data on mount
  useEffect(() => {
    fetchHistoricDataForRange('1D');
  }, []);

  // Cleanup WebSocket connection on unmount
  useEffect(() => {
    return () => {
      if (wsConnectionRef.current) {
        wsConnectionRef.current.unsubscribe();
        wsConnectionRef.current.close();
      }
    };
  }, []);

  // Handle range selection
  const handleRangeChange = async (range) => {
    setSelectedRange(range);
    setError(null);
    
    // Close existing WebSocket connection
    if (wsConnectionRef.current) {
      wsConnectionRef.current.unsubscribe();
      wsConnectionRef.current.close();
      wsConnectionRef.current = null;
    }
    
    // Always use historic data for range changes - no loading state
    await fetchHistoricDataForRange(range);
  };

  // Handle live data toggle
  const handleLiveDataToggle = () => {
    if (isLiveMode) {
      // Switch to historic data
      setSelectedRange('1D');
      fetchHistoricDataForRange('1D', true); // Show switching state
    } else {
      // Switch to live data
      startLiveData();
    }
  };

  // Start live data stream
  const startLiveData = () => {
    setIsLiveMode(true);
    setLoading(true);
    setChartData([]);
    setError(null);
    setIsSwitchingAPI(false);
    
    const onMessage = (priceData) => {
      setLoading(false);
      setError(null);
      retryCountRef.current = 0; // Reset retry count on successful connection
      // Just update the current price without aggregating data
      setChartData([priceData]);
    };
    
    const onError = (error) => {
      console.error('WebSocket error:', error);
      
      // Check if we should retry
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`WebSocket connection failed, retrying... (${retryCountRef.current}/${maxRetries})`);
        
        setError(`Connection failed, retrying... (${retryCountRef.current}/${maxRetries})`);
        
        // Retry after a delay
        setTimeout(() => {
          startLiveData();
        }, 2000 * retryCountRef.current); // Exponential backoff
      } else {
        console.log('Max retries reached, falling back to historic data');
        
        // Provide user-friendly error message for WebSocket failures
        let wsErrorMessage = 'Live data connection failed';
        if (error.message.includes('connection timeout')) {
          wsErrorMessage = 'Live data service is unreachable at the moment. Switching to historic data...';
        } else if (error.message.includes('WebSocket connection failed')) {
          wsErrorMessage = 'Live data service is temporarily unavailable. Switching to historic data...';
        } else if (error.message.includes('Failed to establish')) {
          wsErrorMessage = 'Unable to connect to live data service. Switching to historic data...';
        } else {
          wsErrorMessage = `Live data service is unreachable at the moment. ${error.message}. Switching to historic data...`;
        }
        
        setError(wsErrorMessage);
        setLoading(true);
        setIsSwitchingAPI(true);
        
        // Reset retry count
        retryCountRef.current = 0;
        
        // Fallback to historic data
        setTimeout(() => {
          console.log('Falling back to historic data due to WebSocket failure');
          fetchHistoricDataForRange('1D', true); // Show switching state
        }, 1000);
      }
    };
    
    try {
      wsConnectionRef.current = createFinnhubConnection(onMessage, onError);
      
      // Add a timeout to detect if WebSocket never connects
      const connectionTimeout = setTimeout(() => {
        if (wsConnectionRef.current && wsConnectionRef.current.ws.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timeout, falling back to historic data');
          onError(new Error('Connection timeout'));
        }
      }, 10000); // 10 second timeout
      
      // Clear timeout if connection succeeds
      if (wsConnectionRef.current && wsConnectionRef.current.ws.readyState === WebSocket.OPEN) {
        clearTimeout(connectionTimeout);
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      onError(error);
    }
  };

  // Fetch historic data
  const fetchHistoricDataForRange = async (range, showSwitchingState = false) => {
    setIsLiveMode(false);
    setError(null);
    
    if (showSwitchingState) {
      setIsSwitchingAPI(true);
    }
    
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
        setChartData(data);
      }
    } catch (err) {
      console.error('Error fetching historic data:', err);
      
      // Provide user-friendly error messages based on error type
      let errorMessage = 'Failed to load historic data';
      
      if (err.message.includes('429')) {
        errorMessage = 'API limit exceeded. Please try again later or check your API key limits.';
      } else if (err.message.includes('401') || err.message.includes('403')) {
        errorMessage = 'API key is invalid or expired. Please check your API configuration.';
      } else if (err.message.includes('404')) {
        errorMessage = 'API endpoint not found. The service may be temporarily unavailable.';
      } else if (err.message.includes('500') || err.message.includes('502') || err.message.includes('503')) {
        errorMessage = 'API is unreachable at the moment. Please try again later.';
      } else if (err.message.includes('NetworkError') || err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.message.includes('API key not configured')) {
        errorMessage = 'API key not configured. Please set up your API keys in the environment file.';
      } else {
        errorMessage = `API is unreachable at the moment. ${err.message}`;
      }
      
      setError(errorMessage);
      setChartData([]);
    } finally {
      if (showSwitchingState) {
        setIsSwitchingAPI(false);
      }
    }
  };

  // Initialize with 1D live data
  useEffect(() => {
    handleRangeChange('1D');
  }, []);

  const getCurrentPrice = () => {
    if (chartData.length === 0) return null;
    return chartData[chartData.length - 1].price;
  };

  const getPriceChange = () => {
    if (chartData.length < 2) return null;
    const current = chartData[chartData.length - 1].price;
    const previous = chartData[chartData.length - 2].price;
    const change = current - previous;
    const changePercent = (change / previous) * 100;
    return { change, changePercent };
  };

  const currentPrice = getCurrentPrice();
  const priceChange = getPriceChange();

  // Create dynamic items for tabs
  const items = [
    {
      key: '1',
      label: 'Chart',
      children: (
        <div className="chart-section">
          <BitcoinChart
            chartData={chartData}
            loading={loading || isSwitchingAPI}
            error={error}
            selectedRange={selectedRange}
            onRangeChange={handleRangeChange}
            onLiveDataToggle={handleLiveDataToggle}
            isLiveMode={isLiveMode}
            isSwitchingAPI={isSwitchingAPI}
          />
        </div>
      ),
    },
    {
      key: '2',
      label: 'Summary',
      children: (
        <div className="summary-content">
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
              {isLiveMode && (
                <div className="live-indicator">
                  <span className="live-dot"></span>
                  Live Updates
                </div>
              )}
            </div>
            
            <div className="range-info">
              <h4>Current Range</h4>
              <div className="range-display">
                <span className="current-range">{selectedRange}</span>
                <span className="data-source">
                  {isLiveMode ? 'Live Data (Real-time)' : 'Historic Data (Polygon)'}
                </span>
              </div>
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
                        retryCountRef.current = 0;
                        setError(null);
                        if (error.includes('retrying')) {
                          startLiveData();
                        } else {
                          fetchHistoricDataForRange(selectedRange, true); // Show switching state
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
    
    {
      key: '3',
      label: 'Statistics',
      children: (
        <div className="statistics-content">
          <h3>Bitcoin Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Data Points</h4>
              <p>{chartData.length}</p>
            </div>
            <div className="stat-card">
              <h4>Data Source</h4>
              <p>{isLiveMode ? 'Live WebSocket (Real-time)' : 'Historic API (Polygon)'}</p>
            </div>
            <div className="stat-card">
              <h4>Time Range</h4>
              <p>{selectedRange}</p>
            </div>
            <div className="stat-card">
              <h4>Status</h4>
              <p>{loading ? 'Loading...' : 'Ready'}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: '4',
      label: 'Analytics',
      children: <SkeletonPlaceHolder />,
    },
    {
      key: '5',
      label: 'Settings',
      children: <SkeletonPlaceHolder />,
    },
  ];

  return (
    <div className="dashboard-container">
      <header>
        <h1 className="current-price">
          {currentPrice ? currentPrice.toFixed(2) : '63,179.71'}
          <span>USD</span>
        </h1>
        <p className={priceChange ? (priceChange.change >= 0 ? 'positive' : 'negative') : ''}>
          {priceChange ? 
            `${priceChange.change >= 0 ? '+' : ''}${priceChange.change.toFixed(2)} (${priceChange.changePercent >= 0 ? '+' : ''}${priceChange.changePercent.toFixed(2)}%)` : 
            '+ 2,161.42 (3.54%)'
          }
        </p>
      </header>
      <div className="tabs">
        <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
      </div>
    </div>
  );
};

export default Dashboard;
