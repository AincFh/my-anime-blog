import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryFirst, queryAll, execute, executeBatch } from './db.server';

describe('Database 服务封装', () => {
    const mockDb = {
        prepare: vi.fn(),
        batch: vi.fn(),
    };

    const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(),
        all: vi.fn(),
        run: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockDb.prepare.mockReturnValue(mockStmt);
    });

    describe('queryFirst', () => {
        it('带参数查询应返回单条记录', async () => {
            const mockData = { id: 1, name: 'Test' };
            mockStmt.first.mockResolvedValue(mockData);

            const result = await queryFirst(mockDb as any, 'SELECT * FROM test WHERE id = ?', 1);

            expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM test WHERE id = ?');
            expect(mockStmt.bind).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockData);
        });

        it('无参数查询应正确执行', async () => {
            mockStmt.first.mockResolvedValue(null);
            await queryFirst(mockDb as any, 'SELECT * FROM test');
            expect(mockStmt.bind).not.toHaveBeenCalled();
        });
    });

    describe('queryAll', () => {
        it('正确返回所有结果列表', async () => {
            const mockRows = [{ id: 1 }, { id: 2 }];
            mockStmt.all.mockResolvedValue({ results: mockRows });

            const result = await queryAll(mockDb as any, 'SELECT * FROM test');

            expect(result).toEqual(mockRows);
            expect(mockStmt.all).toHaveBeenCalled();
        });

        it('空结果集应返回空数组', async () => {
            mockStmt.all.mockResolvedValue({ results: undefined });
            const result = await queryAll(mockDb as any, 'SELECT * FROM test');
            expect(result).toEqual([]);
        });
    });

    describe('execute', () => {
        it('写操作应返回 D1Result', async () => {
            const mockMeta = { success: true, meta: { changes: 1 } };
            mockStmt.run.mockResolvedValue(mockMeta);

            const result = await execute(mockDb as any, 'UPDATE test SET x = 1');

            expect(result).toEqual(mockMeta);
            expect(mockStmt.run).toHaveBeenCalled();
        });
    });

    describe('executeBatch', () => {
        it('应按顺序准备并执行批量操作', async () => {
            const statements = [
                { sql: 'INSERT INTO a (v) VALUES (?)', params: [1] },
                { sql: 'DELETE FROM b' }
            ];
            mockDb.batch.mockResolvedValue([{ success: true }, { success: true }]);

            await executeBatch(mockDb as any, statements);

            expect(mockDb.prepare).toHaveBeenCalledTimes(2);
            expect(mockDb.batch).toHaveBeenCalledTimes(1);
        });
    });
});
