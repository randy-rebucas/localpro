"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearUserMPIN } from "@/lib/mpin";

export default function ForgotMPINPage({ userId }: { userId: string }) {
  const [done, setDone] = useState(false);
  const router = useRouter();

  function handleReset() {
    clearUserMPIN(userId);
    setDone(true);
    setTimeout(() => router.push("/auth/otp-reset"), 1500);
  }

  if (done) {
    return <div className="max-w-xs mx-auto mt-16 text-center text-green-600">MPIN reset. Please verify via OTP to set a new MPIN.</div>;
  }

  return (
    <div className="max-w-xs mx-auto mt-16 text-center">
      <p className="mb-4">Forgot your MPIN? You can reset it after OTP verification.</p>
      <button onClick={handleReset} className="w-full bg-emerald-500 text-white py-2 rounded">Reset MPIN</button>
    </div>
  );
}
