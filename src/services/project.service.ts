import fs from 'fs';
import path from 'path';
import { v4 as uuidV4 } from 'uuid';
import { NotFoundError } from '../utils/errors/app.error';
import { Project, ProjectTemplate } from '../types/project.types';
import { createProjectRecord, findProjectByIdForOwner, listProjectsByOwner, updateProjectUpdatedAt } from '../repositories/project.repository';

const dataFolder = path.join(process.cwd(), 'data');
const projectsFolder = path.join(dataFolder, 'projects');

function makeSureStoreExists() {
    if (!fs.existsSync(projectsFolder)) {
        fs.mkdirSync(projectsFolder, { recursive: true });
    }
}

function makeSlug(name: string) {
    const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return slug || 'my-project';
}

function writeNodeStarterFiles(projectRoot: string, projectName: string) {
    fs.writeFileSync(
        path.join(projectRoot, 'index.js'),
        `console.log("Hello from ${projectName}!");\nconsole.log("Edit index.js and press Run again.");\n`
    );

    fs.writeFileSync(
        path.join(projectRoot, 'package.json'),
        JSON.stringify({
            scripts: {
                start: 'node index.js'
            }
        }, null, 2)
    );

    fs.writeFileSync(path.join(projectRoot, 'README.md'), `# ${projectName}\n\nA small Node project inside Mini Replit.\n`);
}

function writeWebStarterFiles(projectRoot: string, projectName: string) {
    fs.writeFileSync(
        path.join(projectRoot, 'index.html'),
        [
            '<!doctype html>',
            '<html>',
            '<head>',
            `  <title>${projectName}</title>`,
            '  <style>',
            '    body { font-family: Arial, sans-serif; padding: 32px; background: #f4f4f0; color: #1f1f1f; }',
            '    h1 { color: #0b6b43; }',
            '  </style>',
            '</head>',
            '<body>',
            `  <h1>${projectName}</h1>`,
            '  <p>This page is running from your browser preview.</p>',
            '</body>',
            '</html>',
            ''
        ].join('\n')
    );

    fs.writeFileSync(path.join(projectRoot, 'README.md'), `# ${projectName}\n\nA tiny web page project.\n`);
}

function writePythonStarterFiles(projectRoot: string, projectName: string) {
    fs.writeFileSync(
        path.join(projectRoot, 'main.py'),
        `print("Hello from ${projectName}!")\nprint("Edit main.py and press Run again.")\n`
    );

    fs.writeFileSync(path.join(projectRoot, 'README.md'), `# ${projectName}\n\nA small Python project inside Mini Replit.\n`);
}

function seedProject(projectRoot: string, project: Project) {
    if (project.template === 'web') {
        writeWebStarterFiles(projectRoot, project.name);
        return;
    }

    if (project.template === 'python') {
        writePythonStarterFiles(projectRoot, project.name);
        return;
    }

    writeNodeStarterFiles(projectRoot, project.name);
}

export function listProjects(ownerId: string) {
    makeSureStoreExists();
    return listProjectsByOwner(ownerId);
}

export function createProject(ownerId: string, name: string, template: ProjectTemplate = 'node') {
    makeSureStoreExists();
    const now = new Date().toISOString();

    const project: Project = {
        id: uuidV4(),
        ownerId,
        name: name.trim(),
        slug: makeSlug(name),
        template,
        createdAt: now,
        updatedAt: now
    };

    const projectRoot = getProjectRoot(project.id);
    fs.mkdirSync(projectRoot, { recursive: true });
    seedProject(projectRoot, project);

    return createProjectRecord(project);
}

export function getProjectById(projectId: string, ownerId: string) {
    makeSureStoreExists();
    const project = findProjectByIdForOwner(projectId, ownerId);

    if (!project) {
        throw new NotFoundError('Project was not found');
    }

    return project;
}

export function getProjectRoot(projectId: string) {
    return path.join(projectsFolder, projectId);
}

export function getProjectRootAfterChecking(projectId: string, ownerId: string) {
    getProjectById(projectId, ownerId);
    const projectRoot = getProjectRoot(projectId);

    if (!fs.existsSync(projectRoot)) {
        fs.mkdirSync(projectRoot, { recursive: true });
    }

    return projectRoot;
}

export function touchProject(projectId: string, ownerId: string) {
    const changed = updateProjectUpdatedAt(projectId, ownerId, new Date().toISOString());

    if (!changed) {
        throw new NotFoundError('Project was not found');
    }
}
