import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { CallProvider } from './context/CallContext';

import AppLayout from './components/layout/AppLayout';
import FeedPage from './pages/FeedPage';
import ChatView from './components/chat/ChatView';
import DiscoverPage from './pages/DiscoverPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import NotificationDrawer from './components/notifications/NotificationDrawer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PostComposer from './components/feed/PostComposer';
import CallsPage from './pages/CallsPage';
import CallOverlay from './components/call/CallOverlay';
import { Loader2 } from 'lucide-react';

const getRouteFromLocation = () => {
  if (typeof window === 'undefined') return { tab: 'feed', userId: null, postId: null };
  const rawPath = window.location.pathname.replace(/^\/+/, '').split('/')[0];
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('post') || null;
  const userId = params.get('user') || null;
  const validTabs = ['feed', 'chat', 'calls', 'discover', 'notifications', 'profile', 'settings'];
  const tab = validTabs.includes(rawPath) ? rawPath : 'feed';
  return { tab, userId, postId };
};

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const initialRoute = getRouteFromLocation();
  const [currentTab, setCurrentTab] = useState(initialRoute.tab); // 'feed' | 'chat' | 'discover' | 'notifications' | 'profile' | 'settings'
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [viewingUserId, setViewingUserId] = useState(initialRoute.userId);
  const [focusedPostId, setFocusedPostId] = useState(initialRoute.postId);
  const [newPost, setNewPost] = useState(null);

  // Sync state with browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      const route = getRouteFromLocation();
      setCurrentTab(route.tab);
      setViewingUserId(route.userId);
      setFocusedPostId(route.postId);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = (tab, { userId = null, postId = null, replace = false } = {}) => {
    setCurrentTab(tab);
    setViewingUserId(userId);
    setFocusedPostId(postId);

    let path = tab === 'feed' && !postId ? '/feed' : `/${tab}`;
    const params = new URLSearchParams();
    if (postId) params.set('post', postId);
    if (userId) params.set('user', userId);
    const qs = params.toString();
    const fullUrl = qs ? `${path}?${qs}` : path;

    if (replace) {
      window.history.replaceState({ tab, userId, postId }, '', fullUrl);
    } else {
      window.history.pushState({ tab, userId, postId }, '', fullUrl);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF8] dark:bg-[#0D0D0D] text-[#111111] dark:text-[#F5F5F5] gap-3">
        <div className="w-10 h-10 rounded-[8px] bg-[#111111] dark:bg-[#F5F5F5] text-[#FAFAF8] dark:text-[#111111] flex items-center justify-center shadow-sm">
          <span className="font-extrabold text-[18px] tracking-tight">N</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0]">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF5C35] dark:text-[#FF6845]" />
          <span>Starting NOVA...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated flow
  if (!isAuthenticated) {
    return authView === 'login' ? (
      <LoginPage onNavigateRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onNavigateLogin={() => setAuthView('login')} />
    );
  }

  // Handle viewing another user's profile from search
  const handleSelectUser = (userId) => {
    navigateTo('profile', { userId });
  };

  // Handle deep post selection from search, chat, or profile
  const handleSelectPost = (postId) => {
    navigateTo('feed', { postId });
  };

  const handleClearFocusedPost = () => {
    setFocusedPostId(null);
    window.history.replaceState({ tab: 'feed', userId: null, postId: null }, '', '/feed');
  };

  return (
    <>
      <AppLayout
        currentTab={currentTab}
        setCurrentTab={(tab) => navigateTo(tab)}
        onOpenComposer={() => setIsComposerOpen(true)}
      >
        {currentTab === 'feed' && (
          <FeedPage
            onOpenComposer={() => setIsComposerOpen(true)}
            focusedPostId={focusedPostId}
            onClearFocusedPost={handleClearFocusedPost}
            onSelectUser={handleSelectUser}
            newPost={newPost}
          />
        )}
        {currentTab === 'chat' && <ChatView onSelectPost={handleSelectPost} />}
        {currentTab === 'calls' && <CallsPage />}
        {currentTab === 'discover' && (
          <DiscoverPage
            onSelectUser={handleSelectUser}
            onSelectPost={handleSelectPost}
          />
        )}
        {currentTab === 'notifications' && <NotificationDrawer />}
        {currentTab === 'profile' && (
          <ProfilePage
            targetUserId={viewingUserId}
            onSelectPost={handleSelectPost}
          />
        )}
        {currentTab === 'settings' && <SettingsPage />}
      </AppLayout>

      {/* Post Composer Modal */}
      <PostComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onPostCreated={(created) => {
          setNewPost(created);
        }}
      />

      {/* 1-to-1 WebRTC Voice & Video Call Overlay */}
      <CallOverlay />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <CallProvider>
            <AppContent />
          </CallProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
