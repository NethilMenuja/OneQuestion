"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Question = {
  id: number;
  question: string;
  active: boolean | null;
  created_at: string;
  question_date: string;
  answerCount: number;
};

function AnimatedNumber({
  value,
  duration = 1200,
}: {
  value: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);

  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    let frame = 0;

    const animate = () => {
      cancelAnimationFrame(frame);

      const startTime = performance.now();

      const tick = (currentTime: number) => {
        const progress = Math.min(
          (currentTime - startTime) / duration,
          1
        );

        const eased =
          1 -
          Math.pow(
            1 - progress,
            4
          );

        setDisplayValue(
          Math.round(value * eased)
        );

        if (progress < 1) {
          frame =
            requestAnimationFrame(tick);
        } else {
          setDisplayValue(value);
        }
      };

      frame =
        requestAnimationFrame(tick);
    };

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            animate();
          } else {
            cancelAnimationFrame(frame);
            setDisplayValue(0);
          }
        },
        {
          threshold: 0.2,
        }
      );

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref}>
      {displayValue}
    </span>
  );
}

function formatDate(date: string) {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [accessDenied, setAccessDenied] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [sortBy, setSortBy] = useState<
    "date" | "answers"
  >("date");

  const [showForm, setShowForm] =
    useState(false);

    const formRef = useRef<HTMLElement | null>(null);

  const [editingQuestion, setEditingQuestion] =
    useState<Question | null>(null);

  const [questionText, setQuestionText] =
    useState("");

  const [questionDate, setQuestionDate] =
    useState("");

    const [calendarOpen, setCalendarOpen] = useState(false);

    const [calendarMonth, setCalendarMonth] =
    useState(() => {
    const date = new Date();
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    );
  });

  const [questionActive, setQuestionActive] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
  if (showForm) {
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }
}, [showForm]);

  async function loadQuestions() {
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

    /* QUESTIONS */
    const {
      data: questionData,
      error: questionError,
    } = await supabase
      .from("questions")
      .select(
        "id, question, active, created_at, question_date"
      )
      .order("question_date", {
        ascending: false,
      });

    if (questionError) {
      console.error(
        "Questions error:",
        questionError
      );

      setErrorMessage(
        "Could not load questions."
      );

      setLoading(false);
      return;
    }

    /* ANSWERS */
    const {
      data: answerData,
      error: answerError,
    } = await supabase
      .from("answers")
      .select("question_id");

    if (answerError) {
      console.error(
        "Answers error:",
        answerError
      );
    }

    /* ANSWER COUNTS */
    const answerCounts: Record<
      number,
      number
    > = {};

    (answerData ?? []).forEach((answer) => {
      if (!answer.question_id) return;

      answerCounts[answer.question_id] =
        (answerCounts[answer.question_id] || 0) +
        1;
    });

    const result: Question[] =
      (questionData ?? []).map((question) => ({
        id: question.id,
        question: question.question,
        active: question.active,
        created_at: question.created_at,
        question_date: question.question_date,
        answerCount:
          answerCounts[question.id] || 0,
      }));

    setQuestions(result);
    setLoading(false);
  }

  function openCreateForm() {
    setEditingQuestion(null);
    setQuestionText("");
    setQuestionDate("");
    setQuestionActive(true);
    setErrorMessage("");
    setSuccessMessage("");
    setShowForm(true);
  }

  function openEditForm(question: Question) {
    setEditingQuestion(question);
    setQuestionText(question.question);
    setQuestionDate(question.question_date);
    setQuestionActive(
      question.active === true
    );
    setErrorMessage("");
    setSuccessMessage("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingQuestion(null);
    setQuestionText("");
    setQuestionDate("");
    setQuestionActive(true);
  }

  async function saveQuestion() {
    setErrorMessage("");
    setSuccessMessage("");

    const cleanQuestion =
      questionText.trim();

    if (!cleanQuestion) {
      setErrorMessage(
        "Please enter a question."
      );
      return;
    }

    if (!questionDate) {
      setErrorMessage(
        "Please select a question date."
      );
      return;
    }

    setSaving(true);

    if (editingQuestion) {
      const {
        error,
      } = await supabase
        .from("questions")
        .update({
          question: cleanQuestion,
          question_date: questionDate,
          active: questionActive,
        })
        .eq("id", editingQuestion.id);

      if (error) {
        console.error(
          "Update question error:",
          error
        );

        setErrorMessage(
          error.message ||
            "Could not update question."
        );

        setSaving(false);
        return;
      }

      setSuccessMessage(
        "Question updated successfully."
      );
    } else {
      const {
        error,
      } = await supabase
        .from("questions")
        .insert({
          question: cleanQuestion,
          question_date: questionDate,
          active: questionActive,
        });

      if (error) {
  console.error("Create question error:", error);

  if (error.code === "23505") {
    setErrorMessage(
      "A question already exists for this date. Please choose another date."
    );
  } else {
    setErrorMessage(
      error.message ||
        "Could not create question."
    );
  }

  setSaving(false);
  return;
}

      setSuccessMessage(
        "Question created successfully."
      );
    }

    setSaving(false);
    setShowForm(false);
    setEditingQuestion(null);

    setQuestionText("");
    setQuestionDate("");
    setQuestionActive(true);

    await loadQuestions();
  }

  async function toggleActive(
    question: Question
  ) {
    setErrorMessage("");
    setSuccessMessage("");

    const newStatus =
      question.active !== true;

    const {
      error,
    } = await supabase
      .from("questions")
      .update({
        active: newStatus,
      })
      .eq("id", question.id);

    if (error) {
      console.error(
        "Toggle question error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Could not update question status."
      );

      return;
    }

    setQuestions((current) =>
      current.map((item) =>
        item.id === question.id
          ? {
              ...item,
              active: newStatus,
            }
          : item
      )
    );

    setSuccessMessage(
      newStatus
        ? "Question activated."
        : "Question deactivated."
    );
  }

  async function deleteQuestion(
    question: Question
  ) {
    const confirmed =
      window.confirm(
        `Delete this question?\n\n"${question.question}"\n\nThis may fail if answers are linked to this question.`
      );

    if (!confirmed) return;

    setDeletingId(question.id);
    setErrorMessage("");
    setSuccessMessage("");

    const {
      error,
    } = await supabase
      .from("questions")
      .delete()
      .eq("id", question.id);

    if (error) {
      console.error(
        "Delete question error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Could not delete question."
      );

      setDeletingId(null);
      return;
    }

    setQuestions((current) =>
      current.filter(
        (item) =>
          item.id !== question.id
      )
    );

    setSuccessMessage(
      "Question deleted successfully."
    );

    setDeletingId(null);
  }
  function formatCalendarMonth(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const previousMonthDays =
    new Date(
      year,
      month,
      0
    ).getDate();

  const days: {
    date: number;
    currentMonth: boolean;
    value: string;
  }[] = [];

  for (
    let i = firstDay - 1;
    i >= 0;
    i--
  ) {
    const day = previousMonthDays - i;

    const previousMonth =
      month === 0 ? 11 : month - 1;

    const previousYear =
      month === 0 ? year - 1 : year;

    days.push({
      date: day,
      currentMonth: false,
      value: `${previousYear}-${String(
        previousMonth + 1
      ).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`,
    });
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    days.push({
      date: day,
      currentMonth: true,
      value: `${year}-${String(
        month + 1
      ).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`,
    });
  }

  const remaining =
    42 - days.length;

  for (
    let day = 1;
    day <= remaining;
    day++
  ) {
    const nextMonth =
      month === 11 ? 0 : month + 1;

    const nextYear =
      month === 11 ? year + 1 : year;

    days.push({
      date: day,
      currentMonth: false,
      value: `${nextYear}-${String(
        nextMonth + 1
      ).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`,
    });
  }

  return days;
}

function selectCalendarDate(
  value: string
) {
  setQuestionDate(value);
  setCalendarOpen(false);
}

function goPreviousMonth() {
  setCalendarMonth(
    (current) =>
      new Date(
        current.getFullYear(),
        current.getMonth() - 1,
        1
      )
  );
}

function goNextMonth() {
  setCalendarMonth(
    (current) =>
      new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        1
      )
  );
}

