import { useState, useEffect } from "react";

export interface User {
    id: number;
    username: string;
    email: string;
    avatar_url?: string;
    role: string;
    level?: number;
    exp?: number;
    coins?: number;
}

export function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            try {
                const response = await fetch("/api/user/me");
                if (response.ok) {
                    const data = await response.json() as { user: User };
                    setUser(data.user);
                } else {
                    // 401/403 是未登录的正常状态，不需要报错
                    setUser(null);
                }
            } catch {
                // 网络错误时静默处理
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, []);

    return { user, loading };
}
