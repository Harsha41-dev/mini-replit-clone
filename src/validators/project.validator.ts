import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().trim().min(2).max(40),
    template: z.enum(['node', 'web', 'python']).optional()
});

export const saveFileSchema = z.object({
    path: z.string().min(1),
    content: z.string()
});

export const createFileSchema = z.object({
    path: z.string().min(1),
    type: z.enum(['file', 'folder'])
});

export const deleteFileSchema = z.object({
    path: z.string().min(1)
});

export const renameFileSchema = z.object({
    oldPath: z.string().min(1),
    newPath: z.string().min(1)
});

export const duplicateFileSchema = z.object({
    sourcePath: z.string().min(1),
    targetPath: z.string().min(1)
});

export const runProjectSchema = z.object({
    entry: z.string().min(1).optional()
});

export const terminalCommandSchema = z.object({
    command: z.string().min(1).max(120)
});
