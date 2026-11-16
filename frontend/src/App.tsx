import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvestigatePage } from './pages/InvestigatePage';
import { AssetsPage } from './pages/AssetsPage';
import { ThreatGraphPage } from './pages/ThreatGraphPage';
import { VulnerabilitiesPage } from './pages/VulnerabilitiesPage';
import { GlobalEventsPage } from './pages/GlobalEventsPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { ReportsPage } from './pages/ReportsPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { SettingsPage } from './pages/SettingsPage';
import { WebScannerPage } from './pages/WebScannerPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { AdminAuditPage } from './pages/AdminAuditPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/investigate" element={<InvestigatePage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/threat-graph" element={<ThreatGraphPage />} />
          <Route path="/vulnerabilities" element={<VulnerabilitiesPage />} />
          <Route path="/scanner" element={<WebScannerPage />} />
          <Route path="/events" element={<GlobalEventsPage />} />
          <Route path="/intelligence" element={<IntelligencePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/datasources" element={<DataSourcesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/admin" element={<AdminAuditPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

