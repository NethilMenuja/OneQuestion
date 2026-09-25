"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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

type ReactionType =
  | "love"
  | "haha"
  | "wow"
  | "sad"
  | "angry";

type ReactionCounts = {
  love: number;
  haha: number;
  wow: number;
  sad: number;
  angry: number;
};

type Reply = {
  id: number;
  answer_id: number;
  user_id: string;
  reply: string;
  created_at: string;
  name: string;
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

const reactionOptions: {
  type: ReactionType;
  emoji: string;
  label: string;
}[] = [
  {
    type: "love",
    emoji: "❤️",
    label: "Love",
  },
  {
    type: "haha",
    emoji: "😂",
    label: "Haha",
  },
  {
    type: "wow",
    emoji: "😮",
    label: "Wow",
  },
  {
    type: "sad",
    emoji: "😢",
    label: "Sad",
  },
  {
    type: "angry",
    emoji: "😡",
    label: "Angry",
  },
];

const reportReasons = [
  ["spam", "📢 Spam"],
  ["harassment", "😡 Harassment"],
  ["hate", "🚫 Hate speech"],
  ["sexual", "🔞 Sexual content"],
  ["violence", "⚠️ Violence"],
  ["misinformation", "ℹ️ Misinformation"],
  ["other", "📝 Other"],
];

export default function SharedAnswerClient({
  answerId,
}: {
  answerId: string;
}) {
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [reactionCounts, setReactionCounts] =
    useState<ReactionCounts>({
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0,
    });

  const [myReaction, setMyReaction] =
    useState<ReactionType | null>(null);

  const [reactionLoading, setReactionLoading] =
    useState(false);

  const [showReactions, setShowReactions] =
    useState(false);

  // Replies
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] =
    useState(false);

  // Answer Report
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  // Reply Report
  const [reportingReplyId, setReportingReplyId] =
    useState<number | null>(null);

  const [replyReportReason, setReplyReportReason] =
    useState("");

  const [replyReportDetails, setReplyReportDetails] =
    useState("");

  const [replyReportLoading, setReplyReportLoading] =
    useState(false);

  const [replyReportSent, setReplyReportSent] =
    useState(false);

  useEffect(() => {
    const loadAnswer = async () => {
      const id = Number(answerId);

      if (!id || Number.isNaN(id)) {
        setErrorMessage("Invalid answer link.");
        setLoading(false);
        return;
      }

      const { data: answerData, error: answerError } =
        await supabase
          .from("answers")
          .select(
            "id, question_id, user_id, answer, name, country, created_at"
          )
          .eq("id", id)
          .maybeSingle();

      if (answerError) {
        console.error(
          "Answer loading error:",
          answerError
        );
        setErrorMessage("Could not load this answer.");
        setLoading(false);
        return;
      }

      if (!answerData) {
        setErrorMessage(
          "This answer could not be found."
        );
        setLoading(false);
        return;
      }

      setAnswer(answerData);

      const { data: questionData } = await supabase
        .from("questions")
        .select("id, question")
        .eq("id", answerData.question_id)
        .maybeSingle();

      if (questionData) {
        setQuestion(questionData);
      }

      // Load reaction counts
      const {
        data: reactionsData,
        error: reactionsError,
      } = await supabase
        .from("reactions")
        .select("reaction_type")
        .eq("answer_id", id);

      if (reactionsError) {
        console.error(
          "Reactions loading error:",
          reactionsError
        );
      } else {
        const counts: ReactionCounts = {
          love: 0,
          haha: 0,
          wow: 0,
          sad: 0,
          angry: 0,
        };

        (reactionsData || []).forEach((reaction) => {
          const type =
            reaction.reaction_type as ReactionType;

          if (type in counts) {
            counts[type]++;
          }
        });

        setReactionCounts(counts);
      }

      // Check current user's reaction
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: myReactionData } =
          await supabase
            .from("reactions")
            .select("reaction_type")
            .eq("answer_id", id)
            .eq("user_id", user.id)
            .maybeSingle();

        if (myReactionData) {
          setMyReaction(
            myReactionData.reaction_type as ReactionType
          );
        } else {
          setMyReaction(null);
        }
      }

      // Load replies
      await loadReplies(id);

      setLoading(false);
    };

    loadAnswer();
  }, [answerId]);

  async function loadReplies(id: number) {
    const { data: repliesData, error: repliesError } =
      await supabase
        .from("replies")
        .select(
          "id, answer_id, user_id, reply, created_at"
        )
        .eq("answer_id", id)
        .order("created_at", {
          ascending: true,
        });

    if (repliesError) {
      console.error(
        "Replies loading error:",
        repliesError
      );
      return;
    }

    const rawReplies = repliesData || [];

    if (rawReplies.length === 0) {
      setReplies([]);
      return;
    }

    // Get names from latest answers
    const userIds = [
      ...new Set(
        rawReplies.map((item) => item.user_id)
      ),
    ];

    const { data: namesData, error: namesError } =
      await supabase
        .from("answers")
        .select("user_id, name, created_at")
        .in("user_id", userIds)
        .order("created_at", {
          ascending: false,
        });

    if (namesError) {
      console.error(
        "Reply names loading error:",
        namesError
      );
    }

    const nameMap: Record<string, string> = {};

    (namesData || []).forEach((item) => {
      if (!nameMap[item.user_id]) {
        nameMap[item.user_id] = item.name;
      }
    });

    const repliesWithNames: Reply[] =
      rawReplies.map((item) => ({
        ...item,
        name:
          nameMap[item.user_id] ||
          "ONEQUESTION user",
      }));

    setReplies(repliesWithNames);
  }

  async function handleReaction(type: ReactionType) {
    if (reactionLoading || !answer) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setReactionLoading(true);

    try {
      // Same reaction clicked = remove it
      if (myReaction === type) {
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("answer_id", answer.id)
          .eq("user_id", user.id);

        if (error) {
          console.error(
            "Remove reaction error:",
            error
          );
          return;
        }

        setReactionCounts((previous) => ({
          ...previous,
          [type]: Math.max(
            0,
            previous[type] - 1
          ),
        }));

        setMyReaction(null);
        return;
      }

      // User already has another reaction
      if (myReaction) {
        const oldReaction = myReaction;

        const { error } = await supabase
          .from("reactions")
          .update({
            reaction_type: type,
          })
          .eq("answer_id", answer.id)
          .eq("user_id", user.id);

        if (error) {
          console.error(
            "Update reaction error:",
            error
          );
          return;
        }

        setReactionCounts((previous) => ({
          ...previous,
          [oldReaction]: Math.max(
            0,
            previous[oldReaction] - 1
          ),
          [type]: previous[type] + 1,
        }));

        setMyReaction(type);
        return;
      }

      // New reaction
      const { error } = await supabase
        .from("reactions")
        .insert({
          answer_id: answer.id,
          user_id: user.id,
          reaction_type: type,
        });

      if (error) {
        console.error(
          "Add reaction error:",
          error
        );
        return;
      }

      setReactionCounts((previous) => ({
        ...previous,
        [type]: previous[type] + 1,
      }));

      setMyReaction(type);
    } finally {
      setReactionLoading(false);
    }
  }

  async function handleReply() {
    const text = replyText.trim();

    if (!text || replyLoading || !answer) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setReplyLoading(true);

    try {
      const { data: replyData, error: replyError } =
        await supabase
          .from("replies")
          .insert({
            answer_id: answer.id,
            user_id: user.id,
            reply: text,
          })
          .select(
            "id, answer_id, user_id, reply, created_at"
          )
          .single();

      if (replyError) {
        console.error(
          "Add reply error:",
          replyError
        );
        return;
      }

      // Use current user's latest answer name
      const { data: userAnswer } = await supabase
        .from("answers")
        .select("name")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      const newReply: Reply = {
        ...replyData,
        name:
          userAnswer?.name ||
          "ONEQUESTION user",
      };

      setReplies((previous) => [
        ...previous,
        newReply,
      ]);

      setReplyText("");
    } finally {
      setReplyLoading(false);
    }
  }

  async function handleDeleteReply(replyId: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { error } = await supabase
      .from("replies")
      .delete()
      .eq("id", replyId)
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "Delete reply error:",
        error
      );
      return;
    }

    setReplies((previous) =>
      previous.filter(
        (reply) => reply.id !== replyId
      )
    );
  }

  // Answer Report
  async function handleReport() {
    if (!answer || reportLoading) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (!reportReason) {
      alert("Please select a reason.");
      return;
    }

    setReportLoading(true);

    try {
      const { error } = await supabase
        .from("reports")
        .insert({
          reporter_id: user.id,
          answer_id: answer.id,
          reason: reportReason,
          details: reportDetails.trim() || null,
        });

      if (error) {
        console.error(
          "Report error:",
          error
        );
        alert(
          "Could not send report. Please try again."
        );
        return;
      }

      setReportSent(true);
      setReportReason("");
      setReportDetails("");
    } finally {
      setReportLoading(false);
    }
  }

  // Reply Report
  async function handleReplyReport(replyId: number) {
    if (replyReportLoading) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (!replyReportReason) {
      alert("Please select a reason.");
      return;
    }

    setReplyReportLoading(true);

    try {
      const { error } = await supabase
        .from("reports")
        .insert({
          reporter_id: user.id,
          reply_id: replyId,
          reason: replyReportReason,
          details:
            replyReportDetails.trim() || null,
        });

      if (error) {
        console.error(
          "Reply report error:",
          error
        );

        alert(
          "Could not send report. Please try again."
        );

        return;
      }

      setReplyReportSent(true);
      setReplyReportReason("");
      setReplyReportDetails("");
    } finally {
      setReplyReportLoading(false);
    }
  }

  const flagCode = answer
    ? countryFlags[answer.country]
    : undefined;

  const totalReactions =
    reactionCounts.love +
    reactionCounts.haha +
    reactionCounts.wow +
    reactionCounts.sad +
    reactionCounts.angry;

  return (
    <main className="min-h-screen bg-black px-5 py-10 text-white">
      <div className="mx-auto w-full max-w-2xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="inline-block text-2xl font-bold tracking-[0.25em] transition hover:opacity-70"
          >
            ONEQUESTION
          </Link>

          <p className="mt-2 text-sm text-white/50">
            One question. One answer. One world.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
            <div className="animate-pulse text-white/60">
              Loading answer...
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && errorMessage && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
            <div className="text-lg font-medium">
              {errorMessage}
            </div>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm transition hover:bg-white/15"
            >
              ← Back to ONEQUESTION
            </Link>
          </div>
        )}

        {/* Answer */}
        {!loading && answer && (
          <>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl">

              {/* Question */}
              {question && (
                <div className="border-b border-white/10 px-6 py-5">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
                    ONEQUESTION
                  </p>

                  <h1 className="mt-2 text-xl font-semibold leading-relaxed sm:text-2xl">
                    {question.question}
                  </h1>
                </div>
              )}

              {/* Answer */}
              <div className="p-6 sm:p-8">

                {/* Person */}
                <div className="mb-6 flex items-center gap-3">
                  {flagCode ? (
                    <img
                      src={`https://flagcdn.com/w40/${flagCode}.png`}
                      alt={answer.country}
                      className="h-6 w-9 rounded object-cover"
                    />
                  ) : (
                    <span className="text-2xl">
                      🌍
                    </span>
                  )}

                  <div>
                    <Link
                      href={`/profile/${answer.user_id}`}
                      className="font-semibold transition hover:opacity-70"
                    >
                      {answer.name}
                    </Link>

                    <p className="text-sm text-white/45">
                      {answer.country}
                    </p>
                  </div>
                </div>

                {/* Answer text */}
                <p className="whitespace-pre-wrap text-lg leading-8 text-white/90 sm:text-xl">
                  {answer.answer}
                </p>

                {/* Reactions */}
                <div className="mt-8 border-t border-white/10 pt-5">

                  {/* Reaction summary */}
                  {totalReactions > 0 && (
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {reactionOptions.map((reaction) =>
                          reactionCounts[reaction.type] > 0 ? (
                            <span
                              key={reaction.type}
                              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-white/10 text-sm"
                            >
                              {reaction.emoji}
                            </span>
                          ) : null
                        )}
                      </div>

                      <span className="text-sm text-white/45">
                        {totalReactions}{" "}
                        {totalReactions === 1
                          ? "reaction"
                          : "reactions"}
                      </span>
                    </div>
                  )}

                  {/* Reaction button */}
                  <div className="relative">

                    <button
                      type="button"
                      onClick={() =>
                        setShowReactions(
                          (value) => !value
                        )
                      }
                      disabled={reactionLoading}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                        myReaction
                          ? "border-white/20 bg-white/10 text-white"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <span className="text-lg">
                        {myReaction
                          ? reactionOptions.find(
                              (item) =>
                                item.type ===
                                myReaction
                            )?.emoji
                          : "😊"}
                      </span>

                      <span>
                        {myReaction
                          ? reactionOptions.find(
                              (item) =>
                                item.type ===
                                myReaction
                            )?.label
                          : "React"}
                      </span>

                      <span className="text-xs text-white/30">
                        ▾
                      </span>
                    </button>

                    {/* Reaction picker */}
                    {showReactions && (
                      <div className="absolute bottom-full left-0 z-20 mb-3 rounded-2xl border border-white/10 bg-black/95 p-2 shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center gap-1">
                          {reactionOptions.map(
                            (reaction) => (
                              <button
                                key={reaction.type}
                                type="button"
                                onClick={() => {
                                  handleReaction(
                                    reaction.type
                                  );
                                  setShowReactions(
                                    false
                                  );
                                }}
                                disabled={
                                  reactionLoading
                                }
                                title={
                                  reaction.label
                                }
                                className={`flex h-11 w-11 items-center justify-center rounded-xl text-2xl transition hover:scale-110 hover:bg-white/10 ${
                                  myReaction ===
                                  reaction.type
                                    ? "bg-white/10"
                                    : ""
                                }`}
                              >
                                {reaction.emoji}
                              </button>
                            )
                          )}
                        </div>

                        <div className="mt-1 text-center text-[10px] text-white/30">
                          Choose a reaction
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Individual reaction counts */}
                  {totalReactions > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {reactionOptions.map(
                        (reaction) =>
                          reactionCounts[
                            reaction.type
                          ] > 0 && (
                            <button
                              key={reaction.type}
                              type="button"
                              onClick={() =>
                                handleReaction(
                                  reaction.type
                                )
                              }
                              disabled={reactionLoading}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                                myReaction ===
                                reaction.type
                                  ? "border-white/20 bg-white/10 text-white"
                                  : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <span>
                                {reaction.emoji}
                              </span>

                              <span>
                                {
                                  reactionCounts[
                                    reaction.type
                                  ]
                                }
                              </span>
                            </button>
                          )
                      )}
                    </div>
                  )}
                </div>

                {/* Answer Report */}
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReport(true);
                      setReportSent(false);
                    }}
                    className="text-xs text-white/30 transition hover:text-red-400"
                  >
                    🚩 Report
                  </button>
                </div>

                {showReport && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-5">
                    {reportSent ? (
                      <div className="text-center">
                        <div className="text-3xl">
                          ✅
                        </div>

                        <h3 className="mt-3 text-lg font-semibold">
                          Report submitted
                        </h3>

                        <p className="mt-1 text-sm text-white/40">
                          Thanks for helping keep
                          ONEQUESTION safe.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setShowReport(false)
                          }
                          className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
                        >
                          Close
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold">
                              Report this answer
                            </h3>

                            <p className="mt-1 text-sm text-white/40">
                              Tell us what is wrong
                              with this content.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setShowReport(false)
                            }
                            className="text-xl text-white/30 transition hover:text-white"
                          >
                            ×
                          </button>
                        </div>

                        <div className="mt-5 space-y-2">
                          {reportReasons.map(
                            ([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() =>
                                  setReportReason(
                                    value
                                  )
                                }
                                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                                  reportReason ===
                                  value
                                    ? "border-red-400/40 bg-red-400/10 text-white"
                                    : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                                }`}
                              >
                                {label}
                              </button>
                            )
                          )}
                        </div>

                        <textarea
                          value={reportDetails}
                          onChange={(event) =>
                            setReportDetails(
                              event.target.value
                            )
                          }
                          placeholder="Additional details (optional)"
                          rows={3}
                          className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
                        />

                        <div className="mt-4 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setShowReport(false)
                            }
                            className="rounded-xl px-4 py-2 text-sm text-white/40 transition hover:text-white"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={handleReport}
                            disabled={
                              reportLoading ||
                              !reportReason
                            }
                            className="rounded-xl bg-red-500/80 px-5 py-2 text-sm font-medium transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {reportLoading
                              ? "Sending..."
                              : "Submit Report"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Replies */}
                <div className="mt-8 border-t border-white/10 pt-6">

                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/60">
                      Replies
                    </h2>

                    {replies.length > 0 && (
                      <span className="text-xs text-white/35">
                        {replies.length}{" "}
                        {replies.length === 1
                          ? "reply"
                          : "replies"}
                      </span>
                    )}
                  </div>

                  {/* Reply input */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <textarea
                      value={replyText}
                      onChange={(event) =>
                        setReplyText(event.target.value)
                      }
                      placeholder="Write a reply..."
                      rows={3}
                      maxLength={1000}
                      className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/30"
                    />

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-white/25">
                        {replyText.length}/1000
                      </span>

                      <button
                        type="button"
                        onClick={handleReply}
                        disabled={
                          replyLoading ||
                          !replyText.trim()
                        }
                        className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {replyLoading
                          ? "Posting..."
                          : "Post Reply"}
                      </button>
                    </div>
                  </div>

                  {/* Replies list */}
                  {replies.length > 0 && (
                    <div className="mt-5 space-y-3">
                      {replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/profile/${reply.user_id}`}
                                className="text-sm font-semibold transition hover:opacity-70"
                              >
                                {reply.name}
                              </Link>

                              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-white/75">
                                {reply.reply}
                              </p>

                              <p className="mt-2 text-[10px] text-white/25">
                                {new Date(
                                  reply.created_at
                                ).toLocaleString()}
                              </p>

                              {/* Reply Report Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setReportingReplyId(
                                    reply.id
                                  );
                                  setReplyReportSent(
                                    false
                                  );
                                  setReplyReportReason(
                                    ""
                                  );
                                  setReplyReportDetails(
                                    ""
                                  );
                                }}
                                className="mt-2 text-[10px] text-white/25 transition hover:text-red-400"
                              >
                                🚩 Report
                              </button>
                            </div>

                            <ReplyDeleteButton
                              reply={reply}
                              onDelete={
                                handleDeleteReply
                              }
                            />
                          </div>

                          {/* Reply Report Form */}
                          {reportingReplyId ===
                            reply.id && (
                            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                              {replyReportSent ? (
                                <div className="text-center">
                                  <div className="text-2xl">
                                    ✅
                                  </div>

                                  <h3 className="mt-2 text-sm font-semibold">
                                    Report submitted
                                  </h3>

                                  <p className="mt-1 text-xs text-white/40">
                                    Thanks for helping
                                    keep ONEQUESTION
                                    safe.
                                  </p>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReportingReplyId(
                                        null
                                      )
                                    }
                                    className="mt-3 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/5"
                                  >
                                    Close
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h3 className="text-sm font-semibold">
                                        Report this reply
                                      </h3>

                                      <p className="mt-1 text-xs text-white/35">
                                        Tell us what is
                                        wrong with this
                                        reply.
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setReportingReplyId(
                                          null
                                        )
                                      }
                                      className="text-lg text-white/30 transition hover:text-white"
                                    >
                                      ×
                                    </button>
                                  </div>

                                  <div className="mt-4 space-y-2">
                                    {reportReasons.map(
                                      ([
                                        value,
                                        label,
                                      ]) => (
                                        <button
                                          key={value}
                                          type="button"
                                          onClick={() =>
                                            setReplyReportReason(
                                              value
                                            )
                                          }
                                          className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs transition ${
                                            replyReportReason ===
                                            value
                                              ? "border-red-400/40 bg-red-400/10 text-white"
                                              : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                                          }`}
                                        >
                                          {label}
                                        </button>
                                      )
                                    )}
                                  </div>

                                  <textarea
                                    value={
                                      replyReportDetails
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      setReplyReportDetails(
                                        event.target
                                          .value
                                      )
                                    }
                                    placeholder="Additional details (optional)"
                                    rows={3}
                                    className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white outline-none placeholder:text-white/25 focus:border-white/20"
                                  />

                                  <div className="mt-3 flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setReportingReplyId(
                                          null
                                        )
                                      }
                                      className="rounded-xl px-3 py-2 text-xs text-white/40 transition hover:text-white"
                                    >
                                      Cancel
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleReplyReport(
                                          reply.id
                                        )
                                      }
                                      disabled={
                                        replyReportLoading ||
                                        !replyReportReason
                                      }
                                      className="rounded-xl bg-red-500/80 px-4 py-2 text-xs font-medium transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      {replyReportLoading
                                        ? "Sending..."
                                        : "Submit Report"}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {replies.length === 0 && (
                    <p className="mt-5 text-center text-sm text-white/25">
                      No replies yet. Be the first to reply.
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="mt-8 border-t border-white/10 pt-4">
                  <p className="text-xs text-white/35">
                    {new Date(
                      answer.created_at
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Back */}
            <div className="mt-8 text-center">
              <Link
                href="/"
                className="inline-flex rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                ← Explore more answers
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function ReplyDeleteButton({
  reply,
  onDelete,
}: {
  reply: Reply;
  onDelete: (replyId: number) => void;
}) {
  const [isMine, setIsMine] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id === reply.user_id) {
        setIsMine(true);
      }
    };

    checkUser();
  }, [reply.user_id]);

  if (!isMine) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => onDelete(reply.id)}
      className="shrink-0 rounded-full px-2 py-1 text-xs text-white/25 transition hover:bg-white/10 hover:text-white/70"
      title="Delete reply"
    >
      Delete
    </button>
  );
}