import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const CallContext = createContext();

export const CALL_STATES = {
  IDLE: 'IDLE',
  OUTGOING_CALL: 'OUTGOING_CALL',
  RINGING: 'RINGING',
  INCOMING_CALL: 'INCOMING_CALL',
  ACCEPTING: 'ACCEPTING',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  ENDING: 'ENDING',
};

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const RINGING_TIMEOUT_MS = 35000;

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [incomingCall, setIncomingCall] = useState(null); // { callId, caller, callType }
  const [activeCall, setActiveCall] = useState(null); // { callId, recipientUser, type }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Debug metrics
  const [iceConnectionState, setIceConnectionState] = useState('new');
  const [signalingState, setSignalingState] = useState('stable');
  const [peerConnectionState, setPeerConnectionState] = useState('new');

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const timerRef = useRef(null);
  const ringingTimerRef = useRef(null);
  const iceCandidateQueueRef = useRef([]);
  const isCallerRef = useRef(false);
  const activeCallRef = useRef(null);

  // Keep activeCallRef in sync
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  const clearRingingTimer = () => {
    if (ringingTimerRef.current) {
      clearTimeout(ringingTimerRef.current);
      ringingTimerRef.current = null;
    }
  };

  const startTimer = () => {
    setCallDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Drain queued remote ICE candidates once remote description is ready
  const drainIceCandidates = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) return;

    while (iceCandidateQueueRef.current.length > 0) {
      const candidate = iceCandidateQueueRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[WebRTC] Error adding queued ICE candidate:', err);
      }
    }
  };

  // Clean up media streams and peer connection
  const cleanupCall = useCallback((reason = null) => {
    if (reason) {
      console.log(`[CallContext] Cleaning up call. Reason: ${reason}`);
    }

    clearRingingTimer();
    stopTimer();

    // Stop local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('[WebRTC] Error stopping local track:', e);
        }
      });
      localStreamRef.current = null;
    }

    // Stop remote media tracks
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('[WebRTC] Error stopping remote track:', e);
        }
      });
      remoteStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {
        console.warn('[WebRTC] Error closing peer connection:', e);
      }
      peerConnectionRef.current = null;
    }

    iceCandidateQueueRef.current = [];
    isCallerRef.current = false;

    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
    setIncomingCall(null);
    setIsAudioMuted(false);
    setIsVideoOff(false);
    setCallDuration(0);
    setIceConnectionState('new');
    setSignalingState('stable');
    setPeerConnectionState('new');
    setCallState(CALL_STATES.IDLE);
  }, []);

  // Setup WebRTC peer connection
  const createPeerConnection = (callId) => {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {
        console.warn('[WebRTC] Peer connection close failed:', e);
      }
      peerConnectionRef.current = null;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Track remote media
    pc.ontrack = (event) => {
      console.log('[WebRTC] ontrack event received:', event.track.kind);
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setRemoteStream(event.streams[0]);
      } else {
        let stream = remoteStreamRef.current;
        if (!stream) {
          stream = new MediaStream();
          remoteStreamRef.current = stream;
        }
        stream.addTrack(event.track);
        setRemoteStream(new MediaStream(stream.getTracks()));
      }
    };

    // ICE Candidate gathering
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:ice-candidate', {
          callId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE Connection State:', pc.iceConnectionState);
      setIceConnectionState(pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setCallState(CALL_STATES.CONNECTED);
      } else if (pc.iceConnectionState === 'failed') {
        console.warn('[WebRTC] ICE Connection failed. Ending call.');
        cleanupCall('ICE connection failed');
      }
    };

    pc.onsignalingstatechange = () => {
      setSignalingState(pc.signalingState);
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection State:', pc.connectionState);
      setPeerConnectionState(pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState(CALL_STATES.CONNECTED);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupCall('Connection state closed/failed');
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Acquire local media stream with resilient fallbacks
  const getMediaStream = async (type = 'video') => {
    try {
      const constraints = {
        audio: true,
        video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('[WebRTC] Requested getUserMedia failed:', err.name, err.message);
      // Fallback: If video failed, attempt audio-only
      if (type === 'video') {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = audioStream;
          setLocalStream(audioStream);
          setIsVideoOff(true);
          return audioStream;
        } catch (audioErr) {
          console.error('[WebRTC] Audio device fallback error:', audioErr);
        }
      }
      return null;
    }
  };

  // Socket event listeners for WebRTC signaling
  useEffect(() => {
    if (!socket) return;

    // 1. Incoming call event (Callee)
    const handleIncomingCall = ({ callId, caller, callType }) => {
      setIncomingCall({ callId, caller, callType });
      setActiveCall({ callId, recipientUser: caller, type: callType });
      setCallState(CALL_STATES.INCOMING_CALL);
      isCallerRef.current = false;
    };

    // 2. Ringing state for caller
    const handleRinging = ({ callId }) => {
      setCallState(CALL_STATES.RINGING);
    };

    // 3. Callee accepted call -> Caller transitions to CONNECTING & creates WebRTC Offer
    const handleAccepted = async ({ callId, callerId }) => {
      // Only the caller generates the SDP Offer to prevent glare/collision
      if (!isCallerRef.current) return;

      clearRingingTimer();
      setCallState(CALL_STATES.CONNECTING);
      startTimer();

      const pc = peerConnectionRef.current;
      if (pc) {
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);
          socket.emit('call:offer', { callId, sdp: offer });
        } catch (err) {
          console.error('[WebRTC] Error creating or setting local offer:', err);
        }
      }
    };

    // 4. Callee receives WebRTC Offer -> creates WebRTC Answer
    const handleOffer = async ({ callId, sdp }) => {
      const pc = peerConnectionRef.current;
      if (pc && sdp) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          await drainIceCandidates();

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('call:answer', { callId, sdp: answer });

          setCallState(CALL_STATES.CONNECTED);
          startTimer();
        } catch (err) {
          console.error('[WebRTC] Error handling offer and creating answer:', err);
        }
      }
    };

    // 5. Caller receives WebRTC Answer
    const handleAnswer = async ({ sdp }) => {
      const pc = peerConnectionRef.current;
      if (pc && sdp) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          await drainIceCandidates();
          setCallState(CALL_STATES.CONNECTED);
        } catch (err) {
          console.error('[WebRTC] Error setting remote answer description:', err);
        }
      }
    };

    // 6. ICE Candidate received (Bidirectional)
    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      const pc = peerConnectionRef.current;
      if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
        iceCandidateQueueRef.current.push(candidate);
      } else {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC] Error adding ICE candidate directly:', err);
        }
      }
    };

    // 7. Call Rejected or Busy
    const handleRejected = ({ reason }) => {
      const message = reason === 'busy' ? 'User is busy on another call.' : 'Call was declined.';
      alert(message);
      cleanupCall('Call rejected/busy');
    };

    // 8. Call Cancelled by caller
    const handleCancelled = () => {
      cleanupCall('Call cancelled by caller');
    };

    // 9. Call Ended by peer
    const handleEnded = () => {
      cleanupCall('Call ended by peer');
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:ringing', handleRinging);
    socket.on('call:accepted', handleAccepted);
    socket.on('call:offer', handleOffer);
    socket.on('call:answer', handleAnswer);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:rejected', handleRejected);
    socket.on('call:cancelled', handleCancelled);
    socket.on('call:ended', handleEnded);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:ringing', handleRinging);
      socket.off('call:accepted', handleAccepted);
      socket.off('call:offer', handleOffer);
      socket.off('call:answer', handleAnswer);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:rejected', handleRejected);
      socket.off('call:cancelled', handleCancelled);
      socket.off('call:ended', handleEnded);
    };
  }, [socket, cleanupCall]);

  // Window unload / page hide cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentCall = activeCallRef.current;
      if (socket && currentCall?.callId) {
        if (isCallerRef.current && (callState === CALL_STATES.OUTGOING_CALL || callState === CALL_STATES.RINGING)) {
          socket.emit('call:cancel', { callId: currentCall.callId });
        } else {
          socket.emit('call:end', { callId: currentCall.callId, duration: callDuration });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [socket, callState, callDuration]);

  // Initiate call (Caller)
  const startCall = async ({ recipientId, recipientUser, type = 'video' }) => {
    if (!socket) return;

    cleanupCall('Initiating new call');
    isCallerRef.current = true;
    setActiveCall({ recipientUser, type });
    setCallState(CALL_STATES.OUTGOING_CALL);

    const stream = await getMediaStream(type);

    socket.emit('call:initiate', { recipientId, type }, async (response) => {
      if (response && response.error) {
        alert(response.error);
        cleanupCall('Initiate call response error');
        return;
      }

      const callId = response.call._id;
      setActiveCall((prev) => ({ ...prev, callId, recipientUser, type }));

      const pc = createPeerConnection(callId);
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      // 35s ringing timeout for auto-cancellation if callee doesn't answer
      clearRingingTimer();
      ringingTimerRef.current = setTimeout(() => {
        if (isCallerRef.current) {
          socket.emit('call:cancel', { callId });
          alert('No answer. Call cancelled.');
          cleanupCall('Ringing timeout');
        }
      }, RINGING_TIMEOUT_MS);
    });
  };

  // Accept incoming call (Callee)
  const acceptCall = async () => {
    if (!socket || !incomingCall) return;

    clearRingingTimer();
    isCallerRef.current = false;
    const { callId, caller, callType } = incomingCall;
    setActiveCall({ recipientUser: caller, type: callType, callId });
    setCallState(CALL_STATES.ACCEPTING);

    const stream = await getMediaStream(callType);
    const pc = createPeerConnection(callId);

    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    socket.emit('call:accept', { callId }, (res) => {
      if (res && res.error) {
        alert(res.error);
        cleanupCall('Accept call response error');
      } else {
        setCallState(CALL_STATES.CONNECTING);
      }
    });
  };

  // Reject incoming call (Callee)
  const rejectCall = (reason = 'declined') => {
    clearRingingTimer();
    if (socket && incomingCall) {
      socket.emit('call:reject', { callId: incomingCall.callId, reason });
    }
    cleanupCall('Rejected by user');
  };

  // End call (Hangup)
  const endCall = () => {
    clearRingingTimer();
    const currentCall = activeCallRef.current || activeCall;
    if (socket && currentCall && currentCall.callId) {
      if (isCallerRef.current && (callState === CALL_STATES.OUTGOING_CALL || callState === CALL_STATES.RINGING)) {
        socket.emit('call:cancel', { callId: currentCall.callId });
      } else {
        socket.emit('call:end', { callId: currentCall.callId, duration: callDuration });
      }
    }
    cleanupCall('Hangup');
  };

  // Toggle audio mute
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video stream
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        incomingCall,
        activeCall,
        localStream,
        remoteStream,
        isAudioMuted,
        isVideoOff,
        callDuration,
        iceConnectionState,
        signalingState,
        peerConnectionState,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleAudio,
        toggleVideo,
        cleanupCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
