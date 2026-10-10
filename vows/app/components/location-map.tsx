"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { LatLngTuple } from "leaflet";

const LocationMapCanvas = dynamic(() => import("./location-map-canvas"), {
  ssr: false,
});

export type MapLocation = {
  id: string;
  title: string;
  location: string;
  coordinates?: LatLngTuple;
};

type LocationMapProps = {
  locations: MapLocation[];
  className?: string;
};

export default function LocationMap({ locations, className = "h-72" }: LocationMapProps) {
  const [resolvedLocations, setResolvedLocations] = useState<MapLocation[]>(locations);
  const [resolvedKey, setResolvedKey] = useState(JSON.stringify(locations));
  const [isSearching, setIsSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const locationsKey = JSON.stringify(locations);

  useEffect(() => {
    let cancelled = false;
    const currentLocations = JSON.parse(locationsKey) as MapLocation[];
    async function resolveLocations() {
      setIsSearching(true);
      const resolved = await Promise.all(
        currentLocations.map(async (item) => {
          if (item.coordinates || !item.location.trim()) return item;
          try {
            const response = await fetch(`/api/geocode?q=${encodeURIComponent(item.location)}`);
            if (!response.ok) return item;
            const result = (await response.json()) as {
              latitude: number | null;
              longitude: number | null;
            };
            return result.latitude !== null && result.longitude !== null
              ? { ...item, coordinates: [result.latitude, result.longitude] as LatLngTuple }
              : item;
          } catch {
            return item;
          }
        }),
      );
      if (!cancelled) {
        setResolvedLocations(resolved);
        setResolvedKey(locationsKey);
        setSearchFailed(resolved.some((item) => !item.coordinates));
        setIsSearching(false);
      }
    }

    void resolveLocations();
    return () => {
      cancelled = true;
    };
  }, [locationsKey]);

  const activeLocations = resolvedKey === locationsKey ? resolvedLocations : locations;
  const mappableLocations = activeLocations.filter((item) => item.coordinates);
  if (mappableLocations.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center rounded-xl bg-[#edf1f4] p-4 text-center text-sm text-[#536577]`}>
        {isSearching ? "Locatie wordt opgezocht..." : "Locatie niet gevonden. Gebruik een volledig adres of plaatsnaam."}
      </div>
    );
  }

  return (
    <div>
      <LocationMapCanvas locations={mappableLocations} className={className} />
      {searchFailed && <p className="mt-1 text-xs text-[#718292]">Niet alle locaties konden op OpenStreetMap worden gevonden.</p>}
    </div>
  );
}
