"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Leaf, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

const CROP_TYPES = [
  { id: "rice", name: "🌾 Rice", color: "from-yellow-400 to-amber-500" },
  { id: "wheat", name: "🌾 Wheat", color: "from-amber-400 to-yellow-600" },
  { id: "maize", name: "🌽 Maize", color: "from-orange-400 to-orange-600" },
  { id: "vegetables", name: "🥕 Vegetables", color: "from-green-400 to-emerald-600" },
  { id: "pulses", name: "🫘 Pulses", color: "from-red-400 to-rose-600" },
];

export default function SelectCrop() {
  const router = useRouter();
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/auth");
    }
  }, [router]);

  const handleCreateDevice = async (cropType: string) => {
    setSelectedCrop(cropType);
    setLoading(true);
    setError("");

    try {
      const response = await fetchWithAuth("/api/devices/create", {
        method: "POST",
        body: JSON.stringify({ crop_type: cropType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create device");
      }

      // Success! Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create device");
      setSelectedCrop(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-4 bg-green-600 rounded-2xl">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-800">Smart Farming</h1>
        </div>
        <p className="text-xl text-gray-600">Welcome! Let's create your first device</p>
        <p className="text-sm text-gray-500 mt-2">Select a crop type to get started</p>
      </motion.div>

      {/* Crop Selection Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 w-full max-w-2xl"
      >
        {CROP_TYPES.map((crop, idx) => (
          <motion.button
            key={crop.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCreateDevice(crop.id)}
            disabled={loading}
            className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer ${
              selectedCrop === crop.id
                ? `bg-gradient-to-br ${crop.color} text-white border-0 shadow-lg`
                : "bg-white border-gray-200 hover:border-green-300 shadow-sm hover:shadow-md text-gray-800"
            } ${loading && selectedCrop !== crop.id ? "opacity-50 pointer-events-none" : ""}`}
          >
            <span className="text-3xl" >{crop.name.split(" ")[0]}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-center">
              {crop.name.split(" ")[1]}
            </span>
            {selectedCrop === crop.id && loading && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm max-w-2xl w-full mb-6"
        >
          {error}
        </motion.div>
      )}

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-blue-50 border border-blue-200 rounded-2xl p-6 max-w-2xl w-full text-center"
      >
        <p className="text-sm text-blue-900">
          <strong>Pro Tip:</strong> You can add more devices later from your dashboard anytime!
        </p>
      </motion.div>
    </div>
  );
}
