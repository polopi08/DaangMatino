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
                bySeverity: {
                    'high': 7,
                    'medium': 6,
                    'low': 2
                },
                byDefects: {
                    'Pothole': 6,
                    'Damaged Road': 4,
                    'Flooding': 3,
                    'Traffic Light Issue': 2
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
                    severity: 'High',
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
                    severity: 'Medium',
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
                    severity: 'High',
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
                    severity: 'High',
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
                    severity: 'Low',
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
                    severity: 'High',
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
                    severity: 'Medium',
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
            severity: reportData.severity || 'medium',
            description: reportData.description || '',
            latitude: reportData.latitude || null,
            longitude: reportData.longitude || null,
            response_time: reportData.responseTime || null,
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
                .select('severity, defects, created_at');

            if (error) throw error;

            const stats = {
                total: data.length,
                bySeverity: this.groupBy(data, 'severity'),
                byDefects: this.groupByDefects(data), // Special handling for defects array
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
}

// Ensure DatabaseService is available globally
window.DatabaseService = DatabaseService;

// Debug logging for service availability
console.log('DatabaseService status:');
console.log('- Available:', DatabaseService.isAvailable());
console.log('- Sample reports:', DatabaseService.generateSampleReports());

// Export for use in other files
window.supabaseClient = supabase;
