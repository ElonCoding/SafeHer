import { useState } from "react";
import { Phone, PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FakeCall = () => {
  const [ringing, setRinging] = useState(false);
  const [answered, setAnswered] = useState(false);

  const startCall = () => {
    setRinging(true);
    setAnswered(false);
  };

  const answer = () => {
    setAnswered(true);
    setRinging(false);
  };

  const endCall = () => {
    setRinging(false);
    setAnswered(false);
  };

  return (
    <>
      <button
        onClick={startCall}
        className="flex items-center gap-3 w-full p-4 rounded-xl glass-card hover:border-safe/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-safe/20 flex items-center justify-center">
          <Phone className="w-5 h-5 text-safe" />
        </div>
        <div className="text-left">
          <p className="font-semibold text-foreground">Fake Call</p>
          <p className="text-xs text-muted-foreground">Simulate an incoming call</p>
        </div>
      </button>

      <AnimatePresence>
        {(ringing || answered) && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-between py-16"
          >
            <div className="flex flex-col items-center gap-2 mt-12">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-3xl">👤</div>
              <h2 className="text-2xl font-bold text-foreground mt-4">Mom</h2>
              <p className="text-muted-foreground">
                {ringing ? "Incoming call..." : answered ? "Connected • 00:00" : ""}
              </p>
            </div>

            <div className="flex gap-8 mb-8">
              {ringing && (
                <>
                  <button
                    onClick={endCall}
                    className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center"
                  >
                    <PhoneOff className="w-7 h-7 text-destructive-foreground" />
                  </button>
                  <motion.button
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    onClick={answer}
                    className="w-16 h-16 rounded-full bg-safe flex items-center justify-center"
                  >
                    <Phone className="w-7 h-7 text-safe-foreground" />
                  </motion.button>
                </>
              )}
              {answered && (
                <button
                  onClick={endCall}
                  className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center"
                >
                  <PhoneOff className="w-7 h-7 text-destructive-foreground" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FakeCall;
