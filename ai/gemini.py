import os
import google.generativeai as genai
from base import AIPlatform
import time
import json
from typing import Dict, List, Optional, Any
import pyttsx3
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS

class Gemini(AIPlatform):
    def __init__(self, api_key: str, system_prompt: str = None):
        self.api_key = api_key
        self.system_prompt = system_prompt
        genai.configure(api_key=self.api_key)

        self.model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
        self.tts_engine = pyttsx3.init()
        self.setUpVoiceProfiles()

    def chat(self, prompt: str) -> str:
        if self.system_prompt:
            prompt = f"{self.system_prompt}\n\n{prompt}"

        response = self.model.generate_content(prompt)
        return response.text

    def voiceToneOutput(self, prompt: str, tone: str = "neutral", speak_async: bool = True) -> str:
        """
        Generate text response and convert to speech with specified tone
        Args:
            prompt (str): The input prompt for text generation
            tone (str): Voice tone - 'neutral', 'gymbro', or 'girly'
            speak_async (bool): Whether to speak in background thread
    
        Returns:
            str: The generated text response
        """
        text_response = self.chat(prompt)
        # Get voice profile for the specified tone
        profile = self.voice_profiles.get(tone.lower(), self.voice_profiles["neutral"])
    
        # Configure TTS engine with the profile settings
        self._configure_voice(profile)
    
        # Speak the text (async or sync)
        if speak_async:
            threading.Thread(
                target=self._speak_text, 
                args=(text_response,), 
                daemon=True
            ).start()
        else:
            self._speak_text(text_response)
    
        return text_response

    def _configure_voice(self, profile: dict):
        """Configure TTS engine with voice profile settings"""
        voices = self.tts_engine.getProperty('voices')
    
        # Set voice (if available)
        if profile["voice_index"] < len(voices):
            self.tts_engine.setProperty('voice', voices[profile["voice_index"]].id)
    
        # Set speech rate (words per minute)
        self.tts_engine.setProperty('rate', profile["rate"])
    
        # Set volume (0.0 to 1.0)
        self.tts_engine.setProperty('volume', profile["volume"])

    def setUpVoiceProfiles(self):
        voices = self.tts_engine.getProperty('voices')
    
        # Define voice configurations for each tone
        self.voice_profiles = {
            "neutral": {
                "voice_index": 0,  # Usually default system voice
                "rate": 180,       # Normal speaking speed
                "volume": 0.8,     # Normal volume
                "pitch": 0         # Default pitch (if supported)
            },
            "gymbro": {
                "voice_index": 0,  # Prefer male voice if available
                "rate": 220,       # Faster, more energetic
                "volume": 0.95,    # Louder, more assertive
                "pitch": -10       # Slightly lower pitch (if supported)
            },
            "girly": {
                "voice_index": 1 if len(voices) > 1 else 0,  # Prefer female voice
                "rate": 160,       # Slightly slower, more gentle
                "volume": 0.7,     # Softer volume
                "pitch": 10        # Higher pitch (if supported)
            }
        }

    def _speak_text(self, text: str):
        """Speak the given text using TTS engine"""
        try:
            self.tts_engine.say(text)
            self.tts_engine.runAndWait()
        except Exception as e:
            print(f"TTS Error: {e}")
    
    def voiceToneOutputToFile(self, prompt: str, tone: str = "neutral", filename: str = "output.wav") -> str:
        """Generate text and save as audio file with specified tone"""
        text_response = self.chat(prompt)
    
        # Configure voice
        profile = self.voice_profiles.get(tone.lower(), self.voice_profiles["neutral"])
        self._configure_voice(profile)
    
        # Save to file
        self.tts_engine.save_to_file(text_response, filename)
        self.tts_engine.runAndWait()
    
        return text_response

    def workoutPlanChatBot(self, inputs: Dict[str, Any]) -> str:
        """Create a workout unique workout plan for user using gemini"""

        # Validate required inputs
        required_fields = ['goal', 'fitness_level', 'available_time_per_session', 'days_per_week']
        missing_fields = [field for field in required_fields if not inputs.get(field)]

        if missing_fields:
            return f"Missing required information: {', '.join(missing_fields)}. Please provide these details for a proper workout plan."

        prompt = f"""
        You are a certified fitness trainer AI with expertise in exercise science and program design.
        Create a comprehensive, personalized workout plan based on the following profile:

        PERSONAL PROFILE:
        Name: {inputs.get('name', 'User')}
        Gender: {inputs.get('gender')}
        Height: {inputs.get('height')}
        Weight: {inputs.get('weight')}
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
        """

        return self.chat(prompt)


