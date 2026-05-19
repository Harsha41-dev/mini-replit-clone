import fs from 'fs';
import path from 'path';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors/app.error';
import { FileKind, FileNode } from '../types/project.types';
import { getProjectRootAfterChecking, touchProject } from './project.service';
import { createFileVersion, findFileVersion, listVersionsForFile } from '../repositories/file-version.repository';

const maxFileSizeInBytes = 300 * 1024;

export function cleanProjectPath(filePath: string) {
    const fixedPath = filePath.replace(/\\/g, '/').replace(/^\/+/, '');

    if (fixedPath === '' || fixedPath === '.') {
        return '';
    }

    const parts = fixedPath.split('/').filter(Boolean);
    const hasBadPart = parts.some((part) => part === '..' || part.includes('\0'));

    if (hasBadPart) {
        throw new BadRequestError('Invalid file path');
    }

    return parts.join(path.sep);
}

export function getSafeProjectPath(projectId: string, ownerId: string, filePath: string) {
    const projectRoot = path.resolve(getProjectRootAfterChecking(projectId, ownerId));
    const cleanPath = cleanProjectPath(filePath);
    const fullPath = path.resolve(projectRoot, cleanPath);

    if (fullPath !== projectRoot && !fullPath.startsWith(projectRoot + path.sep)) {
        throw new BadRequestError('Invalid file path');
    }

    return fullPath;
}

function getBrowserStylePath(filePath: string) {
    return filePath.replace(/\\/g, '/');
}

function getVersionPath(filePath: string) {
    return getBrowserStylePath(cleanProjectPath(filePath));
}

function makeNode(fullPath: string, projectRoot: string): FileNode {
    const stats = fs.statSync(fullPath);
    const relativePath = path.relative(projectRoot, fullPath);
    const browserPath = getBrowserStylePath(relativePath);

    if (stats.isDirectory()) {
        const children = fs
            .readdirSync(fullPath)
            .map((name) => makeNode(path.join(fullPath, name), projectRoot))
            .sort((left, right) => {
                if (left.type !== right.type) {
                    return left.type === 'folder' ? -1 : 1;
                }

                return left.name.localeCompare(right.name);
            });

        return {
            name: path.basename(fullPath),
            path: browserPath,
            type: 'folder',
            children
        };
    }

    return {
        name: path.basename(fullPath),
        path: browserPath,
        type: 'file'
    };
}

export function getProjectTree(projectId: string, ownerId: string) {
    const projectRoot = path.resolve(getProjectRootAfterChecking(projectId, ownerId));

    return fs
        .readdirSync(projectRoot)
        .map((name) => makeNode(path.join(projectRoot, name), projectRoot))
        .sort((left, right) => {
            if (left.type !== right.type) {
                return left.type === 'folder' ? -1 : 1;
            }

            return left.name.localeCompare(right.name);
        });
}

export function readProjectFile(projectId: string, ownerId: string, filePath: string) {
    const fullPath = getSafeProjectPath(projectId, ownerId, filePath);

    if (!fs.existsSync(fullPath)) {
        throw new NotFoundError('File was not found');
    }

    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
        throw new BadRequestError('Cannot open a folder in the editor');
    }

    if (stats.size > maxFileSizeInBytes) {
        throw new BadRequestError('This file is too large for the simple editor');
    }

    return fs.readFileSync(fullPath, 'utf-8');
}

export function saveProjectFile(projectId: string, ownerId: string, filePath: string, content: string) {
    const fullPath = getSafeProjectPath(projectId, ownerId, filePath);
    const parentFolder = path.dirname(fullPath);

    fs.mkdirSync(parentFolder, { recursive: true });
    fs.writeFileSync(fullPath, content);
    touchProject(projectId, ownerId);

    const savedContent = readProjectFile(projectId, ownerId, filePath);
    createFileVersion(projectId, ownerId, getVersionPath(filePath), savedContent, 'save');

    return savedContent;
}

export function createProjectItem(projectId: string, ownerId: string, filePath: string, type: FileKind) {
    const fullPath = getSafeProjectPath(projectId, ownerId, filePath);

    if (fs.existsSync(fullPath)) {
        throw new ConflictError('A file or folder already exists at this path');
    }

    if (type === 'folder') {
        fs.mkdirSync(fullPath, { recursive: true });
    } else {
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, '');
        createFileVersion(projectId, ownerId, getVersionPath(filePath), '', 'create');
    }

    touchProject(projectId, ownerId);
    return getProjectTree(projectId, ownerId);
}

