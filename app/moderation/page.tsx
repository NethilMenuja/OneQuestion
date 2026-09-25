"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Report = {
  id: number;
  reporter_id: string;
  answer_id: number | null;
  reply_id: number | null;
  reason: string;
  details: string | null;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  created_at: string;

  answer?: {
    answer: string;
    name: string;
  } | null;

  reply?: {
    reply: string;
    user_id: string;
  } | null;
};

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    loadModeration();
  }, []);

  async function loadModeration() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    // Check admin
    const { data: adminData, error: adminError } =
      await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (adminError) {
      console.error("Admin check error:", adminError);

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

    // Load ONLY pending reports
    const {
      data: reportsData,
      error: reportsError,
    } = await supabase
      .from("reports")
      .select(
        `
        id,
        reporter_id,
        answer_id,
        reply_id,
        reason,
        details,
        status,
        created_at,
        answers (
          answer,
          name
        ),
        replies (
          reply,
          user_id
        )
      `
      )
      .eq("status", "pending")
      .order("created_at", {
        ascending: false,
      });

    if (reportsError) {
      console.error(
        "Moderation reports error:",
        reportsError
      );

      setErrorMessage(
        reportsError.message ||
          "Could not load reports."
      );

      setLoading(false);
      return;
    }

    const formattedReports: Report[] =
      (reportsData || []).map((item: any) => ({
        id: item.id,
        reporter_id: item.reporter_id,
        answer_id: item.answer_id,
        reply_id: item.reply_id,
        reason: item.reason,
        details: item.details,
        status: item.status,
        created_at: item.created_at,
        answer: Array.isArray(item.answers)
          ? item.answers[0] || null
          : item.answers || null,
        reply: Array.isArray(item.replies)
          ? item.replies[0] || null
          : item.replies || null,
      }));

    setReports(formattedReports);
    setLoading(false);
  }

  async function updateReportStatus(
    reportId: number,
    status: "resolved" | "dismissed"
  ) {
    if (updatingId !== null) {
      return;
    }

    setUpdatingId(reportId);
    setErrorMessage("");

    // Update database
    const {
      data: updatedReport,
      error,
    } = await supabase
      .from("reports")
      .update({
        status: status,
      })
      .eq("id", reportId)
      .select("id, status")
      .single();

    if (error) {
      console.error(
        "Update report error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Could not update this report."
      );

      setUpdatingId(null);
      return;
    }

    // Verify the database actually changed
    if (
      !updatedReport ||
      updatedReport.status !== status
    ) {
      console.error(
        "Report status was not updated:",
        updatedReport
      );

      setErrorMessage(
        "The report status was not updated."
      );

      setUpdatingId(null);
      return;
    }

    // Remove it immediately from pending list
    setReports((previous) =>
      previous.filter(
        (report) => report.id !== reportId
      )
    );

    setUpdatingId(null);

    // Reload pending reports so newly submitted reports appear
    await loadModeration();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-5 py-10 text-white">
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
            <div className="animate-pulse text-white/50">
              Loading moderation...
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
              You do not have permission to access
              moderation.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              ← Back home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-5 py-10 text-white">
      <div className="mx-auto w-full max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-2xl font-bold tracking-[0.25em] transition hover:opacity-70"
          >
            ONEQUESTION
          </Link>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">
                Admin
              </p>

              <h1 className="mt-1 text-3xl font-semibold">
                Moderation
              </h1>

              <p className="mt-2 text-sm text-white/40">
                Review reported content.
              </p>
            </div>

            <div className="rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs text-red-300">
              🚩 {reports.length} pending
            </div>
          </div>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Empty */}
        {reports.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
            <div className="text-4xl">
              ✨
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              No pending reports
            </h2>

            <p className="mt-2 text-sm text-white/35">
              Everything is clear for now.
            </p>
          </div>
        )}

        {/* Reports */}
        <div className="space-y-5">
          {reports.map((report) => {
            const isAnswerReport =
              !!report.answer_id;

            const isUpdating =
              updatingId === report.id;

            return (
              <div
                key={report.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] shadow-2xl backdrop-blur-xl"
              >

                {/* Report header */}
                <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-300">
                        {isAnswerReport
                          ? "Answer"
                          : "Reply"}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/40">
                        {report.reason}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-white/30">
                      Report #{report.id} ·{" "}
                      {new Date(
                        report.created_at
                      ).toLocaleString()}
                    </p>
                  </div>

                  <span className="shrink-0 text-xl">
                    🚩
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6">

                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                    Reported content
                  </p>

                  {isAnswerReport &&
                    report.answer && (
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-sm font-semibold text-white/80">
                          {report.answer.name}
                        </p>

                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/65">
                          {report.answer.answer}
                        </p>
                      </div>
                    )}

                  {!isAnswerReport &&
                    report.reply && (
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-sm font-semibold text-white/80">
                          Reply
                        </p>

                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/65">
                          {report.reply.reply}
                        </p>
                      </div>
                    )}

                  {/* Details */}
                  {report.details && (
                    <div className="mt-4">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                        Reporter details
                      </p>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/55">
                        {report.details}
                      </div>
                    </div>
                  )}

                  {/* Reporter */}
                  <p className="mt-4 text-[10px] text-white/25">
                    Reporter ID:{" "}
                    {report.reporter_id}
                  </p>

                  {/* Actions */}
                  <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4">

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        updateReportStatus(
                          report.id,
                          "dismissed"
                        )
                      }
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/50 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUpdating
                        ? "Updating..."
                        : "Dismiss"}
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        updateReportStatus(
                          report.id,
                          "resolved"
                        )
                      }
                      className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUpdating
                        ? "Updating..."
                        : "✓ Resolve"}
                    </button>

                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-white/35 transition hover:text-white"
          >
            ← Back to ONEQUESTION
          </Link>
        </div>

      </div>
    </main>
  );
}