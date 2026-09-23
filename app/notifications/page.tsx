"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SkyBackground from "../SkyBackground";
import ScrollReveal from "../ScrollReveal";

type Notification = {
  id: number;
  user_id: string;
  actor_id: string;
  answer_id: number | null;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type Answer = {
  id: number;
  answer: string;
  name: string;
  country: string;
  created_at: string;
};

type Reply = {
  id: number;
  answer_id: number;
  user_id: string;
  reply: string;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  const [selectedAnswer, setSelectedAnswer] =
    useState<Answer | null>(null);

  const [replies, setReplies] = useState<Reply[]>([]);

  const [replyText, setReplyText] = useState("");

  const [loading, setLoading] = useState(true);

  const [loadingAnswer, setLoadingAnswer] = useState(false);

  const [postingReply, setPostingReply] = useState(false);

  const [message, setMessage] = useState("");

  const [userId, setUserId] = useState<string | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Auth session error:", sessionError);

      setUserId(null);
      setNotifications([]);
      setMessage("Could not load your account.");
      setLoading(false);
      return;
    }

    if (!session?.user) {
      setUserId(null);
      setNotifications([]);
      setLoading(false);

      window.location.href = "/login";
      return;
    }

    const user = session.user;

    setUserId(user.id);

    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, user_id, actor_id, answer_id, type, message, is_read, created_at"
      )
      .eq("user_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Notifications load error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      setNotifications([]);
      setMessage(error.message || "Could not load notifications.");
      setLoading(false);
      return;
    }

    setNotifications(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();

    const notificationTimer = window.setInterval(() => {
      loadNotifications();
    }, 5000);

    const { data: authSubscription } =
      supabase.auth.onAuthStateChange((event) => {
        if (
          event === "SIGNED_IN" ||
          event === "SIGNED_OUT" ||
          event === "TOKEN_REFRESHED"
        ) {
          loadNotifications();
        }
      });

    return () => {
      window.clearInterval(notificationTimer);
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const difference = now.getTime() - date.getTime();

    const seconds = Math.floor(difference / 1000);

    if (seconds < 60) {
      return "just now";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString();
  };

  const closeNotification = () => {
    setSelectedNotification(null);
    setSelectedAnswer(null);
    setReplies([]);
    setReplyText("");
    setMessage("");
  };

  const openNotification = async (
    notification: Notification
  ) => {
    setSelectedNotification(notification);
    setSelectedAnswer(null);
    setReplies([]);
    setReplyText("");
    setMessage("");
    setLoadingAnswer(true);

    // Mark notification as read
    if (!notification.is_read) {
      const { error: readError } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("id", notification.id)
        .eq("user_id", notification.user_id);

      if (readError) {
        console.error("Mark notification read error:", {
          message: readError.message,
          code: readError.code,
          details: readError.details,
          hint: readError.hint,
        });
      } else {
        setNotifications((current) =>
          current.filter(
            (item) => item.id !== notification.id
          )
        );
      }
    }

    if (notification.answer_id === null) {
      setLoadingAnswer(false);
      return;
    }

    // Load answer
    const {
      data: answer,
      error: answerError,
    } = await supabase
      .from("answers")
      .select(
        "id, answer, name, country, created_at"
      )
      .eq("id", notification.answer_id)
      .single();

    if (answerError) {
      console.error("Answer load error:", {
        message: answerError.message,
        code: answerError.code,
        details: answerError.details,
        hint: answerError.hint,
      });

      setMessage("Could not load the answer.");
      setLoadingAnswer(false);
      return;
    }

    setSelectedAnswer(answer);

    // Load replies
    const {
      data: repliesData,
      error: repliesError,
    } = await supabase
      .from("replies")
      .select(
        "id, answer_id, user_id, reply, created_at"
      )
      .eq("answer_id", notification.answer_id)
      .order("created_at", {
        ascending: true,
      });

    if (repliesError) {
      console.error("Replies load error:", {
        message: repliesError.message,
        code: repliesError.code,
        details: repliesError.details,
        hint: repliesError.hint,
      });
    } else {
      setReplies(repliesData ?? []);
    }

    setLoadingAnswer(false);
  };

  const handleReply = async () => {
    const cleanReply = replyText.trim();

    if (!selectedAnswer) {
      return;
    }

    if (!cleanReply) {
      setMessage("Please write a reply first.");
      return;
    }

    if (postingReply) {
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(
        "Reply auth error:",
        userError
      );

      setMessage("Please sign in to reply.");
      return;
    }

    setPostingReply(true);
    setMessage("");

    // Insert reply
    const {
      data,
      error,
    } = await supabase
      .from("replies")
      .insert({
        answer_id: selectedAnswer.id,
        user_id: user.id,
        reply: cleanReply,
      })
      .select(
        "id, answer_id, user_id, reply, created_at"
      )
      .single();

    if (error) {
      console.error("Reply error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      setMessage("Could not post your reply.");
      setPostingReply(false);
      return;
    }

    if (data) {
      setReplies((current) => [
        ...current,
        data,
      ]);
    }

    // Find the owner of the answer

    setReplyText("");
    setPostingReply(false);
    setMessage("Reply posted! ❤️");
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-transparent text-white">
      <SkyBackground variant="minimal" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10">
        <ScrollReveal>
          <header className="mb-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">
                    Notifications
                  </h1>

                  {unreadCount > 0 && (
                    <span className="flex min-w-7 items-center justify-center rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white shadow-lg shadow-red-500/20">
                      {unreadCount}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-white/50">
                  Replies and activity on your answers.
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
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />

              <p className="mt-4 text-sm text-white/40">
                Loading notifications...
              </p>
            </div>
          </ScrollReveal>
        ) : notifications.length === 0 ? (
          <ScrollReveal>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-sm">
              <div className="text-4xl">
                🔔
              </div>

              <p className="mt-4 text-lg font-medium">
                {message ||
                  "No notifications yet."}
              </p>

              <p className="mt-2 text-sm text-white/40">
                When someone replies to your
                answers, you&apos;ll see it here.
              </p>

              {userId && (
                <p className="mt-5 break-all text-[10px] text-white/10">
                  {userId}
                </p>
              )}
            </div>
          </ScrollReveal>
        ) : (
          <div className="space-y-3">
            {notifications.map(
              (notification, index) => (
                <ScrollReveal
                  key={notification.id}
                  delay={index * 80}
                >
                  <button
                    type="button"
                    onClick={() =>
                      openNotification(
                        notification
                      )
                    }
                    className={`group w-full rounded-2xl border p-5 text-left backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:bg-white/10 ${
                      notification.is_read
                        ? "border-white/10 bg-black/20"
                        : "border-white/20 bg-white/10 shadow-lg shadow-white/5"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl transition-transform duration-300 group-hover:scale-110">
                        {notification.type ===
                        "reply"
                          ? "💬"
                          : "🔔"}

                        {!notification.is_read && (
                          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-red-500 ring-2 ring-black/40" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-6 text-white/90">
                          {notification.message}
                        </p>

                        <p className="mt-2 text-xs text-white/35">
                          {formatTime(
                            notification.created_at
                          )}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center">
                        <span className="text-white/20 transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </div>
                  </button>
                </ScrollReveal>
              )
            )}
          </div>
        )}

        {selectedNotification && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={closeNotification}
          >
            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto animate-[notificationOpen_350ms_ease-out] rounded-3xl border border-white/15 bg-black/80 p-6 shadow-2xl backdrop-blur-xl"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Reply
                  </h2>

                  <p className="mt-1 text-xs text-white/40">
                    {formatTime(
                      selectedNotification.created_at
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeNotification}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {loadingAnswer ? (
                <div className="py-10 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />

                  <p className="mt-4 text-sm text-white/40">
                    Loading answer...
                  </p>
                </div>
              ) : selectedAnswer ? (
                <div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="whitespace-pre-wrap break-words leading-7 text-white/85">
                      {selectedAnswer.answer}
                    </p>

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <p className="font-medium">
                        {selectedAnswer.name}
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        {selectedAnswer.country}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="mb-4 text-sm font-medium text-white/70">
                      Replies
                    </h3>

                    {replies.length === 0 ? (
                      <p className="text-sm text-white/30">
                        No replies yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {replies.map(
                          (reply, index) => (
                            <div
                              key={reply.id}
                              className="animate-[replyIn_450ms_ease-out] rounded-2xl border border-white/10 bg-white/5 p-4"
                              style={{
                                animationDelay: `${index * 70}ms`,
                              }}
                            >
                              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-white/75">
                                {reply.reply}
                              </p>

                              <p className="mt-2 text-xs text-white/30">
                                {formatTime(
                                  reply.created_at
                                )}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <textarea
                      value={replyText}
                      onChange={(event) =>
                        setReplyText(
                          event.target.value
                        )
                      }
                      placeholder="Write a reply..."
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 transition focus:border-white/25 focus:bg-white/10"
                    />

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-white/40">
                        {message}
                      </p>

                      <button
                        type="button"
                        onClick={handleReply}
                        disabled={postingReply}
                        className="rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {postingReply
                          ? "Posting..."
                          : "Reply"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-10 text-center text-white/40">
                  This answer is no longer available.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes notificationOpen {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes replyIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}