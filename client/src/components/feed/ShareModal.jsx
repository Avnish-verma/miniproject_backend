import React, { useState, useEffect } from 'react';
import { X, Check, Copy, Send, Search, Loader2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import api from '../../services/api';

export default function ShareModal({ isOpen, onClose, post }) {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [shareNote, setShareNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedConversation(null);
    setShareNote('');
    setSentSuccess(false);

    const loadConversations = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/api/v1/chat/conversations');
        if (res.data?.data) {
          setConversations(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load conversations for sharing:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [isOpen]);

  if (!isOpen || !post) return null;

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/?post=${post._id}`;
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendShare = async (e) => {
    e.preventDefault();
    if (!selectedConversation) return;

    setIsSending(true);
    try {
      await api.post(`/api/v1/chat/messages/${selectedConversation._id}`, {
        text: shareNote.trim() || 'Shared a post with you',
        messageType: 'POST_SHARE',
        sharedPostId: post._id,
      });

      setSentSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to share post:', err);
      alert('Could not share post. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const name = c.otherUser?.fullname || '';
    const handle = c.otherUser?.userId || '';
    const q = searchTerm.toLowerCase();
    return name.toLowerCase().includes(q) || handle.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] rounded-[16px] w-full max-w-md shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E5E2] dark:border-[#292929]">
          <h3 className="font-bold text-[16px] text-[#111111] dark:text-[#F5F5F5]">
            Share Post
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#929292] hover:text-[#111111] dark:hover:text-[#F5F5F5] hover:bg-[#F4F3F0] dark:hover:bg-[#1C1C1C] transition-colors"
          >
            <X className="w-5 h-5 stroke-[1.75px]" />
          </button>
        </div>

        {/* Post Quick Preview Pill */}
        <div className="p-4 bg-[#FAFAF8] dark:bg-[#0D0D0D] border-b border-[#E7E5E2] dark:border-[#292929] flex items-center gap-3">
          <Avatar
            src={post.postedBy?.profilePic}
            name={post.postedBy?.fullname}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#111111] dark:text-[#F5F5F5] truncate">
              {post.postedBy?.fullname}
            </p>
            <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] truncate">
              {post.caption || 'Media post'}
            </p>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-[8px] border border-[#E7E5E2] dark:border-[#292929] bg-[#FFFFFF] dark:bg-[#1C1C1C] text-[#111111] dark:text-[#F5F5F5] hover:bg-[#F4F3F0] dark:hover:bg-[#242424] transition-colors shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#16845B] dark:text-[#38A878]" />
                <span className="text-[#16845B] dark:text-[#38A878]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 stroke-[1.75px]" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        {/* Search Contact / Conversation */}
        <div className="p-3 border-b border-[#E7E5E2] dark:border-[#292929]">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-[#929292] dark:text-[#707070] stroke-[1.75px] pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full h-[36px] pl-9 pr-3 rounded-[9px] bg-[#FAFAF8] dark:bg-[#0D0D0D] border border-[#E7E5E2] dark:border-[#292929] focus:border-[#FF5C35] dark:focus:border-[#FF6845] text-[13px] text-[#111111] dark:text-[#F5F5F5] placeholder-[#929292] dark:placeholder-[#707070] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#E7E5E2]/40 dark:divide-[#292929]/40">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#929292] dark:text-[#707070] gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#FF5C35] dark:text-[#FF6845]" />
              <p className="text-[12px]">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-10 text-center text-[#929292] dark:text-[#707070] text-[13px]">
              No active conversations found.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConversation?._id === conv._id;
              const peer = conv.otherUser;

              return (
                <div
                  key={conv._id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`flex items-center justify-between p-2.5 rounded-[10px] cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#FF5C35]/10 border border-[#FF5C35]/30'
                      : 'hover:bg-[#F4F3F0] dark:hover:bg-[#1C1C1C]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={peer?.profilePic}
                      name={peer?.fullname}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-[13px] text-[#111111] dark:text-[#F5F5F5] truncate">
                        {peer?.fullname || 'NOVA Member'}
                      </p>
                      <p className="text-[11px] text-[#6B6B6B] dark:text-[#A0A0A0] truncate">
                        @{peer?.userId}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-[#FF5C35] bg-[#FF5C35] text-white'
                          : 'border-[#E7E5E2] dark:border-[#292929]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[2.5px]" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Send Action */}
        {selectedConversation && (
          <form onSubmit={handleSendShare} className="p-3 border-t border-[#E7E5E2] dark:border-[#292929] bg-[#FAFAF8] dark:bg-[#0D0D0D] space-y-2">
            <input
              type="text"
              value={shareNote}
              onChange={(e) => setShareNote(e.target.value)}
              placeholder="Add a message (optional)..."
              className="w-full h-[36px] px-3 rounded-[9px] bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] text-[13px] text-[#111111] dark:text-[#F5F5F5] outline-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConversation(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="accent"
                size="sm"
                disabled={isSending || sentSuccess}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Sending...
                  </>
                ) : sentSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5 text-white" />
                    Shared!
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5 stroke-[1.75px]" />
                    Send to {selectedConversation.otherUser?.fullname?.split(' ')[0]}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
