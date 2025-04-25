'use client';

import React, { useState, useRef, useEffect } from 'react';

import { gsap } from 'gsap';

import {
  MotionProvider,
  useMotion,
  useReducedMotion,
  useConnectionQuality,
  useGSAPAnimation,
  AIProcessingIndicator,
  StreamingText,
  TransitionFade,
  IconFeedback,
  AnimatedTabIndicator,
  durations,
  easings,
  aiAnimations,
  MotionMode,
  // GSAP Business features
  initGSAPBusiness,
  SplitTextUtils,
  SVGUtils,
  FlipUtils,
  TextUtils,
  PhysicsUtils,
  CustomEasingUtils
} from '@/lib/motion';

// Icons (simplified for demo)
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12L10 18L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/**
 * Motion showcase section component
 */
function ShowcaseSection({ 
  title, 
  children 
}: { 
  title: string; 
  children: React.ReactNode 
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const animation = useGSAPAnimation(sectionRef);
  
  useEffect(() => {
    animation.fadeIn({ delay: 0.1 });
  }, [animation]);
  
  return (
    <section 
      ref={sectionRef} 
      style={{ 
        opacity: 0, 
        marginBottom: '2rem',
        border: '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        background: 'var(--color-background-card)'
      }}
    >
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

/**
 * Motion controls component
 */
function MotionControls() {
  const { motionMode, setMotionMode, prefersReducedMotion, isLowBandwidth } = useMotion();
  
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3>Motion Settings</h3>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button 
          onClick={() => setMotionMode('full')}
          style={{ 
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-default)',
            background: motionMode === 'full' ? 'var(--color-primary-500)' : 'transparent',
            color: motionMode === 'full' ? 'white' : 'var(--color-text-primary)',
            cursor: 'pointer'
          }}
        >
          Full Motion
        </button>
        <button 
          onClick={() => setMotionMode('reduced')}
          style={{ 
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-default)',
            background: motionMode === 'reduced' ? 'var(--color-primary-500)' : 'transparent',
            color: motionMode === 'reduced' ? 'white' : 'var(--color-text-primary)',
            cursor: 'pointer'
          }}
        >
          Reduced Motion
        </button>
        <button 
          onClick={() => setMotionMode('minimal')}
          style={{ 
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-default)',
            background: motionMode === 'minimal' ? 'var(--color-primary-500)' : 'transparent',
            color: motionMode === 'minimal' ? 'white' : 'var(--color-text-primary)',
            cursor: 'pointer'
          }}
        >
          Minimal Motion
        </button>
      </div>
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
        <div>
          System Prefers Reduced Motion: <strong>{prefersReducedMotion ? 'Yes' : 'No'}</strong>
        </div>
        <div>
          Low Bandwidth Mode: <strong>{isLowBandwidth ? 'Yes' : 'No'}</strong>
        </div>
        <div>
          Current Motion Mode: <strong>{motionMode}</strong>
        </div>
      </div>
    </div>
  );
}

/**
 * Basic animations showcase
 */
function BasicAnimations() {
  const boxRef = useRef<HTMLDivElement>(null);
  const animation = useGSAPAnimation(boxRef);
  const [currentAnimation, setCurrentAnimation] = useState<string>('');
  
  const runAnimation = (type: string) => {
    setCurrentAnimation(type);
    
    switch (type) {
      case 'fadeIn':
        animation.fadeIn();
        break;
      case 'fadeOut':
        animation.fadeOut({
          onComplete: () => animation.fadeIn({ delay: 0.5 })
        });
        break;
      case 'slideIn':
        animation.slideIn();
        break;
      case 'slideOut':
        animation.slideOut({
          onComplete: () => animation.slideIn({ delay: 0.5 })
        });
        break;
      case 'scale':
        animation.scale({ from: 0.5, to: 1 });
        break;
      case 'pulse':
        animation.pulse();
        break;
      case 'bounce':
        animation.bounce();
        break;
      case 'highlight':
        animation.highlight();
        break;
      case 'shake':
        animation.shake();
        break;
      case 'wiggle':
        animation.wiggle();
        break;
    }
  };
  
  // List of animation buttons
  const animations = [
    'fadeIn', 'fadeOut', 'slideIn', 'slideOut', 
    'scale', 'pulse', 'bounce', 'highlight', 'shake', 'wiggle'
  ];
  
  return (
    <ShowcaseSection title="Basic Animations">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {animations.map(anim => (
          <button
            key={anim}
            onClick={() => runAnimation(anim)}
            style={{ 
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-default)',
              background: currentAnimation === anim ? 'var(--color-primary-500)' : 'transparent',
              color: currentAnimation === anim ? 'white' : 'var(--color-text-primary)',
              cursor: 'pointer'
            }}
          >
            {anim}
          </button>
        ))}
      </div>
      
      <div 
        ref={boxRef}
        style={{ 
          width: '100px',
          height: '100px',
          backgroundColor: 'var(--color-primary-500)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          margin: '0 auto'
        }}
      >
        Animation Box
      </div>
    </ShowcaseSection>
  );
}

