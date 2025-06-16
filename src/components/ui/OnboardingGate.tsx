import React, { useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { supabase } from "../../lib/supabase";
import HowItWorksGame from "./HowItWorksGame";
import { motion, AnimatePresence } from "framer-motion";

const OnboardingGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading, refetch } = useUser();
    const [submitting, setSubmitting] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    React.useEffect(() => {
        if (!loading && user && user.onboarding_done !== true) {
            setShowOnboarding(true);
        } else {
            setShowOnboarding(false);
        }
    }, [user, loading]);

    const handleFinish = async () => {
        if (!user?.id) return;
        setSubmitting(true);
        await supabase.from("users").update({ onboarding_done: true }).eq("id", user.id);
        await refetch();
        setShowOnboarding(false);
        setSubmitting(false);
    };

    if (loading || !user) return <div className="w-full h-screen flex items-center justify-center text-xl text-gray-400">Загрузка...</div>;

    return (
        <>
            <AnimatePresence>
                {showOnboarding && (
                    <motion.div
                        key="onboarding-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        style={{ minHeight: "100dvh" }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-md mx-auto"
                        >
                            <HowItWorksGame onFinish={handleFinish} submitting={submitting} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div aria-hidden={showOnboarding}>{children}</div>
        </>
    );
};

export default OnboardingGate; 