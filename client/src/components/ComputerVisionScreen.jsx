import React, { useRef, useEffect, useState } from "react";

function ComputerVisionScreen() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setCameraOn(true);
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStream(null);
    }
    setCameraOn(false);
  };

  return (
    <div className="relative w-full max-w-xl h-96 bg-gray-800 border-2 border-gray-500 rounded-xl mx-auto mb-8 overflow-hidden">
      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted />
      <button
        onClick={cameraOn ? stopCamera : startCamera}
        className="absolute top-4 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-300 z-10"
      >
        {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
      </button>
    </div>
  );
}

export default ComputerVisionScreen;
