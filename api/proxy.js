const axios = require('axios');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { symbol, startTime, endTime } = req.query;

        if (!symbol) {
            return res.status(400).json({
                success: false,
                error: 'Symbol parameter is required'
            });
        }

        const params = {
            symbol: `${symbol}USDT`,
            interval: '1m',
            limit: 2,
            ...(startTime && { startTime: parseInt(startTime) }),
            ...(endTime && { endTime: parseInt(endTime) })
        };

        console.log(`[Vercel Proxy] Fetching: ${params.symbol}`);

        const response = await axios.get('https://fapi.binance.com/fapi/v1/klines', {
            params,
            timeout: 10000
        });

        res.json(response.data);

    } catch (error) {
        console.error(`[Vercel Proxy] Error:`, error.message);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};