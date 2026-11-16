"use client";

import { useCallback, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import DrinkCup, { type DrinkLook } from "./DrinkCup";
import { Filmic, Studio, Warmup } from "./Studio";

function Turn({ look }: { look: DrinkLook }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock, pointer }) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, Math.sin(t * 0.4) * 0.5 + pointer.x * 0.5, 0.06);
    g.current.rotation.x = 0.12;
    g.current.position.y = -0.2 + Math.sin(t * 0.9) * 0.04;
  });
  return (
    <group ref={g}>
      <DrinkCup {...look} />
    </group>
  );
}

/** The drink builder's live cup. `filmic` adds the desktop post-processing. */
export default function BuilderCup({ look, filmic }: { look: DrinkLook; filmic: boolean }) {
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  return (
    <Canvas
      frameloop={ready ? "always" : "never"}
      style={{ opacity: ready ? 1 : 0, transition: "opacity 500ms ease-out" }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.55, 6.4], fov: 32, near: 0.1, far: 30 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => { gl.localClippingEnabled = true; }}
    >
      <Studio res={filmic ? 256 : 128} />
      <Turn look={look} />
      {filmic && <Filmic />}
      <Warmup onReady={onReady} />
    </Canvas>
  );
}
