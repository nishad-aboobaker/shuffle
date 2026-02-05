import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, RefreshCcw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function HistoryView() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/history`);
            setLogs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Session History</h2>
                <button
                    onClick={fetchHistory}
                    className="p-2 bg-surface border border-slate-600 rounded hover:bg-slate-700 transition-colors"
                >
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="space-y-6">
                {logs.map(log => (
                    <div key={log._id} className="bg-surface border border-slate-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-dark/50 p-4 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2 text-slate-300">
                                <Calendar size={18} className="text-primary shrink-0" />
                                <span className="font-medium">{new Date(log.date).toLocaleDateString()}</span>
                                <span className="text-slate-500 text-sm">
                                    {new Date(log.date).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="flex gap-4 text-sm w-full sm:w-auto justify-between sm:justify-start">
                                <span className="text-slate-400">Batch: <span className="text-white">{log.batch}</span></span>
                                <span className="text-slate-400">Round: <span className="text-white">{log.round}</span></span>
                            </div>
                        </div>

                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {log.assignments.map((assign, i) => (
                                <div key={i} className="flex flex-col bg-dark p-3 rounded border border-slate-700/50">
                                    <span className="text-xs text-slate-500 uppercase tracking-wider mb-1">{assign.activity}</span>
                                    <span className="font-medium truncate">{assign.studentName}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {logs.length === 0 && !loading && (
                    <div className="text-center p-12 text-slate-500 bg-surface rounded-xl border border-slate-700 border-dashed">
                        No session history found.
                    </div>
                )}
            </div>
        </div>
    );
}
