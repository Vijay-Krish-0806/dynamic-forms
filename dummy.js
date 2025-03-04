// let rowCounter = 0;

// const date = new Date();
// let hrs = date.getHours();
// let hrs12 = hrs % 12 || 12;
// let min = date.getMinutes();
// let amPm = hrs >= 12 ? "PM" : "AM";

// // Define the activity-task relationship
// const activityTasks = {
//   Training: [
//     "Self Learning",
//     "Session",
//     "Discussion",
//     "Review",
//     "Doubts Clarification",
//   ],
//   "HR activities": ["1:1", "Discussion"],
//   Break: ["Lunch", "Snacks", "Personal Reasons"],
//   Miscellaneous: ["Miscellaneous"],
// };

// // Function to create a new row
// function createRow() {
//   console.log(rowCounter);
//   if (rowCounter >= 12) {
//     showWarning("Cannot add more than 12 rows");
//     return;
//   }
//   const rowId = rowCounter++;
//   const tbody = document.getElementById("timesheet-body");
//   const newRow = document.createElement("tr");
//   newRow.className = "field-row";
//   newRow.id = `row-${rowId}`;

//   // Create row HTML structure
//   newRow.innerHTML = `
//           <td><i class="fa-solid fa-briefcase"></i></td>
//           <td>
//             <select name="activity-dropdown-${rowId}" id="activity-dropdown-${rowId}" class="activity-dropdown">
//               ${Object.keys(activityTasks)
//                 .map(
//                   (activity) =>
//                     `<option value="${activity}">${activity}</option>`
//                 )
//                 .join("")}
//             </select>
//           </td>
//           <td>
//             <select name="task-dropdown-${rowId}" id="task-dropdown-${rowId}">
//               ${activityTasks[Object.keys(activityTasks)[0]]
//                 .map((task) => `<option value="${task}">${task}</option>`)
//                 .join("")}
//             </select>
//           </td>
//           <td colspan="2" class="task-details-td">
//             <input type="text" name="task-details-${rowId}" id="task-details-${rowId}" class="task-details"  maxlength="255"/>
//             <div class="limit"><span id="char-count-${rowId}">0/255</span></div>
//           </td>

//           <!-- Start Time Dropdown -->
//           <td>
//             <div class="time-picker">
//               <div type="button" class="time-display" id="start-time-display-${rowId}">
//                 <span id="start-time-text-${rowId}">12:00 AM</span>
//                 <i class="fa-solid fa-clock"></i>
//               </div>

//               <div id="start-time-dropdown-${rowId}" class="time-dropdown hidden">
//                 <div class="time-input">
//                   <input type="text" id="start-hours-${rowId}" value=${hrs12} />
//                   <div class="buttons">
//                     <button type="button" id="start-hours-up-${rowId}"><i class="fa-solid fa-chevron-up"></i></button>
//                     <button type="button" id="start-hours-down-${rowId}"><i class="fa-solid fa-chevron-down"></i></button>
//                   </div>
//                 </div>

//                 <div class="time-input">
//                   <input type="text" id="start-minutes-${rowId}" value=${min} />
//                   <div class="buttons">
//                     <button type="button" id="start-minutes-up-${rowId}"><i class="fa-solid fa-chevron-up"></i></button>
//                     <button type="button" id="start-minutes-down-${rowId}"><i class="fa-solid fa-chevron-down"></i></button>
//                   </div>
//                 </div>

//                 <select id="start-ampm-${rowId}">
//                   <option value="AM">AM</option>
//                   <option value="PM">PM</option>
//                 </select>
//               </div>
//             </div>
//           </td>

//           <!-- End Time Dropdown -->
//           <td>
//             <div class="time-picker">
//               <div type="button" class="time-display" id="end-time-display-${rowId}">
//                 <span id="end-time-text-${rowId}">12:00 AM</span>
//                 <i class="fa-solid fa-clock"></i>
//               </div>

//               <div id="end-time-dropdown-${rowId}" class="time-dropdown hidden">
//                 <div class="time-input">
//                   <input type="text" id="end-hours-${rowId}" value=${hrs} />
//                   <div class="buttons">
//                     <button type="button" id="end-hours-up-${rowId}"><i class="fa-solid fa-chevron-up"></i></button>
//                     <button type="button" id="end-hours-down-${rowId}"><i class="fa-solid fa-chevron-down"></i></button>
//                   </div>
//                 </div>

