/**
 * English strings. Keys are grouped by surface. Client-facing groups
 * (`handed`, `consent`) are what clients read; keep them warm and plain.
 * `fr.ts` must define every key (enforced by the type and a test).
 */
export const en = {
  common: {
    loading: 'Loading…',
    cancel: 'Cancel',
    done: 'Done',
    tryAgain: 'Try again',
  },
  language: {
    en: 'English',
    fr: 'Français',
  },
  tabs: {
    home: 'Floor',
    clients: 'Clients',
    products: 'Frames',
    orders: 'Orders',
    'follow-ups': 'Follow-ups',
    review: 'Review',
    profile: 'Profile',
  },
  handed: {
    staffBar: 'Staff: double-tap here to take back',
    staffBarA11y: 'Staff: double-tap to take the iPad back',
    titleNamed: '{name}, which ones do you love?',
    title: 'Which ones do you love?',
    lovedSoFar: '{count} loved so far.',
    reassure: 'Take your time. We’ll keep your favourites for you.',
    nothing: 'Nothing to show yet. Hand the iPad back to your advisor.',
    yourPhoto: 'Your photo',
    love: 'Love',
    maybe: 'Maybe',
    no: 'No',
    closePhoto: 'Close photo',
  },
  timeout: {
    thanks: 'Thank you!',
    handBack: 'Please hand the iPad back to your advisor.',
    staffTakeBack: 'Staff: take back',
  },
  consent: {
    title: 'Photos today?',
    ask: 'Ask {name} before taking any.',
    script: '“Can we take a few photos of you in the frames? They help you compare, and we can email you your favourites.”',
    small: 'Photos are saved to their profile and can be deleted any time. Without consent, keep logging frames and reactions in the visit tray.',
    no: 'No photos today',
    yes: '{name} agrees',
    scriptLanguage: 'Script language',
  },
  profile: {
    language: 'App language',
    languageHint: 'Staff screens. Client screens follow the client’s choice.',
  },
};

export type Dictionary = typeof en;
