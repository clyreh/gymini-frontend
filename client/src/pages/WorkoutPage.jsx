import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import CamVoiceToggle from "../components/CamVoiceToggle";
import ComputerVisionScreen from "../components/ComputerVisionScreen";
import { Play, ChevronDown, CheckCircle } from "lucide-react";

function WorkoutPage() {
  const [userName, setUserName] = useState("");
  const [mode, setMode] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("Neutral");

  const workoutRef = useRef(null);
  const todaysWorkoutRef = useRef(null);

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
  const handleHeadToChtBot = () => {
    // Handle navigation to app
    navigate("/cbp");
  };

  const modeStyles = {
    Neutral: {
      bgGradient: "from-gray-950 via-gray-900 to-gray-800",
      accent: "cyan-500",
    },
    Gymbro: {
      bgGradient: "from-gray-950 via-red-900 to-red-500",
      accent: "red-500",
    },
    Gymgirl: {
      bgGradient: "from-gray-950 via-pink-900 to-pink-500",
      accent: "pink-500",
    },
  };

  const currentStyle = modeStyles[selectedVoice];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-gray-950/90 backdrop-blur-sm z-50 border-b border-gray-700/50">
        <div className="relative flex items-center h-20 px-8 max-w-7xl mx-auto">
          <div className="absolute left-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent hover:from-cyan-300 hover:to-indigo-400 transition-all duration-300"
            >
              Gymini
            </button>
          </div>

          <div className="flex-1 flex justify-center space-x-16">
            <Link
              to="/"
              className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 font-medium"
            >
              Home
            </Link>
            <button
              onClick={() => scrollToSection(todaysWorkoutRef)}
              className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 font-medium"
            >
              Today's Workout
            </button>
          </div>
          <div className="absolute right-8">
            <Link to="/cbp">
              <button className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30">
                Personalized Plan
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={workoutRef}
        className="pt-32 pb-24 px-8 bg-gradient-to-b from-black/50 to-gray-900/30"
      >
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-16">
            <h1 className="text-5xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-white via-gray-200 to-cyan-400 bg-clip-text text-transparent leading-tight">
              Welcome to your Workout Tracker!
            </h1>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-4">
              Get ready for your personalized workout session today created just
              for you by our AI coach.
              <br />
              Get ready to track your progress, improve your form, and crush
              your goals today.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <button
              onClick={() => scrollToSection(todaysWorkoutRef)}
              className="px-5 py-3 bg-cyan-500 text-white rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 flex items-center gap-3"
            >
              <Play className="w-5 h-5" />
              Start Workout
            </button>
            <button className="px-5 py-3 border-2 border-cyan-500 text-cyan-300 rounded-full text-lg font-semibold hover:bg-cyan-500/10 transition-all duration-300 flex items-center gap-3">
              Revise Workout
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Today's Workout Section - mode-dependent styling */}
      <section
        ref={todaysWorkoutRef}
        className={`relative py-20 px-8 overflow-hidden bg-gradient-to-br ${currentStyle.bgGradient}`}
      >
        <div className="relative max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-5xl md:text-5xl font-bold mb-20 bg-gradient-to-r from-white via-gray-200 to-cyan-400 bg-clip-text text-transparent leading-tight">
              Today's Workout
            </h2>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Before your AI-powered gym coach can assist you, please make sure
              the following is finished:
            </p>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mt-4 mb-20">
              - Toggle your camera and voice settings below.
              <br />- Position your camera towards you as you workout.
            </p>

            {/* Voice Mode Selection */}
            <div className="mt-8 text-center">
              <h3 className="text-3xl font-bold mb-8">Voice Mode Selection</h3>
              <div className="flex justify-center gap-4">
                {["Gymbro", "Neutral", "Gymgirl"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedVoice(mode)}
                    className={`px-6 py-2 rounded-full font-semibold transition-colors duration-300 ${
                      selectedVoice === mode
                        ? `bg-${currentStyle.accent} text-white`
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-gray-400">
                Selected Voice Mode: {selectedVoice}
              </p>
            </div>
          </div>

          <div className="flex justify-center mb-20">
            <ComputerVisionScreen />
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400 mb-20">
            {["Real-time feedback", "Form correction", "AI coaching"].map(
              (text, i) => (
                <span key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
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
