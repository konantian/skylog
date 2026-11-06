import { useMemo } from "react";
import { shootingDays } from "../../../../lib/insights.mjs";
import {
  aircraft,
  airlines,
  covers,
  filterPhotos,
  heroes,
  photos,
  type Photo,
} from "./catalog";
import { useApp } from "./store";

const coverOrder = [...heroes.map((p) => p.id), ...covers.preferredPhotos];
type ShootingDay = {
  date: string;
  airports: string[];
  photos: Photo[];
  cover: Photo;
  newModels: string[];
  newAirlines: string[];
};

export function useShootingDays(): ShootingDay[] {
  const { filters } = useApp();
  const filter = filters.photos;
  return useMemo(
    () =>
      shootingDays(
        filterPhotos(photos, filter, aircraft, airlines),
        aircraft,
        airlines,
        coverOrder,
      ) as ShootingDay[],
    [filter],
  );
}

export function shootingDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-CA", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(date + "T00:00:00Z"));
}
