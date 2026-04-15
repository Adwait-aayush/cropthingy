"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export function Toast({ message, type, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const config = {
    success: {
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      bg: "bg-green-50",
      border: "border-green-100",
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      bg: "bg-red-50",
      border: "border-red-100",
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-500" />,
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
  };

  const { icon, bg, border } = config[type];

  return (
    <div className="fixed bottom-6 right-6 z-[100] pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${bg} ${border} min-w-[300px]`}
          >
            {icon}
            <p className="text-sm font-semibold text-gray-800 flex-1">{message}</p>
            <button
              onClick={onClose}
              className="p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