# Flask Application Setup
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")

# Global Gemini instance
gemini_ai = Gemini(api_key=GEMINI_API_KEY)

# Flask Routes
@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Gemini Fitness AI API is running',
        'endpoints': [
            '/api/workout-plan',
            '/api/chat',
            '/api/voice-output',
            '/api/voice-to-file'
        ]
    })

@app.route('/api/workout-plan', methods=['POST'])
def generate_workout_plan():
    """Generate a comprehensive workout plan using Gemini AI"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No JSON data provided',
                'success': False
            }), 400
        
        # Validate required fields
        required_fields = ['goal', 'fitness_level', 'available_time_per_session', 'days_per_week']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}',
                'success': False
            }), 400
        
        # Generate workout plan using your Gemini class
        workout_plan = gemini_ai.workoutPlanChatBot(data)
        
        # Handle voice output if requested
        voice_enabled = data.get('voice_enabled', False)
        voice_tone = data.get('voice_tone', 'neutral')
        
        if voice_enabled and workout_plan:
            # Generate a summary for voice output (full plan might be too long)
            voice_summary = f"Your personalized {data.get('days_per_week', 'weekly')} day workout plan for {data.get('goal', 'fitness goals')} has been generated successfully!"
            try:
                gemini_ai.voiceToneOutput(voice_summary, tone=voice_tone, speak_async=True)
            except Exception as voice_error:
                print(f"Voice output error: {voice_error}")
        
        return jsonify({
            'workout_plan': workout_plan,
            'success': True,
            'voice_enabled': voice_enabled,
            'user_profile': {
                'name': data.get('name', 'User'),
                'goal': data.get('goal'),
                'fitness_level': data.get('fitness_level'),
                'days_per_week': data.get('days_per_week'),
                'session_time': data.get('available_time_per_session')
            }
        })
        
    except Exception as e:
        print(f"Error generating workout plan: {e}")
        return jsonify({
            'error': f'Failed to generate workout plan: {str(e)}',
            'success': False
        }), 500

@app.route('/api/chat', methods=['POST'])
def chat_followup():
    """Handle follow-up chat questions about the workout plan"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No JSON data provided',
                'success': False
            }), 400
            
        follow_up_question = data.get('follow_up_question', '')
        
        if not follow_up_question:
            return jsonify({
                'error': 'No question provided',
                'success': False
            }), 400
        
        # Create context-aware prompt for follow-up questions
        context_prompt = f"""
        Based on the user's workout plan profile:
        - Goal: {data.get('goal', 'Not specified')}
        - Fitness Level: {data.get('fitness_level', 'Not specified')}
        - Available Time: {data.get('available_time_per_session', 'Not specified')} minutes
        - Days per Week: {data.get('days_per_week', 'Not specified')}
        - Equipment: {data.get('available_equipment', 'Not specified')}
        - Target Areas: {data.get('target_muscle_groups', 'Not specified')}
        - Limitations: {data.get('limitations', 'None')}
        
        User's follow-up question: {follow_up_question}
        
        Please provide a helpful, specific answer related to their workout plan and fitness goals.
        Keep your response concise but informative.
        """
        
        # Generate response using Gemini
        response = gemini_ai.chat(context_prompt)
        
        # Handle voice output if requested
        voice_enabled = data.get('voice_enabled', False)
        voice_tone = data.get('voice_tone', 'neutral')
        
        if voice_enabled and response:
            try:
                gemini_ai.voiceToneOutput(response, tone=voice_tone, speak_async=True)
            except Exception as voice_error:
                print(f"Voice output error: {voice_error}")
        
        return jsonify({
            'response': response,
            'success': True,
            'voice_enabled': voice_enabled,
            'question': follow_up_question
        })
        
    except Exception as e:
        print(f"Error in chat followup: {e}")
        return jsonify({
            'error': f'Failed to process your question: {str(e)}',
            'success': False
        }), 500

