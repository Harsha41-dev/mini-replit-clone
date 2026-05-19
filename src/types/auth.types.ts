export type StoredUser = {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: string;
};

export type SafeUser = {
    id: string;
    name: string;
    email: string;
};
