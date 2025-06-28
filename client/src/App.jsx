import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import "./index.css";
import LandingPage from "./pages/LandingPage";
import ChatbotPage from "./pages/ChatbotPage";
import WorkoutPage from "./pages/WorkoutPage";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/cbp" element={<ChatbotPage />} />
          <Route path="/wkp" element={<WorkoutPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
