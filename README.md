# DaangMatino - Road Network Maintenance Planning System

## 🚗 Overview
DaangMatino is a comprehensive road maintenance planning system that allows users to report road issues, view analytics, and track maintenance activities across different locations.

## 🌐 Navigation Structure

### Access URLs:
- **Main Site:** http://127.0.0.1:3000 (automatically redirects to landing page)
- **Landing Page:** http://127.0.0.1:3000/pages/landingPage.html
- **Analytics Dashboard:** http://127.0.0.1:3000/pages/analyticsPage.html
- **Report Issues:** http://127.0.0.1:3000/pages/reportPage.html
- **Maps:** http://127.0.0.1:3000/pages/maps.html
- **Admin Dashboard:** http://127.0.0.1:3000/pages/adminPage.html

### Page Connections:
All pages are fully connected through consistent navigation menus:

#### 🏠 **Landing Page** (`landingPage.html`)
- **Home** - Scrolls to top of landing page
- **Analytics** - Navigates to analytics dashboard
- **About Us** - Scrolls to about section
- **Contact** - Scrolls to contact section
- **Maps** - Navigates to maps page
- **Report Road Damage** - (Button) Navigates to report page

#### 📊 **Analytics Page** (`analyticsPage.html`)
- **Home** - Returns to landing page
- **Analytics** - Current page (highlighted)
- **About Us** - Returns to landing page about section
- **Contact** - Returns to landing page contact section
- **Maps** - Navigates to maps page
- **Report Road Damage** - (Button) Navigates to report page

#### 📝 **Report Page** (`reportPage.html`)
- **Home** - Returns to landing page
- **Analytics** - Navigates to analytics dashboard
- **About Us** - Returns to landing page about section
- **Contact** - Returns to landing page contact section
- **Maps** - Navigates to maps page
- **Submit Report** - (Button) Submits the current form

#### 🗺️ **Maps Page** (`maps.html`)
- **Home** - Returns to landing page
- **Analytics** - Navigates to analytics dashboard
- **About Us** - Returns to landing page about section
- **Contact** - Returns to landing page contact section
- **Maps** - Current page (highlighted)
- **Report Road Damage** - (Button) Navigates to report page

#### 👤 **Admin Page** (`adminPage.html`)
- **Dashboard** - Current page (highlighted)
- **Users** - User management (placeholder)
- **Logout** - Returns to landing page

## 🚀 Running the Project

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Access the application:**
   - Open http://127.0.0.1:3000 in your browser
   - You'll be automatically redirected to the landing page

3. **Navigate between pages:**
   - Use the navigation menu at the top of each page
   - Click the logo to return to the landing page
   - All links are interconnected for seamless navigation

## Running the Application Locally

1. **Start the development server:**
   ```bash
   npm start
   ```
   This will start the server at http://127.0.0.1:8080

2. **Access the application:**
   - **Landing Page**: http://127.0.0.1:8080/pages/landingPage.html
   - **Report Issues**: http://127.0.0.1:8080/pages/reportPage.html  
   - **Admin Dashboard**: http://127.0.0.1:8080/pages/adminPage.html

## Current Status

✅ **Working Features:**
- Responsive UI/UX design
- File upload with drag & drop
- Form validation
- Loading states and notifications
- Demo mode with sample data

⚠️ **Demo Mode Active:**
The application is currently running in demo mode because Supabase is not configured. Reports will be simulated and data is not persistent.

## To Enable Full Database Functionality

1. Follow the setup guide in `SUPABASE_SETUP.md`
2. Update the credentials in `jscript/supabaseClient.js`:
   ```javascript
   const SUPABASE_URL = 'your-actual-supabase-url';
   const SUPABASE_ANON_KEY = 'your-actual-supabase-anon-key';
   ```

## Troubleshooting

- **"System not initialized" error**: Refresh the page and try again
- **Console errors**: Check if all script files are loading properly
- **Database errors**: Verify Supabase configuration

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript must be enabled
- Local storage access required

---

*For detailed setup instructions, see `SUPABASE_SETUP.md`*
