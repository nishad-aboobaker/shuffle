import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Loader2 } from 'lucide-react';

export default function Register() {
    const [formData, setFormData] = useState({ instituteName: '', email: '', password: '' });
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Details, 2: OTP
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // We import api directly to handle the pre-auth request
    // But register is still handled via context for state update logic? 
    // Actually, AuthContext register calls the API and logs in.
    // We can't easily change authContext signature without breaking other things.
    // So we'll update AuthContext or just call API here and then login manually?
    // Let's use clean separate API calls here for better control of the 2 steps.
    const { login } = useAuth(); // We'll use login after success
    const navigate = useNavigate();

    // Import API to use axios instance
    // But api.js attaches token if exists. Here we have none. Is fine.
    // We need axios or fetch. Let's use standard fetch or import axios locally or use api client.
    // api client handles base url.

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Import dynamically or assume global access? Better to import api util.
            const api = (await import('../utils/api')).default;
            await api.post('/auth/send-otp', { email: formData.email });
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP. User might exist.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const api = (await import('../utils/api')).default;
            const res = await api.post('/auth/register', {
                ...formData,
                otp
            });
            // Auto login logic:
            // The register endpoint returns { token, instituteName } usually?
            // Let's check server/index.js lines 147-152: YES.

            // We can manually set this into context or valid way is to use login function?
            // AuthContext 'register' function does exactly this.
            // But we need to pass OTP to it.
            // For now, let's just use the response and manually login or call login with credentials?
            // Calling login(email, password) would require another round trip.
            // Let's just persist token and reload/redirect.

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('instituteName', res.data.instituteName);
            // Force reload to pick up auth or modify context?
            // Better: use `login` from context but that expects (email, password).
            // Let's redirect to login for simplicity OR update context.
            // Ideally avoid force reload.
            // We can add a specialized "setAuth" to context, or just redirect to login page "Registration Successful, please login".
            // Direct login is smoother.

            // Hack: context refreshes on mount?
            window.location.href = '/';

        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid Code or Error');
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        setStep(1);
        setError('');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
                    <UserPlus className="text-primary" /> Create Institute Account
                </h2>
                {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-200">{error}</div>}

                {step === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Institute Name</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-white border border-gray-300 rounded p-2.5 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                value={formData.instituteName}
                                onChange={e => setFormData({ ...formData, instituteName: e.target.value })}
                            />
                        </div>
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
                            {loading ? <Loader2 className="animate-spin" /> : 'Next: Verify Email'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="text-center text-gray-600 mb-4 text-sm bg-blue-50 p-3 rounded border border-blue-200">
                            We sent a 6-digit code to <b className="text-gray-900">{formData.email}</b>.
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Enter Verification Code</label>
                            <input
                                type="text"
                                required
                                maxLength="6"
                                placeholder="123456"
                                className="w-full bg-white border border-gray-300 rounded p-3 text-gray-900 text-center text-xl tracking-widest focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded transition-colors flex justify-center items-center disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Verify & Create Account'}
                        </button>
                        <button
                            type="button"
                            onClick={goBack}
                            className="w-full text-gray-600 hover:text-gray-900 text-sm py-2 font-medium"
                        >
                            Back to Details
                        </button>
                        <div className="text-center mt-2">
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={loading}
                                className="text-primary hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Resend Verification Code'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-4 text-center text-gray-600 text-sm">
                    Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Login</Link>
                </div>
            </div>
        </div>
    );
}
