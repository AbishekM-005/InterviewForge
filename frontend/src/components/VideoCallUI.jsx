import {
  CallControls,
  CallingState,
  SpeakerLayout,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { Loader2Icon, MessageSquareIcon, UsersIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";

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

        <div className="flex-1 min-h-[260px] sm:min-h-[360px] lg:min-h-0 bg-base-300 rounded-lg overflow-hidden relative">
          <SpeakerLayout />
        </div>

        <div className="bg-base-100 p-2 sm:p-3 rounded-lg shadow flex justify-center sticky bottom-0">
          <CallControls onLeave={() => navigate("/dashboard")} />
        </div>
      </div>

      {/* CHAT SECTION */}
      {chatClient && channel && (
        <div
          className={`${
            isDesktop
              ? "flex flex-col rounded-lg shadow overflow-hidden bg-[#272a30] transition-all duration-300 ease-in-out"
              : "fixed inset-0 z-20 flex flex-col bg-[#272a30]"
          } ${
            isChatOpen
              ? isDesktop
                ? "w-80 opacity-100"
                : "opacity-100"
              : isDesktop
                ? "w-0 opacity-0"
                : "hidden"
          }`}
        >
          {isChatOpen && (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
export default VideoCallUI;

