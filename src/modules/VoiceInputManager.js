export class VoiceInputManager {
  constructor() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingTimeout = null;
    this.maxRecordingTime = 30000;
    this.onTranscriptionComplete = null;
    this.onRecordingStart = null;
    this.onRecordingStop = null;
    this.onError = null;
  }

  async startRecording() {
    if (this.isRecording) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000
        }
      });

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        await this.processAudio(audioBlob);

        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      if (this.onRecordingStart) {
        this.onRecordingStart();
      }

      this.recordingTimeout = setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, this.maxRecordingTime);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      if (this.onError) {
        this.onError('Microphone access denied');
      }
    }
  }

  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      return;
    }

    clearTimeout(this.recordingTimeout);
    this.mediaRecorder.stop();
    this.isRecording = false;

    if (this.onRecordingStop) {
      this.onRecordingStop();
    }
  }

  async processAudio(audioBlob) {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = this.arrayBufferToBase64(arrayBuffer);

      const transcription = await window.electronAPI.transcribeAudio(base64Audio);

      if (this.onTranscriptionComplete && transcription) {
        this.onTranscriptionComplete(transcription);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      if (this.onError) {
        this.onError('Transcription failed');
      }
    }
  }

  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  setMaxRecordingTime(milliseconds) {
    this.maxRecordingTime = milliseconds;
  }

  isCurrentlyRecording() {
    return this.isRecording;
  }
}
