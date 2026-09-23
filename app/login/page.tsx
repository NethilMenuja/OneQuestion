"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import SkyBackground from "../SkyBackground";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // Check if the user had an answer waiting to be posted
    const pendingAnswer =
      localStorage.getItem("pendingAnswer");

    if (pendingAnswer && data.user) {
      try {
        const savedAnswer =
          JSON.parse(pendingAnswer);

        const { error: postError } =
          await supabase
            .from("answers")
            .insert({
              question_id: savedAnswer.questionId,
              answer: savedAnswer.answer,
              name: savedAnswer.name,
              country: savedAnswer.country,
              user_id: data.user.id,
            });

        if (postError) {
          console.error(
            "Pending answer error:",
            postError
          );

          setMessage(
            "Login successful, but your answer could not be posted."
          );

          setLoading(false);
          return;
        }

        // Remove the saved answer after successful posting
        localStorage.removeItem("pendingAnswer");
      } catch (error) {
        console.error(
          "Pending answer error:",
          error
        );

        setMessage(
          "Login successful, but your answer could not be posted."
        );

        setLoading(false);
        return;
      }
    }

    setMessage("Login successful!");

    window.location.href = "/";
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 py-8 text-white sm:px-6 sm:py-16">
      <SkyBackground variant="calm" />

      <section className="relative z-10 mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold">
            ONEQUESTION
          </h1>

          <p className="mt-2 text-white/50">
            Login to your account
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <label className="mb-2 block text-sm">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="Enter your email"
            className="mb-4 w-full rounded-xl border border-white/10 bg-black p-4 text-white outline-none"
          />

          <label className="mb-2 block text-sm">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Enter your password"
            className="mb-5 w-full rounded-xl border border-white/10 bg-black p-4 text-white outline-none"
          />

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-xl bg-white p-4 font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

          {message && (
            <p className="mt-4 text-center text-sm text-white/70">
              {message}
            </p>
          )}

          <p className="mt-5 text-center text-sm text-white/50">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="font-medium text-white underline underline-offset-4 hover:text-white/70"
            >
              Sign Up
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}