// DOM elements
const form = document.getElementById("student-form");
const tableBody = document.getElementById("student-table-body");

// Add student
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const firstname = document.getElementById("firstname").value;
  const lastname = document.getElementById("lastname").value;
  const email = document.getElementById("email").value;
  const geslacht = document.getElementById("geslacht").value;

  const { error } = await supabase.from("students").insert([
    { firstname, lastname, email, geslacht },
  ]);
  if (error) alert("Error: " + error.message);
  else {
    form.reset();
    loadStudents();
  }
});

// Load students
async function loadStudents() {
  const { data: students, error } = await supabase
    .from('students')
    .select('*')
    .order('lastname', { ascending: true });

  if (error) {
    alert('Failed to load students: ' + error.message);
    return;
  }

  const tbody = document.querySelector('#students-table tbody');
  tbody.innerHTML = '';

  students.forEach(student => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${student.firstname}</td>
      <td>${student.lastname}</td>
      <td>${student.email || ''}</td>
      <td>${student.geslacht || ''}</td>
      <td><a href="student-detail.html?id=${student.id}">View Details</a></td>
    `;
    tbody.appendChild(tr);
  });
}

// Load on start
loadStudents();
