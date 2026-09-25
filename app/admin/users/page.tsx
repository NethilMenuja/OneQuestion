"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type UserActivity = {
  user_id: string;
  answers: number;
  replies: number;
  reactions: number;
  reports: number;
  totalActivity: number;
};

function AnimatedNumber({
  value,
  duration = 900,
}: {
  value: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    let animationFrame = 0;
    let hasAnimated = false;

    const animate = () => {
      const startTime = performance.now();

      const tick = (currentTime: number) => {
        const progress = Math.min(
          (currentTime - startTime) / duration,
          1
        );

        const eased =
          1 - Math.pow(1 - progress, 3);

        setDisplayValue(
          Math.round(value * eased)
        );

        if (progress < 1) {
          animationFrame =
            requestAnimationFrame(tick);
        }
      };

      cancelAnimationFrame(animationFrame);

      animationFrame =
        requestAnimationFrame(tick);
    };

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            if (!hasAnimated) {
              hasAnimated = true;
              animate();
            }
          } else {
            if (hasAnimated) {
              hasAnimated = false;
              setDisplayValue(0);
            }
          }
        },
        {
          threshold: 0.35,
        }
      );

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrame);
    };
  }, [value, duration]);

  return (
    <span ref={ref}>
      {displayValue}
    </span>
  );
}

