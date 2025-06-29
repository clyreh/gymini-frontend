import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Dumbbell,
  Activity,
  Clock,
  Target,
  Settings,
  ChevronDown,
  CheckCircle,
  Loader,
  Volume2,
  VolumeX,
  Mic,
} from "lucide-react";

const ChatbotPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    height: "",
    weight: "",
    goal: "",
    fitness_level: "",
    available_equipment: "",
    available_time_per_session: "",
    days_per_week: "",
    target_muscle_groups: "",
    limitations: "",
    experience_level: "",
  });
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content:
        "Hi! I'm your AI fitness coach powered by Gemini AI. I'll help you create a personalized workout plan with voice feedback options. Let's start by getting to know you better!",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [voiceSettings, setVoiceSettings] = useState({
    enabled: false,
    tone: "neutral", // neutral, gymbro, girly
  });
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const messagesEndRef = useRef(null);

  const formFields = [
    {
      key: "name",
      label: "What's your name?",
      type: "text",
      icon: <User className="w-5 h-5" />,
    },
    {
      key: "gender",
      label: "What's your gender?",
      type: "select",
      options: ["Male", "Female", "Other"],
      icon: <User className="w-5 h-5" />,
    },
    {
      key: "height",
      label: "What's your height in inches?",
      type: "text",
      icon: <Activity className="w-5 h-5" />,
    },
    {
      key: "weight",
      label: "What's your weight? (in kg or lbs)",
      type: "text",
      icon: <Activity className="w-5 h-5" />,
    },
    {
      key: "goal",
      label: "What's your primary fitness goal?",
      type: "select",
      options: [
        "Weight Loss",
        "Muscle Gain",
        "Strength Building",
        "Endurance",
        "General Fitness",
        "Toning",
      ],
      icon: <Target className="w-5 h-5" />,
    },
    {
      key: "fitness_level",
      label: "What's your current fitness level?",
      type: "select",
      options: ["Beginner", "Intermediate", "Advanced"],
      icon: <Activity className="w-5 h-5" />,
    },
    {
      key: "available_equipment",
      label: "What equipment do you have access to?",
      type: "select",
      options: [
        "Bodyweight only",
        "Home gym (dumbbells, resistance bands)",
        "Full gym access",
        "Limited equipment",
      ],
      icon: <Dumbbell className="w-5 h-5" />,
    },
    {
      key: "available_time_per_session",
      label: "How much time can you dedicate per session? (minutes)",
      type: "select",
      options: ["15", "30", "45", "60", "90", "120"],
      icon: <Clock className="w-5 h-5" />,
    },
    {
      key: "days_per_week",
      label: "How many days per week can you work out?",
      type: "select",
      options: ["1", "2", "3", "4", "5", "6", "7"],
      icon: <Clock className="w-5 h-5" />,
    },
    {
      key: "target_muscle_groups",
      label: "Which muscle groups do you want to focus on?",
      type: "select",
      options: [
        "Full body",
        "Upper body",
        "Lower body",
        "Core",
        "Arms",
        "Legs",
        "Back",
        "Chest",
      ],
      icon: <Target className="w-5 h-5" />,
    },
    {
      key: "limitations",
      label: "Do you have any injuries or limitations?",
      type: "text",
      placeholder: 'e.g., knee injury, back problems, or "none"',
      icon: <Settings className="w-5 h-5" />,
    },
    {
      key: "experience_level",
      label: "How would you describe your exercise experience?",
      type: "select",
      options: [
        "Complete beginner",
        "Some experience",
        "Experienced",
        "Very experienced",
      ],
      icon: <Activity className="w-5 h-5" />,
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (value) => {
    const field = formFields[currentStep];
    setFormData((prev) => ({
      ...prev,
      [field.key]: value,
    }));
  };

  // Enhanced API call to your Gemini backend
  const callGeminiAPI = async (inputs, endpoint = "workout-plan") => {
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...inputs,
          voice_enabled: voiceSettings.enabled,
          voice_tone: voiceSettings.tone,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return (
        data.workout_plan ||
        data.response ||
        data.message ||
        "Sorry, I couldn't process your request at this time."
      );
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return "Sorry, there was an error connecting to the AI service. Please check your internet connection and try again.";
    }
  };

  // Voice output API call
  const callVoiceAPI = async (text, tone = "neutral") => {
    if (!voiceSettings.enabled) return;

    try {
      const response = await fetch("/api/voice-output", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          tone: tone,
          async: true,
        }),
      });

      if (!response.ok) {
        console.error("Voice API error:", response.status);
      }
    } catch (error) {
      console.error("Error calling Voice API:", error);
    }
  };

  const handleSubmit = async () => {
    const field = formFields[currentStep];
    const value = formData[field.key];

    if (!value.trim()) return;

    // Add user message
    const userMessage = { type: "user", content: value };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);

    // Simulate bot response delay
    setTimeout(async () => {
      if (currentStep < formFields.length - 1) {
        // Next question
        const nextField = formFields[currentStep + 1];
        const botResponse = `Great! ${nextField.label}`;
        const botMessage = {
          type: "bot",
          content: botResponse,
        };
        setMessages((prev) => [...prev, botMessage]);

        // Voice output for next question
        if (voiceSettings.enabled) {
          await callVoiceAPI(botResponse, voiceSettings.tone);
        }

        setCurrentStep(currentStep + 1);
      } else {
        // All questions completed - generate workout plan
        const botResponse =
          "Perfect! I have all the information I need. Let me create your personalized workout plan using Gemini AI...";
        const botMessage = {
          type: "bot",
          content: botResponse,
        };
        setMessages((prev) => [...prev, botMessage]);

        if (voiceSettings.enabled) {
          await callVoiceAPI(botResponse, voiceSettings.tone);
        }

        // Generate workout plan with Gemini AI
        await generateWorkoutPlan();
      }
      setIsLoading(false);
    }, 1000);
  };

  const generateWorkoutPlan = async () => {
    setIsLoading(true);

    try {
      // Call your Gemini API with the form data
      const workoutPlan = await callGeminiAPI(formData, "workout-plan");

      const botMessage = {
        type: "bot",
        content: workoutPlan,
      };
      setMessages((prev) => [...prev, botMessage]);

      // Voice output for workout plan
      if (voiceSettings.enabled) {
        // For long workout plans, speak a summary instead of the full text
        const summary = `Your personalized workout plan has been generated! It includes a ${
          formData.days_per_week
        }-day weekly schedule focused on ${formData.goal.toLowerCase()}. Check the details above and feel free to ask me any questions!`;
        await callVoiceAPI(summary, voiceSettings.tone);
      }

      setShowChat(true);
    } catch (error) {
      const errorMessage = {
        type: "bot",
        content:
          "I apologize, but I encountered an error while generating your workout plan. Please try again or contact support if the issue persists.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    // Add user message
    const userMessage = { type: "user", content: chatInput };
    setMessages((prev) => [...prev, userMessage]);

    const currentInput = chatInput;
    setChatInput("");
    setIsLoading(true);

    try {
      // Create a follow-up prompt that includes the original form data and the new question
      const followUpInputs = {
        ...formData,
        follow_up_question: currentInput,
        context:
          "This is a follow-up question about the previously generated workout plan.",
      };

      const response = await callGeminiAPI(followUpInputs, "chat");

      const botMessage = {
        type: "bot",
        content: response,
      };
      setMessages((prev) => [...prev, botMessage]);

      // Voice output for chat response
      if (voiceSettings.enabled) {
        await callVoiceAPI(response, voiceSettings.tone);
      }
    } catch (error) {
      const errorMessage = {
        type: "bot",
        content:
          "Sorry, I couldn't process your question at the moment. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceSettings = () => {
    setShowVoiceSettings(!showVoiceSettings);
  };

  const updateVoiceSettings = (newSettings) => {
    setVoiceSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const renderInput = () => {
    const field = formFields[currentStep];

    if (field.type === "select") {
      return (
        <div className="relative">
          <select
            value={formData[field.key]}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 appearance-none pr-10"
          >
            <option value="">Select an option...</option>
            {field.options.map((option) => (
              <option key={option} value={option} className="bg-gray-800">
                {option}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      );
    }

    return (
      <input
        type="text"
        value={formData[field.key]}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={
          field.placeholder || `Enter your ${field.label.toLowerCase()}`
        }
        className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
      {/* Header */}
      <div className="bg-gray-950/90 backdrop-blur-sm border-b border-gray-700/50 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-xl">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
                AI Workout Coach
              </h1>
              <p className="text-gray-400">
                Powered by Gemini AI - Your personalized fitness companion with
                voice feedback
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Voice Settings Toggle */}
            <button
              onClick={toggleVoiceSettings}
              className={`p-2 rounded-lg transition-all duration-200 ${
                voiceSettings.enabled
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30"
                  : "bg-gray-700/50 text-gray-400 border border-gray-600/50"
              }`}
              title="Voice Settings"
            >
              {voiceSettings.enabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              {currentStep + 1} of {formFields.length}
            </div>
          </div>
        </div>

        {/* Voice Settings Panel */}
        {showVoiceSettings && (
          <div className="max-w-4xl mx-auto mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-600/50">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Voice Settings
            </h3>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={voiceSettings.enabled}
                  onChange={(e) =>
                    updateVoiceSettings({ enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-cyan-400 bg-gray-700 border-gray-600 rounded focus:ring-cyan-400"
                />
                <span>Enable Voice Output</span>
              </label>

              {voiceSettings.enabled && (
                <div className="flex items-center gap-2">
                  <span>Voice Tone:</span>
                  <select
                    value={voiceSettings.tone}
                    onChange={(e) =>
                      updateVoiceSettings({ tone: e.target.value })
                    }
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                  >
                    <option value="neutral">Neutral</option>
                    <option value="gymbro">Gym Bro</option>
                    <option value="girly">Friendly</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-900/50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-600 to-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / formFields.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto p-6 flex flex-col h-[calc(100vh-280px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-start gap-3 max-w-3xl ${
                  message.type === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`p-2 rounded-full ${
                    message.type === "user"
                      ? "bg-gradient-to-r from-indigo-600 to-cyan-500"
                      : "bg-gray-700"
                  }`}
                >
                  {message.type === "user" ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>
                <div
                  className={`p-4 rounded-2xl ${
                    message.type === "user"
                      ? "bg-gradient-to-r from-indigo-600/20 to-cyan-500/20 border border-indigo-500/30"
                      : "bg-gray-800/50 border border-gray-600/50"
                  }`}
                >
                  <pre className="whitespace-pre-wrap text-gray-100 font-sans">
                    {message.content}
                  </pre>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-gray-700">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="p-4 rounded-2xl bg-gray-800/50 border border-gray-600/50">
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin text-cyan-400" />
                    <span className="text-gray-300">
                      {showChat
                        ? "Processing with Gemini AI..."
                        : "Generating your AI-powered workout plan..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        {currentStep < formFields.length && !showChat && (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-600/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              {formFields[currentStep].icon}
              <h3 className="text-lg font-semibold text-white">
                {formFields[currentStep].label}
              </h3>
            </div>

            <div className="flex gap-3">
              {renderInput()}
              <button
                onClick={handleSubmit}
                disabled={
                  !formData[formFields[currentStep].key].trim() || isLoading
                }
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send
              </button>
            </div>
          </div>
        )}

        {/* Chat Input (shown after form completion) */}
        {showChat && (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-600/50 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleChatSubmit()}
                placeholder="Ask me anything about your workout plan..."
                className="flex-1 bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
              <button
                onClick={handleChatSubmit}
                disabled={!chatInput.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              💡 Try asking: "Can you modify this plan?" "What if I miss a day?"
              or "Explain this exercise"
              {voiceSettings.enabled && (
                <span className="ml-2 text-cyan-400">
                  🔊 Voice responses enabled
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotPage;
