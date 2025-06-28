import React, { useState } from "react";

function CamVoiceToggle() {
  const [cameraOn, setCameraOn] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);

  return (
    <div className="toggleButtons">
      <button onClick={() => setCameraOn(!cameraOn)}>
        {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
      </button>
      <button onClick={() => setVoiceOn(!voiceOn)}>
        {voiceOn ? "Turn Voice Off" : "Turn Voice On"}
      </button>
    </div>
  );
}

export default CamVoiceToggle;
