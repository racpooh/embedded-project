# Project Structure Documentation

## Overview

The project has been completely restructured with a clean, professional architecture following React best practices.

## Web Dashboard Structure

```
web/
├── public/
│   └── dashboard-template.html    # HTML reference template
├── src/
│   ├── components/
│   │   ├── layout/               # Layout components
│   │   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   │   └── MainLayout.tsx    # Main layout wrapper
│   │   ├── dashboard/            # Dashboard components
│   │   │   ├── StatCard.tsx      # Statistic cards
│   │   │   ├── ChartCard.tsx     # Chart components
│   │   │   ├── SensorNodesTable.tsx  # Sensor status table
│   │   │   └── EventsList.tsx    # Events list
│   │   └── common/               # Shared components
│   │       └── RiskBadge.tsx     # Risk level badge
│   ├── pages/
│   │   └── Dashboard.tsx         # Main dashboard page
│   ├── hooks/
│   │   └── useFirebaseData.ts    # Firebase data hook
│   ├── lib/
│   │   └── firebase.ts           # Firebase configuration
│   ├── styles/
│   │   └── dashboard.css         # Main dashboard styles
│   ├── utils/
│   │   ├── mockData.ts           # Mock data generation
│   │   └── quickUpload.ts        # Quick upload utility
│   ├── App.tsx                   # Root application component
│   ├── App.css                   # Application styles
│   ├── main.tsx                  # Application entry point
│   └── index.css                 # Global styles
├── index.html                    # HTML template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite configuration
└── .env                          # Environment variables
```

## Component Hierarchy

### Layout Components

**Sidebar** (`components/layout/Sidebar.tsx`)
- Fixed left sidebar
- Navigation menu
- Active state management
- Professional black theme

**MainLayout** (`components/layout/MainLayout.tsx`)
- Wraps Sidebar
- Provides consistent layout
- Handles responsive behavior

### Dashboard Components

**StatCard** (`components/dashboard/StatCard.tsx`)
- Displays sensor statistics
- Icon, value, and change indicator
- Reusable for different metrics

**ChartCard** (`components/dashboard/ChartCard.tsx`)
- Chart.js integration
- Line chart visualization
- Multiple dataset support
- Responsive container

**SensorNodesTable** (`components/dashboard/SensorNodesTable.tsx`)
- Table of active sensor nodes
- Status indicators
- Last update timestamps
- Current readings

**EventsList** (`components/dashboard/EventsList.tsx`)
- Timeline of events
- WARNING/DANGER alerts
- Scrollable container
- Real-time updates

### Common Components

**RiskBadge** (`components/common/RiskBadge.tsx`)
- Color-coded risk levels
- NORMAL, WARNING, DANGER states
- Reusable badge component

## Pages

**Dashboard** (`pages/Dashboard.tsx`)
- Main dashboard view
- Composes all dashboard components
- Fetches and manages data
- Layout structure

## Hooks

**useFirebaseData** (`hooks/useFirebaseData.ts`)
- Subscribes to Firestore
- Real-time data updates
- Mock data fallback
- Loading states

## Styling Architecture

**Global Styles** (`index.css`)
- Imports dashboard.css
- Basic resets
- Loading/error containers

**Dashboard Styles** (`styles/dashboard.css`)
- Professional black/white theme
- Sidebar styling
- Card components
- Responsive breakpoints
- CSS variables for theming

**App Styles** (`App.css`)
- Chart.js fixes
- Bootstrap overrides
- Form controls

## Data Flow

```
Firebase Firestore
        ↓
useFirebaseData hook
        ↓
Dashboard page (state)
        ↓
Child components (props)
        ↓
User interface
```

## Key Features

### Professional Design
- Black sidebar with white cards
- Clean typography
- Subtle shadows and transitions
- No emojis - Bootstrap Icons only

### Responsive Layout
- Mobile-first approach
- Bootstrap 5 grid system
- Breakpoints at 768px and 992px
- Collapsible sidebar on mobile

### Real-time Data
- Firebase Firestore integration
- onSnapshot real-time updates
- Automatic reconnection
- Mock data fallback

### Performance
- Lazy loading where possible
- Optimized chart rendering
- Efficient re-renders
- Minimal bundle size

## Development Workflow

### Running the App

npm run dev

### Building for Production
```bash
npm run build
npm run preview
```

### Linting
```bash
npm run lint
```

## Firebase Integration

### Collections Used
- `sensor_logs` - Sensor readings
- `events` - System events and alerts

### Data Structure
See `utils/mockData.ts` for the SensorLog interface and data schema.

### Authentication
- Anonymous sign-in
- Configured in `lib/firebase.ts`

## Adding New Components

1. Create component in appropriate folder
2. Follow TypeScript interfaces
3. Use existing styles from dashboard.css
4. Import and use in pages

## Adding New Pages

1. Create page in `pages/` folder
2. Import MainLayout
3. Compose with dashboard components
4. Add routing if needed

## Styling Guidelines

### Use CSS Variables
```css
var(--primary-bg)
var(--text-primary)
var(--border-color)
```

### Follow BEM-like Naming
```css
.stat-card
.stat-card-header
.stat-card-icon
```

### Responsive Utilities
Use Bootstrap 5 utility classes where appropriate:
- `d-flex`, `justify-content-between`
- `mb-3`, `mt-4`, `p-2`
- `col-12`, `col-md-6`, `col-lg-3`

## Dependencies

### Core
- React 18
- TypeScript 5
- Vite 5

### UI
- Bootstrap 5 (CDN)
- Bootstrap Icons (CDN)
- Chart.js + react-chartjs-2

### Firebase
- Firebase SDK 10
- Firestore

## Environment Variables

Required in `.env`:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Best Practices

1. **Component Organization**: Keep components small and focused
2. **TypeScript**: Always define interfaces for props
3. **Styling**: Use dashboard.css variables for consistency
4. **Data Fetching**: Use custom hooks for data management
5. **Error Handling**: Always handle loading and error states

## Future Improvements

- Add routing (React Router)
- Implement authentication pages
- Add settings page
- Create analytics views
- Add data export functionality
- Implement real-time notifications

## Troubleshooting

### Charts Not Rendering
- Check Chart.js imports
- Verify data format
- Check container height in CSS

### Styles Not Applying
- Verify import order in index.css
- Check Bootstrap CDN links
- Clear browser cache

### Firebase Connection Issues
- Verify .env configuration
- Check Firebase console
- Review security rules

## References

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Bootstrap 5 Docs](https://getbootstrap.com/docs/5.3/)
- [Chart.js Docs](https://www.chartjs.org/)
- [Firebase Docs](https://firebase.google.com/docs)

