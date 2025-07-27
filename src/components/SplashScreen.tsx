import { useEffect, useState } from 'react';
import smartcareLogo from '@/assets/smartcare-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setTimeout(onComplete, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
      <div className="text-center space-y-8 animate-pulse">
        <div className="w-32 h-32 mx-auto">
          <img 
            src={smartcareLogo} 
            alt="SmartCare Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">Mitra SmartCare</h1>
          <p className="text-xl text-white/80">Platform untuk Penyedia Jasa</p>
        </div>
        {loading && (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
};