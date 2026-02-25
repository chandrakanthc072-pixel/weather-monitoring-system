const express = require('express');
const router = express.Router();
const { getAllUsers, getAllHistory, adminDeleteHistory } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

router.get('/users',                protect, checkRole('admin'), getAllUsers);
router.get('/all-history',          protect, checkRole('admin'), getAllHistory);
router.delete('/history/:id',       protect, checkRole('admin'), adminDeleteHistory);

module.exports = router;
