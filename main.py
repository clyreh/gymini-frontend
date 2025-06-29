import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import pyttsx3
import threading
from contextlib import asynccontextmanager
import uvicorn
import asyncio
from concurrent.futures import ThreadPoolExecutor
import json

# Pydantic Models for Request/Response
class WorkoutPlanRequest(BaseModel):
    name: str = ""
    gender: str = ""
    height: str = ""
    weight: str = ""
    goal: str
    fitness_level: str
    available_equipment: str = "Bodyweight only"
    available_time_per_session: str
    days_per_week: str
    target_muscle_groups: str = "Full body"
    limitations: str = "None"
    experience_level: str = "Beginner"
    voice_enabled: bool = False
    voice_tone: str = "neutral"

class ChatRequest(BaseModel):
    name: str = ""
    gender: str = ""
    height: str = ""
    weight: str = ""
    goal: str = ""
    fitness_level: str = ""
    available_equipment: str = ""
    available_time_per_session: str = ""
    days_per_week: str = ""
    target_muscle_groups: str = ""
    limitations: str = ""
    experience_level: str = ""
    follow_up_question: str
    context: str = ""
    voice_enabled: bool = False
    voice_tone: str = "neutral"

class VoiceOutputRequest(BaseModel):
    text: str
    tone: str = "neutral"
    async_speech: bool = Field(default=True, alias="async")

class VoiceToFileRequest(BaseModel):
    text: str
    tone: str = "neutral"  
    filename: str = "output.wav"

class WorkoutPlanResponse(BaseModel):
    workout_plan: str
    success: bool
    voice_enabled: bool
    user_profile: Dict[str, Any]

class ChatResponse(BaseModel):
    response: str
    success: bool
    voice_enabled: bool
    question: str

class VoiceResponse(BaseModel):
    message: str
    success: bool
    tone: str
    async_speech: bool = Field(alias="async")
    text_length: int

class ErrorResponse(BaseModel):
    error: str
    success: bool = False

# Gemini AI Class
class GeminiAI:
    def __init__(self, api_key: str):
        self.api_key = api_key
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash-exp")
        self.tts_engine = None
        self.voice_profiles = {}
        self.setup_tts()
        
    def setup_tts(self):
        """Initialize TTS engine and voice profiles"""
        try:
            self.tts_engine = pyttsx3.init()
            self.setup_voice_profiles()
        except Exception as e:
            print(f"TTS initialization error: {e}")
            self.tts_engine = None

    def setup_voice_profiles(self):
        """Setup voice profiles for different tones"""
        if not self.tts_engine:
            return
            
        voices = self.tts_engine.getProperty('voices')
        
        self.voice_profiles = {
            "neutral": {
                "voice_index": 0,
                "rate": 180,
                "volume": 0.8,
                "pitch": 0
            },
            "gymbro": {
                "voice_index": 0,
                "rate": 220,
                "volume": 0.95,
                "pitch": -10
            },
            "girly": {
                "voice_index": 1 if len(voices) > 1 else 0,
                "rate": 160,
                "volume": 0.7,
                "pitch": 10
            }
        }

    async def chat(self, prompt: str) -> str:
        """Generate text response using Gemini"""
        try:
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor() as executor:
                response = await loop.run_in_executor(
                    executor, 
                    lambda: self.model.generate_content(prompt)
                )
            return response.text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

    def _configure_voice(self, profile: dict):
        """Configure TTS engine with voice profile settings"""
        if not self.tts_engine:
            return
            
        voices = self.tts_engine.getProperty('voices')
        
        if profile["voice_index"] < len(voices):
            self.tts_engine.setProperty('voice', voices[profile["voice_index"]].id)
        
        self.tts_engine.setProperty('rate', profile["rate"])
        self.tts_engine.setProperty('volume', profile["volume"])

    def _speak_text(self, text: str):
        """Speak the given text using TTS engine"""
        if not self.tts_engine:
            return
            
        try:
            self.tts_engine.say(text)
            self.tts_engine.runAndWait()
        except Exception as e:
            print(f"TTS Error: {e}")

    async def voice_tone_output(self, text: str, tone: str = "neutral", speak_async: bool = True):
        """Generate voice output with specified tone"""
        if not self.tts_engine:
            return
            
        profile = self.voice_profiles.get(tone.lower(), self.voice_profiles["neutral"])
        self._configure_voice(profile)
        
        if speak_async:
            thread = threading.Thread(
                target=self._speak_text,
                args=(text,),
                daemon=True
            )
            thread.start()
        else:
            self._speak_text(text)

    async def voice_tone_output_to_file(self, text: str, tone: str = "neutral", filename: str = "output.wav"):
        """Generate voice output and save to file"""
        if not self.tts_engine:
            return text
            
        profile = self.voice_profiles.get(tone.lower(), self.voice_profiles["neutral"])
        self._configure_voice(profile)
        
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            await loop.run_in_executor(
                executor,
                lambda: self._save_to_file(text, filename)
            )
        
        return text

    def _save_to_file(self, text: str, filename: str):
        """Save text to audio file"""
        try:
            self.tts_engine.save_to_file(text, filename)
            self.tts_engine.runAndWait()
        except Exception as e:
            print(f"TTS file save error: {e}")

    async def workout_plan_chatbot(self, inputs: Dict[str, Any]) -> str:
        """Create a workout plan using Gemini"""
        required_fields = ['goal', 'fitness_level', 'available_time_per_session', 'days_per_week']
        missing_fields = [field for field in required_fields if not inputs.get(field)]

        if missing_fields:
            return f"Missing required information: {', '.join(missing_fields)}. Please provide these details for a proper workout plan."

        prompt = f"""
        You are a certified fitness trainer AI with expertise in exercise science and program design.
        Create a comprehensive, personalized workout plan based on the following profile:

        PERSONAL PROFILE:
        Name: {inputs.get('name', 'User')}
        Gender: {inputs.get('gender', 'Not specified')}
        Height: {inputs.get('height', 'Not specified')}
        Weight: {inputs.get('weight', 'Not specified')}
        Primary Goal: {inputs.get('goal')}
        Current Fitness Level: {inputs.get('fitness_level')}
        Available Equipment: {inputs.get('available_equipment', 'Bodyweight only')}
        Time Per Session: {inputs.get('available_time_per_session')} minutes
        Training Days Per Week: {inputs.get('days_per_week')}
        Target Muscle Groups: {inputs.get('target_muscle_groups', 'Full body')}
        Any Limitations/Injuries: {inputs.get('limitations', 'None specified')}
        Experience Level: {inputs.get('experience_level', 'Beginner')}

        WORKOUT PLAN STRUCTURE:
        1. **Program Overview** (2-3 sentences about the approach)
        
        2. **Weekly Schedule** 
           - Day-by-day breakdown with specific focus areas
           - Rest day recommendations
        
        3. **Detailed Daily Workouts**
           For each training day include:
           - Warm-up routine (5-10 minutes)
           - Main exercises with sets × reps or duration
           - Rest periods between sets
           - Exercise modifications for different levels
           - Cool-down routine (5-10 minutes)
        
        4. **Progressive Overload Guidelines**
           - How to increase difficulty over time
           - When to progress (weekly/biweekly)
        
        5. **Form Cues & Safety Tips**
           - Key technique points for main exercises
           - Common mistakes to avoid
        
        6. **Motivational Closing**
           - Encouraging message
           - Expected timeline for results
           - Reminder about consistency

        Make the plan specific, actionable, and appropriate for their fitness level.
        Use clear formatting with headers and bullet points for easy reading.
        """

        return await self.chat(prompt)

