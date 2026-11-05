import type { Entry, Photo, Flight } from "../../../../lib/types";
import catalog from "../../../../data/catalog.json";
import flightData from "../../../../data/flights.json";
import heroIds from "../../../../data/hero-selections.json";
import verification from "../../../../data/photo-verification.json";
export { default as airlineProfiles } from "../../../../data/airline-profiles.json";
export { default as aircraftProfiles } from "../../../../data/aircraft-profiles.json";
export { default as airports } from "../generated/airports.json";
export { default as photoSettings } from "../../../../data/photo-settings.json";
export { default as covers } from "../../../../data/cover-selections.json";
export {
  initialFilters,
  filterCatalog,
  filterPhotos,
  filterFlights,
  groupModelVariants,
  photoMatches,
  flightsForEntry,
  flightsForPhoto,
} from "../../../../lib/filter.mjs";
export { airlineCollection } from "../../../../lib/airline-collection.mjs";
export type {
  Entry,
  Photo,
  Filters,
  Mode,
  Flight,
} from "../../../../lib/types";
export const photos = catalog.photos as Photo[],
  aircraft = catalog.aircraft as Entry[],
  airlines = catalog.airlines as Entry[];
export const seedFlights = flightData.flights as Flight[];
export const photoById = new Map(photos.map((p) => [p.id, p]));
export const heroes = heroIds.map((id) => photoById.get(id)!).filter(Boolean);
export const fileById = new Map(verification.files.map((f) => [f.photo, f]));
export const website = "https://konantian.github.io/skylog";
export const imageUrl = (
  photo: Photo,
  size: "thumb" | "medium" | "full" = "medium",
) =>
  `${website}${size === "thumb" ? photo.thumbnail : size === "full" ? photo.image : `/photos/medium/${photo.id}.jpg`}`;
export type LocalFlight = Flight & {
  status: "planned" | "completed" | "cancelled";
  notes: string;
  updatedAt?: string;
  durationMinutes?: number | null;
  delayMinutes?: number | null;
  aircraftYear?: number | null;
  seat?: string;
  seatPosition?: string;
  cabin?: string;
  departureTime?: string;
  arrivalTime?: string;
  departureTerminal?: string;
  arrivalTerminal?: string;
  departureGate?: string;
  arrivalGate?: string;
  baggage?: string;
  trip?: string;
  bookingReference?: string;
};
