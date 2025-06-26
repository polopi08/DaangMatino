// Admin Dashboard JavaScript with Supabase Integration

// Assuming 'supabase' is globally available after supabaseClient.js loads
// If not, you might need: import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin page DOM loaded, initializing dashboard...');

    // Create pie chart immediately with test data (this will be overwritten by real data later)
    console.log('Creating initial pie chart with test data...');
    const chartContainer = document.getElementById('pieChartContainer');
    if (chartContainer) {
        chartContainer.innerHTML = '';

        const testData = [
            { label: 'Priority 1', value: 1, color: '#dc3545' },
            { label: 'Priority 3', value: 2, color: '#ffc107' },
            { label: 'Priority 4', value: 4, color: '#28a745' }
        ];

        // Generate the initial pie chart
        generatePieChart(testData);
        console.log('Initial pie chart created successfully');
    } else {
        console.error('Chart container not found!');
    }

    // Initialize dashboard with real data and functionality
    initializeDashboard();

    // View all reports button click handler
    const viewAllBtn = document.querySelector('.view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function() {
            loadAllReports();
        });
    }

    // Refresh button click handler
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            console.log('Refresh button clicked. Reloading dashboard data...');
            initializeDashboard(); // Re-initialize to refresh all data
        });
    }

    // Note: The pie chart interaction logic for 'chartSegments' and 'legendItems'
    // in your original code might need adjustment if your pie chart is generated
    // purely via SVG paths and not actual circle elements with specific classes.
    // The `generatePieChart` function creates paths, so direct selection of
    // `.pie-chart circle` might not work. The hover effect is added directly
    // to the paths in `generatePieChart`.
});

// Initialize dashboard with real data
async function initializeDashboard() {
    try {
        console.log('Initializing dashboard with real data...');

        // Update current date display
        const currentDateEl = document.getElementById('currentDate');
        if (currentDateEl) {
            currentDateEl.textContent = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            console.warn('currentDate element not found');
        }

        // Check for demo mode (assuming DatabaseService is defined in supabaseClient.js)
        if (typeof window.DatabaseService !== 'undefined' && !DatabaseService.isAvailable()) {
            console.log('Demo mode detected');
            showNotification(
                'Demo Mode: Database not configured. Showing sample data. Check console for setup instructions.',
                'info',
                8000
            );
        }

        // Load dashboard statistics (total reports, critical, etc.)
        console.log('Loading dashboard stats...');
        await loadDashboardStats();

        // Load reports table with real data and delete buttons
        console.log('Loading reports table...');
        await loadReportsTable(); // This will also attach delete listeners

        // Generate pie chart with real data (based on priority counts)
        console.log('Loading pie chart with real data...');
        await loadPieChartFromReports(); // New function to load real data for pie chart

        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showNotification('Failed to load dashboard data. Using sample data.', 'warning');
    }
}

