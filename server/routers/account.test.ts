import { accountRouter } from './account';
import { db } from '@/lib/db';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';

jest.mock('@/lib/db', () => ({
    db: {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      get: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
    },
  }));
  
  jest.mock('crypto', () => ({
    randomInt: jest.fn(),
  }));
  
  describe('accountRouter', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    describe('createAccount', () => {
      it('should create a new account if one does not exist', async () => {
        const caller = accountRouter.createCaller({
          req: new Request('http://localhost'),
          res: new Headers(),
          user: { id: 1 },
        });
  
        const input = {
          accountType: 'checking' as const,
        };
  
        (db.select().from().where().get as jest.Mock).mockResolvedValueOnce(null); // No existing account
        (crypto.randomInt as jest.Mock).mockReturnValue(1234567890);
        (db.select().from().where().get as jest.Mock).mockResolvedValueOnce(null); // Unique account number
  
        await caller.createAccount(input);
  
        expect(db.insert).toHaveBeenCalled();
      });
  
      it('should throw a TRPCError if an account of the same type already exists', async () => {
        const caller = accountRouter.createCaller({
          req: new Request('http://localhost'),
          res: new Headers(),
          user: { id: 1 },
        });
  
        const input = {
          accountType: 'checking' as const,
        };
  
        (db.select().from().where().get as jest.Mock).mockResolvedValue({ id: 1, accountType: 'checking' });
  
        await expect(caller.createAccount(input)).rejects.toThrow(TRPCError);
      });
  
      it('should generate a unique account number', async () => {
        const caller = accountRouter.createCaller({
            req: new Request('http://localhost'),
            res: new Headers(),
            user: { id: 1 },
          });
    
          const input = {
            accountType: 'checking' as const,
          };
    
          (db.select().from().where().get as jest.Mock).mockResolvedValueOnce(null); // No existing account
          (crypto.randomInt as jest.Mock)
            .mockReturnValueOnce(1234567890) // First attempt
            .mockReturnValueOnce(9876543210); // Second attempt (unique)
            
          (db.select().from().where().get as jest.Mock)
            .mockResolvedValueOnce({ accountNumber: '1234567890' }) // First check fails
            .mockResolvedValueOnce(null); // Second check succeeds
    
          await caller.createAccount(input);
    
          expect(crypto.randomInt).toHaveBeenCalledTimes(2);
      });
    });

    describe('getAccounts', () => {
        it('should return a list of accounts for a user', async () => {
            const caller = accountRouter.createCaller({
                req: new Request('http://localhost'),
                res: new Headers(),
                user: { id: 1 },
            });

            (db.select().from().where as jest.Mock).mockResolvedValueOnce([{}, {}]);

            const result = await caller.getAccounts();

            expect(result).toBeDefined();
            expect(result.length).toBe(2);
        });

        it('should return an empty list if the user has no accounts', async () => {
            const caller = accountRouter.createCaller({
                req: new Request('http://localhost'),
                res: new Headers(),
                user: { id: 1 },
            });

            (db.select().from().where as jest.Mock).mockResolvedValueOnce([]);

            const result = await caller.getAccounts();

            expect(result).toBeDefined();
            expect(result.length).toBe(0);
        });
    });

    describe('fundAccount', () => {
        it('should successfully fund an account with a valid card', async () => {
            const caller = accountRouter.createCaller({
                req: new Request('http://localhost'),
                res: new Headers(),
                user: { id: 1 },
            });

            const input = {
                accountId: 1,
                amount: 100,
                fundingSource: {
                    type: 'card' as const,
                    accountNumber: '4242424242424242', // valid luhn
                    routingNumber: '',
                }
            };

            (db.select().from().where().get as jest.Mock).mockResolvedValue({ id: 1, status: 'active' });
            (db.insert().values().returning as jest.Mock).mockResolvedValue([{}]);
            (db.update().set().where().returning as jest.Mock).mockResolvedValue([{}]);

            await caller.fundAccount(input);

            expect(db.insert).toHaveBeenCalled();
            expect(db.update).toHaveBeenCalled();
        });

        it('should successfully fund an account with a valid bank account', async () => {
            const caller = accountRouter.createCaller({
                req: new Request('http://localhost'),
                res: new Headers(),
                user: { id: 1 },
            });

            const input = {
                accountId: 1,
                amount: 100,
                fundingSource: {
                    type: 'bank' as const,
                    accountNumber: '123456789',
                    routingNumber: '987654321',
                }
            };

            (db.select().from().where().get as jest.Mock).mockResolvedValue({ id: 1, status: 'active' });
            (db.insert().values().returning as jest.Mock).mockResolvedValue([{}]);
            (db.update().set().where().returning as jest.Mock).mockResolvedValue([{}]);

            await caller.fundAccount(input);

            expect(db.insert).toHaveBeenCalled();
            expect(db.update).toHaveBeenCalled();
        });

        it('should throw a TRPCError if the account does not exist', async () => {
            const caller = accountRouter.createCaller({
                req: new Request('http://localhost'),
                res: new Headers(),
                user: { id: 1 },
            });

            const input = {
                accountId: 1,
                amount: 100,
                fundingSource: {
                    type: 'card' as const,
                    accountNumber: '4242424242424242',
                    routingNumber: '',
                }
            };

            (db.select().from().where().get as jest.Mock).mockResolvedValue(null);

            await expect(caller.fundAccount(input)).rejects.toThrow(TRPCError);
        });

        it('should throw a TRPCError if the account is not active', async () => {
            const caller = accountRouter.createCaller({
                req: new Request('http://localhost'),
                res: new Headers(),
                user: { id: 1 },
            });

            const input = {
                accountId: 1,
                amount: 100,
                fundingSource: {
                    type: 'card' as const,
                    accountNumber: '4242424242424242',
                    routingNumber: '',
                }
            };

            (db.select().from().where().get as jest.Mock).mockResolvedValue({ id: 1, status: 'inactive' });

            await expect(caller.fundAccount(input)).rejects.toThrow(TRPCError);
        });

        it('should throw a TRPCError for an invalid card number', async () => {
            const caller = accountRouter.createCaller({
                req: new Request('http://localhost'),
                res: new Headers(),
                user: { id: 1 },
            });

            const input = {
                accountId: 1,
                amount: 100,
                fundingSource: {
                    type: 'card' as const,
                    accountNumber: '1234', // invalid luhn
                    routingNumber: '',
                }
            };

            await expect(caller.fundAccount(input)).rejects.toThrow(TRPCError);
        });

        it('should throw a TRPCError for a bank account without a routing number', async () => {
            const caller = accountRouter.createCaller({
                req: new Request('http://localhost'),
                res: new Headers(),
                user: { id: 1 },
            });

            const input = {
                accountId: 1,
                amount: 100,
                fundingSource: {
                    type: 'bank' as const,
                    accountNumber: '123456789',
                    routingNumber: '',
                }
            };

            (db.select().from().where().get as jest.Mock).mockResolvedValue({ id: 1, status: 'active' });

            await expect(caller.fundAccount(input)).rejects.toThrow(TRPCError);
        });

        it('should throw a TRPCError for a zero amount', async () => {
            const caller = accountRouter.createCaller({
                req: new Request('http://localhost'),
                res: new Headers(),
                user: { id: 1 },
            });

            const input = {
                accountId: 1,
                amount: 0,
                fundingSource: {
                    type: 'card' as const,
                    accountNumber: '4242424242424242',
                    routingNumber: '',
                }
            };

            await expect(caller.fundAccount(input)).rejects.toThrow(TRPCError);
        });

        it('should throw a TRPCError for a negative amount', async () => {
            const caller = accountRouter.createCaller({
                req: new Request('http://localhost'),
                res: new Headers(),
                user: { id: 1 },
            });

            const input = {
                accountId: 1,
                amount: -100,
                fundingSource: {
                    type: 'card' as const,
                    accountNumber: '4242424242424242',
                    routingNumber: '',
                }
            };

            await expect(caller.fundAccount(input)).rejects.toThrow(TRPCError);
        });
    });

    describe('getTransactions', () => {
        it('should return a list of transactions for an account', async () => {
            const caller = accountRouter.createCaller({
                req: new Request('http://localhost'),
                res: new Headers(),
                user: { id: 1 },
            });

            const input = {
                accountId: 1,
                limit: 10,
                cursor: 0,
            };

            (db.select().from().where().get as jest.Mock).mockResolvedValue({ id: 1 });
            (db.select().from().leftJoin().orderBy().where().limit().offset as jest.Mock).mockResolvedValue([{}, {}]);

            const result = await caller.getTransactions(input);

            expect(result.items).toBeDefined();
            expect(result.items.length).toBe(2);
        });

        it('should return a paginated list of transactions', async () => {
            const caller = accountRouter.createCaller({
                req: new Request('http://localhost'),
                res: new Headers(),
                user: { id: 1 },
            });

            const input = {
                accountId: 1,
                limit: 1,
                cursor: 0,
            };

            (db.select().from().where().get as jest.Mock).mockResolvedValue({ id: 1 });
            (db.select().from().leftJoin().orderBy().where().limit().offset as jest.Mock).mockResolvedValue([{}, {}]);

            const result = await caller.getTransactions(input);

            expect(result.items).toBeDefined();
            expect(result.items.length).toBe(1);
            expect(result.nextCursor).toBe(1);
        });

        it('should throw a TRPCError if the account does not exist', async () => {
            const caller = accountRouter.createCaller({
                req: new Request('http://localhost'),
                res: new Headers(),
                user: { id: 1 },
            });

            const input = {
                accountId: 1,
                limit: 10,
                cursor: 0,
            };

            (db.select().from().where().get as jest.Mock).mockResolvedValue(null);

            await expect(caller.getTransactions(input)).rejects.toThrow(TRPCError);
        });
    });
  });
  