import React from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  Train,
  TrafficCone,
  GitFork,
  Gauge,
  CircleParking,
  CornerUpRight,
  TriangleAlert,
  Footprints,
  Package,
  Wrench,
  HeartPulse,
  Scale,
  BookOpen,
  Signpost,
  Minus,
} from "lucide-react";
import { getAllQuestions } from "../../shared/data/ticketsData";
import { getTopicSummary } from "../../shared/data/questionTopics";

// Mavzu kaliti -> ikonka. questionTopics.js da faqat ikonka NOMI saqlanadi
// (u shared/ da va lucide-react ga bog'liq bo'lmasligi kerak — backend ham
// shu faylni o'qiydi).
const ICONS = {
  train: Train,
  "traffic-cone": TrafficCone,
  "git-fork": GitFork,
  gauge: Gauge,
  "circle-parking": CircleParking,
  "corner-up-right": CornerUpRight,
  "triangle-alert": TriangleAlert,
  footprints: Footprints,
  package: Package,
  wrench: Wrench,
  "heart-pulse": HeartPulse,
  scale: Scale,
  signpost: Signpost,
  minus: Minus,
  "book-open": BookOpen,
};

/**
 * MAVZULI TESTLAR — mavzu tanlash ekrani.
 *
 * Mavzular savol MATNI bo'yicha avtomatik aniqlanadi (questionTopics.js),
 * chunki savollar bazasida mavzu maydoni yo'q. Har mavzuda savol soni
 * ko'rsatiladi — foydalanuvchi qancha material borligini biladi.
 */
export default function TopicTestsScreen({ onBack, onStartTopic }) {
  const { t } = useTranslation();
  const topics = getTopicSummary(getAllQuestions());

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 animate-slide-in">
      <div className="flex items-center gap-3 py-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card-soft border border-card-border flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={17} color="var(--icon-muted)" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
            {t("home.topicTests")}
          </h1>
          <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
            {t("topics.subtitle", { count: topics.length })}
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {topics.map((topic) => {
          const Icon = ICONS[topic.icon] || BookOpen;
          return (
            <button
              key={topic.key}
              onClick={() => onStartTopic(topic.key)}
              className="w-full flex items-center gap-3.5 rounded-2xl bg-card border border-card-border px-4 py-3.5 text-left active:scale-[0.99] transition-transform"
            >
              <div
                className="w-10 h-10 rounded-xl bg-card-soft flex items-center justify-center shrink-0"
              >
                <Icon size={18} color="var(--accent-from)" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold" style={{ color: "var(--text-primary)" }}>
                  {t(`topics.names.${topic.key}`)}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {t("topics.questionCount", { count: topic.count })}
                </p>
              </div>
              <ChevronRight size={16} color="var(--chevron)" className="shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
