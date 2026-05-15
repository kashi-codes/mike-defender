/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float, Environment, SpotLight, ScrollControls, Scroll, useScroll, useProgress, Center } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import gsap from 'gsap';
import './index.css';

// ==========================================
// ERROR BOUNDARY FOR MISSING GLTF
// ==========================================
class StatueErrorBoundary extends React.Component<{ children: React.ReactNode, fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ==========================================
// VIRAL HOOK PRELOADER
// ==========================================
function Preloader({ onComplete }: { onComplete: () => void }) {
  const { progress } = useProgress();
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let timeout: any;
    if (progress === 100) {
      timeout = setTimeout(() => {
        setComplete(true);
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [progress]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!complete && (
        <motion.div
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="preloader"
        >
          {/* Framer Motion Viral Signature (Mike) */}
          <motion.svg viewBox="0 0 400 150" style={{ width: 320, height: 128, stroke: '#D4AF37', overflow: 'visible' }}>
            <motion.path
              d="M40,100 C60,20 80,10 90,60 C100,110 110,60 120,40 C130,20 140,80 150,100 C160,80 170,40 180,60 C190,80 200,90 220,90 C240,90 250,70 260,50 C270,30 280,30 290,50 C300,70 310,100 320,100 C340,100 360,80 370,50"
              fill="transparent"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
            />
          </motion.svg>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="preloader-title"
          >
            MIKE THE LAW DEFENDER
          </motion.div>
          <div className="preloader-bar-container">
            <div className="preloader-bar-bg">
              <motion.div
                className="preloader-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <span className="preloader-percent">{Math.round(progress)}%</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/// ==========================================
// SCROLL-DRIVEN CAMERA RIG
// ==========================================
function CameraRig() {
  const scroll = useScroll();
  const tl = useRef<gsap.core.Timeline | null>(null);

  // Initial Wide Shot configuration (Page 1)
  const animState = useRef({
    px: 0, py: 0, pz: 18,
    lx: 0, ly: 0, lz: 0
  });

  useEffect(() => {
    tl.current = gsap.timeline({ paused: true })
      // Transition to Page 2: Tight Zoom on Scales (Left Side)
      .to(animState.current, {
        px: -3, py: 2, pz: 6,
        lx: -1, ly: 2, lz: 0,
        ease: "power2.inOut",
        duration: 1
      }, 0)
      // Transition to Page 3: Low Angle looking up at Sword (Right Side)
      .to(animState.current, {
        px: 3, py: -2, pz: 7,
        lx: 1, ly: 3, lz: 0,
        ease: "power2.inOut",
        duration: 1
      }, 1)
      // Transition to Page 4: High angle left
      .to(animState.current, {
        px: -4, py: 6, pz: 9,
        lx: -1, ly: 3, lz: 0,
        ease: "power2.inOut",
        duration: 1
      }, 2)
      // Transition to Page 5: Low angle right
      .to(animState.current, {
        px: 5, py: 1, pz: 6,
        lx: 0, ly: 5, lz: 0,
        ease: "power2.inOut",
        duration: 1
      }, 3)
      // Transition to Page 6: Very close up to scales
      .to(animState.current, {
        px: -2.5, py: 4.5, pz: 3,
        lx: -1.5, ly: 5, lz: 0,
        ease: "power2.inOut",
        duration: 1
      }, 4)
      // Transition to Page 7: Final wide
      .to(animState.current, {
        px: 0, py: 0, pz: 22,
        lx: 0, ly: 4, lz: 0,
        ease: "power2.inOut",
        duration: 1
      }, 5)
      // Transition to Page 8: Pan up slightly
      .to(animState.current, {
        px: 0, py: 2, pz: 18,
        lx: 0, ly: 6, lz: 0,
        ease: "power2.inOut",
        duration: 1
      }, 6);
  }, []);

  useFrame((state) => {
    if (tl.current) {
      tl.current.progress(scroll.offset);
    }
    state.camera.position.set(animState.current.px, animState.current.py, animState.current.pz);
    state.camera.lookAt(animState.current.lx, animState.current.ly, animState.current.lz);
  });

  return null;
}

// ==========================================
// 3D MODELS
// ==========================================
// Real Model (requires /lady-law-3d-statue.glb in /public in CodeSandbox)
function StatueModel() {
  const { scene } = useGLTF('/lady-law-3d-statue.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
  
  // Modify material params slightly for the lighting setup
  scene.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material.envMapIntensity = 1.0;
        child.material.needsUpdate = true;
      }
    }
  });
  
  // Scale dynamically increased to ensure it is not too small
  return (
    <Center position={[0, -2, 0]}>
      <primitive object={scene} scale={15} />
    </Center>
  );
}

// Fallback Model (Abstract Scales and Sword scaled up mapping approximately to Scale 5 expectations)
function FallbackStatue() {
  return (
    <Center position={[0, -2, 0]}>
      <group scale={1.2}>
        {/* Main Body */}
        <mesh castShadow receiveShadow position={[0, 4, 0]}>
          <cylinderGeometry args={[0.5, 0.8, 8, 32]} />
          <meshStandardMaterial color="#222" metalness={0.8} roughness={0.4} />
        </mesh>
        
        {/* Left Arm & Scales of Justice */}
        <group position={[-1.5, 5, 0]}>
          <mesh castShadow position={[0.75, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.05, 1.5]} />
            <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
          </mesh>
          <mesh castShadow position={[-0.5, -1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.6, 0.04, 16, 32]} />
            <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
          </mesh>
        </group>

        {/* Right Arm & Sword */}
        <group position={[1.5, 7, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.1, 4, 0.2]} />
            <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
          </mesh>
          <mesh castShadow position={[0, -1, 0]}>
            <boxGeometry args={[0.8, 0.1, 0.3]} />
            <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
          </mesh>
        </group>

        {/* Base */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <cylinderGeometry args={[2.5, 3, 0.8, 32]} />
          <meshStandardMaterial color="#0A0A0A" metalness={0.3} roughness={0.8} />
        </mesh>
      </group>
    </Center>
  );
}

// Float wrapper for the weighted breathing
function Statue() {
  return (
    <Float floatIntensity={1.5} rotationIntensity={0.1} speed={1.5}>
      <StatueErrorBoundary fallback={<FallbackStatue />}>
        <Suspense fallback={null}>
          <StatueModel />
        </Suspense>
      </StatueErrorBoundary>
    </Float>
  );
}

// ==========================================
// HTML TEXT OVERLAYS
// ==========================================
function HTMLOverlays() {
  return (
    <Scroll html style={{ width: '100vw', height: '100vh', pointerEvents: 'none' }}>
      
      {/* Page 1 (Top) */}
      <div className="overlay-page page-1">
        <h1 className="page-title">
          MIKE THE LAW<br />DEFENDER
        </h1>
      </div>

      {/* Page 2 (Middle) */}
      <div className="overlay-page page-2">
        <div className="glass-panel">
          <h2 className="panel-title">
            The Burden of Proof
          </h2>
          <p className="panel-text">
            "Just because you did it doesn't mean you're guilty."
          </p>
        </div>
      </div>

      {/* Page 3 (Bottom) */}
      <div className="overlay-page page-3">
        <div className="glass-panel">
          <h2 className="panel-title">
            Relentless Defense
          </h2>
          <p className="panel-text">
            "Mike stands between you and the system."
          </p>
        </div>
      </div>

      {/* Page 4 */}
      <div className="overlay-page page-4">
        <div className="glass-panel">
          <h2 className="panel-title">
            Unwavering Loyalty
          </h2>
          <p className="panel-text">
            "When the world turns its back, we stand by yours."
          </p>
        </div>
      </div>

      {/* Page 5 */}
      <div className="overlay-page page-5">
        <div className="glass-panel">
          <h2 className="panel-title">
            Calculated Strategy
          </h2>
          <p className="panel-text">
            "Every detail scrutinized. Every angle exploited."
          </p>
        </div>
      </div>

      {/* Page 6 */}
      <div className="overlay-page page-6">
        <div className="glass-panel">
          <h2 className="panel-title">
            The Verdict
          </h2>
          <p className="panel-text">
            "Freedom isn't given. It's fought for."
          </p>
        </div>
      </div>

      {/* Page 7 */}
      <div className="overlay-page page-7">
        <h1 className="page-title">
          YOUR FUTURE<br />DEPENDS ON IT.
        </h1>
      </div>

      {/* Page 8 */}
      <div className="overlay-page page-8">
        <div className="contact-panel">
          <h2 className="panel-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>Request Consultation</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" className="form-input" placeholder="Your Name" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="tel" className="form-input" placeholder="Your Phone Number" />
            </div>
            <div className="form-group">
              <label className="form-label">Case Details</label>
              <textarea className="form-input" placeholder="Briefly describe your situation..." />
            </div>
            <button className="submit-btn" type="submit">Get Defense Now</button>
          </form>
        </div>
      </div>
      
    </Scroll>
  );
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="app-container">
      {/* Viral Hook Preloader */}
      {!loaded && <Preloader onComplete={() => setLoaded(true)} />}

      <Canvas 
        shadows
        camera={{ position: [0, 0, 18], fov: 45 }} 
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
      >
        <color attach="background" args={['#050505']} />
        
        {/* Force loading tracking initially, but hide ScrollControls until the preloader finishes */}
        <Suspense fallback={null}>
          
          <Environment preset="city" environmentIntensity={0.2} />
          
          {/* Chiaroscuro High Contrast Spotlights */}
          <SpotLight position={[20, 30, 20]} angle={0.3} penumbra={1} intensity={1200} color="#D4AF37" castShadow />
          <SpotLight position={[-20, 20, -10]} angle={0.4} penumbra={1} intensity={250} color="#ffffff" castShadow />
          <ambientLight intensity={0.05} />

          <Statue />

          {/* Render Scroll controls only when Preloader allows the scene transition */}
          {loaded && (
            <ScrollControls pages={8} damping={0.25}>
              <CameraRig />
              <HTMLOverlays />
            </ScrollControls>
          )}

        </Suspense>
      </Canvas>

      {/* Footer / Contact */}
      <div 
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1.5rem',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '0.5rem',
          pointerEvents: 'auto'
        }}
      >
        <a 
          href="https://wa.me/923450231801" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#25D366',
            color: 'white',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            textDecoration: 'none',
            boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.3)';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.996 0A12 12 0 000 12a11.95 11.95 0 001.614 6l-1.614 6 6-1.614A11.95 11.95 0 0012 24a12 12 0 000-24zm0 22A9.976 9.976 0 016.924 19.98l-3.32.88.88-3.32A9.976 9.976 0 012 12 9.996 9.996 0 0111.996 2c5.518 0 10 4.482 10 10s-4.482 10-10 10zm5.409-7.227c-.297-.15-1.758-.87-2.029-.97-.27-.099-.467-.15-.664.15-.197.3-.762.97-.934 1.17-.172.2-.344.225-.64.075-.297-.15-1.254-.46-2.39-1.472-.884-.788-1.48-1.762-1.652-2.063-.172-.3-.018-.463.13-.611.135-.133.298-.346.447-.521.149-.176.199-.301.298-.502.099-.199.05-.376-.025-.526-.074-.15-.664-1.603-.91-2.195-.239-.572-.482-.494-.664-.503-.172-.008-.369-.011-.566-.011-.197 0-.516.075-.787.375-.27.3-1.033 1.01-1.033 2.463 0 1.453 1.059 2.86 1.205 3.06.148.2 2.086 3.197 5.066 4.482.71.306 1.264.488 1.696.625.712.222 1.36.19 1.868.114.568-.083 1.758-.72 2.004-1.415.246-.696.246-1.292.172-1.416-.074-.124-.27-.199-.566-.349z"/>
          </svg>
        </a>
        <div 
          style={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            fontSize: '0.85rem', 
            fontFamily: 'var(--font-cinzel)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <span style={{ opacity: 0.8, fontSize: '0.65rem' }}>Designed & Created by</span>
          <strong style={{ color: 'var(--color-gold)', fontWeight: 700, letterSpacing: '0.1em' }}>MIKE</strong>
        </div>
      </div>
    </div>
  );
}
