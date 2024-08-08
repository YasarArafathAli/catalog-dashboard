import { useState } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  Area,
  ResponsiveContainer,
} from 'recharts';
// import CustomTooltip from './CustomTooltip';
const data = [
  { name: 'Day 1', value: 12000 },
  { name: 'Day 2', value: 33000 },
  { name: 'Day 3', value: 34500 },
  { name: 'Day 4', value: 34200 },
  { name: 'Day 5', value: 43500 },
  { name: 'Day 6', value: 34000 },
  { name: 'Day 7', value: 33179.71 },
  { name: 'Day 8', value: 33179.71 },
  { name: 'Day 9', value: 33179.71 },
  { name: 'Day 10', value: 43179.71 },
  { name: 'Day 11', value: 42000 },
  { name: 'Day 12', value: 43000 },
  { name: 'Day 13', value: 44500 },
  { name: 'Day 14', value: 44200 },
  { name: 'Day 15', value: 43500 },
  { name: 'Day 16', value: 44000 },
  { name: 'Day 17', value: 43179.71 },
  { name: 'Day 18', value: 53179.71 },
  { name: 'Day 19', value: 53179.71 },
  { name: 'Day 20', value: 53179.71 },
  { name: 'Day 21', value: 52000 },
  { name: 'Day 22', value: 73000 },
  { name: 'Day 23', value: 64500 },
  { name: 'Day 24', value: 56200 },
  { name: 'Day 25', value: 59500 },
  { name: 'Day 26', value: 64000 },
  { name: 'Day 27', value: 63179.71 },
  { name: 'Day 28', value: 63179.71 },
  { name: 'Day 29', value: 63179.71 },
  { name: 'Day 20', value: 63179.71 },
];

const LineGraph = () => {
  const [isFullscreen, setIsFullscreen] = useState(false); // Manage fullscreen state

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  return (
    <div style={{ textAlign: 'center' }}>
      <button
        onClick={toggleFullscreen}
        style={{ marginBottom: '10px', zIndex: 2000 }}
      >
        {isFullscreen ? 'Exit Fullscreen' : 'Go Fullscreen'}
      </button>
      <div
        style={{
          position: isFullscreen ? 'fixed' : 'relative',
          top: isFullscreen ? 0 : 'auto',
          left: isFullscreen ? 0 : 'auto',
          width: isFullscreen ? '100vw' : '100%',
          height: isFullscreen ? '100vh' : '400px',
          backgroundColor: isFullscreen ? '#fff' : 'transparent',
          zIndex: isFullscreen ? 1000 : 'auto',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill="#8884d8"
              fillOpacity={0.3}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LineGraph;