//                 <div class="time-input">
//                   <input type="text" id="end-minutes-${rowId}" value=${min} />
//                   <div class="buttons">
//                     <button type="button" id="end-minutes-up-${rowId}"><i class="fa-solid fa-chevron-up"></i></button>
//                     <button type="button" id="end-minutes-down-${rowId}"><i class="fa-solid fa-chevron-down"></i></button>
//                   </div>
//                 </div>

//                 <select id="end-ampm-${rowId}">
//                   <option value="AM">AM</option>
//                   <option value="PM">PM</option>
//                 </select>
//               </div>
//             </div>
//           </td>

//           <td><div class="duration" id="duration-${rowId}">0h 0m</div></td>

//           <td class="row-actions">
//             <i class="fa-solid fa-trash delete-row" data-row-id="${rowId}" title="Delete row"></i>
//           </td>
//         `;
//   tbody.appendChild(newRow);
//   setupRowListeners(rowId);
//   return rowId;
// }

// // Function to update task dropdown based on selected activity
// function updateTaskDropdown(rowId) {
//   const activityDropdown = document.getElementById(
//     `activity-dropdown-${rowId}`
//   );
//   const taskDropdown = document.getElementById(`task-dropdown-${rowId}`);
//   const selectedActivity = activityDropdown.value;
//   const tasks = activityTasks[selectedActivity] || [];

//   // Clear current options
//   taskDropdown.innerHTML = "";

//   // Add new options
//   tasks.forEach((task) => {
//     const option = document.createElement("option");
//     option.value = task;
//     option.textContent = task;
//     taskDropdown.appendChild(option);
//   });
// }

// // Function to setup event listeners for a row
// function setupRowListeners(rowId) {
//   // Activity dropdown change handler
//   const activityDropdown = document.getElementById(
//     `activity-dropdown-${rowId}`
//   );
//   activityDropdown.addEventListener("change", function () {
//     updateTaskDropdown(rowId);
//   });

//   // Task details character counter
//   const taskDetails = document.getElementById(`task-details-${rowId}`);
//   const charCount = document.getElementById(`char-count-${rowId}`);

//   taskDetails.addEventListener("input", function () {
//     const count = this.value.length;
//     charCount.textContent = `${count}/255`;
//   });

//   // Start time dropdown
//   const startTimeDisplay = document.getElementById(
//     `start-time-display-${rowId}`
//   );
//   const startTimeDropdown = document.getElementById(
//     `start-time-dropdown-${rowId}`
//   );

//   startTimeDisplay.addEventListener("click", function (e) {
//     e.stopPropagation();
//     // Close all dropdowns first
//     document.querySelectorAll(".time-dropdown").forEach((dropdown) => {
//       dropdown.classList.add("hidden");
//     });
//     startTimeDropdown.classList.toggle("hidden");
//   });

//   // End time dropdown
//   const endTimeDisplay = document.getElementById(`end-time-display-${rowId}`);
//   const endTimeDropdown = document.getElementById(`end-time-dropdown-${rowId}`);

//   endTimeDisplay.addEventListener("click", function (e) {
//     e.stopPropagation();
//     // Close all dropdowns first
//     document.querySelectorAll(".time-dropdown").forEach((dropdown) => {
//       dropdown.classList.add("hidden");
//     });
//     endTimeDropdown.classList.toggle("hidden");
//   });

//   // Hours and minutes buttons for start time
//   document
//     .getElementById(`start-hours-up-${rowId}`)
//     .addEventListener("click", function () {
//       changeTime(`start-hours-${rowId}`, 1);
//     });

//   document
//     .getElementById(`start-hours-down-${rowId}`)
//     .addEventListener("click", function () {
//       changeTime(`start-hours-${rowId}`, -1);
//     });

//   document
//     .getElementById(`start-minutes-up-${rowId}`)
//     .addEventListener("click", function () {
//       changeTime(`start-minutes-${rowId}`, 1);
//     });

//   document
//     .getElementById(`start-minutes-down-${rowId}`)
//     .addEventListener("click", function () {
//       changeTime(`start-minutes-${rowId}`, -1);
//     });

//   // Hours and minutes buttons for end time
//   document
//     .getElementById(`end-hours-up-${rowId}`)
//     .addEventListener("click", function () {
//       changeTime(`end-hours-${rowId}`, 1);
//     });

