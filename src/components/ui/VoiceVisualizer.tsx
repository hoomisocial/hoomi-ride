import React, { useEffect, useState, useRef } from "react";

interface VoiceVisualizerProps {
  isActive: boolean;
  barCount?: number;
  className?: string;
  getInputVolume?: () => number;
  getInputByteFrequencyData?: () => Uint8Array | null;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isActive,
  barCount = 5,
  className = "",
  getInputVolume,
  getInputByteFrequencyData,
}) => {
  const [barHeights, setBarHeights] = useState<number[]>(
    Array(barCount).fill(4)
  );
  const animationRef = useRef<number | null>(null);
  const smoothedHeights = useRef<number[]>(Array(barCount).fill(4));

  useEffect(() => {
    if (!isActive) {
      setBarHeights(Array(barCount).fill(4));
      smoothedHeights.current = Array(barCount).fill(4);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const updateBars = () => {
      let targetHeights: number[];
      const minHeight = 4;
      const maxHeight = 28;

      // Try to use frequency data for more detailed visualization
      if (getInputByteFrequencyData) {
        const frequencyData = getInputByteFrequencyData();
        if (frequencyData && frequencyData.length > 0) {
          // Sample frequency bands for each bar (focus on voice frequencies 85-255 Hz range)
          const voiceStart = Math.floor(frequencyData.length * 0.02);
          const voiceEnd = Math.floor(frequencyData.length * 0.25);
          const voiceRange = voiceEnd - voiceStart;
          const step = Math.floor(voiceRange / barCount);

          targetHeights = Array(barCount)
            .fill(0)
            .map((_, i) => {
              const startIdx = voiceStart + i * step;
              const endIdx = Math.min(startIdx + step, voiceEnd);
              let sum = 0;
              let max = 0;
              for (let j = startIdx; j < endIdx; j++) {
                sum += frequencyData[j];
                max = Math.max(max, frequencyData[j]);
              }
              // Use max value for more sensitivity
              const value = max;
              // More aggressive mapping for sensitivity (threshold at ~30)
              const normalized = Math.max(0, (value - 20) / 180);
              const height =
                minHeight + (maxHeight - minHeight) * Math.pow(normalized, 0.6);
              return Math.max(minHeight, Math.min(maxHeight, height));
            });

          // Apply smoothing (faster response, slower decay)
          smoothedHeights.current = smoothedHeights.current.map((prev, i) => {
            const target = targetHeights[i];
            if (target > prev) {
              // Fast attack
              return prev + (target - prev) * 0.7;
            } else {
              // Slower decay
              return prev + (target - prev) * 0.15;
            }
          });

          setBarHeights([...smoothedHeights.current]);
          animationRef.current = requestAnimationFrame(updateBars);
          return;
        }
      }

      // Fallback to volume-based animation
      if (getInputVolume) {
        const volume = getInputVolume();
        // More sensitive volume mapping
        const amplifiedVolume = Math.pow(volume * 5, 0.7);
        const volumeMultiplier = Math.min(amplifiedVolume, 1);

        targetHeights = Array(barCount)
          .fill(0)
          .map((_, i) => {
            // Add variation between bars
            const variation = Math.sin(Date.now() / 80 + i * 1.2) * 0.4 + 0.6;
            const height =
              minHeight +
              (maxHeight - minHeight) * volumeMultiplier * variation;
            return Math.max(minHeight, Math.min(maxHeight, height));
          });

        // Apply smoothing
        smoothedHeights.current = smoothedHeights.current.map((prev, i) => {
          const target = targetHeights[i];
          if (target > prev) {
            return prev + (target - prev) * 0.6;
          } else {
            return prev + (target - prev) * 0.1;
          }
        });

        setBarHeights([...smoothedHeights.current]);
      } else {
        // No audio data - minimal idle state
        setBarHeights(Array(barCount).fill(minHeight));
      }

      animationRef.current = requestAnimationFrame(updateBars);
    };

    updateBars();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, barCount, getInputVolume, getInputByteFrequencyData]);

  return (
    <div className={`voice-visualizer ${className}`}>
      {barHeights.map((height, index) => (
        <div
          key={index}
          className="voice-bar-dynamic"
          style={{
            height: `${height}px`,
            opacity: Math.max(0.5, Math.min(1, height / 20)),
          }}
        />
      ))}
    </div>
  );
};

export default VoiceVisualizer;
