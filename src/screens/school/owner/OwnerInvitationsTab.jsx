import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Copy, Check, Ban, X } from "lucide-react";
import { api } from "../../../api";

function CodeRow({ invitation, groupName, onRevoke, busy }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const isRevoked = Boolean(invitation.revokedAt);
  const isExpired = invitation.expiresAt && new Date(invitation.expiresAt) < new Date();
  const isExhausted = invitation.maxUses != null && invitation.usedCount >= invitation.maxUses;
  const isDead = isRevoked || isExpired || isExhausted;

  function copy() {
    navigator.clipboard?.writeText(invitation.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isDead ? "border-white/5 bg-white/[0.01] opacity-50" : "border-white/[0.06] bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono font-bold text-sm tracking-wider">{invitation.code}</span>
        <button
          onClick={copy}
          disabled={isDead}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center disabled:opacity-40"
        >
          {copied ? <Check size={14} color="#34D399" /> : <Copy size={14} color="#9CA3AF" />}
        </button>
      </div>
      <p className="text-gray-500 text-[11px]">
        {groupName || t("school.wholeSchool")} ·{" "}
        {invitation.maxUses
          ? `${invitation.usedCount}/${invitation.maxUses} ${t("school.used")}`
          : `${invitation.usedCount} ${t("school.used")}`}
      </p>
      {isRevoked && <p className="text-red-400 text-[11px] mt-1">{t("school.revoked")}</p>}
      {!isRevoked && isExpired && <p className="text-red-400 text-[11px] mt-1">{t("school.expired")}</p>}
      {!isRevoked && !isExpired && isExhausted && (
        <p className="text-red-400 text-[11px] mt-1">{t("school.exhausted")}</p>
      )}

      {!isDead && (
        <button
          onClick={() => onRevoke(invitation.id)}
          disabled={busy === invitation.id}
          className="mt-3 w-full rounded-xl py-2 text-xs font-semibold text-red-400 border border-red-500/30 bg-red-500/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Ban size={12} /> {t("school.revokeCode")}
        </button>
      )}
    </div>
  );
}

/** Owner/Teacher: taklif kodlarini boshqarish. */
export default function OwnerInvitationsTab({ schoolId, onChanged }) {
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState(""); // "" = butun maktab
  const [maxUses, setMaxUses] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, groupsRes] = await Promise.all([
        api.schoolInvitations(schoolId),
        api.schoolGroups(schoolId),
      ]);
      setInvitations(invRes.invitations || []);
      setGroups(groupsRes.groups || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    setCreating(true);
    setError("");
    try {
      // <select> qiymati HAR DOIM matn ("3"), backend esa son kutadi va
      // o'qituvchi tekshiruvida qat'iy (===) solishtiradi. Shu yerda
      // konvertatsiya qilmasak, o'qituvchi o'z guruhi uchun ham kod
      // yarata olmasdi ("3" !== 3).
      const isGroup = targetGroupId !== "";
      await api.schoolCreateInvitation(schoolId, {
        type: isGroup ? "GROUP" : "SCHOOL",
        groupId: isGroup ? Number(targetGroupId) : null,
        maxUses: maxUses !== "" ? Number(maxUses) : null,
      });
      setShowCreate(false);
      setTargetGroupId("");
      setMaxUses("");
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(invitationId) {
    setBusy(invitationId);
    try {
      await api.schoolRevokeInvitation(schoolId, invitationId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const groupName = (id) => groups.find((g) => g.id === id)?.name;

  return (
    <div className="pb-4">
      <button
        onClick={() => setShowCreate(true)}
        className="w-full mb-4 rounded-2xl py-3 font-bold text-sm text-white flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(90deg, var(--accent-from), var(--accent-to))" }}
      >
        <Plus size={16} />
        {t("school.newInvitation")}
      </button>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {loading && (
        <div className="flex justify-center py-8">
          <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {!loading && invitations.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-8">{t("school.noInvitations")}</p>
      )}

      <div className="grid grid-cols-1 gap-2.5">
        {invitations.map((inv) => (
          <CodeRow
            key={inv.id}
            invitation={inv}
            groupName={groupName(inv.groupId)}
            onRevoke={handleRevoke}
            busy={busy}
          />
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-5 pb-8">
          <div className="w-full max-w-sm rounded-3xl bg-[#161B2E] border border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-base">{t("school.newInvitation")}</p>
              <button
                onClick={() => setShowCreate(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
              >
                <X size={16} color="#E5E7EB" />
              </button>
            </div>

            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              {t("school.targetGroup")}
            </label>
            <select
              value={targetGroupId}
              onChange={(e) => setTargetGroupId(e.target.value)}
              className="w-full rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm text-white mb-4 focus:outline-none focus:border-white/30"
            >
              <option value="">{t("school.wholeSchool")}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              {t("school.maxUsesOptional")}
            </label>
            <input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder={t("school.unlimitedPlaceholder")}
              className="w-full rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-600 mb-5 focus:outline-none focus:border-white/30"
            />

            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full rounded-2xl py-3 font-bold text-sm text-white disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, var(--accent-from), var(--accent-to))" }}
            >
              {creating ? t("school.creating") : t("school.createButton")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
