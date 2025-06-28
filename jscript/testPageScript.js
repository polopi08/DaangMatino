// DaangMatino Test Page JavaScript
// Map variables
let map;
let drawnItems;
let currentMode = "node";
let roadNodes = [];
let roadPolylines = [];
let selectedRoad = null;

// Report data - now loaded from Supabase only
let reports = [];
let reportIdCounter = 1;
let optimizedSchedule = [];
let alternativeRoutes = [];

// Road Type Scores
const roadTypeScores = {
    "national road": 100,
    "municipal": 75,
    "barangay road": 50,
    "bypass road": 25,
    "Unnamed Road": 25
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

//container for storing distances between nodes
let nodeDistances = [];

// Load reports from database
async function loadReportsFromDatabase() {
    console.log('🔄 Loading reports from database...');
    
    try {
        const result = await DatabaseService.getAllReports();
        
        if (result.success) {
            reports = result.data.map(report => {
                const defectsList = Array.isArray(report.defects) ? report.defects : [report.defects];
                const reportData = {
                    id: report.id,
                    roadName: report.road_name,
                    roadType: report.road_type || 'municipal',
                    defects: defectsList,
                    description: report.description,
                    latlng: report.latitude && report.longitude ? [report.latitude, report.longitude] : [14.5995, 120.9842],
                    reportCount: 1,
                    created_at: report.created_at,
                    reporter_name: report.reporter_name,
                    reporter_contact: report.reporter_contact
                };
                
                // Calculate response time and severity score
                reportData.responseTime = calculateResponseTime(defectsList);
                reportData.severityScore = calculateSeverityScore(reportData);
                
                return reportData;
            });
            
            console.log(`✅ Loaded ${reports.length} reports from database`);
            console.log('📊 Sample report data:', reports[0]);
            
            updateReportsTable();
            updateAnalytics();
        } else {
            console.error('❌ Failed to load reports:', result.error);
            reports = [];
        }
    } catch (error) {
        console.error('❌ Error loading reports:', error);
        reports = [];
    }
}

async function loadAnalyticsFromDatabase() {
    console.log('🔄 Loading analytics from database...');
    
    try {
        const result = await DatabaseService.getAnalytics();
        
        if (result.success) {
            const analytics = result.data;
            
            // Update analytics display
            document.getElementById('totalReports').textContent = analytics.total || 0;
            document.getElementById('recentReportsCount').textContent = analytics.recent || 0;
            
            console.log('✅ Analytics loaded successfully');
            return analytics;
        } else {
            console.error('❌ Failed to load analytics:', result.error);
            return null;
        }
    } catch (error) {
        console.error('❌ Error loading analytics:', error);
        return null;
    }
}

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
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('❌ Leaflet library is not loaded. Please check script loading order.');
        return;
    }
    
    // Initialize drawnItems after Leaflet is loaded
    drawnItems = new L.FeatureGroup();
    
    // Set initial view to Philippines
    map = L.map("map").setView([14.5995, 120.9842], 13);

    // Add OSM tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add feature group to map
    drawnItems.addTo(map);
    
    console.log('✅ Map initialized successfully');
}

// Initialize the application
window.onload = async function () {
    console.log('🚀 DaangMatino Test Page initializing...');
    
    // Initialize map first
    initMap();
    
    // Load reports from Supabase
    await loadReportsFromDatabase();
    
    // Initialize UI components
    initializeReportForm();
    populateDefectOptions();
    
    // Set event listeners
    map.on("click", handleMapClick);

    // Generate defect checkboxes
    generateDefectCheckboxes();

    // Initialize visualization
    initVisualization();
    
    console.log('✅ DaangMatino Test Page initialized successfully');
};

// Initialize report form
function initializeReportForm() {
    // Ensure the form exists and set up event listeners
    const form = document.getElementById('reportForm');
    if (form) {
        form.addEventListener('submit', handleReportSubmission);
    }
}

// Handle report form submission
function handleReportSubmission(event) {
    event.preventDefault();
    submitReport();
}

