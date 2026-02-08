import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useEndSession, useJoinSession, useSessionById } from "../hooks/useSessions";
import { PROBLEMS } from "../data/problems";
import { executeCode } from "../lib/piston";
import NavBar from "../components/NavBar";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { getDifficultyBadgeClass } from "../lib/utils";
import { Loader2Icon, LogOutIcon, PhoneOffIcon, Link2Icon } from "lucide-react";
import CodeEditorPanel from "../components/CodeEditorPanel";
import OutputPanel from "../components/OutputPanel";
import toast from "react-hot-toast";

import useStreamClient from "../hooks/useStreamClient";
import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import VideoCallUI from "../components/VideoCallUI";

function SessionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();

  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hasShownEndToast = useRef(false);
  const hasAttemptedJoin = useRef(false);

  const {
    data: sessionData,
    isLoading: loadingSession,
    refetch,
  } = useSessionById(id);

  const joinSessionMutation = useJoinSession();
  const endSessionMutation = useEndSession();

  const session = sessionData?.session;
  const isHost = session?.host?.clerkId === user?.id;
  const isParticipant = session?.participant?.clerkId === user?.id;
  const difficultyLabel =
    typeof session?.difficulty === "string" && session.difficulty.length > 0
      ? session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)
      : "Easy";

  const { call, channel, chatClient, isInitializingCall, streamClient } =
    useStreamClient(session, loadingSession, isHost, isParticipant);

  const problemData = session?.problem
    ? Object.values(PROBLEMS).find((problem) => problem.title === session.problem)
    : null;

  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState(problemData?.starterCode?.[selectedLanguage] || "");

  useEffect(() => {
    hasAttemptedJoin.current = false;
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    const autoJoin = async () => {
      if (!session || !user || loadingSession) return;
      if (isHost || isParticipant) return;
      if (hasAttemptedJoin.current) return;
      hasAttemptedJoin.current = true;

      try {
        await joinSessionMutation.mutateAsync(id);
        if (isMounted) {
          await refetch();
        }
      } catch (error) {
        const status = error?.response?.status;
        if (status === 409) {
          toast.error("Session is full");
          navigate("/dashboard");
        }
        // Toast is already handled in mutation onError.
      }
    };

    autoJoin();

    return () => {
      isMounted = false;
    };
  }, [
    session,
    user,
    loadingSession,
    isHost,
    isParticipant,
    id,
    joinSessionMutation,
    refetch,
  ]);

  useEffect(() => {
    if (!session || loadingSession) return;

    if (session.status === "completed") {
      if (!isHost && !hasShownEndToast.current) {
        toast.success("This session has ended.");
        hasShownEndToast.current = true;
      }
      navigate("/dashboard");
    }
  }, [session, loadingSession, navigate]);

  useEffect(() => {
    if (problemData?.starterCode?.[selectedLanguage]) {
      setCode(problemData.starterCode[selectedLanguage]);
      setOutput(null);
    }
  }, [problemData, selectedLanguage]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1024px)");
    const handleChange = () => setIsMobile(media.matches);
    handleChange();

    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setSelectedLanguage(newLanguage);
    setCode(problemData?.starterCode?.[newLanguage] || "");
    setOutput(null);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);

    const result = await executeCode(selectedLanguage, code);
    setOutput(result);
    setIsRunning(false);
  };

  const handleResetCode = () => {
    setCode(problemData?.starterCode?.[selectedLanguage] || "");
    setOutput(null);
  };

  const handleEndSession = () => {
    const shouldEnd = confirm(
      "Are you sure you want to end this session? All participants will be notified."
    );

    if (!shouldEnd) return;

    endSessionMutation.mutate(id, {
      onSuccess: () => navigate("/dashboard"),
    });
  };

  const handleCopySessionLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Session link copied");
    } catch {
      toast.error("Unable to copy session link");
    }
  };

  return (
    <div className="min-h-dvh bg-base-100 flex flex-col">
      <NavBar />

      <div className="flex-1 min-h-0">
        {isMobile ? (
          <PanelGroup direction="vertical" className="h-full min-h-0">
            <Panel defaultSize={40} minSize={25} className="min-h-0">
              <div className="h-full min-h-0 p-2 sm:p-4">
                <div className="bg-base-200 p-2 sm:p-4 rounded-xl h-full min-h-0">
                  {isInitializingCall ? (
                    <div className="h-full min-h-[280px] flex items-center justify-center">
                      <div className="text-center">
                        <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
                        <p className="text-lg">Connecting to video call...</p>
                      </div>
                    </div>
                  ) : !streamClient || !call ? (
                    <div className="h-full min-h-[280px] flex items-center justify-center">
                      <div className="card bg-base-100 shadow-xl max-w-md">
                        <div className="card-body items-center text-center">
                          <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mb-4">
                            <PhoneOffIcon className="w-12 h-12 text-error" />
                          </div>
                          <h2 className="card-title text-2xl">Connection Failed</h2>
                          <p className="text-base-content/70">
                            Unable to connect to the video call
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[280px]">
                      <StreamVideo client={streamClient}>
                        <StreamCall call={call}>
                          <VideoCallUI chatClient={chatClient} channel={channel} />
                        </StreamCall>
                      </StreamVideo>
                    </div>
                  )}
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="h-4 bg-base-300 hover:bg-primary/70 transition-colors cursor-row-resize flex items-center justify-center">
              <span className="h-1.5 w-12 rounded-full bg-base-content/30" />
            </PanelResizeHandle>

            <Panel defaultSize={60} minSize={25} className="min-h-0">
              <div className="h-full min-h-0 overflow-y-auto p-2 sm:p-4 flex flex-col gap-4">
                <div className="bg-base-100 border border-base-300 rounded-xl p-4">
                  <div className="flex flex-col gap-3">
                    <div>
                      <h1 className="text-2xl font-bold text-base-content">
                        {session?.problem || "Loading..."}
                      </h1>
                      {problemData?.category && (
                        <p className="text-base-content/60 mt-1">
                          {problemData.category}
                        </p>
                      )}
                      <p className="text-base-content/60 mt-2 text-sm">
                        Host: {session?.host?.name || "Loading..."} |{" "}
                        {session?.participant ? 2 : 1}/2 participants
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isHost && (
                        <button
                          className="btn btn-outline btn-sm gap-2"
                          onClick={handleCopySessionLink}
                          type="button"
                        >
                          <Link2Icon className="w-4 h-4" />
                          Invite
                        </button>
                      )}

                      <span
                        className={`badge badge-lg ${getDifficultyBadgeClass(
                          session?.difficulty
                        )}`}
                      >
                        {difficultyLabel}
                      </span>

                      {isHost && session?.status === "active" && (
                        <button
                          onClick={handleEndSession}
                          disabled={endSessionMutation.isPending}
                          className="btn btn-error btn-sm gap-2"
                        >
                          {endSessionMutation.isPending ? (
                            <Loader2Icon className="w-4 h-4 animate-spin" />
                          ) : (
                            <LogOutIcon className="w-4 h-4" />
                          )}
                          End Session
                        </button>
                      )}

                      {session?.status === "completed" && (
                        <span className="badge badge-ghost badge-lg">Completed</span>
                      )}
                    </div>
                  </div>
                </div>

                {problemData?.description && (
                  <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                    <h2 className="text-xl font-bold mb-4 text-base-content">
                      Description
                    </h2>
                    <div className="space-y-3 text-base leading-relaxed">
                      <p className="text-base-content/90">
                        {problemData.description.text}
                      </p>
                      {problemData.description.notes?.map((note, index) => (
                        <p key={index} className="text-base-content/90">
                          {note}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {problemData?.examples?.length > 0 && (
                  <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                    <h2 className="text-xl font-bold mb-4 text-base-content">Examples</h2>

                    <div className="space-y-4">
                      {problemData.examples.map((example, index) => (
                        <div key={index}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="badge badge-sm">{index + 1}</span>
                            <p className="font-semibold text-base-content">
                              Example {index + 1}
                            </p>
                          </div>
                          <div className="bg-base-200 rounded-lg p-4 font-mono text-sm space-y-1.5">
                            <div className="flex gap-2">
                              <span className="text-primary font-bold min-w-[70px]">
                                Input:
                              </span>
                              <span>{example.input}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-secondary font-bold min-w-[70px]">
                                Output:
                              </span>
                              <span>{example.output}</span>
                            </div>
                            {example.explanation && (
                              <div className="pt-2 border-t border-base-300 mt-2">
                                <span className="text-base-content/60 font-sans text-xs">
                                  <span className="font-semibold">Explanation:</span>{" "}
                                  {example.explanation}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {problemData?.constraints?.length > 0 && (
                  <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                    <h2 className="text-xl font-bold mb-4 text-base-content">
                      Constraints
                    </h2>
                    <ul className="space-y-2 text-base-content/90">
                      {problemData.constraints.map((constraint, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="text-primary">-</span>
                          <code className="text-sm">{constraint}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-base-100 rounded-xl border border-base-300 overflow-hidden">
                  <CodeEditorPanel
                    selectedLanguage={selectedLanguage}
                    code={code}
                    isRunning={isRunning}
                    onLanguageChange={handleLanguageChange}
                    onCodeChange={(value) => setCode(value || "")}
                    onRunCode={handleRunCode}
                    onResetCode={handleResetCode}
                  />
                </div>

                <div className="bg-base-100 rounded-xl border border-base-300 overflow-hidden">
                  <OutputPanel output={output} />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        ) : (
          <PanelGroup direction="horizontal" className="h-full min-h-0">
            <Panel defaultSize={50} minSize={30} className="min-h-0">
              <PanelGroup direction="vertical" className="h-full min-h-0">
                <Panel defaultSize={50} minSize={20} className="min-h-0">
                  <div className="h-full overflow-y-auto bg-base-200">
                    <div className="p-4 sm:p-6 bg-base-100 border-b border-base-300">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                        <div>
                          <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                            {session?.problem || "Loading..."}
                          </h1>
                          {problemData?.category && (
                            <p className="text-base-content/60 mt-1">{problemData.category}</p>
                          )}
                          <p className="text-base-content/60 mt-2 text-sm sm:text-base">
                            Host: {session?.host?.name || "Loading..."} |{" "}
                            {session?.participant ? 2 : 1}/2 participants
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                          {isHost && (
                            <button
                              className="btn btn-outline btn-sm gap-2"
                              onClick={handleCopySessionLink}
                              type="button"
                            >
                              <Link2Icon className="w-4 h-4" />
                              Invite
                            </button>
                          )}

                          <span
                            className={`badge badge-lg ${getDifficultyBadgeClass(session?.difficulty)}`}
                          >
                            {difficultyLabel}
                          </span>

                          {isHost && session?.status === "active" && (
                            <button
                              onClick={handleEndSession}
                              disabled={endSessionMutation.isPending}
                              className="btn btn-error btn-sm gap-2"
                            >
                              {endSessionMutation.isPending ? (
                                <Loader2Icon className="w-4 h-4 animate-spin" />
                              ) : (
                                <LogOutIcon className="w-4 h-4" />
                              )}
                              End Session
                            </button>
                          )}

                          {session?.status === "completed" && (
                            <span className="badge badge-ghost badge-lg">Completed</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 space-y-6">
                      {problemData?.description && (
                        <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                          <h2 className="text-xl font-bold mb-4 text-base-content">Description</h2>
                          <div className="space-y-3 text-base leading-relaxed">
                            <p className="text-base-content/90">
                              {problemData.description.text}
                            </p>
                            {problemData.description.notes?.map((note, index) => (
                              <p key={index} className="text-base-content/90">
                                {note}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {problemData?.examples?.length > 0 && (
                        <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                          <h2 className="text-xl font-bold mb-4 text-base-content">Examples</h2>

                          <div className="space-y-4">
                            {problemData.examples.map((example, index) => (
                              <div key={index}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="badge badge-sm">{index + 1}</span>
                                  <p className="font-semibold text-base-content">
                                    Example {index + 1}
                                  </p>
                                </div>
                                <div className="bg-base-200 rounded-lg p-4 font-mono text-sm space-y-1.5">
                                  <div className="flex gap-2">
                                    <span className="text-primary font-bold min-w-[70px]">
                                      Input:
                                    </span>
                                    <span>{example.input}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="text-secondary font-bold min-w-[70px]">
                                      Output:
                                    </span>
                                    <span>{example.output}</span>
                                  </div>
                                  {example.explanation && (
                                    <div className="pt-2 border-t border-base-300 mt-2">
                                      <span className="text-base-content/60 font-sans text-xs">
                                        <span className="font-semibold">Explanation:</span>{" "}
                                        {example.explanation}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {problemData?.constraints?.length > 0 && (
                        <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                          <h2 className="text-xl font-bold mb-4 text-base-content">Constraints</h2>
                          <ul className="space-y-2 text-base-content/90">
                            {problemData.constraints.map((constraint, index) => (
                              <li key={index} className="flex gap-2">
                                <span className="text-primary">-</span>
                                <code className="text-sm">{constraint}</code>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>

                <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

                <Panel defaultSize={50} minSize={20} className="min-h-0">
                  <PanelGroup direction="vertical" className="h-full min-h-0">
                    <Panel defaultSize={70} minSize={30} className="min-h-0">
                      <CodeEditorPanel
                        selectedLanguage={selectedLanguage}
                        code={code}
                        isRunning={isRunning}
                        onLanguageChange={handleLanguageChange}
                        onCodeChange={(value) => setCode(value || "")}
                        onRunCode={handleRunCode}
                        onResetCode={handleResetCode}
                      />
                    </Panel>

                    <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

                    <Panel defaultSize={30} minSize={15} className="min-h-0">
                      <OutputPanel output={output} />
                    </Panel>
                  </PanelGroup>
                </Panel>
              </PanelGroup>
            </Panel>

            <PanelResizeHandle className="w-2 cursor-col-resize bg-base-300 hover:bg-primary transition-colors" />

            <Panel defaultSize={50} minSize={30} className="min-h-0">
              <div className="h-full min-h-[320px] bg-base-200 p-2 sm:p-4 flex flex-col overflow-hidden">
                {isInitializingCall ? (
                  <div className="flex-1 min-h-0 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
                      <p className="text-lg">Connecting to video call...</p>
                    </div>
                  </div>
                ) : !streamClient || !call ? (
                  <div className="flex-1 min-h-0 flex items-center justify-center">
                    <div className="card bg-base-100 shadow-xl max-w-md">
                      <div className="card-body items-center text-center">
                        <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mb-4">
                          <PhoneOffIcon className="w-12 h-12 text-error" />
                        </div>
                        <h2 className="card-title text-2xl">Connection Failed</h2>
                        <p className="text-base-content/70">Unable to connect to the video call</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <StreamVideo client={streamClient}>
                      <StreamCall call={call}>
                        <VideoCallUI chatClient={chatClient} channel={channel} />
                      </StreamCall>
                    </StreamVideo>
                  </div>
                )}
              </div>
            </Panel>
          </PanelGroup>
        )}
      </div>
    </div>
  );
}

export default SessionPage;
