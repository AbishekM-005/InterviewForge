import React from "react";
import { useNavigate } from "react-router";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
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

  const { data: activeSessionsData, isLoading: loadingActiveSessions } =
    useActiveSessions();
  const { data: recentSessionsData, isLoading: loadingRecentSessions } =
    useMyRecentSessions();

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

  const isUserInSession = (session) => {
    if (!user?.id) return false;

    return (
      session.host?.clerkId === user.id ||
      session.participant?.clerkId === user.id
    );
  };

  return (
    <div>
      <>
        <div className="min-h-screen bg-base-300">
          <NavBar />
          <WelcomeSection
            onCreateSession={() => {
              setShowCreateModal(true);
            }}
          />
          {/* GRID LAYOUT */}
          <div className="container mx-auto px-4 sm:px-6 pb-16">
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
      </>
    </div>
  );
};

export default DashBoardPage;

//write a console.log
