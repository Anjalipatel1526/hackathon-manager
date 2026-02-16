import React, { createContext, useContext, useEffect, useState } from "react";

// Simple User type since we removed Supabase types
export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    role?: "candidate" | "hr";
    [key: string]: any;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, role: "candidate" | "hr", fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isHr: boolean;
  roles: string[];
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => { },
  signOut: async () => { },
  isAuthenticated: false,
  isHr: false,
  roles: [],
});

export const useAuth = () => useContext(AuthContext);

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage on mount
    const storedUser = localStorage.getItem("app_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem("app_user");
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, role: "candidate" | "hr", fullName?: string) => {
    // Simulate login
    const newUser: User = {
      id: generateUUID(), // Using fallback-safe UUID generator
      email,
      user_metadata: {
        full_name: fullName || email.split("@")[0],
        role,
      },
    };

    // For HR, we might want to hardcode the specific check here or in the UI.
    // The UI handles the credential check, so here we just set the authenticated state.
    if (role === 'hr') {
      newUser.user_metadata = { ...newUser.user_metadata, full_name: "HR Admin" };
    }

    setUser(newUser);
    localStorage.setItem("app_user", JSON.stringify(newUser));
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem("app_user");
    localStorage.removeItem("hr_auth"); // Cleanup old key if present
  };

  const isHr = user?.user_metadata?.role === "hr";
  const roles = user?.user_metadata?.role ? [user.user_metadata.role] : [];

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signOut,
      isAuthenticated: !!user,
      isHr,
      roles
    }}>
      {children}
    </AuthContext.Provider>
  );
};
