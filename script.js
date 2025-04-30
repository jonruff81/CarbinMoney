// --- Helper Functions ---
function formatNumber(num, decimals = 2) {
    // Format with commas and fixed decimals
    return num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatInteger(num) {
    // Format integer with commas
    return num.toLocaleString();
}

const LEADERBOARD_KEY = 'profitCalculatorLeaderboard'; // No longer used
const MAX_ENTRIES_PER_USER = 3; // Still used for limiting user-specific entries if desired, but not for overall leaderboard

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcCSKENJXu9p7Na_g6_UTKwLKRYkAcLns",
  authDomain: "carbin-investments.firebaseapp.com",
  databaseURL: "https://carbin-investments-default-rtdb.firebaseio.com",
  projectId: "carbin-investments",
  storageBucket: "carbin-investments.firebasestorage.app",
  messagingSenderId: "1095890037657",
  appId: "1:1095890037657:web:b32dca8660483c9eff0108"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

function getLeaderboard() {
    // Fetch data from Firebase
    return database.ref('leaderboard').once('value')
        .then(snapshot => {
            const data = snapshot.val();
            // Firebase returns an object; convert it to an array
            return data ? Object.values(data) : [];
        })
        .catch(error => {
            console.error("Error fetching leaderboard:", error);
            return []; // Return empty array on error
        });
}

function saveLeaderboard(leaderboard) {
    // This function is no longer needed as we write directly to Firebase
}

function updateLeaderboard(firstName, lastName, profit, units, projectCost, cycleTime, cyclesCompleted) {
    const name = `${firstName} ${lastName}`;
    const newEntry = {
        name,
        profit,
        units,
        projectCost,
        cycleTime,
        cyclesCompleted,
        timestamp: Date.now() // Use Firebase server timestamp if preferred: firebase.database.ServerValue.TIMESTAMP
    };

    // Push the new entry to the 'leaderboard' node in Firebase
    // Firebase generates a unique key for each entry
    database.ref('leaderboard').push(newEntry)
        .then(() => {
            console.log("Leaderboard updated successfully in Firebase.");
            // Optionally, trigger a re-display after successful update
            displayLeaderboard();
        })
        .catch(error => {
            console.error("Error updating leaderboard in Firebase:", error);
        });
}

function displayLeaderboard() {
    getLeaderboard()
        .then(leaderboard => {
            const listElement = document.getElementById('leaderboard-list');
            if (!listElement) return; // Exit if the element doesn't exist

            listElement.innerHTML = ''; // Clear previous entries

            if (leaderboard.length === 0) {
                listElement.innerHTML = '<li>No results yet.</li>';
                return;
            }

            // Sort the leaderboard by profit (highest first)
            leaderboard.sort((a, b) => b.profit - a.profit);

            // Display all entries
            leaderboard.forEach((entry, index) => {
                const li = document.createElement('li');
                // Ensure all expected properties exist before formatting
                const pc = entry.projectCost !== undefined ? formatNumber(entry.projectCost) : 'N/A';
                const ct = entry.cycleTime !== undefined ? entry.cycleTime : 'N/A';
                const cc = entry.cyclesCompleted !== undefined ? entry.cyclesCompleted : 'N/A';

                li.innerHTML = `
                    <strong>${index + 1}. ${entry.name}</strong><br>
                    Profit: $${formatNumber(entry.profit)} | Units: ${formatInteger(entry.units)}<br>
                    <small>Inputs: PC: $${pc} | CT: ${ct}w | CC: ${cc}</small>
                `;
                listElement.appendChild(li);
            });
        })
        .catch(error => {
             console.error("Error displaying leaderboard:", error);
             const listElement = document.getElementById('leaderboard-list');
             if (listElement) {
                 listElement.innerHTML = '<li>Error loading leaderboard.</li>';
             }
        });
}

function resetLeaderboard() {
    const code = prompt("Enter reset code:");
    if (code === "Johnny") {
        // Remove all data from the 'leaderboard' node in Firebase
        database.ref('leaderboard').remove()
            .then(() => {
                displayLeaderboard(); // Refresh the display
                alert("Leaderboard reset successfully.");
            })
            .catch(error => {
                console.error("Error resetting leaderboard:", error);
                alert("Error resetting leaderboard.");
            });
    } else if (code !== null) { // Handle case where user clicks cancel
        alert("Incorrect reset code.");
    }
}


console.log("Script.js loaded."); // Test log

// --- Main Application Logic ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired."); // Log DOMContentLoaded
    // Display leaderboard on initial load
    displayLeaderboard();

    // Add event listener for the reset button
    const resetButton = document.getElementById('reset-leaderboard-button');
    if (resetButton) {
        resetButton.addEventListener('click', resetLeaderboard);
    } else {
        console.error("Reset button not found in HTML.");
    }

    const calculatorForm = document.getElementById('calculator-form');
    calculatorForm.addEventListener('submit', function(event) {
        console.log("Submit event fired."); // Log submit event
        event.preventDefault(); // Prevent the default form submission

        console.log("Form submitted. Starting calculation."); // Log 1

        // Get user inputs
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const projectCost = parseFloat(document.getElementById('projectCost').value);
	// const laborCost = parseFloat(document.getElementById('laborCost').value);
        const cycleTime = parseInt(document.getElementById('cycleTime').value);

        console.log("Inputs:", { firstName, lastName, projectCost, cycleTime }); // Log 2

        // Calculate sales price
        const salesPrice = projectCost * (1 + 0.20);

        console.log("Sales price calculated:", salesPrice); // Log 3

        // Display sales price
        const salesPriceDisplayElement = document.getElementById('salesPriceDisplay');
        if (salesPriceDisplayElement) {
            salesPriceDisplayElement.textContent = `Sales Price: $${formatNumber(salesPrice)}`;
            console.log("Sales price displayed."); // Log 4
        } else {
            console.error("Error: salesPriceDisplay element not found!"); // Log 5
        }


        // Basic validation
        if (!firstName || !lastName) {
            alert('Please enter both first and last name.');
            console.log("Validation failed: Missing name."); // Log 6
            return;
        }
        if (isNaN(projectCost) || projectCost <= 0 || isNaN(cycleTime) || cycleTime <= 0) {
            alert('Please enter valid positive numbers for costs and cycle time.');
            console.log("Validation failed: Invalid inputs."); // Log 7
            return;
        }

        console.log("Validation passed. Proceeding with simulation."); // Log 8

        // Constants & Initial State
        const investmentPeriodWeeks = 3 * 52; // Updated investment period
        const profitMargin = 0.20; // Updated profit margin
        let currentCapital = 5000000.00; // Updated starting capital
        let totalAccumulatedProfit = 0;
        let cyclesCompleted = 0;
        let totalUnitsProduced = 0;
        const totalCostPerUnit = projectCost;
        const maxPossibleCycles = Math.floor(investmentPeriodWeeks / cycleTime);

        console.log("Initial state:", { investmentPeriodWeeks, profitMargin, currentCapital, totalCostPerUnit, maxPossibleCycles }); // Log 9


        // Simulation Loop
        for (let i = 0; i < maxPossibleCycles; i++) {
            const unitsThisCycle = Math.floor(currentCapital / totalCostPerUnit);
            if (unitsThisCycle > 0) {
                const actualCycleCost = unitsThisCycle * totalCostPerUnit;
                currentCapital -= actualCycleCost;
                const actualCycleProfit = actualCycleCost * profitMargin;
                currentCapital += actualCycleCost + actualCycleProfit;
                totalAccumulatedProfit += actualCycleProfit;
                totalUnitsProduced += unitsThisCycle;
                cyclesCompleted++;
                console.log(`Cycle ${i + 1}: Units=${unitsThisCycle}, Profit=${actualCycleProfit}, Capital=${currentCapital}`); // Log 10
            } else {
                console.log(`Stopping after ${cyclesCompleted} cycles due to insufficient capital for a single unit.`); // Log 11
                break;
            }
        }

        console.log("Simulation complete. Final results:", { totalAccumulatedProfit, totalUnitsProduced, cyclesCompleted }); // Log 12

        // Display results with formatting
        document.getElementById('resultName').textContent = `${firstName} ${lastName}`;
        document.getElementById('resultTotalCost').textContent = formatNumber(totalCostPerUnit);
        document.getElementById('resultProfitPerCycle').textContent = formatNumber(totalCostPerUnit * profitMargin);
        document.getElementById('resultNumCycles').textContent = formatInteger(cyclesCompleted);
        document.getElementById('resultTotalUnits').textContent = formatInteger(totalUnitsProduced);
        const grossIncome = totalAccumulatedProfit + currentCapital;
        document.getElementById('resultGrossIncome').textContent = formatNumber(grossIncome);
        document.getElementById('resultTotalProfit').textContent = formatNumber(totalAccumulatedProfit);

        console.log("Results displayed."); // Log 13

        // Show the results section
        document.getElementById('results').style.display = 'block';

        console.log("Results section displayed."); // Log 14

        // Update leaderboard in Firebase (which will trigger display update)
        updateLeaderboard(firstName, lastName, totalAccumulatedProfit, totalUnitsProduced, projectCost, parseInt(document.getElementById('cycleTime').value), cyclesCompleted);
        console.log("Leaderboard update triggered."); // Log 15
    });
});
