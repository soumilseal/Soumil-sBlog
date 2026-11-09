import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HeroScene3DProps {
  interactive?: boolean;
}

export const HeroScene3D: React.FC<HeroScene3DProps> = ({ interactive = true }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060911, 0.04);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 18;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Central Hero 3D Object: Geometric Crystal Lattice
    const group = new THREE.Group();
    scene.add(group);

    // Inner glowing crystal
    const innerGeo = new THREE.IcosahedronGeometry(3.6, 1);
    const innerMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f2fe,
      emissive: 0x00435c,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.8,
      wireframe: false,
      transparent: true,
      opacity: 0.85,
    });
    const innerCrystal = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerCrystal);

    // Outer luxury wireframe cage
    const outerGeo = new THREE.IcosahedronGeometry(4.8, 1);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xf6d365,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const outerCage = new THREE.Mesh(outerGeo, outerMat);
    group.add(outerCage);

    // Orbital ring
    const ringGeo = new THREE.TorusGeometry(6.5, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.4,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    group.add(ring);

    // 4. Particle Field (Stars & Glowing Embers)
    const particleCount = prefersReducedMotion ? 120 : 600;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);

    const cyanColor = new THREE.Color(0x00f2fe);
    const goldColor = new THREE.Color(0xf6d365);
    const whiteColor = new THREE.Color(0xffffff);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

      const choice = Math.random();
      const pColor = choice < 0.5 ? cyanColor : choice < 0.85 ? goldColor : whiteColor;
      colors[i * 3] = pColor.r;
      colors[i * 3 + 1] = pColor.g;
      colors[i * 3 + 2] = pColor.b;

      velocities[i] = 0.02 + Math.random() * 0.05;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const cyanPoint = new THREE.PointLight(0x00f2fe, 3, 40);
    cyanPoint.position.set(10, 10, 10);
    scene.add(cyanPoint);

    const goldPoint = new THREE.PointLight(0xf6d365, 2.5, 40);
    goldPoint.position.set(-10, -10, 8);
    scene.add(goldPoint);

    // 6. Mouse Interaction & Parallax
    let targetX = 0;
    let targetY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = normX * 1.5;
      targetY = normY * 1.5;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth mouse lerp
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      if (!prefersReducedMotion) {
        group.rotation.y = time * 0.25 + mouseX * 0.6;
        group.rotation.x = Math.sin(time * 0.2) * 0.2 - mouseY * 0.6;
        ring.rotation.z = time * 0.15;
        ring.rotation.y = time * 0.1;

        // Subtle floating pulse
        group.position.y = Math.sin(time * 0.8) * 0.5;

        // Falling particles
        const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          arr[i * 3 + 1] -= velocities[i];
          if (arr[i * 3 + 1] < -20) {
            arr[i * 3 + 1] = 20;
            arr[i * 3] = (Math.random() - 0.5) * 50;
          }
        }
        posAttr.needsUpdate = true;
      }

      // Parallax camera offset
      camera.position.x = mouseX * 1.2;
      camera.position.y = mouseY * 1.2;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      outerGeo.dispose();
      outerMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [interactive]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none overflow-hidden select-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
};
