"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import DrinkCup, { Steam } from "./DrinkCup";
import { Filmic, Studio, Warmup } from "./Studio";
import { crumbBump, ribBump, speckle } from "./textures";

/** Pointer (-1..1) and scroll progress (0..1), written by the hero, read every frame. */
export type HeroMotion = { px: number; py: number; scroll: number };
export type Shop = "amstel" | "elkton";
type Mode = "wide" | "strip";
type MotionRef = MutableRefObject<HeroMotion>;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 3.7) * 43758.5453;
  return x - Math.floor(x);
};
const n3 = (x: number, y: number, z: number) => Math.sin(x * 1.7 + y * 2.3) * Math.sin(y * 1.9 + z * 2.1) * Math.sin(z * 1.3 + x * 2.7);
const fbm = (x: number, y: number, z: number) => n3(x, y, z) * 0.6 + n3(x * 2.3 + 5, y * 2.3, z * 2.3) * 0.3 + n3(x * 5.1, y * 5.1 + 3, z * 5.1) * 0.15;

/* ---------- Elkton, left: Bing's red takeaway cup, kraft sleeve, steam ---------- */

const cupR = (y: number) => 0.5 + ((y + 1.1) / 2.1) * 0.22;

function Cup({ motion, lite }: { motion: MotionRef; lite: boolean }) {
  const spin = useRef<THREE.Group>(null);
  const seg = lite ? 36 : 72;
  const body = useMemo(
    () => new THREE.LatheGeometry([[0, -1.1], [0.47, -1.1], [0.5, -1.08], [0.51, -1.04], [0.72, 1.0]].map(([r, y]) => new THREE.Vector2(r, y)), seg),
    [seg]
  );
  const lid = useMemo(
    () =>
      new THREE.LatheGeometry(
        [[0.735, 0.97], [0.768, 0.99], [0.768, 1.06], [0.725, 1.085], [0.7, 1.19], [0.655, 1.225], [0.6, 1.2], [0.2, 1.2], [0, 1.2]].map(([r, y]) => new THREE.Vector2(r, y)),
        seg
      ),
    [seg]
  );
  const logo = useMemo(() => {
    const t = new THREE.TextureLoader().load("/brand/Bings_Bake_Brew_Logo_Color.png");
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
  const ribs = useMemo(() => ribBump(64), []);
  const paper = useMemo(() => crumbBump("paper"), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const m = motion.current;
    if (!spin.current) return;
    spin.current.rotation.y = THREE.MathUtils.lerp(spin.current.rotation.y, Math.sin(t * 0.45) * 0.55 + m.px * 0.5, 0.06);
    spin.current.rotation.x = THREE.MathUtils.lerp(spin.current.rotation.x, 0.1 - m.py * 0.16, 0.06);
    spin.current.rotation.z = -0.1 + Math.sin(t * 0.6) * 0.03 + m.scroll * 0.35;
  });

  return (
    <group>
      <group ref={spin}>
        <mesh geometry={body}>
          <meshPhysicalMaterial color="#b81d2a" roughness={0.42} clearcoat={0.55} clearcoatRoughness={0.25} bumpMap={paper} bumpScale={0.25} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[cupR(0.5) + 0.014, cupR(-0.5) + 0.014, 1, seg, 1, true]} />
          <meshStandardMaterial color="#b98d5c" roughness={0.92} bumpMap={ribs} bumpScale={1.6} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[cupR(0.26) + 0.02, cupR(-0.26) + 0.02, 0.52, 32, 1, true, -0.82, 1.64]} />
          <meshStandardMaterial map={logo} transparent roughness={0.85} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
        <mesh geometry={lid}>
          <meshPhysicalMaterial color="#f3eee4" roughness={0.38} clearcoat={0.5} clearcoatRoughness={0.3} />
        </mesh>
      </group>
      <Steam y={1.45} />
    </group>
  );
}

/* ---------- Elkton, right: the crumb cake square, crumbs tumbling off it ---------- */

function useCrumbs(lite: boolean) {
  return useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, lite ? 1 : 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const k = 1 + fbm(x * 2.4, y * 2.4, z * 2.4) * 0.32;
      p.setXYZ(i, x * k, y * k, z * k);
    }
    g.computeVertexNormals();
    return g;
  }, [lite]);
}

