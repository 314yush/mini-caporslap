'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface ScratchCardProps {
  onReveal: () => void;
  revealed: boolean;
  children: React.ReactNode;
}

/**
 * Interactive scratch card component
 * Users can scratch to reveal content underneath
 */
export function ScratchCard({ onReveal, revealed, children }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);
  const progressCheckRef = useRef(0);
  const isInitializedRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const progressCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const revealThreshold = 0.3; // 30% scratched = reveal
  const scratchRadius = 30; // Scratch radius in pixels

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;

    const initializeCanvas = () => {
      // Don't re-initialize if already initialized and not revealed
      if (isInitializedRef.current && !revealed) return;
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      
      ctxRef.current = ctx; // Store context for reuse

      // Set canvas size based on container
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Set actual size in memory (scaled for device pixel ratio)
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      // Scale the context back down using CSS
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      // Reset transform and scale
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Draw scratch-off layer (silver/gold gradient)
      const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      gradient.addColorStop(0, '#FFD700'); // Gold
      gradient.addColorStop(0.5, '#FFA500'); // Orange
      gradient.addColorStop(1, '#FFD700'); // Gold
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Add text pattern
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3; j++) {
          ctx.fillText('?', (rect.width / 5) * i, (rect.height / 3) * j);
        }
      }
      
      isInitializedRef.current = true;
    };

    // Wait for next frame to ensure container is sized
    requestAnimationFrame(() => {
      initializeCanvas();
    });

    // Also handle resize (only if not already scratched)
    const handleResize = () => {
      if (!revealed && !isScratching) {
        isInitializedRef.current = false; // Allow re-init on resize
        initializeCanvas();
      }
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [revealed, isScratching]);

  // Optimized progress check with debouncing
  const checkProgress = useCallback(() => {
    if (revealed) return;
    
    const canvas = canvasRef.current;
    if (!canvas) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[ScratchCard] No canvas for progress check');
      }
      return;
    }
    
    // Ensure context is available
    if (!ctxRef.current) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[ScratchCard] No context for progress check');
        }
        return;
      }
      ctxRef.current = ctx;
    }
    
    // Ensure canvas is initialized
    if (!isInitializedRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[ScratchCard] Canvas not initialized yet');
      }
      return;
    }
    
    // Access context directly from ref to avoid immutability issues
    const ctx = ctxRef.current;
    
    // Read imageData from the full canvas (includes DPR scaling)
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Sample every 15th pixel for better performance
      const sampleRate = 15;
      let transparentPixels = 0;
      let totalSampled = 0;
      
      // Check alpha channel (index 3 in RGBA)
      // RGBA format: [R, G, B, A, R, G, B, A, ...]
      for (let i = 3; i < imageData.data.length; i += 4 * sampleRate) {
        totalSampled++;
        // Check if alpha channel is 0 (fully transparent)
        // Also check if it's very low (near transparent) to account for anti-aliasing
        if (imageData.data[i] < 10) {
          transparentPixels++;
        }
      }
      
      const progress = totalSampled > 0 ? transparentPixels / totalSampled : 0;
      setScratchProgress(progress);

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ScratchCard] Canvas: ${canvas.width}x${canvas.height}, Progress: ${(progress * 100).toFixed(1)}% (${transparentPixels}/${totalSampled} transparent, threshold: ${(revealThreshold * 100).toFixed(1)}%)`);
      }

      // Check if enough is scratched
      if (progress >= revealThreshold && !revealed) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[ScratchCard] Threshold reached! Revealing...');
        }
        onReveal();
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[ScratchCard] Error reading imageData:', error);
      }
    }
  }, [revealed, revealThreshold, onReveal]);

  // Handle scratching - optimized for smooth mouse movement
  const handleScratch = useCallback(
    (clientX: number, clientY: number) => {
      if (revealed) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Ensure context is available
      if (!ctxRef.current) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctxRef.current = ctx;
      }

      const rect = canvas.getBoundingClientRect();
      // Use unscaled coordinates since context is already scaled
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Ensure canvas is initialized before scratching
      if (!isInitializedRef.current) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[ScratchCard] Canvas not initialized, skipping scratch');
        }
        return;
      }

      // Access context directly from ref each time to avoid immutability issues
      // Don't store in variable - access ctxRef.current directly
      if (!ctxRef.current) return;
      
      // Use composite operation to "erase" the scratch layer
      ctxRef.current.globalCompositeOperation = 'destination-out';
      
      // Draw smooth line between last point and current point for better UX
      if (lastPointRef.current) {
        const lastX = lastPointRef.current.x;
        const lastY = lastPointRef.current.y;
        const distance = Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);
        
        // Draw circles along the path for smooth scratching
        if (distance > 0) {
          const steps = Math.ceil(distance / (scratchRadius * 0.5));
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const px = lastX + (x - lastX) * t;
            const py = lastY + (y - lastY) * t;
            ctxRef.current.beginPath();
            ctxRef.current.arc(px, py, scratchRadius, 0, Math.PI * 2);
            ctxRef.current.fill();
          }
        }
      } else {
        // First point - just draw a circle
        ctxRef.current.beginPath();
        ctxRef.current.arc(x, y, scratchRadius, 0, Math.PI * 2);
        ctxRef.current.fill();
      }
      
      // Store current point for next draw
      lastPointRef.current = { x, y };
      
      // Reset composite operation for next draw
      ctxRef.current.globalCompositeOperation = 'source-over';
      
      // Force immediate progress check on first scratch to verify it's working
      if (progressCheckRef.current === 0) {
        setTimeout(() => checkProgress(), 50);
      }

      // Debounce progress checking - only check every 200ms while scratching
      if (progressCheckTimeoutRef.current) {
        clearTimeout(progressCheckTimeoutRef.current);
      }
      
      progressCheckTimeoutRef.current = setTimeout(() => {
        checkProgress();
      }, 200); // Check progress every 200ms while actively scratching
    },
    [revealed, checkProgress, scratchRadius]
  );

  // Mouse/touch handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsScratching(true);
      lastPointRef.current = null; // Reset last point for new scratch
      handleScratch(e.clientX, e.clientY);
    },
    [handleScratch]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isScratching) {
        handleScratch(e.clientX, e.clientY);
      }
    },
    [isScratching, handleScratch]
  );

  const handleMouseUp = useCallback(() => {
    setIsScratching(false);
    lastPointRef.current = null; // Reset last point
    // Clear any pending progress check
    if (progressCheckTimeoutRef.current) {
      clearTimeout(progressCheckTimeoutRef.current);
      progressCheckTimeoutRef.current = null;
    }
    // Final progress check when user stops scratching
    checkProgress();
  }, [checkProgress]);

  // Use native event listeners for touch to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;

    // Use refs to access latest values without adding to dependencies
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      setIsScratching(true);
      lastPointRef.current = null;
      const touch = e.touches[0];
      if (touch) {
        // Call handleScratch directly using refs
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        if (!ctxRef.current) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) ctxRef.current = ctx;
        }
        
        if (ctxRef.current) {
          ctxRef.current.globalCompositeOperation = 'destination-out';
          ctxRef.current.beginPath();
          ctxRef.current.arc(x, y, scratchRadius, 0, Math.PI * 2);
          ctxRef.current.fill();
          ctxRef.current.globalCompositeOperation = 'source-over';
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      // Check isScratching via closure
      const touch = e.touches[0];
      if (touch && canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        if (!ctxRef.current) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) ctxRef.current = ctx;
        }
        
        if (ctxRef.current) {
          ctxRef.current.globalCompositeOperation = 'destination-out';
          if (lastPointRef.current) {
            const lastX = lastPointRef.current.x;
            const lastY = lastPointRef.current.y;
            const distance = Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);
            if (distance > 0) {
              const steps = Math.ceil(distance / (scratchRadius * 0.5));
              for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const px = lastX + (x - lastX) * t;
                const py = lastY + (y - lastY) * t;
                ctxRef.current.beginPath();
                ctxRef.current.arc(px, py, scratchRadius, 0, Math.PI * 2);
                ctxRef.current.fill();
              }
            }
          } else {
            ctxRef.current.beginPath();
            ctxRef.current.arc(x, y, scratchRadius, 0, Math.PI * 2);
            ctxRef.current.fill();
          }
          lastPointRef.current = { x, y };
          ctxRef.current.globalCompositeOperation = 'source-over';
        }
      }
    };

    const handleTouchEnd = () => {
      setIsScratching(false);
      lastPointRef.current = null;
      if (progressCheckTimeoutRef.current) {
        clearTimeout(progressCheckTimeoutRef.current);
        progressCheckTimeoutRef.current = null;
      }
      // Use setTimeout to call checkProgress after state updates
      setTimeout(() => {
        checkProgress();
      }, 0);
    };

    // Add native event listeners with passive: false to allow preventDefault
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      if (progressCheckTimeoutRef.current) {
        clearTimeout(progressCheckTimeoutRef.current);
      }
    };
  }, [revealed, checkProgress, scratchRadius]);

  // Reveal all if threshold reached
  useEffect(() => {
    if (revealed && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [revealed]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ touchAction: 'none' }}
    >
      {/* Content underneath */}
      <div className="absolute inset-0 z-0">{children}</div>

      {/* Scratch-off layer */}
      {!revealed && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 cursor-crosshair touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          // Touch events handled via native listeners in useEffect to allow preventDefault
        />
      )}

      {/* Progress indicator */}
      {!revealed && scratchProgress > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
            {Math.round(scratchProgress * 100)}% scratched
          </div>
        </div>
      )}
    </div>
  );
}



