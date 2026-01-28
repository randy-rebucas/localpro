"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mpinSchema } from "@/types/mpin";
import { verifyUserMPIN } from "@/lib/mpin";

export default function MPINPage({ userId }: { userId: string }) {
  const [mpin, setMpin] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = mpinSchema.safeParse(mpin);
    if (!parsed.success) {
      setError("MPIN must be 4-6 digits");
      return;
    }
    const ok = await verifyUserMPIN(userId, mpin);
    if (ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid MPIN");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xs mx-auto mt-16">
      <label className="block mb-2 font-medium">Enter your MPIN</label>
      <input
        type="password"
        inputMode="numeric"
        pattern="\d{4,6}"
        maxLength={6}
        minLength={4}
        value={mpin}
        onChange={e => setMpin(e.target.value)}
        className="w-full px-4 py-2 border rounded mb-2"
        autoFocus
      />
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <button type="submit" className="w-full bg-emerald-500 text-white py-2 rounded">Login</button>
      <button type="button" className="w-full mt-2 underline text-sm" onClick={() => router.push("/auth/forgot-mpin")}>Forgot MPIN?</button>
    </form>
  );
}
