import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface EmptyStateConfig {
  context: EmptyStateContext;
  title: string;
  message: string;
  illustration: SafeHtml;
  primaryCta?: {
    label: string;
    icon?: string;
  };
  secondaryCta?: {
    label: string;
    icon?: string;
  };
  helpLink?: {
    label: string;
    url: string;
  };
}

export enum EmptyStateContext {
  NO_DOSSIERS = 'NO_DOSSIERS',
  NO_DOSSIERS_FILTERED = 'NO_DOSSIERS_FILTERED',
  NO_ANNONCES = 'NO_ANNONCES',
  NO_ANNONCES_FILTERED = 'NO_ANNONCES_FILTERED',
  NO_MESSAGES = 'NO_MESSAGES',
  NO_MESSAGES_FILTERED = 'NO_MESSAGES_FILTERED',
  NO_APPOINTMENTS = 'NO_APPOINTMENTS',
  NO_TASKS = 'NO_TASKS',
  NO_DOCUMENTS = 'NO_DOCUMENTS',
  NO_SEARCH_RESULTS = 'NO_SEARCH_RESULTS',
  NO_ACTIVITIES = 'NO_ACTIVITIES',
  NO_NOTIFICATIONS = 'NO_NOTIFICATIONS'
}

@Injectable({
  providedIn: 'root'
})
export class EmptyStateIllustrationsService {
  constructor(private sanitizer: DomSanitizer) {}

