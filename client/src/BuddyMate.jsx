import { useState, useEffect, useRef } from "react";
import RoommateApp from "./RoommateApp";

const PARTICLE_COUNT = 60;

function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 3 + 1, speedX: (Math.random() - 0.5) * 0.02, speedY: (Math.random() - 0.5) * 0.02, opacity: Math.random() * 0.6 + 0.2, color: ["#FF3CAC", "#784BA0", "#2B86C5", "#00F5FF", "#39FF14"][Math.floor(Math.random() * 5)],
  }));
}

const features = [
  { id: "roommate", emoji: "🏠", tag: "FIND YOUR PEOPLE", title: "Roommate Finder", desc: "Match with compatible roommates based on sleep schedules, study habits, and vibe checks. No more regrets.", accent: "#FF3CAC", bg: "rgba(255,60,172,0.08)", border: "rgba(255,60,172,0.3)", glow: "rgba(255,60,172,0.4)" },
  { id: "travel", emoji: "✈️", tag: "GO TOGETHER", title: "Travel Buddy", desc: "Split costs, share rides, and explore new places with fellow students heading the same direction. Adventure unlocked.", accent: "#00F5FF", bg: "rgba(0,245,255,0.06)", border: "rgba(0,245,255,0.3)", glow: "rgba(0,245,255,0.4)" },
  { id: "books", emoji: "📚", tag: "BORROW & LEND", title: "Book Exchange", desc: "Why buy when you can borrow? Connect with students who have the textbooks you need and save that cash for actual living.", accent: "#39FF14", bg: "rgba(57,255,20,0.06)", border: "rgba(57,255,20,0.3)", glow: "rgba(57,255,20,0.4)" },
];

const stats = [
  { value: "12K+", label: "Students" }, { value: "340+", label: "Matches Made" }, { value: "50+", label: "Colleges" }, { value: "Free", label: "Always" }
];