function CrumbCake({ motion, lite }: { motion: MotionRef; lite: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const falling = useRef<THREE.Group>(null);
  const crumb = useCrumbs(lite);
  const bump = useMemo(() => crumbBump(), []);
  const cakeMap = useMemo(() => speckle("cake", "#e6c57e", [["#d2a554", 900, 3, 0.5], ["#f5e2ae", 700, 2, 0.5], ["#a9792f", 260, 1.6, 0.45]]), []);
  const crumbMap = useMemo(() => speckle("streusel", "#bd8747", [["#8c5a26", 700, 3, 0.5], ["#dcae6c", 600, 2.4, 0.5], ["#fff7ea", 500, 1.3, 0.75]]), []);
  const top = useMemo(
    () =>
      Array.from({ length: lite ? 34 : 96 }, (_, i) => ({
        p: [(rnd(i) - 0.5) * 1.4, 0.45 + rnd(i + 50) * 0.13, (rnd(i + 100) - 0.5) * 1.4] as [number, number, number],
        s: 0.07 + rnd(i + 150) * 0.1,
        r: rnd(i + 200) * 6,
      })),
    [lite]
  );
  const drops = lite ? 5 : 11;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const m = motion.current;
    if (ref.current) {
      ref.current.rotation.y = 0.65 + Math.sin(t * 0.4) * 0.5 + m.px * 0.5;
      ref.current.rotation.x = 0.42 + Math.sin(t * 0.5) * 0.1 - m.py * 0.2;
      ref.current.rotation.z = -0.08 - m.scroll * 0.5;
    }
    falling.current?.children.forEach((c, i) => {
      const ph = (t * (0.16 + rnd(i) * 0.1) + rnd(i + 9)) % 1;
      c.position.set((rnd(i + 20) - 0.5) * 2.1, 0.7 - ph * ph * 3.2, (rnd(i + 30) - 0.5) * 1.2 + 0.3);
      c.rotation.set(t * (1 + rnd(i)) + i, t * 1.3 + i, i);
      c.scale.setScalar((0.045 + rnd(i + 40) * 0.06) * Math.min(1, ph * 8) * Math.min(1, (1 - ph) * 5));
    });
  });

  const crumbMat = <meshPhysicalMaterial map={crumbMap} bumpMap={bump} bumpScale={1.8} roughness={0.88} sheen={0.7} sheenColor="#ffcf8a" sheenRoughness={0.6} />;
  return (
    <group>
      <group ref={ref}>
        <RoundedBox args={[1.5, 0.66, 1.5]} radius={0.05} smoothness={lite ? 2 : 4}>
          <meshPhysicalMaterial map={cakeMap} bumpMap={bump} bumpScale={2.2} roughness={0.9} sheen={0.8} sheenColor="#ffe2a4" sheenRoughness={0.5} />
        </RoundedBox>
        <RoundedBox args={[1.5, 0.16, 1.5]} radius={0.06} smoothness={2} position={[0, 0.38, 0]}>
          {crumbMat}
        </RoundedBox>
        {top.map((c, i) => (
          <mesh key={i} geometry={crumb} position={c.p} rotation={[c.r, c.r * 2, c.r * 3]} scale={[c.s, c.s * 0.78, c.s * 0.92]}>
            {crumbMat}
          </mesh>
        ))}
      </group>
      <group ref={falling}>
        {Array.from({ length: drops }, (_, i) => (
          <mesh key={i} geometry={crumb}>
            {crumbMat}
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ---------- Amstel, right: blueberry muffins in pleated paper liners ---------- */

function Muffins({ motion, lite }: { motion: MotionRef; lite: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const crumb = useCrumbs(true);
  const bump = useMemo(() => crumbBump(), []);
  const ribs = useMemo(() => ribBump(40), []);
  const topMap = useMemo(
    () => speckle("muffin", "#c98e48", [["#8f5a24", 900, 4, 0.45], ["#e2b673", 900, 3, 0.5], ["#4b2a55", 90, 5, 0.5], ["#fff3dc", 700, 1.2, 0.7]]),
    []
  );

  // Domed, lumpy top that overhangs and tucks back under into the liner.
  const dome = useMemo(() => {
    const g = new THREE.SphereGeometry(1, lite ? 28 : 64, lite ? 18 : 40);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const k = 1 + fbm(x * 2.2, y * 2.2, z * 2.2) * 0.11 + fbm(x * 6 + 2, y * 6, z * 6) * 0.035;
      x *= k; y *= k; z *= k;
      if (y >= 0) y *= 0.74;
      else {
        const tuck = 1 - Math.min(1, -y) * 0.42;
        x *= tuck; z *= tuck; y *= 0.42;
      }
      p.setXYZ(i, x, y, z);
    }
    g.computeVertexNormals();
    return g;
  }, [lite]);

  // Fluted paper liner: a lathe whose every other meridian is pushed out.
  const liner = useMemo(() => {
    const pleats = lite ? 20 : 30;
    const g = new THREE.LatheGeometry([[0, -0.86], [0.52, -0.86], [0.56, -0.82], [0.86, 0.02]].map(([r, y]) => new THREE.Vector2(r, y)), pleats * 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const k = Math.round((Math.atan2(z, x) / (Math.PI * 2)) * pleats * 2);
      const depth = 0.02 + ((y + 0.86) / 0.88) * 0.05;
      const f = 1 + (Math.abs(k) % 2 ? depth : -depth);
      p.setXYZ(i, x * f, y, z * f);
    }
    g.computeVertexNormals();
    return g;
  }, [lite]);

  const berries = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const a = rnd(i + 3) * Math.PI * 2;
        const e = 0.25 + rnd(i + 11) * 0.95;
        const r = 0.97;
        return { p: [Math.sin(e) * Math.cos(a) * r, Math.cos(e) * 0.74 * r - 0.02, Math.sin(e) * Math.sin(a) * r] as [number, number, number], s: 0.085 + rnd(i + 23) * 0.04 };
      }),
    []
  );
  const sugar = useMemo(
    () =>
      Array.from({ length: lite ? 12 : 34 }, (_, i) => {
        const a = rnd(i + 70) * Math.PI * 2;
        const e = rnd(i + 80) * 0.9;
        return { p: [Math.sin(e) * Math.cos(a) * 1.0, Math.cos(e) * 0.76, Math.sin(e) * Math.sin(a) * 1.0] as [number, number, number], s: 0.04 + rnd(i + 90) * 0.05, r: rnd(i + 95) * 6 };
      }),
    [lite]
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const m = motion.current;
    if (!ref.current) return;
    ref.current.rotation.y = -0.2 + Math.sin(t * 0.36) * 0.45 + m.px * 0.5;
    ref.current.rotation.x = 0.3 + Math.sin(t * 0.5) * 0.08 - m.py * 0.2;
    ref.current.rotation.z = 0.04 - m.scroll * 0.5;
  });

  const muffin = (key: number, pos: [number, number, number], scale: number, turn: number) => (
    <group key={key} position={pos} scale={scale} rotation={[0, turn, 0]}>
      <mesh geometry={liner}>
        <meshStandardMaterial color="#6b4326" roughness={0.95} side={THREE.DoubleSide} bumpMap={ribs} bumpScale={0.8} />
      </mesh>
      <mesh geometry={dome} position={[0, 0.02, 0]} scale={0.96}>
        <meshPhysicalMaterial map={topMap} bumpMap={bump} bumpScale={2.4} roughness={0.86} sheen={1} sheenColor="#ffc98a" sheenRoughness={0.55} />
      </mesh>
      <group position={[0, 0.02, 0]} scale={0.96}>
        {berries.map((b, i) => (
          <group key={i} position={b.p}>
            <mesh scale={b.s * 1.5}>
              <sphereGeometry args={[1, 10, 8]} />
              <meshStandardMaterial color="#3a2148" roughness={0.9} transparent opacity={0.55} />
            </mesh>
            <mesh scale={b.s} position={[b.p[0] * 0.05, 0.03, b.p[2] * 0.05]}>
              <sphereGeometry args={[1, lite ? 10 : 18, lite ? 8 : 14]} />
              <meshPhysicalMaterial color="#1d1b3a" roughness={0.38} clearcoat={0.5} clearcoatRoughness={0.35} sheen={0.6} sheenColor="#7c86c9" />
            </mesh>
          </group>
        ))}
        {sugar.map((c, i) => (
          <mesh key={i} geometry={crumb} position={c.p} rotation={[c.r, c.r * 2, c.r]} scale={c.s}>
            <meshPhysicalMaterial map={topMap} bumpMap={bump} bumpScale={1.5} roughness={0.9} color="#ffe9c4" />
          </mesh>
        ))}
      </group>
    </group>
  );

  return (
    <group ref={ref} position={[0, 0.25, 0]}>
      {muffin(0, [0.1, -0.1, 0.55], 0.82, 0.4)}
      {muffin(1, [-0.85, 0.12, -0.5], 0.68, 2.1)}
      {muffin(2, [0.95, 0.2, -0.6], 0.64, 4.0)}
    </group>
  );
}

