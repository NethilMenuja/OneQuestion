"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SkyBackground from "./SkyBackground";
import ScrollReveal from "./ScrollReveal";

type User = {
  id: string;
  email?: string;
};

type Answer = {
  id: number;
  question_id: number;
  answer: string;
  name: string;
  country: string;
  created_at: string;
  likes?: number;
};

type Reply = {
  id: number;
  answer_id: number;
  user_id: string;
  reply: string;
  created_at: string;
};

type Question = {
  id: number;
  question: string;
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

export default function Home() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [replies, setReplies] = useState<Reply[]>([]);
  const [answerText, setAnswerText] = useState("");
  const [userName, setUserName] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [likingId, setLikingId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [postingReplyId, setPostingReplyId] = useState<number | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<number | null>(null);

  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [bookmarkingId, setBookmarkingId] = useState<number | null>(null);

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (user) {
        loadUnreadNotifications();
      } else {
        setUnreadNotifications(0);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;

      setUser(currentUser);

      if (currentUser) {
        loadUnreadNotifications();
      } else {
        setUnreadNotifications(0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUnreadNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUnreadNotifications(0);
      return;
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error(
        "Notifications count error:",
        error
      );
      return;
    }

    setUnreadNotifications(count ?? 0);
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    loadUnreadNotifications();

    const notificationTimer =
      window.setInterval(() => {
        loadUnreadNotifications();
      }, 5000);

    return () => {
      window.clearInterval(notificationTimer);
    };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const loadData = async () => {
    setLoading(true);
    setMessage("");

    const today = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const {
      data: questionData,
      error: questionError,
    } = await supabase
      .from("questions")
      .select("id, question")
      .eq("question_date", today)
      .maybeSingle();

    if (questionError) {
      console.error("Question error:", {
        message: questionError.message,
        code: questionError.code,
        details: questionError.details,
        hint: questionError.hint,
      });

      setMessage("Could not load today's question.");
      setLoading(false);
      return;
    }

    if (!questionData) {
      setQuestion(null);
      setAnswers([]);
      setReplies([]);
      setBookmarkedIds([]);
      setMessage("No question available for today.");
      setLoading(false);
      return;
    }

    setQuestion(questionData);

    const {
      data: answersData,
      error: answersError,
    } = await supabase
      .from("answers")
      .select("id, question_id, answer, name, country, created_at")
      .eq("question_id", questionData.id)
      .order("created_at", { ascending: false });

    if (answersError) {
      console.error("Answers error:", answersError);
      setAnswers([]);
      setReplies([]);
      setBookmarkedIds([]);
      setMessage("Could not load the answers.");
      setLoading(false);
      return;
    }

    const answerIds = (answersData ?? []).map((answer) => answer.id);

    /* BOOKMARKS */
    if (user && answerIds.length > 0) {
      const {
        data: bookmarksData,
        error: bookmarksError,
      } = await supabase
        .from("bookmarks")
        .select("answer_id")
        .eq("user_id", user.id)
        .in("answer_id", answerIds);

      if (bookmarksError) {
        console.error("Bookmarks load error:", {
          message: bookmarksError.message,
          code: bookmarksError.code,
          details: bookmarksError.details,
          hint: bookmarksError.hint,
        });

        setBookmarkedIds([]);
      } else {
        setBookmarkedIds(
          (bookmarksData ?? []).map(
            (bookmark) => bookmark.answer_id
          )
        );
      }
    } else {
      setBookmarkedIds([]);
    }

    /* LIKES */
    let likeCounts: Record<number, number> = {};

    if (answerIds.length > 0) {
      const { data: likesData, error: likesError } =
        await supabase
          .from("likes")
          .select("answer_id")
          .in("answer_id", answerIds)
          .not("user_id", "is", null);

      if (likesError) {
        console.error("Likes error:", likesError);
      } else {
        likeCounts = (likesData ?? []).reduce(
          (counts, like) => {
            counts[like.answer_id] =
              (counts[like.answer_id] ?? 0) + 1;

            return counts;
          },
          {} as Record<number, number>
        );
      }
    }

    setAnswers(
      (answersData ?? []).map((answer) => ({
        ...answer,
        likes: likeCounts[answer.id] ?? 0,
      }))
    );

    /* REPLIES */
    if (answerIds.length > 0) {
      const {
        data: repliesData,
        error: repliesError,
      } = await supabase
        .from("replies")
        .select("id, answer_id, user_id, reply, created_at")
        .in("answer_id", answerIds)
        .order("created_at", { ascending: true });

      if (repliesError) {
        console.error("Replies error:", repliesError);
        setReplies([]);
      } else {
        setReplies(repliesData ?? []);
      }
    } else {
      setReplies([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    let lastDate = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const checkDate = window.setInterval(() => {
      const today = new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

      if (today !== lastDate) {
        lastDate = today;
        loadData();
      }
    }, 30000);

    return () => window.clearInterval(checkDate);
  }, []);

  const handleLike = async (answerId: number) => {
    if (!user) {
      setMessage("Please sign in to like an answer.");
      return;
    }

    if (likingId !== null) {
      return;
    }

    setLikingId(answerId);

    try {
      const {
        data: existingLike,
        error: checkError,
      } = await supabase
        .from("likes")
        .select("id")
        .eq("answer_id", answerId)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (checkError) {
        console.error("Check like error:", checkError);
        return;
      }

      if (existingLike) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("id", existingLike.id);

        if (error) {
          console.error("Unlike error:", error);
          return;
        }

        setAnswers((currentAnswers) =>
          currentAnswers.map((item) =>
            item.id === answerId
              ? {
                  ...item,
                  likes: Math.max(
                    (item.likes ?? 0) - 1,
                    0
                  ),
                }
              : item
          )
        );

        return;
      }

      const { error } = await supabase.from("likes").insert({
        answer_id: answerId,
        user_id: user.id,
      });

      if (error) {
        console.error("Like error:", error);
        return;
      }

      setAnswers((currentAnswers) =>
        currentAnswers.map((item) =>
          item.id === answerId
            ? {
                ...item,
                likes: (item.likes ?? 0) + 1,
              }
            : item
        )
      );
    } finally {
      setLikingId(null);
    }
  };

  const handleBookmark = async (answerId: number) => {
    if (!user) {
      setMessage("Please sign in to save an answer.");
      return;
    }

    if (bookmarkingId !== null) {
      return;
    }

    setBookmarkingId(answerId);
    setMessage("");

    try {
      const isBookmarked =
        bookmarkedIds.includes(answerId);

      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("answer_id", answerId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Remove bookmark error:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });

          setMessage(
            error.message ||
              "Could not remove bookmark."
          );

          return;
        }

        setBookmarkedIds((current) =>
          current.filter((id) => id !== answerId)
        );

        return;
      }

      const { error } = await supabase
        .from("bookmarks")
        .insert({
          answer_id: answerId,
          user_id: user.id,
        });

      if (error) {
        console.error("Bookmark error:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });

        setMessage(
          error.message ||
            "Could not save answer."
        );

        return;
      }

      setBookmarkedIds((current) =>
        current.includes(answerId)
          ? current
          : [...current, answerId]
      );
    } finally {
      setBookmarkingId(null);
    }
  };

  const handleReplySubmit = async (answerId: number) => {
    const cleanReply = replyText.trim();

    if (!user) {
      setMessage(
        "Please sign in to reply to an answer."
      );
      return;
    }

    if (!cleanReply) {
      setMessage("Please write a reply first.");
      return;
    }

    if (postingReplyId !== null) {
      return;
    }

    setPostingReplyId(answerId);
    setMessage("");

    const {
      data: answerOwner,
      error: ownerError,
    } = await supabase
      .from("answers")
      .select("user_id")
      .eq("id", answerId)
      .single();

    if (ownerError) {
      console.error("Answer owner error:", ownerError);
      setMessage("Could not find the answer owner.");
      setPostingReplyId(null);
      return;
    }

    const { data, error } = await supabase
      .from("replies")
      .insert({
        answer_id: answerId,
        user_id: user.id,
        reply: cleanReply,
      })
      .select(
        "id, answer_id, user_id, reply, created_at"
      )
      .single();

    if (error) {
      console.error("Reply error:", error);
      setMessage("Could not post your reply.");
      setPostingReplyId(null);
      return;
    }

    /* NOTIFICATION */

    if (data) {
      setReplies((currentReplies) => [
        ...currentReplies,
        data,
      ]);
    }

    setReplyText("");
    setExpandedReplies(answerId);
    setPostingReplyId(null);
    setMessage("Reply posted! ❤️");
  };

  const handleSubmit = async (): Promise<void> => {
    if (!question) {
      return;
    }

    const cleanAnswer = answerText.trim();

    if (!userName.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    if (!country) {
      setMessage("Please select your country.");
      return;
    }

    if (!cleanAnswer) {
      setMessage("Please write an answer first.");
      return;
    }

    if (!user) {
      localStorage.setItem(
        "pendingAnswer",
        JSON.stringify({
          questionId: question.id,
          answer: cleanAnswer,
          name: userName.trim(),
          country: country,
        })
      );

      window.location.href = "/signup";
      return;
    }

    setPosting(true);
    setMessage("");

    const { error } = await supabase
      .from("answers")
      .insert({
        question_id: question.id,
        answer: cleanAnswer,
        name: userName.trim(),
        country: country,
        user_id: user.id,
      });

    if (error) {
      console.error("Post answer error:", error);
      setMessage("Could not post your answer.");
      setPosting(false);
      return;
    }

    setAnswerText("");
    setUserName("");
    setCountry("");
    setMessage("Your answer was posted! ❤️");

    await loadData();

    setPosting(false);
  };

  const countries = new Set(
    answers
      .map((item) => item.country)
      .filter(
        (country) =>
          country && country !== "Other"
      )
  ).size;

  const worldwide = Math.round(
    (countries / 195) * 100
  );

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-transparent text-white">
      <SkyBackground />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-10">

        {/* HEADER */}
        <ScrollReveal>
          <header className="mb-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  ONEQUESTION
                </h1>

                <p className="mt-2 text-sm text-white/50">
                  One question. One answer. One world.
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">

                {/* TOP ROW */}
                <div className="flex items-center gap-2">
                  {!user ? (
                    <>
                      <a
                        href="/login"
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        Sign In
                      </a>

                      <a
                        href="/signup"
                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/80"
                      >
                        Sign Up
                      </a>
                    </>
                  ) : (
                    <>
                      <span className="max-w-[180px] truncate text-xs text-white/60 sm:text-sm">
                        {user.email}
                      </span>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/80"
                      >
                        Logout
                      </button>
                    </>
                  )}
                </div>

                {/* BOTTOM ROW */}
                {user && (
                  <div className="w-full max-w-full overflow-x-auto sm:overflow-visible">
  <div className="flex w-max min-w-full items-center justify-end gap-2 sm:w-full sm:min-w-0 sm:flex-wrap sm:justify-center">
                      <a
                        href="/explore"
                        className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
                      >
                        Explore
                      </a>

                      <a
                        href="/world"
                        className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
                      >
                        World
                      </a>

                      <a
                        href="/archive"
                        className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
                      >
                        Archive
                      </a>

                      <a
                        href="/popular"
                        className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
                      >
                        Popular
                      </a>

                      <a
                        href="/profile"
                        className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
                      >
                        Profile
                      </a>

                      <a
                        href="/saved"
                        className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
                      >
                        Saved
                      </a>

                      <a
                        href="/contributors"
                        className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
                      >
                        Contributors
                      </a>

                      <a
                        href="/how-it-works"
                        className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
                      >
                        How It Works
                      </a>

                      <a
                        href="/about"
                        className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
                      >
                        About
                      </a>

                      <a
                        href="/notifications"
                        className="relative shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
                      >
                        🔔 Notifications

                        {unreadNotifications > 0 && (
                          <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {unreadNotifications}
                          </span>
                        )}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>
        </ScrollReveal>

        {/* QUESTION */}
        <ScrollReveal delay={100}>
          <section className="mb-12 text-center">
            {loading ? (
              <p className="text-white/50">
                Loading question...
              </p>
            ) : question ? (
              <>
                <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">
                  Today&apos;s Question
                </p>

                <h2 className="break-words text-2xl font-semibold leading-tight sm:text-3xl md:text-5xl">
                  {question.question}
                </h2>
              </>
            ) : (
              <p className="text-white/50">
                No active question found.
              </p>
            )}
          </section>
        </ScrollReveal>

        {/* ANSWER BOX */}
        {question && (
          <ScrollReveal delay={150}>
            <section className="mx-auto mb-16 max-w-2xl">
              <input
                type="text"
                value={userName}
                onChange={(e) =>
                  setUserName(e.target.value)
                }
                placeholder="Your name..."
                className="mb-3 w-full rounded-2xl border border-white/20 bg-black/20 p-4 text-lg text-white outline-none backdrop-blur-md transition placeholder:text-white/50 focus:border-white/40 focus:bg-black/25"
              />

              <select
                value={country}
                onChange={(e) =>
                  setCountry(e.target.value)
                }
                className="mb-3 w-full rounded-2xl border border-white/20 bg-black/20 p-4 text-lg text-white outline-none backdrop-blur-md transition focus:border-white/40 focus:bg-black/25"
              >
                <option
                  value=""
                  className="bg-black"
                >
                  Select your country...
                </option>

                <option value="Sri Lanka" className="bg-black">
                  🇱🇰 Sri Lanka
                </option>

                <option value="India" className="bg-black">
                  🇮🇳 India
                </option>

                <option value="United States" className="bg-black">
                  🇺🇸 United States
                </option>

                <option value="United Kingdom" className="bg-black">
                  🇬🇧 United Kingdom
                </option>

                <option value="Australia" className="bg-black">
                  🇦🇺 Australia
                </option>

                <option value="Canada" className="bg-black">
                  🇨🇦 Canada
                </option>

                <option value="Japan" className="bg-black">
                  🇯🇵 Japan
                </option>

                <option value="Germany" className="bg-black">
                  🇩🇪 Germany
                </option>

                <option value="France" className="bg-black">
                  🇫🇷 France
                </option>

                <option value="Other" className="bg-black">
                  🌍 Other
                </option>
              </select>

              <textarea
                value={answerText}
                onChange={(e) =>
                  setAnswerText(e.target.value)
                }
                placeholder="Write your answer..."
                rows={6}
                className="w-full resize-none rounded-2xl border border-white/20 bg-black/20 p-5 text-lg text-white outline-none backdrop-blur-md transition placeholder:text-white/50 focus:border-white/40 focus:bg-black/25"
              />

              <div className="mt-4 flex flex-col items-center gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={posting}
                  className="rounded-full bg-white px-8 py-3 font-semibold text-black transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {posting
                    ? "Posting..."
                    : "Post Answer"}
                </button>

                {message && (
                  <p className="max-w-full break-words text-center text-sm text-white/60">
                    {message}
                  </p>
                )}
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* STATS */}
        <section className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ScrollReveal>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-3xl font-bold">
                {answers.length}
              </p>

              <p className="mt-2 text-sm text-white/40">
                Answers
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-3xl font-bold">
                {countries}
              </p>

              <p className="mt-2 text-sm text-white/40">
                Countries
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-3xl font-bold">
                {worldwide}%
              </p>

              <p className="mt-2 text-sm text-white/40">
                World Coverage
              </p>
            </div>
          </ScrollReveal>
        </section>

        {/* ANSWERS */}
        <section className="[overflow-anchor:none]">
          <ScrollReveal>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                Community Answers
              </h3>

              <span className="text-sm text-white/30">
                {answers.length} responses
              </span>
            </div>
          </ScrollReveal>

          {loading ? (
            <ScrollReveal>
              <p className="text-white/40">
                Loading answers...
              </p>
            </ScrollReveal>
          ) : answers.length === 0 ? (
            <ScrollReveal>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <p className="text-white/50">
                  No answers yet.
                </p>

                <p className="mt-2 text-sm text-white/30">
                  Be the first person to answer.
                </p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="space-y-4">
              <div className="mb-6">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search answers..."
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 text-sm text-white outline-none backdrop-blur-sm transition focus:border-white/20"
                />
              </div>

              {answers
                .filter((item) =>
                  `${item.answer} ${item.name} ${item.country}`
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                )
                .map((item, index) => {
                  const answerReplies = replies.filter(
                    (reply) =>
                      reply.answer_id === item.id
                  );

                  const isExpanded =
                    expandedReplies === item.id;

                  const isBookmarked =
                    bookmarkedIds.includes(item.id);

                  return (
                    <ScrollReveal
                      key={item.id}
                      delay={index * 100}
                    >
                      <article className="min-w-0 transform-gpu rounded-2xl border border-white/15 bg-black/30 p-4 backdrop-blur-sm sm:p-6">

                        {/* USER */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10">
                              {countryFlags[
                                item.country
                              ] ? (
                                <img
                                  src={`https://flagcdn.com/w80/${countryFlags[item.country]}.png`}
                                  alt={item.country}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xl">
                                  🌍
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">
                                {item.name}
                              </p>

                              <p className="text-xs text-white/30">
                                Community member
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* ANSWER */}
                        <p className="break-words whitespace-pre-wrap leading-7 text-white/80">
                          {searchTerm ? (
                            item.answer
                              .split(new RegExp(`(${searchTerm})`, "gi"))
                              .map((part, i) =>
                                part.toLowerCase() === searchTerm.toLowerCase() ? (
                                  <mark
                                    key={i}
                                    className="rounded bg-white-300/30 px-0.5 text-black-200"
                                  >
                                    {part}
                                  </mark>
                                ) : (
                                  part
                                )
                              )
                          ) : (
                            item.answer
                          )}
                        </p>

                        {/* LIKE + REPLY + BOOKMARK */}
                        <div className="mt-4 flex flex-wrap justify-end gap-2">

                          {/* LIKE */}
                          <button
                            type="button"
                            onClick={() =>
                              handleLike(item.id)
                            }
                            disabled={
                              likingId === item.id
                            }
                            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {likingId === item.id
                              ? "❤️ ..."
                              : `❤️ ${item.likes ?? 0}`}
                          </button>

                          {/* REPLIES */}
                          <button
                            type="button"
                            onClick={() => {
                              setMessage("");

                              if (isExpanded) {
                                setExpandedReplies(null);
                                setReplyingId(null);
                                setReplyText("");
                              } else {
                                setExpandedReplies(
                                  item.id
                                );

                                if (user) {
                                  setReplyingId(item.id);
                                  setReplyText("");
                                }
                              }
                            }}
                            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                          >
                            💬 {answerReplies.length}{" "}
                            {answerReplies.length === 1
                              ? "Reply"
                              : "Replies"}
                          </button>

                          {/* BOOKMARK */}
                          {user && (
                            <button
                              type="button"
                              onClick={() =>
                                handleBookmark(
                                  item.id
                                )
                              }
                              disabled={
                                bookmarkingId ===
                                item.id
                              }
                              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-all duration-300 ${
                                isBookmarked
                                  ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-300"
                                  : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              <span
                                className={`inline-flex items-center gap-1 transition-all duration-300 ${
                                  isBookmarked
                                    ? "scale-105"
                                    : "scale-100"
                                }`}
                              >
                                {bookmarkingId ===
                                item.id
                                  ? "🔖 ..."
                                  : isBookmarked
                                    ? "🔖 Saved"
                                    : "🔖 Save"}
                              </span>
                            </button>
                          )}
                        </div>

                        {/* REPLY INPUT */}
                        {replyingId === item.id &&
                          user && (
                            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4">
                              <textarea
                                value={replyText}
                                onChange={(e) =>
                                  setReplyText(
                                    e.target.value
                                  )
                                }
                                placeholder="Write a reply..."
                                rows={3}
                                className="w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
                              />

                              <div className="mt-3 flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingId(null);
                                    setReplyText("");
                                  }}
                                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                                >
                                  Cancel
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleReplySubmit(
                                      item.id
                                    )
                                  }
                                  disabled={
                                    postingReplyId ===
                                    item.id
                                  }
                                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {postingReplyId ===
                                  item.id
                                    ? "Posting..."
                                    : "Post Reply"}
                                </button>
                              </div>
                            </div>
                          )}

                        {/* EXPANDABLE REPLIES */}
                        <div
                          className={`grid transition-all duration-500 ease-out ${
                            isExpanded
                              ? "mt-5 grid-rows-[1fr] opacity-100"
                              : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <div className="min-h-0 overflow-hidden">
                            <div className="space-y-3 border-t border-white/10 pt-4">

                              {answerReplies.length ===
                              0 ? (
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                                  <p className="text-sm text-white/40">
                                    No replies yet.
                                  </p>

                                  {!user && (
                                    <p className="mt-1 text-xs text-white/25">
                                      Sign in to add a
                                      reply.
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                                    Replies
                                  </p>

                                  {answerReplies.map(
                                    (
                                      reply,
                                      replyIndex
                                    ) => (
                                      <div
                                        key={
                                          reply.id
                                        }
                                        className="translate-y-0 animate-[replyIn_500ms_ease-out_forwards] rounded-xl border border-white/10 bg-white/5 p-4"
                                        style={{
                                          animationDelay: `${replyIndex * 80}ms`,
                                          opacity: 0,
                                        }}
                                      >
                                        <p className="break-words whitespace-pre-wrap text-sm leading-6 text-white/75">
                                          {
                                            reply.reply
                                          }
                                        </p>

                                        <p className="mt-2 text-xs text-white/30">
                                          Community member
                                        </p>
                                      </div>
                                    )
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    </ScrollReveal>
                  );
                })}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <ScrollReveal delay={100}>
          <footer className="mt-20 border-t border-white/10 pt-8 text-center">
            <p className="text-sm text-white/30">
              ONEQUESTION © 2026
            </p>
          </footer>
        </ScrollReveal>
      </div>

      <style jsx global>{`
        @keyframes replyIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </main>
  );
}