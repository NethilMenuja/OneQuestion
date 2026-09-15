"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SkyBackground from "./SkyBackground";

type User = {
  id: string;
  email?: string;
};

type Answer = {
  id: number;
  question_id: number;
  answer: string;
  name: string;
  country: string;
  created_at: string;
  likes?: number;
};

type Question = {
  id: number;
  question: string;
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

export default function Home() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [answerText, setAnswerText] = useState("");
  const [userName, setUserName] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [likingId, setLikingId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
  };

  getUser();

  const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null);
});

return () => {
  subscription.unsubscribe();
};
}, []);

const handleLogout = async () => {
  await supabase.auth.signOut();
  window.location.href = "/login";
};
const loadData = async () => {
  setLoading(true);
  setMessage("");

  // Get today's date based on the user's device timezone
const today = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

  // Load today's question
  const {
    data: questionData,
    error: questionError,
  } = await supabase
    .from("questions")
    .select("id, question")
    .eq("question_date", today)
    .maybeSingle();

  if (questionError) {
    console.error("Question error:", questionError);
    setMessage("Could not load today's question.");
    setLoading(false);
    return;
  }

  if (!questionData) {
    setQuestion(null);
    setAnswers([]);
    setMessage("No question available for today.");
    setLoading(false);
    return;
  }

  setQuestion(questionData);

  // Load answers for today's question
  const {
    data: answersData,
    error: answersError,
  } = await supabase
    .from("answers")
    .select("id, question_id, answer, name, country, created_at")
    .eq("question_id", questionData.id)
    .order("created_at", { ascending: false });

  if (answersError) {
    console.error("Answers error:", answersError);
    setAnswers([]);
    setMessage("Could not load the answers.");
    setLoading(false);
    return;
  }

  const answerIds = (answersData ?? []).map((answer) => answer.id);

let likeCounts: Record<number, number> = {};

if (answerIds.length > 0) {
  const { data: likesData, error: likesError } = await supabase
  .from("likes")
  .select("answer_id")
  .in("answer_id", answerIds)
  .not("user_id", "is", null);

  if (likesError) {
    console.error("Likes error:", likesError);
  } else {
    likeCounts = (likesData ?? []).reduce(
      (counts, like) => {
        counts[like.answer_id] = (counts[like.answer_id] ?? 0) + 1;
        return counts;
      },
      {} as Record<number, number>
    );
  }
}

setAnswers(
  (answersData ?? []).map((answer) => ({
    ...answer,
    likes: likeCounts[answer.id] ?? 0,
  }))
);

  setLoading(false);
};

  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
  let lastDate = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const checkDate = window.setInterval(() => {
    const today = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    if (today !== lastDate) {
      lastDate = today;
      loadData();
    }
  }, 30000);

  return () => window.clearInterval(checkDate);
}, []);

const handleLike = async (answerId: number) => {
  if (!user) {
    setMessage("Please sign in to like an answer.");
    return;
  }

  if (likingId !== null) {
    return;
  }

  setLikingId(answerId);

  try {
    const { data: existingLike, error: checkError } = await supabase
      .from("likes")
      .select("id")
      .eq("answer_id", answerId)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error("Check like error:", checkError);
      return;
    }

    // UNLIKE
    if (existingLike) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id);

      if (error) {
        console.error("Unlike error:", error);
        return;
      }

      // Only update this answer — DON'T reload the whole page
      setAnswers((currentAnswers) =>
        currentAnswers.map((item) =>
          item.id === answerId
            ? {
                ...item,
                likes: Math.max((item.likes ?? 0) - 1, 0),
              }
            : item
        )
      );

      return;
    }

    // LIKE
    const { error } = await supabase.from("likes").insert({
      answer_id: answerId,
      user_id: user.id,
    });

    if (error) {
      console.error("Like error:", error);
      return;
    }

    // Only update this answer — DON'T reload the whole page
    setAnswers((currentAnswers) =>
      currentAnswers.map((item) =>
        item.id === answerId
          ? {
              ...item,
              likes: (item.likes ?? 0) + 1,
            }
          : item
      )
    );
  } finally {
    setLikingId(null);
  }
};
const handleSubmit = async (): Promise<void> => {
  if (!question) {
    return;
  }

  const cleanAnswer = answerText.trim();

  if (!userName.trim()) {
    setMessage("Please enter your name.");
    return;
  }

  if (!country) {
    setMessage("Please select your country.");
    return;
  }

  if (!cleanAnswer) {
    setMessage("Please write an answer first.");
    return;
  }

  // If user is not signed in, save the answer and go to login
  if (!user) {
    localStorage.setItem(
      "pendingAnswer",
      JSON.stringify({
        questionId: question.id,
        answer: cleanAnswer,
        name: userName.trim(),
        country: country,
      })
    );

    window.location.href = "/signup";
    return;
  }

  setPosting(true);
  setMessage("");

  const { error } = await supabase.from("answers").insert({
    question_id: question.id,
    answer: cleanAnswer,
    name: userName.trim(),
    country: country,
    user_id: user.id,
  });

  if (error) {
    console.error("Post answer error:", error);
    setMessage("Could not post your answer.");
    setPosting(false);
    return;
  }

  setAnswerText("");
  setUserName("");
  setCountry("");
  setMessage("Your answer was posted! ❤️");

  await loadData();

  setPosting(false);
};

  const countries = new Set(
  answers
    .map((item) => item.country)
    .filter((country) => country && country !== "Other")
).size;

