import React, { useEffect, useState, useRef } from "react";
import CamVoiceToggle from "../components/CamVoiceToggle";
import {
  Play,
  ChevronDown,
  CheckCircle,
  Linkedin,
  Camera,
  Target,
  TrendingUp,
  Shield,
} from "lucide-react";

function WorkoutPage() {
  const [userName, setUserName] = useState("");
  const [mode, setMode] = useState("");
  const [workoutPlan, setWorkoutPlan] = useState([]);

  const workoutRef = useRef(null);
  const aboutUsRef = useRef(null);

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "");
    setMode(localStorage.getItem("mode") || "");
  }, []);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleHeadToApp = () => {
    alert("Navigating to app...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-gray-950/90 backdrop-blur-sm z-50 border-b border-gray-700/50">
        <div className="relative flex items-center h-20 px-8 max-w-7xl mx-auto">
          {/* Left: App Name */}
          <div className="absolute left-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent hover:from-cyan-300 hover:to-indigo-400 transition-all duration-300"
            >
              AppName
            </button>
          </div>

          {/* Center: Navigation */}
          <div className="flex-1 flex justify-center space-x-16">
            <button
              onClick={() => scrollToSection(workoutRef)}
              className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 font-medium"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection(aboutUsRef)}
              className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 font-medium"
            >
              About Us
            </button>
          </div>

          {/* Right: CTA */}
          <div className="absolute right-8">
            <button
              onClick={handleHeadToApp}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30"
            >
              -
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={workoutRef}
        className="pt-30 pb-24 px-8 bg-gradient-to-b from-black/50 to-gray-900/30"
      >
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-16">
            <h1 className="text-5xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-white via-gray-200 to-cyan-400 bg-clip-text text-transparent leading-tight">
              Welcome to your Workout Tracker!
            </h1>
            <p className="text-xl md:text-1xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-4">
              Get ready for your personalized workout session today
              <br /> created just for you by our AI coach. 
              <br />Get ready to track your progress, improve your 
              <br />form, and crush your goals today.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <button
              onClick={() => alert("Starting workout...")}
              className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 flex items-center gap-3"
            >
              <Play className="w-5 h-5" />
              Start Workout
            </button>
            <button
              onClick={() => alert("Revising workout...")}
              className="px-5 py-3 border-2 border-cyan-500 text-cyan-300 rounded-full text-lg font-semibold hover:bg-cyan-500/10 transition-all duration-300 flex items-center gap-3"
            >
              Revise Workout
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Toggle buttons
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">Control Panel</h2>
            <p className="mb-4">Toggle your camera and voice settings below:</p>
            <CamVoiceToggle />
          </div>*/}
        </div>
      </section>

      {/* About Us Section */}
      <section
        ref={aboutUsRef}
        className="relative py-20 px-8 bg-black overflow-hidden"
      >
        <div className="relative max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-5xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-white via-gray-200 to-cyan-400 bg-clip-text text-transparent leading-tight">
              Today's Workout 
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Before your AI-powered gym coach can assist
              <br /> you, please make sure the following is finished:
            </p>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              <br />- Toggle your camera and voice settings below.
              <br />- Position your camera towards you as you workout.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400 mb-20">
            <p>
              Computer Vision Screen
            </p>
          </div>

          {/* Example highlights */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400 mb-20">
            {["Real-time feedback", "Form correction", "AI coaching"].map(
              (text, i) => (
                <span key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  {text}
                </span>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default WorkoutPage;
