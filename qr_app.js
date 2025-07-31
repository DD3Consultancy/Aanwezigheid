async function loadStudentInfo(studentNumber) {
  // 1. Haal student info op
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, firstname, lastname, student_number")
    .eq("student_number", studentNumber)
    .single();

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

  if (classError || !classes) {
    classSelect.innerHTML = `<option>Geen klassen gevonden</option>`;
    return;
  }

  classSelect.innerHTML = classes.map(cls =>
    `<option value="${cls.id}">${cls.dancestyle} ${cls.level} (${cls.day})</option>`
  ).join("");

  attendanceForm.style.display = "block";

  // 3. Bij formulier submit: maak student_classes aan als die nog niet bestaat en registreer aanwezigheid
  attendanceForm.onsubmit = async (e) => {
    e.preventDefault();
    const classId = classSelect.value;
    const lessonNumber = parseInt(document.getElementById("lesson-number").value);

    // Check of student_classes record al bestaat
    let { data: scData, error: scError } = await supabase
      .from("student_classes")
      .select("id")
      .eq("student_id", student.id)
      .eq("class_id", classId)
      .single();

    if (scError && scError.code !== "PGRST116") { // PGRST116 = no rows found
      statusDiv.textContent = "❌ Fout bij zoeken student_class: " + scError.message;
      return;
    }

    // Als niet gevonden, maak een nieuw student_classes record aan
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
