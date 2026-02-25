const express = require('express');
const router = express.Router();
const { getWeather, getHistory, deleteHistoryItem, clearHistory } = require('../controllers/weatherController');
const { protect } = require('../middleware/authMiddleware');

// History routes — must come BEFORE /:city to avoid conflict
router.get('/history',           protect, getHistory);
router.delete('/history/all',    protect, clearHistory);
router.delete('/history/:id',    protect, deleteHistoryItem);

// Weather fetch
router.get('/:city',             protect, getWeather);

module.exports = router;