// Load dashboard statistics (e.g., total reports, critical issues)
async function loadDashboardStats() {
    try {
        console.log('Loading dashboard stats...');
        const response = await DatabaseService.getAllReports(); // Assuming DatabaseService is available
        const reports = response.success ? response.data : [];

        // Update total reports count
        const totalReportsEl = document.querySelector('.report-number');
        const totalReportsCardEl = document.getElementById('totalReports');
        if (totalReportsEl) {
            totalReportsEl.textContent = reports ? reports.length : 0;
        }
        if (totalReportsCardEl) {
            totalReportsCardEl.textContent = reports ? reports.length : 0;
        }

        // Update Critical Issues (example)
        const criticalReports = reports.filter(report =>
            getPriorityValue(report.priority) <= 2 || determineSeverity(report) === 'High'
        ).length;
        const criticalReportsEl = document.getElementById('criticalReports');
        if (criticalReportsEl) {
            criticalReportsEl.textContent = criticalReports;
        }

        // Update Affected Areas (example - count unique roads/locations)
        const affectedAreas = new Set(reports.map(report => report.road || report.location_description)).size;
        const affectedAreasEl = document.getElementById('affectedAreas');
        if (affectedAreasEl) {
            affectedAreasEl.textContent = affectedAreas;
        }

        // Update Recent Reports (example - reports from the last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentReports = reports.filter(report => {
            // Assuming 'created_at' is a valid date string or timestamp
            const reportDate = new Date(report.created_at);
            return reportDate >= sevenDaysAgo;
        }).length;
        const recentReportsEl = document.getElementById('recentReports');
        if (recentReportsEl) {
            recentReportsEl.textContent = recentReports;
        }

        console.log('Dashboard stats loaded');
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load and display reports in the summary table with delete buttons
async function loadReportsTable(limit = 10) {
    try {
        console.log('Loading reports for admin table...');
        const response = await DatabaseService.getAllReports(); // Assuming DatabaseService is available
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
                    <td colspan="6" class="empty-state"> <i class='bx bx-folder-open'></i>
                        <p>No reports available in the database</p>
                    </td>
                </tr>
            `;
            return;
        }

        console.log(`Processing ${reports.length} reports for table display`);

        // Sort reports by priority (1 = highest priority)
        const sortedReports = reports
            .sort((a, b) => {
                const priorityA = getPriorityValue(a.priority);
                const priorityB = getPriorityValue(b.priority);
                return priorityA - priorityB;
            })
            .slice(0, limit);

        console.log(`Displaying ${sortedReports.length} reports in table`);

        const tableRows = sortedReports.map((report, index) => {
            const priority = getPriorityValue(report.priority);
            const roadName = report.road || report.location_description || report.location || `Report ${index + 1}`;
            const roadType = report.road_type || 'Municipal';
            const severity = determineSeverity(report);
            const defectType = report.damage_type || report.issue_type || 'Road Issue';
            const defectDetail = report.description || 'Needs attention';

            return `
                <tr>
                    <td>
                        <span class="priority-badge priority-${priority}">${priority}</span>
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
                            <span class="defect-detail">${defectDetail.substring(0, 50)}${defectDetail.length > 50 ? '...' : ''}</span>
                        </div>
                    </td>
                    <td>
                        <button class="delete-btn" data-id="${report.id}" title="Delete Report">
                            <i class='bx bx-trash'></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = tableRows;
        console.log('Table updated successfully');

        // Add click handlers to new rows (if needed for detail view)
        const newRows = tableBody.querySelectorAll('tr');
        newRows.forEach(row => {
            row.addEventListener('click', function(event) {
                // Prevent clicking on the row from triggering if delete button was clicked
                if (!event.target.closest('.delete-btn')) {
                    const roadName = this.querySelector('td:nth-child(2)').textContent;
                    console.log('Report row clicked:', roadName);
                    // Add logic here to show report details, etc.
                }
            });
        });

        // Add event listeners for delete buttons
        addDeleteButtonListeners();

    } catch (error) {
        console.error('Error loading reports table:', error);
        const tableBody = document.getElementById('reportsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state"> <i class='bx bx-error-circle'></i>
                        <p>Error loading reports. Please try again.</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Function to handle the deletion logic
async function deleteReport(reportId) {
    // Show a custom confirmation dialog instead of alert/confirm
    // For simplicity, using confirm() here as per initial guidance, but a custom modal is recommended.
    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
        try {
            console.log(`Attempting to delete report with ID: ${reportId}`);
            // Use Supabase directly for deletion
            const { error } = await supabase
                .from('reports') // Your Supabase table name
                .delete()
                .eq('id', reportId); // Match the report by its unique ID

            if (error) {
                console.error('Error deleting report:', error.message);
                showNotification('Error deleting report: ' + error.message, 'error');
            } else {
                console.log('Report deleted successfully!');
                showNotification('Report deleted successfully!', 'success');
                // Refresh the list of reports and update analytics after successful deletion
                initializeDashboard(); // Re-initialize to refresh all data
            }
        } catch (err) {
            console.error('Unexpected error during deletion:', err);
            showNotification('An unexpected error occurred during deletion.', 'error');
        }
    }
}

// Function to attach event listeners to all delete buttons
function addDeleteButtonListeners() {
    console.log('Attaching delete button listeners...');
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        // Remove existing listeners to prevent duplicates if function is called multiple times
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


// Load pie chart with real data
async function loadPieChartFromReports() {
    try {
        console.log('Starting pie chart load with real data...');
        const chartContainer = document.getElementById('pieChartContainer');

        if (!chartContainer) {
            console.error('Chart container not found!');
            return;
        }

        // Force clear the loading message immediately
        chartContainer.innerHTML = '<div style="color: blue;">Generating chart...</div>';

        const response = await DatabaseService.getAllReports();
        const reports = response.success ? response.data : [];

        // Aggregate data by priority
        const priorityCounts = {};
        reports.forEach(report => {
            const priority = getPriorityValue(report.priority);
            priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
        });

        // Convert to data format for generatePieChart
        const pieChartData = Object.keys(priorityCounts).map(priority => ({
            label: `Priority ${priority}`,
            value: priorityCounts[priority],
            color: getPriorityColor(priority)
        })).sort((a, b) => parseInt(a.label.replace('Priority ', '')) - parseInt(b.label.replace('Priority ', ''))); // Sort numerically by priority

        console.log('Creating chart with real data:', pieChartData);

        // Add a small delay to ensure DOM updates
        setTimeout(() => {
            generatePieChart(pieChartData);
        }, 100);

        console.log('Pie chart load function completed');

    } catch (error) {
        console.error('Error loading pie chart from reports:', error);
        const chartContainer = document.getElementById('pieChartContainer');
        if (chartContainer) {
            chartContainer.innerHTML = '<div style="color: red;">Chart Error</div>';
        }
    }
}

// Generate SVG pie chart
function generatePieChart(data) {
    console.log('generatePieChart called with data:', data);
    const chartContainer = document.getElementById('pieChartContainer');
    const hoverLabel = document.getElementById('pieChartHoverLabel');

    if (!chartContainer) {
        console.error('Chart container not found!');
        return;
    }

    // Clear the loading message first
    chartContainer.innerHTML = '';
    console.log('Cleared chart container');

    if (!data || data.length === 0) {
        console.log('No data provided for chart');
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
    svg.style.overflow = 'visible';

    const centerX = 100;
    const centerY = 100;
    const radius = 80;

    // Initial message for the hover label div
    if (hoverLabel) {
        hoverLabel.textContent = 'Hover over a slice to see details';
        hoverLabel.style.visibility = 'visible';
        hoverLabel.style.opacity = '1';
    }


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

            // Hover effects for the label
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
                    // This resets to initial message when not hovering (like placeholder only)
                    hoverLabel.textContent = 'Hover over a slice to see details';
                }
            });
            svg.appendChild(path);
            currentAngle += angle;
        }
    });

    // Clears and adds new chart
    chartContainer.innerHTML = '';
    chartContainer.appendChild(svg);
    console.log('Pie chart SVG added to container');
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

