const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Daily XIN reference-price time-series. XIN is pegged to 1 Satoshi, and its USD
// reference comes from the ieUnit API (special.XIN.usd). Upserted by `date`, so each
// day holds exactly one entry (matching ieUnit's daily cadence) and a real history
// builds up over time.
const XinPrice = new Schema({
    date: { type: String, unique: true },       // 'YYYY-MM-DD'
    timestamp: { type: Number, index: true },   // epoch ms
    price_usd: Number,
    price_btc: Number,                          // 1e-8 (1 Satoshi)
    source: { type: String, default: 'ieUnit' }
}, { id: false });

module.exports = mongoose.model('XinPrice', XinPrice);
