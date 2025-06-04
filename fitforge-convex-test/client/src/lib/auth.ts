import { apiRequest } from "./queryClient";
import { InsertUser, LoginData } from "@shared/schema";

export async function registerUser(userData: InsertUser) {
  const response = await apiRequest("POST", "/api/auth/register", userData);
  return response.json();
}

export async function loginUser(loginData: {email: string}) {
  const response = await apiRequest("POST", "/api/auth/login", loginData);
  return response.json();
}

export async function getCurrentUser(token?: string) {
  // No token required - auto-returns Ender's profile
  const response = await fetch("/api/auth/me");
  
  if (!response.ok) {
    throw new Error("Failed to get current user");
  }
  
  return response.json();
}
