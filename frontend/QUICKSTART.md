# Quick Start Guide

Get the Health Management System frontend up and running in minutes!

## Prerequisites

- Node.js 18 or higher
- pnpm package manager
- FastAPI backend running (optional for initial setup)

## Installation Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and set your API URL
# VITE_API_URL=http://localhost:8000/api
```

### 3. Start Development Server

```bash
pnpm dev
```

The application will open at `http://localhost:5173`

## First Login

Use these demo credentials:
- **Username:** `admin`
- **Password:** `admin123`

> Note: These credentials work with mock authentication. Update the login logic in `AuthContext.jsx` to connect to your real backend.

## Quick Tour

After logging in, you'll see:

1. **Home** (`/home`) - Quick access dashboard with cards
2. **Dashboard** (`/dashboard`) - Main dashboard with charts and statistics
3. **Records** (`/records`) - Manage health records (CRUD operations)
4. **Analytics** (`/analytics`) - Detailed analytics and reports
5. **Users** (`/admin/users`) - User management (admin only)
6. **Profile** (`/profile`) - View and edit your profile
7. **Settings** (`/settings`) - Application settings

## Theme Toggle

Click the sun/moon icon in the header to switch between light and dark themes.

## Production Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

The production files will be in the `/dist` directory.

## Connecting to Your Backend

### Update API Configuration

Edit `/src/app/services/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
```

### Expected API Endpoints

Your FastAPI backend should implement these endpoints:

#### Authentication
```
POST /api/auth/login
  Body: { username: string, password: string }
  Returns: { access_token: string, user: object }

GET /api/auth/me
  Headers: Authorization: Bearer <token>
  Returns: { user: object }
```

#### Users (Admin)
```
GET /api/users
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
```

#### Records
```
GET /api/records
POST /api/records
PUT /api/records/:id
DELETE /api/records/:id
```

#### Analytics
```
GET /api/analytics/dashboard
GET /api/analytics/activity
```

## Common Issues

### Port Already in Use

If port 5173 is busy:
```bash
# Vite will automatically try the next available port
# Or specify a port:
pnpm dev --port 3000
```

### API Connection Errors

1. Check that your backend is running
2. Verify the API URL in `.env`
3. Check browser console for CORS errors
4. Ensure backend allows requests from `http://localhost:5173`

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## File Structure

```
src/app/
├── pages/          # Page components
├── components/     # Reusable components
├── contexts/       # React contexts (Auth, Theme)
├── services/       # API services
├── layouts/        # Layout components
├── hooks/          # Custom hooks
└── routes.jsx      # Route configuration
```

## Key Features

✅ Modern glassmorphism UI design
✅ Dark/light theme support
✅ Fully responsive (mobile, tablet, desktop)
✅ JWT authentication ready
✅ Interactive charts (Recharts)
✅ CRUD operations for records and users
✅ Toast notifications (Sonner)
✅ Accessible components (Radix UI)

## Next Steps

1. **Customize Branding** - Update logo, colors, and text
2. **Connect Backend** - Implement real API endpoints
3. **Add Features** - Extend with new pages and functionality
4. **Deploy** - Build and deploy to your hosting platform

## Development Tips

### Hot Module Replacement (HMR)

Vite provides instant updates when you save files. No need to refresh!

### Component Development

- Use existing UI components from `/src/app/components/ui/`
- Follow the pattern in existing pages
- Use `GlassCard` for consistent styling

### State Management

- Use `useAuth()` hook for user/auth state
- Use `useTheme()` hook for theme state
- Local state with `useState` for component state

### Styling

- Tailwind CSS utilities for most styling
- Use theme variables for colors
- Follow mobile-first responsive design

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React Router](https://reactrouter.com)
- [Recharts](https://recharts.org)

## Support

For issues or questions:
1. Check `README.md` for detailed documentation
2. Review `PROJECT_STRUCTURE.md` for architecture
3. Examine existing code for patterns and examples

Happy coding! 🚀
