import { Suspense, lazy } from "react";
import { useUser } from "@clerk/clerk-react";
import { Routes, Route, Navigate } from "react-router";
import { Toaster } from "react-hot-toast";
import { Loader2Icon } from "lucide-react";

const AboutPage = lazy(() => import("./pages/AboutPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const ProblemsPage = lazy(() => import("./pages/Problems"));
const DashBoardPage = lazy(() => import("./pages/DashBoardPage"));
const Problem = lazy(() => import("./pages/ProblemPage"));
const SessionPage = lazy(() => import("./pages/SessionPage"));

const AppLoader = () => (
  <div className="min-h-dvh flex items-center justify-center bg-base-200">
    <Loader2Icon className="size-10 animate-spin text-primary" />
  </div>
);

const App = () => {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) {
    return <AppLoader />;
  }

  return (
    <>
      <Suspense fallback={<AppLoader />}>
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
      </Suspense>
      <Toaster toastOptions={{ duration: 3000 }} />
    </>
  );
};

export default App;
