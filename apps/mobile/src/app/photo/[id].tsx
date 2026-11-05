import { useState } from "react";
import {
  View,
  Alert,
  Modal,
  ScrollView,
  useWindowDimensions,
  Linking,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../../lib/store";
import {
  photoById,
  photos,
  aircraft,
  airlines,
  filterPhotos,
  initialFilters,
  imageUrl,
  fileById,
  photoSettings,
  type Photo,
} from "../../lib/catalog";
import {
  Page,
  Txt,
  Card,
  Button,
  IconButton,
  PhotoImage,
  styles,
} from "../../components/ui";
export default function PhotoDetail() {
  const params = useLocalSearchParams<{
    id: string;
    model?: string;
    airline?: string;
    livery?: string;
  }>();
  const { words, t, colors, saved, toggleSaved } = useApp();
  const [zoom, setZoom] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const photo = photoById.get(params.id);
  if (!photo)
    return (
      <Page>
        <Txt>{words("Photograph not found", "未找到照片")}</Txt>
      </Page>
    );
  const gallery = filterPhotos(
    photos,
    {
      ...initialFilters,
      model: params.model || "all",
      airline: params.airline || "all",
      livery: params.livery || "all",
    },
    aircraft,
    airlines,
  );
  const index = gallery.findIndex((p: Photo) => p.id === photo.id);
  const navigate = (direction: number) => {
    const next = gallery[(index + direction + gallery.length) % gallery.length];
    router.setParams({ id: next.id });
  };
  const exif = (
    photoSettings as Record<
      string,
      { shutter: string; focalLengthMm: number; aperture: number; iso: number }
    >
  )[photo.id];
  const dimensions = fileById.get(photo.id);
  const photoHeight =
    width * ((dimensions?.height || 2) / (dimensions?.width || 3));
  const share = async () => {
    setSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync()))
        throw new Error(
          words("Sharing is not available.", "当前设备无法分享。"),
        );
      const file = new File(Paths.cache, `${photo.id}.jpg`);
      await File.downloadFileAsync(imageUrl(photo, "full"), file, {
        idempotent: true,
      });
      await Sharing.shareAsync(file.uri, {
        mimeType: "image/jpeg",
        UTI: "public.jpeg",
        dialogTitle: photo.id,
      });
    } catch (e) {
      Alert.alert(words("Could not share photo", "无法分享照片"), String(e));
    } finally {
      setSharing(false);
    }
  };
  return (
    <Page>
      <Stack.Screen
        options={{
          title: photo.id,
          headerRight: () => (
            <IconButton
              name={saved.includes(photo.id) ? "bookmark" : "bookmark-outline"}
              label={words("Save photograph", "收藏照片")}
              active={saved.includes(photo.id)}
              onPress={() =>
                void toggleSaved(photo.id).catch((e) => Alert.alert(String(e)))
              }
            />
          ),
        }}
      />
      <PhotoImage
        key={photo.id}
        photo={photo}
        height={Math.min(width * 0.7, 400)}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <IconButton
          name="chevron-back"
          label={t("上一张照片")}
          onPress={() => navigate(-1)}
        />
        <Txt muted>
          {index + 1} / {gallery.length}
        </Txt>
        <IconButton
          name="expand-outline"
          label={words("Zoom photo", "放大照片")}
          onPress={() => {
            setZoomed(false);
            setZoom(true);
          }}
        />
        <IconButton
          name="chevron-forward"
          label={t("下一张照片")}
          onPress={() => navigate(1)}
        />
      </View>
      <Txt style={{ fontSize: 25, lineHeight: 32, fontWeight: "700" }}>
        {photo.airlines.join(" / ")}
      </Txt>
      {photo.models.map((model) => (
        <Button
          key={model}
          title={model}
          secondary
          icon="airplane-outline"
          onPress={() => {
            const entry = aircraft.find((a) => a.name === model);
            if (entry)
              router.push({
                pathname: "/aircraft/[id]",
                params: { id: entry.id },
              });
          }}
        />
      ))}
      <Txt muted>
        {photo.airport} · {photo.date} · {photo.id}
      </Txt>
      <Card>
        <Txt muted>{t("涂装")}</Txt>
        <Txt>{t(photo.livery)}</Txt>
        <Txt muted>{words("Registration", "注册号")}</Txt>
        <Txt>
          {photo.registration?.value || t("尚未核实")} ·{" "}
          {photo.registration?.status === "confirmed"
            ? t("已确认")
            : words("Unconfirmed", "待确认")}
        </Txt>
        <Txt muted>{words("Flight identification", "航班识别")}</Txt>
        <Txt>{photo.flights.join(" / ") || t("尚未核实")}</Txt>
        {photo.flightIdentification?.status && (
          <Txt muted>
            {photo.flightIdentification.status === "confirmed"
              ? t("已确认")
              : words("Inferred / unconfirmed", "推测／待确认")}
          </Txt>
        )}
      </Card>
      {exif && (
        <Card>
          <View style={styles.wrap}>
            {[
              `${exif.focalLengthMm} mm`,
              exif.shutter,
              `ƒ/${exif.aperture}`,
              `ISO ${exif.iso}`,
            ].map((v) => (
              <Txt key={v}>{v}</Txt>
            ))}
          </View>
          <Txt muted>Sony α7C · Tamron 28–200mm</Txt>
        </Card>
      )}
      <Button
        title={
          sharing
            ? words("Preparing…", "准备中……")
            : words("Share edited JPG", "分享精修 JPG")
        }
        icon="share-outline"
        disabled={sharing}
        onPress={() => void share()}
      />
      {dimensions?.original && (
        <Button
          secondary
          title={words("Open full-resolution JPG", "打开原尺寸 JPG")}
          icon="download-outline"
          onPress={() => void Linking.openURL(dimensions.original.url)}
        />
      )}
      <Txt muted>{words("Photography © Yuan Wang", "摄影 © 王源")}</Txt>
      <Modal
        visible={zoom}
        onRequestClose={() => setZoom(false)}
        animationType="fade"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.bg,
            paddingTop: insets.top,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 12,
            }}
          >
            <IconButton
              name="close"
              label={words("Close zoom", "关闭放大")}
              onPress={() => setZoom(false)}
            />
            <IconButton
              name={zoomed ? "remove" : "add"}
              label={words("Toggle zoom", "切换缩放")}
              onPress={() => setZoomed((v) => !v)}
            />
          </View>
          <ScrollView
            key={`${photo.id}:${zoomed}`}
            style={{ flex: 1 }}
            contentContainerStyle={{
              minHeight: height - insets.top - 70,
              justifyContent: "center",
            }}
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent
          >
            <ScrollView
              horizontal
              contentContainerStyle={{ alignItems: "center" }}
            >
              <Image
                source={imageUrl(photo, "full")}
                cachePolicy="memory-disk"
                contentFit="contain"
                accessibilityLabel={photo.id}
                style={{
                  width: zoomed ? width * 2 : width,
                  height: zoomed ? photoHeight * 2 : photoHeight,
                }}
              />
            </ScrollView>
          </ScrollView>
        </View>
      </Modal>
    </Page>
  );
}
