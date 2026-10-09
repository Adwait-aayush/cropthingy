"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/auth";


function LeafLogo() {
  return (
    <motion.svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
      animate={{ rotate: [0, 8, -8, 0] }}
      transition={{ repeat: Infinity, duration: 5 }}
    >
      <path
        d="M12 2C7 7 6 11 6 14a6 6 0 0012 0c0-3-1-7-6-12z"
        fill="#4ade80"
      />
    </motion.svg>
  );
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match!" });
      setLoading(false);
      return;
    }

    try {
      // Try to connect to backend
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          ...(isLogin ? {} : { name: formData.name })
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: "success", 
          text: isLogin ? "Login successful! Welcome back." : "Registration successful! Redirecting to dashboard..." 
        });
        
        if (isLogin) {
          setToken(data.data.token);
          setTimeout(() => router.push("/dashboard"), 2000);
        } else {
          // Registration successful - go directly to dashboard
          setToken(data.data.token);
          setTimeout(() => router.push("/dashboard"), 2000);
        }
      } else {
        setMessage({ type: "error", text: data.message || "Authentication failed" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f0f9f1] selection:bg-green-200">
      {/* Left Section - Hero */}
      <div className="hidden md:flex w-1/2 relative overflow-hidden">
        <motion.img
          src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6"
          alt="farm"
          className="object-cover w-full h-full"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "mirror" }}
        />

        <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 via-green-800/50 to-transparent p-12 flex flex-col justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <LeafLogo />
            <h1 className="text-white text-5xl font-black tracking-tighter">
              Crop<span className="text-green-400">Sense</span>
            </h1>
          </motion.div>

          <div className="space-y-6 max-w-lg">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white text-4xl font-bold leading-tight"
            >
              The future of farming, <br /> 
              <span className="text-green-300">driven by data.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-green-50/80 text-lg leading-relaxed"
            >
              Monitor crop health, soil moisture, and pest activity with real-time analytics powered by our IoT sensors.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="backdrop-blur-xl bg-white/80 border border-green-100 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {isLogin ? "Welcome Back" : "Get Started"}
              </h2>
              <p className="text-gray-500">
                {isLogin ? "Enter your details to access your farm dashboard" : "Join our community of smart farmers today"}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                    message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                  }`}
                >
                  {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span className="text-sm font-medium">{message.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="relative group overflow-hidden"
                  >

                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400/20 focus:border-green-400 transition-all shadow-sm text-gray-900 placeholder-gray-400"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400/20 focus:border-green-400 transition-all shadow-sm text-gray-900 placeholder-gray-400"
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400/20 focus:border-green-400 transition-all shadow-sm text-gray-900 placeholder-gray-400"
                />
              </motion.div>

              {!isLogin && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400/20 focus:border-green-400 transition-all shadow-sm text-gray-900 placeholder-gray-400"
                  />
                </motion.div>
              )}

              {isLogin && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center justify-between px-1 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input type="checkbox" className="peer w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer appearance-none border-2 checked:bg-green-600 checked:border-green-600 transition-all" />
                        <CheckCircle2 className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity p-0.5" />
                    </div>
                    <span className="text-gray-500 group-hover:text-gray-700 transition-colors font-medium">Remember me</span>
                  </label>
                  <Link href="/auth/forgot-password" className="font-bold text-green-600 hover:text-green-700 transition-colors">
                    Forgot Password?
                  </Link>
                </motion.div>
              )}

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-600 hover:shadow-2xl hover:shadow-green-100 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none mt-4 shadow-xl shadow-gray-200"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <span className="uppercase tracking-widest">{isLogin ? "Login Now" : "Create Account"}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center pt-6 border-t border-gray-100"
            >
              <p className="text-gray-400 font-medium text-sm tracking-wide">
                {isLogin ? "Don't have an account?" : "Already a member?"}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-2 text-green-600 font-black hover:text-green-700 transition-colors hover:underline decoration-2 underline-offset-4"
                >
                  {isLogin ? "JOIN NOW" : "SIGN IN"}
                </button>
              </p>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
