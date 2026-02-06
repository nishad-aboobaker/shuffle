import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Calendar, RefreshCcw } from 'lucide-react';

export default function HistoryView() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/history');
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
                <h2 className="text-2xl font-bold text-gray-900">Session History</h2>
                <button
                    onClick={fetchHistory}
                    className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                    <RefreshCcw size={18} className={loading ? 'animate-spin text-primary' : 'text-gray-600'} />
                </button>
            </div>

            <div className="space-y-6">
                {logs.map(log => (
                    <div key={log._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2 text-gray-900">
                                <Calendar size={18} className="text-primary shrink-0" />
                                <span className="font-semibold">{new Date(log.date).toLocaleDateString()}</span>
                                <span className="text-gray-500 text-sm">
                                    {new Date(log.date).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="flex gap-4 text-sm w-full sm:w-auto justify-between sm:justify-start">
                                <span className="text-gray-600">Batch: <span className="text-gray-900 font-medium">{log.batch}</span></span>
                                <span className="text-gray-600">Round: <span className="text-gray-900 font-medium">{log.round}</span></span>
                            </div>
                        </div>

                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {log.assignments.map((assign, i) => (
                                <div key={i} className="flex flex-col bg-gray-50 p-3 rounded border border-gray-200">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">{assign.activity}</span>
                                    <span className="font-semibold truncate text-gray-900">{assign.studentName}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {logs.length === 0 && !loading && (
                    <div className="text-center p-12 text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
                        No session history found.
                    </div>
                )}
            </div>
        </div>
    );
}
