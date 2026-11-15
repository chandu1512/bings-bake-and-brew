"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/**
 * A clear cup whose contents are driven by props: the hero's iced mocha and
 * the drink builder's live cup are both this component.
 */
export type DrinkLook = {
  kind: "hot" | "iced" | "frozen";
  /** Colour of the drink once the milk is in. Changing it replays the pour. */
  liquid: string;
  /** One syrup ribbon per colour. */
  flavors: string[];
  /** Extra espresso shots: a dark layer dropped into the bottom. */
  shots: number;
  /** 0 = smallest size, 1 = largest. */
  size: number;
  lite?: boolean;
};

const Y0 = -1.05;
const H = 2.1;
const RB = 0.5;
const RT = 0.74;
const FULL = 0.86;
const rAt = (y: number) => RB + ((y - Y0) / H) * (RT - RB);
const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

let steamTex: THREE.CanvasTexture | null = null;
export function steamTexture() {
  if (steamTex) return steamTex;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 64, 2, 32, 64, 32);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.setTransform(1, 0, 0, 2, 0, -64);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 128);
  return (steamTex = new THREE.CanvasTexture(c));
}

/** Rising steam puffs; place above a cup's rim. */
export function Steam({ y = 1.4 }: { y?: number }) {
  const puffs = useRef<(THREE.Mesh | null)[]>([]);
  const tex = useMemo(steamTexture, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    puffs.current.forEach((p, i) => {
      if (!p) return;
      const ph = (t * 0.2 + i / 3) % 1;
      p.position.set(Math.sin(t * 0.8 + i * 2.1) * 0.14 * (ph + 0.3), y + ph * 1.25, 0.1);
      p.scale.set(0.45 + ph * 0.7, 0.9 + ph * 0.9, 1);
      (p.material as THREE.MeshBasicMaterial).opacity = Math.sin(ph * Math.PI) * 0.34;
    });
  });
  return (
    <>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => { puffs.current[i] = el; }} renderOrder={5}>
          <planeGeometry args={[0.7, 0.9]} />
          <meshBasicMaterial map={tex} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

/** A syrup ribbon that winds up the inside of the cup and draws itself in. */
function Ribbon({ color, index, lite }: { color: string; index: number; lite?: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const drawn = useRef(0);
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const y = Y0 + 0.12 + t * (H * FULL - 0.2);
      const a = t * Math.PI * 2 * 2.3 + index * 2.1;
      const r = rAt(y) - 0.022;
      pts.push(new THREE.Vector3(Math.cos(a) * r, y + Math.sin(t * 9 + index) * 0.03, Math.sin(a) * r));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), lite ? 90 : 160, 0.034, 6);
  }, [index, lite]);
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame((_, dt) => {
    drawn.current = Math.min(1, drawn.current + dt / 1.3);
    const n = geo.index!.count;
    geo.setDrawRange(0, Math.floor((easeOut(drawn.current) * n) / 3) * 3);
  });
  return (
    <mesh ref={mesh} geometry={geo} renderOrder={2}>
      <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={1} clearcoatRoughness={0.1} emissive={color} emissiveIntensity={0.12} />
    </mesh>
  );
}