# Global variables
gemini_ai = None

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global gemini_ai
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is required")
    
    gemini_ai = GeminiAI(api_key)
    print("Gemini AI initialized successfully")
    
    if gemini_ai.tts_engine:
        voices = gemini_ai.tts_engine.getProperty('voices')
        print(f"Available TTS voices: {len(voices)}")
        for i, voice in enumerate(voices[:3]):  # Show first 3 voices
            print(f"  {i}: {voice.name}")
    else:
        print("TTS engine not available")
    
    yield
    
    # Shutdown
    if gemini_ai and gemini_ai.tts_engine:
        try:
            gemini_ai.tts_engine.stop()
        except:
            pass
    print("Gemini AI shutdown complete")

# FastAPI app initialization
app = FastAPI(
    title="Gemini Fitness AI API",
    description="AI-powered fitness coaching with voice feedback using Google Gemini",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Gemini Fitness AI API is running",
        "endpoints": [
            "/api/workout-plan",
            "/api/chat", 
            "/api/voice-output",
            "/api/voice-to-file",
            "/api/available-voices"
        ]
    }

@app.post("/api/workout-plan", response_model=WorkoutPlanResponse)
async def generate_workout_plan(request: WorkoutPlanRequest, background_tasks: BackgroundTasks):
    """Generate a comprehensive workout plan using Gemini AI"""
    try:
        # Convert request to dict
        inputs = request.dict()
        
        # Generate workout plan
        workout_plan = await gemini_ai.workout_plan_chatbot(inputs)
        
        # Handle voice output if requested
        if request.voice_enabled and workout_plan:
            voice_summary = f"Your personalized {request.days_per_week} day workout plan for {request.goal} has been generated successfully!"
            background_tasks.add_task(
                gemini_ai.voice_tone_output,
                voice_summary,
                request.voice_tone,
                True
            )
        
        return WorkoutPlanResponse(
            workout_plan=workout_plan,
            success=True,
            voice_enabled=request.voice_enabled,
            user_profile={
                "name": request.name or "User",
                "goal": request.goal,
                "fitness_level": request.fitness_level,
                "days_per_week": request.days_per_week,
                "session_time": request.available_time_per_session
            }
        )
        
    except Exception as e:
        print(f"Error generating workout plan: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate workout plan: {str(e)}"
        )

