import mongoose, { Schema, Document } from "mongoose";

export interface ISpammer extends Document {
  reportedBy: mongoose.Types.ObjectId;
  name?: string;
  phone: string;
  screenshots: string[];
  description?: string;
  organization?: string;
  confirmedBy: mongoose.Types.ObjectId[];
  confirmedCount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

const SpammerSchema = new Schema<ISpammer>(
  {
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String },
    phone: { type: String, required: true, index: true },
    screenshots: { type: [String], default: [], maxlength: 5 },
    description: { type: String, maxlength: 500 },
    organization: { type: String },
    confirmedBy: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    confirmedCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

SpammerSchema.index({ phone: "text", name: "text", organization: "text" });

export const Spammer =
  mongoose.models.Spammer || mongoose.model<ISpammer>("Spammer", SpammerSchema);