// Timesheet Functional Implementation

// Configuration
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
let state = {
  rowCounter: 0,
  rowTemplate: null,
  timesheetBody: null,
  addRowBtn: null,
  warningDiv: null,
  warningMsg: null,
  imageForTask: null,
};

// Utility Functions
function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return {
    hours: displayHours,
    minutes,
    ampm,
  };
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

// Time Validation Functions
function validateTimeBetweenRows() {
  const rows = document.querySelectorAll("#timesheet-body .field-row");
  let previousEndTime = null;

  for (let i = 0; i < rows.length; i++) {
    const currentRow = rows[i];
    const startTimeText =
      currentRow.querySelector(".start-time-text").textContent;
    const endTimeText = currentRow.querySelector(".end-time-text").textContent;
    const startTimeDisplay = currentRow.querySelector(".start-time-display");
    const endTimeDisplay = currentRow.querySelector(".end-time-display");

    // Reset previous error messages
    const previousStartTimeError =
      currentRow.querySelector(".start-time-error");
    const previousEndTimeError = currentRow.querySelector(".end-time-error");
    if (previousStartTimeError) previousStartTimeError.remove();
    if (previousEndTimeError) previousEndTimeError.remove();

    // Convert times to minutes for comparison
    const startMinutes = timeToMinutes(startTimeText);
    const endMinutes = timeToMinutes(endTimeText);

    // Validate end time is after start time
    if (endMinutes <= startMinutes) {
      const errorSpan = document.createElement("span");
      errorSpan.textContent = "End time must be after start time";
      errorSpan.classList.add("time-error", "start-time-error");
      errorSpan.style.color = "red";
      errorSpan.style.fontSize = "0.8em";
      startTimeDisplay.parentNode.insertBefore(
        errorSpan,
        startTimeDisplay.nextSibling
      );
      return false;
    }

    // Validate start time against previous row's end time
    if (previousEndTime !== null && startMinutes < previousEndTime) {
      const errorSpan = document.createElement("span");
      errorSpan.textContent =
        "Start time must be after previous row's end time";
      errorSpan.classList.add("time-error", "start-time-error");
      errorSpan.style.color = "red";
      errorSpan.style.fontSize = "0.8em";
      startTimeDisplay.parentNode.insertBefore(
        errorSpan,
        startTimeDisplay.nextSibling
      );
      return false;
    }

    // Update previous end time for next iteration
    previousEndTime = endMinutes;
  }

  return true;
}

// DOM Manipulation Functions
function initializeDOM() {
  state.rowTemplate = document.getElementById("row-template");
  state.timesheetBody = document.getElementById("timesheet-body");
  state.addRowBtn = document.getElementById("add-row-btn");
  state.warningDiv = document.getElementById("showWarningDiv");
  state.warningMsg = document.getElementById("warning-msg");
  state.imageForTask = document.getElementById("activity-dropdown-img");

  // Set today's date
  document.getElementById("date").valueAsDate = new Date();

  // Add event listeners
  state.addRowBtn.addEventListener("click", addRow);
  document.querySelector(".closeBtn").addEventListener("click", hideWarning);
  document.addEventListener("click", handleOutsideClick);

  // Initialize comment character counter
  const commentTextarea = document.querySelector(
    'textarea[name="comment-details"]'
  );
  const commentTextareaSpan = document.querySelector(
    'textarea[name="comment-details"] '
  );
  commentTextarea.addEventListener("input", updateCommentCharCount);

  // Create first row
  addRow();
}

function updateCommentCharCount(event) {
  const count = event.target.value.length;
  document.getElementById("char-count").textContent = `${count}/255`;
}

