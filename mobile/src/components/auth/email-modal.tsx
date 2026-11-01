import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Mail, AlertCircle } from "lucide-react-native";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "expo-router";
import { AppBottomSheet, AppBottomSheetRef } from "@/components/ui/app-bottom-sheet";

interface EmailModalProps {
  visible: boolean;
  onClose: () => void;
  isSignUp?: boolean;
}

export function EmailModal({ visible, onClose, isSignUp = false }: EmailModalProps) {
  const router = useRouter();
  const { sendOtp } = useAuth();
  const sheetRef = useRef<AppBottomSheetRef>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    const result = await sendOtp(trimmed);
    setLoading(false);

    if (result.success) {
      sheetRef.current?.dismiss();
      onClose();
      setEmail("");
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { email: trimmed },
      });
    } else {
      setErrorMessage(
        result.error ||
          "Unauthorized Access: Only registered members added by an admin can log in."
      );
    }
  };

  return (
    <AppBottomSheet
      ref={sheetRef}
      snapPoints={["54%"]}
      title={isSignUp ? "Sign up with Email" : "Sign in with Email"}
      subtitle="Enter your registered email to receive a 6-digit OTP code."
      onClose={onClose}
    >
      <View style={styles.content}>
        {/* Error message */}
        {errorMessage && (
          <View style={styles.errorBox}>
            <AlertCircle size={18} color="#DC2626" style={{ marginTop: 2 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Input field */}
        <View style={styles.inputContainer}>
          <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="name@example.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleSendOtp}
            style={styles.input}
            autoFocus={visible}
          />
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleSendOtp}
          disabled={loading}
          activeOpacity={0.8}
          style={[styles.actionBtn, loading && styles.btnDisabled]}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.actionBtnText}>Sending OTP...</Text>
            </View>
          ) : (
            <Text style={styles.actionBtnText}>Continue with Email</Text>
          )}
        </TouchableOpacity>
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 8,
  },
  errorBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: "#B91C1C",
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    height: "100%",
  },
  actionBtn: {
    backgroundColor: "#0F172A",
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

