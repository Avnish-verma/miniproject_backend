import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Loader2,
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import api from '../services/api';

export default function CallsPage() {
  const { user } = useAuth();
  const { startCall } = useCall();
  const [calls, setCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCallHistory = async () => {
    try {
      const res = await api.get('/api/v1/calls/history?page=1&limit=30');
      if (res.data?.data) {
        setCalls(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load call history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="w-full pb-12">
      {/* Contextual Header */}
      <div className="sticky top-0 bg-[#FAFAF8]/90 dark:bg-[#0D0D0D]/90 backdrop-blur-md border-b border-[#E7E5E2] dark:border-[#292929] px-4 py-3.5 z-20 flex items-center justify-between">
        <div>
          <h1 className="text-[19px] font-bold text-[#111111] dark:text-[#F5F5F5]">
            Calls
          </h1>
          <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0]">
            Encrypted WebRTC voice and video communications
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#929292] dark:text-[#707070] gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#FF5C35] dark:text-[#FF6845]" />
          <p className="text-[13px]">Loading call history...</p>
        </div>
      ) : calls.length === 0 ? (
        <div className="text-center py-20 px-6 space-y-3">
          <div className="w-12 h-12 rounded-[12px] bg-[#F4F3F0] dark:bg-[#1C1C1C] border border-[#E7E5E2] dark:border-[#292929] flex items-center justify-center mx-auto text-[#6B6B6B] dark:text-[#A0A0A0]">
            <Phone className="w-5 h-5 stroke-[1.75px]" />
          </div>
          <h3 className="font-bold text-[16px] text-[#111111] dark:text-[#F5F5F5]">
            No recent calls
          </h3>
          <p className="text-[13px] text-[#6B6B6B] dark:text-[#A0A0A0] max-w-sm mx-auto leading-relaxed">
            Direct audio and video calls initiated from conversations or profiles will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#E7E5E2] dark:divide-[#292929]">
          {calls.map((call) => {
            const callerId = call.caller?._id || call.caller;
            const currentId = user?._id || user?.id;
            const isCaller = callerId && currentId && callerId.toString() === currentId.toString();
            const peer = isCaller ? (call.callee || call.recipient) : call.caller;
            const isMissed = call.status === 'missed' || call.status === 'rejected';

            return (
              <div
                key={call._id}
                className="flex items-center justify-between p-4 hover:bg-[#F4F3F0]/50 dark:hover:bg-[#151515] transition-colors duration-150"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Avatar
                    src={peer?.profilePic}
                    name={peer?.fullname || 'User'}
                    size="md"
                  />

                  <div className="min-w-0">
                    <p className="font-semibold text-[14px] text-[#111111] dark:text-[#F5F5F5] truncate">
                      {peer?.fullname || 'User'}
                    </p>

                    <div className="flex items-center gap-1.5 text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] mt-0.5">
                      {isMissed ? (
                        <PhoneMissed className="w-3.5 h-3.5 text-[#D64545] dark:text-[#E05252] stroke-[1.75px]" />
                      ) : isCaller ? (
                        <PhoneOutgoing className="w-3.5 h-3.5 text-[#16845B] dark:text-[#38A878] stroke-[1.75px]" />
                      ) : (
                        <PhoneIncoming className="w-3.5 h-3.5 text-[#16845B] dark:text-[#38A878] stroke-[1.75px]" />
                      )}

                      <span className="capitalize">{call.type} Call</span>
                      <span>•</span>
                      <span>
                        {new Date(call.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>

                      {call.duration > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{formatDuration(call.duration)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      startCall({
                        recipientId: peer?._id,
                        recipientUser: peer,
                        type: 'audio',
                      })
                    }
                    title="Audio Call"
                    aria-label="Start voice call"
                  >
                    <Phone className="w-4 h-4 stroke-[1.75px]" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      startCall({
                        recipientId: peer?._id,
                        recipientUser: peer,
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
            );
          })}
        </div>
      )}
    </div>
  );
}
