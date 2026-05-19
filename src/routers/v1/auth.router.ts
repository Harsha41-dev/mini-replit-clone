import express from 'express';
import { loginHandler, logoutHandler, meHandler, registerHandler } from '../../controllers/auth.controller';
import { validateRequestBody } from '../../validators';
import { loginSchema, registerSchema } from '../../validators/auth.validator';
import { requireAuth } from '../../middlewares/auth.middleware';

const authRouter = express.Router();

authRouter.post('/register', validateRequestBody(registerSchema), registerHandler);
authRouter.post('/login', validateRequestBody(loginSchema), loginHandler);
authRouter.get('/me', requireAuth, meHandler);
authRouter.post('/logout', requireAuth, logoutHandler);

export default authRouter;
