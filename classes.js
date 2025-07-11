// Laad klassen
async function loadClasses() {
  const { data: classes, error } = await supabase
    .from("classes")
    .select("*")
    .order("dancestyle")
    .order("level");

  if (error) {
    console.error("Error loading classes:", error.message);
    return;
  }

  const activeClasses = classes.filter(c => c.active);
  const inactiveClasses = classes.filter(c => !c.active);

  const activeTbody = document.querySelector("#active-classes-table tbody");
  const inactiveTbody = document.querySelector("#inactive-classes-table tbody");

  activeTbody.innerHTML = "";
  inactiveTbody.innerHTML = "";

  const renderRow = (cls, isActive) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cls.dancestyle}</td>
      <td>${cls.level}</td>
      <td>${cls.day}</td>
      <td>${cls.start_time?.slice(0, 5) || ''}</td>
      <td>${cls.end_time?.slice(0, 5) || ''}</td>
      <td>
        <input type="checkbox" data-id="${cls.id}" ${isActive ? "checked" : ""} />
      </td>
      <td>
        <button class="edit-button" data-id="${cls.id}">✏️</button>
      </td>
    `;
    return tr;
  };

  activeClasses.forEach(cls => activeTbody.appendChild(renderRow(cls, true)));
  inactiveClasses.forEach(cls => inactiveTbody.appendChild(renderRow(cls, false)));
}

// 🔁 Luister naar checkbox changes
document.body.addEventListener("change", async (e) => {
  if (e.target.type === "checkbox" && e.target.dataset.id) {
    const classId = e.target.dataset.id;
    const newActive = e.target.checked;

    const { error } = await supabase
      .from("classes")
      .update({ active: newActive })
      .eq("id", classId);

    if (error) {
      alert("Fout bij bijwerken van active status: " + error.message);
      e.target.checked = !newActive;
      return;
    }

    loadClasses();
  }
});

// 🖊 Bewerken
let editingClassId = null;

document.body.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit-button")) {
    const id = e.target.dataset.id;
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert("Fout bij laden klas: " + error.message);
      return;
    }

    editingClassId = id;
    const form = document.getElementById("class-form");
    form.dancestyle.value = data.dancestyle;
    form.level.value = data.level;
    form.day.value = data.day;
    form.start_time.value = data.start_time;
    form.end_time.value = data.end_time;
  }
});

// ➕ Toevoegen of bijwerken
document.getElementById("class-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const cls = {
    dancestyle: form.dancestyle.value.trim(),
    level: parseInt(form.level.value),
    day: form.day.value,
    start_time: form.start_time.value,
    end_time: form.end_time.value
  };

  let error;
  if (editingClassId) {
    ({ error } = await supabase
      .from("classes")
      .update(cls)
      .eq("id", editingClassId));
  } else {
    cls.active = true;
    ({ error } = await supabase.from("classes").insert([cls]));
  }

  if (error) {
    alert("Fout bij opslaan klas: " + error.message);
    return;
  }

  form.reset();
  editingClassId = null;
  loadClasses();
});

// Initieel laden
loadClasses();