//   document
//     .getElementById(`end-hours-down-${rowId}`)
//     .addEventListener("click", function () {
//       changeTime(`end-hours-${rowId}`, -1);
//     });

//   document
//     .getElementById(`end-minutes-up-${rowId}`)
//     .addEventListener("click", function () {
//       changeTime(`end-minutes-${rowId}`, 1);
//     });

//   document
//     .getElementById(`end-minutes-down-${rowId}`)
//     .addEventListener("click", function () {
//       changeTime(`end-minutes-${rowId}`, -1);
//     });

//   // Add blur (focus lost) event listeners for time inputs
//   document
//     .getElementById(`start-hours-${rowId}`)
//     .addEventListener("blur", function () {
//       setTime("start", rowId);
//     });

//   document
//     .getElementById(`start-minutes-${rowId}`)
//     .addEventListener("blur", function () {
//       setTime("start", rowId);
//     });

//   document
//     .getElementById(`start-ampm-${rowId}`)
//     .addEventListener("change", function () {
//       setTime("start", rowId);
//     });

//   document
//     .getElementById(`end-hours-${rowId}`)
//     .addEventListener("blur", function () {
//       setTime("end", rowId);
//     });

//   document
//     .getElementById(`end-minutes-${rowId}`)
//     .addEventListener("blur", function () {
//       setTime("end", rowId);
//     });

//   document
//     .getElementById(`end-ampm-${rowId}`)
//     .addEventListener("change", function () {
//       setTime("end", rowId);
//     });

//   // Delete row button
//   const deleteBtn = document.querySelector(
//     `.delete-row[data-row-id="${rowId}"]`
//   );
//   if (deleteBtn) {
//     deleteBtn.addEventListener("click", function () {
//       const rowToDelete = document.getElementById(`row-${rowId}`);
//       if (rowToDelete && document.querySelectorAll(".field-row").length > 1) {
//         rowToDelete.remove();
//         rowCounter--;
//       } else {
//         showWarning("You must keep at least one row.");
//       }
//     });
//   }
// }

// // Change time function
// function changeTime(id, increment) {
//   const input = document.getElementById(id);
//   let value = parseInt(input.value) + increment;

//   if (id.includes("hours")) {
//     if (value > 12) value = 1;
//     if (value < 1) value = 12;
//   } else if (id.includes("minutes")) {
//     if (value > 59) value = 0;
//     if (value < 0) value = 59;
//   }

//   input.value = value.toString().padStart(2, "0");

//   // Also update the time display when using up/down buttons
//   const type = id.includes("start") ? "start" : "end";
//   const rowId = id.split("-").pop();
//   setTime(type, rowId);
// }

// // Set time function
// function setTime(type, rowId) {
//   const hours = document
//     .getElementById(`${type}-hours-${rowId}`)
//     .value.padStart(2, "0");
//   const minutes = document
//     .getElementById(`${type}-minutes-${rowId}`)
//     .value.padStart(2, "0");
//   const ampm = document.getElementById(`${type}-ampm-${rowId}`).value;

//   document.getElementById(
//     `${type}-time-text-${rowId}`
//   ).textContent = `${hours}:${minutes} ${ampm}`;

//   // Update duration when both times are set
//   updateDuration(rowId);
// }

// // Helper function to convert 12h to 24h format for calculations
// function timeToMinutes(timeStr) {
//   const [time, period] = timeStr.split(" ");
//   let [hours, minutes] = time.split(":").map(Number);

//   if (period === "PM" && hours < 12) hours += 12;
//   if (period === "AM" && hours === 12) hours = 0;

//   return hours * 60 + minutes;
// }

// // Update duration
// function updateDuration(rowId) {
//   const startTimeStr = document.getElementById(
//     `start-time-text-${rowId}`
//   ).textContent;
//   const endTimeStr = document.getElementById(
//     `end-time-text-${rowId}`
//   ).textContent;

//   if (startTimeStr && endTimeStr) {
//     const startMinutes = timeToMinutes(startTimeStr);
//     const endMinutes = timeToMinutes(endTimeStr);

//     let durationMinutes = endMinutes - startMinutes;
//     if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle overnight

//     const hours = Math.floor(durationMinutes / 60);
//     const minutes = durationMinutes % 60;

