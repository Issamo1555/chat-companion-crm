import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import {
    Mail,
    Send,
    Trash2,
    Inbox,
    Plus,
    Search,
    RefreshCcw,
    Settings,
    ChevronRight,
    User,
    Clock,
    ExternalLink,
    ChevronLeft,
    X,
    Paperclip,
    Check,
    Sparkles,
    Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';

const Email = () => {
    const queryClient = useQueryClient();
    const [selectedFolder, setSelectedFolder] = useState('inbox');
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Compose state
    const [composeData, setComposeData] = useState({
        to: '',
        subject: '',
        body: '',
    });

    // Account settings state
    const [accountForm, setAccountForm] = useState({
        email: '',
        name: '',
        imapHost: '',
        imapPort: '993',
        imapUser: '',
        imapPass: '',
        imapSecure: true,
        smtpHost: '',
        smtpPort: '465',
        smtpUser: '',
        smtpPass: '',
        smtpSecure: true,
    });

    const [isAiSummarizing, setIsAiSummarizing] = useState(false);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isAiDrafting, setIsAiDrafting] = useState(false);
    const [aiIntent, setAiIntent] = useState('');

    // Queries
    const { data: accounts = [] } = useQuery({
        queryKey: ['emailAccounts'],
        queryFn: api.getEmailAccounts,
    });

    useEffect(() => {
        if (accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].id);
        }
    }, [accounts, selectedAccountId]);

    const { data: emailData, isLoading: isLoadingEmails } = useQuery({
        queryKey: ['emails', selectedFolder, selectedAccountId, search],
        queryFn: () => api.getEmails({
            folder: selectedFolder,
            accountId: selectedAccountId || undefined,
            page: 1,
            limit: 50
        }),
        enabled: !!selectedAccountId || selectedFolder === 'sent', // Sent might see all
    });

    const emails = emailData?.emails || [];

    // Fill form when editing
    useEffect(() => {
        if (isSettingsOpen && selectedAccountId) {
            const acc = accounts.find((a: any) => a.id === selectedAccountId);
            if (acc) {
                setAccountForm({
                    ...acc,
                    imapPort: String(acc.imapPort),
                    smtpPort: String(acc.smtpPort),
                    imapPass: '', // Don't pre-fill passwords for security
                    smtpPass: ''
                });
            }
        }
    }, [isSettingsOpen, selectedAccountId, accounts]);

    // Mutations
    const sendMutation = useMutation({
        mutationFn: (data: any) => api.sendEmail({
            accountId: selectedAccountId!,
            ...data
        }),
        onSuccess: () => {
            toast.success('Email envoyé avec succès');
            setIsComposeOpen(false);
            setComposeData({ to: '', subject: '', body: '' });
            queryClient.invalidateQueries({ queryKey: ['emails'] });
        },
        onError: (error: any) => {
            toast.error(`Erreur lors de l'envoi : ${error.message}`);
        }
    });

    const pollMutation = useMutation({
        mutationFn: () => api.pollEmails(selectedAccountId!),
        onSuccess: () => {
            toast.success('Synchronisation terminée');
            queryClient.invalidateQueries({ queryKey: ['emails'] });
        },
        onError: () => {
            toast.error('Erreur lors de la synchronisation');
        }
    });

    const saveAccountMutation = useMutation({
        mutationFn: (data: any) => api.saveEmailAccount(data),
        onSuccess: () => {
            toast.success('Compte enregistré');
            setIsSettingsOpen(false);
            queryClient.invalidateQueries({ queryKey: ['emailAccounts'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Erreur lors de l\'enregistrement');
        }
    });

    const handleSummarize = async () => {
        if (!selectedEmail) return;
        setIsAiSummarizing(true);
        try {
            const summary = await api.summarizeAiEmail({
                subject: selectedEmail.subject,
                body: selectedEmail.body
            });
            setAiSummary(summary);
            toast.success('Résumé généré');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsAiSummarizing(false);
        }
    };

    const handleAiDraft = async () => {
        if (!aiIntent) {
            toast.error('Veuillez saisir ce que vous souhaitez dire');
            return;
        }
        setIsAiDrafting(true);
        try {
            const draft = await api.generateAiDraft({
                toName: selectedEmail?.fromName || 'Client',
                subject: selectedEmail?.subject || composeData.subject,
                context: selectedEmail?.body,
                intent: aiIntent
            });
            setComposeData({ ...composeData, body: draft });
            toast.success('Brouillon généré');
            setAiIntent('');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsAiDrafting(false);
        }
    };

    const selectedEmail = emails.find((e: any) => e.id === selectedEmailId);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        sendMutation.mutate(composeData);
    };

    const handleSaveAccount = (e: React.FormEvent) => {
        e.preventDefault();
        saveAccountMutation.mutate(accountForm);
    };

    return (
        <div className="flex h-[calc(100vh-5rem)] gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {/* Sidebar - Folders & Accounts */}
            <div className="w-64 border-r border-border bg-muted/20 flex flex-col">
                <div className="p-4">
                    <Button
                        onClick={() => setIsComposeOpen(true)}
                        className="w-full gap-2 rounded-xl shadow-md bg-primary hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        Nouveau Message
                    </Button>
                </div>

                <div className="flex-1 px-2 py-2 space-y-1">
                    <button
                        onClick={() => setSelectedFolder('inbox')}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            selectedFolder === 'inbox' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                        )}
                    >
                        <Inbox className="h-4 w-4" />
                        <span>Boîte de réception</span>
                        {/* <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">12</span> */}
                    </button>
                    <button
                        onClick={() => setSelectedFolder('sent')}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            selectedFolder === 'sent' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                        )}
                    >
                        <Send className="h-4 w-4" />
                        Envoyés
                    </button>
                    <button
                        onClick={() => setSelectedFolder('trash')}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            selectedFolder === 'trash' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                        )}
                    >
                        <Trash2 className="h-4 w-4" />
                        Corbeille
                    </button>
                </div>

                <div className="p-4 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comptes</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setIsSettingsOpen(true)}
                        >
                            <Settings className="h-3 w-3" />
                        </Button>
                    </div>
                    {accounts.length > 0 ? (
                        <Select value={selectedAccountId || ''} onValueChange={setSelectedAccountId}>
                            <SelectTrigger className="w-full h-9 text-xs bg-background">
                                <SelectValue placeholder="Choisir un compte" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((acc: any) => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <p className="text-xs text-muted-foreground p-2 bg-accent/50 rounded italic text-center">
                            Aucun compte configuré
                        </p>
                    )}
                </div>
            </div>

            {/* Middle Pane - Email List */}
            <div className="w-96 border-r border-border bg-background flex flex-col">
                <div className="p-4 border-b border-border flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher..."
                            className="pl-9 h-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => pollMutation.mutate()}
                        disabled={pollMutation.isPending || !selectedAccountId}
                    >
                        <RefreshCcw className={cn("h-4 w-4", pollMutation.isPending && "animate-spin")} />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-border/50">
                    {isLoadingEmails ? (
                        <div className="p-8 text-center">
                            <RefreshCcw className="h-8 w-8 animate-spin mx-auto text-muted-foreground opacity-20 mb-2" />
                            <p className="text-sm text-muted-foreground font-medium">Chargement...</p>
                        </div>
                    ) : emails.length > 0 ? (
                        emails.map((email: any) => (
                            <button
                                key={email.id}
                                onClick={() => setSelectedEmailId(email.id)}
                                className={cn(
                                    "w-full text-left p-4 transition-all duration-200 border-l-2",
                                    selectedEmailId === email.id
                                        ? "bg-primary/5 border-primary shadow-sm"
                                        : "hover:bg-muted/50 border-transparent",
                                    !email.isRead && selectedFolder === 'inbox' && "bg-accent/10"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={cn(
                                        "text-sm font-semibold truncate max-w-[180px]",
                                        !email.isRead && selectedFolder === 'inbox' ? "text-foreground" : "text-foreground/70"
                                    )}>
                                        {selectedFolder === 'sent' ? `À: ${email.toAddress}` : email.fromName || email.fromAddress}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase">
                                        {format(new Date(email.date), 'HH:mm')}
                                    </span>
                                </div>
                                <h4 className={cn(
                                    "text-xs line-clamp-1 mb-1 pr-4",
                                    !email.isRead && selectedFolder === 'inbox' ? "font-bold text-foreground" : "font-medium text-muted-foreground"
                                )}>
                                    {email.subject || '(Pas d\'objet)'}
                                </h4>
                                <p className="text-xs text-muted-foreground/60 line-clamp-2 leading-relaxed">
                                    {email.body}
                                </p>
                            </button>
                        ))
                    ) : (
                        <div className="p-8 text-center flex flex-col items-center justify-center h-48">
                            <div className="h-12 w-12 rounded-full bg-accent/30 flex items-center justify-center mb-3">
                                <Inbox className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                            <p className="text-sm text-muted-foreground font-medium">Aucun message trouvé</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Pane - Email Detail */}
            <div className="flex-1 bg-card/30 flex flex-col">
                {selectedEmail ? (
                    <>
                        <div className="p-6 border-b border-border bg-background/50 backdrop-blur-sm">
                            <div className="flex justify-between items-start gap-4 mb-6">
                                <h2 className="text-xl font-bold text-foreground leading-tight tracking-tight">
                                    {selectedEmail.subject || '(Pas d\'objet)'}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-lg">
                                        {(selectedEmail.fromName || selectedEmail.fromAddress || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-foreground">{selectedEmail.fromName}</span>
                                            <span className="text-xs text-muted-foreground bg-accent/30 px-2 py-0.5 rounded-full font-medium">
                                                {selectedEmail.fromAddress}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-tighter">De</span>
                                            <span>Vers: {selectedEmail.toAddress}</span>
                                            <span className="mx-1 opacity-20">•</span>
                                            <Clock className="h-3 w-3 opacity-60" />
                                            <span>{format(new Date(selectedEmail.date), 'PPP à HH:mm', { locale: fr })}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleSummarize}
                                            disabled={isAiSummarizing}
                                            className="gap-2 text-[10px] h-8 font-bold border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
                                        >
                                            {isAiSummarizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                            Résumé IA
                                        </Button>
                                    </div>
                                </div>
                                {selectedEmail.client && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 text-xs h-9 font-semibold border-primary/20 hover:bg-primary/5 text-primary"
                                        asChild
                                    >
                                        <a href={`/clients/${selectedEmail.clientId}`}>
                                            <User className="h-3 w-3" />
                                            Fiche Client
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-white/5">
                            <Card className="p-8 border-none bg-background/40 shadow-none leading-relaxed text-foreground/90 whitespace-pre-wrap font-medium">
                                {selectedEmail.html ? (
                                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} className="prose dark:prose-invert max-w-none" />
                                ) : (
                                    <div className="text-sm sm:text-base">{selectedEmail.body}</div>
                                )}
                            </Card>

                            {aiSummary && (
                                <div className="mt-4 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                    <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Sparkles className="h-3 w-3" />
                                        Résumé Assistant IA
                                    </h4>
                                    <div className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap italic">
                                        {aiSummary}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setAiSummary(null)}
                                        className="mt-2 text-[9px] h-6 px-2 text-muted-foreground hover:text-foreground"
                                    >
                                        Masquer
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-border bg-background/50 backdrop-blur-sm">
                            <div className="flex gap-3 justify-end items-center">
                                <Button variant="ghost" className="text-xs font-bold gap-2 h-10 px-6">Annuler</Button>
                                <Button
                                    className="text-xs font-bold gap-2 rounded-xl h-10 px-8 shadow-lg shadow-primary/20"
                                    onClick={() => {
                                        setComposeData({
                                            to: selectedEmail.fromAddress,
                                            subject: `Re: ${selectedEmail.subject}`,
                                            body: `\n\n--- En réponse à ---\n${selectedEmail.body}`
                                        });
                                        setIsComposeOpen(true);
                                    }}
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    Répondre
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center px-10">
                        <div className="h-24 w-24 rounded-full bg-accent/20 flex items-center justify-center mb-6 animate-pulse">
                            <Mail className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground/80 mb-2 tracking-tight">Choisissez un email</h3>
                        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed font-medium">
                            Sélectionnez un email dans la liste pour lire le fil de discussion.
                        </p>
                    </div>
                )}
            </div>

            {/* Compose Modal */}
            <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
                <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden rounded-2xl border-border bg-card shadow-2xl">
                    <DialogHeader className="p-6 bg-muted/30 border-b border-border flex flex-row items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Plus className="h-5 w-5 text-primary" />
                                Nouveau message
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground font-medium mt-1">Générez une réponse directe ou un nouvel email</p>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSend} className="flex flex-col">
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-[80px_1fr] items-center gap-4">
                                <label className="text-xs font-bold text-muted-foreground text-right uppercase tracking-wider">De</label>
                                <Select value={selectedAccountId || ''} onValueChange={setSelectedAccountId}>
                                    <SelectTrigger className="h-10 font-medium border-border/60 bg-muted/20">
                                        <SelectValue placeholder="Compte expéditeur" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map((acc: any) => (
                                            <SelectItem key={acc.id} value={acc.id}>{acc.email}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-[80px_1fr] items-center gap-4">
                                <label className="text-xs font-bold text-muted-foreground text-right uppercase tracking-wider">Vers</label>
                                <Input
                                    placeholder="email@example.com"
                                    className="h-10 font-bold border-border/60"
                                    value={composeData.to}
                                    onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-[80px_1fr] items-center gap-4">
                                <label className="text-xs font-bold text-muted-foreground text-right uppercase tracking-wider">Objet</label>
                                <Input
                                    placeholder="Sujet de votre message"
                                    className="h-10 font-bold border-border/60 bg-muted/10 focus:bg-background"
                                    value={composeData.subject}
                                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="pt-2 border-t border-border mt-4">
                                <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                                    <Sparkles className="h-4 w-4 text-purple-500" />
                                    <Input
                                        placeholder="Ex: Dis que j'accepte le devis et propose un appel"
                                        className="h-8 text-xs border-none bg-transparent focus-visible:ring-0 px-0"
                                        value={aiIntent}
                                        onChange={(e) => setAiIntent(e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={isAiDrafting || !aiIntent}
                                        onClick={handleAiDraft}
                                        className="h-7 text-[10px] font-bold bg-purple-500 hover:bg-purple-600 px-3"
                                    >
                                        {isAiDrafting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Générer Draft'}
                                    </Button>
                                </div>
                                <textarea
                                    className="w-full min-h-[300px] bg-transparent border-none focus:ring-0 text-sm py-4 resize-none leading-relaxed font-medium placeholder:text-muted-foreground/40"
                                    placeholder="Écrivez votre message ici..."
                                    value={composeData.body}
                                    onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="bg-muted/20 p-4 border-t border-border flex justify-between items-center">
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-accent rounded-full" type="button">
                                    <Paperclip className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="ghost"
                                    type="button"
                                    onClick={() => setIsComposeOpen(false)}
                                    className="text-xs font-bold px-6 h-10"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={sendMutation.isPending}
                                    className="text-xs font-bold gap-2 rounded-xl px-8 h-10 shadow-lg shadow-primary/20"
                                >
                                    {sendMutation.isPending ? (
                                        <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Send className="h-3.5 w-3.5" />
                                    )}
                                    Envoyer
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Settings Modal (Account Configuration) */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl shadow-2xl border-border">
                    <DialogHeader className="p-6 bg-muted/40 border-b border-border">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Settings className="h-5 w-5 text-primary" />
                            Configuration Email
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground font-medium">Connectez vos serveurs IMAP et SMTP</p>
                    </DialogHeader>

                    <form onSubmit={handleSaveAccount} className="max-h-[80vh] overflow-y-auto">
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nom d'affichage</label>
                                    <Input
                                        placeholder="EX: Jean Dupont"
                                        className="h-10 font-semibold"
                                        value={accountForm.name}
                                        onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Adresse Email</label>
                                    <Input
                                        placeholder="jean@entreprise.com"
                                        className="h-10 font-semibold"
                                        value={accountForm.email}
                                        onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <h4 className="text-xs font-bold uppercase text-primary mb-4 flex items-center gap-2">
                                    <Inbox className="h-3.5 w-3.5" /> Serveur Entrant (IMAP)
                                </h4>
                                <div className="grid grid-cols-[1fr_100px] gap-4 mb-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground/60">Hôte</label>
                                        <Input
                                            placeholder="imap.gmail.com"
                                            className="h-9 font-medium bg-background"
                                            value={accountForm.imapHost}
                                            onChange={(e) => setAccountForm({ ...accountForm, imapHost: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground/60">Port</label>
                                        <Input
                                            className="h-9 font-medium bg-background"
                                            value={accountForm.imapPort}
                                            onChange={(e) => setAccountForm({ ...accountForm, imapPort: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground/60">Utilisateur IMAP</label>
                                        <Input
                                            className="h-9 font-medium bg-background"
                                            value={accountForm.imapUser}
                                            onChange={(e) => setAccountForm({ ...accountForm, imapUser: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground/60">Mot de passe IMAP</label>
                                        <Input
                                            type="password"
                                            className="h-9 font-medium bg-background"
                                            value={accountForm.imapPass}
                                            onChange={(e) => setAccountForm({ ...accountForm, imapPass: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-accent/30 border border-border/60">
                                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
                                    <Send className="h-3.5 w-3.5" /> Serveur Sortant (SMTP)
                                </h4>
                                <div className="grid grid-cols-[1fr_100px] gap-4 mb-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground/60">Hôte SMTP</label>
                                        <Input
                                            placeholder="smtp.gmail.com"
                                            className="h-9 font-medium bg-background"
                                            value={accountForm.smtpHost}
                                            onChange={(e) => setAccountForm({ ...accountForm, smtpHost: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground/60">Port SMTP</label>
                                        <Input
                                            className="h-9 font-medium bg-background"
                                            value={accountForm.smtpPort}
                                            onChange={(e) => setAccountForm({ ...accountForm, smtpPort: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground/60">Utilisateur SMTP</label>
                                        <Input
                                            className="h-9 font-medium bg-background"
                                            value={accountForm.smtpUser}
                                            onChange={(e) => setAccountForm({ ...accountForm, smtpUser: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground/60">Mot de passe SMTP</label>
                                        <Input
                                            type="password"
                                            className="h-9 font-medium bg-background"
                                            value={accountForm.smtpPass}
                                            onChange={(e) => setAccountForm({ ...accountForm, smtpPass: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-muted/30 border-t border-border flex justify-end gap-3">
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => setIsSettingsOpen(false)}
                                className="text-xs font-bold px-6 h-10"
                            >
                                Fermer
                            </Button>
                            <Button
                                type="submit"
                                disabled={saveAccountMutation.isPending}
                                className="text-xs font-bold gap-2 rounded-xl px-10 h-10 shadow-lg shadow-primary/20"
                            >
                                {saveAccountMutation.isPending && <RefreshCcw className="h-4 w-4 animate-spin" />}
                                Enregistrer la configuration
                                <Check className="h-4 w-4" />
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const EmailPage = () => {
    return (
        <MainLayout>
            <Email />
        </MainLayout>
    );
};

export default EmailPage;
