const params = new URLSearchParams(window.location.search);
const classId = params.get("id"); // id uit URL halen, bv ?id=123

const classTitleEl = document.getElementById("class-title");
const studentsTbody = document.querySelector("#students-table tbody");

if (!classId) {
  alert("Geen klas ID gevonden in de URL");
  throw new Error("Geen klas ID");
}

async function loadClassDetail() {
  // Haal klas info op (optioneel)
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("*")
    .eq("id", classId)
    .single();

  if (classError) {
    alert("Fout bij laden klas: " + classError.message);
    return;
  }

  classTitleEl.textContent = `Class Detail: ${classData.dancestyle} (Level ${classData.level})`;

  // Haal studenten + aanwezigheid op (voorbeeld)
  // Neem aan: tabel "students" met kolom class_id
  // en "attendance" met student_id, class_id, les_nummer, aanwezig (boolean)

  // Haal studenten van deze klas
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("*")
    .eq("class_id", classId)
    .order("lastname");

  if (studentsError) {
    alert("Fout bij laden studenten: " + studentsError.message);
    return;
  }

  // Haal aanwezigheid van alle studenten in deze klas (alle lesnummers 1-12)
  const { data: attendance, error: attendanceError } = await supabase
    .from("attendance")
    .select("*")
    .eq("class_id", classId);

  if (attendanceError) {
    alert("Fout bij laden aanwezigheid: " + attendanceError.message);
    return;
  }

  studentsTbody.innerHTML = ""; // eerst leegmaken

  students.forEach(student => {
    const tr = document.createElement("tr");

    // bouw aanwezigheidscellen
    let attendanceCells = "";
    for (let lesNummer = 1; lesNummer <= 12; lesNummer++) {
      const aanwezigObj = attendance.find(a =>
        a.student_id === student.id && a.les_nummer === lesNummer);
      const aanwezig = aanwezigObj ? aanwezigObj.aanwezig : false;

      attendanceCells += `<td>${aanwezig ? "✔️" : ""}</td>`;
    }

    tr.innerHTML = `
      <td>${student.firstname}</td>
      <td>${student.lastname}</td>
      ${attendanceCells}
    `;

    studentsTbody.appendChild(tr);
  });
}

loadClassDetail();
