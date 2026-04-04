import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "./BottomNav";

const AppLayout = () => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-background overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-1 overflow-y-auto pb-28 scroll-smooth"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