/**
 * AI animation components showcase
 */
function AIAnimations() {
  const [processingState, setProcessingState] = useState<'idle' | 'thinking' | 'processing' | 'analyzing'>('idle');
  const [confidenceLevel, setConfidenceLevel] = useState<'low' | 'medium' | 'high' | 'verifying' | 'processing'>('medium');
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const aiResponses = [
    "I've analyzed your inventory data and detected three potential stockout risks in your electronics category.",
    "Based on market trends in South Africa, I recommend adjusting your pricing strategy for the winter season.",
    "Your order volume from Cape Town has increased by 32% compared to last month, which indicates strong regional growth.",
  ];
  
  // Toggle processing state
  const toggleProcessing = (state: 'idle' | 'thinking' | 'processing' | 'analyzing') => {
    setProcessingState(prevState => prevState === state ? 'idle' : state);
  };
  
  // Start text streaming
  const startStreaming = () => {
    setIsStreaming(true);
    const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
    setStreamingText(randomResponse);
    
    // Reset after streaming completes
    setTimeout(() => {
      setIsStreaming(false);
    }, randomResponse.length * 50 + 1000);
  };
  
  return (
    <ShowcaseSection title="AI-Specific Animations">
      <div style={{ marginBottom: '2rem' }}>
        <h3>Processing Indicators</h3>
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
          <button 
            onClick={() => toggleProcessing('thinking')}
            style={{ 
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-default)',
              background: processingState === 'thinking' ? 'var(--color-primary-500)' : 'transparent',
              color: processingState === 'thinking' ? 'white' : 'var(--color-text-primary)',
              cursor: 'pointer'
            }}
          >
            Thinking
          </button>
          <button 
            onClick={() => toggleProcessing('processing')}
            style={{ 
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-default)',
              background: processingState === 'processing' ? 'var(--color-primary-500)' : 'transparent',
              color: processingState === 'processing' ? 'white' : 'var(--color-text-primary)',
              cursor: 'pointer'
            }}
          >
            Processing
          </button>
          <button 
            onClick={() => toggleProcessing('analyzing')}
            style={{ 
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-default)',
              background: processingState === 'analyzing' ? 'var(--color-primary-500)' : 'transparent',
              color: processingState === 'analyzing' ? 'white' : 'var(--color-text-primary)',
              cursor: 'pointer'
            }}
          >
            Analyzing
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AIProcessingIndicator 
            state={processingState} 
            size={40} 
          />
          <div>
            {processingState !== 'idle' ? `AI is ${processingState}...` : 'Idle state'}
          </div>
        </div>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>Confidence Feedback</h3>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {['low', 'medium', 'high', 'verifying', 'processing'].map((level) => (
            <button 
              key={level}
              onClick={() => setConfidenceLevel(level as any)}
              style={{ 
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-default)',
                background: confidenceLevel === level ? 'var(--color-primary-500)' : 'transparent',
                color: confidenceLevel === level ? 'white' : 'var(--color-text-primary)',
                cursor: 'pointer'
              }}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <IconFeedback 
            icon={confidenceLevel === 'low' ? <AlertIcon /> : <CheckIcon />}
            confidence={confidenceLevel} 
            size={40} 
          />
          <div>
            {`Showing ${confidenceLevel} confidence feedback`}
          </div>
        </div>
      </div>
      
      <div>
        <h3>Text Streaming</h3>
        <button 
          onClick={startStreaming}
          disabled={isStreaming}
          style={{ 
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-default)',
            background: isStreaming ? 'var(--color-neutral-300)' : 'var(--color-primary-500)',
            color: 'white',
            cursor: isStreaming ? 'default' : 'pointer',
            marginBottom: '1rem'
          }}
        >
          {isStreaming ? 'Streaming...' : 'Start Text Stream'}
        </button>
        <div style={{ 
          padding: '1rem',
          backgroundColor: 'var(--color-background-sunken)',
          borderRadius: 'var(--radius-md)',
          minHeight: '5rem'
        }}>
          <StreamingText 
            text={streamingText} 
            isStreaming={isStreaming} 
            showCursor={true}
          />
        </div>
      </div>
    </ShowcaseSection>
  );
}

/**
 * Transition components showcase
 */
