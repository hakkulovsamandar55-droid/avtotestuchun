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
    <div className="h-screen w-full overflow-hidden bg-[#0B0B14] dark:bg-[#0B0B14]">
      {stage === "login" && <LoginScreen onLogin={handleLogin} />}
      {stage === "loading" && <LoadingScreen onDone={() => setStage("app")} />}
      {stage === "app" && <MainApp user={user} />}
    </div>
  );
}
