import { Check, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/Typography";
import { colors, radius, space, text } from "@/lib/theme";

export interface Option {
  value: string;
  label: string;
}

/**
 * A select box for a phone: a field that opens a sheet of options. Stands
 * in for the website's <select>.
 */
export function OptionPicker({
  label,
  title = label,
  options,
  value,
  onChange,
  placeholder = "Choose one",
  error,
  hint,
}: {
  label: string;
  /** The sheet's heading, when it should differ from the field label. */
  title?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const chosen = options.find((o) => o.value === value);
  return (
    <View style={{ gap: space.xs }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${chosen?.label ?? "not chosen"}`}
        onPress={() => setOpen(true)}
        style={[styles.control, error ? { borderColor: colors.danger } : null]}
      >
        <Text style={[styles.value, !chosen && { color: colors.inkSubtle }]}>
          {chosen?.label ?? placeholder}
        </Text>
        <ChevronDown color={colors.inkSubtle} size={18} />
      </Pressable>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={text.small}>{hint}</Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          accessibilityLabel="Close"
          onPress={() => setOpen(false)}
        />
        <View style={styles.sheet}>
          <Text style={[text.subheading, { marginBottom: space.md }]}>
            {title}
          </Text>
          <ScrollView>
            {options.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: option.value === value }}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={styles.option}
              >
                <Text style={[styles.value, { flex: 1 }]}>{option.label}</Text>
                {option.value === value ? (
                  <Check color={colors.noir} size={18} />
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "600", color: colors.ink },
  control: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.control,
    paddingHorizontal: space.lg,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  value: { fontSize: 16, color: colors.ink },
  error: { fontSize: 13, color: colors.danger },
  backdrop: { flex: 1, backgroundColor: "rgba(11,31,58,0.5)" },
  sheet: {
    maxHeight: "70%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: space.xl,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
});
