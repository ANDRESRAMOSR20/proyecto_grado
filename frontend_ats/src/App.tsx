import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import UserSidebar from './components/user/UserSidebar';
import Preselection from './components/admin/Preselection';
import JobsAdmin from './components/admin/JobsAdmin';
import Metrics from './components/Metrics';
import Home from './components/Home';
// Removed JobVacancyFilter and Metrics from admin navigation
import Profile from './components/Profile';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import InitialSetup from './components/user/InitialSetup';
import { getUserProfile } from './services/userProfileService';

import OfferView from './components/user/OfferView';
import SelectionView from './components/user/SelectionView';
import './App.css';

type AdminPageType = 'home' | 'preselection' | 'jobs' | 'metrics' | 'profile';
export type UserPageType = 'offerView' | 'selectionView' | 'profile';

interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  fullname?: string;
  celular?: string;
}

function App() {
  const [currentAdminPage, setCurrentAdminPage] = useState<AdminPageType>('home');
  const [currentUserPage, setCurrentUserPage] = useState<UserPageType>('offerView');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');
  const [showInitialSetup, setShowInitialSetup] = useState<boolean>(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    if (token) {
      // Validate token with backend or decode JWT to get user info
      // For now, we'll just set authenticated to true
      setIsAuthenticated(true);
      
      // Get user data from localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Prefer backend profile state to decide if initial setup is needed
        const initDone = localStorage.getItem(`init_done_${userData.id}`) === 'true';
        if (!userData.is_admin && !initDone) {
          getUserProfile(userData.id).then((res) => {
            const hasProfile = res.success && res.has_profile && !!res.profile?.fullname && !!res.profile?.celular;
            if (!hasProfile) {
              setShowInitialSetup(true);
            }
          }).catch(() => {
            // If profile check fails, fall back to local data
            if (!userData.fullname || !userData.celular) {
              setShowInitialSetup(true);
            }
          });
        }
      }
    }
  }, []);

  const handleSignIn = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));

    const initDone = localStorage.getItem(`init_done_${userData.id}`) === 'true';
    if (userData.is_admin) {
      setCurrentAdminPage('home');
      return;
    }

    setIsCheckingProfile(true);
    getUserProfile(userData.id)
      .then((res) => {
        const hasProfile = res.success && res.has_profile && !!res.profile?.fullname && !!res.profile?.celular;
        if (hasProfile || initDone) {
          // Merge latest profile into local cache
          const updated = {
            ...userData,
            fullname: res.profile?.fullname ?? userData.fullname,
            celular: res.profile?.celular ?? userData.celular,
            resume_pdf: res.profile?.resume_pdf,
          } as any;
          setUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
          localStorage.setItem(`init_done_${userData.id}`, 'true');
          setShowInitialSetup(false);
          setCurrentUserPage('offerView');
        } else {
          setShowInitialSetup(true);
        }
      })
      .catch(() => {
        // Fallback to local fields
        if (!userData.fullname || !userData.celular) {
          setShowInitialSetup(true);
        } else {
          setCurrentUserPage('offerView');
        }
      })
      .finally(() => setIsCheckingProfile(false));
  };

  const handleSignUp = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));

    const initDone = localStorage.getItem(`init_done_${userData.id}`) === 'true';
    if (userData.is_admin) {
      setCurrentAdminPage('home');
      return;
    }

    setIsCheckingProfile(true);
    getUserProfile(userData.id)
      .then((res) => {
        const hasProfile = res.success && res.has_profile && !!res.profile?.fullname && !!res.profile?.celular;
        if (hasProfile || initDone) {
          const updated = {
            ...userData,
            fullname: res.profile?.fullname ?? userData.fullname,
            celular: res.profile?.celular ?? userData.celular,
            resume_pdf: res.profile?.resume_pdf,
          } as any;
          setUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
          localStorage.setItem(`init_done_${userData.id}`, 'true');
          setShowInitialSetup(false);
          setCurrentUserPage('offerView');
        } else {
          setShowInitialSetup(true);
        }
      })
      .catch(() => {
        if (!userData.fullname || !userData.celular) {
          setShowInitialSetup(true);
        } else {
          setCurrentUserPage('offerView');
        }
      })
      .finally(() => setIsCheckingProfile(false));
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setAuthView('signin');
  };

  const renderAdminPage = () => {
    switch (currentAdminPage) {
      case 'home':
        return <Home />;
      case 'preselection':
        return <Preselection />;
      case 'jobs':
        return <JobsAdmin />;
      case 'metrics':
        return <Metrics />;
      case 'profile':
        return <Profile />;
      default:
        return <Home />;
    }
  };

  const renderUserPage = () => {
    switch (currentUserPage) {
      case 'offerView':
        return <OfferView />;
      case 'selectionView':
        return <SelectionView />;
      case 'profile':
        return <Profile />;
      default:
        return <OfferView />;
    }
  };

  // Función para manejar la finalización de la configuración inicial
  const handleInitialSetupComplete = (userData: { fullname: string, celular: string }) => {
    if (user) {
      const updatedUser = {
        ...user,
        fullname: userData.fullname,
        celular: userData.celular
      };
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem(`init_done_${user.id}` , 'true');
      setShowInitialSetup(false);
    }
  };

  // Si no está autenticado, mostrar pantallas de autenticación
  if (!isAuthenticated) {
    return authView === 'signin' ? (
      <SignIn 
        onSignIn={handleSignIn} 
        onNavigateToSignUp={() => setAuthView('signup')} 
      />
    ) : (
      <SignUp 
        onSignUp={handleSignUp} 
        onNavigateToSignIn={() => setAuthView('signin')} 
      />
    );
  }
  
  // Si está autenticado pero estamos verificando perfil, mostrar loading
  if (isAuthenticated && isCheckingProfile) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Si está autenticado pero necesita completar la configuración inicial
  if (showInitialSetup) {
    return <InitialSetup onComplete={handleInitialSetupComplete} />;
  }

  // If authenticated, show the appropriate interface based on user role
  return (
    <div className="app">
      {user?.is_admin ? (
        // Admin interface
        <>
          <Sidebar 
            currentPage={currentAdminPage} 
            onPageChange={(p) => setCurrentAdminPage(p)} 
            onLogout={handleLogout}
          />
          <main className="main-content">
            {renderAdminPage()}
          </main>
        </>
      ) : (
        // User interface
        <>
          <UserSidebar 
            currentPage={currentUserPage} 
            onPageChange={setCurrentUserPage} 
            onLogout={handleLogout}
          />
          <main className="main-content">
            {renderUserPage()}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
