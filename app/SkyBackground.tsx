"use client";

import { useEffect, useRef } from "react";

type SkyVariant = "home" | "calm" | "minimal";

export default function SkyBackground({
  variant = "home",
}: {
  variant?: SkyVariant;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationFrame = 0;

    type Star = {
      x: number;
      y: number;
      radius: number;
      alpha: number;
      twinkleSpeed: number;
      twinkleOffset: number;
      hue: number;
    };

    type Meteor = {
      x: number;
      y: number;
      length: number;
      speed: number;
      angle: number;
      life: number;
      maxLife: number;
      opacity: number;
    };

    let stars: Star[] = [];
    let meteors: Meteor[] = [];

    const random = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      createStars();
    };

    const createStars = () => {
      stars = [];

      let amount = Math.floor((width * height) / 7200);

      if (variant === "calm") {
        amount = Math.floor(amount * 0.38);
      }

      if (variant === "minimal") {
        amount = Math.floor(amount * 0.18);
      }

      for (let i = 0; i < amount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.94,

          radius:
            Math.random() < 0.88
              ? random(0.22, 0.65)
              : random(0.7, 1.15),

          alpha:
            variant === "home"
              ? random(0.2, 0.8)
              : variant === "calm"
              ? random(0.15, 0.5)
              : random(0.1, 0.32),

          twinkleSpeed: random(0.45, 1.6),

          twinkleOffset: random(
            0,
            Math.PI * 2
          ),

          hue:
            Math.random() < 0.84
              ? 0
              : Math.random() < 0.5
              ? 205
              : 42,
        });
      }
    };

    const createMeteor = () => {
      if (variant !== "home") return;

      const fromLeft = Math.random() > 0.5;

      meteors.push({
        x: fromLeft
          ? random(-120, width * 0.65)
          : random(width * 0.35, width + 120),

        y: random(35, height * 0.5),

        length: random(75, 160),

        speed: random(7, 13),

        angle: fromLeft
          ? random(0.28, 0.48)
          : random(2.65, 2.9),

        life: 0,

        maxLife: random(55, 90),

        opacity: random(0.6, 0.95),
      });
    };

    const drawSky = () => {
      const gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        height
      );

      if (variant === "home") {
        gradient.addColorStop(0, "#000000");
        gradient.addColorStop(0.22, "#000105");
        gradient.addColorStop(0.45, "#010208");
        gradient.addColorStop(0.68, "#01030a");
        gradient.addColorStop(0.86, "#01040b");
        gradient.addColorStop(1, "#000207");
      }

      if (variant === "calm") {
        gradient.addColorStop(0, "#000000");
        gradient.addColorStop(0.3, "#000104");
        gradient.addColorStop(0.6, "#010208");
        gradient.addColorStop(1, "#000105");
      }

      if (variant === "minimal") {
        gradient.addColorStop(0, "#000000");
        gradient.addColorStop(0.5, "#000102");
        gradient.addColorStop(1, "#000000");
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      // Very subtle blue atmosphere
      if (variant !== "minimal") {
        const glow = ctx.createRadialGradient(
          width * 0.52,
          height * 0.7,
          0,
          width * 0.52,
          height * 0.7,
          height * 0.85
        );

        if (variant === "home") {
          glow.addColorStop(
            0,
            "rgba(12, 35, 70, 0.055)"
          );

          glow.addColorStop(
            0.45,
            "rgba(8, 22, 45, 0.018)"
          );
        } else {
          glow.addColorStop(
            0,
            "rgba(12, 30, 60, 0.035)"
          );

          glow.addColorStop(
            0.45,
            "rgba(8, 20, 40, 0.012)"
          );
        }

        glow.addColorStop(
          1,
          "rgba(0, 0, 0, 0)"
        );

        ctx.fillStyle = glow;

        ctx.fillRect(
          0,
          0,
          width,
          height
        );
      }

      // Extremely faint Milky Way atmosphere
      if (variant === "home") {
        ctx.save();

        ctx.translate(
          width * 0.5,
          height * 0.31
        );

        ctx.rotate(-0.16);

        const milkyWay =
          ctx.createLinearGradient(
            -width * 0.7,
            0,
            width * 0.7,
            0
          );

        milkyWay.addColorStop(
          0,
          "rgba(70, 100, 150, 0)"
        );

        milkyWay.addColorStop(
          0.25,
          "rgba(100, 125, 170, 0.008)"
        );

        milkyWay.addColorStop(
          0.5,
          "rgba(150, 170, 210, 0.018)"
        );

        milkyWay.addColorStop(
          0.72,
          "rgba(90, 120, 170, 0.008)"
        );

        milkyWay.addColorStop(
          1,
          "rgba(70, 100, 150, 0)"
        );

        ctx.fillStyle = milkyWay;
        ctx.filter = "blur(35px)";

        ctx.fillRect(
          -width * 0.75,
          -height * 0.13,
          width * 1.5,
          height * 0.25
        );

        ctx.restore();
      }
    };

    const drawStars = (time: number) => {
      for (const star of stars) {
        const wave = Math.sin(
          time *
            0.0018 *
            star.twinkleSpeed +
            star.twinkleOffset
        );

        const brightness =
          star.alpha +
          wave * star.alpha * 0.55;

        let color = "255,255,255";

        if (star.hue === 205) {
          color = "205,225,255";
        }

        if (star.hue === 42) {
          color = "255,240,205";
        }

        ctx.beginPath();

        ctx.arc(
          star.x,
          star.y,
          star.radius,
          0,
          Math.PI * 2
        );

        ctx.fillStyle = `rgba(${color}, ${Math.max(
          0.05,
          brightness
        )})`;

        ctx.fill();

        if (
          star.radius > 1 &&
          variant === "home"
        ) {
          const glowRadius =
            star.radius * 4;

          const starGlow =
            ctx.createRadialGradient(
              star.x,
              star.y,
              0,
              star.x,
              star.y,
              glowRadius
            );

          starGlow.addColorStop(
            0,
            `rgba(${color}, ${
              brightness * 0.18
            })`
          );

          starGlow.addColorStop(
            1,
            "rgba(255,255,255,0)"
          );

          ctx.beginPath();

          ctx.arc(
            star.x,
            star.y,
            glowRadius,
            0,
            Math.PI * 2
          );

          ctx.fillStyle = starGlow;

          ctx.fill();
        }
      }
    };

    const drawMeteors = () => {
      if (variant !== "home") return;

      for (
        let i = meteors.length - 1;
        i >= 0;
        i--
      ) {
        const meteor = meteors[i];

        meteor.life++;

        meteor.x +=
          Math.cos(meteor.angle) *
          meteor.speed;

        meteor.y +=
          Math.sin(meteor.angle) *
          meteor.speed;

        const progress =
          meteor.life /
          meteor.maxLife;

        let opacity =
          meteor.opacity;

        if (progress < 0.12) {
          opacity *=
            progress / 0.12;
        }

        if (progress > 0.72) {
          opacity *=
            (1 - progress) /
            0.28;
        }

        const tailX =
          meteor.x -
          Math.cos(meteor.angle) *
            meteor.length;

        const tailY =
          meteor.y -
          Math.sin(meteor.angle) *
            meteor.length;

        const trail =
          ctx.createLinearGradient(
            tailX,
            tailY,
            meteor.x,
            meteor.y
          );

        trail.addColorStop(
          0,
          "rgba(180,215,255,0)"
        );

        trail.addColorStop(
          0.72,
          `rgba(190,220,255,${
            opacity * 0.2
          })`
        );

        trail.addColorStop(
          1,
          `rgba(255,255,255,${opacity})`
        );

        ctx.beginPath();

        ctx.moveTo(
          tailX,
          tailY
        );

        ctx.lineTo(
          meteor.x,
          meteor.y
        );

        ctx.strokeStyle = trail;

        ctx.lineWidth =
          random(0.45, 1.1);

        ctx.stroke();

        ctx.beginPath();

        ctx.arc(
          meteor.x,
          meteor.y,
          1.15,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          `rgba(255,255,255,${opacity})`;

        ctx.shadowBlur = 7;

        ctx.shadowColor =
          "rgba(190,220,255,0.95)";

        ctx.fill();

        ctx.shadowBlur = 0;

        if (
          meteor.life >=
            meteor.maxLife ||
          meteor.x < -300 ||
          meteor.x >
            width + 300 ||
          meteor.y >
            height + 300
        ) {
          meteors.splice(i, 1);
        }
      }
    };

    let meteorTimer:
      | ReturnType<typeof setTimeout>
      | undefined;

    const scheduleMeteor = () => {
      if (variant !== "home") return;

      meteorTimer = setTimeout(
        () => {
          createMeteor();
          scheduleMeteor();
        },
        random(9000, 18000)
      );
    };

    const animate = (
      time: number
    ) => {
      drawSky();
      drawStars(time);
      drawMeteors();

      animationFrame =
        requestAnimationFrame(
          animate
        );
    };

    resize();

    window.addEventListener(
      "resize",
      resize
    );

    scheduleMeteor();

    animationFrame =
      requestAnimationFrame(
        animate
      );

    return () => {
      window.removeEventListener(
        "resize",
        resize
      );

      cancelAnimationFrame(
        animationFrame
      );

      if (meteorTimer) {
        clearTimeout(
          meteorTimer
        );
      }
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      aria-hidden="true"
    />
  );
}