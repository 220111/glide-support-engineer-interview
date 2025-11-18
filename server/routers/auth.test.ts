import { authRouter } from './auth';
import { db } from '@/lib/db';
import { TRPCError } from '@trpc/server';
import { hash, compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { encrypt } from '@/lib/crypto';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    get: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    delete: jest.fn().mockReturnThis(),
  },
}));

jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
}));

jest.mock('@/lib/crypto', () => ({
    encrypt: jest.fn(),
}));

describe('authRouter', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('signup', () => {
        it('should create a new user and session when given valid data', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });

            const input = {
                email: 'test@example.com',
                password: 'Password123!',
                confirmPassword: 'Password123!',
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '+12133734253',
                dateOfBirth: new Date('2000-01-01'),
                ssn: '123456789',
                address: '123 Main St',
                city: 'Anytown',
                state: 'CA' as const,
                zipCode: '12345',
            };

            (db.select().from().where().get as jest.Mock).mockResolvedValue(null);
            (hash as jest.Mock).mockResolvedValue('hashedpassword');
            (encrypt as jest.Mock).mockReturnValue('encryptedssn');
            (db.insert().values().returning as jest.Mock).mockResolvedValue([{ ...input, id: 1, password: 'hashedpassword' }]);
            (sign as jest.Mock).mockReturnValue('testtoken');

            const result = await caller.signup(input);

            expect(result.user).toBeDefined();
            expect(result.token).toBeDefined();
            expect(encrypt).toHaveBeenCalledWith(input.ssn);
        });

        it('should throw a TRPCError if the user is under 18', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });

            const input = {
              email: 'test@example.com',
              password: 'Password123!',
              confirmPassword: 'Password123!',
              firstName: 'Test',
              lastName: 'User',
              phoneNumber: '+12133734253',
              dateOfBirth: new Date(), 
              ssn: '123456789',
              address: '123 Main St',
              city: 'Anytown',
              state: 'CA' as const,
              zipCode: '12345',
            };

            await expect(caller.signup(input)).rejects.toThrow(TRPCError);
        });

        it('should throw a TRPCError if the email already exists', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });

            const input = {
                email: 'test@example.com',
                password: 'Password123!',
                confirmPassword: 'Password123!',
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '+12133734253',
                dateOfBirth: new Date('2000-01-01'),
                ssn: '123456789',
                address: '123 Main St',
                city: 'Anytown',
                state: 'CA' as const,
                zipCode: '12345',
            };

            (db.select().from().where().get as jest.Mock).mockResolvedValue({ id: 1, email: input.email });

            await expect(caller.signup(input)).rejects.toThrow(TRPCError);
        });

        it('should throw a TRPCError if the password is too short', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });

            const input = {
                email: 'test@example.com',
                password: 'short',
                confirmPassword: 'short',
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '+12133734253',
                dateOfBirth: new Date('2000-01-01'),
                ssn: '123456789',
                address: '123 Main St',
                city: 'Anytown',
                state: 'CA' as const,
                zipCode: '12345',
            };

            await expect(caller.signup(input)).rejects.toThrow(TRPCError);
        });

        it('should throw a TRPCError for invalid email format', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });
        
            const input = {
                email: 'test',
                password: 'Password123!',
                confirmPassword: 'Password123!',
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '+12133734253',
                dateOfBirth: new Date('2000-01-01'),
                ssn: '123456789',
                address: '123 Main St',
                city: 'Anytown',
                state: 'CA' as const,
                zipCode: '12345',
            };
        
            await expect(caller.signup(input)).rejects.toThrow(TRPCError);
        });

        it('should throw a TRPCError for invalid state code', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });
        
            const input = {
                email: 'test@example.com',
                password: 'Password123!',
                confirmPassword: 'Password123!',
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '+12133734253',
                dateOfBirth: new Date('2000-01-01'),
                ssn: '123456789',
                address: '123 Main St',
                city: 'Anytown',
                state: 'XX' as any,
                zipCode: '12345',
            };
        
            await expect(caller.signup(input)).rejects.toThrow(TRPCError);
        });

        it('should throw a TRPCError for invalid phone number', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });
        
            const input = {
                email: 'test@example.com',
                password: 'Password123!',
                confirmPassword: 'Password123!',
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '123',
                dateOfBirth: new Date('2000-01-01'),
                ssn: '123456789',
                address: '123 Main St',
                city: 'Anytown',
                state: 'CA' as const,
                zipCode: '12345',
            };
        
            await expect(caller.signup(input)).rejects.toThrow(TRPCError);
        });

        it('should throw a TRPCError if passwords do not match', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });
        
            const input = {
                email: 'test@example.com',
                password: 'Password123!',
                confirmPassword: 'Password123',
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '+12133734253',
                dateOfBirth: new Date('2000-01-01'),
                ssn: '123456789',
                address: '123 Main St',
                city: 'Anytown',
                state: 'CA' as const,
                zipCode: '12345',
            };
        
            await expect(caller.signup(input)).rejects.toThrow(TRPCError);
        });

        it('should throw a TRPCError if password is missing an uppercase letter', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });
        
            const input = {
                email: 'test@example.com',
                password: 'password123!',
                confirmPassword: 'password123!',
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '+12133734253',
                dateOfBirth: new Date('2000-01-01'),
                ssn: '123456789',
                address: '123 Main St',
                city: 'Anytown',
                state: 'CA' as const,
                zipCode: '12345',
            };
        
            await expect(caller.signup(input)).rejects.toThrow(TRPCError);
        });

        it('should throw a TRPCError if password is missing a lowercase letter', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });
        
            const input = {
                email: 'test@example.com',
                password: 'PASSWORD123!',
                confirmPassword: 'PASSWORD123!',
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '+12133734253',
                dateOfBirth: new Date('2000-01-01'),
                ssn: '123456789',
                address: '123 Main St',
                city: 'Anytown',
                state: 'CA' as const,
                zipCode: '12345',
            };
        
            await expect(caller.signup(input)).rejects.toThrow(TRPCError);
        });

        it('should throw a TRPCError if password is missing a number', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });
        
            const input = {
                email: 'test@example.com',
                password: 'Password!',
                confirmPassword: 'Password!',
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '+12133734253',
                dateOfBirth: new Date('2000-01-01'),
                ssn: '123456789',
                address: '123 Main St',
                city: 'Anytown',
                state: 'CA' as const,
                zipCode: '12345',
            };
        
            await expect(caller.signup(input)).rejects.toThrow(TRPCError);
        });

        it('should throw a TRPCError if password is missing a special character', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });
        
            const input = {
                email: 'test@example.com',
                password: 'Password123',
                confirmPassword: 'Password123',
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '+12133734253',
                dateOfBirth: new Date('2000-01-01'),
                ssn: '123456789',
                address: '123 Main St',
                city: 'Anytown',
                state: 'CA' as const,
                zipCode: '12345',
            };
        
            await expect(caller.signup(input)).rejects.toThrow(TRPCError);
        });

        it('should convert email to lowercase', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });

            const input = {
                email: 'TEST@EXAMPLE.COM',
                password: 'Password123!',
                confirmPassword: 'Password123!',
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '+12133734253',
                dateOfBirth: new Date('2000-01-01'),
                ssn: '123456789',
                address: '123 Main St',
                city: 'Anytown',
                state: 'CA' as const,
                zipCode: '12345',
            };

            (db.select().from().where().get as jest.Mock).mockResolvedValue(null);
            (hash as jest.Mock).mockResolvedValue('hashedpassword');
            (encrypt as jest.Mock).mockReturnValue('encryptedssn');
            (db.insert().values().returning as jest.Mock).mockResolvedValue([{ ...input, id: 1, password: 'hashedpassword', email: 'test@example.com' }]);
            (sign as jest.Mock).mockReturnValue('testtoken');

            const result = await caller.signup(input);

            expect(result.user.email).toBe('test@example.com');
        });
    });

    describe('login', () => {
        it('should return a user and token when given valid credentials and delete old sessions', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });

            const input = {
                email: 'test@example.com',
                password: 'Password123!',
            };

            const user = {
                id: 1,
                email: input.email,
                password: 'hashedpassword',
            };

            (db.select().from().where().get as jest.Mock).mockResolvedValue(user);
            (compare as jest.Mock).mockResolvedValue(true);
            (sign as jest.Mock).mockReturnValue('testtoken');

            const result = await caller.login(input);

            expect(result.user).toBeDefined();
            expect(result.token).toBeDefined();
            expect(db.delete).toHaveBeenCalled();
        });

        it('should throw a TRPCError if the user does not exist', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });

            const input = {
                email: 'test@example.com',
                password: 'Password123!',
            };

            (db.select().from().where().get as jest.Mock).mockResolvedValue(null);

            await expect(caller.login(input)).rejects.toThrow(TRPCError);
        });

        it('should throw a TRPCError if the password is a mismatch', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });

            const input = {
                email: 'test@example.com',
                password: 'Password123!',
            };

            const user = {
                id: 1,
                email: input.email,
                password: 'hashedpassword',
            };

            (db.select().from().where().get as jest.Mock).mockResolvedValue(user);
            (compare as jest.Mock).mockResolvedValue(false);

            await expect(caller.login(input)).rejects.toThrow(TRPCError);
        });
    });

    describe('logout', () => {
        it('should delete the session and return success', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost", {
                    headers: {
                        cookie: 'session=testtoken',
                    }
                }),
                res: new Headers(),
                user: null,
            });

            const result = await caller.logout();

            expect(db.delete).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        it('should return success even if no session token is provided', async () => {
            const caller = authRouter.createCaller({
                req: new Request("http://localhost"),
                res: new Headers(),
                user: null,
            });

            const result = await caller.logout();

            expect(db.delete).not.toHaveBeenCalled();
            expect(result.success).toBe(true);
        });
    });
});
