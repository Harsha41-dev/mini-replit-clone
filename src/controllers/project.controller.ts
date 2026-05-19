import { NextFunction, Request, Response } from 'express';
import { createProject, listProjects } from '../services/project.service';
import { createProjectItem, deleteProjectItem, duplicateProjectItem, getProjectTree, listProjectFileVersions, readProjectFile, renameProjectItem, restoreProjectFileVersion, saveProjectFile } from '../services/file.service';
import { createZipArchive, getProjectDownloadTarget } from '../services/download.service';
import { runProject } from '../services/runner.service';
import { runTerminalCommand } from '../services/terminal.service';
import { FileKind, ProjectTemplate } from '../types/project.types';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export function listProjectsHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as AuthenticatedRequest).user;

        res.status(200).json({
            success: true,
            data: listProjects(user.id)
        });
    } catch (error) {
        next(error);
    }
}

export function createProjectHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as AuthenticatedRequest).user;
        const project = createProject(user.id, req.body.name, req.body.template as ProjectTemplate | undefined);

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
}

export function getProjectTreeHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as AuthenticatedRequest).user;

        res.status(200).json({
            success: true,
            data: getProjectTree(req.params.projectId, user.id)
        });
    } catch (error) {
        next(error);
    }
}

export function readProjectFileHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as AuthenticatedRequest).user;
        const filePath = String(req.query.path || '');

        res.status(200).json({
            success: true,
            data: {
                path: filePath,
                content: readProjectFile(req.params.projectId, user.id, filePath)
            }
        });
    } catch (error) {
        next(error);
    }
}

export function saveProjectFileHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as AuthenticatedRequest).user;

        res.status(200).json({
            success: true,
            data: {
                path: req.body.path,
                content: saveProjectFile(req.params.projectId, user.id, req.body.path, req.body.content)
            }
        });
    } catch (error) {
        next(error);
    }
}

export function createProjectItemHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as AuthenticatedRequest).user;

        res.status(201).json({
            success: true,
            data: createProjectItem(req.params.projectId, user.id, req.body.path, req.body.type as FileKind)
        });
    } catch (error) {
        next(error);
    }
}

export function deleteProjectItemHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as AuthenticatedRequest).user;

        res.status(200).json({
            success: true,
            data: deleteProjectItem(req.params.projectId, user.id, req.body.path)
        });
    } catch (error) {
        next(error);
    }
}

export function renameProjectItemHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as AuthenticatedRequest).user;

        res.status(200).json({
            success: true,
            data: renameProjectItem(req.params.projectId, user.id, req.body.oldPath, req.body.newPath)
        });
    } catch (error) {
        next(error);
    }
}

export function duplicateProjectItemHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as AuthenticatedRequest).user;

        res.status(201).json({
            success: true,
            data: duplicateProjectItem(req.params.projectId, user.id, req.body.sourcePath, req.body.targetPath)
        });
    } catch (error) {
        next(error);
    }
}

export function listProjectFileVersionsHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as AuthenticatedRequest).user;
        const filePath = String(req.query.path || '');

        res.status(200).json({
            success: true,
            data: listProjectFileVersions(req.params.projectId, user.id, filePath)
        });
    } catch (error) {
        next(error);
    }
}

export function restoreProjectFileVersionHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as AuthenticatedRequest).user;

        res.status(200).json({
            success: true,
            data: restoreProjectFileVersion(req.params.projectId, user.id, req.params.versionId)
        });
    } catch (error) {
        next(error);
    }
}

export function downloadProjectItemHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as AuthenticatedRequest).user;
        const itemPath = String(req.query.path || '');
        const target = getProjectDownloadTarget(req.params.projectId, user.id, itemPath);

        if (target.isFile) {
            res.download(target.fullPath, target.downloadName);
            return;
        }

        const archive = createZipArchive(target.fullPath, target.zipRootName);

        res.attachment(target.downloadName);
        archive.on('error', (error) => next(error));
        archive.pipe(res);
        archive.finalize();
    } catch (error) {
        next(error);
    }
}

export async function runProjectHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as AuthenticatedRequest).user;
        const result = await runProject(req.params.projectId, user.id, req.body.entry);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export async function terminalCommandHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as AuthenticatedRequest).user;
        const result = await runTerminalCommand(req.params.projectId, user.id, req.body.command);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}