function goToday() {
  const today = new Date();

  setCalendarMonth(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  );

  const value = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  setQuestionDate(value);
  setCalendarOpen(false);
}

  const filteredQuestions =
    questions
      .filter((question) => {
        const cleanSearch =
          search.trim().toLowerCase();

        const matchesSearch =
          question.question
            .toLowerCase()
            .includes(cleanSearch) ||
          String(question.id).includes(
            search.trim()
          );

        if (!matchesSearch) {
          return false;
        }

        if (filter === "active") {
          return question.active === true;
        }

        if (filter === "inactive") {
          return question.active !== true;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "answers") {
          return (
            b.answerCount -
            a.answerCount
          );
        }

        return (
          new Date(
            b.question_date
          ).getTime() -
          new Date(
            a.question_date
          ).getTime()
        );
      });

  const totalQuestions =
    questions.length;

  const activeQuestions =
    questions.filter(
      (question) =>
        question.active === true
    ).length;

  const inactiveQuestions =
    totalQuestions -
    activeQuestions;

  const totalAnswers =
    questions.reduce(
      (sum, question) =>
        sum + question.answerCount,
      0
    );

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-5 py-10 text-white">
        <style jsx>{`
  @keyframes calendarFade {
    from {
      opacity: 0;
      transform: translateY(6px) scale(0.98);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`}</style>
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
            <div className="animate-pulse text-white/50">
              Loading questions...
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
              to access question management.
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
                Question Management
              </h1>

              <p className="mt-2 text-sm text-white/40">
                Create, edit and manage daily questions.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <Link
                href="/admin"
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                ← Dashboard
              </Link>

              <button
                type="button"
                onClick={loadQuestions}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                ↻ Refresh
              </button>

              <button
                type="button"
                onClick={openCreateForm}
                className="rounded-full border border-white/10 bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
              >
                + New Question
              </button>

            </div>

          </div>

        </div>

        {/* MESSAGES */}
        {errorMessage && (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
            {successMessage}
          </div>
        )}

        {/* STATS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl transition hover:bg-white/[0.08]">

            <p className="text-2xl">
              📝
            </p>

            <p className="mt-5 text-4xl font-bold">
              <AnimatedNumber
                value={totalQuestions}
                duration={1400}
              />
            </p>

            <p className="mt-2 text-sm text-white/40">
              Total Questions
            </p>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl transition hover:bg-white/[0.08]">

            <p className="text-2xl">
              🟢
            </p>

            <p className="mt-5 text-4xl font-bold">
              <AnimatedNumber
                value={activeQuestions}
                duration={1400}
              />
            </p>

            <p className="mt-2 text-sm text-white/40">
              Active
            </p>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl transition hover:bg-white/[0.08]">

            <p className="text-2xl">
              ⚪
            </p>

            <p className="mt-5 text-4xl font-bold">
              <AnimatedNumber
                value={inactiveQuestions}
                duration={1400}
              />
            </p>

            <p className="mt-2 text-sm text-white/40">
              Inactive
            </p>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl transition hover:bg-white/[0.08]">

            <p className="text-2xl">
              💬
            </p>

            <p className="mt-5 text-4xl font-bold">
              <AnimatedNumber
                value={totalAnswers}
                duration={1400}
              />
            </p>

            <p className="mt-2 text-sm text-white/40">
              Total Answers
            </p>

          </div>

        </section>

        {/* SEARCH + FILTER */}
        <section className="mt-6">

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto]">

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search questions or ID..."
                className="min-w-0 rounded-2xl border border-white/10 bg-black/30 px-5 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
              />

              <select
                value={filter}
                onChange={(e) =>
                  setFilter(
                    e.target.value as
                      | "all"
                      | "active"
                      | "inactive"
                  )
                }
                className="rounded-2xl border border-white/10 bg-black/30 px-5 py-3 text-sm text-white/70 outline-none"
              >
                <option value="all">
                  All Questions
                </option>

                <option value="active">
                  Active Only
                </option>

                <option value="inactive">
                  Inactive Only
                </option>
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | "date"
                      | "answers"
                  )
                }
                className="rounded-2xl border border-white/10 bg-black/30 px-5 py-3 text-sm text-white/70 outline-none"
              >
                <option value="date">
                  Sort: Date
                </option>

                <option value="answers">
                  Sort: Answers
                </option>
              </select>

            </div>

          </div>

        </section>

        {/* CREATE / EDIT FORM */}
        {showForm ? (
  <section
    ref={formRef}
    className="relative z-[9999] mt-6 block"
  >

            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl">

              <div className="mb-6 flex items-center justify-between gap-4">

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                    {editingQuestion
                      ? "Edit"
                      : "Create"}
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    {editingQuestion
                      ? "Edit Question"
                      : "New Question"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/50 transition hover:bg-white/10 hover:text-white"
                >
                  ✕ Close
                </button>

              </div>

              <div className="space-y-5">

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wider text-white/35">
                    Question
                  </label>

                  <textarea
                    value={questionText}
                    onChange={(e) =>
                      setQuestionText(
                        e.target.value
                      )
                    }
                    rows={4}
                    placeholder="Enter the question..."
                    className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <div className="relative">
  <label className="mb-2 block text-xs uppercase tracking-wider text-white/35">
    Question Date
  </label>

  <button
    type="button"
    onClick={() =>
      setCalendarOpen(
        (current) => !current
      )
    }
    className={`flex w-full items-center justify-between rounded-2xl border px-5 py-3 text-left text-sm transition-all duration-300 ${
      calendarOpen
        ? "border-white/25 bg-white/[0.08] text-white"
        : "border-white/10 bg-black/30 text-white/70 hover:border-white/20 hover:bg-white/[0.05]"
    }`}
  >
    <span className="flex items-center gap-3">
      <span className="text-base">
        📅
      </span>

      <span>
        {questionDate
          ? formatDate(questionDate)
          : "Select a date"}
      </span>
    </span>

    <span
      className={`text-white/40 transition-transform duration-300 ${
        calendarOpen
          ? "rotate-180"
          : ""
      }`}
    >
      ▾
    </span>
  </button>

  <div
    className={`absolute left-0 right-0 top-full z-[100] mt-2 origin-top overflow-hidden rounded-3xl border border-white/10 bg-[#090909]/95 p-4 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
      calendarOpen
        ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
        : "pointer-events-none -translate-y-2 scale-95 opacity-0"
    }`}
  >
    <div className="mb-4 flex items-center justify-between">
      <button
        type="button"
        onClick={goPreviousMonth}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        ‹
      </button>

      <div className="text-center">
        <p className="text-sm font-semibold text-white">
          {formatCalendarMonth(
            calendarMonth
          )}
        </p>

        <button
          type="button"
          onClick={goToday}
          className="mt-1 text-[10px] uppercase tracking-widest text-white/30 transition hover:text-white/70"
        >
          Today
        </button>
      </div>

      <button
        type="button"
        onClick={goNextMonth}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        ›
      </button>
    </div>

    <div className="mb-2 grid grid-cols-7 gap-1">
      {[
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
      ].map((day) => (
        <div
          key={day}
          className="py-2 text-center text-[10px] font-medium uppercase tracking-wider text-white/25"
        >
          {day}
        </div>
      ))}
    </div>

    <div
      key={`${calendarMonth.getFullYear()}-${calendarMonth.getMonth()}`}
      className="grid grid-cols-7 gap-1 animate-[calendarFade_220ms_ease-out]"
    >
      {getCalendarDays(calendarMonth).map(
        (day, index) => {
          const selected =
            questionDate ===
            day.value;

          const today = new Date();

          const todayValue = `${today.getFullYear()}-${String(
            today.getMonth() + 1
          ).padStart(2, "0")}-${String(
            today.getDate()
          ).padStart(2, "0")}`;

          const isToday =
            day.value ===
            todayValue;

          return (
            <button
              key={`${day.value}-${index}`}
              type="button"
              onClick={() =>
                selectCalendarDate(
                  day.value
                )
              }
              className={`relative flex aspect-square items-center justify-center rounded-xl text-xs transition-all duration-200 ${
                day.currentMonth
                  ? "text-white/75 hover:bg-white/10 hover:text-white"
                  : "text-white/15 hover:bg-white/5 hover:text-white/35"
              } ${
                selected
                  ? "scale-105 bg-white text-black font-semibold shadow-lg"
                  : ""
              } ${
                isToday &&
                !selected
                  ? "border border-white/20 text-white"
                  : ""
              }`}
            >
              {day.date}

              {isToday &&
                !selected && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-white/60" />
                )}
            </button>
          );
        }
      )}
    </div>

    {questionDate && (
      <div className="mt-4 border-t border-white/10 pt-3 text-center">
        <p className="text-[10px] uppercase tracking-widest text-white/25">
          Selected date
        </p>

        <p className="mt-1 text-sm font-medium text-white/80">
          {formatDate(questionDate)}
        </p>
      </div>
    )}
  </div>
</div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-wider text-white/35">
                      Status
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setQuestionActive(
                          (current) =>
                            !current
                        )
                      }
                      className={`w-full rounded-2xl border px-5 py-3 text-left text-sm transition ${
                        questionActive
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                          : "border-white/10 bg-black/30 text-white/40"
                      }`}
                    >
                      {questionActive
                        ? "🟢 Active"
                        : "⚪ Inactive"}
                    </button>
                  </div>

                </div>

                <div className="flex flex-wrap justify-end gap-3">

                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={saveQuestion}
                    disabled={saving}
                    className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingQuestion
                      ? "Save Changes"
                      : "Create Question"}
                  </button>

                </div>

              </div>

            </div>

          </section>
        ) : null}

        {/* QUESTIONS */}
        <section className="mt-6">

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  Questions
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Question Library
                </h2>
              </div>

              <span className="text-xs text-white/30">
                {filteredQuestions.length} shown
              </span>

            </div>

            {filteredQuestions.length ===
            0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-sm text-white/35">
                No questions found.
              </div>
            ) : (
              <div className="space-y-3">

                {filteredQuestions.map(
                  (question, index) => (
                    <div
                      key={question.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:bg-white/[0.04]"
                    >

                      <div className="flex flex-col gap-5">

                        {/* QUESTION */}
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                          <div className="flex min-w-0 gap-4">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">
                              {index + 1}
                            </div>

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="font-mono text-xs text-white/25">
                                  #{question.id}
                                </span>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider ${
                                    question.active ===
                                    true
                                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                      : "border-white/10 bg-white/5 text-white/35"
                                  }`}
                                >
                                  {question.active ===
                                  true
                                    ? "Active"
                                    : "Inactive"}
                                </span>

                              </div>

                              <p className="mt-3 text-base leading-7 text-white/85">
                                {question.question}
                              </p>

                            </div>

                          </div>

                          <div className="shrink-0 text-left lg:text-right">

                            <p className="text-2xl font-bold">
                              <AnimatedNumber
                                value={
                                  question.answerCount
                                }
                                duration={900}
                              />
                            </p>

                            <p className="text-[10px] uppercase tracking-wider text-white/25">
                              Answers
                            </p>

                          </div>

                        </div>

                        {/* META + ACTIONS */}
                        <div className="flex flex-col gap-4 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between">

                          <div className="flex flex-wrap gap-4 text-xs text-white/30">

                            <span>
                              📅{" "}
                              {formatDate(
                                question.question_date
                              )}
                            </span>

                            <span>
                              Created{" "}
                              {formatDate(
                                question.created_at
                              )}
                            </span>

                          </div>

                          <div className="flex flex-wrap gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                toggleActive(
                                  question
                                )
                              }
                              className={`rounded-full border px-4 py-2 text-xs transition ${
                                question.active ===
                                true
                                  ? "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                                  : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                              }`}
                            >
                              {question.active ===
                              true
                                ? "Deactivate"
                                : "Activate"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(
                                  question
                                )
                              }
                              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
                            >
                              ✏️ Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteQuestion(
                                  question
                                )
                              }
                              disabled={
                                deletingId ===
                                question.id
                              }
                              className="rounded-full border border-red-400/20 bg-red-400/5 px-4 py-2 text-xs text-red-300/70 transition hover:bg-red-400/10 hover:text-red-300 disabled:opacity-40"
                            >
                              {deletingId ===
                              question.id
                                ? "Deleting..."
                                : "🗑️ Delete"}
                            </button>

                          </div>

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