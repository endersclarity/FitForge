import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Keep environment debug for production monitoring
console.log("FitForge Environment:", {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? "✅ SET" : "❌ MISSING",
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? "✅ SET" : "❌ MISSING",
  MODE: import.meta.env.MODE
});

createRoot(document.getElementById("root")!).render(<App />);
