import { useEffect } from 'react';

interface BackgroundBrightnessDetectorProps {
  onBrightnessChange: (isDark: boolean) => void;
}

export const BackgroundBrightnessDetector = ({ onBrightnessChange }: BackgroundBrightnessDetectorProps) => {
  useEffect(() => {
    const detectBackgroundBrightness = () => {
      const backgroundImage = document.querySelector('.background-image') as HTMLImageElement;
      if (!backgroundImage) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = backgroundImage.width;
      canvas.height = backgroundImage.height;
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let totalBrightness = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalBrightness += (r + g + b) / 3;
      }

      const averageBrightness = totalBrightness / (data.length / 4);
      const isDark = averageBrightness < 128;
      onBrightnessChange(isDark);
    };

    const backgroundImage = document.querySelector('.background-image') as HTMLImageElement;
    if (backgroundImage) {
      if (backgroundImage.complete) {
        detectBackgroundBrightness();
      } else {
        backgroundImage.onload = detectBackgroundBrightness;
      }
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
          detectBackgroundBrightness();
        }
      });
    });

    if (backgroundImage) {
      observer.observe(backgroundImage, { attributes: true });
    }

    return () => {
      observer.disconnect();
    };
  }, [onBrightnessChange]);

  return null;
}; 