// classes.js

let editingClassId = null; // ⬅️ houdt bij of we aan het bewerken zijn

async function loadClasses() {
  const { data: classes, error } = await supabase
    .from("classes")
    .select("*")
    .eq("active", true)
    .order("dancestyle")
    .order("level");

  if (error) {
    console.error("Fout bij laden van klassen:", error.message);
    return;
  }

  const tbody = document.querySelector("#classes-table tbody");
  tbody.innerHTML = "";

  classes.forEach(cls => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cls.dancestyle}</td>
      <td>${cls.level}</td>
      <td>${cls.day}</td>
      <td>${cls.start_time?.slice(0,5)}</td>
      <td>${cls.end_time?.slice(0,5)}</td>
      <td>
        <button onclick="editClass('${cls.id}')">✏️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function editClass(id) {
  const { data: cls, error } = await supabase
    .from("classes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !cls) {
    alert("Fout bij laden klas om te bewerken");
    return;
  }

  document.querySelector("#class-form [name='dancestyle']").value = cls.dancestyle;
  document.querySelector("#class-form [name='level']").value = cls.level;
  document.querySelector("#class-form [name='day']").value = cls.day;
  document.querySelector("#class-form [name='start_time']").value = cls.start_time?.slice(0,5);
  document.querySelector("#class-form [name='end_time']").value = cls.end_time?.slice(0,5);
  editingClassId = cls.id;

  document.querySelector("#class-form button[type='submit']").textContent = "💾 Update Class";
}

document.getElementById("class-form").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;

  const newClass = {
    dancestyle: form.dancestyle.value.trim(),
    level: parseInt(form.level.value),
    day: form.day.value,
    start_time: form.start_time.value,
    end_time: form.end_time.value
  };

  let error;
  if (editingClassId) {
    // update bestaande klas
    ({ error } = await supabase
      .from("classes")
      .update(newClass)
      .eq("id", editingClassId));
  } else {
    // nieuwe klas toevoegen
    ({ error } = await supabase.from("classes").insert([newClass]));
  }

  if (error) {
    alert("Fout bij opslaan klas: " + error.message);
    return;
  }

  form.reset();
  editingClassId = null;
  form.querySelector("button[type='submit']").textContent = "Add Class";
  loadClasses();
});

loadClasses();
