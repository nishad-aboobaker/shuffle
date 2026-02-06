import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Loader2 } from 'lucide-react';

export default function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(formData.email, formData.password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.msg || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
                    <LogIn className="text-primary" /> Login
                </h2>
                {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-200">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-white border border-gray-300 rounded p-2.5 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-white border border-gray-300 rounded p-2.5 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <button
                        disabled={loading}
                        className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-2.5 rounded transition-colors flex justify-center items-center disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                    </button>
                </form>
                <div className="mt-4 text-center text-gray-600 text-sm">
                    Don't have an account? <Link to="/register" className="text-primary hover:underline font-medium">Register</Link>
                </div>
            </div>
        </div>
    );
}
