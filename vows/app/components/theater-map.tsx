"use client";

import dynamic from "next/dynamic";
import type { LatLngTuple } from "leaflet";

const Map = dynamic(() => import("./map"), {
  ssr: false,
});

type TheaterMapProps = {
  theaters: Array<{
    coordinates: LatLngTuple;
    theaterId: number | string;
    address?: {
      street?: string;
      locality?: string;
    };
  }>;
};

export default function TheaterMap({ theaters }: TheaterMapProps) {
  return <Map theaters={theaters} />;
}
