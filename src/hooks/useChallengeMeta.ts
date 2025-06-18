import { useMemo } from "react";

interface UseChallengeMetaParams {
    endsAt: string;
    createdAt?: string;
    prize?: string;
    participants?: number;
    participantsLimit?: number;
}

function calcTimeRemaining(endsAt: string) {
    const end = new Date(endsAt).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return { text: "Завершён", expired: true } as const;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return { text: `${days}д ${hours}ч`, expired: false } as const;
    if (hours > 0) return { text: `${hours}ч ${minutes}м`, expired: false } as const;
    return { text: `${minutes}м`, expired: false } as const;
}

function calcProgressPercent(endsAt: string, createdAt?: string) {
    if (!endsAt) return 0;
    const end = new Date(endsAt).getTime();
    const now = Date.now();
    const start = createdAt ? new Date(createdAt).getTime() : now - 1000 * 60 * 60 * 24 * 7;
    const total = end - start;
    const left = end - now;
    if (total <= 0) return 100;
    return Math.max(0, Math.min(100, 100 - (left / total) * 100));
}

function calcPrizeIcon(prize?: string) {
    if (!prize) return "🎁";
    if (prize.includes("₽") || prize.includes("руб")) return "💰";
    if (prize.toLowerCase().includes("сертификат")) return "🎫";
    if (prize.toLowerCase().includes("балл")) return "⭐";
    return "🏆";
}

export function useChallengeMeta({
    endsAt,
    createdAt,
    prize,
    participants,
    participantsLimit,
}: UseChallengeMetaParams) {
    const timeRemaining = useMemo(() => calcTimeRemaining(endsAt), [endsAt]);
    const progress = useMemo(() => calcProgressPercent(endsAt, createdAt), [endsAt, createdAt]);
    const prizeIcon = useMemo(() => calcPrizeIcon(prize), [prize]);
    const isLimitReached = useMemo(
        () =>
            typeof participantsLimit === "number" &&
            typeof participants === "number" &&
            participantsLimit > 0 &&
            participantsLimit === participants,
        [participants, participantsLimit]
    );

    return { timeRemaining, progress, prizeIcon, isLimitReached } as const;
} 