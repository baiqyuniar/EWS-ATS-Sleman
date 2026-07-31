import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";

import geojsonData from "../../data/Sleman-kepanewon.json";
import { riskData } from "../../data/riskDummy";

type Props = {
  onRegionClick: (regionId: string) => void;
};

const center: LatLngExpression = [-7.716, 110.355];

const getColor = (risk: number) => {
  if (risk >= 0.9) return "#fb3c3c";
  if (risk >= 0.6) return "#FDE047";
  return "#4ad651";
};

const regionMap: Record<string, string> = {
  Berbah: "berbah",
  Cangkringan: "cangkringan",
  Depok: "depok",
  Gamping: "gamping",
  Godean: "godean",
  Kalasan: "kalasan",
  Minggir: "minggir",
  Mlati: "mlati",
  Moyudan: "moyudan",
  Ngaglik: "ngaglik",
  Ngemplak: "ngemplak",
  Pakem: "pakem",
  Prambanan: "prambanan",
  Seyegan: "seyegan",
  Sleman: "sleman",
  Tempel: "tempel",
  Turi: "turi",
};

export default function EwsRiskMap({ onRegionClick }: Props) {
  const style = (feature: any) => {
    const nama = feature.properties.wadmkc;
    const risk = riskData[nama] || 0;

    return {
      fillColor: getColor(risk),
      weight: 1,
      color: "#fff",
      fillOpacity: 0.7,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const nama = feature.properties.wadmkc;
    const risk = riskData[nama] || 0;

    layer.bindPopup(`
      <b>${nama}</b><br/>
      Risk Score: ${(risk * 100).toFixed(1)}%
    `);

    layer.on("mouseover", () => {
      layer.setStyle({
        weight: 3,
        fillOpacity: 1,
      });
    });

    layer.on("mouseout", () => {
      layer.setStyle({
        weight: 1,
        fillOpacity: 0.7,
      });
    });

    layer.on("click", () => {
      const regionId = regionMap[nama] || nama.toLowerCase();

      onRegionClick(regionId);
    });
  };

  return (
    <MapContainer
      center={center}
      zoom={11}
      zoomControl={false}
      scrollWheelZoom={true}
      className="rounded-3xl"
      style={{
        height: "650px",
        width: "100%",
      }}
    >
      <TileLayer
        attribution="© OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <GeoJSON
        data={geojsonData as any}
        style={style}
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  );
}
