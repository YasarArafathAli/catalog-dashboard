# Bitcoin Dashboard

A high-performance real-time Bitcoin price tracking dashboard showcasing advanced React patterns, WebSocket optimization, and hybrid data architecture.

## **Key Features**

### **Real-Time Data Management**
- **Hybrid Data Architecture**: REST API (Polygon.io) for historical data + WebSocket (Finnhub) for live updates
- **Smart Data Prioritization**: Live data overrides historical data with sticky persistence
- **Automatic Fallback**: Graceful degradation to historical data when WebSocket fails
- **Connection Management**: Robust WebSocket lifecycle with exponential backoff retry logic

### **Performance Optimizations**
- **Render Optimization**: Only re-renders when price changes significantly (>0.01% threshold)
- **Throttling**: Max 10 updates/second to prevent excessive re-renders
- **Memoization**: React.memo, useCallback, useMemo for component optimization
- **Memory Management**: Proper cleanup of WebSocket connections and event listeners

### **Interactive Visualization**
- **Dynamic Charting**: Recharts with responsive design and fullscreen mode
- **Multiple Time Ranges**: 1D, 3D, 1W, 1M, 6M, 1Y with intelligent interval selection
- **Real-Time Updates**: Live price streaming with noise filtering
- **Modern UI**: Dark gradient header with light content areas

## **Architecture & Data Flow**

### **Hybrid Data Architecture**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Polygon.io    │    │   Finnhub WS     │    │   Placeholder   │
│   (Historical)  │    │   (Live Data)    │    │   (Fallback)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Dashboard Component                          │
│              (Hybrid Data Management)                          │
└─────────────────────────────────────────────────────────────────┘
```

### **Data Flow Process**
1. **Initial Load**: Historical data loads first for immediate display
2. **Live Connection**: WebSocket connects automatically in background
3. **Data Prioritization**: Live data overrides historical data when available
4. **Persistence**: Live data is stored and maintained through disconnections
5. **Fallback**: Only uses historical data if live data never connects

### **Performance Optimization Strategy**
- **Price Change Detection**: Only updates when price changes >0.01%
- **Throttling**: Limits updates to 10 per second maximum
- **Component Memoization**: Prevents unnecessary re-renders
- **Memory Leak Prevention**: Proper cleanup of WebSocket connections
- **Smart Caching**: Maintains live data during connection issues

## **Technical Implementation**

### **Tech Stack**
- **Frontend**: React 18+ with Hooks, Vite, SCSS
- **Data Visualization**: Recharts with responsive design
- **UI Components**: Ant Design
- **APIs**: Polygon.io REST API + Finnhub WebSocket
- **State Management**: React Hooks with custom optimization

### **Key Technical Achievements**
- **WebSocket Optimization**: Custom ConnectionManager with exponential backoff retry logic
- **Render Performance**: Implemented price change detection and throttling to prevent unnecessary re-renders
- **Memory Management**: Proper cleanup of WebSocket connections and event listeners
- **Error Handling**: Comprehensive error handling with user-friendly messages and fallback data
- **Hybrid Data Architecture**: Seamless integration of REST API and WebSocket data sources

### **Performance Metrics**
- **Render Optimization**: Only re-renders when price changes >0.01%
- **Update Throttling**: Maximum 10 updates per second
- **Memory Leak Prevention**: Proper cleanup of all timeouts and intervals
- **Connection Management**: Automatic reconnection with exponential backoff

## **Quick Start**

```bash
# Clone and install
git clone <repository-url>
cd catalog-dashboard
npm install

# Configure API keys
cp .env.example .env
# Add your Polygon.io and Finnhub API keys

# Start development server
npm run dev
```

## **Project Highlights**

- **Real-time Data Streaming**: WebSocket integration with automatic reconnection
- **Performance Optimization**: Custom throttling and memoization strategies
- **Error Resilience**: Graceful fallback to historical data when live data fails
- **Modern React Patterns**: Hooks, memoization, and custom optimization
- **Responsive Design**: Works seamlessly across desktop and mobile devices

---

**Built by Yasar Arafath using React, Vite, and Recharts**