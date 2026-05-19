import React, { useEffect, useState } from 'react';
import { apiRequest } from './api/client';
import { AuthScreen } from './components/AuthScreen';
import { IdeApp } from './components/IdeApp';

export function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiRequest('/auth/me')
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <main className="auth-screen">
                <section className="auth-card">
                    <p className="eyebrow">Loading</p>
                    <h1>Opening workspace</h1>
                </section>
            </main>
        );
    }

    if (!user) {
        return <AuthScreen onAuth={setUser} />;
    }

    return <IdeApp user={user} onLogout={() => setUser(null)} />;
}
