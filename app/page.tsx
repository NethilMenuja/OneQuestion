"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import SkyBackground from "./SkyBackground";
import ScrollReveal from "./ScrollReveal";

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
  reaction?: string;
};

type Reply = {
  id: number;
  answer_id: number;
  user_id: string;
  reply: string;
  created_at: string;
};

type Question = {
  id: number;
  question: string;
};

const countryFlags: Record<string, string> = {
  "Afghanistan": "af",
  "Albania": "al",
  "Algeria": "dz",
  "Andorra": "ad",
  "Angola": "ao",
  "Antigua and Barbuda": "ag",
  "Argentina": "ar",
  "Armenia": "am",
  "Australia": "au",
  "Austria": "at",
  "Azerbaijan": "az",
  "Bahamas": "bs",
  "Bahrain": "bh",
  "Bangladesh": "bd",
  "Barbados": "bb",
  "Belarus": "by",
  "Belgium": "be",
  "Belize": "bz",
  "Benin": "bj",
  "Bhutan": "bt",
  "Bolivia": "bo",
  "Bosnia and Herzegovina": "ba",
  "Botswana": "bw",
  "Brazil": "br",
  "Brunei": "bn",
  "Bulgaria": "bg",
  "Burkina Faso": "bf",
  "Burundi": "bi",
  "Cabo Verde": "cv",
  "Cambodia": "kh",
  "Cameroon": "cm",
  "Canada": "ca",
  "Central African Republic": "cf",
  "Chad": "td",
  "Chile": "cl",
  "China": "cn",
  "Colombia": "co",
  "Comoros": "km",
  "Congo": "cg",
  "Costa Rica": "cr",
  "Croatia": "hr",
  "Cuba": "cu",
  "Cyprus": "cy",
  "Czechia": "cz",
  "Democratic Republic of the Congo": "cd",
  "Denmark": "dk",
  "Djibouti": "dj",
  "Dominica": "dm",
  "Dominican Republic": "do",
  "Ecuador": "ec",
  "Egypt": "eg",
  "El Salvador": "sv",
  "Equatorial Guinea": "gq",
  "Eritrea": "er",
  "Estonia": "ee",
  "Eswatini": "sz",
  "Ethiopia": "et",
  "Fiji": "fj",
  "Finland": "fi",
  "France": "fr",
  "Gabon": "ga",
  "Gambia": "gm",
  "Georgia": "ge",
  "Germany": "de",
  "Ghana": "gh",
  "Greece": "gr",
  "Grenada": "gd",
  "Guatemala": "gt",
  "Guinea": "gn",
  "Guinea-Bissau": "gw",
  "Guyana": "gy",
  "Haiti": "ht",
  "Honduras": "hn",
  "Hungary": "hu",
  "Iceland": "is",
  "India": "in",
  "Indonesia": "id",
  "Iran": "ir",
  "Iraq": "iq",
  "Ireland": "ie",
  "Israel": "il",
  "Italy": "it",
  "Jamaica": "jm",
  "Japan": "jp",
  "Jordan": "jo",
  "Kazakhstan": "kz",
  "Kenya": "ke",
  "Kiribati": "ki",
  "Kuwait": "kw",
  "Kyrgyzstan": "kg",
  "Laos": "la",
  "Latvia": "lv",
  "Lebanon": "lb",
  "Lesotho": "ls",
  "Liberia": "lr",
  "Libya": "ly",
  "Liechtenstein": "li",
  "Lithuania": "lt",
  "Luxembourg": "lu",
  "Madagascar": "mg",
  "Malawi": "mw",
  "Malaysia": "my",
  "Maldives": "mv",
  "Mali": "ml",
  "Malta": "mt",
  "Marshall Islands": "mh",
  "Mauritania": "mr",
  "Mauritius": "mu",
  "Mexico": "mx",
  "Micronesia": "fm",
  "Moldova": "md",
  "Monaco": "mc",
  "Mongolia": "mn",
  "Montenegro": "me",
  "Morocco": "ma",
  "Mozambique": "mz",
  "Myanmar": "mm",
  "Namibia": "na",
  "Nauru": "nr",
  "Nepal": "np",
  "Netherlands": "nl",
  "New Zealand": "nz",
  "Nicaragua": "ni",
  "Niger": "ne",
  "Nigeria": "ng",
  "North Korea": "kp",
  "North Macedonia": "mk",
  "Norway": "no",
  "Oman": "om",
  "Pakistan": "pk",
  "Palau": "pw",
  "Palestine": "ps",
  "Panama": "pa",
  "Papua New Guinea": "pg",
  "Paraguay": "py",
  "Peru": "pe",
  "Philippines": "ph",
  "Poland": "pl",
  "Portugal": "pt",
  "Qatar": "qa",
  "Romania": "ro",
  "Russia": "ru",
  "Rwanda": "rw",
  "Saint Kitts and Nevis": "kn",
  "Saint Lucia": "lc",
  "Saint Vincent and the Grenadines": "vc",
  "Samoa": "ws",
  "San Marino": "sm",
  "Sao Tome and Principe": "st",
  "Saudi Arabia": "sa",
  "Senegal": "sn",
  "Serbia": "rs",
  "Seychelles": "sc",
  "Sierra Leone": "sl",
  "Singapore": "sg",
  "Slovakia": "sk",
  "Slovenia": "si",
  "Solomon Islands": "sb",
  "Somalia": "so",
  "South Africa": "za",
  "South Korea": "kr",
  "South Sudan": "ss",
  "Spain": "es",
  "Sri Lanka": "lk",
  "Sudan": "sd",
  "Suriname": "sr",
  "Sweden": "se",
  "Switzerland": "ch",
  "Syria": "sy",
  "Tajikistan": "tj",
  "Tanzania": "tz",
  "Thailand": "th",
  "Timor-Leste": "tl",
  "Togo": "tg",
  "Tonga": "to",
  "Trinidad and Tobago": "tt",
  "Tunisia": "tn",
  "Turkey": "tr",
  "Turkmenistan": "tm",
  "Tuvalu": "tv",
  "Uganda": "ug",
  "Ukraine": "ua",
  "United Arab Emirates": "ae",
  "United Kingdom": "gb",
  "United States": "us",
  "Uruguay": "uy",
  "Uzbekistan": "uz",
  "Vanuatu": "vu",
  "Vatican City": "va",
  "Venezuela": "ve",
  "Vietnam": "vn",
  "Yemen": "ye",
  "Zambia": "zm",
  "Zimbabwe": "zw",
};

const countryList = Object.keys(countryFlags);

const translateLanguages = [
  "English",
  "Sinhala",
  "Tamil",
  "Hindi",
  "Japanese",
  "French",
  "Spanish",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Chinese",
  "Korean",
  "Arabic",
  "Bengali",
  "Malay",
  "Indonesian",
  "Thai",
  "Vietnamese",
  "Turkish",
  "Dutch",
  "Polish",
  "Ukrainian",
  "Greek",
  "Hebrew",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Czech",
  "Romanian",
];

const validReactions = [
  "love",
  "like",
  "haha",
  "wow",
  "sad",
  "angry",
];

/* =========================================================
   ANIMATED NUMBER
   ========================================================= */

function AnimatedNumber({
  value,
  suffix = "",
  duration = 1200,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const elementRef = useRef<HTMLParagraphElement | null>(null);
  const animationFrameRef =
    useRef<number | null>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isVisible) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current = null;
      }

      setDisplayValue(0);
      return;
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(
        animationFrameRef.current
      );
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      const progress = Math.min(
        elapsed / duration,
        1
      );

      const eased =
        1 - Math.pow(1 - progress, 3);

      const currentValue = Math.round(
        value * eased
      );

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current =
          requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    setDisplayValue(0);

    animationFrameRef.current =
      requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current = null;
      }
    };
  }, [value, isVisible, duration]);

  return (
    <p
      ref={elementRef}
      className="text-3xl font-bold tabular-nums"
    >
      {displayValue}
      {suffix}
    </p>
  );
}

