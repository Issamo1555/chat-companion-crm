import { useState, useEffect } from 'react';
import { Agent } from '@/types/crm';
import { Badge } from '@/components/ui/badge';

interface AgentStatusBadgeProps {
    agent: Agent;
}

export default function AgentStatusBadge({ agent }: AgentStatusBadgeProps) {
    const [elapsed, setElapsed] = useState('');

    useEffect(() => {
        if (agent.agentStatus !== 'on_break' || !agent.agentBreaks || agent.agentBreaks.length === 0) {
            setElapsed('');
            return;
        }

        const activeBreak = agent.agentBreaks[0];

        const interval = setInterval(() => {
            const start = new Date(activeBreak.startTime).getTime();
            const now = new Date().getTime();
            const diff = Math.floor((now - start) / 1000);

            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;

            if (hours > 0) {
                setElapsed(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            } else {
                setElapsed(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        // Run once immediately so there's no 1-second delay
        const start = new Date(activeBreak.startTime).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((now - start) / 1000);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setElapsed(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

        return () => clearInterval(interval);
    }, [agent]);

    if (!agent.isActive) {
        return (
            <Badge variant="outline" className="border-red-500 text-red-500 bg-red-50 dark:bg-red-950/20 text-xs px-2 py-0.5 whitespace-nowrap gap-1.5 flex w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                Désactivé
            </Badge>
        );
    }

    if (agent.agentStatus === 'on_break') {
        return (
            <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 text-xs px-2 py-0.5 whitespace-nowrap gap-1.5 flex w-fit">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
                </span>
                En pause {elapsed && `(${elapsed})`}
            </Badge>
        );
    }

    // default: online
    return (
        <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 text-xs px-2 py-0.5 whitespace-nowrap gap-1.5 flex w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
            En ligne
        </Badge>
    );
}