function shortId(id: string) {
  return `${id.slice(0, 8)}...${id.slice(-6)}`;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<
    UserActivity[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [accessDenied, setAccessDenied] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [sortBy, setSortBy] = useState<
    "activity" |
    "answers" |
    "replies" |
    "reactions"
  >("activity");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    /* ADMIN CHECK */
    const {
      data: adminData,
      error: adminError,
    } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError) {
      console.error(
        "Admin check error:",
        adminError
      );

      setErrorMessage(
        "Could not verify admin access."
      );

      setLoading(false);
      return;
    }

    if (!adminData) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    /* ANSWERS */
    const {
      data: answerData,
      error: answerError,
    } = await supabase
      .from("answers")
      .select("user_id")
      .not("user_id", "is", null);

    if (answerError) {
      console.error(
        "Answers error:",
        answerError
      );

      setErrorMessage(
        "Could not load user activity."
      );

      setLoading(false);
      return;
    }

    /* REPLIES */
    const {
      data: replyData,
      error: replyError,
    } = await supabase
      .from("replies")
      .select("user_id")
      .not("user_id", "is", null);

    if (replyError) {
      console.error(
        "Replies error:",
        replyError
      );
    }

    /* REACTIONS */
    const {
      data: reactionData,
      error: reactionError,
    } = await supabase
      .from("likes")
      .select("user_id")
      .not("user_id", "is", null);

    if (reactionError) {
      console.error(
        "Reactions error:",
        reactionError
      );
    }

    /* REPORTS */
    const {
      data: reportData,
      error: reportError,
    } = await supabase
      .from("reports")
      .select("reporter_id")
      .not("reporter_id", "is", null);

    if (reportError) {
      console.error(
        "Reports error:",
        reportError
      );
    }

    /* COMBINE USERS */
    const activityMap: Record<
      string,
      UserActivity
    > = {};

    function ensureUser(id: string) {
      if (!activityMap[id]) {
        activityMap[id] = {
          user_id: id,
          answers: 0,
          replies: 0,
          reactions: 0,
          reports: 0,
          totalActivity: 0,
        };
      }

      return activityMap[id];
    }

    (answerData ?? []).forEach((item) => {
      if (!item.user_id) return;

      ensureUser(item.user_id).answers++;
    });

    (replyData ?? []).forEach((item) => {
      if (!item.user_id) return;

      ensureUser(item.user_id).replies++;
    });

    (reactionData ?? []).forEach((item) => {
      if (!item.user_id) return;

      ensureUser(item.user_id).reactions++;
    });

    (reportData ?? []).forEach((item) => {
      if (!item.reporter_id) return;

      ensureUser(
        item.reporter_id
      ).reports++;
    });

    const result = Object.values(
      activityMap
    ).map((item) => ({
      ...item,
      totalActivity:
        item.answers +
        item.replies +
        item.reactions,
    }));

    result.sort(
      (a, b) =>
        b.totalActivity -
        a.totalActivity
    );

    setUsers(result);
    setLoading(false);
  }

  const filteredUsers = users
    .filter((user) =>
      user.user_id
        .toLowerCase()
        .includes(
          search.trim().toLowerCase()
        )
    )
    .sort((a, b) => {
      if (sortBy === "answers") {
        return b.answers - a.answers;
      }

      if (sortBy === "replies") {
        return b.replies - a.replies;
      }

      if (sortBy === "reactions") {
        return (
          b.reactions -
          a.reactions
        );
      }

      return (
        b.totalActivity -
        a.totalActivity
      );
    });

  const totalAnswers = users.reduce(
    (sum, user) =>
      sum + user.answers,
    0
  );

  const totalReplies = users.reduce(
    (sum, user) =>
      sum + user.replies,
    0
  );

  const totalReactions = users.reduce(
    (sum, user) =>
      sum + user.reactions,
    0
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-5 py-10 text-white">
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
            <div className="animate-pulse text-white/50">
              Loading users...
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (accessDenied) {
    return (
      <main className="min-h-screen bg-black px-5 py-10 text-white">
        <div className="mx-auto w-full max-w-xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">

            <div className="text-4xl">
              🔒
            </div>

            <h1 className="mt-4 text-2xl font-semibold">
              Access denied
            </h1>

            <p className="mt-2 text-sm text-white/40">
              You do not have permission
              to access user management.
            </p>

            <Link
              href="/admin"
              className="mt-6 inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              ← Back to dashboard
            </Link>

          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-5 py-10 text-white">
      <div className="mx-auto w-full max-w-6xl">

        {/* HEADER */}
        <div className="mb-10">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <Link
                href="/"
                className="text-2xl font-bold tracking-[0.25em] transition hover:opacity-70"
              >
                ONEQUESTION
              </Link>

              <p className="mt-5 text-xs font-medium uppercase tracking-[0.2em] text-white/35">
                Admin
              </p>

              <h1 className="mt-1 text-4xl font-semibold">
                User Management
              </h1>

              <p className="mt-2 text-sm text-white/40">
                Monitor community user activity.
              </p>
            </div>

            <div className="flex gap-2">

              <Link
                href="/admin"
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                ← Dashboard
              </Link>

              <button
                onClick={loadUsers}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                ↻ Refresh
              </button>

            </div>

          </div>

        </div>

        {/* ERROR */}
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {/* SUMMARY */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl transition hover:bg-white/[0.08]">

            <p className="text-2xl">
              👥
            </p>

            <p className="mt-5 text-4xl font-bold">
              <AnimatedNumber
                value={users.length}
              />
            </p>

            <p className="mt-2 text-sm text-white/40">
              Active Users
            </p>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl transition hover:bg-white/[0.08]">

            <p className="text-2xl">
              📝
            </p>

            <p className="mt-5 text-4xl font-bold">
              <AnimatedNumber
                value={totalAnswers}
              />
            </p>

            <p className="mt-2 text-sm text-white/40">
              Answers
            </p>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl transition hover:bg-white/[0.08]">

            <p className="text-2xl">
              💬
            </p>

            <p className="mt-5 text-4xl font-bold">
              <AnimatedNumber
                value={totalReplies}
              />
            </p>

            <p className="mt-2 text-sm text-white/40">
              Replies
            </p>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl transition hover:bg-white/[0.08]">

            <p className="text-2xl">
              ❤️
            </p>

            <p className="mt-5 text-4xl font-bold">
              <AnimatedNumber
                value={totalReactions}
              />
            </p>

            <p className="mt-2 text-sm text-white/40">
              Reactions
            </p>

          </div>

        </section>

        {/* SEARCH */}
        <section className="mt-6">

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">

            <div className="flex flex-col gap-3 sm:flex-row">

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by User ID..."
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-5 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
              />

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | "activity"
                      | "answers"
                      | "replies"
                      | "reactions"
                  )
                }
                className="rounded-2xl border border-white/10 bg-black/30 px-5 py-3 text-sm text-white/70 outline-none"
              >

                <option value="activity">
                  Sort: Activity
                </option>

                <option value="answers">
                  Sort: Answers
                </option>

                <option value="replies">
                  Sort: Replies
                </option>

                <option value="reactions">
                  Sort: Reactions
                </option>

              </select>

            </div>

          </div>

        </section>

        {/* USERS */}
        <section className="mt-6">

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  Users
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Community activity
                </h2>
              </div>

              <span className="text-xs text-white/30">
                {filteredUsers.length} shown
              </span>

            </div>

            {filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-sm text-white/35">
                No users found.
              </div>
            ) : (
              <div className="space-y-3">

                {filteredUsers.map(
                  (user, index) => (
                    <div
                      key={user.user_id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:bg-white/[0.04]"
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        {/* USER */}
                        <div className="min-w-0">

                          <div className="flex items-center gap-3">

                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">
                              {index + 1}
                            </span>

                            <div className="min-w-0">

                              <p className="font-medium">
                                User
                              </p>

                              <p className="mt-1 truncate font-mono text-xs text-white/30">
                                {shortId(
                                  user.user_id
                                )}
                              </p>

                            </div>

                          </div>

                        </div>

                        {/* STATS */}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

                          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-center">

                            <p className="text-lg font-semibold">
                              <AnimatedNumber
                                value={
                                  user.answers
                                }
                                duration={600}
                              />
                            </p>

                            <p className="text-[10px] uppercase tracking-wider text-white/25">
                              Answers
                            </p>

                          </div>

                          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-center">

                            <p className="text-lg font-semibold">
                              <AnimatedNumber
                                value={
                                  user.replies
                                }
                                duration={600}
                              />
                            </p>

                            <p className="text-[10px] uppercase tracking-wider text-white/25">
                              Replies
                            </p>

                          </div>

                          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-center">

                            <p className="text-lg font-semibold">
                              <AnimatedNumber
                                value={
                                  user.reactions
                                }
                                duration={600}
                              />
                            </p>

                            <p className="text-[10px] uppercase tracking-wider text-white/25">
                              Reactions
                            </p>

                          </div>

                          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-center">

                            <p className="text-lg font-semibold">
                              <AnimatedNumber
                                value={
                                  user.reports
                                }
                                duration={600}
                              />
                            </p>

                            <p className="text-[10px] uppercase tracking-wider text-white/25">
                              Reports
                            </p>

                          </div>

                        </div>

                        {/* TOTAL */}
                        <div className="shrink-0 text-left lg:text-right">

                          <p className="text-2xl font-bold">
                            <AnimatedNumber
                              value={
                                user.totalActivity
                              }
                              duration={900}
                            />
                          </p>

                          <p className="text-[10px] uppercase tracking-wider text-white/25">
                            Total activity
                          </p>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </section>

        {/* FOOTER */}
        <div className="mt-12 border-t border-white/10 pt-6 text-center">

          <Link
            href="/admin"
            className="text-sm text-white/30 transition hover:text-white"
          >
            ← Back to Admin Dashboard
          </Link>

        </div>

      </div>
    </main>
  );
}