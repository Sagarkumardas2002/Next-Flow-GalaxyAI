// import { currentUser } from "@clerk/nextjs/server";
// import { redirect } from "next/navigation";
// import Link from "next/link";

// export default async function Home() {
//   const user = await currentUser();

//   // ✅ AUTO REDIRECT if already logged in
//   if (user) {
//     redirect("/dashboard");
//   }

//   return (
//     <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 px-4">
//       <div className="absolute w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-20 top-10 left-10"></div>
//       <div className="absolute w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-20 bottom-10 right-10"></div>

//       <div className="relative z-10 text-center max-w-xl">
//         <h1 className="text-4xl sm:text-5xl font-bold text-white">
//           Build Smarter with <span className="text-blue-400">Next.js</span>
//         </h1>

//         <p className="text-gray-300 mt-4">A simple, fast and modern starter</p>

//         <div className="mt-8">
//           <Link
//             href="/sign-in"
//             className="px-6 py-3 bg-blue-600 rounded-xl text-white"
//           >
//             Get Started →
//           </Link>
//         </div>
//       </div>
//     </main>
//   );
// }

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlowNode {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub: string;
  color: string;
  icon: string;
  progress: number;
}

interface FlowEdge {
  from: number;
  to: number;
  port: string;
  t: number;
}

