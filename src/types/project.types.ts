export type ProjectTemplate = 'node' | 'web' | 'python';

export type Project = {
    id: string;
    ownerId: string;
    name: string;
    slug: string;
    template: ProjectTemplate;
    createdAt: string;
    updatedAt: string;
};

export type FileNode = {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: FileNode[];
};

export type FileKind = 'file' | 'folder';

export type RunResult = {
    command: string;
    stdout: string;
    stderr: string;
    exitCode: number;
};

export type FileVersionAction = 'create' | 'save' | 'rename' | 'duplicate' | 'delete' | 'restore';

export type FileVersion = {
    id: string;
    projectId: string;
    ownerId: string;
    filePath: string;
    action: FileVersionAction;
    content: string;
    createdAt: string;
};
