const express = require('express');
const auth = require('../middleware/auth');
const {
  createGroup,
  joinGroup,
  getGroupByCode,
  startSecretSanta,
  getMyGroups,
  deleteGroup,
} = require('../controllers/groupController');

const router = express.Router();

router.use(auth);

router.get('/', getMyGroups);
router.post('/', createGroup);
router.post('/join', joinGroup);
router.get('/:code', getGroupByCode);
router.patch('/:code/start', startSecretSanta);
router.delete('/:code', deleteGroup);

module.exports = router;
