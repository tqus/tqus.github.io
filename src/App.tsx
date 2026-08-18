import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from 'framer-motion';

/* ═══════════════════════════════════════════════════════
   IMAGES & CONSTANTS
   ═══════════════════════════════════════════════════════ */

const FRONT_IMG = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260808_192942_e1086505-d7da-433b-a59b-8220f4e6c808.png&w=1280&q=85';
const REVEAL_IMG = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260808_151324_bf318a5f-5525-4fc7-aab5-e9a341018828.png&w=1280&q=85';

const TRAIL_MAX = 60, TRAIL_HEAD_R = 140, TRAIL_NOISE = 44, TRAIL_BLOB_PTS = 24, TRAIL_FADE = 0.92, TRAIL_DIST = 8;

const loadingWords = ['Engineer', 'Automate', 'Architect', 'Deploy', 'Create'];
const roles = ['Architect', 'Developer', 'Creator', 'Engineer', 'Designer'];

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

const projects = [
  {
    title: 'e12 Framework', subtitle: 'WebSocket Automation',
    tags: ['WebSockets', 'Node.js', 'Real-time'],
    image: 'https://images.pexels.com/photos/29506610/pexels-photo-29506610.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    href: 'https://e12.lovable.app', year: '2026', num: '01',
    desc: 'High-concurrency WebSocket automation framework serving thousands of connections with zero added latency.',
    color: '#89AACC',
  },
  {
    title: 'UserSniper', subtitle: 'Username Scanner',
    tags: ['AsyncIO', 'Python', 'React'],
    image: 'https://images.pexels.com/photos/9789212/pexels-photo-9789212.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    href: 'https://www.usersniper.com/', year: '2025', num: '02',
    desc: 'AsyncIO-powered username scanner with real-time results across multiple platforms simultaneously.',
    color: '#fd86db',
  },
  {
    title: 'GCP Networks', subtitle: 'Cloud Infrastructure',
    tags: ['Google Cloud', 'Terraform', 'Docker'],
    image: 'https://images.pexels.com/photos/5480781/pexels-photo-5480781.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    year: '2025', num: '03',
    desc: 'API pipeline systems on GCP with auto-scaling, load balancing, and real-time monitoring.',
    color: '#89AACC',
  },
  {
    title: 'Cybersecurity Labs', subtitle: 'Security Research',
    tags: ['Burp Suite', 'OWASP', 'Pen Testing'],
    image: 'https://images.pexels.com/photos/17489157/pexels-photo-17489157.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    year: '2024', num: '04',
    desc: 'Penetration testing and vulnerability assessments across web applications and network infrastructure.',
    color: '#ffc5dc',
  },
];

const skills = [
  { icon: '⚡', label: 'System Architecture', desc: 'Distributed systems & microservices at scale' },
  { icon: '🔌', label: 'Real-time Systems', desc: 'WebSockets, event-driven, pub/sub patterns' },
  { icon: '🛡️', label: 'Cybersecurity', desc: 'Penetration testing & security hardening' },
  { icon: '💻', label: 'Full-Stack Dev', desc: 'React, Node.js, Python, Go & more' },
  { icon: '☁️', label: 'Cloud Infra', desc: 'GCP, AWS, containerization & IaC' },
  { icon: '🤖', label: 'Automation', desc: 'CI/CD pipelines & intelligent systems' },
];

const techStack = [
  'Python', 'TypeScript', 'React', 'Node.js', 'Go', 'Rust',
  'Docker', 'Kubernetes', 'GCP', 'AWS', 'WebSockets', 'Redis',
  'PostgreSQL', 'GraphQL', 'Terraform', 'Burp Suite', 'Linux', 'Nginx',
];

/* ═══════════════════════════════════════════════════════
   MORPH BLOB DRAWING
   ═══════════════════════════════════════════════════════ */
interface TrailPt { x: number; y: number; r: number; alpha: number; seed: number }

function drawBlob(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number, seed: number) {
  if (r < 2) return;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < TRAIL_BLOB_PTS; i++) {
    const a = (i / TRAIL_BLOB_PTS) * Math.PI * 2;
    const n = (Math.sin(a * 3 + t * 1.4 + seed) * 0.45 + Math.sin(a * 5 - t * 0.9 + seed * 2.3) * 0.3 + Math.cos(a * 2 + t * 1.8 + seed * 0.7) * 0.25) * TRAIL_NOISE * (r / TRAIL_HEAD_R);
    pts.push({ x: cx + Math.cos(a) * (r + n), y: cy + Math.sin(a) * (r + n) });
  }
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const c = pts[i], nx = pts[(i + 1) % pts.length];
    const mx = (c.x + nx.x) / 2, my = (c.y + nx.y) / 2;
    if (i === 0) { const pv = pts[pts.length - 1]; ctx.moveTo((pv.x + c.x) / 2, (pv.y + c.y) / 2); }
    ctx.quadraticCurveTo(c.x, c.y, mx, my);
  }
  ctx.closePath(); ctx.fill();
}

