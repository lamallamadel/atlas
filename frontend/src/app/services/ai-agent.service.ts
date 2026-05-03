import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// ─── Intent Types ────────────────────────────────────────────
export type AgentIntentType =
    | 'SEARCH'
    | 'CREATE'
    | 'STATUS_CHANGE'
    | 'SEND_MESSAGE'
    | 'NAVIGATE'
    | 'UNKNOWN';

export interface AgentIntent {
    type: AgentIntentType;
    confidence: number;       // 0–1
    query: string;            // original query
    params: Record<string, string>;
    /** Human-readable description of what the agent will do */
    description: string;
    /** Quick-action chips for the UI */
    suggestedActions?: AgentAction[];
}

export interface AgentAction {
    label: string;
    icon: string;
    handler: () => void;
}

export interface AgentMessage {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    intent?: AgentIntent;
    actions?: AgentAction[];
    isTyping?: boolean;
}

// ─── Keyword maps ─────────────────────────────────────────────
interface IntentPattern {
    type: AgentIntentType;
    verbs: string[];
    weight: number;
}

const INTENT_PATTERNS: IntentPattern[] = [
    {
        type: 'SEARCH',
        verbs: ['trouve', 'trouv', 'cherche', 'montre', 'affiche', 'liste', 'show', 'find', 'search', 'voir tous', 'quels'],
        weight: 3
    },
    {
        type: 'CREATE',
        verbs: ['crée', 'créer', 'nouveau', 'nouvelle', 'ajoute', 'ajouter', 'nouveau lead', 'new', 'créer un', 'ouvrir un'],
        weight: 3
    },
    {
        type: 'STATUS_CHANGE',
        verbs: ['statut', 'status', 'marque', 'marquer', 'archive', 'archiver', 'clôture', 'ferme', 'gagne', 'perdu', 'qualifie', 'changer statut'],
        weight: 2
    },
    {
        type: 'SEND_MESSAGE',
        verbs: ['envoie', 'envoyer', 'message', 'whatsapp', 'sms', 'contacte', 'contacter', 'appelle', 'appeler', 'écris', 'écrire'],
        weight: 2
    },
    {
        type: 'NAVIGATE',
        verbs: ['va', 'aller', 'ouvre', 'ouvrir', 'navigue', 'page', 'go to', 'tableau de bord', 'dashboard', 'calendrier', 'dossiers', 'annonces', 'rapports'],
        weight: 1
    }
];

// ─── Entity extraction helpers ────────────────────────────────
const PROPERTY_TYPES = ['t1', 't2', 't3', 't4', 't5', 'studio', 'villa', 'appartement', 'maison', 'bureau', 'local', 'terrain'];
const CITIES = ['casablanca', 'rabat', 'marrakech', 'fes', 'agadir', 'tanger', 'meknes', 'oujda', 'tetouan'];
const STATUS_MAP: Record<string, string> = {
    'nouveau': 'NEW', 'qualifié': 'QUALIFIED', 'qualification': 'QUALIFYING',
    'rendez-vous': 'APPOINTMENT', 'rdv': 'APPOINTMENT',
    'gagné': 'WON', 'perdu': 'LOST', 'archivé': 'LOST'
};

/**
 * AiAgentService — Atlas 2026 Phase 2 Frontend Layer
 *
 * Provides:
 * 1. Local intent parsing (no backend required) — instant, offline-capable
 * 2. Backend stub (POST /api/ai/agent) — for future LLM integration
 * 3. Conversation state management (BehaviorSubject)
 * 4. Action dispatch to Angular Router and API services
 */
@Injectable({ providedIn: 'root' })
export class AiAgentService {

    private readonly API_URL = '/api/ai/agent';

    /** Whether the AI panel is open */
    private _panelOpen$ = new BehaviorSubject<boolean>(false);
    panelOpen$ = this._panelOpen$.asObservable();

    /** Conversational history for the session */
    private _messages$ = new BehaviorSubject<AgentMessage[]>([]);
    messages$ = this._messages$.asObservable();

