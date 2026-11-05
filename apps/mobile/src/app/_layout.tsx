import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { getLocales } from "expo-localization";
import * as Notifications from "expo-notifications";
import {
  Stack,
  router,
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "../lib/store";
import { useFonts } from "expo-font";
import Ionicons from "@expo/vector-icons/Ionicons";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { LaunchScreen } from "../components/launch-screen";
void SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: false });
export { ErrorBoundary } from "expo-router";
export const unstable_settings = { initialRouteName: "(tabs)" };
function Navigation() {
  const { colors, isDark, words, flights } = useApp();
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse) => {
      const id = response.notification.request.content.data?.flightId;
      if (typeof id === "string" && flights.some((f) => f.id === id)) {
        router.push({ pathname: "/flight/[id]", params: { id } });
        void Notifications.clearLastNotificationResponseAsync();
      }
    };
    const last = Notifications.getLastNotificationResponse();
    if (last) open(last);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [flights]);
  return (
    <ThemeProvider
      value={{
        ...(isDark ? DarkTheme : DefaultTheme),
        colors: {
          ...(isDark ? DarkTheme : DefaultTheme).colors,
          primary: colors.accent,
          background: colors.bg,
          card: colors.bg,
          text: colors.text,
          border: colors.line,
        },
      }}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
          headerBackButtonDisplayMode: "minimal",
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="aircraft/[id]"
          options={{ title: words("Aircraft", "机型档案") }}
        />
        <Stack.Screen
          name="airline/[id]"
          options={{ title: words("Airline", "航司档案") }}
        />
        <Stack.Screen
          name="photo/[id]"
          options={{
            title: words("Photograph", "摄影作品"),
            orientation: "portrait",
          }}
        />
        <Stack.Screen
          name="photo/fullscreen"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            orientation: "landscape",
            animation: "fade",
            statusBarHidden: true,
            autoHideHomeIndicator: true,
          }}
        />
        <Stack.Screen
          name="flight/[id]"
          options={{ title: words("Flight", "乘机记录") }}
        />
        <Stack.Screen
          name="flight/edit"
          options={{
            title: words("Flight record", "编辑航班"),
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="filters"
          options={{ title: words("Filters", "筛选"), presentation: "modal" }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: words("Your SKYLOG", "我的 SKYLOG"),
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="flight/calendar"
          options={{ title: words("Calendar import", "日历导入") }}
        />
        <Stack.Screen
          name="services"
          options={{
            title: words("Flight data", "航班数据"),
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="passport"
          options={{ title: words("Passport", "飞行护照") }}
        />
        <Stack.Screen
          name="saved"
          options={{ title: words("Saved photographs", "收藏的照片") }}
        />
      </Stack>
    </ThemeProvider>
  );
}
export default function Layout() {
  const [loaded, error] = useFonts(Ionicons.font);
  const [showLaunch, setShowLaunch] = useState(true);
  const [ready, setReady] = useState(false);
  const [locale, setLocale] = useState(() =>
    getLocales()[0]?.languageCode === "zh" ? "zh" : "en",
  );
  const markReady = useCallback((language: string) => {
    setLocale(language);
    setReady(true);
  }, []);
  const finishLaunch = useCallback(() => setShowLaunch(false), []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider preload={false}>
        <View
          style={{ flex: 1 }}
          accessibilityElementsHidden={showLaunch}
          importantForAccessibility={
            showLaunch ? "no-hide-descendants" : "auto"
          }
        >
          {(loaded || error) && (
            <AppProvider onReady={markReady}>
              <Navigation />
            </AppProvider>
          )}
        </View>
      </KeyboardProvider>
      {showLaunch && (
        <LaunchScreen ready={ready} locale={locale} onFinish={finishLaunch} />
      )}
    </GestureHandlerRootView>
  );
}
