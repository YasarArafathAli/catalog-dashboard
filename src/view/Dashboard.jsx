import React from 'react';
import './dashboard.scss';

import { Tabs } from 'antd';
import LineGraph from '../components/LineGraph';
const onChange = (key) => {
  console.log(key);
};

const items = [
  // {
  //   key: '1',
  //   label: 'Summary',
  //   children: 'Content of Tab Pane 1',
  // },
  {
    key: '2',
    label: 'Chart',
    children: (
      <>
        {' '}
        <LineGraph />
      </>
    ),
  },
  {
    key: '3',
    label: 'Statistics',
    children: 'Content of Tab Pane 3',
  },
  {
    key: '4',
    label: 'Analytics',
    children: 'Content of Tab Pane 4',
  },
  {
    key: '5',
    label: 'Settings',
    children: 'Content of Tab Pane 5',
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