/* ═══════════════════════════════════════════════════════
   MORPH TRAIL LAYER
   ═══════════════════════════════════════════════════════ */
function MorphLayer({ src, invert, trail, time, rect, alt }: {
  src: string; invert: boolean; trail: TrailPt[]; time: number; rect: DOMRect | null; alt: string;
}) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const c = cvs.current; if (!c || !rect) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const w = Math.round(rect.width), h = Math.round(rect.height);
    if (c.width !== w) c.width = w; if (c.height !== h) c.height = h;
    ctx.clearRect(0, 0, w, h);
    if (invert) {
      ctx.fillStyle = '#fff';
      for (const p of trail) { ctx.globalAlpha = p.alpha; drawBlob(ctx, p.x, p.y, p.r, time, p.seed); }
    } else {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-out';
      for (const p of trail) { ctx.globalAlpha = p.alpha; drawBlob(ctx, p.x, p.y, p.r, time, p.seed); }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
    const url = c.toDataURL();
    if (img.current) {
      const s = img.current.style as any;
      s.maskImage = `url(${url})`; s.maskSize = '100% 100%'; s.maskRepeat = 'no-repeat';
      s.webkitMaskImage = `url(${url})`; s.webkitMaskSize = '100% 100%'; s.webkitMaskRepeat = 'no-repeat';
    }
  }, [trail, time, rect, invert]);

  const noMask = trail.length === 0;
  return (
    <>
      <canvas ref={cvs} style={{ display: 'none' }} />
      <img ref={img} src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover" draggable={false}
        style={noMask ? (invert ? { maskImage: 'linear-gradient(#0000,#0000)', WebkitMaskImage: 'linear-gradient(#0000,#0000)' } as React.CSSProperties : {}) : {}} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   FLOWER MORPH REVEAL
   ═══════════════════════════════════════════════════════ */
function FlowerReveal() {
  const box = useRef<HTMLDivElement>(null);
  const trail = useRef<TrailPt[]>([]);
  const headR = useRef(0);
  const lastPt = useRef({ x: 0, y: 0 });
  const hovering = useRef(false);
  const tRef = useRef(0);
  const raf = useRef(0);
  const rr = useRef<DOMRect | null>(null);
  const [st, setSt] = useState<TrailPt[]>([]);
  const [tt, setTt] = useState(0);
  const [cr, setCr] = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = box.current; if (!el) return;
    const upd = () => { rr.current = el.getBoundingClientRect(); setCr(rr.current); };
    upd(); window.addEventListener('resize', upd);
    const stage = el.closest('.hero-stage') as HTMLElement; if (!stage) return;

    const onMove = (e: MouseEvent) => {
      if (!rr.current) return;
      const r = rr.current, x = e.clientX - r.left, y = e.clientY - r.top;
      const tgt = hovering.current ? TRAIL_HEAD_R : 0;
      headR.current += (tgt - headR.current) * (hovering.current ? 0.14 : 0.04);
      if (hovering.current && headR.current > 5) {
        const dx = x - lastPt.current.x, dy = y - lastPt.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > TRAIL_DIST) {
          trail.current.push({ x, y, r: headR.current, alpha: 1, seed: Math.random() * 100 });
          if (trail.current.length > TRAIL_MAX) trail.current.shift();
          lastPt.current = { x, y };
        }
      }
    };
    const onIn = () => { hovering.current = true; };
    const onOut = () => { hovering.current = false; };
    stage.addEventListener('mousemove', onMove); stage.addEventListener('mouseenter', onIn); stage.addEventListener('mouseleave', onOut);

    const loop = () => {
      tRef.current += 0.016;
      for (let i = trail.current.length - 1; i >= 0; i--) {
        const p = trail.current[i]; p.alpha *= TRAIL_FADE; p.r *= 0.995;
        if (p.alpha < 0.01) trail.current.splice(i, 1);
      }
      if (!hovering.current) headR.current += (0 - headR.current) * 0.04;
      setSt([...trail.current]); setTt(tRef.current);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('resize', upd); stage.removeEventListener('mousemove', onMove); stage.removeEventListener('mouseenter', onIn); stage.removeEventListener('mouseleave', onOut); };
  }, []);

  return (
    <div ref={box} className="absolute pointer-events-none" style={{ top: '14.75dvh', left: '49.12%', height: 'min(106dvh, 160vw)', transform: 'translateX(-50%)', zIndex: 2, aspectRatio: 'auto' }}>
      <img src={FRONT_IMG} alt="" aria-hidden="true" className="h-full w-auto invisible" draggable={false} />
      <div className="absolute inset-0"><MorphLayer src={FRONT_IMG} invert={false} trail={st} time={tt} rect={cr} alt="Pixel-art pink and violet lily" /></div>
      <div className="absolute inset-0"><MorphLayer src={REVEAL_IMG} invert={true} trail={st} time={tt} rect={cr} alt="" /></div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LOADING SCREEN
   ═══════════════════════════════════════════════════════ */
function Loading({ onDone }: { onDone: () => void }) {
  const [c, setC] = useState(0);
  const [wi, setWi] = useState(0);
  const [exit, setExit] = useState(false);

  useEffect(() => { const t = setInterval(() => setWi(p => (p + 1) % loadingWords.length), 500); return () => clearInterval(t); }, []);

  useEffect(() => {
    const dur = 2000, fps = 60, total = (dur / 1000) * fps;
    let f = 0;
    const t = setInterval(() => {
      f++; const p = Math.min(100, Math.floor((f / total) * 100)); setC(p);
      if (p >= 100) { clearInterval(t); setTimeout(() => { setExit(true); setTimeout(onDone, 850); }, 200); }
    }, 1000 / fps);
    return () => clearInterval(t);
  }, [onDone]);

  return (
    <AnimatePresence>
      {!exit && (
        <motion.div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col justify-between p-6 md:p-10"
          exit={{ y: '-100%' }} transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}>
          <motion.p initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="text-[9px] text-[#878787] uppercase tracking-[0.4em] font-medium">Saad Kashif — Portfolio</motion.p>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.span key={wi} initial={{ opacity: 0, y: 30, filter: 'blur(14px)' }} animate={{ opacity: 0.4, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -30, filter: 'blur(14px)' }} transition={{ duration: 0.3 }}
                className="text-5xl md:text-8xl lg:text-[10rem] font-[Instrument_Serif] italic text-white">{loadingWords[wi]}</motion.span>
            </AnimatePresence>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-end">
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-[8px] text-[#878787] uppercase tracking-[0.2em]">Loading</motion.span>
              <span className="text-6xl md:text-9xl font-[Instrument_Serif] text-white tabular-nums leading-none">{String(c).padStart(3, '0')}</span>
            </div>
            <div className="h-[2px] bg-white/[0.06] w-full rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-none" style={{ width: `${c}%`, background: 'linear-gradient(90deg, #89AACC, #fd86db)', boxShadow: '0 0 24px rgba(137,170,204,0.5)' }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════════════════ */
function Nav({ show }: { show: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('home');
  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 50);
      for (const n of [...navItems].reverse()) { const el = document.getElementById(n.id); if (el && el.getBoundingClientRect().top < innerHeight * 0.45) { setActive(n.id); break; } }
    };
    addEventListener('scroll', fn, { passive: true }); return () => removeEventListener('scroll', fn);
  }, []);

  return (
    <motion.nav initial={{ y: -70, opacity: 0 }} animate={show ? { y: 0, opacity: 1 } : {}}
      transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 md:pt-4 px-3">
      <div className={`inline-flex items-center rounded-full px-1.5 py-1.5 transition-all duration-500 ${scrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/[0.06] shadow-2xl shadow-black/50' : 'bg-[#141414]/40 backdrop-blur-xl border border-white/[0.03]'}`}>
        <a href="#home" className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-[#89AACC]/30 flex items-center justify-center font-[Instrument_Serif] italic text-[12px] text-white hover:border-[#89AACC] hover:scale-110 transition-all duration-300">SK</a>
        <div className="w-px h-4 bg-white/[0.06] mx-1.5 hidden sm:block" />
        <div className="flex gap-0.5">
          {navItems.map(n => (
            <a key={n.id} href={`#${n.id}`} className={`relative text-[11px] sm:text-[12px] rounded-full px-2.5 sm:px-3.5 py-1.5 transition-all duration-300 font-medium ${active === n.id ? 'text-white' : 'text-[#878787] hover:text-white'}`}>
              {active === n.id && <motion.div layoutId="npill" className="absolute inset-0 bg-white/[0.06] rounded-full" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
              <span className="relative z-10">{n.label}</span>
            </a>
          ))}
        </div>
        <div className="w-px h-4 bg-white/[0.06] mx-1.5" />
        <a href="https://instagram.com/tcqur" target="_blank" rel="noopener noreferrer" className="gradient-border rounded-full">
          <div className="text-[11px] sm:text-[12px] rounded-full px-2.5 sm:px-3.5 py-1.5 bg-[#141414] text-white flex items-center gap-1.5 font-medium hover:bg-[#1a1a1a] transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Say hi <span className="text-[#89AACC]">↗</span>
          </div>
        </a>
      </div>
    </motion.nav>
  );
}

/* ═══════════════════════════════════════════════════════
   PARTICLES
   ═══════════════════════════════════════════════════════ */
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = c.getContext('2d'); if (!ctx) return;
    let w = 0, h = 0;
    const resize = () => { w = c.width = innerWidth; h = c.height = innerHeight; };
    resize(); addEventListener('resize', resize);
    const mouse = { x: w / 2, y: h / 2 };
    const onM = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    addEventListener('mousemove', onM);
    const N = Math.min(50, Math.floor(w / 30));
    const ps = Array.from({ length: N }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15, s: Math.random() * 1.2 + 0.3, o: Math.random() * 0.12 + 0.02 }));
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 160) { const f = (160 - d) / 160; p.vx += (dx / d) * f * 0.02; p.vy += (dy / d) * f * 0.02; }
        p.vx *= 0.992; p.vy *= 0.992; p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fillStyle = `rgba(137,170,204,${p.o})`; ctx.fill();
        for (let j = i + 1; j < ps.length; j++) {
          const q = ps[j], cx = p.x - q.x, cy = p.y - q.y, cd = Math.sqrt(cx * cx + cy * cy);
          if (cd < 90) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = `rgba(137,170,204,${0.03 * (1 - cd / 90)})`; ctx.lineWidth = 0.3; ctx.stroke(); }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); removeEventListener('mousemove', onM); };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-[1] opacity-40" />;
}

