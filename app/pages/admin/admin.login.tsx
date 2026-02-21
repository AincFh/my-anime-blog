import { Form, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/admin.login";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, User, Shield } from "lucide-react";

/**
 * 管理员登录页面
 * 特点：只支持账号密码登录，无注册/忘记密码
 * 设计：二次元科技感风格，登录成功有炫酷动画
 */

export async function loader({ request, context }: Route.LoaderArgs) {
  // 如果已登录，重定向到后台
  const sessionId = request.headers.get("Cookie")?.match(/admin_session=([^;]+)/)?.[1];
  if (sessionId) {
    // 验证 session 是否有效
    const { getDBSafe } = await import("~/utils/db");
    const db = getDBSafe(context);
    if (db) {
      try {
        const session = await db.prepare(
          "SELECT * FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')"
        ).bind(sessionId).first();
        if (session) {
          throw redirect("/admin");
        }
      } catch (e) {
        if (e instanceof Response) throw e;
        // session 无效，继续显示登录页
      }
    }
  }
  return null;
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  // 基本验证
  if (!username || !password) {
    return { success: false, error: "请输入用户名和密码" };
  }

  // 获取数据库
  const { getDBSafe } = await import("~/utils/db");
  const db = getDBSafe(context);

  if (!db) {
    // 本地开发模式：使用硬编码的管理员账号
    if (username === "admin" && password === "admin123") {
      const token = crypto.randomUUID();
      throw redirect("/admin", {
        headers: {
          "Set-Cookie": `admin_session=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`,
        },
      });
    }
    return { success: false, error: "用户名或密码错误" };
  }

  try {
    // 查询管理员账号
    const admin = await db.prepare(
      "SELECT * FROM admins WHERE username = ?"
    ).bind(username).first() as { id: number; username: string; password_hash: string } | null;

    if (!admin) {
      return { success: false, error: "用户名或密码错误" };
    }

    // 验证密码 (使用 bcrypt 或简单比较)
    // 这里简化处理，实际应使用 bcrypt
    const { verifyPassword } = await import("~/services/crypto.server");
    const passwordValid = await verifyPassword(password, admin.password_hash);

    if (!passwordValid) {
      return { success: false, error: "用户名或密码错误" };
    }

    // 创建会话
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await db.prepare(
      "INSERT INTO admin_sessions (admin_id, token, expires_at) VALUES (?, ?, ?)"
    ).bind(admin.id, token, expiresAt).run();

    // 设置 Cookie 并重定向
    throw redirect("/admin", {
      headers: {
        "Set-Cookie": `admin_session=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`,
      },
    });
  } catch (e) {
    if (e instanceof Response) throw e; // 重定向
    console.error("Login error:", e);
    return { success: false, error: "登录失败，请稍后重试" };
  }
}

export default function AdminLogin() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // 登录成功动画处理
  useEffect(() => {
    if (navigation.state === "loading" && !actionData?.error) {
      setLoginSuccess(true);
    }
  }, [navigation.state, actionData]);

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden bg-slate-900 z-50">
      {/* 动态背景 */}
      <div className="absolute inset-0">
        {/* 渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900" />

        {/* 网格效果 */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />

        {/* 浮动光斑 */}
        <motion.div
          className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      {/* 登录成功动画 */}
      <AnimatePresence>
        {loginSuccess && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              {/* 成功图标 */}
              <motion.div
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center"
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <motion.svg
                  className="w-12 h-12 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </motion.div>

              <motion.h2
                className="text-3xl font-bold text-white mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                欢迎回来
              </motion.h2>
              <motion.p
                className="text-slate-400"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                正在进入控制台...
              </motion.p>

              {/* 加载条 */}
              <motion.div
                className="mt-8 w-48 h-1 bg-slate-700 rounded-full mx-auto overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 0.7, ease: "easeInOut" }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 登录卡片 */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 卡片外框光效 */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 rounded-2xl opacity-30 blur-sm" />

        <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
          {/* Logo 和标题 */}
          <div className="text-center mb-8">
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/25"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-1">管理员登录</h1>
            <p className="text-sm text-slate-400">Control Panel Access</p>
          </div>

          {/* 登录表单 */}
          <Form method="post" className="space-y-5">
            {/* 用户名 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">用户名</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                  type="text"
                  name="username"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  placeholder="请输入用户名"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">密码</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="block w-full pl-10 pr-12 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            <AnimatePresence>
              {actionData?.error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2"
                >
                  <span>⚠️</span>
                  {actionData.error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 登录按钮 */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  验证中...
                </span>
              ) : (
                "登 录"
              )}
            </motion.button>
          </Form>

          {/* 底部提示 */}
          <p className="mt-6 text-center text-xs text-slate-500">
            管理员账号由系统分配，请联系管理员获取
          </p>
        </div>
      </motion.div>

      {/* 版本信息 */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-600">
        Control Panel v1.0
      </div>
    </div>
  );
}
