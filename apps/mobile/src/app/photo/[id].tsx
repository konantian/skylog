import { useMemo, useState } from "react";
import { View, Alert, useWindowDimensions, Linking } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  openPhoto,
  readSequence,
  rememberPhoto,
  usePhotoReturn,
  type PhotoParams,
} from "../../lib/photo-navigation";
import { useApp } from "../../lib/store";
import { airlineName, aircraftName } from "../../lib/flight-labels";
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
  const params = useLocalSearchParams<PhotoParams>();
  return <PhotoDetailContent key={params.id} params={params} />;
}
function PhotoDetailContent({ params }: { params: PhotoParams }) {
  const { words, t, locale, saved, toggleSaved } = useApp();
  const [sharing, setSharing] = useState(false);
  const { width } = useWindowDimensions();
  const [currentId, setCurrentId] = useState(params.id);
  const { id, sequence, model, airline, livery } = params;
  const gallery = useMemo(
    () =>
      readSequence({ id, sequence }, () =>
        filterPhotos(
          photos,
          {
            ...initialFilters,
            model: model || "all",
            airline: airline || "all",
            livery: livery || "all",
          },
          aircraft,
          airlines,
        ).map((p: Photo) => p.id),
      ),
    [id, sequence, model, airline, livery],
  );
  const select = (next: string) => {
    setCurrentId(next);
    rememberPhoto(params.origin, next);
  };
  const origin = usePhotoReturn(select);
  const photo = photoById.get(currentId);
  if (!photo)
    return (
      <Page>
        <Txt>{words("Photograph not found", "未找到照片")}</Txt>
      </Page>
    );
  const index = gallery.indexOf(photo.id);
  const navigate = (direction: number) => {
    const next = gallery[(index + direction + gallery.length) % gallery.length];
    select(next);
  };
  const exif = (
    photoSettings as Record<
      string,
      { shutter: string; focalLengthMm: number; aperture: number; iso: number }
    >
  )[photo.id];
  const dimensions = fileById.get(photo.id);
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
        {gallery.length > 1 && (
          <IconButton
            name="chevron-back"
            label={t("上一张照片")}
            onPress={() => navigate(-1)}
          />
        )}
        <Txt muted>
          {index + 1} / {gallery.length}
        </Txt>
        <IconButton
          name="expand-outline"
          label={words("Zoom photo", "放大照片")}
          onPress={() => openPhoto(photo.id, gallery, origin, true)}
        />
        {gallery.length > 1 && (
          <IconButton
            name="chevron-forward"
            label={t("下一张照片")}
            onPress={() => navigate(1)}
          />
        )}
      </View>
      <Txt style={{ fontSize: 25, lineHeight: 32, fontWeight: "700" }}>
        {photo.airlines.map((name) => airlineName(name, locale)).join(" / ")}
      </Txt>
      {photo.models.map((model) => (
        <Button
          key={model}
          title={aircraftName(model, locale)}
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
        <Txt>{photo.registration?.value || "—"}</Txt>
        <Txt muted>{words("Flight identification", "航班识别")}</Txt>
        <Txt>{photo.flights.join(" / ") || "—"}</Txt>
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
    </Page>
  );
}
