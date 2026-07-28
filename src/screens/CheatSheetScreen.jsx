import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  Search,
  X,
  Info,
  Timer,
  CircleDot,
  CircleGauge,
  Gauge,
  CreditCard,
  Wrench,
  HeartPulse,
  Banknote,
  ListChecks,
  Link as LinkIcon,
  FileBadge,
  GraduationCap,
} from "lucide-react";
import { CHEAT_SHEET_CATEGORIES, CHEAT_SHEET_META, localizeText } from "../../shared/data/cheatSheetData";
import { ACCENT_FROM } from "../theme";

// Data faylida ikon nomi matn sifatida saqlanadi (masalan "Timer") —
// bu yerda haqiqiy komponentga xaritalanadi.
const ICONS = {
  Timer,
  CircleDot,
  CircleGauge,
  Gauge,
  CreditCard,
  Wrench,
  HeartPulse,
  Banknote,
  ListChecks,
  Link: LinkIcon,
  FileBadge,
  GraduationCap,
};

/**
 * SHPARGALKA — YHQ bo'yicha muhim raqamli faktlar to'plami.
 *
 * DIZAYN QARORI: bitta-bittalab "flashcard" (swipe qilib o'tiladigan karta)
 * emas, balki BITTA uzluksiz skroll — barcha faktlar bir vaqtda ko'rinadi,
 * qidiruv va kategoriya bo'yicha filtrlash bilan. Sabab: bu bo'lim imtihon
 * oldidan tez-tez "eslab qolish/qayta ko'rib chiqish" uchun ishlatiladi —
 * bitta faktni ko'rish uchun o'ttizta marta suring, deyish noqulay;
 * ko'z yugurtirib chiqish (skim) ancha samarali.
 */
export default function CheatSheetScreen({ onBack }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null); // null = hammasi

  const totalFacts = useMemo(
    () => CHEAT_SHEET_CATEGORIES.reduce((sum, c) => sum + c.facts.length, 0),
    []
  );

  const normalizedQuery = query.trim().toLowerCase();

  const visibleCategories = useMemo(() => {
    return CHEAT_SHEET_CATEGORIES.map((cat) => {
      let facts = cat.facts;

      if (normalizedQuery) {
        facts = facts.filter((f) => {
          const label = localizeText(f.label, lang).toLowerCase();
          const value = localizeText(f.value, lang).toLowerCase();
          return label.includes(normalizedQuery) || value.includes(normalizedQuery);
        });
      } else if (activeCategory && cat.key !== activeCategory) {
        facts = [];
      }

      return { ...cat, facts };
    }).filter((cat) => cat.facts.length > 0);
  }, [normalizedQuery, activeCategory, lang]);

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-app min-h-full animate-slide-in">
      {/* Sarlavha */}
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="var(--icon-muted)" />
        </button>
        <h1 className="text-2xl font-extrabold text-text-main">{t("cheatSheet.title")}</h1>
      </div>
      <p className="text-text-muted text-sm mt-1 mb-4 ml-12">
        {t("cheatSheet.subtitle", { count: totalFacts })}
      </p>

      {/* Qidiruv */}
      <div className="relative">
        <Search size={17} color="#9CA3AF" className="absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("cheatSheet.searchPlaceholder")}
          className="w-full rounded-2xl bg-card border border-card-border shadow-sm pl-11 pr-10 py-3 text-sm text-text-main placeholder:text-[var(--text-secondary)] outline-none focus:ring-2"
          style={{ "--tw-ring-color": ACCENT_FROM }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card-soft flex items-center justify-center"
          >
            <X size={13} color="#6B7280" />
          </button>
        )}
      </div>

      {/* Kategoriya chip'lari — qidiruv vaqtida yashiriladi, chunki natija
          allaqachon barcha kategoriyalar bo'yicha filtrlangan */}
      {!query && (
        <div className="flex gap-2 overflow-x-auto mt-4 pb-1 -mx-5 px-5 no-scrollbar">
          <CategoryChip
            label={t("cheatSheet.allCategories")}
            active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
          />
          {CHEAT_SHEET_CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.key}
              label={localizeText(cat.title, lang)}
              active={activeCategory === cat.key}
              onClick={() => setActiveCategory(cat.key)}
            />
          ))}
        </div>
      )}

      {/* Faktlar — kategoriya bo'yicha guruhlangan kartalar */}
      <div className="mt-4 space-y-4">
        {visibleCategories.length === 0 ? (
          <p className="text-center text-text-muted text-sm mt-10">
            {t("cheatSheet.noResults")}
          </p>
        ) : (
          visibleCategories.map((cat) => (
            <CategoryCard key={cat.key} category={cat} lang={lang} />
          ))
        )}
      </div>

      {/* Manbalar */}
      {!query && (
        <p className="text-[10.5px] leading-relaxed text-center mt-6 px-2" style={{ color: "var(--text-secondary)" }}>
          {localizeText(CHEAT_SHEET_META.sourcesNote, lang)}
        </p>
      )}
    </div>
  );
}

function CategoryChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition-transform active:scale-95"
      style={
        active
          ? {
              background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
              color: "#FFFFFF",
              boxShadow: "0 6px 16px color-mix(in srgb, var(--accent-from) 35%, transparent)",
            }
          : {
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              color: "var(--text-secondary)",
            }
      }
    >
      {label}
    </button>
  );
}

function CategoryCard({ category, lang }) {
  const Icon = ICONS[category.icon] || Info;
  return (
    <div className="rounded-[22px] bg-card border border-card-border shadow-sm overflow-hidden">
      {/* Kategoriya sarlavhasi */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "color-mix(in srgb, var(--accent-from) 16%, transparent)" }}
        >
          <Icon size={15} color="var(--accent-from)" />
        </div>
        <h3 className="text-[13.5px] font-extrabold flex-1 min-w-0" style={{ color: "var(--text-primary)" }}>
          {localizeText(category.title, lang)}
        </h3>
        <span
          className="text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0"
          style={{ background: "var(--track)", color: "var(--text-secondary)" }}
        >
          {category.facts.length}
        </span>
      </div>

      {/* Faktlar ro'yxati */}
      <div>
        {category.facts.map((fact, i) => (
          <div
            key={fact.id}
            className="flex items-center justify-between gap-4 px-4 py-3"
            style={i > 0 ? { borderTop: "1px solid var(--border-card)" } : undefined}
          >
            <span className="text-[12.5px] leading-snug flex-1 min-w-0" style={{ color: "var(--text-secondary)" }}>
              {localizeText(fact.label, lang)}
            </span>
            <span
              className="text-[14px] font-extrabold text-right shrink-0 tabular-nums"
              style={{ color: "var(--accent-from)" }}
            >
              {localizeText(fact.value, lang)}
            </span>
          </div>
        ))}
      </div>

      {/* Kategoriya izohi (bo'lsa) */}
      {category.note && (
        <div className="px-4 pb-4 pt-1">
          <p className="text-[11px] leading-relaxed italic" style={{ color: "var(--text-secondary)" }}>
            {localizeText(category.note, lang)}
          </p>
        </div>
      )}
    </div>
  );
}
