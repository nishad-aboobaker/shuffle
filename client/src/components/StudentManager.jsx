import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Trash2, UserPlus, Mail, Users } from 'lucide-react';

export default function StudentManager() {
    const [students, setStudents] = useState([]);
    const [formData, setFormData] = useState({ name: '', email: '', batch: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/students');
            setStudents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/students', formData);
            setFormData({ name: '', email: '', batch: '' });
            fetchStudents();
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/students/${id}`);
            fetchStudents();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-surface p-5 md:p-6 rounded-xl shadow-lg border border-slate-700 h-fit order-2 lg:order-1">
                <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
                    <UserPlus className="text-primary" size={20} /> Add Student
                </h2>
                {error && <div className="bg-red-500/20 text-red-200 p-2 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Name</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-dark border border-slate-600 rounded p-2.5 text-sm md:text-base focus:border-primary outline-none transition-colors"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Email</label>
                        <input
                            required
                            type="email"
                            className="w-full bg-dark border border-slate-600 rounded p-2.5 text-sm md:text-base focus:border-primary outline-none transition-colors"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Batch</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Class 10A"
                            className="w-full bg-dark border border-slate-600 rounded p-2.5 text-sm md:text-base focus:border-primary outline-none transition-colors"
                            value={formData.batch}
                            onChange={e => setFormData({ ...formData, batch: e.target.value })}
                        />
                    </div>
                    <button
                        disabled={loading}
                        className="w-full bg-primary hover:bg-indigo-600 text-white py-2.5 rounded font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
                    >
                        {loading ? 'Adding...' : 'Add Student'}
                    </button>
                </form>
            </div>

            <div className="lg:col-span-2 bg-surface p-5 md:p-6 rounded-xl shadow-lg border border-slate-700 order-1 lg:order-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-2">
                    <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                        <Users className="text-secondary" size={20} /> Student List
                    </h2>
                    <span className="bg-dark px-3 py-1 rounded-full text-xs md:text-sm text-slate-400">Total: {students.length}</span>
                </div>

                <div className="overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700 text-slate-400 text-xs md:text-sm">
                                <th className="p-2 md:p-3">Name</th>
                                <th className="p-2 md:p-3">Email</th>
                                <th className="p-2 md:p-3 text-center">Batch</th>
                                <th className="p-2 md:p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors text-xs md:text-sm">
                                    <td className="p-2 md:p-3 font-medium whitespace-nowrap">{student.name}</td>
                                    <td className="p-2 md:p-3 text-slate-400 max-w-[100px] sm:max-w-[200px] truncate">
                                        {student.email}
                                    </td>
                                    <td className="p-2 md:p-3 text-center">
                                        <span className="bg-slate-700/50 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-slate-300 inline-block min-w-[2em]">
                                            {student.batch}
                                        </span>
                                    </td>
                                    <td className="p-2 md:p-3 text-right">
                                        <button
                                            onClick={() => handleDelete(student._id)}
                                            className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-400/10 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-6 md:p-8 text-center text-slate-500 text-sm">
                                        No students found. Add some to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
