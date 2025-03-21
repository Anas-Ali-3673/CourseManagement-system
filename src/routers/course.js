const express = require('express');
const router = express.Router();
const {
  createCourse,
  getCourse,
  getCourses,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const { verifyToken } = require('../auth/authGuard');
router.use(verifyToken);
router.route('/').post(createCourse);
router.route('/:id').get(getCourse);
router.route('/').get(getCourses);
router.route('/:id').patch(updateCourse);
router.route('/:id').delete(deleteCourse);
module.exports = router;