//     document.getElementById(
//       `duration-${rowId}`
//     ).textContent = `${hours}h ${minutes}m`;
//   }
// }

// //show warnings div
// function showWarning(msg) {
//   const warningDiv = document.getElementById("showWarningDiv");
//   const warningMsg = document.getElementById("warning-msg");
//   warningDiv.style.display = "block";
//   warningMsg.textContent = msg;
//   document.body.classList.add("body-warning");
// }

// function hideWarningPopup() {
//   document.getElementById("showWarningDiv").style.display = "none";
//   document.body.classList.remove("body-warning");
// }

// // Close dropdowns when clicking outside
// document.addEventListener("click", function (event) {
//   const dropdowns = document.querySelectorAll(".time-dropdown");
//   const isClickInsideDropdown = Array.from(dropdowns).some(
//     (dropdown) =>
//       dropdown.contains(event.target) ||
//       event.target.closest(".time-display") === dropdown.previousElementSibling
//   );

//   if (!isClickInsideDropdown) {
//     dropdowns.forEach((dropdown) => {
//       dropdown.classList.add("hidden");
//     });
//   }
// });

// // Add Row button event listener
// document.getElementById("add-row-btn").addEventListener("click", function () {
//   createRow();
// });

// // Initialize with today's date
// document.getElementById("date").valueAsDate = new Date();

// // Create the first row on page load
// window.addEventListener("load", function () {
//   createRow();
// });

// document.querySelector(".closeBtn").addEventListener("click", hideWarningPopup);

// Constants and state management
// let rowCounter = 0;
// const MAX_ROWS = 12;
// const MAX_CHAR_LENGTH = 255;

// // Current time setup
// const date = new Date();
// const hrs = date.getHours();
// const hrs12 = hrs % 12 || 12;
// const min = date.getMinutes();
// const amPm = hrs >= 12 ? "PM" : "AM";

// // Activity-task relationship mapping
// const activityTasks = {
//   Training: [
//     "Self Learning",
//     "Session",
//     "Discussion",
//     "Review",
//     "Doubts Clarification",
//   ],
//   "HR activities": ["1:1", "Discussion"],
//   Break: ["Lunch", "Snacks", "Personal Reasons"],
//   Miscellaneous: ["Miscellaneous"],
// };

// // DOM Elements Cache
// const elements = {
//   timesheetBody: document.getElementById("timesheet-body"),
//   addRowBtn: document.getElementById("add-row-btn"),
//   warningDiv: document.getElementById("showWarningDiv"),
//   warningMsg: document.getElementById("warning-msg"),
//   closeBtn: document.querySelector(".closeBtn"),
//   dateInput: document.getElementById("date"),
//   commentArea: document.querySelector("textarea[name='comment-details']"),
//   commentCharCount: document.getElementById("char-count")
// };

// /**
//  * Creates a new timesheet row
//  * @returns {number|null} The ID of the new row, or null if max rows reached
//  */
// function createRow() {
//   if (rowCounter >= MAX_ROWS) {
//     showWarning(`Cannot add more than ${MAX_ROWS} rows`);
//     return null;
//   }

//   const rowId = rowCounter++;
//   const newRow = document.createElement("tr");
//   newRow.className = "field-row";
//   newRow.id = `row-${rowId}`;

//   // Create row HTML structure
//   newRow.innerHTML = generateRowHTML(rowId);
//   elements.timesheetBody.appendChild(newRow);

//   setupRowListeners(rowId);
//   return rowId;
// }

// /**
//  * Generates HTML for a timesheet row
//  * @param {number} rowId - The row identifier
//  * @returns {string} HTML string for the row
//  */
// function generateRowHTML(rowId) {
//   return `
//     <td><i class="fa-solid fa-briefcase"></i></td>
//     <td>
//       <select name="activity-dropdown-${rowId}" id="activity-dropdown-${rowId}" class="activity-dropdown">
//         ${Object.keys(activityTasks)
//           .map(activity => `<option value="${activity}">${activity}</option>`)
//           .join("")}
//       </select>
//     </td>
//     <td>
//       <select name="task-dropdown-${rowId}" id="task-dropdown-${rowId}">
//         ${activityTasks[Object.keys(activityTasks)[0]]
//           .map(task => `<option value="${task}">${task}</option>`)
//           .join("")}
//       </select>
//     </td>
//     <td colspan="2" class="task-details-td">
//       <input type="text" name="task-details-${rowId}" id="task-details-${rowId}" class="task-details" maxlength="${MAX_CHAR_LENGTH}"/>
//       <div class="limit"><span id="char-count-${rowId}">0/${MAX_CHAR_LENGTH}</span></div>
//     </td>

