import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { PROBLEMS } from "../data/problems.js";
import NavBar from "../components/NavBar";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ProblemDescription from "../components/ProblemDescription.jsx";
import CodeEditorPanel from "../components/CodeEditorPanel.jsx";
import OutputPanel from "../components/OutputPanel.jsx";
import { executeCode } from "../lib/piston.js";
import { markProblemSolved } from "../lib/solvedProblems.js";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

const Problem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const initialProblemId = id && PROBLEMS[id] ? id : "two-sum";

  const [currentProblemId, setCurrentProblemId] = useState(initialProblemId);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState(
    PROBLEMS[initialProblemId].starterCode.javascript
  );
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const currentProblem = PROBLEMS[currentProblemId];

  //update when url changes
  useEffect(() => {
    if (!id || !PROBLEMS[id]) {
      navigate("/problem/two-sum", { replace: true });
      return;
    }

    const selectedProblem = PROBLEMS[id];
    const hasSelectedLanguage = Boolean(selectedProblem.starterCode[selectedLanguage]);
    const nextLanguage = hasSelectedLanguage ? selectedLanguage : "javascript";

    setCurrentProblemId(id);
    setSelectedLanguage(nextLanguage);
    setCode(selectedProblem.starterCode[nextLanguage] || "");
    setOutput(null);
  }, [id, selectedLanguage, navigate]);

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

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    setCode(currentProblem.starterCode[newLang] || "");
    setOutput(null);
  };

  const handleProblemChange = (newProblemId) => {
    navigate(`/problem/${newProblemId}`);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 250,
      origin: { x: 0.2, y: 0.6 },
    });

    confetti({
      particleCount: 80,
      spread: 250,
      origin: { x: 0.8, y: 0.6 },
    });
  };

  const normalizeOutput = (output) => {
    //Just to normalize output for comparison
    const safeOutput = typeof output === "string" ? output : "";

    return safeOutput
      .trim()
      .split("\n")
      .map((line) =>
        line
          .trim()
          //for removing spaces after and before [ & ]
          .replace(/\[\s+/g, "[")

          .replace(/\s+\]/g, "]")
          .replace(/\s*,\s*/g, ",")
      )
      .filter((line) => line.length > 0)
      .join("\n");
  };

  const checkIfTestsPassed = (actualOutput, expectedOutput) => {
    const normalizedActual = normalizeOutput(actualOutput);
    const normalizedExpected = normalizeOutput(expectedOutput);
    return normalizedActual === normalizedExpected;
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);
    const result = await executeCode(selectedLanguage, code);
    setOutput(result);
    setIsRunning(false);

    //check if code executes successfully

    if (result.success) {
      const expectedOutput = currentProblem.expectedOutput[selectedLanguage];
      if (!expectedOutput) {
        toast.success("Code executed successfully");
        return;
      }

      const testsPassed = checkIfTestsPassed(result.output, expectedOutput);

      if (testsPassed) {
        toast.success("All tests passed! Great job!");
        triggerConfetti();
        markProblemSolved(currentProblemId);
      } else {
        toast.error("Tests failed. Check out your code");
      }
    } else {
      toast.error("Code execution failed");
    }
  };

  const handleResetCode = () => {
    setCode(currentProblem.starterCode[selectedLanguage] || "");
    setOutput(null);
  };

  return (
    <div className="min-h-dvh bg-base-100 flex flex-col">
      <NavBar />
      <div className="flex-1 min-h-0 overflow-hidden">
        <PanelGroup
          direction={isMobile ? "vertical" : "horizontal"}
          className="h-full min-h-0"
        >
          {/* Left panel - problem description */}
          <Panel defaultSize={isMobile ? 42 : 40} minSize={isMobile ? 25 : 30}>
            <ProblemDescription
              problem={currentProblem}
              currentProblemId={currentProblemId}
              onProblemChange={handleProblemChange}
              allProblems={Object.values(PROBLEMS)}
            />
          </Panel>

          <PanelResizeHandle
            className={`${
              isMobile
                ? "h-4 cursor-row-resize flex items-center justify-center bg-base-300 hover:bg-primary/70"
                : "w-2 cursor-col-resize bg-base-300 hover:bg-primary"
            } bg-base-300 hover:bg-primary transition-colors`}
          >
            {isMobile ? (
              <span className="h-1.5 w-12 rounded-full bg-base-content/30" />
            ) : null}
          </PanelResizeHandle>
          {/* right panel - code editor & output */}
          <Panel defaultSize={isMobile ? 58 : 60} minSize={isMobile ? 25 : 30}>
            <PanelGroup direction="vertical" className="h-full min-h-0">
              {/* Top panel - Code Editor Panel*/}
              <Panel defaultSize={70} minSize={25}>
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
              {/* Bottom panel - Output Panel*/}

              <Panel defaultSize={30} minSize={20}>
                <OutputPanel output={output} />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default Problem;
