import React from "react";
import Editor from "@monaco-editor/react";
import { Loader2Icon, PlayIcon, RotateCcwIcon } from "lucide-react";
import { LANGUAGE_CONFIG } from "../data/problems";

const CodeEditorPanel = ({
  selectedLanguage,
  code,
  isRunning,
  onLanguageChange,
  onCodeChange,
  onRunCode,
  onResetCode,
}) => {
  return (
    <div className="h-full bg-base-300 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-base-100 border-t border-base-300">
        <div className="flex items-center gap-3">
          <img
            src={LANGUAGE_CONFIG[selectedLanguage].icon}
            alt={LANGUAGE_CONFIG[selectedLanguage].name}
            className="size-5 sm:size-6"
          />
          <select
            className="select select-sm sm:select-md"
            value={selectedLanguage}
            onChange={onLanguageChange}
          >
            {Object.entries(LANGUAGE_CONFIG).map(([key, lang]) => (
              <option key={key} value={key}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onResetCode && (
            <button
              className="btn btn-outline btn-sm sm:btn-md gap-2 flex-1 sm:flex-none"
              onClick={onResetCode}
              type="button"
            >
              <RotateCcwIcon className="size-4" />
              Reset
            </button>
          )}
          <button
            className="btn btn-primary btn-sm sm:btn-md gap-2 flex-1 sm:flex-none"
            disabled={isRunning}
            onClick={onRunCode}
          >
            {isRunning ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayIcon className="size-4 " />
                Run Code
              </>
            )}
          </button>
        </div>
      </div>
      <div className="flex-1">
        <Editor
          height={"100%"}
          language={LANGUAGE_CONFIG[selectedLanguage].monacoLang}
          value={code}
          onChange={onCodeChange}
          theme="vs-dark"
          options={{
            fontSize: 16,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            minimap: { enabled: false },
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditorPanel;
