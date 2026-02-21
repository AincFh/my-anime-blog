import { describe, it, expect } from 'vitest';
import {
    generatePaymentSignature,
    verifyPaymentSignature,
    verifyCallbackSignature,
    isCallbackIPAllowed
} from './signature.server';
import {
    ORDER_STATE_MACHINE,
    canTransitionOrder,
    isTerminalStatus
} from './gateway.server';

const MOCK_SECRET = 'TEST_SECRET_KEY_123456';

describe('Payment Signature Security', () => {
    it('should generate and verify valid payment signature', async () => {
        const orderNo = 'TestOrder001';
        const amount = 100;
        const userId = 1;

        const { nonce, timestamp, signature } = await generatePaymentSignature(orderNo, amount, userId, MOCK_SECRET);

        const verification = await verifyPaymentSignature(
            orderNo,
            amount,
            userId,
            nonce,
            timestamp,
            signature,
            MOCK_SECRET
        );

        expect(verification.valid).toBe(true);
    });

    it('should reject invalid signature', async () => {
        const orderNo = 'TestOrder001';
        const amount = 100;
        const userId = 1;
        const { nonce, timestamp } = await generatePaymentSignature(orderNo, amount, userId, MOCK_SECRET);

        const verification = await verifyPaymentSignature(
            orderNo,
            amount,
            userId,
            nonce,
            timestamp,
            'invalid_signature',
            MOCK_SECRET
        );

        expect(verification.valid).toBe(false);
    });

    it('should reject signature signed with different key', async () => {
        const orderNo = 'TestOrder001';
        const amount = 100;
        const userId = 1;
        const { nonce, timestamp, signature } = await generatePaymentSignature(orderNo, amount, userId, MOCK_SECRET);

        const verification = await verifyPaymentSignature(
            orderNo,
            amount,
            userId,
            nonce,
            timestamp,
            signature,
            'WRONG_KEY'
        );

        expect(verification.valid).toBe(false);
    });

    it('should verify callback signature correctly', async () => {
        const params = {
            order_no: 'TestOrder001',
            trade_no: 'Trade123',
            amount: '100',
            status: 'success',
            timestamp: Date.now().toString(),
            nonce: 'random123'
        };

        // Manually calculate signature to simulate callback
        // Sort keys: amount, nonce, order_no, status, timestamp, trade_no
        const signString = [
            `amount=${params.amount}`,
            `nonce=${params.nonce}`,
            `order_no=${params.order_no}`,
            `status=${params.status}`,
            `timestamp=${params.timestamp}`,
            `trade_no=${params.trade_no}`
        ].join('&');

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(MOCK_SECRET),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signString));
        const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

        const result = await verifyCallbackSignature(params, signature, MOCK_SECRET);
        expect(result.valid).toBe(true);
    });
});

describe('IP Whitelist Security', () => {
    it('should allow whitelisted IP', () => {
        const allowed = '1.2.3.4, 5.6.7.8';
        expect(isCallbackIPAllowed('1.2.3.4', allowed, false)).toBe(true);
        expect(isCallbackIPAllowed('5.6.7.8', allowed, false)).toBe(true);
    });

    it('should reject non-whitelisted IP', () => {
        const allowed = '1.2.3.4, 5.6.7.8';
        expect(isCallbackIPAllowed('10.0.0.1', allowed, false)).toBe(false);
    });

    it('should allow any IP in development', () => {
        const allowed = '1.2.3.4';
        expect(isCallbackIPAllowed('10.0.0.1', allowed, true)).toBe(true);
    });
});

describe('Order State Machine', () => {
    it('should allow valid transitions', () => {
        expect(canTransitionOrder('pending', 'paid')).toBe(true);
        expect(canTransitionOrder('pending', 'failed')).toBe(true);
        expect(canTransitionOrder('paid', 'refunded')).toBe(true);
    });

    it('should reject invalid transitions', () => {
        expect(canTransitionOrder('paid', 'pending')).toBe(false);
        expect(canTransitionOrder('failed', 'paid')).toBe(false); // Should retrying go failed -> pending -> paid? Yes.
        expect(canTransitionOrder('cancelled', 'paid')).toBe(false);
    });

    it('should identify terminal statuses', () => {
        expect(isTerminalStatus('cancelled')).toBe(true);
        expect(isTerminalStatus('refunded')).toBe(true);
        expect(isTerminalStatus('paid')).toBe(false); // paid can go to refunded
    });
});
