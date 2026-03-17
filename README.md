# Prodapt Agentic CPQ Platform

> **An Agentic Build-to-Assure platform for enterprise SD-WAN — Configure, Price, Quote, Provision, and Operate 500+ site deployments with autonomous AI agents, graph ontology, and digital twin visualization.**

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![License](https://img.shields.io/badge/License-Proprietary-red)
![Status](https://img.shields.io/badge/Status-Prototype-orange)

---

## Overview

This is a fully interactive React prototype demonstrating an **Agentic CPQ (Configure-Price-Quote) Platform** purpose-built for telecom SD-WAN enterprise deployments. It showcases how autonomous AI agents, a unified graph ontology over MongoDB/Neo4j, MCP (Model Context Protocol) server integration, and a digital twin visualization layer come together to transform the quote-to-cash lifecycle.

### Key Capabilities

| Capability | Description |
|---|---|
| **Agentic CPQ Workflow** | 9-stage autonomous pipeline from site discovery to network handoff |
| **500-Site Configuration** | Full site-by-site BOM with tier, bandwidth, CPE, circuit, and license mapping |
| **Inventory Management** | Real-time CPE stock tracking with auto-PO generation for shortfalls |
| **Digital Twin CX** | Customer-facing network visualization with live telemetry and SLA tracking |
| **What-If Modeler** | Bandwidth utilization analysis with AI upgrade recommendations and scenario costing |
| **Graph Ontology** | 12-entity knowledge graph (Neo4j + MongoDB) with normalizer/mapper/lattice pipeline |
| **MCP Server Integration** | 8 MCP endpoints (ServiceNow, FortiManager, Salesforce, SAP, carriers, etc.) |
| **Dynamic API Generator** | On-demand REST/GraphQL/WebSocket API spec generation for 3rd-party integration |
| **Agent Hub** | Design-time catalog of 10 autonomous agents deployable to any customer digital twin |
| **Self-Service Diagnostics** | 12-point site diagnostic, root cause analysis, and auto-remediation via MCP |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Customer Portal                      │
│          (Digital Twin CX Dashboard)                  │
├──────────────────────────────────────────────────────┤
│              GraphQL Federation Layer                  │
│            (Apollo Federation Gateway)                 │
├─────────┬──────────┬──────────┬──────────────────────┤
│ Neo4j   │ MongoDB  │Timescale │  Redis               │
│ (Graph) │ (Docs)   │(Metrics) │  (Cache)             │
├─────────┴──────────┴──────────┴──────────────────────┤
│           Normalizer → Mapper → Lattice               │
│              (Data Pipeline Engine)                    │
├──────────────────────────────────────────────────────┤
│              MCP Gateway (Protocol Router)             │
├─────┬──────┬────────┬──────┬──────┬──────┬───────────┤
│SNOW │Forti │  SFDC  │ SAP  │ AT&T │  VZ  │ PagerDuty │
│ITSM │Mgr   │  CPQ   │ ERP  │Portal│Portal│ Incidents │
└─────┴──────┴────────┴──────┴──────┴──────┴───────────┘
```

---

## Tabs / Modules

### 1. CPQ Dashboard (`◉`)
Top-level KPIs, pipeline funnel (Quoted → Active), AI agent insight feed, region/tier breakdowns.

### 2. 500 Sites (`▤`)
Paginated, filterable site table — status, tier, bandwidth, MRC/NRC, CPE/config/circuit readiness.

### 3. Inventory (`📦`)
CPE stock cards with shortfall detection, full product catalog, quote-level reservation tracking.

### 4. Agentic Workflow (`⟳`)
9-stage autonomous CPQ pipeline with named agents, automation levels, agent roster, and system integrations.

### 5. Network Handoff (`🚀`)
Deployment batches, handoff package contents, network engineering queue metrics.

### 6. Digital Twin CX (`🌐`)
- **Network Topology** — Interactive hub-spoke map with bandwidth utilization coloring and hot site detection
- **What-If Modeler** — Scenario builder with AI upgrade recommendations, bulk apply, financial impact analysis
- **Live Telemetry** — Per-site health, latency, jitter, packet loss, throughput, tunnel status
- **GraphQL Explorer** — Interactive query editor with simulated MongoDB resolution
- **SLA & Compliance** — Target vs actual SLA dashboard with regional health scores

### 7. Graph Ontology (`◈`)
- **Graph Topology** — 12-entity ontology visualization (Customer → Site → CPE → Circuit → Tunnel → Telemetry, etc.)
- **Normalizer · Mapper · Lattice** — 6-stage data pipeline with throughput metrics
- **MCP Servers** — Registry of 8 MCP endpoints with protocol, tool counts, connection status
- **Dynamic API Generator** — Generate REST/GraphQL/WS specs for any platform (Datadog, Splunk, Snowflake, etc.)

### 8. Agent Hub (`⬢`)
- **Design-Time Catalog** — 10 agents across 6 categories (Monitoring, Diagnostics, Optimization, Compliance, Security, Operations)
- **Deploy & Execute** — Self-service agent runner with MCP capability inspection
- **Diagnostic Results** — Full audit trail with per-check PASS/WARN/INFO results

### 9. CPQ Agent (`⬡`)
Conversational AI interface — query pricing, inventory, circuit feasibility, network handoff, deployment timelines.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind (utility classes), Recharts-compatible |
| Fonts | DM Sans, JetBrains Mono (Google Fonts) |
| Graph DB | Neo4j Aura (simulated) |
| Document DB | MongoDB Atlas (simulated) |
| Time-Series | TimescaleDB (simulated) |
| Cache | Redis (simulated) |
| API Layer | GraphQL Federation (Apollo, simulated) |
| Agent Protocol | MCP — Model Context Protocol (SSE + Streamable HTTP) |
| Standards | TMF SID, TMF Open API (TMF639/648/622), eTOM |

> **Note:** This is a frontend prototype. All data is generated client-side to demonstrate the UX and workflow. Backend integrations are simulated.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Quick Start (Vite + React)

```bash
# Clone the repo
git clone https://github.com/<your-org>/agentic-cpq-platform.git
cd agentic-cpq-platform

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Alternative: Use with Create React App

```bash
npx create-react-app agentic-cpq --template minimal
cp src/App.jsx agentic-cpq/src/App.jsx
cd agentic-cpq && npm start
```

---

## Project Structure

```
agentic-cpq-platform/
├── README.md                  # This file
├── package.json               # Dependencies and scripts
├── vite.config.js             # Vite configuration
├── index.html                 # Entry HTML
├── src/
│   ├── App.jsx                # Main application (all 9 tabs)
│   ├── main.jsx               # React entry point
│   └── index.css              # Global styles
├── public/
│   └── favicon.svg            # Prodapt-branded favicon
└── docs/
    └── ARCHITECTURE.md        # Detailed architecture documentation
```

---

## Versioning / Backups

The prototype has evolved through multiple iterations:

| Version | Description | Backup File |
|---|---|---|
| v1 | Initial inventory management dashboard | — |
| v2 | CPQ overlay with 500-site SD-WAN quoting | `agentic-cpq-sdwan-v2-backup.jsx` |
| v3 | Digital Twin CX with GraphQL explorer | `agentic-cpq-sdwan-v3-backup.jsx` |
| v4 | What-If Modeler with bandwidth utilization | `agentic-cpq-sdwan-v4-backup.jsx` |
| v5 | Graph Ontology + Agent Hub (current) | `agentic-cpq-sdwan.jsx` |

---

## Contributing

This is a Prodapt internal prototype. For contributions, please follow the standard branch-and-PR workflow.

---

## License

Proprietary — Prodapt Solutions Pvt. Ltd. All rights reserved.

---

*Built with the Prodapt Agentic CPQ Platform — Accelerating Connectedness™*
