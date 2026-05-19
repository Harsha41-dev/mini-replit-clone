import { getDatabase } from '../database/database';
import { StoredUser } from '../types/auth.types';

type UserRow = {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    created_at: string;
};

function toUser(row: UserRow): StoredUser {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.password_hash,
        createdAt: row.created_at
    };
}

export function findUserByEmail(email: string) {
    const row = getDatabase()
        .prepare('SELECT * FROM users WHERE email = ?')
        .get(email) as UserRow | undefined;

    return row ? toUser(row) : null;
}

export function findUserById(userId: string) {
    const row = getDatabase()
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(userId) as UserRow | undefined;

    return row ? toUser(row) : null;
}

export function createUser(user: StoredUser) {
    getDatabase()
        .prepare(`
            INSERT INTO users (id, name, email, password_hash, created_at)
            VALUES (@id, @name, @email, @passwordHash, @createdAt)
        `)
        .run(user);

    return user;
}
