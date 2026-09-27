import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Trash2,
  Send,
  CheckCircle2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import ShareModal from './ShareModal';
import api from '../../services/api';

export default function PostCard({
  post,
  onDeletePost,
  onSelectPost,
  isFocused,
  onSelectUser,
}) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked));
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  const isAuthor =
    user &&
    post.postedBy &&
    (user._id === post.postedBy._id || user.userId === post.postedBy.userId);

  const handleToggleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    if (nextState) {
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 600);
    }

    try {
      await api.post(`/api/v1/posts/${post._id}/like`);
    } catch (err) {
      setIsLiked(!nextState);
      setLikesCount((prev) => (nextState ? Math.max(0, prev - 1) : prev + 1));
      console.error('Like toggle failed:', err);
    }
  };

  const handleToggleSave = async () => {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    try {
      if (nextSaved) {
        await api.post(`/api/v1/posts/${post._id}/save`);
      } else {
        await api.delete(`/api/v1/posts/${post._id}/save`);
      }
    } catch (err) {
      setIsSaved(!nextSaved);
      console.error('Failed to toggle save post:', err);
    }
  };

  const handleFetchComments = async () => {
    if (!showComments) {
      setIsLoadingComments(true);
      try {
        const res = await api.get(`/api/v1/posts/${post._id}/comments`);
        if (res.data?.data) {
          setComments(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setIsLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const textToSubmit = commentText.trim();
    setCommentText('');

    try {
      const res = await api.post(`/api/v1/posts/${post._id}/comments`, {
        text: textToSubmit,
      });
      if (res.data?.data) {
        setComments((prev) => [...prev, res.data.data]);
        setCommentsCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Add comment failed:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/api/v1/posts/${post._id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await api.delete(`/api/v1/posts/${post._id}`);
      if (onDeletePost) {
        onDeletePost(post._id);
      }
    } catch (err) {
      console.error('Delete post error:', err);
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);

    if (diffSecs < 60) return 'just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h`;
    if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const mediaItem = post.media && post.media.length > 0 ? post.media[0] : null;
  const mediaUrl = mediaItem ? mediaItem.url : post.postUrl;
  const isVideo =
    (mediaItem && mediaItem.mediaType === 'video') ||
    (mediaUrl && (mediaUrl.endsWith('.mp4') || mediaUrl.includes('/video/')));

  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  // Viewport-aware autoplay: Only the currently visible video plays
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;

    const el = videoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            el.play().catch(() => {});
          } else {
            el.pause();
          }
        });
      },
      { threshold: [0, 0.55, 1.0] }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      el.pause();
    };
  }, [isVideo, mediaUrl]);

  return (
    <article
      id={`post-${post._id}`}
      className={`border-b border-[#E7E5E2] dark:border-[#292929] p-4 sm:p-5 hover:bg-[#FAFAF8]/50 dark:hover:bg-[#121212]/50 transition-all duration-200 ${
        isFocused ? 'ring-2 ring-[#FF5C35] bg-[#FF5C35]/5 dark:bg-[#FF5C35]/10 rounded-[10px]' : ''
      }`}
    >
      <div className="flex gap-3.5 items-start">
        {/* Author Avatar */}
        <div
          onClick={() =>
            onSelectUser &&
            post.postedBy &&
            onSelectUser(post.postedBy.userId || post.postedBy._id)
          }
          className="cursor-pointer"
        >
          <Avatar
            src={post.postedBy?.profilePic}
            name={post.postedBy?.fullname || 'User'}
            size="md"
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Post Header: Name, Handle, Timestamp, Menu */}
          <div className="flex items-center justify-between gap-2">
            <div
              onClick={() =>
                onSelectUser &&
                post.postedBy &&
                onSelectUser(post.postedBy.userId || post.postedBy._id)
              }
              className="flex items-center gap-1.5 truncate cursor-pointer group"
            >
              <span className="font-bold text-[14px] text-[#111111] dark:text-[#F5F5F5] truncate group-hover:underline">
                {post.postedBy?.fullname || 'ShiftAura Member'}
              </span>
              <span className="text-[13px] text-[#6B6B6B] dark:text-[#A0A0A0] truncate">
                @{post.postedBy?.userId || 'user'}
              </span>
              <span className="text-[#929292] dark:text-[#707070] text-[13px]">·</span>
              <span className="text-[12px] text-[#929292] dark:text-[#707070] shrink-0">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>

            {/* Overflow Action Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-[#929292] hover:text-[#111111] dark:hover:text-[#F5F5F5] rounded-[6px] transition-colors"
                title="Post options"
                aria-label="Post options"
              >
                <MoreHorizontal className="w-4 h-4 stroke-[1.75px]" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-6 w-36 bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-[#E7E5E2] dark:border-[#292929] rounded-[9px] shadow-lg py-1 z-30">
                  {isAuthor && (
                    <button
                      onClick={handleDelete}
                      className="w-full px-3 py-2 text-left text-[12px] text-[#D64545] dark:text-[#E05252] hover:bg-[#D64545]/10 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[1.75px]" />
                      <span>Delete post</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowMenu(false)}
                    className="w-full px-3 py-2 text-left text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] hover:bg-[#F4F3F0] dark:hover:bg-[#242424]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Post Caption Body */}
          {post.caption && (
            <p className="mt-1.5 text-[15px] leading-relaxed text-[#111111] dark:text-[#F5F5F5] break-words select-text">
              {post.caption.split(' ').map((word, i) =>
                word.startsWith('#') ? (
                  <span
                    key={i}
                    className="text-[#FF5C35] dark:text-[#FF6845] font-medium hover:underline cursor-pointer"
                  >
                    {word}{' '}
                  </span>
                ) : (
                  word + ' '
                )
              )}
            </p>
          )}

          {/* Media Container */}
          {mediaUrl && (
            <div
              onDoubleClick={handleToggleLike}
              className="relative mt-3 rounded-[12px] overflow-hidden border border-[#E7E5E2] dark:border-[#292929] bg-[#000000] cursor-pointer select-none max-h-[500px] flex items-center justify-center"
            >
              {isVideo ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={mediaUrl}
                    muted={isMuted}
                    loop
                    playsInline
                    className="w-full max-h-[500px] object-contain"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(!isMuted);
                    }}
                    className="absolute bottom-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
                    title={isMuted ? 'Unmute video' : 'Mute video'}
                    aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 stroke-[1.75px]" />
                    ) : (
                      <Volume2 className="w-4 h-4 stroke-[1.75px]" />
                    )}
                  </button>
                </div>
              ) : (
                <img
                  src={mediaUrl}
                  alt={post.caption || 'Post image'}
                  loading="lazy"
                  className="w-full max-h-[500px] object-cover"
                />
              )}

              {/* Double-tap heart animation */}
              {showLikeAnimation && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Heart className="w-20 h-20 text-white fill-white animate-ping opacity-90 drop-shadow-md" />
                </div>
              )}
            </div>
          )}

          {/* Social Action Bar */}
          <div className="flex items-center justify-between mt-3.5 pt-1 text-[#6B6B6B] dark:text-[#A0A0A0] max-w-md">
            {/* Like Action */}
            <button
              onClick={handleToggleLike}
              className={`group flex items-center gap-1.5 text-[13px] transition-colors ${
                isLiked ? 'text-[#D64545] dark:text-[#E05252]' : 'hover:text-[#D64545]'
              }`}
              title="Like"
              aria-label="Like post"
            >
              <div className="p-1 rounded-[6px] group-hover:bg-[#D64545]/10">
                <Heart
                  className={`w-4 h-4 stroke-[1.75px] transition-transform active:scale-125 ${
                    isLiked ? 'fill-current' : ''
                  }`}
                />
              </div>
              <span className="font-medium text-[12px]">{likesCount > 0 ? likesCount : ''}</span>
            </button>

            {/* Comment Action */}
            <button
              onClick={handleFetchComments}
              className="group flex items-center gap-1.5 text-[13px] hover:text-[#111111] dark:hover:text-[#F5F5F5] transition-colors"
              title="Comments"
              aria-label="Comment on post"
            >
              <div className="p-1 rounded-[6px] group-hover:bg-[#F4F3F0] dark:group-hover:bg-[#1C1C1C]">
                <MessageCircle className="w-4 h-4 stroke-[1.75px]" />
              </div>
              <span className="font-medium text-[12px]">{commentsCount > 0 ? commentsCount : ''}</span>
            </button>

            {/* Share Action */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="group flex items-center gap-1.5 text-[13px] hover:text-[#111111] dark:hover:text-[#F5F5F5] transition-colors"
              title="Share"
              aria-label="Share post"
            >
              <div className="p-1 rounded-[6px] group-hover:bg-[#F4F3F0] dark:group-hover:bg-[#1C1C1C]">
                <Share2 className="w-4 h-4 stroke-[1.75px]" />
              </div>
            </button>

            {/* Bookmark Action */}
            <button
              onClick={handleToggleSave}
              className={`group flex items-center gap-1.5 text-[13px] transition-colors ${
                isSaved ? 'text-[#FF5C35] dark:text-[#FF6845]' : 'hover:text-[#FF5C35]'
              }`}
              title="Save"
              aria-label="Bookmark post"
            >
              <div className="p-1 rounded-[6px] group-hover:bg-[#FF5C35]/10">
                <Bookmark
                  className={`w-4 h-4 stroke-[1.75px] ${isSaved ? 'fill-current' : ''}`}
                />
              </div>
            </button>
          </div>

          {/* Inline Expandable Comments Drawer */}
          {showComments && (
            <div className="mt-3 pt-3 border-t border-[#E7E5E2]/60 dark:border-[#292929]/60 space-y-3">
              {/* Comment composer */}
              <form onSubmit={handleAddComment} className="flex gap-2 items-center">
                <Avatar src={user?.profilePic} name={user?.fullname} size="xs" />
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 h-[34px] bg-[#F4F3F0] dark:bg-[#1C1C1C] border border-[#E7E5E2] dark:border-[#292929] focus:border-[#FF5C35] dark:focus:border-[#FF6845] rounded-[9px] px-3 text-[13px] text-[#111111] dark:text-[#F5F5F5] placeholder-[#929292] dark:placeholder-[#707070] outline-none transition-colors"
                />
                <Button
                  type="submit"
                  size="xs"
                  variant="primary"
                  disabled={!commentText.trim()}
                >
                  Reply
                </Button>
              </form>

              {/* Comments list */}
              {isLoadingComments ? (
                <p className="text-[12px] text-[#929292] dark:text-[#707070] py-2">
                  Loading replies...
                </p>
              ) : comments.length === 0 ? (
                <p className="text-[12px] text-[#929292] dark:text-[#707070] py-1">
                  No replies yet. Be the first to reply!
                </p>
              ) : (
                <div className="space-y-2.5 pt-1">
                  {comments.map((c) => {
                    const author = c.commentedBy || c.postedBy;
                    const canDelete =
                      user &&
                      (user._id === author?._id ||
                        user.userId === author?.userId ||
                        isAuthor);

                    return (
                      <div key={c._id} className="flex gap-2.5 items-start text-[13px] group">
                        <Avatar
                          src={author?.profilePic}
                          name={author?.fullname}
                          size="xs"
                        />
                        <div className="flex-1 bg-[#F4F3F0]/60 dark:bg-[#1C1C1C]/60 rounded-[9px] p-2.5 border border-[#E7E5E2]/40 dark:border-[#292929]/40 relative">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 font-semibold text-[12px] text-[#111111] dark:text-[#F5F5F5]">
                              <span>{author?.fullname || 'ShiftAura Member'}</span>
                              <span className="text-[#929292] font-normal">
                                @{author?.userId}
                              </span>
                            </div>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteComment(c._id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-[#929292] hover:text-[#D64545] dark:hover:text-[#E05252] transition-opacity"
                                title="Delete comment"
                                aria-label="Delete comment"
                              >
                                <Trash2 className="w-3 h-3 stroke-[1.75px]" />
                              </button>
                            )}
                          </div>
                          <p className="text-[#111111] dark:text-[#F5F5F5] mt-0.5 leading-snug">
                            {c.text}
                          </p>
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

      {/* Share to Conversation Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={post}
      />
    </article>
  );
}