export default function Home() {
  const [question, setQuestion] =
    useState<Question | null>(null);

  const [answers, setAnswers] =
    useState<Answer[]>([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [replies, setReplies] =
    useState<Reply[]>([]);

  const [answerText, setAnswerText] =
    useState("");

  const [userName, setUserName] =
    useState("");

  const [country, setCountry] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [posting, setPosting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [likingId, setLikingId] =
    useState<number | null>(null);

  const [user, setUser] =
    useState<User | null>(null);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [reactionOpenId, setReactionOpenId] =
    useState<number | null>(null);

  const [replyingId, setReplyingId] =
    useState<number | null>(null);

  const [replyText, setReplyText] =
    useState("");

  const [postingReplyId, setPostingReplyId] =
    useState<number | null>(null);

  const [expandedReplies, setExpandedReplies] =
    useState<number | null>(null);

  const [bookmarkedIds, setBookmarkedIds] =
    useState<number[]>([]);

  const [bookmarkingId, setBookmarkingId] =
    useState<number | null>(null);

  const [unreadNotifications, setUnreadNotifications] =
    useState(0);

  /* =========================================================
     AI
     ========================================================= */

  const [aiImproving, setAiImproving] =
    useState(false);

  const [aiSuggestion, setAiSuggestion] =
    useState("");

  const [aiIdeas, setAiIdeas] =
    useState<string[]>([]);

  const [aiIdeasLoading, setAiIdeasLoading] =
    useState(false);

  const [aiSummary, setAiSummary] =
    useState("");

  const [aiSummaryLoading, setAiSummaryLoading] =
    useState(false);

  const [aiInsights, setAiInsights] =
    useState<{
      themes: string[];
      insight: string;
    } | null>(null);

  const [aiInsightsLoading, setAiInsightsLoading] =
    useState(false);

  const [translatingId, setTranslatingId] =
    useState<number | null>(null);

  const [translatedAnswers, setTranslatedAnswers] =
    useState<Record<number, string>>({});

  const [translateLanguage, setTranslateLanguage] =
    useState<Record<number, string>>({});

  const [followUpId, setFollowUpId] =
    useState<number | null>(null);

  const [followUpQuestions, setFollowUpQuestions] =
    useState<Record<number, string>>({});

  const [moderating, setModerating] =
    useState(false);

    const [translateOpenId, setTranslateOpenId] =
    useState<number | null>(null);

    const [translateSearch, setTranslateSearch] =
    useState<Record<number, string>>({});

    const [sharingId, setSharingId] =
    useState<number | null>(null);

    const [moreMenuOpen, setMoreMenuOpen] =
    useState(false);

  /* =========================================================
     COUNTRY DROPDOWN
     ========================================================= */

  const [countryOpen, setCountryOpen] =
    useState(false);

  const [countrySearch, setCountrySearch] =
    useState("");

  const countryDropdownRef =
    useRef<HTMLDivElement | null>(null);

  const filteredCountries =
    countryList.filter((item) =>
      item
        .toLowerCase()
        .includes(
          countrySearch.toLowerCase()
        )
    );

  useEffect(() => {
    const handleOutsideClick = (
      event: MouseEvent
    ) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setCountryOpen(false);
        setCountrySearch("");
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /*
   * REACTION HOLD
   */
  const reactionTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const reactionHeld =
    useRef(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (user) {
        loadUnreadNotifications();

        const { data: adminData } =
          await supabase
            .from("admins")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();

        setIsAdmin(!!adminData);
      } else {
        setUnreadNotifications(0);
        setIsAdmin(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser =
          session?.user ?? null;

        setUser(currentUser);

        if (currentUser) {
          loadUnreadNotifications();

          const checkAdmin = async () => {
            const { data: adminData } =
              await supabase
                .from("admins")
                .select("user_id")
                .eq(
                  "user_id",
                  currentUser.id
                )
                .maybeSingle();

            setIsAdmin(!!adminData);
          };

          checkAdmin();
        } else {
          setUnreadNotifications(0);
          setIsAdmin(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUnreadNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUnreadNotifications(0);
      return;
    }

    const { count, error } =
      await supabase
        .from("notifications")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .eq("is_read", false);

    if (error) {
      console.error(
        "Notifications count error:",
        error
      );
      return;
    }

    setUnreadNotifications(count ?? 0);
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    loadUnreadNotifications();

    const notificationTimer =
      window.setInterval(() => {
        loadUnreadNotifications();
      }, 5000);

    return () => {
      window.clearInterval(
        notificationTimer
      );
    };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const loadData = async () => {
    setLoading(true);
    setMessage("");

    const today =
      new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

    const {
      data: questionData,
      error: questionError,
    } = await supabase
      .from("questions")
      .select("id, question")
      .eq("question_date", today)
      .maybeSingle();

    if (questionError) {
      console.error("Question error:", {
        message: questionError.message,
        code: questionError.code,
        details: questionError.details,
        hint: questionError.hint,
      });

      setMessage(
        "Could not load today's question."
      );

      setLoading(false);
      return;
    }

    if (!questionData) {
      setQuestion(null);
      setAnswers([]);
      setReplies([]);
      setBookmarkedIds([]);

      setMessage(
        "No question available for today."
      );

      setLoading(false);
      return;
    }

    setQuestion(questionData);

    const {
      data: answersData,
      error: answersError,
    } = await supabase
      .from("answers")
      .select(
        "id, question_id, answer, name, country, created_at"
      )
      .eq("question_id", questionData.id)
      .order("created_at", {
        ascending: false,
      });

    if (answersError) {
      console.error(
        "Answers error:",
        answersError
      );

      setAnswers([]);
      setReplies([]);
      setBookmarkedIds([]);

      setMessage(
        "Could not load the answers."
      );

      setLoading(false);
      return;
    }

    const answerIds =
      (answersData ?? []).map(
        (answer) => answer.id
      );

    /* BOOKMARKS */
    if (
      user &&
      answerIds.length > 0
    ) {
      const {
        data: bookmarksData,
        error: bookmarksError,
      } = await supabase
        .from("bookmarks")
        .select("answer_id")
        .eq("user_id", user.id)
        .in("answer_id", answerIds);

      if (bookmarksError) {
        console.error(
          "Bookmarks load error:",
          {
            message:
              bookmarksError.message,
            code:
              bookmarksError.code,
            details:
              bookmarksError.details,
            hint:
              bookmarksError.hint,
          }
        );

        setBookmarkedIds([]);
      } else {
        setBookmarkedIds(
          (bookmarksData ?? []).map(
            (bookmark) =>
              bookmark.answer_id
          )
        );
      }
    } else {
      setBookmarkedIds([]);
    }

    /* LIKES + REACTIONS */
    let likeCounts: Record<
      number,
      number
    > = {};

    let userReactions: Record<
      number,
      string
    > = {};

    if (answerIds.length > 0) {
      const {
        data: likesData,
        error: likesError,
      } = await supabase
        .from("likes")
        .select(
          "answer_id, user_id, reaction"
        )
        .in("answer_id", answerIds)
        .not("user_id", "is", null);

      if (likesError) {
        console.error(
          "Likes error:",
          likesError
        );
      } else {
        likeCounts =
          (likesData ?? []).reduce(
            (counts, like) => {
              counts[like.answer_id] =
                (counts[
                  like.answer_id
                ] ?? 0) + 1;

              return counts;
            },
            {} as Record<number, number>
          );

        if (user) {
          (likesData ?? []).forEach(
            (like) => {
              if (
                like.user_id === user.id
              ) {
                const reaction =
                  like.reaction ??
                  "love";

                userReactions[
                  like.answer_id
                ] =
                  validReactions.includes(
                    reaction
                  )
                    ? reaction
                    : "love";
              }
            }
          );
        }
      }
    }

    setAnswers(
      (answersData ?? []).map(
        (answer) => ({
          ...answer,
          likes:
            likeCounts[answer.id] ??
            0,
          reaction:
            userReactions[
              answer.id
            ] ?? undefined,
        })
      )
    );

    /* REPLIES */
    if (answerIds.length > 0) {
      const {
        data: repliesData,
        error: repliesError,
      } = await supabase
        .from("replies")
        .select(
          "id, answer_id, user_id, reply, created_at"
        )
        .in(
          "answer_id",
          answerIds
        )
        .order("created_at", {
          ascending: true,
        });

      if (repliesError) {
        console.error(
          "Replies error:",
          repliesError
        );

        setReplies([]);
      } else {
        setReplies(
          repliesData ?? []
        );
      }
    } else {
      setReplies([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    let lastDate =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }
      ).format(new Date());

    const checkDate =
      window.setInterval(() => {
        const today =
          new Intl.DateTimeFormat(
            "en-CA",
            {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }
          ).format(new Date());

        if (today !== lastDate) {
          lastDate = today;
          loadData();
        }
      }, 30000);

    return () =>
      window.clearInterval(checkDate);
  }, []);

  /*
   * SHARE ANSWER
   */
  const handleShare = async (
    answer: Answer
  ) => {
    if (sharingId !== null) {
      return;
    }

    setSharingId(answer.id);
    setMessage("");

    const shareUrl =
      `${window.location.origin}/answer/${answer.id}`;

    const shareText =
      `${answer.name} answered on ONEQUESTION: "${answer.answer}"`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "ONEQUESTION",
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          `${shareText}\n\n${shareUrl}`
        );

        setMessage(
          "Answer link copied! 🔗"
        );
      }
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error(
        "Share error:",
        error
      );

      try {
        await navigator.clipboard.writeText(
          `${shareText}\n\n${shareUrl}`
        );

        setMessage(
          "Answer link copied! 🔗"
        );
      } catch (clipboardError) {
        console.error(
          "Clipboard error:",
          clipboardError
        );

        setMessage(
          "Could not share this answer."
        );
      }
    } finally {
      setSharingId(null);
    }
  };

  /*
   * NORMAL CLICK / TAP
   */
  const handleLike = async (
    answerId: number
  ) => {
    if (!user) {
      setMessage(
        "Please sign in to react to an answer."
      );
      return;
    }

    const currentAnswer =
      answers.find(
        (item) =>
          item.id === answerId
      );

    /*
     * ❤️ already selected -> REMOVE
     */
    if (
      currentAnswer?.reaction ===
      "love"
    ) {
      if (likingId !== null) {
        return;
      }

      setLikingId(answerId);
      setReactionOpenId(null);
      setMessage("");

      try {
        const {
          data: existingReaction,
          error: checkError,
        } = await supabase
          .from("likes")
          .select(
            "id, reaction"
          )
          .eq(
            "answer_id",
            answerId
          )
          .eq(
            "user_id",
            user.id
          )
          .limit(1)
          .maybeSingle();

        if (checkError) {
          console.error(
            "Check reaction error:",
            checkError
          );
          return;
        }

        if (existingReaction) {
          const { error } =
            await supabase
              .from("likes")
              .delete()
              .eq(
                "id",
                existingReaction.id
              );

          if (error) {
            console.error(
              "Remove reaction error:",
              error
            );
            return;
          }

          setAnswers(
            (currentAnswers) =>
              currentAnswers.map(
                (item) =>
                  item.id ===
                  answerId
                    ? {
                        ...item,
                        likes:
                          Math.max(
                            (item.likes ??
                              0) -
                              1,
                            0
                          ),
                        reaction:
                          undefined,
                      }
                    : item
              )
          );
        }
      } finally {
        setLikingId(null);
      }

      return;
    }

    await handleReaction(
      answerId,
      "love"
    );
  };

  /*
   * HOLD START
   */
  const handleReactionPointerDown = (
    answerId: number
  ) => {
    if (!user) {
      return;
    }

    reactionHeld.current = false;

    if (reactionTimer.current) {
      clearTimeout(
        reactionTimer.current
      );
    }

    reactionTimer.current =
      setTimeout(() => {
        reactionHeld.current = true;
        setReactionOpenId(answerId);
      }, 500);
  };

  /*
   * POINTER UP
   */
  const handleReactionPointerUp = (
    answerId: number
  ) => {
    if (reactionTimer.current) {
      clearTimeout(
        reactionTimer.current
      );

      reactionTimer.current = null;
    }

    if (reactionHeld.current) {
      reactionHeld.current = false;
      return;
    }

    handleLike(answerId);
  };

  const handleReactionPointerCancel =
    () => {
      if (reactionTimer.current) {
        clearTimeout(
          reactionTimer.current
        );

        reactionTimer.current = null;
      }

      reactionHeld.current = false;
    };

  const handleReaction = async (
    answerId: number,
    reaction: string
  ) => {
    if (!user) {
      setMessage(
        "Please sign in to react to an answer."
      );
      return;
    }

    if (likingId !== null) {
      return;
    }

    setLikingId(answerId);
    setReactionOpenId(null);
    setMessage("");

    try {
      const {
        data: existingReaction,
        error: checkError,
      } = await supabase
        .from("likes")
        .select(
          "id, reaction"
        )
        .eq(
          "answer_id",
          answerId
        )
        .eq(
          "user_id",
          user.id
        )
        .limit(1)
        .maybeSingle();

      if (checkError) {
        console.error(
          "Check reaction error:",
          checkError
        );
        return;
      }

      if (existingReaction) {
        const currentReaction =
          existingReaction.reaction ??
          "love";

        if (
          currentReaction ===
          reaction
        ) {
          return;
        }

        const { error } =
          await supabase
            .from("likes")
            .update({
              reaction:
                reaction,
            })
            .eq(
              "id",
              existingReaction.id
            );

        if (error) {
          console.error(
            "Change reaction error:",
            error
          );
          return;
        }

        setAnswers(
          (currentAnswers) =>
            currentAnswers.map(
              (item) =>
                item.id ===
                answerId
                  ? {
                      ...item,
                      reaction:
                        reaction,
                    }
                  : item
            )
        );

        return;
      }

      const { error } =
        await supabase
          .from("likes")
          .insert({
            answer_id:
              answerId,
            user_id:
              user.id,
            reaction:
              reaction,
          });

      if (error) {
        console.error(
          "Reaction error:",
          error
        );
        return;
      }

      setAnswers(
        (currentAnswers) =>
          currentAnswers.map(
            (item) =>
              item.id ===
              answerId
                ? {
                    ...item,
                    likes:
                      (item.likes ??
                        0) + 1,
                    reaction:
                      reaction,
                  }
                : item
          )
      );
    } finally {
      setLikingId(null);
    }
  };

  const handleBookmark = async (
    answerId: number
  ) => {
    if (!user) {
      setMessage(
        "Please sign in to save an answer."
      );
      return;
    }

    if (bookmarkingId !== null) {
      return;
    }

    setBookmarkingId(answerId);
    setMessage("");

    try {
      const isBookmarked =
        bookmarkedIds.includes(
          answerId
        );

      if (isBookmarked) {
        const { error } =
          await supabase
            .from("bookmarks")
            .delete()
            .eq(
              "answer_id",
              answerId
            )
            .eq(
              "user_id",
              user.id
            );

        if (error) {
          console.error(
            "Remove bookmark error:",
            {
              message:
                error.message,
              code: error.code,
              details:
                error.details,
              hint:
                error.hint,
            }
          );

          setMessage(
            error.message ||
              "Could not remove bookmark."
          );

          return;
        }

        setBookmarkedIds(
          (current) =>
            current.filter(
              (id) =>
                id !== answerId
            )
        );

        return;
      }

      const { error } =
        await supabase
          .from("bookmarks")
          .insert({
            answer_id:
              answerId,
            user_id:
              user.id,
          });

      if (error) {
        console.error(
          "Bookmark error:",
          {
            message:
              error.message,
            code: error.code,
            details:
              error.details,
            hint:
              error.hint,
          }
        );

        setMessage(
          error.message ||
            "Could not save answer."
        );

        return;
      }

      setBookmarkedIds(
        (current) =>
          current.includes(
            answerId
          )
            ? current
            : [
                ...current,
                answerId,
              ]
      );
    } finally {
      setBookmarkingId(null);
    }
  };

  const handleReplySubmit = async (
    answerId: number
  ) => {
    const cleanReply =
      replyText.trim();

    if (!user) {
      setMessage(
        "Please sign in to reply to an answer."
      );
      return;
    }

    if (!cleanReply) {
      setMessage(
        "Please write a reply first."
      );
      return;
    }

    if (postingReplyId !== null) {
      return;
    }

    setPostingReplyId(answerId);
    setMessage("");

    const {
      data: answerOwner,
      error: ownerError,
    } = await supabase
      .from("answers")
      .select("user_id")
      .eq("id", answerId)
      .single();

    if (ownerError) {
      console.error(
        "Answer owner error:",
        ownerError
      );

      setMessage(
        "Could not find the answer owner."
      );

      setPostingReplyId(null);
      return;
    }

    const { data, error } =
      await supabase
        .from("replies")
        .insert({
          answer_id:
            answerId,
          user_id:
            user.id,
          reply:
            cleanReply,
        })
        .select(
          "id, answer_id, user_id, reply, created_at"
        )
        .single();

    if (error) {
      console.error(
        "Reply error:",
        error
      );

      setMessage(
        "Could not post your reply."
      );

      setPostingReplyId(null);
      return;
    }

    /*
     * NOTIFICATION
     */
    if (
      data &&
      answerOwner?.user_id &&
      answerOwner.user_id !==
        user.id
    ) {
      const {
        error:
          notificationError,
      } = await supabase
        .from("notifications")
        .insert({
          user_id:
            answerOwner.user_id,
          actor_id:
            user.id,
          type: "reply",
          message:
            "Someone replied to your answer.",
          answer_id:
            answerId,
        });

      if (notificationError) {
        console.error(
          "Notification error:",
          {
            message:
              notificationError.message,
            code:
              notificationError.code,
            details:
              notificationError.details,
            hint:
              notificationError.hint,
          }
        );
      }
    }

    if (data) {
      setReplies(
        (currentReplies) => [
          ...currentReplies,
          data,
        ]
      );
    }

    setReplyText("");
    setExpandedReplies(answerId);
    setPostingReplyId(null);

    setMessage(
      "Reply posted! ❤️"
    );

    if (
      answerOwner?.user_id &&
      answerOwner.user_id !==
        user.id
    ) {
      loadUnreadNotifications();
    }
  };

  /*
   * =========================================================
   * IMPROVE ANSWER WITH AI
   * =========================================================
   */

  const handleImproveAnswer = async () => {
    const cleanAnswer =
      answerText.trim();

    if (!cleanAnswer) {
      setMessage(
        "Please write an answer first."
      );
      return;
    }

    if (cleanAnswer.length > 3000) {
      setMessage(
        "Please keep your answer under 3000 characters."
      );
      return;
    }

    if (aiImproving) {
      return;
    }

    setAiImproving(true);
    setAiSuggestion("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/improve-answer",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            answer:
              cleanAnswer,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "AI improve error:",
          data
        );

        setMessage(
          data?.error ||
            "Could not improve your answer."
        );

        return;
      }

      if (!data?.improved) {
        setMessage(
          "AI could not improve this answer."
        );
        return;
      }

      setAiSuggestion(
        data.improved
      );
    } catch (error) {
      console.error(
        "AI request error:",
        error
      );

      setMessage(
        "Could not connect to AI right now."
      );
    } finally {
      setAiImproving(false);
    }
  };

  /*
   * =========================================================
   * AI ANSWER IDEAS
   * =========================================================
   */

  const handleAnswerIdeas = async () => {
    if (!question) {
      return;
    }

    if (aiIdeasLoading) {
      return;
    }

    setAiIdeasLoading(true);
    setAiIdeas([]);
    setMessage("");

    try {
      const response = await fetch(
        "/api/answer-ideas",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question:
              question.question,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data?.error ||
            "Could not generate answer ideas."
        );
        return;
      }

      if (
        !Array.isArray(
          data?.ideas
        ) ||
        data.ideas.length === 0
      ) {
        setMessage(
          "AI could not generate ideas right now."
        );
        return;
      }

      setAiIdeas(
        data.ideas
      );
    } catch (error) {
      console.error(
        "Answer ideas request error:",
        error
      );

      setMessage(
        "Could not connect to AI right now."
      );
    } finally {
      setAiIdeasLoading(false);
    }
  };

  /*
   * =========================================================
   * COMMUNITY SUMMARY
   * =========================================================
   */

  const handleCommunitySummary = async () => {
    if (answers.length === 0) {
      setMessage(
        "There are no answers to summarize yet."
      );
      return;
    }

    if (aiSummaryLoading) {
      return;
    }

    setAiSummaryLoading(true);
    setAiSummary("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/summarize-answers",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            answers:
              answers.map(
                (item) =>
                  item.answer
              ),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data?.error ||
            "Could not summarize answers."
        );
        return;
      }

      if (!data?.summary) {
        setMessage(
          "AI could not create a summary."
        );
        return;
      }

      setAiSummary(
        data.summary
      );
    } catch (error) {
      console.error(
        "Community summary request error:",
        error
      );

      setMessage(
        "Could not connect to AI right now."
      );
    } finally {
      setAiSummaryLoading(false);
    }
  };

  /*
   * =========================================================
   * COMMUNITY INSIGHTS
   * =========================================================
   */

  const handleQuestionInsights = async () => {
    if (
      !question ||
      answers.length === 0
    ) {
      setMessage(
        "There are no answers for AI insights yet."
      );
      return;
    }

    if (aiInsightsLoading) {
      return;
    }

    setAiInsightsLoading(true);
    setAiInsights(null);
    setMessage("");

    try {
      const response = await fetch(
        "/api/question-insights",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question:
              question.question,
            answers:
              answers.map(
                (item) =>
                  item.answer
              ),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data?.error ||
            "Could not generate insights."
        );
        return;
      }

      if (!data?.insight) {
        setMessage(
          "AI could not generate insights."
        );
        return;
      }

      setAiInsights({
        themes:
          Array.isArray(
            data.themes
          )
            ? data.themes
            : [],
        insight:
          data.insight,
      });
    } catch (error) {
      console.error(
        "Question insights request error:",
        error
      );

      setMessage(
        "Could not connect to AI right now."
      );
    } finally {
      setAiInsightsLoading(false);
    }
  };

  /*
   * =========================================================
   * TRANSLATE ANSWER
   * =========================================================
   */

  const handleTranslateAnswer = async (
    answer: Answer
  ) => {
    if (
      translatingId !== null
    ) {
      return;
    }

    const language =
      translateLanguage[
        answer.id
      ] || "English";

    setTranslatingId(answer.id);
    setMessage("");

    try {
      const response = await fetch(
        "/api/translate-answer",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            answer:
              answer.answer,
            language,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data?.error ||
            "Could not translate this answer."
        );
        return;
      }

      if (!data?.translated) {
        setMessage(
          "AI could not translate this answer."
        );
        return;
      }

      setTranslatedAnswers(
        (current) => ({
          ...current,
          [answer.id]:
            data.translated,
        })
      );
    } catch (error) {
      console.error(
        "Translation request error:",
        error
      );

      setMessage(
        "Could not connect to AI right now."
      );
    } finally {
      setTranslatingId(null);
    }
  };

  /*
   * =========================================================
   * FOLLOW-UP QUESTION
   * =========================================================
   */

  const handleFollowUpQuestion = async (
    answer: Answer
  ) => {
    if (!question) {
      return;
    }

    if (followUpId !== null) {
      return;
    }

    setFollowUpId(answer.id);
    setMessage("");

    try {
      const response = await fetch(
        "/api/follow-up-question",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question:
              question.question,
            answer:
              answer.answer,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data?.error ||
            "Could not generate a follow-up question."
        );
        return;
      }

      if (!data?.question) {
        setMessage(
          "AI could not generate a follow-up question."
        );
        return;
      }

      setFollowUpQuestions(
        (current) => ({
          ...current,
          [answer.id]:
            data.question,
        })
      );
    } catch (error) {
      console.error(
        "Follow-up request error:",
        error
      );

      setMessage(
        "Could not connect to AI right now."
      );
    } finally {
      setFollowUpId(null);
    }
  };

  /*
   * =========================================================
   * AI MODERATION
   * =========================================================
   */

  const handleModerateAnswer = async (
    answer: string
  ): Promise<boolean> => {
    if (!answer.trim()) {
      return false;
    }

    setModerating(true);

    try {
      const response = await fetch(
        "/api/moderate-answer",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            answer,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "AI moderation error:",
          data
        );

        /*
         * If AI is temporarily unavailable,
         * don't break normal posting.
         */
        return true;
      }

      if (data?.safe === false) {
        setMessage(
          "This answer may contain content that is not suitable for ONEQUESTION."
        );

        return false;
      }

      return true;
    } catch (error) {
      console.error(
        "AI moderation request error:",
        error
      );

      /*
       * AI failure should not break
       * the normal answer posting flow.
       */
      return true;
    } finally {
      setModerating(false);
    }
  };

  const handleSubmit =
    async (): Promise<void> => {
      if (!question) {
        return;
      }

      const cleanAnswer =
        answerText.trim();

      if (!userName.trim()) {
        setMessage(
          "Please enter your name."
        );
        return;
      }

      if (!country) {
        setMessage(
          "Please select your country."
        );
        return;
      }

      if (!cleanAnswer) {
        setMessage(
          "Please write an answer first."
        );
        return;
      }

      if (!user) {
        localStorage.setItem(
          "pendingAnswer",
          JSON.stringify({
            questionId:
              question.id,
            answer:
              cleanAnswer,
            name:
              userName.trim(),
            country:
              country,
          })
        );

        window.location.href =
          "/signup";

        return;
      }

      /*
       * AI MODERATION
       * Only check after the user is signed in,
       * so anonymous draft submissions don't
       * consume an AI request.
       */
      const moderationPassed =
        await handleModerateAnswer(
          cleanAnswer
        );

      if (!moderationPassed) {
        return;
      }

      setPosting(true);
      setMessage("");

      const { error } =
        await supabase
          .from("answers")
          .insert({
            question_id:
              question.id,
            answer:
              cleanAnswer,
            name:
              userName.trim(),
            country:
              country,
            user_id:
              user.id,
          });

      if (error) {
        console.error(
          "Post answer error:",
          error
        );

        setMessage(
          "Could not post your answer."
        );

        setPosting(false);
        return;
      }

      setAnswerText("");
      setUserName("");
      setCountry("");
      setCountrySearch("");
      setCountryOpen(false);

      setAiSuggestion("");
      setAiIdeas([]);

      setMessage(
        "Your answer was posted! ❤️"
      );

      await loadData();

      setPosting(false);
    };

  const countries = new Set(
    answers
      .map(
        (item) => item.country
      )
      .filter(
        (country) =>
          country &&
          country !== "Other"
      )
  ).size;

  const worldwide = Math.round(
    (countries / 195) * 100
  );

  const getReactionEmoji = (
    reaction?: string
  ) => {
    switch (reaction) {
      case "love":
        return "❤️";

      case "like":
        return "👍";

      case "haha":
        return "😂";

      case "wow":
        return "😮";

      case "sad":
        return "😢";

      case "angry":
        return "😡";

      default:
        return "♡";
    }
  };

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-transparent text-white">
      <SkyBackground />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-10">

        {/* HEADER */}
