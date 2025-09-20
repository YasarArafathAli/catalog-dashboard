/**
 * Polygon.io REST API service for Bitcoin historic data
 */

/**
 * Get date X days ago
 * @param {number} days - Number of days ago
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
const getDateXDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

/**
 * Get today's date
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Convert range string to days
 * @param {string} range - Range string (1D, 3D, 1W, 1M, 6M, 1Y, MAX)
 * @returns {number} Number of days
 */
const getDaysFromRange = (range) => {
  switch (range) {
    case '1D': return 1;
    case '3D': return 3;
    case '1W': return 7;
    case '1M': return 30;
    case '6M': return 180;
    case '1Y': return 365;
    case 'MAX': return 365;
    default: return 30; // Default to 1 month
  }
};

/**
 * Fetch historic Bitcoin data from Polygon.io
 * @param {string} range - '1D', '3D', '1W', '1M', '6M', '1Y', 'MAX'
 * @returns {Promise<Array>} Array of {time, price} objects
 */
export const fetchHistoricData = async (range) => {
  try {
    const apiKey = import.meta.env.VITE_POLYGON_API_KEY;
    
    if (!apiKey || apiKey === 'your_polygon_api_key_here') {
      throw new Error('Polygon API key not configured. Please set VITE_POLYGON_API_KEY in .env file');
    }

    const days = getDaysFromRange(range);
    const today = getToday();
    const startDate = getDateXDaysAgo(days);
    
    // Determine interval and multiplier based on days
    const interval = days > 7 ? 1 : days === 7 ? 180 : 30;
    const timespan = days > 7 ? 'day' : 'minute';
    
    const url = `https://api.polygon.io/v2/aggs/ticker/X:BTCUSD/range/${interval}/${timespan}/${startDate}/${today}?adjusted=true&sort=asc&apikey=${apiKey}`;
    
    console.log(`Fetching ${range} (${days} days) historic data from:`, url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Debug: Log the full response to see the structure
    console.log('Polygon API Response:', data);
    
    // Check for different possible error indicators
    if (data.status === 'ERROR' || data.error) {
      throw new Error(`API error: ${data.message || data.error || 'Unknown error'}`);
    }
    
    // Check if we have results (successful response)
    if (!data.results) {
      throw new Error('No results found in API response');
    }
    
    // Check if results have data
    if (data.results.length === 0) {
      console.warn('No results found in Polygon API response');
      return [];
    }
    
    // Debug: Log first result to see the structure
    console.log('First result structure:', data.results[0]);
    
    // Transform results to array of {time, price}
    const transformedData = data.results.map(result => {
      // Handle different possible timestamp formats
      let timestamp;
      if (result.t) {
        // Polygon uses milliseconds timestamp
        timestamp = new Date(result.t);
      } else if (result.timestamp) {
        timestamp = new Date(result.timestamp);
      } else {
        console.warn('No timestamp found in result:', result);
        timestamp = new Date();
      }
      
      // Format time based on the timespan
      let timeString;
      if (timespan === 'minute') {
        // For minute data, show time with date
        timeString = timestamp.toLocaleString();
      } else {
        // For daily data, show just the date
        timeString = timestamp.toLocaleDateString();
      }
      
      return {
        time: timeString,
        price: result.c || result.close || result.price || 0 // try different price field names
      };
    });
    
    console.log(`Fetched ${transformedData.length} historic data points`);
    console.log('Sample transformed data:', transformedData.slice(0, 3));
    return transformedData;
    
  } catch (error) {
    console.error('Error fetching historic data:', error);
    throw error;
  }
};