export function deleteProjectItem(projectId: string, ownerId: string, filePath: string) {
    const cleanPath = cleanProjectPath(filePath);

    if (!cleanPath) {
        throw new BadRequestError('Project root cannot be deleted');
    }

    const fullPath = getSafeProjectPath(projectId, ownerId, filePath);

    if (!fs.existsSync(fullPath)) {
        throw new NotFoundError('File or folder was not found');
    }

    if (fs.statSync(fullPath).isFile()) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        createFileVersion(projectId, ownerId, getBrowserStylePath(cleanPath), content, 'delete');
    }

    fs.rmSync(fullPath, { recursive: true, force: true });
    touchProject(projectId, ownerId);

    return getProjectTree(projectId, ownerId);
}

export function renameProjectItem(projectId: string, ownerId: string, oldPath: string, newPath: string) {
    const cleanOldPath = cleanProjectPath(oldPath);
    const cleanNewPath = cleanProjectPath(newPath);

    if (!cleanOldPath || !cleanNewPath) {
        throw new BadRequestError('Project root cannot be renamed');
    }

    const oldFullPath = getSafeProjectPath(projectId, ownerId, oldPath);
    const newFullPath = getSafeProjectPath(projectId, ownerId, newPath);

    if (!fs.existsSync(oldFullPath)) {
        throw new NotFoundError('File or folder was not found');
    }

    if (fs.existsSync(newFullPath)) {
        throw new ConflictError('A file or folder already exists at the new path');
    }

    fs.mkdirSync(path.dirname(newFullPath), { recursive: true });
    fs.renameSync(oldFullPath, newFullPath);

    if (fs.existsSync(newFullPath) && fs.statSync(newFullPath).isFile()) {
        createFileVersion(projectId, ownerId, getBrowserStylePath(cleanNewPath), fs.readFileSync(newFullPath, 'utf-8'), 'rename');
    }

    touchProject(projectId, ownerId);

    return getProjectTree(projectId, ownerId);
}

export function duplicateProjectItem(projectId: string, ownerId: string, sourcePath: string, targetPath: string) {
    const cleanSourcePath = cleanProjectPath(sourcePath);
    const cleanTargetPath = cleanProjectPath(targetPath);

    if (!cleanSourcePath || !cleanTargetPath) {
        throw new BadRequestError('Project root cannot be duplicated');
    }

    const sourceFullPath = getSafeProjectPath(projectId, ownerId, sourcePath);
    const targetFullPath = getSafeProjectPath(projectId, ownerId, targetPath);

    if (!fs.existsSync(sourceFullPath)) {
        throw new NotFoundError('File or folder was not found');
    }

    if (fs.existsSync(targetFullPath)) {
        throw new ConflictError('A file or folder already exists at the target path');
    }

    fs.mkdirSync(path.dirname(targetFullPath), { recursive: true });
    fs.cpSync(sourceFullPath, targetFullPath, { recursive: true });

    if (fs.statSync(targetFullPath).isFile()) {
        createFileVersion(projectId, ownerId, getBrowserStylePath(cleanTargetPath), fs.readFileSync(targetFullPath, 'utf-8'), 'duplicate');
    }

    touchProject(projectId, ownerId);

    return getProjectTree(projectId, ownerId);
}

export function listProjectFileVersions(projectId: string, ownerId: string, filePath: string) {
    getProjectRootAfterChecking(projectId, ownerId);
    return listVersionsForFile(projectId, ownerId, getVersionPath(filePath));
}

export function restoreProjectFileVersion(projectId: string, ownerId: string, versionId: string) {
    const version = findFileVersion(versionId, projectId, ownerId);

    if (!version) {
        throw new NotFoundError('File version was not found');
    }

    const fullPath = getSafeProjectPath(projectId, ownerId, version.filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, version.content);
    createFileVersion(projectId, ownerId, version.filePath, version.content, 'restore');
    touchProject(projectId, ownerId);

    return {
        path: getBrowserStylePath(version.filePath),
        content: version.content,
        tree: getProjectTree(projectId, ownerId)
    };
}
