import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StoryRail({ onOpenCreator, onOpenViewer }) {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStories = async () => {
    try {
      const res = await api.get('/api/v1/stories/feed');
      if (res.data?.data) {
        setStoryGroups(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load stories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  // Check if current user has an active story group
  const myStoryGroup = storyGroups.find(
    (g) => g.user?._id === user?._id || g.user?.userId === user?.userId
  );
  const otherStoryGroups = storyGroups.filter(
    (g) => g.user?._id !== user?._id && g.user?.userId !== user?.userId
  );

  return (
    <div className="w-full border-b border-[#E7E5E2] dark:border-[#292929] bg-[#FFFFFF] dark:bg-[#0D0D0D] py-3.5 px-4 overflow-x-auto scrollbar-none select-none">
      <div className="flex items-center gap-4 min-w-max">
        {/* Your Story / Add Story Button */}
        <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
          <div className="relative">
            <div
              onClick={() => {
                if (myStoryGroup && myStoryGroup.stories.length > 0) {
                  onOpenViewer(myStoryGroup, 0);
                } else {
                  onOpenCreator();
                }
              }}
              className={`p-[2px] rounded-full transition-transform active:scale-95 ${
                myStoryGroup && myStoryGroup.stories.length > 0
                  ? myStoryGroup.hasUnviewed
                    ? 'bg-gradient-to-tr from-[#FF5C35] to-[#FF9066]'
                    : 'bg-[#E7E5E2] dark:bg-[#333333]'
                  : 'bg-transparent'
              }`}
            >
              <div className="p-0.5 bg-[#FFFFFF] dark:bg-[#0D0D0D] rounded-full">
                <Avatar
                  src={user?.profilePic}
                  name={user?.fullname}
                  size="lg"
                  className="group-hover:opacity-90 transition-opacity"
                />
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenCreator();
              }}
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#FF5C35] text-white flex items-center justify-center ring-2 ring-[#FFFFFF] dark:ring-[#0D0D0D] hover:bg-[#e04822] transition-transform active:scale-90"
              title="Add story"
              aria-label="Add story"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5px]" />
            </button>
          </div>
          <span className="text-[11px] font-medium text-[#111111] dark:text-[#F5F5F5] max-w-[68px] truncate">
            {myStoryGroup && myStoryGroup.stories.length > 0 ? 'Your story' : 'Add story'}
          </span>
        </div>

        {/* Stories from following/network */}
        {isLoading ? (
          <div className="flex items-center gap-3 pl-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-col items-center gap-1.5 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-[#F4F3F0] dark:bg-[#1C1C1C]" />
                <div className="w-10 h-2 rounded bg-[#F4F3F0] dark:bg-[#1C1C1C]" />
              </div>
            ))}
          </div>
        ) : (
          otherStoryGroups.map((group, idx) => {
            const hasUnviewed = group.hasUnviewed;
            return (
              <div
                key={group.user?._id || idx}
                onClick={() => onOpenViewer(group, 0)}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <div
                  className={`p-[2.5px] rounded-full transition-transform active:scale-95 ${
                    hasUnviewed
                      ? 'bg-gradient-to-tr from-[#FF5C35] to-[#FF9066]'
                      : 'bg-[#E7E5E2] dark:bg-[#333333]'
                  }`}
                >
                  <div className="p-0.5 bg-[#FFFFFF] dark:bg-[#0D0D0D] rounded-full">
                    <Avatar
                      src={group.user?.profilePic}
                      name={group.user?.fullname}
                      size="lg"
                      className="group-hover:opacity-90 transition-opacity"
                    />
                  </div>
                </div>
                <span className="text-[11px] font-normal text-[#111111] dark:text-[#F5F5F5] max-w-[68px] truncate text-center">
                  {group.user?.fullname?.split(' ')[0] || group.user?.userId}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
