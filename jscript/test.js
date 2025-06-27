// DaangMatino Test Page JavaScript
// Map variables
let map;
let drawnItems = new L.FeatureGroup();
let currentMode = "node";
let roadNodes = [];
let roadPolylines = [];
let selectedRoad = null;

// Report data
let reports = [];
let reportIdCounter = 1;
let optimizedSchedule = [];
let alternativeRoutes = [];

// Road Type Scores
const roadTypeScores = {
    "national road": 100,
    "municipal": 75,
    "barangay road": 50,
    "bypass road": 25
};

// Defects mapping with response times and severity scores
const defectData = {
    "Potholes": { days: 3 },
    "Alligator Cracks": { days: 3 },
    "Major Scaling": { days: 30 },
    "Shoving and Corrugation": { days: 10 },
    "Pumping and Depression": { days: 30 },
    "No/Faded Road Markings": { days: 15 },
    "Defects on Shoulders": { days: 7 },
    "Lush Vegetation": { days: 3 },
    "Clogged Drains": { days: 3 },
    "Open Manhole": { days: 10 },
    "No/Inadequate Sealant in Joints": { days: 3 },
    "Cracks": { days: 3 },
    "Raveling": { days: 7 },
    "Unmaintained Signages and Road Markers": { days: 15 },
    "Unmaintained Bridges": { days: 15 },
    "Unmaintained Guardrails": { days: 15 }
};

// Sample data based on DPWH standards
const sampleReports = [
    {
        roadName: "EDSA Northbound KM 12",
        roadType: "national road",
        defects: ["Potholes", "Cracks"],
        severity: "critical",
        responseTime: 6,
        description: "Large pothole causing accidents",
        latlng: [14.5995, 120.9842],
        severityScore: 0,
        reportCount: 1
    },
    {
        roadName: "Quezon Avenue",
        roadType: "municipal",
        defects: ["Clogged Drains", "Lush Vegetation"],
        severity: "high",
        responseTime: 6,
        description: "Severe flooding during rainy season",
        latlng: [14.65, 121.03],
        severityScore: 0,
        reportCount: 1
    },
    {
        roadName: "Barangay 123 Access Road",
        roadType: "barangay road",
        defects: ["Raveling", "No/Faded Road Markings"],
        severity: "medium",
        responseTime: 10,
        description: "Surface deterioration and faded lane markings",
        latlng: [14.58, 120.98],
        severityScore: 0,
        reportCount: 1
    },
    {
        roadName: "C5 Bypass Road",
        roadType: "bypass road",
        defects: ["Potholes", "Alligator Cracks"],
        severity: "critical",
        responseTime: 9,
        description: "Multiple large potholes on northbound lane",
        latlng: [14.61, 121.06],
        severityScore: 0,
        reportCount: 1
    },
    {
        roadName: "Taft Avenue Bridge",
        roadType: "national road",
        defects: ["Unmaintained Bridges", "Open Manhole"],
        severity: "high",
        responseTime: 25,
        description: "Bridge structural damage observed",
        latlng: [14.56, 120.99],
        severityScore: 0,
        reportCount: 1
    }
];

// Hamburger menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navbar = document.querySelector('.navbar');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navbar.classList.toggle('active');
        });

        // Close menu when clicking on a nav link
        const navLinks = document.querySelectorAll('.navbar a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navbar.classList.remove('active');
            });
        });
    }
});

// Initialize map
function initMap() {
    // Set initial view to Philippines
    map = L.map("map").setView([14.5995, 120.9842], 13);

    // Add OSM tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add feature group to map
    drawnItems.addTo(map);
}

// Initialize the application
window.onload = function () {
    // Load sample data
    sampleReports.forEach((report) => {
        reports.push({
            id: reportIdCounter++,
            ...report,
            reportCount: Math.floor(Math.random() * 50) + 1,
            severityScore: calculateSeverityScore(report),
        });
    });
    updateReportsTable();
    updateStats();

    // Initialize the map
    initMap();

    // Set event listeners
    map.on("click", handleMapClick);

    // Generate defect checkboxes
    generateDefectCheckboxes();

    // Initialize visualization
    initVisualization();
};

