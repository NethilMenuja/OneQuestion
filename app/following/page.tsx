"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ScrollReveal from "../ScrollReveal";

type Answer = {
  id: number;
  question_id: number;
  user_id: string;
  answer: string;
  name: string;
  country: string;
  created_at: string;
};

type Question = {
  id: number;
  question: string;
  question_date: string;
};

export default function FollowingPage() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadFollowingFeed();
  }, []);

  async function loadFollowingFeed() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    // Get people this user follows
    const { data: followingData, error: followingError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (followingError) {
      console.error("Following error:", followingError);
      setErrorMessage("Could not load your following feed.");
      setLoading(false);
      return;
    }

    const followingIds = (followingData || []).map(
      (item) => item.following_id
    );

    if (followingIds.length === 0) {
      setAnswers([]);
      setQuestions([]);
      setLoading(false);
      return;
    }

    // Get answers from people this user follows
    const { data: answersData, error: answersError } = await supabase
      .from("answers")
      .select(
        "id, question_id, user_id, answer, name, country, created_at"
      )
      .in("user_id", followingIds)
      .order("created_at", { ascending: false });

    if (answersError) {
      console.error("Following answers error:", answersError);
      setErrorMessage("Could not load answers.");
      setLoading(false);
      return;
    }

    setAnswers(answersData || []);

    // Get questions for those answers
    const questionIds = Array.from(
      new Set((answersData || []).map((item) => item.question_id))
    );

    if (questionIds.length > 0) {
      const { data: questionsData, error: questionsError } =
        await supabase
          .from("questions")
          .select("id, question, question_date")
          .in("id", questionIds);

      if (questionsError) {
        console.error("Following questions error:", questionsError);
      } else {
        setQuestions(questionsData || []);
      }
    } else {
      setQuestions([]);
    }

    setLoading(false);
  }

  function getQuestion(questionId: number) {
    return questions.find((question) => question.id === questionId);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-5 py-10">

        {/* NAVIGATION */}
        <ScrollReveal>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              ← Home
            </Link>

            <Link
              href="/explore"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Explore
            </Link>

            <Link
              href="/world"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              World
            </Link>

            <Link
              href="/profile"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Profile
            </Link>
          </div>
        </ScrollReveal>

        {/* HEADER */}
        <ScrollReveal delay={100}>
          <div className="mt-10">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/40">
              ONEQUESTION
            </p>

            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
              Following
            </h1>

            <p className="mt-3 max-w-2xl text-white/50">
              See answers from people you follow.
            </p>
          </div>
        </ScrollReveal>

        {/* LOADING */}
        {loading && (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
            Loading your feed...
          </div>
        )}

        {/* ERROR */}
        {!loading && errorMessage && (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/70">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={loadFollowingFeed}
              className="mt-5 rounded-full border border-white/10 bg-white/10 px-5 py-2.5 text-sm text-white transition hover:bg-white/15"
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !errorMessage &&
          answers.length === 0 && (
            <ScrollReveal delay={150}>
              <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
                <div className="text-4xl">
                  👥
                </div>

                <h2 className="mt-4 text-xl font-semibold">
                  Your feed is empty
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
                  Follow people on ONEQUESTION and their answers
                  will appear here.
                </p>

                <Link
                  href="/explore"
                  className="mt-6 inline-flex rounded-full border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  Explore People →
                </Link>
              </div>
            </ScrollReveal>
          )}

        {/* FEED */}
        {!loading &&
          !errorMessage &&
          answers.length > 0 && (
            <div className="mt-10 space-y-6">
              {answers.map((item, index) => {
                const question = getQuestion(item.question_id);

                return (
                  <ScrollReveal
                    key={item.id}
                    delay={Math.min(index * 70, 500)}
                  >
                    <article className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-white/15 hover:bg-white/[0.07] sm:p-7">

                      {/* USER */}
                      <div className="flex items-center justify-between gap-4">
                        <Link
                          href={`/profile/${item.user_id}`}
                          className="flex min-w-0 items-center gap-3"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white/70">
                            {item.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-white/90 transition hover:text-white">
                              {item.name}
                            </p>

                            <p className="text-xs text-white/40">
                              {item.country}
                            </p>
                          </div>
                        </Link>

                        <span className="shrink-0 text-xs text-white/30">
                          {new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }).format(new Date(item.created_at))}
                        </span>
                      </div>

                      {/* QUESTION */}
                      {question && (
                        <div className="mt-6 rounded-2xl border border-white/5 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                            Question
                          </p>

                          <p className="mt-2 text-sm leading-6 text-white/60">
                            {question.question}
                          </p>
                        </div>
                      )}

                      {/* ANSWER */}
                      <p className="mt-6 text-lg leading-8 text-white/90">
                        {item.answer}
                      </p>

                      {/* VIEW ANSWER */}
                      <div className="mt-6">
                        <Link
                          href={`/answer/${item.id}`}
                          className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/60 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                        >
                          View Answer →
                        </Link>
                      </div>

                    </article>
                  </ScrollReveal>
                );
              })}
            </div>
          )}

        {/* FOOTER */}
        <ScrollReveal delay={250}>
          <footer className="mt-16 border-t border-white/10 pt-6 text-center text-sm text-white/30">
            ONEQUESTION © 2026
          </footer>
        </ScrollReveal>

      </div>
    </main>
  );
}