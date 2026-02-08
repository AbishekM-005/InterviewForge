import {
  CancelCallButton,
  CallingState,
  CompositeButton,
  Icon,
  ReactionsButton,
  ScreenShareButton,
  PaginatedGridLayout,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { OwnCapability } from "@stream-io/video-client";
import { Restricted } from "@stream-io/video-react-bindings";
import { Loader2Icon, MessageSquareIcon, UsersIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import toast from "react-hot-toast";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";

const FENCED_CODE_BLOCK_REGEX = /```(?:[\w+-]+)?\n?([\s\S]*?)```/g;

const extractCopyableMessageText = (text = "") => {
  const content = text.trim();
  if (!content) return "";

  const codeBlocks = [];
  let match;
  while ((match = FENCED_CODE_BLOCK_REGEX.exec(content)) !== null) {
    if (match[1]?.trim()) {
      codeBlocks.push(match[1].trim());
    }
  }

  return codeBlocks.length > 0 ? codeBlocks.join("\n\n") : content;
};

const copyTextToClipboard = async (text) => {
  if (!text) return;

  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

function VideoCallUI({ chatClient, channel }) {
  const navigate = useNavigate();
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const [debugInfo, setDebugInfo] = useState({
    camera: "unknown",
    microphone: "unknown",
    permissionsError: "",
    mediaDevices: "unknown",
    secureContext: "unknown",
    userAgent: "",
  });
  const showDebugPanel =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("debug") === "1";

  const customMessageActions = useMemo(
    () => ({
      Copy: async (message) => {
        const text = extractCopyableMessageText(message?.text || "");
        await copyTextToClipboard(text);
      },
    }),
    []
  );

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => setIsDesktop(media.matches);
    handleChange();

    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (!showDebugPanel || typeof navigator === "undefined") return;

    const updateInfo = async () => {
      let camera = "unknown";
      let microphone = "unknown";
      let permissionsError = "";

      try {
        if (navigator.permissions?.query) {
          const camStatus = await navigator.permissions.query({
            name: "camera",
          });
          const micStatus = await navigator.permissions.query({
            name: "microphone",
          });
          camera = camStatus?.state || "unknown";
          microphone = micStatus?.state || "unknown";
        }
      } catch (error) {
        permissionsError = error?.message || "permissions query failed";
      }

      setDebugInfo({
        camera,
        microphone,
        permissionsError,
        mediaDevices: navigator.mediaDevices ? "available" : "missing",
        secureContext:
          typeof window !== "undefined" && window.isSecureContext
            ? "true"
            : "false",
        userAgent: navigator.userAgent || "",
      });
    };

    updateInfo();
  }, [showDebugPanel]);

  useEffect(() => {
    if (!recordingError) return;

    const timeout = setTimeout(() => {
      setRecordingError("");
    }, 4000);

    return () => clearTimeout(timeout);
  }, [recordingError]);

  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording("call ended");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const getSupportedRecordingMimeType = () => {
    if (typeof MediaRecorder === "undefined") return "";

    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];

    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  };

  const downloadRecording = (blob) => {
    if (!blob || blob.size === 0) return;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    anchor.href = url;
    anchor.download = `interviewforge-recording-${timestamp}.webm`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const stopRecording = (reason) => {
    if (!mediaRecorderRef.current) return;

    try {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } catch (error) {
      console.error("Stop recording error:", error);
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    setIsRecording(false);
    if (reason) {
      toast.success(`Recording saved (${reason})`);
    }
  };

  const startRecording = async () => {
    setRecordingError("");

    if (!navigator?.mediaDevices?.getDisplayMedia || !window?.MediaRecorder) {
      setRecordingError("Recording is not supported in this browser.");
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });

      let micStream = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        console.warn("Microphone capture unavailable:", error);
      }

      const tracks = [
        ...displayStream.getVideoTracks(),
        ...displayStream.getAudioTracks(),
        ...(micStream ? micStream.getAudioTracks() : []),
      ];

      const combinedStream = new MediaStream(tracks);
      const mimeType = getSupportedRecordingMimeType();
      const recorder = new MediaRecorder(combinedStream, mimeType ? { mimeType } : {});

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "video/webm",
        });
        downloadRecording(blob);
        chunksRef.current = [];
      };

      displayStream.getVideoTracks()[0]?.addEventListener("ended", () => {
        stopRecording("screen share ended");
      });

      mediaRecorderRef.current = recorder;
      mediaStreamRef.current = combinedStream;
      recorder.start(1000);
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      console.error("Start recording error:", error);
      setRecordingError("Unable to start recording. Check permissions.");
    }
  };

  if (callingState === CallingState.JOINING) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
          <p className="text-lg">Joining call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col lg:flex-row gap-2 sm:gap-3 relative str-video">
      <div className="flex-1 min-h-0 flex flex-col gap-2 sm:gap-3">
        {/* Participants count badge and Chat Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-base-100 p-3 rounded-lg shadow">
          <div className="flex items-center gap-2 min-w-0">
            <UsersIcon className="w-5 h-5 text-primary" />
            <span className="font-semibold truncate">
              {participantCount}{" "}
              {participantCount === 1 ? "participant" : "participants"}
            </span>
          </div>
          {chatClient && channel && (
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`btn btn-sm gap-2 ${
                isChatOpen ? "btn-primary" : "btn-ghost"
              }`}
              title={isChatOpen ? "Hide chat" : "Show chat"}
            >
              <MessageSquareIcon className="size-4" />
              Chat
            </button>
          )}
        </div>

        <div className="flex-1 min-h-[320px] sm:min-h-[360px] lg:min-h-0 bg-base-300 rounded-lg overflow-hidden relative aspect-auto h-full">
          <PaginatedGridLayout />
          {showDebugPanel && (
            <div className="absolute bottom-2 left-2 right-2 z-10 bg-black/70 text-white text-xs rounded-md p-2 space-y-1">
              <div className="font-semibold">Debug (video)</div>
              <div>callingState: {callingState}</div>
              <div>participants: {participantCount}</div>
              <div>secureContext: {debugInfo.secureContext}</div>
              <div>mediaDevices: {debugInfo.mediaDevices}</div>
              <div>camera: {debugInfo.camera}</div>
              <div>microphone: {debugInfo.microphone}</div>
              {debugInfo.permissionsError ? (
                <div>permError: {debugInfo.permissionsError}</div>
              ) : null}
            </div>
          )}
        </div>

        <div className="bg-base-100 p-2 sm:p-3 rounded-lg shadow sticky bottom-0">
          <div className="str-video__call-controls flex flex-wrap items-center justify-center gap-2">
            <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
              <ToggleAudioPublishingButton />
            </Restricted>
            <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
              <ToggleVideoPublishingButton />
            </Restricted>
            <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
              <ReactionsButton />
            </Restricted>
            <Restricted requiredGrants={[OwnCapability.SCREENSHARE]}>
              <ScreenShareButton />
            </Restricted>
            <CompositeButton
              active={isRecording}
              variant="secondary"
              data-testid={isRecording ? "recording-stop-button" : "recording-start-button"}
              title={isRecording ? "Stop recording" : "Start recording"}
              onClick={() => (isRecording ? stopRecording("manual stop") : startRecording())}
            >
              <Icon icon={isRecording ? "recording-on" : "recording-off"} />
            </CompositeButton>
            <CancelCallButton onLeave={() => navigate("/dashboard")} />
          </div>
          {recordingError ? (
            <p className="mt-2 text-center text-xs text-error">{recordingError}</p>
          ) : null}
        </div>
      </div>

      {/* CHAT SECTION */}
      {chatClient && channel && isChatOpen && (
        <div
          className={
            isDesktop
              ? "flex w-80 flex-col rounded-lg shadow overflow-hidden bg-[#272a30]"
              : "fixed inset-0 z-20 flex flex-col bg-[#272a30]"
          }
        >
          <div className="bg-[#1c1e22] p-3 border-b border-[#3a3d44] flex items-center justify-between">
            <h3 className="font-semibold text-white">Session Chat</h3>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
              title="Close chat"
            >
              <XIcon className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden stream-chat-dark">
            <Chat client={chatClient} theme="str-chat__theme-dark">
              <Channel channel={channel}>
                <Window>
                  <MessageList customMessageActions={customMessageActions} />
                  <MessageInput />
                </Window>
                <Thread
                  additionalMessageListProps={{ customMessageActions }}
                  additionalParentMessageProps={{ customMessageActions }}
                />
              </Channel>
            </Chat>
          </div>
        </div>
      )}
    </div>
  );
}
export default VideoCallUI;

