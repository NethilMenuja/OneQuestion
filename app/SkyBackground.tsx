"use client";

import { useEffect, useMemo, useState } from "react";

export default function SkyBackground() {
  const [now, setNow] = useState<Date | null>(null);
  const [scrollY, setScrollY] = useState(0);

  /* =========================================================
     LIVE TIME
  ========================================================= */

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  /* =========================================================
     SCROLL
  ========================================================= */

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  const minutes =
  now === null
    ? 0
    : now.getHours() * 60 +
      now.getMinutes() +
      now.getSeconds() / 60;

  /* =========================================================
     DAY / NIGHT
  ========================================================= */

  const sunrise = 5 * 60 + 30;
  const sunset = 18 * 60 + 30;

  const dayLength = sunset - sunrise;

  const isDay =
    minutes >= sunrise &&
    minutes < sunset;

  const isNight = !isDay;

  /*
   * 0 = sunrise
   * 0.5 = noon
   * 1 = sunset
   */
  const dayProgress = isDay
    ? (minutes - sunrise) / dayLength
    : 0;

  /* =========================================================
     SKY
  ========================================================= */

  const sky = useMemo(() => {
    const clamp = (v: number) =>
      Math.max(0, Math.min(1, v));

    const smooth = (v: number) =>
      v * v * (3 - 2 * v);

    /* -----------------------------------------
       Daylight
    ----------------------------------------- */

    let daylight = 0;

    if (
      minutes >= sunrise &&
      minutes <= sunset
    ) {
      daylight = Math.sin(
        ((minutes - sunrise) / dayLength) *
          Math.PI
      );
    }

    daylight = smooth(clamp(daylight));

    /* -----------------------------------------
       Sunrise / Sunset
    ----------------------------------------- */

    const sunriseGlow = clamp(
      1 -
        Math.abs(minutes - sunrise) /
          90
    );

    const sunsetGlow = clamp(
      1 -
        Math.abs(minutes - sunset) /
          90
    );

    const warm = Math.max(
      sunriseGlow,
      sunsetGlow
    );

    /* -----------------------------------------
       NIGHT
    ----------------------------------------- */

    let top = "#02050c";
    let middle = "#071321";
    let bottom = "#101b28";

    /* -----------------------------------------
       DAY
    ----------------------------------------- */

    if (daylight > 0.01) {
      const d = daylight;

      top = mixColor(
        "#182c49",
        "#2486c7",
        d
      );

      middle = mixColor(
        "#355878",
        "#79badb",
        d
      );

      bottom = mixColor(
        "#75686b",
        "#c9e5ed",
        d
      );
    }

    /* -----------------------------------------
       SUNRISE / SUNSET
    ----------------------------------------- */

    if (warm > 0.08) {
      top = mixColor(
        top,
        "#3b3553",
        warm * 0.55
      );

      middle = mixColor(
        middle,
        "#d96f68",
        warm * 0.72
      );

      bottom = mixColor(
        bottom,
        "#ffb36f",
        warm * 0.82
      );
    }

    return {
      top,
      middle,
      bottom,
      daylight,
      night: 1 - daylight,
      warm,
      sunriseGlow,
      sunsetGlow,
    };
  }, [minutes]);

  /* =========================================================
     SUN POSITION
  ========================================================= */

  const sunX =
    50 +
    Math.cos(dayProgress * Math.PI) *
      43;

  const sunY =
    78 -
    Math.sin(dayProgress * Math.PI) *
      62;

  /* =========================================================
     MOON POSITION
  ========================================================= */

  const nightLength =
    24 * 60 -
    sunset +
    sunrise;

  const nightElapsed =
    minutes >= sunset
      ? minutes - sunset
      : minutes +
        24 * 60 -
        sunset;

  /*
   * Real moon position based on actual clock.
   *
   * This gives:
   *
   * sunset  -> right
   * midnight -> top
   * sunrise -> left
   */
  const moonProgress =
    Math.max(
      0,
      Math.min(
        1,
        nightElapsed / nightLength
      )
    );

  const moonX =
    50 +
    Math.cos(
      moonProgress * Math.PI
    ) * 43;

  const moonY =
    50 -
    Math.sin(
      moonProgress * Math.PI
    ) * 34;

  /* =========================================================
     MOUNTAIN
  ========================================================= */

  const mountainBrightness =
    0.42 +
    sky.daylight * 0.58;

  const mountainContrast =
    0.95 +
    sky.daylight * 0.15;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">

      {/* =====================================================
          SKY
      ===================================================== */}

      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              180deg,
              ${sky.top} 0%,
              ${sky.middle} 48%,
              ${sky.bottom} 100%
            )
          `,
          transition:
            "background 8s ease",
        }}
      />

      {/* =====================================================
          ATMOSPHERIC LIGHT
      ===================================================== */}

      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              ellipse at 50% 72%,
              rgba(
                255,
                195,
                130,
                ${0.04 + sky.warm * 0.32}
              ),
              transparent 55%
            ),

            radial-gradient(
              ellipse at 50% 20%,
              rgba(
                130,
                190,
                235,
                ${0.03 + sky.daylight * 0.1}
              ),
              transparent 62%
            )
          `,
          transition:
            "background 8s ease",
        }}
      />

      {/* =====================================================
          STARS
          IMPORTANT:
          Visible at NIGHT.
      ===================================================== */}

      <div
        className="absolute inset-0"
        style={{
          opacity: isNight
            ? 0.95
            : Math.max(
                0,
                1 -
                  sky.daylight *
                    4
              ),

          transition:
            "opacity 8s ease",
        }}
      >
        {STARS.map(
          (star, index) => (
            <div
              key={index}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity:
                  star.opacity,

                boxShadow:
                  star.size > 1.4
                    ? "0 0 8px rgba(255,255,255,0.75)"
                    : "none",

                animation: `
                  starPulse
                  ${2.5 +
                    (index % 5) *
                      0.8}s
                  ease-in-out
                  ${index % 4}s
                  infinite alternate
                `,
              }}
            />
          )
        )}
      </div>

      {/* =====================================================
          MOUNTAINS
      ===================================================== */}

      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "68%",

          backgroundImage:
            "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=90')",

          backgroundPosition:
            "center bottom",

          backgroundSize:
            "cover",

          backgroundRepeat:
            "no-repeat",

          animation:
            "mountainDrift 45s ease-in-out infinite alternate",

          willChange:
            "transform",

          filter: `
            brightness(${mountainBrightness})
            contrast(${mountainContrast})
            saturate(${0.72 +
              sky.daylight * 0.28})
          `,

          opacity: 0.95,

          transition:
            "filter 8s ease, opacity 8s ease",

          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 20%, black 100%)",

          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 20%, black 100%)",
        }}
      />

      {/* =====================================================
          MOUNTAIN HAZE
      ===================================================== */}

      <div
        className="absolute inset-x-0 bottom-[22%] h-[30%]"
        style={{
          background: `
            linear-gradient(
              to bottom,
              rgba(
                210,
                225,
                235,
                ${0.02 +
                  sky.daylight *
                    0.1}
              ),
              rgba(
                180,
                205,
                220,
                ${0.06 +
                  sky.daylight *
                    0.08}
              ),
              transparent
            )
          `,

          filter:
            "blur(8px)",

          transition:
            "background 8s ease",
        }}
      />

      {/* =====================================================
          SUN
      ===================================================== */}

      <div
        className="absolute pointer-events-none"
        style={{
          left: `${sunX}%`,
          top: `${sunY}%`,

          width:
            "clamp(90px, 10vw, 150px)",

          height:
            "clamp(90px, 10vw, 150px)",

          transform:
            "translate(-50%, -50%)",

          opacity:
            isDay ? 1 : 0,

          transition:
            "left 1s linear, top 1s linear, opacity 8s ease",

          borderRadius:
            "50%",

          background: `
            radial-gradient(
              circle,
              rgba(255,255,255,1) 0%,
              rgba(255,252,225,1) 10%,
              rgba(255,236,170,0.98) 20%,
              rgba(255,205,105,0.65) 36%,
              rgba(255,180,70,0.28) 52%,
              rgba(255,160,50,0.10) 68%,
              transparent 82%
            )
          `,

          filter:
            "blur(0.6px)",

          boxShadow: `
            0 0 25px rgba(255,245,200,0.9),
            0 0 55px rgba(255,220,140,0.65),
            0 0 100px rgba(255,190,80,0.42),
            0 0 180px rgba(255,170,60,0.22)
          `,

          zIndex: 10,
        }}
      />

      {/* =====================================================
          MOON
      ===================================================== */}

      <div
        className="absolute pointer-events-none"
        style={{
          left: `${moonX}%`,
          top: `${moonY}%`,

          width:
            "clamp(72px, 6vw, 105px)",

          height:
            "clamp(72px, 6vw, 105px)",

          transform:
            "translate(-50%, -50%)",

          opacity:
            isNight ? 1 : 0,

          transition:
            "left 1s linear, top 1s linear, opacity 8s ease",

          zIndex: 5,

          borderRadius:
            "50%",

          clipPath:
            "circle(50%)",

          backgroundImage:
            "url('https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&w=900&q=95')",

          backgroundSize:
            "cover",

          backgroundPosition:
            "center",

          backgroundRepeat:
            "no-repeat",

          boxShadow: `
            0 0 20px rgba(255,255,255,0.32),
            0 0 50px rgba(220,230,255,0.18)
          `,

          filter: `
            brightness(1.12)
            contrast(1.15)
            saturate(0.72)
          `,
        }}
      />

      {/* =====================================================
          MIST
      ===================================================== */}

      <div
        className="absolute left-[-20%] bottom-[14%] h-[18%] w-[140%]"
        style={{
          background: `
            radial-gradient(
              ellipse at center,
              rgba(
                220,
                232,
                238,
                ${0.05 +
                  sky.daylight *
                    0.12}
              ) 0%,
              transparent 70%
            )
          `,

          filter:
            "blur(15px)",

          animation:
            "fogFloat 32s ease-in-out infinite alternate",

          transition:
            "background 8s ease",
        }}
      />

      {/* =====================================================
          CLOUDS
      ===================================================== */}

      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{
          opacity:
            0.72 +
            sky.daylight *
              0.12,

          zIndex: 6,
        }}
      >

        {/* CLOUD 1 */}

        <div
          className="cloud-moving-fast absolute left-[-35%] top-[13%] h-[120px] w-[430px]"
          style={{
            filter:
              "blur(1px)",
          }}
        >
          <div className="absolute bottom-0 left-[8%] h-[45px] w-[85%] rounded-full bg-white/35 blur-[8px]" />

          <div className="absolute bottom-[18px] left-[15%] h-[70px] w-[95px] rounded-full bg-white/55 blur-[5px]" />

          <div className="absolute bottom-[25px] left-[30%] h-[88px] w-[125px] rounded-full bg-white/60 blur-[5px]" />

          <div className="absolute bottom-[18px] left-[50%] h-[65px] w-[100px] rounded-full bg-white/50 blur-[6px]" />

          <div className="absolute bottom-[15px] left-[68%] h-[52px] w-[95px] rounded-full bg-white/40 blur-[7px]" />
        </div>

        {/* CLOUD 2 */}

        <div
          className="cloud-moving-slow absolute left-[-25%] top-[23%] h-[100px] w-[380px]"
          style={{
            filter:
              "blur(1px)",
          }}
        >
          <div className="absolute bottom-0 left-[5%] h-[38px] w-[90%] rounded-full bg-white/25 blur-[9px]" />

          <div className="absolute bottom-[15px] left-[12%] h-[55px] w-[90px] rounded-full bg-white/40 blur-[6px]" />

          <div className="absolute bottom-[22px] left-[32%] h-[72px] w-[105px] rounded-full bg-white/48 blur-[6px]" />

          <div className="absolute bottom-[16px] left-[55%] h-[58px] w-[95px] rounded-full bg-white/38 blur-[7px]" />

          <div className="absolute bottom-[12px] left-[73%] h-[45px] w-[75px] rounded-full bg-white/30 blur-[7px]" />
        </div>

        {/* CLOUD 3 */}

        <div
          className="cloud-moving-fast-2 absolute left-[-45%] top-[10%] h-[130px] w-[420px]"
          style={{
            filter:
              "blur(1.5px)",
          }}
        >
          <div className="absolute bottom-0 left-[5%] h-[48px] w-[90%] rounded-full bg-white/28 blur-[10px]" />

          <div className="absolute bottom-[18px] left-[10%] h-[65px] w-[100px] rounded-full bg-white/42 blur-[7px]" />

          <div className="absolute bottom-[28px] left-[30%] h-[92px] w-[130px] rounded-full bg-white/50 blur-[6px]" />

          <div className="absolute bottom-[20px] left-[53%] h-[72px] w-[115px] rounded-full bg-white/43 blur-[7px]" />

          <div className="absolute bottom-[12px] left-[74%] h-[55px] w-[90px] rounded-full bg-white/32 blur-[8px]" />
        </div>
      </div>

      {/* =====================================================
          FOREGROUND
      ===================================================== */}

      <div
        className="absolute inset-x-0 bottom-0 h-[28%]"
        style={{
          background: `
            linear-gradient(
              to top,
              rgba(1,6,10,0.82),
              rgba(2,10,16,0.25),
              transparent
            )
          `,
        }}
      />

      {/* =====================================================
          VIGNETTE
      ===================================================== */}

      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              ellipse at center,
              transparent 38%,
              rgba(0,0,0,0.28) 100%
            )
          `,
        }}
      />

      {/* =====================================================
          ANIMATIONS
      ===================================================== */}

      <style jsx global>{`

        .cloud-moving-fast {
          animation:
            cloudDriftFast
            18s linear infinite;

          will-change:
            transform;
        }

        .cloud-moving-slow {
          animation:
            cloudDriftSlow
            28s linear infinite;

          will-change:
            transform;
        }

        .cloud-moving-fast-2 {
          animation:
            cloudDriftFast2
            22s linear infinite;

          will-change:
            transform;
        }

        @keyframes cloudDriftFast {
          0% {
            transform:
              translate3d(0,0,0);
          }

          100% {
            transform:
              translate3d(160vw,0,0);
          }
        }

        @keyframes cloudDriftSlow {
          0% {
            transform:
              translate3d(0,0,0);
          }

          100% {
            transform:
              translate3d(150vw,0,0);
          }
        }

        @keyframes cloudDriftFast2 {
          0% {
            transform:
              translate3d(0,0,0);
          }

          100% {
            transform:
              translate3d(170vw,0,0);
          }
        }

        @keyframes fogFloat {
          from {
            transform:
              translateX(-3%)
              scaleX(1);
          }

          to {
            transform:
              translateX(3%)
              scaleX(1.06);
          }
        }

        @keyframes mountainDrift {
          0% {
            transform:
              scale(1.02)
              translate3d(-0.3%,0,0);
          }

          100% {
            transform:
              scale(1.04)
              translate3d(0.3%,-0.2%,0);
          }
        }

        @keyframes starPulse {
          from {
            transform:
              scale(0.75);
          }

          to {
            transform:
              scale(1.25);
          }
        }

      `}</style>
    </div>
  );
}

/* ============================================================
   STAR FIELD
============================================================ */

const STARS = [
  { x: 6, y: 12, size: 1.2, opacity: 0.55 },
  { x: 13, y: 23, size: 1.8, opacity: 0.75 },
  { x: 21, y: 9, size: 1, opacity: 0.5 },
  { x: 28, y: 18, size: 1.4, opacity: 0.68 },
  { x: 35, y: 7, size: 1.1, opacity: 0.55 },
  { x: 42, y: 25, size: 1.8, opacity: 0.8 },
  { x: 49, y: 12, size: 1, opacity: 0.5 },
  { x: 56, y: 20, size: 1.5, opacity: 0.72 },
  { x: 63, y: 8, size: 1.1, opacity: 0.58 },
  { x: 70, y: 28, size: 1.8, opacity: 0.75 },
  { x: 77, y: 14, size: 1.2, opacity: 0.58 },
  { x: 84, y: 22, size: 1.6, opacity: 0.72 },
  { x: 91, y: 10, size: 1.1, opacity: 0.55 },
  { x: 96, y: 30, size: 1.7, opacity: 0.76 },

  { x: 9, y: 38, size: 1.1, opacity: 0.5 },
  { x: 18, y: 46, size: 1.5, opacity: 0.64 },
  { x: 30, y: 34, size: 1.2, opacity: 0.55 },
  { x: 39, y: 43, size: 1.7, opacity: 0.7 },
  { x: 52, y: 37, size: 1.1, opacity: 0.52 },
  { x: 66, y: 45, size: 1.5, opacity: 0.64 },
  { x: 79, y: 37, size: 1.1, opacity: 0.5 },
  { x: 88, y: 47, size: 1.7, opacity: 0.72 },
];

/* ============================================================
   COLOR MIX
============================================================ */

function mixColor(
  color1: string,
  color2: string,
  amount: number
) {
  const hexToRgb = (
    hex: string
  ) => {
    const value =
      hex.replace("#", "");

    return {
      r: parseInt(
        value.substring(0, 2),
        16
      ),

      g: parseInt(
        value.substring(2, 4),
        16
      ),

      b: parseInt(
        value.substring(4, 6),
        16
      ),
    };
  };

  const a =
    hexToRgb(color1);

  const b =
    hexToRgb(color2);

  const r = Math.round(
    a.r +
      (b.r - a.r) *
        amount
  );

  const g = Math.round(
    a.g +
      (b.g - a.g) *
        amount
  );

  const bl = Math.round(
    a.b +
      (b.b - a.b) *
        amount
  );

  return `rgb(${r}, ${g}, ${bl})`;
}