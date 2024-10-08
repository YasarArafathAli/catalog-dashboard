import React from 'react';
import './dashboard.scss';

import { Tabs } from 'antd';
import LineGraph from '../components/LineGraph/LineGraph';
import SkeletonPlaceHolder from '../components/Skeleton';
const onChange = (key) => {
  console.log(key);
};

const items = [
  {
    key: '1',
    label: 'Summary',
    children: <SkeletonPlaceHolder />,
  },
  {
    key: '2',
    label: 'Chart',
    children: (
      <>
        <LineGraph />
      </>
    ),
  },
  {
    key: '3',
    label: 'Statistics',
    children: <SkeletonPlaceHolder />,
  },
  {
    key: '4',
    label: 'Analytics',
    children: <SkeletonPlaceHolder />,
  },
  {
    key: '5',
    label: 'Settings',
    children: <SkeletonPlaceHolder />,
  },
];

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <header>
        <h1 className="current-price">
          63,179.71
          <span>USD</span>
        </h1>
        <p>+ 2,161.42 (3.54%)</p>
      </header>
      <div className="tabs">
        <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
      </div>
    </div>
  );
};

export default Dashboard;