  getConfig(context: EmptyStateContext, isNewUser = false): EmptyStateConfig {
    const configs: Record<EmptyStateContext, EmptyStateConfig> = {
      [EmptyStateContext.NO_DOSSIERS]: {
        context,
        title: isNewUser ? 'Bienvenue ! Créez votre premier dossier' : 'Aucun dossier pour le moment',
        message: isNewUser 
          ? 'Commencez votre gestion de prospects en créant votre premier dossier. C\'est simple et rapide !'
          : 'Créez un nouveau dossier pour commencer à suivre vos prospects et opportunités.',
        illustration: this.sanitizer.bypassSecurityTrustHtml(this.getDossierIllustration()),
        primaryCta: {
          label: isNewUser ? 'Créer mon premier dossier' : 'Nouveau dossier',
          icon: 'add_circle'
        },
        secondaryCta: {
          label: 'Importer des dossiers',
          icon: 'upload_file'
        },
        helpLink: {
          label: 'Comment gérer mes dossiers ?',
          url: '/aide/dossiers'
        }
      },
      [EmptyStateContext.NO_DOSSIERS_FILTERED]: {
        context,
        title: 'Aucun dossier ne correspond aux filtres',
        message: 'Essayez de modifier vos critères de recherche ou réinitialisez les filtres pour voir tous vos dossiers.',
        illustration: this.sanitizer.bypassSecurityTrustHtml(this.getSearchIllustration()),
        primaryCta: {
          label: 'Réinitialiser les filtres',
          icon: 'filter_alt_off'
        },
        secondaryCta: {
          label: 'Nouveau dossier',
          icon: 'add'
        },
        helpLink: {
          label: 'Astuces de recherche',
          url: '/aide/recherche'
        }
      },
      [EmptyStateContext.NO_ANNONCES]: {
        context,
        title: isNewUser ? 'Créez votre première annonce' : 'Aucune annonce disponible',
        message: isNewUser
          ? 'Publiez votre première annonce immobilière et commencez à attirer des prospects qualifiés.'
          : 'Créez une nouvelle annonce pour présenter vos biens et générer des leads.',
        illustration: this.sanitizer.bypassSecurityTrustHtml(this.getAnnonceIllustration()),
        primaryCta: {
          label: isNewUser ? 'Créer ma première annonce' : 'Nouvelle annonce',
          icon: 'add_home'
        },
        secondaryCta: {
          label: 'Parcourir les modèles',
          icon: 'view_module'
        },
        helpLink: {
          label: 'Guide de création d\'annonces',
          url: '/aide/annonces'
        }
      },
      [EmptyStateContext.NO_ANNONCES_FILTERED]: {
        context,
        title: 'Aucune annonce trouvée',
        message: 'Aucune annonce ne correspond à vos critères. Modifiez vos filtres ou créez une nouvelle annonce.',
        illustration: this.sanitizer.bypassSecurityTrustHtml(this.getSearchIllustration()),
        primaryCta: {
          label: 'Réinitialiser les filtres',
          icon: 'clear_all'
        },
        secondaryCta: {
          label: 'Nouvelle annonce',
          icon: 'add'
        }
      },
      [EmptyStateContext.NO_MESSAGES]: {
        context,
        title: 'Aucun message envoyé',
        message: 'Commencez à communiquer avec vos prospects via SMS, email ou WhatsApp.',
        illustration: this.sanitizer.bypassSecurityTrustHtml(this.getMessageIllustration()),
        primaryCta: {
          label: 'Envoyer un message',
          icon: 'send'
        },
        secondaryCta: {
          label: 'Utiliser un modèle',
          icon: 'text_snippet'
        },
        helpLink: {
          label: 'Bonnes pratiques messaging',
          url: '/aide/messages'
        }
      },
      [EmptyStateContext.NO_MESSAGES_FILTERED]: {
        context,
        title: 'Aucun message trouvé',
        message: 'Aucun message ne correspond à vos critères de recherche.',
        illustration: this.sanitizer.bypassSecurityTrustHtml(this.getSearchIllustration()),
        primaryCta: {
          label: 'Réinitialiser les filtres',
          icon: 'filter_alt_off'
        }
      },
      [EmptyStateContext.NO_APPOINTMENTS]: {
        context,
        title: 'Aucun rendez-vous planifié',
        message: 'Planifiez des rendez-vous avec vos prospects pour accélérer vos conversions.',
        illustration: this.sanitizer.bypassSecurityTrustHtml(this.getAppointmentIllustration()),
        primaryCta: {
          label: 'Planifier un rendez-vous',
          icon: 'event'
        },
        helpLink: {
          label: 'Gérer mon agenda',
          url: '/aide/agenda'
        }
      },
      [EmptyStateContext.NO_TASKS]: {
        context,
        title: 'Aucune tâche en cours',
        message: 'Créez des tâches pour organiser votre suivi commercial et ne rien oublier.',
        illustration: this.sanitizer.bypassSecurityTrustHtml(this.getTaskIllustration()),
        primaryCta: {
          label: 'Créer une tâche',
          icon: 'add_task'
        }
      },
      [EmptyStateContext.NO_DOCUMENTS]: {
        context,
        title: 'Aucun document ajouté',
        message: 'Centralisez vos documents importants : contrats, photos, diagnostics...',
        illustration: this.sanitizer.bypassSecurityTrustHtml(this.getDocumentIllustration()),
        primaryCta: {
          label: 'Ajouter un document',
          icon: 'upload_file'
        },
        helpLink: {
          label: 'Types de documents',
          url: '/aide/documents'
        }
      },
      [EmptyStateContext.NO_SEARCH_RESULTS]: {
        context,
        title: 'Aucun résultat',
        message: 'Essayez avec d\'autres mots-clés ou vérifiez l\'orthographe de votre recherche.',
        illustration: this.sanitizer.bypassSecurityTrustHtml(this.getSearchIllustration()),
        primaryCta: {
          label: 'Effacer la recherche',
          icon: 'close'
        },
        helpLink: {
          label: 'Astuces de recherche',
          url: '/aide/recherche'
        }
      },
      [EmptyStateContext.NO_ACTIVITIES]: {
        context,
        title: 'Aucune activité récente',
        message: 'Les activités de votre équipe apparaîtront ici.',
        illustration: this.sanitizer.bypassSecurityTrustHtml(this.getActivityIllustration())
      },
      [EmptyStateContext.NO_NOTIFICATIONS]: {
        context,
        title: 'Aucune notification',
        message: 'Vous êtes à jour ! Les nouvelles notifications apparaîtront ici.',
        illustration: this.sanitizer.bypassSecurityTrustHtml(this.getNotificationIllustration())
      }
    };

    return configs[context];
  }

