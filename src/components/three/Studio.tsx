"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";

/** Shared lighting: warm key, soft gold rims, a procedural studio environment. */
export function Studio({ res = 256 }: { res?: number }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 5]} intensity={2.4} color="#ffe6bf" />
      <pointLight position={[-5, -1, 3]} intensity={26} color="#c9a15a" />
      <pointLight position={[5, -2, 2]} intensity={26} color="#e2b566" />
      <pointLight position={[0, 3, -4]} intensity={40} color="#ffd98f" />
      <Environment resolution={res} frames={1}>
        <color attach="background" args={["#140b08"]} />
        <Lightformer form="rect" intensity={5} position={[0, 6, 2]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 6, 1]} color="#fff3e0" />
        <Lightformer form="rect" intensity={3} position={[-6, 1, 2]} rotation={[0, Math.PI / 2, 0]} scale={[6, 3, 1]} color="#ffd9b0" />
        <Lightformer form="rect" intensity={3} position={[6, 1, 2]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 3, 1]} color="#ffe6c4" />
        <Lightformer form="circle" intensity={4} position={[0, 2, 7]} scale={3} color="#ffffff" />
        <Lightformer form="rect" intensity={1.5} position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[10, 6, 1]} color="#3a2418" />
      </Environment>
    </>
  );
}

/** 35mm look for desktop canvases: halation on highlights, fine grain, soft vignette, ACES. */
export function Filmic() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.5} luminanceThreshold={0.74} luminanceSmoothing={0.3} mipmapBlur radius={0.7} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.2} />
      <Vignette offset={0.28} darkness={0.45} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
