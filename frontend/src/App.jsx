import React, { useState, useEffect, useRef } from 'react';
import { Upload, ShieldAlert, Download, Activity, Search, X, Crosshair, BarChart3, Database, Cpu, Zap, Play, Pause, Radio } from 'lucide-react';
import GraphView from './components/GraphView';
import TrendChart from './components/TrendChart';
import { motion, AnimatePresence } from 'framer-motion';

// Animation Variants
const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.05
        }
    }
};

// Simplified Error Boundary
const ErrorBoundary = ({ children }) => {
    const [hasError, setHasError] = useState(false);
    useEffect(() => {
        const handleError = (error) => {
            console.error("React Captured Error:", error);
            setHasError(true);
        };
        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    if (hasError) {
        return (
            <div className="min-h-screen bg-black text-red-500 flex flex-col items-center justify-center p-10 font-mono">
                <ShieldAlert size={48} className="mb-4" />
                <h1 className="text-2xl font-bold mb-2">CRITICAL UI FAILURE</h1>
                <p className="text-slate-400 text-center">The behavioral engine encountered a runtime exception. Check the browser console for details.</p>
                <button onClick={() => window.location.reload()} className="mt-8 px-6 py-2 bg-red-500 text-white rounded-lg">RELOAD SYSTEM</button>
            </div>
        );
    }
    return children;
};

const App = () => {
    const [file, setFile] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ status: '', percent: 0 });
    const [selectedAcc, setSelectedAcc] = useState(null);
    const [error, setError] = useState(null);
    const [filterSuspicious, setFilterSuspicious] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [riskFilter, setRiskFilter] = useState(0);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [isCompactView, setIsCompactView] = useState(false);
    const [selectedRing, setSelectedRing] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

    // Simulation States
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationIndex, setSimulationIndex] = useState(0);
    const [simulationSpeed, setSimulationSpeed] = useState(1);
    const [simulationData, setSimulationData] = useState(null);

    // Simulation Loop
    useEffect(() => {
        let interval;
        if (isSimulating && data) {
            interval = setInterval(() => {
                setSimulationIndex(prev => {
                    const next = prev + 1;
                    if (next >= 100) {
                        setIsSimulating(false);
                        return 100;
                    }
                    return next;
                });
            }, 100 / simulationSpeed);
        }
        return () => clearInterval(interval);
    }, [isSimulating, data, simulationSpeed]);

    // Compute simulation data
    useEffect(() => {
        if (!data || !isSimulating) {
            setSimulationData(data);
            return;
        }

        const totalNodes = data.graph_data.nodes.length;
        const visibleNodeCount = Math.floor((simulationIndex / 100) * totalNodes);

        const visibleNodes = data.graph_data.nodes.slice(0, Math.max(1, visibleNodeCount));
        const visibleNodeIds = new Set(visibleNodes.map(n => n.id));

        const visibleEdges = data.graph_data.edges.filter(e =>
            visibleNodeIds.has(e.from_node) && visibleNodeIds.has(e.to_node)
        );

        setSimulationData({
            ...data,
            graph_data: {
                nodes: visibleNodes,
                edges: visibleEdges
            }
        });
    }, [data, simulationIndex, isSimulating]);

    const handleAIAnalyze = async (accountId) => {
        setAiLoading(true);
        setAiAnalysis(null);
        try {
            const response = await fetch(`${API_BASE_URL}/ai-analyze/${accountId}`, { method: 'POST' });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`AI Analysis Failed (${response.status}): ${text.substring(0, 50)}`);
            }
            const result = await response.json();
            setAiAnalysis(result);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setAiLoading(false);
        }
    };

    const processAnalysisStream = async (response) => {
        if (!response.body) {
            throw new Error("Empty response body from forensic engine.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalDataBuffer = null;

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split('\n\n');
                buffer = parts.pop();

                for (const part of parts) {
                    const line = part.trim();
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.replace('data: ', '');
                        try {
                            const parsed = JSON.parse(jsonStr);
                            if (parsed.error) {
                                setError(parsed.error);
                                setLoading(false);
                                return;
                            }
                            if (parsed.complete) {
                                finalDataBuffer = parsed;
                                setProgress({ status: 'Neural Integration Complete', percent: 100 });
                                // Grace period for the user to see 100%
                                await new Promise(r => setTimeout(r, 1000));
                            } else {
                                if (parsed.graph_data || parsed.suspicious_accounts) {
                                    finalDataBuffer = parsed;
                                }
                                setProgress({
                                    status: parsed.status || 'Processing Graph Shards...',
                                    percent: (parsed.progress || 0) * 100
                                });
                            }
                        } catch (e) {
                            console.error("JSON parse error during stream:", e);
                        }
                    }
                }
            }
            if (finalDataBuffer) {
                setData(finalDataBuffer);
            }
        } catch (streamErr) {
            console.error("Stream reader error:", streamErr);
            setError("Connection Interrupted: The forensic stream was disconnected.");
        }
    };

    const handleGenerateDemo = async () => {
        setLoading(true);
        setError(null);
        setProgress({ status: 'Synthesizing Demo Dataset...', percent: 5 });
        try {
            const response = await fetch(`${API_BASE_URL}/generate-demo`, { method: 'POST' });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Demo Generation Failed (${response.status}): ${text.substring(0, 100)}`);
            }
            await processAnalysisStream(response);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setLoading(true);
        setError(null);
        setProgress({ status: 'Initializing Engine...', percent: 5 });

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Upload failed (${response.status})`);
            }

            await processAnalysisStream(response);
        } catch (err) {
            setError(err.message || 'Failed to analyze data');
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = () => {
        if (!data) return;

        const exportData = {
            suspicious_accounts: data.suspicious_accounts.map(acc => ({
                account_id: acc.account_id,
                suspicion_score: acc.suspicion_score,
                detected_patterns: acc.detected_patterns,
                ring_id: acc.ring_id
            })),
            fraud_rings: data.fraud_rings.map(ring => ({
                ring_id: ring.ring_id,
                member_accounts: ring.member_accounts,
                pattern_type: ring.pattern_type,
                risk_score: ring.risk_score
            })),
            summary: {
                total_accounts_analyzed: data.summary.total_accounts_analyzed,
                suspicious_accounts_flagged: data.summary.suspicious_accounts_flagged,
                fraud_rings_detected: data.summary.fraud_rings_detected,
                processing_time_seconds: data.summary.processing_time_seconds
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `money_muling_analysis_${Date.now()}.json`;
        a.click();
    };

    return (
        <div className="min-h-screen bg-[#070708] text-slate-100 p-4 md:p-10 font-sans selection:bg-indigo-500/30 custom-scrollbar">
            {/* Nav / Hero Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-[2400px] mx-auto mb-16 flex flex-col xl:flex-row xl:items-end justify-between gap-10 px-4 md:px-12"
            >
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-indigo-500 mb-4 font-mono text-sm tracking-widest font-bold uppercase overflow-hidden">
                        <Zap size={14} className="fill-current" />
                        <span className="animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]">AMD ROCm 6.0 HPC Engine Active</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-gradient pb-2 bg-clip-text">
                        MULE <br /><span className="text-indigo-500">TRACE X</span>
                    </h1>
                    <p className="mt-4 text-slate-400 text-lg max-w-2xl font-light leading-relaxed">
                        Identify money muling networks and dispersal hierarchies using
                        <span className="text-slate-200"> Distributed Graph Neural Networks</span> on AMD Instinct™ hardware.
                    </p>
                </div>

                {/* Unified Command Center */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="glass-shiny p-6 rounded-[2.5rem] flex flex-wrap items-center gap-6 shadow-2xl border-white/10"
                >
                    <div className="flex flex-col gap-2">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Command Center</div>
                        <div className="flex items-center gap-3">
                            <label className="relative overflow-hidden flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl cursor-pointer transition-all active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                                <Upload size={18} className={loading ? 'animate-bounce' : ''} />
                                <span className="font-bold tracking-tight uppercase text-sm">{loading ? 'Processing...' : 'Ingest Data'}</span>
                                <input type="file" className="hidden" accept=".csv" onChange={handleUpload} disabled={loading} />
                            </label>

                            <button
                                onClick={handleGenerateDemo}
                                className="px-6 py-4 glass border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/5 text-indigo-400"
                            >
                                <Database size={16} className="inline mr-2" /> Load Demo Data
                            </button>
                        </div>
                    </div>

                    <div className="h-12 w-px bg-white/5 mx-2 hidden md:block" />

                    {data && (
                        <>
                            <div className="flex flex-col gap-2">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Risk Filter: {riskFilter}%</div>
                                <div className="px-6 py-4 glass border-white/5 rounded-2xl flex items-center group">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={riskFilter}
                                        onChange={(e) => setRiskFilter(parseInt(e.target.value))}
                                        className="w-32 accent-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-auto">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-right">Reports</div>
                                <button
                                    onClick={downloadReport}
                                    className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10 text-sm font-bold uppercase"
                                >
                                    <Download size={18} /> Download JSON
                                </button>
                            </div>
                        </>
                    )}

                    {!data && (
                        <div className="px-10 py-10 glass border-white/5 border-dashed rounded-[2rem] text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex flex-col items-center gap-2">
                            <Cpu size={20} className="opacity-20" />
                            System Standby
                        </div>
                    )}
                </motion.div>
            </motion.header>

            {/* Error or Progress State */}
            {loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full max-w-[2400px] mx-auto mb-10 overflow-hidden glass p-10 flex flex-col items-center justify-center relative rounded-[3rem]"
                >
                    <div className="absolute inset-0 shimmer opacity-5 shadow-[inset_0_0_50px_rgba(99,102,241,0.2)]" />
                    <Cpu size={56} className="text-indigo-500 mb-6 pulse-red" />
                    <AnimatePresence mode="wait">
                        <motion.h3
                            key={progress.status}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-xl font-bold font-mono tracking-widest text-indigo-400 h-8"
                        >
                            {progress.status}
                        </motion.h3>
                    </AnimatePresence>
                    <div className="w-full max-w-md h-1.5 bg-white/5 rounded-full mt-6 overflow-hidden">
                        <motion.div
                            className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.percent}%` }}
                            transition={{
                                type: "spring",
                                stiffness: 60,
                                damping: 15,
                                mass: 0.8
                            }}
                        />
                    </div>
                </motion.div>
            )}

            {error && (
                <div className="w-full max-w-[2400px] mx-auto mb-10 p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top duration-300">
                    <ShieldAlert size={24} />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {data && !loading && (
                <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="w-full max-w-[2400px] mx-auto space-y-10 px-4 md:px-12"
                >
                    {/* KPI Ribbon */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {[
                            { label: 'HPC Throughput', val: data.summary?.hpc_metrics?.throughput_p99 || '12.4M/s', color: 'text-white' },
                            { label: 'Neural Latency', val: `${data.summary?.hpc_metrics?.latency_ms || '8.2'}ms`, color: 'text-white' },
                            { label: 'Accounts Scan', val: data.summary?.total_accounts_analyzed, color: 'text-white' },
                            { label: 'Mule Clusters', val: data.summary?.fraud_rings_detected, color: 'text-indigo-400' },
                            { label: 'Avg Risk Index', val: data.summary?.avg_risk_score, color: 'text-rose-400' },
                            { label: 'Flagged Nodes', val: data.summary?.suspicious_accounts_flagged, color: 'text-white' },
                            { label: 'MI300 Analysis', val: `${data.summary?.processing_time_seconds.toFixed(2)}s`, color: 'text-indigo-400', special: true },
                        ].map((kpi, i) => (
                            <motion.div
                                key={i}
                                variants={fadeInUp}
                                className={`bg-slate-800/40 p-4 rounded-2xl border ${kpi.special ? 'border-indigo-500/30' : 'border-white/5'} backdrop-blur-md`}
                            >
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 opacity-50">{kpi.label}</p>
                                <p className={`text-2xl font-black ${kpi.color} tracking-tighter`}>{kpi.val}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Main Workspace */}
                    <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-10">
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black uppercase tracking-widest text-slate-500 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                    Forensic Topology Matrix
                                </h2>

                                {data && (
                                    <div className="flex items-center gap-6 glass px-6 py-3 border-white/5 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => {
                                                    if (simulationIndex >= 100) setSimulationIndex(0);
                                                    setIsSimulating(!isSimulating);
                                                }}
                                                className={`p-2 rounded-lg transition-all ${isSimulating ? 'bg-red-500/10 text-red-500' : 'bg-indigo-500/10 text-indigo-500'}`}
                                            >
                                                {isSimulating ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                            </button>
                                            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
                                                <div
                                                    className="h-full bg-indigo-500 transition-all duration-300"
                                                    style={{ width: `${simulationIndex}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black font-mono text-slate-500 w-12 text-right">
                                                {simulationIndex}%
                                            </span>
                                        </div>
                                        <div className="h-4 w-px bg-white/10" />
                                        <div className="flex border border-white/5 rounded-lg overflow-hidden">
                                            {[1, 2, 5].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setSimulationSpeed(s)}
                                                    className={`px-3 py-1 text-[9px] font-black uppercase transition-all ${simulationSpeed === s ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                                                >
                                                    {s}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <GraphView
                                data={simulationData || data}
                                onSelectNode={setSelectedAcc}
                                filterSuspiciousOnly={filterSuspicious}
                                highlightNode={searchQuery.length > 5 ? searchQuery : null}
                            />
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-4 py-4 border-b border-white/5">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                                Forensic Ledger & Network Clusters
                            </h2>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                {/* Left: Threat Stream Card Grid */}
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Threat Stream</h3>
                                            <button
                                                onClick={() => setIsCompactView(!isCompactView)}
                                                className={`text-[9px] px-3 py-1 rounded-full border font-black uppercase tracking-widest transition-all ${isCompactView ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-200 opacity-100 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-indigo-500/5 border-indigo-500/10 text-indigo-300 opacity-50 hover:opacity-100'}`}
                                            >
                                                Compact View
                                            </button>
                                            {selectedRing && (
                                                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 px-3 py-1 rounded-full">
                                                    <span className="text-[9px] font-black uppercase tracking-widest font-mono">Filter: {selectedRing}</span>
                                                    <button onClick={() => setSelectedRing(null)} className="hover:text-rose-100 transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                            {data.suspicious_accounts.filter(a => a.suspicion_score >= riskFilter && (!selectedRing || a.ring_id === selectedRing)).length} Entities
                                        </div>
                                    </div>

                                    <motion.div
                                        variants={staggerContainer}
                                        className={`grid gap-4 max-h-[1200px] overflow-y-auto pr-2 custom-scrollbar ${isCompactView ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}
                                    >
                                        {data.suspicious_accounts
                                            .filter(a => a.suspicion_score >= riskFilter && (!selectedRing || a.ring_id === selectedRing))
                                            .map((acc) => (
                                                <motion.div
                                                    key={acc.account_id}
                                                    variants={fadeInUp}
                                                    whileHover={{ scale: 1.02, y: -5 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => {
                                                        setSelectedAcc(acc);
                                                        handleAIAnalyze(acc.account_id);
                                                    }}
                                                    className={`group relative glass glass-shine rounded-[2.5rem] border-white/5 cursor-pointer transition-all hover:bg-white/5 hover:border-indigo-500/20 hover-glow ${selectedAcc?.account_id === acc.account_id ? 'bg-indigo-500/10 border-indigo-500/30' : ''} ${isCompactView ? 'p-4' : 'p-8'}`}
                                                >
                                                    <div className={`flex justify-between items-start ${isCompactView ? 'mb-2' : 'mb-6'}`}>
                                                        <div className="flex flex-col max-w-[65%]">
                                                            <div className={`font-black text-indigo-300 font-mono tracking-widest uppercase truncate ${isCompactView ? 'text-[9px] mb-1' : 'text-xs mb-1.5'}`}>{acc.account_id}</div>
                                                            {!isCompactView && (
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {acc.detected_patterns.slice(0, 2).map(p => (
                                                                        <span key={p} className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-black uppercase tracking-widest truncate max-w-[120px] shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                                                                            {p.replace('_', ' ')}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className={`font-black tracking-tighter ${acc.suspicion_score > 70 ? 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]'} ${isCompactView ? 'text-xl' : 'text-3xl'}`}>
                                                            {acc.suspicion_score}<span className="text-xs opacity-50">%</span>
                                                        </div>
                                                    </div>

                                                    <div className={isCompactView ? 'mt-3' : 'mt-8'}>
                                                        {!isCompactView && (
                                                            <div className="mt-4">
                                                                <div className="flex justify-between items-end mb-1.5">
                                                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Risk Indicator</div>
                                                                </div>
                                                                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${acc.suspicion_score}%` }}
                                                                        transition={{ type: "spring", stiffness: 50, damping: 15 }}
                                                                        className={`h-full rounded-full ${acc.suspicion_score > 70 ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'bg-gradient-to-r from-orange-600 to-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.6)]'}`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                                                    </div>
                                                </motion.div>
                                            ))}
                                    </motion.div>
                                </div>

                                {/* Right: Network Clusters side panel */}
                                <div className="lg:col-span-4 space-y-6">
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-3">
                                        <Radio size={12} className="text-indigo-500 animate-pulse" />
                                        Network Clusters
                                    </h3>

                                    <div className="glass rounded-[2rem] border-white/5 overflow-hidden h-[1200px] overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-white/5 border-b border-white/5">
                                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Ring ID</th>
                                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Score</th>
                                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Nodes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.fraud_rings.map(ring => (
                                                    <tr
                                                        key={ring.ring_id}
                                                        onClick={() => setSelectedRing(selectedRing === ring.ring_id ? null : ring.ring_id)}
                                                        className={`border-b border-white/5 transition-colors group cursor-pointer ${selectedRing === ring.ring_id ? 'bg-indigo-500/20 border-l-2 border-l-indigo-400' : 'hover:bg-indigo-500/5'}`}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${ring.risk_score > 70 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]'}`} />
                                                                <div className={`text-[10px] font-black font-mono tracking-tighter uppercase ${ring.risk_score > 70 ? 'text-rose-200' : 'text-indigo-200'}`}>{ring.ring_id}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className={`text-sm font-black ${ring.risk_score > 70 ? 'text-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.4)]' : 'text-orange-400 drop-shadow-[0_0_5px_rgba(249,115,22,0.4)]'}`}>
                                                                {ring.risk_score}%
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/5 text-[10px] font-black text-slate-300 uppercase inline-block min-w-[30px] text-center">{ring.member_accounts.length}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                </motion.div>
            )}

            {/* Account Insight Overlay */}
            <AnimatePresence>
                {selectedAcc && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-3xl bg-black/95"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="glass max-w-4xl w-full p-0 relative border-white/10 shadow-[0_32px_128px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh] rounded-[3rem]"
                        >
                            <button
                                onClick={() => {
                                    setSelectedAcc(null);
                                    setAiAnalysis(null);
                                }}
                                className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 z-[110] backdrop-blur-md"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="flex flex-col md:flex-row items-start gap-10 mb-12">
                                    <motion.div
                                        variants={fadeInUp}
                                        className={`p-8 rounded-[2rem] shrink-0 ${selectedAcc.suspicion_score > 70 ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-orange-500/10 border border-orange-500/20'}`}
                                    >
                                        <ShieldAlert size={48} className={selectedAcc.suspicion_score > 70 ? 'text-rose-500' : 'text-orange-500'} />
                                    </motion.div>
                                    <motion.div variants={fadeInUp} className="flex-1">
                                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">AI Forensic Node Report</div>
                                        <h2 className="text-5xl font-black font-mono tracking-tighter break-all text-white uppercase">{selectedAcc.account_id}</h2>
                                        <div className="flex flex-wrap gap-2 mt-6">
                                            {selectedAcc.detected_patterns.map(tag => (
                                                <span key={tag} className="text-[10px] px-4 py-1.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-300 font-black uppercase tracking-widest">
                                                    {tag.replace('_', ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                    <motion.div variants={fadeInUp} className="text-right">
                                        <div className={`text-7xl font-black tracking-tighter ${selectedAcc.suspicion_score > 70 ? 'text-rose-500' : 'text-orange-400'}`}>
                                            {selectedAcc.suspicion_score}%
                                        </div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">S_X RISK INDEX</div>
                                        <div className="text-[11px] font-black text-indigo-400 mt-2">GNN Pr: {((selectedAcc.ml_probability || 0) * 100).toFixed(2)}%</div>
                                    </motion.div>
                                </motion.div>

                                <motion.div variants={fadeInUp} className="space-y-12">
                                    <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Neural Narrative</div>
                                        <p className="text-xl text-slate-300 leading-relaxed font-light italic">"{selectedAcc.explanation}"</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Activity Velocity</div>
                                            <TrendChart transactions={selectedAcc.recent_transactions} />
                                        </div>
                                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Topology Status</div>
                                            <div className="text-2xl font-black text-white flex items-center gap-3">
                                                {selectedAcc.is_legitimate_hub ? <Activity className="text-indigo-400" /> : <Zap className="text-rose-500" />}
                                                {selectedAcc.is_legitimate_hub ? 'Verified Institutional Hub' : 'Neutral Network Node'}
                                            </div>
                                            <p className="mt-4 text-sm text-slate-500 leading-relaxed">
                                                Node identified via dynamic METIS partitioning for Slingshot low-latency evaluation.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Advanced AI Deep Dive */}
                                    <div className="pt-10 border-t border-white/5">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3">
                                                <Cpu size={18} className="animate-pulse" /> Neural Reconstruction Lab
                                            </h3>
                                            {!aiAnalysis && (
                                                <button
                                                    onClick={() => handleAIAnalyze(selectedAcc.account_id)}
                                                    disabled={aiLoading}
                                                    className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${aiLoading ? 'bg-white/5 text-slate-600' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/20'}`}
                                                >
                                                    Analyze with MI300X
                                                </button>
                                            )}
                                        </div>

                                        {aiLoading ? (
                                            <div className="py-12 flex flex-col items-center glass border-indigo-500/10 rounded-[2.5rem]">
                                                <div className="w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mb-6" />
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">Running Spatio-Temporal Graph Inference...</p>
                                            </div>
                                        ) : aiAnalysis && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                                <div className="p-10 glass border-indigo-500/20 rounded-[3rem] bg-indigo-500/5">
                                                    <p className="text-2xl font-black text-white leading-tight mb-8">
                                                        {aiAnalysis.forensic_summary}
                                                    </p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {aiAnalysis.behavioral_flags.map((flag, idx) => (
                                                            <div key={idx} className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                                                <div className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">{flag.type} Vector</div>
                                                                <div className="text-sm text-slate-400 font-medium leading-relaxed">{flag.detail}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] flex flex-wrap items-center gap-6">
                                                    <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                                                        <ShieldAlert className="text-white" size={24} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Slingshot Guard Action</div>
                                                        <p className="text-sm font-bold text-rose-400">{aiAnalysis.recommendation}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] font-black text-slate-500 uppercase">Detection Confidence</div>
                                                        <div className="text-2xl font-black text-white">{(aiAnalysis.prediction_confidence * 100).toFixed(1)}%</div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!data && !loading && (
                <div className="w-full max-w-[2400px] mx-auto py-40 glass border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center px-10 relative overflow-hidden group rounded-[4rem]">
                    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <Upload size={80} className="text-indigo-500/20 mb-8 group-hover:scale-110 group-hover:text-indigo-500 transition-all duration-700" />
                    <h2 className="text-5xl font-black tracking-tighter mb-4 opacity-50 uppercase text-white">CLUSTER AWAITING INGESTION</h2>
                    <p className="text-slate-500 text-lg max-w-md font-light leading-relaxed">
                        Deploy your transaction dataset to the <span className="text-indigo-500 font-bold uppercase">MULE TRACE X</span> distributed network for real-time forensic neural analysis.
                    </p>
                    <div className="mt-12 flex gap-4">
                        <div className="px-6 py-2 bg-white/5 rounded-full text-[10px] font-black tracking-[0.2em] opacity-30 uppercase border border-white/5">AMD Instinct™ MI300 Enabled</div>
                        <div className="px-6 py-2 bg-white/5 rounded-full text-[10px] font-black tracking-[0.2em] opacity-30 uppercase border border-white/5">HPE Slingshot Link-Ready</div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AppSafe = () => (
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);

export default AppSafe;
