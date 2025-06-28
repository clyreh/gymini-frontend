import React, { useEffect, useState } from "react";
import "./WorkoutPage.css";
import CamVoiceToggle from "../components/CamVoiceToggle";

function WorkoutPage() {
  // Create variables to store workout data, the selected mode, & user information from the chatbot
  const [userName, setUserName] = useState("");
  const [mode, setMode] = useState("");

  // Hold the workout plan from the chatbot data
  const [workoutPlan, setWorkoutPlan] = useState([]);

  // Then, load the user data and workout data
  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "");
    setMode(localStorage.getItem("mode") || "");
  }, []);

  // What the user will see
  return (
    <div className="WorkoutPage">
      <h1>Workout Tracker</h1>
      <h2>Hi {userName}, ready for today's workout?</h2>
      <h2>Mode: {mode}</h2>

      <div className="TodaysWorkout">
        <h3>Today's Workout:</h3>
      </div>

      {/* Make the the buttons lead to the camera box or the chatbox */}
      <div className="buttons">
        <button
          className="startWorkoutButton"
          onClick={() => alert("Starting workout...")}
        >
          Yes, start my workout!
        </button>
        <button
          className="reviseWorkoutButton"
          onClick={() => alert("Revising workout...")}
        >
          No, revise my workout!
        </button>
      </div>

      <div className="Workout">
        <h1>Starting today's workout...</h1>
        <p>Receive real-time feedback on your form!</p>
        <p>
          Toggle on your video camera and the AI voice chat, and position your
          camera to begin!
        </p>
        {/* Create toggle buttons */}
        <div className="toggleButtons">
          <CamVoiceToggle />
        </div>
      </div>
    </div>
  );
}

export default WorkoutPage;
