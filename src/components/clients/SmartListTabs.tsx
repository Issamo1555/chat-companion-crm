import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X, Plus } from 'lucide-react';

interface SmartList {
    id: string;
    name: string;
    filters: any;
}

interface SmartListTabsProps {
    lists: SmartList[];
    activeListId: string | null;
    onListSelect: (listId: string | null) => void;
    onListDelete: (listId: string) => void;
    onSaveNew: () => void;
}

const SmartListTabs: React.FC<SmartListTabsProps> = ({
    lists,
    activeListId,
    onListSelect,
    onListDelete,
    onSaveNew
}) => {
    return (
        <div className="flex items-center gap-1 border-b mb-6 overflow-x-auto no-scrollbar pb-1">
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    "px-4 rounded-none border-b-2 h-10 transition-all",
                    activeListId === null ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground"
                )}
                onClick={() => onListSelect(null)}
            >
                Tous
            </Button>

            {lists.map((list) => (
                <div key={list.id} className="relative group">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "px-4 rounded-none border-b-2 h-10 pr-8 transition-all",
                            activeListId === list.id ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground"
                        )}
                        onClick={() => onListSelect(list.id)}
                    >
                        {list.name}
                    </Button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onListDelete(list.id);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ))}

            <Button
                variant="ghost"
                size="sm"
                className="px-4 h-10 text-muted-foreground hover:text-primary gap-2"
                onClick={onSaveNew}
            >
                <Plus className="h-4 w-4" />
                Enregistrer
            </Button>
        </div>
    );
};

export default SmartListTabs;
