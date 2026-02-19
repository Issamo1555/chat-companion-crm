import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { socketService } from '@/services/socket';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, token } = useAuth();

    useEffect(() => {
        if (isAuthenticated && token) {
            // Connect to socket with auth token
            socketService.connect('http://localhost:3000', token);
        }

        return () => {
            // Disconnect when component unmounts (logout/navigating away from protected routes)
            socketService.disconnect();
        };
    }, [isAuthenticated, token]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
