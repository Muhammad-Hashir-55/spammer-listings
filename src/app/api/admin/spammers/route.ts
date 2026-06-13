import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Spammer } from "@/lib/models/spammer";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const status = request.nextUrl.searchParams.get("status") || "pending";

    await connectDB();

    const spammers = await Spammer.find({ status })
      .populate("reportedBy", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json(spammers);
  } catch (error) {
    console.error("Admin spammers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}