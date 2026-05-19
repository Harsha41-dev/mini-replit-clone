import express from 'express';
import {
    createProjectHandler,
    createProjectItemHandler,
    deleteProjectItemHandler,
    downloadProjectItemHandler,
    duplicateProjectItemHandler,
    getProjectTreeHandler,
    listProjectFileVersionsHandler,
    listProjectsHandler,
    readProjectFileHandler,
    renameProjectItemHandler,
    restoreProjectFileVersionHandler,
    runProjectHandler,
    saveProjectFileHandler,
    terminalCommandHandler
} from '../../controllers/project.controller';
import { validateRequestBody } from '../../validators';
import {
    createFileSchema,
    createProjectSchema,
    deleteFileSchema,
    duplicateFileSchema,
    renameFileSchema,
    runProjectSchema,
    saveFileSchema,
    terminalCommandSchema
} from '../../validators/project.validator';
import { requireAuth } from '../../middlewares/auth.middleware';

const projectRouter = express.Router();

projectRouter.use(requireAuth);

projectRouter.get('/', listProjectsHandler);
projectRouter.post('/', validateRequestBody(createProjectSchema), createProjectHandler);
projectRouter.get('/:projectId/download', downloadProjectItemHandler);
projectRouter.get('/:projectId/tree', getProjectTreeHandler);
projectRouter.get('/:projectId/files/versions', listProjectFileVersionsHandler);
projectRouter.post('/:projectId/files/versions/:versionId/restore', restoreProjectFileVersionHandler);
projectRouter.get('/:projectId/files', readProjectFileHandler);
projectRouter.put('/:projectId/files', validateRequestBody(saveFileSchema), saveProjectFileHandler);
projectRouter.post('/:projectId/files', validateRequestBody(createFileSchema), createProjectItemHandler);
projectRouter.post('/:projectId/files/duplicate', validateRequestBody(duplicateFileSchema), duplicateProjectItemHandler);
projectRouter.patch('/:projectId/files/rename', validateRequestBody(renameFileSchema), renameProjectItemHandler);
projectRouter.delete('/:projectId/files', validateRequestBody(deleteFileSchema), deleteProjectItemHandler);
projectRouter.post('/:projectId/run', validateRequestBody(runProjectSchema), runProjectHandler);
projectRouter.post('/:projectId/terminal', validateRequestBody(terminalCommandSchema), terminalCommandHandler);

export default projectRouter;
