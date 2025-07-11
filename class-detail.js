// class-detail.js

async function loadAttendingStudents(classId) {
  try {
    console.log("🔍 Laden van studenten voor klas-ID:", classId);

    const { data: studentLinks, error } = await supabase
      .from("student_classes")
      .select("students (id, firstname, lastname, email)")
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
      console.warn("ℹ️ Geen studenten gevonden voor deze klas.");
      tbody.innerHTML = "<tr><td colspan='4'>Geen studenten gekoppeld aan deze klas.</td></tr>";
      return;
    }

    studentLinks.forEach(link => {
      const student = link.students;
      if (!student) {
        console.warn("⚠️ Lege student-link object:", link);
        return;
      }

      console.log("👤 Student toegevoegd:", student);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${student.firstname}</td>
        <td>${student.lastname}</td>
        <td>${student.email || ''}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("🚨 Onverwachte fout:", err);
    alert("Onverwachte fout: " + err.message);
  }
}

// 📌 URL-parameter ophalen
const urlParams = new URLSearchParams(window.location.search);
const classId = urlParams.get("class_id");

console.log("🌐 URL class_id parameter:", classId);

if (!classId) {
  alert("Geen klas geselecteerd. Selecteer eerst een klas.");
} else {
  loadAttendingStudents(classId);
}
