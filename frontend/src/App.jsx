import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ComparisonPage from './pages/ComparisonPage';
import DemoPage from './pages/DemoPage';
import LogsPage from './pages/LogsPage';
import TechPage from './pages/TechPage';
import NeuralPage from './pages/NeuralPage';
import ArchitecturePage from './pages/ArchitecturePage';
import GalleryPage from './pages/GalleryPage';
import ApplicationsPage from './pages/ApplicationsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
          <Route path="/neural" element={<NeuralPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/tech" element={<TechPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
