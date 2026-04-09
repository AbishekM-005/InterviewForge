import { useState, useEffect } from "react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import { initializeStreamClient, disconnectStreamClient } from "../lib/stream";
import { sessionApi } from "../api/sessions";

function useStreamClient(session, loadingSession, isHost, isParticipant) {
  const [streamClient, setStreamClient] = useState(null);
  const [call, setCall] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [isInitializingCall, setIsInitializingCall] = useState(true);
  const sessionId = session?._id;
  const callId = session?.callId;
  const sessionStatus = session?.status;

  useEffect(() => {
    let isCancelled = false;
    let videoCall = null;
    let chatClientInstance = null;

    const initCall = async () => {
      setIsInitializingCall(true);
      setCall(null);
      setChannel(null);
      setChatClient(null);

      if (!sessionId || !callId) {
        setIsInitializingCall(false);
        return;
      }

      if (!isHost && !isParticipant) {
        setIsInitializingCall(false);
        return;
      }

      if (sessionStatus === "completed") {
        setIsInitializingCall(false);
        return;
      }

      try {
        const { token, userId, userName, userImage } =
          await sessionApi.getStreamToken(sessionId);

        const client = await initializeStreamClient(
          {
            id: userId,
            name: userName,
            image: userImage,
          },
          token
        );

        if (isCancelled) return;
        setStreamClient(client);

        videoCall = client.call("default", callId);
        await videoCall.join({ create: true });
        if (isCancelled) return;
        setCall(videoCall);

        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        if (!apiKey) {
          throw new Error("Stream API key is not provided.");
        }

        chatClientInstance = StreamChat.getInstance(apiKey);

        if (chatClientInstance.userID && chatClientInstance.userID !== userId) {
          await chatClientInstance.disconnectUser();
        }

        if (!chatClientInstance.userID) {
          await chatClientInstance.connectUser(
          {
            id: userId,
            name: userName,
              image: userImage,
            },
            token
          );
        }
        if (isCancelled) return;
        setChatClient(chatClientInstance);

        const chatChannel = chatClientInstance.channel(
          "messaging",
          callId
        );
        await chatChannel.watch();
        if (isCancelled) return;
        setChannel(chatChannel);
      } catch (error) {
        toast.error(error?.response?.data?.msg || "Failed to join video call");
        console.error("Error init call", error);
      } finally {
        if (!isCancelled) {
          setIsInitializingCall(false);
        }
      }
    };

    if (sessionId && !loadingSession) initCall();
    else setIsInitializingCall(loadingSession);

    // cleanup - performance reasons
    return () => {
      isCancelled = true;
      // iife
      (async () => {
        try {
          if (videoCall) await videoCall.leave();
          if (chatClientInstance) await chatClientInstance.disconnectUser();
          await disconnectStreamClient();
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      })();
    };
  }, [sessionId, callId, sessionStatus, loadingSession, isHost, isParticipant]);

  return {
    streamClient,
    call,
    chatClient,
    channel,
    isInitializingCall,
  };
}

export default useStreamClient;
