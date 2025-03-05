// ==============================
// Timesheet Functional Implementation with Local Storage Persistence
// ==============================

// ----------------------
// Configuration
// ----------------------
const ACTIVITY_TASKS = {
  Training: [
    "Self Learning",
    "Session",
    "Discussion",
    "Review",
    "Doubts Clarification",
  ],
  "HR activities": ["1:1", "Discussion"],
  Break: ["Lunch", "Snacks", "Personal Reasons"],
  Miscellaneous: ["Miscellaneous"],
};

// ----------------------
// State Management
// ----------------------
const state = {
  rowCounter: 0,
  rowTemplate: null,
  timesheetBody: null,
  addRowBtn: null,
  warningDiv: null,
  warningMsg: null,
  unsavedChanges: false,
};

// ----------------------
// Utility Functions
// ----------------------
function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return { hours: displayHours, minutes, ampm };
}

function timeToMinutes(timeStr) {
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function calculateDuration(startTimeText, endTimeText) {
  const startMinutes = timeToMinutes(startTimeText);
  const endMinutes = timeToMinutes(endTimeText);
  let durationMinutes = endMinutes - startMinutes;
  if (durationMinutes < 0) durationMinutes += 24 * 60;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function createErrorSpan(message) {
  const span = document.createElement("span");
  span.textContent = message;
  span.classList.add("time-error");
  span.style.color = "red";
  span.style.fontSize = "0.8em";
  return span;
}

// ----------------------
// Time Validation Functions
// ----------------------
function validateTimeBetweenRows() {
  const rows = document.querySelectorAll("#timesheet-body .field-row");
  let previousEndMinutes = null;
  let valid = true;

  // Remove previous time error messages
  rows.forEach((row) =>
    row.querySelectorAll(".time-error").forEach((err) => err.remove())
  );

  rows.forEach((row) => {
    const startTimeText = row.querySelector(".start-time-text").textContent;
    const endTimeText = row.querySelector(".end-time-text").textContent;
    const startTimeDisplay = row.querySelector(".start-time-display");
    const startMinutes = timeToMinutes(startTimeText);
    const endMinutes = timeToMinutes(endTimeText);

    if (endMinutes <= startMinutes) {
      const errorSpan = createErrorSpan("End time must be after start time");
      startTimeDisplay.parentNode.insertBefore(
        errorSpan,
        startTimeDisplay.nextSibling
      );
      valid = false;
    }
    if (previousEndMinutes !== null && startMinutes < previousEndMinutes) {
      const errorSpan = createErrorSpan(
        "Start time must be after previous row's end time"
      );
      startTimeDisplay.parentNode.insertBefore(
        errorSpan,
        startTimeDisplay.nextSibling
      );
      valid = false;
    }
    previousEndMinutes = endMinutes;
  });
  return valid;
}

function validateRowTime(row) {
  row.querySelectorAll(".time-error").forEach((err) => err.remove());
  const startTimeText = row.querySelector(".start-time-text").textContent;
  const endTimeText = row.querySelector(".end-time-text").textContent;
  const startTimeDisplay = row.querySelector(".start-time-display");
  const startMinutes = timeToMinutes(startTimeText);
  const endMinutes = timeToMinutes(endTimeText);

  if (endMinutes <= startMinutes) {
    const errorSpan = createErrorSpan("End time must be after start time");
    startTimeDisplay.parentNode.insertBefore(
      errorSpan,
      startTimeDisplay.nextSibling
    );
  }
  // Validate against previous row's end time
  const rows = Array.from(state.timesheetBody.children);
  const currentIndex = rows.indexOf(row);
  if (currentIndex > 0) {
    const prevRow = rows[currentIndex - 1];
    const prevEndTimeText = prevRow.querySelector(".end-time-text").textContent;
    const prevEndMinutes = timeToMinutes(prevEndTimeText);
    if (startMinutes < prevEndMinutes) {
      const errorSpan = createErrorSpan(
        "Start time must be after previous row's end time"
      );
      startTimeDisplay.parentNode.insertBefore(
        errorSpan,
        startTimeDisplay.nextSibling
      );
    }
  }
}

// ----------------------
// DOM Manipulation Functions
// ----------------------
function initializeDOM() {
  state.rowTemplate = document.getElementById("row-template");
  state.timesheetBody = document.getElementById("timesheet-body");
  state.addRowBtn = document.getElementById("add-row-btn");
  state.warningDiv = document.getElementById("showWarningDiv");
  state.warningMsg = document.getElementById("warning-msg");

  // Set today's date
  document.getElementById("date").valueAsDate = new Date();

  // Event listeners for add row, warning popup, and outside clicks
  state.addRowBtn.addEventListener("click", addRow);
  document
    .querySelector(".closeBtn")
    .addEventListener("click", () => hideWarning());
  document
    .querySelector(".cancelBtn")
    .addEventListener("click", () => hideWarning());
  document.addEventListener("click", handleOutsideClick);

  // Comment character counter
  const commentTextarea = document.querySelector(
    'textarea[name="comment-details"]'
  );
  commentTextarea.addEventListener("input", updateCommentCharCount);
  commentTextarea.addEventListener("input", enableSaveButton);

  // Delegate changes in the timesheet body to re-enable Save button
  state.timesheetBody.addEventListener("input", enableSaveButton);

  // Create first row
  addRow();
}

function updateCommentCharCount(event) {
  const count = event.target.value.length;
  document.getElementById("char-count").textContent = `${count}/255`;
}

function addRow() {
  if (state.rowCounter >= 12) {
    showWarning("Cannot add more than 12 rows");
    return;
  }
  const newRowFragment = state.rowTemplate.content.cloneNode(true);
  const newRow = newRowFragment.querySelector(".field-row");
  newRow.id = `row-${state.rowCounter}`;

  // Populate activity dropdown and task dropdown
  const activityDropdown = newRow.querySelector(".activity-dropdown");
  populateActivityDropdown(activityDropdown);
  const taskDropdown = newRow.querySelector(".task-dropdown");
  const activityIcon = newRow.querySelector(".activity-icon");
  populateTaskDropdown(activityDropdown, taskDropdown, activityIcon);

  // Hide delete button for first row
  if (state.rowCounter === 0) {
    const deleteBtn =
      newRow.querySelector(".delete-row") ||
      newRow.querySelector(".delete-row-btn");
    if (deleteBtn) {
      deleteBtn.style.display = "none";
    }
  } else {
    const deleteBtn =
      newRow.querySelector(".delete-row") ||
      newRow.querySelector(".delete-row-btn");
    if (deleteBtn) {
      deleteBtn.style.display = "";
    }
  }

  setupRowListeners(newRow);
  state.timesheetBody.appendChild(newRow);
  state.rowCounter++;
}

function populateActivityDropdown(activityDropdown) {
  Object.keys(ACTIVITY_TASKS).forEach((activity) => {
    const option = document.createElement("option");
    option.value = activity;
    option.textContent = activity;
    activityDropdown.appendChild(option);
  });
}

function populateTaskDropdown(activityDropdown, taskDropdown, activityIcon) {
  const selectedActivity = activityDropdown.value;
  if (activityIcon) {
    activityIcon.innerHTML =
      selectedActivity === "Break"
        ? `<i class="fa-solid fa-mug-hot" style="color:orange"></i>`
        : `<i class="fa-solid fa-briefcase"></i>`;
  }
  const tasks = ACTIVITY_TASKS[selectedActivity] || [];
  taskDropdown.innerHTML = "";
  tasks.forEach((task) => {
    const option = document.createElement("option");
    option.value = task;
    option.textContent = task;
    taskDropdown.appendChild(option);
  });
}

function validateTimesheet() {
  const rows = document.querySelectorAll("#timesheet-body .field-row");
  let valid = true;
  const missingFields = [];

  rows.forEach((row, index) => {
    row
      .querySelectorAll(".error-field")
      .forEach((field) => field.classList.remove("error-field"));
    if (!row.querySelector(".activity-dropdown").value) {
      missingFields.push({
        field: row.querySelector(".activity-dropdown"),
        rowIndex: index,
      });
    }
    if (!row.querySelector(".task-dropdown").value) {
      missingFields.push({
        field: row.querySelector(".task-dropdown"),
        rowIndex: index,
      });
    }
    const taskDetails = row.querySelector(".task-details");
    if (!taskDetails.value.trim()) {
      missingFields.push({ field: taskDetails, rowIndex: index });
    }
    const startTimeText = row.querySelector(".start-time-text").textContent;
    if (startTimeText === "12:00 AM") {
      missingFields.push({
        field: row.querySelector(".start-time-display"),
        rowIndex: index,
      });
    }
    const endTimeText = row.querySelector(".end-time-text").textContent;
    if (endTimeText === "12:00 AM") {
      missingFields.push({
        field: row.querySelector(".end-time-display"),
        rowIndex: index,
      });
    }
  });

  if (missingFields.length > 0) {
    missingFields.forEach((item) => item.field.classList.add("error-field"));
    const firstError = missingFields[0];
    const firstRow = document.getElementById(`row-${firstError.rowIndex}`);
    firstError.field.focus();
    if (firstRow) {
      firstRow.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    showWarning("Please fill in all required fields.");
    valid = false;
  }
  if (!validateTimeBetweenRows()) {
    showWarning("Please correct time entries.");
    valid = false;
  }
  return valid;
}

function setupSubmitButton() {
  const submitButtons = document.querySelectorAll(".submit-btns button");
  submitButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      if (validateTimesheet()) {
        console.log("Timesheet is valid. Proceeding with submission...");
        // Add your submission logic here.
      }
    });
  });
}

function addValidationStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .error-field {
      border: 2px solid red !important;
    }
    .time-error {
      display: block;
      color: red;
      font-size: 0.8em;
      margin-top: 5px;
    }
  `;
  document.head.appendChild(style);
}

// ----------------------
// Row & Time Picker Listeners
// ----------------------
function setupRowListeners(row) {
  const activityDropdown = row.querySelector(".activity-dropdown");
  const taskDropdown = row.querySelector(".task-dropdown");
  const taskDetails = row.querySelector(".task-details");
  const taskDetailsWarning = row.querySelector(".task-details-warning");
  const activityIcon = row.querySelector(".activity-icon");
  const charCount = row.querySelector(".char-count");
  const deleteBtn =
    row.querySelector(".delete-row") || row.querySelector(".delete-row-btn");

  activityDropdown.addEventListener("change", () => {
    populateTaskDropdown(activityDropdown, taskDropdown, activityIcon);
    enableSaveButton();
  });

  taskDetails.addEventListener("input", () => {
    const count = taskDetails.value.length;
    charCount.textContent = `${count}/255`;
    if (count === 0) {
      taskDetailsWarning.style.visibility = "visible";
      taskDetailsWarning.textContent = "*Can't be empty";
    } else {
      taskDetailsWarning.style.visibility = "hidden";
    }
    enableSaveButton();
  });

  enhanceRowListeners(row);

  const startTimePicker = row.querySelector(".start-time-picker");
  const endTimePicker = row.querySelector(".end-time-picker");
  setupTimePicker(startTimePicker, "start");
  setupTimePicker(endTimePicker, "end");

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      showDeleteWarning(row);
    });
  }
}

function enhanceRowListeners(row) {
  const requiredFields = [
    row.querySelector(".activity-dropdown"),
    row.querySelector(".task-dropdown"),
    row.querySelector(".task-details"),
    row.querySelector(".start-time-display"),
    row.querySelector(".end-time-display"),
  ];
  requiredFields.forEach((field) => {
    field.addEventListener("input", () => {
      field.classList.remove("error-field");
      enableSaveButton();
    });
    field.addEventListener("click", () => {
      field.classList.remove("error-field");
      const errors = field
        .closest(".field-row")
        .querySelectorAll(".time-error");
      errors.forEach((error) => error.remove());
      enableSaveButton();
    });
  });
}

function setupTimePicker(timePicker, type) {
  const timeDisplay = timePicker.querySelector(`.${type}-time-display`);
  const timeDropdown = timePicker.querySelector(`.${type}-time-dropdown`);
  const hoursInput = timePicker.querySelector(`.${type}-hours`);
  const minutesInput = timePicker.querySelector(`.${type}-minutes`);
  const ampmSelect = timePicker.querySelector(`.${type}-ampm`);

  const currentTime = getCurrentTime();
  hoursInput.value = currentTime.hours.toString().padStart(2, "0");
  minutesInput.value = currentTime.minutes.toString().padStart(2, "0");
  ampmSelect.value = currentTime.ampm;
  updateTimeDisplay(timePicker, type);

  timeDisplay.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleTimeDropdown(timeDropdown);
  });

  const hourUpBtn = timePicker.querySelector(`.${type}-hours-up`);
  const hourDownBtn = timePicker.querySelector(`.${type}-hours-down`);
  const minuteUpBtn = timePicker.querySelector(`.${type}-minutes-up`);
  const minuteDownBtn = timePicker.querySelector(`.${type}-minutes-down`);

  [hoursInput, minutesInput, ampmSelect].forEach((input) => {
    input.addEventListener("input", () => {
      updateTimeDisplay(timePicker, type);
      const row = timePicker.closest(".field-row");
      validateRowTime(row);
      enableSaveButton();
    });
  });

  hourUpBtn.addEventListener("click", () => changeTime(hoursInput, 1, "hours"));
  hourDownBtn.addEventListener("click", () =>
    changeTime(hoursInput, -1, "hours")
  );
  minuteUpBtn.addEventListener("click", () =>
    changeTime(minutesInput, 1, "minutes")
  );
  minuteDownBtn.addEventListener("click", () =>
    changeTime(minutesInput, -1, "minutes")
  );

  [hoursInput, minutesInput, ampmSelect].forEach((el) => {
    el.addEventListener("change", () => {
      updateTimeDisplay(timePicker, type);
      const errors = timePicker
        .closest(".field-row")
        .querySelectorAll(".time-error");
      errors.forEach((err) => err.remove());
      enableSaveButton();
    });
  });
}

function toggleTimeDropdown(dropdown) {
  document.querySelectorAll(".time-dropdown").forEach((dd) => {
    if (dd !== dropdown) dd.classList.add("hidden");
  });
  dropdown.classList.toggle("hidden");
}

function changeTime(input, increment, type) {
  let value = parseInt(input.value, 10) + increment;
  if (type === "hours") {
    value = value > 12 ? 1 : value < 1 ? 12 : value;
  } else if (type === "minutes") {
    value = value > 59 ? 0 : value < 0 ? 59 : value;
  }
  input.value = value.toString().padStart(2, "0");
  const parentPicker = input.closest(".time-picker");
  const typeValue = parentPicker.classList.contains("start-time-picker")
    ? "start"
    : "end";
  updateTimeDisplay(parentPicker, typeValue);
}

function updateTimeDisplay(timePicker, type) {
  const hoursInput = timePicker.querySelector(`.${type}-hours`);
  const minutesInput = timePicker.querySelector(`.${type}-minutes`);
  const ampmSelect = timePicker.querySelector(`.${type}-ampm`);
  const timeText = timePicker.querySelector(`.${type}-time-text`);
  const hours = hoursInput.value.padStart(2, "0");
  const minutes = minutesInput.value.padStart(2, "0");
  const ampm = ampmSelect.value;
  timeText.textContent = `${hours}:${minutes} ${ampm}`;
  const row = timePicker.closest(".field-row");
  updateDuration(row);
  validateRowTime(row);
  enableSaveButton();
}

function updateDuration(row) {
  const startTimeText = row.querySelector(".start-time-text").textContent;
  const endTimeText = row.querySelector(".end-time-text").textContent;
  const durationElement = row.querySelector(".duration");
  if (startTimeText && endTimeText) {
    durationElement.textContent = calculateDuration(startTimeText, endTimeText);
  }
}

function deleteRow(row) {
  if (state.timesheetBody.children.length > 1) {
    state.timesheetBody.removeChild(row);
    state.rowCounter--;
    enableSaveButton();
  } else {
    showWarning("You must keep at least one row.");
  }
}

function handleOutsideClick(event) {
  const dropdowns = document.querySelectorAll(".time-dropdown");
  if (![...dropdowns].some((dd) => dd.contains(event.target))) {
    dropdowns.forEach((dd) => dd.classList.add("hidden"));
  }
}

function showWarning(message) {
  state.warningMsg.textContent = message;
  state.warningDiv.style.display = "flex";
  document.body.classList.add("body-warning");
}

function hideWarning() {
  state.warningDiv.style.display = "none";
  document.body.classList.remove("body-warning");
}

// ----------------------
// Custom Delete Warning Popup
// ----------------------
function showDeleteWarning(row) {
  state.warningMsg.textContent = "Are you sure you want to delete this row?";
  state.warningDiv.style.display = "flex";
  document.body.classList.add("body-warning");

  const okBtn = state.warningDiv.querySelector(".closeBtn");
  const cancelBtn = state.warningDiv.querySelector(".cancelBtn");

  function okHandler() {
    deleteRow(row);
    cleanup();
  }

  function cancelHandler() {
    cleanup();
  }

  function cleanup() {
    hideWarning();
    okBtn.removeEventListener("click", okHandler);
    cancelBtn.removeEventListener("click", cancelHandler);
  }

  okBtn.addEventListener("click", okHandler);
  cancelBtn.addEventListener("click", cancelHandler);
}

// ----------------------
// Local Storage Functions
// ----------------------
function saveTimesheetToLocalStorage() {
  const timesheetData = {
    date: document.getElementById("date").value,
    comment: document.querySelector('textarea[name="comment-details"]').value,
    rows: [],
  };

  const rows = document.querySelectorAll("#timesheet-body .field-row");
  rows.forEach((row) => {
    const rowData = {
      activity: row.querySelector(".activity-dropdown").value,
      task: row.querySelector(".task-dropdown").value,
      taskDetails: row.querySelector(".task-details").value,
      startTime: row.querySelector(".start-time-text").textContent,
      endTime: row.querySelector(".end-time-text").textContent,
    };
    timesheetData.rows.push(rowData);
  });

  localStorage.setItem("timesheetData", JSON.stringify(timesheetData));
  document.getElementById("save-btn").disabled = true;
  state.unsavedChanges = false;
}

function loadTimesheetFromLocalStorage() {
  const savedData = localStorage.getItem("timesheetData");
  if (!savedData) return;
  const timesheetData = JSON.parse(savedData);

  document.getElementById("date").value =
    timesheetData.date || new Date().toISOString().split("T")[0];
  document.querySelector('textarea[name="comment-details"]').value =
    timesheetData.comment || "";
  document.getElementById("char-count").textContent = `${
    (timesheetData.comment || "").length
  }/255`;

  state.timesheetBody.innerHTML = "";
  state.rowCounter = 0;

  timesheetData.rows.forEach((rowData) => {
    addRow();
    const newRow = state.timesheetBody.lastElementChild;
    newRow.querySelector(".activity-dropdown").value = rowData.activity;
    newRow
      .querySelector(".activity-dropdown")
      .dispatchEvent(new Event("change"));
    newRow.querySelector(".task-dropdown").value = rowData.task;
    newRow.querySelector(".task-details").value = rowData.taskDetails;
    const charCountElem = newRow.querySelector(".char-count");
    charCountElem.textContent = `${rowData.taskDetails.length}/255`;

    const [startTime, startPeriod] = rowData.startTime.split(" ");
    const [startHours, startMinutes] = startTime.split(":");
    const startTimePicker = newRow.querySelector(".start-time-picker");
    startTimePicker.querySelector(".start-hours").value = startHours;
    startTimePicker.querySelector(".start-minutes").value = startMinutes;
    startTimePicker.querySelector(".start-ampm").value = startPeriod;
    updateTimeDisplay(startTimePicker, "start");

    const [endTime, endPeriod] = rowData.endTime.split(" ");
    const [endHours, endMinutes] = endTime.split(":");
    const endTimePicker = newRow.querySelector(".end-time-picker");
    endTimePicker.querySelector(".end-hours").value = endHours;
    endTimePicker.querySelector(".end-minutes").value = endMinutes;
    endTimePicker.querySelector(".end-ampm").value = endPeriod;
    updateTimeDisplay(endTimePicker, "end");
  });

  document.getElementById("save-btn").disabled = true;
  state.unsavedChanges = false;
}

// ----------------------
// Unsaved Changes Handling
// ----------------------
function enableSaveButton() {
  if (document.getElementById("save-btn").disabled) {
    document.getElementById("save-btn").disabled = false;
    state.unsavedChanges = true;
  }
}

// ----------------------
// Initialization
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
  initializeDOM();
  addValidationStyles();
  setupSubmitButton();
  loadTimesheetFromLocalStorage();

  // Save button listener for local storage save
  document.getElementById("save-btn").addEventListener("click", (e) => {
    e.preventDefault();
    saveTimesheetToLocalStorage();
  });
});