//     <!-- Start Time Picker -->
//     <td>
//       <div class="time-picker">
//         <div type="button" class="time-display" id="start-time-display-${rowId}">
//           <span id="start-time-text-${rowId}">${hrs12}:${String(min).padStart(2, '0')} ${amPm}</span>
//           <i class="fa-solid fa-clock"></i>
//         </div>

//         <div id="start-time-dropdown-${rowId}" class="time-dropdown hidden">
//           <div class="time-input">
//             <input type="text" id="start-hours-${rowId}" value="${hrs12}" />
//             <div class="buttons">
//               <button type="button" id="start-hours-up-${rowId}"><i class="fa-solid fa-chevron-up"></i></button>
//               <button type="button" id="start-hours-down-${rowId}"><i class="fa-solid fa-chevron-down"></i></button>
//             </div>
//           </div>

//           <div class="time-input">
//             <input type="text" id="start-minutes-${rowId}" value="${String(min).padStart(2, '0')}" />
//             <div class="buttons">
//               <button type="button" id="start-minutes-up-${rowId}"><i class="fa-solid fa-chevron-up"></i></button>
//               <button type="button" id="start-minutes-down-${rowId}"><i class="fa-solid fa-chevron-down"></i></button>
//             </div>
//           </div>

//           <select id="start-ampm-${rowId}">
//             <option value="AM" ${amPm === "AM" ? "selected" : ""}>AM</option>
//             <option value="PM" ${amPm === "PM" ? "selected" : ""}>PM</option>
//           </select>
//         </div>
//       </div>
//     </td>

//     <!-- End Time Picker -->
//     <td>
//       <div class="time-picker">
//         <div type="button" class="time-display" id="end-time-display-${rowId}">
//           <span id="end-time-text-${rowId}">${hrs12}:${String(min).padStart(2, '0')} ${amPm}</span>
//           <i class="fa-solid fa-clock"></i>
//         </div>

//         <div id="end-time-dropdown-${rowId}" class="time-dropdown hidden">
//           <div class="time-input">
//             <input type="text" id="end-hours-${rowId}" value="${hrs12}" />
//             <div class="buttons">
//               <button type="button" id="end-hours-up-${rowId}"><i class="fa-solid fa-chevron-up"></i></button>
//               <button type="button" id="end-hours-down-${rowId}"><i class="fa-solid fa-chevron-down"></i></button>
//             </div>
//           </div>

//           <div class="time-input">
//             <input type="text" id="end-minutes-${rowId}" value="${String(min).padStart(2, '0')}" />
//             <div class="buttons">
//               <button type="button" id="end-minutes-up-${rowId}"><i class="fa-solid fa-chevron-up"></i></button>
//               <button type="button" id="end-minutes-down-${rowId}"><i class="fa-solid fa-chevron-down"></i></button>
//             </div>
//           </div>

//           <select id="end-ampm-${rowId}">
//             <option value="AM" ${amPm === "AM" ? "selected" : ""}>AM</option>
//             <option value="PM" ${amPm === "PM" ? "selected" : ""}>PM</option>
//           </select>
//         </div>
//       </div>
//     </td>

//     <td><div class="duration" id="duration-${rowId}">0h 0m</div></td>

//     <td class="row-actions">
//       <i class="fa-solid fa-trash delete-row" data-row-id="${rowId}" title="Delete row"></i>
//     </td>
//   `;
// }

// /**
//  * Updates task dropdown based on selected activity
//  * @param {number} rowId - The row identifier
//  */
// function updateTaskDropdown(rowId) {
//   const activityDropdown = document.getElementById(`activity-dropdown-${rowId}`);
//   const taskDropdown = document.getElementById(`task-dropdown-${rowId}`);
//   const selectedActivity = activityDropdown.value;
//   const tasks = activityTasks[selectedActivity] || [];

//   // Clear and repopulate options
//   taskDropdown.innerHTML = "";
//   tasks.forEach((task) => {
//     const option = document.createElement("option");
//     option.value = task;
//     option.textContent = task;
//     taskDropdown.appendChild(option);
//   });
// }

