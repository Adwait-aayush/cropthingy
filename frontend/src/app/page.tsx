"use client";

import { motion } from "framer-motion";
import {
  Leaf,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Globe,
  Droplets,
  Thermometer,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-green-100 selection:text-green-900">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 md:px-16 py-8">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-green-600 p-2 shadow-lg shadow-green-100">
            <Leaf className="h-6 w-6 text-white" />
          </div>

          <span className="text-xl font-black uppercase tracking-tighter text-slate-900">
            Crop<span className="text-green-600">Sense</span>
          </span>
        </div>

        <div className="hidden items-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-600 md:flex">
          <a href="#features" className="transition-colors hover:text-green-600">
            Features
          </a>
          <a href="#about" className="transition-colors hover:text-green-600">
            Technology
          </a>
          <Link
            href="/auth"
            className="text-slate-900 transition-colors hover:text-green-600"
          >
            Login
          </Link>
        </div>

        <Link
          href="/auth"
          className="rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white shadow-xl shadow-slate-200 transition-all hover:scale-105 hover:bg-green-600"
        >
          Sign Up
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative overflow-hidden px-8 pt-12 pb-32 md:px-16">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-green-700">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Future of Precision Farming
            </div>

            <h1 className="mb-8 text-6xl font-black leading-[0.9] tracking-tighter text-slate-900 md:text-8xl">
              INTELLIGENT <br />
              <span className="text-green-600">CROP CARE.</span>
            </h1>

            <p className="mb-12 max-w-lg text-xl font-medium leading-relaxed text-slate-600">
              Empower your farm with real-time IoT monitoring, advanced
              analytics, and AI-driven health predictions. All from one premium
              dashboard.
            </p>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <Link
                href="/auth"
                className="group flex items-center justify-center gap-3 rounded-full bg-green-600 px-8 py-5 text-lg font-black text-white shadow-2xl shadow-green-100 transition-all hover:bg-green-700"
              >
                GET STARTED
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
              </Link>

              <div className="flex items-center -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/100?u=${i}`}
                    className="h-12 w-12 rounded-full border-4 border-white object-cover"
                    alt="user"
                  />
                ))}

                <div className="pl-8">
                  <p className="leading-none text-sm font-black tracking-tight text-slate-900">
                    500+ Farmers
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Already monitoring
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Visual Element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 -z-10 rounded-4xl bg-linear-to-tr from-green-500 to-green-100 opacity-20 blur-3xl" />

            <div className="relative aspect-square bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-green-100">

              {/* Background glow */}
              <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-white" />

              {/* Content */}
              <div className="relative p-8 h-full">

                {/* Top */}
                <div className="flex justify-between items-center mb-10">
                  <div className="space-y-2">
                    <div className="w-36 h-4 bg-slate-200 rounded-full" />
                    <div className="w-24 h-2 bg-slate-100 rounded-full" />
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-xl shadow-inner" />
                </div>

                {/* Cards */}
                <div className="grid grid-cols-2 gap-5 mb-8">
                  <div className="h-32 rounded-3xl bg-white border border-slate-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start justify-between h-full">
                      <div>
                        <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-3">
                          Soil Moisture
                        </p>
                        <p className="text-3xl font-black text-slate-900 leading-none">72%</p>
                        <p className="text-sm text-green-600 font-semibold mt-3">
                          Optimal range
                        </p>
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                        <Droplets className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="h-32 rounded-3xl bg-white border border-slate-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start justify-between h-full">
                      <div>
                        <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-3">
                          Field Temperature
                        </p>
                        <p className="text-3xl font-black text-slate-900 leading-none">24°C</p>
                        <p className="text-sm text-slate-500 font-medium mt-3">
                          Stable today
                        </p>
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                        <Thermometer className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-48 rounded-4xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-end h-full gap-3">
                    {[30, 45, 60, 40, 70, 50, 85].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-xl bg-linear-to-t from-green-500 to-green-300 
            hover:from-green-600 hover:to-green-400 transition-all duration-300"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Badge (FIXED) */}
              <div className="absolute top-6 left-6 backdrop-blur-xl bg-white/80 
    border border-white/40 shadow-lg p-4 rounded-2xl flex items-center gap-3">

                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shadow-inner">
                  <Activity className="w-5 h-5" />
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                    Health Score
                  </p>
                  <p className="text-lg font-black text-slate-900">98.4%</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="bg-[#f8faf7] px-8 py-32 md:px-16">
        <div className="mb-20 text-center">
          <h2 className="mb-4 text-4xl font-black uppercase tracking-tighter text-slate-900">
            Powerful Precision
          </h2>
          <p className="font-medium text-slate-600">
            Everything you need to grow better, safer, and smarter.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<ShieldCheck className="h-6 w-6 text-green-600" />}
            title="Encrypted Channels"
            desc="Military-grade security for your proprietary farm data and sensor networks."
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6 text-orange-600" />}
            title="Real-time Ingest"
            desc="Milliseconds from sensor reading to dashboard visualization. Zero latency."
          />
          <FeatureCard
            icon={<Globe className="h-6 w-6 text-blue-600" />}
            title="Global Access"
            desc="Monitor your crops from anywhere in the world on any device."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-8 py-12 text-center md:px-16">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-500">
          © 2024 CropSense Intelligent Systems. Built for growth.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="mb-6 w-fit rounded-2xl bg-slate-50 p-4">{icon}</div>
      <h3 className="mb-4 text-xl font-black uppercase tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="font-medium leading-relaxed text-slate-600">{desc}</p>
    </motion.div>
  );
}