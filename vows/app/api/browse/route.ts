import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("sample_mflix");

    const theaters = await db
      .collection("theaters")
      .find({})
      .toArray();

    return NextResponse.json(theaters);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch theaters" },
      { status: 500 }
    );
  }
}
