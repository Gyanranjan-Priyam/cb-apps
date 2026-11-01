import type { RoadmapData } from "../../types";

export const mobileAppDevelopmentRoadmap: RoadmapData = {
  id: "mobile-app-development",
  slug: "mobile-app-development",
  title: "Mobile App Development",
  description: "Complete, all-in-one guide to Mobile App Engineering. Master React Native (Expo Router, Reanimated), Flutter & Dart (Riverpod/BLoC), Native iOS (SwiftUI) & Android (Jetpack Compose), Offline-First Storage (MMKV/SQLite), APNs/FCM Push Notifications, and Automated Store Deployment with Fastlane/EAS without needing external materials.",
  category: "mobile",
  badgeText: "Mobile Track",
  iconName: "Smartphone",
  version: 2,
  isPublished: true,
  nodes: [
    {
      id: "title-node",
      type: "title",
      position: { x: 550, y: 30 },
      data: { label: "Mobile App Developer Roadmap" },
    },
    // 1. Mobile Architecture & Platforms
    {
      id: "mobile-ecosystem",
      type: "topic",
      position: { x: 550, y: 120 },
      data: {
        label: "Mobile Ecosystem: Native vs Cross-Platform",
        category: "Foundations",
        description: `### 📱 Mobile OS Runtimes, Memory Sandboxes & Lifecycles

Understand hardware constraints, battery consumption policies, and permission models.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 10,
      },
    },
    {
      id: "sub-ios-android-lifecycle",
      type: "subtopic",
      position: { x: 860, y: 100 },
      data: {
        label: "App Lifecycles & OS Sandboxing",
        colorKey: "C",
        description: `### 🔄 App State Transitions & Background Tasks

- **Active**: App is in the foreground and receives user touch inputs.
- **Background**: App is given ~30 seconds by iOS to wrap up pending network requests before suspension.
- **Suspended**: Process RAM is frozen. The OS terminates suspended apps automatically when memory pressure spikes.
`,
      },
    },
    {
      id: "sub-native-vs-hybrid",
      type: "subtopic",
      position: { x: 860, y: 150 },
      data: {
        label: "Cross-Platform (React Native / Flutter) vs Native",
        colorKey: "C",
        description: `### ⚖️ Framework Selection Strategy

- **React Native (Expo)**: Reuses React skills, writes in TypeScript, renders real native platform widgets via JSI (JavaScript Interface).
- **Flutter**: Single Dart codebase rendered with Google's Impeller graphics engine.
- **Native**: SwiftUI / Jetpack Compose for zero-bridge overhead and instant day-1 access to new OS SDKs.
`,
      },
    },

    // 2. React Native & Expo
    {
      id: "react-native-expo",
      type: "topic",
      position: { x: 550, y: 320 },
      data: {
        label: "React Native & Expo Ecosystem",
        category: "Cross-Platform",
        description: `### ⚛️ Expo Router, File-Based Navigation & Reanimated

Build modern cross-platform mobile apps using React and TypeScript.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-expo-router-nav",
      type: "subtopic",
      position: { x: 240, y: 280 },
      data: {
        label: "Expo Router & File-Based Navigation",
        colorKey: "C",
        description: `### 📂 Expo Router File-Based Routing Structure

\`\`\`tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Compass, BookOpen, User } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#3b82f6" }}>
      <Tabs.Screen 
        name="roadmaps" 
        options={{ title: "Roadmaps", tabBarIcon: ({ color }) => <Compass color={color} /> }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ title: "Profile", tabBarIcon: ({ color }) => <User color={color} /> }} 
      />
    </Tabs>
  );
}
\`\`\`
`,
      },
    },
    {
      id: "sub-reanimated-gestures",
      type: "subtopic",
      position: { x: 240, y: 330 },
      data: {
        label: "React Native Reanimated & Gesture Handler",
        colorKey: "C",
        description: `### 🎯 120fps Gesture-Driven Animations

\`\`\`tsx
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

export function DraggableCard() {
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translationX.value = event.translationX;
      translationY.value = event.translationY;
    })
    .onEnd(() => {
      translationX.value = withSpring(0);
      translationY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translationX.value }, { translateY: translationY.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]} />
    </GestureDetector>
  );
}
\`\`\`
`,
      },
    },

    // 3. Flutter & Dart
    {
      id: "flutter-dart-track",
      type: "topic",
      position: { x: 550, y: 520 },
      data: {
        label: "Flutter & Dart Development",
        category: "Cross-Platform",
        description: `### 💙 Widget Trees, Riverpod State & Material Design 3

Create silky smooth mobile applications with Dart.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-flutter-widgets",
      type: "subtopic",
      position: { x: 860, y: 480 },
      data: {
        label: "Stateless vs Stateful Widgets & Layouts",
        colorKey: "C",
        description: `### 🌲 Declarative Flutter Widget Tree

\`\`\`dart
import 'package:flutter/material.dart';

class RoadmapCard extends StatelessWidget {
  final String title;
  final String category;
  final int estimatedHours;

  const RoadmapCard({
    super.key,
    required this.title,
    required this.category,
    required this.estimatedHours,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Chip(label: Text(category.toUpperCase())),
            const SizedBox(height: 8),
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            Text('Estimated: ~$estimatedHours hrs'),
          ],
        ),
      ),
    );
  }
}
\`\`\`
`,
      },
    },
    {
      id: "sub-riverpod-bloc",
      type: "subtopic",
      position: { x: 860, y: 530 },
      data: {
        label: "State Management: Riverpod & BLoC Pattern",
        colorKey: "C",
        description: `### 🌊 Reactive Riverpod State Management in Flutter

\`\`\`dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

// 1. Define global reactive state provider
final counterProvider = StateProvider<int>((ref) => 0);

// 2. Consume provider inside widget tree
class CounterScreen extends ConsumerWidget {
  const CounterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);
    return Scaffold(
      body: Center(child: Text('Points: $count')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => ref.read(counterProvider.notifier).state++,
        child: const Icon(Icons.add),
      ),
    );
  }
}
\`\`\`
`,
      },
    },

    // 4. Native iOS (SwiftUI) & Native Android (Jetpack Compose)
    {
      id: "native-mobile-development",
      type: "topic",
      position: { x: 550, y: 720 },
      data: {
        label: "Native iOS (SwiftUI) & Android (Jetpack Compose)",
        category: "Native Development",
        description: `### 🍏 Native SwiftUI & Android Jetpack Compose

Write platform-native code with maximum performance and modern declarative APIs.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-swiftui-ios",
      type: "subtopic",
      position: { x: 240, y: 680 },
      data: {
        label: "Swift & SwiftUI (iOS / iPadOS / watchOS)",
        colorKey: "C",
        description: `### 🍏 Declarative SwiftUI View Example

\`\`\`swift
import SwiftUI

struct RoadmapView: View {
    @State private var isLearned = false
    let topicName: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(topicName)
                .font(.headline)
                .foregroundColor(.primary)

            Button(action: { isLearned.toggle() }) {
                Label(isLearned ? "Completed" : "Mark as Learned", 
                      systemImage: isLearned ? "checkmark.circle.fill" : "circle")
            }
            .buttonStyle(.borderedProminent)
            .tint(isLearned ? .green : .blue)
        }
        .padding()
        .background(RoundedRectangle(cornerRadius: 16).fill(Color(.systemBackground)))
    }
}
\`\`\`
`,
      },
    },
    {
      id: "sub-android-compose",
      type: "subtopic",
      position: { x: 240, y: 730 },
      data: {
        label: "Kotlin & Jetpack Compose (Android)",
        colorKey: "C",
        description: `### 🤖 Jetpack Compose Composable UI Example

\`\`\`kotlin
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun TaskItemCard(title: String, points: Int) {
    var isSubmitted by remember { mutableStateOf(false) }

    Card(modifier = Modifier.fillMaxWidth().padding(8.dp)) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = title, style = MaterialTheme.typography.titleMedium)
            Text(text = "Points: $points", style = MaterialTheme.typography.bodySmall)
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = { isSubmitted = !isSubmitted }) {
                Text(if (isSubmitted) "Submitted" else "Submit Solution")
            }
        }
    }
}
\`\`\`
`,
      },
    },

    // 5. Offline Storage & Sync
    {
      id: "offline-storage-sync",
      type: "topic",
      position: { x: 550, y: 920 },
      data: {
        label: "Offline-First Storage & Data Sync",
        category: "Data & Storage",
        description: `### 💾 MMKV, SQLite & Conflict-Free Replication (CRDT)

Ensure apps load instantly with full offline read/write capability.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 16,
      },
    },
    {
      id: "sub-mmkv-sqlite",
      type: "subtopic",
      position: { x: 860, y: 880 },
      data: {
        label: "MMKV Fast Storage & Embedded SQLite",
        colorKey: "C",
        description: `### ⚡ MMKV High-Speed Synchronous Storage

\`\`\`typescript
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({ id: 'user-settings' });

// Instant zero-latency synchronous reads & writes
storage.set('user.theme', 'dark');
storage.set('user.completedRoadmapNodes', JSON.stringify(['html', 'css', 'js']));

const theme = storage.getString('user.theme');
\`\`\`
`,
      },
    },
    {
      id: "sub-offline-sync-crdt",
      type: "subtopic",
      position: { x: 860, y: 930 },
      data: {
        label: "Background Sync, Queueing & CRDT Conflict Resolution",
        colorKey: "C",
        description: `### 🔄 Offline Mutation Queue with Background Sync

1. User marks topic completed offline $\\rightarrow$ write to local SQLite.
2. Mutation object pushed to \`offline_sync_queue\` table.
3. Network connectivity listener detects online state $\\rightarrow$ triggers background sync task.
`,
      },
    },

    // 6. Push Notifications, Deep Links & Hardware APIs
    {
      id: "mobile-hardware-push",
      type: "topic",
      position: { x: 550, y: 1120 },
      data: {
        label: "Push Notifications, Hardware APIs & Deep Linking",
        category: "Integrations",
        description: `### 🔔 APNs, Firebase Cloud Messaging, Biometrics & Deep Links

Integrate device sensors and re-engage users with rich push notifications.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 15,
      },
    },
    {
      id: "sub-push-apns-fcm",
      type: "subtopic",
      position: { x: 240, y: 1080 },
      data: {
        label: "Push Notifications: APNs & Firebase Cloud Messaging (FCM)",
        colorKey: "C",
        description: `### 📲 APNs & FCM Token Registration Pipeline

\`\`\`typescript
import * as Notifications from 'expo-notifications';

export async function registerForPushNotifications(): Promise<string | undefined> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return undefined;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  // Send token to backend DB for user notifications:
  await savePushTokenToBackend(token);
  return token;
}
\`\`\`
`,
      },
    },
    {
      id: "sub-biometrics-hardware",
      type: "subtopic",
      position: { x: 240, y: 1130 },
      data: {
        label: "Biometrics (FaceID), Camera & Location",
        colorKey: "C",
        description: `### 🔐 FaceID & Biometric Authentication

\`\`\`typescript
import * as LocalAuthentication from 'expo-local-authentication';

export async function authenticateWithBiometrics(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock CodeBreakers Dashboard",
    fallbackLabel: "Use Password",
  });

  return result.success;
}
\`\`\`
`,
      },
    },

    // 7. CI/CD & App Store Deployment
    {
      id: "app-store-deployment",
      type: "topic",
      position: { x: 550, y: 1320 },
      data: {
        label: "EAS, Fastlane & App Store / Play Store Release",
        category: "Deployment",
        description: `### 🚀 Automated App Compilation & App Store Submission

Automate \`.ipa\` and \`.aab\` builds and Over-The-Air (OTA) updates.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 18,
      },
    },
    {
      id: "sub-fastlane-eas",
      type: "subtopic",
      position: { x: 860, y: 1280 },
      data: {
        label: "Expo EAS & Fastlane Automated Build Pipelines",
        colorKey: "C",
        description: `### 📦 \`eas.json\` Build Configuration

\`\`\`json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "production": {
      "autoIncrement": true,
      "channel": "production"
    }
  }
}
\`\`\`
`,
      },
    },
    {
      id: "sub-ota-monitoring",
      type: "subtopic",
      position: { x: 860, y: 1330 },
      data: {
        label: "Over-The-Air (OTA) Updates & Sentry Crash Reporting",
        colorKey: "C",
        description: `### ⚡ Instant Fixes with Over-The-Air Updates

Deploy JavaScript bundle fixes directly to users' phones in seconds without waiting for 48-hour App Store review approval.
`,
      },
    },

    // 8. Milestone
    {
      id: "milestone-mobile-lead",
      type: "milestone",
      position: { x: 550, y: 1520 },
      data: {
        label: "Certified Mobile Application Engineer",
        category: "Milestone",
        description: `### 🎓 Mobile Application Engineering Mastery Attained!

Congratulations! You have mastered mobile development across platforms:
- Mobile OS sandboxing, lifecycle states, and runtime permissions.
- Modern Cross-Platform apps (React Native / Expo & Flutter).
- Native iOS (SwiftUI) and Android (Jetpack Compose) development.
- Offline-first architectures with SQLite, MMKV, and sync queues.
- APNs/FCM push notifications, FaceID biometrics, and hardware sensors.
- Automated CI/CD with EAS/Fastlane and App Store publication.
`,
        difficulty: "advanced",
        color: "gold",
        status: "not-started",
      },
    },
  ],
  edges: [
    { id: "e-mb-1", source: "mobile-ecosystem", target: "react-native-expo", type: "interactive" },
    { id: "e-mb-2", source: "react-native-expo", target: "flutter-dart-track", type: "interactive" },
    { id: "e-mb-3", source: "flutter-dart-track", target: "native-mobile-development", type: "interactive" },
    { id: "e-mb-4", source: "native-mobile-development", target: "offline-storage-sync", type: "interactive" },
    { id: "e-mb-5", source: "offline-storage-sync", target: "mobile-hardware-push", type: "interactive" },
    { id: "e-mb-6", source: "mobile-hardware-push", target: "app-store-deployment", type: "interactive" },
    { id: "e-mb-7", source: "app-store-deployment", target: "milestone-mobile-lead", type: "interactive" },

    // Subtopics
    { id: "e-mb-sub-1", source: "mobile-ecosystem", target: "sub-ios-android-lifecycle" },
    { id: "e-mb-sub-2", source: "mobile-ecosystem", target: "sub-native-vs-hybrid" },

    { id: "e-mb-sub-3", source: "react-native-expo", target: "sub-expo-router-nav" },
    { id: "e-mb-sub-4", source: "react-native-expo", target: "sub-reanimated-gestures" },

    { id: "e-mb-sub-5", source: "flutter-dart-track", target: "sub-flutter-widgets" },
    { id: "e-mb-sub-6", source: "flutter-dart-track", target: "sub-riverpod-bloc" },

    { id: "e-mb-sub-7", source: "native-mobile-development", target: "sub-swiftui-ios" },
    { id: "e-mb-sub-8", source: "native-mobile-development", target: "sub-android-compose" },

    { id: "e-mb-sub-9", source: "offline-storage-sync", target: "sub-mmkv-sqlite" },
    { id: "e-mb-sub-10", source: "offline-storage-sync", target: "sub-offline-sync-crdt" },

    { id: "e-mb-sub-11", source: "mobile-hardware-push", target: "sub-push-apns-fcm" },
    { id: "e-mb-sub-12", source: "mobile-hardware-push", target: "sub-biometrics-hardware" },

    { id: "e-mb-sub-13", source: "app-store-deployment", target: "sub-fastlane-eas" },
    { id: "e-mb-sub-14", source: "app-store-deployment", target: "sub-ota-monitoring" },
  ],
};
