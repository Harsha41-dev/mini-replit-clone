import React from 'react';
import { escapeHtml } from '../utils/filePaths';

function makePreviewContent(activeFilePath, activeFileContent) {
    if (!activeFilePath) {
        return '<body style="font-family:Arial;padding:20px">No file selected</body>';
    }

    if (activeFilePath.endsWith('.html')) {
        return activeFileContent;
    }

    return '<pre style="white-space:pre-wrap;font:14px Consolas;padding:18px">' + escapeHtml(activeFileContent) + '</pre>';
}

export function PreviewPane({ activeFilePath, activeFileContent }) {
    return (
        <section className="preview-section">
            <div className="section-heading">
                <h2>Preview</h2>
            </div>
            <iframe title="Project preview" srcDoc={makePreviewContent(activeFilePath, activeFileContent)} />
        </section>
    );
}
