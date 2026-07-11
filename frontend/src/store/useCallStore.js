import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" }
  ]
};

export const useCallStore = create((set, get) => ({
  peerConnection: null,
  localStream: null,
  remoteStream: null,
  incomingCall: null,
  activeCall: null,
  callStatus: "idle",
  callStartTime: null,

  initCall: async (peerId, isVideo = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      set({ localStream: stream, activeCall: { peerId, isVideo }, callStatus: "calling" });

      const pc = new RTCPeerConnection(ICE_SERVERS);
      set({ peerConnection: pc });

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        set({ remoteStream: event.streams[0] });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const socket = useAuthStore.getState().socket;
          socket.emit("ice-candidate", { receiverId: peerId, candidate: event.candidate });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const socket = useAuthStore.getState().socket;
      socket.emit("call-offer", { receiverId: peerId, offer, isVideo });

    } catch (e) {
      toast.error("Could not access camera/microphone");
      get().endCall();
    }
  },

  acceptCall: async () => {
    const { incomingCall } = get();
    if (!incomingCall) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: incomingCall.isVideo, audio: true });
      set({ localStream: stream, activeCall: { peerId: incomingCall.callerId, isVideo: incomingCall.isVideo }, callStatus: "connected", callStartTime: Date.now() });

      const pc = new RTCPeerConnection(ICE_SERVERS);
      set({ peerConnection: pc });

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        set({ remoteStream: event.streams[0] });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const socket = useAuthStore.getState().socket;
          socket.emit("ice-candidate", { receiverId: incomingCall.callerId, candidate: event.candidate });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const socket = useAuthStore.getState().socket;
      socket.emit("call-answer", { receiverId: incomingCall.callerId, answer });
      set({ incomingCall: null });

    } catch (e) {
      toast.error("Could not accept call");
      get().endCall();
    }
  },

  declineCall: () => {
    const { incomingCall } = get();
    if (incomingCall) {
      const socket = useAuthStore.getState().socket;
      socket.emit("end-call", { receiverId: incomingCall.callerId });
    }
    set({ incomingCall: null });
  },

  endCall: async () => {
    const { peerConnection, localStream, activeCall, callStartTime, callStatus } = get();
    
    if (localStream) localStream.getTracks().forEach(track => track.stop());
    if (peerConnection) peerConnection.close();
    
    if (activeCall) {
      const socket = useAuthStore.getState().socket;
      socket.emit("end-call", { receiverId: activeCall.peerId });
      
      if (callStatus === "connected" && callStartTime) {
        const duration = Math.floor((Date.now() - callStartTime) / 1000);
        try {
          await axiosInstance.post("/calls/log", { calleeId: activeCall.peerId, duration });
        } catch (e) {
          // ignore log failure
        }
      }
    }

    set({ peerConnection: null, localStream: null, remoteStream: null, activeCall: null, callStatus: "idle", incomingCall: null, callStartTime: null });
  },

  subscribeToCalls: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("call-offer", ({ senderId, offer, isVideo }) => {
      if (get().activeCall || get().incomingCall) {
        socket.emit("end-call", { receiverId: senderId });
        return;
      }
      set({ incomingCall: { callerId: senderId, offer, isVideo } });
    });

    socket.on("call-answer", async ({ senderId, answer }) => {
      const pc = get().peerConnection;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        set({ callStatus: "connected", callStartTime: Date.now() });
      }
    });

    socket.on("ice-candidate", async ({ senderId, candidate }) => {
      const pc = get().peerConnection;
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch(e) {}
      }
    });

    socket.on("end-call", () => {
      get().endCall();
    });
  },

  unsubscribeFromCalls: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("call-offer");
      socket.off("call-answer");
      socket.off("ice-candidate");
      socket.off("end-call");
    }
  },
}));
