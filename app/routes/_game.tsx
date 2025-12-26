import { Outlet, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { GameDashboardLayout } from "~/components/dashboard/game/GameDashboardLayout";

export default function GameLayout() {
    const location = useLocation();

    return (
        <GameDashboardLayout>
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
