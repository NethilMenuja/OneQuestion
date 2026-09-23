"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SkyBackground from "../SkyBackground";
import ScrollReveal from "../ScrollReveal";

type SavedAnswer = {
  id: number;
  bookmark_id: number;
  answer: string;
  name: string;
  country: string;
  created_at: string;
};

export default function SavedPage() {
  const [answers, setAnswers] = useState<SavedAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleRemove = async (
  bookmarkId: number,
  answerId: number
) => {
  if (removingId !== null) return;

  setRemovingId(answerId);

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId);

  if (error) {
    console.error("Remove bookmark error:", error);
    setRemovingId(null);
    return;
  }

  setTimeout(() => {
    setAnswers((current) =>
      current.filter(
        (item) => item.id !== answerId
      )
    );

    setRemovingId(null);
  }, 400);
};

  useEffect(() => {
    const loadSavedAnswers = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAnswers([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("bookmarks")
        .select(
  `
    id,
    answer_id,
    answers (
      id,
      answer,
      name,
      country,
      created_at
    )
  `
)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Saved answers error:", error);
        setAnswers([]);
        setLoading(false);
        return;
      }

      const savedAnswers = (data ?? [])
  .map((item: any) => {
    if (!item.answers) {
      return null;
    }

    return {
      ...item.answers,
      bookmark_id: item.id,
    };
  })
  .filter(Boolean);

      setAnswers(savedAnswers);
      setLoading(false);
    };

    loadSavedAnswers();
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-transparent text-white">
      <SkyBackground />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-10">
        <ScrollReveal>
          <header className="mb-14">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Saved
                </h1>

                <p className="mt-2 text-sm text-white/50">
                  Answers you saved for later.
                </p>
              </div>

              <a
                href="/"
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Home
              </a>
            </div>
          </header>
        </ScrollReveal>

        {loading ? (
          <ScrollReveal>
            <p className="text-center text-white/40">
              Loading saved answers...
            </p>
          </ScrollReveal>
        ) : answers.length === 0 ? (
          <ScrollReveal>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
              <div className="text-4xl">🔖</div>

              <p className="mt-4 text-lg font-medium">
                No saved answers yet.
              </p>

              <p className="mt-2 text-sm text-white/40">
                Save answers you want to come back to later.
              </p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="space-y-4">
            {answers.map((item, index) => (
              <ScrollReveal
                key={item.id}
                delay={index * 100}
              >
                <article
  className={`rounded-2xl border border-white/15 bg-black/30 p-5 backdrop-blur-sm sm:p-6 transition-all duration-400 ease-in-out ${
    removingId === item.id
      ? "translate-x-8 scale-95 opacity-0"
      : "translate-x-0 scale-100 opacity-100"
  }`}
>
                  <p className="break-words whitespace-pre-wrap leading-7 text-white/80">
                    {item.answer}
                  </p>

                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="font-medium">
                      {item.name}
                    </p>

                    <p className="mt-1 text-xs text-white/30">
                      {item.country}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
  <button
    type="button"
    onClick={() =>
      handleRemove(item.bookmark_id, item.id)
    }
    disabled={removingId === item.id}
    className="rounded-full border border-red-400/20 bg-red-400/5 px-4 py-2 text-sm text-red-300 transition-all duration-300 hover:bg-red-400/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {removingId === item.id
      ? "Removing..."
      : "🔖 Remove"}
  </button>
</div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}