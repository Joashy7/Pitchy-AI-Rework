import { useState, useRef, useCallback } from "react";

export function useMicrophone() {
  const [isRecording, setIsRecording] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const micSourceRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const startTimer = useCallback(() => {
    setTimeElapsed(0);
    timerIntervalRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const startWaveform = useCallback((stream) => {
    if (!canvasRef.current) return;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    const micSource = audioCtx.createMediaStreamSource(stream);
    micSource.connect(analyser);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;
    micSourceRef.current = micSource;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      animFrameIdRef.current = requestAnimationFrame(draw);

      const W = canvasRef.current.clientWidth;
      const H = canvasRef.current.clientHeight;

      if (!W || !H) return;

      if (canvasRef.current.width !== W || canvasRef.current.height !== H) {
        canvasRef.current.width = W;
        canvasRef.current.height = H;
      }

      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, W, H);

      const barCount = 48;
      const step = Math.floor(bufferLength / barCount);
      const gap = 4;
      const barW = (W - gap * (barCount - 1)) / barCount;

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] / 255;
        const barH = Math.max(4, value * H * 0.9);
        const x = i * (barW + gap);
        const y = (H - barH) / 2;

        const alpha = 0.35 + value * 0.65;
        ctx.fillStyle = `rgba(60, 144, 255, ${alpha})`;

        if (typeof ctx.roundRect === "function") {
          ctx.beginPath();
          ctx.roundRect(x, y, barW, barH, barW / 2);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, barW, barH);
        }
      }
    };

    draw();
  }, []);

  const stopWaveform = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
      analyserRef.current = null;
      micSourceRef.current = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, []);

  const sendAudio = useCallback(
    async (audioBlob) => {
      setIsAnalyzing(true);
      try {
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");

        const res = await fetch("http://localhost:3000/analyze", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Analysis failed");
        }

        localStorage.setItem("pitchPalResults", JSON.stringify(data));
        window.location.href = "/analysis";
      } catch (error) {
        console.error("sendAudio error:", error);
        alert(error.message || "Could not connect to server");
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  const startRecording = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support audio recording. Please use Chrome, Firefox, Edge, or Safari.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        stopTimer();
        stopWaveform();
        setIsRecording(false);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await sendAudio(audioBlob);
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
      setIsRecording(true);

      startTimer();
      requestAnimationFrame(() => {
        try {
          startWaveform(stream);
        } catch (waveformError) {
          console.warn("Waveform visualization unavailable:", waveformError);
        }
      });
    } catch (error) {
      console.error("Recording start error:", error);
      stopTimer();
      stopWaveform();
      setIsRecording(false);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      let errorMessage = "Could not access microphone";
      if (error.name === "NotAllowedError") {
        errorMessage = "Microphone permission denied. Please allow microphone access in your browser settings.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No microphone found. Please connect a microphone and try again.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "Microphone is in use by another application. Please close other apps using your microphone.";
      }

      alert(errorMessage);
    }
  }, [startTimer, startWaveform, stopTimer, stopWaveform, sendAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return {
    isRecording,
    timeElapsed,
    isAnalyzing,
    formatTime,
    startRecording,
    stopRecording,
    canvasRef,
  };
}
