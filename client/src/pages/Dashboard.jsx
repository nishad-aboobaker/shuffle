import React, { useState } from 'react';
import StudentManager from '../components/StudentManager';
import SessionController from '../components/SessionController';
import HistoryView from '../components/HistoryView';
import { useAuth } from '../context/AuthContext';
import { Users, Play, History, Sun, LogOut } from 'lucide-react';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('session');
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-dark text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-6 md:mb-8 flex flex-col md:flex-row items-center justify-between border-b border-gray-700 pb-6 gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                        <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-lg shadow-lg shrink-0">
                            <Sun className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary leading-tight">
                                {user ? user.instituteName : 'Morning Session Manager'}
                            </h1>
                            <p className="text-slate-400 text-xs md:text-sm">Automated And Fair Participation</p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-center w-full md:w-auto overflow-hidden">
                        <nav className="flex bg-surface rounded-lg p-1 w-full md:w-auto overflow-x-auto no-scrollbar scroll-smooth">
                            <div className="flex w-full md:w-auto min-w-max">
                                <button
                                    onClick={() => setActiveTab('session')}
                                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all text-sm md:text-base whitespace-nowrap ${activeTab === 'session' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <Play size={18} /> Session
                                </button>
                                <button
                                    onClick={() => setActiveTab('students')}
                                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all text-sm md:text-base whitespace-nowrap ${activeTab === 'students' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <Users size={18} /> Students
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all text-sm md:text-base whitespace-nowrap ${activeTab === 'history' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <History size={18} /> History
                                </button>
                            </div>
                        </nav>
                        <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors p-2" title="Logout">
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                <main className="transition-all duration-300">
                    {activeTab === 'session' && <SessionController />}
                    {activeTab === 'students' && <StudentManager />}
                    {activeTab === 'history' && <HistoryView />}
                </main>
            </div>
        </div>
    );
}
