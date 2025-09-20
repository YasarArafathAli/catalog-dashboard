import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Spin, Button } from 'antd';
import {
  ExpandAltOutlined,
  ShrinkOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import './bitcoin-chart.scss';

/**
 * BitcoinChart component for displaying Bitcoin price data
 * @param {Object} props
 * @param {Array} props.chartData - Array of {time, price} objects
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {string} props.selectedRange - Currently selected time range
 * @param {Function} props.onRangeChange - Callback for range changes
 * @param {Function} props.onLiveDataToggle - Callback for live data toggle
 * @param {boolean} props.isLiveMode - Whether live data is active
 * @param {boolean} props.isSwitchingAPI - Whether API is currently switching
 * @param {boolean} props.isStaleData - Whether showing stale/sample data
 * @param {Object} props.livePrice - Live price data object
 */
const BitcoinChart = ({ 
  chartData = [], 
  loading = false, 
  error = null, 
  selectedRange = '1D',
  onRangeChange = () => {},
  onLiveDataToggle = () => {},
  isLiveMode = false,
  isSwitchingAPI = false,
  isStaleData = false,
  livePrice = null
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiveData, setIsLiveData] = useState(isLiveMode);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleDataSource = () => {
    setIsLiveData(!isLiveData);
    // Trigger live data toggle
    onLiveDataToggle();
  };

  const handleTimeClick = (range) => () => {
    onRangeChange(range);
  };

  // Sync internal state with prop
  useEffect(() => {
    setIsLiveData(isLiveMode);
  }, [isLiveMode]);

  // Handle escape key for fullscreen
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when in fullscreen
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  if (error && (!chartData || chartData.length === 0)) {
    return (
      <div className="bitcoin-chart error">
        <div className="error-message">
          <h3>Error loading chart data</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bitcoin-chart loading">
        <Spin size="large" />
        <p>
          {isSwitchingAPI 
            ? 'Switching data source...' 
            : 'Loading Bitcoin data...'
          }
        </p>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bitcoin-chart empty">
        <p>Loading data...</p>
      </div>
    );
  }

  // For live data, show a simplified view with just current price
  if (isLiveMode && livePrice) {
    return (
      <div className="bitcoin-chart" style={{ textAlign: 'center' }}>
        <div
          className={`graph-container ${
            isFullscreen ? 'graph-container--fullscreen' : ''
          }`}
        >
          <div className="chart-header">
            <span className="current-value">
              {livePrice.price ? `$${livePrice.price.toFixed(2)}` : 'Loading...'}
            </span>
            <div className={`data-source-indicator live`}>
              <span className="data-source-dot"></span>
              Live Data (Real-time)
            </div>
          </div>

          <div className="toolbar">
            <div className="toolbar--left">
              <Button type="link" onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <>
                    <ShrinkOutlined />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <ExpandAltOutlined />
                    Fullscreen
                  </>
                )}
              </Button>
              <Button 
                type="primary"
                onClick={toggleDataSource}
              >
                <PlusCircleOutlined />
                Stop Live Data
              </Button>
              {isFullscreen && (
                <Button 
                  type="link" 
                  onClick={() => setIsFullscreen(false)}
                  className="close-fullscreen"
                >
                  ✕ Close
                </Button>
              )}
            </div>
          </div>
          
          <div className="live-price-display">
            <div className="live-price-value">
              ${livePrice.price?.toFixed(2) || '0.00'}
            </div>
            <div className="live-price-time">
              Last updated: {livePrice.time || 'Now'}
            </div>
            <div className="live-indicator">
              <span className="live-dot"></span>
              Live Updates Active
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate dynamic Y-axis domain for better data visualization
  const getYAxisDomain = () => {
    if (chartData.length === 0) return ['dataMin', 'dataMax'];
    
    const prices = chartData.map(d => d.price).filter(price => price != null && !isNaN(price));
    if (prices.length === 0) return ['dataMin', 'dataMax'];
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // If all prices are the same, add some padding
    if (priceRange === 0) {
      const padding = minPrice * 0.1; // 10% of the price
      return [Math.max(0, minPrice - padding), minPrice + padding];
    }
    
    // Add 8% padding above and below the data range for better visualization
    const padding = priceRange * 0.08;
    const domainMin = Math.max(0, minPrice - padding); // Don't go below 0
    const domainMax = maxPrice + padding;
    
    return [domainMin, domainMax];
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-time">{`Time: ${label}`}</p>
          <p className="tooltip-price">{`Price: $${payload[0].value?.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bitcoin-chart" style={{ textAlign: 'center' }}>
      <div
        className={`graph-container ${
          isFullscreen ? 'graph-container--fullscreen' : ''
        }`}
      >
        <div className="chart-header">
          <span className="current-value">
            {chartData.length > 0 && `$${chartData[chartData.length - 1].price?.toFixed(2)}`}
          </span>
          <div className={`data-source-indicator ${isLiveData ? 'live' : isStaleData ? 'stale' : 'historic'} ${isSwitchingAPI ? 'switching' : ''}`}>
            <span className="data-source-dot"></span>
            {isSwitchingAPI 
              ? 'Switching API...' 
              : isStaleData 
                ? 'Stale Data (Sample)'
                : (isLiveData ? 'Live Data (Real-time)' : 'Historic Data (Polygon)')
            }
          </div>
        </div>

        {error && chartData && chartData.length > 0 && (
          <div className="error-banner">
            <div className="error-banner-content">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          </div>
        )}

        <div className="toolbar">
          <div className="toolbar--left">
            <Button type="link" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <>
                  <ShrinkOutlined />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <ExpandAltOutlined />
                  Fullscreen
                </>
              )}
            </Button>
            <Button 
              type={isLiveData ? 'primary' : 'link'}
              onClick={toggleDataSource}
            >
              <PlusCircleOutlined />
              {isLiveData ? 'Stop Live Data' : 'Start Live Data'}
            </Button>
            {isFullscreen && (
              <Button 
                type="link" 
                onClick={() => setIsFullscreen(false)}
                className="close-fullscreen"
              >
                ✕ Close
              </Button>
            )}
          </div>
          <div className="toolbar--right">
            <Button
              type={selectedRange === '1D' ? 'primary' : 'link'}
              onClick={handleTimeClick('1D')}
              disabled={isLiveMode}
              title={isLiveMode ? 'Use Live Data toggle for real-time data' : '1 Day historic data (minute intervals)'}
            >
              1D
            </Button>
            <Button
              type={selectedRange === '3D' ? 'primary' : 'link'}
              onClick={handleTimeClick('3D')}
              title="3 Days historic data (minute intervals)"
            >
              3D
            </Button>
            <Button
              type={selectedRange === '1W' ? 'primary' : 'link'}
              onClick={handleTimeClick('1W')}
              title="1 Week historic data (minute intervals)"
            >
              1W
            </Button>
            <Button
              type={selectedRange === '1M' ? 'primary' : 'link'}
              onClick={handleTimeClick('1M')}
              title="1 Month historic data (daily intervals)"
            >
              1M
            </Button>
            <Button
              type={selectedRange === '6M' ? 'primary' : 'link'}
              onClick={handleTimeClick('6M')}
              title="6 Months historic data (daily intervals)"
            >
              6M
            </Button>
            <Button
              type={selectedRange === '1Y' ? 'primary' : 'link'}
              onClick={handleTimeClick('1Y')}
              title="1 Year historic data (daily intervals)"
            >
              1Y
            </Button>
            <Button
              type={selectedRange === 'MAX' ? 'primary' : 'link'}
              onClick={handleTimeClick('MAX')}
              title="Maximum historic data (daily intervals)"
            >
              Max
            </Button>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 30, right: 30, left: 30, bottom: 30 }}
          >
            <CartesianGrid horizontal vertical stroke="#ccc" />
            <Tooltip
              className="tooltip--content"
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: '3 3' }}
              allowEscapeViewBox={{ x: true, y: true }}
            />
            <XAxis 
              dataKey="time" 
              tick={false} 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={getYAxisDomain()}
              tick={{ fontSize: 12, fill: '#666' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `$${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `$${(value / 1000).toFixed(1)}K`;
                } else {
                  return `$${value.toFixed(0)}`;
                }
              }}
              tickCount={6}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#4B40EE"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: '#4B40EE' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BitcoinChart;
