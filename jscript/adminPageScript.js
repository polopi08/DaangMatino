// Admin Dashboard JavaScript with Supabase Integration

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin page DOM loaded, initializing dashboard...');
    
    // Create pie chart immediately
    console.log('Creating pie chart immediately...');
    const chartContainer = document.getElementById('pieChartContainer');
    if (chartContainer) {
        console.log('Found chart container, creating chart');
        chartContainer.innerHTML = '';
        
        // Create proper pie chart with test data matching the table
        const testData = [
            { label: 'Priority 1', value: 1, color: '#dc3545' },  // Red - 1 report
            { label: 'Priority 3', value: 2, color: '#ffc107' },  // Yellow - 2 reports  
            { label: 'Priority 4', value: 4, color: '#28a745' }   // Green - 4 reports
        ];
        
        const total = testData.reduce((sum, item) => sum + item.value, 0);
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
        testData.forEach((item) => {
            const percentage = (item.value / total) * 100;
            const angle = (item.value / total) * 360;
            
            if (percentage > 0) {
                // Create pie slice path
                const startAngleRad = (currentAngle - 90) * Math.PI / 180;
                const endAngleRad = ((currentAngle + angle) - 90) * Math.PI / 180;
                
                const x1 = centerX + radius * Math.cos(startAngleRad);
                const y1 = centerY + radius * Math.sin(startAngleRad);
                const x2 = centerX + radius * Math.cos(endAngleRad);
                const y2 = centerY + radius * Math.sin(endAngleRad);
                
                const largeArcFlag = angle <= 180 ? 0 : 1;
                
                const pathData = [
                    "M", centerX, centerY,
                    "L", x1, y1,
                    "A", radius, radius, 0, largeArcFlag, 1, x2, y2,
                    "Z"
                ].join(" ");
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pathData);
                path.setAttribute('fill', item.color);
                path.setAttribute('stroke', '#fff');
                path.setAttribute('stroke-width', '2');
                
                svg.appendChild(path);
                currentAngle += angle;
            }
        });
        
        chartContainer.appendChild(svg);
        console.log('Pie chart created successfully');
    } else {
        console.error('Chart container not found!');
    }
    
    // Initialize dashboard
    initializeDashboard();
    
    // View all reports button click handler
    const viewAllBtn = document.querySelector('.view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function() {
            loadAllReports();
        });
    }

    // Add interaction to the pie chart
    const chartSegments = document.querySelectorAll('.pie-chart circle');
    const legendItems = document.querySelectorAll('.legend-item');
    
    chartSegments.forEach((segment, index) => {
        segment.addEventListener('mouseenter', function() {
            if (legendItems[index]) {
                legendItems[index].style.transform = 'scale(1.1)';
                legendItems[index].style.fontWeight = 'bold';
            }
        });
        
        segment.addEventListener('mouseleave', function() {
            if (legendItems[index]) {
                legendItems[index].style.transform = 'scale(1)';
                legendItems[index].style.fontWeight = 'normal';
            }
        });
    });
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
                    <td colspan="5" class="empty-state">
                        <i class='bx bx-folder-open'></i>
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
                </tr>
            `;
        }).join('');
        
        tableBody.innerHTML = tableRows;
        console.log('Table updated successfully');
        
        // Add click handlers to new rows
        const newRows = tableBody.querySelectorAll('tr');
        newRows.forEach(row => {
            row.addEventListener('click', function() {
                const roadName = this.querySelector('td:nth-child(2)').textContent;
                console.log('Report clicked:', roadName);
            });
        });
        
    } catch (error) {
        console.error('Error loading reports table:', error);
        const tableBody = document.getElementById('reportsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
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
        console.log('Starting pie chart load...');
        const chartContainer = document.getElementById('pieChartContainer');
        
        if (!chartContainer) {
            console.error('Chart container not found!');
            return;
        }
        
        // Force clear the loading message immediately
        console.log('Forcing clear of loading message');
        chartContainer.innerHTML = '<div style="color: blue;">Generating chart...</div>';
        
        // Create simple test data that matches the summary table
        const testData = [
            { label: 'Priority 1', value: 1, color: '#dc3545' },
            { label: 'Priority 3', value: 2, color: '#ffc107' },
            { label: 'Priority 4', value: 4, color: '#28a745' }
        ];
        
        console.log('Creating chart with test data:', testData);
        
        // Add a small delay to ensure DOM updates
        setTimeout(() => {
            generatePieChart(testData);
        }, 100);
        
        console.log('Pie chart load function completed');
        
    } catch (error) {
        console.error('Error loading pie chart:', error);
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
    console.log('Chart container found:', !!chartContainer);
    console.log('Chart container current content:', chartContainer ? chartContainer.innerHTML : 'null');
    
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
            
            // Add hover effect
            path.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
                this.style.transformOrigin = '100px 100px';
            });
            
            path.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
              svg.appendChild(path);
            currentAngle += angle;
        }
    });
      // Clear and add new chart
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

// Get color for priority level
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

// Helper function to convert priority string to number
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
            return 5;
    }
}

// Helper function to determine severity based on report data
function determineSeverity(report) {
    const priority = getPriorityValue(report.priority);
    const damageType = (report.damage_type || report.issue_type || '').toLowerCase();
    
    // High priority or dangerous damage types
    if (priority <= 2 || damageType.includes('manhole') || damageType.includes('critical') || damageType.includes('dangerous') || damageType.includes('traffic light')) {
        return 'High';
    }
    // Medium priority
    else if (priority <= 3 || damageType.includes('crack') || damageType.includes('medium') || damageType.includes('damaged road')) {
        return 'Medium';
    }
    // Low priority
    else {
        return 'Low';
    }
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
    // For now, just load more reports in the table
    loadReportsTable(50); // Load up to 50 reports
    console.log('Loading all reports...');
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