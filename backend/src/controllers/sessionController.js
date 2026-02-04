import { StreamVideoClient } from "@stream-io/node-sdk";
import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";

export async function createSession(req, res) {
  try {
    const { problem, difficulty } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    if (!problem || !difficulty) {
      return res
        .status(400)
        .json({ msg: "Problem and difficulty are required" });
    }

    const callId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const session = await Session.create({
      problem,
      difficulty,
      host: userId,
      callId,
    });

    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { problem, difficulty, sessionId: session._id.toString() },
      },
    });

    const channel = chatClient.channel("messaging", callId, {
      name: `${problem} Session`,
      created_by_id: clerkId,
      members: [clerkId],
    });

    await channel.create();
    res.status(201).json({ session });
  } catch (error) {
    console.error("Error in createSession controller : ", error);
    res.status(500).json({ msg: "Internal server error" });
  }
}

export async function getActiveSessions(_, res) {
  try {
    const sessions = await Session.find({ status: "active" })
      .populate("host", "name profileImage email clerkId")
      .populate("participant", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Error in getActiveSessions controller : ", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;

    //get session where user is either host or participant
    const sessions = await Session.find({
      status: "completed",
      $or: [{ host: userId }, { participant: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Error in getMyRecentSessions controller", error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;
    const session = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId");

    if (!session) return res.status(404).json({ message: "Session not found" });
    res.status(200).json({ session });
  } catch (error) {
    console.error("Error in getSessionById controller : ", error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
}

export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { clerkId } = req.user;

    const session = await Session.findById(id);

    if (!session) return res.status(404).json({ msg: "Session not found" });

    if (session.status !== "active") {
      return res.status(400).json({ msg: "Cannot join a completed session" });
    }

    if (session.host.toString() === userId.toString()) {
      return res
        .status(400)
        .json({ msg: "Host cannot join their own session as participant" });
    }

    if (session.participant)
      return res.status(409).json({ msg: "Session is full" });

    session.participant = userId;
    await session.save();

    const channel = chatClient.channel("messaging", session.callId);
    await channel.addMembers({ clerkId });

    res.status(200).json({ session });
  } catch (error) {
    console.error("Error in joinSession controller : ", error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
}

export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id);

    if (!session) return res.status(404).json({ msg: "Session not found" });

    //check user is host
    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({ msg: "Only the host can end the session" });
    }

    //check if session is already completed
    if (session.status === "completed") {
      return res.status(400).json({ msg: "Session is already completed" });
    }

    //delete stream video call
    const call = streamClient.video.call("default", session.callId);
    await call.delete({ hard: true });

    //delete stream chat

    const channel = chatClient.channel("messaging", session.callId);
    channel.delete();

    session.status = "completed";
    session.save();

    res.status(200).json({ session, msg: "Session ended successfully" });
  } catch (error) {
    console.error("Error in endSession controller : ", error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
}
