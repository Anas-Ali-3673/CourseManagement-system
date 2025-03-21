// Global variables
// let students = []; // Uncomment this to store students globally
// const API_BASE_URL = 'http://localhost:5000';

// Function to load all students
async function loadStudents() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/students`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = await response.json();
    console.log('Students API response:', result);

    // Handle both array and object response formats
    let studentsList;
    if (Array.isArray(result)) {
      studentsList = result;
    } else if (result.data && Array.isArray(result.data)) {
      studentsList = result.data;
    } else {
      studentsList = [];
    }

    // Store the students in the global variable
    students = studentsList;

    // Display students in the table
    displayStudents(students);

    // Update the total students count in dashboard if the element exists
    const totalStudentsElement = document.getElementById('total-students');
    if (totalStudentsElement) {
      totalStudentsElement.textContent = students.length;
    }

    return students;
  } catch (error) {
    console.error('Error loading students:', error);
    showAlert('Failed to load students. Please try again.', 'danger');
    displayStudents([]); // Show empty table on error
    return []; // Return empty array on error
  }
}

// Function to display students in the table
function displayStudents(studentsList) {
  const tbody = document.querySelector('#students-table tbody');
  if (!tbody) {
    console.error(
      'Table body element not found. Selector: #students-table tbody'
    );
    return;
  }

  console.log('Displaying students:', studentsList);
  tbody.innerHTML = '';

  // Check if studentsList exists and is an array
  if (!Array.isArray(studentsList)) {
    console.warn('studentsList is not an array:', studentsList);
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center">No students found</td></tr>';
    return;
  }

  if (studentsList.length === 0) {
    console.log('No students available in the list');
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center">No students available</td></tr>';
    return;
  }

  studentsList.forEach((student) => {
    console.log('Processing student:', student);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student?.name || 'N/A'}</td>
      <td>${student?.rollNo || 'N/A'}</td>
      <td>${student?.email || 'N/A'}</td>
      <td>${student?.department || 'N/A'}</td>
      <td>${student?.semester || 'N/A'}</td>
      <td>${student?.completedCourses?.length || 0}</td>
      <td>
        <button class="btn primary small" onclick="viewStudent('${
          student?._id
        }')">View</button>
        <button class="btn secondary small" onclick="editStudent('${
          student?._id
        }')">Edit</button>
        <button class="btn danger small" onclick="deleteStudent('${
          student?._id
        }')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Function to view student details
async function viewStudent(id) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const student = await response.json();
    createModal('Student Details');
    document.getElementById('studentModalBody').innerHTML = `
      <div class="student-details">
        <div class="student-info-column">
          <p><strong>Name:</strong> ${student.name || 'N/A'}</p>
          <p><strong>Roll Number:</strong> ${student.rollNo || 'N/A'}</p>
          <p><strong>Email:</strong> ${student.email || 'N/A'}</p>
        </div>
        <div class="student-info-column">
          <p><strong>Department:</strong> ${student.department || 'N/A'}</p>
          <p><strong>Semester:</strong> ${student.semester || 'N/A'}</p>
          <p><strong>Completed Courses:</strong> ${
            student.completedCourses?.length || 0
          }</p>
        </div>
      </div>
      <div class="courses-section">
        <h5>Completed Courses</h5>
        <ul class="courses-list">
          ${
            student.completedCourses && student.completedCourses.length > 0
              ? student.completedCourses
                  .map((course) => `<li class="course-item">${course}</li>`)
                  .join('')
              : '<li class="course-item">No completed courses</li>'
          }
        </ul>
      </div>
    `;

    // Hide the save button for view mode
    const saveButton = document.getElementById('saveStudentButton');
    if (saveButton) {
      saveButton.style.display = 'none';
    }

    openModal();
  } catch (error) {
    console.error('Error viewing student:', error);
    showAlert('Failed to load student details. Please try again.', 'danger');
  }
}

// Function to edit student
async function editStudent(id) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const student = await response.json();
    const form = document.createElement('form');
    form.id = 'student-form';
    form.innerHTML = `
      <div class="form-group">
        <label for="student-name">Name</label>
        <input type="text" id="student-name" value="${student.name}" required>
      </div>
      <div class="form-group">
        <label for="student-rollno">Roll Number</label>
        <input type="text" id="student-rollno" value="${student.rollNo}" required>
      </div>
      <div class="form-group">
        <label for="student-email">Email</label>
        <input type="email" id="student-email" value="${student.email}" required>
      </div>
      <div class="form-group">
        <label for="student-department">Department</label>
        <input type="text" id="student-department" value="${student.department}" required>
      </div>
      <div class="form-group">
        <label for="student-semester">Semester</label>
        <input type="text" id="student-semester" value="${student.semester}" required>
      </div>
    `;

    createModal('Edit Student');
    document.getElementById('studentModalBody').innerHTML = '';
    document.getElementById('studentModalBody').appendChild(form);

    // Add the save button handler
    const saveButton = document.getElementById('saveStudentButton');
    if (saveButton) {
      saveButton.style.display = 'inline-block';
      saveButton.onclick = async () => {
        const studentData = {
          name: document.getElementById('student-name').value,
          rollNo: document.getElementById('student-rollno').value,
          email: document.getElementById('student-email').value,
          department: document.getElementById('student-department').value,
          semester: document.getElementById('student-semester').value,
        };

        try {
          const updateResponse = await fetch(
            `${API_BASE_URL}/api/students/${id}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(studentData),
            }
          );

          if (!updateResponse.ok) {
            throw new Error('Network response was not ok');
          }

          closeModal();
          loadStudents();
          showAlert('Student updated successfully!', 'success');
        } catch (error) {
          console.error('Error updating student:', error);
          showAlert('Failed to update student. Please try again.', 'danger');
        }
      };
    }

    openModal();
  } catch (error) {
    console.error('Error loading student for edit:', error);
    showAlert('Failed to load student details. Please try again.', 'danger');
  }
}

// Function to delete student
async function deleteStudent(id) {
  if (confirm('Are you sure you want to delete this student?')) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      loadStudents();
      showAlert('Student deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting student:', error);
      showAlert('Failed to delete student. Please try again.', 'danger');
    }
  }
}

// Function to create a modal
function createModal(title) {
  document.getElementById('studentModalTitle').textContent = title;
}

// Function to open modal
function openModal() {
  document.getElementById('studentModal').classList.add('show');
  document.getElementById('studentModal').style.display = 'block';
}

// Function to close modal
function closeModal() {
  document.getElementById('studentModal').classList.remove('show');
  document.getElementById('studentModal').style.display = 'none';
}

// Function to show alert messages
function showAlert(message, type) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert ${type}`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="close-btn" onclick="this.parentElement.remove()">×</button>
  `;

  const alertContainer = document.getElementById('alert-container');
  if (alertContainer) {
    alertContainer.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
  } else {
    console.error('Alert container not found');
  }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing student management...');
  loadStudents()
    .then((students) => {
      console.log('Initial students loaded:', students.length);
    })
    .catch((error) => {
      console.error('Error during initialization:', error);
    });
});
