import { useState, useEffect, useRef, useCallback } from "react";

// ─── SD-WAN PRODUCT CATALOG ────────────────────────────────────────────────
const SDWAN_CATALOG = [
  { sku: "SDWAN-CPE-T1", name: "Fortinet FortiGate 60F", type: "CPE", tier: "Standard", mrc: 85, nrc: 450, leadDays: 5, stock: 620, reserved: 187, vendor: "Fortinet" },
  { sku: "SDWAN-CPE-T2", name: "Fortinet FortiGate 100F", type: "CPE", tier: "Enhanced", mrc: 145, nrc: 890, leadDays: 7, stock: 340, reserved: 96, vendor: "Fortinet" },
  { sku: "SDWAN-CPE-T3", name: "Fortinet FortiGate 200F", type: "CPE", tier: "Premium", mrc: 285, nrc: 1650, leadDays: 12, stock: 85, reserved: 41, vendor: "Fortinet" },
  { sku: "SDWAN-LIC-STD", name: "SD-WAN Orchestrator License", type: "License", tier: "Standard", mrc: 35, nrc: 0, leadDays: 0, stock: 9999, reserved: 0, vendor: "Fortinet" },
  { sku: "SDWAN-LIC-ADV", name: "SD-WAN Advanced Analytics", type: "License", tier: "Enhanced", mrc: 65, nrc: 0, leadDays: 0, stock: 9999, reserved: 0, vendor: "Fortinet" },
  { sku: "SDWAN-LIC-SASE", name: "SASE Security Bundle", type: "License", tier: "Premium", mrc: 120, nrc: 0, leadDays: 0, stock: 9999, reserved: 0, vendor: "Fortinet" },
  { sku: "SDWAN-SVC-INST", name: "Remote Installation & Config", type: "Service", tier: "Standard", mrc: 0, nrc: 350, leadDays: 3, stock: null, reserved: null, vendor: "Internal" },
  { sku: "SDWAN-SVC-PREM", name: "On-Site Install + Cutover", type: "Service", tier: "Premium", mrc: 0, nrc: 1200, leadDays: 10, stock: null, reserved: null, vendor: "Internal" },
  { sku: "SDWAN-CIR-MPLS", name: "MPLS Underlay 100Mbps", type: "Circuit", tier: "Standard", mrc: 450, nrc: 500, leadDays: 30, stock: null, reserved: null, vendor: "Carrier" },
  { sku: "SDWAN-CIR-DIA", name: "DIA Underlay 500Mbps", type: "Circuit", tier: "Enhanced", mrc: 320, nrc: 250, leadDays: 21, stock: null, reserved: null, vendor: "Carrier" },
  { sku: "SDWAN-CIR-BB", name: "Broadband Backup 200Mbps", type: "Circuit", tier: "Standard", mrc: 89, nrc: 0, leadDays: 14, stock: null, reserved: null, vendor: "Carrier" },
  { sku: "SDWAN-MGD-MON", name: "24x7 Managed SD-WAN NOC", type: "Managed", tier: "Standard", mrc: 120, nrc: 0, leadDays: 0, stock: null, reserved: null, vendor: "Internal" },
  { sku: "SDWAN-MGD-PREM", name: "Premium Managed + SLA 99.99%", type: "Managed", tier: "Premium", mrc: 250, nrc: 0, leadDays: 0, stock: null, reserved: null, vendor: "Internal" },
];

// ─── 500 SITE GENERATOR ─────────────────────────────────────────────────────
const REGIONS = ["Northeast", "Southeast", "Midwest", "Southwest", "West", "Northwest"];
const SITE_TYPES = ["Branch Office", "Regional HQ", "Data Center", "Retail Store", "Warehouse", "Remote Office"];
const STATES = { Northeast: ["NY","NJ","PA","CT","MA"], Southeast: ["FL","GA","NC","SC","VA"], Midwest: ["IL","OH","MI","IN","WI"], Southwest: ["TX","AZ","NM","OK","CO"], West: ["CA","NV","WA","OR","UT"], Northwest: ["WA","OR","MT","ID","WY"] };
const CITIES = { NY:"New York",NJ:"Newark",PA:"Philadelphia",CT:"Hartford",MA:"Boston",FL:"Miami",GA:"Atlanta",NC:"Charlotte",SC:"Charleston",VA:"Richmond",IL:"Chicago",OH:"Columbus",MI:"Detroit",IN:"Indianapolis",WI:"Milwaukee",TX:"Dallas",AZ:"Phoenix",NM:"Albuquerque",OK:"Oklahoma City",CO:"Denver",CA:"Los Angeles",NV:"Las Vegas",WA:"Seattle",OR:"Portland",UT:"Salt Lake City",MT:"Billings",ID:"Boise",WY:"Cheyenne" };
const TIERS = ["Standard","Enhanced","Premium"];

function generateSites(n) {
  const sites = [];
  for (let i = 1; i <= n; i++) {
    const region = REGIONS[i % REGIONS.length];
    const stArr = STATES[region];
    const st = stArr[i % stArr.length];
    const tier = TIERS[i % 10 < 5 ? 0 : i % 10 < 8 ? 1 : 2];
    const stype = SITE_TYPES[i % SITE_TYPES.length];
    const bw = tier === "Standard" ? "100M" : tier === "Enhanced" ? "500M" : "1G";
    const statuses = ["Quoted","Validated","Inventory Reserved","Pending Approval","Approved","Network Handoff","Provisioning","Active"];
    const statusIdx = i <= 40 ? 7 : i <= 90 ? 6 : i <= 150 ? 5 : i <= 220 ? 4 : i <= 310 ? 3 : i <= 400 ? 2 : i <= 460 ? 1 : 0;
    sites.push({
      id: `SITE-${String(i).padStart(4,"0")}`,
      name: `${CITIES[st]} ${stype} ${Math.ceil(i/6)}`,
      region, state: st, type: stype, tier, bandwidth: bw,
      status: statuses[statusIdx],
      mrc: tier === "Standard" ? 779 : tier === "Enhanced" ? 1395 : 2520,
      nrc: tier === "Standard" ? 1300 : tier === "Enhanced" ? 2340 : 4700,
      circuitReady: statusIdx >= 5,
      cpeAssigned: statusIdx >= 3,
      configGenerated: statusIdx >= 6,
    });
  }
  return sites;
}

const SITES = generateSites(500);

// ─── CPQ WORKFLOW ────────────────────────────────────────────────────────────
const CPQ_WORKFLOW = [
  { id: 1, name: "Site Discovery & Intake", desc: "AI agent ingests site list, geocodes addresses, classifies site types, and maps bandwidth requirements from historical usage patterns", icon: "📍", mode: "automated", agent: "Intake Agent", duration: "~2 min / 500 sites" },
  { id: 2, name: "Product Matching", desc: "Rules engine + ML model selects optimal CPE tier, circuit type, and license bundle per site based on bandwidth, location, and SLA requirements", icon: "🧩", mode: "automated", agent: "Catalog Agent", duration: "~30 sec / 500 sites" },
  { id: 3, name: "Pricing & Discount Engine", desc: "AI calculates volume discounts, regional adjustments, and competitive pricing. Applies enterprise discount tiers and generates margin analysis", icon: "💲", mode: "automated", agent: "Pricing Agent", duration: "~15 sec" },
  { id: 4, name: "Inventory Check & Reserve", desc: "Real-time inventory validation across warehouses. Auto-reserves CPE stock, flags shortfalls, and triggers procurement for gaps", icon: "📦", mode: "automated", agent: "Inventory Agent", duration: "~10 sec" },
  { id: 5, name: "Feasibility & Lead Time", desc: "Circuit availability check per site. Calculates install timelines based on carrier SLAs, technician availability, and regional backlog", icon: "📋", mode: "ai-assisted", agent: "Feasibility Agent", duration: "~5 min" },
  { id: 6, name: "Quote Assembly", desc: "AI compiles quote document with site-by-site BOM, pricing summary, T&Cs, SLA commitments, and project timeline. Auto-generates SOW", icon: "📄", mode: "automated", agent: "Document Agent", duration: "~1 min" },
  { id: 7, name: "Approval Routing", desc: "Smart routing to appropriate approvers based on deal size, discount depth, and non-standard terms. AI pre-scores deal risk", icon: "✍️", mode: "ai-assisted", agent: "Approval Agent", duration: "Async" },
  { id: 8, name: "Order Decomposition", desc: "Accepted quote decomposes into CPE orders, circuit orders, license activations, and service tickets. Each routed to fulfillment team", icon: "🔀", mode: "automated", agent: "Decomposition Agent", duration: "~30 sec" },
  { id: 9, name: "Network Handoff", desc: "Pushes validated order package to Network Engineering queue with pre-generated configs, site details, and circuit IDs for provisioning", icon: "🚀", mode: "ai-assisted", agent: "Handoff Agent", duration: "Real-time" },
];

const CPQ_INSIGHTS = [
  { type: "critical", icon: "⚠️", title: "Inventory Shortfall Detected", message: "FortiGate 200F stock at 85 units — quote requires 98 Premium-tier sites. Shortfall of 54 units after existing reservations. Auto-PO drafted for 100 units, 12-day lead time.", action: "Approve PO", ts: "Just now" },
  { type: "success", icon: "✅", title: "Quote QTR-2026-0847 Validated", message: "500-site SD-WAN quote fully validated. Total MRC: $512,850 | Total NRC: $1,024,500 | Blended margin: 42.3%. All inventory reserved. 3 sites need circuit feasibility review.", action: "View Quote", ts: "5 min ago" },
  { type: "warning", icon: "⏱️", title: "Circuit Lead Time Alert", message: "47 sites in Southeast region show 30+ day circuit lead times (MPLS underlay). AI suggests DIA alternative for 31 of these — saves 12 days avg, +$15/mo MRC per site.", action: "Review Alternatives", ts: "8 min ago" },
  { type: "info", icon: "🔀", title: "Order Decomposition Complete", message: "Batch 1 (90 sites, Active status) decomposed into 90 CPE ship orders, 90 circuit activation tickets, and 90 license provisions. Pushed to ServiceNow fulfillment queue.", action: "View Orders", ts: "1 hr ago" },
  { type: "optimization", icon: "💡", title: "Margin Optimization", message: "Pricing Agent identified 23 sites where upgrading from Standard to Enhanced tier increases margin by $45/site/mo due to volume discount breakpoint at 180 Enhanced units.", action: "Apply", ts: "2 hr ago" },
  { type: "info", icon: "🚀", title: "Network Handoff — Batch 2", message: "60 sites (Provisioning status) config packages pushed to Network Engineering. Pre-generated Fortinet configs attached. Estimated activation: 5 business days.", action: "Track", ts: "3 hr ago" },
];

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
const mono = "'JetBrains Mono', monospace";
const sans = "'DM Sans', sans-serif";

function StatusPill({ status }) {
  const m = {
    Quoted:{ bg:"#1e1b4b", c:"#a78bfa" }, Validated:{ bg:"#0c4a6e", c:"#38bdf8" },
    "Inventory Reserved":{ bg:"#164e63", c:"#22d3ee" }, "Pending Approval":{ bg:"#78350f", c:"#fbbf24" },
    Approved:{ bg:"#065f46", c:"#34d399" }, "Network Handoff":{ bg:"#3b0764", c:"#c084fc" },
    Provisioning:{ bg:"#0f766e", c:"#2dd4bf" }, Active:{ bg:"#064e3b", c:"#22c55e" },
  };
  const s = m[status] || { bg:"#334155", c:"#94a3b8" };
  return <span style={{ padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:700, background:s.bg, color:s.c, letterSpacing:0.4, textTransform:"uppercase", whiteSpace:"nowrap" }}>{status}</span>;
}

function TierBadge({ tier }) {
  const c = { Standard:"#3b82f6", Enhanced:"#a855f7", Premium:"#f59e0b" };
  return <span style={{ fontSize:10, fontWeight:700, color:c[tier], fontFamily:mono, letterSpacing:0.5 }}>{tier.toUpperCase()}</span>;
}

function ProgressRing({ value, size=48, stroke=4, color="#3b82f6" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{ transition:"stroke-dashoffset 1s ease" }} />
    </svg>
  );
}

