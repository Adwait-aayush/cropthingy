"use client";

import { motion } from "framer-motion";
import { Leaf, ArrowRight, ShieldCheck, Zap, Activity, Globe } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-green-100 selection:text-green-900">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 md:px-16 py-8">
        <div className="flex items-center gap-2">
          <div className="bg-green-600 p-2 rounded-xl shadow-lg shadow-green-100">
            <Leaf className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tighter text-gray-900 uppercase">
            Crop<span className="text-green-600">Sense</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500 uppercase tracking-widest">
          <a href="#features" className="hover:text-green-600 transition-colors">Features</a>
          <a href="#about" className="hover:text-green-600 transition-colors">Technology</a>
          <Link href="/auth" className="text-gray-900 hover:text-green-600 transition-colors">Login</Link>
        </div>
        <Link 
          href="/auth" 
          className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-600 hover:scale-105 transition-all shadow-xl shadow-gray-200"
        >
          Sign Up
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="px-8 md:px-16 pt-12 pb-32 overflow-hidden relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-xs font-black uppercase tracking-widest mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Future of Precision Farming
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[0.9] mb-8">
              INTELLIGENT <br />
              <span className="text-green-600">CROP CARE.</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium max-w-lg mb-12 leading-relaxed">
              Empower your farm with real-time IoT monitoring, advanced analytics, and AI-driven health predictions. All from one premium dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link 
                href="/auth" 
                className="group flex items-center justify-center gap-3 bg-green-600 text-white px-8 py-5 rounded-[2rem] font-black text-lg hover:bg-green-700 transition-all shadow-2xl shadow-green-100"
              >
                GET STARTED <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
              <div className="flex -space-x-4 items-center">
                {[1, 2, 3, 4].map((i) => (
                  <img 
                    key={i} 
                    src={`https://i.pravatar.cc/100?u=${i}`} 
                    className="w-12 h-12 rounded-full border-4 border-white object-cover" 
                    alt="user"
                  />
                ))}
                <div className="pl-8">
                  <p className="text-sm font-black text-gray-900 tracking-tight leading-none">500+ Farmers</p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Already monitoring</p>
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
            <div className="absolute -inset-4 bg-gradient-to-tr from-green-500 to-green-100 rounded-[3rem] blur-3xl opacity-20 -z-10 animate-pulse" />
            <div className="aspect-square bg-white rounded-[3rem] shadow-2xl overflow-hidden relative border border-green-50">
               {/* Mock Dashboard Preview */}
               <div className="p-8 h-full bg-gradient-to-br from-[#f8faf7] to-white">
                  <div className="flex justify-between items-center mb-10">
                    <div className="space-y-1">
                      <div className="w-32 h-4 bg-gray-100 rounded" />
                      <div className="w-20 h-2 bg-gray-50 rounded" />
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="h-32 bg-white rounded-3xl border border-green-50 shadow-sm" />
                    <div className="h-32 bg-white rounded-3xl border border-green-50 shadow-sm" />
                  </div>
                  <div className="h-48 bg-white rounded-[2rem] border border-green-50 shadow-sm p-4">
                    <div className="w-full h-full flex items-end gap-2">
                       {[30, 45, 60, 40, 70, 50, 80].map((h, i) => (
                         <div key={i} className="flex-1 bg-green-100 rounded-t-lg" style={{ height: `${h}%` }} />
                       ))}
                    </div>
                  </div>
               </div>
               {/* Floating Badges */}
               <div className="absolute top-12 -left-8 bg-white p-4 rounded-2xl shadow-xl border border-green-50 flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-500 rounded-xl"><Activity className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 leading-none mb-1">Health Score</p>
                    <p className="text-lg font-black text-gray-900">98.4%</p>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="px-8 md:px-16 py-32 bg-[#f8faf7]">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black tracking-tighter uppercase mb-4">Powerful Precision</h2>
          <p className="text-gray-500 font-medium">Everything you need to grow better, safer, and smarter.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6 text-green-600" />} 
            title="Encrypted Channels" 
            desc="Military-grade security for your proprietary farm data and sensor networks."
          />
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-orange-600" />} 
            title="Real-time Ingest" 
            desc="Milliseconds from sensor reading to dashboard visualization. Zero latency."
          />
          <FeatureCard 
            icon={<Globe className="w-6 h-6 text-blue-600" />} 
            title="Global Access" 
            desc="Monitor your crops from anywhere in the world on any device."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 md:px-16 py-12 text-center border-t border-gray-100">
        <p className="text-sm font-bold text-gray-300 uppercase tracking-[0.3em]">
          © 2024 CropSense Intelligent Systems. Built for growth.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-50"
    >
      <div className="mb-6 p-4 rounded-2xl bg-gray-50 w-fit">{icon}</div>
      <h3 className="text-xl font-black tracking-tight mb-4 uppercase">{title}</h3>
      <p className="text-gray-400 font-medium leading-relaxed">{desc}</p>
    </motion.div>
  );
}
