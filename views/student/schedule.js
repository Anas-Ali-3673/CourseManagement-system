/**
 * Loads the schedule data for a specific student
 * @param {string} studentId - The ID of the student
 * @returns {Object|null} The schedule data or null if an error occurred
 */
async function loadStudentSchedule(studentId) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return null;
    }

    console.log('Loading schedule for student ID:', studentId);

    // Show loading state
    const scheduleTableBody = document.getElementById('schedule-table-body');
    if (scheduleTableBody) {
      scheduleTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">
            <div class="loading">
              <div class="spinner"></div>
            </div>
          </td>
        </tr>
      `;
    }

    const upcomingSchedule = document.getElementById('upcoming-schedule');
    if (upcomingSchedule) {
      upcomingSchedule.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
        </div>
      `;
    }

    // Use the correct API endpoint based on your router configuration
    // Trying alternative endpoint format since the current one is returning 400
    const response = await fetch(
      `${API_BASE_URL}/api/students/${studentId}/schedule`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('Schedule response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to load schedule: ${response.status}`);
    }

    const result = await response.json();
    console.log('Schedule data received:', result);

    // Extract scheduleData from the response correctly
    const scheduleData = result.data || {};
    console.log('Extracted schedule data:', scheduleData);

    // If no data is available, create a basic schedule from the student's enrolled courses
    if (!scheduleData || Object.keys(scheduleData).length === 0) {
      console.warn(
        'No schedule data available from API, creating from enrolled courses'
      );
      const generatedSchedule = await generateScheduleFromEnrolledCourses(
        studentId
      );

      if (generatedSchedule && Object.keys(generatedSchedule).length > 0) {
        // Update schedule table with generated data
        updateScheduleTable(generatedSchedule);
        updateUpcomingSchedule(generatedSchedule);
        return generatedSchedule;
      }

      // If we couldn't generate a schedule either, show empty state
      if (scheduleTableBody) {
        scheduleTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center">
              <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>You have no classes scheduled</p>
              </div>
            </td>
          </tr>
        `;
      }

      if (upcomingSchedule) {
        upcomingSchedule.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-calendar-alt"></i>
            <p>No upcoming classes</p>
          </div>
        `;
      }
      return null;
    }

    // Update schedule table
    updateScheduleTable(scheduleData);

    // Update upcoming schedule in dashboard
    updateUpcomingSchedule(scheduleData);

    return scheduleData;
  } catch (error) {
    console.error('Error loading schedule:', error);

    // Try to generate a fallback schedule from courses if API fails
    try {
      console.log('Attempting to generate fallback schedule from courses...');
      const fallbackSchedule = await generateScheduleFromEnrolledCourses(
        studentId
      );

      if (fallbackSchedule && Object.keys(fallbackSchedule).length > 0) {
        console.log('Generated fallback schedule:', fallbackSchedule);
        updateScheduleTable(fallbackSchedule);
        updateUpcomingSchedule(fallbackSchedule);
        return fallbackSchedule;
      }
    } catch (fallbackError) {
      console.error('Failed to generate fallback schedule:', fallbackError);
    }

    // Show error message in schedule table
    const scheduleTableBody = document.getElementById('schedule-table-body');
    if (scheduleTableBody) {
      scheduleTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-danger">
            <div class="alert danger">
              <i class="fas fa-exclamation-circle"></i>
              Failed to load schedule: ${error.message}
            </div>
          </td>
        </tr>
      `;
    }

    // Show error in upcoming schedule widget
    const upcomingSchedule = document.getElementById('upcoming-schedule');
    if (upcomingSchedule) {
      upcomingSchedule.innerHTML = `
        <div class="alert danger">
          <i class="fas fa-exclamation-circle"></i>
          Failed to load upcoming classes
        </div>
      `;
    }

    return null;
  }
}

/**
 * Generates a schedule from the student's enrolled courses
 * @param {string} studentId - The ID of the student
 * @returns {Object} A weekly schedule object
 */
async function generateScheduleFromEnrolledCourses(studentId) {
  try {
    // If we already have student data with completed courses, use that
    if (studentData && studentData.completedCourses && courseData) {
      console.log('Generating schedule from student data and course data');
      return createScheduleFromCourseData(
        studentData.completedCourses,
        courseData
      );
    }

    // Otherwise fetch the data
    const token = localStorage.getItem('token');

    // Get student data if not already available
    if (!studentData) {
      const studentResponse = await fetch(
        `${API_BASE_URL}/api/students/${studentId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!studentResponse.ok) {
        throw new Error('Failed to fetch student data');
      }

      studentData = await studentResponse.json();
    }

    // Get course data if not already available
    if (!courseData || courseData.length === 0) {
      const coursesResponse = await fetch(`${API_BASE_URL}/api/courses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!coursesResponse.ok) {
        throw new Error('Failed to fetch course data');
      }

      courseData = await coursesResponse.json();
    }

    // Create schedule from the data
    return createScheduleFromCourseData(
      studentData.completedCourses,
      courseData
    );
  } catch (error) {
    console.error('Error generating schedule from enrolled courses:', error);
    return {};
  }
}

/**
 * Creates a schedule object from course data
 * @param {Array} completedCourses - List of course names the student is enrolled in
 * @param {Array} allCourses - All available courses with schedule data
 * @returns {Object} A weekly schedule object
 */
function createScheduleFromCourseData(completedCourses, allCourses) {
  const weeklySchedule = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
  };

  // Find courses that match the completed course names
  const enrolledCourses = allCourses.filter((course) =>
    completedCourses.some(
      (completedCourse) => completedCourse.trim() === course.name.trim()
    )
  );

  console.log('Found enrolled courses with schedule:', enrolledCourses);

  // For each enrolled course, add its schedule to the weekly schedule
  enrolledCourses.forEach((course) => {
    if (course.schedule && Array.isArray(course.schedule)) {
      course.schedule.forEach((slot) => {
        if (weeklySchedule[slot.day]) {
          weeklySchedule[slot.day].push({
            courseName: course.name,
            courseCode: course.courseCode,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        }
      });
    }
  });

  // Sort each day's schedule by start time
  Object.keys(weeklySchedule).forEach((day) => {
    weeklySchedule[day].sort((a, b) => {
      // Convert time to minutes for comparison
      const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });
  });

  return weeklySchedule;
}

/**
 * Updates the schedule table with the provided schedule data
 * @param {Object} scheduleData - The schedule data
 */
function updateScheduleTable(scheduleData) {
  const scheduleTableBody = document.getElementById('schedule-table-body');
  if (!scheduleTableBody) return;

  if (!scheduleData || Object.keys(scheduleData).length === 0) {
    scheduleTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">No classes scheduled</td>
      </tr>
    `;
    return;
  }

  // Create time slots from 8:00 to 17:00
  const timeSlots = [];
  for (let hour = 8; hour <= 17; hour++) {
    const formattedHour = hour < 10 ? `0${hour}` : `${hour}`;
    timeSlots.push(`${formattedHour}:00`);
  }

  let tableHTML = '';

  // Days of the week for our table
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  timeSlots.forEach((timeSlot) => {
    let row = `<tr><td class="time-cell">${timeSlot}</td>`;

    weekdays.forEach((day) => {
      // Check if we have any classes for this day
      const daySchedule = scheduleData[day] || [];

      // Find classes that start at this time slot
      const matchingClasses = daySchedule.filter((cls) => {
        const classStartHour = cls.startTime.split(':')[0];
        const timeSlotHour = timeSlot.split(':')[0];
        return classStartHour === timeSlotHour;
      });

      if (matchingClasses.length > 0) {
        const cls = matchingClasses[0]; // Take the first matching class
        row += `
          <td class="class-block">
            <div class="class-content">
              <div class="course-name">${cls.courseName}</div>
              <div class="course-code">${cls.courseCode}</div>
              <div class="time-info">${cls.startTime} - ${cls.endTime}</div>
            </div>
          </td>
        `;
      } else {
        // Check if any class spans across this time slot
        const spanningClasses = daySchedule.filter((cls) => {
          const classStartHour = parseInt(cls.startTime.split(':')[0]);
          const classEndHour = parseInt(cls.endTime.split(':')[0]);
          const timeSlotHour = parseInt(timeSlot.split(':')[0]);

          // If the class starts before this slot and ends after or during this slot
          return classStartHour < timeSlotHour && classEndHour > timeSlotHour;
        });

        if (spanningClasses.length > 0) {
          // This slot is part of a spanning class
          row += '<td class="spanning-class"></td>';
        } else {
          // No class in this time slot
          row += '<td></td>';
        }
      }
    });

    row += '</tr>';
    tableHTML += row;
  });

  scheduleTableBody.innerHTML = tableHTML;
}

/**
 * Updates the upcoming schedule section in the dashboard
 * @param {Object} scheduleData - The schedule data
 */
function updateUpcomingSchedule(scheduleData) {
  const upcomingSchedule = document.getElementById('upcoming-schedule');
  if (!upcomingSchedule) return;

  if (!scheduleData || Object.keys(scheduleData).length === 0) {
    upcomingSchedule.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-calendar-alt"></i>
        <p>No upcoming classes</p>
      </div>
    `;
    return;
  }

  // Get current day of week
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const today = days[new Date().getDay()];

  // If today is a weekend or not in our schedule, show the next day's classes
  let dayToShow = today;
  if (
    today === 'Sunday' ||
    today === 'Saturday' ||
    !scheduleData[today] ||
    scheduleData[today].length === 0
  ) {
    // Find the next day with classes
    for (let i = 1; i <= 5; i++) {
      const nextDayIndex = (new Date().getDay() + i) % 7;
      const nextDay = days[nextDayIndex];
      if (scheduleData[nextDay] && scheduleData[nextDay].length > 0) {
        dayToShow = nextDay;
        break;
      }
    }

    // If still no classes found, default to Monday
    if (dayToShow === today) {
      dayToShow = 'Monday';
    }
  }

  // Get classes for the selected day
  const dayClasses = scheduleData[dayToShow] || [];

  if (dayClasses.length === 0) {
    upcomingSchedule.innerHTML = `
      <p class="text-center">No classes ${
        dayToShow === today ? 'today' : 'on ' + dayToShow
      }</p>
    `;
    return;
  }

  // Sort classes by start time
  const sortedClasses = [...dayClasses].sort((a, b) => {
    const getMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    return getMinutes(a.startTime) - getMinutes(b.startTime);
  });

  // Generate HTML for the selected day's classes
  let html = `<h5>${
    dayToShow === today ? "Today's" : dayToShow + "'s"
  } Classes</h5>`;
  html += '<div class="schedule-list">';

  sortedClasses.forEach((cls) => {
    html += `
      <div class="schedule-item">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>${cls.courseName}</strong>
            <div class="text-muted">${cls.courseCode}</div>
          </div>
          <div class="schedule-time">${cls.startTime} - ${cls.endTime}</div>
        </div>
      </div>
    `;
  });

  html += '</div>';

  upcomingSchedule.innerHTML = html;
}
