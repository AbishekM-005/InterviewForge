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
  const languageKeys = Object.keys(LANGUAGE_CONFIG);
  const languageKey = LANGUAGE_CONFIG[selectedLanguage]
    ? selectedLanguage
    : languageKeys[0];
  const languageConfig = LANGUAGE_CONFIG[languageKey];

  return (
    <div className="h-full bg-base-300 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-base-100 border-t border-base-300">
        <div className="flex items-center gap-3">
          {languageConfig && (
            <img
              src={languageConfig.icon}
              alt={languageConfig.name}
              className="size-5 sm:size-6"
            />
          )}
          <select
            className="select select-sm sm:select-md"
            value={languageKey}
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
          language={languageConfig?.monacoLang}
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
