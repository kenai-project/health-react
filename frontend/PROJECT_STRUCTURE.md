# Health Management System - Complete Project Structure

## Frontend Folder Structure

```
/
├── .env.example                 # Environment variables template
├── README.md                    # Project documentation
├── PROJECT_STRUCTURE.md         # This file
├── package.json                 # Dependencies and scripts
├── vite.config.ts              # Vite configuration
├── postcss.config.mjs          # PostCSS configuration
│
├── src/
│   ├── styles/                 # Global styles
│   │   ├── fonts.css          # Font imports
│   │   ├── index.css          # Main stylesheet
│   │   ├── tailwind.css       # Tailwind directives
│   │   └── theme.css          # Theme variables (light/dark)
│   │
│   └── app/
│       ├── App.tsx            # TypeScript wrapper
│       ├── App.jsx            # Main application entry (JSX)
│       ├── routes.jsx         # Route configuration
│       │
│       ├── components/        # Reusable components
│       │   ├── ui/           # Design system components (Radix UI)
│       │   │   ├── accordion.tsx
│       │   │   ├── alert.tsx
│       │   │   ├── avatar.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── dropdown-menu.tsx
│       │   │   ├── input.tsx
│       │   │   ├── label.tsx
│       │   │   ├── select.tsx
│       │   │   ├── switch.tsx
│       │   │   ├── table.tsx
│       │   │   ├── tabs.tsx
│       │   │   ├── tooltip.tsx
│       │   │   └── ... (more UI components)
│       │   │
│       │   ├── GlassCard.jsx      # Glassmorphism card component
│       │   ├── StatCard.jsx       # Statistics display card
│       │   ├── Sidebar.jsx        # App navigation sidebar
│       │   ├── Header.jsx         # App header with user menu
│       │   └── ProtectedRoute.jsx # Authentication guard
│       │
│       ├── contexts/          # React contexts
│       │   ├── AuthContext.jsx    # Authentication state & methods
│       │   └── ThemeContext.jsx   # Theme state & toggle
│       │
│       ├── layouts/           # Page layouts
│       │   ├── MainLayout.jsx     # Main app layout (with sidebar)
│       │   └── AuthLayout.jsx     # Authentication pages layout
│       │
│       ├── pages/             # Page components
│       │   ├── LoginPage.jsx          # User login
│       │   ├── HomePage.jsx           # Home dashboard
│       │   ├── DashboardPage.jsx      # Main dashboard with charts
│       │   ├── RecordsPage.jsx        # Health records management
│       │   ├── UserManagementPage.jsx # User CRUD operations
│       │   ├── ProfilePage.jsx        # User profile & settings
│       │   ├── AnalyticsPage.jsx      # Analytics & reports
│       │   ├── SettingsPage.jsx       # App settings
│       │   ├── StaffRecordsPage.jsx   # Staff records view
│       │   └── NotFoundPage.jsx       # 404 error page
│       │
│       ├── services/          # API services
│       │   └── api.js        # API client & service functions
│       │
│       └── hooks/             # Custom React hooks
│           └── useApi.js     # API call hook with loading states
```

## Key Files Description

### Entry Points
- **App.tsx** - TypeScript entry wrapper
- **App.jsx** - Main React application with providers
- **routes.jsx** - React Router configuration

### Contexts
- **AuthContext.jsx** - Manages user authentication, login/logout, JWT tokens
- **ThemeContext.jsx** - Manages light/dark theme state

### Layouts
- **MainLayout.jsx** - Main app shell with sidebar and header
- **AuthLayout.jsx** - Simple layout for login page

### Core Components
- **GlassCard.jsx** - Reusable glassmorphism card
- **StatCard.jsx** - Statistics card with icon and trend
- **Sidebar.jsx** - App navigation with active states
- **Header.jsx** - Top bar with user menu and theme toggle
- **ProtectedRoute.jsx** - HOC for authenticated routes

### Pages
All pages are self-contained components with their own state management.

### Services
- **api.js** - Centralized API client with:
  - Authentication services
  - User management services
  - Records management services
  - Analytics services
  - Settings services

### Hooks
- **useApi.js** - Custom hook for API calls with loading/error states

## State Management

### Global State (Contexts)
- **Auth**: User data, authentication status, login/logout methods
- **Theme**: Current theme (light/dark), toggle method

