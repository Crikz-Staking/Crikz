// src/hooks/useTheme.ts
import { useState, useEffect } from 'react';

export function useTheme() {
  const [themeColor, setThemeColor] = useState('#00ff88');
  const [gradientColors, setGradientColors] = useState({
    from: '#00ff88',
    to: '#00d4ff'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const hue = (Date.now() / 50) % 360;
      const color = `hsl(${hue}, 100%, 55%)`;
      const secondaryHue = (hue + 60) % 360;
      const secondaryColor = `hsl(${secondaryHue}, 100%, 55%)`;
      
      setThemeColor(color);
      setGradientColors({
        from: color,
        to: secondaryColor
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return { themeColor, gradientColors };
}