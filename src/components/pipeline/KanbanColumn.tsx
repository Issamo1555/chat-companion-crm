import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
    stage: any;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage }) => {
    const totalValue = stage.opportunities.reduce((sum: number, opp: any) => sum + opp.value, 0);

    return (
        <div className="flex flex-col w-72 min-w-[18rem] bg-slate-50/50 rounded-lg p-3 border border-slate-200">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color || '#3b82f6' }} />
                    <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700">{stage.name}</h3>
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {stage.opportunities.length}
                    </span>
                </div>
                <div className="text-xs font-semibold text-slate-500">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalValue)}
                </div>
            </div>

            <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 min-h-[500px] transition-colors rounded-md ${snapshot.isDraggingOver ? 'bg-slate-100/80' : ''}`}
                    >
                        {stage.opportunities.map((opportunity: any, index: number) => (
                            <KanbanCard key={opportunity.id} opportunity={opportunity} index={index} />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default KanbanColumn;
