// Custom clap detection utility
export class ClapDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private isListening = false;
  private onClapCallback: (() => void) | null = null;
  private lastClapTime = 0;
  private clapThreshold = 150; // Adjust sensitivity
  private clapCooldown = 1000; // Minimum time between claps (ms)

  async initialize(onClap: () => void): Promise<boolean> {
    try {
      this.onClapCallback = onClap;
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      
      // Configure analyser
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      // Connect nodes
      this.microphone.connect(this.analyser);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize clap detection:', error);
      return false;
    }
  }

  start(): void {
    if (!this.analyser || !this.dataArray || this.isListening) return;
    
    this.isListening = true;
    this.detectClaps();
  }

  stop(): void {
    this.isListening = false;
  }

  destroy(): void {
    this.stop();
    
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.dataArray = null;
    this.onClapCallback = null;
  }

  private detectClaps(): void {
    if (!this.isListening || !this.analyser || !this.dataArray) return;

    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate average volume
    const average = this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length;
    
    // Calculate peak volume in higher frequencies (typical for claps)
    const highFreqStart = Math.floor(this.dataArray.length * 0.6);
    const highFreqData = this.dataArray.slice(highFreqStart);
    const highFreqPeak = Math.max(...highFreqData);
    
    // Detect clap pattern: sudden spike in high frequencies
    const now = Date.now();
    const timeSinceLastClap = now - this.lastClapTime;
    
    if (highFreqPeak > this.clapThreshold && 
        average > 50 && 
        timeSinceLastClap > this.clapCooldown) {
      
      this.lastClapTime = now;
      console.log('Clap detected!', { peak: highFreqPeak, average });
      
      if (this.onClapCallback) {
        this.onClapCallback();
      }
    }
    
    // Continue monitoring
    requestAnimationFrame(() => this.detectClaps());
  }

  setSensitivity(sensitivity: number): void {
    // sensitivity: 1-10 (1 = most sensitive, 10 = least sensitive)
    this.clapThreshold = 100 + (sensitivity * 20);
  }
}