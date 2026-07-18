import React, { useState } from "react";
import BottomNav from "../components/BottomNav";
import HomeTab from "./HomeTab";
import StatsTab from "./StatsTab";
import SettingsTab from "./SettingsTab";
import TicketsScreen from "./TicketsScreen";
import AdminPanelScreen from "./AdminPanelScreen";

// 3-EKRAN: login+loading dan keyingi asosiy ilova — 3 bo'lim + pastki nav
export default function MainApp({ user }) {
  const [active, setActive] = useState("home");
  const [showTickets, setShowTickets] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  if (showTickets) {
    return (
      <div className="flex flex-col h-full">
        <TicketsScreen onBack={() => setShowTickets(false)} />
      </div>
    );
  }

  if (showAdmin) {
    return (
      <div className="flex flex-col h-full">
        <AdminPanelScreen onBack={() => setShowAdmin(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F7F7FA]">
      {active === "home" && <HomeTab onOpenTickets={() => setShowTickets(true)} />}
      {active === "stats" && <StatsTab />}
      {active === "settings" && (
        <SettingsTab
          user={user}
          onOpenAdmin={() => setShowAdmin(true)}
        />
      )}
      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}
