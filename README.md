# Schrödinger's Bug - Frontend

Frontend application for the DRL (Deep Reinforcement Learning) Robot project, providing a modern React-based dashboard for robot monitoring, control, and analytics.

## Overview

This frontend serves as the user interface for the robotics system, featuring real-time telemetry visualization, training metrics, simulation replay, and comprehensive analytics dashboards.

## Features

- Real-time robot telemetry via WebSocket
- Interactive dashboard with live metrics
- Training progress visualization
- Simulation replay functionality
- Analytics and performance charts
- Neural network architecture visualization
- System logs monitoring
- Responsive design with Tailwind CSS

## Technology Stack

- React 19
- Vite - Build tool
- React Router - Navigation
- Recharts - Data visualization
- Framer Motion - Animations
- Tailwind CSS - Styling
- Lucide React - Icons
- Axios - HTTP client
- WebSocket - Real-time communication

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running (FastAPI)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/DSAI-Society-IIIT-Dharwad/Schrodinger-s-Bug.git
cd Schrodinger-s-Bug/frontend
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Development Mode

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Linting

Run ESLint:
```bash
npm run lint
```

## Project Structure

```
frontend/
├── public/                 # Static assets
│   ├── baseline.png
│   ├── favicon.svg
│   ├── icons.svg
│   └── optimized.png
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── AnalyticsPanel.jsx
│   │   ├── ControlPanel.jsx
│   │   ├── HeroSection.jsx
│   │   ├── Layout.jsx
│   │   ├── LogsPanel.jsx
│   │   ├── RadarView.jsx
│   │   ├── Sections.jsx
│   │   └── SimulationReplay.jsx
│   ├── pages/             # Page components
│   │   ├── AnalyticsPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── DemoPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── LogsPage.jsx
│   │   ├── NeuralPage.jsx
│   │   └── TechPage.jsx
│   ├── hooks/             # Custom React hooks
│   │   └── useWebSocket.js
│   ├── assets/            # Images and static files
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   ├── index.css          # Global styles
│   ├── App.css            # App-specific styles
│   ├── utils.js           # Utility functions
│   └── simulationEngine.js # Simulation logic
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies
└── eslint.config.js       # ESLint configuration
```

## Pages

- **Home**: Landing page with project overview
- **Dashboard**: Real-time robot monitoring and control
- **Analytics**: Training metrics and performance charts
- **Demo**: Interactive simulation and trajectory visualization
- **Neural**: Neural network architecture visualization
- **Logs**: System logs and debugging information
- **Tech**: Technical documentation and architecture

## Components

### Key Components

- **ControlPanel**: Robot control interface
- **RadarView**: LiDAR visualization
- **AnalyticsPanel**: Training metrics display
- **SimulationReplay**: Trajectory playback
- **LogsPanel**: Real-time log streaming

### WebSocket Integration

The app uses a custom `useWebSocket` hook for real-time data:

```javascript
import { useWebSocket } from './hooks/useWebSocket';

function Dashboard() {
  const { data, connected } = useWebSocket('ws://localhost:8000/ws');
  
  return (
    <div>
      <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
      <p>Reward: {data?.reward}</p>
      <p>Progress: {data?.progress}%</p>
    </div>
  );
}
```

## Configuration

### Backend Connection

Update the WebSocket URL in your components to match your backend server:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
```

### Environment Variables

Create a `.env` file for environment-specific configuration:

```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

## Development

### Adding New Pages

1. Create a new page component in `src/pages/`
2. Add route in `App.jsx`
3. Update navigation in `Layout.jsx`

### Adding New Components

1. Create component in `src/components/`
2. Export from component file
3. Import where needed

### Styling

The project uses Tailwind CSS for styling. Customize in:
- `tailwind.config.js` (if created)
- Component-level className attributes
- `src/index.css` for global styles

## Testing

Run tests (when configured):
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- DSAI Society, IIIT Dharwad
- React Team
- Vite Team
- Tailwind CSS Team
