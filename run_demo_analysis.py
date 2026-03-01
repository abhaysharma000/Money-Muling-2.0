import os
import sys
import csv
import json

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from engine import ForensicsEngine
from main import map_columns
from generate_data import generate_test_csv

def main():
    print("Step 1: Generating 5000 transactions demo dataset...")
    generate_test_csv(filename="demo_data.csv", num_transactions=5000)

    print("Step 2: Loading dataset...")
    with open("demo_data.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        raw_data = list(reader)

    mapped_data = map_columns(raw_data)

    print("Step 3: Initializing Forensics Engine...")
    engine = ForensicsEngine()
    engine.load_data(mapped_data)

    print("Step 4: Running Inference Sweeps...")
    def progress(msg, pct):
        print(f"[{int(pct*100)}%] {msg}")
        
    results = engine.analyze(progress_callback=progress)

    summary = {
        "total_accounts_analyzed": engine.graph.number_of_nodes(),
        "total_transactions": len(mapped_data),
        "suspicious_accounts_flagged": len(results),
        "fraud_rings_detected": len(engine.fraud_rings),
        "avg_risk_score": round(sum(r['suspicion_score'] for r in results) / len(results), 2) if results else 0,
    }

    print("\n--------------------------")
    print("ANALYSIS COMPLETE")
    print(json.dumps(summary, indent=2))
    print("--------------------------")

    with open("DEMO_ANALYSIS_SUMMARY.json", "w", encoding="utf-8") as f:
        json.dump({
            "summary": summary,
            "suspicious_accounts": results,
            "fraud_rings": engine.fraud_rings
        }, f, indent=2)

    with open("ANALYSIS_REPORT.md", "a", encoding="utf-8") as f:
        f.write("\n\n## 🧪 Live Demo Analysis Results\n\n")
        f.write(f"Analyzed **{summary['total_transactions']}** transactions across **{summary['total_accounts_analyzed']}** unique accounts.\n\n")
        f.write(f"- **Suspicious Accounts Flagged**: {summary['suspicious_accounts_flagged']}\n")
        f.write(f"- **Fraud Rings Detected**: {summary['fraud_rings_detected']}\n")
        f.write(f"- **Average Risk Score (of flagged)**: {summary['avg_risk_score']}\n\n")
        
        f.write("### Top 5 High-Risk Accounts Identified\n")
        for r in results[:5]:
            f.write(f"1. **`{r['account_id']}`** (Score: {r['suspicion_score']})\n")
            f.write(f"   - Patterns: `{', '.join(r['detected_patterns'])}`\n")
            f.write(f"   - Narrative: _{r['explanation']}_\n")
        
        f.write("\n### Deep Analysis of Top Fraud Rings\n")
        for r in engine.fraud_rings[:3]:
            f.write(f"- **`{r['ring_id']}`**: `{r['type']}` pattern with a risk score of {r['risk_score']}. Contains {len(r['member_accounts'])} nested accounts.\n")

    print("Extracted static demo files for pushing.")

if __name__ == "__main__":
    main()
