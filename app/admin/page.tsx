"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Stats = {
  users: number;
  answers: number;
  replies: number;
  reports: number;
  reactions: number;
  todayAnswers: number;
  countries: number;
};

type ReportStats = {
  pending: number;
  reviewed: number;
  resolved: number;
  dismissed: number;
};

type RecentAnswer = {
  id: number;
  name: string;
  country: string;
  answer: string;
  user_id: string | null;
  created_at: string;
};

type RecentReply = {
  id: number;
  answer_id: number;
  user_id: string | null;
  reply: string;
  created_at: string;
};

type RecentReaction = {
  id: number;
  answer_id: number;
  user_id: string | null;
  reaction: string | null;
  created_at: string;
};

type RecentReport = {
  id: number;
  reporter_id: string;
  answer_id: number | null;
  reply_id: number | null;
  reason: string;
  status: string;
  created_at: string;
};

type CountryStat = {
  country: string;
  count: number;
  percentage: number;
};

type ActivityPoint = {
  label: string;
  answers: number;
  replies: number;
  reactions: number;
  reports: number;
  total: number;
};

type ActivityItem = {
  id: string;
  type: "Answer" | "Reply" | "Reaction" | "Report";
  user_id: string | null;
  text: string;
  created_at: string;
};

type Report = {
  id: number;
  reporter_id: string;
  answer_id: number | null;
  reply_id: number | null;
  reason:
    | "spam"
    | "harassment"
    | "hate"
    | "sexual"
    | "violence"
    | "misinformation"
    | "other";
  details: string | null;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  created_at: string;
};

const reportStatusKeys: (keyof ReportStats)[] = [
  "pending",
  "reviewed",
  "resolved",
  "dismissed",
];

const reportStatusLabels: Record<keyof ReportStats, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

