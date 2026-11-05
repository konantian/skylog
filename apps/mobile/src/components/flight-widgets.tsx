import { HStack, VStack, Text, Image, Spacer } from "@expo/ui/swift-ui";
import {
  font,
  foregroundStyle,
  padding,
  widgetURL,
} from "@expo/ui/swift-ui/modifiers";
import {
  createLiveActivity,
  createWidget,
  type LiveActivityEnvironment,
} from "expo-widgets";

export type FlightWidgetProps = {
  id: string;
  flight: string;
  origin: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  gate: string;
  departure: number;
  generatedAt: number;
  zh: boolean;
};

export const FlightActivity = createLiveActivity(
  "SkylogFlight",
  (p: FlightWidgetProps, env: LiveActivityEnvironment) => {
    "widget";
    const accent = env.isLuminanceReduced ? "#ffffff" : "#9cd9ff";
    const label = env.isStale
      ? p.zh
        ? "请打开 App 核对"
        : "Open app to check"
      : p.zh
        ? "计划出发 · 已保存航程"
        : "Scheduled · saved itinerary";
    const countdown =
      p.departure && !env.isStale ? (
        <Text
          timerInterval={{
            lower: new Date(p.generatedAt),
            upper: new Date(p.departure),
          }}
          countsDown
          modifiers={[font({ weight: "semibold" })]}
        />
      ) : (
        <Text>{p.departureTime || "—"}</Text>
      );
    return {
      banner: (
        <VStack spacing={8} modifiers={[padding({ all: 16 })]}>
          <HStack>
            <Text
              modifiers={[
                font({ size: 14, weight: "bold" }),
                foregroundStyle(accent),
              ]}
            >
              {p.flight || "SKYLOG"}
            </Text>
            <Spacer />
            <Text modifiers={[font({ size: 12 })]}>{label}</Text>
          </HStack>
          <HStack>
            <VStack alignment="leading">
              <Text modifiers={[font({ size: 28, weight: "bold" })]}>
                {p.origin}
              </Text>
              <Text>{p.departureTime || "—"}</Text>
            </VStack>
            <Spacer />
            <Image systemName="airplane" color={accent} />
            <Spacer />
            <VStack alignment="trailing">
              <Text modifiers={[font({ size: 28, weight: "bold" })]}>
                {p.destination}
              </Text>
              <Text>{p.arrivalTime || "—"}</Text>
            </VStack>
          </HStack>
          <HStack>
            <Text>
              {p.zh ? "登机口 " : "Gate "}
              {p.gate || "—"}
            </Text>
            <Spacer />
            {countdown}
          </HStack>
        </VStack>
      ),
      compactLeading: <Image systemName="airplane" color={accent} />,
      compactTrailing: countdown,
      minimal: <Image systemName="airplane" color={accent} />,
      expandedLeading: (
        <VStack>
          <Text>{p.flight}</Text>
          <Text modifiers={[font({ size: 25, weight: "bold" })]}>
            {p.origin}
          </Text>
        </VStack>
      ),
      expandedTrailing: (
        <VStack>
          <Text>{p.departureTime}</Text>
          <Text modifiers={[font({ size: 25, weight: "bold" })]}>
            {p.destination}
          </Text>
        </VStack>
      ),
      expandedBottom: (
        <VStack spacing={4}>
          <Text>{label}</Text>
          <HStack>
            <Text>
              {p.zh ? "登机口 " : "Gate "}
              {p.gate || "—"}
            </Text>
            <Spacer />
            {countdown}
          </HStack>
        </VStack>
      ),
    };
  },
);

export const NextFlightWidget = createWidget(
  "SkylogNextFlight",
  (p: FlightWidgetProps) => {
    "widget";
    return (
      <VStack
        alignment="leading"
        spacing={8}
        modifiers={[
          padding({ all: 12 }),
          widgetURL(
            p.id
              ? `skylog://flight/${encodeURIComponent(p.id)}`
              : "skylog://flights",
          ),
        ]}
      >
        <HStack>
          <Image systemName="airplane" />
          <Text modifiers={[font({ size: 12, weight: "bold" })]}>SKYLOG</Text>
        </HStack>
        <Text modifiers={[font({ size: 22, weight: "bold" })]}>
          {p.id
            ? `${p.origin} → ${p.destination}`
            : p.zh
              ? "下一段旅程"
              : "Your next journey"}
        </Text>
        <Text>{p.flight || (p.zh ? "添加航班" : "Add a flight")}</Text>
        <Text modifiers={[font({ size: 12 })]}>
          {p.id ? `${p.date} ${p.departureTime}` : ""}
        </Text>
        <Text modifiers={[font({ size: 11 })]}>
          {p.zh
            ? "已保存航程 · 非实时状态"
            : "Saved itinerary · not live status"}
        </Text>
      </VStack>
    );
  },
);
