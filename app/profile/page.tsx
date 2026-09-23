"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ScrollReveal from "../ScrollReveal";

type Answer = {
  id: number;
  answer: string;
  country: string;
  created_at: string;
};

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setEmail(user.email || "");

    const { data, error } = await supabase
      .from("answers")
      .select("id, answer, country, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Profile answers error:", error);
      setLoading(false);
      return;
    }

    setAnswers(data || []);
    setLoading(false);
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-5 py-10">

        {/* TOP NAVIGATION */}
        <ScrollReveal>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              ← Home
            </a>

            <a
              href="/explore"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Explore
            </a>

            <a
              href="/world"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              World
            </a>

            <a
              href="/popular"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Popular
            </a>

            <a
              href="/archive"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Archive
            </a>
          </div>
        </ScrollReveal>

        {/* PROFILE HEADER */}
        <ScrollReveal delay={100}>
          <div className="mt-10">
            <h1 className="text-4xl font-bold">
              Profile
            </h1>

            <p className="mt-2 text-white/60">
              {email}
            </p>
          </div>
        </ScrollReveal>

        {/* STATS */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <ScrollReveal delay={0}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-white/40">
                Answers
              </p>

              <p className="mt-2 text-3xl font-bold">
                {answers.length}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-white/40">
                Countries
              </p>

              <p className="mt-2 text-3xl font-bold">
                {new Set(answers.map((item) => item.country)).size}
              </p>
            </div>
          </ScrollReveal>
        </div>

        {/* ANSWER HISTORY */}
        <ScrollReveal delay={150}>
          <section className="mt-10">
            <div className="mb-5">
              <h2 className="text-2xl font-bold">
                My Answers
              </h2>

              <p className="mt-1 text-sm text-white/50">
                Your ONEQUESTION answer history.
              </p>
            </div>

            {loading && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
                Loading your answers...
              </div>
            )}

            {!loading && answers.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
                You haven't posted any answers yet.
              </div>
            )}

            {!loading && answers.length > 0 && (
              <div className="space-y-4">
                {answers.map((item, index) => (
                  <ScrollReveal
                    key={item.id}
                    delay={index * 100}
                  >
                    <div
                      className="rounded-2xl border border-white/10 bg-white/5 p-6"
                    >
                      <p className="text-lg leading-8 text-white/90">
                        {item.answer}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/40">
                        <span>{item.country}</span>
                        <span>•</span>
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </section>
        </ScrollReveal>

        {/* LOGOUT */}
        <ScrollReveal delay={200}>
          <div className="mt-10">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white/60 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Logout
            </button>
          </div>
        </ScrollReveal>

        {/* FOOTER */}
        <ScrollReveal delay={250}>
          <footer className="mt-16 border-t border-white/10 pt-6 text-center text-sm text-white/30">
            ONEQUESTION © 2026
          </footer>
        </ScrollReveal>

      </div>
    </main>
  );
}