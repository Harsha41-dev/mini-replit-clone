import { NextFunction, Request, Response } from 'express';
import { IncomingHttpHeaders } from 'http';
import { SafeUser } from '../types/auth.types';
import { getUserFromToken } from '../services/auth.service';
import { UnauthorizedError } from '../utils/errors/app.error';

export type AuthenticatedRequest = Request & {
    user: SafeUser;
};

function firstHeaderValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function readCookie(cookieHeader: string | undefined, cookieName: string) {
    if (!cookieHeader) {
        return '';
    }

    const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
    const cookie = cookies.find((item) => item.startsWith(cookieName + '='));

    if (!cookie) {
        return '';
    }

    return decodeURIComponent(cookie.split('=')[1]);
}

export function readTokenFromHeaders(headers: IncomingHttpHeaders) {
    const authHeader = firstHeaderValue(headers.authorization) || '';

    if (authHeader.startsWith('Bearer ')) {
        return authHeader.replace('Bearer ', '');
    }

    return readCookie(firstHeaderValue(headers.cookie), 'mini_replit_token');
}

export function getUserFromHeaders(headers: IncomingHttpHeaders) {
    const token = readTokenFromHeaders(headers);

    if (!token) {
        throw new UnauthorizedError('Please login first');
    }

    return getUserFromToken(token);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    try {
        (req as AuthenticatedRequest).user = getUserFromHeaders(req.headers);
        next();
    } catch (error) {
        next(error);
    }
}
