# Bitcoin Dashboard

A hybrid Bitcoin price dashboard built with Vite + React and Recharts, featuring both live WebSocket data and historic REST API data.

## Features

- **Live Data**: Real-time Bitcoin price updates via Finnhub WebSocket
- **Historic Data**: Historical price data via Polygon.io REST API
- **Interactive Chart**: Beautiful line chart with Recharts
- **Range Selection**: Switch between 1D (live), 1M, and 1Y views
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Comprehensive error handling and loading states

## Setup Instructions

### 1. API Keys

You need to obtain API keys from two services:

#### Polygon.io (for historic data)
1. Go to [polygon.io](https://polygon.io/)
2. Sign up for a free account
3. Get your API key from the dashboard

#### Finnhub (for live data)
1. Go to [finnhub.io](https://finnhub.io/)
2. Sign up for a free account
3. Get your API key from the dashboard

### 2. Environment Configuration

Update the `.env` file in your project root with your API keys:

```env
VITE_POLYGON_API_KEY=your_actual_polygon_api_key_here
VITE_FINNHUB_API_KEY=your_actual_finnhub_api_key_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

## How It Works

### Data Sources

- **1D View**: Uses Finnhub WebSocket to get live Bitcoin price data from Binance
- **1M/1Y Views**: Uses Polygon.io REST API to fetch historical daily data

### Components

- `BitcoinDashboard`: Main dashboard component with state management
- `BitcoinChart`: Recharts-based chart component
- `PolygonAPI`: Service for fetching historic data
- `FinnhubWebSocket`: Service for live WebSocket data

### Key Features

1. **Hybrid Data**: Seamlessly switches between live and historic data
2. **Performance**: Limits live data to 50 points for smooth performance
3. **Error Handling**: Shows user-friendly error messages
4. **Loading States**: Displays loading spinners during data fetching
5. **Responsive**: Adapts to different screen sizes

## API Rate Limits

- **Polygon.io**: Free tier includes 5 requests per minute
- **Finnhub**: Free tier includes 60 requests per minute

## Troubleshooting

### Common Issues

1. **"API key not configured" error**: Make sure your `.env` file has the correct API keys
2. **WebSocket connection fails**: Check your Finnhub API key and internet connection
3. **Historic data fails**: Verify your Polygon API key and check rate limits
4. **Chart not updating**: Check browser console for WebSocket errors

### Debug Mode

Open browser developer tools to see detailed logs of API calls and WebSocket messages.

## File Structure

```
src/
├── components/
│   └── BitcoinChart/
│       ├── BitcoinChart.jsx
│       └── bitcoin-chart.scss
├── service/
│   ├── PolygonAPI.js
│   └── FinnhubWebSocket.js
├── view/
│   ├── BitcoinDashboard.jsx
│   └── bitcoin-dashboard.scss
└── App.jsx
```

## Customization

You can easily customize:
- Chart colors and styling in `bitcoin-chart.scss`
- Dashboard layout in `bitcoin-dashboard.scss`
- Data transformation in the service files
- Chart configuration in `BitcoinChart.jsx`

## Production Deployment

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Make sure your API keys are properly configured in your production environment

## License

This project is for educational purposes. Make sure to comply with the terms of service of Polygon.io and Finnhub when using their APIs.
