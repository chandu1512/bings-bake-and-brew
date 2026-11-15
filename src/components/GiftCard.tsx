"use client";

import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/**
 * A drawn gift card that tilts toward the pointer, with a glare that follows.
 * On touch screens it sways slowly on its own. It is an illustration: the
 * real cards are sold and delivered by Toast.
 */
export default function GiftCard({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 140, damping: 16, mass: 0.6 };
  const rotY = useSpring(useTransform(px, [-0.5, 0.5], [-16, 16]), spring);
  const rotX = useSpring(useTransform(py, [-0.5, 0.5], [12, -12]), spring);
  const glareX = useSpring(useTransform(px, [-0.5, 0.5], ["-45%", "25%"]), spring);
  const glareY = useSpring(useTransform(py, [-0.5, 0.5], ["-55%", "15%"]), spring);

  const move = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const leave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className={`[perspective:1100px] ${className}`}
      role="img"
      aria-label="A red Bing's Bake & Brew gift card"
    >
      <div className={reduce ? "" : "[transform-style:preserve-3d] [@media(hover:none)]:animate-[sway_7s_ease-in-out_infinite_alternate]"}>
        <motion.div
          style={reduce ? undefined : { rotateX: rotX, rotateY: rotY }}
          className="relative aspect-[1.586] w-full overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#d93445_0%,#bf1e2e_42%,#8f1220_100%)] p-[7%] text-white [container-type:inline-size] shadow-[0_50px_70px_-36px_rgba(143,18,32,0.8),0_18px_30px_-18px_rgba(29,20,17,0.6),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_0_0_1px_rgba(255,255,255,0.14)] [transform-style:preserve-3d]"
        >
          {/* pinstripes, like a bakery box */}
          <div className="absolute inset-0 opacity-[0.13] [background:repeating-linear-gradient(90deg,#fff_0_2px,transparent_2px_18px)]" />
          {/* glare */}
          <motion.div
            style={reduce ? undefined : { x: glareX, y: glareY }}
            className="pointer-events-none absolute -inset-1/2 bg-[radial-gradient(closest-side,rgba(255,255,255,0.34),rgba(255,255,255,0.06)_50%,transparent_72%)]"
          />
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent" />
          <p aria-hidden className="tnum absolute -bottom-[14%] -right-[3%] font-display text-[46cqw] leading-none text-black/[0.09]">
            1871
          </p>

          <div className="relative flex h-full flex-col justify-between ">
            <div className="flex items-start justify-between">
              <p className="font-display text-[clamp(1.5rem,5.4cqw,2.6rem)] leading-[0.95]">
                Bing&rsquo;s
                <br />
                Bake &amp; Brew
              </p>
              <span className="rounded-full bg-butter px-3 py-1 text-[0.78rem] font-bold text-espresso">Gift card</span>
            </div>
            <div className="flex items-end justify-between gap-3 whitespace-nowrap text-[clamp(0.68rem,2.7cqw,0.9rem)] font-semibold text-white/85">
              <span>Coffee and the bakery case</span>
              <span className="tnum">Bing&rsquo;s Bakery, est. 1871</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
