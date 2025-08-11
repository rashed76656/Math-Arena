import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, Gem, ShoppingCart, Zap, Palette, Shield, Heart } from "lucide-react";
import { useAuth } from "../lib/stores/useAuth";
import { formatScore } from "../lib/gameUtils";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "coins" | "gems";
  category: "powerup" | "cosmetic" | "boost";
  icon: string;
  owned: boolean;
  equipped?: boolean;
}

interface UserCurrency {
  coins: number;
  gems: number;
}

export default function Shop() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [selectedCategory, setSelectedCategory] = useState<"powerup" | "cosmetic" | "boost">("powerup");
  const [userCurrency, setUserCurrency] = useState<UserCurrency>({ coins: 0, gems: 0 });
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    setLoading(true);
    try {
      // Fetch user currency
      const currencyResponse = await fetch("/api/user/currency", {
        credentials: "include",
      });
      
      if (currencyResponse.ok) {
        const currency = await currencyResponse.json();
        setUserCurrency(currency);
      } else {
        // Use mock data for development
        setUserCurrency({ coins: 2500, gems: 10 });
      }

      // Fetch shop items
      const shopResponse = await fetch("/api/shop/items", {
        credentials: "include",
      });
      
      if (shopResponse.ok) {
        const items = await shopResponse.json();
        setShopItems(items.items || []);
      } else {
        // Use mock data for development
        setShopItems(generateMockShopItems());
      }
    } catch (error) {
      console.error("Failed to fetch shop data:", error);
      setUserCurrency({ coins: 2500, gems: 10 });
      setShopItems(generateMockShopItems());
    } finally {
      setLoading(false);
    }
  };

  const generateMockShopItems = (): ShopItem[] => {
    return [
      // Power-ups
      {
        id: "freeze_upgrade",
        name: "Enhanced Freeze",
        description: "Freeze lasts 5 seconds instead of 3",
        price: 500,
        currency: "coins",
        category: "powerup",
        icon: "❄️",
        owned: false,
      },
      {
        id: "shield_upgrade",
        name: "Reinforced Shield",
        description: "Shield blocks 5 hits instead of 3",
        price: 750,
        currency: "coins",
        category: "powerup",
        icon: "🛡️",
        owned: false,
      },
      {
        id: "heal_upgrade",
        name: "Greater Healing",
        description: "Heal restores 3 health instead of 2",
        price: 600,
        currency: "coins",
        category: "powerup",
        icon: "💚",
        owned: false,
      },
      {
        id: "multiplier_upgrade",
        name: "Super Multiplier",
        description: "Score multiplier gives 3x instead of 2x",
        price: 2,
        currency: "gems",
        category: "powerup",
        icon: "⭐",
        owned: false,
      },

      // Cosmetics
      {
        id: "player_red",
        name: "Red Player",
        description: "Change your player color to red",
        price: 200,
        currency: "coins",
        category: "cosmetic",
        icon: "🔴",
        owned: false,
      },
      {
        id: "player_green",
        name: "Green Player",
        description: "Change your player color to green",
        price: 200,
        currency: "coins",
        category: "cosmetic",
        icon: "🟢",
        owned: false,
      },
      {
        id: "player_gold",
        name: "Golden Player",
        description: "Shine with a golden glow",
        price: 1,
        currency: "gems",
        category: "cosmetic",
        icon: "🟡",
        owned: false,
      },
      {
        id: "rainbow_trail",
        name: "Rainbow Trail",
        description: "Leave a colorful trail behind you",
        price: 3,
        currency: "gems",
        category: "cosmetic",
        icon: "🌈",
        owned: false,
      },

      // Boosts
      {
        id: "double_coins",
        name: "Double Coins",
        description: "Earn 2x coins for the next 5 games",
        price: 100,
        currency: "coins",
        category: "boost",
        icon: "💰",
        owned: false,
      },
      {
        id: "extra_health",
        name: "Extra Health",
        description: "Start with +1 health for the next game",
        price: 150,
        currency: "coins",
        category: "boost",
        icon: "❤️",
        owned: false,
      },
      {
        id: "time_bonus",
        name: "Time Bonus",
        description: "Get +5 seconds for each question in the next game",
        price: 200,
        currency: "coins",
        category: "boost",
        icon: "⏰",
        owned: false,
      },
    ];
  };

  const filteredItems = shopItems.filter(item => item.category === selectedCategory);

  const handlePurchase = async (itemId: string) => {
    if (!isAuthenticated) {
      alert("Please sign in to make purchases!");
      return;
    }

    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;

    // Check if user has enough currency
    const requiredAmount = item.price;
    const userAmount = item.currency === "coins" ? userCurrency.coins : userCurrency.gems;
    
    if (userAmount < requiredAmount) {
      alert(`Not enough ${item.currency}! You need ${requiredAmount} but only have ${userAmount}.`);
      return;
    }

    setPurchasing(itemId);
    
    try {
      const response = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ itemId }),
      });

      if (response.ok) {
        // Update local state
        setShopItems(prev => prev.map(i => 
          i.id === itemId ? { ...i, owned: true } : i
        ));
        
        // Update currency
        setUserCurrency(prev => ({
          ...prev,
          [item.currency]: prev[item.currency] - item.price
        }));
        
        alert(`Successfully purchased ${item.name}!`);
      } else {
        const error = await response.json();
        alert(error.message || "Purchase failed. Please try again.");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Purchase failed. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "powerup": return <Zap className="w-5 h-5" />;
      case "cosmetic": return <Palette className="w-5 h-5" />;
      case "boost": return <Heart className="w-5 h-5" />;
      default: return <ShoppingCart className="w-5 h-5" />;
    }
  };

  const getCurrencyIcon = (currency: string) => {
    return currency === "coins" ? <Coins className="w-4 h-4" /> : <Gem className="w-4 h-4" />;
  };

  const getCurrencyColor = (currency: string) => {
    return currency === "coins" ? "text-yellow-300" : "text-purple-300";
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
            <ShoppingCart className="w-6 h-6 text-purple-300" />
            Shop
          </h1>
        </div>
        
        {/* Currency Display */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-gray-800/50 px-3 py-2 rounded-lg">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 font-mono">{formatScore(userCurrency.coins)}</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-800/50 px-3 py-2 rounded-lg">
            <Gem className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 font-mono">{userCurrency.gems}</span>
          </div>
        </div>
      </div>

      {/* Auth Warning for Guests */}
      {!isAuthenticated && (
        <div className="bg-yellow-900/30 border-b border-yellow-600/30 p-4">
          <div className="container mx-auto max-w-6xl text-center">
            <p className="text-yellow-200">
              🔒 Sign in to purchase items and keep them across devices.{" "}
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
          {/* Category Tabs */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { key: "powerup", label: "Power-ups", desc: "Enhance your abilities" },
                { key: "cosmetic", label: "Cosmetics", desc: "Customize your look" },
                { key: "boost", label: "Boosts", desc: "Temporary advantages" },
              ].map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key as any)}
                  className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all min-w-32 ${
                    selectedCategory === key
                      ? "border-purple-400 bg-purple-900/30"
                      : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                  }`}
                >
                  {getCategoryIcon(key)}
                  <span className="font-bold text-white mt-2">{label}</span>
                  <span className="text-xs text-gray-400 mt-1">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-300">Loading shop items...</p>
            </div>
          ) : (
            /* Items Grid */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border transition-all ${
                    item.owned 
                      ? "border-green-500 bg-green-900/20" 
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">{item.icon}</div>
                    {item.owned && (
                      <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                        OWNED
                      </div>
                    )}
                  </div>

                  {/* Item Info */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                    <p className="text-sm text-gray-300 min-h-10">{item.description}</p>
                  </div>

                  {/* Price and Purchase */}
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1 ${getCurrencyColor(item.currency)}`}>
                      {getCurrencyIcon(item.currency)}
                      <span className="font-bold">{item.price}</span>
                    </div>

                    {item.owned ? (
                      <button
                        disabled
                        className="px-4 py-2 bg-green-600 text-white rounded font-medium opacity-50 cursor-not-allowed"
                      >
                        Owned
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePurchase(item.id)}
                        disabled={purchasing === item.id || !isAuthenticated}
                        className={`px-4 py-2 font-medium rounded transition-all ${
                          purchasing === item.id
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : isAuthenticated
                            ? "bg-purple-600 hover:bg-purple-500 text-white"
                            : "bg-gray-600 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {purchasing === item.id ? "Buying..." : "Buy"}
                      </button>
                    )}
                  </div>

                  {/* Currency Check Warning */}
                  {isAuthenticated && !item.owned && (
                    <div className="mt-2">
                      {(item.currency === "coins" ? userCurrency.coins : userCurrency.gems) < item.price && (
                        <p className="text-xs text-red-300">
                          Not enough {item.currency}!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {filteredItems.length === 0 && !loading && (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No items available in this category yet.</p>
            </div>
          )}

          {/* Earn Currency Section */}
          <div className="mt-12 bg-gradient-to-r from-yellow-900/20 to-purple-900/20 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 text-center">How to Earn Currency</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center">
                <Coins className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <h3 className="font-bold text-yellow-300 mb-2">Coins</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Complete games (+50 per game)</li>
                  <li>• Achieve high accuracy (+bonus)</li>
                  <li>• Survive multiple waves (+bonus)</li>
                  <li>• Daily login rewards</li>
                </ul>
              </div>
              
              <div className="text-center">
                <Gem className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <h3 className="font-bold text-purple-300 mb-2">Gems</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Weekly challenges (1-3 gems)</li>
                  <li>• New personal best scores</li>
                  <li>• Special events and tournaments</li>
                  <li>• Achievement rewards</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
