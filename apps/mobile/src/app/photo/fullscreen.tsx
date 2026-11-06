import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../../lib/store";
import { imageUrl, photoById, type Photo } from "../../lib/catalog";
import { aircraftName, airlineName } from "../../lib/flight-labels";
import {
  readSequence,
  rememberPhoto,
  type PhotoParams,
} from "../../lib/photo-navigation";
import { Icon, Txt } from "../../components/ui";

function bound(value: number, limit: number) {
  "worklet";
  return Math.max(-limit, Math.min(limit, value));
}

function PhotoPage({
  photo,
  width,
  height,
  manualZoom,
  onZoom,
}: {
  photo: Photo;
  width: number;
  height: number;
  manualZoom: boolean;
  onZoom: (zoomed: boolean) => void;
}) {
  const { words, locale } = useApp();
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );
  const [retry, setRetry] = useState(0);
  const size = { width, height };
  const scale = useSharedValue(manualZoom ? 2 : 1);
  const initialScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const anchorX = useSharedValue(0);
  const anchorY = useSharedValue(0);
  const [canPan, setCanPan] = useState(manualZoom);
  const reportZoom = (value: boolean) => {
    setCanPan(value);
    onZoom(value);
  };
  const pinch = Gesture.Pinch()
    .onStart((e) => {
      initialScale.value = scale.value;
      anchorX.value = (e.focalX - width / 2 - x.value) / scale.value;
      anchorY.value = (e.focalY - height / 2 - y.value) / scale.value;
      scheduleOnRN(reportZoom, true);
    })
    .onUpdate((e) => {
      const next = Math.max(1, Math.min(4, initialScale.value * e.scale));
      scale.value = next;
      x.value = bound(
        e.focalX - width / 2 - anchorX.value * next,
        (width * (next - 1)) / 2,
      );
      y.value = bound(
        e.focalY - height / 2 - anchorY.value * next,
        (height * (next - 1)) / 2,
      );
    })
    .onFinalize(() => {
      if (scale.value < 1.02) {
        scale.value = 1;
        x.value = 0;
        y.value = 0;
      }
      scheduleOnRN(reportZoom, scale.value > 1);
    });
  // At fit, a one-finger drag belongs entirely to the horizontal pager.
  const pan = Gesture.Pan()
    .enabled(canPan)
    .maxPointers(1)
    .onChange((e) => {
      x.value = bound(x.value + e.changeX, (width * (scale.value - 1)) / 2);
      y.value = bound(y.value + e.changeY, (height * (scale.value - 1)) / 2);
    });
  const transform = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
    ],
  }));
  const image = (
    <Image
      key={retry}
      source={imageUrl(photo, "full")}
      contentFit="contain"
      cachePolicy="memory-disk"
      style={size}
      accessibilityLabel={`${photo.airlines.map((n) => airlineName(n, locale)).join(", ")} · ${photo.models.map((n) => aircraftName(n, locale)).join(", ")} · ${photo.id}`}
      onLoad={() => setStatus("ready")}
      onError={() => setStatus("failed")}
    />
  );
  return (
    <View style={size}>
      {status === "failed" ? (
        <View style={[styles.center, size]}>
          <Txt style={styles.white}>
            {words(
              "Photo not cached. Connect and retry.",
              "照片尚未缓存，请联网后重试。",
            )}
          </Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={words("Retry", "重试")}
            style={styles.control}
            onPress={() => {
              setStatus("loading");
              setRetry((n) => n + 1);
            }}
          >
            <Icon name="refresh" color="#fff" />
          </Pressable>
        </View>
      ) : (
        <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>
          <View collapsable={false} style={[size, { overflow: "hidden" }]}>
            <Animated.View style={[size, transform]}>{image}</Animated.View>
          </View>
        </GestureDetector>
      )}
      {status === "loading" && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.center]}
        >
          <ActivityIndicator color="#fff" />
        </View>
      )}
    </View>
  );
}