@app.post("/api/chat", response_model=ChatResponse)
async def chat_followup(request: ChatRequest, background_tasks: BackgroundTasks):
    """Handle follow-up chat questions about the workout plan"""
    try:
        if not request.follow_up_question:
            raise HTTPException(status_code=400, detail="No question provided")
        
        # Create context-aware prompt
        context_prompt = f"""
        Based on the user's workout plan profile:
        - Goal: {request.goal or 'Not specified'}
        - Fitness Level: {request.fitness_level or 'Not specified'}
        - Available Time: {request.available_time_per_session or 'Not specified'} minutes
        - Days per Week: {request.days_per_week or 'Not specified'}
        - Equipment: {request.available_equipment or 'Not specified'}
        - Target Areas: {request.target_muscle_groups or 'Not specified'}
        - Limitations: {request.limitations or 'None'}
        
        User's follow-up question: {request.follow_up_question}
        
        Please provide a helpful, specific answer related to their workout plan and fitness goals.
        Keep your response concise but informative (max 300 words).
        """
        
        # Generate response using Gemini
        response = await gemini_ai.chat(context_prompt)
        
        # Handle voice output if requested
        if request.voice_enabled and response:
            background_tasks.add_task(
                gemini_ai.voice_tone_output,
                response,
                request.voice_tone,
                True
            )
        
        return ChatResponse(
            response=response,
            success=True,
            voice_enabled=request.voice_enabled,
            question=request.follow_up_question
        )
        
    except Exception as e:
        print(f"Error in chat followup: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process your question: {str(e)}"
        )

@app.post("/api/voice-output", response_model=VoiceResponse)
async def voice_output(request: VoiceOutputRequest, background_tasks: BackgroundTasks):
    """Generate voice output for given text"""
    try:
        if not request.text:
            raise HTTPException(status_code=400, detail="No text provided for voice output")
        
        # Validate tone
        valid_tones = ['neutral', 'gymbro', 'girly']
        if request.tone not in valid_tones:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid tone. Must be one of: {', '.join(valid_tones)}"
            )
        
        # Generate voice output
        if request.async_speech:
            background_tasks.add_task(
                gemini_ai.voice_tone_output,
                request.text,
                request.tone,
                True
            )
        else:
            await gemini_ai.voice_tone_output(request.text, request.tone, False)
        
        return VoiceResponse(
            message="Voice output generated successfully",
            success=True,
            tone=request.tone,
            async_speech=request.async_speech,
            text_length=len(request.text)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in voice output: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate voice output: {str(e)}"
        )

@app.post("/api/voice-to-file")
async def voice_to_file(request: VoiceToFileRequest):
    """Generate voice output and save to file"""
    try:
        if not request.text:
            raise HTTPException(status_code=400, detail="No text provided for voice file generation")
        
        # Validate tone
        valid_tones = ['neutral', 'gymbro', 'girly']
        if request.tone not in valid_tones:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid tone. Must be one of: {', '.join(valid_tones)}"
            )
        
        # Generate voice file
        response_text = await gemini_ai.voice_tone_output_to_file(
            request.text, 
            request.tone, 
            request.filename
        )
        
        return {
            "message": "Voice file generated successfully",
            "success": True,
            "filename": request.filename,
            "tone": request.tone,
            "response_text": response_text
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating voice file: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate voice file: {str(e)}"
        )

@app.get("/api/available-voices")
async def get_available_voices():
    """Get information about available TTS voices"""
    try:
        if not gemini_ai.tts_engine:
            return {
                "voices": [],
                "total_voices": 0,
                "voice_profiles": list(gemini_ai.voice_profiles.keys()),
                "success": True,
                "message": "TTS engine not available"
            }
            
        voices = gemini_ai.tts_engine.getProperty('voices')
        voice_info = []
        
        for i, voice in enumerate(voices):
            voice_info.append({
                "index": i,
                "name": voice.name,
                "id": voice.id,
                "languages": getattr(voice, 'languages', []),
                "gender": getattr(voice, 'gender', 'Unknown')
            })
        
        return {
            "voices": voice_info,
            "total_voices": len(voice_info),
            "voice_profiles": list(gemini_ai.voice_profiles.keys()),
            "success": True
        }
        
    except Exception as e:
        print(f"Error getting voice info: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get voice information: {str(e)}"
        )

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "error": "Endpoint not found",
        "success": False
    }

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return {
        "error": "Internal server error", 
        "success": False
    }

if __name__ == "__main__":
    # Check if API key is set
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable is not set!")
        print("Please set it using: export GEMINI_API_KEY='your_api_key_here'")
        exit(1)
    
    print("Starting Gemini Fitness AI FastAPI server...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0", 
        port=5000,
        reload=True,
        log_level="info"
    )