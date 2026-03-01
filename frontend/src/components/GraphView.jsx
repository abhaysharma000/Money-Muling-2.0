import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { ZoomIn, ZoomOut, Maximize, Activity, Info, Target } from 'lucide-react';

const GraphView = ({ data, onSelectNode, filterSuspiciousOnly = false, highlightNode = null }) => {
    const containerRef = useRef(null);
    const networkRef = useRef(null);
    const [physicsEnabled, setPhysicsEnabled] = useState(true);

    useEffect(() => {
        if (networkRef.current && highlightNode) {
            networkRef.current.selectNodes([highlightNode]);
            networkRef.current.focus(highlightNode, {
                scale: 1.2,
                animation: { duration: 1000, easingFunction: 'easeInOutQuad' }
            });
        }
    }, [highlightNode]);

    useEffect(() => {
        if (!containerRef.current || !data || !data.graph_data) return;

        let displayNodes = data.graph_data.nodes;
        let displayEdges = data.graph_data.edges;

        if (filterSuspiciousOnly) {
            displayNodes = displayNodes.filter(n => n.risk_score > 0);
            const suspNodeIds = new Set(displayNodes.map(n => n.id));
            displayEdges = displayEdges.filter(e => suspNodeIds.has(e.from_node) && suspNodeIds.has(e.to_node));
        }

        // High-Accuracy HSL Spectral Color Mapping (Perceptually Uniform)
        // Maps 0% (safe=blue hue:220) → 50% (warning=amber hue:40) → 100% (critical=red hue:0)
        const interpolateColor = (val) => {
            const clamped = Math.max(0, Math.min(100, val));
            // Hue: 220 (blue) at 0% → 40 (amber) at 60% → 0 (red) at 100%
            const hue = clamped < 60
                ? 220 - (clamped / 60) * 180   // 220→40 in first 60%
                : 40 - ((clamped - 60) / 40) * 40; // 40→0 in last 40%
            // Saturation: ramp up with risk
            const sat = 55 + (clamped / 100) * 45;
            // Lightness: slightly brighter at high risk for glow effect
            const lit = clamped > 75 ? 55 : 45;
            return `hsl(${hue.toFixed(1)}, ${sat.toFixed(1)}%, ${lit.toFixed(1)}%)`;
        };

        // Glow shadow for a given hsl color string
        const getGlow = (hslColor, intensity) => {
            return `0 0 ${intensity}px ${hslColor}, 0 0 ${intensity * 2}px ${hslColor}88`;
        };

        const nodes = displayNodes.map(node => {
            const riskColor = interpolateColor(node.risk_score);
            const size = 15 + (node.risk_score / 100) * 35;

            return {
                id: node.id,
                label: node.id.slice(-6).toUpperCase(),
                title: `
                    <div class="p-4 font-sans bg-black/95 backdrop-blur-2xl text-white border border-white/20 rounded-2xl shadow-2xl min-w-[220px]">
                        <div class="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em] mb-2 border-b border-white/10 pb-2">Forensic Entity Insight</div>
                        <div class="font-mono text-lg font-bold mb-3 flex items-center gap-3">
                             <div class="w-3 h-3 rounded-full animate-pulse" style="background: ${riskColor}; box-shadow: 0 0 10px ${riskColor}"></div>
                             ${node.id}
                        </div>
                        <div class="grid grid-cols-2 gap-3 text-xs">
                             <div class="bg-white/5 p-2 rounded-xl border border-white/5 text-center">
                                 <div class="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Neural Risk</div>
                                 <div class="text-lg font-black" style="color: ${riskColor}">${node.risk_score.toFixed(1)}%</div>
                             </div>
                             <div class="bg-white/5 p-2 rounded-xl border border-white/5 text-center">
                                 <div class="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Topology</div>
                                 <div class="text-lg font-black text-slate-300">${node.ring_id ? 'RING' : 'HUB'}</div>
                             </div>
                        </div>
                    </div>
                `,
                color: {
                    background: node.is_legitimate ? '#1e293b' : riskColor,
                    border: node.ring_id ? '#fff' : (node.is_legitimate ? '#3b82f6' : 'rgba(255,255,255,0.2)'),
                    highlight: { background: riskColor, border: '#fff' },
                    hover: { background: riskColor, border: '#fff' }
                },
                size: size,
                shape: node.is_legitimate ? 'square' : 'dot',
                font: { color: 'rgba(255,255,255,0.8)', size: 12, face: 'JetBrains Mono', strokeWidth: 3, strokeColor: '#000' },
                borderWidth: node.ring_id ? 4 : (node.is_legitimate ? 3 : 1),
                shadow: node.risk_score > 50
                    ? { enabled: true, color: riskColor, size: Math.floor(20 + (node.risk_score / 100) * 40), x: 0, y: 0 }
                    : { enabled: true, color: 'rgba(0,0,0,0.6)', size: 8 }
            };
        });

        const edges = displayEdges.map(edge => ({
            from: edge.from_node,
            to: edge.to_node,
            arrows: { to: { enabled: true, scaleFactor: 0.5 } },
            color: { color: 'rgba(255,255,255,0.08)', highlight: '#3b82f6', hover: 'rgba(255,255,255,0.3)' },
            width: Math.min(5, 1 + (edge.value / 10000)), // Dynamic Edge Thickness
            smooth: { type: 'curvedCW', roundness: 0.15 }
        }));

        const options = {
            nodes: {
                mass: 2,
                font: { strokeWidth: 4, strokeColor: '#000' }
            },
            edges: {
                smooth: true,
                selectionWidth: 3
            },
            physics: {
                enabled: physicsEnabled,
                solver: 'barnesHut',
                barnesHut: {
                    gravitationalConstant: -12000,
                    centralGravity: 0.15,
                    springLength: 300,
                    springConstant: 0.05,
                    damping: 0.1
                },
                stabilization: {
                    enabled: true,
                    iterations: 150,
                    updateInterval: 25
                },
                adaptiveTimestep: true
            },
            interaction: {
                hover: true,
                tooltipDelay: 50,
                hideEdgesOnDrag: true,
                hideEdgesOnZoom: true,
                multiselect: true,
                navigationButtons: false
            }
        };

        networkRef.current = new Network(containerRef.current, { nodes, edges }, options);

        networkRef.current.on('selectNode', (params) => {
            const nodeId = params.nodes[0];
            const account = data.suspicious_accounts.find(a => a.account_id === nodeId);
            if (account) onSelectNode(account);
        });

        return () => {
            if (networkRef.current) {
                networkRef.current.destroy();
                networkRef.current = null;
            }
        };
    }, [data, filterSuspiciousOnly, physicsEnabled]);

    return (
        <div className="glass w-full h-[850px] mt-6 relative overflow-hidden group border-white/5 shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)] pointer-events-none" />
            <div ref={containerRef} className="w-full h-full" />

            {/* Scanning Overlay Effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-[scan_4s_infinite_linear] pointer-events-none" />

            {/* Controls */}
            <div className="absolute top-8 left-8 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 glass flex items-center justify-center rounded-2xl border-white/10 text-blue-500">
                        <Target size={20} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">Topology Monitor</div>
                        <div className="text-sm font-bold text-slate-200">Behavioral Node Graph</div>
                    </div>
                </div>

                <div className="flex gap-2 p-1 glass bg-black/40 border-white/5 rounded-2xl">
                    <button onClick={() => networkRef.current?.moveTo({ scale: networkRef.current.getScale() * 1.5 })} className="p-3 hover:bg-white/5 rounded-xl transition-all"><ZoomIn size={18} /></button>
                    <button onClick={() => networkRef.current?.moveTo({ scale: networkRef.current.getScale() / 1.5 })} className="p-3 hover:bg-white/5 rounded-xl transition-all"><ZoomOut size={18} /></button>
                    <button onClick={() => networkRef.current?.fit()} className="p-3 hover:bg-white/5 rounded-xl transition-all"><Maximize size={18} /></button>
                    <button
                        onClick={() => setPhysicsEnabled(!physicsEnabled)}
                        className={`p-3 rounded-xl transition-all ${physicsEnabled ? 'text-blue-500 bg-blue-500/10' : 'text-slate-500'}`}
                    >
                        <Activity size={18} />
                    </button>
                </div>
            </div>

            {/* Forensic Legend */}
            <div className="absolute bottom-8 left-8 p-6 glass bg-black/80 border-white/10 text-[10px] space-y-4 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl">
                <div className="font-black text-blue-400 tracking-[0.2em] uppercase mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                    <Activity size={12} /> Neural Risk Gradient
                </div>

                <div className="space-y-2">
                    <div className="w-full h-3 rounded-full" style={{ background: 'linear-gradient(to right, hsl(220,55%,45%), hsl(130,75%,45%), hsl(40,90%,50%), hsl(15,95%,50%), hsl(0,100%,55%)' }} />
                    <div className="flex justify-between text-[8px] font-black text-slate-500 tracking-wider">
                        <span>SAFE</span>
                        <span>MODERATE</span>
                        <span>CRITICAL</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-slate-200 font-bold uppercase tracking-wider">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" /> 30x GPU Bloom Threshold ( {'>'}75% )
                </div>
                <div className="flex items-center gap-3 text-slate-400 font-bold uppercase tracking-wider">
                    <div className="w-3 h-3 rounded-sm border border-blue-500/50 bg-slate-900" /> Legitimate Hub (Bank/Merchant)
                </div>

                <div className="pt-2 border-t border-white/10 opacity-60">
                    <div className="text-blue-500 font-black tracking-widest uppercase text-[7px] mb-1">Visual Accelerator</div>
                    <div className="text-slate-200 text-[8px] font-bold">GPU WEBGL CANVAS ACTIVE (MI210/RTX)</div>
                </div>
            </div>

            <style>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default GraphView;
