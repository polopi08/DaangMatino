
document.addEventListener('DOMContentLoaded', function() {
    
    setTimeout(initializeAdminAnalytics, 1000);
    
    function initializeAdminAnalytics() {
        console.log('Initializing admin analytics...');
        
        
        const elementMapping = {
            'totalReports': 'totalReportsAdmin',
            'criticalReports': 'criticalReportsAdmin', 
            'affectedAreas': 'affectedAreasAdmin',
            'recentReports': 'recentReportsAdmin',
            'mostReportedList': 'mostReportedListAdmin',
            'mostUrgentList': 'mostUrgentListAdmin',
            'issueTypesList': 'issueTypesListAdmin',
            'affectedAreasList': 'affectedAreasListAdmin',
            'recentActivity': 'recentActivityAdmin'
        };
        
        
        for (const [source, target] of Object.entries(elementMapping)) {
            const sourceEl = document.getElementById(source);
            const targetEl = document.getElementById(target);
            
            if (sourceEl && targetEl) {
                if (sourceEl.innerHTML && !sourceEl.innerHTML.includes('Loading')) {
                    targetEl.innerHTML = sourceEl.innerHTML;
                } else if (sourceEl.textContent && sourceEl.textContent !== '0') {
                    targetEl.textContent = sourceEl.textContent;
                }
            }
        }
        
        
        const refreshBtn = document.getElementById('refreshBtnAdmin');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                refreshBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Refreshing...';
                
                
                setTimeout(() => {
                    
                    if (typeof initializeAnalytics === 'function') {
                        initializeAnalytics().then(() => {
                            
                            initializeAdminAnalytics();
                            refreshBtn.innerHTML = '<i class="bx bx-refresh"></i> Refresh';
                        });
                    } else {
                        refreshBtn.innerHTML = '<i class="bx bx-refresh"></i> Refresh';
                    }
                }, 1000);
            });
        }
        
        console.log('Admin analytics initialized');
    }
});
