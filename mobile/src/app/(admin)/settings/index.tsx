import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  User,
  Shield,
  Settings2,
  Globe,
  Camera,
  Trash2,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Plus,
  Laptop,
  Smartphone,
  HardDrive,
  RefreshCw,
  Check,
  X,
  ExternalLink,
  Code,
  Award,
  Layers,
  FolderGit2,
  AtSign,
  Share2,
  Link2,
} from "lucide-react-native";
import { AdminTopBar } from "@/components/admin/admin-header";
import { AppBottomSheet } from "@/components/ui/app-bottom-sheet";
import { useAuth } from "@/context/auth-context";
import { getUserProfileImageUrl } from "@/lib/image-utils";
import {
  fetchAdminSettings,
  updateAdminProfileApi,
  updateProfileImageApi,
  removeProfileImageApi,
  updateAdminSocialLinksApi,
  updateSystemSettingApi,
  revokeAdminSessionApi,
  AdminSettingsData,
  AdminUserProfile,
} from "@/lib/admin-api";
import { clearOfflineDatabase } from "@/lib/offline-manager";
import { subscribeToMobileBroadcast } from "@/lib/supabase-client";
import statesDistrictsData from "@/lib/states-districts.json";

type SettingsTab = "profile" | "social" | "security" | "system";

const BRANCH_OPTIONS = ["CSE", "EE", "ME", "CE", "ECE"];
const GCEK_COLLEGE = "GOVERNMENT COLLEGE OF ENGINEERING KALAHANDI, BHAWANIPATNA";
const GCEK_ADDRESS = "AT-KANDHABANDO PALA, PO- RISIGAON, BHWANIPATNA, KALAHANDI, ODISHA, 766003";

