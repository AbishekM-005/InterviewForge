import { chatClient } from "../lib/stream.js";
import Session from "../models/Session.js";
import { isValidObjectId } from "../lib/validators.js";

export async function getStreamToken(req, res) {
  try {
    const { sessionId } = req.query;

    if (!sessionId || !isValidObjectId(sessionId)) {
      return res.status(400).json({ msg: "Valid sessionId is required" });
    }

    const session = await Session.findById(sessionId).select(
      "host participant status"
    );

    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    const currentUserId = req.user._id.toString();
    const isMember =
      session.host?.toString() === currentUserId ||
      session.participant?.toString() === currentUserId;

    if (!isMember) {
      return res.status(403).json({ msg: "You cannot access this session" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ msg: "Session is no longer active" });
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + 60 * 60;
    const token = chatClient.createToken(req.user.clerkId, expiresAt, issuedAt);

    res.status(200).json({
      token,
      userId: req.user.clerkId,
      userName: req.user.name,
      userImage: req.user.profileImage,
    });
  } catch (error) {
    console.error("Error in getStreamToken controller : ", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
}
