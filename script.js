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

function updateLeaderboard(firstName, lastName, profit, units, projectCost, laborCost, cycleTime) {
    const name = `${firstName} ${lastName}`;
    const newEntry = {
        name,
        profit,
        units,
        projectCost,
        laborCost,
        cycleTime,
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
                const lc = entry.laborCost !== undefined ? formatNumber(entry.laborCost) : 'N/A';
                const ct = entry.cycleTime !== undefined ? entry.cycleTime : 'N/A';

                li.innerHTML = `
                    <strong>${index + 1}. ${entry.name}</strong><br>
                    Profit: $${formatNumber(entry.profit)} | Units: ${formatInteger(entry.units)}<br>
                    <small>Inputs: PC: $${pc} | LC: $${lc} | CT: ${ct}w</small>
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


// --- Main Application Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Display leaderboard on initial load
    displayLeaderboard();

    // Add event listener for the reset button
    const resetButton = document.getElementById('reset-leaderboard-button');
    if (resetButton) {
        resetButton.addEventListener('click', resetLeaderboard);
    } else {
        console.error("Reset button not found in HTML.");
    }


    document.getElementById('calculator-form').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        // Get user inputs
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const projectCost = parseFloat(document.getElementById('projectCost').value);
        const laborCost = parseFloat(document.getElementById('laborCost').value);
        const cycleTime = parseInt(document.getElementById('cycleTime').value);

        // Basic validation
        if (!firstName || !lastName) {
            alert('Please enter both first and last name.');
            return;
        }
        if (isNaN(projectCost) || projectCost <= 0 || isNaN(laborCost) || laborCost < 0 || isNaN(cycleTime) || cycleTime <= 0) {
            alert('Please enter valid positive numbers for costs and cycle time.');
            return;
        }

        // Constants & Initial State
        const investmentPeriodWeeks = 2 * 52;
        const profitMargin = 0.10;
        let currentCapital = 1000000.00;
        let totalAccumulatedProfit = 0;
        let cyclesCompleted = 0;
        let totalUnitsProduced = 0;
        const totalCostPerUnit = projectCost + laborCost;
        const maxPossibleCycles = Math.floor(investmentPeriodWeeks / cycleTime);

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
            } else {
                console.log(`Stopping after ${cyclesCompleted} cycles due to insufficient capital for a single unit.`);
                break;
            }
        }

        // Display results with formatting
        document.getElementById('resultName').textContent = `${firstName} ${lastName}`;
        document.getElementById('resultTotalCost').textContent = formatNumber(totalCostPerUnit);
        document.getElementById('resultProfitPerCycle').textContent = formatNumber(totalCostPerUnit * profitMargin);
        document.getElementById('resultNumCycles').textContent = formatInteger(cyclesCompleted);
        document.getElementById('resultTotalUnits').textContent = formatInteger(totalUnitsProduced);
        document.getElementById('resultTotalProfit').textContent = formatNumber(totalAccumulatedProfit);

        // Show the results section
        document.getElementById('results').style.display = 'block';

        // Update leaderboard in Firebase (which will trigger display update)
        updateLeaderboard(firstName, lastName, totalAccumulatedProfit, totalUnitsProduced, projectCost, laborCost, cycleTime);
    });
});