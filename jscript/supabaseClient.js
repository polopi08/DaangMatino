

const SUPABASE_URL = 'https:
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYm1vZ3F6aGVxenp0a3B3bmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NTkzNjYsImV4cCI6MjA2NjIzNTM2Nn0.AFcODs36IuVEl2R5nWGgQGKU8ruqufUuvk_Qq-DfD14';


const isSupabaseConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
                            SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
                            SUPABASE_URL.includes('supabase.co') &&
                            SUPABASE_ANON_KEY.length > 20;

let supabase = null;


if (isSupabaseConfigured) {
    
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


class DatabaseService {
    
    static isAvailable() {
        return supabase !== null && isSupabaseConfigured;
    }

    
    static showConfigMessage() {
        return {
            success: false,
            error: 'Supabase not configured. Please follow the setup guide in SUPABASE_SETUP.md to enable database functionality.',
            demo: true        };
    }

    
    static generateSampleData() {
        return {
            success: true,
            demo: true,
            data: {
                total: 15,
                byPriority: {
                    'critical': 2,
                    'high': 5,
                    'medium': 6,
                    'low': 2
                },
                byIssueType: {
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
                    issue_type: 'Pothole',
                    priority: 'High',
                    priority_value: 2,
                    location_description: 'Corner of Main St. and Oak Ave.',
                    description: 'Large pothole causing traffic hazard',
                    created_at: new Date().toISOString(),
                    reporter_name: 'John Doe',
                    road_type: 'Municipal',
                    damage_type: 'Pothole'
                },
                {
                    id: 2,
                    public_id: 'RPT-000002',
                    issue_type: 'Damaged Road',
                    priority: 'Medium',
                    priority_value: 3,
                    location_description: 'Highway 101 near Exit 15',
                    description: 'Cracked pavement surface',
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    reporter_name: 'Jane Smith',
                    road_type: 'National',
                    damage_type: 'Crack'
                },
                {
                    id: 3,
                    public_id: 'RPT-000003',
                    issue_type: 'Traffic Light Issue',
                    priority: 'Critical',
                    priority_value: 1,
                    location_description: 'Intersection of First St. and Broadway',
                    description: 'Traffic light not functioning properly',
                    created_at: new Date(Date.now() - 172800000).toISOString(),
                    reporter_name: null,
                    road_type: 'Municipal',
                    damage_type: 'Traffic Signal'
                },
                {
                    id: 4,
                    public_id: 'RPT-000004',
                    issue_type: 'Flooding',
                    priority: 'High',
                    priority_value: 2,
                    location_description: 'Downtown Bridge Area',
                    description: 'Road flooding during rain',
                    created_at: new Date(Date.now() - 259200000).toISOString(),
                    reporter_name: 'Mike Wilson',
                    road_type: 'Provincial',
                    damage_type: 'Drainage Issue'
                },
                {
                    id: 5,
                    public_id: 'RPT-000005',
                    issue_type: 'Damaged Road',
                    priority: 'Low',
                    priority_value: 4,
                    location_description: 'Residential Lane 5',
                    description: 'Minor surface wear',
                    created_at: new Date(Date.now() - 345600000).toISOString(),
                    reporter_name: 'Sarah Davis',
                    road_type: 'Municipal',
                    damage_type: 'Surface Wear'
                },
                {
                    id: 6,
                    public_id: 'RPT-000006',
                    issue_type: 'Pothole',
                    priority: 'Critical',
                    priority_value: 1,
                    location_description: 'Main Highway Intersection',
                    description: 'Dangerous pothole at busy intersection',
                    created_at: new Date(Date.now() - 432000000).toISOString(),
                    reporter_name: 'Emergency Services',
                    road_type: 'National',
                    damage_type: 'Pothole'
                },
                {
                    id: 7,
                    public_id: 'RPT-000007',
                    issue_type: 'Road Marking',
                    priority: 'Medium',
                    priority_value: 3,
                    location_description: 'School Zone Area',
                    description: 'Faded road markings near school',
                    created_at: new Date(Date.now() - 518400000).toISOString(),
                    reporter_name: 'School Principal',
                    road_type: 'Municipal',
                    damage_type: 'Road Marking'
                }
            ]
        };
    }

    
    static async createReport(reportData) {
        console.log('📝 Creating report with data:', reportData);
        
        if (!this.isAvailable()) {
            
            console.log('📝 Demo mode: Report would be created with data:', reportData);
            return {
                success: true,
                data: {
                    id: Math.floor(Math.random() * 1000) + 1,
                    public_id: `RPT-${String(Math.floor(Math.random() * 1000) + 1).padStart(6, '0')}`,
                    ...reportData,
                    created_at: new Date().toISOString()
                },
                demo: true
            };
        }

        try {
            console.log('🔄 Attempting to insert report into Supabase...');
            
            const { data, error } = await supabase
                .from('reports')
                .insert([{
                    reporter_name: reportData.reporterName,
                    reporter_email: reportData.reporterEmail,
                    reporter_phone: reportData.reporterPhone,
                    issue_type: reportData.issueType,
                    date_occurred: reportData.dateOccurred,
                    time_occurred: reportData.timeOccurred,
                    priority: reportData.priority,
                    location_description: reportData.locationDescription,
                    description: reportData.description
                }])
                .select();

            if (error) {
                console.error('❌ Supabase insert error:', error);
                console.error('Error details:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                throw error;
            }
            
            console.log('✅ Report created successfully:', data[0]);
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error creating report:', error);
            console.error('Full error object:', error);
            return { success: false, error: error.message };
        }
    }

    static async getAllReports() {
        if (!this.isAvailable()) {
            
            console.log('📊 Demo mode: Returning sample reports data');
            return this.generateSampleReports();
        }

        try {
            const { data, error } = await supabase
                .from('reports')
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
                .from('reports')
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
                .from('reports')
                .select('*')
                .eq('public_id', publicId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching report by public ID:', error);
            return { success: false, error: error.message };
        }
    }    
    static async uploadAttachment(file, reportId) {
        console.log('📎 Uploading attachment:', file.name, 'for report:', reportId);
        console.log('File details:', {
            name: file.name,
            type: file.type,
            size: file.size,
            reportId: reportId
        });
        
        if (!this.isAvailable()) {
            
            console.log('📎 Demo mode: File would be uploaded:', file.name);
            return {
                success: true,
                data: {
                    id: Math.floor(Math.random() * 1000),
                    report_id: reportId,
                    file_url: `demo:
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

            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('report-attachments')
                .upload(filePath, file);

            if (uploadError) {
                console.error('❌ Storage upload error:', uploadError);
                throw uploadError;
            }
            
            console.log('✅ File uploaded to storage:', uploadData);

            
            const { data: { publicUrl } } = supabase.storage
                .from('report-attachments')
                .getPublicUrl(filePath);
                
            console.log('📎 Public URL generated:', publicUrl);

            
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

    
    static async createReportToken(reportId) {
        if (!this.isAvailable()) {
            
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
            
            
            const { data: existingToken, error: checkError } = await supabase
                .from('report_tokens')
                .select('*')
                .eq('report_id', reportId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') { 
                console.error('❌ Error checking for existing token:', checkError);
                
            }

            if (existingToken) {
                
                console.log('✅ Token already exists for report:', reportId, 'Token:', existingToken.access_token);
                return { success: true, data: existingToken };
            }

            console.log('📝 Creating new token for report:', reportId);

            
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
                
                
                if (error.message && error.message.includes('infinite recursion')) {
                    console.error('🔄 RLS Policy recursion detected! Check your RLS policies.');
                    throw new Error('Database policy error: infinite recursion in report_tokens table. Please check RLS policies.');
                }
                
                
                if (error.code === '23505') { 
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

    
    static generateAccessToken() {
        return 'TKN-' + Math.random().toString(36).substr(2, 12).toUpperCase();
    }

    
    static async getReportStats() {
        if (!this.isAvailable()) {
            
            console.log('📈 Demo mode: Returning sample statistics');
            return this.generateSampleData();
        }

        try {
            const { data, error } = await supabase
                .from('reports')
                .select('priority, issue_type, created_at');

            if (error) throw error;

            const stats = {
                total: data.length,
                byPriority: this.groupBy(data, 'priority'),
                byIssueType: this.groupBy(data, 'issue_type'),
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
}


window.DatabaseService = DatabaseService;


console.log('DatabaseService status:');
console.log('- Available:', DatabaseService.isAvailable());
console.log('- Sample reports:', DatabaseService.generateSampleReports());


window.supabaseClient = supabase;
