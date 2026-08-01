import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import HomeScreen from './components/HomeScreen';
import ExploreScreen from './components/ExploreScreen';
import PassportScreen from './components/PassportScreen';
import ProfileScreen from './components/ProfileScreen';
import GearLockerScreen from './components/GearLockerScreen';
import CommunityScreen from './components/CommunityScreen';
import StatisticsScreen from './components/StatisticsScreen';
import AdminDashboardScreen from './components/AdminDashboardScreen';
import ActivePaddleScreen from './components/ActivePaddleScreen';
import SpotDetailModal from './components/SpotDetailModal';
import GearDetailModal from './components/GearDetailModal';
import WorkoutSummaryModal from './components/WorkoutSummaryModal';
import SafetyCheckModal from './components/SafetyCheckModal';
import LoginModal from './components/LoginModal';
import SplashModal from './components/SplashModal';
import { saveActivityHybrid, processPendingOfflineSync } from './utils/syncEngine';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('supid_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [showSplash, setShowSplash] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalInitialRegister, setLoginModalInitialRegister] = useState(false);

  const handleOpenLogin = (isRegMode = false) => {
    setLoginModalInitialRegister(isRegMode === true);
    setShowLoginModal(true);
  };
  const [showSafetyCheck, setShowSafetyCheck] = useState(false);
  const [isActivePaddle, setIsActivePaddle] = useState(false);
  const [workoutSession, setWorkoutSession] = useState(null);
  const [showWorkoutSummary, setShowWorkoutSummary] = useState(false);
  const [showStampUnlocked, setShowStampUnlocked] = useState(false);
  const [unlockedSpotName, setUnlockedSpotName] = useState('Samalona');
  const [selectedSpot, setSelectedSpot] = useState(null);

  // Inactivity Auto-Logout (15 Minutes Idle Timeout Engine)
  useEffect(() => {
    if (!currentUser) return;

    let timeoutId;
    const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes Idle Timeout

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setCurrentUser(null);
        localStorage.removeItem('supid_user');
        setActiveTab('home');
        alert('⏰ Sesi Anda telah berakhir secara otomatis karena tidak ada aktivitas selama 15 menit. Silakan login kembali untuk melanjutkan!');
      }, IDLE_TIMEOUT_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [currentUser]);

  // Monitor online network event to trigger automatic background synchronization
  useEffect(() => {
    const handleOnlineSync = async () => {
      await processPendingOfflineSync();
      setRefreshTrigger((prev) => prev + 1);
    };

    window.addEventListener('online', handleOnlineSync);

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

  const [safetyCheckData, setSafetyCheckData] = useState(null);

  // Confirm Safety Check -> launches Active Workout Overlay with Safety Audit Data
  const handleConfirmSafetyStart = (items, score) => {
    setSafetyCheckData({ items, score });
    setShowSafetyCheck(false);
    setIsActivePaddle(true);
  };

  // Stop Workout -> launches Summary Modal with Safety Audit Record
  const handleStopWorkout = (sessionStats) => {
    setIsActivePaddle(false);
    setWorkoutSession({
      ...sessionStats,
      safetyScore: safetyCheckData ? safetyCheckData.score : 100,
      safetyItems: safetyCheckData ? safetyCheckData.items : null,
      safetyItemsJson: safetyCheckData && safetyCheckData.items ? JSON.stringify(safetyCheckData.items) : null,
    });
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

      {/* Main Glass Header (100% Sticky Lock at Top of Screen) */}
      <header className="header-glass" style={{ position: 'sticky', top: 0, zIndex: 9999, overflow: 'hidden' }}>
        {/* Background Real Stand-Up Paddleboard Action Photo */}
        <img 
          src="/header-sup-bg.webp" 
          alt="Stand Up Paddleboard Header Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 45%',
            opacity: 0.90,
            filter: 'brightness(1.05) contrast(1.05)',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        {/* Translucent Soft Ocean Gradient Overlay for High Contrast & Text Legibility */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, rgba(7, 13, 27, 0.45) 0%, rgba(3, 105, 161, 0.30) 50%, rgba(7, 13, 27, 0.45) 100%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>

          {/* Header Brand with Official PADDLE ID Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src="/logo.png"
              alt="Paddle ID Logo"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1.5px solid #ffffff',
                objectFit: 'cover',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}
            />
            <div>
              <h1 style={{ fontSize: '0.98rem', fontWeight: 900, lineHeight: 1.1, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Stand Up PaddleLog</h1>
              <span style={{ fontSize: '0.65rem', opacity: 0.95, fontWeight: 700, letterSpacing: '0.04em', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>SUP.ID INDONESIA</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                style={{
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '4px 9px',
                  borderRadius: '16px',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                Admin
              </button>
            )}

            {currentUser ? (
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(7, 13, 27, 0.45)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.7)'
                }}
                title="Klik untuk Keluar Akun"
              >
                <span>👤 {currentUser.name}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>🚪</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                style={{
                  background: 'rgba(7, 13, 27, 0.45)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.7)'
                }}
              >
                🔑 Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main View Switcher */}
      <main style={{ flex: 1, width: '100%' }}>
        {activeTab === 'home' && (
          <HomeScreen
            userId={userId}
            userName={userName}
            refreshTrigger={refreshTrigger}
            onRequireLogin={() => setShowLoginModal(true)}
            onOpenAllActivities={() => setActiveTab('passport')}
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
            onTestStamp={(spotName) => {
              setUnlockedSpotName(spotName);
              setShowStampUnlocked(true);
            }}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            currentUser={currentUser}
            onOpenLogin={(isReg) => handleOpenLogin(isReg)}
            onLogout={handleLogout}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'stats' && (
          <StatisticsScreen userId={userId || 2} />
        )}

        {activeTab === 'gear' && (
          <GearLockerScreen userId={userId || 2} />
        )}

        {activeTab === 'community' && (
          <CommunityScreen
            userId={userId || 2}
            userName={userName}
            onRequireLogin={() => setShowLoginModal(true)}
          />
        )}

        {activeTab === 'admin' && isSuperAdmin && (
          <AdminDashboardScreen currentUser={currentUser} />
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onStartPaddleClick={handleStartPaddleClick}
      />

      {/* Modals and Overlays */}
      {showSafetyCheck && (
        <SafetyCheckModal
          onClose={() => setShowSafetyCheck(false)}
          onConfirmStart={handleConfirmSafetyStart}
        />
      )}

      {isActivePaddle && (
        <ActivePaddleScreen
          onStop={handleStopWorkout}
          onStopWorkout={handleStopWorkout}
        />
      )}

      {showWorkoutSummary && workoutSession && (
        <WorkoutSummaryModal
          session={workoutSession}
          sessionData={workoutSession}
          onClose={() => setShowWorkoutSummary(false)}
          onSave={handleSaveWorkoutActivity}
          onSaveActivity={handleSaveWorkoutActivity}
        />
      )}

      {showStampUnlocked && (
        <div className="stamp-modal-backdrop" onClick={() => setShowStampUnlocked(false)}>
          <div className="stamp-badge-container" onClick={(e) => e.stopPropagation()}>
            <div className="stamp-visual">
              <span style={{ fontSize: '2.5rem' }}>🏆</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, marginTop: '4px' }}>UNLOCKED</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
              Stempel Baru Diberikan! 🎉
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Selamat! Anda telah resmi mendayung dan membuka stempel paspor untuk lokasi <strong>{unlockedSpotName}</strong>.
            </p>
            <button
              className="btn-cta-jumbo"
              onClick={() => {
                setShowStampUnlocked(false);
                setActiveTab('passport');
              }}
            >
              LIHAT PASPOR SAYA 📖
            </button>
          </div>
        </div>
      )}



      {/* Login / Register Modal */}
      {showLoginModal && !currentUser && (
        <LoginModal
          initialRegister={loginModalInitialRegister}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
}
