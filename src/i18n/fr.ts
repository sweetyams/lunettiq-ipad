import type { Dictionary } from './en';

/** Français (Québec). Vouvoiement for clients; « » not used in UI copy to keep it short. */
export const fr: Dictionary = {
  common: {
    loading: 'Chargement…',
    cancel: 'Annuler',
    done: 'Terminé',
    tryAgain: 'Réessayer',
  },
  language: {
    en: 'English',
    fr: 'Français',
  },
  tabs: {
    home: 'Plancher',
    clients: 'Clients',
    products: 'Montures',
    orders: 'Commandes',
    'follow-ups': 'Suivis',
    review: 'Révision',
    profile: 'Profil',
  },
  handed: {
    staffBar: 'Personnel : touchez deux fois ici pour reprendre',
    staffBarA11y: 'Personnel : touchez deux fois pour reprendre l’iPad',
    titleNamed: '{name}, lesquelles aimez-vous?',
    title: 'Lesquelles aimez-vous?',
    lovedSoFar: '{count} coup(s) de cœur jusqu’ici.',
    reassure: 'Prenez votre temps. Nous gardons vos favorites pour vous.',
    nothing: 'Rien à afficher pour l’instant. Remettez l’iPad à votre conseiller.',
    yourPhoto: 'Votre photo',
    love: 'J’adore',
    maybe: 'Peut-être',
    no: 'Non',
    closePhoto: 'Fermer la photo',
  },
  timeout: {
    thanks: 'Merci!',
    handBack: 'Veuillez remettre l’iPad à votre conseiller.',
    staffTakeBack: 'Personnel : reprendre',
  },
  consent: {
    title: 'Des photos aujourd’hui?',
    ask: 'Demandez à {name} avant d’en prendre.',
    script: '« Pouvons-nous prendre quelques photos de vous avec les montures? Elles vous aident à comparer, et nous pouvons vous envoyer vos favorites par courriel. »',
    small: 'Les photos sont enregistrées au dossier et peuvent être supprimées en tout temps. Sans consentement, continuez de noter les montures et les réactions dans le plateau.',
    no: 'Pas de photos aujourd’hui',
    yes: '{name} accepte',
    scriptLanguage: 'Langue du texte',
  },
  profile: {
    language: 'Langue de l’app',
    languageHint: 'Écrans du personnel. Les écrans client suivent le choix du client.',
  },
};
