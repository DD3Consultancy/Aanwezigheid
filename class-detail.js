// class-detail.js

import { supabase } from './supabaseClient.js';  // Adjust if you use different import method

async function loadAttendingStudents(classId) {
  try {
    console.log("Loading attending students for class ID:", classId);

    const { data: students, error } = await supabase
      .from("student_classes")
      .select("students (id, firstname, lastname, email)")
      .eq("class_id", classId);

    if (error) {
      console.error("Error fetching attending students:", error);
      alert("Error loading students: " + error.message);
      return;
    }

    console.log("Fetched students data:", students);

    const tbody = document.querySelector("#students-table tbody");
    tbody.innerHTML = "";

    if (!students || students.length === 0) {
      tbody.innerHTML = "<tr><td colspan='4'>No students found for this class.</td></tr>";
      return;
    }

    students.forEach(student => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${student.id}</td>
        <td>${student.firstname}</td>
        <td>${student.lastname}</td>
        <td>${student.email}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Unexpected error loading attending students:", err);
    alert("Unexpected error: " + err.message);
  }
}

// Example usage: get classId from URL or selection
const urlParams = new URLSearchParams(window.location.search);
const classId = urlParams.get("class_id");

if (!classId) {
  alert("No class selected. Please select a class first.");
} else {
  loadAttendingStudents(classId);
}
