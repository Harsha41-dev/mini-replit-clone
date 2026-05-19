import { v4 as uuidV4 } from 'uuid';
import { getDatabase } from '../database/database';
import { FileVersion, FileVersionAction } from '../types/project.types';

type FileVersionRow = {
    id: string;
    project_id: string;
    owner_id: string;
    file_path: string;
    action: FileVersionAction;
    content: string;
    created_at: string;
};

function toFileVersion(row: FileVersionRow): FileVersion {
    return {
        id: row.id,
        projectId: row.project_id,
        ownerId: row.owner_id,
        filePath: row.file_path,
        action: row.action,
        content: row.content,
        createdAt: row.created_at
    };
}

export function createFileVersion(projectId: string, ownerId: string, filePath: string, content: string, action: FileVersionAction) {
    const version: FileVersion = {
        id: uuidV4(),
        projectId,
        ownerId,
        filePath,
        action,
        content,
        createdAt: new Date().toISOString()
    };

    getDatabase()
        .prepare(`
            INSERT INTO file_versions (id, project_id, owner_id, file_path, action, content, created_at)
            VALUES (@id, @projectId, @ownerId, @filePath, @action, @content, @createdAt)
        `)
        .run(version);

    return version;
}

export function listVersionsForFile(projectId: string, ownerId: string, filePath: string) {
    const rows = getDatabase()
        .prepare(`
            SELECT * FROM file_versions
            WHERE project_id = ? AND owner_id = ? AND file_path = ?
            ORDER BY created_at DESC
            LIMIT 20
        `)
        .all(projectId, ownerId, filePath) as FileVersionRow[];

    return rows.map(toFileVersion);
}

export function findFileVersion(versionId: string, projectId: string, ownerId: string) {
    const row = getDatabase()
        .prepare(`
            SELECT * FROM file_versions
            WHERE id = ? AND project_id = ? AND owner_id = ?
        `)
        .get(versionId, projectId, ownerId) as FileVersionRow | undefined;

    return row ? toFileVersion(row) : null;
}
