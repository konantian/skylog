import React, { useState } from "react";
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type TextProps,
  type ViewStyle,
  type StyleProp,
  type ColorValue,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { G, Path } from "react-native-svg";
import { aircraftShape } from "../../../../lib/aircraft-silhouettes.mjs";
import { useApp } from "../lib/store";
import { airlineName, aircraftName } from "../lib/flight-labels";
import { imageUrl, type Photo, type Entry } from "../lib/catalog";
export function Txt({
  muted = false,
  accent = false,
  style,
  ...props
}: TextProps & { muted?: boolean; accent?: boolean }) {
  const { colors } = useApp();
  return (
    <Text
      {...props}
      style={[
        {
          color: accent ? colors.accent : muted ? colors.muted : colors.text,
          fontSize: 15,
          lineHeight: 22,
        },
        style,
      ]}
    />
  );
}
export function Icon({
  name,
  size = 22,
  color,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  color?: ColorValue;
}) {
  const { colors } = useApp();
  return (
    <Ionicons
      name={name}
      size={size}
      color={color || colors.accent}
      accessible={false}
    />
  );
}
export function Button({
  title,
  onPress,
  icon,
  secondary = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  secondary?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        {
          minHeight: 48,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: secondary ? colors.raised : colors.accent,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={19}
          color={secondary ? colors.accent : colors.onAccent}
        />
      )}
      <Txt
        style={{
          fontWeight: "600",
          color: secondary ? colors.accent : colors.onAccent,
        }}
      >
        {title}
      </Txt>
    </Pressable>
  );
}
export function IconButton({
  name,
  label,
  onPress,
  active = false,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  const { colors } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: 48,
        minHeight: 48,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 24,
        backgroundColor: active ? colors.raised : "transparent",
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon name={name} />
    </Pressable>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useApp();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.line,
          borderWidth: 1,
          borderRadius: 20,
          padding: 18,
          gap: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Page({ children }: { children: React.ReactNode }) {
  const { colors } = useApp();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: Math.max(32, insets.bottom + 20),
        gap: 20,
        maxWidth: 900,
        width: "100%",
        alignSelf: "center",
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {children}
    </ScrollView>
  );
}
export function Section({
  title,
  caption,
}: {
  title: string;
  caption?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      {caption && (
        <Txt accent style={styles.eyebrow}>
          {caption}
        </Txt>
      )}
      <Txt accessibilityRole="header" style={styles.section}>
        {title}
      </Txt>
    </View>
  );
}
export function PhotoImage({
  photo,
  size = "medium",
  height = 220,
}: {
  photo: Photo;
  size?: "thumb" | "medium" | "full";
  height?: number;
}) {
  const { colors, words, locale } = useApp();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [retry, setRetry] = useState(0);
  return (
    <View
      style={{
        height,
        backgroundColor: colors.raised,
        overflow: "hidden",
        borderRadius: 14,
      }}
    >
      {!failed && (
        <Image
          key={`${photo.id}:${retry}`}
          source={imageUrl(photo, size)}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          cachePolicy="memory-disk"
          recyclingKey={photo.id}
          transition={0}
          accessibilityLabel={`${photo.airlines.map((name) => airlineName(name, locale)).join(", ")} ${photo.models.map((name) => aircraftName(name, locale)).join(", ")}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}{" "}
      {!loaded && !failed && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.center]}
        >
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      {failed && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={words("Retry loading photo", "重新加载照片")}
          onPress={() => {
            setFailed(false);
            setLoaded(false);
            setRetry((n) => n + 1);
          }}
          style={[StyleSheet.absoluteFill, styles.center]}
        >
          <Icon name="cloud-offline-outline" />
          <Txt muted style={{ textAlign: "center", padding: 16 }}>
            {words(
              "Photo not cached. Connect and tap to retry.",
              "照片尚未缓存，联网后点按重试。",
            )}
          </Txt>
        </Pressable>
      )}
    </View>
  );
}
export function Silhouette({
  entry,
  height = 170,
}: {
  entry: Entry;
  height?: number;
}) {
  const { colors, locale } = useApp();
  const shape = aircraftShape({
    model: entry.name,
    family: entry.family,
    category: entry.category,
  });
  const paints: Record<string, string> = {
    body: colors.muted,
    shade: colors.line,
    window: colors.bg,
    highlight: colors.text,
    none: "none",
  };
  return (
    <Svg
      height={height}
      width="100%"
      viewBox="0 0 600 240"
      accessibilityLabel={aircraftName(entry.name, locale)}
    >
      <G transform={`translate(${shape.offset} 145) scale(${shape.scale})`}>
        {shape.paths.map((p, i) => (
          <Path
            key={i}
            d={p.d}
            fill={paints[p.fill]}
            stroke={paints[p.stroke]}
            strokeWidth={p.strokeWidth || undefined}
            strokeLinejoin="round"
          />
        ))}
      </G>
    </Svg>
  );
}
export function Stat({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <View style={{ minWidth: 110, flex: 1, gap: 4 }}>
      <Txt
        style={{
          fontSize: 30,
          lineHeight: 36,
          fontWeight: "700",
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Txt>
      <Txt muted style={{ fontSize: 12, lineHeight: 18 }}>
        {label}
      </Txt>
    </View>
  );
}
export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <Card style={{ alignItems: "center", paddingVertical: 36 }}>
      <Icon name="airplane-outline" size={36} />
      <Txt style={{ fontSize: 20, fontWeight: "600", textAlign: "center" }}>
        {title}
      </Txt>
      {body && (
        <Txt muted style={{ textAlign: "center" }}>
          {body}
        </Txt>
      )}
    </Card>
  );
}
export const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "600",
    letterSpacing: 2,
  },
  section: { fontSize: 23, lineHeight: 30, fontWeight: "700" },
  title: { fontSize: 32, lineHeight: 40, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  center: { alignItems: "center", justifyContent: "center" },
  input: {
    fontSize: 16,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
