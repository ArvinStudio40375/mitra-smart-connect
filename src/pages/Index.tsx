import { useState, useEffect } from 'react';
import { SplashScreen } from '@/components/SplashScreen';
import { MitraAuth } from '@/components/MitraAuth';
import { MitraDashboard } from '@/components/MitraDashboard';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'auth' | 'dashboard'>('splash');
  const [currentMitra, setCurrentMitra] = useState<any>(null);

  useEffect(() => {
    // Check for stored mitra session
    const storedMitra = localStorage.getItem('mitra-session');
    if (storedMitra) {
      setCurrentMitra(JSON.parse(storedMitra));
      setCurrentScreen('dashboard');
    }
  }, []);

  const handleSplashComplete = () => {
    setCurrentScreen('auth');
  };

  const handleLogin = (mitra: any) => {
    setCurrentMitra(mitra);
    localStorage.setItem('mitra-session', JSON.stringify(mitra));
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setCurrentMitra(null);
    localStorage.removeItem('mitra-session');
    setCurrentScreen('auth');
  };

  if (currentScreen === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (currentScreen === 'auth') {
    return <MitraAuth onLogin={handleLogin} />;
  }

  if (currentScreen === 'dashboard' && currentMitra) {
    return <MitraDashboard mitra={currentMitra} onLogout={handleLogout} />;
  }

  return null;
};

export default Index;