function addRow() {
  if (state.rowCounter >= 11) {
    showWarning("Cannot add more than 12 rows");
    return;
  }

  // Clone the template content
  const newRowElement = state.rowTemplate.content.cloneNode(true);
  const newRow = newRowElement.querySelector(".field-row");

  // Set unique identifier
  newRow.id = `row-${state.rowCounter}`;

  // Populate activity dropdown
  const activityDropdown = newRow.querySelector(".activity-dropdown");
  populateActivityDropdown(activityDropdown);

  // Populate initial task dropdown
  const taskDropdown = newRow.querySelector(".task-dropdown");
  const imageType = newRow.querySelector("#activity-dropdown-img");
  populateTaskDropdown(activityDropdown, taskDropdown, imageType);

  // Setup row-specific event listeners
  setupRowListeners(newRow);

  // Append to table body
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

function populateTaskDropdown(activityDropdown, taskDropdown, imageType) {
  const selectedActivity = activityDropdown.value;

  if (imageType) {
    imageType.innerHTML =
      selectedActivity === "Break"
        ? `<i class="fa-solid fa-mug-hot" style="color:orange"></i>`
        : `<i class="fa-solid fa-briefcase">`;
  }

  const tasks = ACTIVITY_TASKS[selectedActivity] || [];

  // Clear current options
  taskDropdown.innerHTML = "";

  // Add new options
  tasks.forEach((task) => {
    const option = document.createElement("option");
    option.value = task;
    option.textContent = task;
    taskDropdown.appendChild(option);
  });
}

function validateTimesheet() {
  const rows = document.querySelectorAll("#timesheet-body .field-row");
  const requiredFields = [];

  // Validate each row
  rows.forEach((row, index) => {
    const rowErrors = {
      rowIndex: index,
      missingFields: [],
    };

    // Validate Activity Dropdown
    const activityDropdown = row.querySelector(".activity-dropdown");
    if (!activityDropdown.value) {
      rowErrors.missingFields.push(activityDropdown);
    }

    // Validate Task Dropdown
    const taskDropdown = row.querySelector(".task-dropdown");
    if (!taskDropdown.value) {
      rowErrors.missingFields.push(taskDropdown);
    }

    // Validate Task Details
    const taskDetails = row.querySelector(".task-details");
    if (!taskDetails.value.trim()) {
      rowErrors.missingFields.push(taskDetails);
    }

    // Validate Start Time
    const startTimeText = row.querySelector(".start-time-text");
    if (startTimeText.textContent === "12:00 AM") {
      rowErrors.missingFields.push(row.querySelector(".start-time-display"));
    }

    // Validate End Time
    const endTimeText = row.querySelector(".end-time-text");
    if (endTimeText.textContent === "12:00 AM") {
      rowErrors.missingFields.push(row.querySelector(".end-time-display"));
    }

    // If any required fields are missing
    if (rowErrors.missingFields.length > 0) {
      requiredFields.push(rowErrors);
    }
  });

  // If there are missing fields, show warning and return false
  if (requiredFields.length > 0) {
    // Focus on the first missing field of the first row with errors
    const firstErrorRow = requiredFields[0];
    const firstMissingField = firstErrorRow.missingFields[0];

    // Add error styling
    requiredFields.forEach((errorRow) => {
      errorRow.missingFields.forEach((field) => {
        field.classList.add("error-field");
      });
    });

    // Focus on the first missing field
    firstMissingField.focus();

    // Optional: Scroll to the row with errors
    const rowToScroll = document.getElementById(
      `row-${firstErrorRow.rowIndex}`
    );
    if (rowToScroll) {
      rowToScroll.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Show error message
    showWarning("Please fill in all required fields.");
    return false;
  }

  // Additional time validation
  if (!validateTimeBetweenRows()) {
    showWarning("Please correct time entries.");
    return false;
  }

  return true;
}

function setupSubmitButton() {
  const submitButtons = document.querySelectorAll(".submit-btns button");

  submitButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      // Prevent default form submission
      event.preventDefault();

      // Validate the timesheet
      if (validateTimesheet()) {
        // If validation passes, you can proceed with submission
        console.log("Timesheet is valid. Proceeding with submission...");
        // Add your submission logic here
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

function setupRowListeners(row) {
  const activityDropdown = row.querySelector(".activity-dropdown");
  const taskDropdown = row.querySelector(".task-dropdown");
  const taskDetails = row.querySelector(".task-details");
  const taskDetailsSpan = row.querySelector(".task-details-warning");
  const imageType = row.querySelector("#activity-dropdown-img");
  const charCount = row.querySelector(".char-count");
  const deleteBtn = row.querySelector(".delete-row");

  // Activity dropdown change handler
  activityDropdown.addEventListener("change", () => {
    populateTaskDropdown(activityDropdown, taskDropdown, imageType);
  });

  // Task details character counter
  taskDetails.addEventListener("input", () => {
    taskDetailsSpan.style.visibility = "hidden";
    const count = taskDetails.value.length;
    charCount.textContent = `${count}/255`;
  });
  taskDetails.addEventListener("blur", () => {
    const count = taskDetails.value.length;
    if (count === 0) {
      taskDetailsSpan.style.visibility = "visible";
      taskDetailsSpan.textContent = "*Can't be empty";
    }
  });

  enhanceRowListeners(row);

  // Time picker dropdowns
  const startTimePicker = row.querySelector(".start-time-picker");
  const endTimePicker = row.querySelector(".end-time-picker");

  setupTimePicker(startTimePicker, "start");
  setupTimePicker(endTimePicker, "end");

  // Delete row button
  deleteBtn.addEventListener("click", () => deleteRow(row));
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
    });

    // Special handling for time displays
    if (
      field.classList.contains("start-time-display") ||
      field.classList.contains("end-time-display")
    ) {
      field.addEventListener("click", () => {
        field.classList.remove("error-field");

        // Remove any existing time error messages
        const existingErrors = field
          .closest(".field-row")
          .querySelectorAll(".time-error");
        existingErrors.forEach((error) => error.remove());
      });
    }
  });
}

