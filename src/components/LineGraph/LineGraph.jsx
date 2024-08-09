import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  Area,
  ResponsiveContainer,
} from 'recharts';
import StockService from '../../service/Stock';
import { Spin, Button } from 'antd';
import './graph.scss';

// import CustomTooltip from './CustomTooltip';
const data = [
  { name: 'Day 1', n: 12000 },
  { name: 'Day 2', n: 33000 },
  { name: 'Day 3', n: 34500 },
  { name: 'Day 4', n: 34200 },
  { name: 'Day 5', n: 43500 },
  { name: 'Day 6', n: 34000 },
  { name: 'Day 7', n: 33179.71 },
  { name: 'Day 8', n: 33179.71 },
  { name: 'Day 9', n: 33179.71 },
  { name: 'Day 10', n: 43179.71 },
  { name: 'Day 11', n: 42000 },
  { name: 'Day 12', n: 43000 },
  { name: 'Day 13', n: 44500 },
  { name: 'Day 14', n: 44200 },
  { name: 'Day 15', n: 43500 },
  { name: 'Day 16', n: 44000 },
  { name: 'Day 17', n: 43179.71 },
  { name: 'Day 18', n: 53179.71 },
  { name: 'Day 19', n: 53179.71 },
  { name: 'Day 20', n: 53179.71 },
  { name: 'Day 21', n: 52000 },
  { name: 'Day 22', n: 73000 },
  { name: 'Day 23', n: 64500 },
  { name: 'Day 24', n: 56200 },
  { name: 'Day 25', n: 59500 },
  { name: 'Day 26', n: 64000 },
  { name: 'Day 27', n: 63179.71 },
  { name: 'Day 28', n: 63179.71 },
  { name: 'Day 29', n: 63179.71 },
  { name: 'Day 20', n: 63179.71 },
];

const LineGraph = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [days, setDays] = useState(30);
  const { stockData, fetchStockData } = StockService();

  useEffect(() => {
    fetchStockData(days);
  }, [days]);
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleTimeClick = (days) => () => {
    setDays(days);
  };
  return  (
    <div className="" style={{ textAlign: 'center' }}>
      <div
        className={`graph-container ${
          isFullscreen ? 'graph-container--fullscreen' : ''
        }`}
      >
        <div className="toolbar">
          <div className="toolbar--left">
            <Button onClick={toggleFullscreen}>
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
            <Button>Compare</Button>
          </div>
          <div className="toolbar--right">
            <Button onClick={handleTimeClick(1)}>1d</Button>
            <Button onClick={handleTimeClick(3)}>3d</Button>
            <Button onClick={handleTimeClick(7)}>1W</Button>
            <Button onClick={handleTimeClick(30)}>1M</Button>
            <Button onClick={handleTimeClick(182)}>6M</Button>
            <Button onClick={handleTimeClick(365)}>1Y</Button>
            <Button onClick={handleTimeClick(1000)}>Max</Button>
          </div>
        </div>
       { !stockData ? (
    <Spin />
  ) :
       ( <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={stockData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Area
              type="linearClosed"
              dataKey="n"
              stroke="none"
              fill="#8884d8"
              fillOpacity={0.3}
            />
            <Line
              type="monotone"
              dataKey="n"
              stroke="#8884d8"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>)}
      </div>
    </div>
  );
};

export default LineGraph;
