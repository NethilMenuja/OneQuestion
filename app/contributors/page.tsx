"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import ScrollReveal from "../ScrollReveal";
import SkyBackground from "../SkyBackground";

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

/* =========================================================
   COUNTRY FLAGS
   Real flag images — NO EMOJIS
========================================================= */

const countryCodes: Record<string, string> = {
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

/* =========================================================
   FLAG IMAGE
========================================================= */

function CountryFlag({
  country,
  size = 48,
}: {
  country: string;
  size?: number;
}) {
  const code = countryCodes[country];

  if (!code) {
    return (
      <div
        className="
          flex
          shrink-0
          items-center
          justify-center
          rounded-full
          border border-white/10
          bg-white/[0.07]
          text-sm
          text-white/50
        "
        style={{
          width: size,
          height: size,
        }}
      >
        🌍
      </div>
    );
  }

  return (
    <div
      className="
        shrink-0
        overflow-hidden
        rounded-full
        border
        border-white/10
        bg-black/20
      "
      style={{
        width: size,
        height: size,
      }}
    >
      <img
        src={`https://flagcdn.com/w160/${code}.png`}
        alt={`${country} flag`}
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}

/* =========================================================
   COUNT UP NUMBER
   Restarts from 0 every time it enters viewport
========================================================= */

function CountUp({
  value,
  duration = 1200,
}: {
  value: number;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);

  /* -------------------------------------------------------
     Detect viewport visibility
  ------------------------------------------------------- */

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);

        if (!entry.isIntersecting) {
          setCount(0);
        }
      },
      {
        threshold: 0.35,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  /* -------------------------------------------------------
     Animate whenever it becomes visible
  ------------------------------------------------------- */

  useEffect(() => {
    if (!visible) return;

    let startTime: number | null = null;
    let animationFrame = 0;

    setCount(0);

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const progress = Math.min(
        (timestamp - startTime) / duration,
        1,
      );

      const easedProgress =
        1 - Math.pow(1 - progress, 3);

      const currentValue = Math.round(
        value * easedProgress,
      );

      setCount(currentValue);

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame =
      requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [visible, value, duration]);

  return (
    <div ref={ref}>
      {count}
    </div>
  );
}

/* =========================================================
   ANIMATED SECTION
========================================================= */

function AnimatedSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <ScrollReveal
      delay={delay}
      duration={800}
      direction="up"
    >
      {children}
    </ScrollReveal>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  value,
  label,
  delay,
}: {
  value: number;
  label: string;
  delay: number;
}) {
  return (
    <AnimatedSection delay={delay}>
      <div
        className="
          group
          rounded-2xl
          border
          border-white/10
          bg-white/[0.055]
          px-5
          py-6
          text-center
          backdrop-blur-md
          transition-all
          duration-300
          hover:-translate-y-1
          hover:border-white/20
          hover:bg-white/[0.08]
        "
      >
        <div
          className="
            text-3xl
            font-bold
            tracking-tight
            text-white
            sm:text-4xl
          "
        >
          <CountUp value={value} />
        </div>

        <div
          className="
            mt-2
            text-sm
            font-medium
            text-white/55
          "
        >
          {label}
        </div>
      </div>
    </AnimatedSection>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function ContributorsPage() {
  const [contributors, setContributors] =
    useState<Contributor[]>([]);

  const [profileContributor, setProfileContributor] =
    useState<Contributor | null>(null);

  const [profileAnswers, setProfileAnswers] =
    useState<Answer[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [profileLoading, setProfileLoading] =
    useState(false);

  /* =======================================================
     LOAD CONTRIBUTORS
  ======================================================= */

  useEffect(() => {
    const loadContributors = async () => {
      setLoading(true);

      const { data: answersData, error } =
        await supabase
          .from("answers")
          .select(
            "id, name, country, answer, created_at",
          )
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(
          "Contributor loading error:",
          error,
        );

        setLoading(false);
        return;
      }

      const answers = answersData ?? [];

      const answerIds = answers
        .map((item) => item.id)
        .filter(Boolean);

      let likesData: {
        answer_id: number;
      }[] = [];

      if (answerIds.length > 0) {
        const { data } = await supabase
          .from("likes")
          .select("answer_id")
          .in("answer_id", answerIds);

        likesData = data ?? [];
      }

      const likesMap: Record<number, number> = {};

      likesData.forEach((like) => {
        likesMap[like.answer_id] =
          (likesMap[like.answer_id] || 0) + 1;
      });

      const contributorMap = new Map<
        string,
        Contributor
      >();

      answers.forEach((item) => {
        const name = item.name || "Anonymous";
        const country = item.country || "Other";

        const key = `${name}|||${country}`;

        if (!contributorMap.has(key)) {
          contributorMap.set(key, {
            name,
            country,
            answers: 0,
            likes: 0,
          });
        }

        const contributor =
          contributorMap.get(key)!;

        contributor.answers += 1;

        contributor.likes +=
          likesMap[item.id] || 0;
      });

      const result = Array.from(
        contributorMap.values(),
      ).sort((a, b) => {
        if (b.likes !== a.likes) {
          return b.likes - a.likes;
        }

        return b.answers - a.answers;
      });

      setContributors(result);
      setLoading(false);
    };

    loadContributors();
  }, []);

  /* =======================================================
     LOAD PROFILE ANSWERS
  ======================================================= */

  const loadProfileAnswers = async (
    contributor: Contributor,
  ) => {
    setProfileLoading(true);

    const { data: answersData, error } =
      await supabase
        .from("answers")
        .select(
          "id, answer, created_at",
        )
        .eq("name", contributor.name)
        .eq("country", contributor.country)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "Profile answer loading error:",
        error,
      );

      setProfileAnswers([]);
      setProfileLoading(false);
      return;
    }

    const answers = answersData ?? [];

    const answerIds = answers.map(
      (item) => item.id,
    );

    let likesData: {
      answer_id: number;
    }[] = [];

    if (answerIds.length > 0) {
      const { data } = await supabase
        .from("likes")
        .select("answer_id")
        .in("answer_id", answerIds);

      likesData = data ?? [];
    }

    const likesMap: Record<number, number> = {};

    likesData.forEach((like) => {
      likesMap[like.answer_id] =
        (likesMap[like.answer_id] || 0) + 1;
    });

    const formattedAnswers: Answer[] =
      answers.map((item) => ({
        id: item.id,
        answer: item.answer,
        created_at: item.created_at,
        likes: likesMap[item.id] || 0,
      }));

    setProfileAnswers(formattedAnswers);
    setProfileLoading(false);
  };

  /* =======================================================
     OPEN PROFILE
  ======================================================= */

  const openProfile = (
    contributor: Contributor,
  ) => {
    setProfileContributor(contributor);

    const params = new URLSearchParams();

    params.set("name", contributor.name);
    params.set(
      "country",
      contributor.country,
    );

    window.history.pushState(
      {},
      "",
      `/contributors?${params.toString()}`,
    );

    loadProfileAnswers(contributor);
  };

  /* =======================================================
     CLOSE PROFILE
  ======================================================= */

  const closeProfile = () => {
    setProfileContributor(null);
    setProfileAnswers([]);

    window.history.pushState(
      {},
      "",
      "/contributors",
    );
  };

  /* =======================================================
     HOME BUTTON
  ======================================================= */

  const goHome = () => {
    window.location.href = "/";
  };

  /* =======================================================
     BROWSER BACK / FORWARD
  ======================================================= */

  useEffect(() => {
    const handlePopState = () => {
      const params =
        new URLSearchParams(
          window.location.search,
        );

      const name = params.get("name");
      const country = params.get("country");

      if (!name || !country) {
        setProfileContributor(null);
        setProfileAnswers([]);
        return;
      }

      const contributor =
        contributors.find(
          (item) =>
            item.name === name &&
            item.country === country,
        );

      if (contributor) {
        setProfileContributor(
          contributor,
        );

        loadProfileAnswers(
          contributor,
        );
      }
    };

    window.addEventListener(
      "popstate",
      handlePopState,
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState,
      );
    };
  }, [contributors]);

  /* =======================================================
     LOAD PROFILE FROM URL
  ======================================================= */

  useEffect(() => {
    if (contributors.length === 0) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search,
      );

    const name = params.get("name");
    const country = params.get("country");

    if (!name || !country) {
      return;
    }

    const contributor =
      contributors.find(
        (item) =>
          item.name === name &&
          item.country === country,
      );

    if (contributor) {
      setProfileContributor(
        contributor,
      );

      loadProfileAnswers(
        contributor,
      );
    }
  }, [contributors]);

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredContributors =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      if (!term) {
        return contributors;
      }

      return contributors.filter(
        (item) =>
          item.name
            .toLowerCase()
            .includes(term) ||
          item.country
            .toLowerCase()
            .includes(term),
      );
    }, [contributors, search]);

  /* =======================================================
     GLOBAL STATS
  ======================================================= */

  const totalContributors =
    contributors.length;

  const totalAnswers =
    contributors.reduce(
      (total, contributor) =>
        total + contributor.answers,
      0,
    );

  const totalLikes =
    contributors.reduce(
      (total, contributor) =>
        total + contributor.likes,
      0,
    );

  const totalCountries =
    new Set(
      contributors.map(
        (contributor) =>
          contributor.country,
      ),
    ).size;

  /* =======================================================
     PROFILE VIEW
  ======================================================= */

  if (profileContributor) {
    return (
      <main
        className="
          relative
          min-h-screen
          overflow-hidden
          bg-transparent
          px-4
          py-8
          sm:px-6
          lg:px-8
        "
      >
        {/* Sky background */}

        <SkyBackground />

        {/* Content above background */}

        <div
          className="
            relative
            z-10
            mx-auto
            w-full
            max-w-5xl
          "
        >
          {/* HOME + BACK */}

          <div
            className="
              mb-8
              flex
              flex-wrap
              gap-3
            "
          >
            <button
              onClick={goHome}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-white/10
                bg-white/[0.05]
                px-4
                py-2
                text-sm
                text-white/70
                backdrop-blur-md
                transition
                hover:bg-white/[0.09]
                hover:text-white
              "
            >
              ← Home
            </button>

            <button
              onClick={closeProfile}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-white/10
                bg-white/[0.05]
                px-4
                py-2
                text-sm
                text-white/70
                backdrop-blur-md
                transition
                hover:bg-white/[0.09]
                hover:text-white
              "
            >
              ← Contributors
            </button>
          </div>

          {/* PROFILE HEADER */}

          <AnimatedSection>
            <div
              className="
                rounded-3xl
                border
                border-white/10
                bg-white/[0.055]
                p-6
                backdrop-blur-xl
                sm:p-8
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-6
                  sm:flex-row
                  sm:items-center
                "
              >
                {/* REAL FLAG */}

                <CountryFlag
                  country={
                    profileContributor.country
                  }
                  size={82}
                />

                <div className="flex-1">
                  <h1
                    className="
                      text-3xl
                      font-bold
                      tracking-tight
                      text-white
                    "
                  >
                    {
                      profileContributor.name
                    }
                  </h1>

                  <p
                    className="
                      mt-1
                      text-white/55
                    "
                  >
                    {
                      profileContributor.country
                    }
                  </p>
                </div>
              </div>

              {/* PROFILE STATS */}

              <div
                className="
                  mt-8
                  grid
                  grid-cols-3
                  gap-3
                "
              >
                <div
                  className="
                    rounded-2xl
                    bg-white/[0.04]
                    p-4
                    text-center
                  "
                >
                  <div
                    className="
                      text-2xl
                      font-bold
                      text-white
                    "
                  >
                    {
                      profileContributor.answers
                    }
                  </div>

                  <div
                    className="
                      mt-1
                      text-xs
                      text-white/45
                    "
                  >
                    Answers
                  </div>
                </div>

                <div
                  className="
                    rounded-2xl
                    bg-white/[0.04]
                    p-4
                    text-center
                  "
                >
                  <div
                    className="
                      text-2xl
                      font-bold
                      text-white
                    "
                  >
                    {
                      profileContributor.likes
                    }
                  </div>

                  <div
                    className="
                      mt-1
                      text-xs
                      text-white/45
                    "
                  >
                    Likes
                  </div>
                </div>

                <div
                  className="
                    flex
                    flex-col
                    items-center
                    justify-center
                    rounded-2xl
                    bg-white/[0.04]
                    p-4
                    text-center
                  "
                >
                  <CountryFlag
                    country={
                      profileContributor.country
                    }
                    size={38}
                  />

                  <div
                    className="
                      mt-2
                      text-xs
                      text-white/45
                    "
                  >
                    Country
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* ANSWERS */}

          <div className="mt-8">
            <AnimatedSection>
              <h2
                className="
                  mb-5
                  text-xl
                  font-semibold
                  text-white
                "
              >
                Answers
              </h2>
            </AnimatedSection>

            {profileLoading ? (
              <div
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/[0.04]
                  p-8
                  text-center
                  text-white/50
                  backdrop-blur-md
                "
              >
                Loading answers...
              </div>
            ) : profileAnswers.length ===
              0 ? (
              <div
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/[0.04]
                  p-8
                  text-center
                  text-white/50
                  backdrop-blur-md
                "
              >
                No answers found.
              </div>
            ) : (
              <div className="space-y-4">
                {profileAnswers.map(
                  (answer, index) => (
                    <AnimatedSection
                      key={answer.id}
                      delay={index * 70}
                    >
                      <div
                        className="
                          rounded-2xl
                          border
                          border-white/10
                          bg-white/[0.045]
                          p-5
                          backdrop-blur-md
                          transition
                          hover:bg-white/[0.065]
                        "
                      >
                        <p
                          className="
                            whitespace-pre-wrap
                            text-sm
                            leading-7
                            text-white/80
                          "
                        >
                          {answer.answer}
                        </p>

                        <div
                          className="
                            mt-4
                            flex
                            items-center
                            justify-between
                            border-t
                            border-white/10
                            pt-4
                            text-xs
                            text-white/40
                          "
                        >
                          <span>
                            {new Date(
                              answer.created_at,
                            ).toLocaleDateString()}
                          </span>

                          <span>
                            ❤️{" "}
                            {answer.likes}
                          </span>
                        </div>
                      </div>
                    </AnimatedSection>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     CONTRIBUTORS PAGE
  ======================================================= */

  return (
    <main
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-transparent
        px-4
        py-8
        sm:px-6
        lg:px-8
      "
    >
      {/* ===================================================
          REAL SKY BACKGROUND
      =================================================== */}

      <SkyBackground />

      {/* ===================================================
          CONTENT
      =================================================== */}

      <div
        className="
          relative
          z-10
          mx-auto
          w-full
          max-w-6xl
        "
      >
        {/* =================================================
            HOME BUTTON
        ================================================= */}

        <AnimatedSection>
          <div className="mb-6">
            <button
              onClick={goHome}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-white/10
                bg-white/[0.05]
                px-4
                py-2
                text-sm
                text-white/70
                backdrop-blur-md
                transition
                hover:bg-white/[0.09]
                hover:text-white
              "
            >
              ← Home
            </button>
          </div>
        </AnimatedSection>

        {/* =================================================
            HEADER
        ================================================= */}

        <AnimatedSection>
          <div className="mb-8">
            <p
              className="
                mb-2
                text-sm
                font-medium
                uppercase
                tracking-[0.2em]
                text-white/40
              "
            >
              ONEQUESTION
            </p>

            <h1
              className="
                text-3xl
                font-bold
                tracking-tight
                text-white
                sm:text-4xl
              "
            >
              Contributors
            </h1>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-white/50
              "
            >
              Meet the people sharing
              their answers with the world.
            </p>
          </div>
        </AnimatedSection>

        {/* =================================================
            MAIN STATS
        ================================================= */}

        <div
          className="
            mb-10
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-4
          "
        >
          <StatCard
            value={totalContributors}
            label="Contributors"
            delay={0}
          />

          <StatCard
            value={totalAnswers}
            label="Answers"
            delay={80}
          />

          <StatCard
            value={totalLikes}
            label="Likes"
            delay={160}
          />

          <StatCard
            value={totalCountries}
            label="Countries"
            delay={240}
          />
        </div>

        {/* =================================================
            SEARCH
        ================================================= */}

        <AnimatedSection delay={100}>
          <div className="mb-8">
            <div
              className="
                relative
                overflow-hidden
                rounded-2xl
                border
                border-white/10
                bg-white/[0.045]
                backdrop-blur-md
              "
            >
              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value,
                  )
                }
                placeholder="Search contributors..."
                className="
                  w-full
                  bg-transparent
                  px-5
                  py-4
                  text-sm
                  text-white
                  outline-none
                  placeholder:text-white/30
                "
              />
            </div>
          </div>
        </AnimatedSection>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/[0.04]
              p-10
              text-center
              text-white/50
              backdrop-blur-md
            "
          >
            Loading contributors...
          </div>
        ) : filteredContributors.length ===
          0 ? (
          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/[0.04]
              p-10
              text-center
              text-white/50
              backdrop-blur-md
            "
          >
            No contributors found.
          </div>
        ) : (
          <>
            {/* =================================================
                TOP CONTRIBUTOR
            ================================================= */}

            <AnimatedSection delay={150}>
              <div
                className="
                  mb-8
                  overflow-hidden
                  rounded-3xl
                  border
                  border-white/10
                  bg-white/[0.055]
                  p-6
                  backdrop-blur-xl
                  sm:p-8
                "
              >
                <div
                  className="
                    mb-5
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.18em]
                    text-white/35
                  "
                >
                  Top Contributor
                </div>

                <div
                  className="
                    flex
                    flex-col
                    gap-5
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-4
                    "
                  >
                    {/* REAL FLAG */}

                    <CountryFlag
                      country={
                        filteredContributors[0]
                          .country
                      }
                      size={64}
                    />

                    <div>
                      <h2
                        className="
                          text-xl
                          font-bold
                          text-white
                        "
                      >
                        {
                          filteredContributors[0]
                            .name
                        }
                      </h2>

                      <p
                        className="
                          mt-1
                          text-sm
                          text-white/45
                        "
                      >
                        {
                          filteredContributors[0]
                            .country
                        }
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      openProfile(
                        filteredContributors[0],
                      )
                    }
                    className="
                      rounded-xl
                      border
                      border-white/10
                      bg-white/[0.06]
                      px-5
                      py-2.5
                      text-sm
                      font-medium
                      text-white/75
                      transition
                      hover:bg-white/[0.1]
                      hover:text-white
                    "
                  >
                    View Profile →
                  </button>
                </div>

                <div
                  className="
                    mt-6
                    grid
                    grid-cols-2
                    gap-3
                  "
                >
                  <div
                    className="
                      rounded-2xl
                      bg-white/[0.04]
                      p-4
                    "
                  >
                    <div
                      className="
                        text-xl
                        font-bold
                        text-white
                      "
                    >
                      {
                        filteredContributors[0]
                          .answers
                      }
                    </div>

                    <div
                      className="
                        mt-1
                        text-xs
                        text-white/40
                      "
                    >
                      Answers
                    </div>
                  </div>

                  <div
                    className="
                      rounded-2xl
                      bg-white/[0.04]
                      p-4
                    "
                  >
                    <div
                      className="
                        text-xl
                        font-bold
                        text-white
                      "
                    >
                      {
                        filteredContributors[0]
                          .likes
                      }
                    </div>

                    <div
                      className="
                        mt-1
                        text-xs
                        text-white/40
                      "
                    >
                      Likes
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* =================================================
                CONTRIBUTOR LIST
            ================================================= */}

            <div className="space-y-3">
              {filteredContributors.map(
                (contributor, index) => (
                  <AnimatedSection
                    key={`${contributor.name}-${contributor.country}`}
                    delay={
                      100 + index * 60
                    }
                  >
                    <div
                      className="
                        group
                        rounded-2xl
                        border
                        border-white/10
                        bg-white/[0.045]
                        p-5
                        backdrop-blur-md
                        transition-all
                        duration-300
                        hover:-translate-y-0.5
                        hover:border-white/15
                        hover:bg-white/[0.065]
                      "
                    >
                      <div
                        className="
                          flex
                          flex-col
                          gap-4
                          sm:flex-row
                          sm:items-center
                        "
                      >
                        {/* REAL FLAG */}

                        <CountryFlag
                          country={
                            contributor.country
                          }
                          size={48}
                        />

                        {/* NAME */}

                        <div className="min-w-0 flex-1">
                          <div
                            className="
                              truncate
                              font-semibold
                              text-white
                            "
                          >
                            {
                              contributor.name
                            }
                          </div>

                          <div
                            className="
                              mt-1
                              text-xs
                              text-white/40
                            "
                          >
                            {
                              contributor.country
                            }
                          </div>
                        </div>

                        {/* STATS */}

                        <div
                          className="
                            flex
                            items-center
                            gap-5
                            text-sm
                          "
                        >
                          <div>
                            <span className="font-semibold text-white">
                              {
                                contributor.answers
                              }
                            </span>

                            <span className="ml-1 text-white/35">
                              answers
                            </span>
                          </div>

                          <div>
                            <span className="font-semibold text-white">
                              {
                                contributor.likes
                              }
                            </span>

                            <span className="ml-1 text-white/35">
                              likes
                            </span>
                          </div>
                        </div>

                        {/* PROFILE */}

                        <button
                          onClick={() =>
                            openProfile(
                              contributor,
                            )
                          }
                          className="
                            rounded-xl
                            border
                            border-white/10
                            bg-white/[0.04]
                            px-4
                            py-2
                            text-xs
                            font-medium
                            text-white/60
                            transition
                            hover:bg-white/[0.09]
                            hover:text-white
                          "
                        >
                          Profile →
                        </button>
                      </div>
                    </div>
                  </AnimatedSection>
                ),
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}