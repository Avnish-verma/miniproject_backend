import React, { useState, useEffect } from 'react';
import PostCard from '../components/feed/PostCard';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import StoryRail from '../components/stories/StoryRail';
import StoryViewerModal from '../components/stories/StoryViewerModal';
import StoryCreatorModal from '../components/stories/StoryCreatorModal';
import { useAuth } from '../context/AuthContext';
import { Image, Video, Sparkles, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function FeedPage({
  onOpenComposer,
  focusedPostId,
  onClearFocusedPost,
  onSelectUser,
  newPost,
}) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('for_you'); // 'for_you' | 'following'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Prepend newly created post immediately
  useEffect(() => {
    if (newPost) {
      setPosts((prev) => [newPost, ...prev.filter((p) => p._id !== newPost._id)]);
    }
  }, [newPost]);

  // Story modals & state
  const [storyRefreshKey, setStoryRefreshKey] = useState(0);
  const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState(false);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  const fetchFeed = async (pageNumber = 1, currentTabType = activeTab) => {
    try {
      if (pageNumber === 1) setIsLoading(true);
      const res = await api.get(
        `/api/v1/feed?type=${currentTabType}&page=${pageNumber}&limit=10`
      );
      if (res.data?.posts) {
        if (pageNumber === 1) {
          setPosts(res.data.posts);
        } else {
          setPosts((prev) => [...prev, ...res.data.posts]);
        }
        setHasMore(res.data.posts.length === 10);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchFeed(1, activeTab);
  }, [activeTab]);

  // Focus and scroll to post when focusedPostId is passed
  useEffect(() => {
    if (!focusedPostId) return;

    const existingPost = posts.find((p) => p._id === focusedPostId);
    if (existingPost) {
      const el = document.getElementById(`post-${focusedPostId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // Post not currently in fetched page; fetch directly and prepend to preserve continuous feed
      const fetchFocusedPost = async () => {
        try {
          const res = await api.get(`/api/v1/posts/${focusedPostId}`);
          if (res.data?.data) {
            setPosts((prev) => [
              res.data.data,
              ...prev.filter((p) => p._id !== focusedPostId),
            ]);
            setTimeout(() => {
              const el = document.getElementById(`post-${focusedPostId}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 100);
          }
        } catch (err) {
          console.error('Failed to load focused post:', err);
        }
      };
      fetchFocusedPost();
    }
  }, [focusedPostId]);

  const handlePostDeleted = (deletedPostId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedPostId));
  };

  return (
    <div className="w-full bg-[#FFFFFF] dark:bg-[#0D0D0D]">
      {/* Sticky Feed Header Tabs */}
      <div className="sticky top-0 bg-[#FFFFFF]/90 dark:bg-[#0D0D0D]/90 backdrop-blur-md border-b border-[#E7E5E2] dark:border-[#292929] flex items-center z-20">
        <button
          onClick={() => setActiveTab('for_you')}
          className={`flex-1 py-3.5 text-center text-[14px] relative transition-colors duration-150 ${
            activeTab === 'for_you'
              ? 'font-bold text-[#111111] dark:text-[#F5F5F5]'
              : 'font-medium text-[#6B6B6B] dark:text-[#A0A0A0] hover:text-[#111111] dark:hover:text-[#F5F5F5]'
          }`}
        >
          For you
          {activeTab === 'for_you' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] bg-[#FF5C35] dark:bg-[#FF6845] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('following')}
          className={`flex-1 py-3.5 text-center text-[14px] relative transition-colors duration-150 ${
            activeTab === 'following'
              ? 'font-bold text-[#111111] dark:text-[#F5F5F5]'
              : 'font-medium text-[#6B6B6B] dark:text-[#A0A0A0] hover:text-[#111111] dark:hover:text-[#F5F5F5]'
          }`}
        >
          Following
          {activeTab === 'following' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] bg-[#FF5C35] dark:bg-[#FF6845] rounded-full" />
          )}
        </button>
      </div>

      {/* 24-Hour Stories Rail */}
      <StoryRail
        key={storyRefreshKey}
        onOpenCreator={() => setIsStoryCreatorOpen(true)}
        onOpenViewer={(group, index) => {
          setSelectedStoryGroup(group);
          setViewerIndex(index || 0);
          setIsStoryViewerOpen(true);
        }}
      />

      {/* Quick Compose Input Box */}
      <div
        onClick={onOpenComposer}
        className="hidden sm:flex gap-3.5 p-4 border-b border-[#E7E5E2] dark:border-[#292929] cursor-pointer hover:bg-[#F4F3F0]/40 dark:hover:bg-[#151515] transition-colors duration-150"
      >
        <Avatar src={user?.profilePic} name={user?.fullname} size="md" />
        <div className="flex-1 min-w-0">
          <div className="py-2 text-[15px] text-[#929292] dark:text-[#707070] select-none">
            What's happening?
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-[#E7E5E2]/60 dark:border-[#292929]/60">
            <div className="flex items-center gap-1 text-[#6B6B6B] dark:text-[#A0A0A0]">
              <div className="p-1.5 rounded-[8px] hover:text-[#FF5C35] dark:hover:text-[#FF6845] hover:bg-[#FF5C35]/10 transition-colors">
                <Image className="w-4 h-4 stroke-[1.75px]" />
              </div>
              <div className="p-1.5 rounded-[8px] hover:text-[#FF5C35] dark:hover:text-[#FF6845] hover:bg-[#FF5C35]/10 transition-colors">
                <Video className="w-4 h-4 stroke-[1.75px]" />
              </div>
            </div>
            <Button size="xs" variant="accent">
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* Continuous Timeline Stream */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#929292] dark:text-[#707070] gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#FF5C35] dark:text-[#FF6845]" />
          <p className="text-[13px]">Loading timeline...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 px-6 space-y-3">
          <div className="w-12 h-12 rounded-[12px] bg-[#F4F3F0] dark:bg-[#1C1C1C] border border-[#E7E5E2] dark:border-[#292929] flex items-center justify-center mx-auto text-[#6B6B6B] dark:text-[#A0A0A0]">
            <Sparkles className="w-5 h-5 stroke-[1.75px]" />
          </div>
          <h3 className="font-bold text-[16px] text-[#111111] dark:text-[#F5F5F5]">
            {activeTab === 'following'
              ? 'No updates from people you follow'
              : 'Welcome to your timeline'}
          </h3>
          <p className="text-[13px] text-[#6B6B6B] dark:text-[#A0A0A0] max-w-sm mx-auto leading-relaxed">
            {activeTab === 'following'
              ? 'Follow creators or explore the "For you" feed to discover real posts.'
              : 'Follow accounts or share your first post to start seeing updates in real time.'}
          </p>
          <div className="pt-2">
            <Button onClick={onOpenComposer} variant="accent" size="sm">
              Create First Post
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              isFocused={post._id === focusedPostId}
              onDeletePost={handlePostDeleted}
              onSelectUser={onSelectUser}
            />
          ))}

          {hasMore && (
            <div className="text-center py-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchFeed(nextPage, activeTab);
                }}
              >
                Load more posts
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Story Viewer Modal */}
      <StoryViewerModal
        isOpen={isStoryViewerOpen}
        onClose={() => setIsStoryViewerOpen(false)}
        storyGroup={selectedStoryGroup}
        initialIndex={viewerIndex}
        onStoryDeleted={() => setStoryRefreshKey((k) => k + 1)}
      />

      {/* Story Creator Modal */}
      <StoryCreatorModal
        isOpen={isStoryCreatorOpen}
        onClose={() => setIsStoryCreatorOpen(false)}
        onStoryCreated={() => setStoryRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
