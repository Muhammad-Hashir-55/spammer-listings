import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Spammer } from "@/lib/models/spammer";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") || "";

    await connectDB();

    if (!q.trim()) {
      return NextResponse.json([]);
    }

    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const spammers = await Spammer.find({
      $or: [
        { phone: { $regex: escapedQuery, $options: "i" } },
        { name: { $regex: escapedQuery, $options: "i" } },
        { organization: { $regex: escapedQuery, $options: "i" } },
      ],
    })
      .populate("reportedBy", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json(spammers);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
