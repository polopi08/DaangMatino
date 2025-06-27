// Report Page Script with Supabase Integration
document.addEventListener('DOMContentLoaded', function() {
    // Ensure DatabaseService is available
    if (typeof window.DatabaseService === 'undefined') {
        console.warn('DatabaseService not available, retrying...');
        setTimeout(() => {
            if (typeof window.DatabaseService === 'undefined') {
                console.error('DatabaseService still not available after delay');
                showNotification('System initialization error. Please refresh the page.', 'error');
            }
        }, 500);
    }

    const form = document.getElementById('reportForm');
    const fileInput = document.getElementById('file-input');
    const filePreview = document.getElementById('file-preview');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const successModal = document.getElementById('successModal');
    const loadingSpinner = submitBtn.querySelector('.loading-spinner');
    const btnText = submitBtn.querySelector('.btn-text');

    let selectedFiles = [];

    // Set up modal event listeners
    setupModalEventListeners();

    // File upload handler
    fileInput.addEventListener('change', handleFileSelection);
    
    // Drag and drop functionality
    const uploadLabel = document.querySelector('.upload-label');
    
    uploadLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadLabel.classList.add('drag-over');
    });
    
    uploadLabel.addEventListener('dragleave', () => {
        uploadLabel.classList.remove('drag-over');
    });
    
    uploadLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadLabel.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });

    function handleFileSelection(e) {
        const files = Array.from(e.target.files);
        handleFiles(files);
    }

    function handleFiles(files) {
        // Filter valid files (images and videos only)
        const validFiles = files.filter(file => {
            const isValid = file.type.startsWith('image/') || file.type.startsWith('video/');
            const isUnder10MB = file.size <= 10 * 1024 * 1024; // 10MB limit
            
            if (!isValid) {
                showNotification('Please select only image or video files.', 'error');
                return false;
            }
            
            if (!isUnder10MB) {
                showNotification(`File "${file.name}" is too large. Maximum size is 10MB.`, 'error');
                return false;
            }
            
            return true;
        });

        selectedFiles = [...selectedFiles, ...validFiles];
        updateFilePreview();
    }

    function updateFilePreview() {
        filePreview.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileName = document.createElement('span');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            
            const fileSize = document.createElement('span');
            fileSize.className = 'file-size';
            fileSize.textContent = formatFileSize(file.size);
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-file';
            removeBtn.innerHTML = '<i class="bx bx-x"></i>';
            removeBtn.type = 'button';
            removeBtn.addEventListener('click', () => removeFile(index));
            
            fileItem.appendChild(fileName);
            fileItem.appendChild(fileSize);
            fileItem.appendChild(removeBtn);
            filePreview.appendChild(fileItem);
        });
    }

    function removeFile(index) {
        selectedFiles.splice(index, 1);
        updateFilePreview();
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await submitReport();
    });

    // Cancel button handler
    cancelBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
            window.location.href = 'landingPage.html';
        }
    });

    async function submitReport() {
        // Show loading state
        setLoadingState(true);

        try {
            // Collect form data
            const formData = new FormData(form);
            const reportData = {
                reporterName: formData.get('reporter_name') || null,
                reporterEmail: formData.get('reporter_email'),
                reporterPhone: formData.get('reporter_phone') || null,
                issueType: formData.get('issue_type'),
                dateOccurred: formData.get('date_occurred'),
                timeOccurred: formData.get('time_occurred'),
                priority: formData.get('priority'),
                locationDescription: formData.get('location_description'),
                description: formData.get('description')
            };            // Validate required fields
            if (!reportData.reporterEmail || !reportData.issueType || !reportData.dateOccurred || 
                !reportData.timeOccurred || !reportData.priority || !reportData.locationDescription || 
                !reportData.description) {
                throw new Error('Please fill in all required fields.');
            }

            // Check if DatabaseService is available
            if (typeof window.DatabaseService === 'undefined') {
                throw new Error('System not initialized. Please refresh the page and try again.');
            }

            // Create report in database
            const reportResult = await DatabaseService.createReport(reportData);
            
            if (!reportResult.success) {
                throw new Error(reportResult.error);
            }

            const report = reportResult.data;
            
            // Check if we're in demo mode
            if (reportResult.demo) {
                showNotification('🎭 Demo Mode: Report simulated successfully! Configure Supabase for real database functionality.', 'info');
            }
            
            // Upload attachments if any (in demo mode, this will be simulated)
            if (selectedFiles.length > 0) {
                for (const file of selectedFiles) {
                    const uploadResult = await DatabaseService.uploadAttachment(file, report.id);
                    if (!uploadResult.success) {
                        console.warn('Failed to upload file:', file.name, uploadResult.error);
                    } else if (uploadResult.demo) {
                        console.log('📎 Demo: File upload simulated for', file.name);
                    }
                }
            }            // Create access token for tracking (simulated in demo mode)
            const tokenResult = await DatabaseService.createReportToken(report.id);
            
            if (!tokenResult.success) {
                console.warn('Failed to create report token:', tokenResult.error);
                // Don't fail the entire submission for token creation failure
                // Token is optional for tracking purposes
            } else {
                console.log('✅ Report token created successfully:', tokenResult.data.access_token);
            }
            
            // Show success modal
            showSuccessModal(report.public_id || `RPT-${String(report.id).padStart(6, '0')}`);

        } catch (error) {
            console.error('Error submitting report:', error);
            
            // Check if it's a configuration error
            if (error.message.includes('Supabase not configured')) {
                showNotification('⚙️ Database not configured. Please follow the setup guide in SUPABASE_SETUP.md to enable full functionality.', 'warning');
            } else {
                showNotification(error.message || 'Failed to submit report. Please try again.', 'error');
            }
        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(loading) {
        if (loading) {
            submitBtn.disabled = true;
            loadingSpinner.style.display = 'inline-block';
            btnText.textContent = 'Submitting...';
        } else {
            submitBtn.disabled = false;
            loadingSpinner.style.display = 'none';
            btnText.textContent = 'Submit Report';
        }
    }    function showSuccessModal(reportId) {
        const reportIdElement = document.getElementById('reportId');
        if (reportIdElement) {
            reportIdElement.textContent = reportId;
        }
        
        if (successModal) {
            successModal.style.display = 'block';
        }
    }

    function showNotification(message, type = 'info', duration = 5000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class='bx ${type === 'error' ? 'bx-error' : 'bx-info-circle'}'></i>
            <span>${message}</span>
            <button class="close-notification"><i class='bx bx-x'></i></button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after specified duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);

        // Close button handler
        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.remove();
        });
    }

    function setupModalEventListeners() {
        // Set up event listeners for modal buttons
        const viewAnalyticsBtn = document.getElementById('viewAnalyticsBtn');
        const newReportBtn = document.getElementById('newReportBtn');
        
        if (viewAnalyticsBtn) {
            viewAnalyticsBtn.addEventListener('click', function() {
                successModal.style.display = 'none';
                window.location.href = 'test.html';
            });
        }
        
        if (newReportBtn) {
            newReportBtn.addEventListener('click', function() {
                successModal.style.display = 'none';
                form.reset();
                selectedFiles = [];
                updateFilePreview();
            });
        }
    }

    // Set default date to today
    document.getElementById('date-occurred').valueAsDate = new Date();

    // Close modal when clicking outside
    successModal.addEventListener('click', function(e) {
        if (e.target === successModal) {
            successModal.style.display = 'none';
        }
    });    // Check if running in demo mode and notify user
    setTimeout(() => {
        if (typeof window.DatabaseService !== 'undefined' && !DatabaseService.isAvailable()) {
            showNotification(
                'Demo Mode: Database not configured. Reports will be simulated. Check console for setup instructions.', 
                'info', 
                8000
            );
        }
    }, 1000);
});
