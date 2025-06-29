from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import cv2
import numpy as np
import mediapipe as mp
import math
import base64
import io
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)

# Configure CORS for Flask routes
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure SocketIO with proper CORS settings
socketio = SocketIO(
    app, 
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True,
    async_mode='threading',
    transports=['websocket', 'polling']
)

# MediaPipe setup
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)

def calculate_angle(a, b, c):
    """Calculate angle between three points"""
    a = np.array(a)  # First point
    b = np.array(b)  # Middle point
    c = np.array(c)  # End point
    
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)
    
    if angle > 180.0:
        angle = 360-angle
        
    return angle

def analyze_pushup(landmarks):
    """Simple pushup analysis"""
    try:
        # Get coordinates
        shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                   landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
        elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
        wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
        
        # Calculate arm angle
        angle = calculate_angle(shoulder, elbow, wrist)
        
        # Simple form check
        feedback = []
        score = 100
        
        if angle > 160:  # Arms too straight
            feedback.append("Bend your arms more")
            score -= 30
        elif angle < 70:  # Too low
            feedback.append("Don't go too low")
            score -= 20
        else:
            feedback.append("Good arm position!")
            
        return {
            'score': max(0, score),
            'feedback': feedback,
            'angle': round(angle, 1)
        }
    except Exception as e:
        print(f"Error in pushup analysis: {e}")
        return {'score': 0, 'feedback': ['Cannot detect pose'], 'angle': 0}

def analyze_squat(landmarks):
    """Simple squat analysis"""
    try:
        # Get coordinates
        hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
               landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
        knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
        ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x,
                 landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
        
        # Calculate knee angle
        angle = calculate_angle(hip, knee, ankle)
        
        # Simple form check
        feedback = []
        score = 100
        
        if angle > 160:  # Not squatting enough
            feedback.append("Squat deeper")
            score -= 40
        elif angle < 90:  # Too deep
            feedback.append("Don't go too deep")
            score -= 10
        else:
            feedback.append("Good squat depth!")
            
        return {
            'score': max(0, score),
            'feedback': feedback,
            'angle': round(angle, 1)
        }
    except Exception as e:
        print(f"Error in squat analysis: {e}")
        return {'score': 0, 'feedback': ['Cannot detect pose'], 'angle': 0}

def base64_to_image(base64_string):
    """Convert base64 string to OpenCV image"""
    try:
        # Remove data URL prefix if present
        if base64_string.startswith('data:image'):
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Convert to OpenCV format
        opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        
        return opencv_image
    except Exception as e:
        print(f"Error converting base64 to image: {e}")
        return None

def image_to_base64(image):
    """Convert OpenCV image to base64 string"""
    try:
        _, buffer = cv2.imencode('.jpg', image)
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{image_base64}"
    except Exception as e:
        print(f"Error converting image to base64: {e}")
        return None

@app.route('/api/analyze-frame', methods=['POST'])
def analyze_frame():
    """Analyze a single frame from the frontend"""
    try:
        data = request.json
        image_data = data.get('image')
        exercise_mode = data.get('exercise_mode', 'pushup')
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Convert base64 to OpenCV image
        frame = base64_to_image(image_data)
        if frame is None:
            return jsonify({'error': 'Failed to process image'}), 400
        
        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process pose
        results = pose.process(rgb_frame)
        
        analysis_result = {'score': 0, 'feedback': ['No pose detected'], 'angle': 0}
        landmarks_data = None
        
        if results.pose_landmarks:
            # Analyze form based on exercise mode
            if exercise_mode == 'pushup':
                analysis_result = analyze_pushup(results.pose_landmarks.landmark)
            else:
                analysis_result = analyze_squat(results.pose_landmarks.landmark)
            
            # Convert landmarks to serializable format
            landmarks_data = []
            for landmark in results.pose_landmarks.landmark:
                landmarks_data.append({
                    'x': landmark.x,
                    'y': landmark.y,
                    'z': landmark.z,
                    'visibility': landmark.visibility
                })
        
        return jsonify({
            'analysis': analysis_result,
            'landmarks': landmarks_data,
            'exercise_mode': exercise_mode
        })
        
    except Exception as e:
        print(f"Error in analyze_frame: {e}")
        return jsonify({'error': str(e)}), 500

@socketio.on('connect')
def handle_connect(auth):
    """Handle client connection"""
    print(f"Client connected: {request.sid}")
    emit('connection_response', {'status': 'connected', 'message': 'Successfully connected to computer vision server'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"Client disconnected: {request.sid}")

@socketio.on('video_frame')
def handle_video_frame(data):
    """Handle real-time video frames via WebSocket"""
    try:
        print(f"Received frame from client: {request.sid}")
        
        image_data = data.get('image')
        exercise_mode = data.get('exercise_mode', 'pushup')
        
        if not image_data:
            emit('analysis_result', {'error': 'No image data provided'})
            return
        
        # Convert base64 to OpenCV image
        frame = base64_to_image(image_data)
        if frame is None:
            emit('analysis_result', {'error': 'Failed to process image'})
            return
        
        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process pose
        results = pose.process(rgb_frame)
        
        analysis_result = {'score': 0, 'feedback': ['No pose detected'], 'angle': 0}
        landmarks_data = None
        
        if results.pose_landmarks:
            # Analyze form based on exercise mode
            if exercise_mode == 'pushup':
                analysis_result = analyze_pushup(results.pose_landmarks.landmark)
            else:
                analysis_result = analyze_squat(results.pose_landmarks.landmark)
            
            # Convert landmarks to serializable format
            landmarks_data = []
            for landmark in results.pose_landmarks.landmark:
                landmarks_data.append({
                    'x': landmark.x,
                    'y': landmark.y,
                    'z': landmark.z,
                    'visibility': landmark.visibility
                })
        
        # Send analysis result back to frontend
        emit('analysis_result', {
            'analysis': analysis_result,
            'landmarks': landmarks_data,
            'exercise_mode': exercise_mode
        })
        
    except Exception as e:
        print(f"Error in handle_video_frame: {e}")
        emit('analysis_result', {'error': str(e)})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Computer Vision API is running'})

@app.route('/')
def index():
    """Root endpoint"""
    return jsonify({
        'message': 'Computer Vision API is running',
        'endpoints': [
            'POST /api/analyze-frame',
            'GET /api/health',
            'WebSocket: video_frame event'
        ]
    })

if __name__ == '__main__':
    print("=" * 60)
    print("Starting Computer Vision API...")
    print("=" * 60)
    print("Available endpoints:")
    print("- POST /api/analyze-frame: Analyze single frame")
    print("- GET /api/health: Health check")
    print("- WebSocket: Real-time video analysis")
    print("=" * 60)
    print("Make sure to install required packages:")
    print("pip install flask flask-cors flask-socketio opencv-python mediapipe pillow")
    print("=" * 60)
    print("Server starting on http://localhost:5000")
    print("=" * 60)
    
    # Run with proper configuration
    socketio.run(
        app, 
        host='0.0.0.0', 
        port=5000, 
        debug=True,
        allow_unsafe_werkzeug=True
    )