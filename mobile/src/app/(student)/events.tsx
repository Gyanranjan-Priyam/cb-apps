import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Calendar, MapPin, Clock, CheckCircle, Sparkles } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function StudentEventsScreen() {
  const router = useRouter();

  const mockEvents = [
    {
      id: "1",
      title: "Full-Stack Web Dev Bootcamp",
      date: "Saturday, 28 Sep 2026",
      time: "10:00 AM - 1:00 PM",
      location: "Lab 3, CSE Dept",
      isRegistered: true,
      tag: "Workshop",
    },
    {
      id: "2",
      title: "Antigravity AI & App Dev Meetup",
      date: "Wednesday, 02 Oct 2026",
      time: "3:30 PM - 5:30 PM",
      location: "Seminar Hall 1",
      isRegistered: false,
      tag: "Meetup",
    },
    {
      id: "3",
      title: "Competitive Coding Sprint",
      date: "Sunday, 06 Oct 2026",
      time: "9:00 AM - 12:00 PM",
      location: "Online Portal",
      isRegistered: false,
      tag: "Competition",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Club Events & Roadmaps</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.listHeader}>
          <Text style={styles.heading}>Available Sessions</Text>
        </View>

        <View style={styles.eventsList}>
          {mockEvents.map((evt) => (
            <View key={evt.id} style={styles.eventCard}>
              <View style={styles.cardHeader}>
                <View style={styles.tagPill}>
                  <Text style={styles.tagText}>{evt.tag}</Text>
                </View>
                {evt.isRegistered && (
                  <View style={styles.registeredBadge}>
                    <CheckCircle size={12} color="#16A34A" />
                    <Text style={styles.registeredText}>Registered</Text>
                  </View>
                )}
              </View>

              <Text style={styles.eventTitle}>{evt.title}</Text>

              <View style={styles.metaCol}>
                <View style={styles.metaItem}>
                  <Calendar size={13} color="#64748B" />
                  <Text style={styles.metaText}>{evt.date}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Clock size={13} color="#64748B" />
                  <Text style={styles.metaText}>{evt.time}</Text>
                </View>
                <View style={styles.metaItem}>
                  <MapPin size={13} color="#64748B" />
                  <Text style={styles.metaText}>{evt.location}</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.registerBtn,
                  evt.isRegistered && styles.registerBtnDisabled,
                ]}
              >
                <Text style={styles.registerBtnText}>
                  {evt.isRegistered ? "You're Registered" : "Register Now"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  content: {
    padding: 20,
    gap: 16,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  listHeader: {
    paddingHorizontal: 2,
  },
  heading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },
  eventsList: {
    gap: 14,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  registeredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  registeredText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16A34A",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  metaCol: {
    gap: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#64748B",
  },
  registerBtn: {
    backgroundColor: "#0F172A",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  registerBtnDisabled: {
    backgroundColor: "#E2E8F0",
  },
  registerBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
