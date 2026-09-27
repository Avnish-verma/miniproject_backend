import React, { useEffect, useRef } from 'react';
import { useCall, CALL_STATES } from '../../context/CallContext';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ShieldCheck,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import Avatar from '../common/Avatar';

export default function CallOverlay() {
  const {
    callState,
    incomingCall,
    activeCall,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoOff,
    callDuration,
    isMinimized,
    minimizeCall,
    maximizeCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Bind local stream to video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  // Bind remote stream to BOTH audio and video elements to ensure audio plays in both audio & video calls
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusSubtitle = () => {
    switch (callState) {
      case CALL_STATES.OUTGOING_CALL:
        return 'Calling...';
      case CALL_STATES.RINGING:
        return 'Ringing...';
      case CALL_STATES.ACCEPTING:
      case CALL_STATES.CONNECTING:
        return 'Connecting...';
      case CALL_STATES.CONNECTED:
        return formatDuration(callDuration);
      default:
        return 'Connecting...';
    }
  };

  // 1. Incoming Call Toast Notification
  if (incomingCall && (callState === CALL_STATES.INCOMING_CALL || callState === 'ringing')) {
    return (
      <div className="fixed top-5 right-5 sm:top-6 sm:right-6 z-[100] bg-[#151515] border border-[#292929] rounded-[14px] p-4 shadow-2xl flex items-center gap-3.5 max-w-sm w-[calc(100vw-2.5rem)] text-[#F5F5F5]">
        {/* Hidden audio receiver for early audio negotiation if any */}
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

        <div className="relative shrink-0">
          <Avatar src={incomingCall.caller.profilePic} name={incomingCall.caller.fullname} size="lg" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#16845B] rounded-full ring-2 ring-[#151515] animate-ping" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-[14px] text-[#F5F5F5] truncate">
            {incomingCall.caller.fullname}
          </h4>
          <p className="text-[12px] text-[#A0A0A0] capitalize flex items-center gap-1.5 mt-0.5">
            {incomingCall.callType === 'video' ? (
              <Video className="w-3.5 h-3.5 text-[#38A878] stroke-[1.75px]" />
            ) : (
              <Phone className="w-3.5 h-3.5 text-[#38A878] stroke-[1.75px]" />
            )}
            <span>Incoming {incomingCall.callType} call...</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => rejectCall('declined')}
            className="w-10 h-10 rounded-full bg-[#292929] hover:bg-[#D64545] text-[#A0A0A0] hover:text-white flex items-center justify-center transition-colors active:scale-95"
            title="Decline Call"
            aria-label="Decline Call"
          >
            <PhoneOff className="w-4 h-4 stroke-[1.75px]" />
          </button>
          <button
            onClick={acceptCall}
            className="w-10 h-10 rounded-full bg-[#16845B] hover:bg-[#13724E] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 animate-pulse"
            title="Accept Call"
            aria-label="Accept Call"
          >
            <Phone className="w-4 h-4 stroke-[1.75px]" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Active Call Screen
  const inCallActive = [
    CALL_STATES.OUTGOING_CALL,
    CALL_STATES.RINGING,
    CALL_STATES.ACCEPTING,
    CALL_STATES.CONNECTING,
    CALL_STATES.CONNECTED,
    'calling',
    'connected',
  ].includes(callState);

  if (inCallActive) {
    const isVideoCall = activeCall && activeCall.type === 'video';

    // 2A. Minimized Picture-in-Picture Mini-Dock
    if (isMinimized) {
      return (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[95] w-64 sm:w-72 bg-[#151515] border border-[#2B2B2B] rounded-[16px] p-3 shadow-2xl text-white select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#292929]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#38A878] animate-pulse shrink-0" />
              <span className="font-bold text-[13px] text-[#F5F5F5] truncate">
                {activeCall?.recipientUser?.fullname || 'ShiftAura Call'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-[#A0A0A0]">
                {callState === CALL_STATES.CONNECTED ? formatDuration(callDuration) : '...'}
              </span>
              <button
                onClick={maximizeCall}
                className="p-1.5 rounded-full hover:bg-[#252525] text-[#A0A0A0] hover:text-white transition-colors"
                title="Return to full call"
                aria-label="Maximize call"
              >
                <Maximize2 className="w-4 h-4 stroke-[1.75px]" />
              </button>
            </div>
          </div>

          {/* Mini Stage Preview */}
          <div className="relative w-full h-28 rounded-[10px] overflow-hidden bg-black flex items-center justify-center mb-2.5">
            {isVideoCall ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <Avatar
                  src={activeCall?.recipientUser?.profilePic}
                  name={activeCall?.recipientUser?.fullname}
                  size="md"
                />
                <span className="text-[11px] text-[#A0A0A0]">Encrypted Audio</span>
              </div>
            )}
          </div>

          {/* Mini Action Controls */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-full transition-colors ${
                isAudioMuted ? 'bg-[#D64545] text-white' : 'bg-[#252525] text-[#F5F5F5] hover:bg-[#333333]'
              }`}
              title={isAudioMuted ? 'Unmute' : 'Mute'}
            >
              {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {isVideoCall && (
              <button
                onClick={toggleVideo}
                className={`p-2 rounded-full transition-colors ${
                  isVideoOff ? 'bg-[#D64545] text-white' : 'bg-[#252525] text-[#F5F5F5] hover:bg-[#333333]'
                }`}
                title={isVideoOff ? 'Start Camera' : 'Stop Camera'}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={endCall}
              className="p-2 rounded-full bg-[#D64545] hover:bg-[#B83838] text-white transition-colors"
              title="End Call"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    // 2B. Full-Screen Call Experience
    return (
      <div className="fixed inset-0 z-[100] bg-[#0D0D0D] text-white flex flex-col justify-between p-4 sm:p-6 select-none">
        {/* Dedicated audio element for voice audio output */}
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

        {/* Call Header */}
        <div className="flex items-center justify-between z-20 max-w-4xl w-full mx-auto">
          <div className="flex items-center gap-3">
            <Avatar
              src={activeCall?.recipientUser?.profilePic}
              name={activeCall?.recipientUser?.fullname}
              size="md"
            />
            <div>
              <h3 className="font-bold text-[15px] text-[#F5F5F5] leading-tight">
                {activeCall?.recipientUser?.fullname || 'ShiftAura Call'}
              </h3>
              <p className="text-[12px] text-[#A0A0A0] flex items-center gap-1.5 mt-0.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38A878] animate-pulse" />
                {getStatusSubtitle()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#151515] border border-[#292929] text-[12px] text-[#A0A0A0]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#38A878] stroke-[1.75px]" />
              <span>{isVideoCall ? 'WebRTC Video' : 'Encrypted Audio'}</span>
            </div>

            <button
              onClick={minimizeCall}
              className="p-1.5 rounded-[8px] bg-[#151515] border border-[#292929] hover:bg-[#252525] text-[#A0A0A0] hover:text-white transition-colors"
              title="Minimize call"
              aria-label="Minimize call"
            >
              <Minimize2 className="w-4 h-4 stroke-[1.75px]" />
            </button>
          </div>
        </div>

        {/* Viewport: Video Stage vs Dedicated Voice Card */}
        <div className="flex-1 relative my-4 flex items-center justify-center overflow-hidden rounded-[14px] bg-[#151515] border border-[#292929] max-w-4xl w-full mx-auto">
          {isVideoCall ? (
            <>
              {/* Remote Video (Full Screen Stage) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local Video (PIP Thumbnail) */}
              <div className="absolute top-4 right-4 w-36 h-48 sm:w-44 sm:h-56 rounded-[12px] overflow-hidden shadow-2xl border border-[#292929] bg-[#000000] z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#151515] text-[#707070] text-[12px] gap-1.5 p-2 text-center">
                    <VideoOff className="w-5 h-5 stroke-[1.75px]" />
                    <span>Camera off</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Dedicated Voice Call Card (No Giant Empty Video Canvas) */
            <div className="flex flex-col items-center justify-center gap-5 p-8 text-center">
              <div className="relative">
                <div
                  className={`absolute inset-0 rounded-full bg-[#38A878]/15 scale-125 ${
                    callState === CALL_STATES.CONNECTED ? 'animate-ping' : ''
                  }`}
                />
                <Avatar
                  src={activeCall?.recipientUser?.profilePic}
                  name={activeCall?.recipientUser?.fullname}
                  size="2xl"
                />
              </div>

              <div className="space-y-1">
                <h2 className="text-[20px] font-bold text-[#F5F5F5]">
                  {activeCall?.recipientUser?.fullname}
                </h2>
                <p className="text-[13px] text-[#A0A0A0] font-mono tracking-wide">
                  {callState === CALL_STATES.CONNECTED
                    ? `● ${formatDuration(callDuration)}`
                    : getStatusSubtitle()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Floating Bottom Control Dock */}
        <div className="flex justify-center items-center z-20 pb-2">
          <div className="bg-[#151515]/95 backdrop-blur-md border border-[#292929] rounded-[12px] px-5 py-2.5 flex items-center gap-3.5 shadow-2xl">
            <button
              onClick={toggleAudio}
              className={`w-11 h-11 rounded-[9px] flex items-center justify-center transition-colors ${
                isAudioMuted
                  ? 'bg-[#D64545] text-white'
                  : 'bg-[#292929] hover:bg-[#333333] text-[#F5F5F5]'
              }`}
              title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
              aria-label={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isAudioMuted ? (
                <MicOff className="w-5 h-5 stroke-[1.75px]" />
              ) : (
                <Mic className="w-5 h-5 stroke-[1.75px]" />
              )}
            </button>

            {isVideoCall && (
              <button
                onClick={toggleVideo}
                className={`w-11 h-11 rounded-[9px] flex items-center justify-center transition-colors ${
                  isVideoOff
                    ? 'bg-[#D64545] text-white'
                    : 'bg-[#292929] hover:bg-[#333333] text-[#F5F5F5]'
                }`}
                title={isVideoOff ? 'Start camera' : 'Stop camera'}
                aria-label={isVideoOff ? 'Start camera' : 'Stop camera'}
              >
                {isVideoOff ? (
                  <VideoOff className="w-5 h-5 stroke-[1.75px]" />
                ) : (
                  <Video className="w-5 h-5 stroke-[1.75px]" />
                )}
              </button>
            )}

            <button
              onClick={endCall}
              className="w-11 h-11 rounded-[9px] bg-[#D64545] hover:bg-[#B83838] text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
              title="End Call"
              aria-label="End Call"
            >
              <PhoneOff className="w-5 h-5 stroke-[1.75px]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
