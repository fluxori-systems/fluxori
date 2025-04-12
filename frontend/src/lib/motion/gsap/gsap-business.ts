'use client';

/**
 * GSAP Business License Features
 * 
 * This file contains utilities for GSAP Business license features.
 * These features are commented out and would need to be activated 
 * with a valid GSAP Business license.
 * 
 * IMPORTANT: A GSAP Business license is required to use these features.
 * See: https://greensock.com/docs/v3/Installation#business
 */

import { gsap } from 'gsap';

// Business license plugins
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { Flip } from 'gsap/Flip';
import { GSDevTools } from 'gsap/GSDevTools';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { CustomBounce } from 'gsap/CustomBounce';
import { CustomWiggle } from 'gsap/CustomWiggle';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { PhysicsPropsPlugin } from 'gsap/PhysicsPropsPlugin';
import { InertiaPlugin } from 'gsap/InertiaPlugin';

/**
 * GSAP Business license token
 * This token is used to activate the GSAP Business license features
 */
const GSAP_BUSINESS_TOKEN = 'aa268268-f5ee-47e4-9af7-ec057209343b';

/**
 * Initializes GSAP Business features with license
 * @param moduleToken Optional override token (default uses the project token)
 */
export function initGSAPBusiness(moduleToken: string = GSAP_BUSINESS_TOKEN): void {
  // With the token provided, we can register the business license
  if (!moduleToken) {
    console.warn('GSAP Business features require a valid license key');
    return;
  }

  // Register the GSAP Business plugins with token
  
  // Register the license
  gsap.registerPlugin(
    SplitText, 
    DrawSVGPlugin, 
    MotionPathPlugin, 
    MorphSVGPlugin, 
    Flip, 
    GSDevTools, 
    ScrambleTextPlugin,
    CustomEase,
    CustomBounce,
    CustomWiggle,
    Physics2DPlugin,
    PhysicsPropsPlugin,
    InertiaPlugin
  );
  
  // Apply the module installation token
  if (typeof window !== 'undefined') {
    // GSAP Business license activation
    // Add the token to the window object with proper typing
    // First cast to unknown then to the target type to avoid TypeScript errors
    ((window as unknown) as { _gsapModuleInstallation: string })._gsapModuleInstallation = moduleToken;
    console.log('GSAP Business license active:', gsap.version);
  }
}

/**
 * SplitText animation utilities
 * Requires GSAP Business license
 */
export const SplitTextUtils = {
  /**
   * Creates a text splitting animation
   * @param target Element to target
   * @param options Animation options
   */
  createSplitText: (target: string | Element, options: any = {}) => {
    // Using GSAP Business SplitText
    const split = new SplitText(target, {
      type: options.type || "chars,words,lines",
      ...options
    });
    
    return split;
  },
  
  /**
   * Animates split text with staggered effect
   * @param splitText SplitText instance
   * @param options Animation options
   */
  animateSplitText: (splitText: any, options: any = {}) => {
    // Using GSAP Business SplitText animation
    const timeline = gsap.timeline(options.timeline || {});
    const elements = splitText[options.animateWhat || 'chars'];
    
    timeline.from(elements, {
      opacity: 0,
      y: options.y || 20,
      duration: options.duration || 0.5,
      stagger: options.stagger || 0.02,
      ease: options.ease || "power2.out",
      ...options.animation
    });
    
    return timeline;
  }
};

/**
 * SVG animation utilities
 * Requires GSAP Business license
 */
export const SVGUtils = {
  /**
   * Animates drawing an SVG path
   * @param target SVG element to animate
   * @param options Animation options
   */
  drawSVG: (target: string | Element, options: any = {}) => {
    // Using GSAP Business DrawSVGPlugin
    return gsap.fromTo(target, 
      { drawSVG: options.from || "0%" },
      { 
        drawSVG: options.to || "100%", 
        duration: options.duration || 1,
        ease: options.ease || "power2.inOut",
        ...options
      }
    );
  },
  
  /**
   * Morphs between SVG paths
   * @param target SVG element to morph
   * @param endShape Target shape to morph to
   * @param options Animation options
   */
  morphSVG: (target: string | Element, endShape: string, options: any = {}) => {
    // Using GSAP Business MorphSVGPlugin
    return gsap.to(target, {
      morphSVG: {
        shape: endShape,
        ...options.morphOptions
      },
      duration: options.duration || 1,
      ease: options.ease || "power2.inOut",
      ...options
    });
  }
};

/**
 * FLIP animation utilities
 * Requires GSAP Business license
 */
export const FlipUtils = {
  /**
   * Creates a FLIP animation for smooth layout transitions
   * @param target Elements to animate
   * @param options Animation options
   */
  createFlip: (options: any = {}) => {
    // Using GSAP Business Flip
    // Record the initial state
    const state = Flip.getState(options.targets || ".flip-element");
    
    // Make DOM changes that affect layout
    if (options.layoutChanges) {
      options.layoutChanges();
    }
    
    // Animate from the initial state to the new layout
    return Flip.from(state, {
      duration: options.duration || 0.5,
      ease: options.ease || "power1.out",
      absolute: options.absolute !== undefined ? options.absolute : false,
      ...options
    });
  }
};

/**
 * Text scramble animation utilities
 * Requires GSAP Business license
 */
export const TextUtils = {
  /**
   * Creates a text scramble animation
   * @param target Element to target
   * @param newText New text content
   * @param options Animation options
   */
  scrambleText: (target: string | Element, newText: string, options: any = {}) => {
    // Using GSAP Business ScrambleTextPlugin
    return gsap.to(target, {
      scrambleText: {
        text: newText,
        chars: options.chars || "0123456789!@#$%^&*()",
        revealDelay: options.revealDelay || 0.5,
        speed: options.speed || 0.3,
        ...options.scrambleOptions
      },
      duration: options.duration || 1,
      ease: options.ease || "none",
      ...options
    });
  }
};

/**
 * Physics animation utilities
 * Requires GSAP Business license
 */
export const PhysicsUtils = {
  /**
   * Creates a physics-based animation
   * @param target Element to animate
   * @param options Physics animation options
   */
  createPhysicsAnimation: (target: string | Element, options: any = {}) => {
    // Using GSAP Business Physics2DPlugin
    return gsap.to(target, {
      duration: options.duration || 2,
      physics2D: {
        velocity: options.velocity || 300,
        angle: options.angle || -60,
        gravity: options.gravity || 700,
        ...options.physicsOptions
      },
      ...options
    });
  }
};

/**
 * Custom easing utilities
 * Requires GSAP Business license
 */
export const CustomEasingUtils = {
  /**
   * Creates a custom ease function
   * @param name Name for the custom ease
   * @param bezierPoints Bezier curve control points
   */
  createCustomEase: (name: string, bezierPoints: string) => {
    // Using GSAP Business CustomEase
    return CustomEase.create(name, bezierPoints);
  },
  
  /**
   * Creates a custom bounce ease
   * @param name Name for the custom bounce
   * @param options Bounce options
   */
  createCustomBounce: (name: string, options: any = {}) => {
    // Using GSAP Business CustomBounce
    return CustomBounce.create(name, options);
  },
  
  /**
   * Creates a custom wiggle ease
   * @param name Name for the custom wiggle
   * @param options Wiggle options
   */
  createCustomWiggle: (name: string, options: any = {}) => {
    // Using GSAP Business CustomWiggle
    return CustomWiggle.create(name, options);
  }
};