// /**
//  * Sets up all event listeners for a row
//  * @param {number} rowId - The row identifier
//  */
// function setupRowListeners(rowId) {
//   // Activity dropdown change handler
//   const activityDropdown = document.getElementById(`activity-dropdown-${rowId}`);
//   activityDropdown.addEventListener("change", () => updateTaskDropdown(rowId));

//   // Task details character counter
//   const taskDetails = document.getElementById(`task-details-${rowId}`);
//   const charCount = document.getElementById(`char-count-${rowId}`);
//   taskDetails.addEventListener("input", function() {
//     charCount.textContent = `${this.value.length}/${MAX_CHAR_LENGTH}`;
//   });

//   // Setup time pickers
//   setupTimePicker("start", rowId);
//   setupTimePicker("end", rowId);

//   // Delete row button
//   const deleteBtn = document.querySelector(`.delete-row[data-row-id="${rowId}"]`);
//   if (deleteBtn) {
//     deleteBtn.addEventListener("click", function() {
//       const rowToDelete = document.getElementById(`row-${rowId}`);
//       if (rowToDelete && document.querySelectorAll(".field-row").length > 1) {
//         rowToDelete.remove();
//         updateTotalDuration();
//         rowCounter--;
//       } else {
//         showWarning("You must keep at least one row.");
//       }
//     });
//   }
// }

// /**
//  * Sets up a time picker (start or end)
//  * @param {string} type - Either "start" or "end"
//  * @param {number} rowId - The row identifier
//  */
// function setupTimePicker(type, rowId) {
//   const timeDisplay = document.getElementById(`${type}-time-display-${rowId}`);
//   const timeDropdown = document.getElementById(`${type}-time-dropdown-${rowId}`);

//   // Toggle dropdown
//   timeDisplay.addEventListener("click", function(e) {
//     e.stopPropagation();
//     // Close all dropdowns first
//     document.querySelectorAll(".time-dropdown").forEach(dropdown => {
//       dropdown.classList.add("hidden");
//     });
//     timeDropdown.classList.toggle("hidden");
//   });

//   // Hours and minutes buttons
//   document.getElementById(`${type}-hours-up-${rowId}`).addEventListener("click",
//     () => changeTime(`${type}-hours-${rowId}`, 1));
//   document.getElementById(`${type}-hours-down-${rowId}`).addEventListener("click",
//     () => changeTime(`${type}-hours-${rowId}`, -1));
//   document.getElementById(`${type}-minutes-up-${rowId}`).addEventListener("click",
//     () => changeTime(`${type}-minutes-${rowId}`, 1));
//   document.getElementById(`${type}-minutes-down-${rowId}`).addEventListener("click",
//     () => changeTime(`${type}-minutes-${rowId}`, -1));

//   // Input blur events
//   document.getElementById(`${type}-hours-${rowId}`).addEventListener("blur",
//     () => setTime(type, rowId));
//   document.getElementById(`${type}-minutes-${rowId}`).addEventListener("blur",
//     () => setTime(type, rowId));
//   document.getElementById(`${type}-ampm-${rowId}`).addEventListener("change",
//     () => setTime(type, rowId));
// }

// /**
//  * Changes time value (hours or minutes)
//  * @param {string} id - The input element ID
//  * @param {number} increment - Amount to increment (-1 or 1)
//  */
// function changeTime(id, increment) {
//   const input = document.getElementById(id);
//   let value = parseInt(input.value) + increment;

//   if (id.includes("hours")) {
//     value = value > 12 ? 1 : (value < 1 ? 12 : value);
//   } else if (id.includes("minutes")) {
//     value = value > 59 ? 0 : (value < 0 ? 59 : value);
//   }

//   input.value = value.toString().padStart(2, "0");

//   // Update time display
//   const type = id.includes("start") ? "start" : "end";
//   const rowId = id.split("-").pop();
//   setTime(type, rowId);
// }

// /**
//  * Sets and displays time value
//  * @param {string} type - Either "start" or "end"
//  * @param {number} rowId - The row identifier
//  */
// function setTime(type, rowId) {
//   const hours = document.getElementById(`${type}-hours-${rowId}`).value.padStart(2, "0");
//   const minutes = document.getElementById(`${type}-minutes-${rowId}`).value.padStart(2, "0");
//   const ampm = document.getElementById(`${type}-ampm-${rowId}`).value;

