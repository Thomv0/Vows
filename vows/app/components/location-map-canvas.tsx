"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { divIcon } from "leaflet";
import type { MapLocation } from "./location-map";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

export default function LocationMapCanvas({
  locations,
  className,
}: {
  locations: MapLocation[];
  className: string;
}) {
  const points = locations.map((item) => item.coordinates!);
  const bounds = points as LatLngBoundsExpression;
  const center = points[0];

  return (
    <div className={`overflow-hidden rounded-xl border border-[#cad4dc] ${className}`}>
      <MapContainer key={locations.map((item) => `${item.id}:${item.coordinates?.join(",")}`).join("|")} bounds={bounds} center={center} zoom={14} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bijdragers'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((item, index) => (
          <Marker
            key={item.id}
            position={item.coordinates!}
            icon={divIcon({
              className: "numbered-map-marker",
              html: `<span>${index + 1}</span>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            })}
          >
            <Popup>
              <strong>{index + 1}. {item.title}</strong>
              <div>{item.location}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
