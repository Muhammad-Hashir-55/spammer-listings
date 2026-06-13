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

    const [totalPending, totalApproved, totalRejected, totalUsers] =
      await Promise.all([
        Spammer.countDocuments({ status: "pending" }),
        Spammer.countDocuments({ status: "approved" }),
        Spammer.countDocuments({ status: "rejected" }),
        User.countDocuments(),
      ]);

    return NextResponse.json({
      totalPending,
      totalApproved,
      totalRejected,
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