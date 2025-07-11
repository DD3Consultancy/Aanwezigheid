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
  tbody.innerHTML = "";

  classes.forEach(cls => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cls.dancestyle}</td>
      <td>${cls.level}</td>
      <td>${cls.day}</td>
      <td>${cls.start_time?.slice(0,5) || ''}</td>
      <td>${cls.end_time?.slice(0,5) || ''}</td>
    `;

    // Add click handler to navigate to class-detail.html
    tr.addEventListener("click", () => {
      window.location.href = `class-detail.html?class_id=${cls.id}`;
    });

    tbody.appendChild(tr);
  });
});
