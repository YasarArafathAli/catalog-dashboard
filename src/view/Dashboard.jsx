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
  
  const wsConnectionRef = useRef(null);
  const maxLiveDataPoints = 50;

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
    
    if (range === '1D') {
      // Use live WebSocket data for 1D
      startLiveData();
    } else {
      // Use historic data for 1M and 1Y
      await fetchHistoricDataForRange(range);
    }
  };

  // Start live data stream
  const startLiveData = () => {
    setIsLiveMode(true);
    setLoading(true);
    setChartData([]);
    
    const onMessage = (priceData) => {
      setLoading(false);
      setChartData(prevData => {
        const newData = [...prevData, priceData];
        // Keep only last 50 points for performance
        return newData.slice(-maxLiveDataPoints);
      });
    };
    
    const onError = (error) => {
      console.error('WebSocket error:', error);
      setError(`Live data error: ${error.message}`);
      setLoading(false);
    };
    
    wsConnectionRef.current = createFinnhubConnection(onMessage, onError);
  };

  // Fetch historic data
  const fetchHistoricDataForRange = async (range) => {
    setIsLiveMode(false);
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching historic data for range: ${range}`);
      const data = await fetchHistoricData(range);
      console.log('Historic data received:', data);
      
      if (!data || data.length === 0) {
        setError('No historic data available for the selected range');
        setChartData([]);
      } else {
        setChartData(data);
      }
    } catch (err) {
      console.error('Error fetching historic data:', err);
      setError(`Failed to load historic data: ${err.message}`);
      setChartData([]);
    } finally {
      setLoading(false);
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
            loading={loading}
            error={error}
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
            
            <div className="range-selector">
              <h4>Time Range</h4>
              <div className="range-buttons">
                <Button
                  type={selectedRange === '1D' ? 'primary' : 'default'}
                  onClick={() => handleRangeChange('1D')}
                  disabled={loading}
                >
                  1D
                </Button>
                <Button
                  type={selectedRange === '1M' ? 'primary' : 'default'}
                  onClick={() => handleRangeChange('1M')}
                  disabled={loading}
                >
                  1M
                </Button>
                <Button
                  type={selectedRange === '1Y' ? 'primary' : 'default'}
                  onClick={() => handleRangeChange('1Y')}
                  disabled={loading}
                >
                  1Y
                </Button>
              </div>
            </div>
          </div>
          
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
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
              <p>{isLiveMode ? 'Live WebSocket' : 'Historic API'}</p>
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
