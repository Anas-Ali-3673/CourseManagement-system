const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const authGuard = require('../auth/authGuard');
const { verifyToken } = require('../auth/authGuard');
// router.use(verifyToken);
router.route('/').post(enrollmentController.enroll);
router.route('/').get(enrollmentController.getAllEnrollments);
module.exports = router;
