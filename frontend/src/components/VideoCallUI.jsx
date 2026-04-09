import {
  CancelCallButton,
  CallingState,
  CompositeButton,
  Icon,
  ParticipantsAudio,
  ParticipantView,
  ReactionsButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { hasScreenShare, OwnCapability } from "@stream-io/video-client";
import { Restricted } from "@stream-io/video-react-bindings";
import {
  Loader2Icon,
  MessageSquareIcon,
  MonitorUpIcon,
  PhoneOffIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch (clipboardError) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const success = document.execCommand?.("copy");
    document.body.removeChild(textarea);

    if (!success) {
      throw clipboardError;
    }
  }
};

function LocalScreenShareButton() {
  const { useHasOngoingScreenShare, useScreenShareState, useCallSettings } =
    useCallStateHooks();
  const isSomeoneScreenSharing = useHasOngoingScreenShare();
  const callSettings = useCallSettings();
  const { screenShare, optionsAwareIsMute, isTogglePending } =
    useScreenShareState();

  const isLocalScreenSharing = !optionsAwareIsMute;
  const isScreenSharingAllowed = callSettings?.screensharing.enabled !== false;
  const isDisabled =
    isTogglePending ||
    !isScreenSharingAllowed ||
    (!isLocalScreenSharing && isSomeoneScreenSharing);

  const handleToggle = async () => {
    try {
      await screenShare.toggle();
    } catch (error) {
      console.error("Screen share toggle error:", error);
      toast.error("Unable to toggle screen sharing");
    }
  };

  return (
    <Restricted requiredGrants={[OwnCapability.SCREENSHARE]}>
      <CompositeButton
        active={isLocalScreenSharing}
        variant="secondary"
        data-testid={
          isLocalScreenSharing
            ? "local-screen-share-stop-button"
            : "local-screen-share-start-button"
        }
        title={isLocalScreenSharing ? "Stop sharing your screen" : "Share your screen"}
        disabled={isDisabled}
        onClick={handleToggle}
      >
        <Icon icon={isLocalScreenSharing ? "screen-share-on" : "screen-share-off"} />
      </CompositeButton>
    </Restricted>
  );
}

function VideoCallUI({ chatClient, channel }) {
  const navigate = useNavigate();

  const {
    useCallCallingState,
    useParticipantCount,
    useParticipants,
    useRemoteParticipants,
  } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();
  const participants = useParticipants();
  const remoteParticipants = useRemoteParticipants();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);

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
    if (!recordingError) return;

    const timeout = setTimeout(() => {
      setRecordingError("");
    }, 4000);

    return () => clearTimeout(timeout);
  }, [recordingError]);

  const orderedParticipants = useMemo(() => {
    if (!participants?.length) return [];
    const locals = [];
    const remotes = [];
    participants.forEach((participant) =>
      participant.isLocalParticipant
        ? locals.push(participant)
        : remotes.push(participant)
    );
    return [...remotes, ...locals];
  }, [participants]);

  const screenSharingParticipant = useMemo(
    () => orderedParticipants.find((participant) => hasScreenShare(participant)) || null,
    [orderedParticipants]
  );

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (screenSharingParticipant) return;
    if (orderedParticipants.length === 0) return;
    const remoteIndex = orderedParticipants.findIndex((p) => !p.isLocalParticipant);
    setActiveIndex(remoteIndex >= 0 ? remoteIndex : 0);
  }, [orderedParticipants, screenSharingParticipant]);

  const spotlightParticipant =
    screenSharingParticipant || orderedParticipants[activeIndex] || null;
  const spotlightTrackType = screenSharingParticipant
    ? "screenShareTrack"
    : "videoTrack";
  const screenShareLabel = screenSharingParticipant
    ? screenSharingParticipant.isLocalParticipant
      ? "You are sharing your screen"
      : `${screenSharingParticipant.name || "Participant"} is sharing their screen`
    : "";

  const goPrev = () => {
    setActiveIndex((prev) =>
      orderedParticipants.length === 0
        ? 0
        : (prev - 1 + orderedParticipants.length) % orderedParticipants.length
    );
  };

  const goNext = () => {
    setActiveIndex((prev) =>
      orderedParticipants.length === 0
        ? 0
        : (prev + 1) % orderedParticipants.length
    );
  };

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

  const stopRecording = useCallback((reason) => {
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
  }, []);

  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording("call ended");
      }
    };
  }, [isRecording, stopRecording]);

  const startRecording = async () => {
    setRecordingError("");

    if (!navigator?.mediaDevices?.getDisplayMedia || !window?.MediaRecorder) {
      setRecordingError("Recording is not supported in this browser.");
      return;
    }

    let displayStream = null;
    let micStream = null;

    try {
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });

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
      const recorder = new MediaRecorder(
        combinedStream,
        mimeType ? { mimeType } : {}
      );

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
      displayStream?.getTracks().forEach((track) => track.stop());
      micStream?.getTracks().forEach((track) => track.stop());
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

  if (callingState === CallingState.OFFLINE) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-warning/10 rounded-full flex items-center justify-center mb-4 mx-auto">
            <PhoneOffIcon className="w-12 h-12 text-warning" />
          </div>
          <h2 className="text-xl font-bold mb-2">Call Ended</h2>
          <p className="text-base-content/70">The video call has ended.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-call-ui h-full min-h-0 flex flex-col lg:flex-row gap-2 sm:gap-3 relative str-video">
      <div className="video-call-main flex-1 min-h-0 flex flex-col gap-2 sm:gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-base-100 p-3 rounded-lg shadow">
          <div className="flex items-center gap-2 min-w-0">
            <UsersIcon className="w-5 h-5 text-primary" />
            <span className="font-semibold truncate">
              {participantCount} {participantCount === 1 ? "participant" : "participants"}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {screenSharingParticipant ? (
              <span className="badge badge-info gap-2 px-3 py-3 max-w-full">
                <MonitorUpIcon className="size-4 shrink-0" />
                <span className="truncate">{screenShareLabel}</span>
              </span>
            ) : null}
            {chatClient && channel ? (
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`btn btn-sm gap-2 ${isChatOpen ? "btn-primary" : "btn-ghost"}`}
                title={isChatOpen ? "Hide chat" : "Show chat"}
              >
                <MessageSquareIcon className="size-4" />
                Chat
              </button>
            ) : null}
          </div>
        </div>

        <div className="video-stage flex-1 min-h-[320px] sm:min-h-[360px] lg:min-h-0 bg-base-300 rounded-lg overflow-hidden relative aspect-auto h-full video-carousel-layout">
          <ParticipantsAudio participants={remoteParticipants} />
          {spotlightParticipant ? (
            <ParticipantView
              participant={spotlightParticipant}
              trackType={spotlightTrackType}
              muteAudio
              mirror={screenSharingParticipant ? false : undefined}
            />
          ) : null}
          {!screenSharingParticipant && orderedParticipants.length > 1 ? (
            <div className="video-carousel-controls">
              <button
                type="button"
                className="video-carousel-btn"
                onClick={goPrev}
                aria-label="Previous participant"
              >
                &lsaquo;
              </button>
              <button
                type="button"
                className="video-carousel-btn"
                onClick={goNext}
                aria-label="Next participant"
              >
                &rsaquo;
              </button>
            </div>
          ) : null}
        </div>

        <div className="video-control-glass sticky bottom-0">
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
            <LocalScreenShareButton />
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

      {chatClient && channel && isChatOpen ? (
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
      ) : null}
    </div>
  );
}

export default VideoCallUI;
