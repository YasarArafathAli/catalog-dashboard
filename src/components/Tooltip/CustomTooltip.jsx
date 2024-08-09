import React from 'react';
import './tooltip.scss';
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const hoveredValue = payload[0].value;
    return <span className="hovered-value">{hoveredValue}</span>;
  }

  return null;
};
export default CustomTooltip;
