import { useCallback, useRef } from "react";

const BAR_COUNT = 48;
const BAR_GAP_PX = 4;
const MIN_BAR_HEIGHT_PX = 4;

const drawRoundedBar = (ctx, x, y, width, height) => {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, width / 2);
    ctx.fill();
    return;
  }

  ctx.fillRect(x, y, width, height);
};

export const useWaveformVisualizer = () => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);

  const startWaveform = useCallback((stream) => {
    if (!canvasRef.current) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const micSource = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 256;
    micSource.connect(analyser);
    audioContextRef.current = audioContext;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const ctx = canvasRef.current.getContext("2d");

    if (!ctx) return;

    const draw = () => {
      const canvas = canvasRef.current;
      animationFrameRef.current = requestAnimationFrame(draw);

      if (!canvas) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (!width || !height) return;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, width, height);

      const step = Math.floor(bufferLength / BAR_COUNT);
      const barWidth = (width - BAR_GAP_PX * (BAR_COUNT - 1)) / BAR_COUNT;

      for (let index = 0; index < BAR_COUNT; index += 1) {
        const value = dataArray[index * step] / 255;
        const barHeight = Math.max(MIN_BAR_HEIGHT_PX, value * height * 0.9);
        const x = index * (barWidth + BAR_GAP_PX);
        const y = (height - barHeight) / 2;
        const alpha = 0.35 + value * 0.65;

        ctx.fillStyle = `rgba(60, 144, 255, ${alpha})`;
        drawRoundedBar(ctx, x, y, barWidth, barHeight);
      }
    };

    draw();
  }, []);

  const stopWaveform = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, []);

  return {
    canvasRef,
    startWaveform,
    stopWaveform,
  };
};
