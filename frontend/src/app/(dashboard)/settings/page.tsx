"use client"

import { useState } from "react"
import { useAuthStore } from "@/store/authStore"
import { useThemeStore } from "@/store/themeStore"
import api from "@/lib/api"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Moon, Sun, User, Bell, Palette, Camera, Shield, BookOpen } from "lucide-react"
import { ROLE_LABELS, ROLES } from "@/lib/constants"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const { theme, toggle } = useThemeStore()

  const isSitter = user?.role === ROLES.PET_SITTER

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name ?? "",
    phone: user?.phone ?? "",
  })
  const [savingProfile, setSavingProfile] = useState(false)

  // Sitter-specific state
  const [bio, setBio] = useState(user?.bio ?? "")
  const [savingBio, setSavingBio] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState({
    email_notifications: true,
    in_app_notifications: true,
  })
  const [savingNotifs, setSavingNotifs] = useState(false)

  const handleSaveProfile = async () => {
    if (!profileForm.full_name.trim()) {
      toast.error("Full name is required")
      return
    }
    setSavingProfile(true)
    try {
      const { data } = await api.patch("/users/me", {
        full_name: profileForm.full_name.trim(),
        phone: profileForm.phone.trim() || undefined,
      })
      updateUser(data)
      toast.success("Profile updated successfully")
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update profile")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveBio = async () => {
    setSavingBio(true)
    try {
      const { data } = await api.patch("/users/me", { bio: bio.trim() || null })
      updateUser(data)
      toast.success("Bio updated successfully")
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update bio")
    } finally {
      setSavingBio(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const { data } = await api.post("/users/me/photo", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      updateUser(data)
      toast.success("Profile photo updated")
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to upload photo")
    } finally {
      setUploadingPhoto(false)
      e.target.value = ""
    }
  }

  const handleSaveNotifications = async () => {
    setSavingNotifs(true)
    try {
      await api.patch("/notifications/preferences", notifPrefs)
      toast.success("Notification preferences saved")
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save preferences")
    } finally {
      setSavingNotifs(false)
    }
  }

  const roleLabel = user?.role ? (ROLE_LABELS[user.role] ?? user.role) : "Unknown"

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account preferences and profile</p>
      </div>

      {/* ──────────── SECTION 1: PROFILE ──────────── */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar + role badge row */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center overflow-hidden ring-4 ring-orange-50 dark:ring-orange-950">
                {user?.profile_photo_url ? (
                  <img
                    src={user.profile_photo_url}
                    alt={user.full_name}
                    className="w-20 h-20 object-cover rounded-full"
                  />
                ) : (
                  <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {user?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                  </span>
                )}
              </div>
              <button className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user?.full_name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                  "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                )}>
                  <Shield className="w-3 h-3" />
                  {roleLabel}
                </span>
                {user?.is_verified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </Label>
              <Input
                id="full_name"
                value={profileForm.full_name}
                onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Your full name"
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
                <span className="ml-1 text-gray-400 dark:text-gray-500 font-normal text-xs">(optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={profileForm.phone}
                onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
              <Input
                value={user?.email ?? ""}
                disabled
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6"
            >
              {savingProfile ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ──────────── SECTION 2: SITTER PROFILE (pet sitters only) ──────────── */}
      {isSitter && (
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              Sitter Profile
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Keep your profile up to date to attract more bookings. A great bio and photo help pet owners trust you.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile photo upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</Label>
              <div className="flex items-center gap-5">
                <div className="relative group w-20 h-20 flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center overflow-hidden ring-4 ring-orange-50 dark:ring-orange-950">
                    {user?.profile_photo_url ? (
                      <img
                        src={user.profile_photo_url}
                        alt={user.full_name}
                        className="w-20 h-20 object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {user?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                      </span>
                    )}
                  </div>
                  <label
                    htmlFor="sitter-photo-upload"
                    className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </label>
                  <input
                    id="sitter-photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hover over your photo and click to upload a new one.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPG, PNG or WebP · max 5 MB</p>
                  {uploadingPhoto && (
                    <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                      <span className="animate-spin inline-block w-3 h-3 border border-orange-500 border-t-transparent rounded-full" />
                      Uploading…
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label htmlFor="sitter-bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Bio
                <span className="ml-1 text-gray-400 dark:text-gray-500 font-normal text-xs">(optional)</span>
              </Label>
              <textarea
                id="sitter-bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell pet owners about yourself — your experience, the pets you love caring for, and what makes you a great sitter…"
                rows={4}
                maxLength={500}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 text-right">{bio.length}/500</p>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button
                onClick={handleSaveBio}
                disabled={savingBio}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6"
              >
                {savingBio ? "Saving…" : "Save Sitter Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ──────────── SECTION 3: APPEARANCE ──────────── */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Dark mode toggle card */}
          <div
            className={cn(
              "flex items-center justify-between p-5 rounded-xl border-2 cursor-pointer transition-all",
              theme === "dark"
                ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/40"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-800"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                theme === "dark"
                  ? "bg-gray-800 dark:bg-gray-700"
                  : "bg-amber-100 dark:bg-amber-900"
              )}>
                {theme === "dark" ? (
                  <Moon className="w-6 h-6 text-blue-400" />
                ) : (
                  <Sun className="w-6 h-6 text-amber-500" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Dark Mode</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Switch between light and dark theme
                </p>
                <p className={cn(
                  "text-xs font-medium mt-1",
                  theme === "dark" ? "text-orange-500 dark:text-orange-400" : "text-gray-400 dark:text-gray-500"
                )}>
                  Currently: {theme === "dark" ? "Dark" : "Light"} mode
                </p>
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={() => toggle()}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* ──────────── SECTION 4: NOTIFICATIONS ──────────── */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose how you want to be notified about activity in FurryFile.
          </p>

          {/* Email notifications */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div>
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Email Notifications</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Receive booking updates, appointment reminders, and alerts via email
              </p>
            </div>
            <Switch
              checked={notifPrefs.email_notifications}
              onCheckedChange={v => setNotifPrefs(p => ({ ...p, email_notifications: v }))}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>

          {/* In-app notifications */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div>
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">In-App Notifications</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Show notifications in the app bell icon and notification center
              </p>
            </div>
            <Switch
              checked={notifPrefs.in_app_notifications}
              onCheckedChange={v => setNotifPrefs(p => ({ ...p, in_app_notifications: v }))}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
            <Button
              onClick={handleSaveNotifications}
              disabled={savingNotifs}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6"
            >
              {savingNotifs ? "Saving…" : "Save Preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
