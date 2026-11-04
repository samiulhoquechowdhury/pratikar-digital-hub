import { Check, Search, SlidersHorizontal, X } from "lucide-react-native";
import { useRef, useState, type ComponentRef } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, TextInput } from "@/components/Typography";
import { Button, Chip } from "@/components/ui";
import { colors, fonts, radius, shadow, space, text } from "@/lib/theme";

export interface BrowseOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: BrowseOption[];
}

/**
 * The bar at the top of a list. It sits above the list rather than in it,
 * so search and filters stay put while the results scroll underneath.
 *
 * The search box and a row of quick choices are always in view; anything
 * longer lives in a sheet. What's applied shows as chips you can remove, so
 * the list is never filtered by something you can't see.
 */
export function BrowseBar({
  query,
  onQuery,
  placeholder,
  segments,
  segment,
  onSegment,
  groups = [],
  filters = {},
  onFilter,
  sorts = [],
  sort,
  onSort,
  resultCount,
  noun = "result",
}: {
  query: string;
  onQuery: (query: string) => void;
  placeholder: string;
  /** Quick choices, always on show. */
  segments?: BrowseOption[];
  segment?: string | null;
  onSegment?: (value: string | null) => void;
  /** Filters that open in the sheet. */
  groups?: FilterGroup[];
  filters?: Record<string, string | null>;
  onFilter?: (group: string, value: string | null) => void;
  sorts?: readonly BrowseOption[];
  sort?: string;
  onSort?: (value: string) => void;
  resultCount?: number;
  noun?: string;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { bottom } = useSafeAreaInsets();
  const segmentsRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const applied = groups.flatMap((group) => {
    const option = group.options.find((o) => o.value === filters[group.id]);
    return option ? [{ group: group.id, option }] : [];
  });
  const hasSheet = groups.length > 0 || sorts.length > 0;
  const sortChanged = sorts.length > 0 && sort !== sorts[0]?.value;
  const badge = applied.length + (sortChanged ? 1 : 0);

  return (
    <View style={styles.bar}>
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Search color={colors.inkSubtle} size={19} />
          <TextInput
            accessibilityLabel={placeholder}
            value={query}
            onChangeText={onQuery}
            placeholder={placeholder}
            placeholderTextColor={colors.inkSubtle}
            autoCorrect={false}
            returnKeyType="search"
            style={styles.input}
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={12}
              onPress={() => onQuery("")}
            >
              <X color={colors.inkSubtle} size={18} />
            </Pressable>
          ) : null}
        </View>
        {hasSheet ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              badge > 0 ? `Filters, ${badge} applied` : "Filters"
            }
            onPress={() => setSheetOpen(true)}
            style={({ pressed }) => [
              styles.filterButton,
              badge > 0 && styles.filterButtonOn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <SlidersHorizontal
              color={badge > 0 ? colors.inkInverse : colors.noir}
              size={20}
            />
            {badge > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>

      {segments && segments.length > 1 ? (
        <ScrollView
          ref={segmentsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chips}
        >
          {segments.map((option) => {
            const selected = (segment ?? "all") === option.value;
            return (
              <View
                key={option.value}
                // The chosen one is never left off-screen, however the page
                // was reached.
                onLayout={(event) => {
                  if (!selected) return;
                  segmentsRef.current?.scrollTo({
                    x: Math.max(0, event.nativeEvent.layout.x - space.lg),
                    animated: false,
                  });
                }}
              >
                <Chip
                  label={
                    option.count === undefined
                      ? option.label
                      : `${option.label} ${option.count}`
                  }
                  selected={selected}
                  onPress={() =>
                    onSegment?.(option.value === "all" ? null : option.value)
                  }
                />
              </View>
            );
          })}
        </ScrollView>
      ) : null}

      {applied.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chips}
        >
          {applied.map(({ group, option }) => (
            <Pressable
              key={group}
              accessibilityRole="button"
              accessibilityLabel={`Remove filter ${option.label}`}
              hitSlop={{ top: 6, bottom: 6 }}
              onPress={() => onFilter?.(group, null)}
              style={styles.applied}
            >
              <Text style={styles.appliedText}>{option.label}</Text>
              <X color={colors.goldInk} size={14} />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {resultCount !== undefined ? (
        <Text style={styles.count} accessibilityLiveRegion="polite">
          {resultCount} {noun}
          {resultCount === 1 ? "" : "s"}
        </Text>
      ) : null}

      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          accessibilityLabel="Close filters"
          onPress={() => setSheetOpen(false)}
        />
        <View style={[styles.sheet, { paddingBottom: bottom + space.lg }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={text.heading} accessibilityRole="header">
              Filter and sort
            </Text>
            {badge > 0 ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={12}
                onPress={() => {
                  groups.forEach((g) => onFilter?.(g.id, null));
                  if (sorts[0]) onSort?.(sorts[0].value);
                }}
              >
                <Text style={styles.clear}>Clear all</Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView contentContainerStyle={{ gap: space.xl }}>
            {groups.map((group) => (
              <View key={group.id} style={{ gap: space.sm }}>
                <Text style={styles.groupTitle}>{group.label}</Text>
                <View style={styles.wrap}>
                  {group.options.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      selected={filters[group.id] === option.value}
                      onPress={() =>
                        onFilter?.(
                          group.id,
                          filters[group.id] === option.value
                            ? null
                            : option.value,
                        )
                      }
                    />
                  ))}
                </View>
              </View>
            ))}

            {sorts.length > 0 ? (
              <View>
                <Text style={styles.groupTitle}>Sort by</Text>
                {sorts.map((option) => (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: sort === option.value }}
                    onPress={() => onSort?.(option.value)}
                    style={styles.sortRow}
                  >
                    <Text style={[text.body, { flex: 1 }]}>{option.label}</Text>
                    {sort === option.value ? (
                      <Check color={colors.noir} size={20} />
                    ) : null}
                  </Pressable>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <Button
            label={
              resultCount === undefined
                ? "Done"
                : `Show ${resultCount} ${noun}${resultCount === 1 ? "" : "s"}`
            }
            onPress={() => setSheetOpen(false)}
            style={{ marginTop: space.lg }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: space.sm,
    paddingBottom: space.sm,
    backgroundColor: colors.canvas,
    zIndex: 1,
  },
  searchRow: {
    flexDirection: "row",
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.xs,
  },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 48,
    paddingHorizontal: space.md + 2,
    borderRadius: radius.control + 2,
    backgroundColor: colors.surface,
    ...shadow,
  },
  input: { flex: 1, minHeight: 48, fontSize: 15, color: colors.ink },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: radius.control + 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    ...shadow,
  },
  filterButtonOn: { backgroundColor: colors.noir },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.noir },
  chips: { gap: space.sm, paddingHorizontal: space.lg },
  applied: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 34,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: colors.banner.sand,
  },
  appliedText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.goldInk,
  },
  count: {
    paddingHorizontal: space.lg,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.inkSubtle,
  },
  backdrop: { flex: 1, backgroundColor: "rgba(11,31,58,0.5)" },
  sheet: {
    maxHeight: "78%",
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: space.md,
    backgroundColor: colors.lineStrong,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.lg,
  },
  clear: { fontFamily: fonts.bold, fontSize: 14, color: colors.noirRaised },
  groupTitle: { ...text.subheading, marginBottom: space.xs },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
});
