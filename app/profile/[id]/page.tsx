"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ScrollReveal from "../../ScrollReveal";

type ProfileUser = {
  id: string;
  email?: string | null;
};

type Answer = {
  id: number;
  answer: string;
  country: string;
  created_at: string;
};

type FollowUser = {
  id: string;
  name: string;
};

type Badge = {
  id: number;
  name: string;
  description: string;
  icon: string;
};

type Streak = {
  current_streak: number;
  longest_streak: number;
  last_answer_date: string | null;
};

type Analytics = {
  totalAnswers: number;
  totalReactions: number;
  countriesReached: number;
  followers: number;
  currentStreak: number;
  longestStreak: number;
  last7DaysAnswers: number;
};

/* =========================================================
   ANIMATED NUMBER
   ========================================================= */

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
      const progress = Math.min(elapsed / duration, 1);

      // Smooth ease-out animation
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

export default function PublicProfilePage() {
  const params = useParams();
  const userId = String(params.id);

  const [profile, setProfile] =
    useState<ProfileUser | null>(null);

  const [answers, setAnswers] =
    useState<Answer[]>([]);

  const [followerCount, setFollowerCount] =
    useState(0);

  const [followingCount, setFollowingCount] =
    useState(0);

  const [followersList, setFollowersList] =
    useState<FollowUser[]>([]);

  const [followingList, setFollowingList] =
    useState<FollowUser[]>([]);

  const [badges, setBadges] =
    useState<Badge[]>([]);

  const [streak, setStreak] =
    useState<Streak | null>(null);

  const [analytics, setAnalytics] =
    useState<Analytics | null>(null);

  const [showFollowers, setShowFollowers] =
    useState(false);

  const [showFollowing, setShowFollowing] =
    useState(false);

  const [isFollowing, setIsFollowing] =
    useState(false);

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [followLoading, setFollowLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    loadProfile();
  }, [userId]);

  async function loadProfile() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    setCurrentUserId(
      currentUser?.id || null
    );

    const {
      data: answersData,
      error: answersError,
    } = await supabase
      .from("answers")
      .select(
        "id, answer, country, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (answersError) {
      console.error(
        "Public profile answers error:",
        answersError
      );

      setErrorMessage(
        "Could not load this profile."
      );

      setLoading(false);
      return;
    }

    const loadedAnswers =
      answersData || [];

    setAnswers(loadedAnswers);

    const {
      data: profileAnswer,
    } = await supabase
      .from("answers")
      .select("user_id, name")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (!profileAnswer) {
      setErrorMessage(
        "This profile could not be found."
      );

      setLoading(false);
      return;
    }

    setProfile({
      id: userId,
      email: profileAnswer.name,
    });

    /* =========================================================
       FOLLOWERS
       ========================================================= */

    const {
      data: followersData,
      count: followers,
    } = await supabase
      .from("follows")
      .select("follower_id", {
        count: "exact",
      })
      .eq("following_id", userId);

    /* =========================================================
       FOLLOWING
       ========================================================= */

    const {
      data: followingData,
      count: following,
    } = await supabase
      .from("follows")
      .select("following_id", {
        count: "exact",
      })
      .eq("follower_id", userId);

    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);

    const followerIds =
      (followersData || []).map(
        (item) => item.follower_id
      );

    const followingIds =
      (followingData || []).map(
        (item) => item.following_id
      );

    /* =========================================================
       PERSONAL ANALYTICS
       ========================================================= */

    const totalAnswers =
      loadedAnswers.length;

    const countries = new Set(
      loadedAnswers
        .map((item) =>
          item.country?.trim()
        )
        .filter(
          (country) =>
            country &&
            country !== "Other"
        )
    );

    const countriesReached =
      countries.size;

    let totalReactions = 0;

    const answerIds =
      loadedAnswers.map(
        (item) => item.id
      );

    if (answerIds.length > 0) {
      const {
        count: reactionCount,
        error: reactionError,
      } = await supabase
        .from("reactions")
        .select("id", {
          count: "exact",
          head: true,
        })
        .in("answer_id", answerIds);

      if (reactionError) {
        console.error(
          "Analytics reactions error:",
          reactionError
        );
      } else {
        totalReactions =
          reactionCount || 0;
      }
    }

    /* =========================================================
       LAST 7 DAYS
       ========================================================= */

    const now = new Date();

    const sevenDaysAgo =
      new Date(now);

    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 6
    );

    sevenDaysAgo.setHours(
      0,
      0,
      0,
      0
    );

    const last7DaysAnswers =
      loadedAnswers.filter(
        (item) => {
          const answerDate =
            new Date(
              item.created_at
            );

          return (
            answerDate >=
              sevenDaysAgo &&
            answerDate <= now
          );
        }
      ).length;

    /* =========================================================
       STREAK
       ========================================================= */

    const {
      data: streakData,
      error: streakError,
    } = await supabase
      .from("user_streaks")
      .select(
        "current_streak, longest_streak, last_answer_date"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (streakError) {
      console.error(
        "Streak load error:",
        streakError
      );

      setStreak(null);
    } else {
      setStreak(streakData);
    }

    /* =========================================================
       SAVE ANALYTICS
       ========================================================= */

    setAnalytics({
      totalAnswers,
      totalReactions,
      countriesReached,
      followers: followers || 0,
      currentStreak:
        streakData?.current_streak || 0,
      longestStreak:
        streakData?.longest_streak || 0,
      last7DaysAnswers,
    });

    /* =========================================================
       FOLLOWER NAMES
       ========================================================= */

    if (followerIds.length > 0) {
      const {
        data: followerAnswers,
        error: followerAnswersError,
      } = await supabase
        .from("answers")
        .select(
          "user_id, name, created_at"
        )
        .in(
          "user_id",
          followerIds
        )
        .order("created_at", {
          ascending: false,
        });

      if (followerAnswersError) {
        console.error(
          "Followers names error:",
          followerAnswersError
        );
      } else {
        const latestNames =
          new Map<string, string>();

        (followerAnswers || []).forEach(
          (item) => {
            if (
              !latestNames.has(
                item.user_id
              )
            ) {
              latestNames.set(
                item.user_id,
                item.name
              );
            }
          }
        );

        setFollowersList(
          followerIds.map((id) => ({
            id,
            name:
              latestNames.get(id) ||
              "ONEQUESTION User",
          }))
        );
      }
    } else {
      setFollowersList([]);
    }

    /* =========================================================
       FOLLOWING NAMES
       ========================================================= */

    if (followingIds.length > 0) {
      const {
        data: followingAnswers,
        error: followingAnswersError,
      } = await supabase
        .from("answers")
        .select(
          "user_id, name, created_at"
        )
        .in(
          "user_id",
          followingIds
        )
        .order("created_at", {
          ascending: false,
        });

      if (followingAnswersError) {
        console.error(
          "Following names error:",
          followingAnswersError
        );
      } else {
        const latestNames =
          new Map<string, string>();

        (followingAnswers || []).forEach(
          (item) => {
            if (
              !latestNames.has(
                item.user_id
              )
            ) {
              latestNames.set(
                item.user_id,
                item.name
              );
            }
          }
        );

        setFollowingList(
          followingIds.map((id) => ({
            id,
            name:
              latestNames.get(id) ||
              "ONEQUESTION User",
          }))
        );
      }
    } else {
      setFollowingList([]);
    }

    /* =========================================================
       CURRENT USER FOLLOW STATUS
       ========================================================= */

    if (currentUser) {
      const {
        data: existingFollow,
      } = await supabase
        .from("follows")
        .select("id")
        .eq(
          "follower_id",
          currentUser.id
        )
        .eq(
          "following_id",
          userId
        )
        .maybeSingle();

      setIsFollowing(
        !!existingFollow
      );
    } else {
      setIsFollowing(false);
    }

    /* =========================================================
       BADGES
       ========================================================= */

    const {
      data: userBadges,
      error: badgesError,
    } = await supabase
      .from("user_badges")
      .select(`
        badge_id,
        badges (
          id,
          name,
          description,
          icon
        )
      `)
      .eq("user_id", userId);

    if (badgesError) {
      console.error(
        "Badges load error:",
        badgesError
      );

      setBadges([]);
    } else {
      const loadedBadges: Badge[] = [];

      (userBadges || []).forEach(
        (item: any) => {
          if (item.badges) {
            loadedBadges.push(
              item.badges
            );
          }
        }
      );

      setBadges(
        loadedBadges
      );
    }

    setLoading(false);
  }

  async function handleFollow() {
    if (!currentUserId) {
      window.location.href =
        "/login";

      return;
    }

    if (followLoading) {
      return;
    }

    if (
      currentUserId === userId
    ) {
      return;
    }

    setFollowLoading(true);

    if (isFollowing) {
      const { error } =
        await supabase
          .from("follows")
          .delete()
          .eq(
            "follower_id",
            currentUserId
          )
          .eq(
            "following_id",
            userId
          );

      if (error) {
        console.error(
          "Unfollow error:",
          error
        );

        setFollowLoading(
          false
        );

        return;
      }

      setIsFollowing(false);

      setFollowerCount(
        (count) =>
          Math.max(
            0,
            count - 1
          )
      );

      setAnalytics(
        (current) =>
          current
            ? {
                ...current,
                followers:
                  Math.max(
                    0,
                    current.followers -
                      1
                  ),
              }
            : current
      );

      setFollowersList(
        (list) =>
          list.filter(
            (item) =>
              item.id !==
              currentUserId
          )
      );
    } else {
      const { error } =
        await supabase
          .from("follows")
          .insert({
            follower_id:
              currentUserId,
            following_id:
              userId,
          });

      if (error) {
        console.error(
          "Follow error:",
          error
        );

        setFollowLoading(
          false
        );

        return;
      }

      setIsFollowing(true);

      setFollowerCount(
        (count) =>
          count + 1
      );

      setAnalytics(
        (current) =>
          current
            ? {
                ...current,
                followers:
                  current.followers +
                  1,
              }
            : current
      );

      const {
        data: currentUserAnswer,
      } = await supabase
        .from("answers")
        .select("name")
        .eq(
          "user_id",
          currentUserId
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      const currentUserName =
        currentUserAnswer?.name ||
        "ONEQUESTION User";

      setFollowersList(
        (list) => [
          {
            id: currentUserId,
            name: currentUserName,
          },
          ...list.filter(
            (item) =>
              item.id !==
              currentUserId
          ),
        ]
      );

      const {
        error:
          notificationError,
      } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          actor_id:
            currentUserId,
          type: "follow",
          message:
            `${currentUserName} started following you`,
        });

      if (notificationError) {
        console.error(
          "Follow notification error:",
          notificationError
        );
      }
    }

    setFollowLoading(false);
  }

  function formatDate(
    date: string
  ) {
    return new Intl.DateTimeFormat(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    ).format(
      new Date(date)
    );
  }

  function toggleFollowers() {
    setShowFollowers(
      (value) => !value
    );

    if (showFollowing) {
      setShowFollowing(false);
    }
  }

  function toggleFollowing() {
    setShowFollowing(
      (value) => !value
    );

    if (showFollowers) {
      setShowFollowers(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-5 py-10">

        {/* NAVIGATION */}

        <ScrollReveal>
          <div className="flex flex-wrap items-center gap-2">

            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              ← Home
            </Link>

            <Link
              href="/explore"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Explore
            </Link>

            <Link
              href="/world"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              World
            </Link>

          </div>
        </ScrollReveal>

        {/* LOADING */}

        {loading && (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
            Loading profile...
          </div>
        )}

        {/* ERROR */}

        {!loading &&
          errorMessage && (
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">

              <p className="text-lg text-white/80">
                {errorMessage}
              </p>

              <Link
                href="/"
                className="mt-6 inline-flex rounded-full border border-white/10 bg-white/10 px-5 py-2.5 text-sm transition hover:bg-white/15"
              >
                ← Back to ONEQUESTION
              </Link>

            </div>
          )}

        {/* PROFILE */}

        {!loading &&
          profile && (
            <>

              {/* PROFILE HEADER */}

              <ScrollReveal delay={100}>
                <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">

                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
                        ONEQUESTION Profile
                      </p>

                      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                        {profile.email}
                      </h1>

                      <p className="mt-2 text-sm text-white/40">
                        {answers.length}{" "}
                        {answers.length === 1
                          ? "answer"
                          : "answers"}
                      </p>

                    </div>

                    {currentUserId !==
                      userId && (
                      <button
                        type="button"
                        onClick={
                          handleFollow
                        }
                        disabled={
                          followLoading
                        }
                        className="rounded-full border border-white/10 bg-white/10 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {followLoading
                          ? "..."
                          : isFollowing
                          ? "Following"
                          : "Follow"}
                      </button>
                    )}

                  </div>

                  {/* FOLLOW STATS */}

                  <div className="mt-8 grid grid-cols-2 gap-4">

                    <button
                      type="button"
                      onClick={
                        toggleFollowers
                      }
                      className="rounded-2xl border border-white/10 bg-black/20 p-5 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
                    >

                      <p className="text-sm text-white/40">
                        Followers
                      </p>

                      <p className="mt-2 text-3xl font-bold">
                        {followerCount}
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        {showFollowers
                          ? "Hide list ↑"
                          : "View list →"}
                      </p>

                    </button>

                    <button
                      type="button"
                      onClick={
                        toggleFollowing
                      }
                      className="rounded-2xl border border-white/10 bg-black/20 p-5 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
                    >

                      <p className="text-sm text-white/40">
                        Following
                      </p>

                      <p className="mt-2 text-3xl font-bold">
                        {followingCount}
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        {showFollowing
                          ? "Hide list ↑"
                          : "View list →"}
                      </p>

                    </button>

                  </div>

                  {/* FOLLOWERS LIST */}

                  {showFollowers && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5">

                      <div className="mb-4 flex items-center justify-between">

                        <div>

                          <h3 className="text-lg font-semibold">
                            Followers
                          </h3>

                          <p className="mt-1 text-xs text-white/40">
                            People following this profile
                          </p>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setShowFollowers(
                              false
                            )
                          }
                          className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
                        >
                          Close
                        </button>

                      </div>

                      {followersList.length ===
                      0 ? (
                        <p className="py-5 text-center text-sm text-white/40">
                          No followers yet.
                        </p>
                      ) : (
                        <div className="space-y-2">

                          {followersList.map(
                            (item) => (
                              <Link
                                key={
                                  item.id
                                }
                                href={`/profile/${item.id}`}
                                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 transition hover:border-white/10 hover:bg-white/[0.06]"
                              >

                                <div className="flex items-center gap-3">

                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white/70">
                                    {item.name
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase()}
                                  </div>

                                  <span className="text-sm font-medium text-white/80">
                                    {item.name}
                                  </span>

                                </div>

                                <span className="text-xs text-white/30">
                                  View →
                                </span>

                              </Link>
                            )
                          )}

                        </div>
                      )}

                    </div>
                  )}

                  {/* FOLLOWING LIST */}

                  {showFollowing && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5">

                      <div className="mb-4 flex items-center justify-between">

                        <div>

                          <h3 className="text-lg font-semibold">
                            Following
                          </h3>

                          <p className="mt-1 text-xs text-white/40">
                            People this profile follows
                          </p>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setShowFollowing(
                              false
                            )
                          }
                          className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
                        >
                          Close
                        </button>

                      </div>

                      {followingList.length ===
                      0 ? (
                        <p className="py-5 text-center text-sm text-white/40">
                          Not following anyone yet.
                        </p>
                      ) : (
                        <div className="space-y-2">

                          {followingList.map(
                            (item) => (
                              <Link
                                key={
                                  item.id
                                }
                                href={`/profile/${item.id}`}
                                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 transition hover:border-white/10 hover:bg-white/[0.06]"
                              >

                                <div className="flex items-center gap-3">

                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white/70">
                                    {item.name
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase()}
                                  </div>

                                  <span className="text-sm font-medium text-white/80">
                                    {item.name}
                                  </span>

                                </div>

                                <span className="text-xs text-white/30">
                                  View →
                                </span>

                              </Link>
                            )
                          )}

                        </div>
                      )}

                    </div>
                  )}

                </section>
              </ScrollReveal>

              {/* =================================================
                  PERSONAL ANALYTICS
                  ================================================= */}

              {currentUserId ===
                userId &&
                analytics && (
                  <ScrollReveal delay={120}>
                    <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">

                      <div>

                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
                          Personal Insights
                        </p>

                        <h2 className="mt-2 text-2xl font-bold">
                          📊 Personal Analytics
                        </h2>

                        <p className="mt-1 text-sm text-white/40">
                          Your ONEQUESTION activity at a glance.
                        </p>

                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">

                        {/* TOTAL ANSWERS */}

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-white/20 hover:bg-white/[0.04]">

                          <p className="text-2xl">
                            💬
                          </p>

                          <p className="mt-4 text-xs uppercase tracking-wide text-white/40">
                            Total Answers
                          </p>

                          <p className="mt-1 text-3xl font-bold">
                            <AnimatedNumber
                              value={
                                analytics.totalAnswers
                              }
                            />
                          </p>

                        </div>

                        {/* REACTIONS */}

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-white/20 hover:bg-white/[0.04]">

                          <p className="text-2xl">
                            ❤️
                          </p>

                          <p className="mt-4 text-xs uppercase tracking-wide text-white/40">
                            Reactions
                          </p>

                          <p className="mt-1 text-3xl font-bold">
                            <AnimatedNumber
                              value={
                                analytics.totalReactions
                              }
                            />
                          </p>

                        </div>

                        {/* COUNTRIES */}

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-white/20 hover:bg-white/[0.04]">

                          <p className="text-2xl">
                            🌍
                          </p>

                          <p className="mt-4 text-xs uppercase tracking-wide text-white/40">
                            Countries
                          </p>

                          <p className="mt-1 text-3xl font-bold">
                            <AnimatedNumber
                              value={
                                analytics.countriesReached
                              }
                            />
                          </p>

                        </div>

                        {/* FOLLOWERS */}

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-white/20 hover:bg-white/[0.04]">

                          <p className="text-2xl">
                            👥
                          </p>

                          <p className="mt-4 text-xs uppercase tracking-wide text-white/40">
                            Followers
                          </p>

                          <p className="mt-1 text-3xl font-bold">
                            <AnimatedNumber
                              value={
                                analytics.followers
                              }
                            />
                          </p>

                        </div>

                        {/* CURRENT STREAK */}

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-white/20 hover:bg-white/[0.04]">

                          <p className="text-2xl">
                            🔥
                          </p>

                          <p className="mt-4 text-xs uppercase tracking-wide text-white/40">
                            Current Streak
                          </p>

                          <p className="mt-1 text-3xl font-bold">

                            <AnimatedNumber
                              value={
                                analytics.currentStreak
                              }
                            />

                            <span className="ml-1 text-sm font-normal text-white/30">
                              days
                            </span>

                          </p>

                        </div>

                        {/* LONGEST STREAK */}

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-white/20 hover:bg-white/[0.04]">

                          <p className="text-2xl">
                            🏆
                          </p>

                          <p className="mt-4 text-xs uppercase tracking-wide text-white/40">
                            Longest Streak
                          </p>

                          <p className="mt-1 text-3xl font-bold">

                            <AnimatedNumber
                              value={
                                analytics.longestStreak
                              }
                            />

                            <span className="ml-1 text-sm font-normal text-white/30">
                              days
                            </span>

                          </p>

                        </div>

                      </div>

                      {/* LAST 7 DAYS */}

                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-white/20 hover:bg-white/[0.04]">

                        <div className="flex items-center justify-between gap-4">

                          <div>

                            <p className="text-sm font-medium text-white/80">
                              📅 Last 7 Days
                            </p>

                            <p className="mt-1 text-xs text-white/40">
                              Answers you shared during the last 7 days.
                            </p>

                          </div>

                          <div className="shrink-0 text-right">

                            <p className="text-3xl font-bold">
                              <AnimatedNumber
                                value={
                                  analytics.last7DaysAnswers
                                }
                              />
                            </p>

                            <p className="text-xs text-white/30">
                              answers
                            </p>

                          </div>

                        </div>

                      </div>

                    </section>
                  </ScrollReveal>
                )}

              {/* BADGES */}

              <ScrollReveal delay={130}>
                <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">

                  <div>

                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
                      Achievements
                    </p>

                    <h2 className="mt-2 text-2xl font-bold">
                      🏆 Badges
                    </h2>

                    <p className="mt-1 text-sm text-white/40">
                      Achievements earned on ONEQUESTION.
                    </p>

                  </div>

                  {badges.length ===
                  0 ? (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-center">

                      <p className="text-sm text-white/40">
                        No badges earned yet.
                      </p>

                    </div>
                  ) : (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">

                      {badges.map(
                        (badge) => (
                          <div
                            key={
                              badge.id
                            }
                            className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-white/[0.06]"
                          >

                            <div className="flex items-center gap-4">

                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                                {badge.icon}
                              </div>

                              <div className="min-w-0">

                                <h3 className="font-semibold text-white">
                                  {badge.name}
                                </h3>

                                <p className="mt-1 text-xs leading-5 text-white/40">
                                  {
                                    badge.description
                                  }
                                </p>

                              </div>

                            </div>

                          </div>
                        )
                      )}

                    </div>
                  )}

                </section>
              </ScrollReveal>

              {/* STREAK */}

              <ScrollReveal delay={140}>
                <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">

                  <div>

                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
                      Activity
                    </p>

                    <h2 className="mt-2 text-2xl font-bold">
                      🔥 Streak
                    </h2>

                    <p className="mt-1 text-sm text-white/40">
                      Keep answering and keep your streak alive.
                    </p>

                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

                      <p className="text-sm text-white/40">
                        Current Streak
                      </p>

                      <div className="mt-2 flex items-end gap-2">

                        <span className="text-4xl font-bold">
                          {
                            streak?.current_streak ||
                            0
                          }
                        </span>

                        <span className="pb-1 text-sm text-white/40">
                          days
                        </span>

                      </div>

                      <p className="mt-2 text-xs text-white/30">
                        🔥 Keep it going
                      </p>

                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

                      <p className="text-sm text-white/40">
                        Longest Streak
                      </p>

                      <div className="mt-2 flex items-end gap-2">

                        <span className="text-4xl font-bold">
                          {
                            streak?.longest_streak ||
                            0
                          }
                        </span>

                        <span className="pb-1 text-sm text-white/40">
                          days
                        </span>

                      </div>

                      <p className="mt-2 text-xs text-white/30">
                        🏆 Personal best
                      </p>

                    </div>

                  </div>

                </section>
              </ScrollReveal>

              {/* ANSWERS */}

              <ScrollReveal delay={150}>
                <section className="mt-10">

                  <div className="mb-5">

                    <h2 className="text-2xl font-bold">
                      Answers
                    </h2>

                    <p className="mt-1 text-sm text-white/50">
                      Answers shared on ONEQUESTION.
                    </p>

                  </div>

                  {answers.length ===
                    0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/50">
                      No answers yet.
                    </div>
                  )}

                  {answers.length >
                    0 && (
                    <div className="space-y-4">

                      {answers.map(
                        (
                          item,
                          index
                        ) => (
                          <ScrollReveal
                            key={
                              item.id
                            }
                            delay={
                              index *
                              80
                            }
                          >

                            <Link
                              href={`/answer/${item.id}`}
                              className="block rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/[0.08]"
                            >

                              <p className="text-lg leading-8 text-white/90">
                                {
                                  item.answer
                                }
                              </p>

                              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/40">

                                <span>
                                  {
                                    item.country
                                  }
                                </span>

                                <span>
                                  •
                                </span>

                                <span>
                                  {formatDate(
                                    item.created_at
                                  )}
                                </span>

                              </div>

                            </Link>

                          </ScrollReveal>
                        )
                      )}

                    </div>
                  )}

                </section>
              </ScrollReveal>

            </>
          )}

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