@app.route('/api/voice-output', methods=['POST'])
def voice_output():
    """Generate voice output for given text"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No JSON data provided',
                'success': False
            }), 400
            
        text = data.get('text', '')
        tone = data.get('tone', 'neutral')
        async_speech = data.get('async', True)
        
        if not text:
            return jsonify({
                'error': 'No text provided for voice output',
                'success': False
            }), 400
        
        # Validate tone
        valid_tones = ['neutral', 'gymbro', 'girly']
        if tone not in valid_tones:
            return jsonify({
                'error': f'Invalid tone. Must be one of: {", ".join(valid_tones)}',
                'success': False
            }), 400
        
        # Generate voice output
        gemini_ai.voiceToneOutput(text, tone=tone, speak_async=async_speech)
        
        return jsonify({
            'message': 'Voice output generated successfully',
            'success': True,
            'tone': tone,
            'async': async_speech,
            'text_length': len(text)
        })
        
    except Exception as e:
        print(f"Error in voice output: {e}")
        return jsonify({
            'error': f'Failed to generate voice output: {str(e)}',
            'success': False
        }), 500

@app.route('/api/voice-to-file', methods=['POST'])
def voice_to_file():
    """Generate voice output and save to file"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No JSON data provided',
                'success': False
            }), 400
            
        text = data.get('text', '')
        tone = data.get('tone', 'neutral')
        filename = data.get('filename', 'output.wav')
        
        if not text:
            return jsonify({
                'error': 'No text provided for voice file generation',
                'success': False
            }), 400
        
        # Validate tone
        valid_tones = ['neutral', 'gymbro', 'girly']
        if tone not in valid_tones:
            return jsonify({
                'error': f'Invalid tone. Must be one of: {", ".join(valid_tones)}',
                'success': False
            }), 400
        
        # Generate voice file
        response_text = gemini_ai.voiceToneOutputToFile(text, tone=tone, filename=filename)
        
        return jsonify({
            'message': 'Voice file generated successfully',
            'success': True,
            'filename': filename,
            'tone': tone,
            'response_text': response_text
        })
        
    except Exception as e:
        print(f"Error generating voice file: {e}")
        return jsonify({
            'error': f'Failed to generate voice file: {str(e)}',
            'success': False
        }), 500

@app.route('/api/available-voices', methods=['GET'])
def get_available_voices():
    """Get information about available TTS voices"""
    try:
        voices = gemini_ai.tts_engine.getProperty('voices')
        voice_info = []
        
        for i, voice in enumerate(voices):
            voice_info.append({
                'index': i,
                'name': voice.name,
                'id': voice.id,
                'languages': getattr(voice, 'languages', []),
                'gender': getattr(voice, 'gender', 'Unknown')
            })
        
        return jsonify({
            'voices': voice_info,
            'total_voices': len(voice_info),
            'voice_profiles': list(gemini_ai.voice_profiles.keys()),
            'success': True
        })
        
    except Exception as e:
        print(f"Error getting voice info: {e}")
        return jsonify({
            'error': f'Failed to get voice information: {str(e)}',
            'success': False
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'success': False
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'success': False
    }), 500

if __name__ == '__main__':
    # Check if API key is set
    if not GEMINI_API_KEY:
        print("Error: GEMINI_API_KEY environment variable is not set!")
        print("Please set it using: export GEMINI_API_KEY='your_api_key_here'")
        exit(1)
    
    # Print available voices on startup
    print("Available TTS voices:")
    voices = gemini_ai.tts_engine.getProperty('voices')
    for i, voice in enumerate(voices):
        print(f"  {i}: {voice.name}")
    
    print(f"\nStarting Gemini Fitness AI API...")
    print(f"Available voice profiles: {list(gemini_ai.voice_profiles.keys())}")
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)