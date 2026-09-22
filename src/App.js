import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { LanguageProvider } from '@/lib/LanguageContext';
import { LocationProvider } from '@/components/LocationContext';
import { AuthProvider } from '@/lib/AuthContext';
import Layout from '@/components/Layout';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

import HomePage from '@/components/pages/HomePage';
import AddService from '@/components/pages/AddService';
import CategoryPage from '@/components/pages/CategoryPage';
import CommunityPage from '@/components/pages/CommunityPage';
import LanguageSettingsPage from '@/components/pages/LanguageSettingsPage';
import SearchResultsPage from '@/components/pages/SearchResultsPage';
import ServiceDetailPage from '@/components/pages/ServiceDetailPage';
import SettingsPage from '@/components/pages/SettingsPage';
import UserProfilePage from '@/components/pages/UserProfilePage';
import MyProfilePage from '@/components/pages/MyProfilePage';
import AdminDashboard from '@/components/pages/AdminDashboard';

function App() {
  return (
    <LanguageProvider>
      <LocationProvider>
        <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/AddServicePage" element={<AddService />} />
              <Route path="/CategoryPage" element={<CategoryPage />} />
              <Route path="/CommunityPage" element={<CommunityPage />} />
              <Route path="/LanguageSettingsPage" element={<LanguageSettingsPage />} />
              <Route path="/SearchResultsPage" element={<SearchResultsPage />} />
              <Route path="/ServiceDetailPage" element={<ServiceDetailPage />} />
              <Route path="/SettingsPage" element={<SettingsPage />} />
              <Route path="/UserProfilePage" element={<UserProfilePage />} />
              <Route path="/MyProfilePage" element={<MyProfilePage />} />
              <Route path="/AdminDashboard" element={<AdminDashboard />} />
            </Routes>
          </Layout>
        </Router>
        </AuthProvider>
      </LocationProvider>
      <SpeedInsights />
      <Analytics />
    </LanguageProvider>
  );
}

export default App;