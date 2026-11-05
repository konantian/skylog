import { Alert, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useApp } from "../../lib/store";
import { photos } from "../../lib/catalog";
import { Page, Txt, Card, Button, Empty, Section } from "../../components/ui";
import { FlightLiveData } from "../../components/flight-live-data";
import { FlightTools } from "../../components/flight-tools";
import { RouteMap } from "../../components/route-map";
import { FlightCard } from "../../screens/flights";
import { PhotoCard } from "../../screens/collection";
export default function FlightDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { words, flights, remove } = useApp();
  const flight = flights.find((f) => f.id === id);
  if (!flight)
    return (
      <Page>
        <Empty title={words("Record not found", "未找到记录")} />
      </Page>
    );
  const matches =
    flight.status === "completed" && flight.registration
      ? photos.filter(
          (p) =>
            p.registration?.status === "confirmed" &&
            p.registration.value === flight.registration &&
            p.airlines.includes(flight.airline),
        )
      : [];
  return (
    <Page>
      <Stack.Screen options={{ title: flight.flight }} />
      <View pointerEvents="none">
        <FlightCard flight={flight} />
      </View>
      <RouteMap flights={[flight]} />
      <Card>
        <Section title={words("Travel details", "旅途详情")} />
        {[
          [words("Trip", "旅程"), flight.trip],
          [words("Booking reference", "预订编号"), flight.bookingReference],
          [
            words("Seat", "座位"),
            [flight.seat, flight.seatPosition, flight.cabin]
              .filter(Boolean)
              .join(" · "),
          ],
          [words("Departure · local", "出发 · 当地时间"), flight.departureTime],
          [
            words("Arrival · local", "到达 · 当地时间"),
            [flight.arrivalDate, flight.arrivalTime].filter(Boolean).join(" "),
          ],
          [
            words("Actual duration", "实际时长"),
            flight.durationMinutes != null
              ? `${flight.durationMinutes} min`
              : null,
          ],
          [
            words("Arrival delay", "到达延误"),
            flight.delayMinutes != null ? `${flight.delayMinutes} min` : null,
          ],
          [
            words("Departure terminal / gate", "出发航站楼／登机口"),
            [flight.departureTerminal, flight.departureGate]
              .filter(Boolean)
              .join(" / "),
          ],
          [
            words("Arrival terminal / gate", "到达航站楼／登机口"),
            [flight.arrivalTerminal, flight.arrivalGate]
              .filter(Boolean)
              .join(" / "),
          ],
          [words("Baggage belt", "行李转盘"), flight.baggage],
          [words("Aircraft built", "飞机制造年份"), flight.aircraftYear],
        ]
          .filter(([, value]) => value != null && value !== "")
          .map(([label, value]) => (
            <View key={String(label)} style={{ gap: 4 }}>
              <Txt muted style={{ fontSize: 12 }}>
                {label}
              </Txt>
              <Txt>{value}</Txt>
            </View>
          ))}
        <Txt muted style={{ fontSize: 12 }}>
          {words(
            "Saved or imported details. Check dated provider observations separately.",
            "已保存或导入的旅途信息，数据源观测及其更新时间单独显示。",
          )}
        </Txt>
      </Card>
      {flight.notes && (
        <Card>
          <Txt muted>{words("Private notes", "私人备注")}</Txt>
          <Txt>{flight.notes}</Txt>
        </Card>
      )}
      <Button
        title={words("Edit flight", "编辑航班")}
        icon="create-outline"
        onPress={() =>
          router.push({ pathname: "/flight/edit", params: { id: flight.id } })
        }
      />
      <FlightLiveData
        key={`${flight.id}:${flight.registration}:${flight.date}:${flight.flight}`}
        flight={flight}
      />
      <FlightTools flight={flight} />
      {matches.length > 0 && (
        <>
          <Section title={words("Flown & photographed", "坐过，也拍过")} />
          {matches.map((p) => (
            <PhotoCard key={p.id} photo={p} />
          ))}
        </>
      )}
      <Txt muted>
        {words(
          "This record is stored locally, separate from the public website.",
          "这条记录保存在本机，与公开网站的数据分开。",
        )}
      </Txt>
      <Button
        secondary
        title={words("Delete record", "删除记录")}
        icon="trash-outline"
        onPress={() =>
          Alert.alert(
            words("Delete this flight?", "删除这段航班？"),
            words(
              "Export a backup in Settings if you want to keep a copy.",
              "如果需要保留副本，可以先在设置中导出备份。",
            ),
            [
              { text: words("Cancel", "取消"), style: "cancel" },
              {
                text: words("Delete", "删除"),
                style: "destructive",
                onPress: () => {
                  void remove(flight.id)
                    .then(() => router.back())
                    .catch((e) =>
                      Alert.alert(
                        words("Could not delete", "删除失败"),
                        String(e),
                      ),
                    );
                },
              },
            ],
          )
        }
      />
    </Page>
  );
}
