import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  username: string;
  email: string;
  stats: {
    totalGames: number;
    totalScore: number;
    bestStreak: number;
    averageAccuracy: number;
  };
}

interface GuestSession {
  guestSessionId: string;
  createdAt: string;
  localScores: Array<{
    score: number;
    accuracy: number;
    wave: number;
    timestamp: string;
  }>;
}

interface AuthState {
  user: User | null;
  guestSession: GuestSession | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => void;
  startGuestSession: () => Promise<void>;
  saveGuestScore: (score: number, accuracy: number, wave: number) => void;
  mergeGuestData: () => Promise<boolean>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      guestSession: null,
      isAuthenticated: false,
      isGuest: false,

      login: async (email: string, password: string) => {
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          
          if (response.ok) {
            const data = await response.json();
            set({
              user: data.user,
              isAuthenticated: true,
              isGuest: false,
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error("Login error:", error);
          return false;
        }
      },

      signup: async (email: string, password: string, username: string) => {
        try {
          const { guestSession } = get();
          const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              email, 
              password, 
              username,
              guestSessionId: guestSession?.guestSessionId 
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            set({
              user: data.user,
              isAuthenticated: true,
              isGuest: false,
              guestSession: null, // Clear guest session after signup
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error("Signup error:", error);
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isGuest: false,
        });
      },

      startGuestSession: async () => {
        try {
          const response = await fetch("/api/auth/guest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceFingerprint: navigator.userAgent }),
          });
          
          if (response.ok) {
            const data = await response.json();
            set({
              guestSession: {
                guestSessionId: data.guestSessionId,
                createdAt: new Date().toISOString(),
                localScores: [],
              },
              isGuest: true,
            });
          }
        } catch (error) {
          console.error("Guest session error:", error);
          // Create a local-only guest session as fallback
          set({
            guestSession: {
              guestSessionId: `local_${Date.now()}_${Math.random()}`,
              createdAt: new Date().toISOString(),
              localScores: [],
            },
            isGuest: true,
          });
        }
      },

      saveGuestScore: (score: number, accuracy: number, wave: number) => {
        const { guestSession } = get();
        if (guestSession) {
          const newScore = {
            score,
            accuracy,
            wave,
            timestamp: new Date().toISOString(),
          };
          
          set({
            guestSession: {
              ...guestSession,
              localScores: [...guestSession.localScores, newScore],
            },
          });
        }
      },

      mergeGuestData: async () => {
        const { guestSession, user } = get();
        if (!guestSession || !user) return false;

        try {
          const response = await fetch("/api/auth/convert-guest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              guestSessionId: guestSession.guestSessionId,
              userId: user.id,
            }),
          });
          
          if (response.ok) {
            set({ guestSession: null });
            return true;
          }
          return false;
        } catch (error) {
          console.error("Merge error:", error);
          return false;
        }
      },
    }),
    {
      name: "math-arena-auth",
      partialize: (state) => ({
        guestSession: state.guestSession,
      }),
    }
  )
);
