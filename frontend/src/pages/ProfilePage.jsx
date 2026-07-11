import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import TiltCard from "../components/TiltCard";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  return (
    <div className="min-h-screen bg-surface text-ink pt-20 pb-10 relative overflow-hidden ambient-glow">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <TiltCard className="relative z-[1]">
            <div className="bg-surface-2 rounded-2xl p-6 sm:p-8 space-y-8 border border-line shadow-elevation-2">
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight text-ink">Profile</h1>
                <p className="mt-2 text-ink-muted text-sm">Your profile information</p>
              </div>

              {/* avatar upload section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <img
                    src={selectedImg || authUser.profilePic || "/avatar.png"}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-surface-3 shadow-elevation-2"
                  />
              <label
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 bg-accent text-white p-2 rounded-full cursor-pointer transition-all duration-200 shadow-elevation-2 ${isUpdatingProfile ? "animate-pulse pointer-events-none" : "hover:scale-105 hover:bg-accent-hover hover:shadow-glow-accent"}`}
              >
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-ink-muted">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-ink-muted flex items-center gap-2 font-medium">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-surface-3 rounded-lg border border-line text-ink">{authUser?.fullName}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-ink-muted flex items-center gap-2 font-medium">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-surface-3 rounded-lg border border-line text-ink">{authUser?.email}</p>
            </div>
          </div>

          <div className="mt-8 bg-surface-3 rounded-xl p-6 border border-line shadow-elevation-1">
            <h2 className="text-xl font-semibold tracking-tight mb-4 text-ink">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-line">
                <span className="text-ink-muted">Member Since</span>
                <span className="text-ink">{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-ink-muted">Account Status</span>
                <span className="text-online font-medium">Active</span>
              </div>
            </div>
          </div>
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </div>
  );
};
export default ProfilePage;