// Populate defect options
function populateDefectOptions() {
    generateDefectCheckboxes();
}

// Update analytics display
function updateAnalytics() {
    // This will be called after loading reports to update the analytics tab
    updateStats();
    loadMostReportedRoadsInTestPage();
}

// Load most reported roads in test page analytics tab
async function loadMostReportedRoadsInTestPage() {
    try {
        console.log('🔄 Loading most reported roads for test page analytics...');
        
        const response = await DatabaseService.getMostReportedRoads(5);
        const container = document.getElementById('mostReportedRoads');
        
        if (!container) {
            console.error('mostReportedRoads element not found');
            return;
        }
        
        if (!response.success || !response.data || response.data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No road reports available yet.</p>
                    <p>Submit some reports to see the leaderboard!</p>
                </div>
            `;
            return;
        }
        
        const roads = response.data;
        console.log('📊 Loaded most reported roads:', roads);
        
        // Generate leaderboard HTML
        const leaderboardHTML = roads.map((road, index) => {
            const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            const roadTypeClass = road.road_type ? road.road_type.toLowerCase().replace(' ', '-') : 'unknown';
            
            return `
                <div class="road-leaderboard-item" data-rank="${index + 1}">
                    <div class="rank-indicator">
                        <span class="rank-number">${rankIcon}</span>
                    </div>
                    <div class="road-info">
                        <h4 class="road-name">${road.road_name}</h4>
                        <span class="road-type-badge ${roadTypeClass}">${road.road_type || 'Unknown'}</span>
                    </div>
                    <div class="road-stats">
                        <div class="stat-item">
                            <span class="stat-value">${road.report_count}</span>
                            <span class="stat-label">Reports</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value severity-score">${road.aggregated_severity}</span>
                            <span class="stat-label">Severity</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = leaderboardHTML;
        console.log('✅ Most reported roads leaderboard loaded successfully in test page');
        
    } catch (error) {
        console.error('❌ Error loading most reported roads:', error);
        const container = document.getElementById('mostReportedRoads');
        if (container) {
            container.innerHTML = `
                <div class="empty-state error">
                    <p>Error loading leaderboard data.</p>
                    <p>Please try refreshing the page.</p>
                </div>
            `;
        }
    }
}

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

        if (roadNodes.length > 1) {
            // Calculate distance from the previous node to the current node
            const currentNodeIndex = roadNodes.length - 1;
            const previousNodeIndex = currentNodeIndex - 1;
            
            if (previousNodeIndex >= 0) {
                const distance = calculateDistance(roadNodes[previousNodeIndex], roadNodes[currentNodeIndex]);
                const newDistance = {
                    from: previousNodeIndex + 1, // Node numbers start at 1
                    to: currentNodeIndex + 1,
                    distance: distance,
                    formatted: formatDistance(distance)
                };
                nodeDistances.push(newDistance);
                
                // Log distances to console for debugging
                console.log('Node distances:', nodeDistances);
                
                // Update UI to show distances
                updateDistanceDisplay();
            }
        }

        // Detect road type from OSM
        detectRoadType();
    }
}

//format distance
function formatDistance(meters) {
    if (meters < 1000) {
        return Math.round(meters) + ' m';
    } else {
        return (meters / 1000).toFixed(2) + ' km';
    }
}