    /** Pre-filled query when opening from CMD+K */
    private _pendingQuery$ = new BehaviorSubject<string>('');
    pendingQuery$ = this._pendingQuery$.asObservable();

    constructor(private router: Router, private http: HttpClient) { }

    // ─── Panel lifecycle ────────────────────────────────────────
    openPanel(query = ''): void {
        this._pendingQuery$.next(query);
        this._panelOpen$.next(true);
    }

    closePanel(): void {
        this._panelOpen$.next(false);
        this._pendingQuery$.next('');
    }

    togglePanel(): void {
        if (this._panelOpen$.value) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    clearConversation(): void {
        this._messages$.next([]);
    }

    // ─── Main entry point ───────────────────────────────────────
    /**
     * Process a natural-language query:
     * 1. Parse intent locally
     * 2. If intent is clear (confidence ≥ 0.7) and not UNKNOWN → dispatch immediately
     * 3. Otherwise → add to conversation, try backend, return conversational response
     */
    processQuery(rawQuery: string): Observable<AgentIntent> {
        const query = rawQuery.trim();
        const intent = this.parseIntent(query);

        // Add user message to conversation
        this.addMessage({ role: 'user', content: query });

        if (intent.type !== 'UNKNOWN' && intent.confidence >= 0.65) {
            // High-confidence → dispatch and return immediately
            this.addTypingIndicator();
            this.dispatchIntent(intent);
            return of(intent);
        }

        // Low-confidence or UNKNOWN → call backend, fallback to local response
        this.addTypingIndicator();
        return this.callBackend(query).pipe(
            map(serverIntent => {
                const finalIntent = serverIntent ?? intent;
                this.dispatchIntent(finalIntent);
                return finalIntent;
            }),
            catchError(() => {
                this.dispatchIntent(intent);
                return of(intent);
            })
        );
    }

    // ─── Local intent parser ────────────────────────────────────
    parseIntent(query: string): AgentIntent {
        const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        let bestType: AgentIntentType = 'UNKNOWN';
        let bestScore = 0;

        for (const pattern of INTENT_PATTERNS) {
            for (const verb of pattern.verbs) {
                if (q.includes(verb)) {
                    const score = pattern.weight + (q.startsWith(verb) ? 2 : 0);
                    if (score > bestScore) {
                        bestScore = score;
                        bestType = pattern.type;
                    }
                }
            }
        }

        const confidence = bestScore > 0 ? Math.min(0.5 + (bestScore * 0.1), 1) : 0.2;
        const params = this.extractEntities(q, query);

        return {
            type: bestType,
            confidence,
            query,
            params,
            description: this.describeIntent(bestType, params, query),
            suggestedActions: this.buildSuggestedActions(bestType, params)
        };
    }

    // ─── Entity extraction ──────────────────────────────────────
    private extractEntities(qNorm: string, qOrig: string): Record<string, string> {
        const params: Record<string, string> = {};

        // Property type
        for (const type of PROPERTY_TYPES) {
            if (qNorm.includes(type)) {
                params['propertyType'] = type.toUpperCase();
                break;
            }
        }

        // City
        for (const city of CITIES) {
            if (qNorm.includes(city)) {
                params['city'] = city.charAt(0).toUpperCase() + city.slice(1);
                break;
            }
        }

        // Budget extraction (e.g. "2M MAD", "500000", "1.5 million")
        const budgetMatch = qOrig.match(/(\d[\d\s.,]*)(?:\s*M(?:AD)?|\s*million)?/i);
        if (budgetMatch) {
            let val = parseFloat(budgetMatch[1].replace(/[\s,]/g, '').replace('.', '.'));
            if (qOrig.toLowerCase().includes('million') || qOrig.toLowerCase().match(/\d+m\b/i)) {
                val *= 1_000_000;
            }
            if (val > 1000) {
                params['budget'] = String(Math.round(val));
            }
        }

        // Person name (capitalised words after "pour", "de", "à")
        const nameMatch = qOrig.match(/(?:pour|de|à|monsieur|madame|mr|mme)\s+([A-ZÀ-Ü][a-zà-ü]+(?:\s+[A-ZÀ-Ü][a-zà-ü]+)?)/);
        if (nameMatch) {
            params['personName'] = nameMatch[1];
        }

        // Status
        for (const [fr, en] of Object.entries(STATUS_MAP)) {
            if (qNorm.includes(fr)) {
                params['status'] = en;
                break;
            }
        }

        // Search terms: everything after the main verb
        const searchTermMatch = qOrig.match(/(?:trouve|cherche|montre|affiche|liste)\s+(.+)/i);
        if (searchTermMatch) {
            params['searchQuery'] = searchTermMatch[1].trim();
        }

        return params;
    }

    // ─── Intent description (for UI display) ───────────────────
    private describeIntent(type: AgentIntentType, params: Record<string, string>, query: string): string {
        switch (type) {
            case 'SEARCH': {
                const parts: string[] = [];
                if (params['propertyType']) parts.push(params['propertyType']);
                if (params['city']) parts.push(`à ${params['city']}`);
                if (params['budget']) parts.push(`< ${Number(params['budget']).toLocaleString('fr-MA')} MAD`);
                return parts.length > 0
                    ? `Rechercher : ${parts.join(', ')}`
                    : `Rechercher "${params['searchQuery'] || query}"`;
            }
            case 'CREATE':
                return params['personName']
                    ? `Créer un dossier pour ${params['personName']}`
                    : 'Créer un nouveau dossier / lead';
            case 'STATUS_CHANGE':
                return params['status']
                    ? `Changer le statut en "${params['status']}"`
                    : 'Modifier le statut d\'un dossier';
            case 'SEND_MESSAGE':
                return params['personName']
                    ? `Envoyer un message à ${params['personName']}`
                    : 'Ouvrir la messagerie WhatsApp';
            case 'NAVIGATE':
                return `Naviguer vers une section`;
            default:
                return 'Je vais analyser votre demande…';
        }
    }

    // ─── Action dispatch ────────────────────────────────────────
    dispatchIntent(intent: AgentIntent): void {
        const { type, params } = intent;

        switch (type) {
            case 'SEARCH': {
                const q = [
                    params['propertyType'],
                    params['city'],
                    params['searchQuery']
                ].filter(Boolean).join(' ').trim() || intent.query;

                this.router.navigate(['/search'], { queryParams: { q } });

                this.addAgentMessage(
                    `🔍 Je recherche "${q}" dans les annonces et dossiers.`,
                    intent
                );
                break;
            }

            case 'CREATE':
                this.router.navigate(['/dossiers'], { queryParams: { action: 'create' } });
                this.addAgentMessage(
                    params['personName']
                        ? `✅ J'ouvre le formulaire de création pour **${params['personName']}**.`
                        : `✅ J'ouvre le formulaire de création de dossier.`,
                    intent
                );
                break;

            case 'STATUS_CHANGE':
                this.addAgentMessage(
                    `🔄 Pour changer un statut, ouvrez d'abord le dossier concerné. Voulez-vous que je cherche un dossier spécifique ?`,
                    intent
                );
                break;

            case 'SEND_MESSAGE':
                this.router.navigate(['/dossiers'], { queryParams: { action: 'message' } });
                this.addAgentMessage(
                    params['personName']
                        ? `💬 Recherche du dossier de **${params['personName']}** pour ouvrir la messagerie…`
                        : `💬 Ouvrez un dossier et utilisez l'onglet Messagerie pour envoyer un WhatsApp.`,
                    intent
                );
                break;

            case 'NAVIGATE':
                this.handleNavigation(intent.query);
                this.addAgentMessage(`🧭 Navigation en cours…`, intent);
                break;

            default:
                this.addAgentMessage(
                    `Je n'ai pas compris votre demande. Essayez : *"Trouve des T3 à Casablanca"*, *"Crée un dossier"*, ou *"Envoie un message à M. Alami"*.`,
                    intent
                );
        }
    }

    private handleNavigation(query: string): void {
        const q = query.toLowerCase();
        if (q.includes('dashboard') || q.includes('tableau de bord')) {
            this.router.navigate(['/dashboard']);
        } else if (q.includes('dossier') || q.includes('lead')) {
            this.router.navigate(['/dossiers']);
        } else if (q.includes('annonce')) {
            this.router.navigate(['/annonces']);
        } else if (q.includes('calendrier') || q.includes('rdv')) {
            this.router.navigate(['/calendar']);
        } else if (q.includes('rapport') || q.includes('kpi')) {
            this.router.navigate(['/reports']);
        } else if (q.includes('tâche') || q.includes('task')) {
            this.router.navigate(['/tasks']);
        }
    }

    // ─── Suggested chips ────────────────────────────────────────
    private buildSuggestedActions(type: AgentIntentType, _params: Record<string, string>): AgentAction[] {
        switch (type) {
            case 'SEARCH':
                return [
                    { label: 'Voir les annonces', icon: 'campaign', handler: () => this.router.navigate(['/annonces']) },
                    { label: 'Voir les dossiers', icon: 'folder', handler: () => this.router.navigate(['/dossiers']) }
                ];
            case 'CREATE':
                return [
                    { label: 'Créer un dossier', icon: 'person_add', handler: () => this.router.navigate(['/dossiers'], { queryParams: { action: 'create' } }) },
                    { label: 'Créer une annonce', icon: 'add_circle', handler: () => this.router.navigate(['/annonces/new']) }
                ];
            case 'SEND_MESSAGE':
                return [
                    { label: 'Aller aux dossiers', icon: 'folder', handler: () => this.router.navigate(['/dossiers']) }
                ];
            default:
                return [
                    { label: 'Voir le tableau de bord', icon: 'dashboard', handler: () => this.router.navigate(['/dashboard']) },
                    { label: 'Recherche globale', icon: 'search', handler: () => this.router.navigate(['/search']) }
                ];
        }
    }

    // ─── Backend stub ────────────────────────────────────────────
    /**
     * Calls the backend AI agent endpoint.
     * Returns null if backend is unavailable — falls back to local intent.
     */
    private callBackend(query: string): Observable<AgentIntent | null> {
        return this.http.post<{ intent: AgentIntent }>(this.API_URL, { query }).pipe(
            map(res => res?.intent ?? null),
            catchError((err) => {
                console.error("AI Backend Error/Timeout:", err);
                return of(null);
            })
        );
    }

    // ─── Message helpers ─────────────────────────────────────────
    private generateId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }

    addMessage(partial: Partial<AgentMessage>): void {
        const msg: AgentMessage = {
            id: this.generateId(),
            role: 'user',
            content: '',
            timestamp: new Date(),
            ...partial
        };
        const current = this._messages$.value;
        this._messages$.next([...current, msg]);
    }

    private addTypingIndicator(): void {
        const typing: AgentMessage = {
            id: `typing_${Date.now()}`,
            role: 'agent',
            content: '',
            timestamp: new Date(),
            isTyping: true
        };
        const current = this._messages$.value;
        this._messages$.next([...current, typing]);
    }

    addAgentMessage(content: string, intent?: AgentIntent): void {
        // Remove any typing indicator
        const withoutTyping = this._messages$.value.filter(m => !m.isTyping);

        const msg: AgentMessage = {
            id: this.generateId(),
            role: 'agent',
            content,
            timestamp: new Date(),
            intent,
            actions: intent?.suggestedActions
        };

        this._messages$.next([...withoutTyping, msg]);
    }

    removeTypingIndicators(): void {
        const msgs = this._messages$.value.filter(m => !m.isTyping);
        this._messages$.next(msgs);
    }
}
