import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { OnboardingLanding, CreateProfile, SetLocation, RegistrationSuccess, Login, AuthSelection } from './pages/Onboarding';
import { Home, MyEvents, Messages, Profile } from './pages/Dashboard';
import { EventDetails, CreateEvent, EditEvent, OrganizerDashboard, EventCreated } from './pages/EventFlow';
import { ChatDetail, NotificationSettings, RatePlayers } from './pages/Interaction';
import { BottomNav } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import { MessageProvider } from './context/MessageContext';
import { SettingsProvider } from './context/SettingsContext';
import { clerkPubKey } from './lib/clerk';

const AppContent: React.FC = () => {
  const location = useLocation();
  // Routes where the bottom navigation should appear
  const showBottomNav = ['/home', '/my-games', '/messages', '/profile'].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen w-full bg-background relative overflow-hidden">
      {/* Sidebar Navigation - shows on left on desktop */}
      {showBottomNav && (
        <div className="hidden lg:block lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:z-40">
          <BottomNav />
        </div>
      )}
      
      {/* Responsive container - mobile first, then full width on larger screens */}
      <div className="w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl lg:w-[calc(100%-5rem)] xl:w-[calc(100%-5rem)] mx-auto bg-background shadow-2xl min-h-screen flex flex-col lg:ml-20">
        <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar w-full">
        <Routes>
          {/* Onboarding Flow */}
          <Route path="/" element={<OnboardingLanding />} />
          <Route path="/auth" element={<AuthSelection />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-profile" element={<CreateProfile />} />
          <Route path="/set-location" element={<SetLocation />} />
          <Route path="/success" element={<RegistrationSuccess />} />

          {/* Main Tabs */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/my-games" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Event Flows */}
          <Route path="/event/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
          <Route path="/event/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
          <Route path="/event/edit/:id" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
          <Route path="/event/manage/:id" element={<ProtectedRoute><OrganizerDashboard /></ProtectedRoute>} />
          <Route path="/event/created" element={<ProtectedRoute><EventCreated /></ProtectedRoute>} />

          {/* Interaction Flows */}
          <Route path="/chat/:id" element={<ProtectedRoute><ChatDetail /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
          <Route path="/rate-players/:id" element={<ProtectedRoute><RatePlayers /></ProtectedRoute>} />
        </Routes>
      </main>
      
        {/* Bottom Navigation - shows on mobile/tablet */}
        {showBottomNav && (
          <div className="lg:hidden">
            <BottomNav />
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  console.log('App component rendering');
  
  if (!clerkPubKey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-white">
        <div className="text-center p-6">
          <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
          <p className="text-slate-400">
            Please set VITE_CLERK_PUBLISHABLE_KEY in your environment variables.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
    <HashRouter>
        <AuthProvider>
          <EventProvider>
            <MessageProvider>
              <SettingsProvider>
      <AppContent />
              </SettingsProvider>
            </MessageProvider>
          </EventProvider>
        </AuthProvider>
    </HashRouter>
    </ClerkProvider>
  );
};

export default App;