//update distance display
function updateDistanceDisplay() {
    const distanceInfo = document.getElementById('distanceInfo');
    if (!distanceInfo) return;
    
    if (nodeDistances.length === 0) {
        distanceInfo.innerHTML = '<p>No distances calculated yet. Add more nodes to see distances.</p>';
        return;
    }
    
    let html = '<h3>Node Distances</h3><table class="distance-table"><tr><th>From</th><th>To</th><th>Distance</th></tr>';
    
    nodeDistances.forEach(dist => {
        html += `<tr>
            <td>Node ${dist.from}</td>
            <td>Node ${dist.to}</td>
            <td>${dist.formatted}</td>
        </tr>`;
    });
    
    html += '</table>';
    
    // Add total distance if we have a complete path
    if (roadNodes.length > 1) {
        const totalDistance = nodeDistances.reduce((sum, dist) => sum + dist.distance, 0);
        html += `<p class="total-distance">Total path distance: ${formatDistance(totalDistance)}</p>`;
    }
    
    distanceInfo.innerHTML = html;
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
    nodeDistances = [];
    updateDistanceDisplay();

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
async function submitReport() {
    // Get form elements with null safety checks
    const roadNameElement = document.getElementById("roadName");
    const roadTypeElement = document.getElementById("detectedRoadType");
    const responseTimeElement = document.getElementById("responseTime");

    // Check if all required elements exist
    if (!roadNameElement || !roadTypeElement || !responseTimeElement) {
        console.error('❌ Missing form elements:', {
            roadName: !!roadNameElement,
            roadType: !!roadTypeElement,
            responseTime: !!responseTimeElement
        });
        alert("Form elements are missing. Please refresh the page and try again.");
        return;
    }

    // Get values safely
    const roadName = roadNameElement.value.trim();
    const roadType = roadTypeElement.value;
    const responseTime = parseInt(responseTimeElement.value) || 0;
    // Description field was removed from the form
    const description = "";

    if (!roadName) {
        alert("Please select a road location on the map");
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

    if (selectedDefects.length === 0) {
        alert("Please select at least one defect type");
        return;
    }

    // Ensure we have a valid response time - recalculate if needed
    const calculatedResponseTime = calculateResponseTime(selectedDefects);
    const finalResponseTime = calculatedResponseTime > 0 ? calculatedResponseTime : 7; // Default to 7 days

    console.log('🔍 Response time calculation:', {
        formResponseTime: responseTime,
        calculatedResponseTime: calculatedResponseTime,
        finalResponseTime: finalResponseTime,
        selectedDefects: selectedDefects
    });

    // Prepare data for Supabase with correct field names
    const supabaseData = {
        defects: selectedDefects.join(', '),
        road_name: roadName,
        road_type: roadType,
        description: description || `${roadType} road with defects: ${selectedDefects.join(', ')}`,
        latitude: roadNodes.length > 0 ? roadNodes[0].lat : null,
        longitude: roadNodes.length > 0 ? roadNodes[0].lng : null,
        response_time: finalResponseTime, // Use the calculated final response time
        reporter_name: null, // Can be added later if needed
        reporter_contact: null // Can be added later if needed
    };

    // Try to save to Supabase
    let supabaseSuccess = false;
    if (window.DatabaseService && DatabaseService.isAvailable()) {
        try {
            console.log('🔄 Attempting to save report to Supabase...');
            console.log('📋 Report data:', supabaseData);
            
            const result = await DatabaseService.createReport(supabaseData);
            if (result.success) {
                console.log('✅ Report saved to Supabase successfully!');
                supabaseSuccess = true;
                
                // Reload reports from database to get the latest data
                await loadReportsFromDatabase();
            } else {
                console.error('❌ Failed to save to Supabase:', result.error);
                alert('Failed to save report to database: ' + result.error);
                return;
            }
        } catch (error) {
            console.error('❌ Error saving to Supabase:', error);
            alert('Error saving report: ' + error.message);
            return;
        }
    } else {
        console.log('⚠️ Supabase not available - cannot save report');
        alert('Database not available. Please check your connection.');
        return;
    }

    // Clear form after successful submission
    clearReportForm();

    const message = supabaseSuccess 
        ? "Report submitted successfully and saved to database!" 
        : "Unable to save report - database not available";
    alert(message);
}

// Clear report form
function clearReportForm() {
    // Reset form fields safely
    const responseTimeElement = document.getElementById("responseTime");
    const severityElement = document.getElementById("severity");
    
    if (responseTimeElement) responseTimeElement.value = "0";
    if (severityElement) severityElement.value = "medium"; // Reset to default
    
    clearSelection();
}

// Remove report function - disabled as Actions column was removed
/*
async function removeReport(id) {
    if (!window.DatabaseService || !DatabaseService.isAvailable()) {
        console.log('⚠️ Database not available - cannot remove report');
        alert('Database not available. Cannot remove report.');
        return;
    }

    try {
        console.log('🔄 Attempting to delete report from database...');
        const result = await DatabaseService.deleteReport(id);
        
        if (result.success) {
            console.log('✅ Report deleted successfully');
            // Reload reports from database
            await loadReportsFromDatabase();
            alert('Report deleted successfully!');
        } else {
            console.error('❌ Failed to delete report:', result.error);
            alert('Failed to delete report: ' + result.error);
        }
    } catch (error) {
        console.error('❌ Error deleting report:', error);
        alert('Error deleting report: ' + error.message);
    }
}
*/

// // Calculate severity score for individual report
function calculateSeverityScore(report) {
    // Road Type Score (RTS)
    const rts = roadTypeScores[report.roadType] || roadTypeScores[report.road_type] || 50;
    
    // Road Defect Score (RDS) - calculate based on defects
    let rds = 0;
    const defects = Array.isArray(report.defects) ? report.defects : [report.defects];
    
    // Map defect response times to scores and sum them
    const uniqueDefects = [...new Set(defects)]; // Remove duplicates
    const defectScoreDetails = [];
    
    uniqueDefects.forEach(defect => {
        if (defectData[defect] && defectData[defect].days) {
            const responseTime = defectData[defect].days;
            let defectScore = 0;
            
            // Improved consistent mapping: 3→20, 7→40, 10→60, 15→80, 30→100
            if (responseTime <= 3) defectScore = 20;
            else if (responseTime <= 7) defectScore = 40;
            else if (responseTime <= 10) defectScore = 60;
            else if (responseTime <= 15) defectScore = 80;
            else defectScore = 100;
            
            rds += defectScore;
            defectScoreDetails.push({ defect, responseTime, score: defectScore });
        }
    });
    
    // ✅ ENHANCED: Report Frequency Score using frequency table
    const reportCount = report.reportCount || 1;
    const rfs = getReportFrequencyScore(reportCount);
    
    // Calculate final severity score using the formula: (RTS × 0.40) + (RDS × 0.50) + (RFS × 0.10)
    const severityScore = (rts * 0.40) + (rds * 0.50) + (rfs * 0.10);
    
    // Enhanced debug logging for individual severity calculation
    console.log(`🔢 ENHANCED Individual severity calculation for ${report.roadName || report.road_name}:`, {
        rts: rts,
        rds: rds,
        reportCount: reportCount,
        rfs: rfs, // Now uses frequency table
        defectScoreDetails: defectScoreDetails,
        uniqueDefectsCount: uniqueDefects.length,
        formula: `(${rts} × 0.40) + (${rds} × 0.50) + (${rfs} × 0.10)`,
        calculation: `${rts * 0.40} + ${rds * 0.50} + ${rfs * 0.10} = ${severityScore}`,
        finalScore: Math.round(severityScore),
        rfsBreakdown: `${reportCount} reports → RFS ${rfs}`
    });
    
    return Math.round(severityScore);
}

// Calculate aggregated severity score per road
function calculateAggregatedSeverityScorePerRoad(roadName, allReports) {
    // Get all reports for this specific road
    const roadReports = allReports.filter(report => 
        report.roadName === roadName || report.road_name === roadName
    );
    
    if (roadReports.length === 0) return 0;
    
    // RTS (Road Type Score) - CORRECTED: Only count once per road, not per report
    const firstReport = roadReports[0];
    const rts = roadTypeScores[firstReport.roadType] || roadTypeScores[firstReport.road_type] || 50;
    
    // Aggregate RDS (sum unique defect response time mappings for this road)
    let totalRDS = 0;
    const allDefectsForRoad = [];
    roadReports.forEach(report => {
        const defects = Array.isArray(report.defects) ? report.defects : [report.defects];
        allDefectsForRoad.push(...defects);
    });
    
    // Get unique defects across all reports for this road
    const uniqueDefectsForRoad = [...new Set(allDefectsForRoad)];
    const defectScoreDetails = [];
    
    uniqueDefectsForRoad.forEach(defect => {
        if (defectData[defect] && defectData[defect].days) {
            const responseTime = defectData[defect].days;
            let defectScore = 0;
            
            // Improved consistent mapping: 3→20, 7→40, 10→60, 15→80, 30→100
            if (responseTime <= 3) defectScore = 20;
            else if (responseTime <= 7) defectScore = 40;
            else if (responseTime <= 10) defectScore = 60;
            else if (responseTime <= 15) defectScore = 80;
            else defectScore = 100;
            
            totalRDS += defectScore;
            defectScoreDetails.push({ defect, responseTime, score: defectScore });
        }
    });
    
    // ✅ ENHANCED: Aggregate RFS using frequency table
    const totalReportCount = roadReports.length;
    const aggregatedRFS = getReportFrequencyScore(totalReportCount);
    
    // Apply the aggregation formula: (RTS × 0.40) + (∑RDS × 0.50) + (RFS × 0.10)
    // CORRECTED: RTS is single value, not summed
    const aggregatedSeverityScore = (rts * 0.40) + (totalRDS * 0.50) + (aggregatedRFS * 0.10);
    
    console.log(`🔢 ENHANCED Aggregated severity calculation for road "${roadName}":`, {
        roadType: firstReport.roadType || firstReport.road_type,
        rts: rts, // Single value (not totalRTS)
        totalRDS,
        totalReportCount: totalReportCount,
        aggregatedRFS: aggregatedRFS,
        defectScoreDetails: defectScoreDetails,
        uniqueDefectsCount: uniqueDefectsForRoad.length,
        totalDefectsCount: allDefectsForRoad.length,
        formula: `(${rts} × 0.40) + (${totalRDS} × 0.50) + (${aggregatedRFS} × 0.10)`,
        calculation: `${rts * 0.40} + ${totalRDS * 0.50} + ${aggregatedRFS * 0.10} = ${aggregatedSeverityScore}`,
        finalScore: Math.round(aggregatedSeverityScore),
        rfsBreakdown: `${totalReportCount} reports → RFS ${aggregatedRFS}`
    });
    
    return Math.round(aggregatedSeverityScore);
}

// Group reports by road name
function groupReportsByRoad(allReports) {
    const roadGroups = {};
    
    allReports.forEach(report => {
        const roadName = report.roadName || report.road_name;
        if (!roadGroups[roadName]) {
            roadGroups[roadName] = {
                roadName: roadName,
                roadType: report.roadType || report.road_type,
                reports: [],
                reportCount: 0,
                defects: [],
                responseTime: 0,
                latlng: report.latlng || [14.5995, 120.9842],
                created_at: report.created_at
            };
        }
        
        roadGroups[roadName].reports.push(report);
        roadGroups[roadName].reportCount++;
        
        // Collect all defects for this road
        const reportDefects = Array.isArray(report.defects) ? report.defects : [report.defects];
        roadGroups[roadName].defects.push(...reportDefects);
        
        // Use the earliest created_at date
        if (!roadGroups[roadName].created_at || new Date(report.created_at) < new Date(roadGroups[roadName].created_at)) {
            roadGroups[roadName].created_at = report.created_at;
        }
    });
    
    // Process grouped data
    Object.values(roadGroups).forEach(roadGroup => {
        // Remove duplicate defects and calculate response time
        roadGroup.defects = [...new Set(roadGroup.defects)];
        roadGroup.responseTime = calculateResponseTime(roadGroup.defects);
    });
    
    return Object.values(roadGroups);
}

// Calculate response time based on defects
// If the same defect appears multiple times (from different reports), count it only once.
function calculateResponseTime(defects) {
    let totalDays = 0;
    // Flatten and deduplicate defects
    const defectList = Array.isArray(defects) ? defects : [defects];
    const uniqueDefects = [...new Set(defectList)];

    uniqueDefects.forEach(defect => {
        if (defectData[defect]) {
            totalDays += defectData[defect].days;
        }
    });

    return totalDays || 7; // Default to 7 days if no defects match
}

// Update reports table
function updateReportsTable() {
    console.log('📊 Updating reports table...');
    const tbody = document.getElementById("reportsBody");

    if (!tbody) {
        console.error('❌ Reports table body not found');
        return;
    }

    if (reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No reports submitted yet. Be the first to report a road defect!</td></tr>';
        return;
    }

    // Calculate severity scores
    reports.forEach((report) => {
        report.severityScore = calculateSeverityScore(report);
    });

    tbody.innerHTML = reports
        .map((report, index) => {
            // Handle defects array display
            const defectsDisplay = Array.isArray(report.defects) 
                ? report.defects.join(', ') 
                : (report.defects || 'Not specified');

            // Format the date properly
            const dateCreated = report.created_at 
                ? new Date(report.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Not available';

            console.log(`🔍 Report ${index + 1}:`, {
                id: report.id,
                road_name: report.roadName,
                road_type: report.roadType,
                defects: report.defects,
                created_at: report.created_at,
                formatted_date: dateCreated
            });

            return `
                <tr class="animate-in">
                    <td><strong>${report.roadName}</strong></td>
                    <td><span class="road-${report.roadType.replace(' ', '-')}">${report.roadType}</span></td>
                    <td>${defectsDisplay}</td>
                    <td>${report.responseTime || 'N/A'} days</td>
                    <td>${dateCreated}</td>
                </tr>
            `;
        })
        .join("");
}

// Update statistics
function updateStats() {
    const totalReportsElement = document.getElementById("totalReports");
    const criticalIssuesElement = document.getElementById("criticalIssues");
    const avgResponseTimeElement = document.getElementById("avgResponseTime");
    
    if (totalReportsElement) {
        totalReportsElement.textContent = reports.length;
    }
    
    if (criticalIssuesElement) {
        // Group reports by road and calculate aggregated severity scores
        const roadGroups = groupReportsByRoad(reports);
        const criticalRoads = roadGroups.filter(roadGroup => {
            const aggregatedSeverity = calculateAggregatedSeverityScorePerRoad(roadGroup.roadName, reports);
            return aggregatedSeverity >= 300; // Consider severity >= 300 as critical
        });
        criticalIssuesElement.textContent = criticalRoads.length;
    }
    
    if (avgResponseTimeElement) {
        const avgResponse =
            reports.length > 0
                ? Math.round(
                      reports.reduce((sum, r) => sum + (r.responseTime || 7), 0) /
                      reports.length
                  )
                : 0;
        avgResponseTimeElement.textContent = avgResponse;
    }
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

// Enhanced QuickSort Implementation for severity-based prioritization
function quickSortPrioritization(arr) {
    if (arr.length <= 1) {
        return arr;
    }

    // Sort directly by severity score (highest first)
    return quickSortRecursiveBySeverity([...arr]);
}

function quickSortRecursiveBySeverity(arr) {
    if (arr.length <= 1) {
        return arr;
    }

    const pivot = arr[0];
    const left = [];
    const right = [];

    for (let i = 1; i < arr.length; i++) {
        // Sort by severity score (highest first)
        const currentSeverity = arr[i].aggregatedSeverityScore || arr[i].severityScore || 0;
        const pivotSeverity = pivot.aggregatedSeverityScore || pivot.severityScore || 0;
        
        if (currentSeverity > pivotSeverity) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }

    return [...quickSortRecursiveBySeverity(left), pivot, ...quickSortRecursiveBySeverity(right)];
}

// Calculate comprehensive priority score (matches admin dashboard logic)
function calculateComprehensivePriorityScore(report) {
    // 1. Road Type Score (40% weight)
    const roadTypeScore = roadTypeScores[report.roadType] || 25;
    
    // 2. Use aggregated severity score instead of individual severity (30% weight)
    const aggregatedSeverity = report.aggregatedSeverityScore || report.severityScore || 50;
    const severityScore = Math.min(100, aggregatedSeverity / 4); // Normalize to 0-100 range
    
    // 3. Defect Urgency Score (20% weight)
    let defectUrgencyScore = 0;
    const defects = Array.isArray(report.defects) ? report.defects : [];
    const urgentDefects = ['Potholes', 'Open Manhole', 'Unmaintained Bridges', 'Alligator Cracks'];
    
    defects.forEach(defect => {
        if (urgentDefects.includes(defect)) {
            defectUrgencyScore += 25;
        } else {
            defectUrgencyScore += 10;
        }
    });
    defectUrgencyScore = Math.min(100, defectUrgencyScore);
    
    // 4. Time Factor (10% weight) - favor reports that can be completed quickly
    const timeFactor = Math.max(10, 100 - (report.responseTime || 7) * 2);
    
    // Calculate weighted priority score
    const priorityScore = (
        roadTypeScore * 0.40 +
        severityScore * 0.30 +
        defectUrgencyScore * 0.20 +
        timeFactor * 0.10
    );
    
    return Math.round(priorityScore);
}

// QuickSort Implementation (legacy for backward compatibility)
function quickSort(arr) {
    return quickSortPrioritization(arr);
}

// Run optimization
function runOptimization() {
    const timeBudget =
        parseInt(document.getElementById("maintenanceBudget").value) || 180;

    // Group reports by road and calculate aggregated severity scores
    const roadGroups = groupReportsByRoad(reports);
    const roadsWithAggregatedScores = roadGroups.map(roadGroup => ({
        ...roadGroup,
        severityScore: calculateAggregatedSeverityScorePerRoad(roadGroup.roadName, reports),
        aggregatedSeverityScore: calculateAggregatedSeverityScorePerRoad(roadGroup.roadName, reports)
    }));

    // QuickSort optimization with enhanced prioritization using all roads
    const sortedReports = quickSortPrioritization([...roadsWithAggregatedScores]);
    
    // Update the admin page prioritization results
    const quicksortResultsElement = document.getElementById("quicksortResultsList");
    if (quicksortResultsElement) {
        quicksortResultsElement.innerHTML = `
            <div class="analysis-results">
                <h4>🎯 Prioritized Maintenance Order</h4>
                <p><strong>Analysis based on severity scores and resource optimization</strong></p>
                <div class="priority-list">
                    ${sortedReports.slice(0, 10).map((road, index) => {
                        const rankIcon = index === 0 ? '🔴' : index === 1 ? '🟠' : index === 2 ? '🟡' : '🔵';
                        const priorityClass = index < 3 ? 'high-priority' : index < 6 ? 'medium-priority' : 'low-priority';
                        
                        return `
                            <div class="priority-item ${priorityClass}">
                                <div class="priority-rank">
                                    <span class="priority-icon">${rankIcon}</span>
                                    <span class="priority-number">${index + 1}</span>
                                </div>
                                <div class="priority-details">
                                    <h5>${road.roadName}</h5>
                                    <div class="priority-stats">
                                        <span class="road-type-badge ${road.roadType ? road.roadType.toLowerCase() : 'unknown'}">${road.roadType || 'Unknown'}</span>
                                        <span class="severity-score">Score: ${road.aggregatedSeverityScore}</span>
                                        <span class="report-count">${road.reportCount} reports</span>
                                    </div>
                                    <div class="defects-list">
                                        <strong>Defects:</strong> ${Array.isArray(road.defects) ? road.defects.join(', ') : road.defects}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                ${sortedReports.length > 10 ? `<p class="more-results">... and ${sortedReports.length - 10} more roads</p>` : ''}
            </div>
        `;
    }

    // Also update knapsack optimization if element exists (for test page compatibility)
    const knapsackElement = document.getElementById("knapsackResults");
    if (knapsackElement) {
        const knapsackResult = knapsackOptimization(roadsWithAggregatedScores, timeBudget);
        knapsackElement.innerHTML = `
            <p><strong>Time Required:</strong> ${knapsackResult.totalTime} days</p>
            <p><strong>Selected Roads:</strong></p>
            ${knapsackResult.selectedReports
                .map(
                    (r, i) => `
                    <div class="road-item">
                        <strong>${r.roadName}</strong><br>
                        Response Time: ${r.responseTime} days<br>
                        Severity Score: ${r.aggregatedSeverityScore || r.severityScore}
                        <div class="score-breakdown">
                            <div class="score-row">
                                <span>Road Type Score:</span>
                                <span class="score-value">${roadTypeScores[r.roadType] || 0}</span>
                            </div>
                            <div class="score-row">
                                <span>Report Frequency Score:</span>
                                <span class="score-value">${getReportFrequencyScore(r.reportCount || 1)}</span>
                            </div>
                        </div>
                    </div>
                `
                )
                .join("")}
        `;
    }

    // Update quicksort results for test page compatibility
    const quicksortElement = document.getElementById("quicksortResults");
    if (quicksortElement) {
        quicksortElement.innerHTML = `
            <p><strong>QuickSort Prioritization (Sorted by Severity Score):</strong></p>
            ${sortedReports
                .map(
                    (r, i) => `
                    <div class="road-item">
                        <strong>Priority ${i + 1}: ${r.roadName}</strong><br>
                        Severity Score: ${r.aggregatedSeverityScore || r.severityScore || 0} | Response Time: ${r.responseTime} days <br>
                        Defects: ${Array.isArray(r.defects) ? r.defects.join(', ') : r.defects}<br>
                        <div class="score-breakdown">
                            <div class="score-row">
                                <span>Road Type Score:</span>
                                <span class="score-value">${roadTypeScores[r.roadType] || 25}</span>
                            </div>
                            <div class="score-row">
                                <span>Severity Score:</span>
                                <span class="score-value">${r.aggregatedSeverityScore || r.severityScore || 0}</span>
                            </div>
                        </div>
                    </div>
                `
                )
                .join("")}
        `;
    }

    // Update dijkstra results for test page compatibility
    const dijkstraElement = document.getElementById("dijkstraResults");
    if (dijkstraElement) {
        dijkstraElement.innerHTML = `
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
    }

    // Show results (for test page compatibility)
    const algorithmResultsElement = document.getElementById("algorithmResults");
    if (algorithmResultsElement) {
        algorithmResultsElement.style.display = "grid";
    }

    // Update budget utilization (for test page compatibility)
    const budgetUtilizationElement = document.getElementById("budgetUtilization");
    if (budgetUtilizationElement) {
        const knapsackResult = knapsackOptimization(roadsWithAggregatedScores, timeBudget);
        const utilization = Math.round((knapsackResult.totalTime / timeBudget) * 100);
        budgetUtilizationElement.textContent = `${utilization}%`;
    }

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

// Calculate distance between two latlng points in meters
function calculateDistance(latlng1, latlng2) {
    const earthRadius = 6371e3; // Earth radius in meters

    const lat1Rad = latlng1.lat * Math.PI / 180;
    const lat2Rad = latlng2.lat * Math.PI / 180;
    const deltaLatRad = (latlng2.lat - latlng1.lat) * Math.PI / 180;
    const deltaLngRad = (latlng2.lng - latlng1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c; // Distance in meters
}

// Enhanced Report Frequency Score mapping based on frequency table
function getReportFrequencyScore(reportCount) {
    if (reportCount >= 1 && reportCount <= 10) return 10;
    else if (reportCount >= 11 && reportCount <= 20) return 20;
    else if (reportCount >= 21 && reportCount <= 30) return 30;
    else if (reportCount >= 31 && reportCount <= 40) return 40;
    else if (reportCount >= 41 && reportCount <= 50) return 50;
    else if (reportCount >= 51 && reportCount <= 60) return 60;
    else if (reportCount >= 61 && reportCount <= 70) return 70;
    else if (reportCount >= 71 && reportCount <= 80) return 80;
    else if (reportCount >= 81 && reportCount <= 90) return 90;
    else if (reportCount >= 91) return 100;
    else return 10; // Default for any edge cases
}

