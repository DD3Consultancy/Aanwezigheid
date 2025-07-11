// Haal class_id uit URL
const urlParams = new URLSearchParams(window.location.search);
const classId = urlParams.get("class_id");

if (!classId) {
  alert("Geen klas geselecteerd. Selecteer eerst een klas.");
} else {
  loadAttendingStudents(classId);
}

async function loadAttendingStudents(classId) {
  try {
    // Haal studenten met geslacht op
    const { data: studentLinks, error } = await supabase
      .from("student_classes")
      .select("id, students (id, firstname, lastname, email, geslacht)")
      .eq("class_id", classId);

    if (error) {
      alert("Fout bij laden van studenten: " + error.message);
      return;
    }

    if (!studentLinks || studentLinks.length === 0) {
      const tbody = document.querySelector("#students-table tbody");
      tbody.innerHTML = "<tr><td colspan='15'>Geen studenten gekoppeld aan deze klas.</td></tr>";
      return;
    }

    // Groepeer per geslacht
    const vrouwen = studentLinks.filter(s => s.students.geslacht === "vrouw");
    const mannen = studentLinks.filter(s => s.students.geslacht === "man");
    const onbekend = studentLinks.filter(s => !s.students.geslacht || (s.students.geslacht !== "vrouw" && s.students.geslacht !== "man"));

    const tbody = document.querySelector("#students-table tbody");
    tbody.innerHTML = "";

    // Helper om groep te renderen
    async function renderGroup(naam, groep) {
      if (groep.length === 0) return;

      // Groep header rij
      const headerRow = document.createElement("tr");
      const headerCell = document.createElement("td");
      headerCell.colSpan = 15;
      headerCell.className = "group-header";
      headerCell.textContent = naam;
      headerRow.appendChild(headerCell);
      tbody.appendChild(headerRow);

      for (const link of groep) {
        const student = link.students;
        const studentClassId = link.id;

        // Haal aanwezigheid op
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
          <td>${student.email || ''}</td>
        `;

        // Voeg 12 checkboxes toe
        for (let i = 1; i <= 12; i++) {
          const td = document.createElement("td");
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = aanwezigMap[i] === true;

          checkbox.addEventListener("change", () => {
            saveAttendance(studentClassId, i, checkbox.checked);
          });

          td.appendChild(checkbox);
          tr.appendChild(td);
        }

        tbody.appendChild(tr);
      }
    }

    await renderGroup("Vrouwen", vrouwen);
    await renderGroup("Mannen", mannen);
    await renderGroup("Onbekend geslacht", onbekend);

  } catch (err) {
    alert("Onverwachte fout: " + err.message);
    console.error(err);
  }
}

async function saveAttendance(studentClassId, lessonNumber, aanwezig) {
  try {
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
  } catch (err) {
    alert("Fout bij opslaan aanwezigheid: " + err.message);
    console.error(err);
  }
}
