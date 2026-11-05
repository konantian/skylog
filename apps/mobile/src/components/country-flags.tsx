import { View } from "react-native";
import { SvgXml } from "react-native-svg";
import countries from "../../../../data/country-flags.json";
import flags from "../generated/flags.json";

export function CountryFlags({
  country,
  size = 24,
}: {
  country?: string;
  size?: number;
}) {
  const code = country?.toLowerCase() || "";
  const codes =
    (countries as Record<string, string[]>)[country || ""] ||
    (Object.hasOwn(flags, code) ? [code] : []);
  if (!codes.length) return null;
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: size > 32 ? 8 : 4,
        flexShrink: 0,
      }}
    >
      {codes.map((code) => (
        <View
          key={code}
          style={{
            width: size,
            height: size * 0.75,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <SvgXml
            xml={(flags as Record<string, string>)[code]}
            width={size}
            height={size * 0.75}
          />
        </View>
      ))}
    </View>
  );
}
