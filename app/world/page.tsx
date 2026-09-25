"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import ScrollReveal from "../ScrollReveal";

type Answer = {
  id: number;
  country: string;
};

type Like = {
  answer_id: number;
};

type CountryStat = {
  country: string;
  count: number;
  percentage: number;
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

function AnimatedNumber({
  value,
  duration = 900,
}: {
  value: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const numberRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const element = numberRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDisplayValue(0);
          setIsVisible(true);
        } else {
          setIsVisible(false);
          setDisplayValue(0);
        }
      },
      {
        threshold: 0.45,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    if (value <= 0) {
      setDisplayValue(0);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(
        elapsed / duration,
        1
      );

      const easedProgress =
        1 - Math.pow(1 - progress, 3);

      const currentNumber = Math.floor(
        easedProgress * value
      );

      setDisplayValue(currentNumber);

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrame =
      requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isVisible, value, duration]);

  return (
    <span ref={numberRef}>
      {displayValue}
    </span>
  );
}

function AnimatedBar({
  percentage,
}: {
  percentage: number;
}) {
  const [width, setWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = barRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setWidth(0);
          setIsVisible(true);
        } else {
          setIsVisible(false);
          setWidth(0);
        }
      },
      {
        threshold: 0.45,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const timer = window.setTimeout(() => {
      setWidth(
        Math.max(
          percentage,
          percentage > 0 ? 3 : 0
        )
      );
    }, 80);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isVisible, percentage]);

  return (
    <div
      ref={barRef}
      className="h-full w-full"
    >
      <div
        className="h-full rounded-full bg-white/30 transition-all duration-1000 ease-out"
        style={{
          width: `${width}%`,
        }}
      />
    </div>
  );
}

