"use client";

import React from "react";
import { useSession } from "@/hooks/useAuth";

import Link from "next/link";
import { 
  Loader2, 
  Shield, 
} from "lucide-react";


export default function Home() {
  const { data: session, status } = useSession();

  console.log("Session data on home page:", session);
  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
            <Shield className="text-white w-10 h-10" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <p className="text-slate-300 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    providers: { value: "50,000+", label: "Service Providers" },
    clients: { value: "25,000+", label: "Clients" },
    businesses: { value: "10,000+", label: "Businesses" }
  };

  const testimonials = [
    {
      name: "John Doe",
      role: "Client",
      content: "This platform has transformed how we book services.",
      image: "https://example.com/avatar1.jpg"
    },
    {
      name: "Jane Smith",
      role: "Provider",
      content: "We've grown our business using this platform.",
      image: "https://example.com/avatar2.jpg"
    }
  ];

  const platformFeatures = [
    { title: "Easy Booking", description: "Book services with ease" },
    { title: "Secure Payments", description: "Safe and fast payments" },
    { title: "Analytics", description: "Track and grow your business" },
    { title: "Reviews", description: "Build reputation with reviews" },
    { title: "Messaging", description: "Direct messaging with potential clients" },
    { title: "API Access", description: "Custom integrations and automation" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex w-full items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <Shield className="text-emerald-500 w-8 h-8" />
          <h1 className="text-2xl font-bold">LocalPro</h1>
        </div>
        <nav className="flex items-center space-x-4">
          <Link href="/" className="text-slate-500 hover:text-emerald-500">Home</Link>
          <Link href="/providers" className="text-slate-500 hover:text-emerald-500">Providers</Link>
          <Link href="/clients" className="text-slate-500 hover:text-emerald-500">Clients</Link>
          <Link href="/businesses" className="text-slate-500 hover:text-emerald-500">Businesses</Link>
        </nav>
      </header>

      <main className="flex w-full flex-1 flex-col">
        <section className="flex w-full flex-col items-center p-4">
          <h2 className="text-3xl font-bold">Welcome to LocalPro</h2>
          <p className="text-slate-300">Join thousands of professionals earning more on LocalPro.</p>
        </section>

        <section className="flex w-full flex-col items-center p-4">
          <h2 className="text-3xl font-bold">Find Trusted Professionals</h2>
          <p className="text-slate-300">Book verified service providers with confidence.</p>
        </section>

        <section className="flex w-full flex-col items-center p-4">
          <h2 className="text-3xl font-bold">Scale Your Operations</h2>
          <p className="text-slate-300">Enterprise solutions for hotels, agencies, and developers.</p>
        </section>

        <section className="flex w-full flex-col items-center p-4">
          <h2 className="text-3xl font-bold">Stats</h2>
          <div className="flex w-full flex-col items-center space-y-4">
            {Object.entries(stats).map(([key, { value, label }]) => (
              <div key={key} className="flex w-full items-center space-x-4">
                <div className="text-2xl">{value}</div>
                <div className="text-slate-300">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex w-full flex-col items-center p-4">
          <h2 className="text-3xl font-bold">Testimonials</h2>
          <div className="flex w-full flex-col items-center space-y-4">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="flex w-full items-center space-x-4">
                <div className="text-2xl">{testimonial.name}</div>
                <div className="text-slate-300">{testimonial.content}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex w-full flex-col items-center p-4">
          <h2 className="text-3xl font-bold">Platform Features</h2>
          <div className="flex w-full flex-col items-center space-y-4">
            {platformFeatures.map((feature) => (
              <div key={feature.title} className="flex w-full items-center space-x-4">
                <div className="text-2xl">{feature.title}</div>
                <div className="text-slate-300">{feature.description}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="flex w-full items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <Shield className="text-emerald-500 w-8 h-8" />
          <h1 className="text-2xl font-bold">LocalPro</h1>
        </div>
        <nav className="flex items-center space-x-4">
          <Link href="/" className="text-slate-500 hover:text-emerald-500">Home</Link>
          <Link href="/providers" className="text-slate-500 hover:text-emerald-500">Providers</Link>
          <Link href="/clients" className="text-slate-500 hover:text-emerald-500">Clients</Link>
          <Link href="/businesses" className="text-slate-500 hover:text-emerald-500">Businesses</Link>
        </nav>
      </footer>
    </div>
  );
}
