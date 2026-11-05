import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  ActivityIndicator,
  AppState,
  Text,
  View,
  Pressable,
  useColorScheme,
} from "react-native";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { getLocales } from "expo-localization";
import { syncReminders, syncFlightWidgets } from "./flight-integrations";
import { flightStatus } from "./flight-time.mjs";
import { translate } from "../../../../lib/i18n.mjs";
import {
  initializeDatabase,
  readLocalData,
  setPreference,
  setPhotoSaved,
  saveFlight,
  deleteFlight,
} from "./database.mjs";
import {
  seedFlights,
  airportTimezones,
  initialFilters,
  photoById,
  type LocalFlight,
  type Filters,
  type Mode,
} from "./catalog";

const dark = {
  bg: "#0b151e",
  card: "#14232f",
  raised: "#1b3040",
  text: "#edf5fb",
  muted: "#a0b6c6",
  line: "#2c4353",
  accent: "#9cd9ff",
  onAccent: "#102638",
  danger: "#ffb4ab",
};
const light = {
  bg: "#f3f7fa",
  card: "#ffffff",
  raised: "#e5eef5",
  text: "#152c3b",
  muted: "#526b7d",
  line: "#c8d7e2",
  accent: "#12618d",
  onAccent: "#ffffff",
  danger: "#aa2830",
};
type Theme = typeof dark;
type Store = {
  reload: () => Promise<void>;
  colors: Theme;
  isDark: boolean;
  locale: string;
  theme: string;
  t: (key?: string | null, values?: unknown[]) => string;
  words: (en: string, zh: string) => string;
  flights: LocalFlight[];
  completed: LocalFlight[];
  saved: string[];
  activeFlight: string;
  integrationError: string;
  prefs: (
    key: "locale" | "theme" | "activeFlight",
    value: string,
  ) => Promise<void>;
  save: (f: LocalFlight) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggleSaved: (id: string) => Promise<void>;
  filters: Record<Mode, Filters>;
  setFilters: (mode: Mode, next: Filters) => void;
};
const Context = createContext<Store | null>(null);
export const useApp = () => {
  const value = useContext(Context);
  if (!value) throw new Error("App provider missing");
  return value;
};
const migrate = (db: Parameters<typeof initializeDatabase>[0]) =>
  initializeDatabase(db, seedFlights);
type ProviderProps = {
  children: React.ReactNode;
  onReady?: (locale: string) => void;
};
function LocalStore({ children, onReady }: ProviderProps) {
  const db = useSQLiteContext();
  const scheme = useColorScheme();
  const [data, setData] = useState<{
    flights: LocalFlight[];
    preferences: Record<string, string>;
    saved: string[];
  } | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [integrationError, setIntegrationError] = useState("");
  const [filters, updateFilters] = useState<Record<Mode, Filters>>({
    aircraft: { ...initialFilters },
    airlines: { ...initialFilters },
    photos: { ...initialFilters },
    flights: { ...initialFilters },
  });
  const refresh = useCallback(async () => {
    const next = await readLocalData(db);
    setData(next);
    setNow(Date.now());
    setError("");
  }, [db]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let mounted = true;
    void readLocalData(db)
      .then((next) => {
        if (mounted) {
          setData(next);
          setError("");
        }
      })
      .catch((e) => {
        if (mounted) setError(String(e));
      });
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh().catch((e) => setError(String(e)));
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, [db, refresh]);
  const locale =
    data?.preferences.locale ||
    (getLocales()[0]?.languageCode === "zh" ? "zh" : "en");
  const theme = data?.preferences.theme || "dark";
  useEffect(() => {
    if (data || error) onReady?.(locale);
  }, [data, error, locale, onReady]);
  const isDark = theme === "system" ? scheme !== "light" : theme === "dark";
  const colors = isDark ? dark : light;
  const flights = useMemo(
    () =>
      (data?.flights || []).map((f) => ({
        ...f,
        status: flightStatus(f, airportTimezones, now) as LocalFlight["status"],
      })),
    [data?.flights, now],
  );
  useEffect(() => {
    if (!data) return;
    let current = true;
    void Promise.all([
      syncReminders(data.flights, locale),
      syncFlightWidgets(data.flights, locale, data.preferences.activeFlight),
    ])
      .then(() => {
        if (current) setIntegrationError("");
      })
      .catch((e) => {
        if (current) setIntegrationError(String(e));
      });
    return () => {
      current = false;
    };
  }, [data, locale]);
  if (!data || error)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          gap: 20,
        }}
      >
        {error ? (
          <>
            <Text style={{ color: colors.text }}>
              Unable to read your local records. / 无法读取本地记录
            </Text>
            <Pressable
              onPress={() => void refresh().catch((e) => setError(String(e)))}
            >
              <Text style={{ color: colors.accent, padding: 16 }}>
                Retry / 重试
              </Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color={colors.accent} />
        )}
      </View>
    );
  const mutate = async (action: () => Promise<unknown>) => {
    await action();
    await refresh();
  };
  return (
    <Context.Provider
      value={{
        reload: refresh,
        colors,
        isDark,
        locale,
        theme,
        activeFlight: data.preferences.activeFlight || "",
        integrationError,
        t: (key, values = []) => translate(locale, key, values),
        words: (en, zh) => (locale === "zh" ? zh : en),
        flights,
        completed: flights.filter((f) => f.status === "completed"),
        saved: data.saved,
        filters,
        setFilters: (mode, next) =>
          updateFilters((old) => ({ ...old, [mode]: next })),
        prefs: (key, value) => mutate(() => setPreference(db, key, value)),
        save: (f) => mutate(() => saveFlight(db, f)),
        remove: (id) => mutate(() => deleteFlight(db, id)),
        toggleSaved: (id) => {
          if (!photoById.has(id))
            return Promise.reject(new Error("Unknown photo"));
          return mutate(() => setPhotoSaved(db, id, !data.saved.includes(id)));
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function AppProvider({ children, onReady }: ProviderProps) {
  return (
    <SQLiteProvider databaseName="skylog.db" onInit={migrate}>
      <LocalStore onReady={onReady}>{children}</LocalStore>
    </SQLiteProvider>
  );
}
