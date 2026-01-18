import React from "react";
import { useUser } from "@clerk/clerk-react";
import { Routes, Route, Navigate } from "react-router";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import ProblemsPage from "./pages/ProblemsPage";
import { Toaster } from "react-hot-toast";
import DashBoardPage from "./pages/DashBoardPage";

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
      </Routes>
      <Toaster toastOptions={{ duration: 3000 }} position="bottom-right" />
    </>
  );
};

export default App;
