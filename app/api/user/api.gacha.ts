/**
 * 扭蛋机 API
 * 服务器端验证金币，防止客户端篡改
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

const GACHA_COST = 100;

interface GachaItem {
    id: string;
    name: string;
    type: "sticker" | "wallpaper" | "badge";
    image: string;
    rarity: "common" | "rare" | "epic" | "legendary";
}

const GACHA_POOL: GachaItem[] = [
    { id: "sticker_1", name: "初音未来贴纸", type: "sticker", image: "mic", rarity: "rare" },
    { id: "sticker_2", name: "樱花贴纸", type: "sticker", image: "flower", rarity: "common" },
    { id: "sticker_3", name: "星空贴纸", type: "sticker", image: "star", rarity: "epic" },
    { id: "wallpaper_1", name: "赛博朋克壁纸", type: "wallpaper", image: "city", rarity: "legendary" },
    { id: "badge_1", name: "勇者徽章", type: "badge", image: "shield", rarity: "epic" },
];

const RARITY_WEIGHTS = {
    common: 60,
    rare: 25,
    epic: 12,
    legendary: 3,
};

function rollGacha(): GachaItem {
    const roll = Math.random() * 100;
    let cumulative = 0;
    let selectedRarity: GachaItem["rarity"] = "common";

    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
        cumulative += weight;
        if (roll <= cumulative) {
            selectedRarity = rarity as GachaItem["rarity"];
            break;
        }
    }

    const itemsOfRarity = GACHA_POOL.filter((item) => item.rarity === selectedRarity);
    return itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];
}

export async function action({ request, context }: ActionFunctionArgs) {
    const { anime_db } = context.cloudflare.env;

    // 动态导入服务器模块
    const { getSessionToken, verifySession } = await import("~/services/auth.server");
    const { spendCoins, getUserCoins } = await import("~/services/membership/coins.server");
    const { logAudit } = await import("~/services/security/audit-log.server");

    // 1. 身份验证
    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return Response.json({ success: false, error: "请先登录" }, { status: 401 });
    }

    // 2. 服务器端验证金币余额
    const currentCoins = await getUserCoins(anime_db, user.id);
    if (currentCoins < GACHA_COST) {
        return Response.json(
            {
                success: false,
                error: `金币不足，需要 ${GACHA_COST} 星尘，当前余额 ${currentCoins}`,
            },
            { status: 400 }
        );
    }

    // 3. 扣减金币（服务器端原子操作）
    const spendResult = await spendCoins(
        anime_db,
        user.id,
        GACHA_COST,
        "shop",
        `扭蛋消耗: ${GACHA_COST} 星尘`
    );

    if (!spendResult.success) {
        return Response.json({ success: false, error: spendResult.error }, { status: 400 });
    }

    // 4. 抽取扭蛋
    const item = rollGacha();
    const now = Math.floor(Date.now() / 1000);

    // 5. 记录到用户背包
    await anime_db
        .prepare(
            `INSERT INTO user_purchases (user_id, item_id, transaction_id, purchased_at)
       VALUES (?, ?, ?, ?)`
        )
        .bind(user.id, item.id, `gacha_${now}`, now)
        .run();

    // 6. 审计日志
    await logAudit(anime_db, {
        userId: user.id,
        action: "gacha_pull",
        targetType: "gacha_item",
        targetId: item.id,
        metadata: { itemName: item.name, rarity: item.rarity, cost: GACHA_COST },
    });

    return Response.json({
        success: true,
        item: {
            id: item.id,
            name: item.name,
            type: item.type,
            image: item.image,
            rarity: item.rarity,
        },
        balance: spendResult.newBalance,
    });
}

// 获取当前余额
export async function loader({ request, context }: LoaderFunctionArgs) {
    const { anime_db } = context.cloudflare.env;

    // 动态导入服务器模块
    const { getSessionToken, verifySession } = await import("~/services/auth.server");
    const { getUserCoins } = await import("~/services/membership/coins.server");

    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return Response.json({ success: false, error: "请先登录" }, { status: 401 });
    }

    const coins = await getUserCoins(anime_db, user.id);

    return Response.json({
        success: true,
        coins,
        cost: GACHA_COST,
    });
}
