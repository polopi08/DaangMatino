// Analytics Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Navigation functionality - Same as landing page
    const hamburger = document.getElementById('hamburger');
    const navbar = document.querySelector('.navbar');

    if (hamburger && navbar) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navbar.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.navbar a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navbar.classList.remove('active');
            });
        });
    }

    // Initialize analytics dashboard
    initializeAnalytics();

    // Refresh button functionality
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            refreshBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Refreshing...';
            setTimeout(() => {
                initializeAnalytics();
                refreshBtn.innerHTML = '<i class="bx bx-refresh"></i> Refresh';
            }, 1000);
        });
    }

    async function initializeAnalytics() {
        try {
            // Load all analytics data
            await Promise.all([
                loadStatistics(),
                loadMostReportedRoads(),
                loadQuickSortPrioritization(),
                loadIssueTypesDistribution(),
                loadRecentActivity()
            ]);

            console.log('✅ Analytics dashboard loaded successfully');
        } catch (error) {
            console.error('❌ Error loading analytics:', error);
            showNotification('Failed to load analytics data', 'error');
        }
    }

    async function loadStatistics() {
        try {
            const statsResult = await DatabaseService.getReportStats();
            
            if (statsResult.success) {
                const stats = statsResult.data;
                
                // Update statistics cards
                document.getElementById('totalReports').textContent = stats.total || 0;
                document.getElementById('criticalReports').textContent = stats.bySeverity?.high || 0;
                document.getElementById('recentReports').textContent = stats.recent || 0;
                
                console.log('📊 Statistics loaded:', stats);
            } else {
                // Demo mode - show sample stats
                document.getElementById('totalReports').textContent = '47';
                document.getElementById('criticalReports').textContent = '8';
                document.getElementById('recentReports').textContent = '12';
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    async function loadMostReportedRoads() {
        try {
            const reportsResult = await DatabaseService.getAllReports();
            const container = document.getElementById('mostReportedList');
            
            if (reportsResult.success && reportsResult.data.length > 0) {
                // Group reports by road name
                const roadCounts = {};
                reportsResult.data.forEach(report => {
                    const roadName = report.road_name || 'Unknown Road';
                    roadCounts[roadName] = (roadCounts[roadName] || 0) + 1;
                });

                // Sort by count and get top 5
                const sortedRoads = Object.entries(roadCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);

                container.innerHTML = sortedRoads.map((item, index) => 
                    createLeaderboardItem(index + 1, item[0], `${item[1]} reports`, item[1])
                ).join('');
            } else {
                // No data available
                container.innerHTML = '<div class="loading">No reports available</div>';
            }
        } catch (error) {
            console.error('Error loading most reported roads:', error);
            document.getElementById('mostReportedList').innerHTML = '<div class="loading">Error loading data</div>';
        }
    }

    async function loadQuickSortPrioritization() {
        try {
            const reportsResult = await DatabaseService.getAllReports();
            const container = document.getElementById('quicksortResultsList');
            
            if (reportsResult.success && reportsResult.data.length > 0) {
                // Convert reports to the format needed for QuickSort prioritization
                const formattedReports = reportsResult.data.map(report => ({
                    roadName: report.road_name || report.location_description || 'Unknown Road',
                    severity: report.severity || 'medium',
                    roadType: report.road_type || 'Municipal',
                    defects: report.defects || [],
                    reportCount: 1, // Individual report count
                    responseTime: calculateResponseTime(report.severity),
                    severityScore: calculateSeverityScore(report),
                    created_at: report.created_at,
                    id: report.id
                }));

                // Apply QuickSort prioritization
                const sortedReports = quickSortPrioritization(formattedReports);
                
                // Take top 5 prioritized reports
                const topPrioritized = sortedReports.slice(0, 5);

                container.innerHTML = topPrioritized.map((report, index) => 
                    createPrioritizationItem(index + 1, report)
                ).join('');
                
                console.log('✅ QuickSort Prioritization completed for admin dashboard');
            } else {
                // No data available
                container.innerHTML = '<div class="loading">No reports available for prioritization</div>';
            }
        } catch (error) {
            console.error('Error loading QuickSort prioritization:', error);
            document.getElementById('quicksortResultsList').innerHTML = '<div class="loading">Error loading prioritization data</div>';
        }
    }

    // QuickSort Implementation for Road Prioritization (from testPageScript.js)
    function quickSortPrioritization(arr) {
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

        return [...quickSortPrioritization(left), pivot, ...quickSortPrioritization(right)];
    }

    // Calculate severity score (adapted from testPageScript.js)
    function calculateSeverityScore(report) {
        let score = 0;
        
        // Base severity score
        const severityScores = {
            'high': 80,
            'medium': 50,
            'low': 20
        };
        score += severityScores[report.severity?.toLowerCase()] || 20;
        
        // Road type multiplier
        const roadTypeScores = {
            'national': 30,
            'provincial': 20,
            'municipal': 10
        };
        score += roadTypeScores[report.road_type?.toLowerCase()] || 10;
        
        // Defect type urgency
        if (Array.isArray(report.defects)) {
            report.defects.forEach(defect => {
                if (defect.toLowerCase().includes('pothole')) score += 20;
                else if (defect.toLowerCase().includes('traffic')) score += 15;
                else if (defect.toLowerCase().includes('flood')) score += 10;
            });
        }
        
        // Time factor - newer reports get slight boost
        const daysSinceReport = Math.floor((new Date() - new Date(report.created_at)) / (1000 * 60 * 60 * 24));
        score += Math.max(0, 10 - daysSinceReport);
        
        return score;
    }

    // Calculate response time based on severity
    function calculateResponseTime(severity) {
        const responseTimes = {
            'high': 1,     // 1 day
            'medium': 7,   // 1 week
            'low': 30      // 1 month
        };
        return responseTimes[severity?.toLowerCase()] || 14;
    }

    // Create prioritization display item
    function createPrioritizationItem(priority, report) {
        const severityClass = report.severity.toLowerCase();
        const defectsList = Array.isArray(report.defects) ? report.defects.join(', ') : report.defects;
        
        return `
            <div class="leaderboard-item prioritization-item">
                <div class="item-rank priority-${priority <= 3 ? priority : ''}">#${priority}</div>
                <div class="item-info">
                    <div class="item-title">${report.roadName}</div>
                    <div class="item-subtitle">${defectsList}</div>
                    <div class="item-details">
                        <span class="priority-score">Score: ${report.severityScore}</span>
                        <span class="response-time">Response: ${report.responseTime} days</span>
                    </div>
                </div>
                <div class="item-priority priority-${severityClass}">${report.severity}</div>
            </div>
        `;
    }

    async function loadIssueTypesDistribution() {
        try {
            const statsResult = await DatabaseService.getReportStats();
            const container = document.getElementById('issueTypesList');
            
            if (statsResult.success && statsResult.data.byDefects) {
                const defectTypes = Object.entries(statsResult.data.byDefects)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);

                container.innerHTML = defectTypes.map((item, index) => 
                    createLeaderboardItem(index + 1, item[0], `${item[1]} reports`, item[1])
                ).join('');
            } else {
                // No data available
                container.innerHTML = '<div class="loading">No issue types data available</div>';
            }
        } catch (error) {
            console.error('Error loading issue types distribution:', error);
            document.getElementById('issueTypesList').innerHTML = '<div class="loading">Error loading data</div>';
        }
    }

    async function loadRecentActivity() {
        try {
            const reportsResult = await DatabaseService.getAllReports();
            const container = document.getElementById('recentActivity');
            
            if (reportsResult.success && reportsResult.data.length > 0) {
                const recentReports = reportsResult.data
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 10);

                container.innerHTML = recentReports.map(report => 
                    createActivityItem(report)
                ).join('');
            } else {
                // No data available
                container.innerHTML = '<div class="loading">No recent activity available</div>';
            }
        } catch (error) {
            console.error('Error loading recent activity:', error);
            document.getElementById('recentActivity').innerHTML = '<div class="loading">Error loading data</div>';
        }
    }

    // Helper functions
    function createLeaderboardItem(rank, title, subtitle, count) {
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        return `
            <div class="leaderboard-item">
                <div class="item-rank ${rankClass}">#${rank}</div>
                <div class="item-info">
                    <div class="item-title">${title}</div>
                    <div class="item-subtitle">${subtitle}</div>
                </div>
                <div class="item-count">${count}</div>
            </div>
        `;
    }

    function createActivityItem(report) {
        const timeAgo = getTimeAgo(new Date(report.created_at));
        const defectsList = Array.isArray(report.defects) ? report.defects.join(', ') : (report.defects || 'Unknown');
        const icon = getDefectIcon(defectsList);
        const severity = report.severity || 'Medium';
        const severityClass = severity.toLowerCase();
        const roadName = report.road_name || report.location_description || 'Unknown Road';
        
        return `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class='bx ${icon}'></i>
                </div>
                <div class="activity-info">
                    <h4>${roadName} 
                        <span class="activity-priority priority-${severityClass}">${severity}</span>
                    </h4>
                    <p class="activity-subtitle"><strong>${defectsList}</strong></p>
                    ${report.reporter_name ? `<p><strong>Reporter:</strong> ${report.reporter_name}</p>` : ''}
                </div>
                <div class="activity-time">${timeAgo}</div>
            </div>
        `;
    }

    function getDefectIcon(defectType) {
        const defectStr = (defectType || '').toLowerCase();
        if (defectStr.includes('pothole')) return 'bx-error-circle';
        if (defectStr.includes('crack') || defectStr.includes('damaged')) return 'bx-construction';
        if (defectStr.includes('flood')) return 'bx-water';
        if (defectStr.includes('traffic') || defectStr.includes('light')) return 'bx-traffic-cone';
        if (defectStr.includes('sign') || defectStr.includes('marking')) return 'bx-error';
        return 'bx-info-circle';
    }

    function getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class='bx ${type === 'error' ? 'bx-error' : 'bx-info-circle'}'></i>
            <span>${message}</span>
            <button class="close-notification"><i class='bx bx-x'></i></button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.remove();
        });
    }
});
