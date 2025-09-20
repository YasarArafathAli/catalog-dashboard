# Bitcoin Dashboard

A real-time Bitcoin price tracking dashboard built with React, Vite, and Recharts. Features hybrid data sourcing with live WebSocket updates and historical data visualization.

## 🚀 Features

### 📊 **Real-Time Price Tracking**
- **Live WebSocket Integration**: Real-time Bitcoin price updates via Finnhub WebSocket
- **Sticky Live Data**: Once live data is received, it persists even through WebSocket disconnections
- **Automatic Fallback**: Graceful fallback to historical data when WebSocket fails
- **Price Change Indicators**: Real-time price change calculations with percentage display

### 📈 **Interactive Charting**
- **Recharts LineChart**: Smooth, responsive Bitcoin price visualization
- **Dynamic Y-Axis Scaling**: Automatically adjusts to data range for optimal viewing
- **Multiple Time Ranges**: 1D, 3D, 1W, 1M, 6M, 1Y, and MAX ranges
- **Fullscreen Mode**: Toggle chart to fullscreen with keyboard shortcuts (ESC to exit)
- **Orange Theme**: Consistent #ff6b35 color scheme throughout the interface

### 🔄 **Hybrid Data Sources**
- **Polygon.io REST API**: Historical Bitcoin data with intelligent interval selection
- **Finnhub WebSocket**: Live price streaming with automatic reconnection
- **Smart Data Prioritization**: Live data takes precedence over historical data
- **Error Handling**: User-friendly error messages with retry functionality

### 🎨 **Modern UI/UX**
- **Inverted Color Scheme**: Dark gradient header with light content areas
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Loading States**: Smooth transitions with appropriate loading indicators
- **Status Indicators**: Clear visual feedback for data source and connection status

### 📱 **Dashboard Components**

#### **Header Section**
- **Bitcoin Logo & Title**: Prominent branding with Bitcoin symbol
- **Current Price Display**: Large, easy-to-read price with USD currency
- **Price Change**: Color-coded change indicators (green/red)
- **Live Indicator**: Real-time status with last updated timestamp
- **Data Source Status**: Shows whether data is live, cached, or historical

#### **Chart Tab**
- **Interactive Line Chart**: Hover tooltips and responsive design
- **Time Range Selector**: Quick access to different time periods
- **Data Source Indicator**: Shows current data source (Live/Historic/Stale)
- **Fullscreen Toggle**: Maximize chart for detailed analysis

#### **Summary Tab**
- **Data Statistics**: Number of data points, time range, current price
- **Connection Status**: Live, cached, or ready status indicators
- **Data Source Info**: Real-time, cached, or historical data source
- **Price Change Metrics**: Today's price change with percentage

### 🛠 **Technical Features**

#### **State Management**
- **Persistent Live Data**: Stores last successful live price for continuity
- **Smart Caching**: Maintains live data even during WebSocket disconnections
- **Error Recovery**: Automatic retry mechanism with exponential backoff
- **Memory Optimization**: Efficient data handling and cleanup

#### **API Integration**
- **Polygon.io**: Historical data with dynamic time intervals
- **Finnhub WebSocket**: Real-time price streaming
- **Environment Variables**: Secure API key management
- **Rate Limiting**: Handles API limits gracefully with user-friendly messages

#### **Error Handling**
- **Graceful Degradation**: Shows sample data when APIs are unavailable
- **User-Friendly Messages**: Clear error descriptions instead of technical jargon
- **Retry Mechanisms**: Automatic and manual retry options
- **Fallback Data**: Placeholder data ensures chart never appears empty

### 🎯 **Data Flow**

1. **Initial Load**: Historical data loads first for immediate display
2. **Live Connection**: WebSocket connects automatically in background
3. **Data Prioritization**: Live data overrides historical data when available
4. **Persistence**: Live data is stored and maintained through disconnections
5. **Fallback**: Only uses historical data if live data never connects

### 🔧 **Configuration**

#### **Environment Variables**
```env
VITE_POLYGON_API_KEY=your_polygon_api_key_here
VITE_FINNHUB_API_KEY=your_finnhub_api_key_here
```

#### **Dependencies**
- React 18+ with Hooks
- Vite for fast development
- Recharts for data visualization
- Ant Design for UI components
- SCSS for styling

### 📦 **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd catalog-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### 🚀 **Usage**

1. **Open the dashboard** in your browser
2. **View historical data** immediately on load
3. **Wait for live updates** to connect automatically
4. **Switch time ranges** using the chart controls
5. **Toggle fullscreen** for detailed analysis
6. **Monitor status** in the Summary tab

### 🎨 **Customization**

- **Colors**: Modify SCSS variables for different themes
- **Time Ranges**: Add new ranges in the chart component
- **Data Sources**: Integrate additional APIs in the service layer
- **UI Components**: Customize Ant Design components as needed

### 🔍 **Debugging**

- **Console Logs**: Detailed logging for data flow and API calls
- **Network Tab**: Monitor WebSocket connections and API requests
- **Status Indicators**: Visual feedback for connection and data states

### 📈 **Performance**

- **Memoized Components**: Optimized re-rendering with React.memo
- **Efficient Data Handling**: Minimal data processing and storage
- **Smart Updates**: Only updates when necessary to prevent unnecessary re-renders
- **Memory Management**: Proper cleanup of WebSocket connections

---

**Built by yasar Arafath with ❤️ using React, Vite, and Recharts**