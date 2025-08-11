import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "gameplay" | "score" | "streak" | "time" | "skill" | "social";
  difficulty: "bronze" | "silver" | "gold" | "platinum";
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
  reward?: {
    type: "coins" | "gems" | "title" | "cosmetic";
    amount?: number;
    item?: string;
  };
}

interface AchievementState {
  achievements: Achievement[];
  unreadAchievements: string[];
  totalUnlocked: number;
  
  // Actions
  initializeAchievements: () => void;
  updateProgress: (achievementId: string, progress: number) => void;
  unlockAchievement: (achievementId: string) => void;
  markAsRead: (achievementId: string) => void;
  checkAchievements: (gameStats: any) => Achievement[];
  getAchievementsByCategory: (category: string) => Achievement[];
  getUnlockedCount: () => number;
}

const defaultAchievements: Achievement[] = [
  // Gameplay Achievements
  {
    id: "first_game",
    title: "First Steps",
    description: "Complete your first math battle",
    icon: "🎯",
    category: "gameplay",
    difficulty: "bronze",
    requirement: 1,
    progress: 0,
    unlocked: false,
    reward: { type: "coins", amount: 50 },
  },
  {
    id: "wave_master",
    title: "Wave Master",
    description: "Reach wave 10 in a single game",
    icon: "🌊",
    category: "gameplay", 
    difficulty: "silver",
    requirement: 10,
    progress: 0,
    unlocked: false,
    reward: { type: "coins", amount: 200 },
  },
  {
    id: "wave_legend",
    title: "Wave Legend",
    description: "Reach wave 20 in a single game",
    icon: "🏔️",
    category: "gameplay",
    difficulty: "gold",
    requirement: 20,
    progress: 0,
    unlocked: false,
    reward: { type: "gems", amount: 2 },
  },
  {
    id: "survivor",
    title: "Survivor",
    description: "Complete 100 games",
    icon: "🛡️",
    category: "gameplay",
    difficulty: "gold",
    requirement: 100,
    progress: 0,
    unlocked: false,
    reward: { type: "title", item: "Survivor" },
  },

  // Score Achievements  
  {
    id: "high_scorer",
    title: "High Scorer",
    description: "Score 10,000 points in a single game",
    icon: "⭐",
    category: "score",
    difficulty: "silver",
    requirement: 10000,
    progress: 0,
    unlocked: false,
    reward: { type: "coins", amount: 150 },
  },
  {
    id: "score_master",
    title: "Score Master",
    description: "Score 50,000 points in a single game",
    icon: "💫",
    category: "score",
    difficulty: "gold",
    requirement: 50000,
    progress: 0,
    unlocked: false,
    reward: { type: "gems", amount: 3 },
  },
  {
    id: "million_club",
    title: "Million Club",
    description: "Reach 1,000,000 total score",
    icon: "💎",
    category: "score",
    difficulty: "platinum",
    requirement: 1000000,
    progress: 0,
    unlocked: false,
    reward: { type: "gems", amount: 10 },
  },

  // Streak Achievements
  {
    id: "combo_starter",
    title: "Combo Starter",
    description: "Achieve a 10-answer combo",
    icon: "🔥",
    category: "streak",
    difficulty: "bronze",
    requirement: 10,
    progress: 0,
    unlocked: false,
    reward: { type: "coins", amount: 75 },
  },
  {
    id: "combo_master",
    title: "Combo Master", 
    description: "Achieve a 25-answer combo",
    icon: "⚡",
    category: "streak",
    difficulty: "silver",
    requirement: 25,
    progress: 0,
    unlocked: false,
    reward: { type: "coins", amount: 250 },
  },
  {
    id: "unstoppable",
    title: "Unstoppable",
    description: "Achieve a 50-answer combo",
    icon: "💥",
    category: "streak",
    difficulty: "gold",
    requirement: 50,
    progress: 0,
    unlocked: false,
    reward: { type: "gems", amount: 5 },
  },

  // Time Achievements
  {
    id: "speed_demon",
    title: "Speed Demon",
    description: "Answer 10 questions in under 30 seconds total",
    icon: "💨",
    category: "time",
    difficulty: "silver",
    requirement: 1,
    progress: 0,
    unlocked: false,
    reward: { type: "coins", amount: 200 },
  },
  {
    id: "marathon_runner",
    title: "Marathon Runner",
    description: "Play for 2 hours in total",
    icon: "🏃",
    category: "time",
    difficulty: "gold",
    requirement: 7200000, // 2 hours in ms
    progress: 0,
    unlocked: false,
    reward: { type: "gems", amount: 3 },
  },

  // Skill Achievements
  {
    id: "perfectionist",
    title: "Perfectionist",
    description: "Achieve 100% accuracy in a 20+ question game",
    icon: "✨",
    category: "skill",
    difficulty: "gold",
    requirement: 100,
    progress: 0,
    unlocked: false,
    reward: { type: "gems", amount: 5 },
  },
  {
    id: "multiplication_master",
    title: "Multiplication Master",
    description: "Answer 100 multiplication questions correctly",
    icon: "✖️",
    category: "skill",
    difficulty: "silver",
    requirement: 100,
    progress: 0,
    unlocked: false,
    reward: { type: "coins", amount: 300 },
  },
  {
    id: "division_expert",
    title: "Division Expert",
    description: "Answer 100 division questions correctly",
    icon: "➗",
    category: "skill",
    difficulty: "silver",
    requirement: 100,
    progress: 0,
    unlocked: false,
    reward: { type: "coins", amount: 300 },
  },

  // Social Achievements
  {
    id: "multiplayer_rookie",
    title: "Multiplayer Rookie",
    description: "Complete your first multiplayer game",
    icon: "👥",
    category: "social",
    difficulty: "bronze",
    requirement: 1,
    progress: 0,
    unlocked: false,
    reward: { type: "coins", amount: 100 },
  },
  {
    id: "team_player",
    title: "Team Player",
    description: "Win 10 multiplayer games",
    icon: "🤝",
    category: "social",
    difficulty: "silver",
    requirement: 10,
    progress: 0,
    unlocked: false,
    reward: { type: "gems", amount: 2 },
  },
];