export default function WorldPage() {
  const [countries, setCountries] = useState<
    CountryStat[]
  >([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorld();
  }, []);

  async function loadWorld() {
    setLoading(true);

    // Get all answers
    const {
      data: answersData,
      error: answersError,
    } = await supabase
      .from("answers")
      .select("id, country");

    if (answersError) {
      console.error(
        "World answers error:",
        answersError
      );
      setLoading(false);
      return;
    }

    // Get all likes
    const {
      data: likesData,
      error: likesError,
    } = await supabase
      .from("likes")
      .select("answer_id");

    if (likesError) {
      console.error(
        "World likes error:",
        likesError
      );
      setLoading(false);
      return;
    }

    setTotalLikes(
      (likesData as Like[] | null)?.length ?? 0
    );

    const counts: Record<string, number> = {};

    (answersData as Answer[] | null)?.forEach(
      (answer) => {
        if (!answer.country) return;

        counts[answer.country] =
          (counts[answer.country] || 0) + 1;
      }
    );

    const totalAnswerCount = Object.values(
      counts
    ).reduce(
      (total, count) => total + count,
      0
    );

    const result = Object.entries(counts)
      .map(([country, count]) => ({
        country,
        count,
        percentage:
          totalAnswerCount > 0
            ? Math.round(
                (count / totalAnswerCount) * 100
              )
            : 0,
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

  const worldCoverage = Math.round(
    (countryCount / 195) * 100
  );

  const mostActiveCountry =
    countries.length > 0
      ? countries[0]
      : null;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-5 py-10">

        {/* HEADER */}
        <ScrollReveal>
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
              See where the ONEQUESTION community is
              answering from.
            </p>
          </div>
        </ScrollReveal>

        {/* MAIN STATS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Answers */}
          <ScrollReveal>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
              <p className="text-3xl font-bold">
                <AnimatedNumber
                  value={totalAnswers}
                />
              </p>

              <p className="mt-2 text-sm text-white/40">
                Answers
              </p>
            </div>
          </ScrollReveal>

          {/* Countries */}
          <ScrollReveal delay={100}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
              <p className="text-3xl font-bold">
                <AnimatedNumber
                  value={countryCount}
                />
              </p>

              <p className="mt-2 text-sm text-white/40">
                Countries
              </p>
            </div>
          </ScrollReveal>

          {/* World Coverage */}
          <ScrollReveal delay={200}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
              <p className="text-3xl font-bold">
                <AnimatedNumber
                  value={worldCoverage}
                />
                %
              </p>

              <p className="mt-2 text-sm text-white/40">
                World Coverage
              </p>
            </div>
          </ScrollReveal>

          {/* Total Likes */}
          <ScrollReveal delay={300}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
              <p className="text-3xl font-bold">
                <AnimatedNumber
                  value={totalLikes}
                />
              </p>

              <p className="mt-2 text-sm text-white/40">
                Total Likes
              </p>
            </div>
          </ScrollReveal>

        </div>

        {/* MOST ACTIVE COUNTRY */}
        <ScrollReveal delay={350}>
          <div className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-7">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/30">
                  Most Active Country
                </p>

                {mostActiveCountry ? (
                  <div className="mt-3 flex items-center gap-4">

                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/10">
                      {countryFlags[
                        mostActiveCountry.country
                      ] ? (
                        <img
                          src={`https://flagcdn.com/w80/${
                            countryFlags[
                              mostActiveCountry.country
                            ]
                          }.png`}
                          alt={
                            mostActiveCountry.country
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">
                          🌍
                        </div>
                      )}
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold">
                        {mostActiveCountry.country}
                      </h2>

                      <p className="mt-1 text-sm text-white/40">
                        <AnimatedNumber
                          value={
                            mostActiveCountry.count
                          }
                        />{" "}
                        {mostActiveCountry.count === 1
                          ? "answer"
                          : "answers"}{" "}
                        from this country
                      </p>
                    </div>

                  </div>
                ) : (
                  <p className="mt-3 text-white/40">
                    No country data yet.
                  </p>
                )}
              </div>

              {mostActiveCountry && (
                <div className="text-left sm:text-right">
                  <p className="text-3xl font-bold">
                    <AnimatedNumber
                      value={
                        mostActiveCountry.percentage
                      }
                    />
                    %
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    of all answers
                  </p>
                </div>
              )}

            </div>

          </div>
        </ScrollReveal>

        {/* COUNTRY SECTION */}
        <section>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Community Around the World
              </h2>

              <p className="mt-1 text-sm text-white/30">
                See how answers are distributed across
                countries.
              </p>
            </div>

            <span className="text-sm text-white/30">
              <AnimatedNumber
                value={countryCount}
              />{" "}
              countries
            </span>
          </div>

          {loading ? (
            <ScrollReveal>
              <div className="py-20 text-center text-white/50">
                Loading world data...
              </div>
            </ScrollReveal>
          ) : countries.length === 0 ? (
            <ScrollReveal>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <p className="text-white/50">
                  No answers yet.
                </p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {countries.map((item, index) => {
                const flag =
                  countryFlags[item.country];

                const isTopThree = index < 3;

                return (
                  <ScrollReveal
                    key={item.country}
                    delay={index * 80}
                  >
                    <div
                      className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/10 ${
                        index === 0
                          ? "border-yellow-300/25 bg-yellow-300/5"
                          : index === 1
                            ? "border-white/20 bg-white/5"
                            : index === 2
                              ? "border-orange-400/20 bg-orange-400/5"
                              : "border-white/10 bg-white/5"
                      }`}
                    >

                      {/* TOP 3 GLOW */}
                      {isTopThree && (
                        <div
                          className={`pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full blur-3xl ${
                            index === 0
                              ? "bg-yellow-300/15"
                              : index === 1
                                ? "bg-white/10"
                                : "bg-orange-400/15"
                          }`}
                        />
                      )}

                      <div className="relative">

                        {/* COUNTRY INFO */}
                        <div className="flex items-center justify-between gap-4">

                          <div className="flex min-w-0 items-center gap-4">

                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
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

                              <div className="flex items-center gap-2">
                                <p className="truncate font-medium">
                                  {item.country}
                                </p>

                                {index === 0 && (
                                  <span className="text-sm">
                                    🥇
                                  </span>
                                )}

                                {index === 1 && (
                                  <span className="text-sm">
                                    🥈
                                  </span>
                                )}

                                {index === 2 && (
                                  <span className="text-sm">
                                    🥉
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-sm text-white/40">
                                <AnimatedNumber
                                  value={item.count}
                                />{" "}
                                {item.count === 1
                                  ? "answer"
                                  : "answers"}
                              </p>

                            </div>

                          </div>

                          {/* COUNT */}
                          <div className="ml-4 shrink-0 text-right">
                            <p className="text-xl font-bold">
                              <AnimatedNumber
                                value={item.count}
                              />
                            </p>

                            <p className="mt-1 text-xs text-white/30">
                              <AnimatedNumber
                                value={
                                  item.percentage
                                }
                              />
                              %
                            </p>
                          </div>

                        </div>

                        {/* PROGRESS BAR */}
                        <div className="mt-5">
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                            <AnimatedCountryBar
                              percentage={
                                item.percentage
                              }
                              index={index}
                            />
                          </div>
                        </div>

                      </div>

                    </div>
                  </ScrollReveal>
                );
              })}

            </div>
          )}
        </section>

        {/* WORLD COVERAGE FOOTER CARD */}
        {!loading && countries.length > 0 && (
          <ScrollReveal delay={200}>
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm sm:p-8">

              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/30">
                ONEQUESTION World
              </p>

              <p className="mt-3 text-3xl font-bold">
                <AnimatedNumber
                  value={countryCount}
                />{" "}
                / 195
              </p>

              <p className="mt-2 text-sm text-white/40">
                countries represented by the community
              </p>

              <div className="mx-auto mt-6 h-2 max-w-md overflow-hidden rounded-full bg-white/5">
                <AnimatedCoverageBar
                  percentage={worldCoverage}
                />
              </div>

            </div>
          </ScrollReveal>
        )}

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

function AnimatedCountryBar({
  percentage,
  index,
}: {
  percentage: number;
  index: number;
}) {
  const [width, setWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(
    null
  );

  useEffect(() => {
    const element = barRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setWidth(0);
          setIsVisible(true);
        } else {
          setIsVisible(false);
          setWidth(0);
        }
      },
      {
        threshold: 0.45,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const timer = window.setTimeout(() => {
      setWidth(
        Math.max(
          percentage,
          percentage > 0 ? 3 : 0
        )
      );
    }, 80);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isVisible, percentage]);

  return (
    <div
      ref={barRef}
      className="h-full w-full"
    >
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${
          index === 0
            ? "bg-yellow-200/70"
            : index === 1
              ? "bg-white/50"
              : index === 2
                ? "bg-orange-300/60"
                : "bg-white/30"
        }`}
        style={{
          width: `${width}%`,
        }}
      />
    </div>
  );
}

function AnimatedCoverageBar({
  percentage,
}: {
  percentage: number;
}) {
  const [width, setWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(
    null
  );

  useEffect(() => {
    const element = barRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setWidth(0);
          setIsVisible(true);
        } else {
          setIsVisible(false);
          setWidth(0);
        }
      },
      {
        threshold: 0.45,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const timer = window.setTimeout(() => {
      setWidth(
        Math.min(percentage, 100)
      );
    }, 80);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isVisible, percentage]);

  return (
    <div
      ref={barRef}
      className="h-full w-full"
    >
      <div
        className="h-full rounded-full bg-white/40 transition-all duration-1000 ease-out"
        style={{
          width: `${width}%`,
        }}
      />
    </div>
  );
}