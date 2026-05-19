export function cleanBrowserPath(filePath) {
    return filePath.replace(/\\/g, '/').replace(/^\/+/, '');
}

export function getParentPath(filePath) {
    const parts = cleanBrowserPath(filePath).split('/').filter(Boolean);
    parts.pop();
    return parts.join('/');
}

export function joinBrowserPath(parentPath, name) {
    const cleanParent = cleanBrowserPath(parentPath);
    const cleanName = cleanBrowserPath(name);
    return cleanParent ? cleanParent + '/' + cleanName : cleanName;
}

export function getLanguage(filePath) {
    if (filePath.endsWith('.py')) return 'python';
    if (filePath.endsWith('.html')) return 'html';
    if (filePath.endsWith('.css')) return 'css';
    if (filePath.endsWith('.json')) return 'json';
    if (filePath.endsWith('.md')) return 'markdown';
    if (filePath.endsWith('.ts')) return 'typescript';
    return 'javascript';
}

export function flattenFiles(nodes) {
    return nodes.flatMap((node) => node.type === 'file' ? [node.path] : flattenFiles(node.children || []));
}

export function pickFirstFile(nodes) {
    const files = flattenFiles(nodes);
    const preferredFiles = ['index.js', 'index.html', 'main.py', 'README.md'];

    for (const preferred of preferredFiles) {
        const found = files.find((filePath) => filePath.endsWith(preferred));
        if (found) return found;
    }

    return files[0] || '';
}

export function makeDuplicatePath(node) {
    const parentPath = getParentPath(node.path);

    if (node.type === 'folder') {
        return joinBrowserPath(parentPath, node.name + '-copy');
    }

    const dotIndex = node.name.lastIndexOf('.');
    const baseName = dotIndex > 0 ? node.name.slice(0, dotIndex) : node.name;
    const extension = dotIndex > 0 ? node.name.slice(dotIndex) : '';

    return joinBrowserPath(parentPath, baseName + '-copy' + extension);
}

export function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
