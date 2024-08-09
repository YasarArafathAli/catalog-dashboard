import { useState } from 'react';
import axios from 'axios';
import { today, getDateXDaysAgo } from '../utils.js';
import { notification } from 'antd';
import Notification from '../components/Notification/index.jsx';
function StockService() {
  const [stockData, setStockData] = useState();
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (placement) => {
    api.info({
      message: `Error`,
      type: 'error',
      description: 'Maximum Limit exceded for the minite',
      placement,
    });
  };
  let headers = {
    Authorization: `Bearer ${process.env.REACT_APP_POLYGON_API_KEY}`,
  };
  const fetchStockData = (days = 30) => {
    const url = `https://api.polygon.io/v2/aggs/ticker/AAPL/range/${
      days > 7 ? 1 : days === 7 ? 180 : 30
    }/${days > 7 ? 'day' : 'minute'}/${getDateXDaysAgo(
      days
    )}/${today}?adjusted=true&sort=asc`;
    axios
      .get(url, {
        headers,
      })
      .then((res) => {
        console.log(res);
        setStockData(res?.data?.results);
      })
      .catch((e) => {
        console.log(e);
        Notification({
          message: e?.response?.data?.error,
          type: 'error',
        });
      });
  };

  return {
    stockData,
    fetchStockData,
  };
}

export default StockService;
