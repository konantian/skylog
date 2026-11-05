import { DurableObject } from "cloudflare:workers";
import { FlightCache, validateQuery } from "./service.mjs";
export class FlightService extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.service = new FlightCache(ctx.storage, env.AVIATIONSTACK_KEY);
  }
  query(input) {
    return this.service.query(input);
  }
  usage() {
    return this.service.usage();
  }
}
export default {
  async fetch(request, env) {
    const reply = (data, status = 200) =>
      Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
    // Internal app token is separately revocable; the provider key never ships to the client.
    if (
      !env.APP_TOKEN ||
      request.headers.get("Authorization") !== `Bearer ${env.APP_TOKEN}`
    )
      return reply({ error: "unauthorized" }, 401);
    const path = new URL(request.url).pathname;
    try {
      const service = env.FLIGHTS.getByName("yuan-skylog");
      if (path === "/usage" && request.method === "GET")
        return reply(await service.usage());
      if (path !== "/flight" || request.method !== "POST")
        return reply({ error: "not_found" }, 404);
      if (Number(request.headers.get("Content-Length")) > 2048)
        return reply({ error: "invalid_query" }, 400);
      const text = await request.text();
      if (text.length > 2048) return reply({ error: "invalid_query" }, 400);
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        return reply({ error: "invalid_query" }, 400);
      }
      const input = validateQuery(body);
      if (!input) return reply({ error: "invalid_query" }, 400);
      return reply(await service.query(input));
    } catch {
      return reply({ error: "unavailable" }, 503);
    }
  },
};
