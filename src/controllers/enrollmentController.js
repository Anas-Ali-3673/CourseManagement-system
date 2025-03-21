const Enrollerment = require('../models/enrollerment');
const Student = require('../models/student');
const Course = require('../models/course');
const { checkScheduleConflict } = require('../utils/scheduleHelper');

exports.enroll = async (req, res) => {
  const { student, course } = req.body;
  try {
    const studentExists = await Student.findById(student);
    if (!studentExists) {
      return res.status(404).json({
        status: 'fail',
        message: 'Student not found',
      });
    }

    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found',
      });
    }
    const prerequisites = courseExists.prerequisites || [];
    for (const prerequisiteName of prerequisites) {
      const prerequisiteCourse = await Course.findOne({
        name: prerequisiteName,
      });

      // Check if student is enrolled in the prerequisite course
      const isEnrolled = await Enrollerment.findOne({
        student: student,
        course: prerequisiteCourse._id,
      });
      if (!isEnrolled) {
        return res.status(400).json({
          status: 'fail',
          message: `Student has not completed prerequisite course: ${prerequisiteName}`,
        });
      }
    }

    const conflict = await checkScheduleConflict(student, courseExists);
    if (conflict.hasConflict) {
      return res.status(400).json({
        status: 'fail',
        message: `Schedule conflict with ${conflict.conflictingCourse} on ${conflict.day} at ${conflict.time}`,
        conflict,
      });
    }

    if (courseExists.seats <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'No seats available in this course',
      });
    }

    await Course.findByIdAndUpdate(course, {
      $inc: { seats: -1 },
    });

    const enrollment = await Enrollerment.create({
      student: student,
      course: course,
    });

    const populatedEnrollment = await enrollment.populate([
      {
        path: 'student',
        select: 'name email rollNo department semester completedCourses',
      },
      { path: 'course', select: 'name courseCode department semester seats' },
    ]);

    const completedCourses = studentExists.completedCourses || [];
    completedCourses.push(courseExists.name);
    await Student.findByIdAndUpdate(student, {
      completedCourses: completedCourses,
    });

    res.status(201).json({
      status: 'success',
      data: populatedEnrollment,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};
exports.getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollerment.find()
      .populate([
        {
          path: 'student',
          select: 'name email rollNo department semester completedCourses',
        },
        { path: 'course', select: 'name courseCode department semester seats' },
      ])
      .exec();
    res.status(200).json({
      status: 'success',
      data: enrollments,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};
