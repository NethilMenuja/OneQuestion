"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Contributor = {
  name: string;
  country: string;
  answers: number;
  likes: number;
};

type Answer = {
  id: number;
  answer: string;
  created_at: string;
  likes: number;
};

export default function ContributorsPage() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [openContributor, setOpenContributor] = useState<string | null>(null);
  const [contributorAnswers, setContributorAnswers] = useState<
    Record<string, Answer[]>
  >({});
  const [loadingAnswers, setLoadingAnswers] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContributors();
  }, []);

  async function loadContributors() {
    setLoading(true);

    const { data: answerData, error: answerError } = await supabase
      .from("answers")
      .select("id, name, country");

    if (answerError) {
      console.error("Contributors error:", answerError);
      setLoading(false);
      return;
    }

    if (!answerData || answerData.length === 0) {
      setContributors([]);
      setLoading(false);
      return;
    }

    const answerIds = answerData.map((item) => item.id);

    const { data: likesData, error: likesError } = await supabase
      .from("likes")
      .select("answer_id")
      .in("answer_id", answerIds);

    if (likesError) {
      console.error("Likes error:", likesError);
    }

    const likeCounts: Record<number, number> = {};

    (likesData || []).forEach((like) => {
      likeCounts[like.answer_id] =
        (likeCounts[like.answer_id] || 0) + 1;
    });

    const contributorMap: Record<
      string,
      {
        name: string;
        country: string;
        answers: number;
        likes: number;
      }
    > = {};

    answerData.forEach((item) => {
      const key = `${item.name}__${item.country}`;

      if (!contributorMap[key]) {
        contributorMap[key] = {
          name: item.name,
          country: item.country,
          answers: 0,
          likes: 0,
        };
      }

      contributorMap[key].answers += 1;
      contributorMap[key].likes += likeCounts[item.id] || 0;
    });

    const result = Object.values(contributorMap).sort(
      (a, b) => b.answers - a.answers
    );

    setContributors(result);
    setLoading(false);
  }

  async function toggleAnswers(person: Contributor) {
    const key = `${person.name}__${person.country}`;

    // Close
    if (openContributor === key) {
      setOpenContributor(null);
      return;
    }

    // Open
    setOpenContributor(key);

    // Already loaded
    if (contributorAnswers[key]) {
      return;
    }

    setLoadingAnswers(key);

    const { data: answerData, error: answerError } = await supabase
      .from("answers")
      .select("id, answer, created_at")
      .eq("name", person.name)
      .eq("country", person.country)
      .order("created_at", { ascending: false });

    if (answerError) {
      console.error("Contributor answers error:", answerError);
      setLoadingAnswers(null);
      return;
    }

    if (!answerData || answerData.length === 0) {
      setContributorAnswers((prev) => ({
        ...prev,
        [key]: [],
      }));

      setLoadingAnswers(null);
      return;
    }

    const answerIds = answerData.map((item) => item.id);

    const { data: likesData, error: likesError } = await supabase
      .from("likes")
      .select("answer_id")
      .in("answer_id", answerIds);

    if (likesError) {
      console.error("Likes error:", likesError);
    }

    const likeCounts: Record<number, number> = {};

    (likesData || []).forEach((like) => {
      likeCounts[like.answer_id] =
        (likeCounts[like.answer_id] || 0) + 1;
    });

    const finalAnswers: Answer[] = answerData.map((item) => ({
      ...item,
      likes: likeCounts[item.id] || 0,
    }));

    setContributorAnswers((prev) => ({
      ...prev,
      [key]: finalAnswers,
    }));

    setLoadingAnswers(null);
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-5 py-10">

        {/* TOP NAVIGATION */}
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

          <a
            href="/profile"
            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            Profile
          </a>
        </div>

        {/* HEADER */}
        <div className="mt-10">
          <h1 className="text-4xl font-bold">
            Contributors
          </h1>

          <p className="mt-2 text-white/60">
            The people making ONEQUESTION a world of answers.
          </p>
        </div>

        {/* CONTRIBUTORS */}
        <section className="mt-8">
          {loading && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
              Loading contributors...
            </div>
          )}

          {!loading && contributors.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
              No contributors yet.
            </div>
          )}

          {!loading && contributors.length > 0 && (
            <div className="space-y-4">
              {contributors.map((person, index) => {
                const key = `${person.name}__${person.country}`;

                const isOpen = openContributor === key;
                const answers = contributorAnswers[key] || [];

return (
  <AnimatedContributorCard
    key={`${person.name}-${person.country}-${index}`}
    index={index}
  >
    <ContributorCard
      person={person}
      index={index}
      isOpen={isOpen}
      answers={answers}
      loading={loadingAnswers === key}
      onToggle={() => toggleAnswers(person)}
      formatDate={formatDate}
    />
  </AnimatedContributorCard>
);
              })}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="mt-16 border-t border-white/10 pt-6 text-center text-sm text-white/30">
          ONEQUESTION © 2026
        </footer>
      </div>
    </main>
  );
}

