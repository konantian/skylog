import { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../../lib/store";
import { fileById, imageUrl, photoById } from "../../lib/catalog";
import { aircraftName, airlineName } from "../../lib/flight-labels";
import { Icon, Txt } from "../../components/ui";

export default function FullscreenPhoto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { words, locale } = useApp();
  const insets = useSafeAreaInsets();
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [zoomed, setZoomed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [retry, setRetry] = useState(0);
  const photo = photoById.get(id);
  const dimensions = fileById.get(id);
  const aspect = (dimensions?.width || 3) / (dimensions?.height || 2);
  const fittedWidth = Math.min(viewport.width, viewport.height * aspect);
  const scale = zoomed ? 2 : 1;
  const close = () =>
    router.canGoBack() ? router.back() : router.replace("/(tabs)/photos");

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <View
        style={{ flex: 1 }}
        onLayout={({ nativeEvent }) =>
          setViewport({
            width: nativeEvent.layout.width,
            height: nativeEvent.layout.height,
          })
        }
      >
        {!photo || failed ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <Txt
              style={{
                color: "#fff",
                textAlign: "center",
                paddingHorizontal: 60,
              }}
            >
              {photo
                ? words(
                    "Photo not cached. Connect and retry.",
                    "照片尚未缓存，请联网后重试。",
                  )
                : words("Photograph not found", "未找到照片")}
            </Txt>
            {photo && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={words("Retry", "重试")}
                style={{ padding: 12 }}
                onPress={() => {
                  setFailed(false);
                  setLoaded(false);
                  setRetry((value) => value + 1);
                }}
              >
                <Icon name="refresh" color="#fff" />
              </Pressable>
            )}
          </View>
        ) : (
          viewport.width > 0 &&
          viewport.height > 0 && (
            <ScrollView
              key={`${id}:${zoomed}:${viewport.width}:${viewport.height}`}
              style={{ flex: 1 }}
              contentContainerStyle={{
                minHeight: viewport.height,
                justifyContent: "center",
              }}
              maximumZoomScale={4}
              minimumZoomScale={1}
              contentInsetAdjustmentBehavior="never"
              automaticallyAdjustContentInsets={false}
              centerContent
              showsVerticalScrollIndicator={false}
            >
              <ScrollView
                horizontal
                contentInsetAdjustmentBehavior="never"
                automaticallyAdjustContentInsets={false}
                contentContainerStyle={{
                  minWidth: viewport.width,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                showsHorizontalScrollIndicator={false}
              >
                <Image
                  key={retry}
                  source={imageUrl(photo, "full")}
                  cachePolicy="memory-disk"
                  contentFit="contain"
                  accessibilityLabel={`${photo.airlines.map((name) => airlineName(name, locale)).join(", ")} ${photo.models.map((name) => aircraftName(name, locale)).join(", ")} ${id}`}
                  onError={() => setFailed(true)}
                  onLoad={() => setLoaded(true)}
                  style={{
                    width: fittedWidth * scale,
                    height: (fittedWidth / aspect) * scale,
                  }}
                />
              </ScrollView>
            </ScrollView>
          )
        )}
      </View>
      {photo && !loaded && !failed && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { alignItems: "center", justifyContent: "center" },
          ]}
        >
          <ActivityIndicator color="#fff" />
        </View>
      )}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: insets.left + 8,
          right: insets.right + 8,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {[
          {
            name: "close" as const,
            label: words("Close fullscreen", "关闭全屏"),
            action: close,
          },
          {
            name: zoomed ? ("contract-outline" as const) : ("add" as const),
            label: zoomed
              ? words("Fit photo", "完整显示照片")
              : words("Zoom in", "放大照片"),
            action: () => setZoomed((value) => !value),
          },
        ].map((control) => (
          <Pressable
            key={control.name}
            accessibilityRole="button"
            accessibilityLabel={control.label}
            onPress={control.action}
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.55)",
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Icon name={control.name} color="#fff" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
