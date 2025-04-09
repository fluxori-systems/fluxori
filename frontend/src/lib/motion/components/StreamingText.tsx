'use client';

import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { useMotion } from '../context/MotionContext';
import { aiAnimations, complexityPresets } from '../utils/motion-tokens';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useConnectionQuality } from '../hooks/useConnectionQuality';

export interface StreamingTextProps {
  /** Text content to stream */
  text: string;
  /** Speed of text streaming */
  speed?: 'slow' | 'normal' | 'fast';
  /** Whether to show cursor at the end */
  showCursor?: boolean;
  /** Whether streaming is active */
  isStreaming?: boolean;
  /** Callback after streaming completes */
  onComplete?: () => void;
  /** Class name for custom styling */
  className?: string;
  /** Element to render (default p) */
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * Streaming text component for displaying AI-generated text
 * Mimics the appearance of text being typed in real-time
 */
export function StreamingText({
  text = '',
  speed = 'normal',
  showCursor = true,
  isStreaming = true,
  onComplete,
  className = '',
  as: Component = 'p',
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isDone, setIsDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { motionMode } = useMotion();
  const shouldReduceMotion = useReducedMotion();
  const connectionQuality = useConnectionQuality();
  const complexity = complexityPresets[motionMode];
  
  // Default to instant display for reduced motion or low bandwidth
  const shouldStream = isStreaming && !shouldReduceMotion && connectionQuality.quality !== 'low';
  
  // Speed factor based on selected speed
  const getSpeedFactor = () => {
    switch (speed) {
      case 'slow': return 1.5;
      case 'fast': return 0.5;
      default: return 1;
    }
  };
  
  // Clear any running timeouts
  const clearTimeouts = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  // Handle text streaming effect
  useEffect(() => {
    // Clear previous timeouts
    clearTimeouts();
    
    // Reset state for new text
    if (text !== displayedText) {
      setIsDone(false);
      
      // If reduced motion is enabled, show full text immediately
      if (!shouldStream) {
        setDisplayedText(text);
        setIsDone(true);
        onComplete?.();
        return;
      }
      
      // Start with empty string
      setDisplayedText('');
      
      // Stream text character by character
      let currentIndex = 0;
      
      const streamNextChar = () => {
        if (currentIndex < text.length) {
          setDisplayedText(prev => prev + text[currentIndex]);
          currentIndex++;
          
          // Calculate dynamic delay for natural typing feel
          // Pause longer at punctuation
          const isPunctuation = ['.', ',', '!', '?', ';', ':'].includes(text[currentIndex - 1]);
          const baseDelay = aiAnimations.streaming.characterDuration * 1000 * getSpeedFactor();
          const delay = isPunctuation ? baseDelay * 3 : baseDelay;
          
          // Schedule next character
          timeoutRef.current = setTimeout(streamNextChar, delay * complexity.reduceDuration);
        } else {
          // All characters added
          setIsDone(true);
          onComplete?.();
        }
      };
      
      // Start streaming
      timeoutRef.current = setTimeout(streamNextChar, 100);
    }
    
    // Clean up timeouts on unmount or text change
    return clearTimeouts;
  }, [text, shouldStream, complexity.reduceDuration, onComplete]);
  
  // Apply fade in animation to characters
  useEffect(() => {
    if (!shouldStream || shouldReduceMotion) return;
    
    // Kill any existing animations
    charsRef.current.forEach(char => {
      if (char) gsap.killTweensOf(char);
    });
    
    // Animate new characters
    charsRef.current.forEach((char, index) => {
      if (char) {
        gsap.fromTo(
          char, 
          { 
            autoAlpha: 0,
            y: 5 
          },
          { 
            autoAlpha: 1,
            y: 0,
            duration: aiAnimations.streaming.lineDuration * complexity.reduceDuration,
            ease: complexity.useSimpleEasings ? 'power1.out' : aiAnimations.streaming.ease,
            delay: complexity.disableStaggering ? 0 : index * aiAnimations.streaming.stagger * complexity.reduceDuration
          }
        );
      }
    });
  }, [displayedText, shouldStream, shouldReduceMotion, complexity]);
  
  // Clean up animations on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
      charsRef.current.forEach(char => {
        if (char) gsap.killTweensOf(char);
      });
    };
  }, []);
  
  // Prepare characters for rendering with refs
  const characters = displayedText.split('').map((char, index) => (
    <span 
      key={index}
      ref={(el: HTMLSpanElement | null) => {
        if (el) charsRef.current[index] = el;
      }}
      style={{ 
        display: 'inline-block',
        visibility: shouldStream ? 'visible' : 'inherit'
      }}
    >
      {char}
    </span>
  ));
  
  return (
    <div ref={containerRef} className={`streaming-text-container ${className}`}>
      <Component className="streaming-text">
        {shouldStream ? characters : displayedText}
        {showCursor && isStreaming && !isDone && (
          <span 
            className="streaming-cursor"
            style={{
              display: 'inline-block',
              width: '0.5em',
              height: '1em',
              backgroundColor: 'currentColor',
              verticalAlign: 'text-bottom',
              marginLeft: '2px',
              opacity: 0.7,
              animation: 'cursorBlink 1s step-end infinite'
            }}
          />
        )}
      </Component>
      <style jsx>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}