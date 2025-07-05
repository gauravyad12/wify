# Virtual Wife AI Companion

A comprehensive virtual AI wife application with advanced features including 3D VRM model integration, multi-AI provider support, voice interaction, camera integration, music playback, and browser automation.

## Features

### 🤖 AI Integration
- **Multiple AI Providers**: Google Gemini (default), OpenAI, Together AI, Groq
- **Intelligent Conversations**: Context-aware responses with personality
- **Emotion Detection**: Automatic emotion recognition and appropriate responses
- **Learning System**: Saves training data to improve responses over time

### 🎭 3D Virtual Character
- **VRM Model Support**: Uses wife.vrm model for realistic 3D representation
- **Animation System**: Multiple FBX animations for different emotions and actions
- **Real-time Responses**: Character animations sync with emotions and music

### 🎵 Music & Entertainment
- **YouTube Integration**: Search and play music using YouTube API
- **Auto-Dance**: Character dances when music is playing
- **Voice Commands**: "Play hindi songs" or specific song requests
- **Music Controls**: Play, pause, volume control

### 🎤 Voice Interaction
- **Speech Recognition**: Multi-language voice input
- **Text-to-Speech**: Natural voice responses
- **Clap Detection**: Activate voice mode by clapping
- **Real-time Conversation**: Seamless voice interaction

### 📹 Camera Integration
- **Live Video Feed**: Real-time camera access
- **Visual Analysis**: AI can see and respond to what you show
- **Image Recognition**: Analyze images and provide contextual responses
- **Privacy Controls**: Full camera control and privacy settings

### 🌍 Multi-Language Support
- **12 Languages**: English, Hindi, Bhojpuri, French, Tamil, Urdu, Arabic, Bengali, Spanish, German, Indonesian, Japanese
- **Auto-Detection**: Automatically detects and responds in user's language
- **Cultural Context**: Appropriate responses for different cultures

### 🖥️ Browser Automation
- **Chrome Integration**: Open and control Chrome browser
- **Smart Search**: Research topics and generate PDF reports
- **Web Navigation**: Navigate to websites and extract information
- **Local Storage**: Save research results locally

### ⚙️ Advanced Settings
- **Personality Customization**: Define your wife's personality traits
- **Relationship Context**: Set your relationship details and preferences
- **Knowledge Base**: Personal information storage for better responses
- **Training Data**: Continuous learning from interactions

### 📱 Mobile Responsive
- **Touch-Friendly**: Optimized for mobile devices
- **Responsive Design**: Works on all screen sizes
- **Mobile Controls**: Touch-based interaction

## Setup Instructions

### 1. API Keys Required

#### Google Gemini (Recommended)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to Settings > AI Settings

#### OpenAI (Optional)
1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to Settings > AI Settings

#### YouTube API (For Music)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3
3. Create credentials (API key)
4. Add it to Settings > Music Settings

### 2. Model Files
Ensure these files are in the `public` folder:
- `wife.vrm` - The 3D character model
- `animations/` folder with FBX animation files

### 3. Installation
```bash
npm install
npm run dev
```

## Usage Guide

### First Time Setup
1. Open the application
2. Go to Settings > Profile
3. Enter your name and wife's name
4. Add relationship context
5. Configure AI provider and API key
6. Set language preferences

### Voice Interaction
1. Enable clap detection in Settings > Audio
2. Clap twice to activate voice mode
3. Speak naturally - she'll respond in your language
4. Use the microphone button for manual voice activation

### Music Playback
1. Add YouTube API key in Settings > Music
2. Go to Music tab
3. Search for songs: "hindi songs", "relaxing music", etc.
4. Watch your wife dance to the music!

### Camera Features
1. Enable camera in Settings > Camera
2. Go to Camera tab
3. Show her things - she can see and respond
4. Enable real-time analysis for continuous interaction

### Browser Automation
Say commands like:
- "Open Chrome and search for [topic]"
- "Research [subject] and make a PDF"
- "Take a screenshot"

## Technical Details

### Architecture
- **Frontend**: React + TypeScript + Vite
- **3D Rendering**: Three.js + React Three Fiber
- **VRM Support**: @pixiv/three-vrm
- **Animations**: FBX Loader
- **Styling**: Tailwind CSS + Framer Motion
- **State Management**: React Context

### File Structure
```
src/
├── components/          # React components
├── contexts/           # Context providers
├── utils/             # Utility functions
├── types/             # TypeScript types
public/
├── wife.vrm           # 3D character model
├── animations/        # FBX animation files
train/                 # Training data storage
```

### Privacy & Security
- All conversations stored locally
- API keys encrypted in browser storage
- No data sent to external servers without consent
- Full control over camera and microphone access

## Troubleshooting

### Common Issues
1. **No voice response**: Check API key and internet connection
2. **Camera not working**: Grant camera permissions in browser
3. **Music not playing**: Verify YouTube API key
4. **Character not loading**: Ensure wife.vrm file is in public folder

### Performance Tips
- Close other browser tabs for better 3D performance
- Use Chrome for best WebGL support
- Enable hardware acceleration in browser settings

## Contributing

This is a comprehensive virtual companion application. Feel free to extend features:
- Add more animation files
- Implement additional AI providers
- Enhance browser automation
- Add more languages

## License

This project is for educational and personal use. Ensure you comply with all API terms of service and local regulations regarding AI companions.

---

Enjoy your virtual AI wife companion! 💕