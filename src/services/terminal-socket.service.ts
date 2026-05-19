import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { getUserFromHeaders } from '../middlewares/auth.middleware';
import { runTerminalCommand } from './terminal.service';

type SocketMessage = {
    command?: string;
};

function sendJson(socket: WebSocket, data: unknown) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
    }
}

function readProjectId(url: string | undefined) {
    const parsedUrl = new URL(url || '', 'http://localhost');
    return parsedUrl.searchParams.get('projectId') || '';
}

export function attachTerminalSocket(server: HttpServer) {
    const terminalServer = new WebSocketServer({
        server,
        path: '/ws/terminal'
    });

    terminalServer.on('connection', (socket, request) => {
        let projectId = '';
        let ownerId = '';

        try {
            const user = getUserFromHeaders(request.headers);
            projectId = readProjectId(request.url);
            ownerId = user.id;

            if (!projectId) {
                throw new Error('Project id is required');
            }

            sendJson(socket, {
                type: 'ready',
                message: 'WebSocket terminal connected'
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'WebSocket auth failed';
            sendJson(socket, { type: 'error', message });
            socket.close();
            return;
        }

        socket.on('message', async (rawMessage) => {
            try {
                const body = JSON.parse(rawMessage.toString()) as SocketMessage;
                const command = String(body.command || '').trim();

                if (!command) {
                    return;
                }

                const result = await runTerminalCommand(projectId, ownerId, command);
                sendJson(socket, {
                    type: 'result',
                    data: result
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Terminal command failed';
                sendJson(socket, {
                    type: 'error',
                    message
                });
            }
        });
    });
}
