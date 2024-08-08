import React from 'react';
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const currentValue = data[data.length - 1].value; // Get the current value (last in the dataset)
    const hoveredValue = payload[0].value; // Get the hovered value

    return (
      <div
        className="custom-tooltip"
        style={{
          backgroundColor: '#fff',
          padding: '10px',
          border: '1px solid #ccc',
        }}
      >
        <p>
          <strong>Current Value: </strong>
          {currentValue}
        </p>
        <p>
          <strong>Hovered Value: </strong>
          {hoveredValue}
        </p>
      </div>
    );
  }

  return null;
};
export default CustomTooltip;