/* ---------- Coffee beans drifting through the band ---------- */

function beanGeometry(seg: number) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7));
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    let y = p.getY(i) * 0.5;
    const z = p.getZ(i) * 0.68;
    if (y > 0) y -= 0.22 * Math.exp(-((z / 0.15) ** 2)) * (1 - Math.abs(x) ** 3);
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

// fx, fy are fractions of the visible width / height; z is depth; last is size.
const BEANS_WIDE: [number, number, number, number][] = [
  [-0.46, 0.3, -1, 0.2], [-0.2, 0.36, -2.5, 0.17], [-0.24, -0.34, 0.4, 0.16], [-0.47, -0.3, -1.6, 0.22],
  [-0.3, 0.02, -3, 0.15], [0.22, 0.33, -1.8, 0.18], [0.46, 0.34, -0.6, 0.21], [0.47, -0.12, -2.4, 0.17],
  [0.25, -0.36, 0.3, 0.17], [0.4, -0.38, -1.2, 0.2], [0.06, 0.42, -3.2, 0.14], [-0.08, -0.43, -2.8, 0.14],
];
const BEANS_STRIP: [number, number, number, number][] = [
  [-0.46, 0.3, -1, 0.26], [0.0, 0.3, -1.5, 0.24], [0.02, -0.28, 0, 0.22], [0.46, 0.28, -1, 0.24], [-0.44, -0.34, -0.5, 0.2],
];

