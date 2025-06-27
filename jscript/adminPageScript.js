

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin page DOM loaded, initializing dashboard...');
    
    
    initializeDashboard();
    
    
    const viewAllBtn = document.querySelector('.view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function() {
            loadAllReports();
        });
    }

    
    
    console.log('Pie chart interactions will be added dynamically when chart is generated');
});


async function initializeDashboard() {
    try {
        console.log('Initializing dashboard...');
        
        
        if (typeof window.DatabaseService !== 'undefined' && !DatabaseService.isAvailable()) {
            console.log('Demo mode detected');
            showNotification(
                'Demo Mode: Database not configured. Showing sample data. Check console for setup instructions.', 
                'info', 
                8000
            );
        }

        
        console.log('Loading dashboard stats...');
        await loadDashboardStats();
        
        
        console.log('Loading reports table...');
        await loadReportsTable();
        
        
        console.log('Loading pie chart...');
        await loadPieChart();
        
        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showNotification('Failed to load dashboard data. Using sample data.', 'warning');
    }
}


async function loadDashboardStats() {
    try {
        const response = await DatabaseService.getAllReports();
        const reports = response.success ? response.data : [];
        
        
        const totalReportsEl = document.querySelector('.report-number');
        if (totalReportsEl) {
            totalReportsEl.textContent = reports ? reports.length : 0;
        }
        
        console.log('Dashboard stats loaded');
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}


async function loadReportsTable(limit = 10) {
    try {
        console.log('Loading reports for admin table...');
        
        
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
                            <i class='bx bx-trash'></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        tableBody.innerHTML = tableRows;
        console.log('Table updated successfully');
        
        
        addDeleteButtonListeners();
        
        
        const newRows = tableBody.querySelectorAll('tr');
        newRows.forEach(row => {
            row.addEventListener('click', function(event) {
                
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


async function loadPieChart() {
    try {
        const response = await DatabaseService.getAllReports();
        const reports = response.success ? response.data : [];
        
        if (!reports || reports.length === 0) {
            
            const chartContainer = document.getElementById('pieChartContainer');
            if (chartContainer) {
                chartContainer.innerHTML = '<div class="empty-chart">No data available</div>';
            }
            return;
        }
        
        
        const priorityGroups = {};
        reports.forEach(report => {
            const priority = getPriorityValue(report.priority);
            priorityGroups[priority] = (priorityGroups[priority] || 0) + 1;
        });
        
        const chartData = Object.entries(priorityGroups).map(([priority, count]) => ({
            label: `Priority ${priority}`,
            value: count,
            color: getPriorityColor(priority)
        }));
        
        
        generatePieChart(chartData);
        
    } catch (error) {
        console.error('Error loading pie chart:', error);
    }
}


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
    
    
    const svg = document.createElementNS('http:
    svg.setAttribute('width', '200');
    svg.setAttribute('height', '200');
    svg.setAttribute('viewBox', '0 0 200 200');
    
    const centerX = 100;
    const centerY = 100;
    const radius = 80;
    
    
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
    
    
    chartContainer.innerHTML = '';
    chartContainer.appendChild(svg);
    
    
    if (hoverLabel) {
        hoverLabel.textContent = 'Hover over a slice to see details';
        hoverLabel.style.visibility = 'visible';
        hoverLabel.style.opacity = '1';
    }
    
    console.log('Pie chart generated successfully');
}


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
    
    const path = document.createElementNS('http:
    path.setAttribute('d', pathData);
    
    return path;
}


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


function getPriorityColor(priority) {
    const colors = {
        '1': '#dc3545', 
        '2': '#fd7e14', 
        '3': '#ffc107', 
        '4': '#28a745', 
        '5': '#6c757d'  
    };
    return colors[priority] || '#6c757d';
}


function determineSeverity(report) {
    const priority = getPriorityValue(report.priority);
    const damageType = (report.damage_type || report.issue_type || '').toLowerCase();
    
    
    if (priority <= 2 || damageType.includes('manhole') || damageType.includes('critical') || damageType.includes('dangerous') || damageType.includes('traffic light')) {
        return 'High';
    }
    
    else if (priority <= 3 || damageType.includes('crack') || damageType.includes('medium') || damageType.includes('damaged road')) {
        return 'Medium';
    }
    
    else {
        return 'Low';
    }
}


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


function loadAllReports() {
    console.log('Loading all reports...');
    loadReportsTable(Infinity); 
}


function addDeleteButtonListeners() {
    console.log('Attaching delete button listeners...');
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        
        button.removeEventListener('click', handleReportDeleteClick);
        button.addEventListener('click', handleReportDeleteClick);
    });
    console.log(`Attached listeners to ${deleteButtons.length} delete buttons.`);
}


function handleReportDeleteClick(event) {
    event.stopPropagation(); 
    const reportId = event.currentTarget.dataset.id;
    deleteReport(reportId);
}


async function deleteReport(reportId) {
    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
        try {
            console.log(`Attempting to delete report with ID: ${reportId}`);
            
            
            if (!DatabaseService.isAvailable()) {
                console.log('Demo mode: Simulating report deletion');
                showNotification('Demo Mode: Report deletion simulated successfully!', 'success');
                
                initializeDashboard();
                return;
            }
            
            
            const { error } = await supabase
                .from('reports')
                .delete()
                .eq('id', reportId);

            if (error) {
                console.error('Error deleting report:', error.message);
                showNotification('Error deleting report: ' + error.message, 'error');
            } else {
                console.log('Report deleted successfully!');
                showNotification('Report deleted successfully!', 'success');
                
                initializeDashboard();
            }
        } catch (err) {
            console.error('Unexpected error during deletion:', err);
            showNotification('An unexpected error occurred during deletion.', 'error');
        }
    }
}


function showNotification(message, type = 'info', duration = 5000) {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class='bx ${getNotificationIcon(type)}'></i>
        <span>${message}</span>
    `;
    
    
    document.body.appendChild(notification);
    
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, duration);
}


function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'bx-check-circle';
        case 'warning': return 'bx-error-circle';
        case 'error': return 'bx-x-circle';
        default: return 'bx-info-circle';
    }
}
