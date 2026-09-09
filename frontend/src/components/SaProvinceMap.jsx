import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Annotation } from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { Building2, Mail, MapPin } from "lucide-react";
import { getCentresByProvince, getProvinceCounts, SA_PROVINCES } from "../data/ascCentres";

const GEO_URL = "/geo/sa-provinces.json";

export const PROVINCE_COLORS = {
  "Eastern Cape": "#2563eb",
  "Free State": "#16a34a",
  Gauteng: "#eab308",
  "KwaZulu-Natal": "#06b6d4",
  Limpopo: "#a855f7",
  Mpumalanga: "#f97316",
  "Northern Cape": "#dc2626",
  "North West": "#ec4899",
  "Western Cape": "#14b8a6",
};

/** Fine-tune label placement for readability on the SA map */
const LABEL_OFFSETS = {
  Gauteng: [0, -4],
  "Northern Cape": [-8, 6],
  "Western Cape": [-12, 8],
  "Eastern Cape": [6, 4],
  "KwaZulu-Natal": [4, -2],
  Limpopo: [0, -6],
  Mpumalanga: [4, 0],
  "North West": [-4, 0],
  "Free State": [0, 0],
};

function adjustColor(hex, amount) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getLabelLines(name) {
  if (name === "KwaZulu-Natal") return ["KwaZulu-", "Natal"];
  if (name === "Northern Cape") return ["Northern", "Cape"];
  if (name === "Western Cape") return ["Western", "Cape"];
  if (name === "Eastern Cape") return ["Eastern", "Cape"];
  if (name === "North West") return ["North", "West"];
  if (name === "Free State") return ["Free", "State"];
  return [name];
}

