/**
 * Polygon.io REST API service for Bitcoin historic data
 */

const POLYGON_BASE_URL = 'https://api.polygon.io/v2/aggs/ticker/X:BTCUSD/range/1/day';

/**
 * Fetch historic Bitcoin data from Polygon.io
 * @param {string} range - '1M' for 1 month, '1Y' for 1 year
 * @returns {Promise<Array>} Array of {time, price} objects
 */
export const fetchHistoricData = async (range) => {
  try {
    const apiKey = import.meta.env.VITE_POLYGON_API_KEY;
    
    if (!apiKey || apiKey === 'your_polygon_api_key_here') {
      throw new Error('Polygon API key not configured. Please set VITE_POLYGON_API_KEY in .env file');
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    if (range === '1M') {
      startDate.setDate(endDate.getDate() - 30);
    } else if (range === '1Y') {
      startDate.setDate(endDate.getDate() - 365);
    } else {
      throw new Error('Invalid range. Use "1M" or "1Y"');
    }

    // Format dates as YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split('T')[0];
    const start = formatDate(startDate);
    const end = formatDate(endDate);

    const url = `${POLYGON_BASE_URL}/${start}/${end}?apiKey=${apiKey}`;
    
    console.log('Fetching historic data from:', url);
    
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
      
      return {
        time: timestamp.toLocaleDateString(),
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
