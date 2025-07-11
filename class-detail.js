// class-detail.js

const urlParams = new URLSearchParams(window.location.search);
const classId = urlParams.get("class_id");

if (!classId) {
  alert("Geen klas geselecteerd. Selecteer eerst een klas.");
} else {
  loadAttendingStudents(classId);
}

async function loadAttendingStudents(classId) {
  try {
    const { data: studentLinks, error } = await supabase
      .from("student_classes")
      .select("id, students (id, firstname, lastname)")
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

      // Haal aanwezigheid op
      const { data: aanwezigheid, error: attError } = await supabase
        .from("attendance")
        .select("lesson_number, aanwezig")
        .eq("student_class_id", studentClassId);

      const aanwezigMap = {};
      if (aanwezigheid) {
        aanwezigheid.forEach(a => {
          aanwezigMap[a.lesson_number] = a.aanwezig;
        });
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${student.firstname}</td>
        <td>${student.lastname}</td>
      `;

      for (let i = 1; i <= 12; i++) {
        const td = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = aanwezigMap[i] === true;

        checkbox.addEventListener("change", async () => {
          checkbox.disabled = true; // tijdelijk uitschakelen
          checkbox.title = "Opslaan...";

          try {
            await saveAttendance(studentClassId, i, checkbox.checked);
            checkbox.title = checkbox.checked ? "Aanwezig" : "Afwezig";
          } catch (err) {
            alert("❌ Fout bij opslaan: " + err.message);
            checkbox.checked = !checkbox.checked; // rollback
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
    console.log(`✅ Bijgewerkt: student_class_id=${studentClassId}, les ${lessonNumber}, aanwezig=${aanwezig}`);
  } else {
    const { error: insertError } = await supabase
      .from("attendance")
      .insert([{ student_class_id: studentClassId, lesson_number: lessonNumber, aanwezig }]);

    if (insertError) throw insertError;
    console.log(`✅ Nieuw toegevoegd: student_class_id=${studentClassId}, les ${lessonNumber}, aanwezig=${aanwezig}`);
  }
}