export const useAchievements = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: [],
      unreadAchievements: [],
      totalUnlocked: 0,

      initializeAchievements: () => {
        const current = get().achievements;
        if (current.length === 0) {
          set({ achievements: [...defaultAchievements] });
        }
      },

      updateProgress: (achievementId, progress) => {
        set((state) => ({
          achievements: state.achievements.map((achievement) => {
            if (achievement.id === achievementId && !achievement.unlocked) {
              const newProgress = Math.max(achievement.progress, progress);
              const shouldUnlock = newProgress >= achievement.requirement;
              
              return {
                ...achievement,
                progress: newProgress,
                unlocked: shouldUnlock,
                unlockedAt: shouldUnlock ? new Date().toISOString() : achievement.unlockedAt,
              };
            }
            return achievement;
          }),
        }));
      },

      unlockAchievement: (achievementId) => {
        set((state) => {
          const achievement = state.achievements.find(a => a.id === achievementId);
          if (achievement && !achievement.unlocked) {
            return {
              achievements: state.achievements.map((a) =>
                a.id === achievementId
                  ? { ...a, unlocked: true, progress: a.requirement, unlockedAt: new Date().toISOString() }
                  : a
              ),
              unreadAchievements: [...state.unreadAchievements, achievementId],
              totalUnlocked: state.totalUnlocked + 1,
            };
          }
          return state;
        });
      },

      markAsRead: (achievementId) => {
        set((state) => ({
          unreadAchievements: state.unreadAchievements.filter(id => id !== achievementId),
        }));
      },

      checkAchievements: (gameStats) => {
        const { achievements, updateProgress, unlockAchievement } = get();
        const newlyUnlocked: Achievement[] = [];

        achievements.forEach((achievement) => {
          if (achievement.unlocked) return;

          let shouldUpdate = false;
          let newProgress = achievement.progress;

          switch (achievement.id) {
            case "first_game":
              if (gameStats.gamesCompleted >= 1) {
                unlockAchievement(achievement.id);
                newlyUnlocked.push(achievement);
              }
              break;

            case "wave_master":
              newProgress = Math.max(achievement.progress, gameStats.currentWave || 0);
              shouldUpdate = true;
              break;

            case "wave_legend":
              newProgress = Math.max(achievement.progress, gameStats.currentWave || 0);
              shouldUpdate = true;
              break;

            case "survivor":
              newProgress = gameStats.totalGames || 0;
              shouldUpdate = true;
              break;

            case "high_scorer":
            case "score_master":
              newProgress = Math.max(achievement.progress, gameStats.currentScore || 0);
              shouldUpdate = true;
              break;

            case "million_club":
              newProgress = gameStats.totalScore || 0;
              shouldUpdate = true;
              break;

            case "combo_starter":
            case "combo_master":
            case "unstoppable":
              newProgress = Math.max(achievement.progress, gameStats.maxCombo || 0);
              shouldUpdate = true;
              break;

            case "perfectionist":
              if (gameStats.totalQuestions >= 20 && gameStats.accuracy === 100) {
                unlockAchievement(achievement.id);
                newlyUnlocked.push(achievement);
              }
              break;

            case "multiplication_master":
              newProgress = gameStats.multiplicationCorrect || 0;
              shouldUpdate = true;
              break;

            case "division_expert":
              newProgress = gameStats.divisionCorrect || 0;
              shouldUpdate = true;
              break;

            case "marathon_runner":
              newProgress = gameStats.totalPlayTime || 0;
              shouldUpdate = true;
              break;

            case "multiplayer_rookie":
              if (gameStats.multiplayerGames >= 1) {
                unlockAchievement(achievement.id);
                newlyUnlocked.push(achievement);
              }
              break;

            case "team_player":
              newProgress = gameStats.multiplayerWins || 0;
              shouldUpdate = true;
              break;
          }

          if (shouldUpdate) {
            updateProgress(achievement.id, newProgress);
            if (newProgress >= achievement.requirement) {
              newlyUnlocked.push(achievement);
            }
          }
        });

        return newlyUnlocked;
      },

      getAchievementsByCategory: (category) => {
        return get().achievements.filter(a => a.category === category);
      },

      getUnlockedCount: () => {
        return get().achievements.filter(a => a.unlocked).length;
      },
    }),
    {
      name: "math-arena-achievements",
      version: 1,
    }
  )
);