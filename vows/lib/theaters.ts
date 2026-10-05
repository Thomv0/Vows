import type { LatLngTuple } from "leaflet";
import { ObjectId } from "mongodb";
import clientPromise from "./mongodb";

type Theater = {
  theaterId?: number;
  location?: {
    address?: {
      street1?: string;
      city?: string;
      state?: string;
      zipcode?: string;
    };
    geo?: {
      coordinates?: [number, number];
    };
  };
};

export type TheaterMapData = {
  coordinates: LatLngTuple;
  theaterId: number | string;
  address?: {
    street?: string;
    locality?: string;
  };
};

function toMapData(theater: Theater): TheaterMapData | null {
  const coordinates = theater.location?.geo?.coordinates;

  if (
    !coordinates ||
    !Number.isFinite(coordinates[0]) ||
    !Number.isFinite(coordinates[1])
  ) {
    return null;
  }

  const address = theater.location?.address;
  return {
    coordinates: [coordinates[1], coordinates[0]],
    theaterId: theater.theaterId ?? "Unknown",
    address: address
      ? {
          street: address.street1,
          locality: [address.city, address.state, address.zipcode]
            .filter(Boolean)
            .join(", "),
        }
      : undefined,
  };
}

export async function getTheaterCoordinatesById(
  theaterId: string
): Promise<TheaterMapData | null> {
  const client = await clientPromise;
  const db = client.db("sample_mflix");
  const theater = await db
    .collection<Theater>("theaters")
    .findOne({ _id: new ObjectId(theaterId) });

  console.log("Theater:", theater);

  return theater ? toMapData(theater) : null;
}

export async function getAllTheaters(): Promise<TheaterMapData[]> {
  const client = await clientPromise;
  const db = client.db("sample_mflix");
  const theaters = await db.collection<Theater>("theaters").find({}).toArray();

  return theaters.flatMap((theater) => {
    const mapData = toMapData(theater);
    return mapData ? [mapData] : [];
  });
}
  