//   document.getElementById(`${type}-time-text-${rowId}`).textContent = `${hours}:${minutes} ${ampm}`;

//   // Update duration
//   updateDuration(rowId);
//   updateTotalDuration();
// }

// /**
//  * Converts time string to minutes for calculations
//  * @param {string} timeStr - Time string in format "HH:MM AM/PM"
//  * @returns {number} Total minutes
//  */
// function timeToMinutes(timeStr) {
//   const [time, period] = timeStr.split(" ");
//   let [hours, minutes] = time.split(":").map(Number);

//   if (period === "PM" && hours < 12) hours += 12;
//   if (period === "AM" && hours === 12) hours = 0;

//   return hours * 60 + minutes;
// }

// /**
//  * Updates duration for a specific row
//  * @param {number} rowId - The row identifier
//  */
// function updateDuration(rowId) {
//   const startTimeStr = document.getElementById(`start-time-text-${rowId}`).textContent;
//   const endTimeStr = document.getElementById(`end-time-text-${rowId}`).textContent;

//   if (startTimeStr && endTimeStr) {
//     const startMinutes = timeToMinutes(startTimeStr);
//     const endMinutes = timeToMinutes(endTimeStr);

//     let durationMinutes = endMinutes - startMinutes;
//     if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle overnight

//     const hours = Math.floor(durationMinutes / 60);
//     const minutes = durationMinutes % 60;

//     document.getElementById(`duration-${rowId}`).textContent = `${hours}h ${minutes}m`;

//     // Store raw minutes as a data attribute for easier total calculation
//     document.getElementById(`duration-${rowId}`).dataset.minutes = durationMinutes;
//   }
// }

// /**
//  * Updates total duration across all rows
//  */
// function updateTotalDuration() {
//   const totalMinutes = Array.from(document.querySelectorAll('.duration'))
//     .reduce((total, element) => total + (parseInt(element.dataset.minutes) || 0), 0);

//   const hours = Math.floor(totalMinutes / 60);
//   const minutes = totalMinutes % 60;

//   // Update total duration display - assumes there's an element to display this
//   const effectiveHoursElement = document.querySelector('.times div:first-child h3:last-child');
//   if (effectiveHoursElement) {
//     effectiveHoursElement.textContent = `${hours}h ${minutes}m`;
//   }
// }

// /**
//  * Shows warning message
//  * @param {string} msg - Warning message
//  */
// function showWarning(msg) {
//   elements.warningMsg.textContent = msg;
//   elements.warningDiv.style.display = "block";
//   document.body.classList.add("body-warning");
// }

// /**
//  * Hides warning popup
//  */
// function hideWarningPopup() {
//   elements.warningDiv.style.display = "none";
//   document.body.classList.remove("body-warning");
// }

// // Event Listeners

// // Comment area character counter
// if (elements.commentArea) {
//   elements.commentArea.addEventListener("input", function() {
//     elements.commentCharCount.textContent = `${this.value.length}/${MAX_CHAR_LENGTH}`;
//   });
// }

// // Close dropdowns when clicking outside
// document.addEventListener("click", function(event) {
//   const dropdowns = document.querySelectorAll(".time-dropdown");
//   const isClickInsideDropdown = Array.from(dropdowns).some(
//     dropdown => dropdown.contains(event.target) ||
//     event.target.closest(".time-display") === dropdown.previousElementSibling
//   );

//   if (!isClickInsideDropdown) {
//     dropdowns.forEach(dropdown => dropdown.classList.add("hidden"));
//   }
// });

// // Add Row button
// elements.addRowBtn.addEventListener("click", createRow);

// // Warning close button
// elements.closeBtn.addEventListener("click", hideWarningPopup);

// // Initialize with today's date
// elements.dateInput.valueAsDate = new Date();

// // Initialize form with first row
// window.addEventListener("load", function() {
//   createRow();
// });

// // Save and Submit buttons
// document.querySelectorAll('.submit-btns button').forEach(button => {
//   button.addEventListener('click', function() {
//     const action = this.textContent.toLowerCase();
//     // Here you would handle saving or submitting the form data
//     console.log(`${action} action triggered`);

//     if (action === 'submit') {
//       document.getElementById('state').textContent = 'Submitted';
//     }
//   });
// });
