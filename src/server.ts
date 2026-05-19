import express from 'express';
import http from 'http';
import path from 'path';
import { serverConfig } from './config';
import v1Router from './routers/v1/index.router';
import v2Router from './routers/v2/index.router';
import { appErrorHandler, genericErrorHandler } from './middlewares/error.middleware';
import logger from './config/logger.config';
import { attachCorrelationIdMiddleware } from './middlewares/correlation.middleware';
import { attachTerminalSocket } from './services/terminal-socket.service';
const app = express();
const server = http.createServer(app);
const publicFolder = path.join(process.cwd(), 'public');
const monacoFolder = path.join(process.cwd(), 'node_modules', 'monaco-editor', 'min');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Registering all the routers and their corresponding routes with out app server object.
 */

app.use(attachCorrelationIdMiddleware);
app.use(express.static(publicFolder));
app.use('/vendor/monaco', express.static(monacoFolder));
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router); 


/**
 * Add the error handler middleware
 */

app.use(appErrorHandler);
app.use(genericErrorHandler);

attachTerminalSocket(server);

server.listen(serverConfig.PORT, () => {
    logger.info(`Server is running on http://localhost:${serverConfig.PORT}`);
    logger.info(`Press Ctrl+C to stop the server.`);
});
