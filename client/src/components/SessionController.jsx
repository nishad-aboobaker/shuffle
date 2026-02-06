import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Play, Check, AlertCircle, RefreshCw, Send } from 'lucide-react';

const DEFAULT_ACTIVITIES = [
    { id: 'host', name: 'Host', defaultCount: 1 },
    { id: 'news', name: 'News Report', defaultCount: 2 },
    { id: 'presentation', name: 'Topic Presentation', defaultCount: 1 },
    { id: 'intro', name: 'Self Introduction', defaultCount: 1 },
    { id: 'thought', name: 'Thought of the Day', defaultCount: 1 },
];

export default function SessionController() {
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');

    // State for activities: Map of id -> { active: bool, count: number }
    const [config, setConfig] = useState(
        DEFAULT_ACTIVITIES.reduce((acc, act) => ({
            ...acc,
            [act.id]: { active: false, count: act.defaultCount, name: act.name }
        }), {})
    );

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch unique batches from students
        api.get('/students').then(res => {
            const unique = [...new Set(res.data.map(s => s.batch))];
            setBatches(unique);
            if (unique.length > 0) setSelectedBatch(unique[0]);
        });
    }, []);

    const toggleActivity = (id) => {
        setConfig(prev => ({
            ...prev,
            [id]: { ...prev[id], active: !prev[id].active }
        }));
    };

    const updateCount = (id, val) => {
        setConfig(prev => ({
            ...prev,
            [id]: { ...prev[id], count: parseInt(val) || 1 }
        }));
    };

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        const activities = Object.entries(config)
            .filter(([_, conf]) => conf.active)
            .map(([_, conf]) => ({ name: conf.name, count: conf.count }));

        if (activities.length === 0) {
            setError("Please select at least one activity.");
            setLoading(false);
            return;
        }

        try {
            const res = await api.post('/session/generate', {
                batch: selectedBatch,
                activities
            });
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.error || "Session generation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">

            {/* Configuration Panel */}
            <div className="bg-surface border border-slate-700 p-5 md:p-8 rounded-xl shadow-lg">
                <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
                    <Play className="text-primary" /> Start Morning Session
                </h2>

                <div className="mb-6">
                    <label className="block text-slate-400 mb-2 text-sm md:text-base">Select Batch</label>
                    <select
                        value={selectedBatch}
                        onChange={e => setSelectedBatch(e.target.value)}
                        className="w-full bg-dark border border-slate-600 rounded p-3 text-base md:text-lg outline-none focus:border-primary"
                    >
                        <option value="" disabled>-- Choose Batch --</option>
                        {batches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>

                <div className="space-y-3 md:space-y-4 mb-8">
                    <label className="block text-slate-400 text-sm md:text-base">Configure Activities</label>
                    {DEFAULT_ACTIVITIES.map(act => (
                        <div key={act.id} className={`flex flex-wrap sm:flex-nowrap items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border transition-all ${config[act.id].active ? 'bg-primary/10 border-primary' : 'bg-dark border-slate-700'}`}>
                            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                <input
                                    type="checkbox"
                                    checked={config[act.id].active}
                                    onChange={() => toggleActivity(act.id)}
                                    className="w-5 h-5 accent-primary cursor-pointer shrink-0"
                                />
                                <span className={`font-medium ${config[act.id].active ? 'text-white' : 'text-slate-400'}`}>
                                    {act.name}
                                </span>
                            </div>

                            {config[act.id].active && (
                                <div className="flex items-center gap-2 ml-8 sm:ml-0 w-full sm:w-auto">
                                    <span className="text-sm text-slate-400 whitespace-nowrap">Count:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full sm:w-20 bg-surface border border-slate-600 rounded p-1.5 text-center outline-none focus:border-primary"
                                        value={config[act.id].count}
                                        onChange={(e) => updateCount(act.id, e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="p-4 bg-red-500/20 text-red-200 rounded-lg flex items-center gap-2 mb-4 text-sm md:text-base">
                        <AlertCircle size={20} className="shrink-0" /> {error}
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={loading || !selectedBatch}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white py-3 md:py-4 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <RefreshCw className="animate-spin" /> : <Send />}
                    {loading ? 'Processing...' : 'Generate & Send Emails'}
                </button>
            </div>

            {/* Results Panel */}
            {result && (
                <div className="bg-surface border border-green-500/30 p-8 rounded-xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>
                    <h3 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2">
                        <Check className="w-6 h-6 border-2 border-green-400 rounded-full p-0.5" />
                        Selection Complete
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                        {result.assignments.map((assign, idx) => (
                            <div key={idx} className="bg-dark p-4 rounded-lg border border-slate-700 flex flex-col">
                                <span className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                                    {assign.activity}
                                </span>
                                <div className="text-lg font-semibold text-white">
                                    {assign.studentName}
                                </div>
                                <div className="text-sm text-slate-400">
                                    {assign.studentEmail}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-700 text-slate-400 text-sm text-center">
                        Current Batch Round: <span className="text-white font-mono">{result.round}</span>
                        <span className="mx-2">•</span>
                        Emails have been sent successfully.
                    </div>
                </div>
            )}

        </div>
    );
}
