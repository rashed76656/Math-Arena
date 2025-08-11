import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, UserPlus, MessageCircle, Trophy, Clock, Search, Filter } from "lucide-react";
import { useAuth } from "../lib/stores/useAuth";
import { formatScore, formatTime } from "../lib/gameUtils";

interface Friend {
  id: string;
  username: string;
  status: "online" | "offline" | "playing";
  lastSeen: string;
  bestScore: number;
  totalGames: number;
  averageAccuracy: number;
  currentStreak: number;
  mutualFriends: number;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  status: "pending" | "accepted" | "declined";
  sentAt: string;
  message?: string;
}

export default function Friends() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "find">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "online" | "offline">("all");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    
    fetchFriendsData();
    const interval = setInterval(fetchFriendsData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate]);

  const fetchFriendsData = async () => {
    setLoading(true);
    try {
      // Fetch friends
      const friendsResponse = await fetch("/api/friends", {
        credentials: "include",
      });
      
      if (friendsResponse.ok) {
        const friendsData = await friendsResponse.json();
        setFriends(friendsData.friends || []);
      } else {
        // Mock data for development
        setFriends(generateMockFriends());
      }

      // Fetch friend requests
      const requestsResponse = await fetch("/api/friends/requests", {
        credentials: "include",
      });
      
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setFriendRequests(requestsData.requests || []);
      } else {
        // Mock data for development
        setFriendRequests(generateMockRequests());
      }
    } catch (error) {
      console.error("Failed to fetch friends data:", error);
      setFriends(generateMockFriends());
      setFriendRequests(generateMockRequests());
    } finally {
      setLoading(false);
    }
  };

  const generateMockFriends = (): Friend[] => {
    return [
      {
        id: "friend1",
        username: "MathWizard42",
        status: "online",
        lastSeen: new Date().toISOString(),
        bestScore: 15420,
        totalGames: 127,
        averageAccuracy: 89,
        currentStreak: 12,
        mutualFriends: 3,
      },
      {
        id: "friend2",
        username: "NumberNinja",
        status: "playing",
        lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        bestScore: 12850,
        totalGames: 98,
        averageAccuracy: 85,
        currentStreak: 7,
        mutualFriends: 1,
      },
      {
        id: "friend3",
        username: "CalcMaster",
        status: "offline",
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        bestScore: 18960,
        totalGames: 203,
        averageAccuracy: 92,
        currentStreak: 0,
        mutualFriends: 5,
      },
    ];
  };

  const generateMockRequests = (): FriendRequest[] => {
    return [
      {
        id: "req1",
        fromUserId: "user4",
        fromUsername: "AlgebraAce",
        toUserId: user?.id || "current",
        status: "pending",
        sentAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        message: "Great game yesterday! Let's be friends!",
      },
      {
        id: "req2",
        fromUserId: "user5",
        fromUsername: "GeometryGuru",
        toUserId: user?.id || "current",
        status: "pending",
        sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ];
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      } else {
        // Mock search results
        setSearchResults([
          { id: "search1", username: "TestUser1", bestScore: 5420, totalGames: 45 },
          { id: "search2", username: "TestUser2", bestScore: 8960, totalGames: 78 },
        ]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (username: string) => {
    try {
      const response = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        alert("Friend request sent!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to send friend request");
      }
    } catch (error) {
      console.error("Friend request error:", error);
      alert("Failed to send friend request. Please try again.");
    }
  };

  const handleRequestResponse = async (requestId: string, action: "accept" | "decline") => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        setFriendRequests(prev => prev.filter(req => req.id !== requestId));
        if (action === "accept") {
          fetchFriendsData(); // Refresh friends list
        }
      } else {
        alert("Failed to respond to friend request");
      }
    } catch (error) {
      console.error("Request response error:", error);
      alert("Failed to respond to friend request");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "playing": return "bg-yellow-500";
      case "offline": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "Online";
      case "playing": return "Playing";
      case "offline": return "Offline";
      default: return "Unknown";
    }
  };

  const filteredFriends = friends.filter(friend => {
    if (filterStatus === "all") return true;
    return friend.status === filterStatus;
  });

  const formatLastSeen = (lastSeen: string) => {
    const diff = Date.now() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-4">Please sign in to view your friends.</p>
          <button onClick={() => navigate("/")} className="game-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

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
            Friends & Social
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400">
            {friends.length} friends
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Navigation Tabs */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { key: "friends", label: "Friends", count: friends.length },
                { key: "requests", label: "Requests", count: friendRequests.length },
                { key: "find", label: "Find Friends", count: null },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    activeTab === key
                      ? "border-purple-400 bg-purple-900/30"
                      : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                  }`}
                >
                  <span className="font-medium text-white">{label}</span>
                  {count !== null && count > 0 && (
                    <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-300">Loading...</p>
            </div>
          ) : (
            <>
              {/* Friends Tab */}
              {activeTab === "friends" && (
                <div>
                  {/* Filter Bar */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="game-input"
                      >
                        <option value="all">All Friends</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>
                    <div className="text-sm text-gray-400">
                      Showing {filteredFriends.length} of {friends.length} friends
                    </div>
                  </div>

                  {/* Friends Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFriends.map((friend) => (
                      <div
                        key={friend.id}
                        className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {friend.username[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-bold text-white">{friend.username}</h3>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(friend.status)}`}></div>
                                <span className="text-sm text-gray-400">{getStatusText(friend.status)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button className="game-button-secondary p-2">
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-purple-300">{formatScore(friend.bestScore)}</div>
                            <div className="text-gray-400">Best Score</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-blue-300">{friend.totalGames}</div>
                            <div className="text-gray-400">Games Played</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-green-300">{friend.averageAccuracy}%</div>
                            <div className="text-gray-400">Accuracy</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-yellow-300">{friend.currentStreak}</div>
                            <div className="text-gray-400">Streak</div>
                          </div>
                        </div>

                        <div className="text-xs text-gray-400 text-center">
                          {friend.status === "offline" 
                            ? `Last seen ${formatLastSeen(friend.lastSeen)}`
                            : `${friend.mutualFriends} mutual friends`
                          }
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredFriends.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">
                        {filterStatus === "all" 
                          ? "No friends yet. Find some friends to connect with!"
                          : `No ${filterStatus} friends right now.`
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Friend Requests Tab */}
              {activeTab === "requests" && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-6">Pending Friend Requests</h2>
                  
                  <div className="space-y-4">
                    {friendRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {request.fromUsername[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-bold text-white">{request.fromUsername}</h3>
                              <p className="text-sm text-gray-400">
                                Sent {formatLastSeen(request.sentAt)}
                              </p>
                              {request.message && (
                                <p className="text-sm text-gray-300 mt-1">"{request.message}"</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleRequestResponse(request.id, "accept")}
                              className="game-button px-4 py-2"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRequestResponse(request.id, "decline")}
                              className="game-button-secondary px-4 py-2"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {friendRequests.length === 0 && (
                    <div className="text-center py-12">
                      <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No pending friend requests.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Find Friends Tab */}
              {activeTab === "find" && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-6">Find New Friends</h2>
                  
                  {/* Search Bar */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                          placeholder="Search by username..."
                          className="game-input w-full"
                        />
                      </div>
                      <button
                        onClick={handleSearch}
                        disabled={searching || !searchQuery.trim()}
                        className="game-button px-6 py-2 flex items-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        {searching ? "Searching..." : "Search"}
                      </button>
                    </div>
                  </div>

                  {/* Search Results */}
                  <div className="space-y-4">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {result.username[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-bold text-white">{result.username}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>Best Score: {formatScore(result.bestScore)}</span>
                                <span>Games: {result.totalGames}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleSendFriendRequest(result.username)}
                            className="game-button px-4 py-2 flex items-center gap-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            Add Friend
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {searchResults.length === 0 && searchQuery && !searching && (
                    <div className="text-center py-12">
                      <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No users found matching "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}