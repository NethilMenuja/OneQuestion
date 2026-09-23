"use client";

import { useEffect, useState } from "react";
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

export default function ArchivePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] =
    useState<Question | null>(null);

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [answersLoading, setAnswersLoading] = useState(false);

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
      .order("question_date", { ascending: false });

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
      .select("id, answer, name, country, created_at")
      .eq("question_id", question.id)
      .order("created_at", { ascending: false });

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

  const filteredQuestions = questions.filter((item) =>
    item.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-5 py-10">

        {/* TOP BACK BUTTON */}
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
            <ScrollReveal>
              <div className="mt-8 mb-8">
                <h1 className="text-4xl font-bold">
                  Question Archive
                </h1>

                <p className="mt-2 text-white/60">
                  Every question. Every day.
                </p>
              </div>
            </ScrollReveal>

            {/* SEARCH */}
            <ScrollReveal delay={100}>
              <div className="mb-8">
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                    🔍
                  </span>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white outline-none transition placeholder:text-white/30 focus:border-white/20 focus:bg-white/10"
                  />
                </div>
              </div>
            </ScrollReveal>

            {/* LOADING */}
            {loading && (
              <ScrollReveal>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
                  Loading archive...
                </div>
              </ScrollReveal>
            )}

            {/* NO QUESTIONS */}
            {!loading && questions.length === 0 && (
              <ScrollReveal>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
                  No questions yet.
                </div>
              </ScrollReveal>
            )}

            {/* NO SEARCH RESULTS */}
            {!loading &&
              questions.length > 0 &&
              filteredQuestions.length === 0 && (
                <ScrollReveal>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
                    No questions found.
                  </div>
                </ScrollReveal>
              )}

            {/* QUESTION DATES */}
            {!loading && filteredQuestions.length > 0 && (
              <div className="space-y-4">
                {filteredQuestions.map((item, index) => (
                  <ScrollReveal
                    key={item.id}
                    delay={index * 100}
                  >
                    <button
                      type="button"
                      onClick={() => openQuestion(item)}
                      className="block w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition hover:border-white/20 hover:bg-white/10"
                    >
                      {/* CLICKABLE DATE */}
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-white/60">
                          {formatDate(item.question_date)}
                        </p>

                        <span className="text-sm text-white/40">
                          View →
                        </span>
                      </div>

                      <h2 className="mt-3 text-xl font-semibold leading-relaxed text-white">
                        {item.question}
                      </h2>
                    </button>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </>
        )}

        {/* =====================================================
            SELECTED DATE
        ====================================================== */}
        {selectedQuestion && (
          <>
            {/* SELECTED QUESTION */}
            <ScrollReveal>
              <div className="mt-8">
                <p className="text-sm font-medium text-white/50">
                  {formatDate(selectedQuestion.question_date)}
                </p>

                <h1 className="mt-4 text-3xl font-bold leading-relaxed">
                  {selectedQuestion.question}
                </h1>
              </div>
            </ScrollReveal>

            {/* ANSWERS FOR THIS DATE ONLY */}
            <section className="mt-10">
              <ScrollReveal delay={100}>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    Answers
                  </h2>

                  {!answersLoading && (
                    <span className="text-sm text-white/40">
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
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
                    Loading answers...
                  </div>
                </ScrollReveal>
              )}

              {/* NO ANSWERS */}
              {!answersLoading && answers.length === 0 && (
                <ScrollReveal delay={200}>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
                    No answers for this question yet.
                  </div>
                </ScrollReveal>
              )}

              {/* ONLY THIS QUESTION'S ANSWERS */}
              {!answersLoading && answers.length > 0 && (
                <div className="space-y-4">
                  {answers.map((item, index) => (
                    <ScrollReveal
                      key={item.id}
                      delay={index * 100}
                    >
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <p className="text-base leading-7 text-white/90">
                          {item.answer}
                        </p>

                        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/40">
                          <span>{item.name}</span>
                          <span>•</span>
                          <span>{item.country}</span>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* FOOTER */}
        <footer className="mt-16 border-t border-white/10 pt-6 text-center text-sm text-white/30">
          ONEQUESTION © 2026
        </footer>

      </div>
    </main>
  );
}