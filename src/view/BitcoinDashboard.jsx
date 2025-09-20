import React, { useState, useEffect, useRef } from 'react';
import { Button, Alert, Spin } from 'antd';
import BitcoinChart from '../components/BitcoinChart/BitcoinChart';
import { fetchHistoricData } from '../service/PolygonAPI';
import { createFinnhubConnection } from '../service/FinnhubWebSocket';
import './bitcoin-dashboard.scss';

const BitcoinDashboard = () => {
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

  return (
    <div className="bitcoin-dashboard">
      {/* Bitcoin Header */}
      <header className="bitcoin-header">
        <div className="header-content">
          <div className="bitcoin-logo">
            <div className="bitcoin-icon">₿</div>
            <h1 className="bitcoin-title">Bitcoin Dashboard</h1>
          </div>
          <div className="header-subtitle">
            Real-time & Historical Price Analysis
          </div>
        </div>
      </header>

      <header className="dashboard-header">
        <div className="price-section">
          <h1 className="current-price">
            {currentPrice ? `$${currentPrice.toFixed(2)}` : 'Loading...'}
            <span className="currency">USD</span>
          </h1>
          {priceChange && (
            <p className={`price-change ${priceChange.change >= 0 ? 'positive' : 'negative'}`}>
              {priceChange.change >= 0 ? '+' : ''}{priceChange.change.toFixed(2)} 
              ({priceChange.changePercent >= 0 ? '+' : ''}{priceChange.changePercent.toFixed(2)}%)
            </p>
          )}
          {isLiveMode && (
            <div className="live-indicator">
              <span className="live-dot"></span>
              Live
            </div>
          )}
        </div>
        
        <div className="range-selector">
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
      </header>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 20 }}
        />
      )}

      <div className="chart-section">
        <BitcoinChart
          chartData={chartData}
          loading={loading}
          error={error}
        />
      </div>

      <div className="dashboard-info">
        <div className="info-card">
          <h4>Data Source</h4>
          <p>
            {isLiveMode 
              ? 'Live data from Finnhub WebSocket (Binance BTC/USDT)'
              : `Historic data from Polygon.io (${selectedRange} range)`
            }
          </p>
        </div>
        
        <div className="info-card">
          <h4>Data Points</h4>
          <p>{chartData.length} points displayed</p>
        </div>
        
        {isLiveMode && (
          <div className="info-card">
            <h4>Live Updates</h4>
            <p>Real-time price updates every few seconds</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BitcoinDashboard;