### Local State
- Each page manages its own local state using React hooks
- Forms use controlled components
- Tables use local state for filtering/sorting

## Styling Architecture

### Tailwind CSS v4
- Utility-first CSS framework
- Custom theme configuration in `theme.css`
- Dark mode support with CSS variables

### Glassmorphism Design
- Backdrop blur effects
- Semi-transparent backgrounds
- Soft shadows and borders

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Collapsible sidebar on mobile

## Authentication Flow

1. User enters credentials on login page
2. Credentials sent to FastAPI `/api/auth/login`
3. JWT token received and stored in localStorage
4. User data stored in AuthContext and localStorage
5. All subsequent API calls include JWT token
6. Protected routes check authentication status
7. Logout clears localStorage and resets context

## API Integration

### Base Configuration
- Base URL: Configurable via `VITE_API_URL` environment variable
- Default: `http://localhost:8000/api`

### Request Flow
1. Service function called from component
2. `fetchAPI` wrapper adds auth headers
3. Response parsed and returned
4. Errors caught and formatted

### Expected Backend Routes

#### Authentication
- `POST /api/auth/login` - Login with username/password
- `GET /api/auth/me` - Get current user info

#### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Records
- `GET /api/records` - List all records
- `GET /api/records/:id` - Get record by ID
- `POST /api/records` - Create new record
- `PUT /api/records/:id` - Update record
- `DELETE /api/records/:id` - Delete record

#### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/activity` - Activity log
- `GET /api/analytics/charts/:type` - Chart data

#### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

## Routes Configuration

### Public Routes
- `/login` - Login page

### Protected Routes (require authentication)
- `/home` - Home dashboard
- `/dashboard` - Main dashboard
- `/records` - Records management
- `/analytics` - Analytics & reports
- `/admin/users` - User management
- `/staff/records` - Staff records
- `/profile` - User profile
- `/settings` - App settings

### Error Routes
- `*` - 404 Not Found page

## Component Library (UI)

The project uses a custom component library built on Radix UI primitives with Tailwind styling:

- **Accordion** - Collapsible content
- **Alert** - Alert messages
- **Avatar** - User avatars
- **Badge** - Status badges
- **Button** - Buttons with variants
- **Card** - Content cards
- **Dialog** - Modal dialogs
- **Dropdown Menu** - Dropdown menus
- **Input** - Text inputs
- **Label** - Form labels
- **Select** - Dropdown selects
- **Switch** - Toggle switches
- **Table** - Data tables
- **Tabs** - Tabbed interfaces
- **Tooltip** - Tooltips

All components support dark mode and are fully accessible.

## Development Workflow

### Adding a New Page
1. Create component in `/src/app/pages/`
2. Add route in `/src/app/routes.jsx`
3. Add navigation link in `/src/app/components/Sidebar.jsx`
4. Create API service if needed in `/src/app/services/api.js`

### Adding a New Component
1. Create component in `/src/app/components/`
2. Follow existing patterns (props, styling)
3. Export as default or named export
4. Import where needed

### Adding a New API Service
1. Add service object in `/src/app/services/api.js`
2. Use `fetchAPI` wrapper for requests
3. Export service object
4. Import in pages/components

## Build & Deployment

### Development
```bash
pnpm dev
```
- Starts Vite dev server
- Hot module replacement
- Port: 5173 (default)

### Production Build
```bash
pnpm build
```
- Creates optimized production build
- Output: `/dist` directory
- Minified and optimized

### Preview Production Build
```bash
pnpm preview
```
- Serves production build locally
- Test before deployment

## Environment Variables

Create `.env` file from `.env.example`:

```env
VITE_API_URL=http://localhost:8000/api
```

Change the URL to match your FastAPI backend.

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern mobile browsers

## Performance Optimizations

- Code splitting via React Router
- Lazy loading of routes (can be added)
- Optimized Tailwind CSS (purged in production)
- Vite's fast HMR and optimized builds
- Component memoization where needed

## Accessibility

- Semantic HTML
- ARIA attributes via Radix UI
- Keyboard navigation
- Focus management
- Screen reader support

## Future Enhancements

Potential improvements:
- React Query for data fetching
- Lazy loading routes
- Progressive Web App (PWA)
- Real-time updates via WebSockets
- Advanced data filtering
- Export to PDF/Excel
- Multi-language support (i18n)
- Advanced role-based access control
