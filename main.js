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
const MAX_ROWS=12
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

//  utility funcion to convert time to minutes
function timeToMinutes(timeStr) {
  // Expects format: "HH:MM AM/PM"
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

//  utility funcion to changes minutes to time
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

// utility funcion to calculate durations between two given times
function calculateDuration(startTimeText, endTimeText) {
  const startMinutes = timeToMinutes(startTimeText);
  const endMinutes = timeToMinutes(endTimeText);
  let durationMinutes = endMinutes - startMinutes;
  if (durationMinutes < 0) durationMinutes += 24 * 60;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return `${hours}h ${minutes}m`;
}

// actual effective hours and break hours calculation ( from clock-in/out times stored in local storage as seperate arrays)
function calculateEffectiveAndBreakHours(inTimes, outTimes) {
  let totalEffectiveMinutes = 0;
  let totalBreakMinutes = 0;
  // Calculate effective hours (outTime - inTime for each entry)
  for (let i = 0; i < outTimes.length; i++) {
    let start = timeToMinutes(inTimes[i]);
    let end = timeToMinutes(outTimes[i]);
    let diff = end - start;
    if (diff < 0) diff += 24 * 60; // handle crossing midnight
    totalEffectiveMinutes += diff;
  }
  // If there is an extra inTime without a corresponding outTime, use current time
  if (inTimes.length > outTimes.length) {
    let lastInTime = timeToMinutes(inTimes[inTimes.length - 1]);
    let currentTime = timeToMinutes(getCurrentTime().timeString);
    let diff = currentTime - lastInTime;
    if (diff < 0) diff += 24 * 60; // handle crossing midnight
    totalEffectiveMinutes += diff;
  }
  for (let i = 0; i < outTimes.length; i++) {
    if (i + 1 < inTimes.length) {
      let currentOut = timeToMinutes(outTimes[i]);
      let nextIn = timeToMinutes(inTimes[i + 1]);
      let breakDiff = nextIn - currentOut;
      if (breakDiff < 0) breakDiff += 24 * 60;
      totalBreakMinutes += breakDiff;
    }
  }
  const { hours: eHours, minutes: eMinutes } = minutesToTime(
    totalEffectiveMinutes
  );
  const { hours: bHours, minutes: bMinutes } = minutesToTime(totalBreakMinutes);
  return {
    effective: `${eHours}h ${eMinutes}m`,
    break: `${bHours}h ${bMinutes}m`,
  };
}

//to check difference between actual times and row filled times
function checkActualEffectiveHrs() {
  const rowHrs = document.getElementById("total-effective-hours").textContent;
  const effective = document.getElementById("clock-in-eff-hrs").textContent;
  const parts1 = rowHrs.split("h");
  const hours1 = parseInt(parts1[0]);
  const minutes1 = parseInt(parts1[1].trim().replace("m", ""));
  const parts2 = effective.split("h");
  const hours2 = parseInt(parts2[0]);
  const minutes2 = parseInt(parts2[1].trim().replace("m", ""));
  // Convert to total minutes
  const totalMinutes1 = hours1 * 60 + minutes1;
  const totalMinutes2 = hours2 * 60 + minutes2;
  // Calculate difference
  const diffMinutes = totalMinutes1 - totalMinutes2;
  console.log(diffMinutes);
  if (diffMinutes >= 1) {
    const textarea = document.querySelector("textarea[name='comment-details']");
    if (textarea.value) {
      console.log("Enter here");
      document.querySelector(".comment-error").style.visibility = "hidden";
      return true;
    }
    textarea.focus();
    textarea.style.border= "1px solid red";

    document.querySelector(".comment-error").style.visibility = "visible";
    return false;
  } else {
    document.querySelector(".comment-error").style.visibility = "hidden";
    return true;
  }
}

// to create error text span
function createErrorSpan(message) {
  const span = document.createElement("span");
  span.textContent = message;
  span.classList.add("time-error");
  return span;
}

//to update comment character count
function updateCommentCharCount(event) {
  const count = event.target.value.length;
  document.getElementById("char-count").textContent = `${count}/255`;
}

//to delete the row
function deleteRow(row) {
  if (state.timesheetBody.children.length > 1) {
    state.timesheetBody.removeChild(row);
    state.rowCounter--;
    validateRowTime();
    updateDuration();
  } else {
    showWarning("You must keep at least one row.");
  }
}

// to show alert popup(takes a message of alert and two callbacks -> if okay is clicked or if cancel is clicked)
function showWarning(message, confirmAction = null, cancelAction = null) {
  document.querySelector(".overlay").style.display="block"
  state.warningMsg.textContent = message;
  state.warningDiv.style.display = "flex";
  const okBtn = state.warningDiv.querySelector(".okBtn");
  const cancelBtn = state.warningDiv.querySelector(".cancelBtn");
  // Remove any previous event listeners
  const newOkBtn = okBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  function okHandler() {
    hideWarning();
    if (confirmAction) confirmAction();
    cleanup();
  }
  function cancelHandler() {
    hideWarning();
    if (cancelAction) cancelAction();
    cleanup();
  }
  function cleanup() {
    newOkBtn.removeEventListener("click", okHandler);
    newCancelBtn.removeEventListener("click", cancelHandler);
  }
  // Add new event listeners
  newOkBtn.addEventListener("click", okHandler);
  newCancelBtn.addEventListener("click", cancelHandler);
}

//to hide alert popup
function hideWarning() {
  document.querySelector(".overlay").style.display="none"

  state.warningDiv.style.display = "none";  
}

// to split row
function splitRowAlternative(row) {
  // Get current row's time values
  const startTimeText = row.querySelector(".start-time-text").textContent;
  const endTimeText = row.querySelector(".end-time-text").textContent;
  if (startTimeText === "Start Time" || endTimeText === "End Time") {
    showWarning("Cannot split the row, please choose both times");
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
  setTimePickerValue('end', splitTimeObj.timeString, row);
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
  setTimePickerValue('start', splitTimeObj.timeString, newRow);
  // Set new row end time (original end time)
  setTimePickerValue('end', endTimeText, newRow);
  updateDuration(newRow);
}

//to close dropdowns when clicked anywhere in the document except on dropdown itself
function handleOutsideClick(event) {
  const dropdowns = document.querySelectorAll(".time-dropdown");
  if (![...dropdowns].some((dd) => dd.contains(event.target))) {
    dropdowns.forEach((dd) => dd.classList.add("hidden"));
  }
}

//to toggle all dropdowns
function toggleTimeDropdown(dropdown) {
  document.querySelectorAll(".time-dropdown").forEach((dd) => {
    if (dd !== dropdown) dd.classList.add("hidden");
  });
  dropdown.classList.toggle("hidden");
}

// to update the duration in a row
function calculateRowDuration(row) {
  const startTimeText = row.querySelector(".start-time-text").textContent;
  const endTimeText = row.querySelector(".end-time-text").textContent;
  const durationElement = row.querySelector(".duration");
  if (startTimeText !== "Start Time" && endTimeText !== "End Time") {
    durationElement.textContent = calculateDuration(startTimeText, endTimeText);
  }
}

// Function to calculate total effective and break hours for all rows
function calculateTotalDurations() {
  let totalEffectiveMinutes = 0;
  let totalBreakMinutes = 0;
  state.timesheetBody.querySelectorAll(".field-row").forEach((row) => {
    const sTime = row.querySelector(".start-time-text").textContent;
    const eTime = row.querySelector(".end-time-text").textContent;
    const activity = row.querySelector(".activity-dropdown").value;
    if (sTime !== "Start Time" && eTime !== "End Time") {
      let startMin = timeToMinutes(sTime);
      let endMin = timeToMinutes(eTime);
      let minutes = endMin - startMin;
      if (minutes < 0) minutes += 24 * 60; // Handle crossing midnight
      if (activity === "Break") {
        totalBreakMinutes += minutes;
      } else {
        totalEffectiveMinutes += minutes;
      }
    }
  });
  // Convert minutes to hours and minutes
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

//utility function to chnage durations in a row and also  overall effective hours shown in submit container
function updateDuration(row = null) {
  if (row) {
    calculateRowDuration(row);
  }
  calculateTotalDurations();
}

// to validate times on same row and current and previpus row
function validateRowTime(specificRow = null) {
  // Determine which rows to validate
  const allRows = state.timesheetBody.querySelectorAll(".field-row");
  const rowsArray = Array.from(allRows);
  // If validating a specific row, also validate the next row if it exists
  let rowsToValidate;
  if (specificRow) {
    const currentIndex = rowsArray.indexOf(specificRow);
    const nextRow =
      currentIndex < rowsArray.length - 1 ? rowsArray[currentIndex + 1] : null;
    rowsToValidate = nextRow ? [specificRow, nextRow] : [specificRow];
  } else {
    rowsToValidate = rowsArray;
  }
  let previousEndMinutes = null;
  let valid = true;
  // Clear errors only from rows being validated
  rowsToValidate.forEach((row) =>
    row.querySelectorAll(".time-error").forEach((err) => err.remove())
  );
  for (let i = 0; i < rowsArray.length; i++) {
    const row = rowsArray[i];
    // Skip rows that aren't in our validation set
    if (!rowsToValidate.includes(row)) {
      // Still collect the end time for the next row's validation
      const endTimeText = row.querySelector(".end-time-text").textContent;
      previousEndMinutes = timeToMinutes(endTimeText);
      continue;
    }
    const startTimeText = row.querySelector(".start-time-text").textContent;
    const endTimeText = row.querySelector(".end-time-text").textContent;
    const startTimeDisplay = row.querySelector(".start-time-display");
    const endTimeDisplay = row.querySelector(".end-time-display");
    // Parse time values
    const startMinutes = timeToMinutes(startTimeText);
    const endMinutes = timeToMinutes(endTimeText);
    // Extract hours and minutes for format validation
    const [sTime] = startTimeText.split(" ");
    const [sHours, sMinutes] = sTime.split(":").map(Number);
    const [eTime] = endTimeText.split(" ");
    const [eHours, eMinutes] = eTime.split(":").map(Number);
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
      endTimeDisplay.parentNode.insertBefore(
        createErrorSpan("End time must be after start time"),
        endTimeDisplay.nextSibling
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
  }
  return valid;
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
  validateRowTime(row); //check later
}

// Setup events to time picker inputs,buttons
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
  [hoursInput, minutesInput, ampmSelect].forEach((input) => {
    input.addEventListener("input", () => {
      updateTimeDisplay(timePicker, type);
      validateRowTime(timePicker.closest(".field-row"));
    });
    input.addEventListener("change", () => {
      updateTimeDisplay(timePicker, type);
      const row = timePicker.closest(".field-row");
      row.querySelectorAll(".time-error").forEach((err) => err.remove()); //check later
      validateRowTime(row);
    });
  });
  // Time adjustment buttons
  hourUpBtn.addEventListener("click", () => {
    changeTime(hoursInput, 1, "hours");
    validateRowTime(timePicker.closest(".field-row"));
  });
  hourDownBtn.addEventListener("click", () => {
    changeTime(hoursInput, -1, "hours");
    validateRowTime(timePicker.closest(".field-row"));
  });
  minuteUpBtn.addEventListener("click", () => {
    changeTime(minutesInput, 1, "minutes");
    validateRowTime(timePicker.closest(".field-row"));
  });
  minuteDownBtn.addEventListener("click", () => {
    changeTime(minutesInput, -1, "minutes");
    validateRowTime(timePicker.closest(".field-row"));
  });
}
// assign values to dropdown input fields(if time is 9:30 PM shown outside, inside time dropdown each input field have 9 30 PM)
function setTimePickerValue(pickerType, timeString, row = null) {
  // Parse the time string (format: "HH:MM AM/PM")
  const [time, period] = timeString.split(" ");
  const [hours, minutes] = time.split(":");

  // Find the picker element (either from specific row or document)
  const picker = row
    ? row.querySelector(`.${pickerType}-time-picker`)
    : document.querySelector(`.${pickerType}-time-picker`);

  // Set values
  picker.querySelector(`.${pickerType}-hours`).value = hours;
  picker.querySelector(`.${pickerType}-minutes`).value = minutes;
  picker.querySelector(`.${pickerType}-ampm`).value = period;

  // Update the display
  updateTimeDisplay(picker, pickerType);
}

//to change the time upon clicking buttons and changing values inside time dropdown
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

//to set event listeners to row fields
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
  deleteBtn.addEventListener("click", () => {
    showWarning(
      "Are you sure you want to delete this row?",
      () => deleteRow(row),
      null
    );
  });
  splitBtn.addEventListener("click", () => {
    splitRowAlternative(row);
  });
}

//to populate activities
function populateActivityDropdown(activityDropdown) {
  Object.keys(ACTIVITY_TASKS).forEach((activity) => {
    const option = document.createElement("option");
    option.value = activity;
    option.textContent = activity;
    activityDropdown.appendChild(option);
  });
}

//to populate tasks based on selected activity
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

//function to add new row to timesheet
function addRow() {
  if (state.rowCounter >MAX_ROWS) {
    showWarning(`Cannot add more than ${MAX_ROWS}  rows`);
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
}

// initialize clocks(clock in and clock out) if present
function initializeClockDisplays() {
  let clockIn = localStorage.getItem("clockInTime");
  let clockOut = localStorage.getItem("clockOutTime");
  if (!clockIn) {
    document.getElementById("clock-in-time").textContent = "In: Missing";
    document.getElementById("clock-out-time").textContent = "Out:Missing";
    document.getElementById("clock-in-eff-hrs").textContent = "0h 0m";
    document.getElementById("clock-out-eff-hrs").textContent = "0h 0m";
    return;
  }
  const currentValue = localStorage.getItem("currentValue");
  if (currentValue === "clockIn") {
    document.querySelector(".clock-in").disabled = true;
    document.querySelector(".clock-out").disabled = false;
  } else {
    document.querySelector(".clock-out").disabled = true;
    document.querySelector(".clock-in").disabled = false;
  }
  clockIn = JSON.parse(clockIn).startTime;
  clockOut = JSON.parse(clockOut)?.endTime;
  // Update clock in/out times if they exist
  document.getElementById("clock-in-time").textContent = clockIn
    ? `In: ${clockIn}`
    : "In: Missing";
  document.getElementById("clock-out-time").textContent = clockOut
    ? `Out: ${clockOut}`
    : "Out: --:-- --";
}

// Initializate the actual timesheet 
function initializeDOM() {
  const clockInData = JSON.parse(localStorage.getItem("clockInTime"));
  const clockOutData = JSON.parse(localStorage.getItem("clockOutTime"));
  if (!clockInData) {
    document.querySelector(
      ".form-container"
    ).innerHTML = `<b>Please clock in to see the timeSheet</b>`;
    document.querySelector(
      ".submit-container"
    ).innerHTML = "";
    return false;
  }
  let inTimes = JSON.parse(localStorage.getItem("timeInArray")) || [];
  let outTimes = JSON.parse(localStorage.getItem("timeOutArray")) || [];
  const result = calculateEffectiveAndBreakHours(inTimes, outTimes);
  const inTimeSpan = document.getElementById("clock-in-eff-hrs");
  inTimeSpan.textContent = `${result.effective}`;
  const outTimeSpan = document.getElementById("clock-out-eff-hrs");
  outTimeSpan.textContent = `${result.break}`;
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
  if (clockInData && !clockOutData) {
    console.log("hello");
    setTimePickerValue("start", clockInData.startTime);
  }
  return true;
}

// event listener DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  initializeClockDisplays();
  if (initializeDOM()) {
    loadTimesheetFromLocalStorage();
    document.getElementById("cancel-btn").addEventListener("click", (e) => {
      e.preventDefault();
      loadTimesheetFromLocalStorage();
    });
    document.getElementById("save-btn").addEventListener("click", (e) => {
      e.preventDefault();
      setupSaveButtonEventDelegation();
      saveTimesheetToLocalStorage("save");
    });
    document.getElementById("submit-btn").addEventListener("click", (e) => {
      e.preventDefault();
      if (!validateTimesheet()) {
        console.log("Not validated");
        return;
      }
      if (checkActualEffectiveHrs()) {
        showWarning(
          "Do you want to submit?",() => {
            saveTimesheetToLocalStorage("submit", "confirmed");
            document.getElementById("state").textContent = "Submitted";
            document.getElementById("state").style.color = "green";
          },
          null
        );
      }
    });
  }
});

// Clock in/out event handlers
document.querySelector(".clock-in").addEventListener("click", function () {
  this.disabled = true;
  document.querySelector(".clock-out").disabled = false;
  const currentTime = getCurrentTime();
  const startTime = currentTime.timeString;
  const clockInTime = JSON.parse(localStorage.getItem("clockInTime") || "{}");
  const clockOutTime = JSON.parse(localStorage.getItem("clockOutTime") || "{}");
  clockInTime.startTime = startTime;
  document.getElementById("clock-in-time").textContent = `In: ${startTime}`;
  localStorage.setItem("clockInTime", JSON.stringify(clockInTime));
  let storedInArray = JSON.parse(localStorage.getItem("timeInArray") || "[]");
  storedInArray.push(clockInTime.startTime);
  localStorage.setItem("timeInArray", JSON.stringify(storedInArray));
  localStorage.setItem("currentValue", "clockIn");
  if (clockInTime.startTime && clockOutTime.endTime) {
    let diff =
      timeToMinutes(clockOutTime.endTime) -
      timeToMinutes(clockInTime.startTime);
    if (diff < 0) diff += 24 * 60; 
    //if difference is some minutes (here 1) then 2 additional rows are created automatically
    if (diff >= 1 && state.timesheetBody) {
      // Helper function to configure a row
      const configureRow = (
        row,
        activity = null,
        startTime = null,
        endTime = null
      ) => {
        if (activity) {
          const activityDropdown = row.querySelector(".activity-dropdown");
          activityDropdown.value = activity;
          activityDropdown.dispatchEvent(new Event("change"));
        }
        if (startTime) {
          setTimePickerValue("start", startTime, row); 
        }

        if (endTime) {
          setTimePickerValue("end", endTime, row);
        }
        return row;
      };
      // 1. Update end time of last row
      const lastRow = state.timesheetBody.lastElementChild;
      configureRow(lastRow, null, null, clockOutTime.endTime);
      // 2. Add and configure break row
      addRow();
      const breakRow = state.timesheetBody.lastElementChild;
      configureRow(
        breakRow,
        "Break",
        clockOutTime.endTime,
        clockInTime.startTime
      );
      // 3. Add and configure next clock in row
      addRow();
      const newActivityRow = state.timesheetBody.lastElementChild;
      configureRow(newActivityRow, null, clockInTime.startTime, null);
      saveTimesheetToLocalStorage("save", "fromClockIn");
    }
  }
  location.reload()
});

document.querySelector(".clock-out").addEventListener("click", function () {
  this.disabled = true;
  document.querySelector(".clock-in").disabled = false;
  const clockInTime = JSON.parse(localStorage.getItem("clockInTime") || "{}");
  if (!clockInTime.startTime) {
    alert("You need to clock in first!");
    return;
  }
  localStorage.setItem("currentValue", "clockOut");
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

  let storedOutArray = JSON.parse(localStorage.getItem("timeOutArray") || "[]");
  storedOutArray.push(clockOutTime.endTime);
  localStorage.setItem("timeOutArray", JSON.stringify(storedOutArray));
});

//to enable save upon form touched/dirty
function setupSaveButtonEventDelegation() {
  const formContainer = document.querySelector(".form-container");
  // Define all selectors that should trigger save button enabling
  const triggerSelectors = [
    ".start-hours-up",
    ".end-hours-up",
    ".start-hours-down",
    ".end-hours-down",
    "i",
    ".start-hours",
    ".start-minutes",
    ".start-ampm",
    ".end-hours",
    ".end-minutes",
    ".end-ampm",
  ].join(", ");

  ["input", "click", "change"].forEach((eventType) => {
    formContainer.addEventListener(eventType, (event) => {
      // Check if the event target matches any of the selectors
      if (
        event.target.matches(
          eventType === "click" ? triggerSelectors : "input, select, textarea"
        )
      ) {
        enableSaveButton();
      }
    });
  });
}

//to disable all form fields upon successful submission
function disableFormFields() {
  document
    .querySelectorAll("input, select, textarea, button, .time-display")
    .forEach((el) => (el.disabled = true));
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

//enable the save button
function enableSaveButton() {
  if (document.getElementById("save-btn").disabled) {
    document.getElementById("save-btn").disabled = false;
    state.unsavedChanges = true;
  }
}

//save the timesheet to local storage if save/submitted
function saveTimesheetToLocalStorage(type, from = null) {
  if (from !== "fromClockIn" && !validateTimesheet()) {
    console.log("Not validated");
    return;
  }
  const errors = document.querySelectorAll(".error-field");
  const errorsFields = document.querySelectorAll(".time-error");
  if (errors.length > 0 || errorsFields.length > 0) {
    return;
  }
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
  localStorage.setItem("timesheetData", JSON.stringify(timesheetData));
  state.unsavedChanges = false;
  if (type === "submit") {
    disableFormFields();
    document.getElementById(`${type}-btn`).disabled = true;
  } else {
    document.getElementById(`${type}-btn`).disabled =
      from !== "fromClockIn" ? true : false;
  }
}

//to load timesheet from LS if present
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
    const startTimeValue =
      rowData.startTime === "Start Time"
        ? getCurrentTime().timeString
        : rowData.startTime;
    setTimePickerValue("start", startTimeValue,newRow);
    const endTimeValue =
      rowData.endTime === "End Time"
        ? getCurrentTime().timeString
        : rowData.endTime;
    setTimePickerValue("end", endTimeValue,newRow);
  });
  document.getElementById("save-btn").disabled = false;
  state.unsavedChanges = false;
  if (timesheetData.type === "submit") {
    disableFormFields();
  }
}
