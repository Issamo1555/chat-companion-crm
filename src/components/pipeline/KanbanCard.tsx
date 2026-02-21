import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Instagram, Facebook, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface KanbanCardProps {
    opportunity: any;
    index: number;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ opportunity, index }) => {
    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'instagram': return <Instagram className="w-3 h-3 text-pink-500" />;
            case 'messenger': return <Facebook className="w-3 h-3 text-blue-600" />;
            case 'whatsapp': return <MessageSquare className="w-3 h-3 text-green-500" />;
            default: return <Phone className="w-3 h-3 text-gray-500" />;
        }
    };

    return (
        <Draggable draggableId={opportunity.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="mb-3"
                >
                    <Card className={`p-3 bg-white hover:border-primary/50 transition-colors shadow-sm ${snapshot.isDragging ? 'shadow-lg border-primary' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-sm truncate">{opportunity.client.name}</span>
                            {getPlatformIcon(opportunity.client.platform)}
                        </div>

                        <div className="text-lg font-bold text-primary mb-2">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(opportunity.value)}
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-2">
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                {opportunity.client.status}
                            </Badge>
                            <span>{formatDistanceToNow(new Date(opportunity.createdAt), { addSuffix: true, locale: fr })}</span>
                        </div>
                    </Card>
                </div>
            )}
        </Draggable>
    );
};

export default KanbanCard;
