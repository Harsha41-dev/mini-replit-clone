import { getDatabase, isProjectTemplate } from '../database/database';
import { Project } from '../types/project.types';

type ProjectRow = {
    id: string;
    owner_id: string;
    name: string;
    slug: string;
    template: string;
    created_at: string;
    updated_at: string;
};

function toProject(row: ProjectRow): Project {
    return {
        id: row.id,
        ownerId: row.owner_id,
        name: row.name,
        slug: row.slug,
        template: isProjectTemplate(row.template) ? row.template : 'node',
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

export function listProjectsByOwner(ownerId: string) {
    const rows = getDatabase()
        .prepare('SELECT * FROM projects WHERE owner_id = ? ORDER BY created_at DESC')
        .all(ownerId) as ProjectRow[];

    return rows.map(toProject);
}

export function createProjectRecord(project: Project) {
    getDatabase()
        .prepare(`
            INSERT INTO projects (id, owner_id, name, slug, template, created_at, updated_at)
            VALUES (@id, @ownerId, @name, @slug, @template, @createdAt, @updatedAt)
        `)
        .run(project);

    return project;
}

export function findProjectByIdForOwner(projectId: string, ownerId: string) {
    const row = getDatabase()
        .prepare('SELECT * FROM projects WHERE id = ? AND owner_id = ?')
        .get(projectId, ownerId) as ProjectRow | undefined;

    return row ? toProject(row) : null;
}

export function updateProjectUpdatedAt(projectId: string, ownerId: string, updatedAt: string) {
    const result = getDatabase()
        .prepare('UPDATE projects SET updated_at = ? WHERE id = ? AND owner_id = ?')
        .run(updatedAt, projectId, ownerId);

    return result.changes > 0;
}
