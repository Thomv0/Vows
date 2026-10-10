import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Een locatie is verplicht." }, { status: 400 });
  }

  try {
    const photonResponse = await fetch(
      `https://photon.komoot.io/api/?limit=1&q=${encodeURIComponent(query)}`,
      { headers: { Accept: "application/json" }, next: { revalidate: 3600 } },
    );

    if (photonResponse.ok) {
      const photonData = (await photonResponse.json()) as {
        features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
      };
      const coordinates = photonData.features?.[0]?.geometry?.coordinates;
      if (coordinates) {
        return NextResponse.json({
          latitude: coordinates[1],
          longitude: coordinates[0],
        });
      }
    }

    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: { Accept: "application/json", "User-Agent": "Vows wedding planner" },
        next: { revalidate: 3600 },
      },
    );

    if (nominatimResponse.ok) {
      const results = (await nominatimResponse.json()) as Array<{ lat: string; lon: string }>;
      const result = results[0];
      if (result) {
        return NextResponse.json({
          latitude: Number(result.lat),
          longitude: Number(result.lon),
        });
      }
    }

    return NextResponse.json({ latitude: null, longitude: null, label: null });
  } catch {
    return NextResponse.json({ error: "De locatie kon niet worden opgezocht." }, { status: 502 });
  }
}