function InsightCard({ insight, index }) {
  const [open, setOpen] = useState(false);
  const bc = { critical:"#ef4444", success:"#22c55e", warning:"#f59e0b", info:"#3b82f6", optimization:"#8b5cf6" };
  return (
    <div onClick={() => setOpen(!open)} style={{
      background:"linear-gradient(135deg,#0f172a,#1e293b)", border:`1px solid ${bc[insight.type]}33`,
      borderLeft:`3px solid ${bc[insight.type]}`, borderRadius:10, padding:"14px 18px", cursor:"pointer",
      transition:"all 0.3s", animation:`slideIn 0.4s ease ${index*0.08}s both`,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ display:"flex", gap:10, flex:1 }}>
          <span style={{ fontSize:20 }}>{insight.icon}</span>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:"#f1f5f9", marginBottom:3, fontFamily:sans }}>{insight.title}</div>
            <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.5, fontFamily:sans }}>{insight.message}</div>
          </div>
        </div>
        <span style={{ fontSize:10, color:"#64748b", whiteSpace:"nowrap", marginLeft:12, fontFamily:mono }}>{insight.ts}</span>
      </div>
      {open && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid #1e293b55" }}>
          <button style={{ background:bc[insight.type], color:"#fff", border:"none", padding:"7px 18px", borderRadius:6, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:sans }}>{insight.action}</button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function AgenticCPQ() {
  const [tab, setTab] = useState("cpq-dashboard");
  const [workflowStep, setWorkflowStep] = useState(0);
  const [siteFilter, setSiteFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sitePage, setSitePage] = useState(0);
  const [invTab, setInvTab] = useState("stock");
  const [chatMsgs, setChatMsgs] = useState([
    { role:"ai", text:"CPQ Agent online. I've processed the 500-site SD-WAN quote request.\n\nSummary:\n• 268 Standard sites | 134 Enhanced | 98 Premium\n• Total MRC: $512,850/mo | Total NRC: $1,024,500\n• Inventory: CPE stock sufficient for Standard & Enhanced. Premium tier short by 54 units — PO drafted.\n• 47 sites flagged for circuit lead time review.\n\nWhat would you like to drill into?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [dtView, setDtView] = useState("topology");
  const [dtSelectedSite, setDtSelectedSite] = useState(null);
  const [gqlQuery, setGqlQuery] = useState(`query NetworkDigitalTwin {
  customer(id: "CUST-ENT-4820") {
    name
    contractId
    sites(status: ACTIVE) {
      id
      name
      region
      sdwanNode {
        cpeModel
        health
        throughput { up down }
        tunnels { id status latencyMs }
      }
      circuits {
        type
        provider
        bandwidth
        status
        sla { target actual }
      }
    }
    networkTopology {
      hubs { id connectedSpokes }
      meshLinks { from to latencyMs }
    }
  }
}`);
  const [gqlResult, setGqlResult] = useState(null);
  const [gqlRunning, setGqlRunning] = useState(false);
  const [whatIfOverrides, setWhatIfOverrides] = useState({});
  const [whatIfActive, setWhatIfActive] = useState(false);
  const [showHotOnly, setShowHotOnly] = useState(false);
  const [whatIfLog, setWhatIfLog] = useState([]);
  const [graphView, setGraphView] = useState("topology");
  const [selectedGraphNode, setSelectedGraphNode] = useState(null);
  const [mcpEndpoints, setMcpEndpoints] = useState([
    { id:"mcp-1", name:"ServiceNow ITSM", url:"mcp://servicenow.prod/v2", status:"connected", proto:"SSE", tools:12, lastSync:"2 min ago" },
    { id:"mcp-2", name:"Fortinet FortiManager", url:"mcp://fortimanager.prod/v1", status:"connected", proto:"Streamable HTTP", tools:8, lastSync:"30 sec ago" },
    { id:"mcp-3", name:"Salesforce CPQ", url:"mcp://sfdc-cpq.prod/v1", status:"connected", proto:"SSE", tools:15, lastSync:"1 min ago" },
    { id:"mcp-4", name:"SAP ERP Procurement", url:"mcp://sap-erp.prod/v1", status:"connected", proto:"SSE", tools:6, lastSync:"5 min ago" },
    { id:"mcp-5", name:"AT&T Circuit Portal", url:"mcp://att-circuits.carrier/v1", status:"connected", proto:"Streamable HTTP", tools:4, lastSync:"3 min ago" },
    { id:"mcp-6", name:"Verizon Circuit Portal", url:"mcp://vz-circuits.carrier/v1", status:"degraded", proto:"Streamable HTTP", tools:4, lastSync:"12 min ago" },
    { id:"mcp-7", name:"MongoDB Atlas Telemetry", url:"mcp://mongo-atlas.prod/v2", status:"connected", proto:"SSE", tools:9, lastSync:"10 sec ago" },
    { id:"mcp-8", name:"PagerDuty Incidents", url:"mcp://pagerduty.prod/v1", status:"connected", proto:"SSE", tools:5, lastSync:"1 min ago" },
  ]);
  const [apiGenSpec, setApiGenSpec] = useState({ platform:"", entity:"", fields:[] });
  const [apiGenResult, setApiGenResult] = useState(null);
  const [agentHubView, setAgentHubView] = useState("catalog");
  const [activeAgents, setActiveAgents] = useState([]);
  const [diagRunning, setDiagRunning] = useState(null);
  const [diagResults, setDiagResults] = useState({});
  const [agentCatFilter, setAgentCatFilter] = useState("All");
  const chatRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setWorkflowStep(p => (p+1) % CPQ_WORKFLOW.length), 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMsgs]);

  // ─── Computed Stats ─────────────────────────
  const statusCounts = {};
  SITES.forEach(s => { statusCounts[s.status] = (statusCounts[s.status]||0) + 1; });
  const tierCounts = { Standard:0, Enhanced:0, Premium:0 };
  SITES.forEach(s => { tierCounts[s.tier]++; });
  const totalMRC = SITES.reduce((a,s) => a+s.mrc, 0);
  const totalNRC = SITES.reduce((a,s) => a+s.nrc, 0);
  const regionCounts = {};
  SITES.forEach(s => { regionCounts[s.region] = (regionCounts[s.region]||0)+1; });

  // Filter sites
  const STATUS_OPTIONS = ["All","Quoted","Validated","Inventory Reserved","Pending Approval","Approved","Network Handoff","Provisioning","Active"];
  const REGION_OPTIONS = ["All",...REGIONS];
  const filtered = SITES.filter(s => {
    return (siteFilter==="All" || s.status===siteFilter) && (regionFilter==="All" || s.region===regionFilter) && (searchTerm==="" || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase()));
  });
  const PAGE_SIZE = 25;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(sitePage*PAGE_SIZE, (sitePage+1)*PAGE_SIZE);

  // Inventory computation
  const invItems = SDWAN_CATALOG.filter(c => c.type === "CPE" || c.type === "License");
  const cpeNeeds = { Standard: tierCounts.Standard, Enhanced: tierCounts.Enhanced, Premium: tierCounts.Premium };

  // Chat handler
  const handleChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMsgs(p => [...p, { role:"user", text:msg }]);
    setTimeout(() => {
      const lc = msg.toLowerCase();
      let resp = "";
      if (lc.includes("pricing") || lc.includes("margin") || lc.includes("discount")) {
        resp = `Pricing Breakdown for 500-Site Quote:\n\n┌─────────────┬───────┬───────────┬───────────┬────────┐\n│ Tier        │ Sites │ MRC/Site  │ NRC/Site  │ Margin │\n├─────────────┼───────┼───────────┼───────────┼────────┤\n│ Standard    │  268  │   $779    │  $1,300   │ 38.5%  │\n│ Enhanced    │  134  │  $1,395   │  $2,340   │ 43.1%  │\n│ Premium     │   98  │  $2,520   │  $4,700   │ 46.8%  │\n└─────────────┴───────┴───────────┴───────────┴────────┘\n\nVolume discount applied: 18% on CPE, 12% on circuits.\nBlended margin: 42.3% — above 40% approval threshold.\n\nPricing Agent notes: 23 Standard sites near the Enhanced breakpoint. Upgrading them adds $45/site/mo margin.`;
      } else if (lc.includes("inventory") || lc.includes("stock") || lc.includes("cpe") || lc.includes("shortfall")) {
        resp = `CPE Inventory Status:\n\n• FortiGate 60F (Standard): 620 in stock, 187 reserved elsewhere → 433 available. Need 268. ✅ Sufficient\n• FortiGate 100F (Enhanced): 340 in stock, 96 reserved → 244 available. Need 134. ✅ Sufficient\n• FortiGate 200F (Premium): 85 in stock, 41 reserved → 44 available. Need 98. ❌ Shortfall: 54 units\n\nAuto-PO for 100x FortiGate 200F has been drafted:\n• Vendor: Fortinet\n• Unit cost: $1,485 (volume rate)\n• Lead time: 12 business days\n• Est. delivery: Mar 24, 2026\n\nShall I route the PO for approval?`;
      } else if (lc.includes("circuit") || lc.includes("lead time") || lc.includes("feasib")) {
        resp = `Circuit Feasibility Summary:\n\n• 453 sites: Circuit available, standard lead time (14-21 days) ✅\n• 47 sites: Extended lead time (30+ days) ⚠️\n  — 31 in Southeast (MPLS underlay congestion)\n  — 16 in Southwest (last-mile build required)\n\nAI Recommendation:\n→ 31 Southeast sites: Switch to DIA underlay. Saves 12 days. +$15/mo MRC per site (+$465/mo total). Better throughput.\n→ 16 Southwest sites: Dual broadband interim + MPLS follow-on. Gets sites online in 14 days vs 45.\n\nApply these optimizations?`;
      } else if (lc.includes("handoff") || lc.includes("network") || lc.includes("provision")) {
        resp = `Network Handoff Status:\n\n• Batch 1 — 40 sites (Active) ✅ Complete\n• Batch 2 — 50 sites (Provisioning) 🔄 In progress, 60% complete\n• Batch 3 — 60 sites (Network Handoff) 📋 Config packages generated, awaiting network team pickup\n• Batch 4 — 70 sites (Approved) ⏳ Pending CPE shipment\n• Remaining — 280 sites in earlier pipeline stages\n\nEach handoff package includes:\n→ Fortinet config template (pre-generated)\n→ Circuit ID & carrier contact\n→ Site survey data\n→ SLA parameters\n→ Escalation matrix\n\nNetwork Engineering queue depth: 14 tickets (avg 2-day turnaround).`;
      } else if (lc.includes("timeline") || lc.includes("schedule") || lc.includes("when")) {
        resp = `Projected Deployment Timeline:\n\nWeek 1-2:  Quote finalization + CPE procurement\nWeek 2-3:  Batch 1 installs (90 sites — existing stock)\nWeek 3-5:  Batch 2 installs (130 sites)\nWeek 4-7:  Batch 3 installs (130 sites — pending PO delivery)\nWeek 6-10: Batch 4 installs (103 sites — circuit lead time)\nWeek 8-12: Batch 5 installs (47 sites — extended feasibility)\n\nCritical path: FortiGate 200F delivery (Week 3) and Southeast circuit provisioning (Week 8).\n\nAI projects 85% site activation by Week 8, full deployment by Week 12.`;
      } else {
        resp = `I can help with any aspect of this 500-site SD-WAN quote. Try:\n\n• "Show me pricing and margins"\n• "What's the inventory status?"\n• "Circuit feasibility details"\n• "Network handoff status"\n• "Deployment timeline"\n• Any specific site or region query\n\nWhat would you like to explore?`;
      }
      setChatMsgs(p => [...p, { role:"ai", text:resp }]);
    }, 700);
  };

  const tabs = [
    { id:"cpq-dashboard", label:"CPQ Dashboard", icon:"◉" },
    { id:"site-config", label:"500 Sites", icon:"▤" },
    { id:"inventory", label:"Inventory", icon:"📦" },
    { id:"agentic-workflow", label:"Agentic Workflow", icon:"⟳" },
    { id:"network-handoff", label:"Network Handoff", icon:"🚀" },
    { id:"digital-twin", label:"Digital Twin CX", icon:"🌐" },
    { id:"graph-ontology", label:"Graph Ontology", icon:"◈" },
    { id:"agent-hub", label:"Agent Hub", icon:"⬢" },
    { id:"cpq-agent", label:"CPQ Agent", icon:"⬡" },
  ];

  const kpiStyle = (color, i) => ({
    background:`linear-gradient(135deg,#0f172a,#1e293b)`, border:"1px solid #1e293b",
    borderRadius:12, padding:"18px 20px", animation:`slideIn 0.4s ease ${i*0.06}s both`,
  });

  return (
    <div style={{ minHeight:"100vh", background:"#020617", color:"#e2e8f0", fontFamily:sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes slideIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        @keyframes glow { 0%,100%{box-shadow:0 0 8px #3b82f622}50%{box-shadow:0 0 24px #3b82f644} }
        @keyframes flowPulse { 0%{opacity:.3}50%{opacity:1}100%{opacity:.3} }
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0f172a}::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}
      `}</style>

      {/* ─── HEADER ─────────────────────────────────── */}
      <div style={{ background:"linear-gradient(180deg,#0f172a,#020617)", borderBottom:"1px solid #1e293b", padding:"14px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {/* Prodapt Logo — High-res SVG text rendering */}
          <svg width="130" height="34" viewBox="0 0 130 34" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink:0 }}>
            <text x="0" y="27" style={{ fontFamily:"'DM Sans', Arial, sans-serif", fontSize:"32px", fontWeight:800, fill:"#E42313", letterSpacing:"-0.5px" }}>Prodapt</text>
            <circle cx="122" cy="25" r="4" fill="#E42313" />
          </svg>
          <div style={{ height:28, width:1, background:"#334155" }} />
          <div>
            <div style={{ fontSize:17, fontWeight:800, letterSpacing:-.5, color:"#f8fafc" }}>Agentic CPQ Platform</div>
            <div style={{ fontSize:11, color:"#64748b", fontFamily:mono }}>SD-WAN · 500-Site Enterprise Quote · QTR-2026-0847</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", animation:"pulse 2s ease infinite" }} />
            <span style={{ fontSize:11, color:"#94a3b8", fontFamily:mono }}>9 Agents Active</span>
          </div>
          <div style={{ padding:"5px 12px", borderRadius:6, fontSize:11, fontWeight:600, background:"#f59e0b15", color:"#fbbf24", border:"1px solid #f59e0b33", fontFamily:mono }}>
            MRC $512,850/mo
          </div>
        </div>
      </div>

      {/* ─── TABS ──────────────────────────────────── */}
      <div style={{ display:"flex", gap:0, padding:"0 28px", background:"#0f172a", borderBottom:"1px solid #1e293b", overflowX:"auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSitePage(0); }} style={{
            padding:"12px 18px", background:"none", border:"none",
            borderBottom:tab===t.id ? "2px solid #f59e0b" : "2px solid transparent",
            color:tab===t.id ? "#f1f5f9" : "#64748b", fontSize:12, fontWeight:600,
            cursor:"pointer", fontFamily:sans, display:"flex", alignItems:"center", gap:7,
            transition:"all 0.2s", whiteSpace:"nowrap",
          }}>
            <span style={{ fontSize:13 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:"24px 28px", maxWidth:1360, margin:"0 auto" }}>

        {/* ═══ CPQ DASHBOARD ═══ */}
        {tab === "cpq-dashboard" && (
          <div style={{ animation:"slideIn 0.3s ease" }}>
            {/* KPIs */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:14, marginBottom:24 }}>
              {[
                { label:"Total Sites", val:"500", sub:"Enterprise SD-WAN", color:"#f59e0b" },
                { label:"Monthly MRC", val:`$${(totalMRC).toLocaleString()}`, sub:"Recurring revenue", color:"#22c55e" },
                { label:"Total NRC", val:`$${(totalNRC).toLocaleString()}`, sub:"One-time charges", color:"#3b82f6" },
                { label:"Blended Margin", val:"42.3%", sub:"Above 40% threshold", color:"#a855f7" },
                { label:"Active Sites", val:String(statusCounts["Active"]||0), sub:"Deployed & live", color:"#22c55e" },
                { label:"Pipeline", val:String(500-(statusCounts["Active"]||0)), sub:"In progress", color:"#f59e0b" },
              ].map((k,i) => (
                <div key={i} style={kpiStyle(k.color,i)}>
                  <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase", letterSpacing:1, fontWeight:700, fontFamily:mono }}>{k.label}</div>
                  <div style={{ fontSize:24, fontWeight:800, color:k.color, marginTop:5, fontFamily:mono, letterSpacing:-1 }}>{k.val}</div>
                  <div style={{ fontSize:11, color:"#475569", marginTop:3 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Pipeline + Insights */}
            <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:20, marginBottom:24 }}>
              {/* Pipeline funnel */}
              <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
                <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:16 }}>Quote Pipeline</div>
                {["Quoted","Validated","Inventory Reserved","Pending Approval","Approved","Network Handoff","Provisioning","Active"].map((st,i) => {
                  const ct = statusCounts[st]||0;
                  const pct = (ct/500)*100;
                  const colors = ["#a78bfa","#38bdf8","#22d3ee","#fbbf24","#34d399","#c084fc","#2dd4bf","#22c55e"];
                  return (
                    <div key={st} style={{ marginBottom:12, animation:`slideIn 0.4s ease ${i*0.06}s both` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:11, color:"#94a3b8" }}>{st}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:colors[i], fontFamily:mono }}>{ct}</span>
                      </div>
                      <div style={{ width:"100%", height:6, background:"#0f172a", borderRadius:3, overflow:"hidden" }}>
                        <div style={{ width:`${pct}%`, height:"100%", background:colors[i], borderRadius:3, transition:"width 0.8s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Insights */}
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <span style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono }}>AI Agent Feed</span>
                  <div style={{ flex:1, height:1, background:"#1e293b" }} />
                  <span style={{ fontSize:10, color:"#f59e0b", fontFamily:mono, animation:"pulse 2s ease infinite" }}>● LIVE</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:420, overflowY:"auto" }}>
                  {CPQ_INSIGHTS.map((ins,i) => <InsightCard key={i} insight={ins} index={i} />)}
                </div>
              </div>
            </div>

            {/* Region + Tier breakdown */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
                <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:14 }}>By Region</div>
                {REGIONS.map((r,i) => {
                  const ct = regionCounts[r]||0;
                  return (
                    <div key={r} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                      <span style={{ fontSize:12, color:"#94a3b8", width:90 }}>{r}</span>
                      <div style={{ flex:1, height:8, background:"#0f172a", borderRadius:4, overflow:"hidden" }}>
                        <div style={{ width:`${(ct/500)*100}%`, height:"100%", background:`hsl(${200+i*25},70%,55%)`, borderRadius:4 }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:"#e2e8f0", fontFamily:mono, width:30, textAlign:"right" }}>{ct}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
                <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:14 }}>By Tier</div>
                {TIERS.map((t,i) => {
                  const ct = tierCounts[t];
                  const cols = ["#3b82f6","#a855f7","#f59e0b"];
                  const mrcs = [779,1395,2520];
                  return (
                    <div key={t} style={{ background:"#0f172a55", borderRadius:10, padding:16, marginBottom:i<2?12:0, border:`1px solid ${cols[i]}22` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <div><TierBadge tier={t} /><span style={{ fontSize:13, fontWeight:700, color:"#f1f5f9", marginLeft:10 }}>{ct} sites</span></div>
                        <span style={{ fontSize:12, fontFamily:mono, color:cols[i] }}>${mrcs[i]}/mo each</span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#64748b" }}>
                        <span>Subtotal MRC: ${(ct*mrcs[i]).toLocaleString()}/mo</span>
                        <span>{((ct/500)*100).toFixed(0)}% of sites</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ 500 SITES ═══ */}
        {tab === "site-config" && (
          <div style={{ animation:"slideIn 0.3s ease" }}>
            <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
              <input placeholder="Search sites..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setSitePage(0); }}
                style={{ background:"#0f172a", border:"1px solid #334155", borderRadius:8, padding:"9px 14px", color:"#e2e8f0", fontSize:13, width:220, outline:"none", fontFamily:sans }} />
              <select value={siteFilter} onChange={e => { setSiteFilter(e.target.value); setSitePage(0); }}
                style={{ background:"#0f172a", border:"1px solid #334155", borderRadius:8, padding:"8px 12px", color:"#e2e8f0", fontSize:12, outline:"none", fontFamily:sans }}>
                {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o === "All" ? "All Statuses" : o}</option>)}
              </select>
              <select value={regionFilter} onChange={e => { setRegionFilter(e.target.value); setSitePage(0); }}
                style={{ background:"#0f172a", border:"1px solid #334155", borderRadius:8, padding:"8px 12px", color:"#e2e8f0", fontSize:12, outline:"none", fontFamily:sans }}>
                {REGION_OPTIONS.map(o => <option key={o} value={o}>{o === "All" ? "All Regions" : o}</option>)}
              </select>
              <span style={{ fontSize:12, color:"#64748b", fontFamily:mono, marginLeft:"auto" }}>{filtered.length} sites</span>
            </div>

            <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:12, overflow:"hidden" }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid #1e293b" }}>
                      {["Site ID","Name","Region","Type","Tier","BW","MRC","NRC","CPE","Config","Circuit","Status"].map(h => (
                        <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:9, textTransform:"uppercase", letterSpacing:1, color:"#64748b", fontWeight:700, fontFamily:mono, whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((s,i) => (
                      <tr key={s.id} style={{ borderBottom:"1px solid #1e293b11", animation:`slideIn 0.25s ease ${i*0.02}s both` }}
                        onMouseEnter={e => e.currentTarget.style.background="#1e293b33"}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                        <td style={{ padding:"10px 14px", fontFamily:mono, fontSize:10, color:"#94a3b8" }}>{s.id}</td>
                        <td style={{ padding:"10px 14px", fontWeight:600, color:"#f1f5f9", fontSize:12 }}>{s.name}</td>
                        <td style={{ padding:"10px 14px", color:"#94a3b8" }}>{s.region}</td>
                        <td style={{ padding:"10px 14px", color:"#94a3b8", fontSize:11 }}>{s.type}</td>
                        <td style={{ padding:"10px 14px" }}><TierBadge tier={s.tier} /></td>
                        <td style={{ padding:"10px 14px", fontFamily:mono, fontSize:11, color:"#e2e8f0" }}>{s.bandwidth}</td>
                        <td style={{ padding:"10px 14px", fontFamily:mono, fontSize:11, color:"#22c55e" }}>${s.mrc}</td>
                        <td style={{ padding:"10px 14px", fontFamily:mono, fontSize:11, color:"#38bdf8" }}>${s.nrc.toLocaleString()}</td>
                        <td style={{ padding:"10px 14px", fontSize:14 }}>{s.cpeAssigned ? "✅" : "⏳"}</td>
                        <td style={{ padding:"10px 14px", fontSize:14 }}>{s.configGenerated ? "✅" : "⏳"}</td>
                        <td style={{ padding:"10px 14px", fontSize:14 }}>{s.circuitReady ? "✅" : "⏳"}</td>
                        <td style={{ padding:"10px 14px" }}><StatusPill status={s.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderTop:"1px solid #1e293b" }}>
                <span style={{ fontSize:11, color:"#64748b", fontFamily:mono }}>Page {sitePage+1} of {totalPages}</span>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={() => setSitePage(Math.max(0,sitePage-1))} disabled={sitePage===0}
                    style={{ padding:"6px 14px", borderRadius:6, fontSize:11, fontWeight:600, background:sitePage===0?"#0f172a":"#1e293b", color:sitePage===0?"#334155":"#e2e8f0", border:"1px solid #334155", cursor:sitePage===0?"default":"pointer", fontFamily:sans }}>Prev</button>
                  <button onClick={() => setSitePage(Math.min(totalPages-1,sitePage+1))} disabled={sitePage>=totalPages-1}
                    style={{ padding:"6px 14px", borderRadius:6, fontSize:11, fontWeight:600, background:sitePage>=totalPages-1?"#0f172a":"#1e293b", color:sitePage>=totalPages-1?"#334155":"#e2e8f0", border:"1px solid #334155", cursor:sitePage>=totalPages-1?"default":"pointer", fontFamily:sans }}>Next</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ INVENTORY ═══ */}
        {tab === "inventory" && (
          <div style={{ animation:"slideIn 0.3s ease" }}>
            <div style={{ display:"flex", gap:4, marginBottom:20 }}>
              {["stock","catalog","reservations"].map(t => (
                <button key={t} onClick={() => setInvTab(t)} style={{
                  padding:"8px 18px", borderRadius:8, fontSize:12, fontWeight:600, textTransform:"capitalize",
                  background:invTab===t?"#f59e0b":"#0f172a", color:invTab===t?"#000":"#64748b",
                  border:invTab===t?"1px solid #f59e0b":"1px solid #1e293b", cursor:"pointer", fontFamily:sans,
                }}>{t}</button>
              ))}
            </div>

            {invTab === "stock" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
                {SDWAN_CATALOG.filter(c => c.type==="CPE").map((item,i) => {
                  const tierKey = item.tier;
                  const needed = cpeNeeds[tierKey];
                  const avail = item.stock - item.reserved;
                  const sufficient = avail >= needed;
                  return (
                    <div key={item.sku} style={{
                      background:"linear-gradient(135deg,#0f172a,#1e293b)", border:`1px solid ${sufficient?"#1e293b":"#ef444444"}`,
                      borderRadius:12, padding:22, animation:`slideIn 0.4s ease ${i*0.1}s both`,
                    }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                        <div>
                          <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>{item.name}</div>
                          <div style={{ fontSize:11, color:"#64748b", fontFamily:mono, marginTop:2 }}>{item.sku}</div>
                        </div>
                        <TierBadge tier={item.tier} />
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
                        <div style={{ background:"#0f172a", borderRadius:8, padding:12, textAlign:"center" }}>
                          <div style={{ fontSize:22, fontWeight:800, color:"#3b82f6", fontFamily:mono }}>{item.stock}</div>
                          <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>In Stock</div>
                        </div>
                        <div style={{ background:"#0f172a", borderRadius:8, padding:12, textAlign:"center" }}>
                          <div style={{ fontSize:22, fontWeight:800, color:"#f59e0b", fontFamily:mono }}>{item.reserved}</div>
                          <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>Reserved (Other)</div>
                        </div>
                      </div>
                      <div style={{ background:"#0f172a", borderRadius:8, padding:12, marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
                          <span style={{ color:"#94a3b8" }}>Available for this quote</span>
                          <span style={{ fontWeight:700, color:sufficient?"#22c55e":"#ef4444", fontFamily:mono }}>{avail}</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
                          <span style={{ color:"#94a3b8" }}>Required ({tierKey} sites)</span>
                          <span style={{ fontWeight:700, color:"#e2e8f0", fontFamily:mono }}>{needed}</span>
                        </div>
                        <div style={{ height:1, background:"#1e293b", margin:"8px 0" }} />
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                          <span style={{ color:"#94a3b8" }}>Delta</span>
                          <span style={{ fontWeight:700, color:sufficient?"#22c55e":"#ef4444", fontFamily:mono }}>{sufficient?"✅":"❌"} {avail-needed > 0 ? "+" : ""}{avail-needed}</span>
                        </div>
                      </div>
                      {!sufficient && (
                        <div style={{ background:"#7f1d1d33", border:"1px solid #ef444433", borderRadius:8, padding:10, fontSize:11, color:"#fca5a5" }}>
                          Auto-PO drafted: {needed-avail+50} units · Lead: {item.leadDays} days · <span style={{ color:"#f59e0b", cursor:"pointer", textDecoration:"underline" }}>Approve</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {invTab === "catalog" && (
              <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:12, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid #1e293b" }}>
                      {["SKU","Product","Type","Tier","MRC","NRC","Lead Time","Vendor"].map(h => (
                        <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:9, textTransform:"uppercase", letterSpacing:1, color:"#64748b", fontWeight:700, fontFamily:mono }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SDWAN_CATALOG.map((item,i) => (
                      <tr key={item.sku} style={{ borderBottom:"1px solid #1e293b11", animation:`slideIn 0.25s ease ${i*0.03}s both` }}
                        onMouseEnter={e => e.currentTarget.style.background="#1e293b33"}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                        <td style={{ padding:"10px 14px", fontFamily:mono, fontSize:10, color:"#94a3b8" }}>{item.sku}</td>
                        <td style={{ padding:"10px 14px", fontWeight:600, color:"#f1f5f9" }}>{item.name}</td>
                        <td style={{ padding:"10px 14px", color:"#94a3b8" }}>{item.type}</td>
                        <td style={{ padding:"10px 14px" }}><TierBadge tier={item.tier} /></td>
                        <td style={{ padding:"10px 14px", fontFamily:mono, color:item.mrc?"#22c55e":"#334155" }}>{item.mrc ? `$${item.mrc}` : "—"}</td>
                        <td style={{ padding:"10px 14px", fontFamily:mono, color:item.nrc?"#38bdf8":"#334155" }}>{item.nrc ? `$${item.nrc}` : "—"}</td>
                        <td style={{ padding:"10px 14px", fontFamily:mono, fontSize:11, color:"#e2e8f0" }}>{item.leadDays ? `${item.leadDays}d` : "Instant"}</td>
                        <td style={{ padding:"10px 14px", color:"#94a3b8" }}>{item.vendor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {invTab === "reservations" && (
              <div>
                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:22, marginBottom:16 }}>
                  <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:16 }}>Reservation Status for QTR-2026-0847</div>
                  {[
                    { label:"FortiGate 60F → 268 Standard sites", reserved:268, status:"Reserved", color:"#22c55e" },
                    { label:"FortiGate 100F → 134 Enhanced sites", reserved:134, status:"Reserved", color:"#22c55e" },
                    { label:"FortiGate 200F → 98 Premium sites", reserved:44, status:"Partial — PO Pending", color:"#f59e0b" },
                    { label:"SD-WAN Orchestrator License × 500", reserved:500, status:"Provisioned", color:"#22c55e" },
                    { label:"Advanced Analytics License × 134", reserved:134, status:"Provisioned", color:"#22c55e" },
                    { label:"SASE Security Bundle × 98", reserved:98, status:"Provisioned", color:"#22c55e" },
                  ].map((r,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<5?"1px solid #1e293b22":"none" }}>
                      <span style={{ fontSize:12, color:"#e2e8f0" }}>{r.label}</span>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:12, fontWeight:700, fontFamily:mono, color:r.color }}>{r.reserved} units</span>
                        <span style={{ fontSize:10, padding:"3px 10px", borderRadius:12, background:`${r.color}18`, color:r.color, fontWeight:600 }}>{r.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ AGENTIC WORKFLOW ═══ */}
        {tab === "agentic-workflow" && (
          <div style={{ animation:"slideIn 0.3s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:28 }}>
              {/* Workflow Steps */}
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                  <span style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono }}>Agentic CPQ Workflow — 9 Autonomous Stages</span>
                  <div style={{ flex:1, height:1, background:"#1e293b" }} />
                </div>
                {CPQ_WORKFLOW.map((step,i) => {
                  const isActive = i <= workflowStep;
                  const isCurrent = i === workflowStep;
                  const mc = { automated:"#22c55e", "ai-assisted":"#3b82f6", "human-review":"#f59e0b" };
                  const ml = { automated:"Fully Automated", "ai-assisted":"AI-Assisted", "human-review":"Human Review" };
                  return (
                    <div key={step.id} style={{ display:"flex", gap:16, padding:"14px 0", opacity:isActive?1:0.35, transition:"all 0.5s" }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", minWidth:48 }}>
                        <div style={{
                          width:48, height:48, borderRadius:"50%",
                          background:isCurrent ? `${mc[step.mode]}22` : isActive ? "#0f172a" : "#0f172a",
                          border:`2px solid ${isActive?mc[step.mode]:"#334155"}`,
                          display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
                          transition:"all 0.4s", boxShadow:isCurrent?`0 0 20px ${mc[step.mode]}33`:"none",
                        }}>{step.icon}</div>
                        {i < 8 && <div style={{ width:2, height:20, background:isActive?`${mc[step.mode]}44`:"#1e293b", marginTop:4, transition:"all 0.4s" }} />}
                      </div>
                      <div style={{ paddingTop:6, flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div style={{ fontWeight:700, fontSize:14, color:isActive?"#f1f5f9":"#64748b", fontFamily:sans }}>{step.name}</div>
                          <span style={{ fontSize:10, color:"#475569", fontFamily:mono }}>{step.duration}</span>
                        </div>
                        <div style={{ fontSize:12, color:"#64748b", marginTop:3, lineHeight:1.5, fontFamily:sans }}>{step.desc}</div>
                        <div style={{ display:"flex", gap:8, marginTop:8 }}>
                          <span style={{ fontSize:9, fontWeight:700, color:mc[step.mode], background:`${mc[step.mode]}15`, padding:"2px 8px", borderRadius:4, letterSpacing:0.5, textTransform:"uppercase", fontFamily:mono }}>{ml[step.mode]}</span>
                          <span style={{ fontSize:9, fontWeight:600, color:"#94a3b8", background:"#1e293b", padding:"2px 8px", borderRadius:4, fontFamily:mono }}>{step.agent}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right panel — Agent roster + integration */}
              <div>
                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:20, marginBottom:16 }}>
                  <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:14 }}>Agent Roster</div>
                  {CPQ_WORKFLOW.map((s,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:i<8?"1px solid #1e293b22":"none" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:14 }}>{s.icon}</span>
                        <span style={{ fontSize:12, color:"#e2e8f0" }}>{s.agent}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:i<=workflowStep?"#22c55e":"#334155", animation:i===workflowStep?"pulse 1.5s ease infinite":"none" }} />
                        <span style={{ fontSize:10, color:i<=workflowStep?"#22c55e":"#64748b", fontFamily:mono }}>{i<workflowStep?"Done":i===workflowStep?"Running":"Queued"}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
                  <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:14 }}>System Integrations</div>
                  {[
                    { name:"ServiceNow (ITSM/CSM)", status:"Connected", c:"#22c55e" },
                    { name:"Fortinet FortiManager", status:"API Active", c:"#22c55e" },
                    { name:"Carrier Portal (AT&T/Verizon)", status:"Polling", c:"#3b82f6" },
                    { name:"Salesforce CPQ", status:"Synced", c:"#22c55e" },
                    { name:"SAP ERP (Procurement)", status:"Connected", c:"#22c55e" },
                    { name:"Network Engineering Queue", status:"Receiving", c:"#f59e0b" },
                    { name:"TMF Open API (TMF648/622)", status:"Compliant", c:"#22c55e" },
                  ].map((integ,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:i<6?"1px solid #1e293b22":"none" }}>
                      <span style={{ fontSize:11, color:"#94a3b8" }}>{integ.name}</span>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:integ.c }} />
                        <span style={{ fontSize:10, color:integ.c, fontFamily:mono }}>{integ.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ NETWORK HANDOFF ═══ */}
        {tab === "network-handoff" && (
          <div style={{ animation:"slideIn 0.3s ease" }}>
            <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:24, marginBottom:20 }}>
              <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:20 }}>Deployment Batches → Network Engineering</div>
              {[
                { batch:"Batch 1", sites:40, status:"Active", pct:100, color:"#22c55e", detail:"All 40 sites live and monitored" },
                { batch:"Batch 2", sites:50, status:"Provisioning", pct:60, color:"#2dd4bf", detail:"30 of 50 activated, 20 pending carrier turn-up" },
                { batch:"Batch 3", sites:60, status:"Network Handoff", pct:25, color:"#c084fc", detail:"Config packages delivered, network team working" },
                { batch:"Batch 4", sites:70, status:"Approved", pct:0, color:"#34d399", detail:"CPE shipping, awaiting delivery confirmation" },
                { batch:"Batch 5", sites:130, status:"Inv. Reserved", pct:0, color:"#22d3ee", detail:"Pending approval workflow completion" },
                { batch:"Batch 6", sites:150, status:"In Validation", pct:0, color:"#a78bfa", detail:"Circuit feasibility in progress — 47 extended lead times" },
              ].map((b,i) => (
                <div key={i} style={{ marginBottom:16, animation:`slideIn 0.4s ease ${i*0.08}s both` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontWeight:700, fontSize:13, color:"#f1f5f9" }}>{b.batch}</span>
                      <span style={{ fontSize:11, color:"#64748b" }}>· {b.sites} sites</span>
                      <StatusPill status={b.status} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:b.color, fontFamily:mono }}>{b.pct}%</span>
                  </div>
                  <div style={{ width:"100%", height:8, background:"#0f172a", borderRadius:4, overflow:"hidden", marginBottom:4 }}>
                    <div style={{ width:`${b.pct}%`, height:"100%", background:b.color, borderRadius:4, transition:"width 1s ease" }} />
                  </div>
                  <div style={{ fontSize:11, color:"#64748b" }}>{b.detail}</div>
                </div>
              ))}
            </div>

            {/* Handoff Package Contents */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:22 }}>
                <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:14 }}>Handoff Package (per site)</div>
                {[
                  { item:"Fortinet device config (auto-generated)", icon:"📄" },
                  { item:"Circuit ID + carrier provisioning details", icon:"🔗" },
                  { item:"Site survey & contact info", icon:"📍" },
                  { item:"SLA parameters & escalation matrix", icon:"📋" },
                  { item:"WAN topology diagram", icon:"🗺️" },
                  { item:"Cutover runbook (AI-generated)", icon:"📘" },
                  { item:"Rollback procedure", icon:"🔄" },
                ].map((p,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:i<6?"1px solid #1e293b22":"none" }}>
                    <span style={{ fontSize:14 }}>{p.icon}</span>
                    <span style={{ fontSize:12, color:"#e2e8f0" }}>{p.item}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:22 }}>
                <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:14 }}>Network Team Queue</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                  <div style={{ background:"#0f172a", borderRadius:8, padding:14, textAlign:"center" }}>
                    <div style={{ fontSize:28, fontWeight:800, color:"#c084fc", fontFamily:mono }}>60</div>
                    <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>Tickets in Queue</div>
                  </div>
                  <div style={{ background:"#0f172a", borderRadius:8, padding:14, textAlign:"center" }}>
                    <div style={{ fontSize:28, fontWeight:800, color:"#22c55e", fontFamily:mono }}>2.1d</div>
                    <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>Avg Turnaround</div>
                  </div>
                </div>
                <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>
                  The Handoff Agent monitors the Network Engineering queue and auto-escalates tickets exceeding SLA. Pre-generated Fortinet configs reduce manual effort by ~70%. Network team receives complete, validated packages — no back-and-forth with sales.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ DIGITAL TWIN CX DASHBOARD ═══ */}
        {tab === "digital-twin" && (() => {
          // ─── GraphQL simulated data layer ─────────────────
          const activeSites = SITES.filter(s => s.status === "Active" || s.status === "Provisioning" || s.status === "Network Handoff");
          const liveSites = SITES.filter(s => s.status === "Active");
          const provSites = SITES.filter(s => s.status === "Provisioning");

          // Generate live telemetry per site
          const siteMetrics = liveSites.map((s, i) => {
            const seed = (i * 7 + 13) % 100;
            const health = 85 + (seed % 15);
            const uptime = 99.5 + (seed % 50) / 100;
            const latency = 8 + (seed % 35);
            // Designated bandwidth by tier
            const designatedBwMbps = s.tier === "Premium" ? 1000 : s.tier === "Enhanced" ? 500 : 100;
            const baseThroughputDown = s.tier === "Premium" ? 800 + seed*4 : s.tier === "Enhanced" ? 400 + seed*3 : 85 + seed;
            const baseThroughputUp = s.tier === "Premium" ? 450 + seed*3 : s.tier === "Enhanced" ? 200 + seed*2 : 55 + seed;
            // Apply what-if overrides if active
            const override = whatIfOverrides[s.id];
            const effectiveBw = override ? override.newBwMbps : designatedBwMbps;
            const effectiveTier = override ? override.newTier : s.tier;
            const throughputDown = override ? Math.min(baseThroughputDown, override.newBwMbps * 0.85) : baseThroughputDown;
            const throughputUp = override ? Math.min(baseThroughputUp, override.newBwMbps * 0.5) : baseThroughputUp;
            const utilizationDown = Math.round((throughputDown / effectiveBw) * 100);
            const utilizationUp = Math.round((throughputUp / effectiveBw) * 100);
            const isHot = utilizationDown > 70 || utilizationUp > 70;
            const jitter = 0.5 + (seed % 30) / 10;
            const pktLoss = seed > 85 ? 0.12 : seed > 70 ? 0.05 : 0.01;
            const tunnelCount = (effectiveTier === "Premium" ? 4 : effectiveTier === "Enhanced" ? 3 : 2);
            // AI recommendation
            let recommendation = null;
            if (isHot && !override) {
              const nextTier = s.tier === "Standard" ? "Enhanced" : s.tier === "Enhanced" ? "Premium" : null;
              const nextBw = s.tier === "Standard" ? 500 : s.tier === "Enhanced" ? 1000 : null;
              const deltaMrc = s.tier === "Standard" ? 616 : s.tier === "Enhanced" ? 1125 : 0;
              if (nextTier) {
                recommendation = { nextTier, nextBw, deltaMrc, reason: utilizationDown > 70 ? `Download at ${utilizationDown}% capacity` : `Upload at ${utilizationUp}% capacity` };
              }
            }
            return { ...s, health, uptime, latency, throughputUp, throughputDown, jitter, pktLoss, tunnelCount,
              designatedBwMbps, effectiveBw, effectiveTier, utilizationDown, utilizationUp, isHot, recommendation,
              tunnels: Array.from({length: tunnelCount}, (_, ti) => ({
                id: `TUN-${s.id}-${ti+1}`,
                type: ti === 0 ? "MPLS" : ti === 1 ? "DIA" : ti === 2 ? "Broadband" : "LTE",
                status: seed > 90 && ti === tunnelCount-1 ? "Degraded" : "Active",
                latency: latency + ti * 5 + (seed % 8),
                bandwidth: ti === 0 ? "100M" : ti === 1 ? "500M" : "200M",
              })),
              alerts: seed > 88 ? [{ level:"warning", msg:`High latency on backup tunnel (${latency+30}ms)` }] :
                      seed > 80 ? [{ level:"info", msg:"Firmware update available" }] : [],
            };
          });

          const hotSites = siteMetrics.filter(s => s.isHot);
          const hotCount = hotSites.length;
          const totalDeltaMrc = hotSites.filter(s => s.recommendation).reduce((a,s) => a + s.recommendation.deltaMrc, 0);
          const whatIfDeltaMrc = Object.values(whatIfOverrides).reduce((a,o) => a + (o.deltaMrc||0), 0);

          const avgHealth = Math.round(siteMetrics.reduce((a,s) => a+s.health, 0) / (siteMetrics.length||1));
          const avgLatency = Math.round(siteMetrics.reduce((a,s) => a+s.latency, 0) / (siteMetrics.length||1));
          const avgUptime = (siteMetrics.reduce((a,s) => a+s.uptime, 0) / (siteMetrics.length||1)).toFixed(2);
          const degradedTunnels = siteMetrics.reduce((a,s) => a + s.tunnels.filter(t => t.status==="Degraded").length, 0);
          const totalTunnels = siteMetrics.reduce((a,s) => a + s.tunnels.length, 0);
          const sitesWithAlerts = siteMetrics.filter(s => s.alerts.length > 0).length;

          // GraphQL runner simulation
          const runGql = () => {
            setGqlRunning(true);
            setTimeout(() => {
              setGqlResult({
                data: {
                  customer: {
                    name: "Meridian Enterprise Corp",
                    contractId: "QTR-2026-0847",
                    totalSites: 500,
                    activeSites: liveSites.length,
                    provisioningSites: provSites.length,
                    networkHealth: avgHealth,
                    avgLatencyMs: avgLatency,
                    slaCompliance: avgUptime + "%",
                    activeTunnels: totalTunnels - degradedTunnels,
                    degradedTunnels,
                    topologyType: "Hub-Spoke with Regional Mesh",
                    hubSites: 6,
                    regions: REGIONS.map(r => ({
                      name: r,
                      sites: liveSites.filter(s => s.region===r).length,
                      avgHealth: Math.round(siteMetrics.filter(s => s.region===r).reduce((a,s) => a+s.health,0) / (siteMetrics.filter(s => s.region===r).length || 1)),
                    })),
                  }
                },
                extensions: { resolverTime: "23ms", cacheHit: "MongoDB → GraphQL federated layer", dataSource: "mongoDB://prod-cluster/sdwan-twin" }
              });
              setGqlRunning(false);
            }, 1200);
          };

          const selectedMetrics = dtSelectedSite ? siteMetrics.find(s => s.id === dtSelectedSite) : null;

          // Region hub coordinates for topology viz
          const hubs = [
            { region:"Northeast", x:75, y:22, color:"#3b82f6" },
            { region:"Southeast", x:68, y:52, color:"#22c55e" },
            { region:"Midwest", x:48, y:28, color:"#a855f7" },
            { region:"Southwest", x:38, y:55, color:"#f59e0b" },
            { region:"West", x:15, y:35, color:"#ef4444" },
            { region:"Northwest", x:15, y:15, color:"#06b6d4" },
          ];

          return (
          <div style={{ animation:"slideIn 0.3s ease" }}>
            {/* Sub-nav */}
            <div style={{ display:"flex", gap:4, marginBottom:20 }}>
              {[{id:"topology",label:"Network Topology"},{id:"whatif",label:"What-If Modeler"},{id:"telemetry",label:"Live Telemetry"},{id:"graphql",label:"GraphQL Explorer"},{id:"sla",label:"SLA & Compliance"}].map(v => (
                <button key={v.id} onClick={() => setDtView(v.id)} style={{
                  padding:"8px 18px", borderRadius:8, fontSize:12, fontWeight:600,
                  background:dtView===v.id ? "#06b6d4" : "#0f172a", color:dtView===v.id ? "#000" : "#64748b",
                  border:dtView===v.id ? "1px solid #06b6d4" : "1px solid #1e293b", cursor:"pointer", fontFamily:sans,
                }}>{v.label}</button>
              ))}
            </div>

            {/* CX KPIs */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:14, marginBottom:22 }}>
              {[
                { label:"Live Sites", val:String(liveSites.length), sub:"Active & monitored", color:"#22c55e" },
                { label:"Network Health", val:`${avgHealth}%`, sub:"Weighted average", color:avgHealth>=90?"#22c55e":"#f59e0b" },
                { label:"Hot Sites (>70%)", val:String(hotCount), sub:"BW utilization alert", color:hotCount>0?"#ef4444":"#22c55e" },
                { label:"Avg Latency", val:`${avgLatency}ms`, sub:"Across all tunnels", color:avgLatency<30?"#22c55e":"#f59e0b" },
                { label:"Active Tunnels", val:`${totalTunnels-degradedTunnels}/${totalTunnels}`, sub:`${degradedTunnels} degraded`, color:degradedTunnels>5?"#ef4444":"#22c55e" },
                { label:"What-If Δ MRC", val:whatIfDeltaMrc>0?`+$${whatIfDeltaMrc.toLocaleString()}`:"$0", sub:Object.keys(whatIfOverrides).length+" sites modified", color:whatIfDeltaMrc>0?"#f59e0b":"#22c55e" },
              ].map((k,i) => (
                <div key={i} style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:"16px 18px", animation:`slideIn 0.4s ease ${i*0.06}s both` }}>
                  <div style={{ fontSize:9, color:"#64748b", textTransform:"uppercase", letterSpacing:1, fontWeight:700, fontFamily:mono }}>{k.label}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:k.color, marginTop:4, fontFamily:mono, letterSpacing:-1 }}>{k.val}</div>
                  <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* ── TOPOLOGY VIEW (Enhanced with Hot Site Detection) ── */}
            {dtView === "topology" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:20 }}>
                {/* Network Map */}
                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:20, position:"relative", minHeight:440 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono }}>Hub-Spoke Topology · Bandwidth Modeler</div>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <label style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer" }}>
                        <input type="checkbox" checked={showHotOnly} onChange={e => setShowHotOnly(e.target.checked)} style={{ accentColor:"#ef4444" }} />
                        <span style={{ fontSize:10, color:showHotOnly?"#ef4444":"#64748b", fontFamily:mono, fontWeight:600 }}>Hot Sites Only</span>
                      </label>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", animation:"pulse 2s ease infinite" }} />
                        <span style={{ fontSize:10, color:"#22c55e", fontFamily:mono }}>LIVE</span>
                      </div>
                    </div>
                  </div>
                  <svg width="100%" height="340" viewBox="0 0 100 75" style={{ overflow:"visible" }}>
                    {/* Mesh links between hubs */}
                    {hubs.map((h1, i) => hubs.slice(i+1).map((h2, j) => {
                      const dist = Math.sqrt((h1.x-h2.x)**2 + (h1.y-h2.y)**2);
                      if (dist < 45) return (
                        <line key={`${i}-${j}`} x1={h1.x} y1={h1.y} x2={h2.x} y2={h2.y}
                          stroke="#334155" strokeWidth="0.15" strokeDasharray="0.8,0.4" opacity="0.6" />
                      );
                      return null;
                    }))}
                    {/* Spoke sites around each hub — color by utilization */}
                    {hubs.map((hub, hi) => {
                      const regionSites = siteMetrics.filter(s => s.region === hub.region).slice(0, 12);
                      return regionSites.map((site, si) => {
                        if (showHotOnly && !site.isHot) return null;
                        const angle = (si / regionSites.length) * Math.PI * 2;
                        const radius = 6 + (si % 3) * 2.5;
                        const sx = hub.x + Math.cos(angle) * radius;
                        const sy = hub.y + Math.sin(angle) * radius;
                        const isSelected = dtSelectedSite === site.id;
                        const hasOverride = !!whatIfOverrides[site.id];
                        // Color by utilization: >85% red, >70% orange, else green
                        const util = Math.max(site.utilizationDown, site.utilizationUp);
                        const dotColor = hasOverride ? "#06b6d4" : util > 85 ? "#ef4444" : util > 70 ? "#f59e0b" : "#22c55e";
                        const dotR = site.isHot ? (isSelected ? 1.6 : 1.1) : (isSelected ? 1.2 : 0.6);
                        return (
                          <g key={site.id} onClick={() => setDtSelectedSite(isSelected ? null : site.id)} style={{ cursor:"pointer" }}>
                            <line x1={hub.x} y1={hub.y} x2={sx} y2={sy} stroke={site.isHot ? dotColor : hub.color} strokeWidth={site.isHot?"0.2":"0.1"} opacity={site.isHot?0.6:0.3} />
                            {site.isHot && <circle cx={sx} cy={sy} r={dotR+0.8} fill="none" stroke={dotColor} strokeWidth="0.12" opacity="0.4">
                              <animate attributeName="r" from={dotR+0.5} to={dotR+1.5} dur="2s" repeatCount="indefinite" />
                              <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
                            </circle>}
                            <circle cx={sx} cy={sy} r={dotR}
                              fill={dotColor}
                              stroke={isSelected ? "#fff" : hasOverride ? "#06b6d4" : "none"} strokeWidth="0.3" opacity={isSelected ? 1 : 0.85} />
                            {hasOverride && <text x={sx} y={sy-1.8} textAnchor="middle" fill="#06b6d4" fontSize="1.5" fontFamily="JetBrains Mono">↑</text>}
                          </g>
                        );
                      });
                    })}
                    {/* Hub nodes */}
                    {hubs.map((hub, i) => {
                      const regionMetrics = siteMetrics.filter(s => s.region === hub.region);
                      const ct = regionMetrics.length;
                      const regionHot = regionMetrics.filter(s => s.isHot).length;
                      return (
                        <g key={hub.region}>
                          <circle cx={hub.x} cy={hub.y} r="2.5" fill={`${hub.color}33`} stroke={hub.color} strokeWidth="0.3" />
                          <circle cx={hub.x} cy={hub.y} r="1.2" fill={hub.color} />
                          <text x={hub.x} y={hub.y - 4.5} textAnchor="middle" fill="#94a3b8" fontSize="2.2" fontFamily="DM Sans" fontWeight="600">{hub.region}</text>
                          <text x={hub.x} y={hub.y + 5.5} textAnchor="middle" fill="#64748b" fontSize="1.6" fontFamily="JetBrains Mono">{ct} sites</text>
                          {regionHot > 0 && <text x={hub.x} y={hub.y + 7.8} textAnchor="middle" fill="#ef4444" fontSize="1.4" fontFamily="JetBrains Mono" fontWeight="700">{regionHot} hot</text>}
                        </g>
                      );
                    })}
                  </svg>
                  <div style={{ display:"flex", gap:14, justifyContent:"center", marginTop:6 }}>
                    {[{c:"#22c55e",l:"Normal (<70%)"},{c:"#f59e0b",l:"Hot (70-85%)"},{c:"#ef4444",l:"Critical (>85%)"},{c:"#06b6d4",l:"What-If Modified"}].map(lg => (
                      <div key={lg.l} style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <div style={{ width:7, height:7, borderRadius:"50%", background:lg.c }} />
                        <span style={{ fontSize:9, color:"#64748b" }}>{lg.l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Site Detail + Recommendation Panel */}
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:18, flex:1 }}>
                    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:12 }}>
                      {selectedMetrics ? "Site Detail & Utilization" : "Select a Site Node"}
                    </div>
                    {selectedMetrics ? (
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9", marginBottom:2 }}>{selectedMetrics.name}</div>
                        <div style={{ fontSize:10, color:"#64748b", fontFamily:mono, marginBottom:12 }}>{selectedMetrics.id} · {selectedMetrics.region} · <TierBadge tier={selectedMetrics.effectiveTier} /></div>

                        {/* Bandwidth Utilization Gauges */}
                        <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:1, fontWeight:700, color:"#64748b", marginBottom:8, fontFamily:mono }}>
                          Bandwidth Utilization vs Designated {selectedMetrics.effectiveBw}Mbps
                        </div>
                        {[
                          { label:"↓ Download", val:selectedMetrics.throughputDown, util:selectedMetrics.utilizationDown },
                          { label:"↑ Upload", val:selectedMetrics.throughputUp, util:selectedMetrics.utilizationUp },
                        ].map((bw,bi) => (
                          <div key={bi} style={{ marginBottom:10 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <span style={{ fontSize:11, color:"#94a3b8" }}>{bw.label}</span>
                              <span style={{ fontSize:11, fontWeight:700, fontFamily:mono, color:bw.util>85?"#ef4444":bw.util>70?"#f59e0b":"#22c55e" }}>{bw.val} Mbps ({bw.util}%)</span>
                            </div>
                            <div style={{ width:"100%", height:10, background:"#0f172a", borderRadius:5, overflow:"hidden", position:"relative" }}>
                              <div style={{ position:"absolute", left:"70%", top:0, width:1, height:"100%", background:"#f59e0b55", zIndex:1 }} />
                              <div style={{ position:"absolute", left:"85%", top:0, width:1, height:"100%", background:"#ef444455", zIndex:1 }} />
                              <div style={{ width:`${Math.min(bw.util,100)}%`, height:"100%", background:bw.util>85?"#ef4444":bw.util>70?"#f59e0b":"#22c55e", borderRadius:5, transition:"width 0.6s" }} />
                            </div>
                          </div>
                        ))}

                        {/* Quick metrics */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, marginTop:8, marginBottom:10 }}>
                          {[
                            { l:"Health", v:`${selectedMetrics.health}%`, c:selectedMetrics.health>=90?"#22c55e":"#f59e0b" },
                            { l:"Latency", v:`${selectedMetrics.latency}ms`, c:selectedMetrics.latency<25?"#22c55e":"#f59e0b" },
                            { l:"Jitter", v:`${selectedMetrics.jitter}ms`, c:"#a855f7" },
                            { l:"Pkt Loss", v:`${selectedMetrics.pktLoss}%`, c:selectedMetrics.pktLoss>0.1?"#ef4444":"#22c55e" },
                          ].map((m,mi) => (
                            <div key={mi} style={{ background:"#0f172a", borderRadius:6, padding:8, textAlign:"center" }}>
                              <div style={{ fontSize:14, fontWeight:800, color:m.c, fontFamily:mono }}>{m.v}</div>
                              <div style={{ fontSize:8, color:"#64748b", marginTop:1 }}>{m.l}</div>
                            </div>
                          ))}
                        </div>

                        {/* Tunnels */}
                        <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:1, fontWeight:700, color:"#64748b", marginBottom:6, fontFamily:mono }}>Tunnels</div>
                        {selectedMetrics.tunnels.map((t,ti) => (
                          <div key={ti} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:ti<selectedMetrics.tunnels.length-1?"1px solid #1e293b22":"none" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                              <div style={{ width:5, height:5, borderRadius:"50%", background:t.status==="Active"?"#22c55e":"#f59e0b" }} />
                              <span style={{ fontSize:11, color:"#e2e8f0" }}>{t.type}</span>
                            </div>
                            <span style={{ fontSize:10, color:t.latency<30?"#22c55e":"#f59e0b", fontFamily:mono }}>{t.latency}ms</span>
                          </div>
                        ))}

                        {/* AI Recommendation */}
                        {selectedMetrics.recommendation && !whatIfOverrides[selectedMetrics.id] && (
                          <div style={{ marginTop:12, background:"#7f1d1d22", border:"1px solid #ef444433", borderRadius:10, padding:12 }}>
                            <div style={{ fontSize:10, fontWeight:700, color:"#fca5a5", fontFamily:mono, marginBottom:6 }}>⚠ AI UPGRADE RECOMMENDATION</div>
                            <div style={{ fontSize:11, color:"#e2e8f0", lineHeight:1.5, marginBottom:8 }}>
                              {selectedMetrics.recommendation.reason}. Recommend upgrade to <span style={{ color:"#f59e0b", fontWeight:700 }}>{selectedMetrics.recommendation.nextTier}</span> ({selectedMetrics.recommendation.nextBw}Mbps).
                            </div>
                            <div style={{ display:"flex", gap:8 }}>
                              <button onClick={() => {
                                const rec = selectedMetrics.recommendation;
                                setWhatIfOverrides(p => ({...p, [selectedMetrics.id]: { newTier:rec.nextTier, newBwMbps:rec.nextBw, deltaMrc:rec.deltaMrc, siteName:selectedMetrics.name }}));
                                setWhatIfLog(p => [...p, { ts:new Date().toLocaleTimeString(), action:"Applied", site:selectedMetrics.name, from:selectedMetrics.tier, to:rec.nextTier, deltaMrc:rec.deltaMrc }]);
                              }} style={{ background:"#ef4444", color:"#fff", border:"none", padding:"7px 16px", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:sans }}>
                                Apply What-If (+${selectedMetrics.recommendation.deltaMrc}/mo)
                              </button>
                            </div>
                          </div>
                        )}
                        {whatIfOverrides[selectedMetrics.id] && (
                          <div style={{ marginTop:12, background:"#0c4a6e22", border:"1px solid #06b6d433", borderRadius:10, padding:12 }}>
                            <div style={{ fontSize:10, fontWeight:700, color:"#22d3ee", fontFamily:mono, marginBottom:4 }}>✓ WHAT-IF APPLIED</div>
                            <div style={{ fontSize:11, color:"#94a3b8" }}>
                              Upgraded to {whatIfOverrides[selectedMetrics.id].newTier} ({whatIfOverrides[selectedMetrics.id].newBwMbps}Mbps) · +${whatIfOverrides[selectedMetrics.id].deltaMrc}/mo
                            </div>
                            <button onClick={() => {
                              setWhatIfOverrides(p => { const n={...p}; delete n[selectedMetrics.id]; return n; });
                              setWhatIfLog(p => [...p, { ts:new Date().toLocaleTimeString(), action:"Reverted", site:selectedMetrics.name, from:whatIfOverrides[selectedMetrics.id].newTier, to:selectedMetrics.tier, deltaMrc:-whatIfOverrides[selectedMetrics.id].deltaMrc }]);
                            }} style={{ marginTop:8, background:"transparent", color:"#64748b", border:"1px solid #334155", padding:"5px 14px", borderRadius:6, fontSize:10, cursor:"pointer", fontFamily:sans }}>
                              Revert
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ color:"#475569", fontSize:12, lineHeight:1.8, marginTop:10 }}>
                        Click any node to view bandwidth utilization. Nodes colored by utilization — orange/red = running hot (&gt;70% capacity). AI will recommend upgrades.
                      </div>
                    )}
                  </div>

                  {/* Hot Sites Summary Card */}
                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:`1px solid ${hotCount>0?"#ef444433":"#1e293b"}`, borderRadius:12, padding:16 }}>
                    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:hotCount>0?"#ef4444":"#94a3b8", fontFamily:mono, marginBottom:10 }}>
                      🔥 {hotCount} Hot Sites Detected
                    </div>
                    {hotSites.slice(0,5).map((hs,i) => (
                      <div key={i} onClick={() => setDtSelectedSite(hs.id)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:i<Math.min(hotSites.length,5)-1?"1px solid #1e293b22":"none", cursor:"pointer" }}>
                        <span style={{ fontSize:11, color:"#e2e8f0" }}>{hs.name}</span>
                        <span style={{ fontSize:10, fontWeight:700, fontFamily:mono, color:Math.max(hs.utilizationDown,hs.utilizationUp)>85?"#ef4444":"#f59e0b" }}>
                          {Math.max(hs.utilizationDown,hs.utilizationUp)}%
                        </span>
                      </div>
                    ))}
                    {hotCount > 5 && <div style={{ fontSize:10, color:"#64748b", marginTop:6, fontFamily:mono }}>+{hotCount-5} more...</div>}
                  </div>
                </div>
              </div>
            )}

            {/* ── WHAT-IF MODELER VIEW ── */}
            {dtView === "whatif" && (() => {
              const modifiedCount = Object.keys(whatIfOverrides).length;
              return (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:20 }}>
                {/* What-If Scenario Builder */}
                <div>
                  {/* Scenario Summary */}
                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #06b6d433", borderRadius:12, padding:22, marginBottom:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                      <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#06b6d4", fontFamily:mono }}>What-If Scenario Analysis</div>
                      {modifiedCount > 0 && (
                        <button onClick={() => { setWhatIfOverrides({}); setWhatIfLog(p => [...p, { ts:new Date().toLocaleTimeString(), action:"Reset All", site:"—", from:"—", to:"—", deltaMrc:0 }]); }} style={{
                          background:"transparent", border:"1px solid #334155", borderRadius:6, padding:"5px 14px", color:"#64748b", fontSize:10, cursor:"pointer", fontFamily:sans,
                        }}>Reset All</button>
                      )}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                      {[
                        { l:"Sites Modified", v:String(modifiedCount), c:"#06b6d4" },
                        { l:"Current Hot", v:String(hotCount), c:"#ef4444" },
                        { l:"MRC Impact", v:whatIfDeltaMrc>0?`+$${whatIfDeltaMrc.toLocaleString()}`:"$0", c:"#f59e0b" },
                        { l:"Projected Hot After", v:String(hotSites.filter(s => !whatIfOverrides[s.id]).length), c:hotSites.filter(s => !whatIfOverrides[s.id]).length===0?"#22c55e":"#f59e0b" },
                      ].map((k,i) => (
                        <div key={i} style={{ background:"#0f172a", borderRadius:8, padding:12, textAlign:"center" }}>
                          <div style={{ fontSize:22, fontWeight:800, color:k.c, fontFamily:mono }}>{k.v}</div>
                          <div style={{ fontSize:9, color:"#64748b", marginTop:2 }}>{k.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hot Sites Upgrade Table */}
                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, overflow:"hidden" }}>
                    <div style={{ padding:"14px 18px", borderBottom:"1px solid #1e293b", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono }}>Hot Sites — Upgrade Recommendations</span>
                      {hotSites.filter(s => s.recommendation && !whatIfOverrides[s.id]).length > 0 && (
                        <button onClick={() => {
                          const newOverrides = {...whatIfOverrides};
                          const entries = [];
                          hotSites.forEach(s => {
                            if (s.recommendation && !whatIfOverrides[s.id]) {
                              newOverrides[s.id] = { newTier:s.recommendation.nextTier, newBwMbps:s.recommendation.nextBw, deltaMrc:s.recommendation.deltaMrc, siteName:s.name };
                              entries.push({ ts:new Date().toLocaleTimeString(), action:"Bulk Applied", site:s.name, from:s.tier, to:s.recommendation.nextTier, deltaMrc:s.recommendation.deltaMrc });
                            }
                          });
                          setWhatIfOverrides(newOverrides);
                          setWhatIfLog(p => [...p, ...entries]);
                        }} style={{ background:"#ef4444", color:"#fff", border:"none", padding:"6px 16px", borderRadius:6, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:sans }}>
                          Apply All Upgrades (+${totalDeltaMrc.toLocaleString()}/mo)
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight:320, overflowY:"auto" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                        <thead>
                          <tr style={{ borderBottom:"1px solid #1e293b" }}>
                            {["Site","Region","Current Tier","BW","↓ Util","↑ Util","Recommendation","Δ MRC","Action"].map(h => (
                              <th key={h} style={{ padding:"9px 10px", textAlign:"left", fontSize:8, textTransform:"uppercase", letterSpacing:0.8, color:"#64748b", fontWeight:700, fontFamily:mono, whiteSpace:"nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {hotSites.map((site,i) => {
                            const applied = !!whatIfOverrides[site.id];
                            return (
                              <tr key={site.id} style={{ borderBottom:"1px solid #1e293b11", background:applied?"#06b6d408":"transparent" }}
                                onMouseEnter={e => { if(!applied) e.currentTarget.style.background="#1e293b33" }}
                                onMouseLeave={e => { if(!applied) e.currentTarget.style.background="transparent"; else e.currentTarget.style.background="#06b6d408" }}>
                                <td style={{ padding:"8px 10px", fontWeight:600, color:"#f1f5f9", fontSize:11 }}>{site.name}</td>
                                <td style={{ padding:"8px 10px", color:"#94a3b8", fontSize:11 }}>{site.region}</td>
                                <td style={{ padding:"8px 10px" }}><TierBadge tier={applied ? whatIfOverrides[site.id].newTier : site.tier} /></td>
                                <td style={{ padding:"8px 10px", fontFamily:mono, fontSize:10, color:"#e2e8f0" }}>{applied ? whatIfOverrides[site.id].newBwMbps : site.designatedBwMbps}M</td>
                                <td style={{ padding:"8px 10px" }}>
                                  <span style={{ fontSize:10, fontWeight:700, fontFamily:mono, color:site.utilizationDown>85?"#ef4444":site.utilizationDown>70?"#f59e0b":"#22c55e" }}>{site.utilizationDown}%</span>
                                </td>
                                <td style={{ padding:"8px 10px" }}>
                                  <span style={{ fontSize:10, fontWeight:700, fontFamily:mono, color:site.utilizationUp>85?"#ef4444":site.utilizationUp>70?"#f59e0b":"#22c55e" }}>{site.utilizationUp}%</span>
                                </td>
                                <td style={{ padding:"8px 10px", fontSize:10, color:applied?"#22d3ee":"#fca5a5" }}>
                                  {applied ? `✓ ${whatIfOverrides[site.id].newTier} (${whatIfOverrides[site.id].newBwMbps}M)` : site.recommendation ? `→ ${site.recommendation.nextTier} (${site.recommendation.nextBw}M)` : "Max tier"}
                                </td>
                                <td style={{ padding:"8px 10px", fontFamily:mono, fontSize:10, color:"#f59e0b" }}>
                                  {applied ? `+$${whatIfOverrides[site.id].deltaMrc}` : site.recommendation ? `+$${site.recommendation.deltaMrc}` : "—"}
                                </td>
                                <td style={{ padding:"8px 10px" }}>
                                  {applied ? (
                                    <button onClick={() => {
                                      setWhatIfOverrides(p => { const n={...p}; delete n[site.id]; return n; });
                                      setWhatIfLog(p => [...p, { ts:new Date().toLocaleTimeString(), action:"Reverted", site:site.name, from:whatIfOverrides[site.id].newTier, to:site.tier, deltaMrc:-whatIfOverrides[site.id].deltaMrc }]);
                                    }} style={{ background:"transparent", border:"1px solid #334155", borderRadius:4, padding:"3px 10px", color:"#64748b", fontSize:9, cursor:"pointer", fontFamily:sans }}>Revert</button>
                                  ) : site.recommendation ? (
                                    <button onClick={() => {
                                      const rec = site.recommendation;
                                      setWhatIfOverrides(p => ({...p, [site.id]: { newTier:rec.nextTier, newBwMbps:rec.nextBw, deltaMrc:rec.deltaMrc, siteName:site.name }}));
                                      setWhatIfLog(p => [...p, { ts:new Date().toLocaleTimeString(), action:"Applied", site:site.name, from:site.tier, to:rec.nextTier, deltaMrc:rec.deltaMrc }]);
                                    }} style={{ background:"#f59e0b", color:"#000", border:"none", borderRadius:4, padding:"3px 10px", fontSize:9, fontWeight:700, cursor:"pointer", fontFamily:sans }}>Apply</button>
                                  ) : <span style={{ fontSize:9, color:"#334155" }}>—</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {hotSites.length === 0 && <div style={{ padding:30, textAlign:"center", color:"#475569", fontSize:12 }}>No hot sites detected. All sites within 70% bandwidth threshold.</div>}
                    </div>
                  </div>
                </div>

                {/* Right Panel — Scenario Log + Impact */}
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {/* Financial Impact */}
                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #f59e0b22", borderRadius:12, padding:18 }}>
                    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#f59e0b", fontFamily:mono, marginBottom:14 }}>Financial Impact Analysis</div>
                    {[
                      { l:"Current Total MRC", v:`$${SITES.reduce((a,s)=>a+s.mrc,0).toLocaleString()}/mo`, c:"#e2e8f0" },
                      { l:"What-If Δ MRC", v:whatIfDeltaMrc>0?`+$${whatIfDeltaMrc.toLocaleString()}/mo`:"$0/mo", c:"#f59e0b" },
                      { l:"Projected MRC", v:`$${(SITES.reduce((a,s)=>a+s.mrc,0)+whatIfDeltaMrc).toLocaleString()}/mo`, c:"#22c55e" },
                      { l:"Annual Impact", v:whatIfDeltaMrc>0?`+$${(whatIfDeltaMrc*12).toLocaleString()}/yr`:"$0/yr", c:"#3b82f6" },
                      { l:"Sites Remediated", v:`${modifiedCount} of ${hotCount}`, c:"#06b6d4" },
                      { l:"Remaining Hot", v:String(hotSites.filter(s=>!whatIfOverrides[s.id]).length), c:hotSites.filter(s=>!whatIfOverrides[s.id]).length===0?"#22c55e":"#ef4444" },
                    ].map((row,i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:i<5?"1px solid #1e293b22":"none" }}>
                        <span style={{ fontSize:11, color:"#94a3b8" }}>{row.l}</span>
                        <span style={{ fontSize:12, fontWeight:700, fontFamily:mono, color:row.c }}>{row.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Upgrade Mix Breakdown */}
                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:18 }}>
                    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:12 }}>Tier Migration Summary</div>
                    {["Standard → Enhanced", "Enhanced → Premium"].map((migration, mi) => {
                      const count = Object.values(whatIfOverrides).filter(o => (mi===0 && o.newTier==="Enhanced") || (mi===1 && o.newTier==="Premium")).length;
                      const sub = mi===0 ? "$616" : "$1,125";
                      return (
                        <div key={mi} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:mi===0?"1px solid #1e293b22":"none" }}>
                          <span style={{ fontSize:11, color:"#e2e8f0" }}>{migration}</span>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:12, fontWeight:700, fontFamily:mono, color:count>0?"#06b6d4":"#334155" }}>{count} sites</span>
                            <span style={{ fontSize:10, color:"#64748b", fontFamily:mono }}>{sub}/ea</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Scenario Change Log */}
                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:18, flex:1, maxHeight:220, overflowY:"auto" }}>
                    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:10 }}>Scenario Change Log</div>
                    {whatIfLog.length === 0 ? (
                      <div style={{ fontSize:11, color:"#475569", lineHeight:1.6 }}>No changes yet. Apply upgrades from the hot sites table or from site detail recommendations on the Topology view.</div>
                    ) : (
                      whatIfLog.slice().reverse().map((entry, i) => (
                        <div key={i} style={{ padding:"6px 0", borderBottom:i<whatIfLog.length-1?"1px solid #1e293b22":"none", display:"flex", gap:8, alignItems:"flex-start" }}>
                          <span style={{ fontSize:9, color:"#475569", fontFamily:mono, whiteSpace:"nowrap", marginTop:2 }}>{entry.ts}</span>
                          <div>
                            <span style={{ fontSize:10, fontWeight:700, color:entry.action.includes("Revert")?"#64748b":entry.action.includes("Reset")?"#ef4444":"#22c55e" }}>{entry.action}</span>
                            <span style={{ fontSize:10, color:"#94a3b8" }}> · {entry.site}</span>
                            {entry.deltaMrc !== 0 && <span style={{ fontSize:10, fontFamily:mono, color:"#f59e0b" }}> ({entry.deltaMrc>0?"+":""}${entry.deltaMrc})</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              );
            })()}

            {/* ── LIVE TELEMETRY VIEW ── */}
            {dtView === "telemetry" && (
              <div>
                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:"1px solid #1e293b", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono }}>Live Site Telemetry — Top 40 Active Sites</span>
                    <span style={{ fontSize:10, color:"#06b6d4", fontFamily:mono }}>Source: GraphQL → MongoDB</span>
                  </div>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                      <thead>
                        <tr style={{ borderBottom:"1px solid #1e293b" }}>
                          {["Site","Region","Tier","Health","Uptime","Latency","Jitter","Pkt Loss","↑ Mbps","↓ Mbps","Tunnels","Alerts"].map(h => (
                            <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:8, textTransform:"uppercase", letterSpacing:1, color:"#64748b", fontWeight:700, fontFamily:mono, whiteSpace:"nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {siteMetrics.slice(0, 40).map((s,i) => (
                          <tr key={s.id} style={{ borderBottom:"1px solid #1e293b11", animation:`slideIn 0.25s ease ${i*0.02}s both` }}
                            onMouseEnter={e => e.currentTarget.style.background="#1e293b33"}
                            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                            <td style={{ padding:"9px 12px", fontWeight:600, color:"#f1f5f9", fontSize:11 }}>{s.name}</td>
                            <td style={{ padding:"9px 12px", color:"#94a3b8", fontSize:11 }}>{s.region}</td>
                            <td style={{ padding:"9px 12px" }}><TierBadge tier={s.tier} /></td>
                            <td style={{ padding:"9px 12px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <div style={{ width:40, height:5, background:"#0f172a", borderRadius:3, overflow:"hidden" }}>
                                  <div style={{ width:`${s.health}%`, height:"100%", background:s.health>=95?"#22c55e":s.health>=85?"#3b82f6":"#f59e0b", borderRadius:3 }} />
                                </div>
                                <span style={{ fontSize:10, fontWeight:700, color:s.health>=95?"#22c55e":s.health>=85?"#3b82f6":"#f59e0b", fontFamily:mono }}>{s.health}%</span>
                              </div>
                            </td>
                            <td style={{ padding:"9px 12px", fontFamily:mono, fontSize:10, color:"#22c55e" }}>{s.uptime}%</td>
                            <td style={{ padding:"9px 12px", fontFamily:mono, fontSize:10, color:s.latency<25?"#22c55e":"#f59e0b" }}>{s.latency}ms</td>
                            <td style={{ padding:"9px 12px", fontFamily:mono, fontSize:10, color:"#a855f7" }}>{s.jitter}ms</td>
                            <td style={{ padding:"9px 12px", fontFamily:mono, fontSize:10, color:s.pktLoss>0.1?"#ef4444":"#22c55e" }}>{s.pktLoss}%</td>
                            <td style={{ padding:"9px 12px", fontFamily:mono, fontSize:10, color:"#22c55e" }}>{s.throughputUp}</td>
                            <td style={{ padding:"9px 12px", fontFamily:mono, fontSize:10, color:"#3b82f6" }}>{s.throughputDown}</td>
                            <td style={{ padding:"9px 12px" }}>
                              <div style={{ display:"flex", gap:3 }}>
                                {s.tunnels.map((t,ti) => (
                                  <div key={ti} style={{ width:8, height:8, borderRadius:2, background:t.status==="Active"?"#22c55e":"#f59e0b", title:t.type }} />
                                ))}
                              </div>
                            </td>
                            <td style={{ padding:"9px 12px" }}>
                              {s.alerts.length > 0 ? <span style={{ fontSize:10, color:"#fbbf24" }}>⚠ {s.alerts.length}</span> : <span style={{ fontSize:10, color:"#334155" }}>—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── GRAPHQL EXPLORER VIEW ── */}
            {dtView === "graphql" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                {/* Query Editor */}
                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono }}>GraphQL Query Editor</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:5, height:5, borderRadius:"50%", background:"#22c55e" }} />
                      <span style={{ fontSize:9, color:"#22c55e", fontFamily:mono }}>Connected: mongodb://prod-cluster</span>
                    </div>
                  </div>
                  <textarea
                    value={gqlQuery}
                    onChange={e => setGqlQuery(e.target.value)}
                    spellCheck={false}
                    style={{
                      width:"100%", height:320, background:"#020617", border:"1px solid #334155", borderRadius:8,
                      padding:14, color:"#e2e8f0", fontFamily:mono, fontSize:11, lineHeight:1.7,
                      outline:"none", resize:"vertical",
                    }}
                  />
                  <div style={{ display:"flex", gap:10, marginTop:12 }}>
                    <button onClick={runGql} style={{
                      background:"linear-gradient(135deg,#06b6d4,#0891b2)", border:"none", borderRadius:8,
                      padding:"10px 24px", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:sans,
                    }}>{gqlRunning ? "Executing..." : "▶ Run Query"}</button>
                    <button onClick={() => setGqlResult(null)} style={{
                      background:"#1e293b", border:"1px solid #334155", borderRadius:8,
                      padding:"10px 18px", color:"#94a3b8", fontWeight:600, fontSize:12, cursor:"pointer", fontFamily:sans,
                    }}>Clear</button>
                  </div>
                  <div style={{ marginTop:14, padding:12, background:"#0f172a55", borderRadius:8, border:"1px solid #1e293b" }}>
                    <div style={{ fontSize:9, fontWeight:700, color:"#06b6d4", fontFamily:mono, marginBottom:6 }}>SCHEMA — Unified Data Model (MongoDB Collections)</div>
                    <div style={{ fontSize:10, color:"#64748b", lineHeight:1.7, fontFamily:mono }}>
                      customers → sites → sdwanNodes → tunnelMetrics<br/>
                      customers → contracts → lineItems → inventory<br/>
                      sites → circuits → slaMetrics → alerts<br/>
                      sites → cpeDevices → firmware → telemetry<br/>
                      networkTopology → hubNodes → spokeLinks → meshPeers
                    </div>
                  </div>
                </div>

                {/* Result Panel */}
                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
                  <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:14 }}>Query Result</div>
                  {gqlRunning && (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300, flexDirection:"column", gap:12 }}>
                      <div style={{ width:30, height:30, border:"3px solid #334155", borderTop:"3px solid #06b6d4", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
                      <span style={{ fontSize:11, color:"#64748b", fontFamily:mono }}>Resolving across MongoDB collections...</span>
                      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    </div>
                  )}
                  {!gqlRunning && gqlResult && (
                    <div>
                      <pre style={{
                        background:"#020617", border:"1px solid #334155", borderRadius:8,
                        padding:14, color:"#22c55e", fontFamily:mono, fontSize:10, lineHeight:1.6,
                        overflow:"auto", maxHeight:340, whiteSpace:"pre-wrap",
                      }}>{JSON.stringify(gqlResult.data, null, 2)}</pre>
                      <div style={{ marginTop:12, padding:10, background:"#0f172a55", borderRadius:8, border:"1px solid #06b6d433" }}>
                        <div style={{ fontSize:9, fontWeight:700, color:"#06b6d4", fontFamily:mono, marginBottom:4 }}>EXECUTION METADATA</div>
                        <div style={{ fontSize:10, color:"#64748b", fontFamily:mono, lineHeight:1.7 }}>
                          Resolver time: {gqlResult.extensions.resolverTime}<br/>
                          Cache: {gqlResult.extensions.cacheHit}<br/>
                          Source: {gqlResult.extensions.dataSource}
                        </div>
                      </div>
                    </div>
                  )}
                  {!gqlRunning && !gqlResult && (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300, flexDirection:"column", gap:12 }}>
                      <span style={{ fontSize:36 }}>⬡</span>
                      <span style={{ fontSize:12, color:"#475569" }}>Run a query to see results</span>
                      <span style={{ fontSize:10, color:"#334155", fontFamily:mono }}>GraphQL → MongoDB Federation Layer</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SLA & COMPLIANCE VIEW ── */}
            {dtView === "sla" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                {/* SLA Dashboard */}
                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:22 }}>
                  <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:18 }}>SLA Performance — Customer View</div>
                  {[
                    { metric:"Network Availability", target:"99.90%", actual:avgUptime+"%", met:parseFloat(avgUptime)>=99.9, credit:"5% MRC credit per 0.1% below" },
                    { metric:"Mean Time to Repair", target:"< 4 hours", actual:"2.3 hours", met:true, credit:"$500/incident above threshold" },
                    { metric:"Packet Loss", target:"< 0.1%", actual:"0.03%", met:true, credit:"Proportional MRC credit" },
                    { metric:"Latency (One-way)", target:"< 50ms", actual:`${avgLatency}ms`, met:avgLatency<50, credit:"$200/site/month above threshold" },
                    { metric:"Jitter", target:"< 5ms", actual:"2.1ms", met:true, credit:"Included in availability SLA" },
                    { metric:"CPE Replacement", target:"NBD", actual:"Same day (avg)", met:true, credit:"$100/day delay" },
                  ].map((sla,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:i<5?"1px solid #1e293b22":"none" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:"#f1f5f9" }}>{sla.metric}</div>
                        <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{sla.credit}</div>
                      </div>
                      <div style={{ display:"flex", gap:20, alignItems:"center" }}>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:10, color:"#64748b" }}>Target</div>
                          <div style={{ fontSize:12, fontWeight:700, color:"#94a3b8", fontFamily:mono }}>{sla.target}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:10, color:"#64748b" }}>Actual</div>
                          <div style={{ fontSize:12, fontWeight:700, color:sla.met?"#22c55e":"#ef4444", fontFamily:mono }}>{sla.actual}</div>
                        </div>
                        <span style={{ fontSize:16 }}>{sla.met ? "✅" : "❌"}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Regional Compliance + Data Architecture */}
                <div>
                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:22, marginBottom:16 }}>
                    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:14 }}>Regional Health Scores</div>
                    {hubs.map((hub,i) => {
                      const rSites = siteMetrics.filter(s => s.region === hub.region);
                      const rHealth = rSites.length ? Math.round(rSites.reduce((a,s) => a+s.health,0)/rSites.length) : 0;
                      const rLatency = rSites.length ? Math.round(rSites.reduce((a,s) => a+s.latency,0)/rSites.length) : 0;
                      return (
                        <div key={hub.region} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:i<5?"1px solid #1e293b22":"none" }}>
                          <div style={{ width:10, height:10, borderRadius:"50%", background:hub.color }} />
                          <span style={{ fontSize:12, color:"#e2e8f0", width:90 }}>{hub.region}</span>
                          <div style={{ flex:1, height:6, background:"#0f172a", borderRadius:3, overflow:"hidden" }}>
                            <div style={{ width:`${rHealth}%`, height:"100%", background:rHealth>=92?"#22c55e":rHealth>=85?"#3b82f6":"#f59e0b", borderRadius:3 }} />
                          </div>
                          <span style={{ fontSize:11, fontWeight:700, color:rHealth>=92?"#22c55e":"#f59e0b", fontFamily:mono, width:40, textAlign:"right" }}>{rHealth}%</span>
                          <span style={{ fontSize:10, color:"#64748b", fontFamily:mono, width:45, textAlign:"right" }}>{rLatency}ms</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #06b6d422", borderRadius:12, padding:22 }}>
                    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#06b6d4", fontFamily:mono, marginBottom:14 }}>GraphQL → MongoDB Architecture</div>
                    <div style={{ fontFamily:mono, fontSize:10, color:"#94a3b8", lineHeight:2 }}>
                      <span style={{ color:"#f59e0b" }}>Customer Portal</span><br/>
                      {"  └─ "}<span style={{ color:"#06b6d4" }}>GraphQL Gateway</span> (Apollo Federation)<br/>
                      {"     ├─ "}<span style={{ color:"#22c55e" }}>Subgraph: Sites</span> → MongoDB.sites<br/>
                      {"     ├─ "}<span style={{ color:"#22c55e" }}>Subgraph: Telemetry</span> → MongoDB.metrics<br/>
                      {"     ├─ "}<span style={{ color:"#22c55e" }}>Subgraph: Inventory</span> → MongoDB.cpe<br/>
                      {"     ├─ "}<span style={{ color:"#22c55e" }}>Subgraph: Circuits</span> → MongoDB.circuits<br/>
                      {"     ├─ "}<span style={{ color:"#22c55e" }}>Subgraph: SLA</span> → MongoDB.sla_events<br/>
                      {"     └─ "}<span style={{ color:"#a855f7" }}>Subgraph: Billing</span> → MongoDB.billing<br/>
                      <br/>
                      <span style={{ color:"#64748b" }}>Unified schema exposes 500 sites as a</span><br/>
                      <span style={{ color:"#64748b" }}>single composable graph — one query,</span><br/>
                      <span style={{ color:"#64748b" }}>all data, real-time customer experience.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* ═══ GRAPH ONTOLOGY — Normalizer, Mapper, Lattice, MCP, Dynamic APIs ═══ */}
        {tab === "graph-ontology" && (() => {
          // Graph node definitions for the enterprise customer ontology
          const graphNodes = [
            { id:"customer", label:"Customer", type:"entity", x:50, y:8, color:"#f59e0b", props:["id","name","contractId","tier","slaLevel"], collection:"customers", count:1 },
            { id:"contract", label:"Contract", type:"entity", x:28, y:18, color:"#a855f7", props:["id","term","startDate","totalMRC","status"], collection:"contracts", count:1 },
            { id:"site", label:"Site", type:"entity", x:72, y:18, color:"#3b82f6", props:["id","name","region","type","tier","geoCoord"], collection:"sites", count:500 },
            { id:"cpe", label:"CPE Device", type:"entity", x:88, y:32, color:"#22c55e", props:["id","model","serial","firmware","health","config"], collection:"cpe_devices", count:500 },
            { id:"circuit", label:"Circuit", type:"entity", x:60, y:35, color:"#06b6d4", props:["id","type","carrier","bandwidth","status","sla"], collection:"circuits", count:850 },
            { id:"tunnel", label:"SD-WAN Tunnel", type:"entity", x:78, y:48, color:"#ec4899", props:["id","type","endpoints","latency","status","encryption"], collection:"tunnels", count:1400 },
            { id:"telemetry", label:"Telemetry", type:"timeseries", x:42, y:48, color:"#ef4444", props:["ts","siteId","throughput","latency","jitter","pktLoss"], collection:"metrics_ts", count:"12M/day" },
            { id:"alert", label:"Alert", type:"event", x:25, y:40, color:"#fbbf24", props:["id","severity","source","message","ackStatus","ts"], collection:"alerts", count:847 },
            { id:"ticket", label:"Service Ticket", type:"entity", x:12, y:30, color:"#8b5cf6", props:["id","type","priority","status","assignee","sla"], collection:"tickets", count:124 },
            { id:"billing", label:"Billing", type:"entity", x:15, y:50, color:"#14b8a6", props:["invoiceId","period","amount","lineItems","status"], collection:"billing", count:6 },
            { id:"inventory", label:"Inventory", type:"entity", x:50, y:60, color:"#f97316", props:["sku","warehouse","qty","reserved","reorderPt"], collection:"inventory", count:13 },
            { id:"topology", label:"Network Topology", type:"computed", x:85, y:58, color:"#64748b", props:["hubId","spokes","meshLinks","pathMetrics"], collection:"topology_graph", count:6 },
          ];
          const graphEdges = [
            { from:"customer", to:"contract", label:"HAS_CONTRACT", cardinality:"1:1" },
            { from:"customer", to:"site", label:"OWNS_SITE", cardinality:"1:N" },
            { from:"site", to:"cpe", label:"HAS_CPE", cardinality:"1:1" },
            { from:"site", to:"circuit", label:"CONNECTED_VIA", cardinality:"1:N" },
            { from:"circuit", to:"tunnel", label:"CARRIES_TUNNEL", cardinality:"1:N" },
            { from:"site", to:"telemetry", label:"EMITS", cardinality:"1:N" },
            { from:"site", to:"alert", label:"TRIGGERS", cardinality:"1:N" },
            { from:"alert", to:"ticket", label:"CREATES", cardinality:"1:1" },
            { from:"customer", to:"billing", label:"BILLED_TO", cardinality:"1:N" },
            { from:"contract", to:"inventory", label:"RESERVES", cardinality:"1:N" },
            { from:"site", to:"topology", label:"PART_OF", cardinality:"N:1" },
            { from:"cpe", to:"tunnel", label:"TERMINATES", cardinality:"1:N" },
          ];

          // Normalizer pipeline stages
          const normalizerPipeline = [
            { stage:"Ingest", desc:"Raw data from MCP servers (SNMP, Netconf, REST, gRPC)", icon:"📥", status:"streaming", rate:"2.4K events/sec" },
            { stage:"Normalize", desc:"Schema alignment — carrier-specific formats → TMF SID canonical model", icon:"⚙️", status:"active", rate:"2.3K/sec" },
            { stage:"Map", desc:"Entity resolution — match raw records to graph nodes via fuzzy key matching", icon:"🗺️", status:"active", rate:"2.3K/sec" },
            { stage:"Enrich", desc:"Lattice join — cross-reference with inventory, billing, SLA context", icon:"🔗", status:"active", rate:"2.1K/sec" },
            { stage:"Correlate", desc:"Graph correlation engine — compute adjacency, path, and impact analysis", icon:"◈", status:"active", rate:"1.8K/sec" },
            { stage:"Persist", desc:"Write to Neo4j (graph) + MongoDB (docs) + TimescaleDB (metrics)", icon:"💾", status:"active", rate:"1.8K/sec" },
          ];

          const selNode = selectedGraphNode ? graphNodes.find(n => n.id === selectedGraphNode) : null;

          return (
          <div style={{ animation:"slideIn 0.3s ease" }}>
            <div style={{ display:"flex", gap:4, marginBottom:20 }}>
              {[{id:"topology",label:"Graph Topology"},{id:"pipeline",label:"Normalizer · Mapper · Lattice"},{id:"mcp",label:"MCP Servers"},{id:"api-gen",label:"Dynamic API Gen"}].map(v => (
                <button key={v.id} onClick={() => setGraphView(v.id)} style={{
                  padding:"8px 18px", borderRadius:8, fontSize:12, fontWeight:600,
                  background:graphView===v.id ? "#a855f7" : "#0f172a", color:graphView===v.id ? "#fff" : "#64748b",
                  border:graphView===v.id ? "1px solid #a855f7" : "1px solid #1e293b", cursor:"pointer", fontFamily:sans,
                }}>{v.label}</button>
              ))}
            </div>

            {/* ── GRAPH TOPOLOGY ── */}
            {graphView === "topology" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:20 }}>
                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #a855f722", borderRadius:12, padding:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#a855f7", fontFamily:mono }}>Enterprise Customer Graph · Neo4j + MongoDB</div>
                    <span style={{ fontSize:9, color:"#22c55e", fontFamily:mono }}>● 12 entities · 12 relationships</span>
                  </div>
                  <svg width="100%" height="380" viewBox="0 0 100 68" style={{ overflow:"visible" }}>
                    {/* Edges */}
                    {graphEdges.map((e,i) => {
                      const from = graphNodes.find(n => n.id===e.from);
                      const to = graphNodes.find(n => n.id===e.to);
                      if (!from||!to) return null;
                      const mx = (from.x+to.x)/2, my = (from.y+to.y)/2;
                      return (
                        <g key={i}>
                          <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#334155" strokeWidth="0.2" />
                          <rect x={mx-8} y={my-1.5} width={16} height={3} rx="1" fill="#0f172a" stroke="#334155" strokeWidth="0.1" />
                          <text x={mx} y={my+0.5} textAnchor="middle" fill="#64748b" fontSize="1.3" fontFamily="JetBrains Mono">{e.label}</text>
                        </g>
                      );
                    })}
                    {/* Nodes */}
                    {graphNodes.map(n => {
                      const isSel = selectedGraphNode === n.id;
                      return (
                        <g key={n.id} onClick={() => setSelectedGraphNode(isSel?null:n.id)} style={{ cursor:"pointer" }}>
                          {isSel && <circle cx={n.x} cy={n.y} r="5" fill="none" stroke={n.color} strokeWidth="0.15" opacity="0.4">
                            <animate attributeName="r" from="4" to="7" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                          </circle>}
                          <circle cx={n.x} cy={n.y} r={isSel?3.2:2.5} fill={`${n.color}22`} stroke={n.color} strokeWidth={isSel?"0.4":"0.25"} />
                          <circle cx={n.x} cy={n.y} r="1.2" fill={n.color} />
                          <text x={n.x} y={n.y-4} textAnchor="middle" fill="#e2e8f0" fontSize="2" fontFamily="DM Sans" fontWeight="700">{n.label}</text>
                          <text x={n.x} y={n.y+5} textAnchor="middle" fill="#64748b" fontSize="1.4" fontFamily="JetBrains Mono">{n.count} records</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Node Detail */}
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:18, flex:1 }}>
                    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:12 }}>
                      {selNode ? "Node Detail" : "Select a Graph Node"}
                    </div>
                    {selNode ? (
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                          <div style={{ width:12, height:12, borderRadius:"50%", background:selNode.color }} />
                          <span style={{ fontSize:15, fontWeight:700, color:"#f1f5f9" }}>{selNode.label}</span>
                          <span style={{ fontSize:9, padding:"2px 8px", borderRadius:4, background:`${selNode.color}18`, color:selNode.color, fontFamily:mono, fontWeight:600, textTransform:"uppercase" }}>{selNode.type}</span>
                        </div>
                        <div style={{ fontSize:10, color:"#64748b", fontFamily:mono, marginBottom:12 }}>Collection: {selNode.collection} · {selNode.count} records</div>

                        <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:1, fontWeight:700, color:"#64748b", fontFamily:mono, marginBottom:6 }}>Properties</div>
                        <div style={{ background:"#0f172a", borderRadius:8, padding:10, marginBottom:12 }}>
                          {selNode.props.map((p,i) => (
                            <span key={i} style={{ display:"inline-block", margin:"2px 4px 2px 0", padding:"3px 8px", borderRadius:4, background:`${selNode.color}12`, border:`1px solid ${selNode.color}33`, fontSize:10, color:selNode.color, fontFamily:mono }}>{p}</span>
                          ))}
                        </div>

                        <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:1, fontWeight:700, color:"#64748b", fontFamily:mono, marginBottom:6 }}>Relationships</div>
                        {graphEdges.filter(e => e.from===selNode.id || e.to===selNode.id).map((e,i) => {
                          const isOutbound = e.from === selNode.id;
                          const other = graphNodes.find(n => n.id === (isOutbound ? e.to : e.from));
                          return (
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 0", borderBottom:i<graphEdges.filter(x=>x.from===selNode.id||x.to===selNode.id).length-1?"1px solid #1e293b22":"none" }}>
                              <span style={{ fontSize:10, color:isOutbound?"#22c55e":"#3b82f6" }}>{isOutbound?"→":"←"}</span>
                              <span style={{ fontSize:10, color:"#94a3b8", fontFamily:mono }}>{e.label}</span>
                              <span style={{ fontSize:10, color:"#e2e8f0" }}>{other?.label}</span>
                              <span style={{ fontSize:9, color:"#475569", fontFamily:mono, marginLeft:"auto" }}>{e.cardinality}</span>
                            </div>
                          );
                        })}

                        <div style={{ marginTop:12, background:"#0f172a", borderRadius:8, padding:10 }}>
                          <div style={{ fontSize:9, fontWeight:700, color:"#a855f7", fontFamily:mono, marginBottom:4 }}>CYPHER QUERY</div>
                          <code style={{ fontSize:9, color:"#94a3b8", fontFamily:mono, lineHeight:1.6 }}>
                            MATCH (n:{selNode.label})-[r]-&gt;(m)<br/>
                            WHERE n.customerId = "CUST-ENT-4820"<br/>
                            RETURN n, type(r), m LIMIT 50
                          </code>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color:"#475569", fontSize:12, lineHeight:1.7, marginTop:10 }}>
                        Click any node to explore the graph schema. The ontology follows TMF SID / eTOM canonical models with extensions for SD-WAN digital twin context.
                      </div>
                    )}
                  </div>
                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:16 }}>
                    <div style={{ fontSize:9, fontWeight:700, color:"#a855f7", fontFamily:mono, marginBottom:8 }}>GRAPH STACK</div>
                    <div style={{ fontSize:10, color:"#94a3b8", lineHeight:1.8, fontFamily:mono }}>
                      <span style={{ color:"#f59e0b" }}>Neo4j Aura</span> — Graph relationships + traversal<br/>
                      <span style={{ color:"#22c55e" }}>MongoDB Atlas</span> — Document store + search<br/>
                      <span style={{ color:"#3b82f6" }}>TimescaleDB</span> — Time-series telemetry<br/>
                      <span style={{ color:"#ef4444" }}>Redis</span> — Real-time cache + pub/sub<br/>
                      <span style={{ color:"#a855f7" }}>GraphQL Federation</span> — Unified API layer<br/>
                      <span style={{ color:"#06b6d4" }}>MCP Gateway</span> — Agent tool orchestration
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── NORMALIZER · MAPPER · LATTICE PIPELINE ── */}
            {graphView === "pipeline" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20 }}>
                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:22 }}>
                  <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#a855f7", fontFamily:mono, marginBottom:20 }}>Data Pipeline — Ingest → Normalize → Map → Enrich → Correlate → Persist</div>
                  {normalizerPipeline.map((stage,i) => (
                    <div key={i} style={{ display:"flex", gap:16, marginBottom:i<5?24:0 }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", minWidth:48 }}>
                        <div style={{ width:48, height:48, borderRadius:"50%", background:"#0f172a", border:"2px solid #a855f7", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{stage.icon}</div>
                        {i<5 && <div style={{ width:2, height:20, background:"#a855f744", marginTop:4 }}>
                          <div style={{ width:2, height:10, background:"#a855f7", animation:`flowPulse 1.5s ease ${i*0.3}s infinite` }} />
                        </div>}
                      </div>
                      <div style={{ flex:1, paddingTop:4 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>{stage.stage}</span>
                          <span style={{ fontSize:10, color:"#22c55e", fontFamily:mono }}>{stage.rate}</span>
                        </div>
                        <div style={{ fontSize:12, color:"#64748b", marginTop:3, lineHeight:1.5 }}>{stage.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:18 }}>
                    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:12 }}>Lattice Join Context</div>
                    <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.7 }}>
                      The lattice enrichment layer cross-joins normalized records across dimensions to build a fully-connected context graph:
                    </div>
                    <div style={{ marginTop:10, fontFamily:mono, fontSize:10, color:"#64748b", lineHeight:2 }}>
                      <span style={{ color:"#f59e0b" }}>Site</span> ⟷ <span style={{ color:"#3b82f6" }}>Circuit</span> ⟷ <span style={{ color:"#ec4899" }}>Tunnel</span><br/>
                      <span style={{ color:"#f59e0b" }}>Site</span> ⟷ <span style={{ color:"#22c55e" }}>CPE</span> ⟷ <span style={{ color:"#ef4444" }}>Telemetry</span><br/>
                      <span style={{ color:"#f59e0b" }}>Site</span> ⟷ <span style={{ color:"#fbbf24" }}>Alert</span> ⟷ <span style={{ color:"#8b5cf6" }}>Ticket</span><br/>
                      <span style={{ color:"#a855f7" }}>Contract</span> ⟷ <span style={{ color:"#f97316" }}>Inventory</span> ⟷ <span style={{ color:"#14b8a6" }}>Billing</span>
                    </div>
                  </div>
                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:18 }}>
                    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:12 }}>Graph Correlation Engine</div>
                    {[
                      { l:"Impact Radius", v:"Multi-hop blast radius per alert", c:"#ef4444" },
                      { l:"Path Analysis", v:"Shortest/redundant path computation", c:"#3b82f6" },
                      { l:"Dependency Map", v:"Upstream/downstream service chain", c:"#a855f7" },
                      { l:"Anomaly Detection", v:"Statistical deviation on graph metrics", c:"#f59e0b" },
                      { l:"Root Cause", v:"Causal graph traversal for incidents", c:"#22c55e" },
                    ].map((cap,i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:i<4?"1px solid #1e293b22":"none" }}>
                        <span style={{ fontSize:11, color:cap.c, fontWeight:600 }}>{cap.l}</span>
                        <span style={{ fontSize:10, color:"#64748b" }}>{cap.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── MCP SERVERS ── */}
            {graphView === "mcp" && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
                  {[
                    { l:"MCP Servers", v:String(mcpEndpoints.length), c:"#a855f7" },
                    { l:"Connected", v:String(mcpEndpoints.filter(m=>m.status==="connected").length), c:"#22c55e" },
                    { l:"Total Tools", v:String(mcpEndpoints.reduce((a,m)=>a+m.tools,0)), c:"#3b82f6" },
                    { l:"Protocol", v:"SSE + HTTP", c:"#06b6d4" },
                  ].map((k,i) => (
                    <div key={i} style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:"16px 18px" }}>
                      <div style={{ fontSize:9, color:"#64748b", textTransform:"uppercase", letterSpacing:1, fontWeight:700, fontFamily:mono }}>{k.l}</div>
                      <div style={{ fontSize:24, fontWeight:800, color:k.c, marginTop:4, fontFamily:mono }}>{k.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:"1px solid #1e293b" }}>
                    <span style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#a855f7", fontFamily:mono }}>MCP Server Registry — Model Context Protocol Endpoints</span>
                  </div>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead>
                      <tr style={{ borderBottom:"1px solid #1e293b" }}>
                        {["Server","Endpoint URL","Protocol","Tools","Status","Last Sync"].map(h => (
                          <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:9, textTransform:"uppercase", letterSpacing:0.8, color:"#64748b", fontWeight:700, fontFamily:mono }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mcpEndpoints.map((ep,i) => (
                        <tr key={ep.id} style={{ borderBottom:"1px solid #1e293b11" }}
                          onMouseEnter={e => e.currentTarget.style.background="#1e293b33"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                          <td style={{ padding:"10px 14px", fontWeight:600, color:"#f1f5f9" }}>{ep.name}</td>
                          <td style={{ padding:"10px 14px", fontFamily:mono, fontSize:10, color:"#a855f7" }}>{ep.url}</td>
                          <td style={{ padding:"10px 14px" }}>
                            <span style={{ fontSize:9, padding:"2px 8px", borderRadius:4, background:"#06b6d415", color:"#06b6d4", fontFamily:mono, fontWeight:600 }}>{ep.proto}</span>
                          </td>
                          <td style={{ padding:"10px 14px", fontFamily:mono, color:"#e2e8f0" }}>{ep.tools}</td>
                          <td style={{ padding:"10px 14px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                              <div style={{ width:6, height:6, borderRadius:"50%", background:ep.status==="connected"?"#22c55e":"#f59e0b" }} />
                              <span style={{ fontSize:10, color:ep.status==="connected"?"#22c55e":"#f59e0b", fontFamily:mono }}>{ep.status}</span>
                            </div>
                          </td>
                          <td style={{ padding:"10px 14px", fontSize:10, color:"#64748b", fontFamily:mono }}>{ep.lastSync}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop:16, background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #06b6d422", borderRadius:12, padding:20 }}>
                  <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#06b6d4", fontFamily:mono, marginBottom:10 }}>MCP Architecture</div>
                  <div style={{ fontFamily:mono, fontSize:10, color:"#94a3b8", lineHeight:2 }}>
                    <span style={{ color:"#f59e0b" }}>Agent Hub (Clients)</span><br/>
                    {"  └─ "}<span style={{ color:"#a855f7" }}>MCP Gateway</span> (Protocol Router)<br/>
                    {"     ├─ "}<span style={{ color:"#22c55e" }}>SSE Transport</span> → ServiceNow, Salesforce, SAP, PagerDuty, MongoDB<br/>
                    {"     └─ "}<span style={{ color:"#06b6d4" }}>Streamable HTTP</span> → FortiManager, AT&T Portal, Verizon Portal<br/>
                    <br/>
                    {"  "}<span style={{ color:"#64748b" }}>Each server exposes tools, resources, and prompts.</span><br/>
                    {"  "}<span style={{ color:"#64748b" }}>Agents discover capabilities at runtime via MCP handshake.</span><br/>
                    {"  "}<span style={{ color:"#64748b" }}>All data flows into graph normalizer pipeline.</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── DYNAMIC API GENERATOR ── */}
            {graphView === "api-gen" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:22 }}>
                  <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#a855f7", fontFamily:mono, marginBottom:16 }}>Dynamic API Generator — Connect Any Platform to Digital Twin</div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:10, color:"#64748b", fontFamily:mono, display:"block", marginBottom:4 }}>Target Platform</label>
                    <select value={apiGenSpec.platform} onChange={e => setApiGenSpec(p => ({...p, platform:e.target.value}))} style={{ width:"100%", background:"#0f172a", border:"1px solid #334155", borderRadius:8, padding:"9px 12px", color:"#e2e8f0", fontSize:12, fontFamily:sans, outline:"none" }}>
                      <option value="">Select platform...</option>
                      <option value="datadog">Datadog (Monitoring)</option>
                      <option value="splunk">Splunk (Log Analytics)</option>
                      <option value="snowflake">Snowflake (Data Warehouse)</option>
                      <option value="power-bi">Power BI (Visualization)</option>
                      <option value="custom-iot">Custom IoT Platform</option>
                      <option value="erp-oracle">Oracle ERP</option>
                      <option value="tableau">Tableau (Analytics)</option>
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:10, color:"#64748b", fontFamily:mono, display:"block", marginBottom:4 }}>Graph Entity to Expose</label>
                    <select value={apiGenSpec.entity} onChange={e => setApiGenSpec(p => ({...p, entity:e.target.value}))} style={{ width:"100%", background:"#0f172a", border:"1px solid #334155", borderRadius:8, padding:"9px 12px", color:"#e2e8f0", fontSize:12, fontFamily:sans, outline:"none" }}>
                      <option value="">Select entity...</option>
                      {graphNodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.collection})</option>)}
                    </select>
                  </div>
                  <button onClick={() => {
                    if (!apiGenSpec.platform || !apiGenSpec.entity) return;
                    const node = graphNodes.find(n => n.id===apiGenSpec.entity);
                    const platNames = { datadog:"Datadog", splunk:"Splunk", snowflake:"Snowflake", "power-bi":"Power BI", "custom-iot":"IoT Platform", "erp-oracle":"Oracle ERP", tableau:"Tableau" };
                    setApiGenResult({
                      platform: platNames[apiGenSpec.platform]||apiGenSpec.platform,
                      entity: node,
                      endpoint: `https://api.prodapt-twin.io/v1/${node.collection}`,
                      graphqlEndpoint: `https://gql.prodapt-twin.io/v1/graphql`,
                      restSpec: { GET:`/${node.collection}`, POST:`/${node.collection}/query`, WS:`/ws/${node.collection}/stream` },
                      auth: "OAuth 2.0 + MCP bearer token",
                      rateLimit: "10K req/min",
                      schema: node.props,
                    });
                  }} style={{ background:"linear-gradient(135deg,#a855f7,#7c3aed)", border:"none", borderRadius:8, padding:"10px 24px", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:sans, width:"100%" }}>
                    Generate API Specification
                  </button>
                  {apiGenResult && (
                    <div style={{ marginTop:16, background:"#020617", border:"1px solid #334155", borderRadius:8, padding:14 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#22c55e", fontFamily:mono, marginBottom:8 }}>✓ API Generated for {apiGenResult.platform}</div>
                      <div style={{ fontSize:10, color:"#94a3b8", fontFamily:mono, lineHeight:2 }}>
                        <span style={{ color:"#64748b" }}>REST:</span> <span style={{ color:"#3b82f6" }}>{apiGenResult.endpoint}</span><br/>
                        <span style={{ color:"#64748b" }}>GraphQL:</span> <span style={{ color:"#a855f7" }}>{apiGenResult.graphqlEndpoint}</span><br/>
                        <span style={{ color:"#64748b" }}>WebSocket:</span> <span style={{ color:"#06b6d4" }}>{apiGenResult.endpoint.replace("https","wss")}/stream</span><br/>
                        <span style={{ color:"#64748b" }}>Auth:</span> <span style={{ color:"#f59e0b" }}>{apiGenResult.auth}</span><br/>
                        <span style={{ color:"#64748b" }}>Rate:</span> {apiGenResult.rateLimit}<br/>
                        <span style={{ color:"#64748b" }}>Methods:</span> GET, POST (query), WS (stream)
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:18 }}>
                    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:12 }}>Supported Integrations</div>
                    {["Datadog","Splunk","Snowflake","Power BI","Tableau","Oracle ERP","Custom IoT","ServiceNow"].map((p,i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:i<7?"1px solid #1e293b22":"none" }}>
                        <span style={{ fontSize:11, color:"#e2e8f0" }}>{p}</span>
                        <span style={{ fontSize:9, padding:"2px 8px", borderRadius:4, background:"#22c55e15", color:"#22c55e", fontFamily:mono }}>REST + GraphQL + WS</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:18 }}>
                    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:10 }}>API Architecture</div>
                    <div style={{ fontSize:10, color:"#94a3b8", fontFamily:mono, lineHeight:2 }}>
                      <span style={{ color:"#f59e0b" }}>3rd Party Platform</span><br/>
                      {"  ↕ "}<span style={{ color:"#64748b" }}>REST / GraphQL / WebSocket</span><br/>
                      <span style={{ color:"#a855f7" }}>API Gateway</span> (rate limit, auth, transform)<br/>
                      {"  ↕ "}<span style={{ color:"#64748b" }}>Schema resolver</span><br/>
                      <span style={{ color:"#22c55e" }}>Graph Ontology</span> (Neo4j + MongoDB)<br/>
                      {"  ↕ "}<span style={{ color:"#64748b" }}>Change data capture</span><br/>
                      <span style={{ color:"#06b6d4" }}>Digital Twin</span> (real-time state)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* ═══ AGENT HUB — Agentic Catalog + Self-Service Diagnostics ═══ */}
        {tab === "agent-hub" && (() => {
          const agentCatalog = [
            { id:"ag-health", name:"Health Monitor Agent", category:"Monitoring", icon:"💊", desc:"Continuous health scoring across all 500 sites. Predictive failure detection using ML models trained on historical telemetry.", tools:["mcp://mongo-atlas","mcp://pagerduty"], status:"always-on", cooldown:null },
            { id:"ag-diag", name:"Self-Diagnostic Agent", category:"Diagnostics", icon:"🔍", desc:"On-demand deep diagnostic for any site. Runs 12-point check: CPE reachability, tunnel integrity, circuit SLA, firmware, config drift, DNS, NTP, BGP, OSPF, MTU, packet capture analysis.", tools:["mcp://fortimanager","mcp://mongo-atlas","mcp://att-circuits","mcp://vz-circuits"], status:"on-demand", cooldown:null },
            { id:"ag-rca", name:"Root Cause Agent", category:"Diagnostics", icon:"🎯", desc:"Automated root cause analysis. Traverses the graph ontology to identify causal chains — correlates alerts, topology changes, and telemetry anomalies.", tools:["mcp://servicenow","mcp://pagerduty","mcp://mongo-atlas"], status:"on-demand", cooldown:null },
            { id:"ag-cap", name:"Capacity Planning Agent", category:"Optimization", icon:"📈", desc:"Forecasts bandwidth demand per site using 90-day trend analysis. Identifies sites approaching 70% threshold before they go hot.", tools:["mcp://mongo-atlas"], status:"scheduled", cooldown:"Runs daily 02:00 UTC" },
            { id:"ag-config", name:"Config Drift Agent", category:"Compliance", icon:"⚙️", desc:"Compares running CPE config against golden template. Detects unauthorized changes, missing ACLs, and security policy gaps.", tools:["mcp://fortimanager"], status:"scheduled", cooldown:"Runs every 4hrs" },
            { id:"ag-sla", name:"SLA Compliance Agent", category:"Monitoring", icon:"📋", desc:"Real-time SLA tracking against contractual targets. Auto-generates credit calculations and compliance reports per billing period.", tools:["mcp://mongo-atlas","mcp://sfdc-cpq"], status:"always-on", cooldown:null },
            { id:"ag-cost", name:"Cost Optimization Agent", category:"Optimization", icon:"💰", desc:"Analyzes circuit costs vs utilization. Identifies right-sizing opportunities, carrier arbitrage, and commit optimization across 500 sites.", tools:["mcp://sfdc-cpq","mcp://sap-erp","mcp://mongo-atlas"], status:"on-demand", cooldown:null },
            { id:"ag-security", name:"Security Posture Agent", category:"Security", icon:"🛡️", desc:"Continuous security assessment — firmware CVE scanning, tunnel encryption validation, access policy audit, and threat intelligence correlation.", tools:["mcp://fortimanager","mcp://pagerduty"], status:"always-on", cooldown:null },
            { id:"ag-change", name:"Change Impact Agent", category:"Operations", icon:"🔄", desc:"Pre-assesses impact of planned changes. Simulates config push, maintenance window, or circuit migration across the graph topology before execution.", tools:["mcp://servicenow","mcp://fortimanager","mcp://mongo-atlas"], status:"on-demand", cooldown:null },
            { id:"ag-remediate", name:"Auto-Remediation Agent", category:"Operations", icon:"🔧", desc:"Executes predefined runbooks for common failures: tunnel flap recovery, CPE reboot, DNS failover, BGP route correction. Requires approval gate.", tools:["mcp://fortimanager","mcp://servicenow"], status:"on-demand", cooldown:null },
          ];

          const categories = ["All","Monitoring","Diagnostics","Optimization","Compliance","Security","Operations"];
          const filteredAgents = agentCatFilter === "All" ? agentCatalog : agentCatalog.filter(a => a.category === agentCatFilter);
          const statusColors = { "always-on":"#22c55e", "on-demand":"#3b82f6", scheduled:"#f59e0b" };

          // Diagnostic runner
          const runDiag = (agentId, siteName) => {
            const key = `${agentId}-${siteName||"global"}`;
            setDiagRunning(key);
            setTimeout(() => {
              const checks = agentId === "ag-diag" ? [
                { check:"CPE Reachability", result:"PASS", detail:"FortiGate 60F responding, uptime 47d 12h", time:"0.3s" },
                { check:"Tunnel Integrity", result:"PASS", detail:"2/2 tunnels active, no flaps in 72h", time:"1.2s" },
                { check:"Circuit SLA", result:"PASS", detail:"MPLS 99.97%, DIA 99.94% — both above 99.9% target", time:"0.8s" },
                { check:"Firmware Version", result:"WARN", detail:"Running v7.4.2, latest is v7.4.4 — non-critical patch", time:"0.4s" },
                { check:"Config Drift", result:"PASS", detail:"Running config matches golden template (hash: a3f8c2)", time:"1.5s" },
                { check:"DNS Resolution", result:"PASS", detail:"Primary + secondary DNS responding, avg 12ms", time:"0.2s" },
                { check:"NTP Sync", result:"PASS", detail:"Stratum 2, offset <1ms, last sync 4min ago", time:"0.1s" },
                { check:"BGP Sessions", result:"PASS", detail:"2 peers established, 847 routes received", time:"0.6s" },
                { check:"OSPF Adjacency", result:"PASS", detail:"Full adjacency with hub, area 0.0.0.1", time:"0.3s" },
                { check:"MTU Path", result:"PASS", detail:"1500B end-to-end, no fragmentation detected", time:"0.9s" },
                { check:"Packet Loss", result:"PASS", detail:"0.01% over last 1hr, within SLA", time:"2.1s" },
                { check:"Throughput Test", result:"WARN", detail:"Download at 78% of designated — approaching hot threshold", time:"3.2s" },
              ] : agentId === "ag-rca" ? [
                { check:"Alert Correlation", result:"INFO", detail:"3 related alerts in last 24h — all same circuit provider", time:"1.8s" },
                { check:"Graph Traversal", result:"INFO", detail:"Impact path: Circuit → Tunnel → Site → Customer SLA", time:"2.4s" },
                { check:"Root Cause", result:"WARN", detail:"Carrier congestion on AT&T MPLS backbone — 47 sites affected", time:"3.1s" },
                { check:"Recommendation", result:"INFO", detail:"Failover affected sites to DIA tunnel, open carrier ticket", time:"0.5s" },
              ] : [
                { check:"Analysis Complete", result:"PASS", detail:"Agent completed successfully", time:"2.0s" },
              ];
              setDiagResults(p => ({...p, [key]: { ts:new Date().toLocaleTimeString(), checks, summary: checks.filter(c=>c.result==="WARN").length > 0 ? "Issues Found" : "All Clear" }}));
              setDiagRunning(null);
            }, 2500);
          };

          return (
          <div style={{ animation:"slideIn 0.3s ease" }}>
            {/* Agent Hub Header */}
            <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #22c55e22", borderRadius:12, padding:"16px 20px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:15, fontWeight:800, color:"#f1f5f9" }}>Agent Hub — <span style={{ color:"#22c55e" }}>Agentic Build to Assure</span></div>
                <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>Design-time agent catalog · Built by Agentic CPQ Platform · Deploy to any customer digital twin</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", animation:"pulse 2s ease infinite" }} />
                <span style={{ fontSize:10, color:"#22c55e", fontFamily:mono }}>{agentCatalog.filter(a=>a.status==="always-on").length} agents live</span>
              </div>
            </div>

            <div style={{ display:"flex", gap:4, marginBottom:20 }}>
              {[{id:"catalog",label:"Design-Time Catalog"},{id:"active",label:"Deploy & Execute"},{id:"results",label:"Diagnostic Results"}].map(v => (
                <button key={v.id} onClick={() => setAgentHubView(v.id)} style={{
                  padding:"8px 18px", borderRadius:8, fontSize:12, fontWeight:600,
                  background:agentHubView===v.id ? "#22c55e" : "#0f172a", color:agentHubView===v.id ? "#000" : "#64748b",
                  border:agentHubView===v.id ? "1px solid #22c55e" : "1px solid #1e293b", cursor:"pointer", fontFamily:sans,
                }}>{v.label}</button>
              ))}
            </div>

            {/* Agent Hub KPIs */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:14, marginBottom:22 }}>
              {[
                { l:"Design-Time Agents", v:"10", c:"#22c55e" },
                { l:"Always-On", v:String(agentCatalog.filter(a=>a.status==="always-on").length), c:"#22c55e" },
                { l:"On-Demand", v:String(agentCatalog.filter(a=>a.status==="on-demand").length), c:"#3b82f6" },
                { l:"Scheduled", v:String(agentCatalog.filter(a=>a.status==="scheduled").length), c:"#f59e0b" },
                { l:"MCP Tools Wired", v:String(new Set(agentCatalog.flatMap(a=>a.tools)).size), c:"#a855f7" },
                { l:"Executions", v:String(Object.keys(diagResults).length), c:"#06b6d4" },
              ].map((k,i) => (
                <div key={i} style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:"14px 16px" }}>
                  <div style={{ fontSize:9, color:"#64748b", textTransform:"uppercase", letterSpacing:1, fontWeight:700, fontFamily:mono }}>{k.l}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:k.c, marginTop:4, fontFamily:mono }}>{k.v}</div>
                </div>
              ))}
            </div>

            {/* ── CATALOG VIEW ── */}
            {agentHubView === "catalog" && (
              <div>
                <div style={{ display:"flex", gap:4, marginBottom:14 }}>
                  {categories.map(c => (
                    <button key={c} onClick={() => setAgentCatFilter(c)} style={{
                      padding:"5px 14px", borderRadius:6, fontSize:11, fontWeight:600,
                      background:agentCatFilter===c?"#22c55e":"#0f172a", color:agentCatFilter===c?"#000":"#64748b",
                      border:agentCatFilter===c?"1px solid #22c55e":"1px solid #1e293b", cursor:"pointer", fontFamily:sans,
                    }}>{c}</button>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  {filteredAgents.map((agent,i) => (
                    <div key={agent.id} style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:18, animation:`slideIn 0.3s ease ${i*0.06}s both`, position:"relative" }}>
                      <div style={{ position:"absolute", top:10, right:10, fontSize:8, padding:"2px 7px", borderRadius:10, background:"#0f172a", border:"1px solid #334155", color:"#64748b", fontFamily:mono }}>v1.{i+2}</div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:40, height:40, borderRadius:10, background:`${statusColors[agent.status]}12`, border:`1px solid ${statusColors[agent.status]}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{agent.icon}</div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>{agent.name}</div>
                            <div style={{ display:"flex", gap:6, marginTop:3 }}>
                              <span style={{ fontSize:8, padding:"2px 6px", borderRadius:4, background:`${statusColors[agent.status]}15`, color:statusColors[agent.status], fontFamily:mono, fontWeight:600, textTransform:"uppercase" }}>{agent.status}</span>
                              <span style={{ fontSize:8, padding:"2px 6px", borderRadius:4, background:"#1e293b", color:"#94a3b8", fontFamily:mono }}>{agent.category}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.5, marginBottom:8 }}>{agent.desc}</div>
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
                        {agent.tools.map((t,ti) => (
                          <span key={ti} style={{ fontSize:8, padding:"2px 6px", borderRadius:4, background:"#a855f712", border:"1px solid #a855f722", color:"#a855f7", fontFamily:mono }}>{t.split("://")[1]?.split(".")[0]}</span>
                        ))}
                      </div>
                      <div style={{ fontSize:9, color:"#475569", fontFamily:mono, marginBottom:8, display:"flex", justifyContent:"space-between" }}>
                        <span>Built by: Agentic CPQ</span>
                        {agent.cooldown && <span>{agent.cooldown}</span>}
                      </div>
                      <button onClick={() => { setActiveAgents(p => p.includes(agent.id) ? p : [...p, agent.id]); setAgentHubView("active"); }} style={{
                        background:"linear-gradient(135deg,#22c55e15,#22c55e08)", border:"1px solid #22c55e44", borderRadius:8, padding:"8px 16px",
                        color:"#22c55e", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:sans, width:"100%", transition:"all 0.2s",
                      }}>Deploy to Digital Twin →</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── RUN AGENT VIEW ── */}
            {agentHubView === "active" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:22 }}>
                  <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#22c55e", fontFamily:mono, marginBottom:16 }}>Deploy & Execute — Self-Service Evaluation</div>

                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:10, color:"#64748b", fontFamily:mono, display:"block", marginBottom:4 }}>Select Agent</label>
                    <select value={activeAgents[activeAgents.length-1]||""} onChange={e => setActiveAgents(p => [...p.filter(x=>x!==e.target.value), e.target.value])} style={{ width:"100%", background:"#0f172a", border:"1px solid #334155", borderRadius:8, padding:"9px 12px", color:"#e2e8f0", fontSize:12, fontFamily:sans, outline:"none" }}>
                      <option value="">Choose an agent...</option>
                      {agentCatalog.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                    </select>
                  </div>

                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:10, color:"#64748b", fontFamily:mono, display:"block", marginBottom:4 }}>Target Site (optional)</label>
                    <select style={{ width:"100%", background:"#0f172a", border:"1px solid #334155", borderRadius:8, padding:"9px 12px", color:"#e2e8f0", fontSize:12, fontFamily:sans, outline:"none" }} id="diagSiteSelect">
                      <option value="">All sites (network-wide)</option>
                      {SITES.filter(s => s.status === "Active").slice(0,40).map(s => <option key={s.id} value={s.name}>{s.name} ({s.region})</option>)}
                    </select>
                  </div>

                  <button onClick={() => {
                    const agId = activeAgents[activeAgents.length-1];
                    const siteEl = document.getElementById("diagSiteSelect");
                    const siteName = siteEl ? siteEl.value : "";
                    if (agId) runDiag(agId, siteName);
                  }} disabled={!!diagRunning} style={{
                    background:diagRunning ? "#334155" : "linear-gradient(135deg,#22c55e,#16a34a)", border:"none", borderRadius:8,
                    padding:"12px 24px", color:"#fff", fontWeight:700, fontSize:13, cursor:diagRunning?"wait":"pointer", fontFamily:sans, width:"100%",
                  }}>{diagRunning ? "⟳ Running Diagnostic..." : "▶ Execute Agent"}</button>

                  {diagRunning && (
                    <div style={{ marginTop:14, display:"flex", alignItems:"center", gap:10, padding:12, background:"#0f172a", borderRadius:8 }}>
                      <div style={{ width:16, height:16, border:"2px solid #334155", borderTop:"2px solid #22c55e", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
                      <span style={{ fontSize:11, color:"#94a3b8", fontFamily:mono }}>Agent executing checks via MCP...</span>
                      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    </div>
                  )}
                </div>

                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:22 }}>
                  <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, color:"#94a3b8", fontFamily:mono, marginBottom:14 }}>Agent Capabilities via MCP</div>
                  {activeAgents.length > 0 ? (() => {
                    const ag = agentCatalog.find(a => a.id === activeAgents[activeAgents.length-1]);
                    if (!ag) return null;
                    return (
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                          <span style={{ fontSize:22 }}>{ag.icon}</span>
                          <div>
                            <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>{ag.name}</div>
                            <span style={{ fontSize:9, color:statusColors[ag.status], fontFamily:mono }}>{ag.status.toUpperCase()}</span>
                          </div>
                        </div>
                        <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.6, marginBottom:12 }}>{ag.desc}</div>
                        <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:1, fontWeight:700, color:"#64748b", fontFamily:mono, marginBottom:8 }}>MCP Server Connections</div>
                        {ag.tools.map((t,i) => {
                          const ep = mcpEndpoints.find(m => m.url.includes(t.split("://")[1]?.split(".")[0]||""));
                          return (
                            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:i<ag.tools.length-1?"1px solid #1e293b22":"none" }}>
                              <span style={{ fontSize:11, color:"#e2e8f0" }}>{ep?.name || t}</span>
                              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                                <div style={{ width:5, height:5, borderRadius:"50%", background:ep?.status==="connected"?"#22c55e":"#f59e0b" }} />
                                <span style={{ fontSize:9, color:ep?.status==="connected"?"#22c55e":"#f59e0b", fontFamily:mono }}>{ep?.tools || 0} tools</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })() : (
                    <div style={{ color:"#475569", fontSize:12 }}>Select an agent from the catalog or the dropdown to see its MCP connections and capabilities.</div>
                  )}
                </div>
              </div>
            )}

            {/* ── DIAGNOSTIC RESULTS ── */}
            {agentHubView === "results" && (
              <div>
                {Object.keys(diagResults).length === 0 ? (
                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, padding:40, textAlign:"center" }}>
                    <span style={{ fontSize:36 }}>🔍</span>
                    <div style={{ fontSize:13, color:"#475569", marginTop:12 }}>No diagnostic results yet. Go to "Run Agent" to execute a diagnostic.</div>
                  </div>
                ) : (
                  Object.entries(diagResults).map(([key, result], ri) => {
                    const [agId] = key.split("-");
                    const agent = agentCatalog.find(a => a.id.endsWith(agId.replace("ag",""))) || agentCatalog.find(a => key.startsWith(a.id));
                    return (
                      <div key={key} style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:12, overflow:"hidden", marginBottom:ri < Object.keys(diagResults).length-1 ? 16 : 0 }}>
                        <div style={{ padding:"14px 18px", borderBottom:"1px solid #1e293b", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:10, padding:"3px 10px", borderRadius:12, fontWeight:700, fontFamily:mono, background:result.summary==="All Clear"?"#065f4633":"#78350f33", color:result.summary==="All Clear"?"#22c55e":"#fbbf24" }}>{result.summary}</span>
                            <span style={{ fontSize:11, color:"#f1f5f9", fontWeight:600 }}>{key}</span>
                          </div>
                          <span style={{ fontSize:10, color:"#64748b", fontFamily:mono }}>{result.ts}</span>
                        </div>
                        <table style={{ width:"100%", borderCollapse:"collapse" }}>
                          <thead>
                            <tr style={{ borderBottom:"1px solid #1e293b" }}>
                              {["Check","Result","Detail","Time"].map(h => (
                                <th key={h} style={{ padding:"8px 14px", textAlign:"left", fontSize:9, textTransform:"uppercase", letterSpacing:0.8, color:"#64748b", fontWeight:700, fontFamily:mono }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.checks.map((c,i) => (
                              <tr key={i} style={{ borderBottom:"1px solid #1e293b11" }}>
                                <td style={{ padding:"8px 14px", fontSize:11, color:"#e2e8f0", fontWeight:600 }}>{c.check}</td>
                                <td style={{ padding:"8px 14px" }}>
                                  <span style={{ fontSize:9, padding:"2px 8px", borderRadius:4, fontWeight:700, fontFamily:mono,
                                    background:c.result==="PASS"?"#065f4633":c.result==="WARN"?"#78350f33":"#0c4a6e33",
                                    color:c.result==="PASS"?"#22c55e":c.result==="WARN"?"#fbbf24":"#38bdf8"
                                  }}>{c.result}</span>
                                </td>
                                <td style={{ padding:"8px 14px", fontSize:11, color:"#94a3b8" }}>{c.detail}</td>
                                <td style={{ padding:"8px 14px", fontSize:10, color:"#64748b", fontFamily:mono }}>{c.time}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
          );
        })()}

        {/* ═══ CPQ AGENT ═══ */}
        {tab === "cpq-agent" && (
          <div style={{ animation:"slideIn 0.3s ease", maxWidth:760 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
              <div style={{ width:34, height:34, borderRadius:8, background:"linear-gradient(135deg,#f59e0b,#ef4444)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, animation:"glow 3s ease infinite" }}>⬡</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>CPQ Agent — Quote QTR-2026-0847</div>
                <div style={{ fontSize:11, color:"#22c55e", fontFamily:mono }}>● Online · 500-site SD-WAN context loaded</div>
              </div>
            </div>

            <div ref={chatRef} style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:12, padding:20, height:400, overflowY:"auto", display:"flex", flexDirection:"column", gap:16 }}>
              {chatMsgs.map((m,i) => (
                <div key={i} style={{ alignSelf:m.role==="user"?"flex-end":"flex-start", maxWidth:"88%", animation:"slideIn 0.3s ease" }}>
                  <div style={{
                    background:m.role==="user" ? "linear-gradient(135deg,#f59e0b,#ea580c)" : "#1e293b",
                    borderRadius:m.role==="user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    padding:"12px 16px", fontSize:13, lineHeight:1.6,
                    color:m.role==="user" ? "#fff" : "#e2e8f0", whiteSpace:"pre-wrap",
                    fontFamily:m.role==="ai" ? mono : sans, 
                  }}>{m.text}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:10, marginTop:12 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&handleChat()}
                placeholder="Ask the CPQ Agent..."
                style={{ flex:1, background:"#0f172a", border:"1px solid #334155", borderRadius:10, padding:"12px 16px", color:"#e2e8f0", fontSize:13, outline:"none", fontFamily:sans }} />
              <button onClick={handleChat} style={{ background:"linear-gradient(135deg,#f59e0b,#ea580c)", border:"none", borderRadius:10, padding:"12px 22px", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:sans }}>Send</button>
            </div>

            <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
              {["Show pricing & margins","Inventory status","Circuit feasibility","Network handoff status","Deployment timeline"].map(q => (
                <button key={q} onClick={() => setChatInput(q)} style={{
                  background:"#1e293b", border:"1px solid #334155", borderRadius:20, padding:"6px 14px",
                  color:"#94a3b8", fontSize:11, cursor:"pointer", fontFamily:sans, transition:"all 0.2s",
                }}>{q}</button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
