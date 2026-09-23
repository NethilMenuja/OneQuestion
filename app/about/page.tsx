"use client";

import ScrollReveal from "../ScrollReveal";

export default function AboutPage() {
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

            <a
              href="/how-it-works"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
              How It Works
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
              About
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/50">
              One question. One answer. One world.
            </p>
          </section>
        </ScrollReveal>

        {/* INTRODUCTION */}
        <ScrollReveal delay={150}>
          <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <h2 className="text-2xl font-bold">
              What is ONEQUESTION?
            </h2>

            <p className="mt-4 leading-8 text-white/60">
              ONEQUESTION is a simple global question-and-answer community.
              Every day, people are given one question and invited to share
              their own perspective.
            </p>

            <p className="mt-4 leading-8 text-white/60">
              The idea is simple: one question can bring together many
              different people, places, experiences, and points of view.
            </p>
          </section>
        </ScrollReveal>

        {/* IDEA */}
        <ScrollReveal delay={200}>
          <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-sm font-medium text-white/40">
              THE IDEA
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Different people. One question.
            </h2>

            <p className="mt-4 leading-8 text-white/60">
              People around the world can experience the same question in
              completely different ways. ONEQUESTION gives those perspectives
              a place to exist together.
            </p>
          </section>
        </ScrollReveal>

        {/* COMMUNITY */}
        <ScrollReveal delay={250}>
          <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-sm font-medium text-white/40">
              COMMUNITY
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Built around people
            </h2>

            <p className="mt-4 leading-8 text-white/60">
              Every answer adds another perspective to the community.
              You can explore answers, discover different countries, see
              popular responses, and learn from how other people think.
            </p>
          </section>
        </ScrollReveal>

        {/* GLOBAL PERSPECTIVES */}
        <ScrollReveal delay={300}>
          <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-sm font-medium text-white/40">
              AROUND THE WORLD
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Many perspectives in one place
            </h2>

            <p className="mt-4 leading-8 text-white/60">
              ONEQUESTION connects answers from different countries and
              backgrounds, making it possible to see how one question can
              create many different answers.
            </p>
          </section>
        </ScrollReveal>

        {/* SIMPLE */}
        <ScrollReveal delay={350}>
          <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-sm font-medium text-white/40">
              SIMPLE BY DESIGN
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              One question at a time
            </h2>

            <p className="mt-4 leading-8 text-white/60">
              There are no complicated feeds or endless questions.
              ONEQUESTION keeps the experience focused on one shared
              question and the people answering it.
            </p>
          </section>
        </ScrollReveal>

        {/* EXPLORE */}
        <ScrollReveal delay={400}>
          <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold">
              Explore the answers
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-white/50">
              See what people around the world are saying and share your own
              perspective.
            </p>

            <a
              href="/"
              className="mt-6 inline-flex rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-white/80"
            >
              Go to ONEQUESTION
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