import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Spammer } from "@/lib/models/spammer";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const q = request.nextUrl.searchParams.get("q") || "";

    await connectDB();

    if (!q.trim()) {
      return NextResponse.json([]);
    }

    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Search approved reports + the current user's own pending reports
    const spammers = await Spammer.find({
      $and: [
        {
          $or: [
            { status: "approved" },
            ...(session?.user?.id
              ? [{ reportedBy: session.user.id, status: "pending" }]
              : []),
          ],
        },
        {
          $or: [
            { phone: { $regex: escapedQuery, $options: "i" } },
            { name: { $regex: escapedQuery, $options: "i" } },
            { organization: { $regex: escapedQuery, $options: "i" } },
          ],
        },
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
