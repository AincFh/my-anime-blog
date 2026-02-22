import { Outlet, useLocation, useLoaderData } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { GameDashboardLayout } from "~/components/dashboard/game/GameDashboardLayout";
import { getSessionToken, verifySession } from "~/services/auth.server";

export async function loader({ request, context }: { request: Request; context: any }) {
    const { anime_db } = context.cloudflare.env;
    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    let backgroundImage = null;
    if (valid && user?.preferences) {
        try {
            const prefs = JSON.parse(user.preferences);
            backgroundImage = prefs.equipped_theme || null;
        } catch (e) { }
    }

    return { backgroundImage };
}

export default function GameLayout() {
    const location = useLocation();
    const { backgroundImage } = useLoaderData<typeof loader>();

    return (
        <GameDashboardLayout backgroundImage={backgroundImage}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="w-full h-full"
                >
                    <Outlet />
                </motion.div>
            </AnimatePresence>
        </GameDashboardLayout>
    );
}
