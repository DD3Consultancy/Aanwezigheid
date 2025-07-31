const studentInfoDiv = document.getElementById("student-info");
const attendanceForm = document.getElementById("attendance-form");
const classSelect = document.getElementById("class-select");
const statusDiv = document.getElementById("status");
const lessonOverviewDiv = document.getElementById("lesson-overview");

let currentStudent = null;

async function loadStudentInfo(studentNumber) {
  console.log("Start loadStudentInfo met studentNumber:", studentNumber);

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, firstname, lastname, student_number")
    .eq("student_number", studentNumber)
    .single();

  if (studentError || !student) {
    studentInfoDiv.textContent = "Student niet gevonden.";
    return;
  }

  currentStudent = student;

  studentInfoDiv.innerHTML = `
    <strong>${student.firstname} ${student.lastname}</strong><br>
    Studentnummer: ${student.student_number}
  `;

  await loadStudentClasses(student.id);
}

async function loadStudentClasses(studentId) {
  const { data: studentClasses, error } = await supabase
    .from("student_classes")
    .select("class_id, classes(id, dancestyle, level, day)")
    .eq("student_id", studentId);

  classSelect.innerHTML = "";

  // Voeg lege optie toe
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "-- Kies een klas --";
  classSelect.appendChild(emptyOption);

  if (error || !studentClasses || studentClasses.length === 0) {
    const option = document.createElement("option");
    option.textContent = "Geen klassen gevonden";
    option.disabled = true;
    classSelect.appendChild(option);
    return;
  }

  studentClasses.forEach(sc => {
    const option = document.createElement("option");
    option.value = sc.class_id;
    option.textContent = `${sc.classes.dancestyle} ${sc.classes.level} (${sc.classes.day})`;
    classSelect.appendChild(option);
  });

  attendanceForm.style.display = "block";
}

classSelect.addEventListener("change", async () => {
  const classId = classSelect.value;
  lessonOverviewDiv.innerHTML = "";

  if (!classId) return;

  const { data: studentClass, error: scError } = await supabase
    .from("student_classes")
    .select("id")
    .eq("student_id", currentStudent.id)
    .eq("class_id", classId)
    .single();

  if (scError || !studentClass) {
    lessonOverviewDiv.innerHTML = `<p>Kan student_class niet ophalen.</p>`;
    return;
  }

  const { data: attendances, error: attError } = await supabase
    .from("attendance")
    .select("lesson_number, aanwezig")
    .eq("student_class_id", studentClass.id);

  if (attError) {
    lessonOverviewDiv.innerHTML = `<p>Fout bij laden aanwezigheid.</p>`;
    return;
  }

  const presenceMap = {};
  attendances.forEach(row => {
    presenceMap[row.lesson_number] = row.aanwezig;
  });

  let html = "<h4>Aanwezigheidsoverzicht</h4><ul>";
  for (let i = 1; i <= 12; i++) {
    const status = presenceMap[i] === true ? "✅ Aanwezig" :
                   presenceMap[i] === false ? "❌ Afwezig" :
                   "⏳ Niet geregistreerd";
    html += `<li>Les ${i}: ${status}</li>`;
  }
  html += "</ul>";
  lessonOverviewDiv.innerHTML = html;
});

attendanceForm.onsubmit = async (e) => {
  e.preventDefault();
  const classId = classSelect.value;
  const lessonNumber = parseInt(document.getElementById("lesson-number").value);

  if (!classId || !lessonNumber) {
    statusDiv.textContent = "❌ Kies een klas en vul een lesnummer in.";
    return;
  }

  const { data: scData, error: scError } = await supabase
    .from("student_classes")
    .select("id")
    .eq("student_id", currentStudent.id)
    .eq("class_id", classId)
    .single();

  if (scError && scError.code !== "PGRST116") {
    statusDiv.textContent = "❌ Fout bij zoeken student_class: " + scError.message;
    return;
  }

  let scId = scData?.id;
  if (!scId) {
    const { data: newScData, error: insertScError } = await supabase
      .from("student_classes")
      .insert([{ student_id: currentStudent.id, class_id: classId }])
      .select("id")
      .single();

    if (insertScError) {
      statusDiv.textContent = "❌ Fout bij aanmaken student_class: " + insertScError.message;
      return;
    }
    scId = newScData.id;
  }

  const { error: insertAttendanceError } = await supabase
    .from("attendance")
    .insert([{
      student_class_id: scId,
      lesson_number: lessonNumber,
      aanwezig: true
    }]);

  if (insertAttendanceError) {
    statusDiv.textContent = "❌ Fout bij registreren aanwezigheid: " + insertAttendanceError.message;
  } else {
    statusDiv.textContent = "✅ Aanwezigheid geregistreerd!";
    classSelect.dispatchEvent(new Event("change")); // Herlaad overzicht
  }
};

// Startscript
const urlParams = new URLSearchParams(window.location.search);
const studentNumber = urlParams.get("student");
if (studentNumber) {
  loadStudentInfo(studentNumber);
}
