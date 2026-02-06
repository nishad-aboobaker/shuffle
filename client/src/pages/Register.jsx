import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Loader2 } from 'lucide-react';

export default function Register() {
    const [formData, setFormData] = useState({ instituteName: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(formData.instituteName, formData.email, formData.password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-4">
            <div className="bg-surface p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-800">
                <h2 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                    <UserPlus /> Create Institute Account
                </h2>
                {error && <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Institute Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-dark border border-gray-700 rounded p-2 text-white focus:border-primary outline-none"
                            value={formData.instituteName}
                            onChange={e => setFormData({ ...formData, instituteName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-dark border border-gray-700 rounded p-2 text-white focus:border-primary outline-none"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-dark border border-gray-700 rounded p-2 text-white focus:border-primary outline-none"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <button
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded transition-colors flex justify-center items-center"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                    </button>
                </form>
                <div className="mt-4 text-center text-slate-400 text-sm">
                    Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
                </div>
            </div>
        </div>
    );
}
