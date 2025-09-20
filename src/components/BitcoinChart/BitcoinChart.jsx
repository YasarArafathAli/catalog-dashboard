import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Spin } from 'antd';
import './bitcoin-chart.scss';

/**
 * BitcoinChart component for displaying Bitcoin price data
 * @param {Object} props
 * @param {Array} props.chartData - Array of {time, price} objects
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 */
const BitcoinChart = ({ chartData = [], loading = false, error = null }) => {
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
    <div className="bitcoin-chart">
      <div className="chart-header">
        <h3>Bitcoin Price Chart</h3>
        <div className="current-price">
          {chartData.length > 0 && (
            <span className="price">
              ${chartData[chartData.length - 1].price?.toFixed(2)}
            </span>
          )}
        </div>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              stroke="#666"
              fontSize={12}
              tick={{ fill: '#666' }}
            />
            <YAxis 
              dataKey="price" 
              stroke="#666"
              fontSize={12}
              tick={{ fill: '#666' }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#f7931a"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#f7931a' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BitcoinChart;
