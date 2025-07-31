async function loadStudentInfo(studentNumber) {
  console.log("Start loadStudentInfo met studentNumber:", studentNumber);

  // 1. Haal student info op
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

  // 2. Haal alle actieve klassen
  const { data: classes, error: classError } = await supabase
    .from("classes")
    .select("id, dancestyle, level, day")
    .eq("active", true)
    .order("dancestyle");

  console.log("Classes data:", classes, "Error:", classError);
  if (classError || !classes) {
    classSelect.innerHTML = `<option>Geen klassen gevonden</option>`;
    return;
  }

  classSelect.innerHTML = classes.map(cls =>
    `<option value="${cls.id}">${cls.dancestyle} ${cls.level} (${cls.day})</option>`
  ).join("");

  attendanceForm.style.display = "block";

  // 3. Form submit handler
  attendanceForm.onsubmit = async (e) => {
    e.preventDefault();
    const classId = classSelect.value;
    const lessonNumber = parseInt(document.getElementById("lesson-number").value);

    console.log("Form submitted with classId:", classId, "lessonNumber:", lessonNumber);

    // Check of student_classes record al bestaat
    let { data: scData, error: scError } = await supabase
      .from("student_classes")
      .select("id")
      .eq("student_id", student.id)
      .eq("class_id", classId)
      .single();

    console.log("Student_classes data:", scData, "Error:", scError);

    if (scError && scError.code !== "PGRST116") {
      statusDiv.textContent = "❌ Fout bij zoeken student_class: " + scError.message;
      return;
    }

    // Als niet gevonden, maak nieuwe aan
    if (!scData) {
      const { data: newScData, error: insertScError } = await supabase
        .from("student_classes")
        .insert([{ student_id: student.id, class_id: classId }])
        .select("id")
        .single();

      console.log("New student_class insert:", newScData, "Error:", insertScError);

      if (insertScError) {
        statusDiv.textContent = "❌ Fout bij aanmaken student_class: " + insertScError.message;
        return;
      }
      scData = newScData;
    }

    // Registreer aanwezigheid
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
      statusDiv.textContent = "✅ Aanwezigheid geregistreerd!";
    }
  };
}
