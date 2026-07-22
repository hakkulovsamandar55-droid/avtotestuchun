import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { api } from "../../api";
import JoinSchoolScreen from "./JoinSchoolScreen";
import StudentSchoolTab from "./StudentSchoolTab";
import GroupLeaderboardScreen from "./GroupLeaderboardScreen";
import TeacherDashboard from "./TeacherDashboard";
import OwnerDashboard from "./OwnerDashboard";

/**
 * "Mening maktabim" bo'limining kirish nuqtasi — rolga qarab to'g'ri
 * oqimga yo'naltiradi:
 *
 *   a'zo emas          -> JoinSchoolScreen
 *   STUDENT             -> StudentSchoolTab (+ Leaderboard)
 *   TEACHER             -> TeacherDashboard (o'z guruhi)
 *   OWNER               -> OwnerDashboard (butun maktab)
 *
 * Rol backend orqali (/api/school/me) aniqlanadi — frontendda taxmin
 * qilinmaydi. Bu xavfsizlik chegarasi emas (backend baribir har bir
 * so'rovda o'zi tekshiradi), lekin noto'g'ri ekranni ko'rsatish
 * foydalanuvchi tajribasini buzadi.
 */
export default function StudentSchoolContainer({ currentUserId, onExit }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState(null);
  const [error, setError] = useState("");

  const [stage, setStage] = useState("main"); // main | join | leaderboard
  const [leaderboardCtx, setLeaderboardCtx] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.schoolMe();
      setMembership(
        res.membership ? { ...res.membership, school: res.school, group: res.group } : null
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleJoined() {
    setStage("main");
    load();
  }

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center bg-[#0F1424] min-h-full">
        <span className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-[#0F1424] min-h-full px-5 tp-safe-top text-white">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={onExit}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
          >
            <ChevronLeft size={20} color="#E5E7EB" />
          </button>
        </div>
        <p className="text-red-400 text-sm text-center py-10">{error}</p>
      </div>
    );
  }

  if (stage === "join" || !membership) {
    return (
      <JoinSchoolScreen
        onBack={membership ? () => setStage("main") : onExit}
        onJoined={handleJoined}
      />
    );
  }

  if (stage === "leaderboard" && leaderboardCtx) {
    return (
      <GroupLeaderboardScreen
        schoolId={leaderboardCtx.schoolId}
        groupId={leaderboardCtx.groupId}
        currentUserId={currentUserId}
        onBack={() => setStage("main")}
      />
    );
  }

  if (membership.role === "OWNER") {
    return <OwnerDashboard schoolId={membership.schoolId} onBack={onExit} />;
  }

  if (membership.role === "TEACHER") {
    if (!membership.groupId) {
      // O'qituvchi hali biror guruhga tayinlanmagan — bu Owner ishi,
      // xato emas, shunchaki bo'sh holat.
      return (
        <div className="flex-1 bg-[#0F1424] min-h-full px-5 tp-safe-top text-white">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={onExit}
              className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
            >
              <ChevronLeft size={20} color="#E5E7EB" />
            </button>
          </div>
          <p className="text-gray-400 text-sm text-center py-10 leading-relaxed px-4">
            {t("school.noGroupAssigned")}
          </p>
        </div>
      );
    }
    return (
      <TeacherDashboard
        schoolId={membership.schoolId}
        groupId={membership.groupId}
        onBack={onExit}
        onOpenLeaderboard={() => {
          setLeaderboardCtx({ schoolId: membership.schoolId, groupId: membership.groupId });
          setStage("leaderboard");
        }}
      />
    );
  }

  // STUDENT (default)
  return (
    <StudentSchoolTab
      onBack={onExit}
      onOpenJoin={() => setStage("join")}
      onOpenLeaderboard={(schoolId, groupId) => {
        setLeaderboardCtx({ schoolId, groupId });
        setStage("leaderboard");
      }}
    />
  );
}