function TransitionComponents() {
  const [activeTab, setActiveTab] = useState(0);
  const [showContent, setShowContent] = useState(true);
  const tabs = ['Home', 'Products', 'Analytics', 'Settings'];
  
  // Toggle content visibility
  const toggleContent = () => {
    setShowContent(prev => !prev);
  };
  
  return (
    <ShowcaseSection title="Transition Components">
      <div style={{ marginBottom: '2rem' }}>
        <h3>Fade Transitions</h3>
        <button 
          onClick={toggleContent}
          style={{ 
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-default)',
            background: 'var(--color-primary-500)',
            color: 'white',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          {showContent ? 'Hide Content' : 'Show Content'}
        </button>
        
        {showContent && (
          <TransitionFade direction="up" duration={0.4}>
            <div style={{ 
              padding: '1.5rem',
              backgroundColor: 'var(--color-background-sunken)',
              borderRadius: 'var(--radius-md)',
            }}>
              <h4 style={{ margin: '0 0 0.5rem' }}>Transition Fade Component</h4>
              <p style={{ margin: 0 }}>
                This content animates in and out smoothly when toggled.
                The TransitionFade component respects reduced motion preferences.
              </p>
            </div>
          </TransitionFade>
        )}
      </div>
      
      <div>
        <h3>Tab Indicator</h3>
        <div style={{ 
          position: 'relative',
          display: 'flex',
          borderBottom: '1px solid var(--color-border-light)',
          marginBottom: '1.5rem'
        }}>
          {tabs.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(index)}
              style={{ 
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                color: activeTab === index ? 
                  'var(--color-primary-500)' : 
                  'var(--color-text-secondary)',
                fontWeight: activeTab === index ? 'bold' : 'normal'
              }}
            >
              {tab}
            </button>
          ))}
          <AnimatedTabIndicator 
            activeIndex={activeTab} 
            tabCount={tabs.length} 
            height={3}
          />
        </div>
        
        <div style={{ 
          padding: '1rem',
          backgroundColor: 'var(--color-background-sunken)',
          borderRadius: 'var(--radius-md)',
        }}>
          {tabs[activeTab]} content would display here
        </div>
      </div>
    </ShowcaseSection>
  );
}

/**
 * GSAP Timeline Demo
 */
function GSAPTimelineDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const boxesRef = useRef<(HTMLDivElement | null)[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { motionMode } = useMotion();
  
  const playTimeline = () => {
    if (shouldReduceMotion) return;
    
    const container = containerRef.current;
    const boxes = boxesRef.current.filter(Boolean) as HTMLDivElement[];
    
    if (!container || boxes.length === 0) return;
    
    // Clean up existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    
    // Create new timeline
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => setIsPlaying(false),
    });
    
    // Apply complexity adjustments
    const duration = durations.normal * (motionMode === 'minimal' ? 0.5 : 
                                         motionMode === 'reduced' ? 0.7 : 1);
    
    // Add animations to timeline
    tl.to(container, {
      backgroundColor: 'var(--color-primary-100)',
      duration: duration,
      ease: 'power1.inOut'
    });
    
    boxes.forEach((box, index) => {
      tl.to(box, {
        y: -30,
        scale: 1.1,
        backgroundColor: 'var(--color-primary-500)',
        color: 'white',
        duration: duration,
        ease: 'back.out(1.7)'
      }, `>-${duration * 0.8}`); // Staggered overlap
      
      tl.to(box, {
        y: 0,
        scale: 1,
        duration: duration,
        ease: 'power1.out'
      }, `>-${duration * 0.5}`);
    });
    
    tl.to(container, {
      backgroundColor: 'var(--color-background-sunken)',
      duration: duration,
      ease: 'power1.inOut'
    }, `>-${duration * 0.7}`);
    
    // Store and play timeline
    timelineRef.current = tl;
    tl.play();
    setIsPlaying(true);
  };
  
  useEffect(() => {
    // Clean up timeline on unmount
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);
  
  return (
    <ShowcaseSection title="Advanced GSAP Timeline">
      <button 
        onClick={playTimeline}
        disabled={isPlaying || shouldReduceMotion}
        style={{ 
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-default)',
          background: (isPlaying || shouldReduceMotion) ? 'var(--color-neutral-300)' : 'var(--color-primary-500)',
          color: 'white',
          cursor: (isPlaying || shouldReduceMotion) ? 'default' : 'pointer',
          marginBottom: '1rem'
        }}
      >
        {isPlaying ? 'Playing...' : shouldReduceMotion ? 'Reduced Motion Enabled' : 'Play Timeline Animation'}
      </button>
      
      <div 
        ref={containerRef}
        style={{ 
          padding: '2rem',
          backgroundColor: 'var(--color-background-sunken)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-around',
          transition: shouldReduceMotion ? 'none' : undefined
        }}
      >
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            ref={(el) => {
              boxesRef.current[index] = el;
            }}
            style={{ 
              width: '60px',
              height: '60px',
              backgroundColor: 'var(--color-neutral-200)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              transition: shouldReduceMotion ? 'none' : undefined
            }}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </ShowcaseSection>
  );
}

