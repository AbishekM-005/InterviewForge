import React from "react";
import { useNavigate } from "react-router";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { RefreshCwIcon } from "lucide-react";
import {
  useCreateSession,
  useMyRecentSessions,
  useActiveSessions,
} from "../hooks/useSessions.js";
import NavBar from "../components/NavBar";
import WelcomeSection from "../components/WelcomeSection";
import StatsCards from "../components/StatsCards.jsx";
import ActiveSessions from "../components/ActiveSessions.jsx";
import RecentSessions from "../components/RecentSessions.jsx";
import CreateSessionModal from "../components/CreateSessionModal.jsx";

const DashBoardPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomConfig, setRoomConfig] = useState({ problem: "", difficulty: "" });

  const createSessionMutation = useCreateSession();

  const {
    data: activeSessionsData,
    isLoading: loadingActiveSessions,
    isFetching: fetchingActiveSessions,
    refetch: refetchActiveSessions,
  } = useActiveSessions();
  const {
    data: recentSessionsData,
    isLoading: loadingRecentSessions,
    isFetching: fetchingRecentSessions,
    refetch: refetchRecentSessions,
  } = useMyRecentSessions();

  const handleCreateRoom = () => {
    if (!roomConfig.problem || !roomConfig.difficulty) return;

    createSessionMutation.mutate(
      {
        problem: roomConfig.problem,
        difficulty: roomConfig.difficulty.toLowerCase(),
      },
      {
        onSuccess: (data) => {
          setShowCreateModal(false);
          navigate(`/session/${data.session._id}`);
        },
      }
    );
  };

  const activeSessions = activeSessionsData?.sessions || [];
  const recentSessions = recentSessionsData?.sessions || [];
  const isRefreshing = fetchingActiveSessions || fetchingRecentSessions;

  const isUserInSession = (session) => {
    if (!user?.id) return false;

    return (
      session.host?.clerkId === user.id ||
      session.participant?.clerkId === user.id
    );
  };

  return (
    <div className="min-h-dvh bg-base-300">
      <NavBar />
      <WelcomeSection
        onCreateSession={() => {
          setShowCreateModal(true);
        }}
      />
      <div className="container mx-auto px-4 sm:px-6 pb-16">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            className="btn btn-outline btn-sm gap-2"
            onClick={() => {
              refetchActiveSessions();
              refetchRecentSessions();
            }}
            disabled={isRefreshing}
          >
            <RefreshCwIcon
              className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <StatsCards
              activeSessionsCount={activeSessions.length}
              recentSessionsCount={recentSessions.length}
            />
          </div>
          <div className="lg:col-span-2">
            <ActiveSessions
              sessions={activeSessions}
              isLoading={loadingActiveSessions}
              isUserInSession={isUserInSession}
            />
          </div>
        </div>

        <RecentSessions
          sessions={recentSessions}
          isLoading={loadingRecentSessions}
        />
      </div>
      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
        }}
        roomConfig={roomConfig}
        onCreateRoom={handleCreateRoom}
        isCreating={createSessionMutation.isPending}
        setRoomConfig={setRoomConfig}
      />
    </div>
  );
};

export default DashBoardPage;
