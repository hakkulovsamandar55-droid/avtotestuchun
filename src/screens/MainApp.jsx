import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import BottomNav from "../components/BottomNav";
import HomeTab from "./HomeTab";
import StatsTab from "./StatsTab";
import SettingsTab from "./SettingsTab";
import TicketsScreen from "./TicketsScreen";
import TestScreen from "./TestScreen";
import ExamScreen from "./ExamScreen";
import SignsScreen from "./SignsScreen";
import AdminPanelScreen from "./AdminPanelScreen";
import PremiumScreen from "./PremiumScreen";
import DuelScreen from "./DuelScreen";
import SupportChatScreen from "./SupportChatScreen";
import PaymentScreen from "./PaymentScreen";
import OfficialExamContainer from "./officialExam/OfficialExamContainer";
import StudentSchoolContainer from "./school/StudentSchoolContainer";
import TopicTestsScreen from "./TopicTestsScreen";
import MistakesHubScreen from "./MistakesHubScreen";
import QuestionListScreen from "./QuestionListScreen";
import TrickyTestScreen from "./TrickyTestScreen";
import { getAllQuestions } from "../../shared/data/ticketsData";
import { getQuestionsForTopic } from "../../shared/data/questionTopics";

// 3-EKRAN: login+loading dan keyingi asosiy ilova — 3 bo'lim + pastki nav
export default function MainApp({ user }) {
  const { t } = useTranslation();
  const [active, setActive] = useState("home");
  const [showTickets, setShowTickets] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [showExam, setShowExam] = useState(false); // mashq imtihoni (eski)
  const [showOfficialExam, setShowOfficialExam] = useState(false); // rasmiy imtihon (yangi)
  const [showSigns, setShowSigns] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showDuel, setShowDuel] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showSchool, setShowSchool] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [showMistakes, setShowMistakes] = useState(false);
  const [showTricky, setShowTricky] = useState(false);
  // questionList: null | "saved" | "mistakes" | "hardest"
  const [questionList, setQuestionList] = useState(null);
  // Mavzuli test: tanlangan mavzu kaliti
  const [topicKey, setTopicKey] = useState(null);
  const [paymentPlan, setPaymentPlan] = useState(null);

  if (showOfficialExam) {
    return (
      <div className="flex flex-col h-full">
        <OfficialExamContainer
          onExit={() => setShowOfficialExam(false)}
          onOpenPremium={() => {
            setShowOfficialExam(false);
            setShowPremium(true);
          }}
        />
      </div>
    );
  }

  if (showSchool) {
    return (
      <div className="flex flex-col h-full">
        <StudentSchoolContainer
          currentUserId={user?.id}
          onExit={() => setShowSchool(false)}
        />
      </div>
    );
  }

  if (showExam) {
    return (
      <div className="flex flex-col h-full">
        <ExamScreen onExit={() => setShowExam(false)} />
      </div>
    );
  }

  if (showPremium) {
    if (paymentPlan) {
      return (
        <div className="flex flex-col h-full">
          <PaymentScreen
            plan={paymentPlan}
            onBack={() => setPaymentPlan(null)}
            onOpenSupport={() => {
              setPaymentPlan(null);
              setShowPremium(false);
              setShowSupport(true);
            }}
          />
        </div>
      );
    }
    return (
      <div className="flex flex-col h-full">
        <PremiumScreen onBack={() => setShowPremium(false)} onSelectPlan={setPaymentPlan} />
      </div>
    );
  }

  if (showSupport) {
    return (
      <div className="flex flex-col h-full">
        <SupportChatScreen onBack={() => setShowSupport(false)} />
      </div>
    );
  }

  if (showDuel) {
    return (
      <div className="flex flex-col h-full">
        <DuelScreen onExit={() => setShowDuel(false)} />
      </div>
    );
  }

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

  // Mavzuli test ishga tushdi — TestScreen qayta ishlatiladi
  if (topicKey) {
    const questions = getQuestionsForTopic(getAllQuestions(), topicKey);
    return (
      <div className="flex flex-col h-full">
        <TestScreen
          customQuestions={questions}
          customTitle={t(`topics.names.${topicKey}`)}
          onExit={() => setTopicKey(null)}
        />
      </div>
    );
  }

  if (showTopics) {
    return (
      <div className="flex flex-col h-full">
        <TopicTestsScreen
          onBack={() => setShowTopics(false)}
          onStartTopic={(key) => {
            setShowTopics(false);
            setTopicKey(key);
          }}
        />
      </div>
    );
  }

  if (questionList) {
    return (
      <div className="flex flex-col h-full">
        <QuestionListScreen
          mode={questionList}
          onBack={() => {
            // Xatolar bo'limidan kelgan bo'lsa, unga qaytamiz —
            // to'g'ridan-to'g'ri bosh sahifaga tashlash chalkash bo'ladi.
            const cameFromHub = questionList === "mistakes" || questionList === "hardest";
            setQuestionList(null);
            if (cameFromHub) setShowMistakes(true);
          }}
        />
      </div>
    );
  }

  if (showMistakes) {
    return (
      <div className="flex flex-col h-full">
        <MistakesHubScreen
          onBack={() => setShowMistakes(false)}
          onOpenCommon={() => {
            setShowMistakes(false);
            setQuestionList("hardest");
          }}
          onOpenMine={() => {
            setShowMistakes(false);
            setQuestionList("mistakes");
          }}
        />
      </div>
    );
  }

  // CHALG'ITUVCHI TESTLAR — ko'pchilik xato qiladigan savollardan tuzilgan test.
  //
  // Savollar serverdan ID sifatida keladi (global question_stats bo'yicha,
  // yetmasa foydalanuvchining o'z xatolaridan). Matnlar mahalliy bazadan
  // olinadi — tarmoq orqali qayta yuborish ma'nosiz bo'lardi.
  if (showTricky) {
    return (
      <div className="flex flex-col h-full">
        <TrickyTestScreen onBack={() => setShowTricky(false)} />
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
        <AdminPanelScreen
          onBack={() => setShowAdmin(false)}
          currentUserId={user?.id}
          isSuperAdmin={Boolean(user?.isSuperAdmin)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-app">
      {active === "home" && (
        <HomeTab
          user={user}
          onOpenTickets={() => setShowTickets(true)}
          onOpenSigns={() => setShowSigns(true)}
          onOpenExam={() => setShowExam(true)}
          onOpenOfficialExam={() => setShowOfficialExam(true)}
          onOpenStats={() => setActive("stats")}
          onOpenDuel={() => setShowDuel(true)}
          onOpenSchool={() => setShowSchool(true)}
          onOpenTopics={() => setShowTopics(true)}
          onOpenMistakes={() => setShowMistakes(true)}
          onOpenSaved={() => setQuestionList("saved")}
          onOpenTricky={() => setShowTricky(true)}
        />
      )}
      {active === "stats" && <StatsTab />}
      {active === "settings" && (
        <SettingsTab
          user={user}
          onOpenAdmin={() => setShowAdmin(true)}
          onOpenPremium={() => setShowPremium(true)}
          onOpenSupport={() => setShowSupport(true)}
          onOpenSchool={() => setShowSchool(true)}
        />
      )}
      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}

