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

const LEADERBOARD_KEY = 'profitCalculatorLeaderboard';
const MAX_ENTRIES_PER_USER = 3;
const MAX_LEADERBOARD_SIZE = 3; // Overall top entries to show

function getLeaderboard() {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
}

function saveLeaderboard(leaderboard) {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
}

function updateLeaderboard(firstName, lastName, profit, units, projectCost, laborCost, cycleTime) { // Added inputs
    const name = `${firstName} ${lastName}`;
    let leaderboard = getLeaderboard();

    // Create new entry with input details
    const newEntry = {
        name,
        profit,
        units,
        projectCost, // Store input
        laborCost,   // Store input
        cycleTime,   // Store input
        timestamp: Date.now()
    };

    // Get entries for the current user and others separately
    let userEntries = leaderboard.filter(entry => entry.name === name);
    const otherEntries = leaderboard.filter(entry => entry.name !== name);

    // Add the new entry to the user's entries
    userEntries.push(newEntry);

    // Sort user's entries by timestamp (newest first)
    userEntries.sort((a, b) => b.timestamp - a.timestamp);

    // Keep only the top N entries for this user
    userEntries = userEntries.slice(0, MAX_ENTRIES_PER_USER);

    // Combine back with other entries
    leaderboard = [...otherEntries, ...userEntries];

    // Sort the entire leaderboard by profit (highest first)
    leaderboard.sort((a, b) => b.profit - a.profit);

    // Keep only the overall top N entries
    leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_SIZE);

    saveLeaderboard(leaderboard);
    displayLeaderboard(); // Update the display
}

function displayLeaderboard() {
    const leaderboard = getLeaderboard();
    const listElement = document.getElementById('leaderboard-list');
    if (!listElement) return; // Exit if the element doesn't exist yet

    listElement.innerHTML = ''; // Clear previous entries

    if (leaderboard.length === 0) {
        listElement.innerHTML = '<li>No results yet.</li>';
        return;
    }

    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${index + 1}. ${entry.name}</strong><br>
            Profit: $${formatNumber(entry.profit)} | Units: ${formatInteger(entry.units)}<br>
            ${ // Conditionally display inputs if they exist
                (entry.projectCost !== undefined && entry.laborCost !== undefined && entry.cycleTime !== undefined)
                ? `<small>Inputs: PC: $${formatNumber(entry.projectCost)} | LC: $${formatNumber(entry.laborCost)} | CT: ${entry.cycleTime}w</small>`
                : '<small>Inputs: (Not available for this entry)</small>'
            }
        `;
        listElement.appendChild(li);
    });
}

function resetLeaderboard() {
    const code = prompt("Enter reset code:");
    if (code === "Johnny") {
        localStorage.removeItem(LEADERBOARD_KEY);
        displayLeaderboard(); // Refresh the display
        alert("Leaderboard reset successfully.");
    } else if (code !== null) { // Handle case where user clicks cancel
        alert("Incorrect reset code.");
    }
}


// --- Main Application Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Display leaderboard on initial load
    displayLeaderboard();

    // Add event listener for the reset button (will be added in HTML)
    const resetButton = document.getElementById('reset-leaderboard-button');
    if (resetButton) {
        resetButton.addEventListener('click', resetLeaderboard);
    } else {
        console.error("Reset button not found in HTML."); // Add error handling
    }


    document.getElementById('calculator-form').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        // Get user inputs
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const projectCost = parseFloat(document.getElementById('projectCost').value);
        const laborCost = parseFloat(document.getElementById('laborCost').value);
        const cycleTime = parseInt(document.getElementById('cycleTime').value);

        // Basic validation (remains the same)
        if (!firstName || !lastName) {
            alert('Please enter both first and last name.');
            return;
        }
        if (isNaN(projectCost) || projectCost <= 0 || isNaN(laborCost) || laborCost < 0 || isNaN(cycleTime) || cycleTime <= 0) {
            alert('Please enter valid positive numbers for costs and cycle time.');
            return;
        }

        // Constants & Initial State (remains the same)
        const investmentPeriodWeeks = 2 * 52;
        const profitMargin = 0.10;
        let currentCapital = 1000000.00;
        let totalAccumulatedProfit = 0;
        let cyclesCompleted = 0;
        let totalUnitsProduced = 0;
        const totalCostPerUnit = projectCost + laborCost;
        const maxPossibleCycles = Math.floor(investmentPeriodWeeks / cycleTime);

        // Simulation Loop (remains the same)
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
        document.getElementById('resultTotalCost').textContent = formatNumber(totalCostPerUnit); // Cost per unit
        document.getElementById('resultProfitPerCycle').textContent = formatNumber(totalCostPerUnit * profitMargin); // Profit per unit
        document.getElementById('resultNumCycles').textContent = formatInteger(cyclesCompleted); // Cycles completed
        document.getElementById('resultTotalUnits').textContent = formatInteger(totalUnitsProduced); // Total units
        document.getElementById('resultTotalProfit').textContent = formatNumber(totalAccumulatedProfit); // Total profit

        // Show the results section
        document.getElementById('results').style.display = 'block';

        // Update and display the leaderboard, passing input values
        updateLeaderboard(firstName, lastName, totalAccumulatedProfit, totalUnitsProduced, projectCost, laborCost, cycleTime);
    });
});