import { customAlphabet } from 'nanoid';

export const generateSessionId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
