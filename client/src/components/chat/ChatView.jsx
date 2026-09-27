import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useCall } from '../../context/CallContext';
import {
  Phone,
  Video,
  Send,
  Check,
  CheckCheck,
  MessageCircle,
  Search,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import api from '../../services/api';

export default function ChatView({ onSelectPost }) {
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const { startCall } = useCall();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      const res = await api.get('/api/v1/chat/conversations');
      if (res.data?.data) {
        setConversations(res.data.data);
        if (res.data.data.length > 0 && !activeConversation) {
          setActiveConversation(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages for active conversation & join socket room
  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const res = await api.get(`/api/v1/chat/messages/${activeConversation._id}`);
        if (res.data?.data) {
          setMessages(res.data.data);
        }
        await api.put(`/api/v1/chat/messages/${activeConversation._id}/read`);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();

    if (socket) {
      socket.emit('chat:join', { conversationId: activeConversation._id });
    }

    return () => {
      if (socket) {
        socket.emit('chat:leave', { conversationId: activeConversation._id });
      }
    };
  }, [activeConversation, socket]);

  // Real-time socket message listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = ({ message, conversationId }) => {
      if (activeConversation && activeConversation._id === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });

        const senderId = message.sender?._id || message.sender;
        if (senderId && senderId !== user?._id) {
          socket.emit('message:read', { conversationId });
        }
      }
      fetchConversations();
    };

    const handleMessageDelivered = ({ messageId, conversationId }) => {
      if (activeConversation && activeConversation._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId && m.status === 'SENT'
              ? { ...m, status: 'DELIVERED' }
              : m
          )
        );
      }
    };

    const handleMessageTyping = ({ conversationId, isTyping: typingStatus }) => {
      if (activeConversation && activeConversation._id === conversationId) {
        setOtherUserTyping(Boolean(typingStatus));
      }
    };

    const handleMessageRead = ({ conversationId }) => {
      if (activeConversation && activeConversation._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.status !== 'READ' ? { ...m, status: 'READ' } : m))
        );
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:delivered', handleMessageDelivered);
    socket.on('message:typing', handleMessageTyping);
    socket.on('message:read', handleMessageRead);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:delivered', handleMessageDelivered);
      socket.off('message:typing', handleMessageTyping);
      socket.off('message:read', handleMessageRead);
    };
  }, [socket, activeConversation, user]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherUserTyping]);

  const handleTyping = (e) => {
    setInputMessage(e.target.value);

    if (!socket || !activeConversation) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('message:typing', {
        conversationId: activeConversation._id,
        isTyping: true,
      });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('message:typing', {
        conversationId: activeConversation._id,
        isTyping: false,
      });
    }, 1200);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConversation) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');

    clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);

    if (socket) {
      socket.emit('message:typing', {
        conversationId: activeConversation._id,
        isTyping: false,
      });
    }

    try {
      const res = await api.post(`/api/v1/chat/messages/${activeConversation._id}`, {
        text: textToSend,
      });
      if (res.data?.data) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data.data._id)) return prev;
          return [...prev, res.data.data];
        });
        fetchConversations();
      }
    } catch (err) {
      console.error('Send message failed:', err);
    }
  };

  const otherParticipant = activeConversation?.members?.find((m) => m._id !== user?._id);
  const isParticipantOnline = otherParticipant ? isUserOnline(otherParticipant._id) : false;

  const filteredConversations = conversations.filter((c) => {
    const partner = c.members.find((m) => m._id !== user?._id);
    if (!searchFilter.trim()) return true;
    return (
      partner?.fullname?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      partner?.userId?.toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  return (
    <div className="flex h-full w-full rounded-[14px] border border-[#E7E5E2] dark:border-[#292929] bg-[#FFFFFF] dark:bg-[#151515] overflow-hidden shadow-sm">
      {/* 1. Left Channel List */}
      <div
        className={`w-full sm:w-[300px] md:w-[330px] flex flex-col h-full border-r border-[#E7E5E2] dark:border-[#292929] bg-[#FAFAF8] dark:bg-[#0D0D0D] shrink-0 ${
          showMobileChat ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#E7E5E2] dark:border-[#292929] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[19px] font-bold text-[#111111] dark:text-[#F5F5F5] tracking-tight">
              Messages
            </h2>
          </div>

          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-[#929292] dark:text-[#707070] stroke-[1.75px] pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search conversations..."
              className="w-full h-[36px] pl-9 pr-3 rounded-[9px] bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] focus:border-[#FF5C35] dark:focus:border-[#FF6845] text-[13px] text-[#111111] dark:text-[#F5F5F5] placeholder-[#929292] dark:placeholder-[#707070] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E7E5E2]/60 dark:divide-[#292929]/60">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[#6B6B6B] dark:text-[#A0A0A0] leading-relaxed">
              No conversations yet. Start a conversation with someone from your network.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const partner = conv.members.find((m) => m._id !== user?._id);
              const isSelected = activeConversation?._id === conv._id;
              const online = partner ? isUserOnline(partner._id) : false;

              return (
                <div
                  key={conv._id}
                  onClick={() => {
                    setActiveConversation(conv);
                    setShowMobileChat(true);
                  }}
                  className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors duration-150 ${
                    isSelected
                      ? 'bg-[#EFEFEA] dark:bg-[#1C1C1C]'
                      : 'hover:bg-[#F4F3F0]/60 dark:hover:bg-[#151515]'
                  }`}
                >
                  <Avatar
                    src={partner?.profilePic}
                    name={partner?.fullname}
                    size="md"
                    isOnline={online}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-[13px] truncate text-[#111111] dark:text-[#F5F5F5] ${
                          isSelected ? 'font-bold' : 'font-semibold'
                        }`}
                      >
                        {partner?.fullname || 'User'}
                      </p>
                      {conv.lastMessage?.createdAt && (
                        <span className="text-[11px] text-[#929292] dark:text-[#707070]">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] truncate max-w-[170px]">
                        {conv.lastMessage?.text || 'Started a conversation'}
                      </p>

                      {conv.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#FF5C35] dark:bg-[#FF6845] text-white text-[10px] font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Active Conversation Thread */}
      <div
        className={`flex-1 flex flex-col h-full bg-[#FFFFFF] dark:bg-[#151515] ${
          !showMobileChat ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {activeConversation && otherParticipant ? (
          <>
            {/* Thread Header */}
            <div className="h-[52px] border-b border-[#E7E5E2] dark:border-[#292929] px-4 flex items-center justify-between shrink-0 bg-[#FFFFFF] dark:bg-[#151515]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="sm:hidden p-1 text-[#6B6B6B] hover:text-[#111111] dark:hover:text-[#F5F5F5]"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[1.75px]" />
                </button>

                <Avatar
                  src={otherParticipant.profilePic}
                  name={otherParticipant.fullname}
                  size="sm"
                  isOnline={isParticipantOnline}
                />

                <div>
                  <h3 className="font-bold text-[14px] text-[#111111] dark:text-[#F5F5F5] leading-tight">
                    {otherParticipant.fullname}
                  </h3>
                  <p className="text-[11px] text-[#6B6B6B] dark:text-[#A0A0A0] flex items-center gap-1.5">
                    {isParticipantOnline && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16845B] dark:bg-[#38A878]" />
                    )}
                    <span>{isParticipantOnline ? 'Online' : 'Offline'}</span>
                  </p>
                </div>
              </div>

              {/* Call Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    startCall({
                      recipientId: otherParticipant._id,
                      recipientUser: otherParticipant,
                      type: 'audio',
                    })
                  }
                  title="Voice Call"
                  aria-label="Start voice call"
                >
                  <Phone className="w-4 h-4 stroke-[1.75px]" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    startCall({
                      recipientId: otherParticipant._id,
                      recipientUser: otherParticipant,
                      type: 'video',
                    })
                  }
                  title="Video Call"
                  aria-label="Start video call"
                >
                  <Video className="w-4 h-4 stroke-[1.75px]" />
                </Button>
              </div>
            </div>

            {/* Messages Scroll View */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#FFFFFF] dark:bg-[#151515]">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 animate-spin text-[#FF5C35] dark:text-[#FF6845]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-[#6B6B6B] dark:text-[#A0A0A0] text-[13px] space-y-2 p-6">
                  <Avatar
                    src={otherParticipant.profilePic}
                    name={otherParticipant.fullname}
                    size="xl"
                  />
                  <h4 className="font-bold text-[16px] text-[#111111] dark:text-[#F5F5F5] mt-2">
                    {otherParticipant.fullname}
                  </h4>
                  <p className="text-[12px] text-[#929292] dark:text-[#707070]">
                    @{otherParticipant.userId}
                  </p>
                  <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] max-w-xs mt-2">
                    End-to-end WebRTC peer calling and real-time messaging active.
                  </p>
                </div>
              ) : (
                messages.map((m, index) => {
                  const isMine = m.sender?._id === user?._id || m.sender === user?._id;
                  const prevMsg = messages[index - 1];
                  const isSameSender =
                    prevMsg &&
                    (prevMsg.sender?._id === m.sender?._id || prevMsg.sender === m.sender);

                  return (
                    <div
                      key={m._id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} ${
                        isSameSender ? 'mt-1' : 'mt-3.5'
                      }`}
                    >
                      {m.messageType === 'POST_SHARE' && m.sharedPostId ? (
                        <div
                          className={`max-w-xs sm:max-w-sm p-3 select-text ${
                            isMine
                              ? 'bg-[#111111] text-[#FAFAF8] dark:bg-[#222222] dark:text-[#F5F5F5] rounded-[14px] rounded-br-[4px] shadow-sm'
                              : 'bg-[#F4F3F0] text-[#111111] dark:bg-[#1C1C1C] dark:text-[#F5F5F5] border border-[#E7E5E2]/80 dark:border-[#292929] rounded-[14px] rounded-bl-[4px]'
                          }`}
                        >
                          {m.text && m.text !== 'Shared a post with you' && (
                            <p className="text-[13px] mb-2">{m.text}</p>
                          )}
                          <div
                            onClick={() =>
                              onSelectPost &&
                              onSelectPost(
                                typeof m.sharedPostId === 'object'
                                  ? m.sharedPostId._id
                                  : m.sharedPostId
                              )
                            }
                            className="p-3 rounded-[10px] bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] cursor-pointer hover:border-[#FF5C35] dark:hover:border-[#FF6845] transition-colors"
                          >
                            {typeof m.sharedPostId === 'object' && (
                              <>
                                <div className="flex items-center gap-2 mb-2">
                                  <Avatar
                                    src={m.sharedPostId.postedBy?.profilePic}
                                    name={m.sharedPostId.postedBy?.fullname}
                                    size="xs"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-[12px] font-bold text-[#111111] dark:text-[#F5F5F5] truncate">
                                      {m.sharedPostId.postedBy?.fullname || 'NOVA Member'}
                                    </p>
                                    <p className="text-[10px] text-[#6B6B6B] dark:text-[#A0A0A0] truncate">
                                      @{m.sharedPostId.postedBy?.userId || 'user'}
                                    </p>
                                  </div>
                                </div>
                                {(m.sharedPostId.caption || m.sharedPostId.text) && (
                                  <p className="text-[12px] text-[#111111] dark:text-[#F5F5F5] line-clamp-2 mb-2 leading-snug">
                                    {m.sharedPostId.caption || m.sharedPostId.text}
                                  </p>
                                )}
                                {(m.sharedPostId.img ||
                                  (m.sharedPostId.media && m.sharedPostId.media[0]?.url)) && (
                                  <div className="rounded-[6px] overflow-hidden aspect-video bg-[#FAFAF8] dark:bg-[#0D0D0D] mb-2">
                                    <img
                                      src={
                                        m.sharedPostId.img ||
                                        m.sharedPostId.media[0]?.url
                                      }
                                      alt="Shared preview"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                              </>
                            )}
                            <div className="flex items-center justify-between pt-1 border-t border-[#E7E5E2]/60 dark:border-[#292929]/60">
                              <span className="text-[11px] font-semibold text-[#FF5C35] dark:text-[#FF6845] flex items-center gap-1">
                                <span>View post on timeline</span>
                                <ArrowRight className="w-3 h-3 stroke-[2px]" />
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`max-w-xs sm:max-w-md px-3.5 py-2 text-[14px] leading-relaxed select-text ${
                            isMine
                              ? 'bg-[#111111] text-[#FAFAF8] dark:bg-[#222222] dark:text-[#F5F5F5] rounded-[14px] rounded-br-[4px] shadow-sm'
                              : 'bg-[#F4F3F0] text-[#111111] dark:bg-[#1C1C1C] dark:text-[#F5F5F5] border border-[#E7E5E2]/80 dark:border-[#292929] rounded-[14px] rounded-bl-[4px]'
                          }`}
                        >
                          {m.text}
                        </div>
                      )}

                      {/* Timestamp & Status Checkmarks */}
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-[#929292] dark:text-[#707070] px-1">
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMine && (
                          <span>
                            {m.status === 'READ' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-[#FF5C35] dark:text-[#FF6845]" title="Read" />
                            ) : m.status === 'DELIVERED' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-[#929292] dark:text-[#707070]" title="Delivered" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-[#929292] dark:text-[#707070]" title="Sent" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {otherUserTyping && (
                <div className="flex items-center gap-2 text-xs text-[#929292] dark:text-[#707070] pt-1">
                  <div className="flex gap-1 items-center px-2.5 py-1.5 rounded-[9px] bg-[#F4F3F0] dark:bg-[#1C1C1C] border border-[#E7E5E2] dark:border-[#292929]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#929292] dark:bg-[#707070] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#929292] dark:bg-[#707070] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#929292] dark:bg-[#707070] animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[11px]">{otherParticipant.fullname} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-[#E7E5E2] dark:border-[#292929] flex items-center gap-2 bg-[#FFFFFF] dark:bg-[#151515]"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={handleTyping}
                placeholder="Write a message..."
                className="flex-1 h-[40px] bg-[#FAFAF8] dark:bg-[#0D0D0D] border border-[#E7E5E2] dark:border-[#292929] focus:border-[#FF5C35] dark:focus:border-[#FF6845] rounded-[9px] px-3.5 text-[14px] text-[#111111] dark:text-[#F5F5F5] placeholder-[#929292] dark:placeholder-[#707070] outline-none transition-colors"
              />

              <Button
                type="submit"
                size="sm"
                variant="accent"
                disabled={!inputMessage.trim()}
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5 mr-1 stroke-[1.75px]" />
                <span>Send</span>
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-[#6B6B6B] dark:text-[#A0A0A0] text-[13px] space-y-2 p-6">
            <div className="w-12 h-12 rounded-[12px] bg-[#F4F3F0] dark:bg-[#1C1C1C] border border-[#E7E5E2] dark:border-[#292929] flex items-center justify-center text-[#929292] dark:text-[#707070]">
              <MessageCircle className="w-6 h-6 stroke-[1.75px]" />
            </div>
            <h3 className="font-bold text-[16px] text-[#111111] dark:text-[#F5F5F5] mt-2">
              Your messages
            </h3>
            <p className="text-[13px] text-[#6B6B6B] dark:text-[#A0A0A0] max-w-xs leading-relaxed">
              Send direct messages, share thoughts, or start real-time peer audio and video calls.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
