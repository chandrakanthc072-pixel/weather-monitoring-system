const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const SearchHistory = require('../models/SearchHistory');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
});

// @desc    Get all search history (all users)
// @route   GET /api/admin/all-history
// @access  Private/Admin
const getAllHistory = asyncHandler(async (req, res) => {
    const history = await SearchHistory.find({})
                                       .populate('user', 'name email')
                                       .sort({ searchedAt: -1 });
    res.json(history);
});

// @desc    Admin delete any history item by ID
// @route   DELETE /api/admin/history/:id
// @access  Private/Admin
const adminDeleteHistory = asyncHandler(async (req, res) => {
    const item = await SearchHistory.findById(req.params.id);
    if (!item) {
        res.status(404);
        throw new Error('History item not found');
    }
    await SearchHistory.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'History item deleted by admin', id: req.params.id });
});

module.exports = { getAllUsers, getAllHistory, adminDeleteHistory };
