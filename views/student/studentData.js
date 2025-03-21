let studentData = null;
// const API_BASE_URL = 'http://localhost:5000';

async function loadStudentData() {
  try {
    const token = localStorage.getItem('token');
    const studentId = JSON.parse(atob(token.split('.')[1])).id;

    const response = await fetch(`${API_BASE_URL}/api/students/${studentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    studentData = await response.json();

    // Update profile data
    document.getElementById('student-name').textContent = studentData.name;
    document.getElementById(
      'student-rollno'
    ).textContent = `Roll No: ${studentData.rollNo}`;
    document.getElementById('student-email').textContent = studentData.email;
    document.getElementById('student-dept').textContent =
      studentData.department;
    document.getElementById('student-semester').textContent =
      studentData.semester;
    document.getElementById('current-semester').textContent =
      studentData.semester;

    // Update completed courses
    const completedCourses = studentData.completedCourses || [];
    document.getElementById('completed-courses').textContent =
      completedCourses.length;

    // Display completed courses
    const completedCoursesContainer = document.getElementById(
      'completed-courses-list'
    );
    if (completedCourses.length > 0) {
      completedCoursesContainer.innerHTML = '';
      completedCourses.forEach((course) => {
        completedCoursesContainer.innerHTML += `
          <div class="col-md-6 mb-2">
            <div class="card course-card">
              <div class="card-body py-2">
                <div class="d-flex align-items-center">
                  <div class="badge bg-success me-2">Completed</div>
                  <h6 class="mb-0">${course}</h6>
                </div>
              </div>
            </div>
          </div>
        `;
      });
    } else {
      completedCoursesContainer.innerHTML =
        '<div class="col-12"><p>No completed courses yet.</p></div>';
    }

    // Load student schedule
    loadStudentSchedule(studentId);

    // Load student enrollments
    loadStudentEnrollments(studentId);
  } catch (error) {
    console.error('Error loading student data:', error);
    alert('Failed to load student data. Please try again.');
  }
}
