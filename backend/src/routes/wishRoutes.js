const express = require('express');
const auth = require('../middleware/auth');
const { getWishStatus, submitWish } = require('../controllers/wishController');

const router = express.Router();

router.use(auth);

router.get('/:code/status', getWishStatus);
router.post('/:code', submitWish);

module.exports = router;
