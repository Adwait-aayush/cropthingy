"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Loader2, Info, X } from "lucide-react";
import Link from "next/link";

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

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowModal(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8faf7] selection:bg-green-200">
      {/* Left Section - Hero */}
      <div className="hidden md:flex w-1/3 relative overflow-hidden bg-gray-900 shadow-2xl">
        <motion.img
          src="https://images.unsplash.com/photo-1464226184884-fa280b87c399"
          alt="farm"
          className="object-cover w-full h-full opacity-40"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "mirror" }}
        />
        <div className="absolute inset-0 flex flex-col p-12 justify-between">
           <Link href="/" className="flex items-center gap-4 group">
            <div className="bg-green-600 p-2 rounded-xl shadow-lg shadow-green-900/20 group-hover:scale-110 transition-transform">
                <LeafLogo />
            </div>
            <h1 className="text-white text-3xl font-black tracking-tighter uppercase">
              Crop<span className="text-green-500">Sense</span>
            </h1>
          </Link>
          <div className="space-y-4">
            <h2 className="text-white text-3xl font-black leading-tight uppercase tracking-tighter">Security <br />First.</h2>
            <div className="w-12 h-1 bg-green-500 rounded-full" />
            <p className="text-gray-400 text-sm font-medium leading-relaxed">
              We take your data security seriously. Resetting your password ensures your IoT network stays protected from unauthorized access.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 uppercase">Recovery Center</h1>
            <p className="text-gray-400 font-medium mt-2 uppercase text-[10px] tracking-[0.2em]">Reset your secure gateway access</p>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-50 p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-green-600" />
            
            <p className="text-gray-500 mb-8 text-sm font-medium leading-relaxed">
              Enter the email address associated with your account and we&apos;ll send you a secure link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 bg-gray-50 rounded-xl group-focus-within:bg-green-50 group-focus-within:text-green-600 transition-colors">
                    <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-green-600" />
                </div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-16 pr-5 py-5 bg-gray-50 border-none rounded-3xl focus:ring-2 focus:ring-green-500/20 focus:bg-white transition-all outline-none font-medium text-gray-800"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-green-600 hover:shadow-2xl hover:shadow-green-100 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none shadow-xl shadow-gray-200"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  "Send Secure Link"
                )}
              </button>
            </form>

            <div className="mt-8 text-center pt-8 border-t border-gray-50">
              <Link 
                href="/auth" 
                className="inline-flex items-center gap-2 text-gray-400 font-black text-[10px] tracking-widest uppercase hover:text-green-600 transition-colors group"
              >
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                Back to Authentication
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* --- Modal Overlay --- */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-gray-900/10 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-sm bg-white rounded-[3rem] shadow-2xl p-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-3 bg-green-500" />
              
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-50 rounded-2xl transition-colors group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-50 rounded-[2rem] flex items-center justify-center mb-8">
                  <Info className="w-10 h-10 text-green-600" />
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4 leading-none">Feature <br />Under Guard</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8">
                  The automated password recovery system is currently being fortified. Our security team will bring this online soon.
                </p>

                <button
                  onClick={() => setShowModal(false)}
                  className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-green-600 transition-all active:scale-[0.98] shadow-xl shadow-gray-100"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

