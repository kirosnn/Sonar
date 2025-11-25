# Voice Input Setup Guide

## Configuration

### 1. Get AssemblyAI API Key

1. Go to [AssemblyAI](https://www.assemblyai.com/)
2. Sign up for a free account
3. Get your API key from the dashboard

### 2. Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your API key:
   ```
   ASSEMBLYAI_API_KEY=your_actual_api_key_here
   ```

## Features

- **Voice Input**: Click the microphone button to start voice recording
- **Auto-timeout**: Recording automatically stops after 30 seconds
- **Visual Feedback**:
  - Red pulsing microphone icon during recording
  - Blue accent border on URL bar
  - "Listening..." placeholder text
- **Suggestions Blocked**: Search suggestions are disabled during voice input
- **Automatic Navigation**: Transcribed text is automatically used for search/navigation

## Usage

1. Click the microphone button in the toolbar
2. Speak your search query or URL (max 30 seconds)
3. Click the microphone button again to stop recording early, or wait for auto-stop
4. The transcribed text will appear in the URL bar and navigation will begin

## Customization

To change the maximum recording time, edit `VoiceInputManager.js`:

```javascript
this.maxRecordingTime = 30000; // Change this value (in milliseconds)
```

## Troubleshooting

- **No microphone access**: Check browser permissions
- **Transcription fails**: Verify your API key is correct in `.env`
- **No audio captured**: Ensure your microphone is working and selected as default
