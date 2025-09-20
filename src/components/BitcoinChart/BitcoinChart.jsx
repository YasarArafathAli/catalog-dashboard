import React, { useState, useEffect, useMemo } from 'react';
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
 * @param {boolean} props.isLiveConnected - Whether live data is connected
 * @param {boolean} props.isStaleData - Whether showing stale/sample data
 */
const BitcoinChart = ({ 
  chartData = [], 
  loading = false, 
  error = null, 
  selectedRange = '1D',
  onRangeChange = () => {},
  isLiveConnected = false,
  isStaleData = false
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleTimeClick = (range) => () => {
    onRangeChange(range);
  };

  // Memoize chart data to prevent unnecessary re-renders
  const memoizedChartData = useMemo(() => {
    console.log('Chart data memoized:', chartData.length, 'points');
    return chartData;
  }, [chartData]);


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
        <p>Loading Bitcoin data...</p>
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


  // Calculate dynamic Y-axis domain for better data visualization
  const getYAxisDomain = () => {
    if (memoizedChartData.length === 0) return ['dataMin', 'dataMax'];
    
    const prices = memoizedChartData.map(d => d.price).filter(price => price != null && !isNaN(price));
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
            {memoizedChartData.length > 0 && `$${memoizedChartData[memoizedChartData.length - 1].price?.toFixed(2)}`}
          </span>
          <div className={`data-source-indicator ${isStaleData ? 'stale' : 'historic'}`}>
            <span className="data-source-dot"></span>
            {isStaleData 
              ? 'Stale Data (Sample)'
              : 'Historic Data (Polygon)'
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
              title="1 Day historic data (minute intervals)"
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
            data={memoizedChartData}
            margin={{ top: 30, right: 30, left: 30, bottom: 30 }}
          >
            <CartesianGrid horizontal vertical stroke="#ff6b35" strokeOpacity={0.3} />
            <Tooltip
              className="tooltip--content"
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: '3 3', stroke: '#ff6b35', strokeOpacity: 0.5 }}
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
              tick={{ fontSize: 12, fill: '#ff6b35' }}
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
              stroke="#ff6b35"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: '#ff6b35' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BitcoinChart;
