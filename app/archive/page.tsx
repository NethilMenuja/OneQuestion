"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import ScrollReveal from "../ScrollReveal";

type Question = {
  id: number;
  question: string;
  question_date: string;
};

type Answer = {
  id: number;
  answer: string;
  name: string;
  country: string;
  created_at: string;
};

type DateFilter = "all" | "month" | "year";

export default function ArchivePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] =
    useState<Question | null>(null);

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] =
    useState<DateFilter>("all");

  const [loading, setLoading] = useState(true);
  const [answersLoading, setAnswersLoading] =
    useState(false);

  useEffect(() => {
    loadArchive();
  }, []);

  async function loadArchive() {
    setLoading(true);

    const today = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const { data, error } = await supabase
      .from("questions")
      .select("id, question, question_date")
      .lte("question_date", today)
      .order("question_date", {
        ascending: false,
      });

    if (error) {
      console.error("Archive error:", error);
      setLoading(false);
      return;
    }

    setQuestions(data || []);
    setLoading(false);
  }

  async function openQuestion(question: Question) {
    setSelectedQuestion(question);
    setAnswers([]);
    setAnswersLoading(true);

    const { data, error } = await supabase
      .from("answers")
      .select(
        "id, answer, name, country, created_at"
      )
      .eq("question_id", question.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Answers error:", error);
      setAnswersLoading(false);
      return;
    }

    setAnswers(data || []);
    setAnswersLoading(false);
  }

  function closeQuestion() {
    setSelectedQuestion(null);
    setAnswers([]);
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  }

  function formatShortDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  }

  function isToday(date: string) {
    const today = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    return date === today;
  }

  function isThisMonth(date: string) {
    const questionDate = new Date(
      `${date}T00:00:00`
    );

    const now = new Date();

    return (
      questionDate.getFullYear() ===
        now.getFullYear() &&
      questionDate.getMonth() === now.getMonth()
    );
  }

  function isThisYear(date: string) {
    const questionDate = new Date(
      `${date}T00:00:00`
    );

    return (
      questionDate.getFullYear() ===
      new Date().getFullYear()
    );
  }

  const filteredQuestions = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return questions.filter((item) => {
      const matchesSearch =
        searchValue === "" ||
        item.question
          .toLowerCase()
          .includes(searchValue);

      let matchesDate = true;

      if (dateFilter === "month") {
        matchesDate = isThisMonth(
          item.question_date
        );
      }

      if (dateFilter === "year") {
        matchesDate = isThisYear(
          item.question_date
        );
      }

      return matchesSearch && matchesDate;
    });
  }, [questions, search, dateFilter]);

  const totalQuestions = questions.length;

  const thisYearQuestions = questions.filter(
    (item) => isThisYear(item.question_date)
  ).length;

  const thisMonthQuestions = questions.filter(
    (item) => isThisMonth(item.question_date)
  ).length;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-5 py-10">

        {/* =====================================================
            TOP NAVIGATION
        ====================================================== */}

        {!selectedQuestion ? (
          <a
            href="/"
            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            ← Back to ONEQUESTION
          </a>
        ) : (
          <button
            type="button"
            onClick={closeQuestion}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            ← Back to archive
          </button>
        )}

        {/* =====================================================
            ARCHIVE LIST
        ====================================================== */}

        {!selectedQuestion && (
          <>
            {/* HEADER */}

            <ScrollReveal>
              <div className="mt-8 mb-8">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/30">
                  History
                </p>

                <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                  Question Archive
                </h1>

                <p className="mt-3 max-w-2xl text-white/50">
                  Explore every question from the
                  ONEQUESTION journey.
                </p>
              </div>
            </ScrollReveal>

            {/* =================================================
                ARCHIVE STATS
            ================================================== */}

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

              <ScrollReveal>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-3xl font-bold">
                    {totalQuestions}
                  </p>

                  <p className="mt-2 text-sm text-white/40">
                    Total Questions
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-3xl font-bold">
                    {thisYearQuestions}
                  </p>

                  <p className="mt-2 text-sm text-white/40">
                    This Year
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-3xl font-bold">
                    {thisMonthQuestions}
                  </p>

                  <p className="mt-2 text-sm text-white/40">
                    This Month
                  </p>
                </div>
              </ScrollReveal>

            </div>

            {/* =================================================
                SEARCH
            ================================================== */}

            <ScrollReveal delay={100}>
              <div className="mb-5">
                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                    🔍
                  </span>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search questions..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white outline-none transition placeholder:text-white/30 focus:border-white/20 focus:bg-white/10"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/30 transition hover:text-white"
                    >
                      ✕
                    </button>
                  )}

                </div>
              </div>
            </ScrollReveal>

            {/* =================================================
                DATE FILTER
            ================================================== */}

            <ScrollReveal delay={150}>
              <div className="mb-8 flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setDateFilter("all")
                  }
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    dateFilter === "all"
                      ? "border-white/20 bg-white/15 text-white"
                      : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  All
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDateFilter("month")
                  }
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    dateFilter === "month"
                      ? "border-white/20 bg-white/15 text-white"
                      : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  This Month
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDateFilter("year")
                  }
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    dateFilter === "year"
                      ? "border-white/20 bg-white/15 text-white"
                      : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  This Year
                </button>

              </div>
            </ScrollReveal>

            {/* =================================================
                RESULT COUNT
            ================================================== */}

            {!loading &&
              questions.length > 0 && (
                <ScrollReveal delay={200}>
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-sm text-white/40">
                      Showing{" "}
                      <span className="text-white/70">
                        {filteredQuestions.length}
                      </span>{" "}
                      of{" "}
                      <span className="text-white/70">
                        {questions.length}
                      </span>{" "}
                      questions
                    </p>
                  </div>
                </ScrollReveal>
              )}

            {/* =================================================
                LOADING
            ================================================== */}

            {loading && (
              <ScrollReveal>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
                  Loading archive...
                </div>
              </ScrollReveal>
            )}

            {/* =================================================
                NO QUESTIONS
            ================================================== */}

            {!loading &&
              questions.length === 0 && (
                <ScrollReveal>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
                    <div className="text-4xl">
                      📚
                    </div>

                    <p className="mt-4 text-lg font-medium">
                      No questions yet.
                    </p>

                    <p className="mt-2 text-sm text-white/40">
                      The archive will appear here as
                      questions are added.
                    </p>
                  </div>
                </ScrollReveal>
              )}

            {/* =================================================
                NO SEARCH RESULTS
            ================================================== */}

            {!loading &&
              questions.length > 0 &&
              filteredQuestions.length === 0 && (
                <ScrollReveal>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">

                    <div className="text-4xl">
                      🔎
                    </div>

                    <p className="mt-4 text-lg font-medium">
                      No questions found.
                    </p>

                    <p className="mt-2 text-sm text-white/40">
                      Try a different search or date
                      filter.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setDateFilter("all");
                      }}
                      className="mt-5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                      Clear filters
                    </button>

                  </div>
                </ScrollReveal>
              )}

            {/* =================================================
                QUESTION CARDS
            ================================================== */}

            {!loading &&
              filteredQuestions.length > 0 && (
                <div className="space-y-4">

                  {filteredQuestions.map(
                    (item, index) => {
                      const latest =
                        index === 0 &&
                        search === "" &&
                        dateFilter === "all";

                      return (
                        <ScrollReveal
                          key={item.id}
                          delay={index * 80}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openQuestion(item)
                            }
                            className="group block w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
                          >

                            {/* TOP ROW */}

                            <div className="flex flex-wrap items-center justify-between gap-3">

                              <div className="flex items-center gap-3">

                                <p className="text-sm font-medium text-white/50">
                                  {formatDate(
                                    item.question_date
                                  )}
                                </p>

                                {isToday(
                                  item.question_date
                                ) && (
                                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                                    Today
                                  </span>
                                )}

                                {latest &&
                                  !isToday(
                                    item.question_date
                                  ) && (
                                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/50">
                                      Latest
                                    </span>
                                  )}

                              </div>

                              <span className="text-sm text-white/30 transition group-hover:translate-x-1 group-hover:text-white/60">
                                View →
                              </span>

                            </div>

                            {/* QUESTION */}

                            <h2 className="mt-4 text-xl font-semibold leading-relaxed text-white sm:text-2xl">
                              {item.question}
                            </h2>

                            {/* BOTTOM INFO */}

                            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">

                              <p className="text-xs text-white/30">
                                {formatShortDate(
                                  item.question_date
                                )}
                              </p>

                              <p className="text-xs text-white/30">
                                Open question →
                              </p>

                            </div>

                          </button>
                        </ScrollReveal>
                      );
                    }
                  )}

                </div>
              )}
          </>
        )}

        {/* =====================================================
            SELECTED QUESTION
        ====================================================== */}

        {selectedQuestion && (
          <>
            {/* SELECTED QUESTION */}

            <ScrollReveal>
              <div className="mt-8">

                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/30">
                  Question
                </p>

                <p className="mt-3 text-sm font-medium text-white/50">
                  {formatDate(
                    selectedQuestion.question_date
                  )}
                </p>

                <h1 className="mt-4 text-3xl font-bold leading-relaxed sm:text-4xl">
                  {selectedQuestion.question}
                </h1>

              </div>
            </ScrollReveal>

            {/* =================================================
                ANSWERS
            ================================================== */}

            <section className="mt-10">

              <ScrollReveal delay={100}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

                  <div>
                    <h2 className="text-2xl font-bold">
                      Community Answers
                    </h2>

                    <p className="mt-1 text-sm text-white/30">
                      Responses from the ONEQUESTION
                      community.
                    </p>
                  </div>

                  {!answersLoading && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/40">
                      {answers.length}{" "}
                      {answers.length === 1
                        ? "answer"
                        : "answers"}
                    </span>
                  )}

                </div>
              </ScrollReveal>

              {/* ANSWER LOADING */}

              {answersLoading && (
                <ScrollReveal delay={200}>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
                    Loading answers...
                  </div>
                </ScrollReveal>
              )}

              {/* NO ANSWERS */}

              {!answersLoading &&
                answers.length === 0 && (
                  <ScrollReveal delay={200}>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">

                      <div className="text-4xl">
                        💬
                      </div>

                      <p className="mt-4 text-lg font-medium">
                        No answers yet.
                      </p>

                      <p className="mt-2 text-sm text-white/40">
                        Nobody has answered this
                        question yet.
                      </p>

                    </div>
                  </ScrollReveal>
                )}

              {/* ANSWER LIST */}

              {!answersLoading &&
                answers.length > 0 && (
                  <div className="space-y-4">

                    {answers.map(
                      (item, index) => (
                        <ScrollReveal
                          key={item.id}
                          delay={index * 80}
                        >
                          <article className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:border-white/15 hover:bg-white/10">

                            <p className="break-words whitespace-pre-wrap text-base leading-7 text-white/90">
                              {item.answer}
                            </p>

                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">

                              <div className="flex flex-wrap items-center gap-3 text-sm text-white/40">

                                <span className="font-medium text-white/60">
                                  {item.name}
                                </span>

                                <span>
                                  •
                                </span>

                                <span>
                                  {item.country}
                                </span>

                              </div>

                              <span className="text-xs text-white/25">
                                {new Intl.DateTimeFormat(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                ).format(
                                  new Date(
                                    item.created_at
                                  )
                                )}
                              </span>

                            </div>

                          </article>
                        </ScrollReveal>
                      )
                    )}

                  </div>
                )}

            </section>
          </>
        )}

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <footer className="mt-16 border-t border-white/10 pt-6 text-center text-sm text-white/30">
          ONEQUESTION © 2026
        </footer>

      </div>
    </main>
  );
}