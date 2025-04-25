'use client';

/**
 * GSAP core configuration and initialization
 * Sets up GSAP with performance optimizations and monitoring
 * 
 * Note: For Business license features such as SplitText, DrawSVG, Flip, etc.
 * these plugins need to be registered and initialized separately after
 * proper license verification.
 */

import { gsap } from 'gsap';
// Import core plugins (available in both regular and Business licenses)
import { Draggable } from 'gsap/Draggable';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Import business license plugins (these would be available with a Business account)
// For demonstration purposes - uncommenting these would require a valid business license
/*
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { Flip } from 'gsap/Flip';
import { GSDevTools } from 'gsap/GSDevTools';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
*/

import { ConnectionQuality } from '../hooks/useConnectionQuality';
import { ComplexityPreset, durations } from '../utils/motion-tokens';

// Register core plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Draggable);

// Register business plugins (would need a license)
/*
gsap.registerPlugin(
  SplitText, 
  DrawSVGPlugin, 
  MotionPathPlugin, 
  MorphSVGPlugin, 
  Flip, 
  GSDevTools,
  ScrambleTextPlugin
);
*/

/**
 * GSAP initialization status
 * Prevents duplicate initialization
 */
let isInitialized = false;

/**
 * Performance monitoring metrics
 */
interface PerformanceMetrics {
  activeAnimations: number;
  droppedFrames: number;
  avgFPS: number | null;
  lastUpdated: number;
}

const metrics: PerformanceMetrics = {
  activeAnimations: 0,
  droppedFrames: 0,
  avgFPS: null,
  lastUpdated: 0
};

/**
 * Initialize GSAP with performance optimizations
 * 
 * @param connectionQuality Current connection quality
 * @param complexity Animation complexity preset
 */
export function initGSAP(
  connectionQuality: ConnectionQuality = 'high',
  complexity: ComplexityPreset
): void {
  if (isInitialized) return;

  // Configure GSAP based on connection quality and complexity
  gsap.config({
    autoSleep: 60,
    force3D: connectionQuality === 'high',
    nullTargetWarn: false, // Suppress warnings for performance
  });

  // Apply global defaults for South African market optimizations
  gsap.defaults({
    ease: "power2.out",
    duration: durations.normal * complexity.reduceDuration,
    overwrite: "auto"
  });

  // Performance monitoring (for development)
  if (process.env.NODE_ENV === 'development') {
    // Create FPS monitoring using requestAnimationFrame
    let lastTime = performance.now();
    let frames = 0;
    let fpsArray: number[] = [];
    
    const updateFPS = () => {
      const now = performance.now();
      frames++;
      
      if (now >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (now - lastTime));
        fpsArray.push(fps);
        
        if (fpsArray.length > 60) {
          fpsArray.shift();
        }
        
        metrics.avgFPS = fpsArray.reduce((sum, fps) => sum + fps, 0) / fpsArray.length;
        metrics.lastUpdated = now;
        
        frames = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(updateFPS);
    };
    
    updateFPS();
    
    // Monitor active animations
    gsap.ticker.add(() => {
      metrics.activeAnimations = gsap.globalTimeline.getChildren(true).length;
    });
  }

  isInitialized = true;
}

/**
 * Get current GSAP performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...metrics };
}

/**
 * Kill all active animations for performance recovery
 */
export function killAllAnimations(): void {
  gsap.globalTimeline.clear();
  metrics.activeAnimations = 0;
}

/**
 * Apply animation complexity based on preset
 * 
 * @param tween GSAP tween to modify
 * @param complexity Complexity preset
 */
export function applyComplexityToTween(tween: gsap.core.Tween, complexity: ComplexityPreset): gsap.core.Tween {
  if (!tween) return tween;
  
  // Apply duration reduction
  if (complexity.reduceDuration !== 1.0) {
    const currentDuration = tween.duration();
    tween.duration(currentDuration * complexity.reduceDuration);
  }
  
  // Use simpler easing if needed
  if (complexity.useSimpleEasings) {
    // Set ease via vars object instead
    gsap.to(tween.targets(), {
      ease: "power1.out",
      overwrite: false,
      duration: tween.duration()
    });
  }
  
  return tween;
}