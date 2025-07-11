document.addEventListener("DOMContentLoaded", async () => {
  const { data: classes, error } = await supabase
    .from("classes")
    .select("*")
    .eq("active", true);

  if (error) {
    console.error("Error loading active classes:", error.message);
    return;
  }

  const tbody = document.querySelector("#aanwezigheid-table tbody");
  const dayFilter = document.getElementById("dayFilter");

  function renderTable(filteredClasses) {
    tbody.innerHTML = "";
    filteredClasses.forEach(cls => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${cls.dancestyle}</td>
        <td>${cls.level}</td>
        <td>${cls.day}</td>
        <td>${cls.start_time?.slice(0,5) || ''}</td>
        <td>${cls.end_time?.slice(0,5) || ''}</td>
      `;

      tr.addEventListener("click", () => {
        window.location.href = `class-detail.html?class_id=${cls.id}`;
      });

      tbody.appendChild(tr);
    });
  }

  // Init render met alle klassen
  renderTable(classes);

  // Filter event
  dayFilter.addEventListener("change", () => {
    const selectedDay = dayFilter.value.toLowerCase();
    if (!selectedDay) {
      renderTable(classes); // toon alles
    } else {
      const filtered = classes.filter(c => c.day.toLowerCase() === selectedDay);
      renderTable(filtered);
    }
  });
});
