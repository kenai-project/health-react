import { useNavigate } from 'react-router';
import GlassCard from '../../../app/components/GlassCard';
import { Button } from '../../../app/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-400/30 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-400/30 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        <GlassCard className="p-8 text-center">
          <div className="mb-6">
            <h1 className="text-9xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">404</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Page Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate(-1)} variant="outline" className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button
              onClick={() => navigate('/home')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default NotFoundPage;

