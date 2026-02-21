export type ClientStatus = 'new' | 'in_progress' | 'treated' | 'relaunched' | 'closed';
export type Platform = 'whatsapp' | 'instagram' | 'messenger';

export type UserRole = 'admin' | 'agent';

export interface Agent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  agentStatus: 'online' | 'on_break' | 'offline';
  agentBreaks?: AgentBreak[];
  clientCount: number;
  createdAt: Date;
}

export interface Message {
  id: string;
  clientId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  direction: 'inbound' | 'outbound';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  platform?: Platform;
}

export interface StatusChange {
  id: string;
  clientId: string;
  fromStatus: ClientStatus;
  toStatus: ClientStatus;
  changedBy: string;
  changedAt: Date;
  note?: string;
}

export interface Client {
  id: string;
  name: string;
  phoneNumber?: string;
  platform: Platform;
  platformId: string;
  status: ClientStatus;
  assignedAgentId?: string;
  assignedAgent?: Agent;
  email?: string;
  company?: string;
  address?: string;
  source?: string;
  tags: string[];
  notes: string;
  messages: Message[];
  statusHistory: StatusChange[];
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
}

export interface DashboardStats {
  totalClients: number;
  newClients: number;
  inProgressClients: number;
  treatedClients: number;
  relaunchedClients: number;
  closedClients: number;
  totalMessages: number;
  averageResponseTime: number;
  clientsByAgent: { agentName: string; count: number }[];
  clientsByStatus: { status: ClientStatus; count: number }[];
  activityByDay: { date: string; messages: number; newClients: number }[];
}

export interface ActionLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'client' | 'agent' | 'message' | 'status';
  entityId: string;
  details?: string;
  timestamp: Date;
}

export const STATUS_LABELS: Record<ClientStatus, string> = {
  new: 'Nouveau',
  in_progress: 'En cours',
  treated: 'Traité',
  relaunched: 'Relancé',
  closed: 'Fermé',
};

export const STATUS_COLORS: Record<ClientStatus, string> = {
  new: 'bg-status-new',
  in_progress: 'bg-status-in-progress',
  treated: 'bg-status-treated',
  relaunched: 'bg-status-relaunched',
  closed: 'bg-status-closed',
};

export interface Template {
  id: string;
  name: string;
  content: string;
  category?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  clientId: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: string | Date;
  status: 'pending' | 'completed';
  createdAt: string | Date;
  updatedAt: string | Date;
  client?: { id: string; name: string; phoneNumber: string };
  user?: { id: string; name: string; avatar?: string };
}

export interface AgentBreak {
  id: string;
  userId: string;
  type: string;
  startTime: string | Date;
  endTime?: string | Date;
  duration?: number;
}
