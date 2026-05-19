import express from 'express';
import pingRouter from './ping.router';
import projectRouter from './project.router';
import authRouter from './auth.router';

const v1Router = express.Router();



v1Router.use('/ping',  pingRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/projects', projectRouter);

export default v1Router;
