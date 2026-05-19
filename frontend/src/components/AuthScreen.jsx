import React, { useState } from 'react';
import { apiRequest } from '../api/client';

export function AuthScreen({ onAuth }) {
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');

    async function submitAuth(event) {
        event.preventDefault();
        setError('');

        try {
            const path = mode === 'login' ? '/auth/login' : '/auth/register';
            const body = mode === 'login'
                ? { email: form.email, password: form.password }
                : form;
            const user = await apiRequest(path, {
                method: 'POST',
                body: JSON.stringify(body)
            });
            onAuth(user);
        } catch (authError) {
            setError(authError.message);
        }
    }

    return (
        <main className="auth-screen">
            <section className="auth-card">
                <div className="brand-row">
                    <div className="brand-mark">R</div>
                    <div>
                        <p className="eyebrow">Mini Repl IDE</p>
                        <h1>Code in your browser</h1>
                    </div>
                </div>

                <div className="auth-tabs">
                    <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
                    <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
                </div>

                <form className="auth-form" onSubmit={submitAuth}>
                    {mode === 'register' && (
                        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" />
                    )}
                    <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" placeholder="Email" />
                    <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" placeholder="Password" />
                    <button type="submit" className="primary">{mode === 'login' ? 'Login' : 'Create account'}</button>
                    <p className="form-error">{error}</p>
                </form>
            </section>
        </main>
    );
}
