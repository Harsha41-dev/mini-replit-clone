import { NextFunction, Request, Response } from 'express';
import { getAuthCookieOptions, loginUser, makeToken, registerUser } from '../services/auth.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const authCookieName = 'mini_replit_token';

function sendUserWithCookie(res: Response, user: { id: string; name: string; email: string }) {
    const token = makeToken(user);
    res.cookie(authCookieName, token, getAuthCookieOptions());

    res.status(200).json({
        success: true,
        data: user
    });
}

export function registerHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = registerUser(req.body.name, req.body.email, req.body.password);
        sendUserWithCookie(res, user);
    } catch (error) {
        next(error);
    }
}

export function loginHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = loginUser(req.body.email, req.body.password);
        sendUserWithCookie(res, user);
    } catch (error) {
        next(error);
    }
}

export function meHandler(req: Request, res: Response) {
    res.status(200).json({
        success: true,
        data: (req as AuthenticatedRequest).user
    });
}

export function logoutHandler(req: Request, res: Response) {
    res.clearCookie(authCookieName);

    res.status(200).json({
        success: true,
        data: null
    });
}
