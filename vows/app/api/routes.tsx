import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("sample_mflix");
    const restaurants = await db
      .collection("theaters")
      .find({})
      .toArray();

    return NextResponse.json(restaurants);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 }
    );
  }
}
