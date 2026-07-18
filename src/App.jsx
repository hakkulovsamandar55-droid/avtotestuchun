import React, { useState } from "react";
import LoginScreen from "./screens/LoginScreen";
import LoadingScreen from "./screens/LoadingScreen";
import MainApp from "./screens/MainApp";

// TezPrava — Login -> Loading -> Asosiy ilova (3 bo'lim)
export default function App() {
  const [stage, setStage] = useState("login"); // login -> loading -> app
  const [user, setUser] = useState(null);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setStage("loading");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-950 py-8">
      {/* Telefon ramkasi */}
      <div className="relative w-[390px] h-[820px] rounded-[46px] border-[10px] border-black bg-black shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-black rounded-b-2xl z-20" />
        <div className="w-full h-full overflow-hidden rounded-[36px]">
          {stage === "login" && <LoginScreen onLogin={handleLogin} />}
          {stage === "loading" && (
            <LoadingScreen onDone={() => setStage("app")} />
          )}
          {stage === "app" && <MainApp user={user} />}
        </div>
      </div>
    </div>
  );
}
