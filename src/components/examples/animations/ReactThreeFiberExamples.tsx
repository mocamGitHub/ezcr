'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Stage,
  Grid,
  Environment,
  ContactShadows,
  Text,
  useGLTF,
  Box,
  Sphere,
  Cylinder,
} from '@react-three/drei';
import { useRef, useState, Suspense } from 'react';
import * as THREE from 'three';

/**
 * REACT THREE FIBER 3D EXAMPLES FOR EZ CYCLE RAMP
 *
 * React Three Fiber brings WebGL/Three.js 3D rendering to React.
 * Perfect for creating interactive 3D ramp configurators and product visualizations.
 *
 * Installation:
 * pnpm add three @react-three/fiber @react-three/drei
 *
 * What it enables:
 * - Interactive 3D ramp previews
 * - Real-time configuration visualization
 * - Camera controls (rotate, zoom, pan)
 * - Lighting and materials
 * - Physics simulations (optional)
 *
 * Performance:
 * - GPU-accelerated
 * - Works with Next.js 15 (client components)
 * - Supports React Server Components (with proper setup)
 *
 * Resources:
 * - Docs: https://docs.pmnd.rs/react-three-fiber
 * - Examples: https://docs.pmnd.rs/react-three-fiber/examples
 * - Starter: https://github.com/pmndrs/react-three-next
 */

// ============================================================================
// 1. BASIC 3D RAMP MODEL (PROCEDURAL GEOMETRY)
// ============================================================================

interface RampProps {
  length?: number; // inches
  width?: number; // inches
  angle?: number; // degrees
  color?: string;
}

