"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ScrollReveal from "../ScrollReveal";

type Answer = {
  id: number;
  answer: string;
  name: string;
  country: string;
  created_at: string;
  likes: number;
};

type Period = "today" | "week" | "all";

export default function PopularPage() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [period, setPeriod] = useState<Period>("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPopular();
  }, [period]);

  async function loadPopular() {
    setLoading(true);

    const now = new Date();

    let startDate: Date | null = null;

    if (period === "today") {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
    }

    if (period === "week") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
    }

    let query = supabase
      .from("answers")
      .select("id, answer, name, country, created_at")
      .order("created_at", { ascending: false });

    if (startDate) {
      query = query.gte("created_at", startDate.toISOString());
    }

    const { data: answerData, error: answerError } = await query;

    if (answerError) {
      console.error("Popular answers error:", answerError);
      setLoading(false);
      return;
    }

    if (!answerData || answerData.length === 0) {
      setAnswers([]);
      setLoading(false);
      return;
    }

    const answerIds = answerData.map((item) => item.id);

    const { data: likesData, error: likesError } = await supabase
      .from("likes")
      .select("answer_id")
      .in("answer_id", answerIds);

    if (likesError) {
      console.error("Likes error:", likesError);
    }

    const likeCounts: Record<number, number> = {};

    (likesData || []).forEach((like) => {
      likeCounts[like.answer_id] =
        (likeCounts[like.answer_id] || 0) + 1;
    });

    const popularAnswers = answerData
      .map((item) => ({
        ...item,
        likes: likeCounts[item.id] || 0,
      }))
      .sort((a, b) => b.likes - a.likes);

    setAnswers(popularAnswers);
    setLoading(false);
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-5 py-10">

        {/* TOP NAVIGATION */}
        <ScrollReveal>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              ← Home
            </a>

            <a
              href="/explore"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Explore
            </a>

            <a
              href="/world"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              World
            </a>

            <a
              href="/archive"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Archive
            </a>
          </div>
        </ScrollReveal>

        {/* HEADER */}
        <ScrollReveal delay={100}>
          <div className="mt-10">
            <h1 className="text-4xl font-bold">
              Popular
            </h1>

            <p className="mt-2 text-white/60">
              The answers people loved most.
            </p>
          </div>
        </ScrollReveal>

        {/* FILTERS */}
        <ScrollReveal delay={200}>
          <div className="mt-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPeriod("today")}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                period === "today"
                  ? "border-white/20 bg-white text-black"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setPeriod("week")}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                period === "week"
                  ? "border-white/20 bg-white text-black"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              This Week
            </button>

            <button
              type="button"
              onClick={() => setPeriod("all")}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                period === "all"
                  ? "border-white/20 bg-white text-black"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              All Time
            </button>
          </div>
        </ScrollReveal>

        {/* ANSWERS */}
        <section className="mt-8">

          {loading && (
            <ScrollReveal>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
                Loading popular answers...
              </div>
            </ScrollReveal>
          )}

          {!loading && answers.length === 0 && (
            <ScrollReveal>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
                No answers found for this period.
              </div>
            </ScrollReveal>
          )}

          {!loading && answers.length > 0 && (
            <div className="space-y-4">
              {answers.map((item, index) => (
                <ScrollReveal
                  key={item.id}
                  delay={index * 100}
                >
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/10">

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-white/40">
                        #{index + 1}
                      </span>

                      <span className="text-sm font-medium text-white/70">
                        ❤️ {item.likes}
                      </span>
                    </div>

                    <p className="mt-4 text-lg leading-8 text-white/90">
                      {item.answer}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/40">
                      <span>{item.name}</span>
                      <span>•</span>
                      <span>{item.country}</span>
                      <span>•</span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>

                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}

        </section>

        <footer className="mt-16 border-t border-white/10 pt-6 text-center text-sm text-white/30">
          ONEQUESTION © 2026
        </footer>

      </div>
    </main>
  );
}