import React from "react";
import { logErrorToTelegram } from "../utils/logError";

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
        logErrorToTelegram(error, "ErrorBoundary");
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen p-4">
                    <h1 className="text-2xl font-bold mb-4 text-red-500">Произошла ошибка</h1>
                    <p className="text-gray-600 mb-8">{this.state.error?.message || "Неизвестная ошибка"}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        Перезагрузить страницу
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
} 

SUPABASE_SERVICE_ROLE_KEY eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvdHZsYXplYWNhbWN1dXZ3d2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODcwNTQ5NywiZXhwIjoyMDY0MjgxNDk3fQ.CDBTz7LDrAJSpAt_N6wZvzCE8LogRlDJznP5hFsN3AA
SUPABASE_URL https://votvlazeacamcuuvwwfj.supabase.co
TELEGRAM_BOT_TOKEN