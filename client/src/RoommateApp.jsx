import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE   = "https://buddy-mate.onrender.com/api";
const AV_COLORS  = ["#FF3CAC","#784BA0","#2B86C5","#00F5FF","#39FF14","#FF9F1C","#FF6B6B","#C77DFF"];
const PREFS_LIST = ["AC Room","Non-AC Room","Ground Floor","1st Floor","2nd Floor","3rd Floor","Top Floor","Quiet Wing","Social Wing","Double Occupancy","Triple Occupancy","Near Mess","Near Library","Near Canteen","Near Sports","Corner Room"];
const BRANCH_LIST= ["CSE","ECE","MECH","CIVIL","IT","BIOMED","EEE","CHEM","MBA","MCA"];

function avColor(s){ let h=5381; for(let i=0;i<s.length;i++) h=((h<<5)+h)^s.charCodeAt(i); return AV_COLORS[Math.abs(h)%AV_COLORS.length]; }
function avText(n){ return String(n||"?").split(" ").map(w=>w[0]||"").join("").slice(0,2).toUpperCase(); }
function isVit(e){ return /^[^\s@]+@(vitstudent\.ac\.in|vit\.ac\.in)$/i.test((e||"").trim()); }
function isStrongPassword(pw) { return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(pw); }

function getToken() { return localStorage.getItem('bm_token'); }
function apiGet(path)       { return axios.get (`${API_BASE}/roommates${path}`,       { headers:{ Authorization: `Bearer ${getToken()}` } }); }
function apiPost(path, data){ return axios.post(`${API_BASE}/roommates${path}`, data, { headers:{ Authorization: `Bearer ${getToken()}` } }); }
function apiPatch(path, data){ return axios.patch(`${API_BASE}/roommates${path}`, data, { headers:{ Authorization: `Bearer ${getToken()}` } }); }
function apiDel(path)       { return axios.delete(`${API_BASE}/roommates${path}`,     { headers:{ Authorization: `Bearer ${getToken()}` } }); }

const BG="#020008", PINK="#FF3CAC", PURPLE="#784BA0", CYAN="#00F5FF", GREEN="#39FF14";
const appStyle={ fontFamily:"'Space Mono','Courier New',monospace", background:`linear-gradient(135deg,${BG},#05001A,#020012)`, minHeight:"100vh", color:"#fff" };
const cardBase={ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"2px", padding:"1.25rem", position:"relative", overflow:"hidden" };
function inp(err){ return{ width:"100%", padding:"0.75rem 1rem", background:"rgba(255,255,255,0.04)", border:`1px solid ${err?"#ff6b6b":"rgba(255,255,255,0.1)"}`, borderRadius:"2px", color:"#fff", fontFamily:"inherit", fontSize:"0.78rem", outline:"none", boxSizing:"border-box" }; }
function btn(bg,border,color="#fff"){ return{ padding:"0.7rem 1.4rem", background:bg, border:`1px solid ${border}`, color, fontFamily:"inherit", fontSize:"0.7rem", letterSpacing:"0.12em", textTransform:"uppercase", cursor:"pointer", fontWeight:"bold", borderRadius:"2px" }; }
function tag(color){ return{ fontSize:"0.58rem", padding:"0.2rem 0.5rem", background:`${color}18`, border:`1px solid ${color}30`, color, borderRadius:"2px", display:"inline-block" }; }
const lbl={ fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:"0.4rem", display:"block" };
const err={ fontSize:"0.62rem", color:"#ff6b6b", marginTop:"0.25rem" };

