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


## 🧪 Live Demo Analysis Results

Analyzed **4933** transactions across **1025** unique accounts.

- **Suspicious Accounts Flagged**: 931
- **Fraud Rings Detected**: 69
- **Average Risk Score (of flagged)**: 27.87

### Top 5 High-Risk Accounts Identified
1. **`ACC_0060`** (Score: 70.0)
   - Patterns: `fan_in, fan_out`
   - Narrative: _Fan-in: 11 distinct sources. Fan-out: 11 distinct targets._
1. **`ACC_0866`** (Score: 68.17)
   - Patterns: `fan_out`
   - Narrative: _Fan-out: 15 distinct targets._
1. **`ACC_0037`** (Score: 68.17)
   - Patterns: `fan_out`
   - Narrative: _Fan-out: 12 distinct targets._
1. **`ACC_0851`** (Score: 65.57)
   - Patterns: `fan_out`
   - Narrative: _Fan-out: 10 distinct targets._
1. **`ACC_0887`** (Score: 65.57)
   - Patterns: `fan_in`
   - Narrative: _Fan-in: 12 distinct sources._

### Deep Analysis of Top Fraud Rings
- **`RING_SMURF_SINK_MEG`**: `Layered Distribution` pattern with a risk score of 55.13. Contains 1 nested accounts.
- **`RING_CYCLE_001`**: `Circular Routing` pattern with a risk score of 53.91. Contains 2 nested accounts.
- **`RING_SMURF_ACC_0460`**: `Layered Distribution` pattern with a risk score of 39.62. Contains 6 nested accounts.
