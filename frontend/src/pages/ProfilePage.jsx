import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Edit2, Check, X, AtSign, Info, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import TiltCard from "../components/TiltCard";
import { applyMotion, fadeUp, useMotionPreferences } from "../lib/motion";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  
  const [editMode, setEditMode] = useState({ username: false, about: false });
  const [formData, setFormData] = useState({
    username: authUser?.username || "",
    about: authUser?.about || "",
  });
  const { shouldReduceMotion } = useMotionPreferences();

  const handleSave = async (field) => {
    if (formData[field] === authUser[field]) {
      setEditMode({ ...editMode, [field]: false });
      return;
    }
    await updateProfile({ [field]: formData[field] });
    setEditMode({ ...editMode, [field]: false });
  };

  const handleCancel = (field) => {
    setFormData({ ...formData, [field]: authUser[field] });
    setEditMode({ ...editMode, [field]: false });
  };

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
          {...applyMotion(fadeUp, shouldReduceMotion)}
        >
          <TiltCard className="relative z-[1]">
            <div className="bg-surface-2 rounded-2xl p-6 sm:p-8 space-y-8 border border-line shadow-elevation-2">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left relative">
                <Link to="/" className="p-2 rounded-full text-ink-muted hover:text-ink hover:bg-surface-3 transition-colors focus:outline-none focus:ring-2 focus:ring-accent absolute left-0 top-1/2 -translate-y-1/2" aria-label="Go back">
                  <ArrowLeft className="size-5" />
                </Link>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold tracking-tight text-ink">Profile</h1>
                  <p className="mt-1 text-ink-muted text-sm">Your profile information</p>
                </div>
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
                aria-label="Upload profile picture"
                className={`absolute bottom-0 right-0 bg-accent text-white p-2 rounded-full cursor-pointer transition-all duration-200 shadow-elevation-2 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-surface focus-within:ring-accent ${isUpdatingProfile ? "animate-pulse pointer-events-none" : "hover:scale-105 hover:bg-accent-hover hover:shadow-glow-accent"}`}
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
            {/* Username */}
            <div className="space-y-1.5">
              <div className="text-sm text-ink-muted flex items-center gap-2 font-medium">
                <AtSign className="w-4 h-4" />
                Username
              </div>
              <div className="flex items-center gap-2">
                {editMode.username ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 bg-surface-2 border border-accent rounded-lg focus:outline-none text-ink shadow-glow-accent"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
                      autoFocus
                    />
                    <button onClick={() => handleSave("username")} aria-label="Save username" className="p-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-accent" disabled={isUpdatingProfile}>
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleCancel("username")} aria-label="Cancel" className="p-2 bg-surface-3 text-ink rounded-lg hover:bg-surface-2 transition-colors border border-line focus:outline-none focus:ring-2 focus:ring-accent">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 px-4 py-2.5 bg-surface-3 rounded-lg border border-line text-ink flex items-center justify-between group">
                    <span>@{authUser?.username}</span>
                    <button onClick={() => setEditMode({ ...editMode, username: true })} aria-label="Edit username" className="text-ink-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:opacity-100 focus:ring-2 focus:ring-accent rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* About */}
            <div className="space-y-1.5">
              <div className="text-sm text-ink-muted flex items-center gap-2 font-medium">
                <Info className="w-4 h-4" />
                About
              </div>
              <div className="flex items-center gap-2">
                {editMode.about ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 bg-surface-2 border border-accent rounded-lg focus:outline-none text-ink shadow-glow-accent"
                      value={formData.about}
                      onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                      autoFocus
                    />
                    <button onClick={() => handleSave("about")} aria-label="Save about" className="p-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-accent" disabled={isUpdatingProfile}>
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleCancel("about")} aria-label="Cancel" className="p-2 bg-surface-3 text-ink rounded-lg hover:bg-surface-2 transition-colors border border-line focus:outline-none focus:ring-2 focus:ring-accent">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 px-4 py-2.5 bg-surface-3 rounded-lg border border-line text-ink flex items-center justify-between group">
                    <span>{authUser?.about}</span>
                    <button onClick={() => setEditMode({ ...editMode, about: true })} aria-label="Edit about" className="text-ink-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:opacity-100 focus:ring-2 focus:ring-accent rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <div className="text-sm text-ink-muted flex items-center gap-2 font-medium">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-surface-3 rounded-lg border border-line text-ink opacity-70 cursor-not-allowed">{authUser?.fullName}</p>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <div className="text-sm text-ink-muted flex items-center gap-2 font-medium">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-surface-3 rounded-lg border border-line text-ink opacity-70 cursor-not-allowed">{authUser?.email}</p>
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