function TicketCard({ t, sent, matches, onClick }){
  const isSent = sent.some(r=>r.ticketId===t._id && r.status==='pending');
  const isMatch = matches.some(m=>m.userId===t.userId);
  const ac = avColor(t.name||"X");
  return(
    <div onClick={onClick} className="tc" style={{...cardBase, cursor:"pointer", borderColor:isMatch?`${GREEN}40`:isSent?`${CYAN}30`:"rgba(255,255,255,0.08)", marginBottom:"0.75rem"}}>
      <div style={{position:"absolute",top:0,left:0,width:"32px",height:"32px",borderTop:`2px solid ${ac}`,borderLeft:`2px solid ${ac}`,opacity:0.4}}/>
      <div style={{display:"flex",gap:"0.85rem",alignItems:"flex-start"}}>
        <div style={{width:"42px",height:"42px",borderRadius:"2px",background:`linear-gradient(135deg,${ac},${ac}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",fontSize:"0.8rem",flexShrink:0}}>{avText(t.name)}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:"bold",fontSize:"0.85rem"}}>{t.name}</div>
          <div style={{fontSize:"0.62rem",color:"rgba(255,255,255,0.4)"}}>{t.branch} · {t.roommates} roommate{t.roommates>1?"s":""}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem",marginTop:"0.5rem"}}>
            {(t.preferences||[]).slice(0,3).map(p=><span key={p} style={tag("rgba(255,255,255,0.5)")}>{p}</span>)}
            {(t.preferences||[]).length>3&&<span style={tag("rgba(255,255,255,0.3)")}>+{t.preferences.length-3}</span>}
          </div>
          {isMatch&&<div style={{marginTop:"0.4rem",fontSize:"0.62rem",color:GREEN}}>✓ Matched</div>}
          {isSent&&!isMatch&&<div style={{marginTop:"0.4rem",fontSize:"0.62rem",color:CYAN}}>⏳ Sent</div>}
        </div>
      </div>
    </div>
  );
}

export default function RoommateApp({ onBack }){
  const [pg,   setPg  ] = useState("auth"); 
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({name:"",email:"",pw:"",pw2:"", otp:""});
  const [ae,   setAe  ] = useState({});

  const [user, setUser] = useState(null);
  const [tickets,  setTickets ] = useState([]);
  const [myTicket, setMyTicket] = useState(null);
  const [view,     setView    ] = useState("dashboard");

  const [step,  setStep ] = useState(1);
  const [tf,    setTf   ] = useState({name:"",rank:"",branch:"",rm:1,prefs:[],note:""});
  const [te,    setTe   ] = useState({});
  const [prev,  setPrev ] = useState(false);
  const [busy,  setBusy ] = useState(false);

  const [sel,     setSel    ] = useState(null);
  const [sent,    setSent   ] = useState([]);
  const [inbox,   setInbox  ] = useState([]);
  const [matches, setMatches] = useState([]);
  const [chats,   setChats  ] = useState({});
  const [cmsg,    setCmsg   ] = useState("");
  const [achat,   setAchat  ] = useState(null);
  const [filt,    setFilt   ] = useState({branch:"",rm:"",r0:"",r1:""});
  const [toast,   setToast  ] = useState(null);

  function showToast(msg,type="ok"){ setToast({msg,type}); setTimeout(()=>setToast(null),3500); }

  /* ── AUTO LOGIN IF TOKEN EXISTS ── */
  useEffect(() => {
    const token = localStorage.getItem('bm_token');
    const storedUser = localStorage.getItem('bm_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setPg("app");
    }
  }, []);

  useEffect(()=>{
    if(!user?.id) return;
    apiGet("/tickets").then(r=>setTickets(r.data)).catch(()=>{});
    apiGet("/tickets/mine").then(r=>setMyTicket(r.data)).catch(()=>{});
    apiGet("/requests").then(r => {
      setInbox(r.data.incoming || []);
      setSent(r.data.sent || []);
      setMatches(r.data.matches || []);
    }).catch(()=>{});
  },[user?.id, view]);

  useEffect(() => {
    let interval;
    if (view === "chat" && achat && user?.id) {
      const partnerId = achat.partner.userId;
      const fetchChat = async () => {
        try {
          const res = await apiGet(`/chats/${partnerId}`);
          const formatted = (res.data.messages || []).map(m => ({
            from: m.sender === user.id ? "me" : "them",
            text: m.text
          }));
          if(formatted.length > 0) {
            setChats(p => ({...p, [achat.cid]: { partner: achat.partner, messages: formatted }}));
          }
        } catch(e) {}
      };
      fetchChat(); 
      interval = setInterval(fetchChat, 2000); 
    }
    return () => clearInterval(interval);
  }, [view, achat?.cid, user?.id]);

  /* ── TRUE SECURE AUTH FLOW ── */
  async function handleAuthAction() {
    const e={};
    if(mode==="signup"&&!form.name.trim()) e.name="Name required";
    if(!form.email) e.email="Email required";
    else if(!isVit(form.email)) e.email="Only @vitstudent.ac.in or @vit.ac.in";
    if(!form.pw) e.pw="Password required";
    else if(mode==="signup" && !isStrongPassword(form.pw)) e.pw="Min 8 chars, 1 num, 1 special char";
    if(mode==="signup"&&form.pw!==form.pw2) e.pw2="Passwords don't match";
    
    if(Object.keys(e).length){ setAe(e); return; }
    setAe({});
    setBusy(true);

    try {
      if (mode === "signup") {
        await axios.post(`${API_BASE}/auth/signup`, { name: form.name, email: form.email, password: form.pw });
        showToast("OTP sent to your email!");
        setPg("verify");
      } else {
        // This hits your backend and VERIFIES the password using bcrypt
        const res = await axios.post(`${API_BASE}/auth/login`, { email: form.email, password: form.pw });
        finishLogin(res.data.token, res.data.user);
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Authentication failed", "err");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOTP() {
    setBusy(true);
    try {
      await axios.post(`${API_BASE}/auth/verify`, { email: form.email, otp: form.otp });
      showToast("Account verified! Please log in.", "ok");
      setForm(f => ({ ...f, otp: "", pw: "", pw2: "" })); 
      setMode("login"); 
      setPg("auth");    
    } catch (err) {
      showToast(err.response?.data?.error || "Invalid OTP", "err");
    } finally {
      setBusy(false);
    }
  }

  function finishLogin(token, userData) {
    localStorage.setItem('bm_token', token);
    localStorage.setItem('bm_user', JSON.stringify(userData));
    setUser(userData);
    setTf({name: userData.name, rank:"", branch: userData.branch || "CSE", rm:1, prefs:[], note:""});
    setView("dashboard");
    setStep(1); 
    setPg("app");
    showToast(`Welcome, ${userData.name}! 👋`);
  }

  function logout() {
    localStorage.removeItem('bm_token');
    localStorage.removeItem('bm_user');
    setUser(null);
    setPg("auth");
  }

  /* ── TICKET CREATION ── */
  function addPref(p){ if(tf.prefs.includes(p)) return; if(tf.prefs.length>=5){showToast("Max 5","err");return;} setTf(f=>({...f,prefs:[...f.prefs,p]})); }
  function remPref(p){ setTf(f=>({...f,prefs:f.prefs.filter(x=>x!==p)})); }

  function validateStep(){
    const e={};
    if(step===1){
      if(!tf.name.trim()) e.name="Required";
      const r=parseInt(tf.rank);
      if(!tf.rank||isNaN(r)||r<1||r>50000) e.rank="Valid rank 1–50000";
      if(!tf.branch) e.branch="Select branch";
    }
    if(step===2&&tf.prefs.length===0) e.prefs="Select at least 1";
    if(step===3&&tf.note.length>300) e.note="Max 300 chars";
    setTe(e); return Object.keys(e).length===0;
  }

  function nextStep(){ if(!validateStep()) return; if(step<3) setStep(s=>s+1); else setPrev(true); }

  async function publish(){
    setBusy(true);
    try{
      const res=await apiPost("/tickets",{name:tf.name.trim(),rank:parseInt(tf.rank),branch:tf.branch,roommates:tf.rm,preferences:tf.prefs,note:tf.note});
      setMyTicket(res.data.ticket||res.data);
      setPrev(false); setStep(1); setView("dashboard");
      apiGet("/tickets").then(r=>setTickets(r.data)).catch(()=>{});
      showToast("🎫 Ticket is live!");
    }catch(e){ showToast(e?.response?.data?.error||"Failed","err"); }
    finally{ setBusy(false); }
  }

  async function deleteTicket(){
    if(!window.confirm("Delete your ticket?")) return;
    try{ await apiDel("/tickets/mine"); setMyTicket(null); showToast("Deleted","info"); }
    catch(e){ showToast(e?.response?.data?.error||"Failed","err"); }
  }

  /* ── REQUESTS ── */
  async function sendRequest(t){
    if(sent.some(r=>r.ticketId===t._id)){showToast("Already sent","err");return;}
    try{
      await apiPost("/requests",{ticketId:t._id});
      setSent(p=>[...p,{ticketId:t._id, status: 'pending', ticket: t}]);
      showToast(`Sent to ${t.name}! 📨`); setSel(null);
    }catch(e){ showToast(e?.response?.data?.error||"Failed","err"); }
  }

  async function acceptReq(r){ 
    try {
      await apiPatch(`/requests/${r._id}`, { action: 'accept' });
      setMatches(p=>[...p, r]); 
      setInbox(p=>p.filter(x=>x._id!==r._id)); 
      showToast(`🎉 Matched with ${r.name}!`); 
    } catch(e) { showToast("Failed to accept", "err"); }
  }

  async function declineReq(r){ 
    try {
      await apiPatch(`/requests/${r._id}`, { action: 'decline' });
      setInbox(p=>p.filter(x=>x._id!==r._id)); 
      showToast("Declined", "info"); 
    } catch(e) { showToast("Failed to decline", "err"); }
  }

  const openChat = (partner) => {
    const cid = `c_${partner.userId}`;
    setAchat({ cid, partner }); 
    setView("chat");
    setSel(null);
  };

  async function sendMsg() {
    if(!cmsg.trim() || !achat) return;
    const cid = achat.cid;
    const text = cmsg.trim();
    const partnerId = achat.partner.userId;
    
    setChats(p => {
      const ch = p[cid] || { partner: achat.partner, messages: [] };
      return { ...p, [cid]: { ...ch, messages: [...ch.messages, {from:"me", text}] } };
    });
    setCmsg("");

    try {
      await apiPost(`/chats/${partnerId}`, { text });
    } catch (e) {
      showToast("Failed to send message", "err");
    }
  }

  const filtered = tickets.filter(t=>{
    if(t.userId?.toString()===user?.id) return false;
    if(filt.branch&&t.branch!==filt.branch) return false;
    if(filt.rm&&t.roommates!==parseInt(filt.rm)) return false;
    if(filt.r0&&t.rank<parseInt(filt.r0)) return false;
    if(filt.r1&&t.rank>parseInt(filt.r1)) return false;
    return true;
  });

  /* ════════════════ RENDER: AUTH / VERIFY ════════════════ */
  if(pg==="auth" || pg==="verify") return(
    <div style={{...appStyle,display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
      <style>{CSS}</style>
      <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 20% 30%,${PINK}15 0%,transparent 55%)`,pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:"420px",position:"relative",zIndex:2}}>
        <button onClick={onBack} style={{background:"transparent",border:"none",color:"rgba(255,255,255,0.3)",fontFamily:"inherit",fontSize:"0.65rem",cursor:"pointer",marginBottom:"1.5rem"}}>← Back</button>
        <div style={{fontSize:"0.55rem",letterSpacing:"0.4em",color:PINK,marginBottom:"0.5rem"}}>BUDDY MATE</div>
        <h2 style={{fontFamily:"'Bebas Neue',monospace",fontSize:"2.2rem",letterSpacing:"0.08em",marginBottom:"1.5rem"}}>
          {pg==="verify" ? "Verify Email" : mode==="login"?"Welcome Back":"Join BUDDY MATE"}
        </h2>
        
        {pg === "verify" ? (
          <div style={cardBase}>
            <p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.5)", lineHeight:1.7, marginBottom:"1.5rem" }}>Enter the 6-digit OTP sent to <span style={{color:CYAN}}>{form.email}</span></p>
            <input style={{...inp(false), textAlign:"center", fontSize:"1.2rem", letterSpacing:"0.5em", fontWeight:"bold"}} value={form.otp} onChange={e=>setForm(f=>({...f,otp:e.target.value.replace(/\D/,"").slice(0,6)}))} placeholder="000000" className="vi"/>
            <button style={{...btn(`linear-gradient(135deg,${PINK},${PURPLE})`,PINK),width:"100%",marginTop:"1.25rem"}} onClick={handleVerifyOTP} disabled={busy}>
              {busy ? "Verifying..." : "Verify & Continue →"}
            </button>
            <p style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.25)",textAlign:"center",marginTop:"1rem"}}>
              <span style={{color:PINK,cursor:"pointer"}} onClick={()=>setPg("auth")}>← Back to Signup</span>
            </p>
          </div>
        ) : (
          <div style={cardBase}>
            {mode==="signup"&&(
              <div style={{marginBottom:"1rem"}}>
                <label style={lbl}>Full Name</label>
                <input style={inp(ae.name)} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Rahul Sharma" className="vi"/>
                {ae.name&&<div style={err}>{ae.name}</div>}
              </div>
            )}
            <label style={lbl}>VIT Email</label>
            <input style={inp(ae.email)} value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="you@vitstudent.ac.in" className="vi"/>
            {ae.email&&<div style={err}>{ae.email}</div>}
            
            <div style={{marginTop:"1rem"}}>
              <label style={lbl}>Password</label>
              <input type="password" style={inp(ae.pw)} value={form.pw} onChange={e=>setForm(f=>({...f,pw:e.target.value}))} placeholder="Min 8 chars, 1 num, 1 special char" className="vi"/>
              {ae.pw&&<div style={err}>{ae.pw}</div>}
            </div>

            {mode==="signup"&&(
              <div style={{marginTop:"1rem"}}>
                <label style={lbl}>Confirm Password</label>
                <input type="password" style={inp(ae.pw2)} value={form.pw2} onChange={e=>setForm(f=>({...f,pw2:e.target.value}))} placeholder="Repeat password" className="vi"/>
                {ae.pw2&&<div style={err}>{ae.pw2}</div>}
              </div>
            )}
            
            {/* FIXED: This button now triggers the secure backend flow! */}
            <button style={{...btn(`linear-gradient(135deg,${PINK},${PURPLE})`,PINK),width:"100%",marginTop:"1.5rem"}} onClick={handleAuthAction} disabled={busy}>
              {busy ? "Loading..." : mode==="login"?"Log In →":"Send OTP →"}
            </button>
            <p style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.25)",textAlign:"center",marginTop:"1.25rem"}}>
              {mode==="login"?"No account? ":"Have an account? "}
              <span style={{color:PINK,cursor:"pointer"}} onClick={()=>{setMode(m=>m==="login"?"signup":"login");setAe({});}}>
                {mode==="login"?"Sign up":"Log in"}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );

  /* ════════════════ RENDER: APP ════════════════ */
  const NAV=[
    {id:"dashboard",icon:"⬡",label:"Home"},
    {id:"browse",   icon:"◈",label:"Browse"},
    {id:"create",   icon:"✦",label:myTicket?"My Ticket":"Create"},
    {id:"requests", icon:"◎",label:"Inbox",  badge:inbox.length},
    {id:"chat",     icon:"◇",label:"Chats",  badge:matches.length},
  ];

  return(
    <div style={appStyle}>
      <style>{CSS}</style>

      {/* TOAST */}
      {toast&&<div style={{position:"fixed",top:"1.25rem",left:"50%",transform:"translateX(-50%)",zIndex:999,padding:"0.75rem 1.5rem",background:toast.type==="err"?"rgba(200,40,40,0.96)":toast.type==="info"?"rgba(43,134,197,0.96)":"rgba(10,0,25,0.97)",border:`1px solid ${toast.type==="err"?"#ff6b6b":toast.type==="info"?CYAN:PINK}`,fontSize:"0.72rem",color:"#fff",backdropFilter:"blur(20px)",whiteSpace:"nowrap",animation:"tin 0.3s ease",borderRadius:"2px"}}>{toast.msg}</div>}

      {/* TICKET MODAL */}
      {sel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}} onClick={()=>setSel(null)}>
          <div style={{...cardBase,maxWidth:"440px",width:"100%",border:`1px solid ${avColor(sel.name)}40`,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setSel(null)} style={{position:"absolute",top:"0.75rem",right:"0.75rem",background:"transparent",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:"1.2rem"}}>×</button>
            <div style={{display:"flex",gap:"1rem",marginBottom:"1.25rem"}}>
              <div style={{width:"52px",height:"52px",borderRadius:"2px",background:`linear-gradient(135deg,${avColor(sel.name)},${avColor(sel.name)}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",fontSize:"1rem",flexShrink:0}}>{avText(sel.name)}</div>
              <div>
                <div style={{fontWeight:"bold",fontSize:"1rem"}}>{sel.name}</div>
                <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.4)"}}>{sel.branch} · {sel.roommates} roommate{sel.roommates>1?"s":""}</div>
              </div>
            </div>
            {(sel.preferences||[]).length>0&&(
              <div style={{marginBottom:"1rem"}}>
                <div style={{fontSize:"0.58rem",color:"rgba(255,255,255,0.3)",letterSpacing:"0.2em",marginBottom:"0.5rem"}}>PREFERENCES</div>
                {sel.preferences.map((p,i)=>(
                  <div key={p} style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.35rem 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                    <span style={{fontSize:"0.6rem",color:avColor(sel.name),fontWeight:"bold",width:"16px"}}>#{i+1}</span>
                    <span style={{fontSize:"0.72rem"}}>{p}</span>
                    {myTicket?.preferences?.includes(p)&&<span style={{marginLeft:"auto",fontSize:"0.58rem",color:GREEN}}>✓ yours</span>}
                  </div>
                ))}
              </div>
            )}
            {sel.note&&<div style={{padding:"0.75rem",background:"rgba(255,255,255,0.03)",borderLeft:`2px solid ${avColor(sel.name)}40`,marginBottom:"1rem"}}><p style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.55)",lineHeight:1.7,margin:0}}>{sel.note}</p></div>}
            {(()=>{
              const demo=!sel._id||sel._id.length!==24;
              const isSent=sent.some(r=>r.ticketId===sel._id);
              const isMatch=matches.some(m=>m.userId===sel.userId);
              if(demo) return <div style={{fontSize:"0.68rem",color:"rgba(255,200,0,0.7)",padding:"0.75rem",background:"rgba(255,200,0,0.06)",border:"1px solid rgba(255,200,0,0.2)",borderRadius:"2px"}}>Demo ticket — not in database.</div>;
              if(isMatch) return <button style={{...btn(`${GREEN}22`,GREEN,GREEN),width:"100%"}} onClick={()=>openChat(matches.find(m=>m.userId===sel.userId))}>Open Chat →</button>;
              if(isSent) return <button style={{...btn("rgba(255,255,255,0.04)","rgba(255,255,255,0.1)","rgba(255,255,255,0.3)"),width:"100%"}} disabled>⏳ Pending</button>;
              return <button style={{...btn(`linear-gradient(135deg,${PINK},${PURPLE})`,PINK),width:"100%"}} onClick={()=>sendRequest(sel)}>Send Request →</button>;
            })()}
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {prev&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.87)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
          <div style={{...cardBase,maxWidth:"420px",width:"100%",border:`1px solid ${PINK}40`,maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{fontSize:"0.55rem",letterSpacing:"0.35em",color:PINK,marginBottom:"0.5rem"}}>PREVIEW</div>
            <h3 style={{fontFamily:"'Bebas Neue',monospace",fontSize:"1.4rem",marginBottom:"1rem"}}>Your Ticket</h3>
            <div style={{fontWeight:"bold",marginBottom:"0.2rem"}}>{tf.name}</div>
            <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.4)",marginBottom:"1rem"}}>Rank #{tf.rank} · {tf.branch} · {tf.rm} roommate{tf.rm>1?"s":""}</div>
            {tf.prefs.map((p,i)=><div key={p} style={{fontSize:"0.72rem",padding:"0.3rem 0",borderBottom:"1px solid rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.7)"}}>#{i+1} {p}</div>)}
            {tf.note&&<div style={{padding:"0.65rem",background:"rgba(255,255,255,0.03)",borderLeft:`2px solid ${PINK}30`,margin:"1rem 0",fontSize:"0.72rem",color:"rgba(255,255,255,0.5)",lineHeight:1.7}}>{tf.note}</div>}
            <div style={{fontSize:"0.6rem",color:"rgba(255,255,255,0.25)",marginBottom:"1.25rem"}}>🔒 Email hidden until match.</div>
            <div style={{display:"flex",gap:"0.75rem"}}>
              <button style={btn("transparent","rgba(255,255,255,0.1)","rgba(255,255,255,0.5)")} onClick={()=>setPrev(false)}>← Edit</button>
              <button style={{...btn(`linear-gradient(135deg,${PINK},${PURPLE})`,PINK),flex:1}} onClick={publish} disabled={busy}>{busy?"Saving...":"🚀 Go Live!"}</button>
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <div style={{position:"fixed",top:0,left:0,right:0,zIndex:100,backdropFilter:"blur(20px)",background:"rgba(2,0,8,0.9)",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"0.75rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontFamily:"'Bebas Neue',monospace",fontSize:"1.2rem",letterSpacing:"0.12em",background:`linear-gradient(90deg,${PINK},${CYAN})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",cursor:"pointer"}} onClick={onBack}>BUDDY MATE</div>
        <div style={{display:"flex",gap:"0.25rem"}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setView(n.id)} style={{position:"relative",padding:"0.4rem 0.75rem",background:view===n.id?`${PINK}20`:"transparent",border:`1px solid ${view===n.id?`${PINK}40`:"transparent"}`,color:view===n.id?PINK:"rgba(255,255,255,0.35)",fontFamily:"inherit",fontSize:"0.6rem",cursor:"pointer"}}>
              <div style={{fontSize:"0.85rem"}}>{n.icon}</div>
              <div style={{fontSize:"0.5rem"}}>{n.label}</div>
              {n.badge>0&&<div style={{position:"absolute",top:2,right:2,width:"14px",height:"14px",borderRadius:"50%",background:PINK,fontSize:"0.45rem",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold"}}>{n.badge}</div>}
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
          <div style={{width:"28px",height:"28px",borderRadius:"2px",background:`linear-gradient(135deg,${PINK},${PURPLE})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.65rem",fontWeight:"bold"}}>{avText(user?.name||"?")}</div>
          <button style={{padding:"0.3rem 0.65rem",background:"transparent",border:"1px solid rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.25)",fontFamily:"inherit",fontSize:"0.55rem",cursor:"pointer"}} onClick={logout}>logout</button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{paddingTop:"80px",paddingBottom:"2rem"}}>
        {view==="dashboard"&&(
          <div style={{maxWidth:"700px",margin:"0 auto",padding:"1.5rem"}} className="fi">
            <div style={{marginBottom:"1.75rem"}}>
              <div style={{fontSize:"0.58rem",letterSpacing:"0.3em",color:PINK,marginBottom:"0.3rem"}}>WELCOME BACK</div>
              <h1 style={{fontFamily:"'Bebas Neue',monospace",fontSize:"2.2rem"}}>{user?.name} <span style={{color:"rgba(255,255,255,0.2)"}}>·</span> <span style={{color:CYAN,fontSize:"1.4rem"}}>{user?.branch}</span></h1>
            </div>
            {myTicket?(
              <div style={{...cardBase,borderColor:`${PINK}30`,marginBottom:"1.25rem",background:`${PINK}08`}}>
                <div style={{position:"absolute",top:0,right:0,width:"50px",height:"50px",borderTop:`2px solid ${PINK}`,borderRight:`2px solid ${PINK}`,opacity:0.4}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:"0.55rem",color:PINK,letterSpacing:"0.25em",marginBottom:"0.3rem"}}>MY TICKET · ACTIVE</div>
                    <div style={{fontWeight:"bold",fontSize:"0.9rem"}}>{myTicket.name}</div>
                    <div style={{fontSize:"0.62rem",color:"rgba(255,255,255,0.4)"}}>Rank #{myTicket.rank} · {myTicket.branch} · {myTicket.roommates} roommate{myTicket.roommates>1?"s":""}</div>
                  </div>
                  <span style={tag(GREEN)}>● LIVE</span>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem",marginTop:"0.75rem"}}>
                  {(myTicket.preferences||[]).map(p=><span key={p} style={tag(PINK)}>{p}</span>)}
                </div>
                <div style={{display:"flex",gap:"0.75rem",marginTop:"1rem"}}>
                  <button style={btn("transparent",`${PINK}40`,PINK)} onClick={()=>{setTf({name:myTicket.name,rank:myTicket.rank,branch:myTicket.branch,rm:myTicket.roommates,prefs:myTicket.preferences||[],note:myTicket.note||""});setStep(1);setView("create");}}>Edit</button>
                  <button style={btn("transparent","rgba(255,255,255,0.08)","rgba(255,255,255,0.4)")} onClick={()=>setView("browse")}>Browse →</button>
                  <button style={btn("rgba(255,40,40,0.08)","rgba(255,60,60,0.3)","rgba(255,100,100,0.8)")} onClick={deleteTicket}>Delete</button>
                </div>
              </div>
            ):(
              <div style={{...cardBase,borderColor:`${PINK}30`,marginBottom:"1.25rem",background:`${PINK}06`,cursor:"pointer"}} onClick={()=>setView("create")}>
                <div style={{display:"flex",alignItems:"center",gap:"1.25rem"}}>
                  <div style={{width:"48px",height:"48px",border:`1px dashed ${PINK}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",flexShrink:0}}>🎫</div>
                  <div><div style={{fontWeight:"bold",fontSize:"0.85rem",marginBottom:"0.2rem"}}>Create Your Ticket</div><div style={{fontSize:"0.68rem",color:"rgba(255,255,255,0.35)"}}>Set up your profile to start matching</div></div>
                  <span style={{marginLeft:"auto",color:PINK,fontSize:"1.1rem"}}>→</span>
                </div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.75rem",marginBottom:"1.25rem"}}>
              {[{v:filtered.length,l:"Active Tickets",c:CYAN},{v:inbox.length,l:"Requests",c:PINK},{v:matches.length,l:"Matches",c:GREEN}].map(s=>(
                <div key={s.l} style={{...cardBase,textAlign:"center",padding:"1rem"}}>
                  <div style={{fontSize:"1.6rem",fontWeight:"bold",color:s.c,fontFamily:"'Bebas Neue',monospace"}}>{s.v}</div>
                  <div style={{fontSize:"0.58rem",color:"rgba(255,255,255,0.35)"}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:"0.58rem",color:"rgba(255,255,255,0.3)",letterSpacing:"0.25em",marginBottom:"0.75rem"}}>RECENT TICKETS</div>
            {filtered.length===0&&<div style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.2)",padding:"1rem 0"}}>No tickets yet. Be the first!</div>}
            {filtered.slice(0,3).map(t=><TicketCard key={t._id||Math.random()} t={t} sent={sent} matches={matches} onClick={()=>setSel(t)}/>)}
            {filtered.length>3&&<button style={{...btn("transparent","rgba(255,255,255,0.07)","rgba(255,255,255,0.4)"),width:"100%",marginTop:"0.5rem"}} onClick={()=>setView("browse")}>View All →</button>}
          </div>
        )}

        {view==="browse"&&(
          <div style={{maxWidth:"800px",margin:"0 auto",padding:"1.5rem"}} className="fi">
            <div style={{marginBottom:"1.25rem"}}>
              <div style={{fontSize:"0.55rem",letterSpacing:"0.3em",color:CYAN,marginBottom:"0.3rem"}}>DISCOVER</div>
              <h2 style={{fontFamily:"'Bebas Neue',monospace",fontSize:"2rem"}}>Browse Tickets</h2>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:"0.6rem",marginBottom:"1.25rem",padding:"1rem",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
              <div><label style={lbl}>Branch</label>
                <select style={{...inp(false),padding:"0.5rem"}} value={filt.branch} onChange={e=>setFilt(f=>({...f,branch:e.target.value}))}>
                  <option value="">All</option>{BRANCH_LIST.map(b=><option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Roommates</label>
                <select style={{...inp(false),padding:"0.5rem"}} value={filt.rm} onChange={e=>setFilt(f=>({...f,rm:e.target.value}))}>
                  <option value="">Any</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Min Rank</label><input style={{...inp(false),padding:"0.5rem"}} type="number" placeholder="1" value={filt.r0} onChange={e=>setFilt(f=>({...f,r0:e.target.value}))}/></div>
              <div><label style={lbl}>Max Rank</label><input style={{...inp(false),padding:"0.5rem"}} type="number" placeholder="50000" value={filt.r1} onChange={e=>setFilt(f=>({...f,r1:e.target.value}))}/></div>
              <div style={{display:"flex",alignItems:"flex-end"}}><button style={{...btn("transparent","rgba(255,255,255,0.08)","rgba(255,255,255,0.4)"),padding:"0.5rem",width:"100%",fontSize:"0.6rem"}} onClick={()=>setFilt({branch:"",rm:"",r0:"",r1:""})}>Clear</button></div>
            </div>
            <div style={{fontSize:"0.58rem",color:"rgba(255,255,255,0.25)",marginBottom:"0.75rem"}}>{filtered.length} ticket{filtered.length!==1?"s":""} found</div>
            {filtered.length===0?<div style={{textAlign:"center",padding:"3rem",color:"rgba(255,255,255,0.2)"}}>No tickets.</div>
              :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"0.85rem"}}>
                {filtered.map(t=><TicketCard key={t._id||Math.random()} t={t} sent={sent} matches={matches} onClick={()=>setSel(t)}/>)}
              </div>}
          </div>
        )}

        {view==="create"&&(
          <div style={{maxWidth:"560px",margin:"0 auto",padding:"1.5rem"}} className="fi">
            <div style={{marginBottom:"1.5rem"}}>
              <div style={{fontSize:"0.55rem",letterSpacing:"0.3em",color:PINK,marginBottom:"0.3rem"}}>{myTicket?"EDIT":"CREATE"} TICKET</div>
              <h2 style={{fontFamily:"'Bebas Neue',monospace",fontSize:"2rem"}}>Your Roommate Profile</h2>
            </div>
            <div style={{display:"flex",gap:"0.4rem",marginBottom:"1.75rem"}}>
              {[1,2,3].map(n=>(
                <div key={n} style={{flex:1}}>
                  <div style={{height:"3px",background:n<=step?`linear-gradient(90deg,${PINK},${PURPLE})`:"rgba(255,255,255,0.08)",marginBottom:"0.3rem"}}/>
                  <div style={{fontSize:"0.55rem",color:n===step?PINK:"rgba(255,255,255,0.2)",letterSpacing:"0.15em"}}>STEP {n}</div>
                </div>
              ))}
            </div>
            {step===1&&<div className="fi">
              <label style={lbl}>Full Name</label>
              <input style={inp(te.name)} className="vi" value={tf.name} onChange={e=>setTf(f=>({...f,name:e.target.value}))} placeholder="Your full name"/>
              {te.name&&<div style={err}>{te.name}</div>}
              <div style={{marginBottom:"1rem"}}/>
              <label style={lbl}>Counseling Rank</label>
              <input type="number" style={inp(te.rank)} className="vi" value={tf.rank} onChange={e=>setTf(f=>({...f,rank:e.target.value}))} placeholder="e.g. 2450"/>
              {te.rank&&<div style={err}>{te.rank}</div>}
              <div style={{marginBottom:"1rem"}}/>
              <label style={lbl}>Branch</label>
              <select style={inp(te.branch)} value={tf.branch} onChange={e=>setTf(f=>({...f,branch:e.target.value}))}>
                <option value="">Select branch</option>{BRANCH_LIST.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
              {te.branch&&<div style={err}>{te.branch}</div>}
              <div style={{marginBottom:"1rem"}}/>
              <label style={lbl}>Roommates Needed</label>
              <div style={{display:"flex",gap:"0.5rem"}}>
                {[1,2,3,4,5].map(n=><button key={n} onClick={()=>setTf(f=>({...f,rm:n}))} style={{flex:1,padding:"0.65rem",background:tf.rm===n?`${PINK}20`:"rgba(255,255,255,0.03)",border:`1px solid ${tf.rm===n?PINK:"rgba(255,255,255,0.1)"}`,color:tf.rm===n?PINK:"rgba(255,255,255,0.4)",fontFamily:"inherit",fontSize:"0.8rem",cursor:"pointer",fontWeight:"bold"}}>{n}</button>)}
              </div>
            </div>}
            {step===2&&<div className="fi">
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.75rem"}}>
                <label style={{...lbl,marginBottom:0}}>Preferences (1–5)</label>
                <span style={{fontSize:"0.62rem",color:tf.prefs.length>0?GREEN:PINK,fontWeight:"bold"}}>{tf.prefs.length}/5</span>
              </div>
              {tf.prefs.length>0&&(
                <div style={{marginBottom:"1rem",padding:"0.75rem",background:`${PINK}08`,border:`1px solid ${PINK}25`}}>
                  {tf.prefs.map((p,i)=>(
                    <div key={p} style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.3rem 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                      <span style={{fontSize:"0.6rem",color:PINK,width:"16px",fontWeight:"bold"}}>#{i+1}</span>
                      <span style={{fontSize:"0.72rem",flex:1}}>{p}</span>
                      <button onClick={()=>remPref(p)} style={{background:"transparent",border:"none",color:"rgba(255,80,80,0.6)",cursor:"pointer",fontSize:"0.9rem"}}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem"}}>
                {PREFS_LIST.map(p=>{const s=tf.prefs.includes(p);return<button key={p} onClick={()=>s?remPref(p):addPref(p)} style={{padding:"0.4rem 0.7rem",background:s?`${PINK}18`:"rgba(255,255,255,0.03)",border:`1px solid ${s?PINK:"rgba(255,255,255,0.09)"}`,color:s?PINK:"rgba(255,255,255,0.45)",fontFamily:"inherit",fontSize:"0.62rem",cursor:"pointer",borderRadius:"2px"}}>{s?"✓ ":""}{p}</button>;})}
              </div>
              {te.prefs&&<div style={err}>{te.prefs}</div>}
            </div>}
            {step===3&&<div className="fi">
              <label style={lbl}>Optional Note</label>
              <textarea style={{...inp(te.note),minHeight:"120px",resize:"vertical"}} className="vi" value={tf.note} onChange={e=>setTf(f=>({...f,note:e.target.value}))} placeholder="Sleep schedule, habits, interests..." maxLength={300}/>
              <div style={{textAlign:"right",fontSize:"0.6rem",color:tf.note.length>280?"#ff6b6b":"rgba(255,255,255,0.2)"}}>{tf.note.length}/300</div>
              {te.note&&<div style={err}>{te.note}</div>}
              <div style={{marginTop:"1rem",padding:"0.85rem",background:`${CYAN}08`,border:`1px solid ${CYAN}20`,fontSize:"0.65rem",color:"rgba(255,255,255,0.35)",lineHeight:1.7}}>🔒 Email hidden until match accepted.</div>
            </div>}
            <div style={{display:"flex",gap:"0.75rem",marginTop:"1.75rem"}}>
              {step>1&&<button style={btn("transparent","rgba(255,255,255,0.1)","rgba(255,255,255,0.4)")} onClick={()=>setStep(s=>s-1)}>← Back</button>}
              <button style={{...btn(`linear-gradient(135deg,${PINK},${PURPLE})`,PINK),flex:1}} onClick={nextStep}>{step<3?"Continue →":"Preview →"}</button>
            </div>
          </div>
        )}

        {/* ── INBOX ── */}
        {view==="requests"&&(
          <div style={{maxWidth:"600px",margin:"0 auto",padding:"1.5rem"}} className="fi">
            <div style={{marginBottom:"1.5rem"}}>
              <div style={{fontSize:"0.55rem",letterSpacing:"0.3em",color:PINK,marginBottom:"0.3rem"}}>INBOX</div>
              <h2 style={{fontFamily:"'Bebas Neue',monospace",fontSize:"2rem"}}>Roommate Requests</h2>
            </div>
            
            <div style={{fontSize:"0.55rem",letterSpacing:"0.2em",color:"rgba(255,255,255,0.25)",marginBottom:"0.75rem"}}>INCOMING ({inbox.length})</div>
            {inbox.length===0?<div style={{...cardBase,textAlign:"center",padding:"2rem",color:"rgba(255,255,255,0.2)",fontSize:"0.75rem",marginBottom:"1rem"}}>No incoming requests yet.</div>
              :inbox.map(r=>{const ac=avColor(r.name);return(
                <div key={r._id} style={{...cardBase,borderColor:`${PINK}25`,marginBottom:"0.85rem"}}>
                  <div style={{display:"flex",gap:"0.85rem",alignItems:"center"}}>
                    <div style={{width:"44px",height:"44px",borderRadius:"2px",background:`linear-gradient(135deg,${ac},${ac}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",flexShrink:0}}>{avText(r.name)}</div>
                    <div style={{flex:1}}><div style={{fontWeight:"bold"}}>{r.name}</div><div style={{fontSize:"0.62rem",color:"rgba(255,255,255,0.4)"}}>{r.branch} · Rank #{r.rank}</div></div>
                    <div style={{display:"flex",gap:"0.5rem"}}>
                      <button style={{...btn(`${GREEN}20`,GREEN,GREEN),padding:"0.45rem 0.85rem",fontSize:"0.62rem"}} onClick={()=>acceptReq(r)}>Accept</button>
                      <button style={{...btn("rgba(255,80,80,0.08)","rgba(255,80,80,0.3)","rgba(255,107,107,0.7)"),padding:"0.45rem 0.75rem",fontSize:"0.62rem"}} onClick={()=>declineReq(r)}>Decline</button>
                    </div>
                  </div>
                  {r.note && <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.4)",marginTop:"0.5rem",fontStyle:"italic"}}>"{r.note}"</div>}
                </div>
              );})}

            <div style={{fontSize:"0.55rem",letterSpacing:"0.2em",color:"rgba(255,255,255,0.25)",marginTop:"1.5rem",marginBottom:"0.75rem"}}>SENT ({sent.length})</div>
            {sent.length===0?<div style={{...cardBase,textAlign:"center",padding:"1.5rem",color:"rgba(255,255,255,0.2)",fontSize:"0.75rem"}}>No sent requests.</div>
              :sent.map(r=>{
                const tName = r.ticket?.name || "Unknown";
                const ac=avColor(tName);
                const isMatched = r.status === 'accepted';
                const isDeclined = r.status === 'declined';
                return (
                <div key={r._id} style={{...cardBase,borderColor:isMatched?`${GREEN}30`:isDeclined?`${PINK}30`:`${CYAN}15`,marginBottom:"0.75rem"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.85rem"}}>
                    <div style={{width:"36px",height:"36px",borderRadius:"2px",background:`linear-gradient(135deg,${ac},${ac}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",fontWeight:"bold",flexShrink:0}}>{avText(tName)}</div>
                    <div style={{flex:1}}><div style={{fontSize:"0.78rem",fontWeight:"bold"}}>{tName}</div><div style={{fontSize:"0.6rem",color:"rgba(255,255,255,0.35)"}}>{r.ticket?.branch}</div></div>
                    <span style={tag(isMatched?GREEN:isDeclined?PINK:CYAN)}>{isMatched?"✓ Matched":isDeclined?"❌ Declined":"⏳ Pending"}</span>
                  </div>
                </div>
              );})}
          </div>
        )}

        {/* ── CHAT (Matches) ── */}
        {view==="chat"&&(
          <div style={{maxWidth:"700px",margin:"0 auto",padding:"1.5rem"}} className="fi">
            <div style={{marginBottom:"1.25rem"}}>
              <div style={{fontSize:"0.55rem",letterSpacing:"0.3em",color:GREEN,marginBottom:"0.3rem"}}>CHATS</div>
              <h2 style={{fontFamily:"'Bebas Neue',monospace",fontSize:"2rem"}}>Your Matches</h2>
            </div>
            {matches.length===0?<div style={{textAlign:"center",padding:"3rem",color:"rgba(255,255,255,0.2)"}}><div style={{fontSize:"2rem",marginBottom:"0.75rem"}}>💬</div><div>No matches yet.</div></div>:(
              <div style={{display:"grid",gridTemplateColumns:achat?"220px 1fr":"1fr",gap:"1rem"}}>
                <div>{matches.map(m=>{
                  const cid=`c_${m.userId}`;
                  const ch=chats[cid] || { partner: m, messages: [] };
                  const ac=avColor(m.name);
                  const last=ch.messages[ch.messages.length-1];
                  return(
                  <div key={cid} onClick={()=>openChat(m)} style={{...cardBase,cursor:"pointer",marginBottom:"0.5rem",borderColor:achat?.cid===cid?`${GREEN}40`:"rgba(255,255,255,0.07)",background:achat?.cid===cid?"rgba(57,255,20,0.05)":"rgba(255,255,255,0.02)"}}>
                    <div style={{display:"flex",gap:"0.75rem",alignItems:"center"}}>
                      <div style={{width:"36px",height:"36px",background:`linear-gradient(135deg,${ac},${ac}88)`,borderRadius:"2px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",fontSize:"0.7rem",flexShrink:0}}>{avText(m.name)}</div>
                      <div style={{minWidth:0}}><div style={{fontWeight:"bold",fontSize:"0.75rem"}}>{m.name}</div><div style={{fontSize:"0.58rem",color:"rgba(255,255,255,0.3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{last?.text||"Say hi 👋"}</div></div>
                    </div>
                  </div>
                );})}
                </div>
                {achat&&(
                  <div style={{...cardBase,display:"flex",flexDirection:"column",height:"480px",padding:0,overflow:"hidden"}}>
                    <div style={{padding:"0.85rem 1rem",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:"0.75rem"}}>
                      <div style={{width:"32px",height:"32px",borderRadius:"2px",background:`linear-gradient(135deg,${avColor(achat.partner.name)},${avColor(achat.partner.name)}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.65rem",fontWeight:"bold"}}>{avText(achat.partner.name)}</div>
                      <div><div style={{fontWeight:"bold",fontSize:"0.78rem"}}>{achat.partner.name}</div><div style={{fontSize:"0.58rem",color:GREEN}}>● Matched</div></div>
                    </div>
                    <div style={{flex:1,overflowY:"auto",padding:"1rem",display:"flex",flexDirection:"column",gap:"0.6rem"}}>
                      {(()=>{
                        const activeMsgs = chats[achat.cid]?.messages || [];
                        if (activeMsgs.length === 0) return <div style={{textAlign:"center",fontSize:"0.6rem",color:"rgba(255,255,255,0.2)",padding:"0.3rem 0"}}>Chat opened. Send a message to connect!</div>;
                        return activeMsgs.map((m,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:m.from==="me"?"flex-end":"flex-start"}}>
                            <div style={{maxWidth:"70%",padding:"0.6rem 0.85rem",background:m.from==="me"?`linear-gradient(135deg,${PINK}30,${PURPLE}20)`:"rgba(255,255,255,0.06)",border:`1px solid ${m.from==="me"?`${PINK}25`:"rgba(255,255,255,0.08)"}`,fontSize:"0.72rem",lineHeight:1.6,borderRadius:"2px",wordBreak:"break-word"}}>{m.text}</div>
                          </div>
                        ));
                      })()}
                    </div>
                    <div style={{padding:"0.75rem",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",gap:"0.5rem"}}>
                      <input style={{...inp(false),flex:1,marginBottom:0}} className="vi" value={cmsg} onChange={e=>setCmsg(e.target.value)} placeholder="Share your number/socials..." onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
                      <button style={btn(`linear-gradient(135deg,${PINK},${PURPLE})`,PINK)} onClick={sendMsg}>→</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:#FF3CAC;}
  @keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(-12px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
  @keyframes fi{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
  .fi{animation:fi 0.3s ease forwards;}
  .vi:focus{border-color:rgba(255,60,172,0.5)!important;background:rgba(255,255,255,0.06)!important;}
  .tc:hover{background:rgba(255,255,255,0.045)!important;transform:translateY(-1px);}
  select option{background:#05001A;color:#fff;}
`;