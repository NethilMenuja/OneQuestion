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

type NotificationGroup = {
  actor_id: string;
  notifications: Notification[];
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Which notification group is open
  const [expandedActor, setExpandedActor] = useState<string | null>(null);

  // Selected answer for expanded notification
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);

  // Replies
  const [replies, setReplies] = useState<Reply[]>([]);

  // Reply box
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);

  // Loading answer
  const [answerLoading, setAnswerLoading] = useState(false);

  // Delete loading
  const [deleting, setDeleting] = useState(false);

  // =========================
  // LOAD NOTIFICATIONS
  // =========================

  const loadNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, user_id, actor_id, answer_id, type, message, is_read, created_at"
      )
      .eq("user_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Notification load error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      setNotifications([]);
    } else {
      setNotifications(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadNotifications();
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  // =========================
  // GROUP BY ACTOR
  // =========================

  const groupMap = new Map<string, Notification[]>();

  notifications.forEach((notification) => {
    if (!groupMap.has(notification.actor_id)) {
      groupMap.set(notification.actor_id, []);
    }

    groupMap.get(notification.actor_id)!.push(notification);
  });

  const notificationGroups: NotificationGroup[] = [];

  groupMap.forEach((groupNotifications, actor_id) => {
    notificationGroups.push({
      actor_id,
      notifications: groupNotifications,
    });
  });

  const totalUnread = notifications.length;

  // =========================
  // OPEN / CLOSE DROPDOWN
  // =========================

  const toggleGroup = async (group: NotificationGroup) => {
    if (expandedActor === group.actor_id) {
      setExpandedActor(null);
      setSelectedAnswer(null);
      setReplies([]);
      setReplyOpen(false);
      setReplyText("");
      return;
    }

    setExpandedActor(group.actor_id);
    setSelectedAnswer(null);
    setReplies([]);
    setReplyOpen(false);
    setReplyText("");

    // Load the first answer connected to this group
    const firstNotificationWithAnswer = group.notifications.find(
      (notification) => notification.answer_id !== null
    );

    if (!firstNotificationWithAnswer?.answer_id) {
      return;
    }

    setAnswerLoading(true);

    const { data: answerData, error: answerError } = await supabase
      .from("answers")
      .select("id, answer, name, country, created_at")
      .eq("id", firstNotificationWithAnswer.answer_id)
      .maybeSingle();

    if (answerError) {
      console.error("Answer load error:", {
        message: answerError.message,
        details: answerError.details,
        hint: answerError.hint,
        code: answerError.code,
      });
    }

    setSelectedAnswer(answerData || null);

    if (answerData) {
      const { data: replyData, error: replyError } = await supabase
        .from("replies")
        .select("id, answer_id, user_id, reply, created_at")
        .eq("answer_id", answerData.id)
        .order("created_at", { ascending: true });

      if (replyError) {
        console.error("Replies load error:", {
          message: replyError.message,
          details: replyError.details,
          hint: replyError.hint,
          code: replyError.code,
        });
      }

      setReplies(replyData || []);
    }

    setAnswerLoading(false);
  };

  // =========================
  // READ ONE GROUP
  // =========================

  const markGroupAsRead = async (group: NotificationGroup) => {
    const ids = group.notifications.map((notification) => notification.id);

    if (ids.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", ids);

    if (error) {
      console.error("Mark read error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      return;
    }

    setNotifications((prev) =>
      prev.filter((notification) => !ids.includes(notification.id))
    );

    setExpandedActor(null);
    setSelectedAnswer(null);
    setReplies([]);
    setReplyOpen(false);
    setReplyText("");
  };

  // =========================
  // MARK ALL READ
  // =========================

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error("Mark all read error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      return;
    }

    setNotifications([]);
    setExpandedActor(null);
    setSelectedAnswer(null);
    setReplies([]);
  };

  // =========================
  // DELETE ONE NOTIFICATION
  // =========================

  const deleteNotification = async (notification: Notification) => {
    setDeleting(true);

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notification.id);

    if (error) {
      console.error("Delete notification error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      setDeleting(false);
      return;
    }

    setNotifications((prev) =>
      prev.filter((item) => item.id !== notification.id)
    );

    setDeleting(false);
  };

  // =========================
  // DELETE ALL IN GROUP
  // =========================

  const deleteGroup = async (group: NotificationGroup) => {
    setDeleting(true);

    const ids = group.notifications.map((notification) => notification.id);

    const { error } = await supabase
      .from("notifications")
      .delete()
      .in("id", ids);

    if (error) {
      console.error("Delete group error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      setDeleting(false);
      return;
    }

    setNotifications((prev) =>
      prev.filter((notification) => !ids.includes(notification.id))
    );

    setExpandedActor(null);
    setSelectedAnswer(null);
    setReplies([]);
    setReplyOpen(false);
    setReplyText("");

    setDeleting(false);
  };

  // =========================
  // SEND REPLY
  // =========================

  const sendReply = async () => {
    if (!selectedAnswer) return;

    const cleanReply = replyText.trim();

    if (!cleanReply) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please sign in to reply.");
      return;
    }

    setReplySending(true);

    const { data, error } = await supabase
      .from("replies")
      .insert({
        answer_id: selectedAnswer.id,
        user_id: user.id,
        reply: cleanReply,
      })
      .select("id, answer_id, user_id, reply, created_at")
      .single();

    if (error) {
      console.error("Reply error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      setReplySending(false);
      return;
    }

    if (data) {
      setReplies((prev) => [...prev, data]);
    }

    setReplyText("");
    setReplyOpen(false);
    setReplySending(false);
  };

  // =========================
  // TIME
  // =========================

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="relative min-h-screen w-full overflow-x-hidden bg-transparent text-white">
        <SkyBackground />

        <div className="relative z-20 flex min-h-screen items-center justify-center">
          <div className="rounded-2xl border border-white/10 bg-black/30 px-6 py-4 text-sm text-white/70 backdrop-blur-xl">
            Loading notifications...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-transparent text-white">
      <SkyBackground />

      <div className="pointer-events-none fixed inset-0 z-0 bg-black/10" />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <ScrollReveal>
          {/* HEADER */}
<div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
  <div>
    <div className="mb-3 flex items-center gap-2">
      <button
        onClick={() => (window.location.href = "/")}
        className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/70 backdrop-blur-xl transition hover:bg-white/15 hover:text-white"
      >
        ← Home
      </button>
    </div>

    <div className="mb-2 flex items-center gap-3">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Notifications
      </h1>

      {totalUnread > 0 && (
        <div className="flex h-8 min-w-8 items-center justify-center rounded-full bg-red-500 px-2 text-sm font-bold text-white shadow-lg shadow-red-500/30">
          {totalUnread}
        </div>
      )}
    </div>

    <p className="text-sm text-white/60">
      See what people are saying about your answers.
    </p>
  </div>

  {totalUnread > 0 && (
    <button
      onClick={markAllAsRead}
      className="w-fit rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/75 backdrop-blur-xl transition hover:bg-white/15 hover:text-white"
    >
      Mark all as read
    </button>
  )}
</div>

          {/* EMPTY */}
          {notificationGroups.length === 0 ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/25 p-10 text-center shadow-2xl backdrop-blur-2xl">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/10 text-4xl">
                  🔔
                </div>

                <h2 className="text-xl font-semibold">
                  You&apos;re all caught up
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/55">
                  New replies and activity on your answers will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {notificationGroups.map((group) => {
                const isExpanded = expandedActor === group.actor_id;
                const count = group.notifications.length;

                return (
                  <div
                    key={group.actor_id}
                    className={`group relative overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-2xl transition-all duration-500 ${
                      isExpanded
                        ? "border-red-400/20 bg-black/35"
                        : "border-white/10 bg-black/25 hover:border-white/20 hover:bg-black/30"
                    }`}
                  >
                    {/* RED LEFT LINE */}
                    <div
                      className={`absolute left-0 top-0 h-full w-1 bg-red-500 transition-all duration-500 ${
                        isExpanded
                          ? "shadow-[0_0_25px_rgba(239,68,68,0.9)]"
                          : "shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                      }`}
                    />

                    {/* ========================= */}
                    {/* CARD HEADER / CLICK AREA */}
                    {/* ========================= */}

                    <button
                      onClick={() => toggleGroup(group)}
                      className="relative w-full p-5 text-left sm:p-6"
                    >
                      <div className="flex items-center gap-4">
                        {/* ICON */}
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500/30 to-white/10 text-xl shadow-lg">
                          🔔

                          <span className="absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white shadow-lg shadow-red-500/40">
                            {count}
                          </span>

                          {!isExpanded && (
                            <span className="absolute inset-0 animate-ping rounded-full bg-red-500/10" />
                          )}
                        </div>

                        {/* TEXT */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-semibold text-white">
                              New activity
                            </h2>

                            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-300">
                              NEW
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-white/40">
                            {count} {count === 1 ? "message" : "messages"}
                          </p>
                        </div>

                        {/* ARROW */}
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/50 transition-all duration-500 ${
                            isExpanded
                              ? "rotate-180 bg-white/10 text-white"
                              : ""
                          }`}
                        >
                          ↓
                        </div>
                      </div>
                    </button>

                    {/* ========================= */}
                    {/* DROPDOWN */}
                    {/* ========================= */}

                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${
                        isExpanded
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="border-t border-white/10 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
                          {/* MESSAGES */}
                          <div className="space-y-2">
                            {group.notifications.map(
                              (notification, index) => (
                                <div
                                  key={notification.id}
                                  className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-white/5 bg-white/[0.045] p-4"
                                  style={{
                                    animationDelay: `${index * 60}ms`,
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]" />

                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm leading-6 text-white/85">
                                        {notification.message}
                                      </p>

                                      <p className="mt-2 text-[11px] text-white/30">
                                        {formatTime(notification.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>

                          {/* ANSWER PREVIEW */}
                          {answerLoading ? (
                            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center text-xs text-white/40">
                              Loading answer...
                            </div>
                          ) : selectedAnswer ? (
                            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                                Related answer
                              </p>

                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                                  🌍
                                </div>

                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white">
                                    {selectedAnswer.name}
                                  </p>

                                  <p className="text-xs text-white/35">
                                    {selectedAnswer.country}
                                  </p>
                                </div>
                              </div>

                              <p className="mt-3 text-sm leading-6 text-white/70">
                                {selectedAnswer.answer}
                              </p>
                            </div>
                          ) : null}

                          {/* REPLIES */}
                          {selectedAnswer && (
                            <div className="mt-4">
                              <div className="mb-2 flex items-center justify-between">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                                  Replies
                                </p>

                                <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-white/40">
                                  {replies.length}
                                </span>
                              </div>

                              {replies.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-xs text-white/30">
                                  No replies yet.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {replies.map((reply) => (
                                    <div
                                      key={reply.id}
                                      className="rounded-2xl border border-white/5 bg-white/[0.035] p-3"
                                    >
                                      <div className="flex gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm">
                                          💬
                                        </div>

                                        <div className="min-w-0">
                                          <p className="text-sm leading-6 text-white/70">
                                            {reply.reply}
                                          </p>

                                          <p className="mt-1 text-[10px] text-white/25">
                                            {formatTime(reply.created_at)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* REPLY INPUT */}
                          {replyOpen && selectedAnswer && (
                            <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                              <textarea
                                value={replyText}
                                onChange={(e) =>
                                  setReplyText(e.target.value)
                                }
                                rows={3}
                                placeholder="Write a reply..."
                                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.08]"
                              />

                              <div className="mt-2 flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setReplyOpen(false);
                                    setReplyText("");
                                  }}
                                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
                                >
                                  Cancel
                                </button>

                                <button
                                  onClick={sendReply}
                                  disabled={
                                    !replyText.trim() || replySending
                                  }
                                  className="rounded-xl bg-white px-5 py-2 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {replySending ? "Sending..." : "Send"}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* ========================= */}
                          {/* THREE BUTTONS */}
                          {/* ========================= */}

                          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                            {/* REPLY */}
                            <button
                              onClick={() => setReplyOpen((prev) => !prev)}
                              disabled={!selectedAnswer}
                              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <span>↩</span>
                              <span>Reply</span>
                            </button>

                            {/* READ */}
                            <button
                              onClick={() => markGroupAsRead(group)}
                              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                            >
                              <span>✓</span>
                              <span>Read</span>
                            </button>

                            {/* DELETE */}
                            <button
                              onClick={() => deleteGroup(group)}
                              disabled={deleting}
                              className="flex items-center justify-center gap-2 rounded-2xl border border-red-400/15 bg-red-500/[0.06] px-3 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/15 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <span>🗑</span>
                              <span>{deleting ? "..." : "Delete"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollReveal>
      </div>
    </main>
  );
}