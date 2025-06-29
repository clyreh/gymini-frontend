import React, { useRef } from "react";
import { Link } from "react-router-dom";
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

import photo1 from "../assets/photo1.png";
import photo2 from "../assets/photo2.jpeg";
import photo3 from "../assets/photo3.jpeg";
import photo4 from "../assets/photo4.jpeg";

const LandingPage = () => {
  const appRef = useRef(null);
  const aboutUsRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleHeadToApp = () => {
    // Handle navigation to app
    console.log("Navigate to app");
  };

  const features = [
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Real-time Analysis",
      description:
        "Advanced computer vision technology analyzes your form in real-time during workouts.",
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Form Correction",
      description:
        "Get instant feedback and corrections to improve your technique and prevent injuries.",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Progress Tracking",
      description:
        "Track your improvements over time with detailed analytics and performance metrics.",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Injury Prevention",
      description:
        "AI-powered safety alerts help you maintain proper form and avoid common workout injuries.",
    },
  ];

  const aboutUs = [
    {
      title: "Zahrah",
      role: "Fullstack Developer",
      avatar: photo1,
      linkedin: "https://www.linkedin.com/in/zahrah-rashid/",
    },
    {
      title: "Cheryl",
      role: "Frontend Developer",
      avatar: photo2,
      linkedin: "https://www.linkedin.com/in/cheryl-n-88171a34b/",
    },
    {
      title: "Camila",
      role: "Backend Developer",
      avatar: photo3,
      linkedin: "https://linkedin.com/",
    },
    {
      title: "Kiara",
      role: "Backend Developer",
      avatar: photo4,
      linkedin: "https://linkedin.com/",
    },
  ];

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
              Gymini
            </button>
          </div>

          {/* Center: Navigation */}
          <div className="flex-1 flex justify-center space-x-16">
            <button
              onClick={() => scrollToSection(appRef)}
              className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 font-medium"
            >
              What is Gymini?
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
              Start Training
            </button>
          </div>
        </div>
      </nav>
      {/* Hero */}
      <section
        ref={appRef}
        className="pt-36 pb-24 px-8 bg-gradient-to-b from-black/50 to-gray-900/30"
      >
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-16">
            <h1 className="text-6xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-gray-200 to-cyan-400 bg-clip-text text-transparent leading-tight">
              Smarter Training Starts Here
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-4">
              Your AI-powered personal trainer — designed to guide, correct, and
              push you.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <Link
              to="/wkp"
              className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 flex items-center gap-3"
            >
              <Play className="w-5 h-5" />
              Try It Now
            </Link>

            <button
              onClick={() => scrollToSection(aboutUsRef)}
              className="px-10 py-5 border-2 border-cyan-500 text-cyan-300 rounded-full text-lg font-semibold hover:bg-cyan-500/10 transition-all duration-300 flex items-center gap-3"
            >
              Learn About Us
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Highlights */}
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

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-gray-800/80 to-black/60 rounded-2xl p-8 border border-gray-600/30 hover:border-cyan-400/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/10"
              >
                <div className="text-cyan-400 mb-6 group-hover:text-cyan-300 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-white group-hover:text-cyan-200 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* About Us */}
      <section
        ref={aboutUsRef}
        className="relative py-20 px-8 bg-black overflow-hidden"
      >
        {/* Geometric Grid Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/15 to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Header - Updated to match Hero section */}
          <div className="mb-16 text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-white via-gray-200 to-cyan-400 bg-clip-text text-transparent leading-tight">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              The innovators behind AppName, dedicated to revolutionizing your
              fitness journey.
            </p>
          </div>

          {/* Team Cards - 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {aboutUs.map((member, index) => (
              <div
                key={index}
                className="group relative border border-slate-800 bg-slate-900/20 hover:border-cyan-400/40 transition-all duration-500 hover:-translate-y-1"
              >
                {/* Index Number */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="text-2xl font-thin text-slate-700 group-hover:text-slate-600 transition-colors duration-500 select-none">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="flex">
                  {/* Image Section */}
                  <div className="w-1/2 bg-slate-600 flex items-center justify-center text-white p-8">
                    <div className="text-center">
                      <img
                        src={member.avatar}
                        alt={member.title}
                        className="w-24 h-24 rounded-full object-cover mb-4"
                      />
                      <div className="text-xs uppercase tracking-wider opacity-70">
                        {member.title}
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="w-1/2 p-6 flex flex-col justify-center space-y-4">
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-100 transition-colors duration-300 uppercase tracking-wide">
                      {member.title}
                    </h3>

                    <p className="text-gray-400 font-medium tracking-wide text-sm">
                      {member.role}
                    </p>

                    {member.linkedin && (
                      <div className="pt-2">
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-gray-500 hover:text-cyan-400 transition-colors duration-300 uppercase tracking-wider font-medium"
                        >
                          <Linkedin className="h-3 w-3 mr-2" />
                          LinkedIn
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Border Accent */}
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent group-hover:via-cyan-400/40 transition-all duration-500" />
              </div>
            ))}
          </div>

          {/* Bottom Accent */}
          <div className="mt-20 flex items-center justify-center">
            <div className="flex items-center gap-4">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-slate-600" />
              <div className="w-2 h-2 rounded-full bg-cyan-400/60" />
              <div className="w-8 h-px bg-gradient-to-l from-transparent to-slate-600" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
