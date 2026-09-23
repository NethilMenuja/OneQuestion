"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ScrollReveal from "../ScrollReveal";

type Question = {
  id: number;
  question: string;
  question_date: string;
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

export default function ExplorePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExplore();
  }, []);

  async function loadExplore() {
    setLoading(true);

    // Get today's date from the user's device
    const today = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    // Only show today's questions and older questions.
    // Future questions (including 2027) will NOT be shown.
    const { data: questionData, error: questionError } = await supabase
      .from("questions")
      .select("id, question, question_date")
      .lte("question_date", today)
      .order("question_date", { ascending: false });

    if (questionError) {
      console.error("Questions error:", questionError);
      setLoading(false);
      return;
    }

    const { data: answerData, error: answerError } = await supabase
      .from("answers")
      .select("id, question_id, answer, name, country, created_at")
      .order("created_at", { ascending: false });

    if (answerError) {
      console.error("Answers error:", answerError);
      setLoading(false);
      return;
    }

    const answerIds = (answerData || []).map((item) => item.id);

    let likeCounts: Record<number, number> = {};

    if (answerIds.length > 0) {
      const { data: likesData, error: likesError } = await supabase
        .from("likes")
        .select("answer_id")
        .in("answer_id", answerIds);

      if (likesError) {
        console.error("Likes error:", likesError);
      } else {
        (likesData || []).forEach((like) => {
          likeCounts[like.answer_id] =
            (likeCounts[like.answer_id] || 0) + 1;
        });
      }
    }

    const answersWithLikes = (answerData || []).map((item) => ({
      ...item,
      likes: likeCounts[item.id] || 0,
    }));

    setQuestions(questionData || []);
    setAnswers(answersWithLikes);
    setLoading(false);
  }

  function getAnswers(questionId: number) {
    return answers.filter(
      (answer) => answer.question_id === questionId
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-10">
<a
  href="/"
  className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
>
  ← Back to ONEQUESTION
</a>

          <h1 className="mt-6 text-4xl font-bold">
            Explore
          </h1>

          <p className="mt-2 text-white/60">
            Discover questions and answers from around the world.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-white/60">
            Loading questions...
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            No questions found.
          </div>
        ) : (
          <div className="space-y-8">
            {questions.map((question, index) => {
              const questionAnswers = getAnswers(question.id);

return (
  <ScrollReveal
    key={question.id}
    delay={index * 100}
  >
    <section
      className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
    >
                  <div className="mb-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                      {question.question_date}
                    </p>

                    <h2 className="mt-3 text-2xl font-semibold leading-tight">
                      {question.question}
                    </h2>
                  </div>

                  {questionAnswers.length === 0 ? (
                    <p className="text-white/40">
                      No answers yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {questionAnswers.map((answer) => (
                        <div
                          key={answer.id}
                          className="rounded-2xl border border-white/10 bg-black/20 p-5"
                        >
                          <p className="text-base leading-7 text-white/90">
                            {answer.answer}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/50">
                            <span>{answer.name}</span>

                            <span>•</span>

                            <span>{answer.country}</span>

                            <span>•</span>

                            <span>
                              ❤️ {answer.likes || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}