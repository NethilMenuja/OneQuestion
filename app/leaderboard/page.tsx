"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SkyBackground from "../SkyBackground";
import ScrollReveal from "../ScrollReveal";

type LeaderboardEntry = {
  name: string;
  country: string;
  answers: number;
  likes: number;
};

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);

      // Get all answers
      const {
        data: answersData,
        error: answersError,
      } = await supabase
        .from("answers")
        .select("id, name, country");

      if (answersError) {
        console.error(
          "Answers leaderboard error:",
          answersError
        );
        setLeaders([]);
        setLoading(false);
        return;
      }

      // Get all likes separately
      const {
        data: likesData,
        error: likesError,
      } = await supabase
        .from("likes")
        .select("answer_id");

      if (likesError) {
        console.error(
          "Likes leaderboard error:",
          likesError
        );
        setLeaders([]);
        setLoading(false);
        return;
      }

      // Count likes for each answer
      const likeCounts: Record<number, number> = {};

      (likesData ?? []).forEach((like) => {
        if (like.answer_id !== null) {
          likeCounts[like.answer_id] =
            (likeCounts[like.answer_id] || 0) + 1;
        }
      });

      // Group answers by contributor
      const grouped: Record<
        string,
        LeaderboardEntry
      > = {};

      (answersData ?? []).forEach((answer) => {
        const name = answer.name || "Anonymous";
        const country = answer.country || "Unknown";

        const key = `${name}|||${country}`;

        if (!grouped[key]) {
          grouped[key] = {
            name,
            country,
            answers: 0,
            likes: 0,
          };
        }

        grouped[key].answers += 1;
        grouped[key].likes +=
          likeCounts[answer.id] || 0;
      });

      // Sort by total likes first, then answer count
      const sorted = Object.values(grouped).sort(
        (a, b) => {
          if (b.likes !== a.likes) {
            return b.likes - a.likes;
          }

          return b.answers - a.answers;
        }
      );

      setLeaders(sorted);
      setLoading(false);
    };

    loadLeaderboard();
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
                  Leaderboard
                </h1>

                <p className="mt-2 text-sm text-white/50">
                  The people making ONEQUESTION come alive.
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
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-sm">
              <p className="text-white/40">
                Loading leaderboard...
              </p>
            </div>
          </ScrollReveal>
        ) : leaders.length === 0 ? (
          <ScrollReveal>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-sm">
              <p className="text-lg font-medium">
                No leaderboard data yet.
              </p>

              <p className="mt-2 text-sm text-white/40">
                Start answering questions to appear here.
              </p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="space-y-4">
            {leaders.map((leader, index) => (
              <ScrollReveal
                key={`${leader.name}-${leader.country}`}
                delay={index * 80}
              >
                <article
                  className={`relative transform-gpu overflow-hidden rounded-3xl border p-5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] sm:p-6 ${
                    index === 0
                      ? "border-yellow-300/30 bg-yellow-300/10 shadow-[0_0_40px_rgba(250,204,21,0.10)]"
                      : index === 1
                        ? "border-white/20 bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.04)]"
                        : index === 2
                          ? "border-orange-400/25 bg-orange-400/10 shadow-[0_0_30px_rgba(251,146,60,0.07)]"
                          : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  {/* Top 3 glow */}
                  {index < 3 && (
                    <div
                      className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${
                        index === 0
                          ? "bg-yellow-300/20"
                          : index === 1
                            ? "bg-white/15"
                            : "bg-orange-400/20"
                      }`}
                    />
                  )}

                  <div
  className="relative z-10 flex items-center gap-4"
  style={{
    transform: "translateZ(0)",
    WebkitFontSmoothing: "antialiased",
    textRendering: "geometricPrecision",
  }}
>
                    {/* Rank */}
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-2xl ${
                        index === 0
                          ? "border-yellow-300/30 bg-yellow-300/10"
                          : index === 1
                            ? "border-white/20 bg-white/10"
                            : index === 2
                              ? "border-orange-400/30 bg-orange-400/10"
                              : "border-white/10 bg-white/5 text-lg"
                      }`}
                    >
                      {index === 0
                        ? "🥇"
                        : index === 1
                          ? "🥈"
                          : index === 2
                            ? "🥉"
                            : index + 1}
                    </div>

                    {/* Person */}
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-semibold">
                        {leader.name}
                      </h2>

                      <p className="mt-1 text-sm text-white/40">
                        {leader.country}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex shrink-0 gap-5 text-right">
                      <div>
                        <p className="text-lg font-semibold">
                          {leader.answers}
                        </p>

                        <p className="text-xs text-white/30">
                          Answers
                        </p>
                      </div>

                      <div>
                        <p className="text-lg font-semibold">
                          {leader.likes}
                        </p>

                        <p className="text-xs text-white/30">
                          Likes
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Top 3 place label */}
                  {index < 3 && (
                    <div className="relative mt-4 border-t border-white/10 pt-3">
                      <p
                        className={`text-center text-xs font-medium uppercase tracking-[0.2em] ${
                          index === 0
                            ? "text-yellow-200/70"
                            : index === 1
                              ? "text-white/50"
                              : "text-orange-200/70"
                        }`}
                      >
                        {index === 0
                          ? "1st Place"
                          : index === 1
                            ? "2nd Place"
                            : "3rd Place"}
                      </p>
                    </div>
                  )}
                </article>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}