import React, { useState, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../hooks/useClickOutside';

export const Header: React.FC = () => {
    const { user, setUser, isLoading } = useUser();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useClickOutside(dropdownRef, () => {
        if (isDropdownOpen) setIsDropdownOpen(false);
    });

    const handleLogout = () => {
        // Clear the token from localStorage
        localStorage.removeItem('token');
        // Clear the user from context
        setUser(null);
        // Redirect to login page
        navigate('/login');
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Workout AI Trainer</h1>
                <div className="flex items-center space-x-4">
                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center space-x-2 focus:outline-none group"
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center transform transition-all duration-200 group-hover:scale-105">
                                    <span className="text-sm font-medium text-gray-600">
                                        {user.firstName?.[0] || user.email[0].toUpperCase()}
                                    </span>
                                </div>
                                <span className="font-medium text-gray-900 transition-colors duration-200 group-hover:text-gray-600">
                                    {user.displayName || user.firstName || user.email}
                                </span>
                                <svg
                                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ease-in-out group-hover:text-gray-600 ${
                                        isDropdownOpen ? 'transform rotate-180' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            <div
                                className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50 transform transition-all duration-200 origin-top-right
                                    ${isDropdownOpen 
                                        ? 'opacity-100 scale-100 translate-y-0' 
                                        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
                            >
                                <div className="px-4 py-2 text-sm text-gray-500 border-b">
                                    Signed in as<br />
                                    <span className="font-medium text-gray-900">{user.email}</span>
                                </div>
                                {/* TODO: Add profile/avatar customization */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors duration-150 hover:text-red-600"
                                >
                                    Sign out
                                </button>
                            </div>
                        </div>
                    ) : (
                        <span className="text-gray-700">Welcome, Guest</span>
                    )}
                </div>
            </div>
        </header>
    );
}; 