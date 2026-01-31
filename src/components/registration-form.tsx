"use client";

import React from "react";
import { ArrowRight, Shield, Facebook, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { makeClientPublicRequest } from "@/lib/client-api-utils";

export function RegistrationForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  type Errors = {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  };
  const [errors, setErrors] = React.useState<Errors>({});

  function validate(): Errors {
    const errs: Errors = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.email = "Invalid email address";
    if (!password.trim()) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    if (!firstName.trim()) errs.firstName = "First name is required";
    if (!lastName.trim()) errs.lastName = "Last name is required";
    return errs;
  }

  const [apiError, setApiError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError("");
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setLoading(true);
      try {
        // Use makeClientPublicRequest to call the REST API
        const res = await makeClientPublicRequest("authRegister", {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
            firstName,
            lastName
          })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setApiError(data?.message || "Registration failed. Please try again.");
          setLoading(false);
          return;
        }
        setSubmitted(true);
      } catch (err: unknown) {
        console.error("Registration error:", err);
        setApiError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  }

  if (submitted) {
    return <RegistrationSuccess />;
  }

  function RegistrationSuccess() {
    return (
      <div className="w-full text-center p-6 flex flex-col items-center">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-emerald-500/20 mb-4">
          <Shield className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="text-emerald-400 text-2xl font-bold mb-2">Registration Successful!</div>
        <div className="text-slate-300 mb-2">Thank you for registering. Your account has been received.</div>
        <div className="text-slate-400 text-base mb-4">The app will be available again on <span className="font-semibold text-white">February 18, 2026</span> after scheduled maintenance.</div>
        <div className="text-slate-400 text-sm mb-6">Follow us for updates and announcements:</div>
        <div className="flex justify-center gap-4 mb-2">
          <a href="https://www.facebook.com/localproasia" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors">
            <Facebook className="w-5 h-5 mr-2" /> Facebook
          </a>
          <a href="https://www.linkedin.com/company/localproasia" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-semibold transition-colors">
            <Linkedin className="w-5 h-5 mr-2" /> LinkedIn
          </a>
        </div>
        <div className="text-xs text-slate-500 mt-6">For direct bookings, message us on facebook or linkedin.</div>

        <div className="text-xs text-slate-500 mt-6">For urgent concerns, contact <a href="mailto:admin@localpro.asia" className="underline text-emerald-400">admin@localpro.asia</a></div>
      </div>
    );
  }

  return (
    <form className="w-full space-y-4" onSubmit={handleSubmit} autoComplete="off">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-lg bg-slate-800 text-white border border-slate-700 focus:border-emerald-500 outline-none"
            placeholder="First Name"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            disabled={loading}
          />
          {errors.firstName && <div className="text-red-400 text-xs mt-1">{errors.firstName}</div>}
        </div>
        <div>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-lg bg-slate-800 text-white border border-slate-700 focus:border-emerald-500 outline-none"
            placeholder="Last Name"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            disabled={loading}
          />
          {errors.lastName && <div className="text-red-400 text-xs mt-1">{errors.lastName}</div>}
        </div>
      </div>
      <div>
        <input
          type="email"
          className="w-full px-4 py-3 rounded-lg bg-slate-800 text-white border border-slate-700 focus:border-emerald-500 outline-none"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={loading}
        />
        {errors.email && <div className="text-red-400 text-xs mt-1">{errors.email}</div>}
      </div>
      <div>
        <input
          type="password"
          className="w-full px-4 py-3 rounded-lg bg-slate-800 text-white border border-slate-700 focus:border-emerald-500 outline-none"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
        />
        {errors.password && <div className="text-red-400 text-xs mt-1">{errors.password}</div>}
      </div>
      {apiError && <div className="text-red-500 text-sm text-center mt-2">{apiError}</div>}
      <Button type="submit" size="lg" className="w-full bg-emerald-500 text-white hover:bg-emerald-600 font-bold px-8 py-4 rounded-xl shadow-lg shadow-emerald-500/30 group mt-2" disabled={loading}>
        {loading ? "Registering..." : "Register"}
        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Button>
    </form>
  );
}
