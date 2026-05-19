import React from 'react';

export function TerminalPane({ terminalLines, terminalInput, onInputChange, onSubmit }) {
    return (
        <section className="terminal-section">
            <div className="section-heading">
                <h2>Shell</h2>
            </div>
            <pre>{terminalLines.join('\n')}</pre>
            <form className="terminal-form" onSubmit={onSubmit}>
                <span>$</span>
                <input value={terminalInput} onChange={(event) => onInputChange(event.target.value)} autoComplete="off" placeholder="help" />
            </form>
        </section>
    );
}
