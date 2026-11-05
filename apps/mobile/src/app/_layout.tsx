import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "../lib/store";
import { useFonts } from "expo-font";
import Ionicons from "@expo/vector-icons/Ionicons";
export { ErrorBoundary } from "expo-router";
export const unstable_settings = { initialRouteName: "(tabs)" };
function Navigation() {
  const { colors, isDark, words } = useApp();
  return (
    <>
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
          options={{ title: words("Photograph", "摄影作品") }}
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
        <Stack.Screen name="passport" options={{ title: "Passport" }} />
        <Stack.Screen
          name="saved"
          options={{ title: words("Saved photographs", "收藏的照片") }}
        />
      </Stack>
    </>
  );
}
export default function Layout() {
  const [loaded, error] = useFonts(Ionicons.font);
  if (!loaded && !error) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <Navigation />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
