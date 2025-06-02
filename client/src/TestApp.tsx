import React from "react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

function TestComponent() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>FitForge Test - Auth Working!</h1>
      <p>User: {user ? user.username : "Not logged in"}</p>
      <p>Auth context is working properly!</p>
    </div>
  );
}

function TestApp() {
  return (
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
}

export default TestApp;