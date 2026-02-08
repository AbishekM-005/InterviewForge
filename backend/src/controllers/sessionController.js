import { randomUUID } from "crypto";
import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";
import {
  isValidObjectId,
  normalizeDifficulty,
  sanitizeProblemTitle,
} from "../lib/validators.js";

export async function createSession(req, res) {
  try {
    const { problem, difficulty } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;
    const normalizedProblem = sanitizeProblemTitle(problem);
    const normalizedDifficulty = normalizeDifficulty(difficulty);

    if (!normalizedProblem || !normalizedDifficulty) {
      return res
        .status(400)
        .json({ msg: "Valid problem and difficulty are required" });
    }

    const callId = `session_${randomUUID()}`;

    const session = await Session.create({
      problem: normalizedProblem,
      difficulty: normalizedDifficulty,
      host: userId,
      callId,
    });

    try {
      await streamClient.video.call("default", callId).getOrCreate({
        data: {
          created_by_id: clerkId,
          custom: {
            problem: normalizedProblem,
            difficulty: normalizedDifficulty,
            sessionId: session._id.toString(),
          },
        },
      });

      const channel = chatClient.channel("messaging", callId, {
        name: `${normalizedProblem} Session`,
        created_by_id: clerkId,
        members: [clerkId],
      });

      await channel.create();
    } catch (streamError) {
      await Session.findByIdAndDelete(session._id);
      throw streamError;
    }
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

    if (!isValidObjectId(id)) {
      return res.status(400).json({ msg: "Invalid session id" });
    }

    const session = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId");

    if (!session) return res.status(404).json({ msg: "Session not found" });

    const userId = req.user._id.toString();
    const isMember =
      session.host?._id?.toString() === userId ||
      session.participant?._id?.toString() === userId;

    if (!isMember) {
      if (session.status !== "active" || session.participant) {
        return res.status(403).json({ msg: "You cannot access this session" });
      }

      const publicSession = session.toObject();
      delete publicSession.callId;
      return res.status(200).json({ session: publicSession });
    }

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

    if (!isValidObjectId(id)) {
      return res.status(400).json({ msg: "Invalid session id" });
    }

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

    const joinedSession = await Session.findOneAndUpdate(
      {
        _id: id,
        status: "active",
        participant: null,
      },
      {
        $set: { participant: userId },
      },
      {
        new: true,
      }
    );

    if (!joinedSession) {
      return res.status(409).json({ msg: "Session is already full" });
    }

    try {
      const channel = chatClient.channel("messaging", joinedSession.callId);
      await channel.addMembers([clerkId]);
    } catch (streamError) {
      await Session.updateOne(
        { _id: id, participant: userId },
        { $set: { participant: null } }
      );
      throw streamError;
    }

    const populatedSession = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId");

    res.status(200).json({ session: populatedSession });
  } catch (error) {
    console.error("Error in joinSession controller : ", error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
}

export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ msg: "Invalid session id" });
    }

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

    session.status = "completed";
    await session.save();

    const cleanupTasks = [];

    const call = streamClient.video.call("default", session.callId);
    cleanupTasks.push(call.delete({ hard: true }));

    const channel = chatClient.channel("messaging", session.callId);
    cleanupTasks.push(channel.delete());

    const cleanupResults = await Promise.allSettled(cleanupTasks);
    const hasCleanupFailure = cleanupResults.some(
      (task) => task.status === "rejected"
    );

    if (hasCleanupFailure) {
      console.error("Stream cleanup failed for session: ", session._id);
    }

    res.status(200).json({ session, msg: "Session ended successfully" });
  } catch (error) {
    console.error("Error in endSession controller : ", error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
}
