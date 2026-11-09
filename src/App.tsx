import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PageRoute } from './types';
import { Navbar } from './components/common/Navbar';
import { LandingPage } from './components/pages/LandingPage';
import { AuthPage } from './components/pages/AuthPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { ExplorePage } from './components/pages/ExplorePage';
import { WriteBlogPage } from './components/pages/WriteBlogPage';
import { BlogReadingPage } from './components/pages/BlogReadingPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { AdminPage } from './components/pages/AdminPage';
import { FarewellPage } from './components/pages/FarewellPage';
import { SearchModal } from './components/common/SearchModal';
import { AlertCircle, LogOut } from 'lucide-react';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [route, setRoute] = useState<PageRoute>({ type: 'landing' });
  const [searchOpen, setSearchOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Synchronize initial route with authentication state
  useEffect(() => {
    if (!loading) {
      if (user) {
        // If logged in and on landing or auth, route to dashboard
        if (route.type === 'landing' || route.type === 'auth') {
          setRoute({ type: 'dashboard' });
        }
      } else {
        // If logged out and trying to access protected views, route to landing
        if (
          route.type === 'dashboard' ||
          route.type === 'write' ||
          route.type === 'admin'
        ) {
          setRoute({ type: 'landing' });
        }
      }
    }
  }, [user, loading]);

  // Global Keyboard shortcuts: Ctrl/Cmd+K opens Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (newRoute: PageRoute) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setRoute(newRoute);
  };

  const handleConfirmLogout = async () => {
    setLogoutModalOpen(false);
    await signOut();
    setRoute({ type: 'farewell' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060911] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-slate-400 font-mono-code tracking-widest uppercase">
            Loading Soumil's Blog...
          </p>
        </div>
      </div>
    );
  }

  // Hide top navbar on landing or farewell or auth for pure focus
  const showNavbar = route.type !== 'farewell';

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col selection:bg-cyan-500/30">
      {/* Global Floating Navigation Bar */}
      {showNavbar && (
        <Navbar
          currentRoute={route}
          onNavigate={handleNavigate}
          onOpenSearch={() => setSearchOpen(true)}
          onRequestLogout={() => setLogoutModalOpen(true)}
        />
      )}

      {/* Main Page Rendering */}
      <div className="flex-1">
        {route.type === 'landing' && (
          <LandingPage onNavigate={handleNavigate} />
        )}

        {route.type === 'auth' && (
          <AuthPage
            initialMode={route.mode || 'login'}
            onSuccess={() => handleNavigate({ type: 'dashboard' })}
            onNavigate={handleNavigate}
          />
        )}

        {route.type === 'dashboard' && (
          <DashboardPage onNavigate={handleNavigate} />
        )}

        {route.type === 'explore' && (
          <ExplorePage onNavigate={handleNavigate} />
        )}

        {route.type === 'write' && (
          <WriteBlogPage
            editBlogId={route.editBlogId}
            onNavigate={handleNavigate}
          />
        )}

        {route.type === 'read' && (
          <BlogReadingPage
            blogId={route.blogId}
            onNavigate={handleNavigate}
          />
        )}

        {route.type === 'profile' && (
          <ProfilePage
            userId={route.userId}
            initialTab={route.tab}
            onNavigate={handleNavigate}
            onRequestLogout={() => setLogoutModalOpen(true)}
          />
        )}

        {route.type === 'admin' && (
          <AdminPage onNavigate={handleNavigate} />
        )}

        {route.type === 'farewell' && (
          <FarewellPage onNavigate={handleNavigate} />
        )}
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Logout Confirmation Modal */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 mx-auto flex items-center justify-center text-rose-400 mb-4">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-2xl font-bold text-white mb-2">
              Sign Out of Soumil's Blog?
            </h3>
            <p className="text-slate-400 text-xs mb-6 font-light">
              You will be redirected to the community farewell page. You can return and log back in anytime.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLogoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl glass-panel text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
