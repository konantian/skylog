import { Tabs, router } from "expo-router";
import { useApp } from "../../lib/store";
import { Icon, IconButton } from "../../components/ui";
export default function TabLayout() {
  const { colors, words } = useApp();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11 },
        headerRight: () => (
          <IconButton
            name="options-outline"
            label={words("Settings", "设置")}
            onPress={() => router.push("/settings")}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "SKYLOG",
          tabBarLabel: words("Home", "首页"),
          tabBarIcon: ({ color }) => (
            <Icon name="compass-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="aircraft"
        options={{
          title: words("Aircraft", "机型"),
          tabBarIcon: ({ color }) => (
            <Icon name="airplane-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="airlines"
        options={{
          title: words("Airlines", "航司"),
          tabBarIcon: ({ color }) => (
            <Icon name="globe-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="photos"
        options={{
          title: words("Photos", "照片"),
          tabBarIcon: ({ color }) => (
            <Icon name="images-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="flights"
        options={{
          title: words("Flights", "航程"),
          tabBarIcon: ({ color }) => (
            <Icon name="ticket-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
