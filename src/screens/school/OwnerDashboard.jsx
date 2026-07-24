import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, School } from "lucide-react";
import { api } from "../../api";
import OwnerOverviewTab from "./owner/OwnerOverviewTab";
import OwnerTeachersTab from "./owner/OwnerTeachersTab";
import OwnerGroupsTab from "./owner/OwnerGroupsTab";
import OwnerStudentsTab from "./owner/OwnerStudentsTab";
import OwnerInvitationsTab from "./owner/OwnerInvitationsTab";
import TeacherDashboard from "./TeacherDashboard";

const TABS = ["overview", "teachers", "groups", "students", "invitations"];

/** Maktab egasi (Owner) paneli — CEO ham xuddi shu ekranni ko'radi (isCeo=true bilan). */
export default function OwnerDashboard({ schoolId, myMembershipId, onBack }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("overview");
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [openGroupId, setOpenGroupId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.schoolGet(schoolId);
      setSchool(res.school);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => setRefreshKey((k) => k + 1);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center bg-[#0F1424] min-h-full">
        <span className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="flex-1 bg-[#0F1424] min-h-full px-5 tp-safe-top text-white">
        <p className="text-red-400 text-sm text-center py-10">{error || "—"}</p>
      </div>
    );
  }

  // Owner guruhni bosganda o'qituvchi panelini ko'radi.
  //
  // NIMA UCHUN: kichik maktabda egasi ko'pincha o'zi ham dars beradi, lekin
  // avval Owner faqat Owner panelini ko'rardi — talaba statistikasi va
  // topshiriq berish unga yopiq edi. Backend allaqachon Owner'ga barcha
  // guruhlarga ruxsat beradi, faqat UI yo'q edi.
  if (openGroupId != null) {
    return (
      <TeacherDashboard
        schoolId={schoolId}
        groupId={openGroupId}
        myMembershipId={myMembershipId}
        onBack={() => setOpenGroupId(null)}
        onOpenLeaderboard={() => {}}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white animate-slide-in">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="#E5E7EB" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <School size={16} color="#9CA3AF" className="shrink-0" />
          <h1 className="text-lg font-extrabold truncate">{school.name}</h1>
        </div>
      </div>

      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap"
            style={
              tab === key
                ? { background: "linear-gradient(90deg, var(--accent-from), var(--accent-to))", color: "white" }
                : { background: "rgba(255,255,255,0.05)", color: "#9CA3AF", border: "1px solid rgba(255,255,255,0.08)" }
            }
          >
            {t(`school.ownerTab.${key}`)}
          </button>
        ))}
      </div>

      {tab === "overview" && <OwnerOverviewTab schoolId={schoolId} school={school} onSchoolUpdated={setSchool} />}
      {tab === "teachers" && (
        <OwnerTeachersTab key={refreshKey} schoolId={schoolId} onChanged={refresh} />
      )}
      {tab === "groups" && (
        <OwnerGroupsTab
          key={refreshKey}
          schoolId={schoolId}
          onChanged={refresh}
          onOpenGroup={setOpenGroupId}
        />
      )}
      {tab === "students" && <OwnerStudentsTab key={refreshKey} schoolId={schoolId} onChanged={refresh} />}
      {tab === "invitations" && (
        <OwnerInvitationsTab key={refreshKey} schoolId={schoolId} onChanged={refresh} />
      )}
    </div>
  );
}
