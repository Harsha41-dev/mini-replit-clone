import React, { useState } from 'react';

export function ProjectList({ projects, selectedProjectId, onSelectProject, onCreateProject }) {
    const [name, setName] = useState('');
    const [template, setTemplate] = useState('node');

    async function submitProject(event) {
        event.preventDefault();
        if (!name.trim()) return;
        await onCreateProject(name, template);
        setName('');
    }

    return (
        <section className="panel-section">
            <div className="section-heading">
                <h2>Repls</h2>
            </div>
            <form className="stack-form" onSubmit={submitProject}>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="New repl name" maxLength="40" />
                <div className="inline-fields">
                    <select value={template} onChange={(event) => setTemplate(event.target.value)}>
                        <option value="node">Node</option>
                        <option value="web">Web</option>
                        <option value="python">Python</option>
                    </select>
                    <button type="submit">Create</button>
                </div>
            </form>
            <div className="project-list">
                {projects.map((project) => (
                    <button
                        key={project.id}
                        type="button"
                        className={'project-button ' + (project.id === selectedProjectId ? 'active' : '')}
                        onClick={() => onSelectProject(project.id)}
                    >
                        <span>{project.name}</span>
                        <span className="project-template">{project.template}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}
