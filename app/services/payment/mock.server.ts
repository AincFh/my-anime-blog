/**
 * 模拟支付服务
 * 用于开发测试，模拟真实支付流程
 */

import {
    createPaymentOrder,
    updateOrderStatus,
    getOrder,
    type CreateOrderParams,
    type PaymentResult,
    type PaymentOrder
} from './gateway.server';

/**
 * 模拟支付配置
 */
const MOCK_CONFIG = {
    // 模拟支付成功率 (0-1)
    successRate: 0.95,
    // 模拟支付延迟 (ms)
    paymentDelay: 2000,
    // 模拟回调延迟 (ms)
    callbackDelay: 3000,
};

/**
 * 创建模拟支付订单
 */
export async function createMockPayment(
    db: any,
    params: Omit<CreateOrderParams, 'paymentMethod'>
): Promise<PaymentResult> {
    // 创建订单
    const result = await createPaymentOrder(db, {
        ...params,
        paymentMethod: 'mock',
    });

    if (!result.success || !result.order) {
        return { success: false, error: result.error || '创建订单失败' };
    }

    // 生成模拟支付页面URL
    const payUrl = `/api/payment/mock/${result.order.order_no}`;

    return {
        success: true,
        orderNo: result.order.order_no,
        payUrl,
    };
}

/**
 * 模拟支付执行
 * 用于开发环境测试
 */
export async function executeMockPayment(
    db: any,
    orderNo: string,
    simulate: 'success' | 'fail' | 'random' = 'success'
): Promise<{ success: boolean; message: string }> {
    const order = await getOrder(db, orderNo);

    if (!order) {
        return { success: false, message: '订单不存在' };
    }

    if (order.status !== 'pending') {
        return { success: false, message: `订单状态不正确: ${order.status}` };
    }

    // 确定支付结果
    let paymentSuccess: boolean;
    if (simulate === 'random') {
        paymentSuccess = Math.random() < MOCK_CONFIG.successRate;
    } else {
        paymentSuccess = simulate === 'success';
    }

    // 更新订单状态
    const tradeNo = `MOCK${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const paidAt = Math.floor(Date.now() / 1000);

    await updateOrderStatus(
        db,
        orderNo,
        paymentSuccess ? 'paid' : 'failed',
        tradeNo,
        paymentSuccess ? paidAt : undefined
    );

    return {
        success: paymentSuccess,
        message: paymentSuccess ? '支付成功' : '支付失败',
    };
}

/**
 * 模拟支付回调数据
 */
export function generateMockCallbackData(order: PaymentOrder, success: boolean): {
    order_no: string;
    trade_no: string;
    amount: number;
    status: 'success' | 'failed';
    paid_time: string;
    sign: string;
} {
    const tradeNo = `MOCK${Date.now()}`;
    const paidTime = new Date().toISOString();

    // 模拟签名（实际应用中应使用真实签名算法）
    const signData = `${order.order_no}${tradeNo}${order.amount}${success ? 'success' : 'failed'}`;
    const mockSign = btoa(signData).substring(0, 32);

    return {
        order_no: order.order_no,
        trade_no: tradeNo,
        amount: order.amount,
        status: success ? 'success' : 'failed',
        paid_time: paidTime,
        sign: mockSign,
    };
}

/**
 * 获取模拟支付状态
 */
export async function getMockPaymentStatus(
    db: any,
    orderNo: string
): Promise<{
    status: string;
    order?: PaymentOrder;
    message: string;
}> {
    const order = await getOrder(db, orderNo);

    if (!order) {
        return { status: 'not_found', message: '订单不存在' };
    }

    const statusMessages: Record<string, string> = {
        pending: '等待支付',
        paid: '支付成功',
        failed: '支付失败',
        cancelled: '已取消',
        expired: '已过期',
        refunded: '已退款',
    };

    return {
        status: order.status,
        order,
        message: statusMessages[order.status] || '未知状态',
    };
}

/**
 * 模拟支付页面数据
 */
export function generateMockPaymentPage(order: PaymentOrder): {
    orderNo: string;
    amount: string;
    productName: string;
    expireTime: string;
    qrCodeUrl: string;
} {
    return {
        orderNo: order.order_no,
        amount: (order.amount / 100).toFixed(2),
        productName: order.product_name,
        expireTime: new Date(order.expires_at * 1000).toLocaleString('zh-CN'),
        qrCodeUrl: `data:image/svg+xml,${encodeURIComponent(generateMockQRCode(order.order_no))}`,
    };
}

/**
 * 生成模拟二维码 SVG
 */
function generateMockQRCode(text: string): string {
    // 简单的模拟二维码，实际应用中使用真实二维码库
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="white"/>
      <text x="50" y="45" text-anchor="middle" font-size="8" fill="#333">模拟支付</text>
      <text x="50" y="60" text-anchor="middle" font-size="6" fill="#666">${text.substring(0, 10)}...</text>
    </svg>
  `;
}
