import React, { useState, useEffect, useRef } from 'react';
import './dashboard.scss';

import { Tabs, Button, Alert, Spin } from 'antd';
import LineGraph from '../components/LineGraph/LineGraph';
import BitcoinChart from '../components/BitcoinChart/BitcoinChart';
import SkeletonPlaceHolder from '../components/Skeleton';
import { fetchHistoricData } from '../service/PolygonAPI';
import { createFinnhubConnection } from '../service/FinnhubWebSocket';

const onChange = (key) => {
  console.log(key);
};

const Dashboard = () => {
  // Bitcoin data state
  const [chartData, setChartData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('1D');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isSwitchingAPI, setIsSwitchingAPI] = useState(false);
  const [isStaleData, setIsStaleData] = useState(false);
  const [livePrice, setLivePrice] = useState(null);
  
  const wsConnectionRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Load initial historic data on mount
  useEffect(() => {
    fetchHistoricDataForRange('1D');
  }, []);

  // Cleanup WebSocket connection on unmount
  useEffect(() => {
    return () => {
      if (wsConnectionRef.current) {
        wsConnectionRef.current.unsubscribe();
        wsConnectionRef.current.close();
      }
    };
  }, []);

  // Handle range selection
  const handleRangeChange = async (range) => {
    setSelectedRange(range);
    setError(null);
    
    // Close existing WebSocket connection
    if (wsConnectionRef.current) {
      wsConnectionRef.current.unsubscribe();
      wsConnectionRef.current.close();
      wsConnectionRef.current = null;
    }
    
    // Always use historic data for range changes - no loading state
    await fetchHistoricDataForRange(range);
  };

  // Handle live data toggle
  const handleLiveDataToggle = () => {
    if (isLiveMode) {
      // Switch to historic data
      setSelectedRange('1D');
      setLivePrice(null); // Clear live price
      fetchHistoricDataForRange('1D', true); // Show switching state
    } else {
      // Switch to live data
      startLiveData();
    }
  };

  // Start live data stream
  const startLiveData = () => {
    setIsLiveMode(true);
    setLoading(true);
    setChartData([]); // Clear chart data for live mode
    setLivePrice(null); // Clear previous live price
    setError(null);
    setIsSwitchingAPI(false);
    
    const onMessage = (priceData) => {
      setLoading(false);
      setError(null);
      retryCountRef.current = 0; // Reset retry count on successful connection
      // Set live price for display, don't modify chart data
      setLivePrice(priceData);
    };
    
    const onError = (error) => {
      console.error('WebSocket error:', error);
      
      // Check if we should retry
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`WebSocket connection failed, retrying... (${retryCountRef.current}/${maxRetries})`);
        
        setError(`Connection failed, retrying... (${retryCountRef.current}/${maxRetries})`);
        
        // Retry after a delay
        setTimeout(() => {
          startLiveData();
        }, 2000 * retryCountRef.current); // Exponential backoff
      } else {
        console.log('Max retries reached, falling back to historic data');
        
        // Provide user-friendly error message for WebSocket failures
        let wsErrorMessage = 'Live data connection failed';
        if (error.message.includes('connection timeout')) {
          wsErrorMessage = 'Live data service is unreachable at the moment. Switching to historic data...';
        } else if (error.message.includes('WebSocket connection failed')) {
          wsErrorMessage = 'Live data service is temporarily unavailable. Switching to historic data...';
        } else if (error.message.includes('Failed to establish')) {
          wsErrorMessage = 'Unable to connect to live data service. Switching to historic data...';
        } else {
          wsErrorMessage = `Live data service is unreachable at the moment. ${error.message}. Switching to historic data...`;
        }
        
        setError(wsErrorMessage);
        setLoading(true);
        setIsSwitchingAPI(true);
        
        // Reset retry count
        retryCountRef.current = 0;
        
        // Fallback to historic data
        setTimeout(() => {
          console.log('Falling back to historic data due to WebSocket failure');
          fetchHistoricDataForRange('1D', true); // Show switching state
        }, 1000);
      }
    };
    
    try {
      wsConnectionRef.current = createFinnhubConnection(onMessage, onError);
      
      // Add a timeout to detect if WebSocket never connects
      const connectionTimeout = setTimeout(() => {
        if (wsConnectionRef.current && wsConnectionRef.current.ws.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timeout, falling back to historic data');
          onError(new Error('Connection timeout'));
        }
      }, 10000); // 10 second timeout
      
      // Clear timeout if connection succeeds
      if (wsConnectionRef.current && wsConnectionRef.current.ws.readyState === WebSocket.OPEN) {
        clearTimeout(connectionTimeout);
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      onError(error);
    }
  };

  // Placeholder data for when API is unreachable
  const getPlaceholderData = () => {
    const placeholderResponse = {
      "ticker": "X:BTCUSD",
      "queryCount": 1440,
      "resultsCount": 48,
      "adjusted": true,
      "results": [
        {
          "v": 126.51341306999998,
          "vw": 117239.7045,
          "o": 117117.99,
          "c": 117269.84,
          "h": 117380.77,
          "l": 117068.14,
          "t": 1758240000000,
          "n": 6905
        },
        {
          "v": 117.11708633000002,
          "vw": 117423.2154,
          "o": 117271.24,
          "c": 117478.01,
          "h": 117486.07,
          "l": 117259.84,
          "t": 1758241800000,
          "n": 7383
        },
        {
          "v": 90.23828437000003,
          "vw": 117417.2981,
          "o": 117478.01,
          "c": 117387.9,
          "h": 117516.36,
          "l": 117262.4,
          "t": 1758243600000,
          "n": 6886
        },
        {
          "v": 111.0771906,
          "vw": 117261.2177,
          "o": 117387.9,
          "c": 117288,
          "h": 117440.58,
          "l": 117165.27,
          "t": 1758245400000,
          "n": 6044
        },
        {
          "v": 104.18180333999993,
          "vw": 117227.601,
          "o": 117287.99,
          "c": 117163.52,
          "h": 117345.98,
          "l": 117094.63,
          "t": 1758247200000,
          "n": 5487
        },
        {
          "v": 58.13657824,
          "vw": 117197.6999,
          "o": 117163.52,
          "c": 117167.62,
          "h": 117284,
          "l": 117100.12,
          "t": 1758249000000,
          "n": 4976
        },
        {
          "v": 51.99291141999999,
          "vw": 117251.2834,
          "o": 117167.62,
          "c": 117145.52,
          "h": 117350,
          "l": 117121.12,
          "t": 1758250800000,
          "n": 4764
        },
        {
          "v": 110.11307237999998,
          "vw": 117013.7075,
          "o": 117147.95,
          "c": 117028.5,
          "h": 117180,
          "l": 116924.01,
          "t": 1758252600000,
          "n": 6382
        },
        {
          "v": 111.83042199000003,
          "vw": 116891.5438,
          "o": 117028.5,
          "c": 117049.35,
          "h": 117100,
          "l": 116748.01,
          "t": 1758254400000,
          "n": 6478
        },
        {
          "v": 59.155843529999984,
          "vw": 117066.9843,
          "o": 117049.34,
          "c": 117035.85,
          "h": 117160,
          "l": 116980.17,
          "t": 1758256200000,
          "n": 4345
        },
        {
          "v": 55.83735036,
          "vw": 117001.8233,
          "o": 117035.84,
          "c": 116910.98,
          "h": 117080,
          "l": 116881.77,
          "t": 1758258000000,
          "n": 4629
        },
        {
          "v": 49.33842134999998,
          "vw": 116933.1158,
          "o": 116910.98,
          "c": 116940.59,
          "h": 117000,
          "l": 116847.39,
          "t": 1758259800000,
          "n": 4194
        },
        {
          "v": 61.018152560000004,
          "vw": 116853.7773,
          "o": 116940.59,
          "c": 116844.13,
          "h": 116950,
          "l": 116808,
          "t": 1758261600000,
          "n": 4935
        },
        {
          "v": 97.75751865999999,
          "vw": 116780.2793,
          "o": 116844.14,
          "c": 116724.79,
          "h": 116880,
          "l": 116684.78,
          "t": 1758263400000,
          "n": 5599
        },
        {
          "v": 83.45411191999997,
          "vw": 116845.8136,
          "o": 116724.8,
          "c": 116916.8,
          "h": 116944.52,
          "l": 116724.79,
          "t": 1758265200000,
          "n": 5000
        },
        {
          "v": 211.99885600000005,
          "vw": 116991.1095,
          "o": 116916.77,
          "c": 116958.41,
          "h": 117049.89,
          "l": 116878.83,
          "t": 1758267000000,
          "n": 8284
        },
        {
          "v": 83.51392013,
          "vw": 117060.8101,
          "o": 116959.99,
          "c": 117142.75,
          "h": 117160,
          "l": 116932.04,
          "t": 1758268800000,
          "n": 5530
        },
        {
          "v": 67.60403837999999,
          "vw": 117018.5163,
          "o": 117142.75,
          "c": 116984.01,
          "h": 117142.76,
          "l": 116964.02,
          "t": 1758270600000,
          "n": 4561
        },
        {
          "v": 106.17785083999999,
          "vw": 116967.6403,
          "o": 116984.01,
          "c": 116882.02,
          "h": 117053.49,
          "l": 116835.75,
          "t": 1758272400000,
          "n": 5356
        },
        {
          "v": 158.29298525,
          "vw": 116676.6893,
          "o": 116882.02,
          "c": 116528.43,
          "h": 116954,
          "l": 116523.01,
          "t": 1758274200000,
          "n": 7987
        },
        {
          "v": 124.50299069999996,
          "vw": 116524.4504,
          "o": 116528.43,
          "c": 116536.97,
          "h": 116620,
          "l": 116478.46,
          "t": 1758276000000,
          "n": 5286
        },
        {
          "v": 119.88200687999998,
          "vw": 116535.2793,
          "o": 116536.96,
          "c": 116582.42,
          "h": 116613.22,
          "l": 116500,
          "t": 1758277800000,
          "n": 4962
        },
        {
          "v": 149.2991563899999,
          "vw": 116479.112,
          "o": 116580,
          "c": 116414.03,
          "h": 116610,
          "l": 116377.69,
          "t": 1758279600000,
          "n": 7253
        },
        {
          "v": 92.16558675000003,
          "vw": 116403.6416,
          "o": 116414.02,
          "c": 116433.58,
          "h": 116510,
          "l": 116331.15,
          "t": 1758281400000,
          "n": 11804
        },
        {
          "v": 152.63161154000005,
          "vw": 116391.0406,
          "o": 116433.58,
          "c": 116269.78,
          "h": 116580.95,
          "l": 116226.85,
          "t": 1758283200000,
          "n": 7309
        },
        {
          "v": 177.00327387000004,
          "vw": 116240.4058,
          "o": 116261.4,
          "c": 116207,
          "h": 116338.47,
          "l": 116162.52,
          "t": 1758285000000,
          "n": 13258
        },
        {
          "v": 114.89059622999994,
          "vw": 116203.3912,
          "o": 116207,
          "c": 116252.05,
          "h": 116395.53,
          "l": 116100.01,
          "t": 1758286800000,
          "n": 16076
        },
        {
          "v": 165.94929104,
          "vw": 116350.1992,
          "o": 116252.05,
          "c": 116338.66,
          "h": 116522.76,
          "l": 116137.63,
          "t": 1758288600000,
          "n": 17502
        },
        {
          "v": 153.81154886000002,
          "vw": 116371.4021,
          "o": 116338.66,
          "c": 116313.71,
          "h": 116534.58,
          "l": 116260.92,
          "t": 1758290400000,
          "n": 17636
        },
        {
          "v": 244.88862058999982,
          "vw": 116050.5365,
          "o": 116313.7,
          "c": 115949.36,
          "h": 116401.4,
          "l": 115830,
          "t": 1758292200000,
          "n": 14619
        },
        {
          "v": 248.77344173999987,
          "vw": 115672.7983,
          "o": 115949.36,
          "c": 115845.26,
          "h": 115949.37,
          "l": 115491.43,
          "t": 1758294000000,
          "n": 22983
        },
        {
          "v": 199.0120269799999,
          "vw": 115848.5806,
          "o": 115845.25,
          "c": 115936.02,
          "h": 116010,
          "l": 115677.87,
          "t": 1758295800000,
          "n": 12532
        },
        {
          "v": 179.28525960000013,
          "vw": 116000.4846,
          "o": 115936.01,
          "c": 116018.96,
          "h": 116090.47,
          "l": 115842,
          "t": 1758297600000,
          "n": 11924
        },
        {
          "v": 99.38102552999999,
          "vw": 116078.4512,
          "o": 116018.96,
          "c": 116146.49,
          "h": 116211.99,
          "l": 115892,
          "t": 1758299400000,
          "n": 15310
        },
        {
          "v": 135.7427679299999,
          "vw": 115949.3409,
          "o": 116146.99,
          "c": 115834.05,
          "h": 116160,
          "l": 115755.99,
          "t": 1758301200000,
          "n": 13115
        },
        {
          "v": 284.59100659999996,
          "vw": 115794.394,
          "o": 115834.05,
          "c": 115880,
          "h": 115920,
          "l": 115567.33,
          "t": 1758303000000,
          "n": 9995
        },
        {
          "v": 171.40188912999992,
          "vw": 115660.3842,
          "o": 115582,
          "c": 115457,
          "h": 115880,
          "l": 115431.77,
          "t": 1758304800000,
          "n": 9418
        },
        {
          "v": 107.59373041999999,
          "vw": 115514.9803,
          "o": 115457.01,
          "c": 115460.86,
          "h": 115830,
          "l": 115416.3,
          "t": 1758306600000,
          "n": 8835
        },
        {
          "v": 596.6591707999997,
          "vw": 115413.9244,
          "o": 115462.46,
          "c": 115385.11,
          "h": 115680,
          "l": 115308,
          "t": 1758308400000,
          "n": 24707
        },
        {
          "v": 454.52108014999993,
          "vw": 115292.6055,
          "o": 115389.97,
          "c": 115166,
          "h": 115630,
          "l": 115141.23,
          "t": 1758310200000,
          "n": 23896
        },
        {
          "v": 141.96780131,
          "vw": 115333.6832,
          "o": 115165.99,
          "c": 115441.7,
          "h": 115650,
          "l": 115132.71,
          "t": 1758312000000,
          "n": 8916
        },
        {
          "v": 111.57082329000005,
          "vw": 115408.1402,
          "o": 115441.7,
          "c": 115393.55,
          "h": 115670,
          "l": 115323.92,
          "t": 1758313800000,
          "n": 8517
        },
        {
          "v": 63.06485321000001,
          "vw": 115443.8555,
          "o": 115393.54,
          "c": 115484,
          "h": 115680,
          "l": 115355.1,
          "t": 1758315600000,
          "n": 10050
        },
        {
          "v": 57.47616225999999,
          "vw": 115535.1353,
          "o": 115483.99,
          "c": 115524.17,
          "h": 115760,
          "l": 115480.89,
          "t": 1758317400000,
          "n": 9381
        },
        {
          "v": 50.70115276999999,
          "vw": 115620.9372,
          "o": 115524.17,
          "c": 115645.48,
          "h": 115840,
          "l": 115524.17,
          "t": 1758319200000,
          "n": 9473
        },
        {
          "v": 54.07593931999999,
          "vw": 115676.671,
          "o": 115645.48,
          "c": 115663.26,
          "h": 115880,
          "l": 115628.44,
          "t": 1758321000000,
          "n": 5134
        },
        {
          "v": 57.8832298,
          "vw": 115591.2874,
          "o": 115663.26,
          "c": 115513.46,
          "h": 115860,
          "l": 115504.89,
          "t": 1758322800000,
          "n": 5922
        },
        {
          "v": 55.78543653000002,
          "vw": 115610.7639,
          "o": 115513.46,
          "c": 115690.55,
          "h": 115830,
          "l": 115504.89,
          "t": 1758324600000,
          "n": 5436
        }
      ],
      "status": "DELAYED",
      "request_id": "270f0e429955372cdd3f707a1323c7fe",
      "count": 48
    };

    // Transform the placeholder data to match our chart format
    return placeholderResponse.results.map(result => {
      const timestamp = new Date(result.t);
      return {
        time: timestamp.toLocaleString(),
        price: result.c || result.close || result.price || 0
      };
    });
  };

  // Fetch historic data
  const fetchHistoricDataForRange = async (range, showSwitchingState = false) => {
    setIsLiveMode(false);
    setError(null);
    setIsStaleData(false); // Reset stale data state
    
    if (showSwitchingState) {
      setIsSwitchingAPI(true);
    }
    
    try {
      console.log(`Fetching historic data for range: ${range}`);
      
      // All ranges are now supported by the improved Polygon API
      const apiRange = range;
      
      const data = await fetchHistoricData(apiRange);
      console.log('Historic data received:', data);
      
      if (!data || data.length === 0) {
        setError('No historic data available for the selected range');
        setChartData([]);
      } else {
        setChartData(data);
        setIsStaleData(false); // Real data, not stale
      }
    } catch (err) {
      console.error('Error fetching historic data:', err);
      
      // Show placeholder data instead of empty chart
      console.log('Using placeholder data due to API error');
      const placeholderData = getPlaceholderData();
      setChartData(placeholderData);
      setIsStaleData(true); // Mark as stale data
      
      // Provide user-friendly error messages based on error type
      let errorMessage = 'Using sample data - API temporarily unavailable';
      
      if (err.message.includes('429')) {
        errorMessage = 'API limit exceeded. Showing sample data. Please try again later.';
      } else if (err.message.includes('401') || err.message.includes('403')) {
        errorMessage = 'API key issue. Showing sample data. Please check your API configuration.';
      } else if (err.message.includes('404')) {
        errorMessage = 'API endpoint not found. Showing sample data.';
      } else if (err.message.includes('500') || err.message.includes('502') || err.message.includes('503')) {
        errorMessage = 'API is unreachable. Showing sample data. Please try again later.';
      } else if (err.message.includes('NetworkError') || err.message.includes('fetch')) {
        errorMessage = 'Network error. Showing sample data. Please check your internet connection.';
      } else if (err.message.includes('API key not configured')) {
        errorMessage = 'API key not configured. Showing sample data. Please set up your API keys.';
      } else {
        errorMessage = `API is unreachable. Showing sample data. ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      if (showSwitchingState) {
        setIsSwitchingAPI(false);
      }
    }
  };

  // Initialize with 1D live data
  useEffect(() => {
    handleRangeChange('1D');
  }, []);

  const getCurrentPrice = () => {
    if (isLiveMode && livePrice) {
      return livePrice.price;
    }
    if (chartData.length === 0) return null;
    return chartData[chartData.length - 1].price;
  };

  const getPriceChange = () => {
    if (chartData.length < 2) return null;
    const current = chartData[chartData.length - 1].price;
    const previous = chartData[chartData.length - 2].price;
    const change = current - previous;
    const changePercent = (change / previous) * 100;
    return { change, changePercent };
  };

  const currentPrice = getCurrentPrice();
  const priceChange = getPriceChange();

  // Create dynamic items for tabs
  const items = [
    {
      key: '1',
      label: 'Chart',
      children: (
        <div className="chart-section">
          <BitcoinChart
            chartData={chartData}
            loading={loading || isSwitchingAPI}
            error={error}
            selectedRange={selectedRange}
            onRangeChange={handleRangeChange}
            onLiveDataToggle={handleLiveDataToggle}
            isLiveMode={isLiveMode}
            isSwitchingAPI={isSwitchingAPI}
            isStaleData={isStaleData}
            livePrice={livePrice}
          />
        </div>
      ),
    },
    {
      key: '2',
      label: 'Summary',
      children: (
        <div className="summary-content">
          <div className="bitcoin-header">
            <div className="bitcoin-logo">
              <div className="bitcoin-icon">₿</div>
              <h2>Bitcoin Dashboard</h2>
            </div>
            <p>Real-time & Historical Price Analysis</p>
          </div>
          
          <div className="price-info">
            <div className="current-price-display">
              <h3>Current Price</h3>
              <div className="price-value">
                {currentPrice ? `$${currentPrice.toFixed(2)}` : 'Loading...'}
                <span className="currency">USD</span>
              </div>
              {priceChange && (
                <div className={`price-change ${priceChange.change >= 0 ? 'positive' : 'negative'}`}>
                  {priceChange.change >= 0 ? '+' : ''}{priceChange.change.toFixed(2)} 
                  ({priceChange.changePercent >= 0 ? '+' : ''}{priceChange.changePercent.toFixed(2)}%)
                </div>
              )}
              {isLiveMode && (
                <div className="live-indicator">
                  <span className="live-dot"></span>
                  Live Updates
                </div>
              )}
            </div>
            
            <div className="range-info">
              <h4>Current Range</h4>
              <div className="range-display">
                <span className="current-range">{selectedRange}</span>
                <span className="data-source">
                  {isLiveMode ? 'Live Data (Real-time)' : 'Historic Data (Polygon)'}
                </span>
              </div>
            </div>
          </div>
          
          {error && (
            <Alert
              message={error.includes('retrying') ? "Connection Issue" : "Error"}
              description={
                <div>
                  <p>{error}</p>
                  {(error.includes('retrying') || error.includes('API') || error.includes('unreachable')) && (
                    <Button 
                      size="small" 
                      type="primary" 
                      onClick={() => {
                        retryCountRef.current = 0;
                        setError(null);
                        if (error.includes('retrying')) {
                          startLiveData();
                        } else {
                          fetchHistoricDataForRange(selectedRange, true); // Show switching state
                        }
                      }}
                      style={{ marginTop: 8 }}
                    >
                      {error.includes('retrying') ? 'Retry Live Data' : 'Retry Historic Data'}
                    </Button>
                  )}
                </div>
              }
              type={error.includes('retrying') ? "warning" : "error"}
              showIcon
              closable
              onClose={() => setError(null)}
              style={{ marginTop: 20 }}
            />
          )}
        </div>
      ),
    },
    
    {
      key: '3',
      label: 'Statistics',
      children: (
        <div className="statistics-content">
          <h3>Bitcoin Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Data Points</h4>
              <p>{chartData.length}</p>
            </div>
            <div className="stat-card">
              <h4>Data Source</h4>
              <p>{isLiveMode ? 'Live WebSocket (Real-time)' : 'Historic API (Polygon)'}</p>
            </div>
            <div className="stat-card">
              <h4>Time Range</h4>
              <p>{selectedRange}</p>
            </div>
            <div className="stat-card">
              <h4>Status</h4>
              <p>{loading ? 'Loading...' : 'Ready'}</p>
            </div>
          </div>
        </div>
      ),
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

  return (
    <div className="dashboard-container">
      <header>
        <h1 className="current-price">
          {currentPrice ? currentPrice.toFixed(2) : '63,179.71'}
          <span>USD</span>
        </h1>
        <p className={priceChange ? (priceChange.change >= 0 ? 'positive' : 'negative') : ''}>
          {priceChange ? 
            `${priceChange.change >= 0 ? '+' : ''}${priceChange.change.toFixed(2)} (${priceChange.changePercent >= 0 ? '+' : ''}${priceChange.changePercent.toFixed(2)}%)` : 
            '+ 2,161.42 (3.54%)'
          }
        </p>
      </header>
      <div className="tabs">
        <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
      </div>
    </div>
  );
};

export default Dashboard;
