import assert from "node:assert/strict";
import test from "node:test";

import { loadYearHolidays, type HolidayFetcher } from "./load-year-holidays.ts";

const jsonResponse = (body: unknown, init: ResponseInit = {}) => {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
};

test("successful API response returns normalized merged holidays and expected source", async () => {
  const fetcher: HolidayFetcher = async () =>
    jsonResponse([
      {
        date: "2026-01-01",
        name: "Tahun Baru dari API",
      },
      {
        date: "2026-02-16",
        name: "Cuti Bersama Tahun Baru Imlek",
      },
    ]);

  const result = await loadYearHolidays(2026, { fetcher });

  assert.equal(result.source, "mixed");
  assert.ok(result.holidays.some((holiday) => holiday.date === "2026-12-25"));
  assert.deepEqual(
    result.holidays.find((holiday) => holiday.date === "2026-01-01"),
    {
      date: "2026-01-01",
      name: "Tahun Baru dari API",
      isCollectiveLeave: false,
      source: "api",
    }
  );
  assert.deepEqual(
    result.holidays.find((holiday) => holiday.date === "2026-02-16"),
    {
      date: "2026-02-16",
      name: "Cuti Bersama Tahun Baru Imlek",
      isCollectiveLeave: true,
      source: "api",
    }
  );
});

test("empty API response falls back to local holidays with source local", async () => {
  const fetcher: HolidayFetcher = async () => jsonResponse([]);

  const result = await loadYearHolidays(2026, { fetcher });

  assert.equal(result.source, "local");
  assert.ok(result.holidays.length > 0);
  assert.ok(result.holidays.every((holiday) => holiday.date.startsWith("2026")));
});

test("non-OK response falls back to local holidays with source local", async () => {
  const fetcher: HolidayFetcher = async () =>
    jsonResponse({ error: "unavailable" }, { status: 503 });

  const result = await loadYearHolidays(2026, { fetcher });

  assert.equal(result.source, "local");
  assert.ok(result.holidays.length > 0);
});

test("rejected fetch falls back to local holidays with source local", async () => {
  const fetcher: HolidayFetcher = async () => {
    throw new Error("network unavailable");
  };

  const result = await loadYearHolidays(2026, { fetcher });

  assert.equal(result.source, "local");
  assert.ok(result.holidays.length > 0);
});

test("fetcher receives the expected URL and abort signal", async () => {
  const controller = new AbortController();
  let receivedInput = "";
  let receivedSignal: AbortSignal | undefined;
  const fetcher: HolidayFetcher = async (input, init) => {
    receivedInput = input;
    receivedSignal = init?.signal;

    return jsonResponse([]);
  };

  await loadYearHolidays(2026, {
    fetcher,
    signal: controller.signal,
  });

  assert.equal(receivedInput, "https://libur.deno.dev/api?year=2026");
  assert.equal(receivedSignal, controller.signal);
});