const worldwide = Math.round((countries / 195) * 100);

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-transparent text-white">
      <SkyBackground />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-10">
        {/* HEADER */}
        <header className="mb-16">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        ONEQUESTION
      </h1>

      <p className="mt-2 text-sm text-white/50">
        One question. One answer. One world.
      </p>
    </div>

    <div className="flex items-center gap-2">
      {!user ? (
        <>
          <a
            href="/login"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Sign In
          </a>

          <a
            href="/signup"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/80"
          >
            Sign Up
          </a>
        </>
      ) : (
        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:gap-3">
  <span className="max-w-[180px] truncate text-xs text-white/60 sm:max-w-none sm:text-sm">
    {user.email}
  </span>

  <button
    type="button"
    onClick={handleLogout}
    className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/80"
  >
    Logout
  </button>
</div>
      )}
    </div>
  </div>
</header>

        {/* QUESTION */}
        <section className="mb-12 text-center">
          {loading ? (
            <p className="text-white/50">
              Loading question...
            </p>
          ) : question ? (
            <>
              <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">
                Today&apos;s Question
              </p>

              <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold leading-tight break-words">
  {question.question}
</h2>
            </>
          ) : (
            <p className="text-white/50">
              No active question found.
            </p>
          )}
        </section>

        {/* ANSWER BOX */}
        {question && (
          <section className="mx-auto mb-16 max-w-2xl">
            <input
               type="text"
               value={userName}
               onChange={(e) => setUserName(e.target.value)}
               placeholder="Your name..."
              className="w-full mb-3 rounded-2xl border border-white/20 bg-black/20 p-4 text-lg text-white outline-none backdrop-blur-md transition focus:border-white/40 focus:bg-black/25 placeholder:text-white/50"
            />

            <select
  value={country}
  onChange={(e) => setCountry(e.target.value)}
  className="w-full mb-3 rounded-2xl border border-white/20 bg-black/20 p-4 text-lg text-white outline-none backdrop-blur-md transition focus:border-white/40 focus:bg-black/25"
>
  <option value="" className="bg-black">
    Select your country...
  </option>
  <option value="Sri Lanka" className="bg-black">🇱🇰 Sri Lanka</option>
  <option value="India" className="bg-black">🇮🇳 India</option>
  <option value="United States" className="bg-black">🇺🇸 United States</option>
  <option value="United Kingdom" className="bg-black">🇬🇧 United Kingdom</option>
  <option value="Australia" className="bg-black">🇦🇺 Australia</option>
  <option value="Canada" className="bg-black">🇨🇦 Canada</option>
  <option value="Japan" className="bg-black">🇯🇵 Japan</option>
  <option value="Germany" className="bg-black">🇩🇪 Germany</option>
  <option value="France" className="bg-black">🇫🇷 France</option>
  <option value="Other" className="bg-black">🌍 Other</option>
</select>

             <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Write your answer..."
              rows={6}
              className="w-full resize-none rounded-2xl border border-white/20 bg-black/20 p-5 text-lg text-white outline-none backdrop-blur-md transition focus:border-white/40 focus:bg-black/25 placeholder:text-white/50"
            />

            <div className="mt-4 flex flex-col items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={posting}
                className="rounded-full bg-white px-8 py-3 font-semibold text-black transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {posting ? "Posting..." : "Post Answer"}
              </button>

              {message && (
                <p className="text-sm text-white/60">
                  {message}
                </p>
              )}
            </div>
          </section>
        )}

        {/* STATS */}
        <section className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-3xl font-bold">
              {answers.length}
            </p>

            <p className="mt-2 text-sm text-white/40">
              Answers
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-3xl font-bold">
              {countries}
            </p>

            <p className="mt-2 text-sm text-white/40">
              Countries
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-3xl font-bold">{worldwide}%</p>

            <p className="mt-2 text-sm text-white/40">
              World Coverage
            </p>
          </div>
        </section>

        {/* ANSWERS */}
        <section className="[overflow-anchor:none]">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              Community Answers
            </h3>

            <span className="text-sm text-white/30">
              {answers.length} responses
            </span>
          </div>

          {loading ? (
            <p className="text-white/40">
              Loading answers...
            </p>
          ) : answers.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-white/50">
                No answers yet.
              </p>

              <p className="mt-2 text-sm text-white/30">
                Be the first person to answer.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {answers.map((item) => (
                <article
  key={item.id}
  className="min-w-0 transform-gpu rounded-2xl border border-white/15 bg-black/30 p-4 sm:p-6 backdrop-blur-sm"
>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10">
  {countryFlags[item.country] ? (
    <img
      src={`https://flagcdn.com/w80/${countryFlags[item.country]}.png`}
      alt={item.country}
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-xl">
      🌍
    </div>
  )}
</div>

                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {item.name}
                        </p>

                        <p className="text-xs text-white/30">
                          Community member
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 break-words whitespace-pre-wrap leading-7 text-white/80">
  {item.answer}
</p>

                  <div className="mt-4 flex justify-end">
                         <button
  type="button"
  onClick={() => handleLike(item.id)}
  disabled={likingId === item.id}
  className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
>
  {likingId === item.id ? "❤️ ..." : `❤️ ${item.likes ?? 0}`}
</button>
                  </div>
                </article>
              ))}
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