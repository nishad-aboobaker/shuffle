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
            <div className="lg:col-span-1 bg-white p-5 md:p-6 rounded-lg shadow-sm border border-gray-200 h-fit order-2 lg:order-1">
                <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900">
                    <UserPlus className="text-primary" size={20} /> Add Student
                </h2>
                {error && <div className="bg-red-50 text-red-700 p-2 rounded mb-4 text-sm border border-red-200">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-700 font-medium mb-1">Name</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-white border border-gray-300 rounded p-2.5 text-sm md:text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-gray-900"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700 font-medium mb-1">Email</label>
                        <input
                            required
                            type="email"
                            className="w-full bg-white border border-gray-300 rounded p-2.5 text-sm md:text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-gray-900"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700 font-medium mb-1">Batch</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Class 10A"
                            className="w-full bg-white border border-gray-300 rounded p-2.5 text-sm md:text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-gray-900"
                            value={formData.batch}
                            onChange={e => setFormData({ ...formData, batch: e.target.value })}
                        />
                    </div>
                    <button
                        disabled={loading}
                        className="w-full bg-primary hover:bg-blue-700 text-white py-2.5 rounded font-semibold transition-colors disabled:opacity-50 flex justify-center items-center"
                    >
                        {loading ? 'Adding...' : 'Add Student'}
                    </button>
                </form>
            </div>

            <div className="lg:col-span-2 bg-white p-5 md:p-6 rounded-lg shadow-sm border border-gray-200 order-1 lg:order-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-2">
                    <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2 text-gray-900">
                        <Users className="text-green-600" size={20} /> Student List
                    </h2>
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-xs md:text-sm text-gray-600 font-medium">Total: {students.length}</span>
                </div>

                <div className="overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 text-gray-600 text-xs md:text-sm bg-gray-50">
                                <th className="p-2 md:p-3 font-semibold">Name</th>
                                <th className="p-2 md:p-3 font-semibold">Email</th>
                                <th className="p-2 md:p-3 text-center font-semibold">Batch</th>
                                <th className="p-2 md:p-3 text-right font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-xs md:text-sm">
                                    <td className="p-2 md:p-3 font-medium whitespace-nowrap text-gray-900">{student.name}</td>
                                    <td className="p-2 md:p-3 text-gray-600 max-w-[100px] sm:max-w-[200px] truncate">
                                        {student.email}
                                    </td>
                                    <td className="p-2 md:p-3 text-center">
                                        <span className="bg-blue-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-primary border border-blue-200 inline-block min-w-[2em] font-medium">
                                            {student.batch}
                                        </span>
                                    </td>
                                    <td className="p-2 md:p-3 text-right">
                                        <button
                                            onClick={() => handleDelete(student._id)}
                                            className="text-red-600 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-6 md:p-8 text-center text-gray-500 text-sm">
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
