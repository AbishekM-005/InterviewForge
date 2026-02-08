import React from "react";
import { useUser } from "@clerk/clerk-react";
import { Routes, Route, Navigate } from "react-router";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import ProblemsPage from "./pages/Problems";
import { Toaster } from "react-hot-toast";
import DashBoardPage from "./pages/DashBoardPage";
import Problem from "./pages/ProblemPage";
import SessionPage from "./pages/SessionPage";
import { Loader2Icon } from "lucide-react";

const App = () => {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-base-200">
        <Loader2Icon className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={!isSignedIn ? <HomePage /> : <Navigate to={"/dashboard"} />}
        />
        <Route
          path="/dashboard"
          element={isSignedIn ? <DashBoardPage /> : <Navigate to={"/"} />}
        />
        <Route path="/about" element={<AboutPage />} />
        <Route
          path="/problems"
          element={isSignedIn ? <ProblemsPage /> : <Navigate to={"/"} />}
        />
        <Route
          path="/problem/:id"
          element={isSignedIn ? <Problem /> : <Navigate to={"/"} />}
        />
        <Route
          path="/session/:id"
          element={isSignedIn ? <SessionPage /> : <Navigate to={"/"} />}
        />
        <Route path="*" element={<Navigate to={isSignedIn ? "/dashboard" : "/"} />} />
      </Routes>
      <Toaster toastOptions={{ duration: 3000 }} />
    </>
  );
};

export default App;
