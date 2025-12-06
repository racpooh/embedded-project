# Household Fire Detection System - Web Dashboard

React-based real-time dashboard for monitoring the Household Fire Detection System.

## Features

- Real-time sensor data visualization
- Live Firestore updates using Firebase SDK
- Color-coded risk states (NORMAL/WARNING/DANGER)
- AI-detected fire images display
- Mobile-friendly responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in this directory (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Fill in your Firebase configuration in `.env`:
   - **See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions on finding these keys**
   - Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Settings ⚙️ → Project settings → Your apps → Web app
   - Copy the config values to your `.env` file:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to Firebase Hosting, Vercel, or any static hosting service.

## Project Structure

```
web/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx      # Main dashboard component
│   │   └── Dashboard.css      # Dashboard styles
│   ├── lib/
│   │   └── firebase.ts        # Firebase initialization and utilities
│   ├── App.tsx                # Root component
│   ├── App.css                # App styles
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── index.html                 # HTML template
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
└── .env.example               # Environment variables template
```

## Firebase Integration

The dashboard:
- Signs in anonymously to Firebase Auth
- Subscribes to `sensor_logs` collection for real-time sensor data
- Subscribes to `events` collection for fire events
- Displays AI-detected fire images from Google Cloud Storage

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Firebase SDK** - Real-time database and authentication

