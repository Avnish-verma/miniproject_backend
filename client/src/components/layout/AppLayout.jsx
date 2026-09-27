import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import {
  House,
  Compass,
  Plus,
  MessageCircle,
  Phone,
  Bell,
  User as UserIcon,
  Settings,
  Sun,
  Moon,
  LogOut,
  Search,
  TrendingUp,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import BrandLockup from '../common/BrandLockup';
import api from '../../services/api';

export default function AppLayout({ children, currentTab, setCurrentTab, onOpenComposer }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { isUserOnline } = useSocket();
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [trendingTags, setTrendingTags] = useState([]);

  // Fetch recommended users for right sidebar, notifications count & trending tags
  useEffect(() => {
    const fetchDiscovery = async () => {
      try {
        const res = await api.get('/api/v1/users/search?limit=5');
        if (res.data?.data?.users) {
          const others = res.data.data.users.filter((u) => u._id !== user?._id);
          setRecommendedUsers(others.slice(0, 4));
        }
      } catch (err) {
        console.warn('Could not load suggestions:', err.message);
      }
    };

    const fetchNotifsCount = async () => {
      try {
        const res = await api.get('/api/v1/notifications?limit=1');
        if (res.data?.unreadCount !== undefined) {
          setUnreadNotifs(res.data.unreadCount);
        }
      } catch (err) {
        console.warn('Could not fetch notifications count:', err.message);
      }
    };

    const fetchTrending = async () => {
      try {
        const res = await api.get('/api/v1/posts/trending-tags?limit=4');
        if (res.data?.data) {
          setTrendingTags(res.data.data);
        }
      } catch (err) {
        console.warn('Could not load trending tags:', err.message);
      }
    };

    fetchDiscovery();
    fetchNotifsCount();
    fetchTrending();
  }, [user]);

  const handleToggleFollow = async (targetUserId) => {
    try {
      const res = await api.post(`/api/v1/social/follow/${targetUserId}`);
      setFollowingMap((prev) => ({
        ...prev,
        [targetUserId]: res.data?.data?.isFollowing,
      }));
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  // Structured navigation groups as specified in Master Design
  const navGroup1 = [
    { id: 'feed', label: 'Home', icon: House },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'create', label: 'Create', icon: Plus, isAction: true },
  ];

  const navGroup2 = [
    { id: 'chat', label: 'Messages', icon: MessageCircle },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifs },
  ];

  const navGroup3 = [
    { id: 'profile', label: 'Profile', icon: UserIcon, isAvatar: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = currentTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => {
          if (item.isAction) {
            onOpenComposer();
          } else {
            setCurrentTab(item.id);
          }
        }}
        className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-[9px] transition-all duration-150 text-[14px] ${
          isActive
            ? 'font-bold text-[#111111] dark:text-[#F5F5F5] bg-[#F4F3F0] dark:bg-[#1C1C1C]'
            : 'font-medium text-[#6B6B6B] dark:text-[#A0A0A0] hover:text-[#111111] dark:hover:text-[#F5F5F5] hover:bg-[#F4F3F0]/60 dark:hover:bg-[#1C1C1C]/60'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center shrink-0">
            {item.isAvatar ? (
              <Avatar
                src={user?.profilePic}
                name={user?.fullname}
                size="xs"
                className={isActive ? 'ring-1 ring-[#FF5C35] dark:ring-[#FF6845]' : ''}
              />
            ) : (
              <Icon
                className={`w-[19px] h-[19px] shrink-0 stroke-[1.75px] transition-colors ${
                  isActive
                    ? 'text-[#FF5C35] dark:text-[#FF6845]'
                    : 'text-[#6B6B6B] dark:text-[#A0A0A0] group-hover:text-[#111111] dark:group-hover:text-[#F5F5F5]'
                }`}
              />
            )}
          </div>

          <span className="truncate tracking-[-0.01em]">{item.label}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {Boolean(item.badge && item.badge > 0) && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#FF5C35] dark:bg-[#FF6845] text-white text-[10px] font-bold">
              {item.badge}
            </span>
          )}

          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C35] dark:bg-[#FF6845]" />
          )}
        </div>
      </button>
    );
  };

  // Only show right rail on Home and Discover (NEVER on Messages, Calls, or Settings)
  const showRightRail = currentTab === 'feed' || currentTab === 'discover';

  return (
    <div className="flex min-h-screen w-full bg-[#FAFAF8] dark:bg-[#0D0D0D] text-[#111111] dark:text-[#F5F5F5] antialiased">
      {/* 1. Desktop & Tablet Navigation Rail (240px wide quiet, elegant rail) */}
      <aside className="hidden md:flex flex-col justify-between w-[240px] h-screen sticky top-0 border-r border-[#E7E5E2] dark:border-[#292929] px-4 py-5 select-none shrink-0 z-30 bg-[#FAFAF8] dark:bg-[#0D0D0D]">
        <div className="flex flex-col w-full">
          {/* Brand Mark */}
          <div className="px-1.5 py-1 mb-5">
            <BrandLockup
              size="sm"
              layout="horizontal"
              showSubtitle={true}
              onClick={() => setCurrentTab('feed')}
            />
          </div>

          {/* Group 1: Home, Discover, Create */}
          <nav className="w-full space-y-0.5">
            {navGroup1.map(renderNavItem)}
          </nav>

          {/* Section Divider */}
          <div className="my-3 border-t border-[#E7E5E2] dark:border-[#292929]" />

          {/* Group 2: Messages, Calls, Notifications */}
          <nav className="w-full space-y-0.5">
            {navGroup2.map(renderNavItem)}
          </nav>

          {/* Section Divider */}
          <div className="my-3 border-t border-[#E7E5E2] dark:border-[#292929]" />

          {/* Group 3: Profile, Settings */}
          <nav className="w-full space-y-0.5">
            {navGroup3.map(renderNavItem)}
          </nav>
        </div>

        {/* Footer Account Summary */}
        <div className="w-full pt-3 border-t border-[#E7E5E2] dark:border-[#292929] space-y-2">
          <div className="flex items-center justify-between p-2 rounded-[9px] hover:bg-[#F4F3F0] dark:hover:bg-[#1C1C1C] transition-colors duration-150">
            <div
              className="flex items-center gap-2.5 cursor-pointer min-w-0"
              onClick={() => setCurrentTab('profile')}
            >
              <Avatar src={user?.profilePic} name={user?.fullname} size="sm" isOnline={true} />
              <div className="min-w-0">
                <p className="font-semibold text-[13px] truncate text-[#111111] dark:text-[#F5F5F5] leading-tight">
                  {user?.fullname}
                </p>
                <p className="text-[11px] text-[#6B6B6B] dark:text-[#A0A0A0] truncate">
                  @{user?.userId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-[8px] text-[#6B6B6B] hover:text-[#111111] dark:hover:text-[#F5F5F5] hover:bg-[#EFEFEA] dark:hover:bg-[#242424] transition-colors"
                title={isDark ? 'Switch to Light' : 'Switch to Dark'}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4 stroke-[1.75px]" /> : <Moon className="w-4 h-4 stroke-[1.75px]" />}
              </button>

              <button
                onClick={logout}
                className="p-1.5 rounded-[8px] text-[#6B6B6B] hover:text-[#D64545] dark:hover:text-[#E05252] hover:bg-[#D64545]/10 transition-colors"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4 stroke-[1.75px]" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Canvas */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Mobile Top Header (h-52px) */}
        <div className="md:hidden h-[52px] border-b border-[#E7E5E2] dark:border-[#292929] flex items-center justify-between px-4 sticky top-0 bg-[#FAFAF8]/95 dark:bg-[#0D0D0D]/95 backdrop-blur-md z-30">
          <BrandLockup
            size="sm"
            showSubtitle={false}
            onClick={() => setCurrentTab('feed')}
          />

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 text-[#6B6B6B] dark:text-[#A0A0A0] hover:text-[#111111] dark:hover:text-white"
              title="Toggle Theme"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 stroke-[1.75px]" /> : <Moon className="w-4 h-4 stroke-[1.75px]" />}
            </button>
            <button
              onClick={() => setCurrentTab('chat')}
              className="p-2 text-[#6B6B6B] dark:text-[#A0A0A0] hover:text-[#111111] dark:hover:text-white relative"
              title="Direct Messages"
              aria-label="Messages"
            >
              <MessageCircle className="w-5 h-5 stroke-[1.75px]" />
            </button>
          </div>
        </div>

        {/* Dynamic Page Container */}
        <div
          className={`flex-1 w-full mx-auto pb-16 md:pb-6 ${
            currentTab === 'chat'
              ? 'max-w-6xl p-2 sm:p-4 h-[calc(100vh-52px)] md:h-screen'
              : currentTab === 'settings'
              ? 'max-w-2xl px-4 py-6'
              : 'max-w-[620px] border-x-0 md:border-x border-[#E7E5E2] dark:border-[#292929] min-h-screen bg-[#FFFFFF] dark:bg-[#0D0D0D]'
          }`}
        >
          {children}
        </div>
      </main>

      {/* 3. Optional Contextual Right Rail (Rendered ONLY on Home & Discover) */}
      {showRightRail && (
        <aside className="hidden lg:block w-[320px] h-screen sticky top-0 p-5 overflow-y-auto shrink-0 select-none space-y-5 border-l border-[#E7E5E2] dark:border-[#292929] bg-[#FAFAF8] dark:bg-[#0D0D0D]">
          {/* Quick Search Trigger */}
          <div
            onClick={() => setCurrentTab('discover')}
            className="flex items-center gap-3 px-3.5 py-2 rounded-[9px] bg-[#F4F3F0] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] hover:border-[#111111]/30 dark:hover:border-[#F5F5F5]/30 cursor-pointer transition-colors text-[#929292] dark:text-[#707070] text-[13px]"
          >
            <Search className="w-4 h-4 stroke-[1.75px]" />
            <span>Search people and topics...</span>
          </div>

          {/* People to Discover */}
          <div className="rounded-[12px] border border-[#E7E5E2] dark:border-[#292929] p-4 space-y-3.5 bg-[#FFFFFF] dark:bg-[#151515]">
            <h3 className="font-semibold text-[14px] text-[#111111] dark:text-[#F5F5F5]">
              People to discover
            </h3>

            <div className="space-y-3">
              {recommendedUsers.length === 0 ? (
                <p className="text-[12px] text-[#929292] dark:text-[#707070] py-1">
                  No new suggestions available
                </p>
              ) : (
                recommendedUsers.map((recUser) => {
                  const isFollowing = followingMap[recUser._id];
                  const online = isUserOnline(recUser._id);

                  return (
                    <div key={recUser._id} className="flex items-center justify-between gap-2">
                      <div
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                        onClick={() => setCurrentTab('profile')}
                      >
                        <Avatar
                          src={recUser.profilePic}
                          name={recUser.fullname}
                          size="sm"
                          isOnline={online}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[13px] truncate text-[#111111] dark:text-[#F5F5F5] group-hover:underline">
                            {recUser.fullname}
                          </p>
                          <p className="text-[11px] text-[#6B6B6B] dark:text-[#A0A0A0] truncate">
                            @{recUser.userId}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="follow"
                        size="xs"
                        isFollowing={isFollowing}
                        onClick={() => handleToggleFollow(recUser._id)}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Trending Topics */}
          <div className="rounded-[12px] border border-[#E7E5E2] dark:border-[#292929] p-4 space-y-3 bg-[#FFFFFF] dark:bg-[#151515]">
            <h3 className="font-semibold text-[14px] text-[#111111] dark:text-[#F5F5F5] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#FF5C35] dark:text-[#FF6845] stroke-[1.75px]" />
              <span>Trending Topics</span>
            </h3>

            <div className="space-y-2 text-[13px]">
              {trendingTags.length === 0 ? (
                <p className="text-[12px] text-[#929292] dark:text-[#707070]">
                  No trending topics yet
                </p>
              ) : (
                trendingTags.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentTab('discover')}
                    className="cursor-pointer hover:bg-[#F4F3F0] dark:hover:bg-[#1C1C1C] -mx-2 p-2 rounded-[8px] transition-colors"
                  >
                    <p className="font-medium text-[#111111] dark:text-[#F5F5F5]">
                      {item.tag}
                    </p>
                    <p className="text-[11px] text-[#929292] dark:text-[#707070]">{item.count}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Minimal Editorial Footer */}
          <footer className="px-1 text-[11px] text-[#929292] dark:text-[#707070] space-y-1">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <a href="#" className="hover:underline">Privacy</a>
              <a href="#" className="hover:underline">Terms</a>
              <a href="#" className="hover:underline">Security</a>
              <a href="#" className="hover:underline">About</a>
            </div>
            <p>© 2026 ShiftAura Social Communication Platform</p>
          </footer>
        </aside>
      )}

      {/* 4. Mobile Bottom Navigation Bar (5 items max, h-56px, min 44px touch targets) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[56px] bg-[#FAFAF8]/95 dark:bg-[#0D0D0D]/95 backdrop-blur-md border-t border-[#E7E5E2] dark:border-[#292929] flex items-center justify-around px-2 z-30">
        {[
          { id: 'feed', icon: House, label: 'Home' },
          { id: 'discover', icon: Compass, label: 'Discover' },
          { id: 'create', icon: Plus, label: 'Create', isAction: true },
          { id: 'notifications', icon: Bell, label: 'Activity', badge: unreadNotifs },
          { id: 'profile', icon: UserIcon, label: 'Profile', isAvatar: true },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isAction) {
                  onOpenComposer();
                } else {
                  setCurrentTab(item.id);
                }
              }}
              className="min-h-[44px] min-w-[44px] relative flex items-center justify-center text-[#6B6B6B] dark:text-[#A0A0A0]"
              title={item.label}
              aria-label={item.label}
            >
              {item.isAvatar ? (
                <Avatar
                  src={user?.profilePic}
                  name={user?.fullname}
                  size="xs"
                  className={isActive ? 'ring-1 ring-[#FF5C35] dark:ring-[#FF6845]' : ''}
                />
              ) : (
                <Icon
                  className={`w-[22px] h-[22px] stroke-[1.75px] ${
                    isActive ? 'text-[#FF5C35] dark:text-[#FF6845] stroke-[2.2px]' : ''
                  }`}
                />
              )}

              {Boolean(item.badge && item.badge > 0) && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF5C35] dark:bg-[#FF6845]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
