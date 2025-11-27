# Clinic OS Frontend

React + TypeScript frontend for Clinic OS Queue Management System.

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand + React Query
- **Routing**: React Router
- **Real-time**: Server-Sent Events (SSE)
- **HTTP Client**: Axios

## Setup

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:3000/api/v1
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

## Features

### Pages

1. **Login** (`/login`)
   - Authentication page
   - Role-based routing after login

2. **Reception Dashboard** (`/reception`)
   - View all queues (doctor/department level)
   - Real-time queue updates via SSE
   - Quick stats (total in queue, in progress, average wait)
   - Mobile-responsive design

3. **Doctor Screen** (`/doctor/:doctorId`)
   - View own queue
   - Call next patient
   - Complete/Skip current patient
   - Real-time updates

4. **Waiting Room** (`/waiting-room/:departmentId`)
   - Public display (no authentication required)
   - Shows current token being served
   - Queue status for all waiting patients
   - Mobile-friendly design

## Project Structure

```
src/
├── components/
│   └── ui/          # shadcn/ui components
├── pages/           # Page components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and API client
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## API Integration

The frontend uses Axios for API calls with automatic token injection. All API endpoints are defined in `src/lib/api.ts`.

## Real-time Updates

Server-Sent Events (SSE) are used for real-time queue updates. The `useSSE` hook handles SSE connections and data updates.

## Mobile Responsive

All pages are designed to be mobile-friendly with responsive layouts using Tailwind CSS.

## Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

## License

ISC

