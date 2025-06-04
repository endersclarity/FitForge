import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import ConvexApp from "./ConvexApp";
import "./index.css";

// Initialize Convex client - use development URL for testing
const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL || "https://calculating-crab-35.convex.cloud"
);

// Environment debug for Convex
console.log("FitForge Convex Environment:", {
  VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL ? "✅ SET" : "❌ MISSING",
  MODE: import.meta.env.MODE,
  CONVEX_CLIENT: "✅ INITIALIZED"
});

createRoot(document.getElementById("root")!).render(
  <ConvexProvider client={convex}>
    <ConvexApp />
  </ConvexProvider>
);
