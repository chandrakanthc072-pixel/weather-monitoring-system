const asyncHandler = require('express-async-handler');
const weatherService = require('../services/weatherService');
const SearchHistory = require('../models/SearchHistory');

// @desc    Get weather by city
// @route   GET /api/weather/:city
// @access  Private
const getWeather = asyncHandler(async (req, res) => {
    const city = req.params.city;

    const raw = await weatherService.getWeatherByCity(city);

    // Normalize response — safe fallbacks for every field
    const normalized = {
        location: {
            name:      raw.location?.name        || city,
            country:   raw.location?.country     || '',
            region:    raw.location?.region      || '',
            localtime: raw.location?.localtime   || new Date().toLocaleString(),
            lat:       raw.location?.lat         || '',
            lon:       raw.location?.lon         || '',
        },
        current: {
            temperature:          raw.current?.temperature          ?? null,
            feelslike:            raw.current?.feelslike            ?? null,
            humidity:             raw.current?.humidity             ?? null,
            wind_speed:           raw.current?.wind_speed           ?? null,
            wind_dir:             raw.current?.wind_dir             || '',
            pressure:             raw.current?.pressure             ?? null,
            visibility:           raw.current?.visibility           ?? null,
            uv_index:             raw.current?.uv_index             ?? null,
            cloudcover:           raw.current?.cloudcover           ?? null,
            weather_descriptions: raw.current?.weather_descriptions || ['N/A'],
            weather_icons:        raw.current?.weather_icons        || [],
            is_day:               raw.current?.is_day               || 'yes',
            observation_time:     raw.current?.observation_time     || '',
        }
    };

    // Save to Search History
    if (req.user) {
        await SearchHistory.create({
            user:        req.user.id,
            city:        normalized.location.name,
            temperature: normalized.current.temperature,
            condition:   normalized.current.weather_descriptions[0],
            humidity:    normalized.current.humidity,
            windSpeed:   normalized.current.wind_speed,
            searchedAt:  Date.now()
        });
    }

    res.status(200).json(normalized);
});

// @desc    Get user search history
// @route   GET /api/weather/history
// @access  Private
const getHistory = asyncHandler(async (req, res) => {
    const history = await SearchHistory.find({ user: req.user.id })
                                       .sort({ searchedAt: -1 })
                                       .limit(50);
    res.status(200).json(history);
});

// @desc    Delete a single history item
// @route   DELETE /api/weather/history/:id
// @access  Private
const deleteHistoryItem = asyncHandler(async (req, res) => {
    const item = await SearchHistory.findById(req.params.id);

    if (!item) {
        res.status(404);
        throw new Error('History item not found');
    }

    // Ensure the item belongs to the requesting user
    if (item.user.toString() !== req.user.id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this item');
    }

    await SearchHistory.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'History item deleted', id: req.params.id });
});

// @desc    Clear ALL history for the logged-in user
// @route   DELETE /api/weather/history/all
// @access  Private
const clearHistory = asyncHandler(async (req, res) => {
    const result = await SearchHistory.deleteMany({ user: req.user.id });
    res.status(200).json({ message: 'All history cleared', deletedCount: result.deletedCount });
});

module.exports = { getWeather, getHistory, deleteHistoryItem, clearHistory };