function setupTimePicker(timePicker, type) {
  const timeDisplay = timePicker.querySelector(`.${type}-time-display`);
  const timeDropdown = timePicker.querySelector(`.${type}-time-dropdown`);
  const hoursInput = timePicker.querySelector(`.${type}-hours`);
  const minutesInput = timePicker.querySelector(`.${type}-minutes`);
  const ampmSelect = timePicker.querySelector(`.${type}-ampm`);

  // Initialize with current time
  const currentTime = getCurrentTime();
  hoursInput.value = currentTime.hours.toString().padStart(2, "0");
  minutesInput.value = currentTime.minutes.toString().padStart(2, "0");
  ampmSelect.value = currentTime.ampm;

  // Time display toggle
  timeDisplay.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleTimeDropdown(timeDropdown);
  });

  // Up/Down buttons for hours and minutes
  const hourUpBtn = timePicker.querySelector(`.${type}-hours-up`);
  const hourDownBtn = timePicker.querySelector(`.${type}-hours-down`);
  const minuteUpBtn = timePicker.querySelector(`.${type}-minutes-up`);
  const minuteDownBtn = timePicker.querySelector(`.${type}-minutes-down`);

  
  [hoursInput, minutesInput, ampmSelect].forEach((input) => {
    input.addEventListener("input", validateTimeBetweenRows);
    input.addEventListener("change", validateTimeBetweenRows);
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

  // Update time on blur or change
  [hoursInput, minutesInput, ampmSelect].forEach((el) => {
    el.addEventListener("blur", () => updateTimeDisplay(timePicker, type));
    el.addEventListener("change", () => updateTimeDisplay(timePicker, type));

    // Add event listeners to remove error messages when time is corrected
    el.addEventListener("change", () => {
      // Remove any existing time error messages
      const existingErrors = timePicker
        .closest(".field-row")
        .querySelectorAll(".time-error");
      existingErrors.forEach((error) => error.remove());
    });
  });
}

function toggleTimeDropdown(dropdown) {
  // Close all other dropdowns
  document.querySelectorAll(".time-dropdown").forEach((dd) => {
    if (dd !== dropdown) dd.classList.add("hidden");
  });

  // Toggle selected dropdown
  dropdown.classList.toggle("hidden");
}

function changeTime(input, increment, type) {
  let value = parseInt(input.value) + increment;

  if (type === "hours") {
    value = value > 12 ? 1 : value < 1 ? 12 : value;
  } else if (type === "minutes") {
    value = value > 59 ? 0 : value < 0 ? 59 : value;
  }

  input.value = value.toString().padStart(2, "0");
  updateTimeDisplay(
    input.closest(".time-picker"),
    input.classList.contains("start-hours") ||
      input.classList.contains("start-minutes")
      ? "start"
      : "end"
  );
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

  // Update duration if both start and end times are set
  updateDuration(timePicker.closest(".field-row"));
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
  // Ensure at least one row remains
  if (state.timesheetBody.children.length > 1) {
    state.timesheetBody.removeChild(row);
    state.rowCounter--;
  } else {
    showWarning("You must keep at least one row.");
  }
}

function handleOutsideClick(event) {
  const dropdowns = document.querySelectorAll(".time-dropdown");
  const isClickInsideDropdown = Array.from(dropdowns).some(
    (dropdown) =>
      dropdown.contains(event.target) ||
      event.target.closest(".time-display") === dropdown.previousElementSibling
  );

  if (!isClickInsideDropdown) {
    dropdowns.forEach((dropdown) => {
      dropdown.classList.add("hidden");
    });
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

// Initialize on DOM Content Loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeDOM();
  addValidationStyles();
  setupSubmitButton();
});
