import { useCallStore } from "../store/useCallStore";
import { useEffect, useRef, useState } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

const InCallScreen = () => {
  const { activeCall, localStream, remoteStream, endCall, callStatus } = useCallStore();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!activeCall) return null;

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col">
      <div className="flex-1 relative">
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-3">
            <span className="text-xl animate-pulse">
              {callStatus === "calling" ? "Calling..." : "Connecting..."}
            </span>
          </div>
        )}
        
        <div className="absolute bottom-24 right-4 w-32 h-48 bg-surface-2 rounded-xl overflow-hidden shadow-2xl border border-line">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      
      <div className="h-24 bg-surface flex items-center justify-center gap-6 pb-4 pt-2">
        <button 
          onClick={toggleMute}
          className={`size-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? "bg-red-500/20 text-red-500" : "bg-surface-2 text-ink hover:bg-surface-3"}`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button 
          onClick={endCall}
          className="size-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
        >
          <PhoneOff size={24} />
        </button>
        <button 
          onClick={toggleVideo}
          className={`size-12 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? "bg-red-500/20 text-red-500" : "bg-surface-2 text-ink hover:bg-surface-3"}`}
        >
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>
      </div>
    </div>
  );
};
export default InCallScreen;