export default function BuddyMate({ onNavigate }) {
  const [activeApp, setActiveApp] = useState(null);

  const [scrollY, setScrollY] = useState(0);
  const [particles, setParticles] = useState(generateParticles);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [activeFeature, setActiveFeature] = useState(null);
  const animFrameRef = useRef(null);
  const particlesRef = useRef(particles);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onMouse = (e) => setMousePos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
    window.addEventListener("mousemove", onMouse);
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  useEffect(() => {
    if(activeApp) return; 
    const animate = () => {
      particlesRef.current = particlesRef.current.map((p) => {
        let nx = p.x + p.speedX; let ny = p.y + p.speedY;
        if (nx < 0 || nx > 100) p.speedX *= -1; if (ny < 0 || ny > 100) p.speedY *= -1;
        return { ...p, x: Math.max(0, Math.min(100, nx)), y: Math.max(0, Math.min(100, ny)) };
      });
      setParticles([...particlesRef.current]);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [activeApp]);

  if (activeApp === "roommate") {
    return <RoommateApp onBack={() => setActiveApp(null)} />;
  }

  const scrollProgress = Math.min(scrollY / 800, 1);
  const hue1 = 270 + scrollProgress * 80; const hue2 = 190 + scrollProgress * 60; const hue3 = 120 + scrollProgress * 40;
  const bgGrad = `
    radial-gradient(ellipse at ${mousePos.x}% ${mousePos.y}%, hsla(${hue1},90%,15%,0.9) 0%, transparent 60%),
    radial-gradient(ellipse at ${100 - mousePos.x}% ${100 - mousePos.y}%, hsla(${hue2},85%,12%,0.8) 0%, transparent 55%),
    radial-gradient(ellipse at 50% ${50 + scrollProgress * 30}%, hsla(${hue3},70%,8%,0.7) 0%, transparent 70%),
    linear-gradient(135deg, #020008 0%, #05001A 40%, #020012 100%)
  `;

  return (
    <div style={{ width: "100%", fontFamily: "'Space Mono', 'Courier New', monospace", background: bgGrad, minHeight: "100vh", color: "#fff", overflowX: "hidden", transition: "background 0.1s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%, 100% { filter: drop-shadow(0 0 20px rgba(255,60,172,0.5)) drop-shadow(0 0 40px rgba(120,75,160,0.3)); } 50% { filter: drop-shadow(0 0 40px rgba(255,60,172,0.8)) drop-shadow(0 0 80px rgba(0,245,255,0.4)); } }
        @keyframes scrollBounce { 0%, 100% { transform: translateY(0) translateX(-50%); opacity: 1; } 50% { transform: translateY(8px) translateX(-50%); opacity: 0.5; } }
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)" }} />

      <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}>
        {particles.map((p) => (
          <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, borderRadius: "50%", background: p.color, opacity: p.opacity * (1 - scrollProgress * 0.5), boxShadow: `0 0 ${p.size * 2}px ${p.color}`, transition: "opacity 0.1s" }} />
        ))}
      </div>

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: scrollY > 50 ? "blur(20px)" : "none", background: scrollY > 50 ? "rgba(2,0,18,0.85)" : "transparent", borderBottom: scrollY > 50 ? "1px solid rgba(255,60,172,0.15)" : "none", transition: "all 0.3s ease" }}>
        <div style={{ fontSize: "1.4rem", fontWeight: "bold", letterSpacing: "0.15em", background: "linear-gradient(90deg, #FF3CAC, #784BA0, #00F5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", cursor: "pointer" }}>BUDDY MATE</div>
        <ul style={{ display: "flex", gap: "2rem", listStyle: "none", margin: 0, padding: 0 }}>
          {["Features", "Roommates", "Travel", "Books"].map((l) => (
            <li key={l}><span style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>{l}</span></li>
          ))}
        </ul>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={onNavigate} style={{ padding: "0.5rem 1.25rem", background: "transparent", border: "1px solid rgba(0,245,255,0.5)", color: "#00F5FF", fontSize: "0.7rem", fontFamily: "inherit", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}>Log In</button>
          <button onClick={onNavigate} style={{ padding: "0.5rem 1.25rem", background: "linear-gradient(135deg, #FF3CAC, #784BA0)", border: "none", color: "#fff", fontSize: "0.7rem", fontFamily: "inherit", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)", fontWeight: "bold" }}>Sign Up</button>
        </div>
      </nav>

      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "2rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: "0.7rem", letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(0,245,255,0.7)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "center" }}>
            <span style={{ display: "inline-block", width: "30px", height: "1px", background: "#00F5FF" }} /><span>VIT University Platform</span><span style={{ display: "inline-block", width: "30px", height: "1px", background: "#00F5FF" }} />
          </div>
          <h1 style={{ fontSize: "clamp(3.5rem, 12vw, 10rem)", fontWeight: "900", letterSpacing: "0.05em", lineHeight: 1, transform: `scale(${1 - scrollProgress * 0.08}) translateY(${scrollProgress * -40}px)`, transition: "transform 0.05s linear", position: "relative", zIndex: 2 }}>
            <span style={{ fontFamily: "'Bebas Neue', monospace", display: "block", background: "linear-gradient(135deg, #FF3CAC 0%, #784BA0 35%, #2B86C5 65%, #00F5FF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: `drop-shadow(0 0 ${20 + scrollProgress * 40}px rgba(255,60,172,0.5))`, animation: "pulse 3s ease-in-out infinite" }}>BUDDY MATE</span>
          </h1>
          <p style={{ fontSize: "clamp(0.8rem, 2vw, 1.1rem)", color: "rgba(255,255,255,0.6)", letterSpacing: "0.3em", textTransform: "uppercase", marginTop: "1.5rem" }}>Connect • Explore • <span style={{ color: "#39FF14" }}>Thrive</span></p>
          <p style={{ maxWidth: "500px", margin: "1.5rem auto 0", fontSize: "0.9rem", lineHeight: 1.8, color: "rgba(255,255,255,0.5)", letterSpacing: "0.03em" }}>The all-in-one platform for VIT students. Find your roommate, plan group trips, and swap textbooks — all in one place.</p>
          
          <div style={{ display: "flex", gap: "1rem", marginTop: "3rem", flexWrap: "wrap", justifyContent: "center", position: "relative", zIndex: 2 }}>
            <button onClick={onNavigate} style={{ padding: "0.9rem 2.5rem", background: "linear-gradient(135deg, #FF3CAC, #784BA0)", border: "none", color: "#fff", fontSize: "0.8rem", fontFamily: "inherit", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)", fontWeight: "bold" }}>Get Started →</button>
            <button onClick={onNavigate} style={{ padding: "0.9rem 2.5rem", background: "transparent", border: "1px solid rgba(0,245,255,0.5)", color: "#00F5FF", fontSize: "0.8rem", fontFamily: "inherit", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}>Explore Features</button>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", opacity: Math.max(0, 1 - scrollY / 200), transition: "opacity 0.1s", zIndex: 2 }}>
          <span style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)" }}>SCROLL</span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
            <rect x="6" y="0" width="4" height="14" rx="2" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
            <rect x="6.5" y="2" width="3" height="5" rx="1.5" fill="rgba(0,245,255,0.6)" style={{ animation: "scrollBounce 1.5s infinite" }} />
          </svg>
        </div>
      </section>

      <div style={{ padding: "4rem 2rem", display: "flex", justifyContent: "center", gap: "clamp(2rem, 6vw, 6rem)", flexWrap: "wrap", borderTop: "1px solid rgba(255,60,172,0.1)", borderBottom: "1px solid rgba(0,245,255,0.1)", background: "rgba(255,255,255,0.01)" }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <span style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: "900", background: "linear-gradient(135deg, #FF3CAC, #00F5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "block" }}>{s.value}</span>
            <span style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>{s.label}</span>
          </div>
        ))}
      </div>

      <section style={{ padding: "5rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ fontSize: "0.7rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "#FF3CAC", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ display: "inline-block", width: "40px", height: "1px", background: "#FF3CAC" }} /> Core Features
        </div>
        <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: "900", lineHeight: 1.1, marginBottom: "1rem", letterSpacing: "-0.02em" }}>
          Built for the<br /><span style={{ background: "linear-gradient(135deg, #FF3CAC, #00F5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>College Grind</span>
        </h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginTop: "3rem" }}>
          {features.map((f) => (
            <div 
              key={f.id} 
              // ONLY THE ROOMMATE FINDER CARD IS CLICKABLE NOW
              onClick={f.id === 'roommate' ? onNavigate : undefined} 
              style={{ padding: "2rem", background: activeFeature === f.id ? f.bg : "rgba(255,255,255,0.02)", border: `1px solid ${activeFeature === f.id ? f.border : "rgba(255,255,255,0.06)"}`, borderRadius: "2px", cursor: f.id === 'roommate' ? "pointer" : "default", transition: "all 0.3s ease", position: "relative", overflow: "hidden", boxShadow: activeFeature === f.id ? `0 0 40px ${f.glow}` : "none", transform: activeFeature === f.id ? "translateY(-4px)" : "none" }} 
              onMouseEnter={() => setActiveFeature(f.id)} 
              onMouseLeave={() => setActiveFeature(null)}
            >
              <div style={{ position: "absolute", top: 0, right: 0, width: "40px", height: "40px", borderTop: `2px solid ${f.accent}`, borderRight: `2px solid ${f.accent}`, opacity: activeFeature === f.id ? 1 : 0.3, transition: "opacity 0.3s" }} />
              <span style={{ fontSize: "2.5rem", marginBottom: "1rem", display: "block" }}>{f.emoji}</span>
              <div style={{ fontSize: "0.6rem", letterSpacing: "0.3em", textTransform: "uppercase", color: f.accent, marginBottom: "0.5rem" }}>{f.tag}</div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", marginBottom: "0.75rem", letterSpacing: "0.02em" }}>{f.title}</h3>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>{f.desc}</p>
              <div style={{ display: "inline-block", marginTop: "1.25rem", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: f.accent, border: `1px solid ${f.accent}`, padding: "0.3rem 0.75rem", opacity: 0.8 }}>
                <span>{f.id === 'roommate' ? "Open App →" : "Coming Soon →"}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ background: "rgba(0,0,0,0.5)", borderTop: "1px solid rgba(255,255,255,0.04)", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: "bold", letterSpacing: "0.15em", background: "linear-gradient(90deg, #FF3CAC, #784BA0, #00F5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>BUDDY MATE</div>
          <span style={{ fontSize: "0.7rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)" }}>© 2026 BUDDY MATE. Made with 💜 for VIT Students.</span>
        </div>
      </footer>
    </div>
  );
}