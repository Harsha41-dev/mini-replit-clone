import fs from 'fs';
import path from 'path';
import archiver = require('archiver');
import { NotFoundError } from '../utils/errors/app.error';
import { getSafeProjectPath } from './file.service';
import { getProjectById } from './project.service';

type DownloadTarget = {
    fullPath: string;
    downloadName: string;
    zipRootName: string;
    isFile: boolean;
};

function makeDownloadName(name: string) {
    return name.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

export function getProjectDownloadTarget(projectId: string, ownerId: string, itemPath: string): DownloadTarget {
    const project = getProjectById(projectId, ownerId);
    const fullPath = getSafeProjectPath(projectId, ownerId, itemPath);

    if (!fs.existsSync(fullPath)) {
        throw new NotFoundError('File or folder was not found');
    }

    const stats = fs.statSync(fullPath);

    if (stats.isFile()) {
        return {
            fullPath,
            isFile: true,
            downloadName: makeDownloadName(path.basename(fullPath)),
            zipRootName: ''
        };
    }

    const folderName = itemPath ? path.basename(fullPath) : project.slug;

    return {
        fullPath,
        isFile: false,
        downloadName: makeDownloadName(folderName || project.slug) + '.zip',
        zipRootName: folderName || project.slug
    };
}

export function createZipArchive(folderPath: string, zipRootName: string) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.directory(folderPath, zipRootName);
    return archive;
}
