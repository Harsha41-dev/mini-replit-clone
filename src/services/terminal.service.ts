import fs from 'fs';
import path from 'path';
import { BadRequestError } from '../utils/errors/app.error';
import { RunResult } from '../types/project.types';
import { getProjectById } from './project.service';
import { getSafeProjectPath } from './file.service';
import { runProject } from './runner.service';

function makeTerminalResult(command: string, output: string): RunResult {
    return {
        command,
        stdout: output,
        stderr: '',
        exitCode: 0
    };
}

function listFolder(projectId: string, ownerId: string, commandParts: string[]) {
    const selectedPath = commandParts[1] || '.';
    const fullPath = getSafeProjectPath(projectId, ownerId, selectedPath);

    if (!fs.existsSync(fullPath)) {
        throw new BadRequestError('Path does not exist');
    }

    const stats = fs.statSync(fullPath);

    if (stats.isFile()) {
        return path.basename(fullPath);
    }

    return fs.readdirSync(fullPath).join('\n');
}

function readFile(projectId: string, ownerId: string, commandParts: string[]) {
    const selectedPath = commandParts[1];

    if (!selectedPath) {
        throw new BadRequestError('Please pass a file path');
    }

    const fullPath = getSafeProjectPath(projectId, ownerId, selectedPath);

    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
        throw new BadRequestError('This is not a readable file');
    }

    return fs.readFileSync(fullPath, 'utf-8').slice(0, 6000);
}

export async function runTerminalCommand(projectId: string, ownerId: string, rawCommand: string) {
    const project = getProjectById(projectId, ownerId);
    const command = rawCommand.trim();
    const parts = command.split(/\s+/);
    const action = parts[0].toLowerCase();

    if (!command) {
        return makeTerminalResult('', '');
    }

    if (action === 'help') {
        return makeTerminalResult(command, 'Commands: help, pwd, ls, cat <file>, run [file], node [file], python [file], clear');
    }

    if (action === 'pwd') {
        return makeTerminalResult(command, `/${project.slug}`);
    }

    if (action === 'ls' || action === 'dir') {
        return makeTerminalResult(command, listFolder(projectId, ownerId, parts));
    }

    if (action === 'cat' || action === 'type') {
        return makeTerminalResult(command, readFile(projectId, ownerId, parts));
    }

    if (action === 'clear') {
        return makeTerminalResult(command, '');
    }

    if (action === 'run') {
        return runProject(projectId, ownerId, parts[1]);
    }

    if (action === 'node') {
        return runProject(projectId, ownerId, parts[1] || 'index.js');
    }

    if (action === 'python') {
        return runProject(projectId, ownerId, parts[1] || 'main.py');
    }

    if (command === 'npm start') {
        return runProject(projectId, ownerId, 'index.js');
    }

    throw new BadRequestError('This mini terminal only supports a few safe commands. Type help.');
}
