// class-detail.js

// 📌 Haal class_id op uit de URL
const urlParams = new URLSearchParams(window.location.search);
const classId = urlParams.get("class_id");

console.log("🌐 URL class_id parameter:", classId);

if (!classId) {
  alert("Geen klas geselecteerd. Selecteer eerst een klas.");
} else {
  loadAttendingStudents(classId);
}

async function loadAttendingStudents(classId) {
  try {
    console.log("🔍 Laden van studenten voor klas-ID:", classId);

    const { data: studentLinks, error } = await supabase
      .from("student_classes")
      .select("id, students (id, firstname, lastname, email)")
      .eq("class_id", classId);

    if (error) {
      console.error("❌ Fout bij ophalen studenten:", error);
      alert("Fout bij laden van studenten: " + error.message);
      return;
    }

    console.log("✅ Studenten opgehaald via student_classes:", studentLinks);

    const tbody = document.querySelector("#students-table tbody");
    if (!tbody) {
      console.warn("⚠️ Geen <tbody> gevonden in de HTML met id='students-table'");
      return;
    }

    tbody.innerHTML = "";

    if (!studentLinks || studentLinks.length === 0) {
      tbody.innerHTML = "<tr><td colspan='15'>Geen studenten gekoppeld aan deze klas.</td></tr>";
      return;
    }

    for (const link of studentLinks) {
      const student = link.students;
      const studentClassId = link.id;

      if (!student) {
        console.warn("⚠️ Lege student-link object:", link);
        continue;
      }

      // Haal aanwezigheid op
      const { data: aanwezigheid, error: attError } = await supabase
        .from("attendance")
        .select("lesson_number, aanwezig")
        .eq("student_class_id", studentClassId);

      if (attError) {
        console.warn("⚠️ Fout bij ophalen aanwezigheid:", attError.message);
      }

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

  } catch (err) {
    console.error("🚨 Onverwachte fout:", err);
    alert("Onverwachte fout: " + err.message);
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
      console.log(`✅ Update: Les ${lessonNumber} → ${aanwezig ? 'aanwezig' : 'afwezig'}`);
    } else {
      const { error: insertError } = await supabase
        .from("attendance")
        .insert([{ student_class_id: studentClassId, lesson_number: lessonNumber, aanwezig }]);

      if (insertError) throw insertError;
      console.log(`✅ Toegevoegd: Les ${lessonNumber} → ${aanwezig ? 'aanwezig' : 'afwezig'}`);
    }
  } catch (err) {
    console.error("❌ Fout bij opslaan aanwezigheid:", err.message);
    alert("Fout bij opslaan aanwezigheid: " + err.message);
  }
}
