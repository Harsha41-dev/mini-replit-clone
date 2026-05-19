import React, { useEffect } from 'react';

export function ActionMenu({ menu, onClose, actions }) {
    useEffect(() => {
        function closeOnEscape(event) {
            if (event.key === 'Escape') onClose();
        }

        function closeOnOutsideClick(event) {
            if (event.target instanceof Element && !event.target.closest('.file-action-menu')) {
                onClose();
            }
        }

        document.addEventListener('keydown', closeOnEscape);
        document.addEventListener('mousedown', closeOnOutsideClick);
        return () => {
            document.removeEventListener('keydown', closeOnEscape);
            document.removeEventListener('mousedown', closeOnOutsideClick);
        };
    }, [onClose]);

    if (!menu) return null;

    const node = menu.node;
    const buttons = node.type === 'file'
        ? [
            ['Open', () => actions.openFile(node.path)],
            ['History', () => actions.showHistory(node)],
            ['Download', () => actions.download(node.path)],
            ['Duplicate', () => actions.duplicate(node)],
            ['Copy path', () => actions.copyPath(node.path)],
            ['Rename', () => actions.rename(node)],
            ['Delete', () => actions.deleteItem(node)]
        ]
        : [
            [actions.isFolderOpen(node.path) ? 'Collapse' : 'Expand', () => actions.toggleFolder(node.path)],
            ['New file', () => actions.createInsideFolder(node.path, 'file')],
            ['New folder', () => actions.createInsideFolder(node.path, 'folder')],
            ['Upload file', () => actions.upload(node.path)],
            ['Download ZIP', () => actions.download(node.path)],
            ['Duplicate', () => actions.duplicate(node)],
            ['Copy path', () => actions.copyPath(node.path)],
            ['Rename', () => actions.rename(node)],
            ['Delete', () => actions.deleteItem(node)]
        ];

    return (
        <div className="file-action-menu" style={{ left: menu.x, top: menu.y }}>
            {buttons.map(([label, handler]) => (
                <button key={label} type="button" onClick={async () => { onClose(); await handler(); }}>{label}</button>
            ))}
        </div>
    );
}