/* ═══════════════════════════════════════════════════════
   REVEAL SECTION
   ═══════════════════════════════════════════════════════ */
function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 50 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.85, ease: [0.16, 1, 0.3, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   HORIZONTAL SCROLL PROJECT SHOWCASE
   ═══════════════════════════════════════════════════════ */
function HorizontalProjects() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-75%']);
  const smoothX = useSpring(x, { stiffness: 80, damping: 25 });

  // Parallax elements
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0.3, 1, 1, 0.3]);

  return (
    <section ref={containerRef} className="relative" style={{ height: '400vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        {/* Parallax BG grid */}
        <motion.div className="absolute inset-0 opacity-[0.012] pointer-events-none" style={{ y: bgY, backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />

        <motion.div style={{ opacity }} className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
        </motion.div>

        <motion.div style={{ x: smoothX }} className="flex gap-8 pl-[10vw] pr-[40vw]">
          {/* Header card */}
          <div className="flex-shrink-0 w-[45vw] md:w-[35vw] flex flex-col justify-center pr-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-px bg-[#89AACC]/40" />
              <span className="text-[9px] text-[#878787] uppercase tracking-[0.5em] font-medium">Selected Work</span>
            </div>
            <h2 className="text-4xl md:text-6xl lg:text-7xl text-white leading-[1.05] mb-6">
              Featured<br />
              <span className="font-[Instrument_Serif] italic text-gradient-pink">deployments</span>
            </h2>
            <p className="text-[#878787] text-sm max-w-xs leading-relaxed">
              Ultra-low latency frameworks and systems I've architected — from concept to production.
            </p>
          </div>

          {/* Project cards */}
          {projects.map((p, i) => (
            <ProjectCard key={p.title} project={p} index={i} scrollProgress={scrollYProgress} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   PROJECT CARD (for horizontal scroll)
   ═══════════════════════════════════════════════════════ */
function ProjectCard({ project: p, index }: { project: typeof projects[0]; index: number; scrollProgress: any }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [glow, setGlow] = useState({ x: 50, y: 50 });
  const [tilt, setTilt] = useState('perspective(1200px) rotateX(0) rotateY(0)');

  const onMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const rx = ((y - r.height / 2) / (r.height / 2)) * -4;
    const ry = ((x - r.width / 2) / (r.width / 2)) * 4;
    setTilt(`perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.01,1.01,1.01)`);
    setGlow({ x: (x / r.width) * 100, y: (y / r.height) * 100 });
  };
  const onLeave = () => { setTilt('perspective(1200px) rotateX(0) rotateY(0) scale3d(1,1,1)'); setHovered(false); };

  const Wrap = p.href ? 'a' : 'div';
  const wp = p.href ? { href: p.href, target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20%' }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex-shrink-0 w-[80vw] sm:w-[60vw] md:w-[42vw] lg:w-[35vw]"
    >
      <Wrap {...wp} className="block">
        <div ref={cardRef} className="card-3d group relative h-[70vh] max-h-[600px] rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer border border-white/[0.04]"
          style={{ transform: tilt, transformStyle: 'preserve-3d' }}
          onMouseMove={onMove} onMouseEnter={() => setHovered(true)} onMouseLeave={onLeave}>

          {/* Mouse glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-[1]"
            style={{ background: `radial-gradient(500px circle at ${glow.x}% ${glow.y}%, ${p.color}11, transparent 50%)` }} />

          {/* Image */}
          <img src={p.image} alt={p.title} loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-all duration-700 opacity-25 grayscale group-hover:opacity-45 group-hover:grayscale-0 group-hover:scale-[1.03]" />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent z-[2]" />

          {/* Number */}
          <div className="absolute top-6 left-6 z-[4]">
            <span className="text-7xl md:text-8xl font-[Instrument_Serif] italic leading-none" style={{ color: p.color, opacity: 0.08 }}>{p.num}</span>
          </div>

          {/* Year + tags top right */}
          <div className="absolute top-6 right-6 z-[4] flex items-center gap-2">
            <span className="text-[9px] text-white/20 font-mono">{p.year}</span>
          </div>

          {/* Hover CTA */}
          <motion.div initial={false} animate={hovered ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.35 }}
            className="absolute inset-0 z-[5] flex items-center justify-center backdrop-blur-sm bg-black/40">
            <motion.div initial={false} animate={hovered ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.9, opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
              <div className="gradient-border rounded-full">
                <div className="bg-white text-black px-7 py-3.5 rounded-full text-sm font-medium flex items-center gap-2">
                  Explore <span className="font-[Instrument_Serif] italic mx-1">—</span>
                  <span className="font-[Instrument_Serif] italic text-base">{p.subtitle}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom info */}
          <div className={`absolute bottom-0 left-0 right-0 p-7 z-[4] transition-all duration-400 ${hovered ? 'opacity-0 translate-y-2' : 'opacity-100'}`}>
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {p.tags.map(t => (
                <span key={t} className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border" style={{ color: p.color + 'aa', borderColor: p.color + '15', background: p.color + '08' }}>{t}</span>
              ))}
            </div>
            <h3 className="text-xl md:text-2xl font-[Instrument_Serif] italic text-white mb-2">{p.title}</h3>
            <p className="text-[11px] text-white/40 max-w-[280px] leading-relaxed hidden md:block">{p.desc}</p>
          </div>
        </div>
      </Wrap>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   COUNTER
   ═══════════════════════════════════════════════════════ */
function Counter({ target, suffix, label, sub }: { target: number; suffix: string; label: string; sub: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const steps = 70, inc = target / steps; let cur = 0;
    const t = setInterval(() => { cur += inc; if (cur >= target) { setV(target); clearInterval(t); } else setV(Math.floor(cur)); }, 2000 / steps);
    return () => clearInterval(t);
  }, [inView, target]);
  return (
    <div ref={ref} className="text-center px-4 lg:px-8">
      <div className="text-5xl md:text-6xl lg:text-7xl font-[Instrument_Serif] italic text-white mb-2">{inView ? v : 0}{suffix}</div>
      <div className="text-[10px] text-white/60 font-medium uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-[9px] text-[#878787]">{sub}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SVG ICONS
   ═══════════════════════════════════════════════════════ */
function GH({ c = 'w-4 h-4' }: { c?: string }) {
  return <svg className={c} fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>;
}
function IG({ c = 'w-4 h-4' }: { c?: string }) {
  return <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
}

/* ═══════════════════════════════════════════════════════
   PARALLAX ABOUT SECTION
   ═══════════════════════════════════════════════════════ */
function About() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y1 = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const y2 = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [2, 0, -2]);

  return (
    <section ref={ref} id="about" className="relative bg-[#0a0a0a] py-32 md:py-48 px-4 sm:px-6 md:px-10 lg:px-16 max-w-[1400px] mx-auto overflow-hidden">
      {/* Floating decorative blob */}
      <motion.div style={{ y: y1, rotate }}
        className="absolute -top-20 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.02] pointer-events-none"
        aria-hidden="true">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#89AACC] to-[#fd86db]" style={{ animation: 'morph-blob 20s ease-in-out infinite' }} />
      </motion.div>

      <Reveal className="mb-20 md:mb-24">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-px bg-[#89AACC]/40" />
          <span className="text-[9px] text-[#878787] uppercase tracking-[0.5em] font-medium">About</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          <motion.h2 style={{ y: y2 }} className="text-4xl md:text-6xl lg:text-7xl text-white leading-[1.05]">
            Building{' '}<span className="font-[Instrument_Serif] italic text-gradient-pink">resilient</span>{' '}infrastructure
          </motion.h2>
          <div className="flex flex-col justify-end gap-5">
            <p className="text-[#878787] text-[14px] leading-relaxed">I'm a systems architect and security researcher focused on building high-performance infrastructure that scales globally. My work spans real-time WebSocket frameworks to cloud-native automation platforms.</p>
            <p className="text-[#878787] text-[14px] leading-relaxed">When I'm not architecting distributed systems, I'm exploring attack vectors in cybersecurity labs or optimizing API throughput for zero-latency deployments.</p>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-16">
        {skills.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.05}>
            <div className="group relative p-6 md:p-7 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-400 cursor-default overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#89AACC]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl" />
              <div className="absolute top-4 right-4 text-[8px] text-white/[0.06] font-mono">0{i + 1}</div>
              <span className="text-xl mb-4 block">{s.icon}</span>
              <h4 className="text-white font-medium text-[13px] mb-1">{s.label}</h4>
              <p className="text-[11px] text-[#878787] leading-relaxed">{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="p-6 md:p-8 rounded-2xl border border-white/[0.04] bg-white/[0.01]">
          <h4 className="text-[8px] text-[#878787] uppercase tracking-[0.5em] mb-5 font-medium">Technology Stack</h4>
          <div className="flex flex-wrap gap-1.5">
            {techStack.map((t, i) => (
              <motion.span key={t} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                transition={{ delay: i * 0.025, duration: 0.35 }}
                className="text-[10px] font-mono text-white/50 bg-white/[0.03] hover:bg-[#89AACC]/10 hover:text-[#89AACC] hover:border-[#89AACC]/15 px-2.5 py-1 rounded-full border border-white/[0.04] transition-all duration-300 cursor-default">
                {t}
              </motion.span>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════ */
export default function App() {
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [roleIdx, setRoleIdx] = useState(0);

  const { scrollYProgress } = useScroll();
  const smoothProg = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const scaleX = useTransform(smoothProg, [0, 1], [0, 1]);

  useEffect(() => { if (loading) return; const t = setInterval(() => setRoleIdx(p => (p + 1) % roles.length), 2200); return () => clearInterval(t); }, [loading]);

  const onDone = useCallback(() => { setLoading(false); setTimeout(() => setReady(true), 80); }, []);

  return (
    <div className="noise-overlay">
      {/* Progress bar */}
      {!loading && <motion.div className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left" style={{ scaleX, background: 'linear-gradient(90deg, #89AACC, #fd86db, #89AACC)' }} />}

      <AnimatePresence>{loading && <Loading onDone={onDone} />}</AnimatePresence>

      {!loading && (
        <>
          <Particles />
          <Nav show={ready} />

          <main className="relative z-[2]">
            {/* ══════ HERO ══════ */}
            <section id="home" className="hero-stage relative w-full overflow-hidden" style={{ minHeight: '100dvh' }}>
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[#0a0a0a]" />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(137,170,204,0.07), transparent)' }} />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 40% at 85% 90%, rgba(253,134,219,0.03), transparent)' }} />
                <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
              </div>

              {/* Asterisk mark */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1, duration: 0.62, ease: [0.25, 0.8, 0.28, 1] }}
                className="absolute z-[4]" style={{ top: '2.14dvh', left: '3.85vw', width: 'clamp(34px, min(3.4vw, 5.2dvh), 66px)' }}>
                <svg viewBox="0 0 66 62" fill="none" stroke="white" strokeWidth="5" strokeLinecap="square">
                  <line x1="33" y1="1" x2="33" y2="61"/><line x1="3" y1="31" x2="63" y2="31"/><line x1="11.8" y1="9.8" x2="54.2" y2="52.2"/><line x1="54.2" y1="9.8" x2="11.8" y2="52.2"/>
                </svg>
              </motion.div>

              {/* Giant SAAD */}
              <div className="absolute z-[1]" style={{ top: '11.5dvh', left: '4.35vw' }}>
                <div className="overflow-hidden" style={{ padding: '0 0 0.05em', margin: '0 0 -0.05em 0' }}>
                  <motion.div initial={{ y: '118%' }} animate={ready ? { y: '0%' } : {}} transition={{ delay: 0.3, duration: 1.15, ease: [0.16, 1, 0.3, 1] }}>
                    <h1 className="font-[Instrument_Serif] italic leading-[0.88] tracking-[0.033em]" style={{ fontSize: 'min(27.8vw, 55dvh)' }}>
                      <span className="text-white"><span className="inline-block" style={{ transform: 'scaleX(1.087)', marginRight: '0.042em' }}>S</span>A</span>
                      <span className="text-gradient-pink">AD</span>
                    </h1>
                  </motion.div>
                </div>
              </div>

              {/* Flower */}
              <motion.div initial={{ opacity: 0, y: '3.4dvh' }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.66, duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 z-[2] pointer-events-none"><FlowerReveal /></motion.div>

              {/* Left corner */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.98, duration: 0.72, ease: [0.25, 0.8, 0.28, 1] }}
                className="absolute z-[3]" style={{ bottom: '4.36dvh', left: '3.18vw' }}>
                <p className="text-[#f7f7f7] leading-[1.45]" style={{ fontSize: 'clamp(13px, min(1.35vw, 2dvh), 26px)' }}>
                  A{' '}<span className="inline-block min-w-[80px]" key={roleIdx}><span className="font-[Instrument_Serif] italic text-[#89AACC] inline-block" style={{ animation: 'roleAnim 0.5s cubic-bezier(0.16,1,0.3,1) forwards' }}>{roles[roleIdx]}</span></span>{' '}crafting<br/>high-performance systems.
                </p>
              </motion.div>

              {/* Right corner */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.98, duration: 0.72, ease: [0.25, 0.8, 0.28, 1] }}
                className="absolute z-[3] hidden md:block" style={{ bottom: '4.36dvh', left: '78.28vw' }}>
                <p className="text-[#f7f7f7] leading-[1.45] text-right" style={{ fontSize: 'clamp(13px, min(1.35vw, 2dvh), 26px)' }}>Less manual work.<br/>More meaningful output.</p>
              </motion.div>

              {/* Pill */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.34, duration: 0.62, ease: [0.25, 0.8, 0.28, 1] }}
                className="absolute z-[4] hidden md:flex" style={{ top: '2.34dvh', right: '7.5vw' }}>
                <div className="bg-white text-[#161616] flex items-center justify-center rounded-full font-medium"
                  style={{ height: 'clamp(34px, 4.44dvh, 57px)', padding: '0 clamp(16px, 2vw, 32px)', fontSize: 'clamp(11px, min(1.1vw, 1.7dvh), 21px)', letterSpacing: '0.027em' }}>
                  Systems Architect
                </div>
              </motion.div>

              {/* Scroll */}
              <motion.div initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : {}} transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[3] flex flex-col items-center gap-2">
                <span className="text-[7px] text-[#878787] uppercase tracking-[0.3em]">Scroll</span>
                <div className="w-px h-8 bg-white/[0.08] relative overflow-hidden"><div className="absolute inset-0 bg-white scroll-line-anim" /></div>
              </motion.div>

              <style>{`@keyframes roleAnim { from { opacity:0; transform: translateY(10px); filter: blur(4px); } to { opacity:1; transform: translateY(0); filter: blur(0); } }`}</style>
            </section>

            {/* ══════ WORK — HORIZONTAL SCROLL ══════ */}
            <div id="work">
              <HorizontalProjects />
            </div>

            {/* ══════ ABOUT ══════ */}
            <About />

            {/* ══════ STATS ══════ */}
            <section className="relative overflow-hidden">
              <div className="absolute inset-0 bg-[#111]" />
              <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
              <div className="relative py-24 md:py-32 px-4 sm:px-6 md:px-10 max-w-[1400px] mx-auto">
                <Reveal className="text-center mb-14"><span className="text-[8px] text-[#878787] uppercase tracking-[0.5em]">By the Numbers</span></Reveal>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-0 lg:divide-x divide-white/[0.04]">
                  <Counter target={12} suffix="+" label="Active Nodes" sub="Distributed globally" />
                  <Counter target={0} suffix="ms" label="Added Latency" sub="Zero overhead" />
                  <Counter target={24} suffix="/7" label="Availability" sub="Always-on" />
                  <Counter target={99} suffix=".9%" label="Uptime" sub="Enterprise grade" />
                </div>
              </div>
            </section>

            {/* ══════ JOURNAL ══════ */}
            <section className="bg-[#0a0a0a] py-28 md:py-40 px-4 sm:px-6 md:px-10 lg:px-16 max-w-[1100px] mx-auto">
              <Reveal className="mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-px bg-[#89AACC]/40" />
                  <span className="text-[9px] text-[#878787] uppercase tracking-[0.5em] font-medium">
                    Recent <span className="font-[Instrument_Serif] italic normal-case text-lg text-white ml-1">thoughts</span>
                  </span>
                </div>
              </Reveal>
              <div className="space-y-2.5">
                {[
                  { t: 'Optimizing API Rate Limits for Concurrency', cat: 'Engineering', time: '4 min', date: 'Aug 12, 2026', img: 'https://images.unsplash.com/photo-1517430816045-df4b7ef11df1?w=100&h=100&fit=crop' },
                  { t: 'Security Workflows in Burp Suite', cat: 'Cybersecurity', time: '6 min', date: 'Jul 28, 2026', img: 'https://images.unsplash.com/photo-1555949963-aa79dcee57d5?w=100&h=100&fit=crop' },
                  { t: 'Building Resilient WebSocket Infrastructure', cat: 'Architecture', time: '8 min', date: 'Jun 15, 2026', img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&h=100&fit=crop' },
                ].map((p, i) => (
                  <Reveal key={p.t} delay={i * 0.06}>
                    <div className="group flex items-center justify-between p-4 md:p-5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03] hover:border-white/[0.06] rounded-xl md:rounded-2xl transition-all duration-300 cursor-pointer">
                      <div className="flex items-center gap-4 md:gap-5">
                        <div className="w-10 h-10 rounded-full bg-white/[0.04] overflow-hidden flex-shrink-0 ring-2 ring-transparent group-hover:ring-[#89AACC]/10 transition-all">
                          <img src={p.img} alt="" loading="lazy" className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-[12px] md:text-[13px] group-hover:text-[#89AACC] transition-colors">{p.t}</h4>
                          <p className="text-[10px] text-[#878787] mt-0.5">{p.cat} · {p.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-[#878787] hidden md:block">{p.date}</span>
                        <span className="text-[#89AACC] text-sm group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">↗</span>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* ══════ CONTACT / FOOTER ══════ */}
            <section id="contact" className="relative overflow-hidden bg-[#0a0a0a]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(137,170,204,0.03), transparent 70%)' }} />

              {/* Marquee */}
              <div className="border-y border-white/[0.03] py-5 bg-white/[0.005] mb-20 overflow-hidden">
                <div className="marquee-track whitespace-nowrap inline-block">
                  {[...Array(4)].map((_, i) => (
                    <span key={i} className="text-5xl md:text-7xl lg:text-8xl font-[Instrument_Serif] italic text-white/[0.025] mx-4">
                      ARCHITECTING SYSTEMS • BUILDING THE FUTURE • ZERO LATENCY • FULL STACK • CLOUD NATIVE • SECURE •{' '}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 pb-12">
                <Reveal className="mb-14">
                  <div className="flex items-center gap-4 mb-8 justify-center">
                    <div className="w-10 h-px bg-[#89AACC]/40" /><span className="text-[8px] text-[#878787] uppercase tracking-[0.5em] font-medium">Get in Touch</span><div className="w-10 h-px bg-[#89AACC]/40" />
                  </div>
                  <h2 className="text-4xl md:text-6xl lg:text-7xl font-[Instrument_Serif] italic text-white mb-5 leading-[1.05]">
                    Let's build<br/><span className="text-gradient-pink">something great.</span>
                  </h2>
                  <p className="text-[#878787] text-sm max-w-md mx-auto mb-10 leading-relaxed">Have a project in mind or want to discuss system architecture? I'm always open to interesting conversations.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a href="https://instagram.com/tcqur" target="_blank" rel="noopener noreferrer"
                      className="group overflow-hidden rounded-full bg-white text-[#0a0a0a] px-8 py-3.5 text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-[#89AACC]/10 hover:scale-[1.03] flex items-center gap-2 justify-center">
                      <IG /> Message @tcqur <span className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">↗</span>
                    </a>
                    <a href="https://github.com/saadkashif" target="_blank" rel="noopener noreferrer" className="gradient-border rounded-full">
                      <div className="rounded-full bg-[#0a0a0a] text-white px-8 py-3.5 text-sm font-medium flex items-center gap-2 hover:bg-[#141414] transition-colors justify-center"><GH /> View GitHub</div>
                    </a>
                  </div>
                </Reveal>

                <Reveal delay={0.1} className="w-full max-w-[1200px] grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-20">
                  {[
                    { l: 'e12 Framework', h: 'https://e12.lovable.app', d: 'Automation platform' },
                    { l: 'UserSniper', h: 'https://www.usersniper.com/', d: 'Username scanner' },
                    { l: 'GitHub Profile', h: 'https://github.com/saadkashif', d: 'Open source' },
                  ].map(lnk => (
                    <a key={lnk.l} href={lnk.h} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center justify-between p-5 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.06] transition-all duration-300">
                      <div><div className="text-white text-sm font-medium group-hover:text-[#89AACC] transition-colors">{lnk.l}</div><div className="text-[10px] text-[#878787] mt-0.5">{lnk.d}</div></div>
                      <span className="text-[#878787] group-hover:text-[#89AACC] transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                    </a>
                  ))}
                </Reveal>

                <div className="w-full max-w-[1200px] flex flex-col md:flex-row items-center justify-between gap-5 text-[10px] text-[#878787] border-t border-white/[0.04] pt-7">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/20" />Available for deployments</div>
                  <div className="flex items-center gap-5">
                    <span className="text-white/20">© 2026 Saad Kashif</span>
                    <div className="flex gap-3">
                      <a href="https://github.com/saadkashif" target="_blank" rel="noopener noreferrer" className="hover:text-[#89AACC] transition-colors"><GH /></a>
                      <a href="https://instagram.com/tcqur" target="_blank" rel="noopener noreferrer" className="hover:text-[#89AACC] transition-colors"><IG /></a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </>
      )}
    </div>
  );
}