// Generate defect checkboxes
function generateDefectCheckboxes() {
    const container = document.getElementById("defectsContainer");
    container.innerHTML = "";

    for (const defect in defectData) {
        const wrapper = document.createElement("div");
        wrapper.className = "defect-checkbox";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `defect-${defect.replace(/\s+/g, "-").toLowerCase()}`;
        checkbox.value = defect;
        checkbox.onchange = updateResponseTime;

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        // Only show defect name and days
        label.textContent = `${defect} (${defectData[defect].days} days)`;

        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        container.appendChild(wrapper);
    }
}

// Update response time based on selected defects
function updateResponseTime() {
    const checkboxes = document.querySelectorAll(
        '#defectsContainer input[type="checkbox"]'
    );
    let totalDays = 0;

    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            totalDays += defectData[checkbox.value].days;
        }
    });

    document.getElementById("responseTime").value = totalDays;
}

// Handle map clicks
function handleMapClick(e) {
    if (currentMode === "node") {
        // Add node marker
        const marker = L.marker(e.latlng, {
            draggable: true,
        })
            .addTo(drawnItems)
            .on("dragend", function (event) {
                // Update position when marker is dragged
                const marker = event.target;
                const position = marker.getLatLng();

                // Update roadNodes array
                const nodeIndex = roadNodes.findIndex(
                    (node) => node.lat === position.lat && node.lng === position.lng
                );
                if (nodeIndex !== -1) {
                    roadNodes[nodeIndex] = position;
                }

                // Recreate the road if we have at least 2 nodes
                if (roadNodes.length > 1) {
                    createRoadFromNodes();
                }
            });

        roadNodes.push(e.latlng);

        // Add node number
        marker
            .bindTooltip(`Node ${roadNodes.length}`, {
                permanent: true,
                direction: "right",
            })
            .openTooltip();

        // If we have at least 2 nodes, create the road
        if (roadNodes.length >= 2) {
            createRoadFromNodes();
        }

        updateSelectionInfo(
            `Selected ${roadNodes.length} node${roadNodes.length > 1 ? "s" : ""}`
        );

        // Update road name
        if (roadNodes.length === 1) {
            reverseGeocode(roadNodes[0]).then((roadName) => {
                document.getElementById("roadName").value = roadName;
            });
        } else if (roadNodes.length >= 2) {
            reverseGeocode(roadNodes[0]).then((startName) => {
                reverseGeocode(roadNodes[roadNodes.length - 1]).then(
                    (endName) => {
                        document.getElementById(
                            "roadName"
                        ).value = `${startName} to ${endName}`;
                    }
                );
            });
        }

        // Detect road type from OSM
        detectRoadType();
    }
}

