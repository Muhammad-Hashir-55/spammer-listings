import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Spammer } from "@/lib/models/spammer";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const spammer = await Spammer.findById(id).populate("reportedBy", "name");
    if (!spammer) {
      return NextResponse.json(
        { error: "Spammer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(spammer);
  } catch (error) {
    console.error("Get spammer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    await connectDB();

    // Toggle confirm
    if (body.action === "confirm") {
      const spammer = await Spammer.findById(id);
      if (!spammer) {
        return NextResponse.json(
          { error: "Spammer not found" },
          { status: 404 }
        );
      }

      const userId = session.user.id;
      const alreadyConfirmed = spammer.confirmedBy.some(
        (id: any) => id.toString() === userId
      );

      if (alreadyConfirmed) {
        spammer.confirmedBy = spammer.confirmedBy.filter(
          (id: any) => id.toString() !== userId
        );
      } else {
        spammer.confirmedBy.push(userId as any);
      }

      spammer.confirmedCount = spammer.confirmedBy.length;
      await spammer.save();

      return NextResponse.json(spammer);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Patch spammer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const spammer = await Spammer.findByIdAndDelete(id);
    if (!spammer) {
      return NextResponse.json(
        { error: "Spammer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete spammer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
