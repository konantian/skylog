import { View } from "react-native";
import { Image } from "expo-image";
import countries from "../../../../data/country-flags.json";
import flags from "../generated/flags";

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
        <Image
          key={code}
          source={flags[code]}
          style={{ width: size, height: size * 0.75, borderRadius: 2 }}
          contentFit="contain"
        />
      ))}
    </View>
  );
}