  private getDossierIllustration(): string {
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="empty-state-svg">
        <defs>
          <linearGradient id="folder-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="doc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background circle with pulse animation -->
        <circle cx="100" cy="100" r="80" fill="#f0f4ff" class="pulse-circle"/>
        
        <!-- Main folder -->
        <path d="M50 70 L50 150 L150 150 L150 80 L120 80 L110 70 Z" 
              fill="url(#folder-grad)" 
              class="folder-main"/>
        
        <!-- Folder tab -->
        <path d="M50 70 L110 70 L115 75 L150 75 L150 80 L120 80 L110 70 Z" 
              fill="url(#folder-grad)" 
              opacity="0.8"/>
        
        <!-- Document inside -->
        <rect x="70" y="90" width="60" height="45" rx="3" 
              fill="url(#doc-grad)" 
              class="document-pulse"/>
        
        <!-- Document lines -->
        <line x1="80" y1="100" x2="110" y2="100" stroke="white" stroke-width="2" opacity="0.8"/>
        <line x1="80" y1="110" x2="120" y2="110" stroke="white" stroke-width="2" opacity="0.8"/>
        <line x1="80" y1="120" x2="115" y2="120" stroke="white" stroke-width="2" opacity="0.8"/>
        
        <!-- Plus icon with scale animation -->
        <g class="plus-icon">
          <circle cx="140" cy="60" r="18" fill="#48bb78"/>
          <line x1="140" y1="50" x2="140" y2="70" stroke="white" stroke-width="3" stroke-linecap="round"/>
          <line x1="130" y1="60" x2="150" y2="60" stroke="white" stroke-width="3" stroke-linecap="round"/>
        </g>
        
        <style>
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.05); }
          }
          @keyframes documentFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          @keyframes scaleIn {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          .pulse-circle {
            animation: pulse 3s ease-in-out infinite;
          }
          .document-pulse {
            animation: documentFloat 2s ease-in-out infinite;
          }
          .plus-icon {
            animation: scaleIn 2s ease-in-out infinite;
            transform-origin: 140px 60px;
          }
          .folder-main {
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
          }
        </style>
      </svg>
    `;
  }

  private getAnnonceIllustration(): string {
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="empty-state-svg">
        <defs>
          <linearGradient id="house-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4facfe;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#00f2fe;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <circle cx="100" cy="100" r="80" fill="#e6f7ff" class="pulse-circle"/>
        
        <!-- House base -->
        <rect x="60" y="100" width="80" height="60" rx="4" fill="url(#house-grad)" class="house-float"/>
        
        <!-- Roof -->
        <path d="M50 100 L100 60 L150 100 Z" fill="#667eea" class="house-float"/>
        
        <!-- Door -->
        <rect x="85" y="125" width="30" height="35" rx="2" fill="#ffffff" opacity="0.9"/>
        <circle cx="108" cy="145" r="2" fill="#667eea"/>
        
        <!-- Windows -->
        <rect x="70" y="110" width="18" height="18" rx="2" fill="#ffffff" opacity="0.9" class="window-blink"/>
        <rect x="112" y="110" width="18" height="18" rx="2" fill="#ffffff" opacity="0.9" class="window-blink"/>
        
        <!-- Window panes -->
        <line x1="79" y1="110" x2="79" y2="128" stroke="#4facfe" stroke-width="1"/>
        <line x1="70" y1="119" x2="88" y2="119" stroke="#4facfe" stroke-width="1"/>
        <line x1="121" y1="110" x2="121" y2="128" stroke="#4facfe" stroke-width="1"/>
        <line x1="112" y1="119" x2="130" y2="119" stroke="#4facfe" stroke-width="1"/>
        
        <!-- Chimney -->
        <rect x="120" y="75" width="12" height="25" rx="2" fill="#5a67d8"/>
        
        <!-- Plus icon -->
        <g class="plus-icon">
          <circle cx="150" cy="70" r="16" fill="#48bb78"/>
          <line x1="150" y1="62" x2="150" y2="78" stroke="white" stroke-width="3" stroke-linecap="round"/>
          <line x1="142" y1="70" x2="158" y2="70" stroke="white" stroke-width="3" stroke-linecap="round"/>
        </g>
        
        <style>
          @keyframes houseFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes windowBlink {
            0%, 90%, 100% { opacity: 0.9; }
            95% { opacity: 0.5; }
          }
          .house-float {
            animation: houseFloat 3s ease-in-out infinite;
          }
          .window-blink {
            animation: windowBlink 4s ease-in-out infinite;
          }
          .plus-icon {
            animation: scaleIn 2s ease-in-out infinite;
            transform-origin: 150px 70px;
          }
        </style>
      </svg>
    `;
  }

  private getMessageIllustration(): string {
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="empty-state-svg">
        <defs>
          <linearGradient id="msg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <circle cx="100" cy="100" r="80" fill="#fff5f7" class="pulse-circle"/>
        
        <!-- Chat bubble 1 -->
        <g class="bubble-float-1">
          <rect x="50" y="70" width="70" height="45" rx="8" fill="url(#msg-grad)"/>
          <path d="M60 115 L55 125 L70 115 Z" fill="url(#msg-grad)"/>
          <line x1="65" y1="85" x2="105" y2="85" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
          <line x1="65" y1="100" x2="95" y2="100" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
        </g>
        
        <!-- Chat bubble 2 -->
        <g class="bubble-float-2">
          <rect x="80" y="110" width="70" height="45" rx="8" fill="#667eea"/>
          <path d="M140 155 L145 165 L130 155 Z" fill="#667eea"/>
          <line x1="95" y1="125" x2="135" y2="125" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
          <line x1="95" y1="140" x2="125" y2="140" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
        </g>
        
        <!-- Dots animation -->
        <g class="typing-dots">
          <circle cx="85" cy="90" r="3" fill="white" opacity="0.7" class="dot-1"/>
          <circle cx="95" cy="90" r="3" fill="white" opacity="0.7" class="dot-2"/>
          <circle cx="105" cy="90" r="3" fill="white" opacity="0.7" class="dot-3"/>
        </g>
        
        <!-- Send icon -->
        <g class="send-icon">
          <circle cx="150" cy="60" r="16" fill="#48bb78"/>
          <path d="M142 60 L158 60 L150 52 M158 60 L150 68" 
                stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </g>
        
        <style>
          @keyframes floatBubble1 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(-3px, -5px); }
          }
          @keyframes floatBubble2 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(3px, 5px); }
          }
          @keyframes typingDot {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
            30% { transform: translateY(-5px); opacity: 1; }
          }
          .bubble-float-1 {
            animation: floatBubble1 3s ease-in-out infinite;
          }
          .bubble-float-2 {
            animation: floatBubble2 3s ease-in-out infinite;
          }
          .dot-1 { animation: typingDot 1.5s ease-in-out infinite; }
          .dot-2 { animation: typingDot 1.5s ease-in-out infinite 0.2s; }
          .dot-3 { animation: typingDot 1.5s ease-in-out infinite 0.4s; }
          .send-icon {
            animation: scaleIn 2s ease-in-out infinite;
            transform-origin: 150px 60px;
          }
        </style>
      </svg>
    `;
  }

  private getSearchIllustration(): string {
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="empty-state-svg">
        <defs>
          <linearGradient id="search-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#a8edea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#fed6e3;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <circle cx="100" cy="100" r="80" fill="#f0fdf4" class="pulse-circle"/>
        
        <!-- Magnifying glass -->
        <g class="search-glass">
          <circle cx="90" cy="90" r="35" fill="none" stroke="url(#search-grad)" stroke-width="6"/>
          <line x1="115" y1="115" x2="140" y2="140" stroke="url(#search-grad)" stroke-width="6" stroke-linecap="round"/>
        </g>
        
        <!-- Question mark -->
        <g class="question-mark">
          <path d="M85 75 Q85 65 95 65 Q105 65 105 75 Q105 85 95 90" 
                stroke="#667eea" stroke-width="3" fill="none" stroke-linecap="round"/>
          <circle cx="95" cy="100" r="2" fill="#667eea"/>
        </g>
        
        <!-- Floating particles -->
        <circle cx="60" cy="60" r="3" fill="#48bb78" opacity="0.6" class="particle-1"/>
        <circle cx="140" cy="65" r="2.5" fill="#667eea" opacity="0.6" class="particle-2"/>
        <circle cx="130" cy="100" r="2" fill="#f093fb" opacity="0.6" class="particle-3"/>
        
        <style>
          @keyframes searchRotate {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-5deg); }
            75% { transform: rotate(5deg); }
          }
          @keyframes particleFloat {
            0%, 100% { transform: translateY(0); opacity: 0.6; }
            50% { transform: translateY(-10px); opacity: 1; }
          }
          .search-glass {
            animation: searchRotate 3s ease-in-out infinite;
            transform-origin: 100px 100px;
          }
          .question-mark {
            animation: scaleIn 2s ease-in-out infinite;
            transform-origin: 95px 85px;
          }
          .particle-1 { animation: particleFloat 2s ease-in-out infinite; }
          .particle-2 { animation: particleFloat 2.5s ease-in-out infinite 0.3s; }
          .particle-3 { animation: particleFloat 3s ease-in-out infinite 0.6s; }
        </style>
      </svg>
    `;
  }

  private getAppointmentIllustration(): string {
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="empty-state-svg">
        <defs>
          <linearGradient id="cal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <circle cx="100" cy="100" r="80" fill="#f5f3ff" class="pulse-circle"/>
        
        <!-- Calendar -->
        <rect x="60" y="65" width="80" height="90" rx="6" fill="white" stroke="url(#cal-grad)" stroke-width="3" class="calendar-float"/>
        
        <!-- Calendar header -->
        <rect x="60" y="65" width="80" height="20" rx="6" fill="url(#cal-grad)"/>
        <circle cx="75" cy="65" r="4" fill="white"/>
        <circle cx="125" cy="65" r="4" fill="white"/>
        
        <!-- Calendar grid -->
        <g fill="#e5e7eb">
          <rect x="70" y="95" width="12" height="12" rx="2"/>
          <rect x="88" y="95" width="12" height="12" rx="2"/>
          <rect x="106" y="95" width="12" height="12" rx="2"/>
          <rect x="124" y="95" width="12" height="12" rx="2"/>
          
          <rect x="70" y="113" width="12" height="12" rx="2"/>
          <rect x="88" y="113" width="12" height="12" rx="2"/>
          <rect x="106" y="113" width="12" height="12" rx="2"/>
          <rect x="124" y="113" width="12" height="12" rx="2"/>
          
          <rect x="70" y="131" width="12" height="12" rx="2"/>
        </g>
        
        <!-- Highlighted date -->
        <rect x="88" y="131" width="12" height="12" rx="2" fill="#48bb78" class="date-pulse"/>
        
        <!-- Clock icon -->
        <g class="clock-icon">
          <circle cx="145" cy="60" r="16" fill="#f59e0b"/>
          <circle cx="145" cy="60" r="12" fill="white"/>
          <line x1="145" y1="60" x2="145" y2="54" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
          <line x1="145" y1="60" x2="149" y2="63" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
        </g>
        
        <style>
          @keyframes calendarFloat {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-5px) rotate(-1deg); }
          }
          @keyframes datePulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.8; }
          }
          .calendar-float {
            animation: calendarFloat 3s ease-in-out infinite;
          }
          .date-pulse {
            animation: datePulse 2s ease-in-out infinite;
          }
          .clock-icon {
            animation: scaleIn 2s ease-in-out infinite;
            transform-origin: 145px 60px;
          }
        </style>
      </svg>
    `;
  }

  private getTaskIllustration(): string {
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="empty-state-svg">
        <defs>
          <linearGradient id="task-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#fa709a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#fee140;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <circle cx="100" cy="100" r="80" fill="#fffbeb" class="pulse-circle"/>
        
        <!-- Clipboard -->
        <rect x="65" y="60" width="70" height="95" rx="6" fill="white" stroke="url(#task-grad)" stroke-width="3" class="clipboard-float"/>
        
        <!-- Clip -->
        <rect x="90" y="55" width="20" height="8" rx="4" fill="url(#task-grad)"/>
        
        <!-- Task items -->
        <g class="task-item-1">
          <circle cx="78" cy="85" r="6" fill="none" stroke="#cbd5e0" stroke-width="2"/>
          <line x1="90" y1="85" x2="115" y2="85" stroke="#cbd5e0" stroke-width="2" stroke-linecap="round"/>
        </g>
        
        <g class="task-item-2">
          <circle cx="78" cy="105" r="6" fill="none" stroke="#cbd5e0" stroke-width="2"/>
          <line x1="90" y1="105" x2="120" y2="105" stroke="#cbd5e0" stroke-width="2" stroke-linecap="round"/>
        </g>
        
        <g class="task-item-3">
          <circle cx="78" cy="125" r="6" fill="#48bb78" stroke="#48bb78" stroke-width="2"/>
          <path d="M75 125 L77 127 L81 122" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="90" y1="125" x2="110" y2="125" stroke="#48bb78" stroke-width="2" stroke-linecap="round" opacity="0.5" text-decoration="line-through"/>
        </g>
        
        <!-- Plus icon -->
        <g class="plus-icon">
          <circle cx="145" cy="140" r="16" fill="#667eea"/>
          <line x1="145" y1="132" x2="145" y2="148" stroke="white" stroke-width="3" stroke-linecap="round"/>
          <line x1="137" y1="140" x2="153" y2="140" stroke="white" stroke-width="3" stroke-linecap="round"/>
        </g>
        
        <style>
          @keyframes clipboardFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          @keyframes taskAppear {
            0% { opacity: 0; transform: translateX(-10px); }
            100% { opacity: 1; transform: translateX(0); }
          }
          .clipboard-float {
            animation: clipboardFloat 3s ease-in-out infinite;
          }
          .task-item-1 { animation: taskAppear 0.5s ease-out 0.2s both; }
          .task-item-2 { animation: taskAppear 0.5s ease-out 0.4s both; }
          .task-item-3 { animation: taskAppear 0.5s ease-out 0.6s both; }
          .plus-icon {
            animation: scaleIn 2s ease-in-out infinite;
            transform-origin: 145px 140px;
          }
        </style>
      </svg>
    `;
  }

  private getDocumentIllustration(): string {
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="empty-state-svg">
        <defs>
          <linearGradient id="doc-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4facfe;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#00f2fe;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <circle cx="100" cy="100" r="80" fill="#ecfeff" class="pulse-circle"/>
        
        <!-- Document stack -->
        <rect x="75" y="75" width="60" height="75" rx="4" fill="#e5e7eb" opacity="0.5" transform="rotate(-5 105 112)"/>
        <rect x="73" y="72" width="60" height="75" rx="4" fill="#cbd5e0" opacity="0.7" transform="rotate(-2 103 109)"/>
        <rect x="70" y="70" width="60" height="75" rx="4" fill="url(#doc-grad-2)" class="doc-main"/>
        
        <!-- Document fold -->
        <path d="M130 70 L130 85 L115 85 Z" fill="#0891b2" opacity="0.7"/>
        
        <!-- Document lines -->
        <line x1="80" y1="90" x2="110" y2="90" stroke="white" stroke-width="2" opacity="0.9" stroke-linecap="round"/>
        <line x1="80" y1="100" x2="120" y2="100" stroke="white" stroke-width="2" opacity="0.9" stroke-linecap="round"/>
        <line x1="80" y1="110" x2="115" y2="110" stroke="white" stroke-width="2" opacity="0.9" stroke-linecap="round"/>
        <line x1="80" y1="120" x2="105" y2="120" stroke="white" stroke-width="2" opacity="0.9" stroke-linecap="round"/>
        
        <!-- Upload icon -->
        <g class="upload-icon">
          <circle cx="145" cy="60" r="16" fill="#48bb78"/>
          <path d="M145 52 L145 68 M145 52 L140 57 M145 52 L150 57" 
                stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </g>
        
        <style>
          @keyframes docFloat {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(2deg); }
          }
          .doc-main {
            animation: docFloat 3s ease-in-out infinite;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
          }
          .upload-icon {
            animation: scaleIn 2s ease-in-out infinite;
            transform-origin: 145px 60px;
          }
        </style>
      </svg>
    `;
  }

  private getActivityIllustration(): string {
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="empty-state-svg">
        <circle cx="100" cy="100" r="80" fill="#fef3c7" class="pulse-circle"/>
        
        <!-- Activity pulse -->
        <circle cx="100" cy="100" r="25" fill="none" stroke="#f59e0b" stroke-width="3" class="pulse-ring-1"/>
        <circle cx="100" cy="100" r="40" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.6" class="pulse-ring-2"/>
        <circle cx="100" cy="100" r="55" fill="none" stroke="#f59e0b" stroke-width="1" opacity="0.3" class="pulse-ring-3"/>
        
        <!-- Center dot -->
        <circle cx="100" cy="100" r="12" fill="#f59e0b"/>
        
        <style>
          @keyframes pulseRing {
            0% { r: 25; opacity: 1; }
            100% { r: 70; opacity: 0; }
          }
          .pulse-ring-1 { animation: pulseRing 2s ease-out infinite; }
          .pulse-ring-2 { animation: pulseRing 2s ease-out infinite 0.5s; }
          .pulse-ring-3 { animation: pulseRing 2s ease-out infinite 1s; }
        </style>
      </svg>
    `;
  }

  private getNotificationIllustration(): string {
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="empty-state-svg">
        <defs>
          <linearGradient id="bell-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <circle cx="100" cy="100" r="80" fill="#f5f3ff" class="pulse-circle"/>
        
        <!-- Bell -->
        <g class="bell-swing">
          <path d="M100 70 Q85 75 85 95 L85 110 Q85 115 80 120 L120 120 Q115 115 115 110 L115 95 Q115 75 100 70" 
                fill="url(#bell-grad)"/>
          <ellipse cx="100" cy="120" rx="20" ry="4" fill="url(#bell-grad)" opacity="0.6"/>
          <path d="M95 125 Q100 130 105 125" stroke="url(#bell-grad)" stroke-width="2" fill="none" stroke-linecap="round"/>
          <circle cx="100" cy="70" r="4" fill="url(#bell-grad)"/>
        </g>
        
        <!-- Check mark -->
        <circle cx="135" cy="85" r="18" fill="#48bb78"/>
        <path d="M128 85 L133 90 L142 80" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        
        <style>
          @keyframes bellSwing {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg); }
            75% { transform: rotate(10deg); }
          }
          .bell-swing {
            animation: bellSwing 2s ease-in-out infinite;
            transform-origin: 100px 70px;
          }
        </style>
      </svg>
    `;
  }
}