/* ========================================================= */
/* CONTRIBUTOR CARD */
/* ========================================================= */

function AnimatedContributorCard({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
          } else {
            setVisible(false);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${index * 80}ms`,
      }}
      className={`
        transition-all
        duration-700
        ease-out
        ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-10 scale-[0.97] opacity-0"
        }
      `}
    >
      {children}
    </div>
  );
}
function ContributorCard({
  person,
  index,
  isOpen,
  answers,
  loading,
  onToggle,
  formatDate,
}: {
  person: Contributor;
  index: number;
  isOpen: boolean;
  answers: Answer[];
  loading: boolean;
  onToggle: () => void;
  formatDate: (date: string) => string;
}) {
  const answersRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`
        overflow-hidden
        rounded-2xl
        border
        border-white/10
        bg-white/5
        transition-all
        duration-500
        hover:border-white/20
        ${isOpen ? "shadow-2xl shadow-black/30" : ""}
      `}
    >
      {/* MAIN CONTRIBUTOR */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white/40">
                #{index + 1}
              </span>

              <h2 className="text-xl font-semibold">
                {person.name}
              </h2>
            </div>

            <p className="mt-2 text-sm text-white/50">
              {person.country}
            </p>
          </div>
        </div>

        {/* STATS */}
        <div className="mt-5 flex flex-wrap gap-3">

          {/* ANSWERS */}
          <button
            type="button"
            onClick={onToggle}
            className={`
              group
              rounded-full
              border
              px-4
              py-2
              text-sm
              transition-all
              duration-300
              ${
                isOpen
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-black/20 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white"
              }
            `}
          >
            {person.answers}{" "}
            {person.answers === 1 ? "answer" : "answers"}

            <span
              className={`
                ml-2
                inline-block
                transition-transform
                duration-500
                ${
                  isOpen
                    ? "rotate-180"
                    : "group-hover:translate-y-0.5"
                }
              `}
            >
              ↓
            </span>
          </button>

          {/* LIKES */}
          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/60">
            ❤️ {person.likes} likes
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* EXPANDING ANSWERS AREA */}
      {/* ===================================================== */}

      <div
        className={`
          grid
          transition-[grid-template-rows]
          duration-700
          ease-[cubic-bezier(0.22,1,0.36,1)]
          ${
            isOpen
              ? "grid-rows-[1fr]"
              : "grid-rows-[0fr]"
          }
        `}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            ref={answersRef}
            className={`
              border-t
              border-white/10
              px-6
              pb-6
              pt-5
              transition-all
              duration-700
              ${
                isOpen
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-5 opacity-0"
              }
            `}
          >
            {/* LOADING */}
            {loading && (
              <div className="space-y-3">
                <div className="animate-pulse rounded-xl border border-white/10 bg-black/20 p-5">
                  <div className="h-4 w-3/4 rounded bg-white/10" />
                  <div className="mt-3 h-4 w-1/2 rounded bg-white/10" />
                </div>

                <div className="animate-pulse rounded-xl border border-white/10 bg-black/20 p-5">
                  <div className="h-4 w-2/3 rounded bg-white/10" />
                  <div className="mt-3 h-4 w-1/3 rounded bg-white/10" />
                </div>
              </div>
            )}

            {/* NO ANSWERS */}
            {!loading && answers.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-white/50">
                No answers found.
              </div>
            )}

            {/* ANSWERS */}
            {!loading && answers.length > 0 && (
              <div className="space-y-3">
                {answers.map((item, answerIndex) => (
                  <AnswerItem
                    key={item.id}
                    answer={item}
                    index={answerIndex}
                    isOpen={isOpen}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================= */
/* ANSWER ITEM */
/* ========================================================= */

function AnswerItem({
  answer,
  index,
  isOpen,
  formatDate,
}: {
  answer: Answer;
  index: number;
  isOpen: boolean;
  formatDate: (date: string) => string;
}) {
  const [visible, setVisible] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      return;
    }

    const element = itemRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [isOpen]);

  return (
    <div
      ref={itemRef}
      style={{
        transitionDelay: `${index * 100}ms`,
      }}
      className={`
        rounded-xl
        border
        border-white/10
        bg-black/20
        p-5
        transition-all
        duration-700
        ease-out
        ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-[0.98] opacity-0"
        }
      `}
    >
      {/* ANSWER */}
      <p className="leading-7 text-white/90">
        {answer.answer}
      </p>

      {/* DATE + LIKES */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/40">
        <span>
          {formatDate(answer.created_at)}
        </span>

        <span>•</span>

        <span className="text-white/60">
          ❤️ {answer.likes}
        </span>
      </div>
    </div>
  );
}