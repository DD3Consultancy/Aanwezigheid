const urlParams = new URLSearchParams(window.location.search);
const classId = urlParams.get("class_id");

if (!classId) {
  alert("Geen klas geselecteerd. Selecteer eerst een klas.");
} else {
  loadClassDetails(classId);
  loadAttendingStudents(classId);
  renderLockButtons(classId); // Nieuwe functie die slotjes in header zet
}

async function loadClassDetails(classId) {
  const { data: classData, error } = await supabase
    .from("classes")
    .select("dancestyle, level, day, start_time, end_time")
    .eq("id", classId)
    .maybeSingle();

  if (error) {
    console.error("❌ Fout bij laden klasdetails:", error);
    return;
  }

  if (classData) {
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
        </table>
      </div>
    `;
  }
}

async function loadAttendingStudents(classId) {
  try {
    // Haal locked lessen op
    const { data: lockedLessons, error: lockError } = await supabase
      .from("locked_lessons")
      .select("lesson_number")
      .eq("class_id", classId)
      .eq("locked", true);

    if (lockError) {
      console.error("Fout bij ophalen locked_lessons:", lockError.message);
      return;
    }

    const lockedSet = new Set((lockedLessons || []).map(l => l.lesson_number));

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

        if (lockedSet.has(i)) {
          checkbox.disabled = true;
          checkbox.title = "Deze les is vergrendeld";
        }

        checkbox.addEventListener("change", async () => {
          if (lockedSet.has(i)) return;

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

// Nieuwe functie: rendert slotjes in de header van de tabel (naast lesnummers)
async function renderLockButtons(classId) {
  // Eerst lock-status ophalen
  const { data: lockedLessons, error } = await supabase
    .from("locked_lessons")
    .select("lesson_number, locked")
    .eq("class_id", classId);

  if (error) {
    console.error("Fout bij ophalen locked lessons:", error.message);
    return;
  }

  // Map maken van lesnummer => locked (true/false)
  const lockMap = new Map();
  (lockedLessons || []).forEach(ll => {
    lockMap.set(ll.lesson_number, ll.locked);
  });

  // Selecteer alle <th> met data-lesson attribuut in de header
  document.querySelectorAll("#students-table thead tr:nth-child(2) th[data-lesson]").forEach(th => {
    const lessonNum = Number(th.dataset.lesson);
    const locked = lockMap.get(lessonNum) === true;

    // Slotje knop maken/aanpassen
    let btn = th.querySelector("button.lock-toggle");
    if (!btn) {
      btn = document.createElement("button");
      btn.className = "lock-toggle";
      btn.style.marginLeft = "5px";
      th.appendChild(btn);
    }

    btn.textContent = locked ? "🔒" : "🔓";
    btn.title = locked ? "Les is vergrendeld, klik om te ontgrendelen" : "Les is ontgrendeld, klik om te vergrendelen";

    // Klik event om lock-status te toggelen
    btn.onclick = async () => {
      const newLockedStatus = !locked;

      // Check of lock al bestaat
      const { data: existing, error: findError } = await supabase
        .from("locked_lessons")
        .select("id")
        .eq("class_id", classId)
        .eq("lesson_number", lessonNum)
        .maybeSingle();

      if (findError) {
        alert("Fout bij zoeken lock: " + findError.message);
        return;
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from("locked_lessons")
          .update({ locked: newLockedStatus })
          .eq("id", existing.id);

        if (updateError) {
          alert("Fout bij updaten lock: " + updateError.message);
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from("locked_lessons")
          .insert([{ class_id: classId, lesson_number: lessonNum, locked: newLockedStatus }]);

        if (insertError) {
          alert("Fout bij toevoegen lock: " + insertError.message);
          return;
        }
      }

      // Herlaad slotjes en studenten om UI actueel te houden
      renderLockButtons(classId);
      loadAttendingStudents(classId);
    };
  });
}