function AnimatedNumber({
  value,
  duration = 900,
}: {
  value: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let visible = false;

    const animate = () => {
      const start = performance.now();

      const tick = (time: number) => {
        if (!visible) return;

        const progress = Math.min((time - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(value * eased);

        if (element) {
          element.textContent = current.toLocaleString();
        }

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(tick);
        }
      };

      frameRef.current = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;

        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }

        if (visible) {
          if (element) element.textContent = "0";
          animate();
        } else {
          if (element) element.textContent = "0";
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration]);

  return <span ref={ref}>0</span>;
}

function ScrollReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.style.opacity = "1";
          element.style.transform = "translateY(0) scale(1)";
        } else {
          element.style.opacity = "0";
          element.style.transform = "translateY(28px) scale(0.98)";
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(28px) scale(0.98)",
        transition: `opacity 700ms ease ${delay}ms, transform 700ms ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function LineChart({
  data,
}: {
  data: ActivityPoint[];
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const width = 900;
  const height = 320;
  const paddingLeft = 50;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => [
      item.answers,
      item.replies,
      item.reactions,
      item.reports,
    ])
  );

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    return paddingTop + chartHeight - (value / maxValue) * chartHeight;
  };

  const makePath = (
    getter: (item: ActivityPoint) => number
  ) => {
    return data
      .map((item, index) => {
        const x = getX(index);
        const y = getY(getter(item));

        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  const answerPath = makePath((item) => item.answers);
  const replyPath = makePath((item) => item.replies);
  const reactionPath = makePath((item) => item.reactions);
  const reportPath = makePath((item) => item.reports);

  return (
    <div ref={ref} className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[320px] min-w-[700px] w-full"
        role="img"
        aria-label="Community activity line chart"
      >
        {[0, 1, 2, 3, 4].map((step) => {
          const y = paddingTop + (chartHeight / 4) * step;

          return (
            <line
              key={step}
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          );
        })}

        <line
          x1={paddingLeft}
          x2={paddingLeft}
          y1={paddingTop}
          y2={height - paddingBottom}
          stroke="rgba(255,255,255,0.12)"
        />

        <line
          x1={paddingLeft}
          x2={width - paddingRight}
          y1={height - paddingBottom}
          y2={height - paddingBottom}
          stroke="rgba(255,255,255,0.12)"
        />

        <path
          d={answerPath}
          fill="none"
          stroke="#60a5fa"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={visible ? "chart-line chart-line-visible" : "chart-line"}
        />

        <path
          d={replyPath}
          fill="none"
          stroke="#a78bfa"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={visible ? "chart-line chart-line-visible" : "chart-line"}
          style={{ transitionDelay: "120ms" }}
        />

        <path
          d={reactionPath}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={visible ? "chart-line chart-line-visible" : "chart-line"}
          style={{ transitionDelay: "240ms" }}
        />

        <path
          d={reportPath}
          fill="none"
          stroke="#f87171"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={visible ? "chart-line chart-line-visible" : "chart-line"}
          style={{ transitionDelay: "360ms" }}
        />

        {data.map((item, index) => {
          const x = getX(index);

          return (
            <g key={`${item.label}-${index}`}>
              <circle
                cx={x}
                cy={getY(item.answers)}
                r="4.5"
                fill="#60a5fa"
                className={
                  visible
                    ? "chart-point chart-point-visible"
                    : "chart-point"
                }
                style={{ transitionDelay: `${index * 45}ms` }}
              />

              <circle
                cx={x}
                cy={getY(item.replies)}
                r="4.5"
                fill="#a78bfa"
                className={
                  visible
                    ? "chart-point chart-point-visible"
                    : "chart-point"
                }
                style={{ transitionDelay: `${index * 45 + 80}ms` }}
              />

              <circle
                cx={x}
                cy={getY(item.reactions)}
                r="4.5"
                fill="#fbbf24"
                className={
                  visible
                    ? "chart-point chart-point-visible"
                    : "chart-point"
                }
                style={{ transitionDelay: `${index * 45 + 160}ms` }}
              />

              <circle
                cx={x}
                cy={getY(item.reports)}
                r="4.5"
                fill="#f87171"
                className={
                  visible
                    ? "chart-point chart-point-visible"
                    : "chart-point"
                }
                style={{ transitionDelay: `${index * 45 + 240}ms` }}
              />

              <text
                x={x}
                y={height - 17}
                textAnchor="middle"
                fill="rgba(255,255,255,0.5)"
                fontSize="11"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-5 text-xs text-white/55">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
          Answers
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
          Replies
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          Reactions
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          Reports
        </div>
      </div>
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function shortId(id: string | null) {
  if (!id) return "—";
  return `${id.slice(0, 8)}...${id.slice(-6)}`;
}

function getReactionLabel(reaction: string | null) {
  if (reaction === "heart") return "❤️";
  if (reaction === "laugh") return "😂";
  if (reaction === "wow") return "😮";
  if (reaction === "sad") return "😢";
  if (reaction === "angry") return "😡";
  if (reaction === "like") return "👍";
  return reaction || "Reaction";
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    answers: 0,
    replies: 0,
    reports: 0,
    reactions: 0,
    todayAnswers: 0,
    countries: 0,
  });

  const [reportStats, setReportStats] = useState<ReportStats>({
    pending: 0,
    reviewed: 0,
    resolved: 0,
    dismissed: 0,
  });

  const [reports, setReports] = useState<Report[]>([]);
  const [recentAnswers, setRecentAnswers] = useState<RecentAnswer[]>([]);
  const [recentReplies, setRecentReplies] = useState<RecentReply[]>([]);
  const [recentReactions, setRecentReactions] = useState<
    RecentReaction[]
  >([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [countries, setCountries] = useState<CountryStat[]>([]);
  const [activityData, setActivityData] = useState<ActivityPoint[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState("");

  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] =
    useState<"all" | keyof ReportStats>("all");
  const [reportReasonFilter, setReportReasonFilter] =
    useState<"all" | Report["reason"]>("all");
  const [updatingReportId, setUpdatingReportId] = useState<number | null>(
    null
  );

  async function checkAdmin() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAdminEmail(user.email ?? "Admin account");

    const { data: adminRow, error: adminError } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError || !adminRow) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);
    await loadDashboard();
    setLoading(false);
  }

  async function loadDashboard() {
    const today = new Date().toISOString().slice(0, 10);

    const [
      profilesResult,
      answersResult,
      repliesResult,
      likesResult,
      reportsResult,
      todayQuestionResult,
      recentAnswersResult,
      recentRepliesResult,
      recentReactionsResult,
      recentReportsResult,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),

      supabase.from("answers").select("id", { count: "exact", head: true }),

      supabase.from("replies").select("id", { count: "exact", head: true }),

      supabase.from("likes").select("id", { count: "exact", head: true }),

      supabase
        .from("reports")
        .select("id, reporter_id, answer_id, reply_id, reason, details, status, created_at")
        .order("created_at", { ascending: false }),

      supabase
        .from("questions")
        .select("id")
        .eq("question_date", today)
        .maybeSingle(),

      supabase
        .from("answers")
        .select("id, name, country, answer, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(8),

      supabase
        .from("replies")
        .select("id, answer_id, user_id, reply, created_at")
        .order("created_at", { ascending: false })
        .limit(8),

      supabase
        .from("likes")
        .select("id, answer_id, user_id, reaction, created_at")
        .order("created_at", { ascending: false })
        .limit(8),

      supabase
        .from("reports")
        .select(
          "id, reporter_id, answer_id, reply_id, reason, status, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    let todayAnswers = 0;

    if (todayQuestionResult.data?.id) {
      const { count } = await supabase
        .from("answers")
        .select("id", { count: "exact", head: true })
        .eq("question_id", todayQuestionResult.data.id);

      todayAnswers = count ?? 0;
    }

    const reportRows = (reportsResult.data ?? []) as Report[];

    const nextReportStats: ReportStats = {
      pending: 0,
      reviewed: 0,
      resolved: 0,
      dismissed: 0,
    };

    for (const report of reportRows) {
      const status = report.status as keyof ReportStats;

      if (reportStatusKeys.includes(status)) {
        nextReportStats[status] += 1;
      }
    }

    setReportStats(nextReportStats);
    setReports(reportRows);

    const answerRows = (recentAnswersResult.data ??
      []) as RecentAnswer[];

    const replyRows = (recentRepliesResult.data ??
      []) as RecentReply[];

    const reactionRows = (recentReactionsResult.data ??
      []) as RecentReaction[];

    const recentReportRows = (recentReportsResult.data ??
      []) as RecentReport[];

    setRecentAnswers(answerRows);
    setRecentReplies(replyRows);
    setRecentReactions(reactionRows);
    setRecentReports(recentReportRows);

    const uniqueUsers = new Set<string>();

    answerRows.forEach((item) => {
      if (item.user_id) uniqueUsers.add(item.user_id);
    });

    replyRows.forEach((item) => {
      if (item.user_id) uniqueUsers.add(item.user_id);
    });

    reactionRows.forEach((item) => {
      if (item.user_id) uniqueUsers.add(item.user_id);
    });

    reportRows.forEach((item) => {
      if (item.reporter_id) uniqueUsers.add(item.reporter_id);
    });

    const profileCount =
      profilesResult.error || profilesResult.count === null
        ? uniqueUsers.size
        : profilesResult.count ?? 0;

    const answerCount = answersResult.count ?? 0;
    const replyCount = repliesResult.count ?? 0;
    const reactionCount = likesResult.count ?? 0;

    const allCountriesResult = await supabase
      .from("answers")
      .select("country");

    const countryMap = new Map<string, number>();

    (allCountriesResult.data ?? []).forEach((row) => {
      const country = row.country;

      if (!country || country === "Other") return;

      countryMap.set(country, (countryMap.get(country) ?? 0) + 1);
    });

    const totalCountryAnswers = Array.from(countryMap.values()).reduce(
      (sum, value) => sum + value,
      0
    );

    const countryRows: CountryStat[] = Array.from(countryMap.entries())
      .map(([country, count]) => ({
        country,
        count,
        percentage:
          totalCountryAnswers > 0
            ? Math.round((count / totalCountryAnswers) * 100)
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setCountries(countryRows);

    setStats({
      users: profileCount,
      answers: answerCount,
      replies: replyCount,
      reports: reportRows.length,
      reactions: reactionCount,
      todayAnswers,
      countries: countryRows.length,
    });

    await loadActivityAnalytics();

    const combined: ActivityItem[] = [
      ...answerRows.map((item) => ({
        id: `answer-${item.id}`,
        type: "Answer" as const,
        user_id: item.user_id,
        text: item.answer,
        created_at: item.created_at,
      })),

      ...replyRows.map((item) => ({
        id: `reply-${item.id}`,
        type: "Reply" as const,
        user_id: item.user_id,
        text: item.reply,
        created_at: item.created_at,
      })),

      ...reactionRows.map((item) => ({
        id: `reaction-${item.id}`,
        type: "Reaction" as const,
        user_id: item.user_id,
        text: getReactionLabel(item.reaction),
        created_at: item.created_at,
      })),

      ...recentReportRows.map((item) => ({
        id: `report-${item.id}`,
        type: "Report" as const,
        user_id: item.reporter_id,
        text: item.reason,
        created_at: item.created_at,
      })),
    ];

    combined.sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );

    setActivity(combined.slice(0, 20));
  }

  async function loadActivityAnalytics() {
    const now = new Date();

    const days: ActivityPoint[] = [];

    for (let offset = 6; offset >= 0; offset--) {
      const day = new Date(now);
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - offset);

      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const start = day.toISOString();
      const end = nextDay.toISOString();

      const [answers, replies, reactions, reports] = await Promise.all([
        supabase
          .from("answers")
          .select("id", { count: "exact", head: true })
          .gte("created_at", start)
          .lt("created_at", end),

        supabase
          .from("replies")
          .select("id", { count: "exact", head: true })
          .gte("created_at", start)
          .lt("created_at", end),

        supabase
          .from("likes")
          .select("id", { count: "exact", head: true })
          .gte("created_at", start)
          .lt("created_at", end),

        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .gte("created_at", start)
          .lt("created_at", end),
      ]);

      const answerCount = answers.count ?? 0;
      const replyCount = replies.count ?? 0;
      const reactionCount = reactions.count ?? 0;
      const reportCount = reports.count ?? 0;

      days.push({
        label: day.toLocaleDateString("en-US", {
          weekday: "short",
        }),
        answers: answerCount,
        replies: replyCount,
        reactions: reactionCount,
        reports: reportCount,
        total:
          answerCount + replyCount + reactionCount + reportCount,
      });
    }

    setActivityData(days);
  }

  async function updateReportStatus(
    reportId: number,
    status: Report["status"]
  ) {
    setUpdatingReportId(reportId);

    const { error } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", reportId);

    if (!error) {
      setReports((current) =>
        current.map((report) =>
          report.id === reportId ? { ...report, status } : report
        )
      );

      setReportStats((current) => {
        const next: ReportStats = { ...current };

        for (const key of reportStatusKeys) {
          next[key] = 0;
        }

        for (const report of reports) {
          const currentStatus =
            report.id === reportId ? status : report.status;

          const typedStatus =
            currentStatus as keyof ReportStats;

          if (reportStatusKeys.includes(typedStatus)) {
            next[typedStatus] += 1;
          }
        }

        return next;
      });
    }

    setUpdatingReportId(null);
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesStatus =
        reportStatusFilter === "all" ||
        report.status === reportStatusFilter;

      const matchesReason =
        reportReasonFilter === "all" ||
        report.reason === reportReasonFilter;

      const search = reportSearch.trim().toLowerCase();

      const matchesSearch =
        !search ||
        String(report.id).includes(search) ||
        report.reporter_id.toLowerCase().includes(search) ||
        String(report.answer_id ?? "").includes(search) ||
        String(report.reply_id ?? "").includes(search) ||
        (report.details ?? "").toLowerCase().includes(search) ||
        report.reason.toLowerCase().includes(search);

      return matchesStatus && matchesReason && matchesSearch;
    });
  }, [
    reports,
    reportSearch,
    reportStatusFilter,
    reportReasonFilter,
  ]);

  if (loading || allowed === null) {
    return (
      <main className="min-h-screen bg-[#02030a] px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-xl">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-white/80" />
            <p className="text-sm text-white/60">
              Loading admin dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-[#02030a] px-4 py-10 text-white">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.06] p-10 text-center backdrop-blur-xl">
            <div className="mb-4 text-4xl">🛡️</div>
            <h1 className="text-2xl font-semibold">
              Access denied
            </h1>
            <p className="mt-2 text-sm text-white/55">
              You do not have admin access.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm text-white/80 transition hover:bg-white/10"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#02030a] px-4 py-8 text-white md:px-8">
      <style jsx global>{`
        .admin-night-bg {
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(
              circle at 20% 15%,
              rgba(59, 130, 246, 0.12),
              transparent 28%
            ),
            radial-gradient(
              circle at 80% 30%,
              rgba(139, 92, 246, 0.09),
              transparent 30%
            ),
            radial-gradient(
              circle at 50% 90%,
              rgba(14, 165, 233, 0.08),
              transparent 32%
            ),
            linear-gradient(
              180deg,
              #02030a 0%,
              #050713 42%,
              #02030a 100%
            );
        }

        .admin-night-bg::before {
          content: "";
          position: absolute;
          inset: -20%;
          background:
            radial-gradient(
              ellipse at 30% 35%,
              rgba(96, 165, 250, 0.09),
              transparent 24%
            ),
            radial-gradient(
              ellipse at 70% 20%,
              rgba(167, 139, 250, 0.08),
              transparent 25%
            );
          animation: adminAtmosphere 18s ease-in-out infinite alternate;
        }

        .admin-stars {
          position: absolute;
          inset: 0;
          opacity: 0.65;
          background-image:
            radial-gradient(circle at 8% 18%, rgba(255,255,255,.8) 0 1px, transparent 1.5px),
            radial-gradient(circle at 19% 72%, rgba(255,255,255,.55) 0 1px, transparent 1.5px),
            radial-gradient(circle at 31% 28%, rgba(255,255,255,.75) 0 1px, transparent 1.5px),
            radial-gradient(circle at 43% 82%, rgba(255,255,255,.55) 0 1px, transparent 1.5px),
            radial-gradient(circle at 57% 16%, rgba(255,255,255,.7) 0 1px, transparent 1.5px),
            radial-gradient(circle at 68% 64%, rgba(255,255,255,.6) 0 1px, transparent 1.5px),
            radial-gradient(circle at 79% 26%, rgba(255,255,255,.8) 0 1px, transparent 1.5px),
            radial-gradient(circle at 91% 76%, rgba(255,255,255,.55) 0 1px, transparent 1.5px),
            radial-gradient(circle at 88% 12%, rgba(255,255,255,.7) 0 1px, transparent 1.5px),
            radial-gradient(circle at 12% 92%, rgba(255,255,255,.5) 0 1px, transparent 1.5px);
          background-size: 100% 100%;
          animation: adminStars 30s linear infinite;
        }

        .admin-cloud {
          position: absolute;
          width: 360px;
          height: 100px;
          border-radius: 999px;
          background: rgba(255,255,255,0.025);
          filter: blur(28px);
        }

        .admin-cloud-one {
          top: 22%;
          left: -390px;
          animation: adminCloudOne 32s linear infinite;
        }

        .admin-cloud-two {
          top: 58%;
          left: -420px;
          opacity: 0.7;
          animation: adminCloudTwo 42s linear infinite;
        }

        .admin-cloud-three {
          top: 78%;
          left: -300px;
          opacity: 0.45;
          animation: adminCloudThree 50s linear infinite;
        }

        .chart-line {
          stroke-dasharray: 1600;
          stroke-dashoffset: 1600;
          opacity: 0;
          transition:
            stroke-dashoffset 1400ms cubic-bezier(.65,0,.35,1),
            opacity 500ms ease;
        }

        .chart-line-visible {
          stroke-dashoffset: 0;
          opacity: 1;
        }

        .chart-point {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          transform: scale(0);
          transition:
            opacity 350ms ease,
            transform 450ms cubic-bezier(.34,1.56,.64,1);
        }

        .chart-point-visible {
          opacity: 1;
          transform: scale(1);
        }

        @keyframes adminAtmosphere {
          from {
            transform: translate3d(-2%, -1%, 0) scale(1);
          }
          to {
            transform: translate3d(3%, 2%, 0) scale(1.08);
          }
        }

        @keyframes adminStars {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(18px, -14px, 0);
          }
        }

        @keyframes adminCloudOne {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(100vw + 850px));
          }
        }

        @keyframes adminCloudTwo {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(100vw + 950px));
          }
        }

        @keyframes adminCloudThree {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(100vw + 800px));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-night-bg *,
          .chart-line,
          .chart-point {
            animation: none !important;
            transition: none !important;
          }

          .chart-line {
            stroke-dashoffset: 0 !important;
            opacity: 1 !important;
          }

          .chart-point {
            opacity: 1 !important;
            transform: scale(1) !important;
          }
        }
      `}</style>

      <div className="admin-night-bg">
        <div className="admin-stars" />
        <div className="admin-cloud admin-cloud-one" />
        <div className="admin-cloud admin-cloud-two" />
        <div className="admin-cloud admin-cloud-three" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <ScrollReveal>
          <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
            <div>
              <Link
                href="/"
                className="text-2xl font-black tracking-tight"
              >
                ONE<span className="text-blue-400">QUESTION</span>
              </Link>

              <p className="mt-1 text-sm text-white/45">
                Admin Control Center
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/users"
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white/70 transition hover:bg-white/[0.08] hover:text-white"
              >
                Users
              </Link>

              <Link
                href="/admin/questions"
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white/70 transition hover:bg-white/[0.08] hover:text-white"
              >
                Questions
              </Link>

              <Link
                href="/moderation"
                className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-2.5 text-xs text-red-300 transition hover:bg-red-500/[0.14]"
              >
                🛡️ Moderation
                {reportStats.pending > 0 && (
                  <span className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px]">
                    {reportStats.pending}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={loadDashboard}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white/70 transition hover:bg-white/[0.08] hover:text-white active:scale-95"
              >
                ↻ Refresh
              </button>
            </div>
          </header>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <section
            id="overview"
            className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            {[
              {
                label: "Users",
                value: stats.users,
                icon: "👥",
              },
              {
                label: "Answers",
                value: stats.answers,
                icon: "💬",
              },
              {
                label: "Replies",
                value: stats.replies,
                icon: "↩️",
              },
              {
                label: "Reactions",
                value: stats.reactions,
                icon: "❤️",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">
                    Overview
                  </span>
                </div>

                <div className="mt-5 text-3xl font-semibold tracking-tight">
                  <AnimatedNumber value={item.value} />
                </div>

                <p className="mt-1 text-xs text-white/45">
                  {item.label}
                </p>
              </div>
            ))}
          </section>
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-blue-400/10 bg-blue-400/[0.04] p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.18em] text-blue-300/60">
                Today
              </p>
              <div className="mt-3 text-4xl font-semibold">
                <AnimatedNumber value={stats.todayAnswers} />
              </div>
              <p className="mt-2 text-sm text-white/45">
                Answers today
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-400/10 bg-cyan-400/[0.04] p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/60">
                Global
              </p>
              <div className="mt-3 text-4xl font-semibold">
                <AnimatedNumber value={stats.countries} />
              </div>
              <p className="mt-2 text-sm text-white/45">
                Active countries
              </p>
            </div>

            <div className="rounded-3xl border border-red-400/10 bg-red-400/[0.04] p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.18em] text-red-300/60">
                Reports
              </p>
              <div className="mt-3 text-4xl font-semibold">
                <AnimatedNumber value={stats.reports} />
              </div>
              <p className="mt-2 text-sm text-white/45">
                Total reports
              </p>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <section id="analytics" className="mb-8">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-300/60">
                Analytics
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                Community activity
              </h2>
              <p className="mt-1 text-sm text-white/45">
                Last 7 days of answers, replies, reactions and reports.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl md:p-7">
              <LineChart data={activityData} />
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={180}>
          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Pending reports",
                value: reportStats.pending,
                className:
                  "border-yellow-400/10 bg-yellow-400/[0.04] text-yellow-300",
              },
              {
                label: "Reviewed reports",
                value: reportStats.reviewed,
                className:
                  "border-blue-400/10 bg-blue-400/[0.04] text-blue-300",
              },
              {
                label: "Resolved reports",
                value: reportStats.resolved,
                className:
                  "border-green-400/20 bg-green-500/[0.08] text-green-300",
              },
              {
                label: "Dismissed reports",
                value: reportStats.dismissed,
                className:
                  "border-red-400/20 bg-red-500/[0.08] text-red-300",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-3xl border p-5 backdrop-blur-xl ${item.className}`}
              >
                <p className="text-xs opacity-70">{item.label}</p>
                <div className="mt-3 text-3xl font-semibold">
                  <AnimatedNumber value={item.value} />
                </div>
              </div>
            ))}
          </section>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <section id="countries" className="mb-8">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/60">
                Countries
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                Country analytics
              </h2>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl md:p-7">
              {countries.length === 0 ? (
                <p className="py-8 text-center text-sm text-white/40">
                  No country data yet.
                </p>
              ) : (
                <div className="space-y-5">
                  {countries.map((country, index) => (
                    <div key={country.country}>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="w-7 text-xs text-white/35">
                            #{index + 1}
                          </span>

                          <span className="truncate text-sm text-white/80">
                            {country.country}
                          </span>
                        </div>

                        <div className="shrink-0 text-xs text-white/45">
                          <AnimatedNumber value={country.count} />{" "}
                          <span className="text-white/25">
                            ({country.percentage}%)
                          </span>
                        </div>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500/70 to-cyan-300/70 transition-all duration-1000"
                          style={{
                            width: `${Math.max(
                              country.percentage,
                              2
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={220}>
          <section id="activity" className="mb-8">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-300/60">
                Activity
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                Recent activity
              </h2>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-xl">
              <div className="divide-y divide-white/[0.06]">
                {activity.length === 0 ? (
                  <div className="p-8 text-center text-sm text-white/40">
                    No recent activity.
                  </div>
                ) : (
                  activity.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 p-5 transition hover:bg-white/[0.025] md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.05] text-sm">
                          {item.type === "Answer" && "💬"}
                          {item.type === "Reply" && "↩️"}
                          {item.type === "Reaction" && "❤️"}
                          {item.type === "Report" && "⚠️"}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">
                              {item.type}
                            </span>

                            <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] text-white/45">
                              {shortId(item.user_id)}
                            </span>
                          </div>

                          <p className="mt-1 max-w-2xl truncate text-sm text-white/45">
                            {item.text}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 text-xs text-white/30">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={240}>
          <section id="reports" className="mb-8">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-red-300/60">
                  Reports management
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  Reports
                </h2>
              </div>

              <Link
                href="/moderation"
                className="inline-flex w-fit rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-2.5 text-xs text-red-300 transition hover:bg-red-500/[0.14]"
              >
                Open Moderation
              </Link>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-[1fr_180px_180px]">
              <input
                value={reportSearch}
                onChange={(event) =>
                  setReportSearch(event.target.value)
                }
                placeholder="Search report, user ID, answer ID, details..."
                className="rounded-2xl border border-white/10 bg-[#0b0d14]/90 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
              />

              <select
                value={reportStatusFilter}
                onChange={(event) =>
                  setReportStatusFilter(
                    event.target.value as
                      | "all"
                      | keyof ReportStats
                  )
                }
                className="rounded-2xl border border-white/10 bg-[#0b0d14]/90 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>

              <select
                value={reportReasonFilter}
                onChange={(event) =>
                  setReportReasonFilter(
                    event.target.value as
                      | "all"
                      | Report["reason"]
                  )
                }
                className="rounded-2xl border border-white/10 bg-[#0b0d14]/90 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="all">All Reasons</option>
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
                <option value="hate">Hate</option>
                <option value="sexual">Sexual</option>
                <option value="violence">Violence</option>
                <option value="misinformation">
                  Misinformation
                </option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-xl">
              {filteredReports.length === 0 ? (
                <div className="p-10 text-center text-sm text-white/40">
                  No reports match the current filters.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {filteredReports.map((report) => (
                    <div key={report.id} className="p-5 md:p-6">
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/60">
                                Report #{report.id}
                              </span>

                              <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] text-white/50">
                                {report.reason}
                              </span>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] ${
                                  report.status === "resolved"
                                    ? "bg-green-500/15 text-green-300"
                                    : report.status === "dismissed"
                                      ? "bg-red-500/15 text-red-300"
                                      : report.status === "reviewed"
                                        ? "bg-blue-500/15 text-blue-300"
                                        : "bg-yellow-500/15 text-yellow-300"
                                }`}
                              >
                                {reportStatusLabels[
                                  report.status as keyof ReportStats
                                ] ?? report.status}
                              </span>
                            </div>

                            <div className="mt-4 grid gap-2 text-xs text-white/45 sm:grid-cols-2">
                              <div>
                                Reporter:{" "}
                                <span className="text-white/65">
                                  {shortId(report.reporter_id)}
                                </span>
                              </div>

                              <div>
                                Answer ID:{" "}
                                <span className="text-white/65">
                                  {report.answer_id ?? "—"}
                                </span>
                              </div>

                              <div>
                                Reply ID:{" "}
                                <span className="text-white/65">
                                  {report.reply_id ?? "—"}
                                </span>
                              </div>

                              <div>
                                Created:{" "}
                                <span className="text-white/65">
                                  {formatDate(report.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {report.status !== "reviewed" && (
                              <button
                                type="button"
                                disabled={
                                  updatingReportId === report.id
                                }
                                onClick={() =>
                                  updateReportStatus(
                                    report.id,
                                    "reviewed"
                                  )
                                }
                                className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-2.5 text-xs text-blue-300 transition hover:bg-blue-500/20 active:scale-95 disabled:opacity-40"
                              >
                                Mark Reviewed
                              </button>
                            )}

                            {report.status !== "resolved" && (
                              <button
                                type="button"
                                disabled={
                                  updatingReportId === report.id
                                }
                                onClick={() =>
                                  updateReportStatus(
                                    report.id,
                                    "resolved"
                                  )
                                }
                                className="rounded-xl border border-green-500/40 bg-green-500/15 px-4 py-2.5 text-xs font-medium text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.08)] transition-all hover:border-green-400/60 hover:bg-green-500/25 hover:text-green-200 active:scale-95 disabled:opacity-40"
                              >
                                Resolve
                              </button>
                            )}

                            {report.status !== "dismissed" && (
                              <button
                                type="button"
                                disabled={
                                  updatingReportId === report.id
                                }
                                onClick={() =>
                                  updateReportStatus(
                                    report.id,
                                    "dismissed"
                                  )
                                }
                                className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2.5 text-xs font-medium text-red-300 shadow-[0_0_20px_rgba(239,68,94,0.08)] transition-all hover:border-red-400/60 hover:bg-red-500/25 hover:text-red-200 active:scale-95 disabled:opacity-40"
                              >
                                Dismiss
                              </button>
                            )}

                            {(report.status === "resolved" ||
                              report.status === "dismissed") && (
                              <button
                                type="button"
                                disabled={
                                  updatingReportId === report.id
                                }
                                onClick={() =>
                                  updateReportStatus(
                                    report.id,
                                    "pending"
                                  )
                                }
                                className="rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white/60 transition hover:bg-white/[0.1] active:scale-95 disabled:opacity-40"
                              >
                                Reopen
                              </button>
                            )}
                          </div>
                        </div>

                        {report.details && (
                          <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                            <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-white/30">
                              Report details
                            </p>

                            <p className="whitespace-pre-wrap text-sm leading-6 text-white/65">
                              {report.details}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={260}>
          <section className="mb-8 grid gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-300/60">
                  Recent answers
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Latest answers
                </h2>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-xl">
                <div className="divide-y divide-white/[0.06]">
                  {recentAnswers.map((answer) => (
                    <div key={answer.id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {answer.name}
                          </p>

                          <p className="mt-1 text-xs text-white/35">
                            {answer.country}
                          </p>

                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/55">
                            {answer.answer}
                          </p>
                        </div>

                        <span className="shrink-0 text-[10px] text-white/25">
                          {formatDate(answer.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {recentAnswers.length === 0 && (
                    <div className="p-8 text-center text-sm text-white/40">
                      No answers yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.2em] text-violet-300/60">
                  Recent replies
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Latest replies
                </h2>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-xl">
                <div className="divide-y divide-white/[0.06]">
                  {recentReplies.map((reply) => (
                    <div key={reply.id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs text-white/35">
                            User {shortId(reply.user_id)}
                          </p>

                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/55">
                            {reply.reply}
                          </p>

                          <p className="mt-2 text-[10px] text-white/25">
                            Answer #{reply.answer_id}
                          </p>
                        </div>

                        <span className="shrink-0 text-[10px] text-white/25">
                          {formatDate(reply.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {recentReplies.length === 0 && (
                    <div className="p-8 text-center text-sm text-white/40">
                      No replies yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={280}>
          <section className="mb-8 grid gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-300/60">
                  Reactions
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Latest reactions
                </h2>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-xl">
                <div className="divide-y divide-white/[0.06]">
                  {recentReactions.map((reaction) => (
                    <div
                      key={reaction.id}
                      className="flex items-center justify-between gap-4 p-5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="text-2xl">
                          {getReactionLabel(reaction.reaction)}
                        </span>

                        <div className="min-w-0">
                          <p className="text-xs text-white/45">
                            User {shortId(reaction.user_id)}
                          </p>

                          <p className="mt-1 text-[10px] text-white/25">
                            Answer #{reaction.answer_id}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 text-[10px] text-white/25">
                        {formatDate(reaction.created_at)}
                      </span>
                    </div>
                  ))}

                  {recentReactions.length === 0 && (
                    <div className="p-8 text-center text-sm text-white/40">
                      No reactions yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.2em] text-red-300/60">
                  Reports
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Latest reports
                </h2>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-xl">
                <div className="divide-y divide-white/[0.06]">
                  {recentReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between gap-4 p-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">
                            #{report.id}
                          </span>

                          <span className="rounded-full bg-red-500/10 px-2 py-1 text-[10px] text-red-300">
                            {report.reason}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-white/35">
                          {shortId(report.reporter_id)}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-[10px] capitalize text-white/45">
                          {report.status}
                        </p>

                        <p className="mt-1 text-[10px] text-white/25">
                          {formatDate(report.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {recentReports.length === 0 && (
                    <div className="p-8 text-center text-sm text-white/40">
                      No reports yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <section id="quick-actions" className="mb-8">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Control center
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                Quick actions
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Link
                href="/admin/users"
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.06]"
              >
                <div className="text-2xl">👥</div>
                <p className="mt-4 text-sm font-medium">Users</p>
                <p className="mt-1 text-xs text-white/35">
                  User activity
                </p>
              </Link>

              <Link
                href="/admin/questions"
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.06]"
              >
                <div className="text-2xl">❓</div>
                <p className="mt-4 text-sm font-medium">Questions</p>
                <p className="mt-1 text-xs text-white/35">
                  Manage questions
                </p>
              </Link>

              <a
                href="#reports"
                className="rounded-3xl border border-red-500/10 bg-red-500/[0.035] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-red-500/[0.06]"
              >
                <div className="text-2xl">⚠️</div>
                <p className="mt-4 text-sm font-medium">Reports</p>
                <p className="mt-1 text-xs text-white/35">
                  Review reports
                </p>
              </a>

              <a
                href="#analytics"
                className="rounded-3xl border border-blue-500/10 bg-blue-500/[0.035] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-blue-500/[0.06]"
              >
                <div className="text-2xl">📈</div>
                <p className="mt-4 text-sm font-medium">Analytics</p>
                <p className="mt-1 text-xs text-white/35">
                  Community trends
                </p>
              </a>

              <a
                href="#countries"
                className="rounded-3xl border border-cyan-500/10 bg-cyan-500/[0.035] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-cyan-500/[0.06]"
              >
                <div className="text-2xl">🌍</div>
                <p className="mt-4 text-sm font-medium">Countries</p>
                <p className="mt-1 text-xs text-white/35">
                  Global activity
                </p>
              </a>

              <a
                href="#activity"
                className="rounded-3xl border border-violet-500/10 bg-violet-500/[0.035] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-violet-500/[0.06]"
              >
                <div className="text-2xl">⚡</div>
                <p className="mt-4 text-sm font-medium">Activity</p>
                <p className="mt-1 text-xs text-white/35">
                  Recent events
                </p>
              </a>

              <Link
                href="/moderation"
                className="rounded-3xl border border-red-500/10 bg-red-500/[0.035] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-red-500/[0.06]"
              >
                <div className="text-2xl">🛡️</div>
                <p className="mt-4 text-sm font-medium">
                  Moderation
                </p>
                <p className="mt-1 text-xs text-white/35">
                  Manage reports
                </p>
              </Link>

              <Link
                href="/"
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.06]"
              >
                <div className="text-2xl">🏠</div>
                <p className="mt-4 text-sm font-medium">Home</p>
                <p className="mt-1 text-xs text-white/35">
                  View website
                </p>
              </Link>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={320}>
          <section
            id="settings"
            className="mb-8 rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl md:p-7"
          >
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Settings
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                Admin settings
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                  Admin account
                </p>

                <p className="mt-3 break-all text-sm text-white/75">
                  {adminEmail || "Admin account"}
                </p>
              </div>

              <div className="rounded-2xl border border-green-500/10 bg-green-500/[0.03] p-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-green-300/50">
                  Admin status
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.7)]" />

                  <span className="text-sm text-green-300">
                    Active administrator
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                  Dashboard
                </p>

                <p className="mt-3 text-sm text-white/60">
                  Data refreshes from Supabase when the dashboard is
                  loaded or manually refreshed.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                  Moderation
                </p>

                <p className="mt-3 text-sm text-white/60">
                  Review, resolve, dismiss and reopen community
                  reports from the moderation system.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-white/25">
          ONEQUESTION Admin Control Center
        </footer>
      </div>
    </main>
  );
}