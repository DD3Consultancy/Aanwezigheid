const urlParams = new URLSearchParams(window.location.search);
const classId = urlParams.get("class_id");

if (!classId) {
  alert("Geen klas geselecteerd. Selecteer eerst een klas.");
} else {
  loadClassDetails(classId);        // 🔹 Nieuw toegevoegd
  loadAttendingStudents(classId);
}

async function loadClassDetails(classId) {
  // Stap 1: Haal klasdetails op
  const { data: classData, error } = await supabase
    .from("classes")
    .select("dancestyle, level, day, start_time, end_time")
    .eq("id", classId)
    .maybeSingle();

  if (error || !classData) {
    console.error("❌ Fout bij laden klasdetails:", error);
    return;
  }

  // Stap 2: Haal studenten met geslacht op
  const { data: studentLinks, error: studentError } = await supabase
    .from("student_classes")
    .select("students (geslacht)")
    .eq("class_id", classId);

  if (studentError) {
    console.error("❌ Fout bij laden studenten:", studentError);
    return;
  }

  // Stap 3: Tel mannen en vrouwen
  let manTeller = 0;
  let vrouwTeller = 0;

  studentLinks.forEach(link => {
    const geslacht = link.students?.geslacht?.toLowerCase();
    if (geslacht === "man") manTeller++;
    else if (geslacht === "vrouw") vrouwTeller++;
  });

  // Stap 4: Toon alles in twee kolommen
  const container = document.getElementById("class-info");
  container.innerHTML = `
    <div style="display: flex; gap: 2rem; margin-bottom: 1rem;">
      <table>
        <tr><td><strong>Dansstijl:</strong></td><td>${classData.dancestyle}</td></tr>
        <tr><td><strong>Niveau:</strong></td><td>${classData.level}</td></tr>
        <tr><td><strong>Dag:</strong></td><td>${classData.day}</td></tr>
      </table>
      <table>
        <tr><td><strong>Starttijd:</strong></td><td>${classData.start_time}</td></tr>
        <tr><td><strong>Eindtijd:</strong></td><td>${classData.end_time}</td></tr>
        <tr><td colspan="2"><strong>Mannen:</strong> ${manTeller} — <strong>Vrouwen:</strong> ${vrouwTeller}</td></tr>
      </table>
    </div>
  `;
}



async function loadAttendingStudents(classId) {
  try {
    const { data: studentLinks, error } = await supabase
      .from("student_classes")
      .select("id, students (id, firstname, lastname, geslacht)")
      .eq("class_id", classId);

    if (error) {
      alert("Fout bij laden studenten: " + error.message);
      return;
    }

    const tbody = document.querySelector("#students-table tbody");
    tbody.innerHTML = "";

    if (!studentLinks || studentLinks.length === 0) {
      tbody.innerHTML = "<tr><td colspan='14'>Geen studenten gekoppeld aan deze klas.</td></tr>";
      return;
    }

    for (const link of studentLinks) {
      const student = link.students;
      const studentClassId = link.id;

      const { data: aanwezigheid, error: attError } = await supabase
        .from("attendance")
        .select("lesson_number, aanwezig")
        .eq("student_class_id", studentClassId);

      const aanwezigMap = {};
      if (!attError && aanwezigheid) {
        aanwezigheid.forEach(a => {
          aanwezigMap[a.lesson_number] = a.aanwezig;
        });
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${student.firstname}</td>
        <td>${student.lastname}</td>
        <td>${student.geslacht || ''}</td>
      `;

      for (let i = 1; i <= 12; i++) {
        const td = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = aanwezigMap[i] === true;

        checkbox.addEventListener("change", async () => {
          checkbox.disabled = true;
          checkbox.title = "Opslaan...";

          try {
            await saveAttendance(studentClassId, i, checkbox.checked);
            checkbox.title = checkbox.checked ? "Aanwezig" : "Afwezig";
          } catch (err) {
            alert("❌ Fout bij opslaan: " + err.message);
            checkbox.checked = !checkbox.checked;
          }

          checkbox.disabled = false;
        });

        td.appendChild(checkbox);
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }

  } catch (err) {
    alert("Onverwachte fout: " + err.message);
  }
}

async function saveAttendance(studentClassId, lessonNumber, aanwezig) {
  const { data: existing, error: fetchError } = await supabase
    .from("attendance")
    .select("id")
    .eq("student_class_id", studentClassId)
    .eq("lesson_number", lessonNumber)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    const { error: updateError } = await supabase
      .from("attendance")
      .update({ aanwezig })
      .eq("id", existing.id);

    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase
      .from("attendance")
      .insert([{ student_class_id: studentClassId, lesson_number: lessonNumber, aanwezig }]);

    if (insertError) throw insertError;
  }
}
