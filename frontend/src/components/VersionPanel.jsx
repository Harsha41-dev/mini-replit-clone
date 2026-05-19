import React from 'react';

export function VersionPanel({ targetPath, versions, onRestore, onClose }) {
    if (!targetPath) return null;

    return (
        <div className="modal-backdrop">
            <section className="version-panel">
                <div className="section-heading">
                    <h2>History</h2>
                    <button type="button" onClick={onClose}>Close</button>
                </div>
                <p className="version-path">{targetPath}</p>
                <div className="version-list">
                    {versions.length === 0 && <p className="empty-folder">No saved versions yet</p>}
                    {versions.map((version) => (
                        <article key={version.id} className="version-item">
                            <div>
                                <strong>{version.action}</strong>
                                <span>{new Date(version.createdAt).toLocaleString()}</span>
                            </div>
                            <button type="button" onClick={() => onRestore(version.id)}>Restore</button>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
