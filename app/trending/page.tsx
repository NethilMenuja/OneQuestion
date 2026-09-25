"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import SkyBackground from "../SkyBackground";
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
};

type Reaction = {
  answer_id: number;
  reaction_type: string;
};

type Like = {
  answer_id: number;
};

type TrendingAnswer = Answer & {
  question: string;
  reactions: number;
  likes: number;
  score: number;
};

const countryFlags: Record<string, string> = {
  "Sri Lanka": "lk",
  India: "in",
  "United States": "us",
  "United Kingdom": "gb",
  Australia: "au",
  Canada: "ca",
  Japan: "jp",
  Germany: "de",
  France: "fr",
};

function AnimatedNumber({
  value,
  duration = 900,
}: {
  value: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const numberRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const element = numberRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDisplayValue(0);
          setIsVisible(true);
        } else {
          setIsVisible(false);
          setDisplayValue(0);
        }
      },
      {
        threshold: 0.45,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    if (value <= 0) {
      setDisplayValue(0);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress =
        1 - Math.pow(1 - progress, 3);

      const currentNumber = Math.floor(
        easedProgress * value
      );

      setDisplayValue(currentNumber);

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrame =
      requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isVisible, value, duration]);

  return (
    <span ref={numberRef}>
      {displayValue}
    </span>
  );
}

