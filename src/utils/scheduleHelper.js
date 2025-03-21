const Enrollerment = require('../models/enrollerment');

const checkScheduleConflict = async (studentId, newCourse) => {
  // Get all enrollments for the student
  const studentEnrollments = await Enrollerment.find({
    student: studentId,
  }).populate('course');

  for (const enrollment of studentEnrollments) {
    const existingCourse = enrollment.course;

    // Check for conflicts between schedules
    for (const newSlot of newCourse.schedule) {
      for (const existingSlot of existingCourse.schedule) {
        if (newSlot.day === existingSlot.day) {
          const newStart = convertTimeToMinutes(newSlot.startTime);
          const newEnd = convertTimeToMinutes(newSlot.endTime);
          const existingStart = convertTimeToMinutes(existingSlot.startTime);
          const existingEnd = convertTimeToMinutes(existingSlot.endTime);

          if (
            (newStart >= existingStart && newStart < existingEnd) ||
            (newEnd > existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)
          ) {
            return {
              hasConflict: true,
              conflictingCourse: existingCourse.name,
              day: newSlot.day,
              time: `${existingSlot.startTime}-${existingSlot.endTime}`,
            };
          }
        }
      }
    }
  }
  return { hasConflict: false };
};

const convertTimeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

module.exports = {
  checkScheduleConflict,
};