export default function SaProvinceMap({ centres }) {
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [hoveredProvince, setHoveredProvince] = useState(null);

  const counts = useMemo(() => {
    if (centres) {
      return centres.reduce((acc, centre) => {
        acc[centre.province] = (acc[centre.province] || 0) + 1;
        return acc;
      }, {});
    }
    return getProvinceCounts();
  }, [centres]);

  const activeProvince = selectedProvince || hoveredProvince;
  const provinceCentres = useMemo(() => {
    if (!selectedProvince) return [];
    const list = centres || null;
    if (list) return list.filter((c) => c.province === selectedProvince);
    return getCentresByProvince(selectedProvince);
  }, [selectedProvince, centres]);

  const getFill = (provinceName) => {
    const base = PROVINCE_COLORS[provinceName] || "#6b7280";
    if (selectedProvince === provinceName) return adjustColor(base, 40);
    if (hoveredProvince === provinceName) return adjustColor(base, 25);
    return base;
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 card p-4 overflow-hidden">
        <p className="text-sm text-gray-400 mb-3">
          Click a province to view Digititan ASC training centres in that region.
        </p>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [25, -29.5], scale: 1450 }}
          width={560}
          height={520}
          className="w-full h-auto"
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = geo.properties.name;
                const centroid = geoCentroid(geo);
                const [dx = 0, dy = 0] = LABEL_OFFSETS[name] || [0, 0];
                const lines = getLabelLines(name);

                return (
                  <g key={geo.rsmKey}>
                    <Geography
                      geography={geo}
                      onClick={() => setSelectedProvince(name)}
                      onMouseEnter={() => setHoveredProvince(name)}
                      onMouseLeave={() => setHoveredProvince(null)}
                      style={{
                        default: {
                          fill: getFill(name),
                          stroke: selectedProvince === name ? "#ffffff" : "#1f2937",
                          strokeWidth: selectedProvince === name ? 1.2 : 0.6,
                          outline: "none",
                          cursor: "pointer",
                          transition: "fill 0.15s ease",
                        },
                        hover: {
                          fill: getFill(name),
                          stroke: "#ffffff",
                          strokeWidth: 0.9,
                          outline: "none",
                          cursor: "pointer",
                        },
                        pressed: { fill: adjustColor(PROVINCE_COLORS[name] || "#6b7280", 50), outline: "none" },
                      }}
                    />
                    <Annotation
                      subject={centroid}
                      dx={dx}
                      dy={dy}
                      connectorProps={{}}
                    >
                      <text
                        textAnchor="middle"
                        style={{
                          fontSize: lines.length > 1 ? 7 : 8,
                          fontWeight: 700,
                          fill: "#ffffff",
                          pointerEvents: "none",
                          paintOrder: "stroke",
                          stroke: "rgba(0,0,0,0.65)",
                          strokeWidth: 2,
                          strokeLinejoin: "round",
                        }}
                      >
                        {lines.map((line, i) => (
                          <tspan key={line} x={0} dy={i === 0 ? 0 : 9}>
                            {line}
                          </tspan>
                        ))}
                      </text>
                    </Annotation>
                  </g>
                );
              })
            }
          </Geographies>
        </ComposableMap>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SA_PROVINCES.map((province) => (
            <button
              key={province}
              type="button"
              onClick={() => setSelectedProvince(province)}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                selectedProvince === province ? "bg-white/10 ring-1 ring-white/20" : "hover:bg-white/5"
              }`}
            >
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: PROVINCE_COLORS[province] }}
              />
              <span className="text-gray-300">{province}</span>
            </button>
          ))}
        </div>

        {activeProvince && (
          <p className="text-center text-sm text-burnt-600 font-semibold mt-3">
            {activeProvince}
            {counts[activeProvince]
              ? ` — ${counts[activeProvince]} ASC centre${counts[activeProvince] === 1 ? "" : "s"}`
              : " — no centres listed yet"}
          </p>
        )}
      </div>

      <div className="lg:col-span-2 card p-5 flex flex-col min-h-[280px]">
        {selectedProvince ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-4 h-4 rounded-sm flex-shrink-0"
                style={{ backgroundColor: PROVINCE_COLORS[selectedProvince] }}
              />
              <h3 className="text-lg font-bold text-white">{selectedProvince}</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Digititan ASC centres in this province
              {provinceCentres.length > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <span className="text-burnt-300 font-medium">
                    {provinceCentres
                      .reduce((sum, c) => sum + Number(c.people_trained || 0), 0)
                      .toLocaleString()}{" "}
                    trained
                  </span>
                  {" · "}
                  <span className="text-primary-300 font-medium">
                    {provinceCentres
                      .reduce((sum, c) => sum + Number(c.sales_made || 0), 0)
                      .toLocaleString()}{" "}
                    sales
                  </span>
                </>
              )}
            </p>
            {provinceCentres.length > 0 ? (
              <ul className="space-y-3 overflow-y-auto max-h-[420px] pr-1">
                {provinceCentres.map((centre) => (
                  <li key={centre.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: PROVINCE_COLORS[selectedProvince] }}
                      >
                        <Building2 size={16} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm leading-snug">{centre.name}</p>
                        <p className="text-xs text-burnt-300 mt-1.5 font-medium">
                          People trained:{" "}
                          <span className="text-white font-semibold">
                            {Number(centre.people_trained || 0).toLocaleString()}
                          </span>
                        </p>
                        <p className="text-xs text-primary-300 mt-1 font-medium">
                          Sales made:{" "}
                          <span className="text-white font-semibold">
                            {Number(centre.sales_made || 0).toLocaleString()}
                          </span>
                        </p>
                        {(centre.city || centre.address) && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <MapPin size={12} className="flex-shrink-0" />
                            <span>
                              {[centre.city, centre.address].filter(Boolean).join(" — ")}
                            </span>
                          </p>
                        )}
                        {centre.contact && (
                          <a
                            href={`mailto:${centre.contact}`}
                            className="text-xs text-burnt-600 mt-1 inline-flex items-center gap-1 hover:underline"
                          >
                            <Mail size={12} />
                            {centre.contact}
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">
                No ASC centres are listed for this province yet. Contact Digititan to partner in this region.
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
            <MapPin size={32} className="text-burnt-600 mb-3 opacity-80" />
            <p className="text-white font-semibold mb-1">Select a province</p>
            <p className="text-sm text-gray-400">
              Click any province on the map to see all Digititan ASC training centres in that area.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
