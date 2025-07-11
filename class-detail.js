// classes.js

let classes = []; // Globale array voor loaded classes
const form = document.getElementById("class-form");
const submitBtn = document.getElementById("submit-button");
const cancelBtn = document.getElementById("cancel-edit");
const activeTbody = document.querySelector("#active-classes-table tbody");
const inactiveTbody = document.querySelector("#inactive-classes-table tbody");

let editingClassId = null; // Houdt bij welke klas wordt bewerkt

async function loadClasses() {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .order("dancestyle")
    .order("level");

  if (error) {
    console.error("Error loading classes:", error.message);
    return;
  }

  classes = data;

  const activeClasses = classes.filter(c => c.active);
  const inactiveClasses = classes.filter(c => !c.active);

  activeTbody.innerHTML = "";
  inactiveTbody.innerHTML = "";

  activeClasses.forEach(cls => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cls.dancestyle}</td>
      <td>${cls.level}</td>
      <td>${cls.day}</td>
      <td>${cls.start_time?.slice(0,5) || ''}</td>
      <td>${cls.end_time?.slice(0,5) || ''}</td>
      <td><input type="checkbox" checked data-id="${cls.id}" /></td>
      <td><button class="edit-button" data-id="${cls.id}">Edit</button></td>
    `;
    activeTbody.appendChild(tr);
  });

  inactiveClasses.forEach(cls => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cls.dancestyle}</td>
      <td>${cls.level}</td>
      <td>${cls.day}</td>
      <td>${cls.start_time?.slice(0,5) || ''}</td>
      <td>${cls.end_time?.slice(0,5) || ''}</td>
      <td><input type="checkbox" data-id="${cls.id}" /></td>
      <td><button class="edit-button" data-id="${cls.id}">Edit</button></td>
    `;
    inactiveTbody.appendChild(tr);
  });
}

// Zet formulier in bewerk modus
function enterEditMode(classObj) {
  editingClassId = classObj.id;
  form.dancestyle.value = classObj.dancestyle;
  form.level.value = classObj.level;
  form.day.value = classObj.day;
  form.start_time.value = classObj.start_time?.slice(0,5) || "";
  form.end_time.value = classObj.end_time?.slice(0,5) || "";

  submitBtn.textContent = "Update Class";
  cancelBtn.style.display = "inline-block";
}

// Zet formulier terug naar standaard modus (nieuw toevoegen)
function exitEditMode() {
  editingClassId = null;
  form.reset();
  submitBtn.textContent = "Add Class";
  cancelBtn.style.display = "none";
}

// Checkbox wijziging active status
document.body.addEventListener("change", async (e) => {
  if (e.target.type === "checkbox" && e.target.dataset.id) {
    const classId = e.target.dataset.id;
    const newActive = e.target.checked;

    const { error } = await supabase
      .from("classes")
      .update({ active: newActive })
      .eq("id", classId);

    if (error) {
      alert("Failed to update active status: " + error.message);
      e.target.checked = !newActive; // revert checkbox bij fout
      return;
    }

    loadClasses();
  }
});

// Edit knop click handler
document.body.addEventListener("click", e => {
  if(e.target.classList.contains("edit-button")) {
    const classId = e.target.dataset.id;
    const cls = classes.find(c => c.id == classId);
    if (cls) {
      enterEditMode(cls);
    }
  }
});

// Cancel edit knop
cancelBtn.addEventListener("click", () => {
  exitEditMode();
});

// Form submit handler (add of update)
form.addEventListener("submit", async e => {
  e.preventDefault();

  const newClass = {
    dancestyle: form.dancestyle.value.trim(),
    level: parseInt(form.level.value),
    day: form.day.value,
    start_time: form.start_time.value,
    end_time: form.end_time.value,
    active: true
  };

  if (editingClassId) {
    // Update bestaande klas
    const { error } = await supabase
      .from("classes")
      .update(newClass)
      .eq("id", editingClassId);

    if (error) {
      alert("Failed to update class: " + error.message);
      return;
    }

    exitEditMode();
  } else {
    // Voeg nieuwe klas toe
    const { error } = await supabase.from("classes").insert([newClass]);

    if (error) {
      alert("Failed to add class: " + error.message);
      return;
    }

    form.reset();
  }

  loadClasses();
});

// Zet de cancel knop eerst verborgen
cancelBtn.style.display = "none";

// Start met laden van klassen
loadClasses();
