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
// State Management
const state = {
  rowCounter: 0,
  rowTemplate: null,
  timesheetBody: null,
  addRowBtn: null,
  warningDiv: null,
  warningMsg: null,
  unsavedChanges: false,
};
// Utility Functions
function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return {
    timeString: `${displayHours}:${minutes} ${ampm}`,
    hours: displayHours,
    minutes,
    ampm,
  };
}
function timeToMinutes(timeStr) {
  // Expects format: "HH:MM AM/PM"
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

// Helper to convert total minutes back to time string and individual values.
function minutesToTime(totalMinutes) {
  totalMinutes = totalMinutes % (24 * 60); // Wrap around if needed.
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours24 >= 12 ? "PM" : "AM";
  let hours12 = hours24 % 12;
  // if (hours12 === 0) hours12 = 12;
  const hh = hours12.toString().padStart(2, "0");
  const mm = minutes.toString().padStart(2, "0");
  return {
    timeString: `${hh}:${mm} ${ampm}`,
    hours: hh,
    minutes: mm,
    ampm: ampm,
  };
}
// Split Row Functionality
function splitRowAlternative(row) {
  // Get current row's time values
  const startTimeText = row.querySelector(".start-time-text").textContent;
  const endTimeText = row.querySelector(".end-time-text").textContent;
  const originalStart = timeToMinutes(startTimeText);
  const originalEnd = timeToMinutes(endTimeText);
  // Check minimum time difference
  if (originalEnd - originalStart <= 1) {
    showWarning("Row cannot be split further: not enough time difference.");
    return;
  }
  // Calculate split time (1 minute after start)
  const splitMinutes = originalStart + 1;
  const splitTimeObj = minutesToTime(splitMinutes);
  // Remember other row values before splitting
  const activity = row.querySelector(".activity-dropdown").value;
  const task = row.querySelector(".task-dropdown").value;
  const taskDetails = row.querySelector(".task-details").value;
  // Update current row's end time to be just 1 minute after start time
  row.querySelector(".end-time-text").textContent = splitTimeObj.timeString;
  const endPicker = row.querySelector(".end-time-picker");
  endPicker.querySelector(".end-hours").value = splitTimeObj.hours;
  endPicker.querySelector(".end-minutes").value = splitTimeObj.minutes;
  endPicker.querySelector(".end-ampm").value = splitTimeObj.ampm;
  updateDuration(row);
  // Create a fresh new row instead of cloning
  addRow(); // This creates a new row at the end
  // Get the newly created row (last row in the table)
  const newRow = state.timesheetBody.lastElementChild;
  // Move it to the position after the current row
  if (row.nextSibling) {
    state.timesheetBody.insertBefore(newRow, row.nextSibling);
  }
  // Copy form data to the new row
  newRow.querySelector(".activity-dropdown").value = activity;
  newRow.querySelector(".activity-dropdown").dispatchEvent(new Event("change"));
  newRow.querySelector(".task-dropdown").value = task;
  newRow.querySelector(".task-details").value = taskDetails;

  // Set new row start time (split time = original row end time)
  newRow.querySelector(".start-time-text").textContent =
    splitTimeObj.timeString;
  const newStartPicker = newRow.querySelector(".start-time-picker");
  newStartPicker.querySelector(".start-hours").value = splitTimeObj.hours;
  newStartPicker.querySelector(".start-minutes").value = splitTimeObj.minutes;
  newStartPicker.querySelector(".start-ampm").value = splitTimeObj.ampm;

  // Set new row end time (original end time)
  newRow.querySelector(".end-time-text").textContent = endTimeText;
  const newEndPicker = newRow.querySelector(".end-time-picker");
  const [originalEndTime, originalEndPeriod] = endTimeText.split(" ");
  const [originalEndHours, originalEndMinutes] = originalEndTime.split(":");
  newEndPicker.querySelector(".end-hours").value = originalEndHours;
  newEndPicker.querySelector(".end-minutes").value = originalEndMinutes;
  newEndPicker.querySelector(".end-ampm").value = originalEndPeriod;

  updateDuration(newRow);
  enableSaveButton();
}
// Time Validation Functions
function validateTimeBetweenRows() {
  const rows = document.querySelectorAll("#timesheet-body .field-row");
  let previousEndMinutes = null;
  let valid = true;
  // Remove previous error messages.
  rows.forEach((row) =>
    row.querySelectorAll(".time-error").forEach((err) => err.remove())
  );

  rows.forEach((row) => {
    const startTimeText = row.querySelector(".start-time-text").textContent;
    const endTimeText = row.querySelector(".end-time-text").textContent;
    const startTimeDisplay = row.querySelector(".start-time-display");
    const startMinutes = timeToMinutes(startTimeText);
    const endMinutes = timeToMinutes(endTimeText);

    if (endMinutes < startMinutes) {
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
  const endTimeDisplay = row.querySelector(".end-time-display");
  const startMinutes = timeToMinutes(startTimeText);
  const endMinutes = timeToMinutes(endTimeText);
  // Basic validation for hours/minutes range (optional)
  const [sTime] = startTimeText.split(" ");
  let [sHours, sMinutes] = sTime.split(":").map(Number);
  const [eTime] = endTimeText.split(" ");
  let [eHours, eMinutes] = eTime.split(":").map(Number);
  if (sHours < 0 || sHours > 12 || sMinutes < 0 || sMinutes > 60) {
    const errorSpan = createErrorSpan("Enter valid Time");
    startTimeDisplay.parentNode.insertBefore(
      errorSpan,
      startTimeDisplay.nextSibling
    );
    return;
  }
  if (eHours < 0 || eHours > 12 || eMinutes < 0 || eMinutes > 60) {
    const errorSpan = createErrorSpan("Enter valid Time");
    endTimeDisplay.parentNode.insertBefore(
      errorSpan,
      endTimeDisplay.nextSibling
    );
    return;
  }

  if (endMinutes < startMinutes) {
    const errorSpan = createErrorSpan("End time must be after start time");
    startTimeDisplay.parentNode.insertBefore(
      errorSpan,
      startTimeDisplay.nextSibling
    );
  }
  // Validate against previous row's end time.
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

  // Populate activity dropdown and task dropdown.
  const activityDropdown = newRow.querySelector(".activity-dropdown");
  populateActivityDropdown(activityDropdown);
  const taskDropdown = newRow.querySelector(".task-dropdown");
  const activityIcon = newRow.querySelector(".activity-icon");
  populateTaskDropdown(activityDropdown, taskDropdown, activityIcon);

  setupRowListeners(newRow);
  state.timesheetBody.appendChild(newRow);
  state.rowCounter++;

  return true;
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
function disableFormFields() {
  document
    .querySelectorAll("input, select, textarea, button, .time-display")
    .forEach((el) => {
      el.disabled = true;
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
// Row & Time Picker Listeners
function setupRowListeners(row) {
  const activityDropdown = row.querySelector(".activity-dropdown");
  const taskDropdown = row.querySelector(".task-dropdown");
  const taskDetails = row.querySelector(".task-details");
  const taskDetailsWarning = row.querySelector(".task-details-warning");
  const activityIcon = row.querySelector(".activity-icon");
  const charCount = row.querySelector(".char-count");
  const deleteBtn = row.querySelector(".delete-row");

  activityDropdown.addEventListener("change", () => {
    populateTaskDropdown(activityDropdown, taskDropdown, activityIcon);
    updateDuration(row);
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
  // Add split row functionality.
  const splitBtn = row.querySelector(".split-row");
  if (splitBtn) {
    splitBtn.addEventListener("click", () => {
      splitRowAlternative(row);
      enableSaveButton();
    });
  }
}
// For regular fields, clear errors on click/input; for time displays, re-validate.
function enhanceRowListeners(row) {
  const regularFields = [
    row.querySelector(".activity-dropdown"),
    row.querySelector(".task-dropdown"),
    row.querySelector(".task-details"),
  ];
  regularFields.forEach((field) => {
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

  const timeDisplays = [
    row.querySelector(".start-time-display"),
    row.querySelector(".end-time-display"),
  ];
  timeDisplays.forEach((td) => {
    td.addEventListener("click", () => {
      const parentRow = td.closest(".field-row");
      validateRowTime(parentRow);
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
  // Calculate total durations for all rows
  let totalEffectiveMinutes = 0;
  let totalBreakMinutes = 0;
  const rows = document.querySelectorAll("#timesheet-body .field-row");
  rows.forEach((r) => {
    const sTime = r.querySelector(".start-time-text").textContent;
    const eTime = r.querySelector(".end-time-text").textContent;
    const activity = r.querySelector(".activity-dropdown").value;

    if (sTime && eTime) {
      let minutes = timeToMinutes(eTime) - timeToMinutes(sTime);
      if (minutes < 0) {
        minutes += 24 * 60;
      }
      if (activity === "Break") {
        totalBreakMinutes += minutes;
      } else {
        totalEffectiveMinutes += minutes;
      }
    }
  });
  const effectiveHours = Math.floor(totalEffectiveMinutes / 60);
  const effectiveRemainingMinutes = totalEffectiveMinutes % 60;
  const breakHours = Math.floor(totalBreakMinutes / 60);
  const breakRemainingMinutes = totalBreakMinutes % 60;

  document.getElementById(
    "total-effective-hours"
  ).textContent = `${effectiveHours}h ${effectiveRemainingMinutes}m`;
  document.getElementById(
    "total-break-hours"
  ).textContent = `${breakHours}h ${breakRemainingMinutes}m`;
}
function deleteRow(row) {
  if (state.timesheetBody.children.length > 1) {
    state.timesheetBody.removeChild(row);
    state.rowCounter--; // Note: rowCounter may no longer match row IDs.
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
// Custom Delete Warning Popup
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
// Local Storage Functions
function saveTimesheetToLocalStorage(type) {
  // Create an object to hold the timesheet data
  if (!validateTimesheet()) {
    console.log("No validated");
    return;
  }
  console.log("Timesheet is valid. Proceeding with submission...");

  const timesheetData = {
    type: type, // "save" or "submit"
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
  if (type === "submit") {
    disableFormFields();
  }
  localStorage.setItem("timesheetData", JSON.stringify(timesheetData));
  document.getElementById(`${type}-btn`).disabled = true;
  state.unsavedChanges = false;
}

function loadTimesheetFromLocalStorage() {
  const savedData = localStorage.getItem("timesheetData");

  if (!savedData) return;
  const timesheetData = JSON.parse(savedData);
  if (timesheetData.type === "submit") {
    disableFormFields();
  }
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

    // Update start time picker.
    const [startTime, startPeriod] = rowData.startTime.split(" ");
    const [startHours, startMinutes] = startTime.split(":");
    const startTimePicker = newRow.querySelector(".start-time-picker");
    startTimePicker.querySelector(".start-hours").value = startHours;
    startTimePicker.querySelector(".start-minutes").value = startMinutes;
    startTimePicker.querySelector(".start-ampm").value = startPeriod;
    updateTimeDisplay(startTimePicker, "start");

    // Update end time picker.
    const [endTime, endPeriod] = rowData.endTime.split(" ");
    const [endHours, endMinutes] = endTime.split(":");
    const endTimePicker = newRow.querySelector(".end-time-picker");
    endTimePicker.querySelector(".end-hours").value = endHours;
    endTimePicker.querySelector(".end-minutes").value = endMinutes;
    endTimePicker.querySelector(".end-ampm").value = endPeriod;
    updateTimeDisplay(endTimePicker, "end");
  });

  document.getElementById("save-btn").disabled = false;
  state.unsavedChanges = false;

  // If the timesheet type is "submit", disable all form fields.
  if (timesheetData.type === "submit") {
    disableFormFields();
  }
}
// Unsaved Changes Handling
function enableSaveButton() {
  if (document.getElementById("save-btn").disabled) {
    document.getElementById("save-btn").disabled = false;
    state.unsavedChanges = true;
  }
}
// Clock In / Clock Out Functionality
const clockInOut = {};
// Clock In / Clock Out Functionality
document.querySelector(".clock-in").addEventListener("click", function () {
  const currentTime = getCurrentTime();
  const startTime = `${currentTime.hours}:${currentTime.minutes
    .toString()
    .padStart(2, "0")} ${currentTime.ampm}`;

  // Create a new object or update the existing one
  const clockInOut = JSON.parse(localStorage.getItem("clockInOut") || "{}");
  clockInOut.startTime = startTime;

  document.getElementById("clock-in-time").textContent = `In: ${startTime}`;
  localStorage.setItem("clockInOut", JSON.stringify(clockInOut));

  // Reload the page to show the timesheet
  // location.reload();
});

document.querySelector(".clock-out").addEventListener("click", function () {
  // Get the existing clock in/out data
  const clockInOut = JSON.parse(localStorage.getItem("clockInOut") || "{}");

  // If there's no start time, can't clock out
  if (!clockInOut.startTime) {
    alert("You need to clock in first!");
    return;
  }

  const currentTime = getCurrentTime();
  const endTime = `${currentTime.hours}:${currentTime.minutes
    .toString()
    .padStart(2, "0")} ${currentTime.ampm}`;

  clockInOut.endTime = endTime;
  document.getElementById("clock-out-time").textContent = `Out: ${endTime}`;
  localStorage.setItem("clockInOut", JSON.stringify(clockInOut));

  // Only proceed if both clock-in and clock-out times exist
  if (clockInOut.startTime && clockInOut.endTime) {
    let diff =
      timeToMinutes(clockInOut.endTime) - timeToMinutes(clockInOut.startTime);
    if (diff < 0) {
      diff += 24 * 60;
    }
    // Check if time difference is greater than or equal to 1 minute (was 15 minutes)
    if (diff >= 1) {
      // Create a new row with clock in/out times.
      if (state.timesheetBody) {
        // Check if the timesheet body exists first
        addRow(); // This adds a new row at the end
        const newRow = state.timesheetBody.lastElementChild;
        // Set default activity to "Break" and task to "Lunch"
        const selectedActivity = newRow.querySelector(".activity-dropdown");
        selectedActivity.value = "Break";
        selectedActivity.dispatchEvent(new Event("change"));
        const selectedTask = newRow.querySelector(".task-dropdown");
        selectedTask.value = "Lunch";
        // Set the new row's start time using clockInOut.startTime.
        const startTimePicker = newRow.querySelector(".start-time-picker");
        let [startTimeStr, startPeriod] = clockInOut.startTime.split(" ");
        let [startHours, startMinutes] = startTimeStr.split(":");
        startTimePicker.querySelector(".start-hours").value = startHours;
        startTimePicker.querySelector(".start-minutes").value = startMinutes;
        startTimePicker.querySelector(".start-ampm").value = startPeriod;
        updateTimeDisplay(startTimePicker, "start");
        // Set the new row's end time using clockInOut.endTime.
        const endTimePicker = newRow.querySelector(".end-time-picker");
        let [endTimeStr, endPeriod] = clockInOut.endTime.split(" ");
        let [endHours, endMinutes] = endTimeStr.split(":");
        endTimePicker.querySelector(".end-hours").value = endHours;
        endTimePicker.querySelector(".end-minutes").value = endMinutes;
        endTimePicker.querySelector(".end-ampm").value = endPeriod;
        updateTimeDisplay(endTimePicker, "end");
        console.log("New row added with clock in/out times.");
      }
    } else {
      console.log("Time difference is not greater than 1 minute.");
    }
  }
});

// DOM Manipulation Functions
function initializeDOM() {
  // Get the clock in/out data from localStorage
  const clockInOutData = localStorage.getItem("clockInOut");

  // Check if clock in data exists and is valid
  if (!clockInOutData) {
    // No clock in data found, show the message
    document.querySelector(
      ".form-container"
    ).innerHTML = `<b>Please clock in to see the timeSheet</b>`;
    return false;
  }

  // Parse the clock in data
  const clockInOut = JSON.parse(clockInOutData);

  // Check if the startTime exists
  if (!clockInOut.startTime) {
    // No start time found, show the message
    document.querySelector(
      ".form-container"
    ).innerHTML = `<b>Please clock in to see the timeSheet</b>`;
    return false;
  }

  const clockInTime = clockInOut.startTime;
  console.log(clockInTime);
  const clockOutTime = clockInOut?.endTime || false;

  const differenceMinutes =
    timeToMinutes(getCurrentTime().timeString) - timeToMinutes(clockInTime);
  console.log(differenceMinutes);
  const { hours, minutes } = minutesToTime(differenceMinutes);

  const inTimeSpan = document.getElementById("clock-in-eff-hrs");
  const inTime = inTimeSpan.textContent;
  const inTimeHrs = parseInt(inTime.substring(0, inTime.indexOf("h")));
  const inTimeMin = parseInt(
    inTime.substring(inTime.indexOf("h") + 2, inTime.indexOf("m"))
  );

  inTimeSpan.textContent = `${parseInt(hours) + inTimeHrs}h ${
    parseInt(minutes) + inTimeMin
  }m`;

  if (clockOutTime) {
    const differenceMinutes =
      timeToMinutes(clockInTime) - timeToMinutes(clockOutTime);
    console.log(differenceMinutes);
    const { hours, minutes } = minutesToTime(differenceMinutes);

    document.getElementById(
      "clock-out-eff-hrs"
    ).textContent = `Effective Hours: ${hours}h ${minutes}m `;
  }

  // If we got here, then the user is clocked in, continue initializing the form
  state.rowTemplate = document.getElementById("row-template");
  state.timesheetBody = document.getElementById("timesheet-body");
  state.addRowBtn = document.getElementById("add-row-btn");
  state.warningDiv = document.getElementById("showWarningDiv");
  state.warningMsg = document.getElementById("warning-msg");

  // Set today's date.
  document.getElementById("date").valueAsDate = new Date();

  // Event listeners for add row, warning popup, and outside clicks.
  state.addRowBtn.addEventListener("click", addRow);

  // For the warning popup, both OK (for delete) and Cancel hide the popup.
  document
    .querySelector(".closeBtn")
    .addEventListener("click", () => hideWarning());
  document
    .querySelector(".cancelBtn")
    .addEventListener("click", () => hideWarning());
  document.addEventListener("click", handleOutsideClick);

  // Comment character counter.
  const commentTextarea = document.querySelector(
    'textarea[name="comment-details"]'
  );
  commentTextarea.addEventListener("input", updateCommentCharCount);
  commentTextarea.addEventListener("input", enableSaveButton);

  // Delegate changes in the timesheet body to re-enable Save button.
  state.timesheetBody.addEventListener("input", enableSaveButton);

  // Create the initial row.
  addRow();

  return true;
}

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM content");
  initializeClockDisplays();
  if (initializeDOM()) {
    addValidationStyles();
    loadTimesheetFromLocalStorage();
    // Save button listener for local storage save (draft).
    document.getElementById("save-btn").addEventListener("click", (e) => {
      e.preventDefault();
      saveTimesheetToLocalStorage("save");
    });
    document.getElementById("submit-btn").addEventListener("click", (e) => {
      e.preventDefault();
      saveTimesheetToLocalStorage("submit");
    });
  }
});

// Function to initialize clock displays from localStorage
function initializeClockDisplays() {
  const clockInOutData = localStorage.getItem("clockInOut");

  if (!clockInOutData) {
    // Set default values
    document.getElementById("clock-in-time").textContent = "In: --:-- --";
    document.getElementById("clock-out-time").textContent = "Out: --:-- --";
    document.getElementById("clock-in-eff-hrs").textContent =
      "Effective Hours: 0h 0m";
    document.getElementById("clock-out-eff-hrs").textContent =
      "Break Hours: 0h 0m";
    return;
  }

  const clockInOut = JSON.parse(clockInOutData);

  // Update clock in/out times if they exist
  if (clockInOut.startTime) {
    document.getElementById(
      "clock-in-time"
    ).textContent = `In: ${clockInOut.startTime}`;
  } else {
    document.getElementById("clock-in-time").textContent = "In: --:-- --";
  }

  if (clockInOut.endTime) {
    document.getElementById(
      "clock-out-time"
    ).textContent = `Out: ${clockInOut.endTime}`;
  } else {
    document.getElementById("clock-out-time").textContent = "Out: --:-- --";
  }

  // Update hours
  // updateClockHoursDisplay();
}
