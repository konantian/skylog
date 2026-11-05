import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { providerUsage, flightServiceConfigured } from "../lib/aviationstack";
import { useApp } from "../lib/store";
import { Page, Section, Txt, Button, Card } from "../components/ui";
export default function FlightServices() {
  const { words, colors } = useApp();
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(
      null,
    ),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void providerUsage()
      .then((value) => {
        if (active) setUsage(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <Page>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          variant="done"
          tintColor={colors.accent}
          onPress={() => router.back()}
        >
          {words("Done", "完成")}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Section
        title={words("Flight data", "航班数据")}
        caption="SKYLOG · AVIATIONSTACK"
      />
      <Card>
        <Txt>
          {flightServiceConfigured
            ? words("Ready to use", "已连接，直接使用")
            : words("Unavailable in this build", "此构建暂未连接")}
        </Txt>
        <Txt muted>
          {words(
            "No API key is needed in the app. Your flight-data key stays on your private service.",
            "App 无需输入 API 密钥，航班数据密钥保存在你的后端服务。",
          )}
        </Txt>
      </Card>
      <Section
        title={usage ? `${usage.used} / ${usage.limit}` : "—"}
        caption={words(
          "SKYLOG QUERIES · LAST 31 DAYS",
          "SKYLOG 查询 · 最近 31 天",
        )}
      />
      {error && (
        <Txt>
          {words(
            "Usage is temporarily unavailable. Offline records still work.",
            "暂时无法读取用量，离线记录仍可使用。",
          )}
        </Txt>
      )}
      <Button
        secondary
        disabled={busy}
        title={words("Refresh usage", "刷新用量")}
        onPress={() => {
          setBusy(true);
          void providerUsage()
            .then((v) => {
              setUsage(v);
              setError(false);
            })
            .catch(() => setError(true))
            .finally(() => setBusy(false));
        }}
      />
      <Txt muted>
        {words(
          "Your 100/month provider account is shared with the runway tool. SKYLOG reserves up to 80 queries per rolling 31 days across all its app installations. Repeated checks use a one-hour server cache. Other tools' requests are separate.",
          "服务商账户每月 100 次，与跑道工具共用。SKYLOG 所有 App 安装共用滚动 31 天最多 80 次查询，重复查询使用一小时后端缓存。其他工具的请求另行计数。",
        )}
      </Txt>
      <Txt muted>
        {words(
          "Status checks run when requested near upcoming flights. Historical flight lookup, predictions and background change alerts need additional services.",
          "仅在即将乘坐的航班附近按需核对状态。历史航班查询、延误预测和后台变化通知仍需额外服务。",
        )}
      </Txt>
    </Page>
  );
}
