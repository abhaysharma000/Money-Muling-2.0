# 🏔️ MULE TRACE Project Analysis

**Mule Trace** is a high-performance, web-based intelligence platform designed for detecting money muling networks through behavioral graph analytics and temporal windowing.

## 🏗 System Architecture

The application is decoupled into a clear Client-Server architecture:

### Backend (Analytical Engine)
- **Framework**: Python FastAPI
- **Core Technologies**: `NetworkX` (Graph Theory), `Pandas` (Data Processing)
- **Key Modules**:
  - `main.py`: Exposes REST endpoints (`/upload`, `/ai-analyze/{account_id}`, `/generate-demo`) using `StreamingResponse` for realtime feedback.
  - `engine.py`: Contains the `ForensicsEngine` class which constructs directed graphs and uses vectorized operations to flag accounts.
- **Algorithms Implemented**:
  - **Smurfing (Structuring)**: Dynamic sliding 72-hour window detecting $>10$ partners within bursts. (+40 points)
  - **Nocturnal Activity**: Flags accounts with $>40\%$ activity between 11 PM and 5 AM. (+25 points)
  - **Circular Fund Routing (Carousel)**: Utilizes Johnson's Algorithm (`nx.simple_cycles`) to detect loops of 3-5 hops. (+25 points)
  - **Layered Shell Networks**: Linear chain traversals detecting nested intermediaries with strictly 2-3 total transactions. (+20 points)
  - **High Velocity/Bursts**: Detected via resampled temporal windows. (+15 points)
  - **Whitelist Logic**: Recognizes high-volume legitimate merchants and consistent payroll pairs.

### Frontend (Visual Intelligence Layer)
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS, employing a premium dark-themed "Forensic Command Center" aesthetic.
- **Key Libraries**:
  - `vis-network`: For interactive, force-directed graph rendering.
  - `lucide-react`: Professional iconography.
- **Key Components**:
  - `App.jsx`: Main telemetry dashboard, state management, and AI Forensic Report UI. Features a unified command center for file uploads and demo data generation.
  - `GraphView`: Interactive behavioral topology visualization with realtime forensic replay (Simulation mode).
  - `StatsDashboard`: Tabular view of flagged accounts and network clusters (rings).

## 🚀 Key Features

1. **Intelligent Ingestion**: `map_columns` automatically standardizes raw CSV data against common bank statement aliases.
2. **AI Forensic Deep Dive**: A specialized interface providing behavioral narrative summaries, classification, and numerical risk assessment.
3. **Forensic Replay Simulation**: Allows investigators to watch the network topology evolve over "time" or risk-relevance.
4. **Risk Scoring Matrix**: Calculates a Suspicion Score (0-100) based on weighted penalties for suspicious behaviors.

## 📊 Evaluation
The platform demonstrates highly optimized Pandas handling (vectorized ops), clean separation of concerns, and defensive programming. The user interface leverages modern CSS to deliver a professional and responsive command-center experience.
