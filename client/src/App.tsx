import { Routes, Route } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { useAudio } from "./lib/stores/useAudio";
import Home from "./pages/Home";
import Tutorial from "./pages/Tutorial";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import GameResult from "./pages/GameResult";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Shop from "./pages/Shop";
import Settings from "./pages/Settings";
import Rooms from "./pages/Rooms";
import Achievements from "./pages/Achievements";
import Friends from "./pages/Friends";
import NotFound from "./pages/not-found";

function App() {
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();

  useEffect(() => {
    // Initialize audio assets
    const bgMusic = new Audio("/sounds/background.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    setBackgroundMusic(bgMusic);

    const hitSound = new Audio("/sounds/hit.mp3");
    hitSound.volume = 0.5;
    setHitSound(hitSound);

    const successSound = new Audio("/sounds/success.mp3");
    successSound.volume = 0.4;
    setSuccessSound(successSound);
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game" element={<Game />} />
          <Route path="/result" element={<GameResult />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
