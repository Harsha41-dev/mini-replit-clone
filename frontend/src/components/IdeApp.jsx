import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest, apiRoot } from '../api/client';
import { cleanBrowserPath, getParentPath, joinBrowserPath, makeDuplicatePath, pickFirstFile } from '../utils/filePaths';
import { ActionMenu } from './ActionMenu';
import { EditorPane } from './EditorPane';
import { FilePanel } from './FilePanel';
import { PreviewPane } from './PreviewPane';
import { ProjectList } from './ProjectList';
import { TerminalPane } from './TerminalPane';
import { VersionPanel } from './VersionPanel';

export function IdeApp({ user, onLogout }) {
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [tree, setTree] = useState([]);
    const [openFolders, setOpenFolders] = useState({});
    const [activeFilePath, setActiveFilePath] = useState('');
    const [activeFileContent, setActiveFileContent] = useState('');
    const [dirty, setDirty] = useState(false);
    const [terminalLines, setTerminalLines] = useState(['Type help to see the safe commands.']);
    const [terminalInput, setTerminalInput] = useState('');
    const [actionMenu, setActionMenu] = useState(null);
    const [versionTargetPath, setVersionTargetPath] = useState('');
    const [versions, setVersions] = useState([]);
    const [uploadTargetFolder, setUploadTargetFolder] = useState('');
    const uploadInputRef = useRef(null);
    const editorRef = useRef(null);
    const terminalSocketRef = useRef(null);
    const keyboardActionsRef = useRef({
        saveActiveFile: async () => {},
        runActiveFile: async () => {}
    });

    const currentProject = useMemo(
        () => projects.find((project) => project.id === selectedProjectId),
        [projects, selectedProjectId]
    );

    function appendTerminal(text) {
        if (!text) return;
        setTerminalLines((lines) => [...lines, text]);
    }

    function showError(error) {
        appendTerminal('Error: ' + error.message);
    }

    function openParentsOfPath(filePath) {
        const parts = cleanBrowserPath(filePath).split('/').filter(Boolean);
        parts.pop();

        setOpenFolders((previous) => {
            const next = { ...previous };
            let currentPath = '';

            parts.forEach((part) => {
                currentPath = currentPath ? currentPath + '/' + part : part;
                next[currentPath] = true;
            });

            return next;
        });
    }

    async function refreshTree(projectId = selectedProjectId) {
        if (!projectId) return [];
        const nextTree = await apiRequest('/projects/' + projectId + '/tree');
        setTree(nextTree);
        return nextTree;
    }

    async function openFile(filePath) {
        if (dirty && !confirm('You have unsaved changes. Open another file?')) return;

        const data = await apiRequest('/projects/' + selectedProjectId + '/files?path=' + encodeURIComponent(filePath));
        setActiveFilePath(data.path);
        setActiveFileContent(data.content);
        setDirty(false);
        openParentsOfPath(filePath);
    }

    async function selectProject(projectId) {
        setSelectedProjectId(projectId);
        setActiveFilePath('');
        setActiveFileContent('');
        setOpenFolders({});
        setDirty(false);

        const nextTree = await apiRequest('/projects/' + projectId + '/tree');
        setTree(nextTree);

        const filePath = pickFirstFile(nextTree);
        if (filePath) {
            const data = await apiRequest('/projects/' + projectId + '/files?path=' + encodeURIComponent(filePath));
            setActiveFilePath(data.path);
            setActiveFileContent(data.content);
        }
    }

    async function loadProjects() {
        let nextProjects = await apiRequest('/projects');

        if (nextProjects.length === 0) {
            const starter = await apiRequest('/projects', {
                method: 'POST',
                body: JSON.stringify({ name: 'Student Sandbox', template: 'node' })
            });
            nextProjects = [starter];
        }

        setProjects(nextProjects);
        await selectProject(nextProjects[0].id);
    }

    useEffect(() => {
        setTerminalLines(['Logged in as ' + user.email, 'Type help to see the safe commands.']);
        loadProjects().catch(showError);
    }, []);

    useEffect(() => {
        if (!selectedProjectId) return undefined;

        const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const socket = new WebSocket(scheme + '://' + window.location.host + '/ws/terminal?projectId=' + encodeURIComponent(selectedProjectId));
        terminalSocketRef.current = socket;

        socket.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'result') {
                const result = message.data;
                appendTerminal(result.stdout || result.stderr || 'Done');
            }

            if (message.type === 'error') {
                appendTerminal('Error: ' + message.message);
            }
        });

        socket.addEventListener('close', () => {
            if (terminalSocketRef.current === socket) {
                terminalSocketRef.current = null;
            }
        });

        return () => {
            socket.close();
        };
    }, [selectedProjectId]);

    async function createProject(name, template) {
        const project = await apiRequest('/projects', {
            method: 'POST',
            body: JSON.stringify({ name, template })
        });
        setProjects((items) => [project, ...items]);
        await selectProject(project.id);
    }

    async function saveActiveFile() {
        if (!activeFilePath) return;

        const content = editorRef.current ? editorRef.current.getValue() : activeFileContent;
        const data = await apiRequest('/projects/' + selectedProjectId + '/files', {
            method: 'PUT',
            body: JSON.stringify({ path: activeFilePath, content })
        });

        setActiveFileContent(data.content);
        setDirty(false);
        appendTerminal('Saved ' + activeFilePath);
    }

    async function runActiveFile() {
        if (!activeFilePath) {
            appendTerminal('No file selected');
            return;
        }

        if (dirty) await saveActiveFile();

        const result = await apiRequest('/projects/' + selectedProjectId + '/run', {
            method: 'POST',
            body: JSON.stringify({ entry: activeFilePath })
        });

        appendTerminal('$ ' + result.command);
        appendTerminal(result.stdout || result.stderr || 'Done');
    }

    async function createItem(filePath, type) {
        const nextTree = await apiRequest('/projects/' + selectedProjectId + '/files', {
            method: 'POST',
            body: JSON.stringify({ path: filePath, type })
        });

        setTree(nextTree);
        openParentsOfPath(filePath);

        if (type === 'folder') {
            setOpenFolders((folders) => ({ ...folders, [cleanBrowserPath(filePath)]: true }));
        } else {
            await openFile(filePath);
        }
    }

    async function createInsideFolder(folderPath, type) {
        const label = type === 'folder' ? 'Folder name' : 'File name';
        const name = prompt(label);
        if (!name) return;
        await createItem(joinBrowserPath(folderPath, name), type);
    }

    async function duplicateItem(node) {
        const targetPath = prompt('Duplicate as', makeDuplicatePath(node));
        if (!targetPath) return;

        const nextTree = await apiRequest('/projects/' + selectedProjectId + '/files/duplicate', {
            method: 'POST',
            body: JSON.stringify({ sourcePath: node.path, targetPath })
        });

        setTree(nextTree);
        openParentsOfPath(targetPath);
        if (node.type === 'file') await openFile(targetPath);
    }

    async function renameItem(node) {
        const newName = prompt('New name', node.name);
        if (!newName || newName === node.name) return;

        const newPath = joinBrowserPath(getParentPath(node.path), newName);
        const nextTree = await apiRequest('/projects/' + selectedProjectId + '/files/rename', {
            method: 'PATCH',
            body: JSON.stringify({ oldPath: node.path, newPath })
        });

        setTree(nextTree);

        if (activeFilePath === node.path) setActiveFilePath(newPath);
        if (node.type === 'folder' && activeFilePath.startsWith(node.path + '/')) {
            setActiveFilePath(newPath + activeFilePath.slice(node.path.length));
        }
    }

    async function deleteItem(node) {
        if (!confirm('Delete ' + node.path + '?')) return;

        const nextTree = await apiRequest('/projects/' + selectedProjectId + '/files', {
            method: 'DELETE',
            body: JSON.stringify({ path: node.path })
        });

        setTree(nextTree);

        if (activeFilePath === node.path || activeFilePath.startsWith(node.path + '/')) {
            setActiveFilePath('');
            setActiveFileContent('');
            setDirty(false);
        }

        appendTerminal('Deleted ' + node.path);
    }

    async function showHistory(node) {
        const nextVersions = await apiRequest('/projects/' + selectedProjectId + '/files/versions?path=' + encodeURIComponent(node.path));
        setVersionTargetPath(node.path);
        setVersions(nextVersions);
    }

    async function restoreVersion(versionId) {
        const data = await apiRequest('/projects/' + selectedProjectId + '/files/versions/' + versionId + '/restore', {
            method: 'POST',
            body: JSON.stringify({})
        });

        setTree(data.tree);
        setActiveFilePath(data.path);
        setActiveFileContent(data.content);
        setDirty(false);
        setVersionTargetPath('');
        setVersions([]);
        openParentsOfPath(data.path);
        appendTerminal('Restored ' + data.path);
    }

    function downloadItem(filePath) {
        const query = filePath ? '?path=' + encodeURIComponent(filePath) : '';
        window.location.href = apiRoot + '/projects/' + selectedProjectId + '/download' + query;
    }

    async function copyPath(filePath) {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(filePath);
            appendTerminal('Copied path: ' + filePath);
            return;
        }

        prompt('Copy path', filePath);
    }

    function startUpload(folderPath) {
        setUploadTargetFolder(cleanBrowserPath(folderPath));

        if (uploadInputRef.current) {
            uploadInputRef.current.value = '';
            uploadInputRef.current.click();
        }
    }

    async function uploadSelectedFile(file) {
        const filePath = joinBrowserPath(uploadTargetFolder, file.name);
        const content = await file.text();

        await apiRequest('/projects/' + selectedProjectId + '/files', {
            method: 'PUT',
            body: JSON.stringify({ path: filePath, content })
        });

        await refreshTree();
        openParentsOfPath(filePath);
        appendTerminal('Uploaded ' + filePath);
        await openFile(filePath);
    }

    async function terminalSubmit(event) {
        event.preventDefault();

        const command = terminalInput.trim();
        if (!command) return;

        setTerminalInput('');

        if (command === 'clear') {
            setTerminalLines([]);
        }

        if (command !== 'clear') {
            appendTerminal('$ ' + command);
        }

        const socket = terminalSocketRef.current;
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ command }));
            return;
        }

        const result = await apiRequest('/projects/' + selectedProjectId + '/terminal', {
            method: 'POST',
            body: JSON.stringify({ command })
        });

        if (command !== 'clear') {
            appendTerminal(result.stdout || result.stderr || 'Done');
        }
    }

    async function logout() {
        await apiRequest('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
        onLogout();
    }

    function editorDidMount(editor, monaco) {
        editorRef.current = editor;
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => keyboardActionsRef.current.saveActiveFile().catch(showError));
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => keyboardActionsRef.current.runActiveFile().catch(showError));
    }

    keyboardActionsRef.current.saveActiveFile = saveActiveFile;
    keyboardActionsRef.current.runActiveFile = runActiveFile;

    const actions = {
        openFile,
        download: downloadItem,
        duplicate: duplicateItem,
        copyPath,
        rename: renameItem,
        deleteItem,
        showHistory,
        createInsideFolder,
        upload: startUpload,
        toggleFolder: (folderPath) => setOpenFolders((folders) => ({ ...folders, [folderPath]: !folders[folderPath] })),
        isFolderOpen: (folderPath) => openFolders[folderPath] === true
    };

    return (
        <div className="app-shell">
            <header className="topbar">
                <div className="title-area">
                    <div className="brand-mark small">R</div>
                    <div>
                        <p className="eyebrow">Workspace</p>
                        <h1>{currentProject ? currentProject.name : 'No project'}</h1>
                    </div>
                </div>
                <div className="top-actions">
                    <span className="user-pill">{user.name}</span>
                    <button type="button" onClick={() => saveActiveFile().catch(showError)}>Save</button>
                    <button type="button" className="primary" onClick={() => runActiveFile().catch(showError)}>Run</button>
                    <button type="button" onClick={() => logout().catch(showError)}>Logout</button>
                </div>
            </header>

            <main className="workspace">
                <nav className="activity-rail">
                    <button type="button" className="rail-button active" title="Files">Files</button>
                    <button type="button" className="rail-button" title="Run">Run</button>
                    <button type="button" className="rail-button" title="Preview">View</button>
                </nav>

                <aside className="left-panel">
                    <ProjectList projects={projects} selectedProjectId={selectedProjectId} onSelectProject={(id) => selectProject(id).catch(showError)} onCreateProject={createProject} />
                    <FilePanel
                        tree={tree}
                        activeFilePath={activeFilePath}
                        openFolders={openFolders}
                        onOpenFile={(path) => openFile(path).catch(showError)}
                        onToggleFolder={actions.toggleFolder}
                        onMenu={(event, node) => setActionMenu({ node, x: event.clientX, y: event.clientY })}
                        onCreateItem={(path, type) => createItem(path, type).catch(showError)}
                        onDownload={downloadItem}
                        onUpload={startUpload}
                    />
                    <input
                        ref={uploadInputRef}
                        type="file"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files && event.target.files[0];
                            if (file) uploadSelectedFile(file).catch(showError);
                        }}
                    />
                </aside>

                <EditorPane
                    activeFilePath={activeFilePath}
                    activeFileContent={activeFileContent}
                    dirty={dirty}
                    onChange={(value) => {
                        setActiveFileContent(value);
                        setDirty(true);
                    }}
                    onEditorMount={editorDidMount}
                    onDeleteActive={() => activeFilePath && deleteItem({ path: activeFilePath, name: activeFilePath, type: 'file' }).catch(showError)}
                />

                <aside className="right-panel">
                    <PreviewPane activeFilePath={activeFilePath} activeFileContent={activeFileContent} />
                    <TerminalPane
                        terminalLines={terminalLines}
                        terminalInput={terminalInput}
                        onInputChange={setTerminalInput}
                        onSubmit={(event) => terminalSubmit(event).catch(showError)}
                    />
                </aside>
            </main>

            <ActionMenu menu={actionMenu} onClose={() => setActionMenu(null)} actions={actions} />
            <VersionPanel
                targetPath={versionTargetPath}
                versions={versions}
                onRestore={(versionId) => restoreVersion(versionId).catch(showError)}
                onClose={() => {
                    setVersionTargetPath('');
                    setVersions([]);
                }}
            />
        </div>
    );
}