// Detect road type from OSM
async function detectRoadType() {
    if (roadNodes.length === 0) return;

    // Use the first node to detect road type
    const node = roadNodes[0];
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${node.lat}&lon=${node.lng}`
        );
        const data = await response.json();

        let roadType = "Unknown";

        if (data.address) {
            // Try to get the road classification
            if (data.address.road) {
                // Classify based on road name patterns
                if (
                    data.address.road.includes("Highway") ||
                    data.address.road.includes("Expressway")
                ) {
                    roadType = "national road";
                } else if (
                    data.address.road.includes("Avenue") ||
                    data.address.road.includes("Boulevard")
                ) {
                    roadType = "municipal";
                } else if (
                    data.address.road.includes("Street") ||
                    data.address.road.includes("Road")
                ) {
                    roadType = "barangay road";
                } else {
                    roadType = "bypass road";
                }
            }

            // Try to get from OSM tags if available
            if (data.extratags) {
                if (
                    data.extratags.highway === "motorway" ||
                    data.extratags.highway === "trunk"
                ) {
                    roadType = "national road";
                } else if (data.extratags.highway === "primary") {
                    roadType = "national road";
                } else if (data.extratags.highway === "secondary") {
                    roadType = "municipal";
                } else if (data.extratags.highway === "tertiary") {
                    roadType = "barangay road";
                } else if (data.extratags.highway === "unclassified" ||
                           data.extratags.highway === "service") {
                    roadType = "bypass road";
                }
            }
        }

        document.getElementById("detectedRoadType").value = roadType;
    } catch (error) {
        console.error("Road type detection error:", error);
        document.getElementById("detectedRoadType").value = "Unknown";
    }
}

// Create road from selected nodes using OSM routing
function createRoadFromNodes() {
    // Clear previous road if exists
    if (selectedRoad) {
        drawnItems.removeLayer(selectedRoad);
    }

    // Remove any existing polylines
    roadPolylines.forEach((polyline) => {
        drawnItems.removeLayer(polyline);
    });
    roadPolylines = [];

    // Create route between consecutive nodes
    for (let i = 0; i < roadNodes.length - 1; i++) {
        getOSRMRoute(roadNodes[i], roadNodes[i + 1])
            .then((route) => {
                if (route) {
                    const polyline = L.polyline(route, {
                        color: "#ff6b6b",
                        weight: 4,
                    }).addTo(drawnItems);
                    roadPolylines.push(polyline);
                }
            })
            .catch((error) => {
                console.error("Routing error:", error);
                // Fallback: straight line
                const polyline = L.polyline([roadNodes[i], roadNodes[i + 1]], {
                    color: "#3498db",
                    weight: 4,
                    dashArray: "5, 10",
                }).addTo(drawnItems);
                roadPolylines.push(polyline);
            });
    }
}

// Get OSRM route between two points
async function getOSRMRoute(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === "Ok" && data.routes.length > 0) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates.map((coord) => [
                coord[1],
                coord[0],
            ]);
            return coordinates;
        }
    } catch (error) {
        console.error("OSRM request failed:", error);
        throw error;
    }
}

// Reverse geocode coordinates to road name
async function reverseGeocode(latlng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
        );
        const data = await response.json();

        if (data.address) {
            return (
                data.address.road ||
                data.address.highway ||
                data.address.suburb ||
                "Unnamed Road"
            );
        }
        return "Unknown Road";
    } catch (error) {
        console.error("Geocoding error:", error);
        return "Unknown Road";
    }
}

// Update selection info display
function updateSelectionInfo(text) {
    document.getElementById("selectionInfo").innerHTML = text;
}

// Set interaction mode
function setMode(mode) {
    currentMode = mode;
    updateSelectionInfo(
        mode === "node"
            ? "Click on the map to select nodes"
            : "Click on the map to start drawing a road"
    );
}

// Clear current selection
function clearSelection() {
    drawnItems.clearLayers();
    roadNodes = [];
    roadPolylines = [];
    selectedRoad = null;
    document.getElementById("roadName").value = "";
    document.getElementById("detectedRoadType").value = "";
    updateSelectionInfo("Click on the map to select nodes");

    // Clear defect checkboxes
    const checkboxes = document.querySelectorAll(
        '#defectsContainer input[type="checkbox"]'
    );
    checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
    });
    document.getElementById("responseTime").value = "0";
}

// Tab switching
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
    });

    // Remove active class from all tabs
    document.querySelectorAll(".tab").forEach((tab) => {
        tab.classList.remove("active");
    });

    // Show selected tab content
    document.getElementById(tabName + "-tab").classList.add("active");

    // Add active class to selected tab
    event.target.classList.add("active");
}

// Submit report
function submitReport() {
    const roadName = document.getElementById("roadName").value.trim();
    const roadType = document.getElementById("detectedRoadType").value;
    const severity = document.getElementById("severity").value;
    const responseTime = parseInt(
        document.getElementById("responseTime").value
    );
    const description = document.getElementById("description").value.trim();

    if (!roadName || !responseTime || responseTime === 0) {
        alert("Please select defects and ensure road is properly selected");
        return;
    }

    // Get selected defects
    const selectedDefects = [];
    const checkboxes = document.querySelectorAll(
        '#defectsContainer input[type="checkbox"]:checked'
    );
    checkboxes.forEach((checkbox) => {
        selectedDefects.push(checkbox.value);
    });

    // Check if road already exists
    const existingReport = reports.find(
        (r) => r.roadName.toLowerCase() === roadName.toLowerCase()
    );

    if (existingReport) {
        existingReport.reportCount++;
        if (
            getSeverityScore(severity) >
            getSeverityScore(existingReport.severity)
        ) {
            existingReport.severity = severity;
            existingReport.defects = selectedDefects;
            existingReport.responseTime = responseTime;
            existingReport.description = description;
        }
    } else {
        const report = {
            id: reportIdCounter++,
            roadName,
            roadType,
            defects: selectedDefects,
            severity,
            responseTime,
            description,
            reportCount: 1,
            severityScore: 0,
        };
        reports.push(report);
    }

    updateReportsTable();
    updateStats();
    clearReportForm();

    alert("Report submitted successfully!");
}

// Clear report form
function clearReportForm() {
    document.getElementById("description").value = "";
    document.getElementById("responseTime").value = "0";
    clearSelection();
}

// Remove report
function removeReport(id) {
    reports = reports.filter((r) => r.id !== id);
    updateReportsTable();
    updateStats();
}

// Get severity score
function getSeverityScore(severity) {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 };
    return scores[severity] || 0;
}

// Calculate severity score
function calculateSeverityScore(report) {
    // Road Type Score (RTS)
    const rts = roadTypeScores[report.roadType] || 0;
    
    // Road Defect Score (RDS) - sum of severity scores for all defects
    let rds = 0;
    report.defects.forEach(defect => {
        rds += defectData[defect]?.severity || 0;
    });
    
    // Report Frequency Score (RFS) - normalized to 0-100
    const rfs = Math.min(100, report.reportCount * 5);
    
    // Calculate severity score
    const severityScore = (rts * 0.40) + (rds * 0.50) + (rfs * 0.10);
    
    return Math.round(severityScore);
}

// Update reports table
function updateReportsTable() {
    const tbody = document.getElementById("reportsBody");

    if (reports.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="8" class="empty-state">No reports submitted yet. Be the first to report a road defect!</td></tr>';
        return;
    }

    // Calculate severity scores
    reports.forEach((report) => {
        report.severityScore = calculateSeverityScore(report);
    });

    tbody.innerHTML = reports
        .map(
            (report) => `
                <tr class="animate-in">
                    <td><strong>${report.roadName}</strong></td>
                    <td><span class="road-${report.roadType.replace(' ', '-')}">${report.roadType}</span></td>
                    <td>${report.defects.join(", ")}</td>
                    <td><span class="severity-${report.severity}">${report.severity.toUpperCase()}</span></td>
                    <td>${report.responseTime} days</td>
                    <td><strong>${report.reportCount}</strong></td>
                    <td><strong>${report.severityScore}</strong></td>
                    <td><button class="btn-danger" onclick="removeReport(${report.id})">Remove</button></td>
                </tr>
            `
        )
        .join("");
}

// Update statistics
function updateStats() {
    document.getElementById("totalReports").textContent = reports.length;
    document.getElementById("criticalIssues").textContent = reports.filter(
        (r) => r.severity === "critical"
    ).length;

    const avgResponse =
        reports.length > 0
            ? Math.round(
                  reports.reduce((sum, r) => sum + r.responseTime, 0) /
                  reports.length
              )
            : 0;
    document.getElementById("avgResponseTime").textContent = avgResponse;
}

// Knapsack Algorithm Implementation
function knapsackOptimization(reports, timeBudget) {
    const n = reports.length;
    if (n === 0)
        return { selectedReports: [], totalValue: 0, totalTime: 0 };

    const dp = Array(n + 1)
        .fill(null)
        .map(() => Array(timeBudget + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        for (let w = 0; w <= timeBudget; w++) {
            const report = reports[i - 1];
            if (report.responseTime <= w) {
                dp[i][w] = Math.max(
                    dp[i - 1][w],
                    dp[i - 1][w - report.responseTime] + report.severityScore
                );
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    // Backtrack to find selected reports
    const selectedReports = [];
    let w = timeBudget;
    for (let i = n; i > 0 && dp[i][w] > 0; i--) {
        if (dp[i][w] !== dp[i - 1][w]) {
            selectedReports.unshift(reports[i - 1]);
            w -= reports[i - 1].responseTime;
        }
    }

    return {
        selectedReports,
        totalValue: dp[n][timeBudget],
        totalTime: selectedReports.reduce(
            (sum, r) => sum + r.responseTime,
            0
        ),
    };
}

// QuickSort Implementation
function quickSort(arr) {
    if (arr.length <= 1) {
        return arr;
    }

    const pivot = arr[0];
    const left = [];
    const right = [];

    for (let i = 1; i < arr.length; i++) {
        if (arr[i].severityScore > pivot.severityScore) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }

    return [...quickSort(left), pivot, ...quickSort(right)];
}

// Run optimization
function runOptimization() {
    const timeBudget =
        parseInt(document.getElementById("maintenanceBudget").value) || 180;

    // Knapsack optimization
    const knapsackResult = knapsackOptimization(reports, timeBudget);
    document.getElementById("knapsackResults").innerHTML = `
        <p><strong>Total Severity Score:</strong> ${knapsackResult.totalValue}</p>
        <p><strong>Time Required:</strong> ${knapsackResult.totalTime} days</p>
        <p><strong>Selected Roads:</strong></p>
        ${knapsackResult.selectedReports
            .map(
                (r, i) => `
                <div class="road-item">
                    <strong>${r.roadName}</strong><br>
                    Severity: ${r.severity} | Response Time: ${r.responseTime} days<br>
                    Score: ${r.severityScore}
                    <div class="score-breakdown">
                        <div class="score-row">
                            <span>Road Type Score:</span>
                            <span class="score-value">${roadTypeScores[r.roadType] || 0}</span>
                        </div>
                        <div class="score-row">
                            <span>Report Count Score:</span>
                            <span class="score-value">${Math.min(100, r.reportCount * 5)}</span>
                        </div>
                    </div>
                </div>
            `
            )
            .join("")}
    `;

    // QuickSort optimization
    const sortedReports = quickSort([...knapsackResult.selectedReports]);
    document.getElementById("quicksortResults").innerHTML = `
        <p><strong>Prioritized Maintenance Order:</strong></p>
        ${sortedReports
            .map(
                (r, i) => `
                <div class="road-item">
                    <strong>Priority ${i + 1}: ${r.roadName}</strong><br>
                    Severity: ${r.severity} | Score: ${r.severityScore}<br>
                    Response Time: ${r.responseTime} days
                </div>
            `
            )
            .join("")}
    `;

    // Dijkstra route planning (simulated)
    document.getElementById("dijkstraResults").innerHTML = `
        <h3>🗺️ Dijkstra Route Planning</h3>
        <p><strong>Purpose:</strong> Find optimal alternative routes during maintenance periods</p>
        <div class="route-visualization">
            <h4>Optimal Maintenance Route</h4>
            <div class="route-step">
                <span>🏁 Start: Maintenance Depot</span>
            </div>
            ${sortedReports
                .map(
                    (r, i) => `
                    <div class="route-step">
                        <span class="route-arrow">→</span>
                        <span>${i + 1}. ${r.roadName}</span>
                    </div>
                `
                )
                .join("")}
            <div class="route-step">
                <span class="route-arrow">→</span>
                <span>🏁 Return to Depot</span>
            </div>
        </div>
        <p><strong>Total Distance:</strong> ${(Math.random() * 100 + 50).toFixed(1)} km</p>
        <p><strong>Estimated Travel Time:</strong> ${(Math.random() * 5 + 2).toFixed(1)} hours</p>
    `;

    // Show results
    document.getElementById("algorithmResults").style.display = "grid";

    // Update budget utilization
    const utilization = Math.round(
        (knapsackResult.totalTime / timeBudget) * 100
    );
    document.getElementById(
        "budgetUtilization"
    ).textContent = `${utilization}%`;

    // Generate maintenance schedule
    generateMaintenanceSchedule(sortedReports);

    // Update visualization
    updateVisualization(sortedReports);
}

// Generate maintenance schedule
function generateMaintenanceSchedule(sortedReports) {
    if (sortedReports.length === 0) return;

    let scheduleHTML = '<div class="route-visualization">';
    let currentDate = new Date();

    sortedReports.forEach((report, index) => {
        const startDate = new Date(currentDate);
        const endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + report.responseTime);

        scheduleHTML += `
            <div class="route-step">
                <strong>${report.roadName}</strong><br>
                Start: ${startDate.toLocaleDateString()}<br>
                End: ${endDate.toLocaleDateString()}<br>
                Duration: ${report.responseTime} days
            </div>
        `;

        // Move to next date
        currentDate.setDate(currentDate.getDate() + report.responseTime + 1);
    });

    scheduleHTML += "</div>";
    document.getElementById("maintenanceSchedule").innerHTML = scheduleHTML;
}

// Initialize visualization
function initVisualization() {
    const slider = document.getElementById("day-slider");
    if (slider) {
        slider.addEventListener("input", () => {
            updateVisualizationDisplay(slider.value);
        });
        updateVisualizationDisplay(slider.value);
    }
}

// Update visualization display
function updateVisualizationDisplay(day) {
    const currentDayElement = document.getElementById("current-day");
    const timelineDayElement = document.getElementById("timeline-day");
    
    if (currentDayElement) currentDayElement.textContent = day;
    if (timelineDayElement) timelineDayElement.textContent = day;

    // Update road stats based on day
    let available = 18;
    let maintenance = 5;
    let blocked = 7;

    if (day < 5) {
        available = 12;
        maintenance = 3;
        blocked = 15;
    } else if (day < 10) {
        available = 15;
        maintenance = 4;
        blocked = 11;
    } else if (day < 15) {
        available = 17;
        maintenance = 5;
        blocked = 8;
    } else if (day < 20) {
        available = 18;
        maintenance = 5;
        blocked = 7;
    } else if (day < 25) {
        available = 20;
        maintenance = 4;
        blocked = 6;
    } else {
        available = 23;
        maintenance = 2;
        blocked = 5;
    }

    const availableRoadsElement = document.getElementById("available-roads");
    const maintenanceRoadsElement = document.getElementById("maintenance-roads");
    const blockedRoadsElement = document.getElementById("blocked-roads");
    
    if (availableRoadsElement) availableRoadsElement.textContent = available;
    if (maintenanceRoadsElement) maintenanceRoadsElement.textContent = maintenance;
    if (blockedRoadsElement) blockedRoadsElement.textContent = blocked;

    // Update the visualization
    const map = document.getElementById("network-map");
    if (map) {
        map.innerHTML =
            '<div style="height:100%;background:linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;position:relative;">' +
            `<div class="road" style="position:absolute;top:20%;left:10%;width:80%;height:8px;background:${
                day >= 7 ? "#2ed573" : day >= 1 ? "#ffa502" : "#ff4757"
            };border-radius:4px;"></div>` +
            `<div class="road" style="position:absolute;top:40%;left:10%;width:80%;height:8px;background:${
                day >= 10 ? "#2ed573" : day >= 3 ? "#ffa502" : "#ff4757"
            };border-radius:4px;"></div>` +
            `<div class="road" style="position:absolute;top:60%;left:10%;width:80%;height:8px;background:${
                day >= 25 ? "#2ed573" : day >= 18 ? "#ffa502" : "#ff4757"
            };border-radius:4px;"></div>` +
            '<div class="node" style="position:absolute;top:20%;left:10%;width:20px;height:20px;background:#FFD300;border-radius:50%;border:3px solid white;"></div>' +
            '<div class="node" style="position:absolute;top:20%;left:90%;width:20px;height:20px;background:#FFD300;border-radius:50%;border:3px solid white;"></div>' +
            '<div class="node" style="position:absolute;top:40%;left:30%;width:20px;height:20px;background:#FFD300;border-radius:50%;border:3px solid white;"></div>' +
            '<div class="node" style="position:absolute;top:40%;left:70%;width:20px;height:20px;background:#FFD300;border-radius:50%;border:3px solid white;"></div>' +
            '<div class="node" style="position:absolute;top:60%;left:50%;width:20px;height:20px;background:#FFD300;border-radius:50%;border:3px solid white;"></div>' +
            `<div class="road" style="position:absolute;top:50%;left:10%;width:8px;height:40%;background:${
                day >= 12 ? "#2ed573" : day >= 5 ? "#ffa502" : "#ff4757"
            };border-radius:4px;"></div>` +
            `<div class="road" style="position:absolute;top:40%;left:50%;width:8px;height:20%;background:${
                day >= 20 ? "#2ed573" : day >= 12 ? "#ffa502" : "#ff4757"
            };border-radius:4px;"></div>` +
            `<div style="position:absolute;top:10px;left:10px;background:white;padding:10px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0.1);">Day ${day} of 30</div>` +
            "</div>";
    }
}

// Update visualization with optimized schedule
function updateVisualization(sortedReports) {
    if (sortedReports.length === 0) return;

    // Clear existing list
    const roadList = document.getElementById("visualization-road-list");
    if (!roadList) return;
    
    roadList.innerHTML = "";

    // Add new items based on optimized schedule
    sortedReports.forEach((report, index) => {
        const statuses = ["status-pending", "status-active", "status-completed"];
        const statusClasses = ["status-pending", "status-active", "status-completed"];
        const statusTexts = ["Planned", "In Progress", "Completed"];

        const statusIndex = Math.min(index, 2);
        const startDay = index * 5 + 1;
        const endDay = startDay + report.responseTime - 1;

        const roadItem = document.createElement("div");
        roadItem.className = "road-item-vis";
        roadItem.innerHTML = `
            <div>
                <span class="road-status ${statusClasses[statusIndex]}"></span>
                <span class="road-name">${report.roadName}</span>
            </div>
            <div class="road-days">Days ${startDay}-${endDay}</div>
        `;
        roadList.appendChild(roadItem);
    });
}
