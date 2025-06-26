
import { useEffect } from 'react';
import Calendar from '@/components/Calendar';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Set up PWA install prompt and other client-side features
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Family Calendar</h1>
          <p className="text-gray-600">Initializing your calendar...</p>
        </div>
      </div>
    );
  }

  return <Calendar />;
};

export default Index;
