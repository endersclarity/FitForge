import { createRoot } from "react-dom/client";
import "./index.css";

// Debug: Check environment variables
console.log("Environment Debug:", {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? "SET" : "MISSING",
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE
});

// Simple test component without Supabase
function TestApp() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>FitForge Test - Environment Debug</h1>
      <p>If you can see this, React is working!</p>
      <div style={{ background: "#f0f0f0", padding: "10px", marginTop: "10px" }}>
        <h3>Environment Variables:</h3>
        <p>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL || "MISSING"}</p>
        <p>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? "SET" : "MISSING"}</p>
        <p>NODE_ENV: {import.meta.env.NODE_ENV}</p>
        <p>MODE: {import.meta.env.MODE}</p>
      </div>
    </div>
  );
}

try {
  createRoot(document.getElementById("root")!).render(<TestApp />);
  console.log("React test app rendered successfully");
} catch (error) {
  console.error("React test app failed to render:", error);
  document.body.innerHTML = `<h1>Error: ${error}</h1>`;
}