/**
 * Business animations demo component
 */
function BusinessAnimations() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isActive, setIsActive] = useState(false);
  
  // Initialize GSAP Business license
  useEffect(() => {
    // Initialize with business module token
    initGSAPBusiness();
  }, []);
  
  // Text splitting demo
  const runSplitTextDemo = () => {
    if (!textRef.current) return;
    
    try {
      // Create split text instance
      const splitText = SplitTextUtils.createSplitText(textRef.current, {
        type: "chars,words",
      });
      
      // Animate the split text
      SplitTextUtils.animateSplitText(splitText, {
        animateWhat: 'chars',
        y: 30,
        stagger: 0.02,
        duration: 0.6,
        ease: "back.out(1.7)"
      });
    } catch (error) {
      console.error("Split text error:", error);
      // Fallback animation if business license isn't working
      gsap.fromTo(textRef.current, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.5 }
      );
    }
  };
  
  // SVG drawing demo
  const runSVGDemo = () => {
    if (!svgRef.current) return;
    
    try {
      // Get all paths in the SVG
      const paths = svgRef.current.querySelectorAll('path');
      
      // Create a timeline for sequential animation
      const tl = gsap.timeline();
      
      // Draw each path sequentially
      paths.forEach(path => {
        tl.add(SVGUtils.drawSVG(path, {
          from: "0%",
          to: "100%",
          duration: 1,
          ease: "power2.inOut"
        }), "-=0.5");
      });
    } catch (error) {
      console.error("SVG animation error:", error);
      // Fallback animation
      gsap.fromTo(svgRef.current, 
        { opacity: 0 }, 
        { opacity: 1, duration: 1 }
      );
    }
  };
  
  // Text scramble demo
  const runTextScrambleDemo = () => {
    if (!textRef.current) return;
    
    try {
      TextUtils.scrambleText(
        textRef.current, 
        "GSAP Business animations are now active!",
        {
          duration: 1.5,
          ease: "none"
        }
      );
    } catch (error) {
      console.error("Text scramble error:", error);
      // Fallback
      gsap.to(textRef.current, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          if (textRef.current) {
            textRef.current.textContent = "GSAP Business animations are now active!";
            gsap.to(textRef.current, { opacity: 1, duration: 0.2 });
          }
        }
      });
    }
  };
  
  return (
    <ShowcaseSection title="GSAP Business Features">
      <div style={{ marginBottom: '1.5rem' }}>
        <h3>Licensed GSAP Business Animations</h3>
        <p>These features require a valid GSAP Business license. Module installation token is active.</p>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={runSplitTextDemo}
          style={{ 
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-default)',
            background: 'var(--color-primary-500)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          SplitText Animation
        </button>
        
        <button 
          onClick={runSVGDemo}
          style={{ 
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-default)',
            background: 'var(--color-primary-500)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          DrawSVG Animation
        </button>
        
        <button 
          onClick={runTextScrambleDemo}
          style={{ 
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-default)',
            background: 'var(--color-primary-500)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Text Scramble
        </button>
      </div>
      
      {/* Demo container */}
      <div
        ref={containerRef}
        style={{
          padding: '2rem',
          backgroundColor: 'var(--color-background-sunken)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem'
        }}
      >
        {/* Text for SplitText and ScrambleText demos */}
        <div 
          ref={textRef}
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            textAlign: 'center'
          }}
        >
          Fluxori Business Animations
        </div>
        
        {/* SVG for DrawSVG demo */}
        <svg 
          ref={svgRef}
          width="200" 
          height="100" 
          viewBox="0 0 200 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ stroke: 'var(--color-primary-500)', strokeWidth: 2 }}
        >
          <path d="M20,50 C20,20 80,20 100,50 C120,80 180,80 180,50" fill="none" />
          <path d="M20,70 C60,40 140,40 180,70" fill="none" />
          <path d="M50,20 C70,40 70,60 50,80" fill="none" />
          <path d="M150,20 C130,40 130,60 150,80" fill="none" />
        </svg>
      </div>
    </ShowcaseSection>
  );
}

/**
 * Motion showcase page component
 */
export default function MotionShowcasePage() {
  return (
    <MotionProvider>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '2rem' 
      }}>
        <h1>Fluxori Motion Framework Showcase</h1>
        <p>
          This showcase demonstrates the capabilities of the Fluxori Motion Framework,
          which provides consistent, performant animations throughout the application.
        </p>
        
        <MotionControls />
        <BasicAnimations />
        <AIAnimations />
        <TransitionComponents />
        <GSAPTimelineDemo />
        <BusinessAnimations />
      </div>
    </MotionProvider>
  );
}