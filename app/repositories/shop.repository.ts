/**
 * 商城数据访问层
 * 封装 shop_items 和 user_purchases 表的所有数据库操作
 */

import { queryFirst, execute, queryAll, type Database } from '~/services/db.server';

export interface ShopItemRow {
    id: number;
    name: string;
    description: string | null;
    type: string;
    price_coins: number;
    original_price: number | null;
    stock: number;
    sold_count: number;
    image_url: string | null;
    preview_url: string | null;
    data: string | null;
    tier_required: string | null;
    is_active: number;
    is_featured: number;
    sort_order: number;
    start_time: number | null;
    end_time: number | null;
    created_at: number;
}

export interface UserPurchaseRow {
    id: number;
    user_id: number;
    item_id: number;
    transaction_id: number | null;
    purchased_at: number;
}

export interface CreateShopItemDTO {
    name: string;
    description?: string | null;
    type: string;
    priceCoins: number;
    originalPrice?: number | null;
    stock?: number;
    imageUrl?: string | null;
    previewUrl?: string | null;
    data?: Record<string, unknown> | null;
    tierRequired?: string | null;
    isActive?: boolean;
    isFeatured?: boolean;
    sortOrder?: number;
    startTime?: number | null;
    endTime?: number | null;
}

export const shopRepository = {
    async findById(db: Database, id: number): Promise<ShopItemRow | null> {
        return queryFirst<ShopItemRow>(
            db,
            'SELECT * FROM shop_items WHERE id = ?',
            id
        );
    },

    async findAllActive(db: Database): Promise<ShopItemRow[]> {
        return queryAll<ShopItemRow>(
            db,
            'SELECT * FROM shop_items WHERE is_active = 1 ORDER BY sort_order DESC, id DESC'
        );
    },

    async findFeatured(db: Database): Promise<ShopItemRow[]> {
        return queryAll<ShopItemRow>(
            db,
            'SELECT * FROM shop_items WHERE is_active = 1 AND is_featured = 1 ORDER BY sort_order DESC'
        );
    },

    async findByType(db: Database, type: string): Promise<ShopItemRow[]> {
        return queryAll<ShopItemRow>(
            db,
            'SELECT * FROM shop_items WHERE is_active = 1 AND type = ? ORDER BY sort_order DESC',
            type
        );
    },

    async create(db: Database, dto: CreateShopItemDTO): Promise<number> {
        const result = await execute(
            db,
            `INSERT INTO shop_items (
                name, description, type, price_coins, original_price, stock,
                image_url, preview_url, data, tier_required,
                is_active, is_featured, sort_order, start_time, end_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            dto.name,
            dto.description || null,
            dto.type,
            dto.priceCoins,
            dto.originalPrice || null,
            dto.stock ?? -1,
            dto.imageUrl || null,
            dto.previewUrl || null,
            dto.data ? JSON.stringify(dto.data) : null,
            dto.tierRequired || null,
            dto.isActive !== false ? 1 : 0,
            dto.isFeatured ? 1 : 0,
            dto.sortOrder ?? 0,
            dto.startTime || null,
            dto.endTime || null
        );
        return result.meta.last_row_id || 0;
    },

    async updateStock(db: Database, id: number, soldCount: number): Promise<boolean> {
        const result = await db.prepare(
            'UPDATE shop_items SET sold_count = sold_count + ? WHERE id = ?'
        ).bind(soldCount, id).run();

        return Boolean(result.meta.changes);
    },

    async recordPurchase(
        db: Database,
        userId: number,
        itemId: number,
        transactionId?: number
    ): Promise<number> {
        const result = await execute(
            db,
            'INSERT INTO user_purchases (user_id, item_id, transaction_id, purchased_at) VALUES (?, ?, ?, unixepoch())',
            userId,
            itemId,
            transactionId || null
        );
        return result.meta.last_row_id || 0;
    },

    async hasUserPurchased(db: Database, userId: number, itemId: number): Promise<boolean> {
        const result = await queryFirst<{ count: number }>(
            db,
            'SELECT COUNT(*) as count FROM user_purchases WHERE user_id = ? AND item_id = ?',
            userId,
            itemId
        );
        return (result?.count || 0) > 0;
    },

    async getUserPurchases(db: Database, userId: number): Promise<(UserPurchaseRow & { item: ShopItemRow })[]> {
        return queryAll<UserPurchaseRow & { item: ShopItemRow }>(
            db,
            `SELECT up.*, si.*
             FROM user_purchases up
             JOIN shop_items si ON up.item_id = si.id
             WHERE up.user_id = ?
             ORDER BY up.purchased_at DESC`,
            userId
        );
    },
};
