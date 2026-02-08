import React from "react";
import { CopyIcon } from "lucide-react";
import toast from "react-hot-toast";

const OutputPanel = ({ output }) => {
  const handleCopyOutput = async () => {
    const textToCopy =
      output?.success
        ? output.output
        : [output?.output, output?.error].filter(Boolean).join("\n");

    if (!textToCopy) {
      toast.error("No output to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success("Output copied");
    } catch {
      toast.error("Failed to copy output");
    }
  };

  return (
    <div className="h-full bg-base-100 flex flex-col">
      <div className="px-3 sm:px-4 py-2 bg-base-200 border-b border-base-300 font-semibold text-xs sm:text-sm flex items-center justify-between">
        <span>Output</span>
        <button
          type="button"
          className="btn btn-ghost btn-xs gap-1"
          onClick={handleCopyOutput}
        >
          <CopyIcon className="size-3.5" />
          Copy
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3 sm:p-4">
        {output === null ? (
          <p className="text-base-content/50 text-xs sm:text-sm">
            Click "Run Code" to see the output here...
          </p>
        ) : output.success ? (
          <pre className="text-xs sm:text-sm font-mono text-success whitespace-pre-wrap">
            {output.output}
          </pre>
        ) : (
          <div>
            {output.output && (
              <pre className="text-xs sm:text-sm font-mono text-base-content whitespace-pre-wrap mb-2">
                {output.output}
              </pre>
            )}
            <pre className="text-xs sm:text-sm font-mono text-error whitespace-pre-wrap">
              {output.error}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
