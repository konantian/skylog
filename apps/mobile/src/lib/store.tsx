import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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
  prefs: (key: "locale" | "theme", value: string) => Promise<void>;
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
function LocalStore({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const scheme = useColorScheme();
  const [data, setData] = useState<{
    flights: LocalFlight[];
    preferences: Record<string, string>;
    saved: string[];
  } | null>(null);
  const [error, setError] = useState("");
  const [filters, updateFilters] = useState<Record<Mode, Filters>>({
    aircraft: { ...initialFilters },
    airlines: { ...initialFilters },
    photos: { ...initialFilters },
    flights: { ...initialFilters },
  });
  const refresh = useCallback(async () => {
    const next = await readLocalData(db);
    setData(next);
    setError("");
  }, [db]);
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
  const isDark = theme === "system" ? scheme !== "light" : theme === "dark";
  const colors = isDark ? dark : light;
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
        t: (key, values = []) => translate(locale, key, values),
        words: (en, zh) => (locale === "zh" ? zh : en),
        flights: data.flights,
        completed: data.flights.filter((f) => f.status === "completed"),
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
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <SQLiteProvider databaseName="skylog.db" onInit={migrate}>
      <LocalStore>{children}</LocalStore>
    </SQLiteProvider>
  );
}
