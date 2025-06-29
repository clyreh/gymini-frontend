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

  // Full skeleton connections for complete body structure
  const skeletonConnections = [
    // Face outline
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 7],
    [0, 4],
    [4, 5],
    [5, 6],
    [6, 8],

    // Upper body
    [9, 10], // mouth
    [11, 12], // shoulders
    [11, 13],
    [13, 15], // left arm
    [12, 14],
    [14, 16], // right arm

    // Hands
    [15, 17],
    [15, 19],
    [15, 21],
    [17, 19], // left hand
    [16, 18],
    [16, 20],
    [16, 22],
    [18, 20], // right hand

    // Torso
    [11, 23],
    [12, 24],
    [23, 24], // torso connection

    // Legs
    [23, 25],
    [25, 27], // left leg
    [24, 26],
    [26, 28], // right leg

    // Feet
    [27, 29],
    [27, 31], // left foot
    [28, 30],
    [28, 32], // right foot
  ];

  useEffect(() => {
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
        drawSkeletonPose(data.landmarks, data.analysis?.score);
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    const setCanvasSize = () => {
      if (videoRef.current && canvasRef.current) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
      }
    };
    videoRef.current?.addEventListener("loadedmetadata", setCanvasSize);
    return () =>
      videoRef.current?.removeEventListener("loadedmetadata", setCanvasSize);
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

  const drawSkeletonPose = (landmarks, score = 100) => {
    if (!landmarks || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Set dynamic line color based on score
    let color = "#00ff00"; // green
    if (score < 60) color = "#ff0000"; // red
    else if (score < 80) color = "#ffff00"; // yellow

    // Draw skeleton connections (bones)
    ctx.strokeStyle = color;
    ctx.lineWidth = 3; // Thicker lines for skeleton effect
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw all skeleton connections
    skeletonConnections.forEach(([pointA, pointB]) => {
      drawSkeletonConnection(
        landmarks,
        pointA,
        pointB,
        ctx,
        width,
        height,
        color
      );
    });

    // Highlight specific connections based on exercise mode
    if (exerciseMode === "pushup") {
      // Emphasize arm connections for push-ups
      ctx.lineWidth = 4;
      ctx.strokeStyle = color;
      drawSkeletonConnection(landmarks, 11, 13, ctx, width, height, color);
      drawSkeletonConnection(landmarks, 13, 15, ctx, width, height, color);
      drawSkeletonConnection(landmarks, 12, 14, ctx, width, height, color);
      drawSkeletonConnection(landmarks, 14, 16, ctx, width, height, color);
    } else if (exerciseMode === "squat") {
      // Emphasize leg connections for squats
      ctx.lineWidth = 4;
      ctx.strokeStyle = color;
      drawSkeletonConnection(landmarks, 23, 25, ctx, width, height, color);
      drawSkeletonConnection(landmarks, 25, 27, ctx, width, height, color);
      drawSkeletonConnection(landmarks, 24, 26, ctx, width, height, color);
      drawSkeletonConnection(landmarks, 26, 28, ctx, width, height, color);
    }

    // Draw small joint points only at key positions
    ctx.fillStyle = color;
    const keyJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]; // shoulders, elbows, wrists, hips, knees, ankles

    keyJoints.forEach((jointIndex) => {
      if (landmarks[jointIndex] && landmarks[jointIndex].visibility > 0.5) {
        const x = landmarks[jointIndex].x * width;
        const y = landmarks[jointIndex].y * height;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI); // Very small joint points
        ctx.fill();
      }
    });
  };

  const drawSkeletonConnection = (
    landmarks,
    pointA,
    pointB,
    ctx,
    width,
    height,
    color
  ) => {
    if (
      landmarks[pointA] &&
      landmarks[pointB] &&
      landmarks[pointA].visibility > 0.5 &&
      landmarks[pointB].visibility > 0.5
    ) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(landmarks[pointA].x * width, landmarks[pointA].y * height);
      ctx.lineTo(landmarks[pointB].x * width, landmarks[pointB].y * height);
      ctx.stroke();
    }
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
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
          Skeleton Exercise Form Analyzer
        </h2>

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
          />

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

      {analysis && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Form Analysis</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </div>
  );
}

export default ComputerVisionScreen;
