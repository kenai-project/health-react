# Health Management System - Frontend

A modern, responsive React frontend for the Health Management System with glassmorphism UI and dark/light theme support.

## Features

- 🎨 Modern glassmorphism UI design
- 🌓 Dark/light theme support
- 📱 Fully responsive design
- 🔐 JWT authentication flow
- 📊 Interactive charts and analytics
- 👥 User management
- 📋 Health records management
- ⚙️ Comprehensive settings
- 🎯 Dashboard with statistics

## Technology Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **React Router** - Navigation
- **Recharts** - Charts and graphs
- **Lucide React** - Icons
- **Radix UI** - Accessible components
- **Sonner** - Toast notifications

## Prerequisites

- Node.js 18+ and pnpm
- FastAPI backend running (default: http://localhost:8000)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Update `VITE_API_URL` in `.env` to match your FastAPI backend URL

4. Start development server:
   ```bash
   pnpm dev
   ```

5. Build for production:
   ```bash
   pnpm build
   ```

## Project Structure

```
src/app/
├── components/          # Reusable components
│   ├── ui/             # UI component library
│   ├── GlassCard.jsx   # Glassmorphism card component
│   ├── StatCard.jsx    # Statistics card component
│   ├── Sidebar.jsx     # Navigation sidebar
│   ├── Header.jsx      # Application header
│   └── ProtectedRoute.jsx  # Route protection
├── contexts/           # React contexts
│   ├── AuthContext.jsx # Authentication state
│   └── ThemeContext.jsx # Theme state
├── layouts/            # Page layouts
│   ├── MainLayout.jsx  # Main app layout
│   └── AuthLayout.jsx  # Authentication layout
├── pages/              # Page components
│   ├── LoginPage.jsx
│   ├── HomePage.jsx
│   ├── DashboardPage.jsx
│   ├── RecordsPage.jsx
│   ├── UserManagementPage.jsx
│   ├── ProfilePage.jsx
│   ├── AnalyticsPage.jsx
│   ├── SettingsPage.jsx
│   ├── StaffRecordsPage.jsx
│   └── NotFoundPage.jsx
├── services/           # API services
│   └── api.js         # API client and services
├── hooks/              # Custom hooks
│   └── useApi.js      # API hook
├── routes.jsx         # Route configuration
└── App.jsx            # App entry point
```

## Routes

- `/login` - Login page
- `/home` - Home dashboard
- `/dashboard` - Main dashboard with statistics
- `/records` - Health records management
- `/analytics` - Analytics and reports
- `/admin/users` - User management (admin)
- `/staff/records` - Staff records view
- `/profile` - User profile
- `/settings` - Application settings

## API Integration

The frontend is designed to work with a FastAPI backend. Update the API endpoints in `/src/app/services/api.js` to match your backend routes.

### Expected API Endpoints

- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/records` - Get all records
- `POST /api/records` - Create record
- `PUT /api/records/:id` - Update record
- `DELETE /api/records/:id` - Delete record
- `GET /api/analytics/dashboard` - Get dashboard stats
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

## Authentication

The app uses JWT token authentication:
1. Login credentials are sent to `/api/auth/login`
2. JWT token is stored in localStorage
3. Token is included in all subsequent API requests
4. Protected routes check for valid token

### Demo Credentials
- Username: `admin`
- Password: `admin123`

## Theme Support

Toggle between light and dark themes using:
- Theme toggle button in header
- Settings page
- Automatically saved to localStorage

## Development

### Adding New Pages

1. Create page component in `/src/app/pages/`
2. Add route in `/src/app/routes.jsx`
3. Add navigation link in `/src/app/components/Sidebar.jsx`

### Adding New API Services

Add service functions in `/src/app/services/api.js` following the existing pattern.

### Styling

The app uses:
- Tailwind CSS v4 for utility classes
- CSS custom properties for theming
- Glassmorphism effects via backdrop-blur

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT License - feel free to use this project for your applications.
