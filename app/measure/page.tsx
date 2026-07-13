"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type ZoneKey = "lawn" | "driveway" | "pest" | "fence";

type ZoneMeta = {
  label: string;
  kind: "area" | "linear";
  color: string;
};

const ZONES: Record<ZoneKey, ZoneMeta> = {
  lawn: { label: "Lawn", kind: "area", color: "#34a853" },
  driveway: { label: "Driveway", kind: "area", color: "#7c8794" },
  pest: { label: "Pest / Lot", kind: "area", color: "#f9ab00" },
  fence: { label: "Fence", kind: "linear", color: "#ea4335" },
};

const ZONE_ORDER: ZoneKey[] = ["lawn", "driveway", "pest", "fence"];

const SQM_TO_SQFT = 10.7639104167;
const M_TO_FT = 3.280839895;

type Shape = {
  id: number;
  zone: ZoneKey;
  value: number; // sq ft for area zones, linear ft for fence
};

// Ensure the Maps loader is only configured once (guards React strict-mode
// double-invocation of the init effect).
let optionsConfigured = false;

export default function MeasurePage() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);

  const mapObj = useRef<google.maps.Map | null>(null);
  const overlays = useRef<
    Map<number, google.maps.Polygon | google.maps.Polyline>
  >(new Map());
  const idCounter = useRef(0);

  // In-progress drawing state (kept in refs so once-bound listeners stay fresh).
  const drawPoints = useRef<google.maps.LatLng[]>([]);
  const tempOverlay = useRef<google.maps.Polygon | google.maps.Polyline | null>(
    null,
  );
  const activeZoneRef = useRef<ZoneKey | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(
    apiKey ? null : "Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.",
  );
  const [activeZone, setActiveZone] = useState<ZoneKey | null>(null);
  const [pointCount, setPointCount] = useState(0);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [address, setAddress] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    activeZoneRef.current = activeZone;
  }, [activeZone]);

  const measureOverlay = useCallback(
    (zone: ZoneKey, overlay: google.maps.Polygon | google.maps.Polyline) => {
      const path = overlay.getPath();
      if (ZONES[zone].kind === "linear") {
        return google.maps.geometry.spherical.computeLength(path) * M_TO_FT;
      }
      return google.maps.geometry.spherical.computeArea(path) * SQM_TO_SQFT;
    },
    [],
  );

  const recompute = useCallback(
    (id: number) => {
      const overlay = overlays.current.get(id);
      if (!overlay) return;
      setShapes((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, value: measureOverlay(s.zone, overlay) } : s,
        ),
      );
    },
    [measureOverlay],
  );

  const removeShape = useCallback((id: number) => {
    overlays.current.get(id)?.setMap(null);
    overlays.current.delete(id);
    setShapes((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    overlays.current.forEach((o) => o.setMap(null));
    overlays.current.clear();
    setShapes([]);
  }, []);

  const clearTemp = useCallback(() => {
    tempOverlay.current?.setMap(null);
    tempOverlay.current = null;
    drawPoints.current = [];
    setPointCount(0);
  }, []);

  // Redraw the preview overlay as the user clicks points.
  const redrawTemp = useCallback(() => {
    const zone = activeZoneRef.current;
    const map = mapObj.current;
    if (!zone || !map) return;
    const meta = ZONES[zone];
    const pts = drawPoints.current;

    tempOverlay.current?.setMap(null);
    tempOverlay.current = null;

    if (meta.kind === "area" && pts.length >= 3) {
      tempOverlay.current = new google.maps.Polygon({
        paths: pts,
        strokeColor: meta.color,
        strokeWeight: 2,
        fillColor: meta.color,
        fillOpacity: 0.3,
        map,
        clickable: false,
      });
    } else if (pts.length >= 2) {
      tempOverlay.current = new google.maps.Polyline({
        path: pts,
        strokeColor: meta.color,
        strokeWeight: meta.kind === "linear" ? 4 : 2,
        map,
        clickable: false,
      });
    }
  }, []);

  const finishShape = useCallback(() => {
    const zone = activeZoneRef.current;
    const map = mapObj.current;
    if (!zone || !map) return;
    const meta = ZONES[zone];

    // Drop near-duplicate consecutive points (e.g. from a finishing double-click).
    const pts = drawPoints.current.filter(
      (p, i, arr) =>
        i === 0 ||
        google.maps.geometry.spherical.computeDistanceBetween(p, arr[i - 1]) >
          0.5,
    );

    const minPts = meta.kind === "linear" ? 2 : 3;
    if (pts.length < minPts) return;

    clearTemp();

    const id = ++idCounter.current;
    const overlay: google.maps.Polygon | google.maps.Polyline =
      meta.kind === "linear"
        ? new google.maps.Polyline({
            path: pts,
            strokeColor: meta.color,
            strokeWeight: 4,
            editable: true,
            map,
          })
        : new google.maps.Polygon({
            paths: pts,
            strokeColor: meta.color,
            strokeWeight: 2,
            fillColor: meta.color,
            fillOpacity: 0.3,
            editable: true,
            map,
          });

    overlays.current.set(id, overlay);
    setShapes((prev) => [...prev, { id, zone, value: measureOverlay(zone, overlay) }]);

    // Live-update the measurement when the user drags a vertex.
    const path = overlay.getPath();
    ["set_at", "insert_at", "remove_at"].forEach((evt) =>
      google.maps.event.addListener(path, evt, () => recompute(id)),
    );

    setActiveZone(null);
  }, [clearTemp, measureOverlay, recompute]);

  const cancelDrawing = useCallback(() => {
    clearTemp();
    setActiveZone(null);
  }, [clearTemp]);

  const selectZone = useCallback(
    (zone: ZoneKey) => {
      clearTemp();
      setActiveZone((prev) => (prev === zone ? null : zone));
    },
    [clearTemp],
  );

  // Initialize the map, search box, and Maps libraries once.
  useEffect(() => {
    if (!apiKey) return;

    let cancelled = false;
    if (!optionsConfigured) {
      setOptions({ key: apiKey, v: "weekly" });
      optionsConfigured = true;
    }

    (async () => {
      try {
        await importLibrary("maps");
        await importLibrary("geometry");
        await importLibrary("places");
        if (cancelled || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 39.8283, lng: -98.5795 }, // Center of the US
          zoom: 5,
          mapTypeId: "hybrid",
          tilt: 0,
          disableDoubleClickZoom: true,
          streetViewControl: false,
          fullscreenControl: false,
          rotateControl: false,
          mapTypeControl: true,
          mapTypeControlOptions: {
            mapTypeIds: ["hybrid", "satellite", "roadmap"],
          },
        });
        mapObj.current = map;

        // Places search (new PlaceAutocompleteElement; classic Autocomplete is
        // not available to new API projects).
        if (searchRef.current) {
          searchRef.current.replaceChildren();
          const pac = new google.maps.places.PlaceAutocompleteElement();
          pac.style.width = "100%";
          searchRef.current.appendChild(pac);

          pac.addEventListener("gmp-select", async (event: Event) => {
            const e = event as google.maps.places.PlacePredictionSelectEvent;
            const place = e.placePrediction.toPlace();
            await place.fetchFields({
              fields: ["location", "formattedAddress", "viewport"],
            });
            if (!place.location) return;
            if (place.viewport) {
              map.fitBounds(place.viewport);
            } else {
              map.setCenter(place.location);
            }
            map.setZoom(20);
            setAddress(place.formattedAddress ?? "");
          });
        }

        if (!cancelled) setReady(true);
      } catch (err) {
        console.error(err);
        if (!cancelled)
          setLoadError(
            "Could not load Google Maps. Confirm the API key is valid and that the Maps JavaScript API, Places API (New), and Geometry library are enabled.",
          );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  // Bind map click/double-click while a zone is armed for drawing.
  useEffect(() => {
    const map = mapObj.current;
    if (!ready || !map || !activeZone) return;

    const onClick = map.addListener(
      "click",
      (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        drawPoints.current.push(e.latLng);
        setPointCount(drawPoints.current.length);
        redrawTemp();
      },
    );
    const onDblClick = map.addListener("dblclick", () => finishShape());

    return () => {
      onClick.remove();
      onDblClick.remove();
    };
  }, [ready, activeZone, redrawTemp, finishShape]);

  // Finish on Enter, cancel on Escape while drawing.
  useEffect(() => {
    if (!activeZone) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") finishShape();
      if (e.key === "Escape") cancelDrawing();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeZone, finishShape, cancelDrawing]);

  const totals = ZONE_ORDER.map((zone) => {
    const items = shapes.filter((s) => s.zone === zone);
    return {
      zone,
      count: items.length,
      total: items.reduce((sum, s) => sum + s.value, 0),
    };
  }).filter((t) => t.count > 0);

  const buildReportLines = useCallback(() => {
    const lines: string[] = [];
    if (address) lines.push(`Property: ${address}`);
    ZONE_ORDER.forEach((zone) => {
      const items = shapes.filter((s) => s.zone === zone);
      if (items.length === 0) return;
      const meta = ZONES[zone];
      const unit = meta.kind === "linear" ? "linear ft" : "sq ft";
      const total = items.reduce((sum, s) => sum + s.value, 0);
      lines.push(`${meta.label}: ${Math.round(total).toLocaleString()} ${unit}`);
      if (items.length > 1) {
        items.forEach((s, i) =>
          lines.push(
            `  - Zone ${i + 1}: ${Math.round(s.value).toLocaleString()} ${unit}`,
          ),
        );
      }
    });
    return lines;
  }, [shapes, address]);

  const copyResults = useCallback(async () => {
    const text = ["Sky Ruler — Measurement Summary", "", ...buildReportLines()]
      .join("\n")
      .trim();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access may be blocked; fail silently.
    }
  }, [buildReportLines]);

  const generateReport = useCallback(() => {
    const rows = ZONE_ORDER.map((zone) => {
      const items = shapes.filter((s) => s.zone === zone);
      if (items.length === 0) return "";
      const meta = ZONES[zone];
      const unit = meta.kind === "linear" ? "linear ft" : "sq ft";
      const total = items.reduce((sum, s) => sum + s.value, 0);
      return `<tr>
        <td><span class="dot" style="background:${meta.color}"></span>${meta.label}</td>
        <td>${items.length}</td>
        <td class="num">${Math.round(total).toLocaleString()} ${unit}</td>
      </tr>`;
    }).join("");

    const win = window.open("", "_blank", "width=820,height=900");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8" />
      <title>Sky Ruler Measurement Report</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Inter,Arial,sans-serif;color:#0f1a2a;margin:40px}
        h1{font-size:24px;margin:0 0 4px}
        .brand{color:#1a6fc4}
        .meta{color:#5b6b7f;margin:0 0 24px;font-size:14px}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th,td{text-align:left;padding:12px 10px;border-bottom:1px solid #e6ebf1;font-size:15px}
        th{color:#5b6b7f;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
        .num{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
        .dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;vertical-align:middle}
        .foot{margin-top:28px;color:#93a1b0;font-size:12px}
      </style></head><body>
      <h1><span class="brand">Sky Ruler</span> Measurement Report</h1>
      <p class="meta">${address || "Address not specified"}</p>
      <table>
        <thead><tr><th>Zone</th><th>Areas</th><th>Total</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3">No measurements yet.</td></tr>'}</tbody>
      </table>
      <p class="foot">Generated with Sky Ruler &middot; Measurements are estimates from aerial imagery.</p>
      <script>window.onload=function(){window.print()}<\/script>
      </body></html>`);
    win.document.close();
  }, [shapes, address]);

  const hasResults = shapes.length > 0;
  const minPts = activeZone && ZONES[activeZone].kind === "linear" ? 2 : 3;
  const canFinish = pointCount >= minPts;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/logo.png"
            alt="Sky Ruler"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="font-heading text-lg font-bold text-ink">
            Sky Ruler
          </span>
        </Link>
        <div ref={searchRef} className="w-full max-w-md" />
        <Link
          href="/"
          className="ml-auto hidden text-sm font-medium text-muted hover:text-ink sm:block"
        >
          ← Home
        </Link>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="relative flex-1">
          <div ref={mapRef} className="h-full w-full bg-slate-200" />

          {!ready && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 text-sm text-muted">
              Loading satellite map…
            </div>
          )}
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {loadError}
              </div>
            </div>
          )}

          {ready && (
            <div className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-2 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
              {ZONE_ORDER.map((zone) => {
                const meta = ZONES[zone];
                const isActive = activeZone === zone;
                return (
                  <button
                    key={zone}
                    onClick={() => selectZone(zone)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-brand text-white"
                        : "text-ink hover:bg-slate-100"
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: meta.color }}
                    />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          )}

          {ready && activeZone && (
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink/90 py-2 pl-4 pr-2 text-xs font-medium text-white shadow-lg">
              <span>
                {ZONES[activeZone].kind === "linear"
                  ? "Click along the fence line"
                  : `Click the corners of the ${ZONES[activeZone].label.toLowerCase()}`}
                {pointCount > 0 ? ` · ${pointCount} point${pointCount === 1 ? "" : "s"}` : ""}
              </span>
              <button
                onClick={finishShape}
                disabled={!canFinish}
                className="rounded-full bg-brand px-3 py-1 font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-40"
              >
                Finish
              </button>
              <button
                onClick={cancelDrawing}
                className="rounded-full bg-white/15 px-3 py-1 font-semibold text-white transition-colors hover:bg-white/25"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-heading text-lg font-bold text-ink">Results</h2>
            <p className="mt-0.5 text-xs text-muted">
              {address || "Search an address, then trace a zone."}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {!hasResults && (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-muted">
                Pick a zone above and trace it on the map to see measurements
                here.
              </div>
            )}

            <div className="space-y-5">
              {totals.map(({ zone, count, total }) => {
                const meta = ZONES[zone];
                const unit = meta.kind === "linear" ? "linear ft" : "sq ft";
                const items = shapes.filter((s) => s.zone === zone);
                return (
                  <div key={zone}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ background: meta.color }}
                        />
                        <span className="font-heading text-sm font-semibold text-ink">
                          {meta.label}
                        </span>
                        <span className="text-xs text-muted">({count})</span>
                      </div>
                      <span className="font-heading text-base font-bold text-ink tabular-nums">
                        {Math.round(total).toLocaleString()}
                        <span className="ml-1 text-xs font-normal text-muted">
                          {unit}
                        </span>
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {items.map((s, i) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-muted"
                        >
                          <span>
                            Zone {i + 1}:{" "}
                            <span className="font-medium text-ink tabular-nums">
                              {Math.round(s.value).toLocaleString()} {unit}
                            </span>
                          </span>
                          <button
                            onClick={() => removeShape(s.id)}
                            className="text-slate-400 transition-colors hover:text-red-500"
                            aria-label="Remove measurement"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {hasResults && (
              <button
                onClick={clearAll}
                className="mt-6 text-xs font-medium text-slate-400 hover:text-red-500"
              >
                Clear all measurements
              </button>
            )}
          </div>

          <div className="space-y-2 border-t border-slate-100 px-5 py-4">
            <button
              onClick={copyResults}
              disabled={!hasResults}
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied ? "Copied!" : "Copy Results"}
            </button>
            <button
              onClick={generateReport}
              disabled={!hasResults}
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              Generate Report
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