interface Point {
  x: number;
  y: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBezierPoint(
  x1: number,
  y1: number,
  cx1: number,
  cy1: number,
  cx2: number,
  cy2: number,
  x2: number,
  y2: number,
  t: number,
): Point {
  const mt = 1 - t;
  return {
    x:
      mt * mt * mt * x1 +
      3 * mt * mt * t * cx1 +
      3 * mt * t * t * cx2 +
      t * t * t * x2,
    y:
      mt * mt * mt * y1 +
      3 * mt * mt * t * cy1 +
      3 * mt * t * t * cy2 +
      t * t * t * y2,
  };
}

function getPort(n: FlowNode, side: string): Point {
  if (side === "right") return { x: n.x + n.w, y: n.y + n.h / 2 };
  if (side === "left") return { x: n.x, y: n.y + n.h / 2 };
  if (side === "bottom") return { x: n.x + n.w / 2, y: n.y + n.h };
  return { x: n.x + n.w / 2, y: n.y };
}

function animCount(id: string, target: number, suffix = "") {
  const el = document.getElementById(id);
  if (!el) return;
  let cur = 0;
  const step = target / 60;
  const iv = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = Math.round(cur) + suffix;
    if (cur >= target) clearInterval(iv);
  }, 24);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const flowRef = useRef<HTMLCanvasElement>(null);
  const bgRafRef = useRef<number>(0);
  const flowRafRef = useRef<number>(0);

  // ── Background particle network ──────────────────────────────────────────
  useEffect(() => {
    const canvas = bgRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.body.scrollHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight * 3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(59,110,245,.4)";
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(59,110,245,${(1 - d / 120) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      bgRafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(bgRafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── Flow canvas ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = flowRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const nodes: FlowNode[] = [
      {
        id: 0,
        x: 60,
        y: 80,
        w: 130,
        h: 52,
        label: "Prompt Input",
        sub: "text/query",
        color: "#3b6ef5",
        icon: "⌨️",
        progress: 1,
      },
      {
        id: 1,
        x: 240,
        y: 40,
        w: 130,
        h: 52,
        label: "LLM Node",
        sub: "Gemini Pro",
        color: "#7c3aed",
        icon: "🧠",
        progress: 0.9,
      },
      {
        id: 2,
        x: 240,
        y: 130,
        w: 130,
        h: 52,
        label: "Image Node",
        sub: "Vision API",
        color: "#ec4899",
        icon: "🖼️",
        progress: 0.6,
      },
      {
        id: 3,
        x: 430,
        y: 70,
        w: 130,
        h: 52,
        label: "Crop Node",
        sub: "Transloadit",
        color: "#f59e0b",
        icon: "✂️",
        progress: 0.3,
      },
      {
        id: 4,
        x: 430,
        y: 180,
        w: 130,
        h: 52,
        label: "Extract",
        sub: "Structured",
        color: "#10b981",
        icon: "📤",
        progress: 0,
      },
      {
        id: 5,
        x: 610,
        y: 120,
        w: 130,
        h: 52,
        label: "Output",
        sub: "PostgreSQL",
        color: "#6366f1",
        icon: "💾",
        progress: 0,
      },
    ];

    const edges: FlowEdge[] = [
      { from: 0, to: 1, port: "right-left", t: 0 },
      { from: 0, to: 2, port: "bottom-left", t: 0 },
      { from: 1, to: 3, port: "right-left", t: 0 },
      { from: 2, to: 3, port: "right-left", t: 0 },
      { from: 3, to: 5, port: "right-left", t: 0 },
      { from: 2, to: 4, port: "right-left", t: 0 },
      { from: 4, to: 5, port: "right-left", t: 0 },
    ];

    let tick = 0;

    const drawFlow = () => {
      ctx.clearRect(0, 0, W, H);
      tick++;

      edges.forEach((e) => {
        e.t = Math.min(e.t + 0.004, 1);
        const fn = nodes[e.from];
        const tn = nodes[e.to];
        const [fs, ts] = e.port.split("-");
        const p1 = getPort(fn, fs);
        const p2 = getPort(tn, ts);
        const cx1 = p1.x + (p2.x - p1.x) * 0.45;
        const cx2 = p2.x - (p2.x - p1.x) * 0.45;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.bezierCurveTo(cx1, p1.y, cx2, p2.y, p2.x, p2.y);
        ctx.strokeStyle = "rgba(255,255,255,.08)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (e.t > 0) {
          const prog = (tick * 0.012 + e.from * 0.3) % 1;
          const pt = getBezierPoint(
            p1.x,
            p1.y,
            cx1,
            p1.y,
            cx2,
            p2.y,
            p2.x,
            p2.y,
            prog,
          );
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(59,110,245,.9)";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(59,110,245,.2)";
          ctx.fill();
        }
      });

      nodes.forEach((n) => {
        const rx = 8;
        ctx.beginPath();
        ctx.roundRect(n.x, n.y, n.w, n.h, rx);
        ctx.fillStyle = "rgba(11,15,26,.92)";
        ctx.fill();
        ctx.strokeStyle = n.color + "55";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Progress bar
        ctx.beginPath();
        ctx.roundRect(n.x, n.y + n.h - 4, n.w * n.progress, 4, [0, 0, rx, rx]);
        ctx.fillStyle = n.color + "99";
        ctx.fill();

        if (n.progress < 1) n.progress = Math.min(n.progress + 0.003, 1);

        ctx.font = "11px sans-serif";
        ctx.fillStyle = n.color;
        ctx.fillText(n.icon + " " + n.label, n.x + 10, n.y + 20);
        ctx.font = "9px monospace";
        ctx.fillStyle = "rgba(255,255,255,.35)";
        ctx.fillText(n.sub, n.x + 10, n.y + 36);
      });

      flowRafRef.current = requestAnimationFrame(drawFlow);
    };

    drawFlow();
    return () => cancelAnimationFrame(flowRafRef.current);
  }, []);

  // ── Counter animations ───────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      animCount("s1", 6, "+");
      animCount("s2", 10, "+");
      animCount("s3", 5, "");
      animCount("s4", 230, "");
    }, 400);
    return () => clearTimeout(t);
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --bg: #03050a;
          --surface: #0b0f1a;
          --border: #1a2236;
          --accent: #3b6ef5;
          --accent2: #7c3aed;
          --text: #e8eaf0;
          --muted: #6b7a99;
          --node-bg: #0f1729;
          --success: #10b981;
          --warn: #f59e0b;
          --pink: #ec4899;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Syne', sans-serif;
          overflow-x: hidden;
          min-height: 100vh;
        }

        /* ── Particle canvas ── */
        .nf-bg-canvas {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: .6;
        }

        /* ── Wrapper ── */
        .nf-wrap { position: relative; z-index: 1; }

        /* ── Navbar ── */
        .nf-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 2.5rem;
          border-bottom: 1px solid var(--border);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(3,5,10,.7);
        }
        .nf-logo { font-size: 1.1rem; font-weight: 800; letter-spacing: .08em; color: var(--text); }
        .nf-logo span { color: var(--accent); }
        .nf-nav-links { display: flex; gap: 2rem; align-items: center; }
        .nf-nav-links a { color: var(--muted); font-size: .85rem; text-decoration: none; letter-spacing: .05em; transition: color .2s; }
        .nf-nav-links a:hover { color: var(--text); }
        .nf-nav-cta {
          background: var(--accent);
          color: #fff;
          padding: .5rem 1.25rem;
          border-radius: 6px;
          font-size: .85rem;
          font-weight: 700;
          text-decoration: none;
          letter-spacing: .04em;
          transition: opacity .2s;
        }
        .nf-nav-cta:hover { opacity: .85; }

        /* ── Hero ── */
        .nf-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
          padding: 5rem 2.5rem 3rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .nf-hero-left { display: flex; flex-direction: column; gap: 1.5rem; }

        .nf-badge {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          background: rgba(59,110,245,.12);
          border: 1px solid rgba(59,110,245,.3);
          border-radius: 100px;
          padding: .3rem .9rem;
          font-size: .75rem;
          font-weight: 700;
          color: var(--accent);
          letter-spacing: .08em;
          width: fit-content;
        }
        .nf-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--accent);
          animation: nfPulse 2s infinite;
        }
        @keyframes nfPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:.5; transform:scale(.8); }
        }

        .nf-h1 { font-size: 3.6rem; font-weight: 800; line-height: 1.05; letter-spacing: -.02em; }
        .nf-h1-line1 { color: var(--text); }
        .nf-h1-line2 {
          background: linear-gradient(135deg, var(--accent), var(--accent2), var(--pink));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nf-desc {
          color: var(--muted);
          line-height: 1.7;
          font-family: 'Space Mono', monospace;
          font-size: .85rem;
        }

        .nf-actions { display: flex; gap: 1rem; align-items: center; margin-top: .5rem; }

        .nf-btn-primary {
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          color: #fff;
          padding: .75rem 1.75rem;
          border-radius: 8px;
          font-size: .9rem;
          font-weight: 700;
          text-decoration: none;
          letter-spacing: .04em;
          transition: opacity .2s, transform .15s;
          border: none;
          cursor: pointer;
          font-family: 'Syne', sans-serif;
        }
        .nf-btn-primary:hover { opacity: .9; transform: translateY(-1px); }

        .nf-btn-ghost {
          color: var(--muted);
          padding: .75rem 1.5rem;
          border-radius: 8px;
          font-size: .9rem;
          font-weight: 700;
          text-decoration: none;
          letter-spacing: .04em;
          border: 1px solid var(--border);
          transition: all .2s;
          background: transparent;
          cursor: pointer;
          font-family: 'Syne', sans-serif;
        }
        .nf-btn-ghost:hover { color: var(--text); border-color: rgba(255,255,255,.2); }

        .nf-stack { display: flex; align-items: center; gap: .5rem; font-size: .75rem; color: var(--muted); font-family: 'Space Mono', monospace; }
        .nf-tag { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: .2rem .5rem; font-size: .7rem; color: var(--muted); }

        /* ── Flow canvas panel ── */
        .nf-canvas-panel {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          height: 420px;
        }
        .nf-canvas-panel canvas { width: 100%; height: 100%; }
        .nf-panel-header {
          position: absolute;
          top: 12px;
          left: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 10;
        }
        .nf-dot { width: 10px; height: 10px; border-radius: 50%; }
        .nf-dot.r { background: #ff5f57; }
        .nf-dot.y { background: #febc2e; }
        .nf-dot.g { background: #28c840; }
        .nf-panel-label { font-size: .7rem; color: var(--muted); font-family: 'Space Mono', monospace; letter-spacing: .05em; margin-left: 4px; }
        .nf-exec-badge {
          position: absolute;
          top: 12px;
          right: 16px;
          background: rgba(16,185,129,.12);
          border: 1px solid rgba(16,185,129,.3);
          color: #10b981;
          font-size: .68rem;
          font-family: 'Space Mono', monospace;
          padding: .25rem .6rem;
          border-radius: 100px;
          display: flex;
          align-items: center;
          gap: .35rem;
          z-index: 10;
        }
        .nf-exec-dot { width: 5px; height: 5px; border-radius: 50%; background: #10b981; animation: nfPulse 1.5s infinite; }

        /* ── Stats row ── */
        .nf-stats-row {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          max-width: 1200px;
          margin: 0 auto 4rem;
        }
        .nf-stat { background: var(--surface); padding: 1.5rem 2rem; text-align: center; }
        .nf-stat-num {
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .nf-stat-label { font-size: .75rem; color: var(--muted); font-family: 'Space Mono', monospace; letter-spacing: .06em; margin-top: .25rem; }

        /* ── Nodes section ── */
        .nf-nodes-section { padding: 0 2.5rem 4rem; max-width: 1200px; margin: 0 auto; }
        .nf-section-label { font-size: .7rem; font-family: 'Space Mono', monospace; letter-spacing: .12em; color: var(--accent); margin-bottom: 1rem; }
        .nf-section-title { font-size: 1.8rem; font-weight: 800; margin-bottom: 2rem; line-height: 1.2; }
        .nf-nodes-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }

        .nf-node-card {
          background: var(--node-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          transition: border-color .2s, transform .15s;
          cursor: default;
        }
        .nf-node-card:hover { border-color: rgba(59,110,245,.4); transform: translateY(-2px); }
        .nf-node-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; font-size: 1rem; }
        .nf-node-name { font-size: .85rem; font-weight: 700; margin-bottom: .4rem; letter-spacing: .03em; }
        .nf-node-desc { font-size: .75rem; color: var(--muted); line-height: 1.6; font-family: 'Space Mono', monospace; }
        .nf-node-badge { display: inline-block; margin-top: .6rem; font-size: .65rem; font-family: 'Space Mono', monospace; padding: .15rem .5rem; border-radius: 4px; font-weight: 700; }

        /* ── Tech strip ── */
        .nf-tech-strip {
          background: var(--surface);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 1rem 0;
          overflow: hidden;
        }
        .nf-tech-track { display: flex; gap: 2.5rem; animation: nfScroll 20s linear infinite; width: max-content; align-items: center; }
        @keyframes nfScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .nf-tech-item { display: flex; align-items: center; gap: .5rem; font-size: .75rem; font-family: 'Space Mono', monospace; color: var(--muted); white-space: nowrap; }
        .nf-tech-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); }

        /* ── CTA section ── */
        .nf-cta-section { padding: 4rem 2.5rem; text-align: center; max-width: 700px; margin: 0 auto; }
        .nf-cta-section h2 { font-size: 2.5rem; font-weight: 800; line-height: 1.1; margin-bottom: 1rem; }
        .nf-cta-section p { color: var(--muted); font-size: .9rem; font-family: 'Space Mono', monospace; line-height: 1.7; margin-bottom: 2rem; }
        .nf-cta-gradient {
          background: linear-gradient(135deg, #3b6ef5, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Footer ── */
        .nf-footer {
          border-top: 1px solid var(--border);
          padding: 1.5rem 2.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .nf-footer-text { font-size: .75rem; color: var(--muted); font-family: 'Space Mono', monospace; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .nf-hero { grid-template-columns: 1fr; padding: 3rem 1.25rem 2rem; }
          .nf-canvas-panel { height: 300px; }
          .nf-h1 { font-size: 2.4rem; }
          .nf-stats-row { grid-template-columns: repeat(2,1fr); }
          .nf-nodes-grid { grid-template-columns: 1fr; }
          .nf-nodes-section { padding: 0 1.25rem 3rem; }
          .nf-nav { padding: 1rem 1.25rem; }
          .nf-nav-links a:not(.nf-nav-cta) { display: none; }
        }
      `}</style>

      {/* Background particle canvas */}
      <canvas ref={bgRef} className="nf-bg-canvas" />

      <div className="nf-wrap">
        {/* ── Navbar ── */}
        <nav className="nf-nav">
          <div className="nf-logo">
            Next<span>Flow</span>
          </div>
          <div className="nf-nav-links">
            <a href="#">Nodes</a>
            <a href="#">Workflows</a>
            <a href="#">Docs</a>
            <Link
              href="/sign-in"
              className="nf-nav-cta"
              style={{ color: "white" }}
            >
              Sign In →
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="nf-hero">
          <div className="nf-hero-left">
            <div className="nf-badge">
              <span className="nf-badge-dot" />
              Now with Gemini API
            </div>

            <h1 className="nf-h1">
              <span className="nf-h1-line1">
                Visual AI
                <br />
                Workflows.
              </span>
              <br />
              <span className="nf-h1-line2">Node by Node.</span>
            </h1>

            <p className="nf-desc">
              Design and execute multi-step AI pipelines on a drag-and-drop
              canvas. Connect LLM, image, and video nodes to build intelligent
              automations — powered by Google Gemini.
            </p>

            <div className="nf-actions">
              <Link href="/sign-in" className="nf-btn-primary">
                Get Started →
              </Link>
              <Link href="/dashboard" className="nf-btn-ghost">
                See Demo ↗
              </Link>
            </div>

            <div className="nf-stack">
              <span style={{ fontSize: ".7rem" }}>Built with</span>
              {["Next.js 15", "React Flow", "Gemini", "Trigger.dev"].map(
                (t) => (
                  <span key={t} className="nf-tag">
                    {t}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Flow canvas */}
          <div className="nf-canvas-panel">
            <div className="nf-panel-header">
              <div className="nf-dot r" />
              <div className="nf-dot y" />
              <div className="nf-dot g" />
              <span className="nf-panel-label">workflow-canvas.tsx</span>
            </div>
            <div className="nf-exec-badge">
              <span className="nf-exec-dot" />
              executing
            </div>
            <canvas ref={flowRef} />
          </div>
        </section>

        {/* ── Stats ── */}
        <div className="nf-stats-row">
          {[
            { id: "s1", label: "Custom Nodes" },
            { id: "s2", label: "REST APIs" },
            { id: "s3", label: "Async Jobs" },
            { id: "s4", label: "Pipelines Run" },
          ].map((s) => (
            <div key={s.id} className="nf-stat">
              <div id={s.id} className="nf-stat-num">
                0
              </div>
              <div className="nf-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Nodes grid ── */}
        <section className="nf-nodes-section">
          <div className="nf-section-label">NODE LIBRARY</div>
          <div className="nf-section-title">
            Six powerful nodes.
            <br />
            Infinite possibilities.
          </div>
          <div className="nf-nodes-grid">
            {[
              {
                icon: "🧠",
                name: "LLM Node",
                desc: "Process text prompts through Gemini API with configurable temperature, tokens, and system context.",
                badge: "Gemini Pro",
                bc: "rgba(59,110,245,.15)",
                tc: "#3b6ef5",
                ic: "rgba(59,110,245,.15)",
              },
              {
                icon: "🖼️",
                name: "Image Node",
                desc: "Upload, analyze, and transform images using Gemini Vision. Describe, classify, or extract data from visual content.",
                badge: "Vision API",
                bc: "rgba(124,58,237,.15)",
                tc: "#7c3aed",
                ic: "rgba(124,58,237,.15)",
              },
              {
                icon: "🎬",
                name: "Video Node",
                desc: "Process video files asynchronously via Trigger.dev. Extract frames, analyze scenes, and generate insights.",
                badge: "Trigger.dev",
                bc: "rgba(236,72,153,.15)",
                tc: "#ec4899",
                ic: "rgba(236,72,153,.15)",
              },
              {
                icon: "✂️",
                name: "Crop Node",
                desc: "Precisely crop and transform images in the pipeline. Define regions, aspect ratios, and smart crop targets.",
                badge: "Transloadit",
                bc: "rgba(245,158,11,.15)",
                tc: "#f59e0b",
                ic: "rgba(245,158,11,.15)",
              },
              {
                icon: "📤",
                name: "Extract Node",
                desc: "Extract structured data, entities, or specific fields from any content type using AI-powered parsing.",
                badge: "Structured",
                bc: "rgba(16,185,129,.15)",
                tc: "#10b981",
                ic: "rgba(16,185,129,.15)",
              },
              {
                icon: "💾",
                name: "Output Node",
                desc: "Capture, format, and persist results from any pipeline. Stream to dashboard, save to PostgreSQL, or export.",
                badge: "Prisma + PG",
                bc: "rgba(99,102,241,.15)",
                tc: "#6366f1",
                ic: "rgba(99,102,241,.15)",
              },
            ].map((n) => (
              <div key={n.name} className="nf-node-card">
                <div className="nf-node-icon" style={{ background: n.ic }}>
                  {n.icon}
                </div>
                <div className="nf-node-name">{n.name}</div>
                <div className="nf-node-desc">{n.desc}</div>
                <span
                  className="nf-node-badge"
                  style={{ background: n.bc, color: n.tc }}
                >
                  {n.badge}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Scrolling tech strip ── */}
        <div className="nf-tech-strip">
          <div className="nf-tech-track">
            {[
              "Next.js 15",
              "React Flow",
              "TypeScript",
              "Google Gemini",
              "Trigger.dev",
              "Prisma",
              "PostgreSQL",
              "Clerk Auth",
              "Transloadit",
              "Zustand",
              "Tailwind CSS",
              "Claude AI",
              "Next.js 15",
              "React Flow",
              "TypeScript",
              "Google Gemini",
              "Trigger.dev",
              "Prisma",
              "PostgreSQL",
              "Clerk Auth",
              "Transloadit",
              "Zustand",
              "Tailwind CSS",
              "Claude AI",
            ].map((t, i) => (
              <span key={i} className="nf-tech-item">
                <span className="nf-tech-dot" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <section className="nf-cta-section">
          <div className="nf-section-label"> GET STARTED</div>
          <h2>
            Build your first
            <br />
            <span className="nf-cta-gradient">AI pipeline</span> today.
          </h2>
          <p>
            Drop nodes. Draw connections. Execute workflows. From text
            generation to video processing — all in one visual canvas.
          </p>
          <Link
            href="/sign-in"
            className="nf-btn-primary"
            style={{
              display: "inline-block",
              fontSize: "1rem",
              padding: ".9rem 2.5rem",
            }}
          >
            Start Building →
          </Link>
        </section>

        {/* ── Footer ── */}
        <footer className="nf-footer">
          <div className="nf-footer-text">
            © 2025 NextFlow — Visual AI Workflow Builder
          </div>
          <div className="nf-footer-text" style={{ color: "#3b6ef5" }}>
            Built with Claude AI
          </div>
        </footer>
      </div>
    </>
  );
}
