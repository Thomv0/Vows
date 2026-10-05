"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngExpression, LatLngTuple } from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

interface MapProps {
  theaters: Array<{
    coordinates: LatLngTuple;
    theaterId: number | string;
    address?: {
      street?: string;
      locality?: string;
    };
  }>;
  zoom?: number;
}

const defaults = {
  zoom: 19,
};

const Map = ({ theaters, zoom = defaults.zoom }: MapProps) => {
  const center: LatLngExpression | LatLngTuple =
    theaters[0]?.coordinates ?? [39.8283, -98.5795];

  return (
    <MapContainer
      attributionControl={false}
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {theaters.map((theater) => (
        <Marker
          key={theater.theaterId}
          position={theater.coordinates}
          draggable={false}
        >
          <Popup>
            <strong>Theater {theater.theaterId}</strong>
            {theater.address?.street && <div>{theater.address.street}</div>}
            {theater.address?.locality && <div>{theater.address.locality}</div>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;