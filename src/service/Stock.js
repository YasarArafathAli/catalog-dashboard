import { useState } from 'react';
import axios from 'axios';
import { today, getDateXDaysAgo } from '../utils.js';
function StockService() {
  const [stockData, setStockData] = useState();

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
        setStockData(res?.data?.results);
      });
  };

  return {
    stockData,
    fetchStockData,
  };
}

export default StockService;
