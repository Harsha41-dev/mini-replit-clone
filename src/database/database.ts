import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { Project, ProjectTemplate } from '../types/project.types';
import { StoredUser } from '../types/auth.types';

const dataFolder = path.join(process.cwd(), 'data');
const databaseFile = path.join(dataFolder, 'app.sqlite');
const usersJsonFile = path.join(dataFolder, 'users.json');
const projectsJsonFile = path.join(dataFolder, 'projects.json');

let database: Database.Database | null = null;

function ensureDataFolder() {
    if (!fs.existsSync(dataFolder)) {
        fs.mkdirSync(dataFolder, { recursive: true });
    }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
    if (!fs.existsSync(filePath)) {
        return fallback;
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function createTables(db: Database.Database) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            owner_id TEXT NOT NULL,
            name TEXT NOT NULL,
            slug TEXT NOT NULL,
            template TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);

        CREATE TABLE IF NOT EXISTS file_versions (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            file_path TEXT NOT NULL,
            action TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_file_versions_lookup
            ON file_versions(project_id, owner_id, file_path, created_at);
    `);
}

function migrateOldJsonStores(db: Database.Database) {
    const users = readJsonFile<StoredUser[]>(usersJsonFile, []);
    const projects = readJsonFile<Project[]>(projectsJsonFile, []);

    const insertUser = db.prepare(`
        INSERT OR IGNORE INTO users (id, name, email, password_hash, created_at)
        VALUES (@id, @name, @email, @passwordHash, @createdAt)
    `);

    const insertProject = db.prepare(`
        INSERT OR IGNORE INTO projects (id, owner_id, name, slug, template, created_at, updated_at)
        VALUES (@id, @ownerId, @name, @slug, @template, @createdAt, @updatedAt)
    `);
    const findUser = db.prepare('SELECT id FROM users WHERE id = ?');

    const transaction = db.transaction(() => {
        users.forEach((user) => insertUser.run(user));
        projects.forEach((project) => {
            if (findUser.get(project.ownerId)) {
                insertProject.run(project);
            }
        });
    });

    transaction();
}

export function getDatabase() {
    if (database) {
        return database;
    }

    ensureDataFolder();
    database = new Database(databaseFile);
    database.pragma('journal_mode = WAL');
    database.pragma('foreign_keys = ON');
    createTables(database);
    migrateOldJsonStores(database);

    return database;
}

export function isProjectTemplate(value: string): value is ProjectTemplate {
    return value === 'node' || value === 'web' || value === 'python';
}
