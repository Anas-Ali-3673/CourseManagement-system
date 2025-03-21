const Course = require('../models/course');
exports.createCourse = async (req, res) => {
  const {
    name,
    courseCode,
    description,
    creditHours,
    department,
    prerequisites,
    semester,
    seats,
    schedule,
  } = req.body;
  const { error } = Course.validateCourse(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  console.log('req.body', req.body);
  try {
    const newCourse = await Course.create({
      name,
      courseCode,
      description,
      creditHours,
      department,
      prerequisites,
      semester,
      seats,
      schedule,
    });
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.getCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const course = await Course.findById(id);
    if (!course) return res.status(404).send('Course not found');
    res.status(200).json(course);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    // console.log('courses', courses);
    res.status(200).json(courses);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.updateCourse = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    courseCode,
    description,
    creditHours,
    department,
    prerequisites,
    semester,
    seats,
    schedule,
  } = req.body;
  const { error } = Course.validatePartialCourse(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const course = await Course.findById(id);
    if (!course) return res.status(404).send('Course not found');
    if (name) course.name = name;
    if (courseCode) course.courseCode = courseCode;
    if (description) course.description = description;
    if (creditHours) course.creditHours = creditHours;
    if (department) course.department = department;
    if (prerequisites) course.prerequisites = prerequisites;
    if (semester) course.semester = semester;
    if (seats) course.seats = seats;
    if (schedule) course.schedule = schedule;
    await course.save();
    res.status(200).json(course);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const course = await Course.findByIdAndDelete(id);
    if (!course) return res.status(404).send('Course not found');
    res.status(204).send();
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.checkPreRequisites = async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).send('Course not found');
    const prerequisites = course.prerequisites;
    if (prerequisites.length === 0) {
      res.status(200).send('No prerequisites required');
    } else {
      res.status(200).json(prerequisites);
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};
