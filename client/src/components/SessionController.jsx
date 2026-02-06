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

    const [customName, setCustomName] = useState('');
    const [customCount, setCustomCount] = useState(1);

    const updateCount = (id, val) => {
        setConfig(prev => ({
            ...prev,
            [id]: { ...prev[id], count: parseInt(val) || 1 }
        }));
    };

    const addCustomActivity = (e) => {
        e.preventDefault();
        if (!customName.trim()) return;

        const id = `custom_${Date.now()}`;
        setConfig(prev => ({
            ...prev,
            [id]: { active: true, count: parseInt(customCount), name: customName }
        }));
        setCustomName('');
        setCustomCount(1);
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
            <div className="bg-white border border-gray-200 p-5 md:p-8 rounded-lg shadow-sm">
                <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
                    <Play className="text-primary" /> Start Morning Session
                </h2>

                <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">Select Batch</label>
                    <select
                        value={selectedBatch}
                        onChange={e => setSelectedBatch(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded p-3 text-base md:text-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-900"
                    >
                        <option value="" disabled>-- Choose Batch --</option>
                        <option value="ALL">All Batches (Entire Institute)</option>
                        {batches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>

                <div className="space-y-3 md:space-y-4 mb-8">
                    <div className="flex justify-between items-center">
                        <label className="block text-gray-700 font-medium text-sm md:text-base">Configure Activities</label>
                    </div>

                    {/* Custom Activity Adder */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            placeholder="Add Custom Activity (e.g. Surprise Quiz)"
                            className="flex-1 bg-white border border-gray-300 rounded p-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-900"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                        />
                        <input
                            type="number"
                            min="1"
                            className="w-20 bg-white border border-gray-300 rounded p-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-center text-gray-900"
                            value={customCount}
                            onChange={(e) => setCustomCount(e.target.value)}
                        />
                        <button
                            onClick={addCustomActivity}
                            disabled={!customName.trim()}
                            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm disabled:opacity-50 font-medium"
                        >
                            Add
                        </button>
                    </div>

                    {Object.entries(config).map(([id, act]) => (
                        <div key={id} className={`flex flex-wrap sm:flex-nowrap items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border transition-all ${act.active ? 'bg-blue-50 border-primary' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                <input
                                    type="checkbox"
                                    checked={act.active}
                                    onChange={() => toggleActivity(id)}
                                    className="w-5 h-5 accent-primary cursor-pointer shrink-0"
                                />
                                <span className={`font-medium ${act.active ? 'text-gray-900' : 'text-gray-600'}`}>
                                    {act.name}
                                </span>
                            </div>

                            {act.active && (
                                <div className="flex items-center gap-2 ml-8 sm:ml-0 w-full sm:w-auto">
                                    <span className="text-sm text-gray-600 whitespace-nowrap">Count:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full sm:w-20 bg-white border border-gray-300 rounded p-1.5 text-center outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-900"
                                        value={act.count}
                                        onChange={(e) => updateCount(id, e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 mb-4 text-sm md:text-base border border-red-200">
                        <AlertCircle size={20} className="shrink-0" /> {error}
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={loading || !selectedBatch}
                    className="w-full bg-primary hover:bg-blue-700 text-white py-3 md:py-4 rounded-lg font-semibold text-lg shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <RefreshCw className="animate-spin" /> : <Send />}
                    {loading ? 'Processing...' : 'Generate & Send Emails'}
                </button>
            </div>

            {/* Results Panel */}
            {result && (
                <div className="bg-white border border-green-200 p-8 rounded-lg shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-600"></div>
                    <h3 className="text-xl font-bold text-green-700 mb-6 flex items-center gap-2">
                        <Check className="w-6 h-6 border-2 border-green-600 rounded-full p-0.5" />
                        Selection Complete
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                        {result.assignments.map((assign, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col">
                                <span className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">
                                    {assign.activity}
                                </span>
                                <div className="text-lg font-semibold text-gray-900">
                                    {assign.studentName}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {assign.studentEmail}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200 text-gray-600 text-sm text-center">
                        Current Batch Round: <span className="text-gray-900 font-mono font-semibold">{result.round}</span>
                        <span className="mx-2">•</span>
                        Emails have been sent successfully.
                    </div>
                </div>
            )}

        </div>
    );
}
