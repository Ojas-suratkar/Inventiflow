"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react"; // Truck icon from Lucide for logistics theme

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col justify-center items-center text-white overflow-hidden">
      
      {/* Background Blur Effects */}
      <div className="absolute inset-0 flex justify-center items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="w-[450px] h-[450px] md:w-[600px] md:h-[600px] bg-indigo-500 opacity-25 rounded-full filter blur-[140px]"
        />
      </div>

      {/* Moving Truck Animation */}
      <motion.div
        initial={{ x: "-100vw" }}
        animate={{ x: "100vw" }}
        transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
        className="absolute bottom-10 w-20 h-20 md:w-32 md:h-32 text-indigo-400"
      >
        <Truck size={80} className="text-indigo-400 opacity-80" />
      </motion.div>

      {/* Main Content */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        {/* Logo / Truck Symbol Above Title */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className="text-white drop-shadow-[3_7px_18px_rgba(215,215,215,0.3)"
        >
          <Truck size={100} className="text-white drop-shadow-[3_7px_18px_rgba(215,215,215,0.3)" />
        </motion.div>

        {/* App Name */}
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ duration: 1.5, delay: 0.2 }}
          className="text-7xl md:text-8xl font-extrabold text-white drop-shadow-[3_7px_18px_rgba(215,215,215,0.3)]"
          >
          InventiFlow
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 1.7, delay: 0.4 }}
          className="mt-4 text-lg md:text-xl text-gray-300 max-w-2xl"
        >
          Revolutionizing Supply Chain & Inventory Management with AI-powered insights. 
          Seamless, real-time, and intuitive.
        </motion.p>

        {/* Get Started Button */}
        <motion.div
          initial={{ y: 30, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 1.7, delay: 0.6 }}
          className="mt-8"
        >
          <Button
            onClick={() => router.push("/signup")}
            className="px-10 py-4 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 rounded-xl shadow-lg shadow-indigo-500/40 transform hover:scale-105 hover:shadow-indigo-400 border:1px border fill-white"
          >
            Get Started
          </Button>
        </motion.div>
      </motion.div>

      {/* Floating Animated Shapes */}
      <motion.div 
        initial={{ y: -20 }} 
        animate={{ y: 20 }} 
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", repeatType: "mirror" }}
        className="absolute bottom-10 left-20 w-32 h-32 md:w-40 md:h-40 bg-purple-400 opacity-25 rounded-full filter blur-[80px]"
      />
      <motion.div 
        initial={{ y: 20 }} 
        animate={{ y: -20 }} 
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", repeatType: "mirror" }}
        className="absolute top-16 right-16 w-40 h-40 md:w-52 md:h-52 bg-indigo-500 opacity-30 rounded-full filter blur-[90px]"
      />
    </div>
  );
}