function RampModel({
  length = 72, // 6 feet
  width = 30,
  angle = 15,
  color = '#0B5394', // EZ Cycle primary blue
}: RampProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Calculate ramp dimensions
  const lengthMeters = length * 0.0254; // Convert inches to meters
  const widthMeters = width * 0.0254;
  const angleRad = (angle * Math.PI) / 180;
  const height = lengthMeters * Math.sin(angleRad);

  // Create ramp shape using geometry
  const rampGeometry = new THREE.BufferGeometry();

  // Define vertices for the ramp
  const vertices = new Float32Array([
    // Front face (bottom)
    0, 0, 0,
    lengthMeters, 0, 0,
    lengthMeters, 0, widthMeters,
    0, 0, widthMeters,

    // Back face (top)
    0, height, 0,
    lengthMeters, 0, 0,
    lengthMeters, 0, widthMeters,
    0, height, widthMeters,
  ]);

  const indices = [
    // Bottom
    0, 1, 2, 0, 2, 3,
    // Ramp surface (main surface)
    4, 5, 6, 4, 6, 7,
    // Sides
    0, 4, 7, 0, 7, 3,
    1, 5, 6, 1, 6, 2,
    // Front and back
    0, 1, 5, 0, 5, 4,
    3, 2, 6, 3, 6, 7,
  ];

  rampGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  rampGeometry.setIndex(indices);
  rampGeometry.computeVertexNormals();

  return (
    <mesh ref={meshRef} geometry={rampGeometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        metalness={0.3}
        roughness={0.4}
        envMapIntensity={0.5}
      />
    </mesh>
  );
}

// ============================================================================
// 2. INTERACTIVE 3D RAMP CONFIGURATOR SCENE
// ============================================================================

export function Interactive3DRampConfigurator() {
  const [config, setConfig] = useState({
    length: 72,
    width: 30,
    angle: 15,
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-4 font-semibold">Ramp Configuration</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">
              Length: {config.length} inches
            </label>
            <input
              type="range"
              min="48"
              max="120"
              value={config.length}
              onChange={(e) =>
                setConfig({ ...config, length: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Width: {config.width} inches
            </label>
            <input
              type="range"
              min="20"
              max="48"
              value={config.width}
              onChange={(e) =>
                setConfig({ ...config, width: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Angle: {config.angle}°
            </label>
            <input
              type="range"
              min="5"
              max="30"
              value={config.angle}
              onChange={(e) =>
                setConfig({ ...config, angle: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* 3D Preview */}
      <div className="h-96 rounded-lg border bg-gradient-to-br from-gray-100 to-gray-200">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[3, 2, 3]} fov={50} />

          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-5, 5, -5]} intensity={0.5} />

          {/* Environment */}
          <Environment preset="city" />

          {/* Grid floor */}
          <Grid
            args={[10, 10]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#6f6f6f"
            sectionSize={1}
            sectionThickness={1}
            sectionColor="#9d4b4b"
            fadeDistance={20}
            fadeStrength={1}
            followCamera={false}
          />

          {/* The Ramp */}
          <Suspense fallback={null}>
            <RampModel
              length={config.length}
              width={config.width}
              angle={config.angle}
            />
          </Suspense>

          {/* Contact shadows */}
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.5}
            scale={10}
            blur={2}
            far={4}
          />

          {/* Camera controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={10}
          />
        </Canvas>
      </div>

      <p className="text-sm text-gray-600">
        💡 Drag to rotate, scroll to zoom, right-click to pan
      </p>
    </div>
  );
}

// ============================================================================
// 3. ANIMATED ROTATING PRODUCT SHOWCASE
// ============================================================================

function RotatingRamp() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3; // Slow rotation
    }
  });

  return (
    <group ref={groupRef}>
      <RampModel length={72} width={30} angle={15} />
    </group>
  );
}

export function RotatingProductShowcase() {
  return (
    <div className="h-96 rounded-lg border bg-gradient-to-br from-blue-900 to-purple-900">
      <Canvas>
        <PerspectiveCamera makeDefault position={[3, 2, 3]} fov={50} />

        {/* Studio lighting setup */}
        <ambientLight intensity={0.3} />
        <spotLight
          position={[5, 5, 5]}
          angle={0.3}
          penumbra={1}
          intensity={2}
          castShadow
        />
        <spotLight position={[-5, 5, -5]} angle={0.3} penumbra={1} intensity={1} />

        <Environment preset="sunset" />

        <Suspense fallback={null}>
          <RotatingRamp />
        </Suspense>

        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.7}
          scale={10}
          blur={2.5}
          far={4}
        />
      </Canvas>
    </div>
  );
}

// ============================================================================
// 4. RAMP WITH SIZE COMPARISON (TRUCK BED)
// ============================================================================

function TruckBed() {
  return (
    <group position={[0, 0.3, 0]}>
      {/* Truck bed representation */}
      <Box args={[2, 0.1, 1.5]} position={[1, 0, 0]}>
        <meshStandardMaterial color="#8B4513" metalness={0.2} roughness={0.8} />
      </Box>

      {/* Tailgate */}
      <Box args={[0.05, 0.5, 1.5]} position={[0, 0.25, 0]}>
        <meshStandardMaterial color="#654321" metalness={0.2} roughness={0.8} />
      </Box>

      {/* Label */}
      <Text
        position={[1, 0.6, 0]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Truck Bed
      </Text>
    </group>
  );
}

export function RampSizeComparison() {
  return (
    <div className="h-96 rounded-lg border bg-gradient-to-br from-gray-800 to-gray-900">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[4, 3, 4]} fov={50} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />

        <Environment preset="warehouse" />

        <Suspense fallback={null}>
          <RampModel length={72} width={30} angle={15} color="#0B5394" />
          <TruckBed />
        </Suspense>

        <Grid
          args={[10, 10]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#404040"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#606060"
        />

        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={10} blur={2} />

        <OrbitControls />
      </Canvas>
    </div>
  );
}

// ============================================================================
// 5. MULTI-MATERIAL RAMP (DIFFERENT FINISHES)
// ============================================================================

function MaterialShowcase({ material }: { material: 'aluminum' | 'carbon' | 'steel' }) {
  const materialProps = {
    aluminum: { color: '#C0C0C0', metalness: 0.9, roughness: 0.3 },
    carbon: { color: '#1a1a1a', metalness: 0.1, roughness: 0.8 },
    steel: { color: '#8899AA', metalness: 0.95, roughness: 0.15 },
  };

  const props = materialProps[material];

  return (
    <RampModel length={60} width={28} angle={12} color={props.color} />
  );
}

export function MaterialComparison() {
  const [material, setMaterial] = useState<'aluminum' | 'carbon' | 'steel'>(
    'aluminum'
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setMaterial('aluminum')}
          className={`rounded px-4 py-2 ${
            material === 'aluminum' ? 'bg-primary text-white' : 'bg-gray-200'
          }`}
        >
          Aluminum
        </button>
        <button
          onClick={() => setMaterial('carbon')}
          className={`rounded px-4 py-2 ${
            material === 'carbon' ? 'bg-primary text-white' : 'bg-gray-200'
          }`}
        >
          Carbon Fiber
        </button>
        <button
          onClick={() => setMaterial('steel')}
          className={`rounded px-4 py-2 ${
            material === 'steel' ? 'bg-primary text-white' : 'bg-gray-200'
          }`}
        >
          Steel
        </button>
      </div>

      <div className="h-96 rounded-lg border bg-gradient-to-br from-slate-800 to-slate-900">
        <Canvas>
          <PerspectiveCamera makeDefault position={[3, 2, 3]} fov={50} />

          <ambientLight intensity={0.3} />
          <spotLight
            position={[5, 5, 5]}
            angle={0.3}
            penumbra={1}
            intensity={2}
            castShadow
          />

          <Environment preset="studio" />

          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.5}>
              <MaterialShowcase material={material} />
            </Stage>
          </Suspense>

          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}

// ============================================================================
// 6. SIMPLE LOADING FALLBACK
// ============================================================================

function LoadingSpinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

// ============================================================================
// 7. IMPORT 3D MODEL (GLTF/GLB)
// ============================================================================

/**
 * For production, you'd import actual 3D models:
 *
 * 1. Create/purchase 3D model (.gltf or .glb format)
 * 2. Place in /public/models/
 * 3. Use useGLTF hook to load it
 *
 * Example:
 */

function ImportedRampModel({ url }: { url: string }) {
  // Load GLTF model
  const { scene } = useGLTF(url);

  return <primitive object={scene} scale={0.5} />;
}

export function GLTFModelExample() {
  return (
    <div className="h-96 rounded-lg border bg-gray-100">
      <Canvas>
        <PerspectiveCamera makeDefault position={[3, 2, 3]} fov={50} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Environment preset="sunset" />

        <Suspense fallback={<LoadingSpinner />}>
          {/*
            Replace with your actual model path:
            <ImportedRampModel url="/models/ramp.glb" />
          */}
          <RampModel /> {/* Fallback to procedural model */}
        </Suspense>

        <OrbitControls />
      </Canvas>

      <div className="mt-4 rounded bg-yellow-50 p-4 text-sm text-yellow-800">
        💡 To use custom 3D models, place .glb files in /public/models/ and
        uncomment the ImportedRampModel component
      </div>
    </div>
  );
}

// ============================================================================
// DEMO PAGE
// ============================================================================

export function ReactThreeFiberDemo() {
  return (
    <div className="space-y-12 p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">
          React Three Fiber 3D Examples
        </h1>
        <p className="text-gray-600">
          Interactive 3D visualizations for EZ Cycle Ramp configurator
        </p>
        <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-semibold">🚀 Installation:</p>
          <code className="mt-2 block rounded bg-blue-100 p-2">
            pnpm add three @react-three/fiber @react-three/drei
          </code>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-2xl font-bold">
          1. Interactive Ramp Configurator
        </h2>
        <Interactive3DRampConfigurator />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">
          2. Rotating Product Showcase
        </h2>
        <RotatingProductShowcase />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">3. Size Comparison (Truck Bed)</h2>
        <RampSizeComparison />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">
          4. Material Comparison
        </h2>
        <MaterialComparison />
      </section>
    </div>
  );
}

/**
 * INTEGRATION GUIDE FOR EZ CYCLE CONFIGURATOR:
 *
 * 1. Install dependencies:
 *    pnpm add three @react-three/fiber @react-three/drei
 *
 * 2. Create a 3D ramp component in your configurator:
 *    - Import the Interactive3DRampConfigurator
 *    - Pass configuration values from your configurator state
 *    - Update 3D model in real-time as user changes options
 *
 * 3. Optional enhancements:
 *    - Add animations for step transitions
 *    - Show installation context (truck bed, etc.)
 *    - Add measurement labels
 *    - Enable screenshots/exports
 *    - Add AR view (with @react-three/xr)
 *
 * 4. Performance tips:
 *    - Use Suspense for lazy loading
 *    - Optimize geometry complexity
 *    - Use Instancing for repeated elements
 *    - Enable shadows only where needed
 *    - Use Environment for realistic lighting
 *
 * 5. Where to get 3D models:
 *    - Create in Blender (free, open-source)
 *    - Hire 3D artist on Fiverr/Upwork
 *    - Sketchfab marketplace (sketchfab.com)
 *    - TurboSquid (turbosquid.com)
 *
 * This would be a GAME CHANGER for your configurator! 🚀
 */
