"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Account created successfully! You can now log in.."
    );

    setEmail("");
    setPassword("");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <section className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold">ONEQUESTION</h1>
          <p className="mt-2 text-white/50">Create your account</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <label className="mb-2 block text-sm">Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="mb-4 w-full rounded-xl border border-white/10 bg-black p-4 text-white outline-none"
          />

          <label className="mb-2 block text-sm">Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="mb-5 w-full rounded-xl border border-white/10 bg-black p-4 text-white outline-none"
          />

          <button
            type="button"
            onClick={handleSignup}
            disabled={loading}
            className="w-full rounded-xl bg-white p-4 font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          {message && (
            <p className="mt-4 text-center text-sm text-white/70">
              {message}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}