import Svg, { Path, Circle, G } from "react-native-svg";
import { useState } from "react";
import { View } from "react-native";
import land from "../../../../data/world-land.json";
import {
  collectRoutes,
  routePath,
  projectAirport,
} from "../../../../lib/insights.mjs";
import { airports, type LocalFlight } from "../lib/catalog";
import { useApp } from "../lib/store";
import { visitedMapRegions } from "../lib/map-regions.mjs";
import { Button, Txt, styles } from "./ui";
export function RouteMap({
  flights,
  position,
}: {
  flights: LocalFlight[];
  position?: { latitude: number; longitude: number; track: number | null };
}) {
  const { colors, words } = useApp();
  const [region, setRegion] = useState("world");
  const data = airports as Record<
    string,
    { latitude: number; longitude: number; city: string; country: string }
  >;
  const routes = collectRoutes(flights);
  const visited = [
    ...new Set(flights.flatMap((f) => [f.origin, f.destination])),
  ];
  const regions = visitedMapRegions(flights, data);
  const activeRegion = regions.find((view) => view.id === region) || regions[0];
  const offset = activeRegion.id === "europe" ? 450 : 0;
  return (
    <View style={{ gap: 14 }}>
      <View style={[styles.row, { flexWrap: "wrap", gap: 8 }]}>
        {regions.map(({ id, en, zh }) => (
          <Button
            key={id}
            title={words(en, zh)}
            secondary={id !== activeRegion.id}
            onPress={() => setRegion(id)}
            style={{ paddingHorizontal: 12 }}
          />
        ))}
      </View>
      <Svg
        width="100%"
        height={230}
        viewBox={activeRegion.box}
        accessibilityLabel={words(
          `Flight map: ${routes.length} routes`,
          `航线地图：${routes.length} 条航线`,
        )}
      >
        <G fill={colors.line}>
          <Path d={land.path} transform="translate(-450 0)" />
          <Path d={land.path} transform="translate(450 0)" />
        </G>
        {routes.map((r) => {
          const a = data[r.airports[0]],
            b = data[r.airports[1]];
          return a && b ? (
            <Path
              key={r.key}
              d={routePath(a, b, offset)}
              stroke={colors.accent}
              strokeWidth={1.5}
              opacity={0.7}
              fill="none"
            />
          ) : null;
        })}
        {position &&
          (() => {
            const [x, y] = projectAirport(position, offset);
            return (
              <G
                transform={`translate(${x} ${y}) rotate(${position.track || 0})`}
              >
                <Circle r={7} fill={colors.bg} />
                <Path
                  d="M0 -8 L2 -1 L8 3 L8 5 L2 3 L2 7 L0 6 L-2 7 L-2 3 L-8 5 L-8 3 L-2 -1 Z"
                  fill={colors.accent}
                />
              </G>
            );
          })()}
        {visited.map((code) => {
          const a = data[code];
          if (!a) return null;
          const [x, y] = projectAirport(a, offset);
          return <Circle key={code} cx={x} cy={y} r={3} fill={colors.accent} />;
        })}
      </Svg>
      <Txt muted style={{ fontSize: 11, lineHeight: 17 }}>
        {words(
          "Illustrative great-circle routes · OurAirports / Natural Earth",
          "大圆航线示意 · OurAirports / Natural Earth",
        )}
      </Txt>
    </View>
  );
}
