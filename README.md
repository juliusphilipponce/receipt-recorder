<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# receipt-recorder

A Receipt Scanner AI web application that allows users to upload receipt images and automatically extract key information using Google Gemini AI and Supabase.

View your app in AI Studio: https://ai.studio/apps/drive/1tiBJTsXY2wSbokqsAsSxFyIDZGnQhSHS

## ✨ Features

- 📷 Upload or capture receipt images
- 🤖 AI-powered receipt analysis using Google Gemini
- 💾 Automatic storage in Supabase database
- 🔍 View and search all your receipts
- 📱 Progressive Web App (PWA) support
- 🔒 Secure environment variable management

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- A [Gemini API key](https://aistudio.google.com/app/apikey)
- A [Supabase account](https://supabase.com/) with a project set up

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd receipt-scanner-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your credentials:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`

## 🔐 Security & Authentication

This project follows security best practices:

- ✅ **Authentication Required** - Only authorized users can access the app
- ✅ **Single User Access** - Configured for personal use with one Gmail account
- ✅ **No hardcoded credentials** - All API keys are stored in environment variables
- ✅ **Git protection** - `.env` files are excluded from version control
- ✅ **Build-time injection** - Environment variables are injected during build
- ✅ **Security headers** - Netlify configuration includes security headers
- ✅ **Row Level Security** - Database access controlled by Supabase RLS policies

**Important:** Never commit `.env` or `.env.local` files to Git!

### Setting Up Authentication

See [docs/AUTHENTICATION_SETUP.md](docs/AUTHENTICATION_SETUP.md) for detailed instructions on:
- Creating your user account in Supabase
- Configuring Row Level Security policies
- Testing your authentication setup

## 📦 Deployment

For detailed deployment instructions to Netlify, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Deploy to Netlify

1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy!

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **AI**: Google Gemini 2.5 Flash
- **Database**: Supabase (PostgreSQL)
- **Build Tool**: Vite
- **Deployment**: Netlify

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Yes |
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## 🤝 Contributing

Contributions are welcome! Please ensure you:

1. Never commit sensitive credentials
2. Follow the existing code style
3. Test your changes locally before submitting

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check [DEPLOYMENT.md](DEPLOYMENT.md) for troubleshooting tips
2. Verify your environment variables are set correctly
3. Check the browser console for error messages
4. Ensure your Supabase RLS policies are configured correctly
