const { Router } = require('express');
const { createUser, listUsers, toggleActive } = require('../controllers/users.controller');
const { protect, allowRoles } = require('../middleware/auth');

const router = Router();

router.use(protect);

router.post('/',                    allowRoles('ADMIN', 'HR_OFFICER'), createUser);
router.get('/',                     allowRoles('ADMIN'),               listUsers);
router.patch('/:id/toggle-active',  allowRoles('ADMIN'),               toggleActive);

module.exports = router;
