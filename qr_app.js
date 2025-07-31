const studentInfoDiv = document.getElementById("student-info");
const classSelect = document.getElementById("class-select");
const attendanceForm = document.getElementById("attendance-form");
const statusDiv = document.getElementById("status");

const studentNumber = new URLSearchParams(window.location.search).get("student");

if (!studentNumber) {
  studentInfoDiv.textContent = "Geen studentnummer gevonden in QR-code.";
} else {
  loadStudentInfo(parseInt(studentNumber)); // Zet om naar getal indien nodig
}

async function loadStudentInfo(studentNumber) {
  // Zoek student_class_id en student info op basis van student_number
  const { data, error } = await supabase
    .from("student_class")
    .select("id, student(firstname, lastname, student_number)")
    .eq("student.student_number", studentNumber)
    .single();

  if (error || !data) {
    studentInfoDiv.textContent = "Student niet gevonden.";
    return;
  }

  const student = data.student;
  const studentClassId = data.id;
  studentInfoDiv.innerHTML = `<strong>${student.firstname} ${student.lastname}</strong><br>Studentnummer: ${student.student_number}`;

  // Klassen ophalen
  const { data: classes, error: classError } = await supabase
    .from("classes")
    .select("id, dancestyle, level, day")
    .eq("active", true)
    .order("dancestyle");

  if (classError || !classes) {
    classSelect.innerHTML = `<option>Geen klassen gevonden</option>`;
    return;
  }

  classSelect.innerHTML = classes.map(cls =>
    `<option value="${cls.id}">${cls.dancestyle} ${cls.level} (${cls.day})</option>`
  ).join("");

  attendanceForm.style.display = "block";

  attendanceForm.onsubmit = async (e) => {
    e.preventDefault();
    const classId = classSelect.value;
    const lessonNumber = document.getElementById("lesson-number").value;

    const { error: insertError } = await supabase.from("attendance").insert([{
      student_class_id: studentClassId,
      lesson_number: parseInt(lessonNumber),
      aanwezigheid: true
    }]);

    if (insertError) {
      statusDiv.textContent = "❌ Fout bij registreren: " + insertError.message;
    } else {
      statusDiv.textContent = "✅ Aanwezigheid geregistreerd!";
    }
  };
}
