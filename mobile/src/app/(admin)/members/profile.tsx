import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  MoreHorizontal,
  GraduationCap,
  MapPin,
  Globe,
  Award,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  Layers,
  Edit3,
  Trash2,
  Ban,
  X,
  Sparkles,
  Check,
  ChevronRight,
  ExternalLink,
  Copy,
  Calendar,
  User,
} from "lucide-react-native";
import {
  fetchAdminData,
  mutateAdminData,
  RealMemberFullProfile,
  RealBatch,
} from "@/lib/admin-api";
import { useSupabaseRealtime } from "@/hooks/use-realtime";
import { AppBottomSheet, AppBottomSheetRef } from "@/components/ui/app-bottom-sheet";

export default function MemberProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const memberId = params.id;

  const [member, setMember] = useState<RealMemberFullProfile | null>(null);
  const [batches, setBatches] = useState<RealBatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Detail Modal / Expand State
  const sectionSheetRef = useRef<AppBottomSheetRef>(null);
  const actionMenuSheetRef = useRef<AppBottomSheetRef>(null);
  const [selectedSection, setSelectedSection] = useState<
    "personal" | "academic" | "address" | "socials" | "activity" | null
  >(null);

  // Action Menu State
  const [menuVisible, setMenuVisible] = useState(false);

  const openSectionSheet = (sec: "personal" | "academic" | "address" | "socials" | "activity") => {
    setSelectedSection(sec);
    sectionSheetRef.current?.present();
  };

  const openMenuSheet = () => {
    setMenuVisible(true);
    actionMenuSheetRef.current?.present();
  };

  // PanResponder for swipe-down to dismiss action menu bottom sheet
  const menuPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 8;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 40 || gestureState.vy > 0.3) {
          setMenuVisible(false);
        }
      },
    })
  ).current;

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTab, setEditTab] = useState<"personal" | "academic" | "address" | "socials">("personal");
  const [saving, setSaving] = useState(false);

  // Editable Form Fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("Member");
  const [formBranch, setFormBranch] = useState("CSE");
  const [formBatchId, setFormBatchId] = useState("");
  const [formSpecializedDomain, setFormSpecializedDomain] = useState("");
  const [formFirstName, setFormFirstName] = useState("");
  const [formMiddleName, setFormMiddleName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formMobileNumber, setFormMobileNumber] = useState("");
  const [formWhatsappNumber, setFormWhatsappNumber] = useState("");
  const [formAadhaarNumber, setFormAadhaarNumber] = useState("");
  const [formCollegeName, setFormCollegeName] = useState("");
  const [formCollegeAddress, setFormCollegeAddress] = useState("");
  const [formRollNumber, setFormRollNumber] = useState("");
  const [formRegistration, setFormRegistration] = useState("");
  const [formAdmissionYear, setFormAdmissionYear] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formState, setFormState] = useState("");
  const [formDistrict, setFormDistrict] = useState("");
  const [formPostOffice, setFormPostOffice] = useState("");
  const [formPoliceStation, setFormPoliceStation] = useState("");
  const [formBlock, setFormBlock] = useState("");
  const [formPinCode, setFormPinCode] = useState("");
  const [formGithubUsername, setFormGithubUsername] = useState("");
  const [formLinkedin, setFormLinkedin] = useState("");
  const [formTwitter, setFormTwitter] = useState("");
  const [formPortfolio, setFormPortfolio] = useState("");
  const [formInstagram, setFormInstagram] = useState("");
  const [formLeetCode, setFormLeetCode] = useState("");
  const [formCodeforces, setFormCodeforces] = useState("");

  const loadMemberData = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    const [detail, batchList] = await Promise.all([
      fetchAdminData<RealMemberFullProfile>("member-detail", { id: memberId }),
      fetchAdminData<RealBatch[]>("batches"),
    ]);

    if (detail) {
      setMember(detail);
      // Pre-fill form state
      setFormName(detail.name || "");
      setFormEmail(detail.email || "");
      setFormRole(detail.role || "Member");
      setFormBranch(detail.branch || "CSE");
      setFormBatchId(detail.batchId || "");
      setFormSpecializedDomain(detail.specializedDomain || "");
      setFormFirstName(detail.firstName || "");
      setFormMiddleName(detail.middleName || "");
      setFormLastName(detail.lastName || "");
      setFormUsername(detail.username || "");
      setFormMobileNumber(detail.mobileNumber || "");
      setFormWhatsappNumber(detail.whatsappNumber || "");
      setFormAadhaarNumber(detail.aadhaarNumber || "");
      setFormCollegeName(detail.collegeName || "");
      setFormCollegeAddress(detail.collegeAddress || "");
      setFormRollNumber(detail.rollNumber || "");
      setFormRegistration(detail.registration || "");
      setFormAdmissionYear(detail.admissionYear || "");
      setFormAddress(detail.address || "");
      setFormState(detail.state || "");
      setFormDistrict(detail.district || "");
      setFormPostOffice(detail.postOffice || "");
      setFormPoliceStation(detail.policeStation || "");
      setFormBlock(detail.block || "");
      setFormPinCode(detail.pinCode || "");
      setFormGithubUsername(detail.githubUsername || "");

      const s = (detail.socialLinks as Record<string, string>) || {};
      setFormLinkedin(s.linkedin || "");
      setFormTwitter(s.twitter || "");
      setFormPortfolio(s.portfolio || "");
      setFormInstagram(s.instagram || "");
      setFormLeetCode(s.leetcode || "");
      setFormCodeforces(s.codeforces || "");
    }
    if (batchList) setBatches(batchList);
    setLoading(false);
  }, [memberId]);

  useEffect(() => {
    loadMemberData();
  }, [loadMemberData]);

  // Real-time synchronization for this member's profile
  useSupabaseRealtime({
    channel: "admin-members",
    event: "member_change",
    onUpdate: (payload) => {
      if (!payload?.id || payload.id === memberId) {
        loadMemberData();
      }
    },
  });

  const handleSaveProfile = async () => {
    if (!member) return;
    if (!formEmail.trim()) {
      Alert.alert("Error", "Email address is required.");
      return;
    }

    setSaving(true);
    const socialLinksObj = {
      linkedin: formLinkedin.trim(),
      twitter: formTwitter.trim(),
      portfolio: formPortfolio.trim(),
      instagram: formInstagram.trim(),
      leetcode: formLeetCode.trim(),
      codeforces: formCodeforces.trim(),
    };

    const res = await mutateAdminData("update-member", {
      id: member.id,
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      role: formRole,
      branch: formBranch,
      batchId: formBatchId || "none",
      specializedDomain: formSpecializedDomain.trim(),
      firstName: formFirstName.trim(),
      middleName: formMiddleName.trim(),
      lastName: formLastName.trim(),
      username: formUsername.trim(),
      mobileNumber: formMobileNumber.trim(),
      whatsappNumber: formWhatsappNumber.trim(),
      aadhaarNumber: formAadhaarNumber.trim(),
      collegeName: formCollegeName.trim(),
      collegeAddress: formCollegeAddress.trim(),
      rollNumber: formRollNumber.trim(),
      registration: formRegistration.trim(),
      admissionYear: formAdmissionYear.trim(),
      address: formAddress.trim(),
      state: formState.trim(),
      district: formDistrict.trim(),
      postOffice: formPostOffice.trim(),
      policeStation: formPoliceStation.trim(),
      block: formBlock.trim(),
      pinCode: formPinCode.trim(),
      githubUsername: formGithubUsername.trim(),
      socialLinks: socialLinksObj,
    });
    setSaving(false);

    if (res.success) {
      setEditModalVisible(false);
      Alert.alert("Success", "Member profile updated successfully.");
      loadMemberData();
    } else {
      Alert.alert("Error", res.error || "Failed to update profile.");
    }
  };

  const handleToggleBan = async () => {
    if (!member) return;
    setMenuVisible(false);
    const newBanState = !member.banned;
    const actionText = newBanState ? "Ban" : "Unban";

    Alert.alert(
      `${actionText} Member`,
      `Are you sure you want to ${actionText.toLowerCase()} ${member.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionText,
          style: newBanState ? "destructive" : "default",
          onPress: async () => {
            const res = await mutateAdminData("toggle-ban-member", {
              id: member.id,
              banned: newBanState,
              banReason: newBanState ? "Administrative review" : null,
            });
            if (res.success) {
              setMember((prev) => (prev ? { ...prev, banned: newBanState } : null));
              Alert.alert("Success", `Member has been ${newBanState ? "banned" : "unbanned"}.`);
            } else {
              Alert.alert("Error", res.error || "Action failed.");
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!member) return;
    setMenuVisible(false);
    Alert.alert(
      "Delete Member",
      `Are you sure you want to permanently delete ${member.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await mutateAdminData("delete-member", { id: member.id });
            if (res.success) {
              Alert.alert("Deleted", "Member removed from database.", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } else {
              Alert.alert("Error", res.error || "Failed to delete member.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.rootContainer, { paddingTop: insets.top || 16 }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#E0F2FE" />
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Profile</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingLabel}>Loading Profile...</Text>
        </View>
      </View>
    );
  }

  if (!member) {
    return (
      <View style={[styles.rootContainer, { paddingTop: insets.top || 16 }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#E0F2FE" />
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Profile</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.centerBox}>
          <Text style={styles.emptyHeader}>Member Not Found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Return</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const sLinks = (member.socialLinks as Record<string, string>) || {};
  const primaryDomain = member.specializedDomain ? member.specializedDomain.split(",")[0].trim() : null;

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#E0F2FE" />

      {/* Atmospheric Top Ambient Gradient Background */}
      <View style={[styles.topAmbientBg, { paddingTop: insets.top || 12 }]}>
        {/* 1. Header Navigation Bar */}
        <View style={styles.topNav}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.navBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.navTitle}>Profile</Text>

          <TouchableOpacity
            onPress={openMenuSheet}
            style={styles.navBtn}
            activeOpacity={0.7}
          >
            <MoreHorizontal size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* 2. User Profile Hero Row (Matches Reference UI) */}
        <View style={styles.heroRow}>
          {/* Avatar Squircle with Edit Pencil Badge */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarSquircle}>
              <Text style={styles.avatarInitial}>
                {member.name ? member.name.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editPencilBadge}
              activeOpacity={0.8}
              onPress={() => setEditModalVisible(true)}
            >
              <Edit3 size={13} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* User Details & Chips */}
          <View style={styles.heroDetails}>
            <Text style={styles.heroName} numberOfLines={1}>
              {member.name}
            </Text>

            <View style={styles.heroLocationRow}>
              <MapPin size={13} color="#64748B" />
              <Text style={styles.heroLocationText} numberOfLines={1}>
                {member.collegeName || "GCEK Bhawanipatna"} • {member.branch || "CSE"}
              </Text>
            </View>

            {/* Colorful Pill Chips */}
            <View style={styles.heroChipsRow}>
              <View style={styles.roleChip}>
                <Text style={styles.roleChipText}>{member.role || "Member"}</Text>
              </View>

              {primaryDomain ? (
                <View style={styles.domainChip}>
                  <Text style={styles.domainChipText}>{primaryDomain}</Text>
                </View>
              ) : member.batch ? (
                <View style={styles.domainChip}>
                  <Text style={styles.domainChipText}>{member.batch.name}</Text>
                </View>
              ) : null}

              {member.banned && (
                <View style={styles.bannedChip}>
                  <Text style={styles.bannedChipText}>Banned</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 3. 3-Column Minimalist Metrics Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{member.stats?.totalPoints || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{member.stats?.attendanceCount || 0}</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{member.stats?.taskSubmissionCount || 0}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
        </View>
      </View>

      {/* 4. Grouped Profile Cards (White Section) */}
      <ScrollView
        contentContainerStyle={[styles.scrollBody, { paddingBottom: (insets.bottom || 16) + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeaderTitle}>Your Club Profile</Text>

        {/* Card 1: Personal Details */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.7}
          onPress={() => openSectionSheet("personal")}
        >
          <View style={[styles.cardIconBox, { backgroundColor: "#EEF2FF" }]}>
            <User size={22} color="#4F46E5" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Personal Details</Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {member.email} • {member.username ? `@${member.username}` : (member.cbUserId || "Member ID")}
            </Text>
          </View>
          <ChevronRight size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Card 2: Academic & Batch */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.7}
          onPress={() => openSectionSheet("academic")}
        >
          <View style={[styles.cardIconBox, { backgroundColor: "#FEF3C7" }]}>
            <GraduationCap size={22} color="#D97706" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Academic & Batch Info</Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {member.branch || "CSE"} • {member.batch ? member.batch.name : "Unassigned"} • {member.admissionYear || "2023"}
            </Text>
          </View>
          <ChevronRight size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Card 3: Address & Location */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.7}
          onPress={() => openSectionSheet("address")}
        >
          <View style={[styles.cardIconBox, { backgroundColor: "#FFF1F2" }]}>
            <MapPin size={22} color="#E11D48" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Address & Contact</Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {[member.district, member.state].filter(Boolean).join(", ") || member.address || "Location Details"}
            </Text>
          </View>
          <ChevronRight size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Card 4: Socials & Portfolio */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.7}
          onPress={() => openSectionSheet("socials")}
        >
          <View style={[styles.cardIconBox, { backgroundColor: "#F0F9FF" }]}>
            <Globe size={22} color="#0284C7" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Social Profiles & Links</Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {member.githubUsername ? `@${member.githubUsername}` : "GitHub, LinkedIn, Portfolios"}
            </Text>
          </View>
          <ChevronRight size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Card 5: Activity & Points Breakdown */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.7}
          onPress={() => openSectionSheet("activity")}
        >
          <View style={[styles.cardIconBox, { backgroundColor: "#ECFDF5" }]}>
            <Award size={22} color="#059669" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Points & Achievements</Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {member.stats?.totalPoints || 0} Total pts • {member.stats?.quizAttemptCount || 0} Quizzes
            </Text>
          </View>
          <ChevronRight size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Edit Button at bottom */}
        <TouchableOpacity
          style={styles.bottomEditBtn}
          activeOpacity={0.8}
          onPress={() => setEditModalVisible(true)}
        >
          <Edit3 size={18} color="#FFFFFF" />
          <Text style={styles.bottomEditBtnText}>Edit Member Details</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 5. Section Detail Bottom Sheet */}
      <AppBottomSheet
        ref={sectionSheetRef}
        snapPoints={["68%", "90%"]}
        title={
          selectedSection === "personal"
            ? "Personal Information"
            : selectedSection === "academic"
            ? "Academic & Batch Details"
            : selectedSection === "address"
            ? "Address & Location"
            : selectedSection === "socials"
            ? "Social Profiles & Links"
            : "Points & Engagement"
        }
        subtitle="Member profile segment overview"
        scrollable
        onClose={() => setSelectedSection(null)}
      >
        {selectedSection === "personal" && (
          <View style={styles.sheetContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{member.name || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{member.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Username</Text>
              <Text style={styles.infoValue}>{member.username ? `@${member.username}` : "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>CB User ID</Text>
              <Text style={[styles.infoValue, { color: "#0284C7", fontWeight: "700" }]}>{member.cbUserId || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              <Text style={styles.infoValue}>{member.mobileNumber || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>WhatsApp</Text>
              <Text style={styles.infoValue}>{member.whatsappNumber || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Aadhaar Number</Text>
              <Text style={styles.infoValue}>{member.aadhaarNumber || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Verification</Text>
              <Text style={styles.infoValue}>{member.emailVerified ? "✅ Verified" : "⏳ Pending"}</Text>
            </View>
            <View style={styles.infoRowNoBorder}>
              <Text style={styles.infoLabel}>Logins</Text>
              <Text style={styles.infoValue}>{member.loginCount} times</Text>
            </View>
          </View>
        )}

        {selectedSection === "academic" && (
          <View style={styles.sheetContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>College Name</Text>
              <Text style={styles.infoValue}>{member.collegeName || "GCEK Bhawanipatna"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Branch / Stream</Text>
              <Text style={styles.infoValue}>{member.branch || "CSE"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Admission Year</Text>
              <Text style={styles.infoValue}>{member.admissionYear || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Roll Number</Text>
              <Text style={styles.infoValue}>{member.rollNumber || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Registration No.</Text>
              <Text style={styles.infoValue}>{member.registration || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned Batch</Text>
              <Text style={[styles.infoValue, { color: "#D97706", fontWeight: "700" }]}>
                {member.batch ? `${member.batch.name} (${member.batch.code})` : "Unassigned"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Club Role</Text>
              <Text style={styles.infoValue}>{member.role || "Member"}</Text>
            </View>
            <View style={styles.infoRowNoBorder}>
              <Text style={styles.infoLabel}>Specialized Domains</Text>
              <Text style={styles.infoValue}>{member.specializedDomain || "None"}</Text>
            </View>
          </View>
        )}

        {selectedSection === "address" && (
          <View style={styles.sheetContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address Line</Text>
              <Text style={styles.infoValue}>{member.address || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Post Office</Text>
              <Text style={styles.infoValue}>{member.postOffice || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Police Station</Text>
              <Text style={styles.infoValue}>{member.policeStation || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Block / Tehsil</Text>
              <Text style={styles.infoValue}>{member.block || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>District</Text>
              <Text style={styles.infoValue}>{member.district || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>State</Text>
              <Text style={styles.infoValue}>{member.state || "—"}</Text>
            </View>
            <View style={styles.infoRowNoBorder}>
              <Text style={styles.infoLabel}>PIN Code</Text>
              <Text style={styles.infoValue}>{member.pinCode || "—"}</Text>
            </View>
          </View>
        )}

        {selectedSection === "socials" && (
          <View style={styles.sheetContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>GitHub</Text>
              <Text style={styles.infoValue}>{member.githubUsername ? `@${member.githubUsername}` : "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>LinkedIn</Text>
              <Text style={styles.infoValue}>{sLinks.linkedin || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Twitter / X</Text>
              <Text style={styles.infoValue}>{sLinks.twitter || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Portfolio</Text>
              <Text style={styles.infoValue}>{sLinks.portfolio || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>LeetCode</Text>
              <Text style={styles.infoValue}>{sLinks.leetcode || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Codeforces</Text>
              <Text style={styles.infoValue}>{sLinks.codeforces || "—"}</Text>
            </View>
            <View style={styles.infoRowNoBorder}>
              <Text style={styles.infoLabel}>Instagram</Text>
              <Text style={styles.infoValue}>{sLinks.instagram || "—"}</Text>
            </View>
          </View>
        )}

        {selectedSection === "activity" && (
          <View style={styles.sheetContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Activity Points</Text>
              <Text style={[styles.infoValue, { color: "#059669", fontWeight: "800", fontSize: 16 }]}>
                {member.stats?.totalPoints || 0} pts
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Attendance Points</Text>
              <Text style={styles.infoValue}>+{member.stats?.attendancePoints || 0} pts ({member.stats?.attendanceCount || 0} sessions)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Task Points</Text>
              <Text style={styles.infoValue}>+{member.stats?.taskPoints || 0} pts ({member.stats?.taskSubmissionCount || 0} tasks)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Quiz Points</Text>
              <Text style={styles.infoValue}>+{member.stats?.quizPoints || 0} pts ({member.stats?.quizAttemptCount || 0} quizzes)</Text>
            </View>
            <View style={styles.infoRowNoBorder}>
              <Text style={styles.infoLabel}>Event Points</Text>
              <Text style={styles.infoValue}>+{member.stats?.eventPoints || 0} pts ({member.stats?.eventCount || 0} events)</Text>
            </View>
          </View>
        )}
      </AppBottomSheet>

      {/* 6. 3-Dot Action Menu Bottom Sheet */}
      <AppBottomSheet
        ref={actionMenuSheetRef}
        snapPoints={["36%"]}
        title="Member Actions"
        subtitle="Manage member access and profile"
        onClose={() => setMenuVisible(false)}
      >
        <View style={{ gap: 8 }}>
          <TouchableOpacity
            style={styles.menuOption}
            onPress={() => {
              actionMenuSheetRef.current?.dismiss();
              setMenuVisible(false);
              setEditModalVisible(true);
            }}
          >
            <Edit3 size={18} color="#0284C7" />
            <Text style={styles.menuOptionText}>Edit Profile Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuOption}
            onPress={() => {
              actionMenuSheetRef.current?.dismiss();
              handleToggleBan();
            }}
          >
            <Ban size={18} color={member.banned ? "#10B981" : "#D97706"} />
            <Text style={styles.menuOptionText}>
              {member.banned ? "Unban Member" : "Ban Member"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuOption, { borderBottomWidth: 0 }]}
            onPress={() => {
              actionMenuSheetRef.current?.dismiss();
              handleDelete();
            }}
          >
            <Trash2 size={18} color="#EF4444" />
            <Text style={[styles.menuOptionText, { color: "#EF4444" }]}>Delete Member</Text>
          </TouchableOpacity>
        </View>
      </AppBottomSheet>

      {/* 7. Full Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: "#FFFFFF" }}
        >
          <View style={[styles.editContainer, { paddingTop: insets.top || 16 }]}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          <View style={styles.editHeader}>
            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              style={styles.editCloseBtn}
              activeOpacity={0.7}
            >
              <X size={20} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.editTitleBox}>
              <Text style={styles.editTitle}>Edit Member</Text>
              <Text style={styles.editSubtitle} numberOfLines={1}>{member.name}</Text>
            </View>

            <TouchableOpacity
              onPress={handleSaveProfile}
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Edit Tabs */}
          <View style={styles.editTabsRow}>
            {(["personal", "academic", "address", "socials"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.editTabItem, editTab === t && styles.editTabItemActive]}
                onPress={() => setEditTab(t)}
              >
                <Text style={[styles.editTabItemText, editTab === t && styles.editTabItemTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            contentContainerStyle={[styles.editScroll, { paddingBottom: (insets.bottom || 16) + 40 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {editTab === "personal" && (
              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput style={styles.textInput} value={formName} onChangeText={setFormName} placeholder="Full Name" />

                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput style={styles.textInput} value={formEmail} onChangeText={setFormEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />

                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput style={styles.textInput} value={formFirstName} onChangeText={setFormFirstName} placeholder="First Name" />

                <Text style={styles.inputLabel}>Middle Name</Text>
                <TextInput style={styles.textInput} value={formMiddleName} onChangeText={setFormMiddleName} placeholder="Middle Name" />

                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput style={styles.textInput} value={formLastName} onChangeText={setFormLastName} placeholder="Last Name" />

                <Text style={styles.inputLabel}>Username</Text>
                <TextInput style={styles.textInput} value={formUsername} onChangeText={setFormUsername} placeholder="Username" autoCapitalize="none" />

                <Text style={styles.inputLabel}>Mobile Number</Text>
                <TextInput style={styles.textInput} value={formMobileNumber} onChangeText={setFormMobileNumber} placeholder="Mobile Number" keyboardType="phone-pad" />

                <Text style={styles.inputLabel}>WhatsApp Number</Text>
                <TextInput style={styles.textInput} value={formWhatsappNumber} onChangeText={setFormWhatsappNumber} placeholder="WhatsApp Number" keyboardType="phone-pad" />

                <Text style={styles.inputLabel}>Aadhaar Number</Text>
                <TextInput style={styles.textInput} value={formAadhaarNumber} onChangeText={setFormAadhaarNumber} placeholder="Aadhaar Number" keyboardType="number-pad" />
              </View>
            )}

            {editTab === "academic" && (
              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>Club Role</Text>
                <View style={styles.chipGrid}>
                  {["Member", "Core Team", "Lead", "Co-Admin", "Admin"].map((r) => {
                    const isSel = formRole.toLowerCase().includes(r.toLowerCase());
                    return (
                      <TouchableOpacity key={r} style={[styles.formChip, isSel && styles.formChipActive]} onPress={() => setFormRole(r)}>
                        {isSel && <Check size={12} color="#0284C7" style={{ marginRight: 4 }} />}
                        <Text style={[styles.formChipText, isSel && styles.formChipTextActive]}>{r}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.inputLabel}>Branch / Stream</Text>
                <View style={styles.chipGrid}>
                  {["CSE", "EE", "ME", "CE", "General"].map((b) => {
                    const isSel = formBranch.toUpperCase() === b.toUpperCase();
                    return (
                      <TouchableOpacity key={b} style={[styles.formChip, isSel && styles.formChipActive]} onPress={() => setFormBranch(b)}>
                        {isSel && <Check size={12} color="#0284C7" style={{ marginRight: 4 }} />}
                        <Text style={[styles.formChipText, isSel && styles.formChipTextActive]}>{b}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.inputLabel}>Assigned Batch</Text>
                <View style={styles.chipGrid}>
                  <TouchableOpacity style={[styles.formChip, !formBatchId && styles.formChipActive]} onPress={() => setFormBatchId("")}>
                    {!formBatchId && <Check size={12} color="#0284C7" style={{ marginRight: 4 }} />}
                    <Text style={[styles.formChipText, !formBatchId && styles.formChipTextActive]}>None</Text>
                  </TouchableOpacity>
                  {batches.map((batch) => {
                    const isSel = formBatchId === batch.id;
                    return (
                      <TouchableOpacity key={batch.id} style={[styles.formChip, isSel && styles.formChipActive]} onPress={() => setFormBatchId(batch.id)}>
                        {isSel && <Check size={12} color="#0284C7" style={{ marginRight: 4 }} />}
                        <Text style={[styles.formChipText, isSel && styles.formChipTextActive]}>{batch.name} ({batch.code})</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.inputLabel}>Specialized Domains</Text>
                <TextInput style={styles.textInput} value={formSpecializedDomain} onChangeText={setFormSpecializedDomain} placeholder="e.g. Web Dev, AI/ML" />

                <Text style={styles.inputLabel}>College Name</Text>
                <TextInput style={styles.textInput} value={formCollegeName} onChangeText={setFormCollegeName} placeholder="College Name" />

                <Text style={styles.inputLabel}>Roll Number</Text>
                <TextInput style={styles.textInput} value={formRollNumber} onChangeText={setFormRollNumber} placeholder="Roll Number" />

                <Text style={styles.inputLabel}>Registration Number</Text>
                <TextInput style={styles.textInput} value={formRegistration} onChangeText={setFormRegistration} placeholder="Registration No." />

                <Text style={styles.inputLabel}>Admission Year</Text>
                <TextInput style={styles.textInput} value={formAdmissionYear} onChangeText={setFormAdmissionYear} placeholder="e.g. 2024" keyboardType="number-pad" />
              </View>
            )}

            {editTab === "address" && (
              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>Address Line</Text>
                <TextInput style={styles.textInput} value={formAddress} onChangeText={setFormAddress} placeholder="Street / Village" />

                <Text style={styles.inputLabel}>Post Office</Text>
                <TextInput style={styles.textInput} value={formPostOffice} onChangeText={setFormPostOffice} placeholder="Post Office" />

                <Text style={styles.inputLabel}>Police Station</Text>
                <TextInput style={styles.textInput} value={formPoliceStation} onChangeText={setFormPoliceStation} placeholder="Police Station" />

                <Text style={styles.inputLabel}>Block / Tehsil</Text>
                <TextInput style={styles.textInput} value={formBlock} onChangeText={setFormBlock} placeholder="Block" />

                <Text style={styles.inputLabel}>District</Text>
                <TextInput style={styles.textInput} value={formDistrict} onChangeText={setFormDistrict} placeholder="District" />

                <Text style={styles.inputLabel}>State</Text>
                <TextInput style={styles.textInput} value={formState} onChangeText={setFormState} placeholder="State" />

                <Text style={styles.inputLabel}>PIN Code</Text>
                <TextInput style={styles.textInput} value={formPinCode} onChangeText={setFormPinCode} placeholder="6-digit PIN" keyboardType="number-pad" />
              </View>
            )}

            {editTab === "socials" && (
              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>GitHub Username</Text>
                <TextInput style={styles.textInput} value={formGithubUsername} onChangeText={setFormGithubUsername} placeholder="github username" autoCapitalize="none" />

                <Text style={styles.inputLabel}>LinkedIn URL</Text>
                <TextInput style={styles.textInput} value={formLinkedin} onChangeText={setFormLinkedin} placeholder="https://linkedin.com/in/..." autoCapitalize="none" />

                <Text style={styles.inputLabel}>Twitter / X URL</Text>
                <TextInput style={styles.textInput} value={formTwitter} onChangeText={setFormTwitter} placeholder="https://x.com/..." autoCapitalize="none" />

                <Text style={styles.inputLabel}>Portfolio Website</Text>
                <TextInput style={styles.textInput} value={formPortfolio} onChangeText={setFormPortfolio} placeholder="https://..." autoCapitalize="none" />

                <Text style={styles.inputLabel}>Instagram Handle / URL</Text>
                <TextInput style={styles.textInput} value={formInstagram} onChangeText={setFormInstagram} placeholder="instagram handle" autoCapitalize="none" />

                <Text style={styles.inputLabel}>LeetCode Username</Text>
                <TextInput style={styles.textInput} value={formLeetCode} onChangeText={setFormLeetCode} placeholder="leetcode username" autoCapitalize="none" />

                <Text style={styles.inputLabel}>Codeforces Handle</Text>
                <TextInput style={styles.textInput} value={formCodeforces} onChangeText={setFormCodeforces} placeholder="codeforces handle" autoCapitalize="none" />
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topAmbientBg: {
    backgroundColor: "#DFF2FE",
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 20,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 16,
  },
  avatarSquircle: {
    width: 78,
    height: 78,
    borderRadius: 22,
    backgroundColor: "#0284C7",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
  },
  editPencilBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  heroDetails: {
    flex: 1,
  },
  heroName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  heroLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  heroLocationText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
    flexShrink: 1,
  },
  heroChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  roleChip: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  roleChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  domainChip: {
    backgroundColor: "#38BDF8",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  domainChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  bannedChip: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  bannedChipText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E2E8F0",
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  bottomEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0284C7",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 10,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  bottomEditBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingLabel: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  emptyHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Detail Modal Sheet Styles
  backdropDismiss: {
    flex: 1,
  },
  swipeArea: {
    paddingTop: 4,
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "flex-end",
  },
  detailModalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  sheetContent: {
    paddingBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  infoRowNoBorder: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },

  // Action Menu Styles
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "flex-end",
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  menuOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },

  // Edit Modal Styles
  editContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  editCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  editTitleBox: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  editTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  editSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  saveButton: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  editTabsRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
  },
  editTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  editTabItemActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  editTabItemText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  editTabItemTextActive: {
    color: "#0284C7",
    fontWeight: "700",
  },
  editScroll: {
    padding: 16,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  formChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  formChipActive: {
    backgroundColor: "#F0F9FF",
    borderColor: "#0284C7",
  },
  formChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  formChipTextActive: {
    color: "#0284C7",
    fontWeight: "700",
  },
});