export default function AdminSettingsScreen() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { user, signOut, updateUser } = useAuth();

  // Settings State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Settings Data from Server
  const [settingsData, setSettingsData] = useState<AdminSettingsData | null>(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState<Partial<AdminUserProfile>>({});
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCollegeType, setSelectedCollegeType] = useState<"GCEK" | "Other">("GCEK");

  // Social & Custom Links State
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [customLinks, setCustomLinks] = useState<Array<{ id: string; title: string; url: string }>>([]);

  // System Settings State
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean>(true);
  const [externalQuizEnabled, setExternalQuizEnabled] = useState<boolean>(false);
  const [githubOrgName, setGithubOrgName] = useState<string>("");
  const [updatingSystemKey, setUpdatingSystemKey] = useState<string | null>(null);

  // Modal pickers
  const pickerSheetRef = useRef<BottomSheetModal>(null);
  const [pickerModalType, setPickerModalType] = useState<"state" | "district" | "branch" | "admissionYear" | null>(null);

  const openPickerModal = (type: "state" | "district" | "branch" | "admissionYear") => {
    setPickerModalType(type);
    pickerSheetRef.current?.present();
  };

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await fetchAdminSettings(user?.id);
      if (data) {
        setSettingsData(data);
        if (data.user) {
          setProfileForm(data.user);
          setSelectedState(data.user.state || "");
          setSelectedCollegeType(data.user.collegeName === GCEK_COLLEGE ? "GCEK" : data.user.collegeName ? "Other" : "GCEK");
          setSocialLinks(data.user.socialLinks || {});
          setCustomLinks(data.user.customLinks || []);
        }
        if (data.systemSettings) {
          setRegistrationEnabled(data.systemSettings.registrationEnabled);
          setExternalQuizEnabled(data.systemSettings.externalQuizEnabled);
          setGithubOrgName(data.systemSettings.githubOrgName || "");
        }
      }
    } catch {
      // offline fallback
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();

    // Subscribe to Supabase Realtime channel for instant sync across Web & Mobile
    const unsubscribeSettings = subscribeToMobileBroadcast("admin-settings", "settings_change", () => {
      loadData(true);
    });
    const unsubscribeMembers = subscribeToMobileBroadcast("admin-members", "member_change", () => {
      loadData(true);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeMembers();
    };
  }, [loadData]);

  // Derived districts for selected state
  const availableDistricts = useMemo(() => {
    if (!selectedState) return [];
    const stateObj = statesDistrictsData.states.find((s) => s.state === selectedState);
    return stateObj ? stateObj.districts : [];
  }, [selectedState]);

  // Admission years list
  const currentYear = new Date().getFullYear();
  const admissionYears = useMemo(() => {
    return Array.from({ length: currentYear - 2022 + 2 }, (_, i) => (2023 + i).toString());
  }, [currentYear]);

  // Handle avatar upload via image picker
  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow access to your photo library to choose an avatar.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadingAvatar(true);

        const mimeType = asset.mimeType || "image/jpeg";
        const base64Data = asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri;

        const res = await updateProfileImageApi({
          userId: user?.id,
          image: base64Data,
        });

        if (res.success) {
          // Immediately update local AuthContext and stored user
          await updateUser({
            image: base64Data,
          });

          setProfileForm((prev) => ({
            ...prev,
            image: base64Data,
          }));

          Alert.alert("Success", "Profile avatar updated successfully!");
        } else {
          Alert.alert("Upload Notice", res.error || "Failed to update profile picture.");
        }
      }
    } catch {
      Alert.alert("Notice", "Could not pick image. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle avatar removal
  const handleRemoveAvatar = () => {
    Alert.alert(
      "Remove Avatar",
      "Are you sure you want to remove your profile picture and return to default initials?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setUploadingAvatar(true);
            try {
              const res = await removeProfileImageApi(user?.id);
              if (res.success) {
                await updateUser({
                  image: null,
                  profileImageKey: null,
                });
                setProfileForm((prev) => ({
                  ...prev,
                  image: null,
                  profileImageKey: null,
                }));
                Alert.alert("Success", "Profile avatar removed.");
              } else {
                Alert.alert("Error", res.error || "Failed to remove avatar.");
              }
            } catch {
              Alert.alert("Error", "Failed to remove avatar.");
            } finally {
              setUploadingAvatar(false);
            }
          },
        },
      ]
    );
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!profileForm.name?.trim()) {
      Alert.alert("Validation", "Display Name is required.");
      return;
    }

    setSavingProfile(true);
    try {
      const payload: Partial<AdminUserProfile> & { userId?: string } = {
        userId: user?.id,
        name: profileForm.name?.trim(),
        username: profileForm.username?.trim() || undefined,
        firstName: profileForm.firstName?.trim() || undefined,
        middleName: profileForm.middleName?.trim() || undefined,
        lastName: profileForm.lastName?.trim() || undefined,
        email: profileForm.email?.trim(),
        mobileNumber: profileForm.mobileNumber?.trim() || undefined,
        whatsappNumber: profileForm.whatsappNumber?.trim() || undefined,
        admissionYear: profileForm.admissionYear || undefined,
        registration: profileForm.registration?.trim() || undefined,
        rollNumber: profileForm.rollNumber?.trim() || undefined,
        branch: profileForm.branch || undefined,
        collegeName:
          selectedCollegeType === "GCEK"
            ? GCEK_COLLEGE
            : profileForm.collegeName?.trim() || undefined,
        collegeAddress:
          selectedCollegeType === "GCEK"
            ? GCEK_ADDRESS
            : profileForm.collegeAddress?.trim() || undefined,
        address: profileForm.address?.trim() || undefined,
        postOffice: profileForm.postOffice?.trim() || undefined,
        policeStation: profileForm.policeStation?.trim() || undefined,
        block: profileForm.block?.trim() || undefined,
        pinCode: profileForm.pinCode?.trim() || undefined,
        state: selectedState || undefined,
        district: profileForm.district || undefined,
      };

      const res = await updateAdminProfileApi(payload);
      if (res.success) {
        if (profileForm.name) {
          await updateUser({ name: profileForm.name });
        }
        Alert.alert("Profile Updated ✓", "Your admin profile details have been saved.");
      } else {
        Alert.alert("Save Error", res.error || "Failed to save profile changes.");
      }
    } catch {
      Alert.alert("Error", "Network connection failed.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Save social links
  const handleSaveSocial = async () => {
    setSavingSocial(true);
    try {
      const filteredCustom = customLinks.filter((l) => l.title.trim() && l.url.trim());
      const res = await updateAdminSocialLinksApi({
        userId: user?.id,
        socialLinks,
        customLinks: filteredCustom,
      });

      if (res.success) {
        Alert.alert("Saved ✓", "Social profiles and custom links updated successfully!");
      } else {
        Alert.alert("Error", res.error || "Failed to save social links.");
      }
    } catch {
      Alert.alert("Error", "Network connection failed.");
    } finally {
      setSavingSocial(false);
    }
  };

  // Toggle System Setting
  const handleToggleSystemSetting = async (key: "registration_enabled" | "external_quiz_enabled", currentVal: boolean) => {
    const nextVal = !currentVal;
    if (key === "registration_enabled") setRegistrationEnabled(nextVal);
    if (key === "external_quiz_enabled") setExternalQuizEnabled(nextVal);

    setUpdatingSystemKey(key);
    try {
      const res = await updateSystemSettingApi(key, nextVal);
      if (!res.success) {
        // Revert on error
        if (key === "registration_enabled") setRegistrationEnabled(currentVal);
        if (key === "external_quiz_enabled") setExternalQuizEnabled(currentVal);
        Alert.alert("Error", res.error || "Failed to update system setting.");
      }
    } catch {
      if (key === "registration_enabled") setRegistrationEnabled(currentVal);
      if (key === "external_quiz_enabled") setExternalQuizEnabled(currentVal);
    } finally {
      setUpdatingSystemKey(null);
    }
  };

  // Save GitHub Org Name
  const handleSaveGithubOrg = async () => {
    setUpdatingSystemKey("github_org_name");
    try {
      const res = await updateSystemSettingApi("github_org_name", githubOrgName.trim());
      if (res.success) {
        Alert.alert("Saved ✓", `GitHub organization updated to "${githubOrgName.trim()}"`);
      } else {
        Alert.alert("Error", res.error || "Failed to update GitHub Org.");
      }
    } catch {
      Alert.alert("Error", "Network error.");
    } finally {
      setUpdatingSystemKey(null);
    }
  };

  // Revoke session
  const handleRevokeSession = (sessionId: string, deviceName: string) => {
    Alert.alert(
      "Log Out Device",
      `Are you sure you want to terminate the session on ${deviceName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            const res = await revokeAdminSessionApi(sessionId);
            if (res.success) {
              setSettingsData((prev) =>
                prev ? { ...prev, sessions: prev.sessions.filter((s) => s.id !== sessionId) } : null
              );
              Alert.alert("Success", "Device logged out successfully.");
            } else {
              Alert.alert("Error", res.error || "Failed to revoke session.");
            }
          },
        },
      ]
    );
  };

  // Clear data cleanup
  const handleClearCache = async () => {
    Alert.alert(
      "Clear Local Offline Database",
      "This will clear the cached offline data on this device and re-download fresh data from the server.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Database",
          style: "destructive",
          onPress: async () => {
            await clearOfflineDatabase();
            Alert.alert("Database Cleaned ✓", "Local offline cache has been reset.");
            loadData();
          },
        },
      ]
    );
  };

  // Logout handler
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of the Admin Console?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const displayName = profileForm.name || user?.name || user?.email.split("@")[0] || "Admin";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const resolvedAvatarUrl = getUserProfileImageUrl({
    image: profileForm.image || user?.image,
    profileImageKey: profileForm.profileImageKey || user?.profileImageKey,
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header */}
      <AdminTopBar
        title="Settings"
        subtitle="Profile & system preferences"
      />

      {/* Tabs Navigation */}
      <View style={styles.tabsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("profile")}
            style={[styles.tabButton, activeTab === "profile" && styles.tabButtonActive]}
            activeOpacity={0.7}
          >
            <User size={16} color={activeTab === "profile" ? "#0F172A" : "#64748B"} />
            <Text style={[styles.tabButtonText, activeTab === "profile" && styles.tabButtonTextActive]}>
              Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("social")}
            style={[styles.tabButton, activeTab === "social" && styles.tabButtonActive]}
            activeOpacity={0.7}
          >
            <Globe size={16} color={activeTab === "social" ? "#0F172A" : "#64748B"} />
            <Text style={[styles.tabButtonText, activeTab === "social" && styles.tabButtonTextActive]}>
              Social & Links
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("security")}
            style={[styles.tabButton, activeTab === "security" && styles.tabButtonActive]}
            activeOpacity={0.7}
          >
            <Shield size={16} color={activeTab === "security" ? "#0F172A" : "#64748B"} />
            <Text style={[styles.tabButtonText, activeTab === "security" && styles.tabButtonTextActive]}>
              Security & Sessions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("system")}
            style={[styles.tabButton, activeTab === "system" && styles.tabButtonActive]}
            activeOpacity={0.7}
          >
            <Settings2 size={16} color={activeTab === "system" ? "#0F172A" : "#64748B"} />
            <Text style={[styles.tabButtonText, activeTab === "system" && styles.tabButtonTextActive]}>
              System
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <View style={styles.tabContent}>
              {/* Profile Picture Card */}
              <View style={styles.card}>
                <Text style={styles.sectionHeading}>Profile Picture</Text>
                <View style={styles.avatarRow}>
                  <View style={styles.avatarWrapper}>
                    {resolvedAvatarUrl ? (
                      <Image
                        source={{ uri: resolvedAvatarUrl }}
                        style={styles.avatarLarge}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View style={[styles.avatarLarge, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarPlaceholderText}>{userInitials}</Text>
                      </View>
                    )}
                    {uploadingAvatar && (
                      <View style={styles.avatarLoadingOverlay}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  <View style={styles.avatarActions}>
                    <TouchableOpacity
                      onPress={handlePickAvatar}
                      disabled={uploadingAvatar}
                      style={styles.changeAvatarBtn}
                      activeOpacity={0.8}
                    >
                      <Camera size={14} color="#4F46E5" />
                      <Text style={styles.changeAvatarBtnText}>Change Photo</Text>
                    </TouchableOpacity>

                    {resolvedAvatarUrl && (
                      <TouchableOpacity
                        onPress={handleRemoveAvatar}
                        disabled={uploadingAvatar}
                        style={styles.removeAvatarBtn}
                        activeOpacity={0.8}
                      >
                        <Trash2 size={14} color="#DC2626" />
                        <Text style={styles.removeAvatarBtnText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <Text style={styles.hintText}>
                  JPG, PNG or WEBP. Upload a clean square photo. Live-synchronized in realtime across website and mobile.
                </Text>
              </View>

              {/* Personal Information */}
              <View style={styles.card}>
                <Text style={styles.sectionHeading}>Personal Information</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Display Name <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={profileForm.name || ""}
                    onChangeText={(t) => setProfileForm((p) => ({ ...p, name: t }))}
                    placeholder="Your Full Name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelWithHint}>
                    <Text style={styles.inputLabel}>Username</Text>
                    <Text style={styles.subHint}>*can only change once in 14 days</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    value={profileForm.username || ""}
                    onChangeText={(t) => setProfileForm((p) => ({ ...p, username: t }))}
                    placeholder="e.g. johndoe"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.inputGroup, styles.colFlex]}>
                    <Text style={styles.inputLabel}>First Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={profileForm.firstName || ""}
                      onChangeText={(t) => setProfileForm((p) => ({ ...p, firstName: t }))}
                      placeholder="First"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.colFlex]}>
                    <Text style={styles.inputLabel}>Middle Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={profileForm.middleName || ""}
                      onChangeText={(t) => setProfileForm((p) => ({ ...p, middleName: t }))}
                      placeholder="Middle"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profileForm.lastName || ""}
                    onChangeText={(t) => setProfileForm((p) => ({ ...p, lastName: t }))}
                    placeholder="Last Name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={[styles.textInput, styles.disabledInput]}
                    value={profileForm.email || user?.email || ""}
                    editable={false}
                  />
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.inputGroup, styles.colFlex]}>
                    <Text style={styles.inputLabel}>Mobile Number</Text>
                    <TextInput
                      style={styles.textInput}
                      value={profileForm.mobileNumber || ""}
                      onChangeText={(t) => setProfileForm((p) => ({ ...p, mobileNumber: t }))}
                      placeholder="+91 9876543210"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.colFlex]}>
                    <Text style={styles.inputLabel}>WhatsApp Number</Text>
                    <TextInput
                      style={styles.textInput}
                      value={profileForm.whatsappNumber || ""}
                      onChangeText={(t) => setProfileForm((p) => ({ ...p, whatsappNumber: t }))}
                      placeholder="+91 9876543210"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>

              {/* Academic Details */}
              <View style={styles.card}>
                <Text style={styles.sectionHeading}>Academic Information</Text>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.inputGroup, styles.colFlex]}>
                    <Text style={styles.inputLabel}>Admission Year</Text>
                    <TouchableOpacity
                      onPress={() => openPickerModal("admissionYear")}
                      style={styles.selectTrigger}
                    >
                      <Text style={profileForm.admissionYear ? styles.selectValueText : styles.placeholderText}>
                        {profileForm.admissionYear || "Select Year"}
                      </Text>
                      <ChevronRight size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.inputGroup, styles.colFlex]}>
                    <Text style={styles.inputLabel}>Branch</Text>
                    <TouchableOpacity
                      onPress={() => openPickerModal("branch")}
                      style={styles.selectTrigger}
                    >
                      <Text style={profileForm.branch ? styles.selectValueText : styles.placeholderText}>
                        {profileForm.branch || "Select Branch"}
                      </Text>
                      <ChevronRight size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.inputGroup, styles.colFlex]}>
                    <Text style={styles.inputLabel}>Registration No.</Text>
                    <TextInput
                      style={styles.textInput}
                      value={profileForm.registration || ""}
                      onChangeText={(t) => setProfileForm((p) => ({ ...p, registration: t }))}
                      placeholder="Reg Number"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.colFlex]}>
                    <Text style={styles.inputLabel}>Roll Number</Text>
                    <TextInput
                      style={styles.textInput}
                      value={profileForm.rollNumber || ""}
                      onChangeText={(t) => setProfileForm((p) => ({ ...p, rollNumber: t }))}
                      placeholder="Roll No"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>College</Text>
                  <View style={styles.collegeTypeRow}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedCollegeType("GCEK");
                        setProfileForm((p) => ({ ...p, collegeName: GCEK_COLLEGE, collegeAddress: GCEK_ADDRESS }));
                      }}
                      style={[
                        styles.collegeTypeBtn,
                        selectedCollegeType === "GCEK" && styles.collegeTypeBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.collegeTypeBtnText,
                          selectedCollegeType === "GCEK" && styles.collegeTypeBtnTextActive,
                        ]}
                      >
                        GCEK, Bhawanipatna
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setSelectedCollegeType("Other");
                        setProfileForm((p) => ({ ...p, collegeName: "", collegeAddress: "" }));
                      }}
                      style={[
                        styles.collegeTypeBtn,
                        selectedCollegeType === "Other" && styles.collegeTypeBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.collegeTypeBtnText,
                          selectedCollegeType === "Other" && styles.collegeTypeBtnTextActive,
                        ]}
                      >
                        Other
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {selectedCollegeType === "Other" && (
                    <TextInput
                      style={[styles.textInput, { marginTop: 8 }]}
                      value={profileForm.collegeName || ""}
                      onChangeText={(t) => setProfileForm((p) => ({ ...p, collegeName: t }))}
                      placeholder="Enter college name"
                      placeholderTextColor="#94A3B8"
                    />
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>College Address</Text>
                  <TextInput
                    style={[styles.textInput, selectedCollegeType === "GCEK" && styles.disabledInput]}
                    value={selectedCollegeType === "GCEK" ? GCEK_ADDRESS : profileForm.collegeAddress || ""}
                    onChangeText={(t) => setProfileForm((p) => ({ ...p, collegeAddress: t }))}
                    placeholder="College Address"
                    placeholderTextColor="#94A3B8"
                    editable={selectedCollegeType === "Other"}
                  />
                </View>
              </View>

              {/* Address Details */}
              <View style={styles.card}>
                <Text style={styles.sectionHeading}>Address Information</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Street / Locality Address</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profileForm.address || ""}
                    onChangeText={(t) => setProfileForm((p) => ({ ...p, address: t }))}
                    placeholder="Street / Flat / Colony"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.inputGroup, styles.colFlex]}>
                    <Text style={styles.inputLabel}>Post Office</Text>
                    <TextInput
                      style={styles.textInput}
                      value={profileForm.postOffice || ""}
                      onChangeText={(t) => setProfileForm((p) => ({ ...p, postOffice: t }))}
                      placeholder="Post Office"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.colFlex]}>
                    <Text style={styles.inputLabel}>Police Station</Text>
                    <TextInput
                      style={styles.textInput}
                      value={profileForm.policeStation || ""}
                      onChangeText={(t) => setProfileForm((p) => ({ ...p, policeStation: t }))}
                      placeholder="Police Station"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.inputGroup, styles.colFlex]}>
                    <Text style={styles.inputLabel}>Block</Text>
                    <TextInput
                      style={styles.textInput}
                      value={profileForm.block || ""}
                      onChangeText={(t) => setProfileForm((p) => ({ ...p, block: t }))}
                      placeholder="Block"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.colFlex]}>
                    <Text style={styles.inputLabel}>Pin Code</Text>
                    <TextInput
                      style={styles.textInput}
                      value={profileForm.pinCode || ""}
                      onChangeText={(t) => setProfileForm((p) => ({ ...p, pinCode: t }))}
                      placeholder="Pin Code"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.inputGroup, styles.colFlex]}>
                    <Text style={styles.inputLabel}>State</Text>
                    <TouchableOpacity
                      onPress={() => openPickerModal("state")}
                      style={styles.selectTrigger}
                    >
                      <Text style={selectedState ? styles.selectValueText : styles.placeholderText}>
                        {selectedState || "Select State"}
                      </Text>
                      <ChevronRight size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.inputGroup, styles.colFlex]}>
                    <Text style={styles.inputLabel}>District</Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (!selectedState) {
                          Alert.alert("Notice", "Please select a state first.");
                          return;
                        }
                        openPickerModal("district");
                      }}
                      style={styles.selectTrigger}
                    >
                      <Text style={profileForm.district ? styles.selectValueText : styles.placeholderText}>
                        {profileForm.district || "Select District"}
                      </Text>
                      <ChevronRight size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={savingProfile}
                style={styles.saveMainBtn}
                activeOpacity={0.8}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.saveMainBtnText}>Save Profile Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 2: SOCIAL & LINKS */}
          {activeTab === "social" && (
            <View style={styles.tabContent}>
              {/* GitHub Status Card */}
              <View style={styles.card}>
                <View style={styles.githubBanner}>
                  <View style={styles.githubBannerIcon}>
                    <FolderGit2 size={20} color="#0F172A" />
                  </View>
                  <View style={styles.githubBannerInfo}>
                    <Text style={styles.githubBannerTitle}>GitHub Contribution Graph</Text>
                    <Text style={styles.githubBannerSub}>
                      {profileForm.githubUsername
                        ? `Connected as @${profileForm.githubUsername}`
                        : "Link your GitHub in Account Security to show your live commit graph"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Social Profiles Grid */}
              <View style={styles.card}>
                <Text style={styles.sectionHeading}>Social & Coding Profiles</Text>
                <Text style={styles.cardSubText}>
                  Add your handles and competitive programming profile links.
                </Text>

                <View style={styles.socialInputRow}>
                  <View style={styles.socialIconBox}>
                    <Share2 size={18} color="#0A66C2" />
                  </View>
                  <TextInput
                    style={styles.socialTextInput}
                    value={socialLinks.linkedin || ""}
                    onChangeText={(t) => setSocialLinks((s) => ({ ...s, linkedin: t }))}
                    placeholder="LinkedIn Profile URL / handle"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.socialInputRow}>
                  <View style={styles.socialIconBox}>
                    <AtSign size={18} color="#1DA1F2" />
                  </View>
                  <TextInput
                    style={styles.socialTextInput}
                    value={socialLinks.twitter || ""}
                    onChangeText={(t) => setSocialLinks((s) => ({ ...s, twitter: t }))}
                    placeholder="Twitter / X handle"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.socialInputRow}>
                  <View style={styles.socialIconBox}>
                    <AtSign size={18} color="#E4405F" />
                  </View>
                  <TextInput
                    style={styles.socialTextInput}
                    value={socialLinks.instagram || ""}
                    onChangeText={(t) => setSocialLinks((s) => ({ ...s, instagram: t }))}
                    placeholder="Instagram handle"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.socialInputRow}>
                  <View style={styles.socialIconBox}>
                    <Globe size={18} color="#059669" />
                  </View>
                  <TextInput
                    style={styles.socialTextInput}
                    value={socialLinks.portfolio || ""}
                    onChangeText={(t) => setSocialLinks((s) => ({ ...s, portfolio: t }))}
                    placeholder="Portfolio / Personal Website URL"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.socialInputRow}>
                  <View style={styles.socialIconBox}>
                    <Code size={18} color="#FFA116" />
                  </View>
                  <TextInput
                    style={styles.socialTextInput}
                    value={socialLinks.leetcode || ""}
                    onChangeText={(t) => setSocialLinks((s) => ({ ...s, leetcode: t }))}
                    placeholder="LeetCode Profile URL / username"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.socialInputRow}>
                  <View style={styles.socialIconBox}>
                    <Award size={18} color="#1890FF" />
                  </View>
                  <TextInput
                    style={styles.socialTextInput}
                    value={socialLinks.codeforces || ""}
                    onChangeText={(t) => setSocialLinks((s) => ({ ...s, codeforces: t }))}
                    placeholder="Codeforces handle"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Custom External Links */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.sectionHeading}>Custom Links</Text>
                    <Text style={styles.cardSubText}>Blogs, YouTube, or project showcase</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      if (customLinks.length >= 6) {
                        Alert.alert("Limit Reached", "You can add up to 6 custom links.");
                        return;
                      }
                      setCustomLinks([
                        ...customLinks,
                        { id: Date.now().toString(), title: "", url: "" },
                      ]);
                    }}
                    style={styles.addLinkBtn}
                    activeOpacity={0.8}
                  >
                    <Plus size={14} color="#4F46E5" />
                    <Text style={styles.addLinkBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {customLinks.length === 0 ? (
                  <View style={styles.emptyLinksBox}>
                    <Text style={styles.emptyLinksText}>
                      No custom links added yet. Tap "+ Add" above to link your Medium blog, resume, or featured apps.
                    </Text>
                  </View>
                ) : (
                  customLinks.map((link, idx) => (
                    <View key={link.id || idx} style={styles.customLinkItem}>
                      <View style={styles.customLinkInputs}>
                        <TextInput
                          style={styles.customLinkTitleInput}
                          value={link.title}
                          onChangeText={(t) => {
                            const updated = [...customLinks];
                            updated[idx].title = t;
                            setCustomLinks(updated);
                          }}
                          placeholder="Link Title (e.g. My Tech Blog)"
                          placeholderTextColor="#94A3B8"
                        />
                        <TextInput
                          style={styles.customLinkUrlInput}
                          value={link.url}
                          onChangeText={(t) => {
                            const updated = [...customLinks];
                            updated[idx].url = t;
                            setCustomLinks(updated);
                          }}
                          placeholder="https://..."
                          placeholderTextColor="#94A3B8"
                          autoCapitalize="none"
                        />
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          setCustomLinks(customLinks.filter((_, i) => i !== idx));
                        }}
                        style={styles.deleteCustomLinkBtn}
                      >
                        <Trash2 size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              {/* Save Social Links Button */}
              <TouchableOpacity
                onPress={handleSaveSocial}
                disabled={savingSocial}
                style={styles.saveMainBtn}
                activeOpacity={0.8}
              >
                {savingSocial ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.saveMainBtnText}>Save Social Links</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 3: ACCOUNT SECURITY & SESSIONS */}
          {activeTab === "security" && (
            <View style={styles.tabContent}>
              {/* Account Credentials */}
              <View style={styles.card}>
                <Text style={styles.sectionHeading}>Account Information</Text>

                <View style={styles.infoRow}>
                  <View>
                    <Text style={styles.infoLabel}>Email Address</Text>
                    <Text style={styles.infoValue}>{profileForm.email || user?.email}</Text>
                  </View>
                  <View style={styles.verifiedBadge}>
                    <CheckCircle2 size={13} color="#059669" />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View>
                    <Text style={styles.infoLabel}>Member Since</Text>
                    <Text style={styles.infoValue}>
                      {profileForm.createdAt
                        ? new Date(profileForm.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Active Member"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Google Drive Storage */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.driveHeader}>
                    <HardDrive size={18} color="#0F172A" />
                    <Text style={styles.sectionHeading}>Google Drive Storage</Text>
                  </View>
                  <View style={settingsData?.googleDrive.isConnected ? styles.activeBadge : styles.inactiveBadge}>
                    <Text style={settingsData?.googleDrive.isConnected ? styles.activeBadgeText : styles.inactiveBadgeText}>
                      {settingsData?.googleDrive.isConnected ? "CONNECTED" : "NOT CONNECTED"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardSubText}>
                  Stores member resumes, submission files, and form uploads directly to cloud storage.
                </Text>
              </View>

              {/* Active Admin & Co-Admin Sessions */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.sectionHeading}>Active Sessions & Logged Devices</Text>
                  <TouchableOpacity onPress={() => loadData(true)} style={styles.reloadBtn}>
                    <RefreshCw size={13} color="#4F46E5" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardSubText}>
                  Inspect and remotely terminate logged-in devices across Admin & Co-Admin accounts.
                </Text>

                {(!settingsData?.sessions || settingsData.sessions.length === 0) ? (
                  <View style={styles.emptySessionsBox}>
                    <Smartphone size={20} color="#94A3B8" />
                    <Text style={styles.emptySessionsText}>This device is the current active session.</Text>
                  </View>
                ) : (
                  <View style={styles.sessionsList}>
                    {settingsData.sessions.map((sess) => {
                      const isMobileDevice = sess.userAgent?.toLowerCase().includes("mobile") || sess.userAgent?.toLowerCase().includes("android") || sess.userAgent?.toLowerCase().includes("iphone");

                      return (
                        <View key={sess.id} style={styles.sessionItem}>
                          <View style={styles.sessionItemLeft}>
                            <View style={styles.deviceIcon}>
                              {isMobileDevice ? (
                                <Smartphone size={18} color="#4F46E5" />
                              ) : (
                                <Laptop size={18} color="#059669" />
                              )}
                            </View>
                            <View style={styles.sessionItemInfo}>
                              <Text style={styles.sessionUserName} numberOfLines={1}>
                                {sess.userName} ({sess.userEmail})
                              </Text>
                              <Text style={styles.sessionDeviceSub} numberOfLines={1}>
                                {sess.ipAddress} • {new Date(sess.createdAt).toLocaleDateString("en-IN")}
                              </Text>
                            </View>
                          </View>

                          <TouchableOpacity
                            onPress={() => handleRevokeSession(sess.id, sess.userName)}
                            style={styles.revokeBtn}
                            activeOpacity={0.7}
                          >
                            <LogOut size={14} color="#DC2626" />
                            <Text style={styles.revokeBtnText}>Log Out</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* TAB 4: SYSTEM SETTINGS */}
          {activeTab === "system" && (
            <View style={styles.tabContent}>
              {/* User Registration Toggle */}
              <View style={styles.card}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleTitle}>User Registration</Text>
                    <Text style={styles.toggleDescription}>
                      Control whether new students and members can register on the CodeBreakers platform.
                    </Text>
                  </View>
                  <Switch
                    value={registrationEnabled}
                    onValueChange={() => handleToggleSystemSetting("registration_enabled", registrationEnabled)}
                    trackColor={{ false: "#E2E8F0", true: "#C7D2FE" }}
                    thumbColor={registrationEnabled ? "#4F46E5" : "#94A3B8"}
                    disabled={updatingSystemKey === "registration_enabled"}
                  />
                </View>
              </View>

              {/* External Quiz System Toggle */}
              <View style={styles.card}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleTitle}>External Quiz & Live Sockets</Text>
                    <Text style={styles.toggleDescription}>
                      Activate or shut down external kiosk registration terminals, candidate exam rooms, and real-time Socket.IO monitors.
                    </Text>
                  </View>
                  <Switch
                    value={externalQuizEnabled}
                    onValueChange={() => handleToggleSystemSetting("external_quiz_enabled", externalQuizEnabled)}
                    trackColor={{ false: "#E2E8F0", true: "#C7D2FE" }}
                    thumbColor={externalQuizEnabled ? "#4F46E5" : "#94A3B8"}
                    disabled={updatingSystemKey === "external_quiz_enabled"}
                  />
                </View>
              </View>

              {/* GitHub Organization Setting */}
              <View style={styles.card}>
                <Text style={styles.sectionHeading}>GitHub Organization</Text>
                <Text style={styles.cardSubText}>
                  The official GitHub organization used to fetch repositories and club activities.
                </Text>

                <View style={styles.githubOrgInputRow}>
                  <TextInput
                    style={styles.githubOrgInput}
                    value={githubOrgName}
                    onChangeText={setGithubOrgName}
                    placeholder="e.g. codebreakers-club"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={handleSaveGithubOrg}
                    disabled={updatingSystemKey === "github_org_name"}
                    style={styles.saveGhOrgBtn}
                    activeOpacity={0.8}
                  >
                    {updatingSystemKey === "github_org_name" ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveGhOrgBtnText}>Update</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Data Cleanup */}
              <View style={styles.card}>
                <Text style={styles.sectionHeading}>Data Cleanup & Offline Storage</Text>
                <Text style={styles.cardSubText}>
                  Clear local SQLite offline database and cached statistics on this device. Fresh data will be retrieved from the server.
                </Text>

                <TouchableOpacity
                  onPress={handleClearCache}
                  style={styles.cleanupBtn}
                  activeOpacity={0.8}
                >
                  <Trash2 size={16} color="#DC2626" />
                  <Text style={styles.cleanupBtnText}>Clear Local Offline Cache</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Log Out Button */}
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutCard}
            activeOpacity={0.8}
          >
            <LogOut size={18} color="#DC2626" />
            <Text style={styles.logoutText}>Log Out from Admin Console</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SELECTOR BOTTOM SHEET PICKER */}
      <AppBottomSheet
        ref={pickerSheetRef}
        snapPoints={["60%"]}
        title={
          pickerModalType === "state"
            ? "Select State"
            : pickerModalType === "district"
            ? "Select District"
            : pickerModalType === "branch"
            ? "Select Branch"
            : "Select Admission Year"
        }
        subtitle="Tap an option to select"
        onClose={() => setPickerModalType(null)}
      >
        <FlatList
          data={
            pickerModalType === "state"
              ? statesDistrictsData.states.map((s) => s.state)
              : pickerModalType === "district"
              ? availableDistricts
              : pickerModalType === "branch"
              ? BRANCH_OPTIONS
              : admissionYears
          }
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected =
              pickerModalType === "state"
                ? selectedState === item
                : pickerModalType === "district"
                ? profileForm.district === item
                : pickerModalType === "branch"
                ? profileForm.branch === item
                : profileForm.admissionYear === item;

            return (
              <TouchableOpacity
                onPress={() => {
                  if (pickerModalType === "state") {
                    setSelectedState(item);
                    setProfileForm((p) => ({ ...p, state: item, district: "" }));
                  } else if (pickerModalType === "district") {
                    setProfileForm((p) => ({ ...p, district: item }));
                  } else if (pickerModalType === "branch") {
                    setProfileForm((p) => ({ ...p, branch: item }));
                  } else if (pickerModalType === "admissionYear") {
                    setProfileForm((p) => ({ ...p, admissionYear: item }));
                  }
                  pickerSheetRef.current?.dismiss();
                  setPickerModalType(null);
                }}
                style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
              >
                <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                  {item}
                </Text>
                {isSelected && <Check size={16} color="#4F46E5" />}
              </TouchableOpacity>
            );
          }}
          style={styles.modalList}
        />
      </AppBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  tabsBar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 10,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  tabButtonActive: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  tabButtonTextActive: {
    color: "#0F172A",
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
    gap: 16,
  },
  tabContent: {
    gap: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  cardSubText: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 4,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  avatarPlaceholder: {
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  avatarLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  changeAvatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  changeAvatarBtnText: {
    color: "#4F46E5",
    fontSize: 13,
    fontWeight: "700",
  },
  removeAvatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  removeAvatarBtnText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
  },
  hintText: {
    fontSize: 11,
    color: "#94A3B8",
    lineHeight: 15,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  requiredStar: {
    color: "#DC2626",
  },
  labelWithHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subHint: {
    fontSize: 11,
    color: "#94A3B8",
  },
  textInput: {
    height: 42,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#0F172A",
  },
  disabledInput: {
    backgroundColor: "#F1F5F9",
    color: "#64748B",
  },
  rowTwoCols: {
    flexDirection: "row",
    gap: 12,
  },
  colFlex: {
    flex: 1,
  },
  selectTrigger: {
    height: 42,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectValueText: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },
  placeholderText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  collegeTypeRow: {
    flexDirection: "row",
    gap: 10,
  },
  collegeTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  collegeTypeBtnActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  collegeTypeBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
  collegeTypeBtnTextActive: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  saveMainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0F172A",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveMainBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  githubBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  githubBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  githubBannerInfo: {
    flex: 1,
  },
  githubBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  githubBannerSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  socialInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
  },
  socialIconBox: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  socialTextInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addLinkBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },
  emptyLinksBox: {
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyLinksText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  customLinkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  customLinkInputs: {
    flex: 1,
    gap: 6,
  },
  customLinkTitleInput: {
    height: 34,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 13,
    color: "#0F172A",
  },
  customLinkUrlInput: {
    height: 34,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#0F172A",
  },
  deleteCustomLinkBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  roleTag: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  driveHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activeBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#059669",
  },
  inactiveBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
  },
  reloadBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#EEF2FF",
  },
  emptySessionsBox: {
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    alignItems: "center",
    gap: 6,
  },
  emptySessionsText: {
    fontSize: 12,
    color: "#64748B",
  },
  sessionsList: {
    gap: 8,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sessionItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  deviceIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sessionItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  sessionUserName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  sessionDeviceSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  revokeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  revokeBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  toggleDescription: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 16,
  },
  githubOrgInputRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  githubOrgInput: {
    flex: 1,
    height: 42,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#0F172A",
  },
  saveGhOrgBtn: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveGhOrgBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  cleanupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cleanupBtnText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },
  logoutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    padding: 16,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginTop: 8,
  },
  logoutText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 30,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalList: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modalOptionSelected: {
    backgroundColor: "#EEF2FF",
  },
  modalOptionText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
  },
  modalOptionTextSelected: {
    color: "#4F46E5",
    fontWeight: "700",
  },
});
