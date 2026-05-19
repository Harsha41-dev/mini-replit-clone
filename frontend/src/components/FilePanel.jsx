import React, { useState } from 'react';

function FileNode({ node, activeFilePath, openFolders, onOpenFile, onToggleFolder, onMenu }) {
    const isOpen = openFolders[node.path] === true;

    return (
        <li className="tree-node">
            <div className="tree-row">
                {node.type === 'folder' ? (
                    <button type="button" className="folder-button" aria-expanded={isOpen} onClick={() => onToggleFolder(node.path)}>
                        <span className="folder-caret">{isOpen ? 'v' : '>'}</span>
                        <span>{node.name}</span>
                    </button>
                ) : (
                    <button
                        type="button"
                        className={'file-button ' + (node.path === activeFilePath ? 'active' : '')}
                        onClick={() => onOpenFile(node.path)}
                    >
                        {node.name}
                    </button>
                )}
                <button type="button" className="node-action-button" title="File actions" onClick={(event) => onMenu(event, node)}>...</button>
            </div>

            {node.type === 'folder' && isOpen && (node.children || []).length > 0 && (
                <ul className="tree-list">
                    {(node.children || []).map((child) => (
                        <FileNode
                            key={child.path}
                            node={child}
                            activeFilePath={activeFilePath}
                            openFolders={openFolders}
                            onOpenFile={onOpenFile}
                            onToggleFolder={onToggleFolder}
                            onMenu={onMenu}
                        />
                    ))}
                </ul>
            )}

            {node.type === 'folder' && isOpen && (node.children || []).length === 0 && (
                <div className="empty-folder">empty folder</div>
            )}
        </li>
    );
}

export function FilePanel(props) {
    const [newPath, setNewPath] = useState('');
    const [fileType, setFileType] = useState('file');

    async function submitFile(event) {
        event.preventDefault();
        if (!newPath.trim()) return;
        await props.onCreateItem(newPath, fileType);
        setNewPath('');
    }

    return (
        <section className="panel-section files-section">
            <div className="section-heading">
                <h2>Files</h2>
                <div className="heading-actions">
                    <button type="button" onClick={() => props.onUpload('')}>Upload</button>
                    <button type="button" onClick={() => props.onDownload('')}>ZIP</button>
                </div>
            </div>
            <form className="stack-form" onSubmit={submitFile}>
                <input value={newPath} onChange={(event) => setNewPath(event.target.value)} placeholder="src/app.js" />
                <div className="inline-fields">
                    <select value={fileType} onChange={(event) => setFileType(event.target.value)}>
                        <option value="file">File</option>
                        <option value="folder">Folder</option>
                    </select>
                    <button type="submit">Add</button>
                </div>
            </form>
            <div className="file-tree">
                <ul className="tree-list root">
                    {props.tree.map((node) => (
                        <FileNode key={node.path} node={node} {...props} />
                    ))}
                </ul>
            </div>
        </section>
    );
}
