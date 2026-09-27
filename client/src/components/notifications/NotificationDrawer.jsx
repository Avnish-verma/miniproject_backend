import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import {
  Heart,
  MessageCircle,
  UserPlus,
  PhoneIncoming,
  CheckCheck,
  Bell,
  Loader2,
} from 'lucide-react';

export default function NotificationDrawer() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/api/v1/notifications');
      if (res.data?.data) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/v1/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const handleToggleFollow = async (senderId) => {
    try {
      const res = await api.post(`/api/v1/social/follow/${senderId}`);
      setFollowingMap((prev) => ({
        ...prev,
        [senderId]: res.data?.data?.isFollowing,
      }));
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LIKE':
        return (
          <div className="w-6 h-6 rounded-full bg-[#D64545]/10 text-[#D64545] dark:text-[#E05252] flex items-center justify-center shrink-0">
            <Heart className="w-3.5 h-3.5 fill-current stroke-none" />
          </div>
        );
      case 'COMMENT':
        return (
          <div className="w-6 h-6 rounded-full bg-[#FF5C35]/10 text-[#FF5C35] dark:text-[#FF6845] flex items-center justify-center shrink-0">
            <MessageCircle className="w-3.5 h-3.5 stroke-[1.75px]" />
          </div>
        );
      case 'FOLLOW':
        return (
          <div className="w-6 h-6 rounded-full bg-[#16845B]/10 text-[#16845B] dark:text-[#38A878] flex items-center justify-center shrink-0">
            <UserPlus className="w-3.5 h-3.5 stroke-[1.75px]" />
          </div>
        );
      case 'CALL_MISSED':
        return (
          <div className="w-6 h-6 rounded-full bg-[#D64545]/10 text-[#D64545] dark:text-[#E05252] flex items-center justify-center shrink-0">
            <PhoneIncoming className="w-3.5 h-3.5 stroke-[1.75px]" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-[#F4F3F0] dark:bg-[#1C1C1C] text-[#6B6B6B] dark:text-[#A0A0A0] flex items-center justify-center shrink-0">
            <Bell className="w-3.5 h-3.5 stroke-[1.75px]" />
          </div>
        );
    }
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return `${diffSec}s`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full bg-[#FFFFFF] dark:bg-[#0D0D0D] pb-12">
      {/* Header */}
      <div className="sticky top-0 bg-[#FFFFFF]/90 dark:bg-[#0D0D0D]/90 backdrop-blur-md border-b border-[#E7E5E2] dark:border-[#292929] px-4 py-3.5 flex items-center justify-between z-20">
        <div>
          <h1 className="text-[19px] font-bold text-[#111111] dark:text-[#F5F5F5] tracking-tight">
            Notifications
          </h1>
          <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0]">
            Activity from your connections
          </p>
        </div>

        <Button
          variant="ghost"
          size="xs"
          onClick={handleMarkAllRead}
          leftIcon={CheckCheck}
        >
          Mark read
        </Button>
      </div>

      {/* Notifications Stream */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#929292] dark:text-[#707070] gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#FF5C35] dark:text-[#FF6845]" />
          <span className="text-[13px]">Loading activity...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 px-6 space-y-2">
          <div className="w-12 h-12 rounded-[12px] bg-[#F4F3F0] dark:bg-[#1C1C1C] border border-[#E7E5E2] dark:border-[#292929] flex items-center justify-center mx-auto text-[#6B6B6B] dark:text-[#A0A0A0]">
            <Bell className="w-5 h-5 stroke-[1.75px]" />
          </div>
          <h3 className="font-bold text-[16px] text-[#111111] dark:text-[#F5F5F5]">
            No notifications yet
          </h3>
          <p className="text-[13px] text-[#6B6B6B] dark:text-[#A0A0A0] max-w-xs mx-auto">
            When someone likes your posts, comments, or starts following you, you will see it here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#E7E5E2] dark:divide-[#292929]">
          {notifications.map((notif) => {
            const isFollow = notif.type === 'FOLLOW';
            const isFollowing = followingMap[notif.sender?._id];

            return (
              <div
                key={notif._id}
                className={`p-4 flex items-start gap-3.5 transition-colors duration-150 ${
                  !notif.isRead
                    ? 'bg-[#FF5C35]/[0.03] dark:bg-[#FF6845]/[0.04]'
                    : 'hover:bg-[#FAFAF8]/60 dark:hover:bg-[#121212]/60'
                }`}
              >
                {/* Category Icon */}
                <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={notif.sender?.profilePic}
                      name={notif.sender?.fullname || 'Member'}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] text-[#111111] dark:text-[#F5F5F5] leading-snug">
                        <strong className="font-bold hover:underline cursor-pointer">
                          {notif.sender?.fullname || 'Someone'}
                        </strong>{' '}
                        <span className="text-[#6B6B6B] dark:text-[#A0A0A0]">
                          {notif.type === 'LIKE' && 'liked your post'}
                          {notif.type === 'COMMENT' && 'commented on your post'}
                          {notif.type === 'FOLLOW' && 'started following you'}
                          {notif.type === 'CALL_MISSED' && 'called you'}
                          {notif.text && !['LIKE', 'COMMENT', 'FOLLOW', 'CALL_MISSED'].includes(notif.type) && notif.text}
                        </span>
                      </p>
                      <p className="text-[11px] text-[#929292] dark:text-[#707070] mt-0.5">
                        {formatTimestamp(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action button if follow notification */}
                {isFollow && (
                  <Button
                    variant="follow"
                    size="xs"
                    isFollowing={isFollowing}
                    onClick={() => handleToggleFollow(notif.sender?._id)}
                  />
                )}

                {/* Unread Coral Dot */}
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-[#FF5C35] dark:bg-[#FF6845] mt-2 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
