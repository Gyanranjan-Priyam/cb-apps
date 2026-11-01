import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";

interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
  length?: number;
  hasError?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  hasError = false,
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleChangeText = (text: string) => {
    // Only keep numeric digits
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, length);
    onChange(cleaned);
  };

  const digits = Array.from({ length }, (_, i) => value[i] || "");

  return (
    <Pressable
      onPress={handlePress}
      style={styles.container}
      accessible={true}
      accessibilityLabel="6-digit verification code input"
    >
      {/* Hidden real TextInput */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        editable={!disabled}
        style={styles.hiddenInput}
        caretHidden={true}
      />

      {/* Visual Slot Boxes */}
      <View style={styles.slotsRow}>
        {/* First group of 3 digits */}
        <View style={styles.group}>
          {digits.slice(0, 3).map((digit, i) => {
            const index = i;
            const isFocused = value.length === index && !disabled;
            const isFilled = Boolean(digit);

            return (
              <View
                key={index}
                style={[
                  styles.slot,
                  isFilled && styles.slotFilled,
                  isFocused && styles.slotFocused,
                  hasError && styles.slotError,
                ]}
              >
                <Text
                  style={[
                    styles.digitText,
                    hasError && styles.digitTextError,
                  ]}
                >
                  {digit}
                </Text>
                {isFocused && <View style={styles.cursor} />}
              </View>
            );
          })}
        </View>

        {/* Center dash separator */}
        <View style={styles.divider}>
          <Text style={styles.dividerText}>–</Text>
        </View>

        {/* Second group of 3 digits */}
        <View style={styles.group}>
          {digits.slice(3, 6).map((digit, i) => {
            const index = i + 3;
            const isFocused = value.length === index && !disabled;
            const isFilled = Boolean(digit);

            return (
              <View
                key={index}
                style={[
                  styles.slot,
                  isFilled && styles.slotFilled,
                  isFocused && styles.slotFocused,
                  hasError && styles.slotError,
                ]}
              >
                <Text
                  style={[
                    styles.digitText,
                    hasError && styles.digitTextError,
                  ]}
                >
                  {digit}
                </Text>
                {isFocused && <View style={styles.cursor} />}
              </View>
            );
          })}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    position: "relative",
  },
  hiddenInput: {
    position: "absolute",
    width: "100%",
    height: 60,
    opacity: 0.01,
    zIndex: 2,
  },
  slotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  group: {
    flexDirection: "row",
    gap: 8,
  },
  divider: {
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  dividerText: {
    fontSize: 20,
    fontWeight: "300",
    color: "#94A3B8",
  },
  slot: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  slotFilled: {
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  slotFocused: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  slotError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  digitText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#0F172A",
    textAlign: "center",
  },
  digitTextError: {
    color: "#DC2626",
  },
  cursor: {
    position: "absolute",
    bottom: 10,
    width: 14,
    height: 2,
    backgroundColor: "#2563EB",
    borderRadius: 1,
  },
});
