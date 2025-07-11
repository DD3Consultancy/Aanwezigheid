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

  activeClasses.forEach(cls => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cls.dancestyle}</td>
      <td>${cls.level}</td>
      <td>${cls.day}</td>
      <td>${cls.start_time?.slice(0,5) || ''}</td>
      <td>${cls.end_time?.slice(0,5) || ''}</td>
      <td><input type="checkbox" checked data-id="${cls.id}" /></td>
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
    `;
    inactiveTbody.appendChild(tr);
  });
}

// Listen for checkbox changes to toggle active status
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
      e.target.checked = !newActive; // revert checkbox on error
      return;
    }

    loadClasses();
  }
});

// Form submission to add a new class
document.getElementById("class-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const newClass = {
    dancestyle: form.dancestyle.value.trim(),
    level: parseInt(form.level.value),
    day: form.day.value,
    start_time: form.start_time.value,
    end_time: form.end_time.value,
    active: true
  };

  const { error } = await supabase.from("classes").insert([newClass]);

  if (error) {
    alert("Failed to add class: " + error.message);
    return;
  }

  form.reset();
  loadClasses();
});

// Initial load
loadClasses();
