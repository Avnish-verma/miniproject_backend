import React, { useState, useEffect } from 'react';
import { X, Search, MessageCircle, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function FollowListModal({
  isOpen,
  onClose,
  type = 'followers', // 'followers' | 'following'
  userId,
  onSelectUser,
  onStartChat,
}) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingStates, setFollowingStates] = useState({});

  useEffect(() => {
    if (!isOpen || !userId) return;

    setIsLoading(true);
    setSearchQuery('');

    const fetchUsers = async () => {
      try {
        const endpoint = `/api/v1/users/profile/${userId}/${type}`;
        const res = await api.get(endpoint);
        const list = res.data?.data || [];
        setUsers(list);

        // Prepopulate following states if currentUser follows them
        const initialFollowStates = {};
        if (currentUser && currentUser.following) {
          list.forEach((u) => {
            initialFollowStates[u._id] = currentUser.following.includes(u._id);
          });
        }
        setFollowingStates(initialFollowStates);
      } catch (err) {
        console.error(`Failed to load ${type}:`, err);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, userId, type, currentUser]);

  if (!isOpen) return null;

  const handleToggleFollow = async (targetId) => {
    const currentState = Boolean(followingStates[targetId]);
    setFollowingStates((prev) => ({ ...prev, [targetId]: !currentState }));

    try {
      const res = await api.post(`/api/v1/social/follow/${targetId}`);
      if (res.data?.data) {
        setFollowingStates((prev) => ({
          ...prev,
          [targetId]: Boolean(res.data.data.isFollowing),
        }));
      }
    } catch (err) {
      console.error('Toggle follow failed:', err);
      setFollowingStates((prev) => ({ ...prev, [targetId]: currentState }));
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.fullname && u.fullname.toLowerCase().includes(q)) ||
      (u.userId && u.userId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-[#FFFFFF] dark:bg-[#161616] border border-[#E7E5E2] dark:border-[#292929] rounded-[18px] max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E5E2] dark:border-[#292929]">
          <h3 className="font-bold text-[16px] text-[#111111] dark:text-[#F5F5F5] capitalize">
            {type}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#929292] hover:text-[#111111] dark:hover:text-[#F5F5F5] transition-colors"
          >
            <X className="w-5 h-5 stroke-[1.75px]" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#E7E5E2] dark:border-[#292929]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#929292] absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.75px]" />
            <input
              type="text"
              placeholder={`Search ${type}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-[9px] bg-[#FAFAF8] dark:bg-[#0D0D0D] border border-[#E7E5E2] dark:border-[#292929] text-[13px] text-[#111111] dark:text-[#F5F5F5] outline-none focus:border-[#FF5C35]"
            />
          </div>
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E7E5E2]/60 dark:divide-[#292929]/60 p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#929292] gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#FF5C35]" />
              <span className="text-[13px]">Loading {type}...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-[#888888] text-[13px]">
              {searchQuery ? 'No matching users found.' : `No ${type} yet.`}
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelf = currentUser && (currentUser._id === u._id || currentUser.userId === u.userId);
              const isFollowed = Boolean(followingStates[u._id]);

              return (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-3 hover:bg-[#FAFAF8] dark:hover:bg-[#1A1A1A] rounded-[10px] transition-colors"
                >
                  <div
                    onClick={() => {
                      if (onSelectUser) onSelectUser(u.userId || u._id);
                      onClose();
                    }}
                    className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 pr-2"
                  >
                    <Avatar src={u.profilePic} name={u.fullname} size="md" />
                    <div className="truncate">
                      <p className="font-bold text-[14px] text-[#111111] dark:text-[#F5F5F5] truncate leading-tight">
                        {u.fullname}
                      </p>
                      <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] truncate">
                        @{u.userId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isSelf && onStartChat && (
                      <button
                        onClick={() => {
                          onStartChat(u._id);
                          onClose();
                        }}
                        className="p-2 rounded-[8px] bg-[#FAFAF8] dark:bg-[#252525] border border-[#E7E5E2] dark:border-[#333333] hover:text-[#FF5C35] text-[#6B6B6B] dark:text-[#A0A0A0] transition-colors"
                        title="Direct Message"
                        aria-label="Direct Message"
                      >
                        <MessageCircle className="w-4 h-4 stroke-[1.75px]" />
                      </button>
                    )}

                    {!isSelf && (
                      <Button
                        variant={isFollowed ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleFollow(u._id)}
                        className={`text-[12px] h-8 px-3 ${
                          isFollowed ? '' : 'bg-[#FF5C35] hover:bg-[#FF481F]'
                        }`}
                      >
                        {isFollowed ? 'Following' : 'Follow'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
