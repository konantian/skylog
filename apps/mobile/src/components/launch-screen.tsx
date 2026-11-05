import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useAnimatedValue,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

const sky = {
  bg: "#0b151e",
  line: "#294b63",
  accent: "#9cd9ff",
  text: "#edf5fb",
  muted: "#a0b6c6",
};
const stops = Array.from({ length: 17 }, (_, i) => i / 16);

export function LaunchScreen({
  ready,
  locale,
  onFinish,
}: {
  ready: boolean;
  locale: string;
  onFinish: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(320, width - 48, height * 0.4) / 320;
  const progress = useAnimatedValue(0);
  const opacity = useAnimatedValue(1);
  const [painted, setPainted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [done, setDone] = useState(false);
  const chinese = locale === "zh";

  useEffect(() => {
    let active = true;
    const update = (value: boolean) => {
      if (active) setReduceMotion(value);
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(update, () =>
      update(true),
    );
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      update,
    );
    return () => {
      active = false;
      listener.remove();
    };
  }, []);

  useEffect(() => {
    if (!painted || reduceMotion === null || done) return;
    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration: reduceMotion ? 0 : 950,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
        isInteraction: false,
      }),
      // Give the fully revealed tagline time to be read before fading out.
      Animated.delay(1500),
    ]);
    animation.start(({ finished }) => {
      if (finished) setDone(true);
    });
    return () => animation.stop();
  }, [painted, reduceMotion, progress, done]);

  useEffect(() => {
    if (!ready || !done) return;
    const animation = Animated.timing(opacity, {
      toValue: 0,
      duration: reduceMotion ? 120 : 220,
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start(({ finished }) => {
      if (finished) onFinish();
    });
    return () => animation.stop();
  }, [ready, done, reduceMotion, opacity, onFinish]);

  const reveal = progress.interpolate({
    inputRange: [0, 0.35, 0.7, 1],
    outputRange: [0, 0.3, 1, 1],
    extrapolate: "clamp",
  });
  return (
    <Animated.View
      style={[styles.screen, { opacity }]}
      accessibilityViewIsModal
      onLayout={() => {
        if (!painted)
          void SplashScreen.hideAsync()
            .finally(() => setPainted(true))
            .catch(() => {});
      }}
    >
      <StatusBar style="light" />
      <View style={styles.brand}>
        <View
          style={{ width: 320 * scale, height: 260 * scale }}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Svg width="100%" height="100%" viewBox="0 0 320 260">
            <Circle
              cx="160"
              cy="135"
              r="104"
              stroke={sky.line}
              strokeWidth="1"
              fill="none"
            />
            <Circle
              cx="160"
              cy="135"
              r="80"
              stroke={sky.line}
              strokeWidth="1"
              strokeDasharray="2 9"
              fill="none"
            />
            <Path
              d="M160 23v14m0 196v14M48 135h14m196 0h14"
              stroke={sky.line}
              strokeWidth="2"
            />
            <Path
              d="M50 195Q152 200 260 45"
              stroke={sky.line}
              strokeWidth="1.5"
              strokeDasharray="4 6"
              fill="none"
            />
          </Svg>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: reveal }]}>
            <Svg width="100%" height="100%" viewBox="0 0 320 260">
              <Path
                d="M50 195Q152 200 260 45"
                stroke={sky.accent}
                strokeWidth="2"
                fill="none"
              />
              <Circle cx="50" cy="195" r="5" fill={sky.accent} />
              <Circle
                cx="50"
                cy="195"
                r="12"
                stroke={sky.accent}
                strokeOpacity="0.3"
                fill="none"
              />
            </Svg>
          </Animated.View>
          <Animated.View
            style={{
              position: "absolute",
              left: 130 * scale,
              top: 105 * scale,
              width: 60 * scale,
              height: 60 * scale,
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: stops,
                    outputRange: stops.map(
                      (t) => (-110 + 204 * t + 6 * t * t) * scale,
                    ),
                  }),
                },
                {
                  translateY: progress.interpolate({
                    inputRange: stops,
                    outputRange: stops.map(
                      (t) => (60 + 10 * t - 160 * t * t) * scale,
                    ),
                  }),
                },
                {
                  rotate: progress.interpolate({
                    inputRange: stops,
                    outputRange: stops.map(
                      (t) =>
                        `${(Math.atan2(10 - 320 * t, 204 + 12 * t) * 180) / Math.PI + 90}deg`,
                    ),
                  }),
                },
              ],
            }}
          >
            <Svg width="100%" height="100%" viewBox="-26 -26 52 52">
              <G fill={sky.text}>
                <Rect x="-12" y="-2" width="3.5" height="11" rx="1.5" />
                <Rect x="8.5" y="-2" width="3.5" height="11" rx="1.5" />
                <Path d="M0-23c2 0 3 4 3 7v9L20 6v4L3 3v12l6 5v2l-9-3-9 3v-2l6-5V3L-20 10V6L-3-7v-9c0-3 1-7 3-7Z" />
              </G>
            </Svg>
          </Animated.View>
        </View>
        <Animated.View
          style={{
            opacity: reveal,
            alignItems: "center",
            gap: 12,
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [reduceMotion ? 0 : 10, 0],
                }),
              },
            ],
          }}
        >
          <Text style={styles.name} allowFontScaling={false}>
            SKYLOG
          </Text>
          <Text style={styles.tagline} maxFontSizeMultiplier={1.4}>
            {chinese ? "每一次抬头，都是新的发现。" : "KEEP LOOKING UP."}
          </Text>
        </Animated.View>
      </View>
      {ready ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={chinese ? "跳过开屏动画" : "Skip intro"}
          onPress={() => {
            progress.stopAnimation();
            progress.setValue(1);
            setDone(true);
          }}
          style={({ pressed }) => [styles.skip, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Text style={styles.skipText}>
            {chinese ? "进入 SKYLOG" : "Enter SKYLOG"}
          </Text>
        </Pressable>
      ) : (
        <Text style={[styles.skip, styles.skipText]}>
          {chinese ? "正在打开你的天空…" : "Opening your sky…"}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: sky.bg,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  brand: { alignItems: "center", paddingBottom: 32 },
  name: {
    color: sky.text,
    fontSize: 36,
    lineHeight: 48,
    fontWeight: "700",
    letterSpacing: 8,
  },
  tagline: {
    color: sky.muted,
    fontSize: 13,
    lineHeight: 22,
    letterSpacing: 2,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  skip: {
    position: "absolute",
    bottom: 40,
    minHeight: 48,
    minWidth: 160,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  skipText: { color: sky.muted, fontSize: 13, textAlign: "center" },
});
