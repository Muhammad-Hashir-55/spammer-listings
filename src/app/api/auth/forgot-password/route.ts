import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";
import { PasswordReset } from "@/lib/models/passwordReset";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Delete any existing reset tokens for this email
    await PasswordReset.deleteMany({ email, used: false });

    // Generate a random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordReset.create({
      email,
      token,
      expiresAt,
    });

    try {
      await sendPasswordResetEmail(email, token);
    } catch (mailError) {
      console.error("Failed to send email:", mailError);
      // Clean up the token if email fails
      await PasswordReset.deleteOne({ token });
      return NextResponse.json(
        { error: "Failed to send reset email. Please check your email configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}