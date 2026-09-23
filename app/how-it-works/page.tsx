"use client";

import ScrollReveal from "../ScrollReveal";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-5 py-10">

        {/* TOP NAVIGATION */}
        <ScrollReveal>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
              ← Home
            </a>

            <a
              href="/explore"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
              Explore
            </a>

            <a
              href="/world"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
              World
            </a>

            <a
              href="/popular"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
              Popular
            </a>

            <a
              href="/archive"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
              Archive
            </a>

            <a
              href="/contributors"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
              Contributors
            </a>

            <a
              href="/profile"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
              Profile
            </a>
          </div>
        </ScrollReveal>

        {/* HEADER */}
        <ScrollReveal delay={100}>
          <section className="mt-14">
            <p className="text-sm uppercase tracking-[0.3em] text-white/40">
              ONEQUESTION
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              How It Works
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/50">
              One question. One answer. One world.
              See how ONEQUESTION brings people together through a simple
              daily question.
            </p>
          </section>
        </ScrollReveal>

        {/* STEP 1 */}
        <ScrollReveal delay={150}>
          <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-sm font-medium text-white/40">
              01
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              A new question
            </h2>

            <p className="mt-3 leading-7 text-white/60">
              Each day, ONEQUESTION presents one question for everyone.
              The question is shared across the community so people from
              different places can answer the same thing.
            </p>
          </section>
        </ScrollReveal>

        {/* STEP 2 */}
        <ScrollReveal delay={200}>
          <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-sm font-medium text-white/40">
              02
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Share your answer
            </h2>

            <p className="mt-3 leading-7 text-white/60">
              Enter your name, choose your country, and write your answer.
              Your response becomes part of the community&apos;s answers
              to that question.
            </p>
          </section>
        </ScrollReveal>

        {/* STEP 3 */}
        <ScrollReveal delay={250}>
          <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-sm font-medium text-white/40">
              03
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Discover other perspectives
            </h2>

            <p className="mt-3 leading-7 text-white/60">
              Read answers from people around the world and see how
              different people respond to the same question.
            </p>
          </section>
        </ScrollReveal>

        {/* STEP 4 */}
        <ScrollReveal delay={300}>
          <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-sm font-medium text-white/40">
              04
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Explore the world
            </h2>

            <p className="mt-3 leading-7 text-white/60">
              Explore answers by country, discover popular responses,
              browse previous questions, and see the people contributing
              to the ONEQUESTION community.
            </p>
          </section>
        </ScrollReveal>

        {/* STEP 5 */}
        <ScrollReveal delay={350}>
          <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-sm font-medium text-white/40">
              05
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              One question. Many voices.
            </h2>

            <p className="mt-3 leading-7 text-white/60">
              ONEQUESTION is built around a simple idea: one question can
              create many different perspectives.
            </p>
          </section>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal delay={400}>
          <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold">
              Ready to answer?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-white/50">
              Go back to today&apos;s question and share your perspective.
            </p>

            <a
              href="/"
              className="mt-6 inline-flex rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-white/80"
            >
              Answer Today&apos;s Question
            </a>
          </section>
        </ScrollReveal>

        {/* FOOTER */}
        <ScrollReveal delay={450}>
          <footer className="mt-16 border-t border-white/10 pt-6 text-center text-sm text-white/30">
            ONEQUESTION © 2026
          </footer>
        </ScrollReveal>

      </div>
    </main>
  );
}