<header className="relative z-[99999] mb-16">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

    {/* LOGO */}
    <div>
      <a
        href="/"
        className="block transition-opacity hover:opacity-80"
      >
        <h1 className="text-3xl font-bold tracking-tight">
          ONEQUESTION
        </h1>

        <p className="mt-2 text-sm text-white/50">
          One question. One answer. One world.
        </p>
      </a>
    </div>

    {/* RIGHT SIDE */}
    <div className="flex flex-col items-end gap-2">

      {/* ACCOUNT */}
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
          <>
            <a
              href="/profile"
              className="max-w-[180px] truncate text-xs text-white/60 transition hover:text-white sm:text-sm"
            >
              {user.email}
            </a>

            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/80"
            >
              Logout
            </button>
          </>
        )}
      </div>

      {/* NAVIGATION */}
      {user && (
        <div className="relative z-[99999] w-full max-w-full overflow-visible">
          <div className="relative z-[99999] flex w-full min-w-0 items-center justify-start gap-2 overflow-x-auto pb-1 sm:w-full sm:min-w-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0">

            {/* HOME */}
            <a
              href="/"
              className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
              Home
            </a>

            {/* EXPLORE */}
            <a
              href="/explore"
              className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
              Explore
            </a>

            {/* WORLD */}
            <a
              href="/world"
              className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
              World
            </a>

            {/* POPULAR */}
            <a
              href="/popular"
              className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
              Popular
            </a>

            {/* LEADERBOARD */}
            <a
              href="/leaderboard"
              className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
               Leaderboard
            </a>

            {/* MORE */}
            <div
              className="relative shrink-0"
              onMouseEnter={() => setMoreMenuOpen(true)}
            >
              <button
                type="button"
                className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
              >
                More

                <span
                  className={`text-white/50 transition-transform duration-300 ${
                    moreMenuOpen ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </button>

              {/* MORE DROPDOWN */}
              <div
                onMouseLeave={() => setMoreMenuOpen(false)}
                className={`absolute right-0 top-full z-[99999] w-52 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-[#080808]/95 p-2 shadow-2xl backdrop-blur-xl transition-all duration-200 ${
                  moreMenuOpen
                    ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                    : "pointer-events-none -translate-y-2 scale-95 opacity-0"
                }`}
              >

                {/* ARCHIVE */}
                <a
                  href="/archive"
                  className="block rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                   Archive
                </a>

                {/* CONTRIBUTORS */}
                <a
                  href="/contributors"
                  className="block rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                   Contributors
                </a>

                {/* SAVED */}
                <a
                  href="/saved"
                  className="block rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                   Saved
                </a>

                {/* PROFILE */}
                <a
                  href="/profile"
                  className="block rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                   Profile
                </a>

                {/* NOTIFICATIONS */}
                <a
                  href="/notifications"
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <span> Notifications</span>

                  {unreadNotifications > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unreadNotifications}
                    </span>
                  )}
                </a>

                {/* HOW IT WORKS */}
                <a
                  href="/how-it-works"
                  className="block rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                   How It Works
                </a>

                {/* ABOUT */}
                <a
                  href="/about"
                  className="block rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                   About
                </a>

                {/* ADMIN DASHBOARD */}
{isAdmin && (
  <a
    href="/admin"
    className="mt-1 block rounded-xl border-t border-white/10 px-3 py-2.5 pt-3 text-sm text-red-300 transition hover:bg-red-400/10 hover:text-red-200"
  >
    🛡️ Admin Dashboard
  </a>
)}

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  </div>
</header>


        {/* QUESTION */}
        <ScrollReveal delay={100}>
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

                <h2 className="break-words text-2xl font-semibold leading-tight sm:text-3xl md:text-5xl">
                  {question.question}
                </h2>
              </>
            ) : (
              <p className="text-white/50">
                No active question found.
              </p>
            )}
          </section>
        </ScrollReveal>

        {/* ANSWER BOX */}
        {question && (
          <ScrollReveal delay={150}>
            <section className="mx-auto mb-16 max-w-2xl">

              <input
                type="text"
                value={userName}
                onChange={(e) =>
                  setUserName(
                    e.target.value
                  )
                }
                placeholder="Your name..."
                className="mb-3 w-full rounded-2xl border border-white/20 bg-black/20 p-4 text-lg text-white outline-none backdrop-blur-md transition placeholder:text-white/50 focus:border-white/40 focus:bg-black/25"
              />

              {/* =====================================================
                  CUSTOM COUNTRY DROPDOWN
              ===================================================== */}

              <div
                ref={
                  countryDropdownRef
                }
                className="relative mb-3"
              >
                <button
                  type="button"
                  onClick={() => {
                    setCountryOpen(
                      (current) =>
                        !current
                    );

                    if (
                      countryOpen
                    ) {
                      setCountrySearch(
                        ""
                      );
                    }
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/20 bg-black/20 p-4 text-left text-lg text-white outline-none backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-black/25 focus:border-white/40"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {country ? (
                      <>
                        {countryFlags[
                          country
                        ] ? (
                          <img
                            src={`https://flagcdn.com/w40/${countryFlags[country]}.png`}
                            alt=""
                            className="h-6 w-9 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <span className="text-xl">
                            🌍
                          </span>
                        )}

                        <span className="truncate">
                          {country}
                        </span>
                      </>
                    ) : (
                      <span className="text-white/50">
                        Select your country...
                      </span>
                    )}
                  </span>

                  <span
                    className={`ml-3 shrink-0 text-white/50 transition-transform duration-300 ${
                      countryOpen
                        ? "rotate-180"
                        : "rotate-0"
                    }`}
                  >
                    ▼
                  </span>
                </button>

                <div
                  className={`absolute left-0 right-0 top-full z-[100] mt-2 origin-top overflow-hidden rounded-2xl border border-white/15 bg-[#090909]/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out ${
                    countryOpen
                      ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                      : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0"
                  }`}
                >
                  <div className="border-b border-white/10 p-3">
                    <div className="relative shrink-0">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/40">
                        🔎
                      </span>

                      <input
                        type="text"
                        value={
                          countrySearch
                        }
                        onChange={(
                          e
                        ) =>
                          setCountrySearch(
                            e.target.value
                          )
                        }
                        onClick={(
                          e
                        ) =>
                          e.stopPropagation()
                        }
                        autoFocus={
                          countryOpen
                        }
                        placeholder="Search country..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/25 focus:bg-white/10"
                      />
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto p-2 [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
                    {filteredCountries.length ===
                    0 ? (
                      <div className="px-4 py-6 text-center text-sm text-white/40">
                        No country found.
                      </div>
                    ) : (
                      filteredCountries.map(
                        (
                          item
                        ) => (
                          <button
                            key={
                              item
                            }
                            type="button"
                            onClick={() => {
                              setCountry(
                                item
                              );
                              setCountryOpen(
                                false
                              );
                              setCountrySearch(
                                ""
                              );
                              setMessage(
                                ""
                              );
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                              country ===
                              item
                                ? "bg-white/12 text-white"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {countryFlags[
                              item
                            ] ? (
                              <img
                                src={`https://flagcdn.com/w40/${countryFlags[item]}.png`}
                                alt=""
                                className="h-5 w-8 shrink-0 rounded object-cover"
                              />
                            ) : (
                              <span className="flex h-5 w-8 shrink-0 items-center justify-center">
                                🌍
                              </span>
                            )}

                            <span className="min-w-0 flex-1 truncate">
                              {
                                item
                              }
                            </span>

                            {country ===
                              item && (
                              <span className="text-xs text-white/60">
                                ✓
                              </span>
                            )}
                          </button>
                        )
                      )
                    )}
                  </div>
                </div>
              </div>

              <textarea
                value={answerText}
                onChange={(e) =>
                  setAnswerText(
                    e.target.value
                  )
                }
                placeholder="Write your answer..."
                rows={6}
                className="w-full resize-none rounded-2xl border border-white/20 bg-black/20 p-5 text-lg text-white outline-none backdrop-blur-md transition placeholder:text-white/50 focus:border-white/40 focus:bg-black/25"
              />

              {/* =====================================================
                  AI IMPROVE BUTTON
              ===================================================== */}

              {answerText.trim() && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={
                      handleImproveAnswer
                    }
                    disabled={aiImproving}
                    className="rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm font-medium text-violet-200 transition-all duration-300 hover:border-violet-400/40 hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {aiImproving
                      ? "✨ Improving..."
                      : "✨ Improve with AI"}
                  </button>
                </div>
              )}

              {/* =====================================================
                  AI ANSWER IDEAS
              ===================================================== */}

              <div className="mt-3">
                <button
                  type="button"
                  onClick={
                    handleAnswerIdeas
                  }
                  disabled={
                    aiIdeasLoading
                  }
                  className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {aiIdeasLoading
                    ? "💡 Thinking..."
                    : "💡 Need an idea?"}
                </button>
              </div>

              {aiIdeas.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-cyan-200">
                      💡 Answer ideas
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setAiIdeas(
                          []
                        )
                      }
                      className="text-xs text-white/40 transition hover:text-white/80"
                    >
                      Close
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {aiIdeas.map(
                      (
                        idea,
                        index
                      ) => (
                        <button
                          key={
                            index
                          }
                          type="button"
                          onClick={() => {
                            setAnswerText(
                              idea
                            );

                            setAiIdeas(
                              []
                            );

                            setMessage(
                              ""
                            );
                          }}
                          className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-left text-sm leading-6 text-white/75 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                        >
                          {
                            idea
                          }
                        </button>
                      )
                    )}
                  </div>

                  <p className="mt-3 text-xs text-white/30">
                    AI ideas are just inspiration — make the answer your own.
                  </p>
                </div>
              )}

              {/* =====================================================
                  AI SUGGESTION
              ===================================================== */}

              {aiSuggestion && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-violet-200">
                      ✨ AI suggestion
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setAiSuggestion("")
                      }
                      className="text-xs text-white/40 transition hover:text-white/80"
                    >
                      Close
                    </button>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-white/80">
                    {aiSuggestion}
                  </p>

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAnswerText(
                          aiSuggestion
                        );

                        setAiSuggestion(
                          ""
                        );

                        setMessage(
                          ""
                        );
                      }}
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/80"
                    >
                      Use this
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setAiSuggestion("")
                      }
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      Keep mine
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-col items-center gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={
                    posting ||
                    moderating
                  }
                  className="rounded-full bg-white px-8 py-3 font-semibold text-black transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {posting
                    ? "Posting..."
                    : moderating
                      ? "Checking..."
                      : "Post Answer"}
                </button>

                {message && (
                  <p className="max-w-full break-words text-center text-sm text-white/60">
                    {message}
                  </p>
                )}
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* =====================================================
            STATS
            NUMBER ANIMATION
        ===================================================== */}

        <section className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <ScrollReveal>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center transition-transform duration-500 hover:-translate-y-1">
              <AnimatedNumber
                value={answers.length}
                duration={1200}
              />

              <p className="mt-2 text-sm text-white/40">
                Answers
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center transition-transform duration-500 hover:-translate-y-1">
              <AnimatedNumber
                value={countries}
                duration={1400}
              />

              <p className="mt-2 text-sm text-white/40">
                Countries
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center transition-transform duration-500 hover:-translate-y-1">
              <AnimatedNumber
                value={worldwide}
                suffix="%"
                duration={1600}
              />

              <p className="mt-2 text-sm text-white/40">
                World Coverage
              </p>
            </div>
          </ScrollReveal>

        </section>

        {/* ANSWERS */}
        <section className="[overflow-anchor:none]">
          <ScrollReveal>
            <div className="mb-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    Community Answers
                  </h3>

                  <span className="mt-1 block text-sm text-white/30">
                    {answers.length} responses
                  </span>
                </div>

                {answers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={
                        handleCommunitySummary
                      }
                      disabled={
                        aiSummaryLoading
                      }
                      className="rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-xs font-medium text-violet-200 transition hover:border-violet-400/40 hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {aiSummaryLoading
                        ? "✨ Summarizing..."
                        : "✨ AI Summary"}
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleQuestionInsights
                      }
                      disabled={
                        aiInsightsLoading
                      }
                      className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-200 transition hover:border-emerald-400/40 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {aiInsightsLoading
                        ? "🌍 Analyzing..."
                        : "🌍 AI Insights"}
                    </button>
                  </div>
                )}
              </div>

              {aiSummary && (
                <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-400/10 p-5 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-violet-200">
                      ✨ Community summary
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setAiSummary(
                          ""
                        )
                      }
                      className="text-xs text-white/40 transition hover:text-white/80"
                    >
                      Close
                    </button>
                  </div>

                  <p className="mt-3 break-words text-sm leading-7 text-white/75">
                    {aiSummary}
                  </p>
                </div>
              )}

              {aiInsights && (
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-emerald-200">
                      🌍 Community insights
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setAiInsights(
                          null
                        )
                      }
                      className="text-xs text-white/40 transition hover:text-white/80"
                    >
                      Close
                    </button>
                  </div>

                  {aiInsights.themes
                    .length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {aiInsights.themes.map(
                        (
                          theme,
                          index
                        ) => (
                          <span
                            key={
                              index
                            }
                            className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/70"
                          >
                            {
                              theme
                            }
                          </span>
                        )
                      )}
                    </div>
                  )}

                  <p className="mt-4 break-words text-sm leading-7 text-white/75">
                    {
                      aiInsights.insight
                    }
                  </p>
                </div>
              )}
            </div>
          </ScrollReveal>

          {loading ? (
            <ScrollReveal>
              <p className="text-white/40">
                Loading answers...
              </p>
            </ScrollReveal>
          ) : answers.length === 0 ? (
            <ScrollReveal>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <p className="text-white/50">
                  No answers yet.
                </p>

                <p className="mt-2 text-sm text-white/30">
                  Be the first person to answer.
                </p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="space-y-4">

              <div className="mb-6">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                  placeholder="Search answers..."
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 text-sm text-white outline-none backdrop-blur-sm transition focus:border-white/20"
                />
              </div>

              {answers
                .filter((item) =>
                  `${item.answer} ${item.name} ${item.country}`
                    .toLowerCase()
                    .includes(
                      searchTerm.toLowerCase()
                    )
                )
                .map(
                  (
                    item,
                    index
                  ) => {
                    const answerReplies =
                      replies.filter(
                        (reply) =>
                          reply.answer_id ===
                          item.id
                      );

                    const isExpanded =
                      expandedReplies ===
                      item.id;

                    const isBookmarked =
                      bookmarkedIds.includes(
                        item.id
                      );

                    return (
                      <ScrollReveal
                        key={item.id}
                        delay={
                          index * 100
                        }
                      >
                        <article className="min-w-0 transform-gpu rounded-2xl border border-white/15 bg-black/30 p-4 backdrop-blur-sm sm:p-6">

                          {/* USER */}
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-start gap-3">

                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10">
                                {countryFlags[
                                  item.country
                                ] ? (
                                  <img
                                    src={`https://flagcdn.com/w80/${countryFlags[item.country]}.png`}
                                    alt={
                                      item.country
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xl">
                                    🌍
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                  {
                                    item.name
                                  }
                                </p>

                                <p className="text-xs text-white/30">
                                  Community member
                                </p>
                              </div>

                            </div>
                          </div>

                          {/* ANSWER */}
                          <div>
                            <p className="break-words whitespace-pre-wrap leading-7 text-white/80">
                              {searchTerm ? (
                                item.answer
                                  .split(
                                    new RegExp(
                                      `(${searchTerm})`,
                                      "gi"
                                    )
                                  )
                                  .map(
                                    (
                                      part,
                                      i
                                    ) =>
                                      part.toLowerCase() ===
                                      searchTerm.toLowerCase() ? (
                                        <mark
                                          key={
                                            i
                                          }
                                          className="rounded bg-white/30 px-0.5 text-black"
                                        >
                                          {
                                            part
                                          }
                                        </mark>
                                      ) : (
                                        part
                                      )
                                  )
                              ) : (
                                item.answer
                              )}
                            </p>

                            {translatedAnswers[
                              item.id
                            ] && (
                              <div className="mt-3 rounded-xl border border-blue-400/20 bg-blue-400/10 p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-xs font-semibold text-blue-200">
                                    🌐 Translation
                                  </p>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setTranslatedAnswers(
                                        (
                                          current
                                        ) => {
                                          const next =
                                            {
                                              ...current,
                                            };

                                          delete next[
                                            item.id
                                          ];

                                          return next;
                                        }
                                      )
                                    }
                                    className="text-xs text-white/40 transition hover:text-white/80"
                                  >
                                    Close
                                  </button>
                                </div>

                                <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-6 text-white/75">
                                  {
                                    translatedAnswers[
                                      item.id
                                    ]
                                  }
                                </p>
                              </div>
                            )}
                          </div>

                          {/* LIKE + REPLY + SHARE + BOOKMARK */}
                          <div className="mt-4 flex flex-wrap justify-end gap-2">

                            {/* TRANSLATE */}
<div className="flex shrink-0 items-center gap-1">

  <div className="relative">

    <button
      type="button"
      onClick={() => {
        setTranslateOpenId((current) =>
          current === item.id ? null : item.id
        );

        setTranslateSearch((current) => ({
          ...current,
          [item.id]: "",
        }));
      }}
      className="flex min-w-[120px] items-center justify-between gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-2 text-xs text-white outline-none backdrop-blur-md transition-all duration-300 hover:bg-white/10"
    >
      <span>
        {translateLanguage[item.id] || "English"}
      </span>

      <span
        className={`text-white/50 transition-transform duration-300 ${
          translateOpenId === item.id
            ? "rotate-180"
            : ""
        }`}
      >
        ▾
      </span>
    </button>

    <div
      className={`absolute bottom-full left-0 z-[80] mb-2 w-52 origin-bottom overflow-hidden rounded-2xl border border-white/10 bg-[#080808]/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
        translateOpenId === item.id
          ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-2 scale-95 opacity-0"
      }`}
    >

      <div className="border-b border-white/10 p-2">
        <input
          type="text"
          value={translateSearch[item.id] || ""}
          onChange={(e) =>
            setTranslateSearch((current) => ({
              ...current,
              [item.id]: e.target.value,
            }))
          }
          placeholder="Search language..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white outline-none transition focus:border-white/25 focus:bg-white/10 placeholder:text-white/35"
        />
      </div>

      <div className="translate-scroll max-h-56 overflow-y-auto p-2">

        {translateLanguages
          .filter((language) =>
            language
              .toLowerCase()
              .includes(
                (
                  translateSearch[item.id] || ""
                ).toLowerCase()
              )
          )
          .map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => {
                setTranslateLanguage(
                  (current) => ({
                    ...current,
                    [item.id]: language,
                  })
                );

                setTranslateOpenId(null);

                setTranslateSearch(
                  (current) => ({
                    ...current,
                    [item.id]: "",
                  })
                );
              }}
              className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-xs transition-all duration-200 ${
                translateLanguage[item.id] ===
                language
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {language}
            </button>
          ))}

        {translateLanguages.filter((language) =>
          language
            .toLowerCase()
            .includes(
              (
                translateSearch[item.id] || ""
              ).toLowerCase()
            )
        ).length === 0 && (
          <p className="px-3 py-3 text-xs text-white/40">
            No language found.
          </p>
        )}

      </div>
    </div>
  </div>

  <button
    type="button"
    onClick={() =>
      handleTranslateAnswer(item)
    }
    disabled={
      translatingId === item.id
    }
    className="shrink-0 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-200 transition hover:border-blue-400/40 hover:bg-blue-400/20 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {translatingId === item.id
      ? "🌐 ..."
      : "🌐 Translate"}
  </button>

</div>

                            {/* FOLLOW-UP */}
                            <button
                              type="button"
                              onClick={() =>
                                handleFollowUpQuestion(
                                  item
                                )
                              }
                              disabled={
                                followUpId ===
                                item.id
                              }
                              className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200 transition hover:border-emerald-400/40 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {followUpId ===
                              item.id
                                ? "💭 ..."
                                : "💭 Follow-up"}
                            </button>

                            {/* REACTIONS */}
                            <div className="relative shrink-0">

                              <button
                                type="button"
                                disabled={
                                  likingId ===
                                  item.id
                                }
                                onPointerDown={(
                                  e
                                ) => {
                                  try {
                                    e.currentTarget.setPointerCapture(
                                      e.pointerId
                                    );
                                  } catch {}

                                  handleReactionPointerDown(
                                    item.id
                                  );
                                }}
                                onPointerUp={(
                                  e
                                ) => {
                                  try {
                                    if (
                                      e.currentTarget.hasPointerCapture(
                                        e.pointerId
                                      )
                                    ) {
                                      e.currentTarget.releasePointerCapture(
                                        e.pointerId
                                      );
                                    }
                                  } catch {}

                                  handleReactionPointerUp(
                                    item.id
                                  );
                                }}
                                onPointerCancel={
                                  handleReactionPointerCancel
                                }
                                className={`touch-none select-none rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-all duration-200 hover:bg-white/10 ${
                                  item.reaction
                                    ? "scale-[1.02]"
                                    : ""
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                              >
                                {likingId ===
                                item.id
                                  ? "❤️ ..."
                                  : `${getReactionEmoji(
                                      item.reaction
                                    )} ${
                                      item.likes ??
                                      0
                                    }`}
                              </button>

                              {/* REACTION BAR */}
                              {reactionOpenId ===
                                item.id && (
                                <div className="absolute bottom-full right-0 z-50 mb-2 flex items-center gap-1 rounded-full border border-white/10 bg-black/80 px-2 py-2 shadow-2xl backdrop-blur-xl">

                                  <button
                                    type="button"
                                    onPointerDown={(
                                      e
                                    ) =>
                                      e.stopPropagation()
                                    }
                                    onClick={() =>
                                      handleReaction(
                                        item.id,
                                        "love"
                                      )
                                    }
                                    className="text-2xl transition-transform duration-150 hover:scale-125 active:scale-110"
                                    title="Love"
                                  >
                                    ❤️
                                  </button>

                                  <button
                                    type="button"
                                    onPointerDown={(
                                      e
                                    ) =>
                                      e.stopPropagation()
                                    }
                                    onClick={() =>
                                      handleReaction(
                                        item.id,
                                        "like"
                                      )
                                    }
                                    className="text-2xl transition-transform duration-150 hover:scale-125 active:scale-110"
                                    title="Like"
                                  >
                                    👍
                                  </button>

                                  <button
                                    type="button"
                                    onPointerDown={(
                                      e
                                    ) =>
                                      e.stopPropagation()
                                    }
                                    onClick={() =>
                                      handleReaction(
                                        item.id,
                                        "haha"
                                      )
                                    }
                                    className="text-2xl transition-transform duration-150 hover:scale-125 active:scale-110"
                                    title="Haha"
                                  >
                                    😂
                                  </button>

                                  <button
                                    type="button"
                                    onPointerDown={(
                                      e
                                    ) =>
                                      e.stopPropagation()
                                    }
                                    onClick={() =>
                                      handleReaction(
                                        item.id,
                                        "wow"
                                      )
                                    }
                                    className="text-2xl transition-transform duration-150 hover:scale-125 active:scale-110"
                                    title="Wow"
                                  >
                                    😮
                                  </button>

                                  <button
                                    type="button"
                                    onPointerDown={(
                                      e
                                    ) =>
                                      e.stopPropagation()
                                    }
                                    onClick={() =>
                                      handleReaction(
                                        item.id,
                                        "sad"
                                      )
                                    }
                                    className="text-2xl transition-transform duration-150 hover:scale-125 active:scale-110"
                                    title="Sad"
                                  >
                                    😢
                                  </button>

                                  <button
                                    type="button"
                                    onPointerDown={(
                                      e
                                    ) =>
                                      e.stopPropagation()
                                    }
                                    onClick={() =>
                                      handleReaction(
                                        item.id,
                                        "angry"
                                      )
                                    }
                                    className="text-2xl transition-transform duration-150 hover:scale-125 active:scale-110"
                                    title="Angry"
                                  >
                                    😡
                                  </button>

                                </div>
                              )}
                            </div>

                            {/* REPLIES */}
                            <button
                              type="button"
                              onClick={() => {
                                setMessage("");

                                if (
                                  isExpanded
                                ) {
                                  setExpandedReplies(
                                    null
                                  );

                                  setReplyingId(
                                    null
                                  );

                                  setReplyText(
                                    ""
                                  );
                                } else {
                                  setExpandedReplies(
                                    item.id
                                  );

                                  if (user) {
                                    setReplyingId(
                                      item.id
                                    );

                                    setReplyText(
                                      ""
                                    );
                                  }
                                }
                              }}
                              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                            >
                              💬{" "}
                              {
                                answerReplies.length
                              }{" "}
                              {answerReplies.length ===
                              1
                                ? "Reply"
                                : "Replies"}
                            </button>

                            {/* SHARE */}
                            <button
                              type="button"
                              onClick={() =>
                                handleShare(
                                  item
                                )
                              }
                              disabled={
                                sharingId ===
                                item.id
                              }
                              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {sharingId ===
                              item.id
                                ? "🔗 ..."
                                : "🔗 Share"}
                            </button>

                            {/* BOOKMARK */}
                            {user && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleBookmark(
                                    item.id
                                  )
                                }
                                disabled={
                                  bookmarkingId ===
                                  item.id
                                }
                                className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-all duration-300 ${
                                  isBookmarked
                                    ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-300"
                                    : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                              >
                                <span
                                  className={`inline-flex items-center gap-1 transition-all duration-300 ${
                                    isBookmarked
                                      ? "scale-105"
                                      : "scale-100"
                                  }`}
                                >
                                  {bookmarkingId ===
                                  item.id
                                    ? "🔖 ..."
                                    : isBookmarked
                                      ? "🔖 Saved"
                                      : "🔖 Save"}
                                </span>
                              </button>
                            )}

                          </div>

                          {/* FOLLOW-UP RESULT */}
                          {followUpQuestions[
                            item.id
                          ] && (
                            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 backdrop-blur-md">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold text-emerald-200">
                                  💭 AI follow-up question
                                </p>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setFollowUpQuestions(
                                      (
                                        current
                                      ) => {
                                        const next =
                                          {
                                            ...current,
                                          };

                                        delete next[
                                          item.id
                                        ];

                                        return next;
                                      }
                                    )
                                  }
                                  className="text-xs text-white/40 transition hover:text-white/80"
                                >
                                  Close
                                </button>
                              </div>

                              <p className="mt-2 break-words text-sm leading-6 text-white/80">
                                {
                                  followUpQuestions[
                                    item.id
                                  ]
                                }
                              </p>
                            </div>
                          )}

                          {/* REPLY INPUT */}
                          {replyingId ===
                            item.id &&
                            user && (
                              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4">

                                <textarea
                                  value={
                                    replyText
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    setReplyText(
                                      e
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder="Write a reply..."
                                  rows={3}
                                  className="w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
                                />

                                <div className="mt-3 flex justify-end gap-2">

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingId(
                                        null
                                      );

                                      setReplyText(
                                        ""
                                      );
                                    }}
                                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                                  >
                                    Cancel
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleReplySubmit(
                                        item.id
                                      )
                                    }
                                    disabled={
                                      postingReplyId ===
                                      item.id
                                    }
                                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {postingReplyId ===
                                    item.id
                                      ? "Posting..."
                                      : "Post Reply"}
                                  </button>

                                </div>
                              </div>
                            )}

                          {/* EXPANDABLE REPLIES */}
                          <div
                            className={`grid transition-all duration-500 ease-out ${
                              isExpanded
                                ? "mt-5 grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0"
                            }`}
                          >
                            <div className="min-h-0 overflow-hidden">
                              <div className="space-y-3 border-t border-white/10 pt-4">

                                {answerReplies.length ===
                                0 ? (
                                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">

                                    <p className="text-sm text-white/40">
                                      No replies yet.
                                    </p>

                                    {!user && (
                                      <p className="mt-1 text-xs text-white/25">
                                        Sign in to add a
                                        reply.
                                      </p>
                                    )}

                                  </div>
                                ) : (
                                  <>
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                                      Replies
                                    </p>

                                    {answerReplies.map(
                                      (
                                        reply,
                                        replyIndex
                                      ) => (
                                        <div
                                          key={
                                            reply.id
                                          }
                                          className="translate-y-0 animate-[replyIn_500ms_ease-out_forwards] rounded-xl border border-white/10 bg-white/5 p-4"
                                          style={{
                                            animationDelay: `${replyIndex * 80}ms`,
                                            opacity: 0,
                                          }}
                                        >
                                          <p className="break-words whitespace-pre-wrap text-sm leading-6 text-white/75">
                                            {
                                              reply.reply
                                            }
                                          </p>

                                          <p className="mt-2 text-xs text-white/30">
                                            Community member
                                          </p>
                                        </div>
                                      )
                                    )}
                                  </>
                                )}

                              </div>
                            </div>
                          </div>

                        </article>
                      </ScrollReveal>
                    );
                  }
                )}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <ScrollReveal delay={100}>
          <footer className="mt-20 border-t border-white/10 pt-8 text-center">
            <p className="text-sm text-white/30">
              ONEQUESTION © 2026
            </p>
          </footer>
        </ScrollReveal>

      </div>

      <style jsx global>{`
      .translate-scroll::-webkit-scrollbar {
  width: 5px;
}

.translate-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.translate-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999px;
}

.translate-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.32);
}
        @keyframes replyIn {
          from {
            opacity: 0;
            transform: translateY(12px)
              scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0)
              scale(1);
          }
        }
      `}</style>
    </main>
  );
}