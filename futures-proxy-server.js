const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Binance Futures Proxy',
        timestamp: new Date().toISOString()
    });
});

// Proxy endpoint untuk Binance Futures
app.get('/fapi/v1/klines', async (req, res) => {
    try {
        const { symbol, interval, startTime, endTime, limit } = req.query;

        // Validasi parameter required
        if (!symbol || !interval) {
            return res.status(400).json({
                error: 'Missing required parameters: symbol and interval are required'
            });
        }

        const binanceUrl = `https://fapi.binance.com/fapi/v1/klines`;
        const params = {
            symbol,
            interval,
            ...(startTime && { startTime }),
            ...(endTime && { endTime }),
            ...(limit && { limit: parseInt(limit) })
        };

        console.log(`[Futures Proxy] Fetching: ${symbol}, Interval: ${interval}`);

        const response = await axios.get(binanceUrl, {
            params,
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });

        console.log(`[Futures Proxy] ✅ Success: ${symbol}, Candles: ${response.data.length}`);

        res.json(response.data);

    } catch (error) {
        console.error(`[Futures Proxy] ❌ Error:`, error.message);

        res.status(error.response?.status || 500).json({
            success: false,
            error: error.message,
            binanceError: error.response?.data
        });
    }
});

// Endpoint khusus untuk use case kita
app.get('/api/proxy/klines', async (req, res) => {
    try {
        const { symbol, startTime, endTime } = req.query;

        if (!symbol) {
            return res.status(400).json({
                error: 'Symbol parameter is required'
            });
        }

        const binanceUrl = `https://fapi.binance.com/fapi/v1/klines`;
        const params = {
            symbol: `${symbol}USDT`,
            interval: '1m',
            startTime: startTime || (Date.now() - 120000), // Default: 2 menit lalu
            endTime: endTime || Date.now(), // Default: sekarang
            limit: 2
        };

        console.log(`[Futures Proxy] Fetching for: ${params.symbol}`);

        const response = await axios.get(binanceUrl, {
            params,
            timeout: 10000
        });

        console.log(`[Futures Proxy] ✅ Success: ${params.symbol}`);

        res.json(response.data);

    } catch (error) {
        console.error(`[Futures Proxy] ❌ Error:`, error.message);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Futures Proxy Server running on port ${PORT}`);
    console.log(`📍 Health check: /health`);
    console.log(`📍 Klines endpoint: /fapi/v1/klines`);
    console.log(`📍 Simple endpoint: /api/proxy/klines`);
});