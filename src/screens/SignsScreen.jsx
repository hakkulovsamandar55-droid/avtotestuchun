import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_META,
  getSignsByCategory,
  searchSigns,
  TOTAL_SIGNS,
  SIGNS,
} from "../data/signsData";
import SignIcon from "../components/SignIcon";
import { ACCENT_FROM, ACCENT_TO } from "../theme";

// Yo'l belgilarini o'rganish — asosiy ekran: qidiruv + kategoriyalar ro'yxati
export default function SignsScreen({ onBack }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [openCategory, setOpenCategory] = useState(null);
  const [selectedSign, setSelectedSign] = useState(null);

  const results = useMemo(() => searchSigns(query), [query]);

  if (selectedSign) {
    return (
      <SignDetail
        sign={selectedSign}
        onBack={() => setSelectedSign(null)}
      />
    );
  }

  if (openCategory) {
    return (
      <CategoryView
        catKey={openCategory}
        onBack={() => setOpenCategory(null)}
        onSelectSign={setSelectedSign}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6 bg-app min-h-full">
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="var(--icon-muted)" />
        </button>
        <h1 className="text-2xl font-extrabold text-text-main">
          {t("signs.title")}
        </h1>
      </div>
      <p className="text-text-muted text-sm mt-1 mb-4 ml-12">
        {t("signs.subtitle", { count: TOTAL_SIGNS })}
      </p>

      {/* Qidiruv */}
      <div className="relative">
        <Search
          size={17}
          color="#9CA3AF"
          className="absolute left-4 top-1/2 -translate-y-1/2"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("signs.searchPlaceholder")}
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

      {/* Qidiruv natijalari */}
      {query ? (
        <div className="mt-4 space-y-2">
          {results.length === 0 ? (
            <p className="text-center text-text-muted text-sm mt-10">
              {t("signs.noResults")}
            </p>
          ) : (
            results.map((sign) => (
              <SignRow
                key={sign.code}
                sign={sign}
                onClick={() => setSelectedSign(sign)}
              />
            ))
          )}
        </div>
      ) : (
        <>
          {/* Kategoriyalar */}
          <div className="mt-5 space-y-3">
            {CATEGORIES.map((catKey) => {
              const meta = CATEGORY_META[catKey];
              const items = getSignsByCategory(catKey);
              const preview = items.slice(0, 4);
              return (
                <button
                  key={catKey}
                  onClick={() => setOpenCategory(catKey)}
                  className="w-full text-left rounded-3xl bg-card border border-card-border shadow-sm p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: meta.bg }}
                    >
                      <CategoryDot color={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-main text-sm">
                        {t(`signs.categories.${catKey}`)}
                      </p>
                      <p className="text-text-muted text-xs mt-0.5">
                        {t("signs.signCount", { count: items.length })}
                      </p>
                    </div>
                    <ChevronRight size={18} color="var(--chevron)" />
                  </div>
                  <div className="flex items-center gap-2 mt-3 pl-0.5">
                    {preview.map((s) => (
                      <div
                        key={s.code}
                        className="w-11 h-11 rounded-xl bg-card-soft flex items-center justify-center"
                      >
                        <SignIcon code={s.code} shape={s.shape} pic={s.pic} size={38} />
                      </div>
                    ))}
                    {items.length > 4 && (
                      <div className="w-11 h-11 rounded-xl bg-card-soft flex items-center justify-center text-text-muted text-xs font-semibold">
                        +{items.length - 4}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function CategoryDot({ color }) {
  return (
    <div
      className="w-5 h-5 rounded-md"
      style={{ backgroundColor: color }}
    />
  );
}

function SignRow({ sign, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-2xl bg-card border border-card-border shadow-sm px-3.5 py-3 text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-card-soft flex items-center justify-center shrink-0">
        <SignIcon code={sign.code} shape={sign.shape} pic={sign.pic} size={40} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-main text-sm truncate">
          {sign.name}
        </p>
        <p className="text-text-muted text-xs">{sign.code}</p>
      </div>
      <ChevronRight size={16} color="var(--chevron)" />
    </button>
  );
}

function CategoryView({ catKey, onBack, onSelectSign }) {
  const { t } = useTranslation();
  const meta = CATEGORY_META[catKey];
  const items = getSignsByCategory(catKey);

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6 bg-app min-h-full">
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="var(--icon-muted)" />
        </button>
        <h1 className="text-xl font-extrabold text-text-main leading-tight">
          {t(`signs.categories.${catKey}`)}
        </h1>
      </div>
      <p className="text-text-muted text-sm mt-1 mb-4 ml-12">
        {t("signs.signCount", { count: items.length })}
      </p>

      <div className="grid grid-cols-3 gap-3">
        {items.map((sign) => (
          <button
            key={sign.code}
            onClick={() => onSelectSign(sign)}
            className="rounded-2xl bg-card border border-card-border shadow-sm p-2.5 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 flex items-center justify-center">
              <SignIcon code={sign.code} shape={sign.shape} pic={sign.pic} size={56} />
            </div>
            <p className="text-[10px] font-bold text-text-muted">{sign.code}</p>
            <p
              className="text-[11px] font-medium text-text-main text-center leading-tight"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {sign.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function SignDetail({ sign, onBack }) {
  const { t } = useTranslation();
  const meta = CATEGORY_META[sign.cat];

  // Shu kategoriyadagi qo'shni belgilar (o'xshashlarni ko'rish uchun)
  const siblings = useMemo(
    () => getSignsByCategory(sign.cat).filter((s) => s.code !== sign.code).slice(0, 6),
    [sign]
  );

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6 bg-app min-h-full">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="var(--icon-muted)" />
        </button>
        <p className="text-text-muted text-sm font-medium">
          {t(`signs.categories.${sign.cat}`)}
        </p>
      </div>

      <div
        className="rounded-3xl p-6 text-center"
        style={{
          background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})`,
        }}
      >
        <div className="w-32 h-32 mx-auto rounded-3xl bg-white flex items-center justify-center shadow-lg">
          <SignIcon code={sign.code} shape={sign.shape} pic={sign.pic} size={104} />
        </div>
        <p className="text-white/80 text-xs font-bold tracking-wide mt-4 uppercase">
          {sign.code}
        </p>
        <h2 className="text-white text-xl font-extrabold mt-1 leading-snug">
          {sign.name}
        </h2>
      </div>

      <div className="mt-4 rounded-2xl bg-card border border-card-border shadow-sm p-4">
        <p className="text-text-muted text-sm leading-relaxed">
          {t("signs.detailHint")}
        </p>
      </div>

      {siblings.length > 0 && (
        <>
          <p className="text-text-muted text-sm font-semibold mt-5 mb-2.5">
            {t("signs.similarSigns")}
          </p>
          <div className="grid grid-cols-4 gap-2.5">
            {siblings.map((s) => (
              <button
                key={s.code}
                className="rounded-xl bg-card border border-card-border shadow-sm p-2 flex flex-col items-center gap-1"
              >
                <SignIcon code={s.code} shape={s.shape} pic={s.pic} size={40} />
                <p className="text-[9px] font-bold text-text-muted">{s.code}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
