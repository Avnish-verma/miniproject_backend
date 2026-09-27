import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../context/CallContext';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import PostCard from '../components/feed/PostCard';
import api from '../services/api';
import {
  Camera,
  Edit3,
  MessageCircle,
  Phone,
  Video,
  Grid,
  List,
  Calendar,
  CheckCircle2,
  Heart,
  Loader2,
  X,
} from 'lucide-react';

export default function ProfilePage({ targetUserId, onSelectPost, onStartChat }) {
  const { user: currentUser, updateUser } = useAuth();
  const { isUserOnline } = useSocket();
  const { startCall } = useCall();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [mediaPosts, setMediaPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'media' | 'saved'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'feed'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit form state
  const [fullname, setFullname] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editError, setEditError] = useState('');

  const identifier = targetUserId || currentUser?.userId;

  const fetchProfile = async () => {
    if (!identifier) return;
    setIsLoading(true);
    try {
      const [profileRes, postsRes] = await Promise.all([
        api.get(`/api/v1/users/profile/${identifier}`),
        api.get(`/api/v1/posts/user/${identifier}`),
      ]);

      if (profileRes.data?.data) {
        const u = profileRes.data.data;
        setProfile(u);
        setIsFollowing(Boolean(u.isFollowing));
        setFullname(u.fullname || '');
        setBio(u.bio || '');
        setGender(u.gender || 'Prefer not to say');
      }

      if (postsRes.data?.data) {
        setPosts(postsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostDeleted = (id) => {
    setPosts((prev) => prev.filter((p) => p._id !== id));
    setMediaPosts((prev) => prev.filter((p) => p._id !== id));
    setSavedPosts((prev) => prev.filter((p) => p._id !== id));
    setProfile((prev) => ({
      ...prev,
      postsCount: Math.max(0, (prev.postsCount || 1) - 1),
    }));
  };

  useEffect(() => {
    fetchProfile();
  }, [identifier]);

  // Fetch tab-specific data when activeTab changes
  useEffect(() => {
    if (!profile) return;

    if (activeTab === 'media' && mediaPosts.length === 0) {
      const fetchMedia = async () => {
        setIsLoadingTab(true);
        try {
          const res = await api.get(`/api/v1/posts/user/${identifier}/media`);
          if (res.data?.data) {
            setMediaPosts(res.data.data);
          }
        } catch (err) {
          console.error('Failed to load media posts:', err);
        } finally {
          setIsLoadingTab(false);
        }
      };
      fetchMedia();
    } else if (activeTab === 'saved') {
      const isSelfCheck = profile.isSelf || currentUser?._id === profile._id;
      if (!isSelfCheck) {
        setActiveTab('posts');
        return;
      }
      if (savedPosts.length === 0) {
        const fetchSaved = async () => {
          setIsLoadingTab(true);
          try {
            const res = await api.get('/api/v1/posts/saved');
            if (res.data?.data) {
              setSavedPosts(res.data.data);
            }
          } catch (err) {
            console.error('Failed to load saved posts:', err);
          } finally {
            setIsLoadingTab(false);
          }
        };
        fetchSaved();
      }
    }
  }, [activeTab, identifier, profile]);

  const handleToggleFollow = async () => {
    if (!profile) return;
    try {
      const res = await api.post(`/api/v1/social/follow/${profile._id}`);
      const nextFollowing = Boolean(res.data?.data?.isFollowing);
      setIsFollowing(nextFollowing);
      setProfile((prev) => ({
        ...prev,
        followersCount: nextFollowing
          ? prev.followersCount + 1
          : Math.max(0, prev.followersCount - 1),
      }));
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUpdatingAvatar(true);
    try {
      const signRes = await api.get('/api/v1/media/upload-avatar');
      const { uploadUrl, apiKey, timestamp, signature, folder, public_id } = signRes.data.data;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);
      formData.append('public_id', public_id);

      const cloudRes = await fetch(uploadUrl, { method: 'POST', body: formData });
      const cloudData = await cloudRes.json();

      if (cloudData.secure_url) {
        const updateRes = await api.put('/api/v1/users/avatar', {
          url: cloudData.secure_url,
          public_id: cloudData.public_id,
        });

        if (updateRes.data?.data) {
          updateUser(updateRes.data.data);
          setProfile((prev) => ({ ...prev, profilePic: cloudData.secure_url }));
        }
      }
    } catch (err) {
      console.error('Avatar update failed:', err);
      alert('Could not update avatar.');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setEditError('');
    try {
      const finalFullname = fullname.trim() || profile?.fullname || currentUser?.fullname || 'ShiftAura Member';
      const res = await api.put('/api/v1/users/profile', {
        fullname: finalFullname,
        bio: bio.trim(),
        gender: gender || profile?.gender || 'Prefer not to say',
      });

      if (res.data?.data) {
        updateUser(res.data.data);
        setProfile((prev) => ({
          ...prev,
          fullname: res.data.data.fullname,
          bio: res.data.data.bio,
          gender: res.data.data.gender,
        }));
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      setEditError(err.response?.data?.error?.message || 'Failed to save profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#929292] dark:text-[#707070] gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#FF5C35] dark:text-[#FF6845]" />
        <span className="text-[13px]">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-[#6B6B6B] dark:text-[#A0A0A0] text-[14px]">
        Profile not found or inaccessible.
      </div>
    );
  }

  const isSelf = Boolean(
    profile.isSelf ||
      (currentUser && (currentUser._id === profile._id || currentUser.userId === profile.userId))
  );
  const online = isUserOnline(profile._id);

  let displayedPosts = posts;
  let emptyTitle = 'No posts yet';
  let emptySubtitle = 'When posts are published, they will appear here.';

  if (activeTab === 'media') {
    displayedPosts = mediaPosts;
    emptyTitle = 'No media posts';
    emptySubtitle = 'Photos and videos shared by this user will appear here.';
  } else if (activeTab === 'saved') {
    displayedPosts = savedPosts;
    emptyTitle = 'No saved posts yet';
    emptySubtitle = 'Bookmark posts to view them in your private library.';
  }

  return (
    <div className="w-full bg-[#FFFFFF] dark:bg-[#0D0D0D]">
      {/* 1. Header Banner & Profile Center Stage */}
      <div className="pt-6 sm:pt-8 pb-5 px-4 sm:px-6 text-center border-b border-[#E7E5E2] dark:border-[#292929]">
        {/* Avatar with Camera Trigger */}
        <div className="relative inline-block mx-auto mb-3">
          <Avatar
            src={profile.profilePic}
            name={profile.fullname}
            size="2xl"
            isOnline={online}
            className="ring-2 ring-[#E7E5E2] dark:ring-[#292929]"
          />

          {isSelf && (
            <label
              className="absolute bottom-0 right-0 p-2 rounded-full bg-[#111111]/80 hover:bg-[#111111] dark:bg-[#F5F5F5]/90 dark:hover:bg-[#FFFFFF] text-white dark:text-[#111111] cursor-pointer shadow-md transition-transform active:scale-95"
              title="Update profile picture"
              aria-label="Update profile picture"
            >
              <Camera className="w-4 h-4 stroke-[1.75px]" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* User Identity */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="font-bold text-[22px] sm:text-[24px] text-[#111111] dark:text-[#F5F5F5] tracking-tight">
              {profile.fullname}
            </h1>
            {profile.isEmailVerified && (
              <CheckCircle2 className="w-4 h-4 text-[#FF5C35] dark:text-[#FF6845] fill-current" />
            )}
          </div>
          <p className="text-[13px] text-[#6B6B6B] dark:text-[#A0A0A0] font-normal">
            @{profile.userId}
          </p>

          {profile.bio && (
            <p className="pt-2 text-[14px] text-[#111111] dark:text-[#F5F5F5] leading-relaxed whitespace-pre-line max-w-md mx-auto">
              {profile.bio}
            </p>
          )}

          <div className="flex items-center justify-center gap-1.5 pt-1.5 text-[12px] text-[#929292] dark:text-[#707070]">
            <Calendar className="w-3.5 h-3.5 stroke-[1.75px]" />
            <span>
              Joined {new Date(profile.createdAt || Date.now()).toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Stats Row: Followers, Following, Posts */}
        <div className="flex items-center justify-center gap-8 pt-4 pb-2 text-center select-none">
          <div>
            <p className="font-bold text-[18px] text-[#111111] dark:text-[#F5F5F5] leading-none">
              {profile.followersCount || 0}
            </p>
            <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] mt-1">Followers</p>
          </div>

          <div>
            <p className="font-bold text-[18px] text-[#111111] dark:text-[#F5F5F5] leading-none">
              {profile.followingCount || 0}
            </p>
            <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] mt-1">Following</p>
          </div>

          <div>
            <p className="font-bold text-[18px] text-[#111111] dark:text-[#F5F5F5] leading-none">
              {posts.length}
            </p>
            <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] mt-1">Posts</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-2 pt-3">
          {isSelf ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (profile) {
                  setFullname(profile.fullname || '');
                  setBio(profile.bio || '');
                  setGender(profile.gender || 'Prefer not to say');
                }
                setEditError('');
                setIsEditModalOpen(true);
              }}
              leftIcon={Edit3}
            >
              Edit profile
            </Button>
          ) : (
            <>
              <Button
                variant="follow"
                size="sm"
                isFollowing={isFollowing}
                onClick={handleToggleFollow}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => onStartChat && onStartChat(profile._id || profile.userId)}
                leftIcon={MessageCircle}
                title="Send Message"
              >
                Message
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  startCall({
                    recipientId: profile._id,
                    recipientUser: profile,
                    type: 'audio',
                  })
                }
                title="Voice Call"
                aria-label="Start voice call"
              >
                <Phone className="w-4 h-4 stroke-[1.75px]" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  startCall({
                    recipientId: profile._id,
                    recipientUser: profile,
                    type: 'video',
                  })
                }
                title="Video Call"
                aria-label="Start video call"
              >
                <Video className="w-4 h-4 stroke-[1.75px]" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 2. Profile Segmented Tabs */}
      <div className="flex items-center justify-between border-b border-[#E7E5E2] dark:border-[#292929] px-4 select-none bg-[#FAFAF8]/50 dark:bg-[#0D0D0D]/50">
        <div className="flex items-center">
          {[
            { id: 'posts', label: 'Posts' },
            { id: 'media', label: 'Media' },
            ...(isSelf ? [{ id: 'saved', label: 'Saved' }] : []),
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-semibold text-[13px] relative transition-colors ${
                  isActive
                    ? 'text-[#111111] dark:text-[#F5F5F5]'
                    : 'text-[#6B6B6B] dark:text-[#A0A0A0] hover:text-[#111111] dark:hover:text-[#F5F5F5]'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF5C35] dark:bg-[#FF6845]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Grid vs Feed View Mode Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-[6px] transition-colors ${
              viewMode === 'grid'
                ? 'text-[#111111] dark:text-[#F5F5F5] bg-[#EFEFEA] dark:bg-[#1C1C1C]'
                : 'text-[#929292] hover:text-[#111111] dark:hover:text-[#F5F5F5]'
            }`}
            title="Grid view"
            aria-label="Grid view"
          >
            <Grid className="w-4 h-4 stroke-[1.75px]" />
          </button>
          <button
            onClick={() => setViewMode('feed')}
            className={`p-1.5 rounded-[6px] transition-colors ${
              viewMode === 'feed'
                ? 'text-[#111111] dark:text-[#F5F5F5] bg-[#EFEFEA] dark:bg-[#1C1C1C]'
                : 'text-[#929292] hover:text-[#111111] dark:hover:text-[#F5F5F5]'
            }`}
            title="Timeline view"
            aria-label="Timeline view"
          >
            <List className="w-4 h-4 stroke-[1.75px]" />
          </button>
        </div>
      </div>

      {/* 3. Content Display */}
      {isLoadingTab ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#929292] dark:text-[#707070] gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#FF5C35] dark:text-[#FF6845]" />
          <span className="text-[13px]">Loading {activeTab}...</span>
        </div>
      ) : displayedPosts.length === 0 ? (
        <div className="text-center py-20 text-[#6B6B6B] dark:text-[#A0A0A0] text-[13px] space-y-1">
          <p className="font-semibold text-[#111111] dark:text-[#F5F5F5]">{emptyTitle}</p>
          <p className="text-[12px]">{emptySubtitle}</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* 3-Column Asymmetric Media Grid */
        <div className="grid grid-cols-3 gap-0.5 sm:gap-1 p-0.5 sm:p-1">
          {displayedPosts.map((post) => {
            const mediaItem = post.media && post.media.length > 0 ? post.media[0] : null;
            const imgUrl = mediaItem ? mediaItem.url : post.postUrl;

            return (
              <div
                key={post._id}
                onClick={() => {
                  if (onSelectPost) {
                    onSelectPost(post._id);
                  } else {
                    setViewMode('feed');
                  }
                }}
                className="relative aspect-square bg-[#F4F3F0] dark:bg-[#151515] overflow-hidden group cursor-pointer"
              >
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={post.caption || 'Post media'}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full p-3 flex items-center justify-center text-center text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] bg-[#F4F3F0] dark:bg-[#151515]">
                    <p className="line-clamp-4 leading-snug">{post.caption}</p>
                  </div>
                )}

                {/* Hover Metrics Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-[13px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 fill-white stroke-none" />
                    <span>{post.likesCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 fill-white stroke-none" />
                    <span>{post.commentsCount || 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Continuous Timeline Stream */
        <div>
          {displayedPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onDeletePost={handlePostDeleted}
            />
          ))}
        </div>
      )}

      {/* 4. Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] rounded-[14px] p-5 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E2] dark:border-[#292929]">
              <h3 className="font-bold text-[16px] text-[#111111] dark:text-[#F5F5F5]">
                Edit Profile
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-[6px] text-[#929292] hover:text-[#111111] dark:hover:text-[#F5F5F5]"
                aria-label="Close"
              >
                <X className="w-5 h-5 stroke-[1.75px]" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-[13px]">
              <div>
                <label className="block text-[#111111] dark:text-[#F5F5F5] font-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full h-[40px] px-3.5 rounded-[9px] bg-[#FAFAF8] dark:bg-[#0D0D0D] border border-[#E7E5E2] dark:border-[#292929] focus:border-[#FF5C35] dark:focus:border-[#FF6845] text-[14px] text-[#111111] dark:text-[#F5F5F5] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[#111111] dark:text-[#F5F5F5] font-medium mb-1">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Share a bit about yourself..."
                  className="w-full p-3 rounded-[9px] bg-[#FAFAF8] dark:bg-[#0D0D0D] border border-[#E7E5E2] dark:border-[#292929] focus:border-[#FF5C35] dark:focus:border-[#FF6845] text-[14px] text-[#111111] dark:text-[#F5F5F5] outline-none resize-none"
                />
              </div>

              {editError && (
                <div className="text-[12px] text-red-500 font-medium px-1">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  size="sm"
                  isLoading={isSavingProfile}
                >
                  Save changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
