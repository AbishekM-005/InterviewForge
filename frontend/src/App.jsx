import React from "react";
import { useUser } from "@clerk/clerk-react";
import { Routes, Route, Navigate } from "react-router";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import ProblemsPage from "./pages/Problems";
import { Toaster } from "react-hot-toast";
import DashBoardPage from "./pages/DashBoardPage";
import Problem from "./pages/ProblemPage";

const App = () => {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) return null;

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
      </Routes>
      <Toaster toastOptions={{ duration: 3000 }} />
    </>
  );
};

export default App;
