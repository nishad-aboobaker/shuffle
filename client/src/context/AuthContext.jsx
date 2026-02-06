import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // Here we could verify token or fetch user details if needed
            // For now, we assume token presence = logged in, payload has ID
            // Maybe decode it if we need info, but we saved instituteName on login
            const savedName = localStorage.getItem('instituteName');
            if (savedName) setUser({ instituteName: savedName });
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('instituteName', res.data.instituteName);
        setToken(res.data.token);
        setUser({ instituteName: res.data.instituteName });
    };

    const register = async (instituteName, email, password) => {
        const res = await api.post('/auth/register', { instituteName, email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('instituteName', instituteName);
        setToken(res.data.token);
        setUser({ instituteName });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('instituteName');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
