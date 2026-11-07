import { useCallback, useEffect, useId, useLayoutEffect, useRef } from "react";
import { router, useFocusEffect } from "expo-router";
import { FlatList } from "react-native";
import { coverByAlternate } from "../../../../lib/photo-highlights.mjs";
import { photoById } from "./catalog";

export type PhotoParams = {
  id: string;
  sequence?: string;
  origin?: string;
  model?: string;
  airline?: string;
  livery?: string;
};

export function openPhoto(
  id: string,
  ids: string[],
  origin?: string,
  fullscreen = false,
) {
  router.push({
    pathname: fullscreen ? "/photo/fullscreen" : "/photo/[id]",
    params: { id, sequence: ids.join(","), ...(origin ? { origin } : {}) },
  });
}

export function readSequence(
  { id, sequence }: PhotoParams,
  fallback: () => string[],
) {
  const ids =
    sequence === undefined
      ? fallback()
      : [...new Set(sequence.split(",").filter((key) => photoById.has(key)))];
  return ids.includes(id) ? ids : photoById.has(id) ? [id] : [];
}

// Each mounted origin consumes only its own return position, including nested galleries.
const returns = new Map<string, string>();
export function rememberPhoto(origin: string | undefined, id: string) {
  if (origin) returns.set(origin, id);
}
export function usePhotoReturn(onReturn: (id: string) => void) {
  const origin = useId();
  const callback = useRef(onReturn);
  useLayoutEffect(() => {
    callback.current = onReturn;
  }, [onReturn]);
  useFocusEffect(
    useCallback(() => {
      const id = returns.get(origin);
      returns.delete(origin);
      if (id) callback.current(id);
    }, [origin]),
  );
  useEffect(
    () => () => {
      returns.delete(origin);
    },
    [origin],
  );
  return origin;
}

export function usePhotoListReturn<T extends { id: string }>(
  items: T[],
  columns = 1,
) {
  const list = useRef<FlatList<T>>(null);
  const retry = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const attempts = useRef(0);
  useEffect(() => () => clearTimeout(retry.current), []);
  const origin = usePhotoReturn((id) => {
    let index = items.findIndex((item) => item.id === id);
    if (index < 0 && coverByAlternate.has(id)) {
      index = items.findIndex((item) => item.id === coverByAlternate.get(id));
    }
    if (index >= 0) {
      attempts.current = 0;
      list.current?.scrollToIndex({
        index: Math.floor(index / columns),
        animated: false,
        viewPosition: 0.35,
      });
    }
  });
  const onScrollToIndexFailed = ({
    index,
    averageItemLength,
  }: {
    index: number;
    averageItemLength: number;
  }) => {
    // Virtualized rows outside the render window need to be measured first.
    list.current?.scrollToOffset({
      offset: index * averageItemLength,
      animated: false,
    });
    clearTimeout(retry.current);
    if (++attempts.current <= 3)
      retry.current = setTimeout(() => {
        list.current?.scrollToIndex({
          index,
          animated: false,
          viewPosition: 0.35,
        });
      }, 90);
  };
  return { list, origin, onScrollToIndexFailed };
}
