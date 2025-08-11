import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Plus, RefreshCw, Crown, Lock, Globe, Clock, Zap } from "lucide-react";
import { useAuth } from "../lib/stores/useAuth";

interface GameRoom {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  mode: string;
  difficulty: "easy" | "medium" | "hard";
  maxPlayers: number;
  currentPlayers: number;
  isPrivate: boolean;
  isActive: boolean;
  settings: {
    timeLimit?: number;
    startingHealth?: number;
    powerUpsEnabled?: boolean;
  };
  createdAt: string;
}

interface CreateRoomData {
  name: string;
  mode: string;
  difficulty: "easy" | "medium" | "hard";
  maxPlayers: number;
  isPrivate: boolean;
  timeLimit: number;
  startingHealth: number;
  powerUpsEnabled: boolean;
}

export default function Rooms() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  
  const [createRoomData, setCreateRoomData] = useState<CreateRoomData>({
    name: "",
    mode: "classic",
    difficulty: "medium",
    maxPlayers: 4,
    isPrivate: false,
    timeLimit: 30,
    startingHealth: 5,
    powerUpsEnabled: true,
  });

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      } else {
        // Use mock data for development
        setRooms(generateMockRooms());
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      setRooms(generateMockRooms());
    } finally {
      setLoading(false);
    }
  };

  const generateMockRooms = (): GameRoom[] => {
    return [
      {
        id: "room1",
        name: "Beginner's Paradise",
        hostId: "user1",
        hostName: "MathWiz123",
        mode: "classic",
        difficulty: "easy",
        maxPlayers: 4,
        currentPlayers: 2,
        isPrivate: false,
        isActive: true,
        settings: {
          timeLimit: 30,
          startingHealth: 5,
          powerUpsEnabled: true,
        },
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: "room2", 
        name: "Speed Demons Only",
        hostId: "user2",
        hostName: "QuickCalc",
        mode: "speed",
        difficulty: "hard",
        maxPlayers: 6,
        currentPlayers: 4,
        isPrivate: false,
        isActive: true,
        settings: {
          timeLimit: 15,
          startingHealth: 3,
          powerUpsEnabled: false,
        },
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      {
        id: "room3",
        name: "Private Study Group",
        hostId: "user3", 
        hostName: "StudyBuddy",
        mode: "classic",
        difficulty: "medium",
        maxPlayers: 3,
        currentPlayers: 1,
        isPrivate: true,
        isActive: true,
        settings: {
          timeLimit: 25,
          startingHealth: 4,
          powerUpsEnabled: true,
        },
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      },
    ];
  };

  const handleCreateRoom = async () => {
    if (!isAuthenticated) {
      alert("Please sign in to create rooms!");
      return;
    }

    if (!createRoomData.name.trim()) {
      alert("Please enter a room name!");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...createRoomData,
          name: createRoomData.name.trim(),
        }),
      });

      if (response.ok) {
        const room = await response.json();
        setShowCreateRoom(false);
        navigate(`/room/${room.id}`);
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create room");
      }
    } catch (error) {
      console.error("Create room error:", error);
      alert("Failed to create room. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!isAuthenticated) {
      alert("Please sign in to join rooms!");
      return;
    }

    setJoining(roomId);
    try {
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        navigate(`/room/${roomId}`);
      } else {
        const error = await response.json();
        alert(error.message || "Failed to join room");
      }
    } catch (error) {
      console.error("Join room error:", error);
      alert("Failed to join room. Please try again.");
    } finally {
      setJoining(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "text-green-300 bg-green-900/20";
      case "medium": return "text-yellow-300 bg-yellow-900/20";
      case "hard": return "text-red-300 bg-red-900/20";
      default: return "text-gray-300 bg-gray-900/20";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-black/20 backdrop-blur-sm">
        <button
          onClick={() => navigate("/")}
          className="game-button-secondary px-4 py-2 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
        
        <div className="text-center">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-300" />
            Multiplayer Rooms
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRooms}
            className="game-button-secondary p-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateRoom(true)}
            className="game-button px-4 py-2 flex items-center gap-2"
            disabled={!isAuthenticated}
          >
            <Plus className="w-4 h-4" />
            Create Room
          </button>
        </div>
      </div>

      {/* Auth Warning for Guests */}
      {!isAuthenticated && (
        <div className="bg-yellow-900/30 border-b border-yellow-600/30 p-4">
          <div className="container mx-auto max-w-6xl text-center">
            <p className="text-yellow-200">
              🔒 Sign in to create and join multiplayer rooms.{" "}
              <button
                onClick={() => navigate("/")}
                className="underline font-medium hover:text-yellow-100"
              >
                Sign in now
              </button>
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-300">Loading rooms...</p>
            </div>
          ) : (
            /* Rooms Grid */
            <div className="grid gap-6">
              {rooms.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No active rooms found.</p>
                  {isAuthenticated && (
                    <button
                      onClick={() => setShowCreateRoom(true)}
                      className="game-button flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Create the First Room
                    </button>
                  )}
                </div>
              ) : (
                rooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-white">{room.name}</h3>
                          {room.isPrivate && (
                            <Lock className="w-4 h-4 text-yellow-400" />
                          )}
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getDifficultyColor(room.difficulty)}`}>
                            {room.difficulty.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            <span className="text-gray-300">Host: {room.hostName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-gray-300">{room.currentPlayers}/{room.maxPlayers} players</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="w-4 h-4 text-green-400" />
                            <span className="text-gray-300 capitalize">{room.mode}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-purple-400" />
                            <span className="text-gray-300">{formatTimeAgo(room.createdAt)}</span>
                          </div>
                        </div>

                        {/* Room Settings */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                            {room.settings.timeLimit}s per question
                          </span>
                          <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                            {room.settings.startingHealth} health
                          </span>
                          {room.settings.powerUpsEnabled && (
                            <span className="text-xs bg-purple-700 px-2 py-1 rounded flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Power-ups enabled
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                              style={{ width: `${(room.currentPlayers / room.maxPlayers) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-400 mt-1">
                            {room.currentPlayers}/{room.maxPlayers}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => handleJoinRoom(room.id)}
                          disabled={
                            !isAuthenticated || 
                            joining === room.id || 
                            room.currentPlayers >= room.maxPlayers ||
                            !room.isActive
                          }
                          className={`px-6 py-2 font-medium rounded transition-all ${
                            joining === room.id
                              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                              : room.currentPlayers >= room.maxPlayers
                              ? "bg-red-600/50 text-red-300 cursor-not-allowed"
                              : isAuthenticated
                              ? "bg-purple-600 hover:bg-purple-500 text-white"
                              : "bg-gray-600 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {joining === room.id 
                            ? "Joining..." 
                            : room.currentPlayers >= room.maxPlayers 
                            ? "Full" 
                            : "Join Room"
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Create New Room</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Room Name</label>
                <input
                  type="text"
                  value={createRoomData.name}
                  onChange={(e) => setCreateRoomData(prev => ({ ...prev, name: e.target.value }))}
                  className="game-input w-full"
                  placeholder="Enter room name..."
                  maxLength={50}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Mode</label>
                  <select
                    value={createRoomData.mode}
                    onChange={(e) => setCreateRoomData(prev => ({ ...prev, mode: e.target.value }))}
                    className="game-input w-full"
                  >
                    <option value="classic">Classic</option>
                    <option value="speed">Speed Run</option>
                    <option value="survival">Survival</option>
                    <option value="team">Team Battle</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                  <select
                    value={createRoomData.difficulty}
                    onChange={(e) => setCreateRoomData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="game-input w-full"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Players</label>
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={createRoomData.maxPlayers}
                    onChange={(e) => setCreateRoomData(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                    className="game-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Time Limit (s)</label>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    value={createRoomData.timeLimit}
                    onChange={(e) => setCreateRoomData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                    className="game-input w-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Starting Health</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={createRoomData.startingHealth}
                    onChange={(e) => setCreateRoomData(prev => ({ ...prev, startingHealth: parseInt(e.target.value) }))}
                    className="game-input w-full"
                  />
                </div>
                
                <div className="flex items-center pt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={createRoomData.powerUpsEnabled}
                      onChange={(e) => setCreateRoomData(prev => ({ ...prev, powerUpsEnabled: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-300">Enable Power-ups</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createRoomData.isPrivate}
                    onChange={(e) => setCreateRoomData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-300">Private Room (invite only)</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateRoom(false)}
                className="game-button-secondary px-4 py-2"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={creating || !createRoomData.name.trim()}
                className="game-button px-4 py-2 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Room"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}