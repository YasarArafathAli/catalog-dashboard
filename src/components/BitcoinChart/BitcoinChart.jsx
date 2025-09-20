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
 */
const BitcoinChart = ({ 
  chartData = [], 
  loading = false, 
  error = null, 
  selectedRange = '1D',
  onRangeChange = () => {},
  isLiveMode = true
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiveData, setIsLiveData] = useState(isLiveMode);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleDataSource = () => {
    setIsLiveData(!isLiveData);
    // Trigger data source change
    if (isLiveData) {
      onRangeChange('1M'); // Switch to historic data
    } else {
      onRangeChange('1D'); // Switch to live data
    }
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

  if (error) {
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
        <p>No data available</p>
      </div>
    );
  }

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
          <div className={`data-source-indicator ${isLiveData ? 'live' : 'historic'}`}>
            <span className="data-source-dot"></span>
            {isLiveData ? 'Live Data (Finnhub)' : 'Historic Data (Polygon)'}
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
              type={isLiveData ? 'primary' : 'link'}
              onClick={toggleDataSource}
            >
              <PlusCircleOutlined />
              {isLiveData ? 'Live Data' : 'Historic Data'}
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
            >
              1D
            </Button>
            <Button
              type={selectedRange === '3D' ? 'primary' : 'link'}
              onClick={handleTimeClick('3D')}
            >
              3D
            </Button>
            <Button
              type={selectedRange === '1W' ? 'primary' : 'link'}
              onClick={handleTimeClick('1W')}
            >
              1W
            </Button>
            <Button
              type={selectedRange === '1M' ? 'primary' : 'link'}
              onClick={handleTimeClick('1M')}
            >
              1M
            </Button>
            <Button
              type={selectedRange === '6M' ? 'primary' : 'link'}
              onClick={handleTimeClick('6M')}
            >
              6M
            </Button>
            <Button
              type={selectedRange === '1Y' ? 'primary' : 'link'}
              onClick={handleTimeClick('1Y')}
            >
              1Y
            </Button>
            <Button
              type={selectedRange === 'MAX' ? 'primary' : 'link'}
              onClick={handleTimeClick('MAX')}
            >
              Max
            </Button>
          </div>
        </div>
        
        {loading ? (
          <Spin />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 30, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid horizontal vertical stroke="#ccc" />
              <Tooltip
                className="tooltip--content"
                content={<CustomTooltip />}
                cursor={{ strokeDasharray: '3 3' }}
                allowEscapeViewBox={{ x: true, y: true }}
              />
              <XAxis dataKey="time" tick={false} axisLine={false} />
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
        )}
      </div>
    </div>
  );
};

export default BitcoinChart;
