import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import StockService from '../../service/Stock';
import { Spin, Button } from 'antd';
import './graph.scss';
import {
  ExpandAltOutlined,
  ShrinkOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import CustomTooltip from '../Tooltip/CustomTooltip';

const LineGraph = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [days, setDays] = useState(30);
  const { stockData, fetchStockData } = StockService();
  // const [hoveredValue, setHoveredValue] = useState();
  useEffect(() => {
    fetchStockData(days);
  }, [days]);
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleTimeClick = (days) => () => {
    setDays(days);
  };

  // todo: set Graph placeholder in a fixed axis position
  // const handleMouseMove = (state) => {
  //   if (state.isTooltipActive) {
  //     const { chartX, chartY } = state;
  //     const lastEntry = stockData[stockData.length - 1];
  //     setHoveredValue(state.activePayload[0].payload.value);
  //     const xPosition = chartX;
  //     const yPosition = chartY;
  //   } else {
  //     setHoveredValue(null);
  //   }
  // };

  //   if (state.isTooltipActive) {
  //     const { activeTooltipIndex, chartX, chartY } = state;
  //     const lastEntry = stockData[stockData.length - 1];
  //     const xPosition = chartX;
  //     const yPosition = chartY;
  //     setHoveredValue(state.activePayload[0].payload.value);

  //     console.log(chartX, chartY);
  //     setTooltipData({
  //       active: true,
  //       payload: [{ value: lastEntry.uv }],
  //       label: lastEntry.name,
  //       x: xPosition,
  //       y: yPosition,
  //     });
  //   } else {
  //     setHoveredValue(null);
  //   }
  // };
  return (
    <div className="line-graph" style={{ textAlign: 'center' }}>
      <div
        className={`graph-container ${
          isFullscreen ? 'graph-container--fullscreen' : ''
        }`}
      >
        <span className="current-value">{stockData?.at(-1)['n']}</span>

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
            <Button type="link">
              <PlusCircleOutlined />
              Compare
            </Button>
          </div>
          <div className="toolbar--right">
            <Button
              type={days === 1 ? 'primary' : 'link'}
              onClick={handleTimeClick(1)}
            >
              1d
            </Button>
            <Button
              type={days === 3 ? 'primary' : 'link'}
              onClick={handleTimeClick(3)}
            >
              3d
            </Button>
            <Button
              type={days === 7 ? 'primary' : 'link'}
              onClick={handleTimeClick(7)}
            >
              1W
            </Button>
            <Button
              type={days === 30 ? 'primary' : 'link'}
              onClick={handleTimeClick(30)}
            >
              1M
            </Button>
            <Button
              type={days === 182 ? 'primary' : 'link'}
              onClick={handleTimeClick(182)}
            >
              6M
            </Button>
            <Button
              type={days === 365 ? 'primary' : 'link'}
              onClick={handleTimeClick(365)}
            >
              1Y
            </Button>
            <Button
              type={days === 1000 ? 'primary' : 'link'}
              onClick={handleTimeClick(1000)}
            >
              Max
            </Button>
          </div>
        </div>
        {!stockData ? (
          <Spin />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={stockData}
              margin={{ top: 30, right: 0, left: 0, bottom: 0 }}
              // onMouseMove={handleMouseMove}
              // onMouseLeave={() => setTooltipData({ ...tooltipData })}
            >
              <CartesianGrid horizontal vertical stroke="#ccc" />
              <Tooltip
                className="tooltip--content"
                content={<CustomTooltip />}
                cursor={{ strokeDasharray: '3 3' }}
                // coordinate={{ x: 21, y: 50 }}
                allowEscapeViewBox={{ x: true, y: true }}
              />

              {/* <Tooltip  
                content={<CustomTooltip {...tooltipData} />}
                position={{ x: 100, y: 100 }}
                allowEscapeViewBox={{ x: true, y: true }}
              /> */}
              <XAxis dataKey="t" tick={false} axisLine={false} />
              {/* <YAxis /> */}
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
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default LineGraph;
