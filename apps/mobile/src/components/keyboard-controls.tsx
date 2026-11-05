import { useIsFocused } from "expo-router/react-navigation";
import {
  KeyboardToolbar,
  type KeyboardToolbarProps,
} from "react-native-keyboard-controller";
import { type ComponentProps } from "react";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../lib/store";

function ToolbarButton({
  children,
  onPress,
  disabled,
  accessibilityLabel,
  style,
  testID,
}: ComponentProps<NonNullable<KeyboardToolbarProps["button"]>>) {
  const { words } = useApp();
  const label =
    accessibilityLabel === "Previous"
      ? words("Previous field", "上一项")
      : accessibilityLabel === "Next"
        ? words("Next field", "下一项")
        : words("Dismiss keyboard", "收起键盘");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={[
        style,
        {
          minWidth: 48,
          minHeight: 44,
          justifyContent: "center",
          alignItems: "center",
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

export function KeyboardControls({ form = false }: { form?: boolean }) {
  const focused = useIsFocused();
  const { colors, words } = useApp();
  const insets = useSafeAreaInsets();
  if (!focused) return null;
  const theme = {
    primary: colors.accent,
    disabled: colors.muted,
    background: colors.card,
    ripple: colors.raised,
  };
  return (
    <KeyboardToolbar theme={{ light: theme, dark: theme }} insets={insets}>
      {form && <KeyboardToolbar.Prev button={ToolbarButton} />}
      {form && <KeyboardToolbar.Next button={ToolbarButton} />}
      <KeyboardToolbar.Done
        text={words("Done", "完成")}
        button={ToolbarButton}
      />
    </KeyboardToolbar>
  );
}
