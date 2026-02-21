import React from 'react';
import { MessageSquare, Instagram, Facebook } from 'lucide-react';
import { Platform } from '@/types/crm';
import { cn } from '@/lib/utils';

interface PlatformIconProps {
    platform: Platform;
    className?: string;
    size?: number;
}

const PlatformIcon = ({ platform, className, size = 16 }: PlatformIconProps) => {
    switch (platform) {
        case 'whatsapp':
            return <MessageSquare className={cn("text-green-500", className)} size={size} />;
        case 'instagram':
            return <Instagram className={cn("text-pink-600", className)} size={size} />;
        case 'messenger':
            return <Facebook className={cn("text-blue-600", className)} size={size} />;
        default:
            return <MessageSquare className={cn("text-muted-foreground", className)} size={size} />;
    }
};

export default PlatformIcon;
