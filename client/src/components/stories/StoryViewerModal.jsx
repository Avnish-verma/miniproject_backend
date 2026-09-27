import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Trash2, Loader2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StoryViewerModal({ isOpen, onClose, storyGroup, initialIndex = 0, onStoryDeleted }) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [showViewers, setShowViewers] = useState(false);
  const [isLoadingViewers, setIsLoadingViewers] = useState(false);

  const progressIntervalRef = useRef(null);
  const videoRef = useRef(null);

  const stories = storyGroup?.stories || [];
  const currentStory = stories[currentIndex];
  const isOwnStory = storyGroup?.user?._id === user?._id || storyGroup?.user?.userId === user?.userId;

  const isVideoStory =
    currentStory?.mediaType === 'video' ||
    (currentStory?.mediaUrl &&
      (currentStory.mediaUrl.endsWith('.mp4') ||
        currentStory.mediaUrl.endsWith('.webm') ||
        currentStory.mediaUrl.includes('/video/')));

  // Reset index when story group changes
  useEffect(() => {
    setCurrentIndex(initialIndex || 0);
    setProgress(0);
    setShowViewers(false);
  }, [storyGroup, initialIndex]);

  // Pause/play video when isPaused or showViewers changes
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused || showViewers) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, showViewers, currentIndex]);

  // Mark story viewed & load viewers if own story
  useEffect(() => {
    if (!isOpen || !currentStory) return;

    setProgress(0);

    // Stop any previously playing video
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }

    // Record view if not own story
    if (!isOwnStory && !currentStory.viewedByCurrentUser) {
      api.post(`/api/v1/stories/${currentStory._id}/view`).catch((err) => {
        console.error('Failed to record story view:', err);
      });
    }

    // If own story, fetch viewers
    if (isOwnStory) {
      const loadViewers = async () => {
        setIsLoadingViewers(true);
        try {
          const res = await api.get(`/api/v1/stories/${currentStory._id}/viewers`);
          if (res.data?.data) {
            setViewers(res.data.data);
          }
        } catch (err) {
          console.error('Failed to load story viewers:', err);
        } finally {
          setIsLoadingViewers(false);
        }
      };
      loadViewers();
    }
  }, [isOpen, currentStory?._id, isOwnStory]);

  // Progress timer for photo and text stories (video uses its own timeupdate)
  useEffect(() => {
    if (!isOpen || isPaused || showViewers || isVideoStory) return;

    const intervalTime = 50; // ms
    const increment = (intervalTime / 5000) * 100; // 5000ms duration

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(progressIntervalRef.current);
  }, [isOpen, currentIndex, isPaused, showViewers, stories.length, isVideoStory]);

  if (!isOpen || !storyGroup || stories.length === 0 || !currentStory) {
    return null;
  }

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this story?')) return;
    try {
      await api.delete(`/api/v1/stories/${currentStory._id}`);
      if (onStoryDeleted) onStoryDeleted(currentStory._id);
      if (stories.length > 1) {
        handleNext();
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Failed to delete story:', err);
      alert('Could not delete story.');
    }
  };

  const author = storyGroup.user;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 select-none">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container */}
      <div
        className="relative w-full h-full sm:h-[90vh] sm:max-w-[420px] bg-[#111111] sm:rounded-[18px] overflow-hidden flex flex-col shadow-2xl z-10"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Segmented Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {stories.map((s, idx) => {
            let width = '0%';
            if (idx < currentIndex) width = '100%';
            else if (idx === currentIndex) width = `${Math.min(100, progress)}%`;

            return (
              <div
                key={s._id || idx}
                className="h-[2.5px] flex-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{ width }}
                />
              </div>
            );
          })}
        </div>

        {/* Header: Author Info & Controls */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <Avatar src={author?.profilePic} name={author?.fullname} size="sm" />
            <div>
              <p className="text-[13px] font-bold leading-tight drop-shadow-sm">
                {author?.fullname || author?.userId}
              </p>
              <p className="text-[10px] text-white/80 drop-shadow-sm">
                {new Date(currentStory.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwnStory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                title="Delete story"
                aria-label="Delete story"
              >
                <Trash2 className="w-4 h-4 stroke-[1.75px]" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              aria-label="Close story"
            >
              <X className="w-5 h-5 stroke-[1.75px]" />
            </button>
          </div>
        </div>

        {/* Story Content Stage */}
        <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
          {currentStory.mediaUrl ? (
            <div className="relative w-full h-full bg-black flex items-center justify-center">
              {isVideoStory ? (
                <video
                  ref={videoRef}
                  src={currentStory.mediaUrl}
                  autoPlay
                  playsInline
                  onTimeUpdate={(e) => {
                    if (e.target.duration) {
                      setProgress((e.target.currentTime / e.target.duration) * 100);
                    }
                  }}
                  onEnded={handleNext}
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={currentStory.mediaUrl}
                  alt="Story content"
                  className="w-full h-full object-cover"
                />
              )}
              {currentStory.text && (
                <div className="absolute bottom-16 left-4 right-4 text-center p-3 rounded-[10px] bg-black/50 backdrop-blur-sm text-white text-[14px] font-medium leading-snug z-20">
                  {currentStory.text}
                </div>
              )}
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center p-6 text-center text-white"
              style={{
                backgroundColor: currentStory.backgroundColor || '#111111',
              }}
            >
              <p className="text-[20px] font-bold leading-relaxed max-w-xs drop-shadow-md whitespace-pre-line">
                {currentStory.text}
              </p>
            </div>
          )}

          {/* Left / Right Tap Hit-zones */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-0 top-0 bottom-0 w-1/3 z-20 cursor-pointer"
            aria-label="Previous story"
          />
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-0 top-0 bottom-0 w-1/3 z-20 cursor-pointer"
            aria-label="Next story"
          />
        </div>

        {/* Footer for Own Story: Viewers Count & Drawer Trigger */}
        {isOwnStory && (
          <div className="absolute bottom-3 left-3 right-3 z-30">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowViewers(!showViewers);
              }}
              className="w-full py-2 px-3 rounded-[10px] bg-black/50 backdrop-blur-md text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:bg-black/70 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 stroke-[2px]" />
              <span>{currentStory.viewsCount || viewers.length} viewers</span>
            </button>
          </div>
        )}

        {/* Viewers Bottom Drawer */}
        {showViewers && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 max-h-[60%] bg-[#1E1E1E] border-t border-[#333333] rounded-t-[16px] z-40 p-4 overflow-y-auto flex flex-col space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <h4 className="text-[14px] font-bold text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 stroke-[1.75px]" />
                <span>Viewers ({viewers.length})</span>
              </h4>
              <button
                onClick={() => setShowViewers(false)}
                className="text-[#999999] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoadingViewers ? (
              <div className="py-6 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[#FF5C35]" />
              </div>
            ) : viewers.length === 0 ? (
              <p className="text-[12px] text-[#888888] py-4 text-center">
                No views recorded yet
              </p>
            ) : (
              <div className="space-y-2.5">
                {viewers.map((v) => (
                  <div key={v._id || v.viewer?._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={v.viewer?.profilePic}
                        name={v.viewer?.fullname}
                        size="sm"
                      />
                      <div>
                        <p className="text-[13px] font-bold text-white">
                          {v.viewer?.fullname}
                        </p>
                        <p className="text-[10px] text-[#888888]">
                          @{v.viewer?.userId}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#777777]">
                      {new Date(v.viewedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