// Colors for the priority level
function getPriorityColor(priority) {
    const colors = {
        '1': '#dc3545', // Red for highest priority
        '2': '#fd7e14', // Orange
        '3': '#ffc107', // Yellow
        '4': '#28a745', // Green
        '5': '#6c757d'  // Gray for lowest priority
    };
    return colors[priority] || '#6c757d';
}

// Function that converts priority string to number
function getPriorityValue(priority) {
    if (typeof priority === 'number') return priority;

    const priorityStr = (priority || '').toLowerCase();
    switch (priorityStr) {
        case 'critical':
        case 'urgent':
            return 1;
        case 'high':
            return 2;
        case 'medium':
            return 3;
        case 'low':
            return 4;
        default:
            return 5; // Just in case it is not recognized, default to the lowest priority
    }
}

// Functions that determine severity based on the report data
function determineSeverity(report) {
    const priority = getPriorityValue(report.priority);
    const damageType = (report.damage_type || report.issue_type || '').toLowerCase();

    // High priority or the dangerous damage types
    if (priority <= 2 || damageType.includes('manhole') || damageType.includes('critical') || damageType.includes('dangerous') || damageType.includes('traffic light')) {
        return 'High';
    }
    // For medium priority
    else if (priority <= 3 || damageType.includes('crack') || damageType.includes('medium') || damageType.includes('damaged road')) {
        return 'Medium';
    }
    // For low priority
    else {
        return 'Low';
    }
}

// Function that gets the severity description
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

//Function that gets the severity icon
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

// This do loads all reports (for the "View All Reports" button)
function loadAllReports() {
    console.log('Loading all reports (no limit applied)...');
    loadReportsTable(Infinity); // Load all reports by setting limit to Infinity
}

// Then, for showing notification
function showNotification(message, type = 'info', duration = 5000) {
    console.log(`${type.toUpperCase()}: ${message}`);

    // This creates notification element
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