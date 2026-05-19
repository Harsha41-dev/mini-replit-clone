import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { BadRequestError } from '../utils/errors/app.error';
import { Project, RunResult } from '../types/project.types';
import { getProjectById, getProjectRootAfterChecking } from './project.service';
import { cleanProjectPath, getSafeProjectPath } from './file.service';

const execFileAsync = promisify(execFile);
const runnerMode = process.env.RUNNER_MODE || 'auto';
let dockerAvailable: boolean | null = null;

type CommandError = Error & {
    code?: number;
    stdout?: string;
    stderr?: string;
};

function getDefaultEntry(project: Project) {
    if (project.template === 'web') {
        return 'index.html';
    }

    if (project.template === 'python') {
        return 'main.py';
    }

    return 'index.js';
}

function makeResult(command: string, stdout: string, stderr: string, exitCode: number): RunResult {
    return {
        command,
        stdout,
        stderr,
        exitCode
    };
}

async function checkDockerAvailable() {
    if (dockerAvailable !== null) {
        return dockerAvailable;
    }

    try {
        await execFileAsync('docker', ['version', '--format', '{{.Server.Version}}'], {
            timeout: 2500,
            windowsHide: true
        });
        dockerAvailable = true;
    } catch {
        dockerAvailable = false;
    }

    return dockerAvailable;
}

async function runLocal(command: string, args: string[], projectRoot: string, displayCommand: string) {
    try {
        const result = await execFileAsync(command, args, {
            cwd: projectRoot,
            timeout: 5000,
            maxBuffer: 200 * 1024,
            windowsHide: true
        });

        return makeResult(displayCommand, result.stdout, result.stderr, 0);
    } catch (error) {
        const commandError = error as CommandError;
        return makeResult(
            displayCommand,
            commandError.stdout || '',
            commandError.stderr || commandError.message,
            commandError.code || 1
        );
    }
}

async function runInDocker(image: string, runtimeCommand: string, entryPath: string, projectRoot: string, displayCommand: string) {
    const cleanEntryPath = cleanProjectPath(entryPath).replace(/\\/g, '/');
    const volume = `${projectRoot}:/workspace:ro`;
    const args = [
        'run',
        '--rm',
        '--network',
        'none',
        '--memory',
        '128m',
        '--cpus',
        '0.5',
        '--pids-limit',
        '64',
        '--read-only',
        '-v',
        volume,
        '-w',
        '/workspace',
        image,
        runtimeCommand,
        cleanEntryPath
    ];

    return runLocal('docker', args, projectRoot, 'docker ' + displayCommand);
}

export async function runProject(projectId: string, ownerId: string, entryFromUser?: string) {
    const project = getProjectById(projectId, ownerId);
    const projectRoot = getProjectRootAfterChecking(projectId, ownerId);
    const entryPath = entryFromUser || getDefaultEntry(project);
    const fullEntryPath = getSafeProjectPath(projectId, ownerId, entryPath);
    const extension = path.extname(entryPath).toLowerCase();

    if (extension === '.html') {
        return makeResult('browser preview', 'HTML files are shown in the preview panel.', '', 0);
    }

    let command = '';
    let args: string[] = [];
    let dockerImage = '';

    if (extension === '.js') {
        command = 'node';
        args = [fullEntryPath];
        dockerImage = process.env.NODE_RUNNER_IMAGE || 'node:20-alpine';
    } else if (extension === '.py') {
        command = 'python';
        args = [fullEntryPath];
        dockerImage = process.env.PYTHON_RUNNER_IMAGE || 'python:3.12-alpine';
    } else {
        throw new BadRequestError('Only .js, .py and .html files can be run in this project');
    }

    const displayCommand = `${command} ${entryPath}`;
    const shouldUseDocker = runnerMode === 'docker' || (runnerMode === 'auto' && await checkDockerAvailable());

    if (shouldUseDocker) {
        return runInDocker(dockerImage, command, entryPath, projectRoot, displayCommand);
    }

    return runLocal(command, args, projectRoot, displayCommand);
}
