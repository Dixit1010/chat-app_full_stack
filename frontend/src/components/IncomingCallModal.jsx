import { useCallStore } from "../store/useCallStore";
import { Phone, PhoneOff, Video } from "lucide-react";

const IncomingCallModal = () => {
  const { incomingCall, acceptCall, declineCall } = useCallStore();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
        <div className="size-20 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
          {incomingCall.isVideo ? <Video size={36} /> : <Phone size={36} />}
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">Incoming Call</h2>
        <p className="text-ink-muted mb-8">Incoming call requested...</p>
        
        <div className="flex justify-center gap-6">
          <button 
            onClick={declineCall}
            className="size-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
          >
            <PhoneOff size={24} />
          </button>
          <button 
            onClick={acceptCall}
            className="size-14 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors"
          >
            {incomingCall.isVideo ? <Video size={24} /> : <Phone size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
};
export default IncomingCallModal;
