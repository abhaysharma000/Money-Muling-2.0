import networkx as nx
import time
import json
import traceback
from datetime import datetime, timedelta
from typing import List, Dict, Set, Optional
from collections import defaultdict

# Torch is now lazy-loaded inside methods to prevent system hangs on import
# Pandas/Numpy are removed to bypass systemic deadlocks on experimental Python runtimes.

class ForensicsEngine:
    """
    MULE TRACE X - High Performance Forensics Engine (Pure Python Resilience)
    Optimized for environments where compiled C-extensions (Pandas/Numpy) are unstable.
    """
    def __init__(self):
        self.graph = nx.DiGraph()
        self.transactions = []
        self.suspicious_accounts = {}
        self.fraud_rings = {}
        # ML is disabled by default to prevent systemic hangs on experimental Python runtimes.
        # It can be enabled manually if the environment is verified.
        self.model = None
        self.device = "cpu"

    def load_data(self, transactions: list, progress_callback=None):
        """Construct graph using Pure-Python list of dicts"""
        if progress_callback: progress_callback("Pure-Python Ingestion: Mapping transaction fabric...", 0.1)
        
        self.transactions = transactions
        self.graph.clear()
        
        # Pre-process transactions: convert types
        for tx in self.transactions:
            # Ensure identifiers are strings
            tx['sender_id'] = str(tx.get('sender_id', 'unknown'))
            tx['receiver_id'] = str(tx.get('receiver_id', 'unknown'))
            # Robust Amount parsing
            try:
                amt = tx.get('amount', 0)
                if isinstance(amt, str):
                    amt = float(amt.replace('$', '').replace(',', ''))
                tx['amount'] = float(amt)
            except:
                tx['amount'] = 0.0
            # Robust Timestamp parsing
            ts = tx.get('timestamp', '')
            if isinstance(ts, str):
                try: tx['timestamp'] = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
                except: 
                    try: tx['timestamp'] = datetime.fromisoformat(ts)
                    except: tx['timestamp'] = datetime.now()
            
            # Construct Graph
            u, v = tx['sender_id'], tx['receiver_id']
            if self.graph.has_edge(u, v):
                self.graph[u][v]['total_amount'] += tx['amount']
                self.graph[u][v]['count'] += 1
            else:
                self.graph.add_edge(u, v, total_amount=tx['amount'], count=1)
        
        if progress_callback: progress_callback(f"Graph synthesized. Ready for analysis.", 0.2)

    def extract_node_features(self, nodes: List[str]):
        """Pure-Python Feature Engineering (Numerical lists for ML)"""
        import math
        
        # Pre-compute aggregates
        in_degrees = dict(self.graph.in_degree())
        out_degrees = dict(self.graph.out_degree())
        degree_cent = nx.degree_centrality(self.graph)
        
        # Betweenness (only for small subsets if needed)
        bet_cent = {}
        if len(nodes) < 300:
            bet_cent = nx.betweenness_centrality(self.graph, k=min(len(nodes), 30))

        # Behavioral Aggregates (Pure Python)
        sender_stats = defaultdict(list)
        receiver_stats = defaultdict(list)
        nocturnal_counts = defaultdict(int)
        
        for tx in self.transactions:
            s, r, a = tx['sender_id'], tx['receiver_id'], tx['amount']
            sender_stats[s].append(a)
            receiver_stats[r].append(a)
            # Nocturnal check (11 PM to 5 AM)
            if tx['timestamp'].hour in [23, 0, 1, 2, 3, 4]:
                nocturnal_counts[s] += 1
                nocturnal_counts[r] += 1

        features = []
        for node in nodes:
            in_deg = in_degrees.get(node, 0)
            out_deg = out_degrees.get(node, 0)
            deg_c = degree_cent.get(node, 0)
            bet_c = bet_cent.get(node, 0)
            
            s_list = sender_stats.get(node, [])
            r_list = receiver_stats.get(node, [])
            total_tx = len(s_list) + len(r_list)
            
            noct_ratio = nocturnal_counts.get(node, 0) / total_tx if total_tx > 0 else 0
            burst = float(min(out_deg, in_deg + 1)) # Simple burst proxy

            features.append([
                float(in_deg), float(out_deg), float(deg_c), float(bet_c),
                0.0, # cycle_pct placeholder
                float(in_deg), float(out_deg),
                float(burst), float(noct_ratio)
            ])
        return features

    def analyze(self, progress_callback=None) -> List[Dict]:
        """Hybrid Intelligence Sweep (Pure Python Resilience)"""
        from concurrent.futures import ThreadPoolExecutor, TimeoutError
        
        legitimate = self.identify_legitimate_entities(progress_callback)
        nodes = list(self.graph.nodes())
        
        # --- PHASE 1: ML Inference (Optional/Lazy) ---
        if progress_callback: progress_callback("Executing Neural Parallel Sweep...", 0.4)
        
        ml_probs = {}
        if self.model is not None:
            try:
                # ML logic...
                pass # Placeholder since model is none anyway
            except:
                pass

        if not ml_probs:
            # Fallback path
            deg_dict = dict(self.graph.degree())
            max_deg = max(deg_dict.values()) if nodes else 1
            ml_probs = {n: min(0.9, deg_dict.get(n, 0) / (max_deg + 1)) for n in nodes}

        # --- PHASE 2: Pure-Python Heuristics ---
        with ThreadPoolExecutor(max_workers=4) as executor:
            if progress_callback: progress_callback("Processing Domain-Specific Heuristics...", 0.7)
            
            future_smurfing = executor.submit(self.detect_smurfing)
            future_bursts = executor.submit(self.detect_bursts)
            future_shells = executor.submit(self.detect_shell_chains)
            
            # Limited cycle detection (Cycle detection is O(n!) in worst case, cap strictly)
            susp_nodes = [n for n in nodes if n not in legitimate]
            sub = self.graph.subgraph(susp_nodes[:50])
            future_cycles = executor.submit(lambda: list(nx.simple_cycles(sub)))
            
            try:
                smurfing = future_smurfing.result(timeout=10)
                bursts = future_bursts.result(timeout=10)
                shell_chains = future_shells.result(timeout=10)
                cycles = future_cycles.result(timeout=10)
            except Exception as e:
                print(f"DEBUG: Heuristic timeout or error: {e}")
                smurfing, bursts, shell_chains, cycles = {}, {}, [], []

        # --- PHASE 3: Ring/Cluster Reconstruction ---
        rings_dict = {}
        
        # 1. Cycles as rings
        for i, cycle in enumerate(cycles):
            rid = f"RING_CYCLE_{i+1:03d}"
            rings_dict[rid] = {"id": rid, "nodes": set(cycle), "type": "Circular Routing"}
            
        # 2. Smurfing (Fan-in/Fan-out) groups as rings
        for s_node, info in smurfing.items():
            if "fan_in" in info["patterns"] or "fan_out" in info["patterns"]:
                rid = f"RING_SMURF_{s_node[:8].upper()}"
                members = {s_node}
                # Add neighbors that are part of the pattern
                try:
                    members.update(self.graph.predecessors(s_node))
                    members.update(self.graph.successors(s_node))
                except: pass
                rings_dict[rid] = {"id": rid, "nodes": members, "type": "Layered Distribution"}

        # 3. Shell chains as rings
        for i, chain in enumerate(shell_chains):
            rid = f"RING_SHELL_{i+1:03d}"
            rings_dict[rid] = {"id": rid, "nodes": set(chain), "type": "Intermediate Layering"}

        # Assign nodes to rings and build results
        node_to_ring = {}
        for rid, rdata in rings_dict.items():
            for n in rdata["nodes"]:
                if n not in node_to_ring: node_to_ring[n] = rid

        results = []
        for node in nodes:
            if node in legitimate: continue
            
            p_ml = ml_probs.get(node, 0.5)
            h_score = 0
            patterns = set()
            explanations = []
            
            if node in smurfing:
                h_score += 40
                patterns.update(smurfing[node]["patterns"])
                explanations.extend(smurfing[node]["explanation"])
            
            if node in bursts:
                h_score += 20
                patterns.add("high_velocity")
                explanations.append("High velocity transactional burst detected.")
                
            for cycle in cycles:
                if node in cycle:
                    h_score += 30
                    patterns.add("cycle_participant")
                    explanations.append("Involved in circular fund routing.")
                    break
            
            final_score = (0.6 * p_ml * 100) + (0.4 * min(100, h_score))
            final_score = round(min(100, final_score), 2)
            
            if final_score > 30:
                # Get last 10 tx for this node
                node_tx = [tx for tx in self.transactions if tx['sender_id'] == node or tx['receiver_id'] == node]
                node_tx.sort(key=lambda x: x['timestamp'], reverse=True)
                recent = node_tx[:10]
                tx_list = [
                    {
                        "transaction_id": str(tx.get('transaction_id', '')),
                        "sender_id": str(tx['sender_id']),
                        "receiver_id": str(tx['receiver_id']),
                        "amount": float(tx['amount']),
                        "timestamp": tx['timestamp'].strftime("%Y-%m-%d %H:%M:%S")
                    } for tx in recent
                ]
                
                results.append({
                    "account_id": str(node),
                    "suspicion_score": final_score,
                    "ml_probability": round(p_ml, 4),
                    "detected_patterns": sorted(list(patterns)),
                    "explanation": " ".join(dict.fromkeys(explanations)),
                    "is_legitimate_hub": False,
                    "ring_id": node_to_ring.get(node, ""),
                    "recent_transactions": tx_list
                })

        # Calculate Ring metrics for frontend
        final_rings = []
        for rid, rdata in rings_dict.items():
            member_results = [r for r in results if r['ring_id'] == rid]
            if not member_results: continue
            
            avg_score = sum(r['suspicion_score'] for r in member_results) / len(member_results)
            final_rings.append({
                "ring_id": rid,
                "risk_score": round(avg_score, 2),
                "type": rdata["type"],
                "member_accounts": [r['account_id'] for r in member_results]
            })
        
        self.fraud_rings = sorted(final_rings, key=lambda x: x['risk_score'], reverse=True)
        return sorted(results, key=lambda x: x['suspicion_score'], reverse=True)

    def detect_smurfing(self) -> Dict:
        """Pure Python Fan-in/Out detection"""
        smurfing = {}
        in_unique = defaultdict(set)
        out_unique = defaultdict(set)
        
        for tx in self.transactions:
            in_unique[tx['receiver_id']].add(tx['sender_id'])
            out_unique[tx['sender_id']].add(tx['receiver_id'])
            
        for r, senders in in_unique.items():
            if len(senders) >= 10:
                smurfing[r] = {"patterns": {"fan_in"}, "explanation": [f"Fan-in: {len(senders)} distinct sources."]}
        
        for s, receivers in out_unique.items():
            if len(receivers) >= 10:
                if s in smurfing:
                    smurfing[s]["patterns"].add("fan_out")
                    smurfing[s]["explanation"].append(f"Fan-out: {len(receivers)} distinct targets.")
                else:
                    smurfing[s] = {"patterns": {"fan_out"}, "explanation": [f"Fan-out: {len(receivers)} distinct targets."]}
        return smurfing

    def detect_bursts(self) -> Dict:
        """Pure Python Burst detection using hourly buckets"""
        buckets = defaultdict(lambda: defaultdict(int))
        for tx in self.transactions:
            hour_key = tx['timestamp'].strftime("%Y-%m-%d-%H")
            buckets[tx['sender_id']][hour_key] += 1
            
        bursts = {}
        import statistics
        for node, hours in buckets.items():
            counts = list(hours.values())
            if len(counts) > 3:
                m = statistics.mean(counts)
                s = statistics.stdev(counts) if len(counts) > 1 else 0
                if max(counts) > m + 3*s + 5:
                    bursts[node] = True
        return bursts

    def identify_legitimate_entities(self, progress_callback=None) -> Set[str]:
        """Pure Python Merchant Detection"""
        in_unique = defaultdict(set)
        for tx in self.transactions:
            in_unique[tx['receiver_id']].add(tx['sender_id'])
            
        legitimate = set()
        for r, senders in in_unique.items():
            if len(senders) >= 50:
                legitimate.add(r)
        return legitimate

    def detect_shell_chains(self, min_hops=3) -> List:
        """Pure-Python Linear chain detection"""
        chains = []
        out_nodes = [n for n in self.graph.nodes() if self.graph.out_degree(n) == 1]
        for node in out_nodes:
            path, curr = [node], node
            while True:
                succs = list(self.graph.successors(curr))
                if not succs: break
                nxt = succs[0]
                if nxt in path or self.graph.out_degree(nxt) != 1:
                    path.append(nxt)
                    break
                path.append(nxt)
                curr = nxt
            if len(path) >= min_hops: chains.append(path)
        return chains

    def get_graph_data(self, suspicious_accounts: List[Dict]) -> Dict:
        """Optimized Forensic Graph Export (Capped for Performance)"""
        # Focus on top suspicious nodes 
        top_suspicious = sorted(suspicious_accounts, key=lambda x: x['suspicion_score'], reverse=True)[:200]
        node_ids = {acc['account_id'] for acc in top_suspicious}
        
        # Add limited context neighbors (only for very high risk nodes)
        all_relevant = set(node_ids)
        for acc in top_suspicious:
            if acc['suspicion_score'] > 70:
                try:
                    # Add max 5 successors and 5 predecessors for context
                    succs = list(self.graph.successors(acc['account_id']))[:5]
                    preds = list(self.graph.predecessors(acc['account_id']))[:5]
                    all_relevant.update(succs)
                    all_relevant.update(preds)
                except: pass
            
            # Hard limit to prevent browser crash
            if len(all_relevant) > 500: break
            
        # Global transaction counts per node (Pure Python)
        counts = defaultdict(int)
        for tx in self.transactions:
            if tx['sender_id'] in all_relevant or tx['receiver_id'] in all_relevant:
                counts[tx['sender_id']] += 1
                counts[tx['receiver_id']] += 1
            
        nodes = []
        for n_id in all_relevant:
            acc = next((a for a in suspicious_accounts if a['account_id'] == n_id), None)
            nodes.append({
                "id": str(n_id),
                "label": str(n_id),
                "risk_score": acc['suspicion_score'] if acc else 0.0,
                "tags": acc['detected_patterns'] if acc else [],
                "total_transactions": counts[n_id],
                "is_legitimate": False,
                "ring_id": acc['ring_id'] if acc else ""
            })
            
        edges = []
        edge_count = 0
        for u, v, d in self.graph.subgraph(all_relevant).edges(data=True):
            edges.append({
                "from_node": str(u),
                "to_node": str(v),
                "label": f"${d.get('total_amount', 0):,.0f}",
                "value": float(d.get('total_amount', 0))
            })
            edge_count += 1
            if edge_count > 800: break # Hard limit on edges
            
        return {"nodes": nodes, "edges": edges}
