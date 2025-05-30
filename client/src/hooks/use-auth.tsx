import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auto-login as Ender (bypass authentication for development)
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me");

      if (response.ok) {
        const userData = await response.json();
        console.log("Auto-logged in as:", userData);
        setUser(userData);
        setToken("dev-token"); // Set dummy token for development
      } else {
        console.error("Failed to auto-login as Ender, response:", response.status);
        // For development, create a fallback user
        setUser({
          id: 1,
          username: "ender",
          email: "endersclarity@gmail.com",
          firstName: "Ender",
          lastName: "Developer",
          profileImage: null,
          createdAt: new Date().toISOString()
        });
        setToken("dev-fallback-token");
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      // For development, create a fallback user
      setUser({
        id: 1,
        username: "ender",
        email: "endersclarity@gmail.com",
        firstName: "Ender",
        lastName: "Developer",
        profileImage: null,
        createdAt: new Date().toISOString()
      });
      setToken("dev-fallback-token");
    } finally {
      setIsLoading(false);
    }
  };

  const login = (authToken: string, userData: User) => {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem("fitforge-token", authToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("fitforge-token");
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
