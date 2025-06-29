import React, { useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";

function ComputerVisionScreen() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [exerciseMode, setExerciseMode] = useState("pushup");
  const [analysis, setAnalysis] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Initialize socket connection
  useEffect(() => {
    const connectSocket = () => {
      socketRef.current = io("http://localhost:5000", {
        transports: ["websocket", "polling"],
        timeout: 5000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socketRef.current.on("connect", () => {
        setConnectionStatus("connected");
        console.log("Connected to computer vision server");
      });

      socketRef.current.on("disconnect", (reason) => {
        setConnectionStatus("disconnected");
        console.log("Disconnected from server:", reason);
      });

      socketRef.current.on("connect_error", (error) => {
        setConnectionStatus("error");
        console.error("Connection error:", error);
      });

      socketRef.current.on("connection_response", (data) => {
        console.log("Server response:", data.message);
      });

      socketRef.current.on("analysis_result", (data) => {
        if (data.error) {
          console.error("Analysis error:", data.error);
        } else {
          setAnalysis(data);
          drawPoseLandmarks(data.landmarks);
        }
      });
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setCameraOn(true);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStream(null);
    }
    setCameraOn(false);
    stopAnalysis();
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const sendFrameForAnalysis = () => {
    if (!cameraOn || connectionStatus !== "connected") return;

    const frameData = captureFrame();
    if (frameData && socketRef.current) {
      socketRef.current.emit("video_frame", {
        image: frameData,
        exercise_mode: exerciseMode,
      });
    }
  };

  const startAnalysis = () => {
    if (!cameraOn) {
      alert("Please turn on the camera first");
      return;
    }

    if (connectionStatus !== "connected") {
      alert("Not connected to analysis server");
      return;
    }

    setIsAnalyzing(true);
    // Send frames every 200ms for real-time analysis
    intervalRef.current = setInterval(sendFrameForAnalysis, 200);
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setAnalysis(null);
    clearCanvas();
  };

  const drawPoseLandmarks = (landmarks) => {
    if (!landmarks || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const video = videoRef.current;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pose landmarks
    ctx.fillStyle = "#00ff00";
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;

    const width = video.videoWidth;
    const height = video.videoHeight;

    // Draw landmarks as circles
    landmarks.forEach((landmark, index) => {
      if (landmark.visibility > 0.5) {
        const x = landmark.x * width;
        const y = landmark.y * height;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw connections for key points based on exercise
    if (exerciseMode === "pushup") {
      drawConnection(landmarks, 11, 13, ctx, width, height); // Left shoulder to elbow
      drawConnection(landmarks, 13, 15, ctx, width, height); // Left elbow to wrist
      drawConnection(landmarks, 12, 14, ctx, width, height); // Right shoulder to elbow
      drawConnection(landmarks, 14, 16, ctx, width, height); // Right elbow to wrist
    } else if (exerciseMode === "squat") {
      drawConnection(landmarks, 23, 25, ctx, width, height); // Left hip to knee
      drawConnection(landmarks, 25, 27, ctx, width, height); // Left knee to ankle
      drawConnection(landmarks, 24, 26, ctx, width, height); // Right hip to knee
      drawConnection(landmarks, 26, 28, ctx, width, height); // Right knee to ankle
    }
  };

  const drawConnection = (landmarks, pointA, pointB, ctx, width, height) => {
    if (
      landmarks[pointA] &&
      landmarks[pointB] &&
      landmarks[pointA].visibility > 0.5 &&
      landmarks[pointB].visibility > 0.5
    ) {
      ctx.beginPath();
      ctx.moveTo(landmarks[pointA].x * width, landmarks[pointA].y * height);
      ctx.lineTo(landmarks[pointB].x * width, landmarks[pointB].y * height);
      ctx.stroke();
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gray-900 rounded-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          Exercise Form Analyzer
        </h2>

        {/* Connection Status */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`w-3 h-3 rounded-full ${
              connectionStatus === "connected" ? "bg-green-400" : "bg-red-400"
            }`}
          ></div>
          <span className="text-white text-sm">
            Server:{" "}
            {connectionStatus === "connected" ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* Exercise Mode Selection */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setExerciseMode("pushup")}
            className={`px-4 py-2 rounded ${
              exerciseMode === "pushup"
                ? "bg-blue-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
            }`}
          >
            Push-up Mode
          </button>
          <button
            onClick={() => setExerciseMode("squat")}
            className={`px-4 py-2 rounded ${
              exerciseMode === "squat"
                ? "bg-blue-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
            }`}
          >
            Squat Mode
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className="relative w-full max-w-2xl mx-auto mb-6">
        <div className="relative bg-gray-800 border-2 border-gray-500 rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-auto object-cover"
            autoPlay
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ mixBlendMode: "screen" }}
          />

          {/* Camera Controls */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            <button
              onClick={cameraOn ? stopCamera : startCamera}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              {cameraOn ? "Stop Camera" : "Start Camera"}
            </button>

            {cameraOn && (
              <button
                onClick={isAnalyzing ? stopAnalysis : startAnalysis}
                className={`px-4 py-2 rounded transition-colors ${
                  isAnalyzing
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : "bg-green-600 hover:bg-green-500 text-white"
                }`}
              >
                {isAnalyzing ? "Stop Analysis" : "Start Analysis"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Form Analysis</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Score */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-2">Score</h4>
              <div
                className={`text-3xl font-bold ${getScoreColor(
                  analysis.analysis.score
                )}`}
              >
                {analysis.analysis.score}/100
              </div>
              <div className="text-gray-300 text-sm mt-1">
                Angle: {analysis.analysis.angle}°
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-2">
                Feedback
              </h4>
              <div className="space-y-1">
                {analysis.analysis.feedback.map((feedback, index) => (
                  <div key={index} className="text-gray-300 text-sm">
                    • {feedback}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-white mb-2">Instructions</h4>
        <div className="text-gray-300 text-sm space-y-1">
          <p>1. Make sure your Flask server is running on localhost:5000</p>
          <p>2. Select your exercise mode (Push-up or Squat)</p>
          <p>3. Turn on your camera and position yourself in frame</p>
          <p>4. Click "Start Analysis" to begin real-time form checking</p>
          <p>5. Follow the feedback to improve your form</p>
        </div>
      </div>
    </div>
  );
}

export default ComputerVisionScreen;
