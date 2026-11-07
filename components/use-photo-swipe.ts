import {useRef, type TouchEvent} from 'react';
import {photoSwipe} from '@/lib/photo-swipe.mjs';

export function usePhotoSwipe(onStep: (direction: number) => void) {
  const start = useRef<{x: number; y: number; multiTouch: boolean} | null>(null);

  return {
    onTouchStart(event: TouchEvent) {
      const point = event.touches[0];
      start.current = {x: point.clientX, y: point.clientY, multiTouch: event.touches.length > 1};
    },
    onTouchMove(event: TouchEvent) {
      if (start.current && event.touches.length > 1) start.current.multiTouch = true;
    },
    onTouchCancel() {
      start.current = null;
    },
    onTouchEnd(event: TouchEvent) {
      const origin = start.current;
      start.current = null;
      if (!origin) return;
      const point = event.changedTouches[0];
      const direction = photoSwipe({...origin, endX: point.clientX, endY: point.clientY, scale: window.visualViewport?.scale ?? 1});
      if (direction) onStep(direction);
    },
  };
}
