// qr_app.js

const studentInfoDiv = document.getElementById("student-info");
const classSelect = document.getElementById("class-select");
const attendanceForm = document.getElementById("attendance-form");
const statusDiv = document.getElementById("status");

console.log("Script geladen");

const studentNumber = new URLSearchParams(window.location.search).get("student");
console.log("Studentnummer uit URL:", studentNumber);

if (!studentNumber) {
  studentInfoDiv.textContent = "Geen studentnummer gevonden in QR-code.";
} else {
  loadStudentInfo(studentNumber);
}

async function loadStudentInfo(studentNumber) {
  console.log("loadStudentInfo gestart met:", studentNumber);

  // Haal student info op
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, firstname, lastname, student_number")
    .eq("student_number", studentNumber)
    .single();

  console.log("Student data:", student, "Error:", studentError);

  if (studentError || !student) {
    studentInfoDiv.textContent = "Student niet gevonden.";
    return;
  }

  studentInfoDiv.innerHTML = `<strong>${student.firstname} ${student.lastname}</strong><br>Studentnummer: ${student.student_number}`;

  // Haal actieve klassen op
  const { data: classes, error: classError } = await supabase
    .from("classes")
    .select("id, dancestyle, level, day")
    .eq("active", true)
    .order("dancestyle");

  console.log("Classes data:", classes, "Error:", classError);

  if (classError || !classes || classes.length === 0) {
    classSelect.innerHTML = `<option>Geen klassen gevonden</option>`;
    return;
  }

  classSelect.innerHTML = classes.map(cls =>
    `<option value="${cls.id}">${cls.dancestyle} ${cls.level} (${cls.day})</option>`
  ).join("");

  attendanceForm.style.display = "block";

  attendanceForm.onsubmit = async (e) => {
    e.preventDefault();
    statusDiv.textContent = "";

    const classId = classSelect.value;
    const lessonNumber = parseInt(document.getElementById("lesson-number").value);

    console.log("Form submitted met classId:", classId, "lesnummer:", lessonNumber);

    // Check student_class record
    let { data: scData, error: scError } = await supabase
      .from("student_classes")
      .select("id")
      .eq("student_id", student.id)
      .eq("class_id", classId)
      .single();

    console.log("student_classes data:", scData, "Error:", scError);

    if (scError && scError.code !== "PGRST116") {
      statusDiv.textContent = "❌ Fout bij zoeken student_class: " + scError.message;
      return;
    }

    if (!scData) {
      const { data: newScData, error: insertScError } = await supabase
        .from("student_classes")
        .insert([{ student_id: student.id, class_id: classId }])
        .select("id")
        .single();

      if (insertScError) {
        statusDiv.textContent = "❌ Fout bij aanmaken student_class: " + insertScError.message;
        return;
      }
      scData = newScData;
    }

    // Aanwezigheid registreren
    const { error: insertAttendanceError } = await supabase
      .from("attendance")
      .insert([{
        student_class_id: scData.id,
        lesson_number: lessonNumber,
        aanwezigheid: true
      }]);

    if (insertAttendanceError) {
      statusDiv.textContent = "❌ Fout bij registreren aanwezigheid: " + insertAttendanceError.message;
    } else {
      statusDiv.textContent = "✅ Aanwezigheid succesvol geregistreerd!";
    }
  };
}
