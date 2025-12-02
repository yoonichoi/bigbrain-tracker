# 🧠 Big Brain LeetCode Challenge Tracker

<div align="center">

**[🇰🇷 한국어](README.md) | [🇺🇸 English](README_EN.md)**

</div>

> ⚠️ **Language Note**: This project was originally developed for Korean users, so you may find Korean text in the codebase (UI labels, comments, variable names, etc.). Feel free to customize these strings for your language!


<p align="center"><sub><i>Inspired by the Nintendo game "Big Brain Academy" while developing with Cursor!</i></sub></p>
<p align="center">
  <img src="./screenshots/BigBrainEng.png" alt="Main Screenshot" width="600"/>
</p>

A **simple check-in system** for study groups doing daily LeetCode challenges.  
Built with Google Apps Script and Google Sheets, it's completely free to run with no server required.
With minor modifications, you can easily adapt it for any daily challenge tracking beyond LeetCode!

🌐 Live Demo: [[User Portal]](https://bigbrainlc.netlify.app/) [[Admin Dashboard]](https://bigbrainlc.netlify.app/admin.html)

<img src="./screenshots/register.png" alt="Main Screenshot" width="400"/>

---

## ✨ Key Features

### 👤 User Features
- **Secure Registration**: Access-code protected to keep your study group private 🔐
- **Easy Sign-up**: Just registration code + name + password
- **Daily Check-ins**: Log your daily progress with date and problem name
- **Real-time Stats**: View total check-ins and last check-in date
- **Check-in History**: View your recent 10 check-in records

<p align="center">
  <img src="./screenshots/checkin.png" alt="Main Screenshot" width="300"/>
  <img src="./screenshots/checkin2.png" alt="Main Screenshot" width="300"/>
  <img src="./screenshots/mystat.png" alt="Main Screenshot" width="300"/>
</p>

### 🔐 Admin Dashboard
- **Real-time Stats**: Total users, total/today check-ins, at-risk users
- **User Management**: View all users and delete functionality
- **Recent Activity**: View last 20 check-in records in real-time
- **Custom Reports**: Generate reports for any date range
- **Google Sheets Integration**: Direct access to raw data

![Admin Dashboard](./screenshots/admin-dashboard.png)
*Admin Dashboard*

### 📊 Automated Reports
- **Weekly Reports**: Auto-generated weekly (schedule configurable)
- **Dropout Tracking**: Auto-flag users missing 2+ days
- **Custom Period Reports**: 3/7/14/30 days or any custom range

![Report Example](./screenshots/report.png)
*Weekly Report Example*

## 🚀 Quick Start

<details>
<summary>📖 View Details</summary>

### 1️⃣ Google Sheets Setup

1. Create a new spreadsheet on [Google Sheets](https://sheets.google.com)
2. Click **Extensions** > **Apps Script**
3. Copy & paste the entire contents of `backend/Code.gs`
4. **⚠️ Important: Change the registration code on line 9!**
   ```javascript
   const REGISTER_CODE = 'YOUR_REGISTER_CODE_HERE';  // Change to your code!
   ```
5. **Save** then **Deploy** > **New deployment**
   - Type: **Web app**
   - Access: **Anyone**
6. Copy the deployment URL (e.g., `https://script.google.com/macros/s/ABC.../exec`)

### 2️⃣ Local Testing Setup (Optional)

To test locally, create a `config.js` file:

```bash
# From project root
cp config.example.js config.js
```

Then edit `config.js` with your actual values:
```javascript
const CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  REGISTER_CODE: 'your_registration_code',
  ADMIN_PASSWORD: 'your_secure_password',
  SHEET_URL: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit'
};
```

> 💡 **Note**: 
> - This is for local testing only (included in `.gitignore`)
> - For Netlify deployment, use environment variables instead

#### Backend Registration Code Setup
In Google Apps Script editor, set the `REGISTER_CODE` on line 9 of `backend/Code.gs`:
```javascript
// Line 9
const REGISTER_CODE = 'your_registration_code';
```

### 3️⃣ Deployment

#### Deploy with Netlify (Recommended ⭐)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Netlify**
   - Log in to [Netlify](https://netlify.com)
   - **Add new site** > **Import an existing project**
   - Select your GitHub repository

3. **Set Environment Variables** (Important! 🔐)
   
   In Netlify Dashboard:
   - Go to **Site settings** > **Environment variables**
   - Add these 4 variables:
   
   | Variable | Value |
   |----------|-------|
   | `SCRIPT_URL` | Your Google Apps Script deployment URL |
   | `REGISTER_CODE` | Your registration code |
   | `ADMIN_PASSWORD` | Your admin password |
   | `SHEET_URL` | Your Google Sheets URL |
   
   These environment variables will be converted to `config.js` at build time by `build.sh`.

4. **Trigger Deployment**
   - Go to **Deploys** tab > **Trigger deploy** > **Deploy site**
   - Wait for build to complete (~30 seconds)

5. **Done!**
   - Access at `https://your-site-name.netlify.app`
   - Environment variables are secure and never exposed to GitHub ✅
   - Admin page: `https://your-site-name.netlify.app/admin.html`

#### Deploy with GitHub Pages (Alternative)

<details>
<summary>Click to use GitHub Pages</summary>

1. Go to GitHub repository → **Settings** → **Pages**
2. **Source**: Select `main` branch and `/ (root)`
3. **Save**
4. Access at `https://YOUR_USERNAME.github.io/REPO_NAME/`

⚠️ **Warning**: You'll need to commit `config.js` to GitHub, exposing your passwords!

</details>

</details>



## 📁 Project Structure & Tech Stack

<details>
<summary>📖 View Details</summary>

### 📁 Project Structure

```
bigbrain-tracker/
├── backend/
│   └── Code.gs              # Google Apps Script (server logic)
├── frontend/                # Deployment directory (Netlify serves this)
│   ├── index.html           # User page
│   ├── admin.html           # Admin page
│   └── config.js            # Auto-generated at build (gitignored)
├── screenshots/             # Screenshots for README
├── config.example.js        # Config template (environment variable example)
├── build.sh                 # Netlify build script (generates frontend/config.js)
├── netlify.toml             # Netlify deployment settings
├── .gitignore               # Git ignore file
├── LICENSE                  # MIT License
├── CONTRIBUTING.md          # Contribution guide
└── README.md                # Project documentation
```

### File Structure Explanation

- **`frontend/`**: 
  - Directory containing source files
  - Netlify deploys this folder (`publish = "frontend"`)
  - `config.js` is auto-generated at build time
- **`build.sh`**: Generates `frontend/config.js` from environment variables during Netlify build
- **`netlify.toml`**: Netlify build configuration (uses environment variables)

## 🛠 Tech Stack

- **Backend**: Google Apps Script (JavaScript)
- **Database**: Google Sheets
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Hosting**: Netlify (recommended)

## 🌍 Timezone Independence

This system is designed to be **timezone-independent**:
- Each user selects dates in their local timezone
- Dates are stored as **strings** (MM/DD) to avoid timezone issues
- Works consistently across Korea/US/Europe anywhere in the world

</details>

## 📊 Google Sheets Data Structure

<details>
<summary>📖 View Details</summary>

After deployment, 3 sheets are automatically created:

### 1. User List (사용자목록)
| Username | Password | Registration Date |
|----------|----------|-------------------|
| John Doe | '1234 | 2024-12-02T... |

### 2. Check-in Records (인증기록)
| Timestamp | Date | Username | Problem |
|-----------|------|----------|---------|
| 2024-12-02T... | '12/02 | John Doe | 1. Two Sum |

### 3. Weekly Report (주간리포트) (Auto-generated)
| Username | Check-in Count | Check-in Dates | Missing | Status |
|----------|----------------|----------------|---------|--------|
| John Doe | 6 | 11/25, 11/26... | 1 | ✅ Pass |

## ⚙️ Advanced Settings

### Setup Automatic Weekly Reports

Run this function in Apps Script editor:
```javascript
setupWeeklyTrigger()  // Every Sunday 11:59 PM (PST)
```

### Generate Custom Period Reports

Run directly in Apps Script:
```javascript
generate3DayReport()    // Last 3 days
generate7DayReport()    // Last 7 days (default)
generate14DayReport()   // Last 14 days
generate30DayReport()   // Last 30 days
```

Or generate custom reports from the admin dashboard by selecting any date range

</details>

## 🔒 Security

<details>
<summary>📖 View Details</summary>

### Access Control
- **Registration Code**: Required to keep study group private 🔐
- **Dual Verification**: Registration code verified on both frontend and backend
- Passwords stored in plain text in Google Sheets (for personal study use)

### Sensitive Information Management (Netlify Environment Variables)

**When deploying to Netlify**:
- ✅ Sensitive info stored in **Netlify environment variables**
- ✅ Never committed to GitHub
- ✅ `build.sh` generates `config.js` only at build time
- ✅ Managed only from Netlify Dashboard

**What gets committed to GitHub**:
- `config.example.js` - Template only (no actual values)
- `build.sh` - Build script (uses environment variables)
- `netlify.toml` - Build config (variable names only)
- `Code.gs` - Placeholder only (`YOUR_REGISTER_CODE_HERE`)

**What doesn't get committed to GitHub**:
- `config.js` - For local testing only (in `.gitignore`)
- Actual registration codes, passwords, URLs - Only exist in Netlify environment variables

### Registration Code Management Tips
- Change registration code periodically (easy from Netlify Dashboard)
- Keep it private (share only with study group members)
- Change code when someone leaves the group

> 💡 **For Production Use**: Consider adding proper encryption and authentication systems

</details>

## 📝 Usage Scenarios

<details>
<summary>📖 View Details</summary>

### Study Group Leader
1. Deploy the system (5 minutes)
2. Set registration code (frontend + backend)
3. Share **URL + registration code** privately with members
4. Check auto-generated weekly reports
5. Track and encourage at-risk members

### Study Participant
1. Get registration code from leader
2. Sign up (registration code + name + password)
3. Check in daily after solving problems
4. View your stats
5. Stay consistent!

</details>

## 🤝 Contributing

Bug reports and feature requests welcome via Issues!

## 📄 License

MIT License - Use freely!

## 📞 Contact

For questions or inquiries, please leave an issue.

<div align="center">

**⭐ If this project helped you, please give it a star!**

---

### 👨‍💻 Created By

**Yooni Choi** ([@yoonichoi](https://github.com/yoonichoi))

Made with ❤️ for LeetCode enthusiasts

Copyright © 2025 Yooni Choi. All rights reserved.

</div>

