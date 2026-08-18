"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, LogOut, Loader2 } from "lucide-react";
import Image from "next/image";

import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { subscribeToAllUsers, updateOwnProfile } from "@/lib/users";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type { UserProfile } from "@/types/user";

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");

  useEffect(() => {
    // Wait for auth to initialize
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      
      // Subscribe to all users to find our local profile
      const unsubUsers = subscribeToAllUsers((users) => {
        const myProfile = users.find(u => u.uid === user.uid);
        if (myProfile) {
          setProfile(myProfile);
          // Only initialize inputs if we haven't typed in them yet
          setEditName(prev => prev === "" && myProfile.name ? myProfile.name : prev);
          setEditBio(prev => prev === "" && myProfile.bio ? myProfile.bio : prev);
        }
        setIsLoading(false);
      });

      return () => unsubUsers();
    });

    return () => unsubAuth();
  }, [router]);

  const isDirty = profile && (editName !== (profile.name || "") || editBio !== (profile.bio || ""));

  const handleSave = async () => {
    if (!profile || !auth.currentUser) return;
    setIsSaving(true);
    try {
      await updateOwnProfile(auth.currentUser.uid, {
        name: editName,
        bio: editBio,
      });
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile || !auth.currentUser) return;

    setIsUploading(true);
    try {
      const { url } = await uploadToCloudinary(file);
      await updateOwnProfile(auth.currentUser.uid, { photoUrl: url });
    } catch (err) {
      console.error("Failed to upload avatar", err);
      alert("Failed to upload avatar image");
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await signOut(auth);
      router.push("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse pb-12">
        <div className="h-10 w-48 bg-surface-container rounded-lg"></div>
        <div className="h-[400px] bg-surface-container rounded-[16px] border border-outline-variant"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-8 pb-12 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-on-surface">Settings</h1>

      <div className="bg-surface-container rounded-[16px] p-6 sm:p-8 border border-outline-variant">
        <h2 className="text-xl font-semibold text-on-surface mb-6">Public Profile</h2>
        
        <div className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div 
                onClick={handleAvatarClick}
                className="w-20 h-20 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant cursor-pointer group relative flex items-center justify-center"
              >
                {profile.photoUrl ? (
                  <Image 
                    src={profile.photoUrl} 
                    alt="Avatar" 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <span className="text-3xl text-on-surface-variant font-medium">
                    {(profile.name || "U").charAt(0).toUpperCase()}
                  </span>
                )}
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface">Profile Picture</p>
              <p className="text-xs text-on-surface-variant mt-1">Click the avatar to upload a new one. JPEG, PNG, or WebP.</p>
            </div>
          </div>

          <hr className="border-outline-variant" />

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant text-on-surface rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">
                Bio
              </label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                className="w-full bg-surface-container-high border border-outline-variant text-on-surface rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-container transition-all resize-none"
                placeholder="Tell us a little bit about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email || ""}
                disabled
                className="w-full bg-surface-container-high/50 border border-outline-variant/50 text-on-surface-variant rounded-lg px-4 py-2 cursor-not-allowed"
              />
              <p className="text-xs text-on-surface-variant mt-1">Email cannot be changed here.</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="flex items-center gap-2 bg-primary-container text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-container/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface-container rounded-[16px] p-6 sm:p-8 border border-outline-variant">
        <h2 className="text-xl font-semibold text-on-surface mb-6">Account Details</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface">Role</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Your current permission level.</p>
            </div>
            <span className="px-3 py-1 bg-primary-container/20 text-primary-container text-xs font-medium rounded-full uppercase tracking-wider">
              {profile.role}
            </span>
          </div>

          <hr className="border-outline-variant" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface">Member Since</p>
              <p className="text-xs text-on-surface-variant mt-0.5">When you first joined.</p>
            </div>
            <span className="text-sm text-on-surface-variant">
              {profile.createdAt?.toDate 
                ? profile.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
                : "Unknown"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-surface-container rounded-[16px] p-6 sm:p-8 border border-error-container">
        <h2 className="text-xl font-semibold text-error mb-2">Danger Zone</h2>
        <p className="text-sm text-on-surface-variant mb-6">Sign out of your administrator account.</p>
        
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-error border border-error hover:bg-error/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

    </div>
  );
}
