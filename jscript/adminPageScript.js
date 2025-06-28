// Admin Dashboard JavaScript with Supabase Integration

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin page DOM loaded, initializing dashboard...');
    
    // Initialize dashboard
    initializeDashboard();
    
    // View all reports button click handler
    const viewAllBtn = document.querySelector('.view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function() {
            loadAllReports();
        });
    }

    // Add interaction to the pie chart (note: this will attach to dynamically created elements)
    // The actual hover effects are added directly to pie chart segments in generatePieChart function
    console.log('Pie chart interactions will be added dynamically when chart is generated');
});

// Initialize dashboard with real data
async function initializeDashboard() {
    try {
        console.log('Initializing dashboard...');
        
        // Check for demo mode
        if (typeof window.DatabaseService !== 'undefined' && !DatabaseService.isAvailable()) {
            console.log('Demo mode detected');
            showNotification(
                'Demo Mode: Database not configured. Showing sample data. Check console for setup instructions.', 
                'info', 
                8000
            );
        }

        // Load dashboard statistics
        console.log('Loading dashboard stats...');
        await loadDashboardStats();
        
        // Load reports table with real data
        console.log('Loading reports table...');
        await loadReportsTable();
        
        // Generate pie chart with real data
        console.log('Loading pie chart...');
        await loadPieChart();
        
        // Load most reported roads leaderboard
        console.log('Loading most reported roads leaderboard...');
        await loadMostReportedRoads();
        
        // Auto-run prioritization analysis
        console.log('Auto-running prioritization analysis...');
        await autoRunPrioritizationAnalysis();
        
        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showNotification('Failed to load dashboard data. Using sample data.', 'warning');
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await DatabaseService.getAllReports();
        const reports = response.success ? response.data : [];
        
        // Update total reports count
        const totalReportsEl = document.querySelector('.report-number');
        if (totalReportsEl) {
            totalReportsEl.textContent = reports ? reports.length : 0;
        }
        
        console.log('Dashboard stats loaded');
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load and display reports in the summary table
async function loadReportsTable(limit = 10) {
    try {
        console.log('Loading reports for admin table...');
        
        // Update current date
        const currentDateEl = document.getElementById('currentDate');
        if (currentDateEl) {
            currentDateEl.textContent = new Date().toLocaleDateString();
        } else {
            console.warn('currentDate element not found');
        }
        
        const response = await DatabaseService.getAllReports();
        const reports = response.success ? response.data : [];
        console.log('Fetched reports:', reports);
        
        const tableBody = document.getElementById('reportsTableBody');
        if (!tableBody) {
            console.error('reportsTableBody element not found');
            return;
        }
        
        if (!reports || reports.length === 0) {
            console.log('No reports found, showing empty state');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class='bx bx-folder-open'></i>
                        <p>No reports available in the database</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        console.log(`Processing ${reports.length} reports for table display`);
        
        // Sort reports by severity (critical = highest priority)
        const sortedReports = reports
            .sort((a, b) => {
                const priorityA = getSeverityValue(a.severity);
                const priorityB = getSeverityValue(b.severity);
                return priorityA - priorityB;
            })
            .slice(0, limit);
        
        console.log(`Displaying ${sortedReports.length} reports in table`);
        
        const tableRows = sortedReports.map((report, index) => {
            const severityValue = getSeverityValue(report.severity);
            const roadName = report.road_name || report.location_description || report.location || `Report ${index + 1}`;
            const roadType = report.road_type || 'Municipal';
            const severity = report.severity || 'medium';
            const defectType = Array.isArray(report.defects) ? report.defects.join(', ') : (report.defects || 'Road Issue');
            
            return `
                <tr>
                    <td>
                        <span class="priority-badge priority-${severityValue}">${severityValue}</span>
                    </td>
                    <td>${roadName}</td>
                    <td>${roadType}</td>
                    <td>
                        <span class="severity-badge severity-${severity.toLowerCase()}" title="${severity} Severity - ${getSeverityDescription(severity)}">
                            <i class='bx ${getSeverityIcon(severity)}'></i>
                            ${severity}
                        </span>
                    </td>
                    <td>
                        <div class="defect-info">
                            <strong>${defectType}</strong>
                        </div>
                    </td>
                    <td>
                        <button class="delete-btn" data-id="${report.id}" title="Delete Report">
                            <i class='bx bx-trash'></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        tableBody.innerHTML = tableRows;
        console.log('Table updated successfully');
        
        // Add delete button event listeners
        addDeleteButtonListeners();
        
        // Add click handlers to new rows
        const newRows = tableBody.querySelectorAll('tr');
        newRows.forEach(row => {
            row.addEventListener('click', function(event) {
                // Prevent clicking on the row from triggering if delete button was clicked
                if (!event.target.closest('.delete-btn')) {
                    const roadName = this.querySelector('td:nth-child(2)').textContent;
                    console.log('Report clicked:', roadName);
                }
            });
        });
        
    } catch (error) {
        console.error('Error loading reports table:', error);
        const tableBody = document.getElementById('reportsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class='bx bx-error-circle'></i>
                        <p>Error loading reports. Please try again.</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Load pie chart with real data
async function loadPieChart() {
    try {
        const response = await DatabaseService.getAllReports();
        const reports = response.success ? response.data : [];
        
        if (!reports || reports.length === 0) {
            // Show empty chart
            const chartContainer = document.getElementById('pieChartContainer');
            if (chartContainer) {
                chartContainer.innerHTML = '<div class="empty-chart">No data available</div>';
            }
            return;
        }
        
        // Group reports by severity
        const severityGroups = {};
        reports.forEach(report => {
            const severity = report.severity || 'medium';
            severityGroups[severity] = (severityGroups[severity] || 0) + 1;
        });
        
        const chartData = Object.entries(severityGroups).map(([severity, count]) => ({
            label: `${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity`,
            value: count,
            color: getSeverityColor(severity)
        }));
        
        // Generate pie chart
        generatePieChart(chartData);
        
    } catch (error) {
        console.error('Error loading pie chart:', error);
    }
}

// Generate SVG pie chart
function generatePieChart(data) {
    console.log('Generating pie chart with data:', data);
    const chartContainer = document.getElementById('pieChartContainer');
    const hoverLabel = document.getElementById('pieChartHoverLabel');
    
    if (!chartContainer) {
        console.error('Chart container not found!');
        return;
    }
    
    if (!data || data.length === 0) {
        chartContainer.innerHTML = '<div class="empty-chart">No data available</div>';
        if (hoverLabel) {
            hoverLabel.textContent = 'No chart data available';
            hoverLabel.style.visibility = 'visible';
            hoverLabel.style.opacity = '1';
        }
        return;
    }
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    
    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '200');
    svg.setAttribute('height', '200');
    svg.setAttribute('viewBox', '0 0 200 200');
    
    const centerX = 100;
    const centerY = 100;
    const radius = 80;
    
    // Generate pie slices
    data.forEach((item, index) => {
        const percentage = (item.value / total) * 100;
        const angle = (item.value / total) * 360;
        
        if (percentage > 0) {
            const path = createPieSlice(centerX, centerY, radius, currentAngle, currentAngle + angle);
            path.setAttribute('fill', item.color);
            path.setAttribute('stroke', '#fff');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('class', 'pie-slice');
            path.setAttribute('data-label', item.label);
            path.setAttribute('data-value', item.value);
            path.setAttribute('data-percentage', percentage.toFixed(1));
            
            // Add hover effect with label update
            path.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
                this.style.transformOrigin = '100px 100px';
                
                if (hoverLabel) {
                    const label = this.getAttribute('data-label');
                    const value = this.getAttribute('data-value');
                    const percentage = parseFloat(this.getAttribute('data-percentage')).toFixed(0);
                    hoverLabel.textContent = `${label}: ${value} reports (${percentage}%)`;
                    hoverLabel.style.visibility = 'visible';
                    hoverLabel.style.opacity = '1';
                }
            });
            
            path.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
                if (hoverLabel) {
                    hoverLabel.textContent = 'Hover over a slice to see details';
                }
            });
            
            svg.appendChild(path);
            currentAngle += angle;
        }
    });
    
    // Clear and add new chart
    chartContainer.innerHTML = '';
    chartContainer.appendChild(svg);
    
    // Set initial hover label message
    if (hoverLabel) {
        hoverLabel.textContent = 'Hover over a slice to see details';
        hoverLabel.style.visibility = 'visible';
        hoverLabel.style.opacity = '1';
    }
    
    console.log('Pie chart generated successfully');
}

// Create pie slice path
function createPieSlice(centerX, centerY, radius, startAngle, endAngle) {
    const startAngleRad = (startAngle - 90) * Math.PI / 180;
    const endAngleRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    const pathData = [
        "M", centerX, centerY,
        "L", x1, y1,
        "A", radius, radius, 0, largeArcFlag, 1, x2, y2,
        "Z"
    ].join(" ");
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    
    return path;
}

// Helper function to convert severity string to number for sorting
function getSeverityValue(severity) {
    const severityStr = (severity || '').toLowerCase();
    switch (severityStr) {
        case 'high':
            return 1; // Highest priority
        case 'medium':
            return 2;
        case 'low':
            return 3;
        default:
            return 4;
    }
}

// Get color for severity level
function getSeverityColor(severity) {
    const colors = {
        'high': '#dc3545',    // Red for high severity
        'medium': '#ffc107',  // Yellow for medium severity
        'low': '#28a745'      // Green for low severity
    };
    return colors[severity.toLowerCase()] || '#6c757d';
}

// Helper function to determine severity based on report data (this is now redundant since severity is stored directly)
function determineSeverity(report) {
    return report.severity || 'medium';
}

// Helper function to get severity description
function getSeverityDescription(severity) {
    switch (severity.toLowerCase()) {
        case 'high':
            return 'Urgent attention required';
        case 'medium':
            return 'Needs attention soon';
        case 'low':
            return 'Can be scheduled for regular maintenance';
        default:
            return 'Needs assessment';
    }
}

// Helper function to get severity icon
function getSeverityIcon(severity) {
    switch (severity.toLowerCase()) {
        case 'high':
            return 'bx-error';
        case 'medium':
            return 'bx-info-circle';
        case 'low':
            return 'bx-check-circle';
        default:
            return 'bx-help-circle';
    }
}

// Load all reports (for the "View All Reports" button)
function loadAllReports() {
    console.log('Loading all reports...');
    loadReportsTable(Infinity); // Load all reports by setting limit to Infinity
}

// Function to attach event listeners to all delete buttons
function addDeleteButtonListeners() {
    console.log('Attaching delete button listeners...');
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        // Remove existing listeners to prevent duplicates
        button.removeEventListener('click', handleReportDeleteClick);
        button.addEventListener('click', handleReportDeleteClick);
    });
    console.log(`Attached listeners to ${deleteButtons.length} delete buttons.`);
}

// Event handler for delete button clicks
function handleReportDeleteClick(event) {
    event.stopPropagation(); // Prevent row click event from firing
    const reportId = event.currentTarget.dataset.id;
    deleteReport(reportId);
}

// Function to handle the deletion logic
async function deleteReport(reportId) {
    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
        try {
            console.log(`Attempting to delete report with ID: ${reportId}`);
            
            // Check if we're in demo mode
            if (!DatabaseService.isAvailable()) {
                console.log('Demo mode: Simulating report deletion');
                showNotification('Demo Mode: Report deletion simulated successfully!', 'success');
                // Refresh the dashboard to show updated data
                initializeDashboard();
                return;
            }
            
            // Use Supabase directly for deletion
            const { error } = await supabase
                .from('road_reports')
                .delete()
                .eq('id', reportId);

            if (error) {
                console.error('Error deleting report:', error.message);
                showNotification('Error deleting report: ' + error.message, 'error');
            } else {
                console.log('Report deleted successfully!');
                showNotification('Report deleted successfully!', 'success');
                // Refresh the dashboard to show updated data
                initializeDashboard();
            }
        } catch (err) {
            console.error('Unexpected error during deletion:', err);
            showNotification('An unexpected error occurred during deletion.', 'error');
        }
    }
}

// Show notification
function showNotification(message, type = 'info', duration = 5000) {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class='bx ${getNotificationIcon(type)}'></i>
        <span>${message}</span>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, duration);
}

// Get notification icon
function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'bx-check-circle';
        case 'warning': return 'bx-error-circle';
        case 'error': return 'bx-x-circle';
        default: return 'bx-info-circle';
    }
}

// Load most reported roads leaderboard
async function loadMostReportedRoads() {
    try {
        console.log('Loading most reported roads leaderboard...');
        
        const response = await DatabaseService.getMostReportedRoads(10);
        const leaderboardContainer = document.getElementById('mostReportedList');
        
        if (!leaderboardContainer) {
            console.error('mostReportedList element not found');
            return;
        }
        
        if (!response.success || !response.data || response.data.length === 0) {
            console.log('No roads found for leaderboard');
            leaderboardContainer.innerHTML = `
                <div class="empty-state">
                    <i class='bx bx-info-circle'></i>
                    <p>No road reports available yet.</p>
                    <p>Reports will appear here as they are submitted.</p>
                </div>
            `;
            return;
        }
        
        const roads = response.data;
        console.log('Fetched most reported roads:', roads);
        
        // Generate leaderboard HTML
        const leaderboardHTML = roads.map((road, index) => {
            const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            const roadTypeClass = road.road_type ? road.road_type.toLowerCase().replace(' ', '-') : 'unknown';
            
            return `
                <div class="leaderboard-item" data-rank="${index + 1}">
                    <div class="rank-indicator">
                        <span class="rank-number">${rankIcon}</span>
                    </div>
                    <div class="road-info">
                        <h4 class="road-name">${road.road_name}</h4>
                        <span class="road-type ${roadTypeClass}">${road.road_type || 'Unknown'}</span>
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
        
        leaderboardContainer.innerHTML = leaderboardHTML;
        console.log('Most reported roads leaderboard loaded successfully');
        
    } catch (error) {
        console.error('Error loading most reported roads:', error);
        const leaderboardContainer = document.getElementById('mostReportedList');
        if (leaderboardContainer) {
            leaderboardContainer.innerHTML = `
                <div class="empty-state error">
                    <i class='bx bx-error-circle'></i>
                    <p>Error loading leaderboard data.</p>
                    <p>Please try refreshing the page.</p>
                </div>
            `;
        }
    }
}

// QuickSort implementation for severity-based sorting
function quickSortBySeverity(arr) {
    if (arr.length <= 1) {
        return arr;
    }

    const pivot = arr[0];
    const left = [];
    const right = [];

    for (let i = 1; i < arr.length; i++) {
        // Sort by severity score (highest first)
        const currentSeverity = arr[i].aggregatedSeverity || arr[i].severityScore || 0;
        const pivotSeverity = pivot.aggregatedSeverity || pivot.severityScore || 0;
        
        if (currentSeverity > pivotSeverity) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }

    return [...quickSortBySeverity(left), pivot, ...quickSortBySeverity(right)];
}

// Auto-run prioritization analysis on page load
async function autoRunPrioritizationAnalysis() {
    try {
        console.log('🔄 Auto-running prioritization analysis...');
        
        // Get fresh reports data from database
        const reportsResponse = await DatabaseService.getAllReports();
        if (!reportsResponse.success || !reportsResponse.data) {
            throw new Error('Failed to load reports data');
        }
        
        const reports = reportsResponse.data;
        console.log(`📊 Loaded ${reports.length} reports for analysis`);
        
        // Calculate prioritized list based on aggregated severity scores
        const roadGroups = {};
        
        // Group reports by road name
        reports.forEach(report => {
            const roadName = report.road_name;
            if (!roadGroups[roadName]) {
                roadGroups[roadName] = {
                    roadName: roadName,
                    roadType: report.road_type || 'municipal',
                    reports: [],
                    reportCount: 0,
                    defects: [],
                    responseTime: 0
                };
            }
            
            roadGroups[roadName].reports.push(report);
            roadGroups[roadName].reportCount++;
            
            // Collect all defects for this road
            const reportDefects = Array.isArray(report.defects) ? report.defects : 
                                  typeof report.defects === 'string' ? report.defects.split(', ') : 
                                  [report.defects];
            roadGroups[roadName].defects.push(...reportDefects);
        });
        
        // Calculate aggregated severity scores for each road
        const roadsWithScores = Object.values(roadGroups).map(roadGroup => {
            // Remove duplicate defects and calculate response time
            roadGroup.defects = [...new Set(roadGroup.defects)];
            
            // Calculate aggregated severity score using Supabase method
            const aggregatedSeverity = DatabaseService.calculateAggregatedSeverityForRoad(roadGroup.roadName, reports);
            
            return {
                ...roadGroup,
                aggregatedSeverity: aggregatedSeverity,
                severityScore: aggregatedSeverity, // Use severity as the primary score
                aggregatedSeverityScore: aggregatedSeverity
            };
        });
        
        // Sort using QuickSort by severity score (highest first) 
        const sortedRoads = quickSortBySeverity([...roadsWithScores]);
        
        console.log('🎯 QuickSort prioritized roads calculated:', sortedRoads.slice(0, 5));
        
        // Update the prioritization results display
        const quicksortResultsElement = document.getElementById("quicksortResultsList");
        if (quicksortResultsElement) {
            if (sortedRoads.length === 0) {
                quicksortResultsElement.innerHTML = `
                    <div class="empty-state">
                        <i class='bx bx-info-circle'></i>
                        <p>No road reports available yet.</p>
                        <p>Submit some reports to see the prioritized maintenance schedule!</p>
                    </div>
                `;
            } else {
                quicksortResultsElement.innerHTML = `
                    <div class="analysis-results">
                        <h4>🎯 QuickSort Prioritization (Sorted by Severity Score)</h4>
                        <p><strong>Roads prioritized using QuickSort algorithm based on aggregated severity scores</strong></p>
                        <div class="priority-list">
                            ${sortedRoads.slice(0, 10).map((road, index) => {
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
                                                <span class="road-type-badge ${road.roadType ? road.roadType.toLowerCase().replace(' ', '-') : 'unknown'}">${road.roadType || 'Unknown'}</span>
                                                <span class="severity-score">Severity: ${road.aggregatedSeverity}</span>
                                                <span class="report-count">${road.reportCount} reports</span>
                                            </div>
                                            <div class="defects-list">
                                                <strong>Defects:</strong> ${road.defects.join(', ') || 'Not specified'}
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        ${sortedRoads.length > 10 ? `<p class="more-results">... and ${sortedRoads.length - 10} more roads</p>` : ''}
                        <div class="analysis-footer">
                            <p><small>Analysis updated: ${new Date().toLocaleString()}</small></p>
                        </div>
                    </div>
                `;
            }
        }
        
        console.log('✅ Prioritization analysis completed successfully');
        
    } catch (error) {
        console.error('❌ Error running auto prioritization analysis:', error);
        
        // Display error in the prioritization results
        const quicksortResultsElement = document.getElementById("quicksortResultsList");
        if (quicksortResultsElement) {
            quicksortResultsElement.innerHTML = `
                <div class="empty-state error">
                    <i class='bx bx-error-circle'></i>
                    <p>Error generating prioritization analysis.</p>
                    <p>Error: ${error.message}</p>
                    <p>Please try clicking "Run DaangMatino Analysis" manually.</p>
                </div>
            `;
        }
    }
}

// Wrapper function for manual optimization run (for the admin page button)
function runOptimization() {
    console.log('🔄 Manual optimization triggered...');
    autoRunPrioritizationAnalysis();
}
