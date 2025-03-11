const ACTIVITY_TASKS = {
  Training: [
    "Self Learning",
    "Assignment",
    "1:1 Discussion",
    "Session",
    "Doubts Clarification",
  ],
  Break: ["Lunch", "Snacks", "Personal Reasons"],
  "HR activities": [
    "Employee Engagaement",
    "Celebration Events",
    "All hands meet",
    "Others",
  ],
  COE: ["Training", "POC", "Accelerators", "Audit", "Others"],
  Miscellaneous: ["Miscellaneous"],
};
const state = {
  rowCounter: 0,
  rowTemplate: null,
  timesheetBody: null,
  addRowBtn: null,
  warningDiv: null,
  warningMsg: null,
  unsavedChanges: false,
};
// get the current time
function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return {
    timeString: `${displayHours}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`,
    hours: displayHours,
    minutes: minutes.toString().padStart(2, "0"),
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
//changes minutes to time
function minutesToTime(totalMinutes) {
  totalMinutes = totalMinutes % (24 * 60);
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
    ampm,
  };
}
// to calculate durations between two given times
function calculateDuration(startTimeText, endTimeText) {
  const startMinutes = timeToMinutes(startTimeText);
  const endMinutes = timeToMinutes(endTimeText);
  let durationMinutes = endMinutes - startMinutes;
  if (durationMinutes < 0) durationMinutes += 24 * 60;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return `${hours}h ${minutes}m`;
}
// to show error text span
function createErrorSpan(message) {
  const span = document.createElement("span");
  span.textContent = message;
  span.classList.add("time-error");
  return span;
}
// to split row
function splitRowAlternative(row) {
  // Get current row's time values
  const startTimeText = row.querySelector(".start-time-text").textContent;
  const endTimeText = row.querySelector(".end-time-text").textContent;
  if (startTimeText === "Start Time" || endTimeText === "End Time") {
    showWarning("Cannot split the row,please choose both times");
    return;
  }
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
  // Update current row's end time
  row.querySelector(".end-time-text").textContent = splitTimeObj.timeString;
  const endPicker = row.querySelector(".end-time-picker");
  endPicker.querySelector(".end-hours").value = splitTimeObj.hours;
  endPicker.querySelector(".end-minutes").value = splitTimeObj.minutes;
  endPicker.querySelector(".end-ampm").value = splitTimeObj.ampm;
  updateDuration(row);
  // Create a new row
  addRow();
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
  // Set new row start time (split time)
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
}
// to validate times on same row and current and previpus row
function validateRowTime(specificRow = null) {
  // Determine which rows to validate
  const allRows = state.timesheetBody.querySelectorAll(".field-row");
  const rowsToValidate = specificRow ? [specificRow] : allRows;
  let previousEndMinutes = null;
  let valid = true;
  // Clear errors only from rows being validated
  rowsToValidate.forEach((row) =>
    row.querySelectorAll(".time-error").forEach((err) => err.remove())
  );
  // For single row validation, get previous row's end time if applicable
  if (specificRow) {
    const rows = Array.from(state.timesheetBody.children);
    const currentIndex = rows.indexOf(specificRow);
    if (currentIndex > 0) {
      const prevRow = rows[currentIndex - 1];
      const prevEndTimeText =
        prevRow.querySelector(".end-time-text").textContent;
      previousEndMinutes = timeToMinutes(prevEndTimeText);
    }
  }
  // Validate each row
  rowsToValidate.forEach((row) => {
    const startTimeText = row.querySelector(".start-time-text").textContent;
    const endTimeText = row.querySelector(".end-time-text").textContent;
    const startTimeDisplay = row.querySelector(".start-time-display");
    const endTimeDisplay = row.querySelector(".end-time-display");
    // Parse time values
    const [sTime] = startTimeText.split(" ");
    const [sHours, sMinutes] = sTime.split(":").map(Number);
    const [eTime] = endTimeText.split(" ");
    const [eHours, eMinutes] = eTime.split(":").map(Number);
    const startMinutes = timeToMinutes(startTimeText);
    const endMinutes = timeToMinutes(endTimeText);
    // Validate time format
    if (sHours < 0 || sHours > 12 || sMinutes < 0 || sMinutes >= 60) {
      startTimeDisplay.parentNode.insertBefore(
        createErrorSpan("Enter valid time"),
        startTimeDisplay.nextSibling
      );
      valid = false;
    }
    if (eHours < 0 || eHours > 12 || eMinutes < 0 || eMinutes >= 60) {
      endTimeDisplay.parentNode.insertBefore(
        createErrorSpan("Enter valid time"),
        endTimeDisplay.nextSibling
      );
      valid = false;
    }
    // Validate end time is after start time
    if (endMinutes < startMinutes) {
      startTimeDisplay.parentNode.insertBefore(
        createErrorSpan("End time must be after start time"),
        startTimeDisplay.nextSibling
      );
      valid = false;
    }
    // Validate against previous row's end time
    if (previousEndMinutes !== null && startMinutes < previousEndMinutes) {
      startTimeDisplay.parentNode.insertBefore(
        createErrorSpan("Start time must be after previous row's end time"),
        startTimeDisplay.nextSibling
      );
      valid = false;
    }
    // Update previous end time for next iteration
    previousEndMinutes = endMinutes;
  });
  return valid;
}
//to validate entire timesheet for any missing required fields
function validateTimesheet() {
  const rows = state.timesheetBody.querySelectorAll(".field-row");
  const missingFields = [];
  rows.forEach((row, index) => {
    row
      .querySelectorAll(".error-field")
      .forEach((field) => field.classList.remove("error-field"));
    const fieldsToCheck = [
      { selector: ".activity-dropdown", condition: (el) => !el.value },
      { selector: ".task-dropdown", condition: (el) => !el.value },
      { selector: ".task-details", condition: (el) => !el.value.trim() },
      {
        selector: ".start-time-display",
        condition: () =>
          row.querySelector(".start-time-text").textContent === "Start Time",
      },
      {
        selector: ".end-time-display",
        condition: () =>
          row.querySelector(".end-time-text").textContent === "End Time",
      },
    ];
    fieldsToCheck.forEach(({ selector, condition }) => {
      const field = row.querySelector(selector);
      if (condition(field)) {
        missingFields.push({ field, rowIndex: index });
      }
    });
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
    return false;
  }
  return true;
}
//function to add new row to timesheet
function addRow() {
  if (state.rowCounter >= 12) {
    showWarning("Cannot add more than 12 rows");
    return false;
  }
  const newRowFragment = state.rowTemplate.content.cloneNode(true);
  const newRow = newRowFragment.querySelector(".field-row");
  newRow.id = `row-${state.rowCounter}`;
  // Populate dropdowns
  const activityDropdown = newRow.querySelector(".activity-dropdown");
  populateActivityDropdown(activityDropdown);
  const taskDropdown = newRow.querySelector(".task-dropdown");
  const activityIcon = newRow.querySelector(".activity-icon");
  populateTaskDropdown(activityDropdown, taskDropdown, activityIcon);
  setupRowListeners(newRow);
  state.timesheetBody.appendChild(newRow);
  state.rowCounter++;
  // return true; //(check later)
}
// to update the duration in a row
function updateDuration(row) {
  const startTimeText = row.querySelector(".start-time-text").textContent;
  const endTimeText = row.querySelector(".end-time-text").textContent;
  const durationElement = row.querySelector(".duration");
  if (startTimeText !== "Start Time" && endTimeText !== "End Time") {
    durationElement.textContent = calculateDuration(startTimeText, endTimeText);
  }
  // Calculate total durations for all rows
  let totalEffectiveMinutes = 0;
  let totalBreakMinutes = 0;
  state.timesheetBody.querySelectorAll(".field-row").forEach((r) => {
    const sTime = r.querySelector(".start-time-text").textContent;
    const eTime = r.querySelector(".end-time-text").textContent;
    const activity = r.querySelector(".activity-dropdown").value;
    if (sTime !== "Start Time" && eTime !== "End Time") {
      let startMin = timeToMinutes(sTime);
      let endMin = timeToMinutes(eTime);
      let minutes = endMin - startMin;
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

//to show selected time on the time picker
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
}
// Setup Functions
function setupTimePicker(timePicker, type) {
  const timeDisplay = timePicker.querySelector(`.${type}-time-display`);
  const timeDropdown = timePicker.querySelector(`.${type}-time-dropdown`);
  const hoursInput = timePicker.querySelector(`.${type}-hours`);
  const minutesInput = timePicker.querySelector(`.${type}-minutes`);
  const ampmSelect = timePicker.querySelector(`.${type}-ampm`);
  // Set default time
  const currentTime = getCurrentTime();
  hoursInput.value = currentTime.hours.toString().padStart(2, "0");
  minutesInput.value = currentTime.minutes;
  ampmSelect.value = currentTime.ampm;
  // Attach event listeners to both time pickers
  timeDisplay.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleTimeDropdown(timeDropdown);
  });
  const hourUpBtn = timePicker.querySelector(`.${type}-hours-up`);
  const hourDownBtn = timePicker.querySelector(`.${type}-hours-down`);
  const minuteUpBtn = timePicker.querySelector(`.${type}-minutes-up`);
  const minuteDownBtn = timePicker.querySelector(`.${type}-minutes-down`);

  // Input change events
  [hoursInput, minutesInput, ampmSelect].forEach((input) => {
    input.addEventListener("input", () => {
      updateTimeDisplay(timePicker, type);
    });

    input.addEventListener("change", () => {
      updateTimeDisplay(timePicker, type);
      const row = timePicker.closest(".field-row");
      row.querySelectorAll(".time-error").forEach((err) => err.remove());
    });
  });
  // Time adjustment buttons
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

//to toggle all dropdowns
function toggleTimeDropdown(dropdown) {
  document.querySelectorAll(".time-dropdown").forEach((dd) => {
    if (dd !== dropdown) dd.classList.add("hidden");
  });
  dropdown.classList.toggle("hidden");
}

function setupRowListeners(row) {
  const activityDropdown = row.querySelector(".activity-dropdown");
  const taskDropdown = row.querySelector(".task-dropdown");
  const taskDetails = row.querySelector(".task-details");
  const taskDetailsWarning = row.querySelector(".task-details-warning");
  const activityIcon = row.querySelector(".activity-icon");
  const charCount = row.querySelector(".char-count");
  const deleteBtn = row.querySelector(".delete-row");
  const splitBtn = row.querySelector(".split-row");
  // Activity dropdown change
  activityDropdown.addEventListener("change", () => {
    populateTaskDropdown(activityDropdown, taskDropdown, activityIcon);
    updateDuration(row);
  });
  // Task details input
  taskDetails.addEventListener("input", () => {
    const count = taskDetails.value.length;
    charCount.textContent = `${count}/255`;
    taskDetailsWarning.style.visibility = count === 0 ? "visible" : "hidden";
    if (count === 0) {
      taskDetailsWarning.textContent = "*Can't be empty";
    }
  });
  // Time picker setup
  setupTimePicker(row.querySelector(".start-time-picker"), "start");
  setupTimePicker(row.querySelector(".end-time-picker"), "end");
  // Delete and split buttons
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => showDeleteWarning(row));
  }
  if (splitBtn) {
    splitBtn.addEventListener("click", () => {
      splitRowAlternative(row);
    });
  }
}

// Clock In/Out Functions
function initializeClockDisplays() {
  let clockIn = localStorage.getItem("clockInTime");
  let clockOut = localStorage.getItem("clockOutTime");
  // console.log(clockOut);
  if (!clockIn) {
    // Set default values
    document.getElementById("clock-in-time").textContent = "In: --:-- --";
    document.getElementById("clock-out-time").textContent = "Out: --:-- --";
    document.getElementById("clock-in-eff-hrs").textContent = "0h 0m";
    document.getElementById("clock-out-eff-hrs").textContent = "0h 0m";
    return;
  }
  clockIn = JSON.parse(clockIn).startTime;
  clockOut = JSON.parse(clockOut)?.endTime;
  // Update clock in/out times if they exist
  document.getElementById("clock-in-time").textContent = clockIn
    ? `In: ${clockIn}`
    : "In: --:-- --";
  document.getElementById("clock-out-time").textContent = clockOut
    ? `Out: ${clockOut}`
    : "Out: --:-- --";
  const clockInTime = clockIn;
}

// Initialization Functions
function initializeDOM() {
  const clockInData = JSON.parse(localStorage.getItem("clockInTime"));
  const clockOutData = JSON.parse(localStorage.getItem("clockOutTime"));
  if (!clockInData) {
    document.querySelector(
      ".form-container"
    ).innerHTML = `<b>Please clock in to see the timeSheet</b>`;
    return false;
  }
  // Calculate effective hours
  const clockInTime = clockInData.startTime;
  if (!clockOutData) {
    const differenceMinutes =
      timeToMinutes(getCurrentTime().timeString) - timeToMinutes(clockInTime);
    const { hours, minutes } = minutesToTime(differenceMinutes);
    // Update effective hours display
    const inTimeSpan = document.getElementById("clock-in-eff-hrs");
    const inTime = inTimeSpan.textContent;
    console.log("Intime:", inTime);
    const inTimeHrs = parseInt(inTime.substring(0, inTime.indexOf("h")));
    const inTimeMin = parseInt(
      inTime.substring(inTime.indexOf("h") + 1, inTime.indexOf("m"))
    );
    inTimeSpan.textContent = `${parseInt(hours) + inTimeHrs}h ${
      parseInt(minutes) + inTimeMin
    }m`;
  } else {
    const timeArray = JSON.parse(localStorage.getItem("timeArray"));
    let totalEffectiveMinutes = 0;
    let totalBreakMinutes = 0;
    // Effective hours: Sum of (outTime - inTime) for each record.
    timeArray.forEach((obj) => {
      let start = timeToMinutes(obj.inTime);
      let end = timeToMinutes(obj.outTime);
      let diff = end - start;
      if (diff < 0) diff += 24 * 60; // handle crossing midnight
      totalEffectiveMinutes += diff;
    });

    // Break hours: Sum of (next inTime - current outTime) between consecutive records.
    for (let i = 0; i < timeArray.length - 1; i++) {
      let currentOut = timeToMinutes(timeArray[i].outTime);
      let nextIn = timeToMinutes(timeArray[i + 1].inTime);
      let breakDiff = nextIn - currentOut;
      if (breakDiff < 0) breakDiff += 24 * 60;
      totalBreakMinutes += breakDiff;
    }

    const { hours: eHours, minutes: eMinutes } = minutesToTime(
      totalEffectiveMinutes
    );
    const { hours: bHours, minutes: bMinutes } =
      minutesToTime(totalBreakMinutes);

    const inTimeSpan = document.getElementById("clock-in-eff-hrs");
    inTimeSpan.textContent = `${eHours}h ${eMinutes}m`;
    const outTimeSpan = document.getElementById("clock-out-eff-hrs");
    outTimeSpan.textContent = `${bHours}h ${bMinutes}m`;
  }
  // Initialize state variables
  state.rowTemplate = document.getElementById("row-template");
  state.timesheetBody = document.getElementById("timesheet-body");
  state.addRowBtn = document.getElementById("add-row-btn");
  state.warningDiv = document.getElementById("showWarningDiv");
  state.warningMsg = document.getElementById("warning-msg");
  // Set today's date
  document.getElementById("date").valueAsDate = new Date();
  // Add event listeners
  state.addRowBtn.addEventListener("click", addRow);
  document.querySelector(".okBtn").addEventListener("click", hideWarning);
  document.querySelector(".cancelBtn").addEventListener("click", hideWarning);
  document.addEventListener("click", handleOutsideClick);

  // Comment textarea
  const commentTextarea = document.querySelector(
    'textarea[name="comment-details"]'
  );
  commentTextarea.addEventListener("input", updateCommentCharCount);
  // Create initial row
  addRow();
  return true;
}

function addValidationStyles() {
  const style = document.createElement("style");
  style.textContent = `
      .error-field {
        border-bottom: 2px solid red !important;
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
function disableFormFields() {
  document
    .querySelectorAll("input, select, textarea, button, .time-display")
    .forEach((el) => (el.disabled = true));
}
// Clock in/out event handlers
document.querySelector(".clock-in").addEventListener("click", function () {
  const currentTime = getCurrentTime();
  const startTime = `${currentTime.hours}:${currentTime.minutes} ${currentTime.ampm}`;

  const clockInTime = JSON.parse(localStorage.getItem("clockInTime") || "{}");
  clockInTime.startTime = startTime;
  document.getElementById("clock-in-time").textContent = `In: ${startTime}`;
  localStorage.setItem("clockInTime", JSON.stringify(clockInTime));
  this.disabled = true;
  document.querySelector(".clock-out").disabled = false;
});

document.querySelector(".clock-out").addEventListener("click", function () {
  const clockInTime = JSON.parse(localStorage.getItem("clockInTime") || "{}");
  if (!clockInTime.startTime) {
    alert("You need to clock in first!");
    return;
  }
  const currentTime = getCurrentTime();
  const endTime = `${currentTime.hours}:${currentTime.minutes} ${currentTime.ampm}`;

  const clockOutTime = JSON.parse(localStorage.getItem("clockOutTime") || "{}");
  clockOutTime.endTime = endTime;
  document.getElementById("clock-out-time").textContent = `Out: ${endTime}`;
  localStorage.setItem("clockOutTime", JSON.stringify(clockOutTime));

  const clockInOutTimes = {};
  clockInOutTimes.inTime = JSON.parse(
    localStorage.getItem("clockInTime")
  ).startTime;
  clockInOutTimes.outTime = JSON.parse(
    localStorage.getItem("clockOutTime")
  ).endTime;
  console.log(clockInOutTimes);
  let storedArray = JSON.parse(localStorage.getItem("timeArray") || "[]");
  storedArray.push(clockInOutTimes);
  localStorage.setItem("timeArray", JSON.stringify(storedArray));

  // Create a new row if appropriate time difference
  console.log("enter");

  if (clockInTime.startTime && clockOutTime.endTime) {
    console.log("enter");
    let diff =
      timeToMinutes(clockOutTime.endTime) -
      timeToMinutes(clockInTime.startTime);
    if (diff < 0) diff += 24 * 60;
    if (diff >= 1 && state.timesheetBody) {
      addRow();
      const newRow = state.timesheetBody.lastElementChild;
      // Set default values
      const selectedActivity = newRow.querySelector(".activity-dropdown");
      selectedActivity.value = "Break";
      selectedActivity.dispatchEvent(new Event("change"));
      newRow.querySelector(".task-dropdown").value = "Lunch";
      // Set times from clock in/out
      const startTimePicker = newRow.querySelector(".start-time-picker");
      const [startTimeStr, startPeriod] = clockInTime.startTime.split(" ");
      const [startHours, startMinutes] = startTimeStr.split(":");
      startTimePicker.querySelector(".start-hours").value = startHours;
      startTimePicker.querySelector(".start-minutes").value = startMinutes;
      startTimePicker.querySelector(".start-ampm").value = startPeriod;
      updateTimeDisplay(startTimePicker, "start");
      const endTimePicker = newRow.querySelector(".end-time-picker");
      const [endTimeStr, endPeriod] = clockOutTime.endTime.split(" ");
      const [endHours, endMinutes] = endTimeStr.split(":");
      endTimePicker.querySelector(".end-hours").value = endHours;
      endTimePicker.querySelector(".end-minutes").value = endMinutes;
      endTimePicker.querySelector(".end-ampm").value = endPeriod;
      updateTimeDisplay(endTimePicker, "end");
    }
  }
  this.disabled = true;
  document.querySelector(".clock-in").disabled = false;
});

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

function updateCommentCharCount(event) {
  const count = event.target.value.length;
  document.getElementById("char-count").textContent = `${count}/255`;
}

function deleteRow(row) {
  if (state.timesheetBody.children.length > 1) {
    state.timesheetBody.removeChild(row);
    state.rowCounter--;
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
}

function hideWarning() {
  state.warningDiv.style.display = "none";
}
// Custom Delete Warning Popup
function showDeleteWarning(row) {
  state.warningMsg.textContent = "Are you sure you want to delete this row?";
  state.warningDiv.style.display = "flex";
  const okBtn = state.warningDiv.querySelector(".okBtn");
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
  console.log("Timesheet is valid.");

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
function setupSaveButtonEventDelegation() {
  // Add listeners to the timesheet form container
  const formContainer = document.querySelector(".form-container");
  // Listen for input events on all form elements
  formContainer.addEventListener("input", (event) => {
    // Check if the event target is a form control
    if (
      event.target.tagName === "INPUT" ||
      event.target.tagName === "SELECT" ||
      event.target.tagName === "TEXTAREA"
    ) {
      enableSaveButton();
    }
  });
  // Listen for clicks on time displays
  formContainer.addEventListener("click", (event) => {
    if (
      event.target.classList.contains("time-display") ||
      event.target.classList.contains("start-time-display") ||
      event.target.classList.contains("end-time-display")
    ) {
      enableSaveButton();
    }
  });
  // Listen for changes to time values
  formContainer.addEventListener("change", (event) => {
    if (
      event.target.classList.contains("start-hours") ||
      event.target.classList.contains("start-minutes") ||
      event.target.classList.contains("start-ampm") ||
      event.target.classList.contains("end-hours") ||
      event.target.classList.contains("end-minutes") ||
      event.target.classList.contains("end-ampm")
    ) {
      enableSaveButton();
    }
  });
}
// Initialization
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM content loaded");
  initializeClockDisplays();
  if (initializeDOM()) {
    addValidationStyles();
    loadTimesheetFromLocalStorage();
    setupSaveButtonEventDelegation();
    document.getElementById("save-btn").addEventListener("click", (e) => {
      e.preventDefault();
      saveTimesheetToLocalStorage("save");
    });
    document.getElementById("submit-btn").addEventListener("click", (e) => {
      e.preventDefault();
      saveTimesheetToLocalStorage("submit");
      document.getElementById("state").textContent = "Submitted";
      document.getElementById("state").style.color = "green";
    });
  }
});
