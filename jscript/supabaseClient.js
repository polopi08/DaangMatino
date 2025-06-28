// Supabase Client Configuration
// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://rnbmogqzheqzztkpwnif.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYm1vZ3F6aGVxenp0a3B3bmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NTkzNjYsImV4cCI6MjA2NjIzNTM2Nn0.AFcODs36IuVEl2R5nWGgQGKU8ruqufUuvk_Qq-DfD14';

// Check if Supabase is properly configured
const isSupabaseConfigured = SUPABASE_URL.includes('supabase.co') && 
                            SUPABASE_ANON_KEY.length > 20;

let supabase = null;

// Initialize Supabase client only if properly configured
if (isSupabaseConfigured) {
    // Wait for Supabase SDK to load
    if (typeof window.supabase !== 'undefined') {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Supabase client:', error);
            supabase = null;
        }
    } else {
        console.warn('⚠️ Supabase SDK not loaded yet. Retrying...');
        // Retry after a short delay
        setTimeout(() => {
            if (typeof window.supabase !== 'undefined') {
                try {
                    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    console.log('✅ Supabase client initialized successfully (delayed)');
                } catch (error) {
                    console.error('❌ Failed to initialize Supabase client:', error);
                    supabase = null;
                }
            }
        }, 100);
    }
} else {
    console.warn('⚠️ Supabase not configured. Using demo mode with sample data.');
    console.log('📋 To enable database functionality:');
    console.log('1. Follow the setup guide in SUPABASE_SETUP.md');
    console.log('2. Update SUPABASE_URL and SUPABASE_ANON_KEY in jscript/supabaseClient.js');
}

// Database service functions
class DatabaseService {
    // Check if Supabase is available
    static isAvailable() {
        return supabase !== null && isSupabaseConfigured;
    }

    // Show configuration message
    static showConfigMessage() {
        return {
            success: false,
            error: 'Supabase not configured. Please follow the setup guide in SUPABASE_SETUP.md to enable database functionality.',
            demo: true        };
    }

    // Generate sample data for demo mode
    static generateSampleData() {
        return {
            success: true,
            demo: true,
            data: {
                total: 15,
                byDefects: {
                    'Pothole': 6,
                    'Damaged Road': 4,
                    'Flooding': 3,
                    'Traffic Light Issue': 2
                },
                byRoadType: {
                    'Municipal': 8,
                    'National': 4,
                    'Provincial': 3
                },
                recent: 5
            }
        };
    }

    static generateSampleReports() {
        return {
            success: true,
            data: [
                {
                    id: 1,
                    public_id: 'RPT-000001',
                    defects: ['Pothole'],
                    location_description: 'Corner of Main St. and Oak Ave.',
                    created_at: new Date().toISOString(),
                    reporter_name: 'John Doe',
                    road_name: 'Main Street',
                    road_type: 'Municipal'
                },
                {
                    id: 2,
                    public_id: 'RPT-000002',
                    defects: ['Damaged Road'],
                    location_description: 'Highway 101 near Exit 15',
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    reporter_name: 'Jane Smith',
                    road_name: 'Highway 101',
                    road_type: 'National'
                },
                {
                    id: 3,
                    public_id: 'RPT-000003',
                    defects: ['Traffic Light Issue'],
                    location_description: 'Intersection of First St. and Broadway',
                    created_at: new Date(Date.now() - 172800000).toISOString(),
                    reporter_name: null,
                    road_name: 'First Street',
                    road_type: 'Municipal'
                },
                {
                    id: 4,
                    public_id: 'RPT-000004',
                    defects: ['Flooding'],
                    location_description: 'Downtown Bridge Area',
                    created_at: new Date(Date.now() - 259200000).toISOString(),
                    reporter_name: 'Mike Wilson',
                    road_name: 'Downtown Bridge',
                    road_type: 'Provincial'
                },
                {
                    id: 5,
                    public_id: 'RPT-000005',
                    defects: ['Damaged Road'],
                    location_description: 'Residential Lane 5',
                    created_at: new Date(Date.now() - 345600000).toISOString(),
                    reporter_name: 'Sarah Davis',
                    road_name: 'Residential Lane 5',
                    road_type: 'Municipal'
                },
                {
                    id: 6,
                    public_id: 'RPT-000006',
                    defects: ['Pothole'],
                    location_description: 'Main Highway Intersection',
                    created_at: new Date(Date.now() - 432000000).toISOString(),
                    reporter_name: 'Emergency Services',
                    road_name: 'Main Highway',
                    road_type: 'National'
                },
                {
                    id: 7,
                    public_id: 'RPT-000007',
                    defects: ['Road Marking'],
                    location_description: 'School Zone Area',
                    created_at: new Date(Date.now() - 518400000).toISOString(),
                    reporter_name: 'School Principal',
                    road_name: 'School Zone',
                    road_type: 'Municipal'
                }
            ]
        };
    }

