import React, { useState } from "react";
import BottomNav from "../components/BottomNav";
import HomeTab from "./HomeTab";
import StatsTab from "./StatsTab";
import SettingsTab from "./SettingsTab";
import TicketsScreen from "./TicketsScreen";
import TestScreen from "./TestScreen";
import SignsScreen from "./SignsScreen";
import AdminPanelScreen from "./AdminPanelScreen";

// 3-EKRAN: login+loading dan keyingi asosiy ilova — 3 bo'lim + pastki nav
export default function MainApp({ user }) {
  const [active, setActive] = useState("home");
  const [showTickets, setShowTickets] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [showSigns, setShowSigns] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  if (activeTicket !== null) {
    return (
      <div className="flex flex-col h-full">
        <TestScreen
          ticketNumber={activeTicket}
          onExit={() => setActiveTicket(null)}
        />
      </div>
    );
  }

  if (showTickets) {
    return (
      <div className="flex flex-col h-full">
        <TicketsScreen
          onBack={() => setShowTickets(false)}
          onSelectTicket={(num) => setActiveTicket(num)}
        />
      </div>
    );
  }

  if (showSigns) {
    return (
      <div className="flex flex-col h-full">
        <SignsScreen onBack={() => setShowSigns(false)} />
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
      {active === "home" && (
        <HomeTab
          onOpenTickets={() => setShowTickets(true)}
          onOpenSigns={() => setShowSigns(true)}
        />
      )}
      {active === "stats" && <StatsTab />}
      {active === "settings" && (
        <SettingsTab user={user} onOpenAdmin={() => setShowAdmin(true)} />
      )}
      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}
