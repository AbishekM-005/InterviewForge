import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    problem: { type: String, required: true, trim: true, maxlength: 140 },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    //stream video-call id
    callId: {
      type: String,
      default: "",
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ status: 1, createdAt: -1 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;
