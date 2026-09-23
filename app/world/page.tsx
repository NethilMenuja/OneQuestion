"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ScrollReveal from "../ScrollReveal";

type Answer = {
  id: number;
  country: string;
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

export default function WorldPage() {
  const [countries, setCountries] = useState<
    { country: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorld();
  }, []);

  async function loadWorld() {
    setLoading(true);

    const { data, error } = await supabase
      .from("answers")
      .select("id, country");

    if (error) {
      console.error("World error:", error);
      setLoading(false);
      return;
    }

    const counts: Record<string, number> = {};

    (data as Answer[] | null)?.forEach((answer) => {
      if (!answer.country) return;

      counts[answer.country] =
        (counts[answer.country] || 0) + 1;
    });

    const result = Object.entries(counts)
      .map(([country, count]) => ({
        country,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    setCountries(result);
    setLoading(false);
  }

  const totalAnswers = countries.reduce(
    (total, item) => total + item.count,
    0
  );

  const countryCount = countries.filter(
    (item) => item.country !== "Other"
  ).length;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-5 py-10">

        {/* HEADER */}
        <div className="mb-10">
          <a
            href="/"
            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            ← Back to ONEQUESTION
          </a>

          <h1 className="mt-6 text-4xl font-bold">
            World
          </h1>

          <p className="mt-2 text-white/60">
            See where the ONEQUESTION community is answering from.
          </p>
        </div>

        {/* STATS */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <ScrollReveal>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-3xl font-bold">
                {totalAnswers}
              </p>

              <p className="mt-2 text-sm text-white/40">
                Answers
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-3xl font-bold">
                {countryCount}
              </p>

              <p className="mt-2 text-sm text-white/40">
                Countries
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-3xl font-bold">
                {Math.round((countryCount / 195) * 100)}%
              </p>

              <p className="mt-2 text-sm text-white/40">
                World Coverage
              </p>
            </div>
          </ScrollReveal>

        </div>

        {/* COUNTRIES */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Community Around the World
            </h2>

            <span className="text-sm text-white/30">
              {countryCount} countries
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-white/50">
              Loading world data...
            </div>
          ) : countries.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-white/50">
                No answers yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {countries.map((item, index) => {
                const flag = countryFlags[item.country];

                return (
                  <ScrollReveal
                    key={item.country}
                    delay={index * 100}
                  >
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">

                      <div className="flex min-w-0 items-center gap-4">

                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10">
                          {flag ? (
                            <img
                              src={`https://flagcdn.com/w80/${flag}.png`}
                              alt={item.country}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl">
                              🌍
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {item.country}
                          </p>

                          <p className="text-sm text-white/40">
                            {item.count}{" "}
                            {item.count === 1
                              ? "answer"
                              : "answers"}
                          </p>
                        </div>

                      </div>

                      <div className="ml-4 text-right">
                        <p className="text-xl font-bold">
                          {item.count}
                        </p>
                      </div>

                    </div>
                  </ScrollReveal>
                );
              })}

            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="mt-20 border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-white/30">
            ONEQUESTION © 2026
          </p>
        </footer>

      </div>
    </main>
  );
}