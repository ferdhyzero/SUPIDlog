import React, { useState, useEffect } from 'react';

// Components
import SplashModal from './components/SplashModal';
import Navigation from './components/Navigation';
import HomeScreen from './components/HomeScreen';
import SafetyCheckModal from './components/SafetyCheckModal';
import ActivePaddleScreen from './components/ActivePaddleScreen';
import WorkoutSummaryModal from './components/WorkoutSummaryModal';
import StampUnlockedModal from './components/StampUnlockedModal';
import ExploreScreen from './components/ExploreScreen';
import SpotDetailModal from './components/SpotDetailModal';
import PassportScreen from './components/PassportScreen';
import GearLockerScreen from './components/GearLockerScreen';
import StatisticsScreen from './components/StatisticsScreen';
import CommunityScreen from './components/CommunityScreen';
import ProfileScreen from './components/ProfileScreen';
import LoginModal from './components/LoginModal';
import AdminDashboardScreen from './components/AdminDashboardScreen';
import AllActivitiesModal from './components/AllActivitiesModal';

// Hybrid Sync Engine
import { saveActivityHybrid, processPendingOfflineSync } from './utils/syncEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showSplash, setShowSplash] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAllActivitiesModal, setShowAllActivitiesModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize currentUser strictly from LocalStorage (defaults to null for Guest Mode if not logged in)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('supid_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [showSafetyCheck, setShowSafetyCheck] = useState(false);
  const [isActivePaddle, setIsActivePaddle] = useState(false);
  const [workoutSession, setWorkoutSession] = useState(null);
  const [showWorkoutSummary, setShowWorkoutSummary] = useState(false);
  const [showStampUnlocked, setShowStampUnlocked] = useState(false);
  const [unlockedSpotName, setUnlockedSpotName] = useState('Samalona');
  const [selectedSpot, setSelectedSpot] = useState(null);

  // Monitor online network event to trigger automatic background synchronization
  useEffect(() => {
    const handleOnlineSync = async () => {
      await processPendingOfflineSync();
      setRefreshTrigger((prev) => prev + 1);
    };

    window.addEventListener('online', handleOnlineSync);

    // Initial check on load
    if (navigator.onLine) {
      processPendingOfflineSync();
    }

    return () => window.removeEventListener('online', handleOnlineSync);
  }, []);

  // Save current user to LocalStorage or remove on logout
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('supid_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('supid_user');
    }
  }, [currentUser]);

  // Handle Start Paddling click -> launches Safety Check Modal
  const handleStartPaddleClick = () => {
    setShowSafetyCheck(true);
  };

  // Confirm Safety Check -> launches Active Workout Overlay
  const handleConfirmSafetyStart = () => {
    setShowSafetyCheck(false);
    setIsActivePaddle(true);
  };

  // Stop Workout -> launches Summary Modal
  const handleStopWorkout = (sessionStats) => {
    setIsActivePaddle(false);
    setWorkoutSession(sessionStats);
    setShowWorkoutSummary(true);
  };

  // Save Workout -> Check if user is logged in before saving
  const handleSaveWorkoutActivity = async (activity) => {
    setShowWorkoutSummary(false);

    if (!currentUser) {
      alert('🔒 Mode Guest: Silakan Login terlebih dahulu untuk menyimpan hasil sesi paddle Anda ke database MySQL!');
      setShowLoginModal(true);
      return;
    }

    setUnlockedSpotName(activity.spotName || 'Samalona');

    // Use Hybrid Save Engine
    const result = await saveActivityHybrid(activity, currentUser.id);
    console.log('Hybrid Save Result:', result);

    // Trigger instant refresh across all views
    setRefreshTrigger((prev) => prev + 1);
    setShowStampUnlocked(true);
  };

  // Login Success Handler
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setShowLoginModal(false);
    setRefreshTrigger((prev) => prev + 1);

    if (user.role === 'super_admin' || user.email === 'ahmadferdy66@gmail.com' || user.name === 'ferdhy') {
      setActiveTab('admin');
    }
  };

  // Logout Handler (Completely clears session and persists Guest Mode)
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('supid_user');
    setActiveTab('home');
    alert('Anda telah keluar dari akun. Sistem sekarang berada dalam Mode Guest.');
  };

  const isSuperAdmin = currentUser && (currentUser.role === 'super_admin' || currentUser.email === 'ahmadferdy66@gmail.com' || currentUser.name === 'ferdhy');
  const userId = currentUser ? currentUser.id : null;
  const userName = currentUser ? currentUser.name : 'Guest SUPer';

  return (
    <>
      {/* Splash Screen */}
      {showSplash && (
        <SplashModal onClose={() => setShowSplash(false)} />
      )}

      {/* Main Glass Header */}
      <header className="header-glass" style={{ background: isSuperAdmin ? 'rgba(15, 23, 42, 0.95)' : undefined }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Header Brand with Official PADDLE ID Logo & White Border Outline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/logo.png" 
              alt="Paddle ID Logo" 
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '10px', 
                border: '2px solid #ffffff',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                objectFit: 'cover'
              }} 
            />
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1 }}>
                {isSuperAdmin ? 'SUPID Admin' : 'PaddleLog'}
              </h1>
              <span style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 600, letterSpacing: '0.04em' }}>SUP.ID INDONESIA</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSuperAdmin && (
              <button 
                onClick={() => setActiveTab('admin')}
                style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                🛡️ Admin Panel
              </button>
            )}

            <button 
              onClick={() => setShowLoginModal(true)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '5px 12px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{currentUser ? `👤 ${currentUser.name}` : '🔑 Login'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main View Switcher */}
      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <HomeScreen 
            userId={userId}
            userName={userName}
            onStartPaddle={handleStartPaddleClick}
            onOpenAllActivities={() => setShowAllActivitiesModal(true)}
            onRequireLogin={() => setShowLoginModal(true)}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'explore' && (
          <ExploreScreen 
            userId={userId}
            onSelectSpot={(spot) => setSelectedSpot(spot)}
            onRequireLogin={() => setShowLoginModal(true)}
          />
        )}

        {activeTab === 'passport' && (
          <PassportScreen 
            userId={userId}
            refreshTrigger={refreshTrigger}
            onRequireLogin={() => setShowLoginModal(true)}
            onTestStamp={(spot) => {
              setUnlockedSpotName(spot);
              setShowStampUnlocked(true);
            }}
          />
        )}

        {activeTab === 'gear' && (
          <GearLockerScreen userId={userId} />
        )}

        {activeTab === 'stats' && (
          <StatisticsScreen userId={userId} />
        )}

        {activeTab === 'community' && (
          <CommunityScreen userId={userId} userName={userName} />
        )}

        {activeTab === 'admin' && (
          <AdminDashboardScreen 
            currentUser={currentUser}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen 
            currentUser={currentUser}
            onOpenLogin={() => setShowLoginModal(true)}
            onLogout={handleLogout}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onStartPaddleClick={handleStartPaddleClick}
      />

      {/* Modals & Overlays */}
      {showAllActivitiesModal && (
        <AllActivitiesModal 
          userId={userId}
          onClose={() => setShowAllActivitiesModal(false)}
        />
      )}

      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {showSafetyCheck && (
        <SafetyCheckModal 
          onClose={() => setShowSafetyCheck(false)}
          onConfirmStart={handleConfirmSafetyStart}
        />
      )}

      {isActivePaddle && (
        <ActivePaddleScreen 
          onStop={handleStopWorkout}
          onTakePhoto={() => alert('📷 Foto diambil! Foto akan disimpan ke riwayat aktivitas.')}
        />
      )}

      {showWorkoutSummary && (
        <WorkoutSummaryModal 
          sessionData={workoutSession}
          onSaveActivity={handleSaveWorkoutActivity}
          onClose={() => setShowWorkoutSummary(false)}
        />
      )}

      {showStampUnlocked && (
        <StampUnlockedModal 
          spotName={unlockedSpotName}
          onClose={() => {
            setShowStampUnlocked(false);
            setActiveTab('passport');
          }}
        />
      )}

      {selectedSpot && (
        <SpotDetailModal 
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
        />
      )}
    </>
  );
}
