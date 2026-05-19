import crypto from 'crypto';
import { v4 as uuidV4 } from 'uuid';
import { ConflictError, UnauthorizedError } from '../utils/errors/app.error';
import { SafeUser, StoredUser } from '../types/auth.types';
import { createUser, findUserByEmail, findUserById } from '../repositories/user.repository';

const tokenSecret = process.env.AUTH_SECRET || 'student-dev-secret-change-me';
const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;

type TokenPayload = {
    userId: string;
    exp: number;
};

function toSafeUser(user: StoredUser): SafeUser {
    return {
        id: user.id,
        name: user.name,
        email: user.email
    };
}

function hashPassword(password: string) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');

    return `${salt}:${hash}`;
}

function isPasswordCorrect(password: string, savedPasswordHash: string) {
    const [salt, savedHash] = savedPasswordHash.split(':');

    if (!salt || !savedHash) {
        return false;
    }

    const newHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(savedHash, 'hex'), Buffer.from(newHash, 'hex'));
}

function toBase64Url(value: string) {
    return Buffer.from(value).toString('base64url');
}

function sign(value: string) {
    return crypto.createHmac('sha256', tokenSecret).update(value).digest('base64url');
}

export function makeToken(user: SafeUser) {
    const payload: TokenPayload = {
        userId: user.id,
        exp: Date.now() + oneWeekInMs
    };

    const encodedPayload = toBase64Url(JSON.stringify(payload));
    const signature = sign(encodedPayload);

    return `${encodedPayload}.${signature}`;
}

export function registerUser(name: string, email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    const existingUser = findUserByEmail(cleanEmail);

    if (existingUser) {
        throw new ConflictError('This email is already registered');
    }

    const newUser: StoredUser = {
        id: uuidV4(),
        name: name.trim(),
        email: cleanEmail,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString()
    };

    return toSafeUser(createUser(newUser));
}

export function loginUser(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    const user = findUserByEmail(cleanEmail);

    if (!user || !isPasswordCorrect(password, user.passwordHash)) {
        throw new UnauthorizedError('Invalid email or password');
    }

    return toSafeUser(user);
}

export function getUserFromToken(token: string) {
    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature || sign(encodedPayload) !== signature) {
        throw new UnauthorizedError('Invalid auth token');
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8')) as TokenPayload;

    if (payload.exp < Date.now()) {
        throw new UnauthorizedError('Auth token expired');
    }

    const user = findUserById(payload.userId);

    if (!user) {
        throw new UnauthorizedError('User does not exist anymore');
    }

    return toSafeUser(user);
}

export function getAuthCookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: false,
        maxAge: oneWeekInMs
    };
}
