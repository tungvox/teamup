import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { OnboardingLanding, CreateProfile, SetLocation, RegistrationSuccess, Login, AuthSelection } from './pages/Onboarding';
import { Home, MyGames, Messages, Profile } from './pages/Dashboard';
import { EventDetails, CreateEvent, EditEvent, OrganizerDashboard, EventCreated } from './pages/EventFlow';
import { ChatDetail, NotificationSettings, RatePlayers } from './pages/Interaction';
import { BottomNav } from './components/Layout';

const AppContent: React.FC = () => {
  const location = useLocation();
  // Routes where the bottom navigation should appear
  const showBottomNav = ['/home', '/my-games', '/messages', '/profile'].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background shadow-2xl relative overflow-hidden">
      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <Routes>
          {/* Onboarding Flow */}
          <Route path="/" element={<OnboardingLanding />} />
          <Route path="/auth" element={<AuthSelection />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-profile" element={<CreateProfile />} />
          <Route path="/set-location" element={<SetLocation />} />
          <Route path="/success" element={<RegistrationSuccess />} />

          {/* Main Tabs */}
          <Route path="/home" element={<Home />} />
          <Route path="/my-games" element={<MyGames />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />

          {/* Event Flows */}
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/event/create" element={<CreateEvent />} />
          <Route path="/event/edit/:id" element={<EditEvent />} />
          <Route path="/event/manage/:id" element={<OrganizerDashboard />} />
          <Route path="/event/created" element={<EventCreated />} />

          {/* Interaction Flows */}
          <Route path="/chat/:id" element={<ChatDetail />} />
          <Route path="/settings/notifications" element={<NotificationSettings />} />
          <Route path="/rate-players/:id" element={<RatePlayers />} />
        </Routes>
      </main>
      
      {showBottomNav && <BottomNav />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;