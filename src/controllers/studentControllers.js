const Student = require('../models/student');
const { generateToken } = require('../auth/authGuard');
const { convertTimeToMinutes } = require('../utils/scheduleHelper');
const Enrollerment = require('../models/enrollerment');
exports.createStudent = async (req, res) => {
  const { name, email, rollNo, department, semester } = req.body;
  const { error } = Student.validateStudent(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const newStudent = await Student.create({
      name,
      email,
      rollNo,
      department,
      semester,
    });
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.signInStudent = async (req, res) => {
  const { rollNo } = req.body;

  try {
    const student = await Student.findOne({ rollNo });
    if (!student) return res.status(404).send('Student not found');
    const token = generateToken({
      id: student._id,
      rollNo: student.rollNo,
    });
    console.log(token);
    res.status(200).json({ status: 'success', data: student, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find({ role: { $ne: 'admin' } });
    const total = students.length;
    res.status(200).json(students);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.getStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findById(id);
    if (!student) return res.status(404).send('Student not found');
    res.status(200).json(student);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, email, rollNo, department, semester } = req.body;
  const { error } = Student.validatePartialStudent(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const student = await Student.findByIdAndUpdate(
      id,
      { name, email, rollNo, department, semester },
      { new: true }
    );
    if (!student) return res.status(404).send('Student not found');
    res.status(200).json(student);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.removeStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findByIdAndDelete(id);
    if (!student) return res.status(404).send('Student not found');
    res.status(200).json(student);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.getStudentSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    const enrollments = await Enrollerment.find({ student: id }).populate({
      path: 'course',
      select: 'name courseCode schedule',
    });

    const weeklySchedule = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
    };

    enrollments.forEach((enrollment) => {
      enrollment.course.schedule.forEach((slot) => {
        weeklySchedule[slot.day].push({
          courseName: enrollment.course.name,
          courseCode: enrollment.course.courseCode,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      });
    });

    // Sort each day's schedule by start time
    Object.keys(weeklySchedule).forEach((day) => {
      weeklySchedule[day].sort(
        (a, b) =>
          convertTimeToMinutes(a.startTime) - convertTimeToMinutes(b.startTime)
      );
    });
    // console.log(weeklySchedule);

    res.status(200).json({
      status: 'success',
      data: weeklySchedule,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};
