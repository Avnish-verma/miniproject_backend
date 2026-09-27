import React, { useState } from 'react';
import { useCall, CALL_STATES } from '../../context/CallContext';
import { ChevronDown, ChevronUp, Radio } from 'lucide-react';

export default function CallDebugPanel() {
  const {
    callState,
    activeCall,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoOff,
    callDuration,
    iceConnectionState,
    signalingState,
    peerConnectionState,
  } = useCall();

  const [isExpanded, setIsExpanded] = useState(false);

  // Only show when in an active call
  const isCallActive = callState !== CALL_STATES.IDLE;
  if (!isCallActive) return null;

  const localAudioTrack = localStream?.getAudioTracks()[0];
  const localVideoTrack = localStream?.getVideoTracks()[0];
  const remoteAudioTrack = remoteStream?.getAudioTracks()[0];
  const remoteVideoTrack = remoteStream?.getVideoTracks()[0];

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-[11px] select-none shadow-2xl">
      <div className="bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-xl overflow-hidden text-neutral-300 w-72 shadow-black/80">
        {/* Header bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-2.5 py-1.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between cursor-pointer hover:bg-neutral-850 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Radio
              className={`w-3.5 h-3.5 ${
                callState === CALL_STATES.CONNECTED
                  ? 'text-emerald-400 animate-pulse'
                  : isCallActive
                  ? 'text-amber-400 animate-pulse'
                  : 'text-neutral-500'
              }`}
            />
            <span className="font-semibold tracking-wide text-neutral-200">WebRTC Telemetry</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                callState === CALL_STATES.CONNECTED
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isCallActive
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {callState}
            </span>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </div>
        </div>

        {/* Expanded Panel */}
        {isExpanded && (
          <div className="p-3 space-y-2.5 max-h-96 overflow-y-auto">
            {/* Call Info */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Session</div>
              <div className="flex justify-between text-neutral-400">
                <span>Call ID:</span>
                <span className="text-neutral-200 truncate max-w-[170px]">
                  {activeCall?.callId || 'None'}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Call Type:</span>
                <span className="text-neutral-200 uppercase font-semibold">{activeCall?.type || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Duration:</span>
                <span className="text-neutral-200">{callDuration}s</span>
              </div>
            </div>

            <div className="h-px bg-neutral-800" />

            {/* Signaling & Connection */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">WebRTC States</div>
              <div className="flex justify-between text-neutral-400">
                <span>ICE State:</span>
                <span
                  className={
                    iceConnectionState === 'connected' || iceConnectionState === 'completed'
                      ? 'text-emerald-400 font-semibold'
                      : iceConnectionState === 'checking'
                      ? 'text-amber-400'
                      : 'text-neutral-300'
                  }
                >
                  {iceConnectionState}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Signaling:</span>
                <span className="text-neutral-200">{signalingState}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Peer Conn:</span>
                <span
                  className={
                    peerConnectionState === 'connected'
                      ? 'text-emerald-400 font-semibold'
                      : 'text-neutral-300'
                  }
                >
                  {peerConnectionState}
                </span>
              </div>
            </div>

            <div className="h-px bg-neutral-800" />

            {/* Local Media Tracks */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Local Tracks</div>
              <div className="flex justify-between text-neutral-400">
                <span>Mic Audio:</span>
                <span className={localAudioTrack?.enabled ? 'text-emerald-400' : 'text-rose-400'}>
                  {localAudioTrack ? (localAudioTrack.enabled ? 'ACTIVE (Muted: false)' : 'MUTED') : 'NONE'}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Camera Video:</span>
                <span className={localVideoTrack?.enabled ? 'text-emerald-400' : 'text-rose-400'}>
                  {localVideoTrack ? (localVideoTrack.enabled ? 'ACTIVE' : 'OFF') : 'NONE'}
                </span>
              </div>
            </div>

            <div className="h-px bg-neutral-800" />

            {/* Remote Media Tracks */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Remote Tracks</div>
              <div className="flex justify-between text-neutral-400">
                <span>Remote Audio:</span>
                <span className={remoteAudioTrack ? 'text-emerald-400' : 'text-neutral-500'}>
                  {remoteAudioTrack ? `READY (${remoteAudioTrack.readyState})` : 'NONE'}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Remote Video:</span>
                <span className={remoteVideoTrack ? 'text-emerald-400' : 'text-neutral-500'}>
                  {remoteVideoTrack ? `READY (${remoteVideoTrack.readyState})` : 'NONE'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