export default function DrinkCup({ kind, liquid, flavors, shots, size, lite }: DrinkLook) {
  const root = useRef<THREE.Group>(null);
  const liquidMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const top = useRef<THREE.Mesh>(null);
  const stream = useRef<THREE.Mesh>(null);
  const shot = useRef<THREE.Mesh>(null);
  const ice = useRef<THREE.Group>(null);
  const dome = useRef<THREE.Mesh>(null);
  const fill = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Color(liquid), [liquid]);
  const state = useRef({ pour: 0, shotY: 1.6, scale: 0.8 + 0.2 * size });
  const seg = lite ? 32 : 64;

  const wall = useMemo(
    () => new THREE.LatheGeometry([[0, Y0], [RB, Y0], [RB + 0.012, Y0 + 0.03], [RT, Y0 + H]].map(([r, y]) => new THREE.Vector2(r, y)), seg),
    [seg]
  );

  // A new milk (or a new drink) pours in from the top.
  useEffect(() => { state.current.pour = 0; }, [liquid]);
  useEffect(() => { if (shots > 0) state.current.shotY = 1.6; }, [shots]);

  useFrame(({ clock }, dt) => {
    const s = state.current;
    const t = clock.elapsedTime;
    s.pour = Math.min(1, s.pour + dt / 1.25);
    const level = Y0 + H * (0.3 + (FULL - 0.3) * easeOut(s.pour));
    s.scale = THREE.MathUtils.damp(s.scale, 0.78 + 0.22 * size, 6, dt);
    root.current?.scale.setScalar(s.scale);
    // The fill (liquid and syrup) rises from the bottom; its top always meets the cup wall.
    if (fill.current) {
      const k = (rAt(level) - 0.03) / (rAt(Y0 + H * FULL) - 0.03);
      fill.current.scale.set(k, (level - Y0) / (H * FULL), k);
    }
    liquidMat.current?.color.lerp(target, 1 - Math.exp(-dt * 4));
    if (top.current) {
      top.current.position.y = level;
      top.current.scale.setScalar(rAt(level) - 0.03);
      (top.current.material as THREE.MeshPhysicalMaterial).color.copy(liquidMat.current?.color ?? target).lerp(WHITE, kind === "hot" ? 0.55 : 0.18);
    }
    if (stream.current) {
      const on = s.pour < 0.85;
      stream.current.visible = on;
      if (on) {
        const topY = 2.3;
        stream.current.position.y = (topY + level) / 2;
        stream.current.scale.set(1 - s.pour * 0.6, topY - level, 1 - s.pour * 0.6);
      }
    }
    if (shot.current) {
      const rest = Y0 + 0.03 + (0.16 * Math.min(shots, 3)) / 2;
      s.shotY = THREE.MathUtils.damp(s.shotY, rest, 5, dt);
      shot.current.position.y = s.shotY;
    }
    ice.current?.children.forEach((c, i) => {
      const a = i * 1.7 + Math.sin(t * 0.5 + i) * 0.25;
      const clink = Math.max(0, Math.sin(t * 1.3 + i * 2.2)) ** 6;
      c.position.set(Math.cos(a) * 0.26, level - 0.06 - (i % 2) * 0.22 + Math.sin(t * 1.4 + i * 1.9) * 0.035 + clink * 0.05, Math.sin(a) * 0.26);
      c.rotation.set(i + Math.sin(t * 0.7 + i) * 0.25 + clink * 0.3, i * 2 + t * 0.15, i * 0.7 + clink * 0.25);
    });
    if (dome.current) {
      dome.current.position.y = level;
      dome.current.scale.set(rAt(level) - 0.03, (rAt(level) - 0.03) * 0.62 * easeOut(s.pour * 1.2), rAt(level) - 0.03);
      (dome.current.material as THREE.MeshPhysicalMaterial).color.copy(liquidMat.current?.color ?? target).lerp(WHITE, 0.35);
    }
  });

  const shotH = 0.16 * Math.min(shots, 3);
  return (
    <group ref={root}>
      {/* contents */}
      <group ref={fill} position={[0, Y0 + 0.02, 0]}>
        <mesh position={[0, (H * FULL) / 2, 0]} renderOrder={1}>
          <cylinderGeometry args={[rAt(Y0 + H * FULL) - 0.03, RB - 0.03, H * FULL, seg, 1]} />
          <meshPhysicalMaterial ref={liquidMat} color={liquid} roughness={0.3} clearcoat={0.7} clearcoatRoughness={0.2} />
        </mesh>
        <group position={[0, -Y0 - 0.02, 0]}>
          {flavors.slice(0, 3).map((c, i) => (
            <Ribbon key={`${c}-${i}`} color={c} index={i} lite={lite} />
          ))}
        </group>
      </group>
      <mesh ref={top} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <circleGeometry args={[1, seg]} />
        <meshPhysicalMaterial color={liquid} roughness={0.35} clearcoat={0.6} />
      </mesh>
      <mesh ref={stream} renderOrder={1}>
        <cylinderGeometry args={[0.05, 0.035, 1, 10]} />
        <meshPhysicalMaterial color={liquid} roughness={0.2} clearcoat={1} />
      </mesh>
      {shots > 0 && (
        <mesh ref={shot} renderOrder={2}>
          <cylinderGeometry args={[rAt(Y0 + shotH) - 0.02, RB - 0.02, shotH, seg, 1]} />
          <meshPhysicalMaterial color="#2a1408" roughness={0.25} clearcoat={1} />
        </mesh>
      )}
      {kind === "iced" && (
        <group ref={ice}>
          {Array.from({ length: lite ? 3 : 5 }, (_, i) => (
            <RoundedBox key={i} args={[0.3, 0.3, 0.3]} radius={0.05} smoothness={lite ? 2 : 4} renderOrder={2}>
              <meshPhysicalMaterial color="#f4fbff" transparent opacity={0.62} roughness={0.06} clearcoat={1} clearcoatRoughness={0.05} envMapIntensity={1.6} />
            </RoundedBox>
          ))}
        </group>
      )}
      {kind === "frozen" && (
        <mesh ref={dome} renderOrder={2}>
          <sphereGeometry args={[1, seg, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color={liquid} roughness={0.75} clearcoat={0.2} />
        </mesh>
      )}
      {kind !== "hot" && (
        <mesh position={[0.2, 0.55, -0.08]} rotation={[0.08, 0, -0.16]} renderOrder={2}>
          <cylinderGeometry args={[0.045, 0.045, 2.7, 14]} />
          <meshPhysicalMaterial color="#7a1f2b" roughness={0.35} clearcoat={1} />
        </mesh>
      )}
      {kind === "hot" && <Steam y={1.35} />}

      {/* the clear cup itself, drawn last */}
      <mesh geometry={wall} renderOrder={4}>
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.12} roughness={0.04} clearcoat={1} clearcoatRoughness={0.04} side={THREE.DoubleSide} depthWrite={false} envMapIntensity={1.2} />
      </mesh>
      <mesh position={[0, Y0 + H, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={4}>
        <torusGeometry args={[RT, 0.022, 8, seg]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.55} roughness={0.05} clearcoat={1} />
      </mesh>
    </group>
  );
}

const WHITE = new THREE.Color("#fff6e6");
