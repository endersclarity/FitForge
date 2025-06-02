import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Debug: Check environment variables
console.log("Environment Debug:", {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? "SET" : "MISSING",
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE
});

try {
  createRoot(document.getElementById("root")!).render(<App />);
  console.log("React app rendered successfully");
} catch (error) {
  console.error("React app failed to render:", error);
}
