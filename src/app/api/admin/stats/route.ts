import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Spammer } from "@/lib/models/spammer";
import { User } from "@/lib/models/user";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const [totalReports, totalUsers] = await Promise.all([
      Spammer.countDocuments(),
      User.countDocuments(),
    ]);

    return NextResponse.json({
      totalReports,
      totalUsers,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}