    // Reports operations
    static async createReport(reportData) {
    console.log('📝 Creating report with data:', reportData);
    
    if (!this.isAvailable()) {
        throw new Error('Database service not available');
    }

    try {
        // Convert defects string to array if needed
        let defectsArray;
        if (typeof reportData.defects === 'string') {
            // Split comma-separated string into array and trim whitespace
            defectsArray = reportData.defects.split(',').map(item => item.trim());
        } else if (Array.isArray(reportData.defects)) {
            defectsArray = reportData.defects;
        } else {
            defectsArray = [];
        }

        const dbData = {
            road_name: reportData.roadName || reportData.road_name || '',
            road_type: reportData.roadType || reportData.road_type || 'unknown',
            defects: defectsArray, // Now properly formatted as array
            description: reportData.description || '',
            latitude: reportData.latitude || null,
            longitude: reportData.longitude || null,
            response_time: reportData.response_time || reportData.responseTime || 7, // Handle both snake_case and camelCase, with default
            severity_score: reportData.severityScore || 50,
            report_count: 1
        };

        console.log('🔄 Attempting to insert report into Supabase...');
        console.log('📋 Formatted data for database:', dbData);
        
        const { data, error } = await supabase
            .from('road_reports')
            .insert([dbData])
            .select('*');

        if (error) {
            console.error('❌ Supabase insert error:', error);
            console.error('Error details:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            throw new Error('No data returned from insert operation');
        }

        console.log('✅ Report saved to database successfully:', data[0]);
        return { success: true, data: data[0] };
        
    } catch (error) {
        console.error('❌ Error creating report:', error);
        console.error('Full error object:', error);
        throw error;
    }
}

    static async getAllReports() {
        if (!this.isAvailable()) {
            // Demo mode - return sample data
            console.log('📊 Demo mode: Returning sample reports data');
            return this.generateSampleReports();
        }

        try {
            const { data, error } = await supabase
                .from('road_reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching reports:', error);
            return { success: false, error: error.message };
        }
    }

    static async getReportById(id) {
        if (!this.isAvailable()) {
            return this.showConfigMessage();
        }

        try {
            const { data, error } = await supabase
                .from('road_reports')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching report:', error);
            return { success: false, error: error.message };
        }
    }

    static async getReportByPublicId(publicId) {
        if (!this.isAvailable()) {
            return this.showConfigMessage();
        }

        try {
            const { data, error } = await supabase
                .from('road_reports')
                .select('*')
                .eq('public_id', publicId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching report by public ID:', error);
            return { success: false, error: error.message };
        }
    }    // Report attachments operations
    static async uploadAttachment(file, reportId) {
        console.log('📎 Uploading attachment:', file.name, 'for report:', reportId);
        console.log('File details:', {
            name: file.name,
            type: file.type,
            size: file.size,
            reportId: reportId
        });
        
        if (!this.isAvailable()) {
            // Demo mode - simulate successful upload
            console.log('📎 Demo mode: File would be uploaded:', file.name);
            return {
                success: true,
                data: {
                    id: Math.floor(Math.random() * 1000),
                    report_id: reportId,
                    file_url: `demo://uploads/${file.name}`,
                    file_type: file.type.startsWith('image/') ? 'image' : 'document'
                },
                demo: true
            };
        }

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `reports/${reportId}/${fileName}`;
            
            console.log('🔄 Uploading to storage path:', filePath);

            // Upload file to Supabase storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('report-attachments')
                .upload(filePath, file);

            if (uploadError) {
                console.error('❌ Storage upload error:', uploadError);
                throw uploadError;
            }
            
            console.log('✅ File uploaded to storage:', uploadData);

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('report-attachments')
                .getPublicUrl(filePath);
                
            console.log('📎 Public URL generated:', publicUrl);

            // Save attachment record to database
            const fileType = file.type.startsWith('image/') ? 'image' : 
                           file.type.startsWith('video/') ? 'video' : 'document';
                           
            console.log('💾 Saving attachment record to database...');

            const { data, error } = await supabase
                .from('report_attachments')
                .insert([{
                    report_id: reportId,
                    file_url: publicUrl,
                    file_type: fileType
                }])
                .select();

            if (error) {
                console.error('❌ Database insert error for attachment:', error);
                throw error;
            }
            
            console.log('✅ Attachment record saved:', data[0]);
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error uploading attachment:', error);
            console.error('Full error details:', error);
            return { success: false, error: error.message };
        }
    }

    static async getReportAttachments(reportId) {
        if (!this.isAvailable()) {
            return this.showConfigMessage();
        }

        try {
            const { data, error } = await supabase
                .from('report_attachments')
                .select('*')
                .eq('report_id', reportId)
                .order('uploaded_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching attachments:', error);
            return { success: false, error: error.message };
        }
    }

    // Report tokens operations
    static async createReportToken(reportId) {
        if (!this.isAvailable()) {
            // Demo mode - simulate token creation
            return {
                success: true,
                data: {
                    report_id: reportId,
                    access_token: this.generateAccessToken()
                },
                demo: true
            };
        }        try {
            const accessToken = this.generateAccessToken();
            console.log('🎟️ Attempting to create token for report:', reportId, 'Token:', accessToken);
              console.log('🔄 Checking for existing token...');
            
            // First check if a token already exists for this report
            const { data: existingToken, error: checkError } = await supabase
                .from('report_tokens')
                .select('*')
                .eq('report_id', reportId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error('❌ Error checking for existing token:', checkError);
                // Continue anyway, might be a permissions issue
            }

            if (existingToken) {
                // Token already exists, return the existing one
                console.log('✅ Token already exists for report:', reportId, 'Token:', existingToken.access_token);
                return { success: true, data: existingToken };
            }

            console.log('📝 Creating new token for report:', reportId);

            // Create new token
            const { data, error } = await supabase
                .from('report_tokens')
                .insert([{
                    report_id: reportId,
                    access_token: accessToken
                }])
                .select();            if (error) {
                console.error('❌ Error inserting token:', error);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                console.error('Error details:', error.details);
                
                // Check for specific error types
                if (error.message && error.message.includes('infinite recursion')) {
                    console.error('🔄 RLS Policy recursion detected! Check your RLS policies.');
                    throw new Error('Database policy error: infinite recursion in report_tokens table. Please check RLS policies.');
                }
                
                // If it's a constraint violation, try to get the existing token
                if (error.code === '23505') { // unique_violation
                    console.log('🔄 Token constraint violation, fetching existing token');
                    const { data: existingData } = await supabase
                        .from('report_tokens')
                        .select('*')
                        .eq('report_id', reportId)
                        .single();
                    
                    if (existingData) {
                        console.log('✅ Found existing token after constraint violation:', existingData.access_token);
                        return { success: true, data: existingData };
                    }
                }
                throw error;
            }
            
            console.log('✅ Token created successfully:', data[0].access_token);
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error creating report token:', error);
            return { success: false, error: error.message };
        }
    }

    static async verifyReportToken(token) {
        if (!this.isAvailable()) {
            return this.showConfigMessage();
        }

        try {
            const { data, error } = await supabase
                .from('report_tokens')
                .select('*, reports(*)')
                .eq('access_token', token)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error verifying token:', error);
            return { success: false, error: error.message };
        }
    }

    // Admin operations
    static async createAdmin(email, role = 'admin') {
        if (!this.isAvailable()) {
            return this.showConfigMessage();
        }

        try {
            const { data, error } = await supabase
                .from('admin')
                .insert([{
                    email: email,
                    role: role
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error creating admin:', error);
            return { success: false, error: error.message };
        }
    }

    static async getAdminByEmail(email) {
        if (!this.isAvailable()) {
            return this.showConfigMessage();
        }

        try {
            const { data, error } = await supabase
                .from('admin')
                .select('*')
                .eq('email', email)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching admin:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete a report
    static async deleteReport(reportId) {
        if (!this.isAvailable()) {
            return this.showConfigMessage();
        }

        try {
            console.log('🔄 Attempting to delete report from Supabase...');
            
            const { data, error } = await supabase
                .from('road_reports')
                .delete()
                .eq('id', reportId)
                .select();

            if (error) {
                console.error('❌ Supabase delete error:', error);
                throw error;
            }
            
            console.log('✅ Report deleted successfully:', data);
            return { success: true, data: data };
        } catch (error) {
            console.error('❌ Error deleting report:', error);
            return { success: false, error: error.message };
        }
    }

    // Utility functions
    static generateAccessToken() {
        return 'TKN-' + Math.random().toString(36).substr(2, 12).toUpperCase();
    }

    // Statistics functions for admin dashboard
    static async getReportStats() {
        if (!this.isAvailable()) {
            // Demo mode - return sample statistics
            console.log('📈 Demo mode: Returning sample statistics');
            return this.generateSampleData();
        }

        try {
            const { data, error } = await supabase
                .from('road_reports')
                .select('defects, created_at, road_name, road_type');

            if (error) throw error;

            const stats = {
                total: data.length,
                byDefects: this.groupByDefects(data), // Special handling for defects array
                byRoadType: this.groupBy(data, 'road_type'),
                recent: data.filter(report => {
                    const reportDate = new Date(report.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return reportDate >= weekAgo;
                }).length
            };

            return { success: true, data: stats };
        } catch (error) {
            console.error('Error fetching stats:', error);
            return { success: false, error: error.message };
        }
    }    static groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key]?.toLowerCase() || 'unknown';
            result[group] = (result[group] || 0) + 1;
            return result;
        }, {});
    }

    static groupByDefects(array) {
        return array.reduce((result, item) => {
            const defects = item.defects || [];
            // Handle case where defects might be stored as a string
            const defectsArray = Array.isArray(defects) ? defects : [defects];
            
            defectsArray.forEach(defect => {
                if (defect && defect.trim()) {
                    const group = defect.toLowerCase();
                    result[group] = (result[group] || 0) + 1;
                }
            });
            return result;
        }, {});
    }

    // Get comprehensive analytics data
    static async getAnalytics() {
        if (!this.isAvailable()) {
            console.log('📊 Demo mode: Returning sample analytics');
            return {
                success: true,
                data: {
                    total: 12,
                    recent: 5,
                    byDefects: {
                        'potholes': 4,
                        'road markings': 3,
                        'damaged road': 2,
                        'flooding': 2,
                        'traffic light issue': 1
                    },
                    byRoadType: {
                        'municipal': 6,
                        'national': 3,
                        'provincial': 2,
                        'barangay road': 1
                    }
                }
            };
        }

        try {
            const { data, error } = await supabase
                .from('road_reports')
                .select('*');

            if (error) throw error;

            const analytics = {
                total: data.length,
                recent: data.filter(report => {
                    const reportDate = new Date(report.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return reportDate >= weekAgo;
                }).length,
                byDefects: this.groupByDefects(data),
                byRoadType: this.groupBy(data, 'road_type')
            };

            return { success: true, data: analytics };
        } catch (error) {
            console.error('Error fetching analytics:', error);
            return { success: false, error: error.message };
        }
    }

    // Get most reported roads leaderboard
    static async getMostReportedRoads(limit = 10) {
        if (!this.isAvailable()) {
            console.log('📊 Demo mode: Returning sample most reported roads');
            return {
                success: true,
                data: [
                    { road_name: 'Main Street', report_count: 5, road_type: 'Municipal', aggregated_severity: 285 },
                    { road_name: 'Highway 101', report_count: 4, road_type: 'National', aggregated_severity: 320 },
                    { road_name: 'First Street', report_count: 3, road_type: 'Municipal', aggregated_severity: 225 },
                    { road_name: 'Downtown Bridge', report_count: 2, road_type: 'Provincial', aggregated_severity: 190 },
                    { road_name: 'School Zone', report_count: 2, road_type: 'Municipal', aggregated_severity: 165 }
                ]
            };
        }

        try {
            const { data, error } = await supabase
                .from('road_reports')
                .select('road_name, road_type, defects, response_time, created_at');

            if (error) throw error;

            // Group reports by road_name and calculate aggregated metrics
            const roadGroups = data.reduce((groups, report) => {
                const roadName = report.road_name;
                if (!groups[roadName]) {
                    groups[roadName] = {
                        road_name: roadName,
                        road_type: report.road_type,
                        reports: [],
                        report_count: 0
                    };
                }
                groups[roadName].reports.push(report);
                groups[roadName].report_count++;
                return groups;
            }, {});

            // Calculate aggregated severity scores and format result
            const roadList = Object.values(roadGroups).map(roadGroup => {
                // Calculate aggregated severity score for this road
                const aggregatedSeverity = this.calculateAggregatedSeverityForRoad(roadGroup.road_name, data);
                
                return {
                    road_name: roadGroup.road_name,
                    report_count: roadGroup.report_count,
                    road_type: roadGroup.road_type,
                    aggregated_severity: aggregatedSeverity
                };
            });

            // Sort by report count (descending) and then by aggregated severity (descending)
            roadList.sort((a, b) => {
                if (a.report_count !== b.report_count) {
                    return b.report_count - a.report_count;
                }
                return b.aggregated_severity - a.aggregated_severity;
            });

            return { 
                success: true, 
                data: roadList.slice(0, limit) 
            };
        } catch (error) {
            console.error('Error fetching most reported roads:', error);
            return { success: false, error: error.message };
        }
    }

    // Helper function to calculate aggregated severity score per road (server-side)
    static calculateAggregatedSeverityForRoad(roadName, allReports) {
        // Road Type Scores
        const roadTypeScores = {
            "national road": 100,
            "national": 100,
            "municipal": 75,
            "barangay road": 50,
            "provincial": 60,
            "bypass road": 25,
            "Unnamed Road": 25
        };

        // Defects mapping with response times
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

        // Get all reports for this specific road
        const roadReports = allReports.filter(report => report.road_name === roadName);
        
        if (roadReports.length === 0) return 0;
        
        // RTS (Road Type Score) - CORRECTED: Only count once per road, not per report
        const firstReport = roadReports[0];
        const rts = roadTypeScores[firstReport.road_type] || 50;
        
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
        const aggregatedRFS = DatabaseService.getReportFrequencyScore(totalReportCount);
        
        // Apply the aggregation formula: (RTS × 0.40) + (∑RDS × 0.50) + (RFS × 0.10)
        // CORRECTED: RTS is single value, not summed
        const aggregatedSeverityScore = (rts * 0.40) + (totalRDS * 0.50) + (aggregatedRFS * 0.10);
        
        // Enhanced debug logging for aggregated severity calculation
        console.log(`🔢 ENHANCED Supabase aggregated severity calculation for road "${roadName}":`, {
            roadType: firstReport.roadType || firstReport.road_type,
            rts: rts,
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

    // Enhanced Report Frequency Score mapping based on frequency table
    static getReportFrequencyScore(reportCount) {
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
}

// Ensure DatabaseService is available globally
window.DatabaseService = DatabaseService;

// Debug logging for service availability
console.log('DatabaseService status:');
console.log('- Available:', DatabaseService.isAvailable());
console.log('- Sample reports:', DatabaseService.generateSampleReports());

// Export for use in other files
window.supabaseClient = supabase;
