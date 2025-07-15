<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Manage Classes</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 1rem;
      max-width: 900px;
      margin: auto;
    }
    h1, h2 {
      margin-bottom: 1rem;
    }
    form {
      margin-bottom: 1rem;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }
    form input, form select, form button {
      padding: 6px;
      font-size: 1rem;
    }
    form input[type="number"] {
      width: 60px;
    }
    form select {
      width: 110px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
      margin-bottom: 2rem;
    }
    th, td {
      padding: 0.5rem;
      border: 1px solid #ccc;
      text-align: left;
    }
    th {
      background-color: #f4f4f4;
    }
    button {
      cursor: pointer;
    }
    .edit-button {
      background: #f0ad4e;
      border: none;
      padding: 4px 8px;
      border-radius: 3px;
      color: white;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <nav style="background: #222; padding: 0.5rem 1rem; color: white; font-family: Arial, sans-serif;">
    <a href="index.html" style="color: white; margin-right: 1.5rem; text-decoration: none;">Students</a>
    <a href="classes.html" style="color: white; margin-right: 1.5rem; text-decoration: none;">Manage Classes</a>
    <a href="aanwezigheid.html" style="color: white; margin-right: 1.5rem; text-decoration: none;">Aanwezigheid</a>
  </nav>

  <h1>Manage Classes</h1>

  <form id="class-form" autocomplete="off">
    <input type="text" name="dancestyle" placeholder="Dance Style" required />
    <input type="number" name="level" placeholder="Level" min="1" required />
    <select name="day" required>
      <option value="" disabled selected>Day</option>
      <option>Monday</option>
      <option>Tuesday</option>
      <option>Wednesday</option>
      <option>Thursday</option>
      <option>Friday</option>
      <option>Saturday</option>
      <option>Sunday</option>
    </select>
    <select name="start_time" required>
      <option value="" disabled selected>Start Time</option>
      <option value="19:00">19:00</option>
      <option value="19:30">19:30</option>
      <option value="20:00">20:00</option>
      <option value="20:30">20:30</option>
      <option value="21:00">21:00</option>
    </select>
    <select name="end_time" required>
      <option value="" disabled selected>End Time</option>
      <option value="20:00">20:00</option>
      <option value="20:30">20:30</option>
      <option value="21:00">21:00</option>
      <option value="21:30">21:30</option>
      <option value="22:00">22:00</option>
    </select>

    <!-- ✅ NIEUW: Seizoen dropdown -->
    <select name="season_id" id="season-select" required>
      <option value="" disabled selected>Select Season</option>
    </select>

    <button type="submit" id="submit-button">Add Class</button>
    <button type="button" id="cancel-edit" style="display:none;">Cancel Edit</button>
  </form>

  <h2>Active Classes</h2>
  <table id="active-classes-table">
    <thead>
      <tr>
        <th>Dance Style</th>
        <th>Level</th>
        <th>Day</th>
        <th>Start Time</th>
        <th>End Time</th>
        <th>Season</th>
        <th>Active</th>
        <th>Edit</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>

  <h2>Inactive Classes</h2>
  <table id="inactive-classes-table">
    <thead>
      <tr>
        <th>Dance Style</th>
        <th>Level</th>
        <th>Day</th>
        <th>Start Time</th>
        <th>End Time</th>
        <th>Season</th>
        <th>Active</th>
        <th>Edit</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>

  <!-- Supabase library -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
  <!-- Shared Supabase client -->
  <script src="supabaseClient.js"></script>
  <!-- Page-specific JS -->
  <script src="classes.js"></script>

  <script>
    // Highlight current nav link
    const navLinks = document.querySelectorAll("nav a");
    const currentPath = window.location.pathname.split("/").pop();

    navLinks.forEach(link => {
      if(link.getAttribute("href") === currentPath) {
        link.style.fontWeight = "bold";
        link.style.textDecoration = "underline";
      }
    });
  </script>
</body>
</html>

let editingClassId = null;
let seasons = [];

// 🔁 Haal seizoenen op en toon dropdown
async function loadSeasons() {
  const { data, error } = await supabase
    .from("seasons")
    .select("id, name")
    .order("order");

  if (error) {
    console.error("Fout bij laden seizoenen:", error.message);
    return;
  }

  seasons = data || [];

  const select = document.createElement("select");
  select.name = "season_id";
  select.required = true;

  select.innerHTML = 
    <option value="" disabled selected>Seizoen</option>
    ${seasons.map(s => <option value="${s.id}">${s.name}</option>).join("")}
  ;

  const form = document.getElementById("class-form");
  form.insertBefore(select, document.getElementById("submit-button"));
}

// ✅ Klassen laden inclusief seizoen
async function loadClasses() {
  const { data: classes, error } = await supabase
    .from("classes")
    .select("id, dancestyle, level, day, start_time, end_time, active, season_id, seasons(name)")
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
    tr.innerHTML = 
      <td>${cls.dancestyle}</td>
      <td>${cls.level}</td>
      <td>${cls.day}</td>
      <td>${cls.start_time?.slice(0, 5) || ''}</td>
      <td>${cls.end_time?.slice(0, 5) || ''}</td>
      <td>${cls.seasons?.name || '-'}</td>
      <td>
        <input type="checkbox" data-id="${cls.id}" ${isActive ? "checked" : ""} />
      </td>
      <td>
        <button class="edit-button" data-id="${cls.id}">✏️</button>
      </td>
    ;
    return tr;
  };

  activeClasses.forEach(cls => activeTbody.appendChild(renderRow(cls, true)));
  inactiveClasses.forEach(cls => inactiveTbody.appendChild(renderRow(cls, false)));
}

// ✅ Active toggle
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
    form.season_id.value = data.season_id;
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
    end_time: form.end_time.value,
    season_id: form.season_id.value
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

// 🚀 Start
loadSeasons().then(loadClasses);
