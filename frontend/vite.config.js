import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router"],
          clerk: ["@clerk/clerk-react"],
          stream: [
            "@stream-io/video-react-sdk",
            "@stream-io/video-client",
            "stream-chat",
            "stream-chat-react",
          ],
          editor: ["@monaco-editor/react"],
        },
      },
    },
  },
});
