import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Spammer } from "@/lib/models/spammer";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const org = searchParams.get("org");
    const minConfirmed = parseInt(searchParams.get("minConfirmed") || "0");
    const sort = searchParams.get("sort") || "newest";
    const limit = 10;
    const skip = (page - 1) * limit;

    await connectDB();

    // Show approved reports + the current user's own pending reports
    const filter: any = {
      $or: [
        { status: "approved" },
        ...(session?.user?.id ? [{ reportedBy: session.user.id, status: "pending" }] : []),
      ],
    };
    if (org) {
      filter.organization = org;
    }
    if (minConfirmed > 0) {
      filter.confirmedCount = { $gte: minConfirmed };
    }

    const sortOption: Record<string, 1 | -1> =
      sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [spammers, total] = await Promise.all([
      Spammer.find(filter)
        .populate("reportedBy", "name")
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Spammer.countDocuments(filter),
    ]);

    // Get unique organizations for filter
    const organizations = await Spammer.distinct("organization", {
      $and: [{ organization: { $ne: null } }, { organization: { $ne: "" } }],
    });

    return NextResponse.json({
      spammers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      organizations,
    });
  } catch (error) {
    console.error("Get spammers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone, name, description, organization, screenshots } =
      await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const spammer = await Spammer.create({
      reportedBy: session.user.id,
      phone,
      name: name || undefined,
      description: description || undefined,
      organization: organization || undefined,
      screenshots: screenshots || [],
    });

    return NextResponse.json(spammer, { status: 201 });
  } catch (error) {
    console.error("Create spammer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}