export default function FullscreenPhoto() {
  const { id, sequence, origin } = useLocalSearchParams<PhotoParams>();
  const ids = useMemo(
    () => readSequence({ id, sequence }, () => [id]),
    [id, sequence],
  );
  const start = Math.max(0, ids.indexOf(id));
  const [index, setIndex] = useState(start);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [manualZoom, setManualZoom] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [reset, setReset] = useState(0);
  const list = useRef<FlatList<string>>(null);
  const insets = useSafeAreaInsets();
  const { words } = useApp();
  const select = (next: number) => {
    if (!ids[next] || next === index) return;
    rememberPhoto(origin, ids[next]);
    setIndex(next);
    setManualZoom(false);
    setZoomed(false);
  };
  const move = (next: number) => {
    if (!ids[next]) return;
    list.current?.scrollToIndex({ index: next, animated: true });
    select(next);
  };
  return (
    <View
      style={{ flex: 1, backgroundColor: "#000" }}
      onLayout={({ nativeEvent: { layout } }) => {
        setViewport((prev) =>
          prev.width === layout.width && prev.height === layout.height
            ? prev
            : { width: layout.width, height: layout.height },
        );
      }}
    >
      {ids.length === 0 ? (
        <View style={[styles.center, { flex: 1 }]}>
          <Txt style={styles.white}>
            {words("Photograph not found", "未找到照片")}
          </Txt>
        </View>
      ) : (
        viewport.width > 0 &&
        viewport.height > 0 && (
          <FlatList<string>
            key={`${viewport.width}:${viewport.height}`}
            ref={list}
            data={ids}
            keyExtractor={(key) => key}
            horizontal
            pagingEnabled
            directionalLockEnabled
            bounces={false}
            scrollEnabled={!zoomed && ids.length > 1}
            contentInsetAdjustmentBehavior="never"
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={index}
            initialNumToRender={1}
            maxToRenderPerBatch={3}
            windowSize={3}
            getItemLayout={(_, i) => ({
              index: i,
              length: viewport.width,
              offset: i * viewport.width,
            })}
            onMomentumScrollEnd={(e) =>
              select(Math.round(e.nativeEvent.contentOffset.x / viewport.width))
            }
            renderItem={({ item, index: i }) => (
              <PhotoPage
                key={i === index ? item + ":" + reset : item}
                photo={photoById.get(item)!}
                width={viewport.width}
                height={viewport.height}
                manualZoom={i === index && manualZoom}
                onZoom={(value) => {
                  if (i === index) setZoomed(value);
                }}
              />
            )}
          />
        )
      )}
      <View
        pointerEvents="box-none"
        style={[
          styles.controls,
          {
            top: insets.top + 6,
            left: insets.left + 8,
            right: insets.right + 8,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={words("Close fullscreen", "关闭全屏")}
          style={styles.control}
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(tabs)/photos")
          }
        >
          <Icon name="close" color="#fff" />
        </Pressable>
        {ids.length > 0 && (
          <View style={styles.position}>
            {index > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={words("Previous photo", "上一张照片")}
                style={styles.arrow}
                onPress={() => move(index - 1)}
              >
                <Icon name="chevron-back" size={18} color="#fff" />
              </Pressable>
            )}
            <Txt style={styles.white}>
              {index + 1} / {ids.length} · {ids[index]}
            </Txt>
            {index < ids.length - 1 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={words("Next photo", "下一张照片")}
                style={styles.arrow}
                onPress={() => move(index + 1)}
              >
                <Icon name="chevron-forward" size={18} color="#fff" />
              </Pressable>
            )}
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            zoomed
              ? words("Fit photo", "完整显示照片")
              : words("Zoom in", "放大照片")
          }
          style={styles.control}
          onPress={() => {
            setManualZoom(!zoomed);
            setZoomed(!zoomed);
            setReset((n) => n + 1);
          }}
        >
          <Icon name={zoomed ? "contract-outline" : "add"} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  controls: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  control: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  position: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  arrow: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  white: { color: "#fff", textAlign: "center" },
});
