"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
  status:
    | "pending"
    | "reviewed"
    | "resolved"
    | "dismissed";
  created_at: string;
};

type DropdownOption = {
  value: string;
  label: string;
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

        const eased = 1 - Math.pow(1 - progress, 4);

        setDisplayValue(
          Math.round(value * eased)
        );

        if (progress < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          setDisplayValue(value);
        }
      };

      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
        } else {
          cancelAnimationFrame(frame);
          setDisplayValue(0);
        }
      },
      {
        threshold: 0.25,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return <span ref={ref}>{displayValue}</span>;
}

function ScrollReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      },
      {
        threshold: 0.12,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      className={`
        ${className}
        transition-all
        duration-700
        ease-out
        ${
          visible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-8 scale-[0.98]"
        }
      `}
    >
      {children}
    </div>
  );
}

function CustomDropdown({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedOption =
    options.find(
      (option) => option.value === value
    ) ?? options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative z-[500] w-full md:w-auto"
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`
          group
          flex
          w-full
          min-w-[190px]
          items-center
          justify-between
          gap-4
          rounded-2xl
          border
          border-white/10
          bg-[#101114]
          px-4
          py-3
          text-left
          text-sm
          text-white
          shadow-[0_10px_30px_rgba(0,0,0,0.35)]
          transition-all
          duration-300
          hover:border-white/20
          hover:bg-[#17191d]
          active:scale-[0.98]
          ${
            open
              ? "border-white/25 bg-[#17191d]"
              : ""
          }
        `}
      >
        <span className="truncate">
          {selectedOption?.label || placeholder}
        </span>

        <span
          className={`
            flex
            h-6
            w-6
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-white/5
            text-white/70
            transition-all
            duration-300
            ${
              open
                ? "rotate-180 bg-white/10"
                : "rotate-0"
            }
          `}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      <div
        className={`
          absolute
          left-0
          right-0
          top-[calc(100%+8px)]
          z-[9999]
          origin-top
          rounded-2xl
          border
          border-white/10
          bg-[#0d0e11]
          p-1.5
          shadow-[0_20px_60px_rgba(0,0,0,0.75)]
          transition-all
          duration-300
          ${
            open
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-3 scale-[0.96] opacity-0"
          }
        `}
      >
        <div className="max-h-72 overflow-y-auto">
          {options.map((option, index) => {
            const selected =
              option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={{
                  transitionDelay: open
                    ? `${index * 25}ms`
                    : "0ms",
                }}
                className={`
                  mb-1
                  flex
                  w-full
                  items-center
                  justify-between
                  rounded-xl
                  px-3
                  py-2.5
                  text-left
                  text-sm
                  transition-all
                  duration-200
                  last:mb-0
                  ${
                    selected
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/[0.08] hover:text-white"
                  }
                `}
              >
                <span>{option.label}</span>

                {selected && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black">
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] =
    useState<boolean | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [reasonFilter, setReasonFilter] =
    useState("all");

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);
    await loadReports();
  }

  async function loadReports() {
    setLoading(true);

    const { data, error } = await supabase
      .from("reports")
      .select(`
        id,
        reporter_id,
        answer_id,
        reply_id,
        reason,
        details,
        status,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Admin reports error:",
        error
      );
      setReports([]);
    } else {
      setReports(
        (data || []) as Report[]
      );
    }

    setLoading(false);
  }

  async function updateStatus(
    id: number,
    status: Report["status"]
  ) {
    setUpdatingId(id);

    const { error } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert(
        "Could not update report status."
      );
    } else {
      setReports((current) =>
        current.map((report) =>
          report.id === id
            ? {
                ...report,
                status,
              }
            : report
        )
      );
    }

    setUpdatingId(null);
  }

  const filteredReports = reports.filter(
    (report) => {
      const searchText =
        search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        report.id
          .toString()
          .includes(searchText) ||
        report.reporter_id
          .toLowerCase()
          .includes(searchText) ||
        report.answer_id
          ?.toString()
          .includes(searchText) ||
        report.reply_id
          ?.toString()
          .includes(searchText) ||
        report.details
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        report.status === statusFilter;

      const matchesReason =
        reasonFilter === "all" ||
        report.reason === reasonFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesReason
      );
    }
  );

  const pendingCount = reports.filter(
    (r) => r.status === "pending"
  ).length;

  const reviewedCount = reports.filter(
    (r) => r.status === "reviewed"
  ).length;

  const resolvedCount = reports.filter(
    (r) => r.status === "resolved"
  ).length;

  const dismissedCount = reports.filter(
    (r) => r.status === "dismissed"
  ).length;

  const statusOptions: DropdownOption[] = [
    {
      value: "all",
      label: "All Statuses",
    },
    {
      value: "pending",
      label: "Pending",
    },
    {
      value: "reviewed",
      label: "Reviewed",
    },
    {
      value: "resolved",
      label: "Resolved",
    },
    {
      value: "dismissed",
      label: "Dismissed",
    },
  ];

  const reasonOptions: DropdownOption[] = [
    {
      value: "all",
      label: "All Reasons",
    },
    {
      value: "spam",
      label: "Spam",
    },
    {
      value: "harassment",
      label: "Harassment",
    },
    {
      value: "hate",
      label: "Hate",
    },
    {
      value: "sexual",
      label: "Sexual",
    },
    {
      value: "violence",
      label: "Violence",
    },
    {
      value: "misinformation",
      label: "Misinformation",
    },
    {
      value: "other",
      label: "Other",
    },
  ];

  if (allowed === null || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-white" />

          <p className="text-sm text-white/50">
            Loading moderation...
          </p>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
          <div className="mb-5 text-5xl">
            🛡️
          </div>

          <h1 className="text-2xl font-semibold">
            Access Denied
          </h1>

          <p className="mt-3 text-sm text-white/50">
            You do not have permission to
            access moderation.
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10"
          >
            Back Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#02030a] px-4 py-8 text-white md:px-8">

      {/* ============================= */}
      {/* LIVE CINEMATIC NIGHT SKY */}
      {/* ============================= */}

      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">

        {/* Deep night sky */}
        <div
          className="absolute inset-[-15%]"
          style={{
            background:
              "radial-gradient(circle at 20% 15%, rgba(48,58,150,0.20), transparent 30%), radial-gradient(circle at 82% 18%, rgba(108,55,170,0.18), transparent 32%), radial-gradient(circle at 50% 65%, rgba(25,67,145,0.12), transparent 40%), linear-gradient(145deg, #010207 0%, #05091a 30%, #09051b 55%, #020817 78%, #010207 100%)",
            backgroundSize:
              "180% 180%, 190% 190%, 180% 180%, 400% 400%",
            backgroundPosition:
              "0% 0%, 100% 0%, 50% 50%, 0% 50%",
            animation:
              "nightSkyMove 30s ease-in-out infinite",
          }}
        />

        {/* Aurora atmosphere */}
        <div
          className="absolute left-[-15%] top-[20%] h-[420px] w-[120%] rotate-[-8deg]"
          style={{
            background:
              "linear-gradient(100deg, transparent 5%, rgba(45,212,191,0.025) 28%, rgba(99,102,241,0.08) 48%, rgba(168,85,247,0.055) 65%, transparent 92%)",
            filter: "blur(45px)",
            animation:
              "auroraWave 22s ease-in-out infinite alternate",
          }}
        />

        <div
          className="absolute left-[-20%] top-[42%] h-[300px] w-[130%] rotate-[7deg]"
          style={{
            background:
              "linear-gradient(100deg, transparent 8%, rgba(59,130,246,0.035) 35%, rgba(129,140,248,0.065) 52%, rgba(139,92,246,0.035) 70%, transparent 95%)",
            filter: "blur(55px)",
            animation:
              "auroraWaveTwo 27s ease-in-out infinite alternate",
          }}
        />

        {/* Stars layer 1 */}
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "radial-gradient(circle at 7% 18%, rgba(255,255,255,0.8) 0 1px, transparent 1.5px), radial-gradient(circle at 15% 68%, rgba(255,255,255,0.55) 0 1px, transparent 1.5px), radial-gradient(circle at 23% 32%, rgba(190,210,255,0.7) 0 1px, transparent 1.5px), radial-gradient(circle at 31% 12%, rgba(255,255,255,0.65) 0 1px, transparent 1.5px), radial-gradient(circle at 38% 75%, rgba(210,220,255,0.5) 0 1px, transparent 1.5px), radial-gradient(circle at 47% 23%, rgba(255,255,255,0.7) 0 1px, transparent 1.5px), radial-gradient(circle at 55% 61%, rgba(180,200,255,0.55) 0 1px, transparent 1.5px), radial-gradient(circle at 63% 14%, rgba(255,255,255,0.8) 0 1px, transparent 1.5px), radial-gradient(circle at 71% 48%, rgba(210,220,255,0.65) 0 1px, transparent 1.5px), radial-gradient(circle at 79% 76%, rgba(255,255,255,0.5) 0 1px, transparent 1.5px), radial-gradient(circle at 88% 33%, rgba(190,210,255,0.7) 0 1px, transparent 1.5px), radial-gradient(circle at 95% 63%, rgba(255,255,255,0.55) 0 1px, transparent 1.5px)",
            animation:
              "starsDrift 42s linear infinite",
          }}
        />

        {/* Stars layer 2 */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle at 11% 42%, rgba(255,255,255,0.9) 0 1.5px, transparent 2px), radial-gradient(circle at 28% 87%, rgba(180,205,255,0.7) 0 1.5px, transparent 2px), radial-gradient(circle at 43% 48%, rgba(255,255,255,0.7) 0 1.5px, transparent 2px), radial-gradient(circle at 58% 88%, rgba(200,215,255,0.7) 0 1.5px, transparent 2px), radial-gradient(circle at 68% 28%, rgba(255,255,255,0.85) 0 1.5px, transparent 2px), radial-gradient(circle at 84% 57%, rgba(190,205,255,0.8) 0 1.5px, transparent 2px)",
            animation:
              "starsTwinkle 6s ease-in-out infinite alternate",
          }}
        />

        {/* Floating star particles */}
        <div
          className="absolute left-[18%] top-[20%] h-1 w-1 rounded-full bg-white/60 shadow-[0_0_10px_rgba(255,255,255,0.7)]"
          style={{
            animation:
              "starFloatOne 12s ease-in-out infinite",
          }}
        />

        <div
          className="absolute left-[48%] top-[16%] h-1.5 w-1.5 rounded-full bg-blue-100/50 shadow-[0_0_12px_rgba(180,200,255,0.7)]"
          style={{
            animation:
              "starFloatTwo 16s ease-in-out infinite",
          }}
        />

        <div
          className="absolute left-[74%] top-[68%] h-1 w-1 rounded-full bg-violet-100/50 shadow-[0_0_10px_rgba(200,180,255,0.6)]"
          style={{
            animation:
              "starFloatThree 14s ease-in-out infinite",
          }}
        />

        {/* Soft moving clouds / space haze */}
        <div
          className="absolute -left-[10%] top-[62%] h-40 w-[70%] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, rgba(55,65,120,0.10), transparent 70%)",
            filter: "blur(35px)",
            animation:
              "nightCloudOne 25s ease-in-out infinite alternate",
          }}
        />

        <div
          className="absolute -right-[15%] top-[48%] h-48 w-[65%] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, rgba(90,65,130,0.09), transparent 70%)",
            filter: "blur(40px)",
            animation:
              "nightCloudTwo 31s ease-in-out infinite alternate",
          }}
        />

        {/* Tiny shooting-star-like glow */}
        <div
          className="absolute left-[8%] top-[30%] h-px w-20 rotate-[-25deg] rounded-full bg-gradient-to-r from-transparent via-white/35 to-transparent"
          style={{
            animation:
              "meteorOne 14s ease-in-out infinite",
          }}
        />

        {/* Cinematic vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 35%, transparent 12%, rgba(0,0,8,0.18) 48%, rgba(0,0,5,0.76) 100%)",
          }}
        />

        {/* Bottom darkness */}
        <div
          className="absolute inset-x-0 bottom-0 h-[40%]"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,5,0.65), transparent)",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes nightSkyMove {
          0% {
            background-position:
              0% 0%,
              100% 0%,
              50% 50%,
              0% 50%;
          }

          25% {
            background-position:
              20% 18%,
              80% 22%,
              35% 62%,
              35% 35%;
          }

          50% {
            background-position:
              55% 30%,
              45% 15%,
              70% 45%,
              70% 55%;
          }

          75% {
            background-position:
              75% 12%,
              25% 32%,
              40% 75%,
              35% 70%;
          }

          100% {
            background-position:
              0% 0%,
              100% 0%,
              50% 50%,
              0% 50%;
          }
        }

        @keyframes auroraWave {
          0% {
            transform: translate3d(-8%, 0, 0) rotate(-8deg)
              scale(0.95);
            opacity: 0.35;
          }

          50% {
            transform: translate3d(5%, 35px, 0) rotate(-4deg)
              scale(1.08);
            opacity: 0.8;
          }

          100% {
            transform: translate3d(12%, -25px, 0) rotate(-10deg)
              scale(1);
            opacity: 0.4;
          }
        }

        @keyframes auroraWaveTwo {
          0% {
            transform: translate3d(10%, 0, 0) rotate(7deg)
              scale(1);
            opacity: 0.25;
          }

          50% {
            transform: translate3d(-5%, -35px, 0) rotate(3deg)
              scale(1.1);
            opacity: 0.65;
          }

          100% {
            transform: translate3d(-12%, 25px, 0) rotate(10deg)
              scale(0.95);
            opacity: 0.3;
          }
        }

        @keyframes starsDrift {
          0% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(-12px, 8px, 0);
          }

          100% {
            transform: translate3d(5px, -5px, 0);
          }
        }

        @keyframes starsTwinkle {
          0% {
            opacity: 0.25;
            transform: scale(0.98);
          }

          50% {
            opacity: 0.75;
            transform: scale(1.02);
          }

          100% {
            opacity: 0.35;
            transform: scale(0.99);
          }
        }

        @keyframes starFloatOne {
          0%,
          100% {
            opacity: 0.2;
            transform: translate3d(0, 0, 0);
          }

          50% {
            opacity: 0.9;
            transform: translate3d(90px, 35px, 0);
          }
        }

        @keyframes starFloatTwo {
          0%,
          100% {
            opacity: 0.2;
            transform: translate3d(0, 0, 0);
          }

          50% {
            opacity: 0.8;
            transform: translate3d(-70px, 80px, 0);
          }
        }

        @keyframes starFloatThree {
          0%,
          100% {
            opacity: 0.15;
            transform: translate3d(0, 0, 0);
          }

          50% {
            opacity: 0.75;
            transform: translate3d(80px, -60px, 0);
          }
        }

        @keyframes nightCloudOne {
          0% {
            transform: translate3d(-10%, 0, 0) scale(0.9);
          }

          50% {
            transform: translate3d(25%, -20px, 0) scale(1.08);
          }

          100% {
            transform: translate3d(55%, 15px, 0) scale(0.95);
          }
        }

        @keyframes nightCloudTwo {
          0% {
            transform: translate3d(15%, 0, 0) scale(0.95);
          }

          50% {
            transform: translate3d(-20%, 25px, 0) scale(1.1);
          }

          100% {
            transform: translate3d(-45%, -15px, 0) scale(0.96);
          }
        }

        @keyframes meteorOne {
          0%,
          72%,
          100% {
            opacity: 0;
            transform: translate3d(0, 0, 0) rotate(-25deg);
          }

          76% {
            opacity: 0.8;
          }

          84% {
            opacity: 0;
            transform: translate3d(260px, 120px, 0)
              rotate(-25deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* HEADER */}
        <ScrollReveal>
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <Link
                href="/admin"
                className="mb-4 inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
              >
                <span>←</span>
                Admin Dashboard
              </Link>

              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Moderation
              </h1>

              <p className="mt-2 text-sm text-white/40">
                Review and manage community
                reports.
              </p>
            </div>

            <button
              type="button"
              onClick={loadReports}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition-all duration-300 hover:border-white/20 hover:bg-white/10 active:scale-95"
            >
              ↻ Refresh
            </button>
          </div>
        </ScrollReveal>

        {/* STATS */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">

          <ScrollReveal delay={0}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_15px_50px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
              <p className="text-xs uppercase tracking-wider text-white/35">
                Pending
              </p>

              <p className="mt-3 text-3xl font-semibold">
                <AnimatedNumber
                  value={pendingCount}
                />
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_15px_50px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
              <p className="text-xs uppercase tracking-wider text-white/35">
                Reviewed
              </p>

              <p className="mt-3 text-3xl font-semibold">
                <AnimatedNumber
                  value={reviewedCount}
                />
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <div className="rounded-3xl border border-green-400/20 bg-green-500/[0.07] p-5 shadow-[0_15px_50px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-1 hover:border-green-400/30 hover:bg-green-500/[0.10]">
              <p className="text-xs uppercase tracking-wider text-green-300/70">
                Resolved
              </p>

              <p className="mt-3 text-3xl font-semibold text-green-300">
                <AnimatedNumber
                  value={resolvedCount}
                />
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={240}>
            <div className="rounded-3xl border border-red-400/20 bg-red-500/[0.07] p-5 shadow-[0_15px_50px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-1 hover:border-red-400/30 hover:bg-red-500/[0.10]">
              <p className="text-xs uppercase tracking-wider text-red-300/70">
                Dismissed
              </p>

              <p className="mt-3 text-3xl font-semibold text-red-300">
                <AnimatedNumber
                  value={dismissedCount}
                />
              </p>
            </div>
          </ScrollReveal>

        </div>

        {/* FILTERS */}
        <ScrollReveal
          className="relative z-[200]"
        >
          <div className="relative z-[200] mb-8 rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_15px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl md:p-5">

            <div className="relative z-[200] flex flex-col gap-3 md:flex-row">

              <div className="relative z-[200] flex-1">
                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search reports..."
                  className="w-full rounded-2xl border border-white/10 bg-[#101114] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 transition-all duration-300 focus:border-white/25 focus:bg-[#15171b] focus:ring-4 focus:ring-white/[0.03]"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/5 text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>

              <CustomDropdown
                value={statusFilter}
                options={statusOptions}
                onChange={setStatusFilter}
                placeholder="Status"
              />

              <CustomDropdown
                value={reasonFilter}
                options={reasonOptions}
                onChange={setReasonFilter}
                placeholder="Reason"
              />

            </div>
          </div>
        </ScrollReveal>

        {/* REPORT LIST */}
        <div className="relative z-10 space-y-4">

          {filteredReports.length === 0 ? (
            <ScrollReveal>
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] px-6 py-16 text-center">
                <div className="mb-4 text-5xl">
                  ✨
                </div>

                <h2 className="text-lg font-medium">
                  No reports found
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  Try changing your search or
                  filters.
                </p>
              </div>
            </ScrollReveal>
          ) : (
            filteredReports.map(
              (report, index) => (
                <ScrollReveal
                  key={report.id}
                  delay={Math.min(
                    index * 70,
                    500
                  )}
                >
                  <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_15px_50px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.055] md:p-6">

                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                            #{report.id}
                          </span>

                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs capitalize text-white/70">
                            {report.reason}
                          </span>

                          <span
                            className={`
                              rounded-full
                              border
                              px-3
                              py-1
                              text-xs
                              capitalize
                              ${
                                report.status ===
                                "pending"
                                  ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                                  : report.status ===
                                    "resolved"
                                  ? "border-green-400/20 bg-green-400/10 text-green-300"
                                  : report.status ===
                                    "dismissed"
                                  ? "border-red-400/20 bg-red-400/10 text-red-300"
                                  : "border-blue-400/20 bg-blue-400/10 text-blue-300"
                              }
                            `}
                          >
                            {report.status}
                          </span>

                        </div>

                        <div className="mt-4 space-y-1 text-xs text-white/40">

                          <p>
                            Reporter:{" "}
                            <span className="text-white/65">
                              {report.reporter_id}
                            </span>
                          </p>

                          <p>
                            Reported:{" "}
                            {formatDate(
                              report.created_at
                            )}
                          </p>

                          {report.answer_id && (
                            <p>
                              Answer ID:{" "}
                              <span className="text-white/65">
                                {report.answer_id}
                              </span>
                            </p>
                          )}

                          {report.reply_id && (
                            <p>
                              Reply ID:{" "}
                              <span className="text-white/65">
                                {report.reply_id}
                              </span>
                            </p>
                          )}

                        </div>
                      </div>
                    </div>

                    {report.details && (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="mb-2 text-[11px] uppercase tracking-wider text-white/30">
                          Details
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-6 text-white/70">
                          {report.details}
                        </p>
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">

                      {report.status !==
                        "reviewed" && (
                        <button
                          type="button"
                          disabled={
                            updatingId ===
                            report.id
                          }
                          onClick={() =>
                            updateStatus(
                              report.id,
                              "reviewed"
                            )
                          }
                          className="rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-2.5 text-xs font-medium text-blue-300 transition-all hover:bg-blue-400/20 active:scale-95 disabled:opacity-40"
                        >
                          {updatingId ===
                          report.id
                            ? "Updating..."
                            : "Mark Reviewed"}
                        </button>
                      )}

                      {report.status !==
                        "resolved" && (
                        <button
                          type="button"
                          disabled={
                            updatingId ===
                            report.id
                          }
                          onClick={() =>
                            updateStatus(
                              report.id,
                              "resolved"
                            )
                          }
                          className="rounded-xl border border-green-500/40 bg-green-500/15 px-4 py-2.5 text-xs font-medium text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.08)] transition-all hover:border-green-400/60 hover:bg-green-500/25 hover:text-green-200 active:scale-95 disabled:opacity-40"
                        >
                          Resolve
                        </button>
                      )}

                      {report.status !==
                        "dismissed" && (
                        <button
                          type="button"
                          disabled={
                            updatingId ===
                            report.id
                          }
                          onClick={() =>
                            updateStatus(
                              report.id,
                              "dismissed"
                            )
                          }
                          className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2.5 text-xs font-medium text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.08)] transition-all hover:border-red-400/60 hover:bg-red-500/25 hover:text-red-200 active:scale-95 disabled:opacity-40"
                        >
                          Dismiss
                        </button>
                      )}

                      {report.status !==
                        "pending" && (
                        <button
                          type="button"
                          disabled={
                            updatingId ===
                            report.id
                          }
                          onClick={() =>
                            updateStatus(
                              report.id,
                              "pending"
                            )
                          }
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/65 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-40"
                        >
                          Reopen
                        </button>
                      )}

                    </div>
                  </div>
                </ScrollReveal>
              )
            )
          )}

        </div>

        {/* FOOTER */}
        <ScrollReveal>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-center">
            <p className="text-sm text-white/40">
              Showing{" "}
              <span className="font-semibold text-white">
                <AnimatedNumber
                  value={
                    filteredReports.length
                  }
                />
              </span>{" "}
              of{" "}
              <span className="font-semibold text-white">
                <AnimatedNumber
                  value={reports.length}
                />
              </span>{" "}
              reports
            </p>
          </div>
        </ScrollReveal>

      </div>
    </main>
  );
}