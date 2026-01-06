<div align="center">
  <img src="assets/cover.png" alt="말랑말랑 리트코드" width="600" />
</div>

# 🧠 BigBrain LeetCode Tracker

A modern, collaborative LeetCode challenge tracking system built with Supabase, Vite, and Vercel.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 👤 **User Registration** - Simple registration with access code
- ✅ **Daily Check-ins** - Track daily LeetCode problem solving
- 📊 **Personal Statistics** - View your progress and history  
- ✏️ **Edit Problem Names** - Update problem names after submission
- 🔒 **Password Protection** - Secure access to personal data
- 👨‍💼 **Admin Dashboard** - Manage users and view statistics
- 📈 **Weekly Reports** - Automated weekly performance reports

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Supabase account
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/yoonichoi/bigbrain-tracker.git
cd bigbrain-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_REGISTER_CODE=your-registration-code
VITE_ADMIN_PASSWORD=your-admin-password
```

**⚠️ Never commit `.env` files to version control!**

## 📊 Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_weekly_reports.sql`

## 🌐 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

For detailed instructions, contact the repository maintainer.

## 🛠️ Tech Stack

- **Frontend**: Vite, Vanilla JavaScript, CSS3
- **Backend**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Cron Jobs**: Vercel Cron (weekly reports)

## 📝 Usage

### For Users

1. **Register**: Use the registration code to create an account
2. **Daily Check-in**: Submit your daily LeetCode problem
3. **View History**: Check your progress and statistics
4. **Edit Records**: Update problem names as needed

### For Admins

1. Access admin dashboard via the ⚙️ icon
2. View all users and statistics
3. Check weekly reports
4. Manage user accounts

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Yooni Choi**
- GitHub: [@yoonichoi](https://github.com/yoonichoi)

## 🙏 Acknowledgments

Built with ❤️ for LeetCode enthusiasts and study groups.

---

⭐️ Star this repo if you find it helpful!