function Beans({ motion, mode }: { motion: MotionRef; mode: Mode }) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const geo = useMemo(() => beanGeometry(mode === "wide" ? 28 : 14), [mode]);
  const bump = useMemo(() => crumbBump("bean"), []);
  const list = mode === "wide" ? BEANS_WIDE : BEANS_STRIP;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const m = motion.current;
    group.current?.children.forEach((b, i) => {
      const [fx, fy, z] = list[i];
      const depth = 1 + (1 - z) * 0.12;
      b.position.set(
        fx * viewport.width * depth + m.px * 0.12 * (z + 4) * 0.3,
        fy * viewport.height * depth + Math.sin(t * 0.5 + i * 1.7) * 0.12 + m.scroll * (1.2 + (z + 3.2) * 0.5),
        z
      );
      b.rotation.set(t * (0.18 + (i % 4) * 0.05) + i, t * (0.14 + (i % 3) * 0.06) + i * 2, i);
    });
  });

  return (
    <group ref={group}>
      {list.map((b, i) => (
        <mesh key={i} geometry={geo} scale={b[3]}>
          <meshPhysicalMaterial color="#3d2011" roughness={0.5} clearcoat={0.55} clearcoatRoughness={0.35} bumpMap={bump} bumpScale={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** A soft contact shadow pooled under an object (a blurred blob; no extra render pass). */
function Shadow({ y, width }: { y: number; width: number }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, "rgba(8,4,2,0.85)");
    grad.addColorStop(0.5, "rgba(8,4,2,0.35)");
    grad.addColorStop(1, "rgba(8,4,2,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[width, width * 0.8, 1]} renderOrder={-1}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/** Scales its children in or out as the shop changes; the outgoing set leaves first. */
function Swap({ show, children }: { show: boolean; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const v = useRef(show ? 1 : 0);
  useFrame((_, dt) => {
    v.current = THREE.MathUtils.damp(v.current, show ? 1 : 0, show ? 3.2 : 9, dt);
    if (!g.current) return;
    const k = show ? Math.max(0, (v.current - 0.12) / 0.88) : v.current;
    g.current.visible = k > 0.01;
    g.current.scale.setScalar(Math.max(0.001, k));
    g.current.rotation.y = (1 - k) * (show ? -1.6 : 1.6);
  });
  return <group ref={g}>{children}</group>;
}

/* ---------- Layout: the two objects flank the centred logo ---------- */

function Stage({ motion, mode, shop }: { motion: MotionRef; mode: Mode; shop: Shop }) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const wide = mode === "wide";
  const s = wide ? clamp(viewport.width / 8.4, 0.6, 1.1) : 1.22;
  const x = wide ? viewport.width * 0.355 : Math.min(viewport.width * 0.27, 2.5);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const m = motion.current;
    // No intro move: the page opens on a still of this exact first frame, so the
    // live scene must start from the same pose for the swap to be invisible.
    const e = 1;
    if (left.current) {
      left.current.position.set(-x + m.px * 0.1, (wide ? -0.15 : -0.45) * s + Math.sin(t * 0.8) * 0.09 + m.scroll * 1.4 - (1 - e) * 0.6, 0);
      left.current.scale.setScalar(s * (0.85 + 0.15 * e));
    }
    if (right.current) {
      right.current.position.set(x + m.px * 0.16, (wide ? 0.05 : 0) + Math.sin(t * 0.7 + 2) * 0.11 + m.scroll * 2.4 + (1 - e) * 0.6, 0);
      right.current.scale.setScalar(s * (wide ? 1.12 : 1.05) * (0.85 + 0.15 * e));
    }
  });

  const elkton = shop === "elkton";
  return (
    <>
      <Studio res={wide ? 256 : 128} />
      <group ref={left}>
        <Shadow y={-1.75} width={3.2} />
        <Swap show={!elkton}>
          <group rotation={[0.1, 0, -0.08]} scale={1.08}>
            <DrinkCup kind="iced" liquid="#7b4a2b" flavors={["#d48a26"]} shots={0} size={1} lite={!wide} settled />
          </group>
        </Swap>
        <Swap show={elkton}>
          <Cup motion={motion} lite={!wide} />
        </Swap>
      </group>
      <group ref={right}>
        <Shadow y={-1.6} width={4} />
        <Swap show={!elkton}>
          <group scale={0.8}>
            <Muffins motion={motion} lite={!wide} />
          </group>
        </Swap>
        <Swap show={elkton}>
          <group scale={0.9}>
            <CrumbCake motion={motion} lite={!wide} />
          </group>
        </Swap>
      </group>
      <Beans motion={motion} mode={mode} />
      {wide && <Filmic />}
    </>
  );
}

/** Reports once the first live frame has been drawn, so the still can be removed in the same instant. */
function FirstFrame({ onDrawn }: { onDrawn: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    requestAnimationFrame(onDrawn);
  });
  return null;
}

/** Set by the still-capture script (scripts/capture-hero-stills.mjs): draw frame one and hold it. */
const freezeForCapture = () => typeof window !== "undefined" && (window as Window & { __HERO_FREEZE__?: boolean }).__HERO_FREEZE__ === true;

export default function HeroScene({ motion, mode, shop, onReady: onLive }: { motion: MotionRef; mode: Mode; shop: Shop; onReady?: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(true);
  const [ready, setReady] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onDrawn = useCallback(() => { setDrawn(true); onLive?.(); }, [onLive]);
  const freeze = freezeForCapture();

  // Render only while the hero is on screen and the tab is visible.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let seen = true;
    const sync = () => setLive(seen && !document.hidden);
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }, { rootMargin: "80px" });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, []);

  return (
    <div
      ref={wrap}
      className="hero-canvas absolute inset-0"
      style={{ opacity: drawn ? 1 : 0 }}
    >
      <Canvas
        frameloop={!ready ? "never" : freeze ? "demand" : live ? "always" : "never"}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8], fov: 35, near: 0.1, far: 40 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ pointerEvents: "none" }}
      >
        <Stage motion={motion} mode={mode} shop={shop} />
        <Warmup onReady={onReady} />
        {ready && <FirstFrame onDrawn={onDrawn} />}
      </Canvas>
    </div>
  );
}
