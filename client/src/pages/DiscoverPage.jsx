import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import {
  Search,
  X,
  TrendingUp,
  Heart,
  MessageCircle,
  Loader2,
  Users,
  Grid,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function DiscoverPage({ onSelectUser, onSelectPost }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'people' | 'trending' | 'media'
  const [userResults, setUserResults] = useState([]);
  const [mediaPosts, setMediaPosts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [followingMap, setFollowingMap] = useState({});
  const { isUserOnline } = useSocket();

  // Search users with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/api/v1/users/search?q=${searchTerm}&limit=20`);
        if (res.data?.data?.users) {
          setUserResults(res.data.data.users);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Load explore media stream
  useEffect(() => {
    const fetchExploreMedia = async () => {
      setIsLoadingMedia(true);
      try {
        const res = await api.get('/api/v1/feed?page=1&limit=24');
        if (res.data?.posts) {
          const withMedia = res.data.posts.filter(
            (p) => (p.media && p.media.length > 0) || p.postUrl
          );
          setMediaPosts(withMedia.length > 0 ? withMedia : res.data.posts);
        }
      } catch (err) {
        console.error('Explore media load failed:', err);
      } finally {
        setIsLoadingMedia(false);
      }
    };

    fetchExploreMedia();
  }, []);

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

  const [trendingTopics, setTrendingTopics] = useState([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await api.get('/api/v1/posts/trending-tags?limit=6');
        if (res.data?.data) {
          setTrendingTopics(res.data.data);
        }
      } catch (err) {
        console.warn('Could not load trending topics:', err);
      }
    };
    fetchTrending();
  }, []);

  return (
    <div className="w-full bg-[#FFFFFF] dark:bg-[#0D0D0D] pb-12">
      {/* Sticky Search Header & Filter Tabs */}
      <div className="sticky top-0 bg-[#FFFFFF]/90 dark:bg-[#0D0D0D]/90 backdrop-blur-md z-20 pt-3 pb-3 px-4 border-b border-[#E7E5E2] dark:border-[#292929] space-y-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[#929292] dark:text-[#707070] stroke-[1.75px] pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search people, hashtags, or topics..."
            className="w-full h-[38px] pl-10 pr-9 rounded-[9px] bg-[#FAFAF8] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] focus:border-[#FF5C35] dark:focus:border-[#FF6845] text-[14px] text-[#111111] dark:text-[#F5F5F5] placeholder-[#929292] dark:placeholder-[#707070] outline-none transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 p-1 rounded-[6px] text-[#929292] hover:text-[#111111] dark:hover:text-[#F5F5F5]"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 stroke-[1.75px]" />
            </button>
          )}
        </div>

        {/* Filter Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[13px]">
          {[
            { id: 'all', label: 'All' },
            { id: 'people', label: 'People', icon: Users },
            { id: 'trending', label: 'Trending', icon: TrendingUp },
            { id: 'media', label: 'Media', icon: Grid },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-[8px] font-medium shrink-0 transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#111111] text-[#FAFAF8] dark:bg-[#F5F5F5] dark:text-[#111111]'
                    : 'bg-[#F4F3F0] dark:bg-[#1C1C1C] text-[#6B6B6B] dark:text-[#A0A0A0] hover:text-[#111111] dark:hover:text-[#F5F5F5]'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 stroke-[1.75px]" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 space-y-6">
        {/* 1. People Discovery Results */}
        {(activeFilter === 'people' || (searchTerm && activeFilter !== 'trending')) && (
          <div className="space-y-3">
            <h3 className="font-bold text-[15px] text-[#111111] dark:text-[#F5F5F5]">
              {searchTerm ? 'Accounts' : 'People to discover'}
            </h3>

            {isSearching ? (
              <div className="flex items-center justify-center py-8 text-[#929292] dark:text-[#707070] gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#FF5C35] dark:text-[#FF6845]" />
                <span className="text-[13px]">Searching accounts...</span>
              </div>
            ) : userResults.length === 0 ? (
              <p className="text-[13px] text-[#6B6B6B] dark:text-[#A0A0A0] py-4 text-center">
                No accounts match &ldquo;{searchTerm}&rdquo;
              </p>
            ) : (
              <div className="divide-y divide-[#E7E5E2] dark:divide-[#292929]">
                {userResults.map((u) => {
                  const isFollowing = followingMap[u._id];
                  const online = isUserOnline(u._id);

                  return (
                    <div
                      key={u._id}
                      className="flex items-center justify-between py-3 gap-3"
                    >
                      <div
                        className="flex items-center gap-3 cursor-pointer min-w-0 group"
                        onClick={() => onSelectUser(u.userId)}
                      >
                        <Avatar
                          src={u.profilePic}
                          name={u.fullname}
                          size="md"
                          isOnline={online}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-[14px] text-[#111111] dark:text-[#F5F5F5] truncate group-hover:underline">
                            {u.fullname}
                          </p>
                          <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] truncate">
                            @{u.userId}
                          </p>
                          {u.bio && (
                            <p className="text-[12px] text-[#111111] dark:text-[#F5F5F5] truncate mt-0.5 max-w-sm">
                              {u.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="follow"
                        size="xs"
                        isFollowing={isFollowing}
                        onClick={() => handleToggleFollow(u._id)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. Trending Topics Section */}
        {(!searchTerm || activeFilter === 'trending') &&
          (activeFilter === 'all' || activeFilter === 'trending') && (
            <div className="space-y-3">
              <h3 className="font-bold text-[15px] text-[#111111] dark:text-[#F5F5F5] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FF5C35] dark:text-[#FF6845] stroke-[1.75px]" />
                <span>Trending Topics</span>
              </h3>

              <div className="rounded-[12px] border border-[#E7E5E2] dark:border-[#292929] divide-y divide-[#E7E5E2] dark:divide-[#292929] bg-[#FAFAF8] dark:bg-[#151515] overflow-hidden">
                {trendingTopics.length === 0 ? (
                  <div className="p-6 text-center text-[13px] text-[#6B6B6B] dark:text-[#A0A0A0]">
                    No trending topics yet. Use #hashtags in your posts to start a topic.
                  </div>
                ) : (
                  trendingTopics.map((topic, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSearchTerm(topic.tag.replace(/^#/, ''))}
                      className="p-3.5 hover:bg-[#EFEFEA] dark:hover:bg-[#1C1C1C] cursor-pointer transition-colors duration-150"
                    >
                      <p className="text-[11px] text-[#929292] dark:text-[#707070] font-medium">
                        {topic.category || 'Topic'}
                      </p>
                      <p className="font-bold text-[14px] text-[#111111] dark:text-[#F5F5F5] mt-0.5">
                        {topic.tag}
                      </p>
                      <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] mt-0.5">
                        {topic.count}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        {/* 3. Popular Media Stream (3-Column Asymmetric Grid) */}
        {(!searchTerm || activeFilter === 'media') &&
          (activeFilter === 'all' || activeFilter === 'media') && (
            <div className="space-y-3">
              <h3 className="font-bold text-[15px] text-[#111111] dark:text-[#F5F5F5] flex items-center gap-2">
                <Grid className="w-4 h-4 text-[#6B6B6B] dark:text-[#A0A0A0] stroke-[1.75px]" />
                <span>Popular Media</span>
              </h3>

              {isLoadingMedia ? (
                <div className="flex items-center justify-center py-12 text-[#929292] dark:text-[#707070] gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF5C35] dark:text-[#FF6845]" />
                  <span className="text-[13px]">Loading media...</span>
                </div>
              ) : mediaPosts.length === 0 ? (
                <p className="text-[13px] text-[#6B6B6B] dark:text-[#A0A0A0] py-6 text-center">
                  No media posts available
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {mediaPosts.map((post) => {
                    const mediaItem = post.media && post.media.length > 0 ? post.media[0] : null;
                    const imgUrl = mediaItem ? mediaItem.url : post.postUrl;

                    return (
                      <div
                        key={post._id}
                        onClick={() => onSelectPost && onSelectPost(post._id)}
                        className="relative aspect-square bg-[#F4F3F0] dark:bg-[#151515] rounded-[8px] overflow-hidden group cursor-pointer"
                      >
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={post.caption || 'Media item'}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full p-2.5 flex items-center justify-center text-center text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0]">
                            <p className="line-clamp-3 leading-snug">{post.caption}</p>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-[12px] font-bold">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 fill-white stroke-none" />
                            <span>{post.likesCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5 fill-white stroke-none" />
                            <span>{post.commentsCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
