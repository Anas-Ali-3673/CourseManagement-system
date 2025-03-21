const express = require('express');
const router = express.Router();
const {
  createStudent,
  signInStudent,
  getStudents,
  getStudent,
  updateStudent,
  removeStudent,
  getStudentSchedule,
} = require('../controllers/studentControllers');
// const { verifyToken } = require('../auth/authGuard');
router.route('/signIn').post(signInStudent);
router.route('/:id').get(getStudent);
// router.use(verifyToken);
router.route('/').get(getStudents);
router.route('/:id').patch(updateStudent);
router.route('/:id').delete(removeStudent);
router.route('/schedule/:id').get(getStudentSchedule);

module.exports = router;
