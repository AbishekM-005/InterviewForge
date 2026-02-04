import React from "react";

const OutputPanel = ({ output }) => {
  return (
    <div className="h-full bg-base-100 flex flex-col">
      <div className="px-3 sm:px-4 py-2 bg-base-200 border-b border-base-300 font-semibold text-xs sm:text-sm">
        Output
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