export default function TrendingPage() {
  const [trending, setTrending] = useState<TrendingAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrending();
  }, []);

  async function loadTrending() {
    setLoading(true);

    const { data: answers, error: answersError } =
      await supabase
        .from("answers")
        .select(
          "id, question_id, user_id, answer, name, country, created_at"
        )
        .order("created_at", { ascending: false });

    if (answersError || !answers) {
      console.error(answersError);
      setTrending([]);
      setLoading(false);
      return;
    }

    if (answers.length === 0) {
      setTrending([]);
      setLoading(false);
      return;
    }

    const questionIds = [
      ...new Set(
        answers.map(
          (answer: Answer) => answer.question_id
        )
      ),
    ];

    const answerIds = answers.map(
      (answer: Answer) => answer.id
    );

    const [
      { data: questions },
      { data: reactions },
      { data: likes },
    ] = await Promise.all([
      supabase
        .from("questions")
        .select("id, question")
        .in("id", questionIds),

      supabase
        .from("reactions")
        .select("answer_id, reaction_type")
        .in("answer_id", answerIds),

      supabase
        .from("likes")
        .select("answer_id")
        .in("answer_id", answerIds),
    ]);

    const reactionCounts: Record<number, number> = {};
    const likeCounts: Record<number, number> = {};

    (reactions as Reaction[] | null)?.forEach(
      (reaction) => {
        reactionCounts[reaction.answer_id] =
          (reactionCounts[reaction.answer_id] || 0) + 1;
      }
    );

    (likes as Like[] | null)?.forEach((like) => {
      likeCounts[like.answer_id] =
        (likeCounts[like.answer_id] || 0) + 1;
    });

    const questionMap: Record<number, string> = {};

    (questions as Question[] | null)?.forEach(
      (question) => {
        questionMap[question.id] =
          question.question;
      }
    );

    const now = Date.now();

    const scoredAnswers: TrendingAnswer[] =
      (answers as Answer[]).map((answer) => {
        const ageHours = Math.max(
          1,
          (now -
            new Date(answer.created_at).getTime()) /
            (1000 * 60 * 60)
        );

        const reactionCount =
          reactionCounts[answer.id] || 0;

        const likeCount =
          likeCounts[answer.id] || 0;

        const freshness =
          24 / Math.pow(ageHours + 6, 0.6);

        const score =
          reactionCount * 3 +
          likeCount * 2 +
          freshness;

        return {
          ...answer,
          question:
            questionMap[answer.question_id] ||
            "ONEQUESTION",
          reactions: reactionCount,
          likes: likeCount,
          score,
        };
      });

    scoredAnswers.sort(
      (a, b) => b.score - a.score
    );

    setTrending(scoredAnswers.slice(0, 20));
    setLoading(false);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }

  return (
    <>
      <SkyBackground />

      <main className="relative z-10 min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">

          {/* Back */}
          <ScrollReveal>
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
            >
              ← Back to ONEQUESTION
            </a>
          </ScrollReveal>

          {/* Header */}
          <ScrollReveal delay={80}>
            <section className="mt-8">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/40">
                Discover
              </p>

              <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                Trending
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50 sm:text-base">
                The answers getting the most attention right now.
              </p>
            </section>
          </ScrollReveal>

          {/* Trending Count */}
          <ScrollReveal delay={140}>
            <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
                    Right now
                  </p>

                  <h2 className="mt-2 text-xl font-bold">
                    🔥 Trending Answers
                  </h2>

                  <p className="mt-1 text-sm text-white/40">
                    Fresh answers with strong community activity.
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-4xl font-bold">
                    <AnimatedNumber
                      value={trending.length}
                    />
                  </div>

                  <p className="mt-1 text-xs text-white/30">
                    answers
                  </p>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* Loading */}
          {loading && (
            <ScrollReveal delay={180}>
              <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
                <div className="text-sm text-white/40">
                  Loading trending answers...
                </div>
              </section>
            </ScrollReveal>
          )}

          {/* Empty */}
          {!loading && trending.length === 0 && (
            <ScrollReveal delay={180}>
              <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
                <div className="text-4xl">
                  🌍
                </div>

                <h2 className="mt-4 text-xl font-bold">
                  Nothing trending yet
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  Be one of the first people to answer today's question.
                </p>

                <a
                  href="/"
                  className="mt-6 inline-flex rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium transition hover:bg-white/15"
                >
                  Answer Today's Question →
                </a>
              </section>
            </ScrollReveal>
          )}

          {/* Trending Answers */}
          {!loading && trending.length > 0 && (
            <section className="mt-6 space-y-4">
              {trending.map((answer, index) => (
                <ScrollReveal
                  key={answer.id}
                  delay={Math.min(index * 35, 300)}
                >
                  <article className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20 hover:bg-white/[0.07] sm:p-6">

                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-4">

                      <div className="flex min-w-0 items-center gap-3">

                        {/* Rank */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-sm font-bold text-white/60">
                          #{index + 1}
                        </div>

                        {/* User */}
                        <div className="min-w-0">
                          <a
                            href={`/profile/${answer.user_id}`}
                            className="block truncate font-semibold transition hover:text-white/70"
                          >
                            {answer.name}
                          </a>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/40">

                            <span className="flex items-center gap-1">
                              {countryFlags[
                                answer.country
                              ] ? (
                                <img
                                  src={`https://flagcdn.com/20x15/${
                                    countryFlags[
                                      answer.country
                                    ]
                                  }.png`}
                                  alt={answer.country}
                                  className="h-[15px] w-[20px] rounded-[2px] object-cover"
                                />
                              ) : (
                                <span>🌍</span>
                              )}

                              {answer.country}
                            </span>

                            <span>•</span>

                            <span>
                              {formatDate(
                                answer.created_at
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Trending Badge */}
                      <div className="shrink-0 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-xs font-medium text-orange-300">
                        🔥 Trending
                      </div>
                    </div>

                    {/* Question */}
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/30">
                        Question
                      </p>

                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {answer.question}
                      </p>
                    </div>

                    {/* Answer */}
                    <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-white/90 sm:text-lg">
                      {answer.answer}
                    </p>

                    {/* Stats */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">

                      <div className="flex flex-wrap items-center gap-4 text-sm text-white/40">

                        <span className="flex items-center gap-1.5">
                          ❤️
                          <AnimatedNumber
                            value={answer.likes}
                          />
                        </span>

                        <span className="flex items-center gap-1.5">
                          💬
                          <AnimatedNumber
                            value={answer.reactions}
                          />
                        </span>

                      </div>

                      <a
                        href={`/answer/${answer.id}`}
                        className="text-sm font-medium text-white/60 transition hover:text-white"
                      >
                        View Answer →
                      </a>
                    </div>

                  </article>
                </ScrollReveal>
              ))}
            </section>
          )}

          {/* Footer */}
          <ScrollReveal delay={200}>
            <footer className="py-12 text-center">
              <p className="text-xs text-white/20">
                ONEQUESTION — One question. One answer. One world.
              </p>
            </footer>
          </ScrollReveal>

        </div>
      </main>
    </>
  );
}