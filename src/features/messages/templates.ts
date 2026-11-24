/**
 * Preloaded client messages (gap checklist: follow-ups, visit, orders).
 *
 * One place for every text staff send from the iPad, in EN and FR, keyed by the
 * moment it is for. Until Foundry has a template API (see docs/v2/05-foundry-api-requests.md
 * §Messages), these ship with the app and open in the iPad's own Messages / Mail
 * with the text filled in: staff review and send, nothing goes out on its own.
 *
 * No discounts anywhere: the store no longer discounts (Nov 2026).
 */

export type MessageChannel = 'sms' | 'email';
export type MessageLang = 'en' | 'fr';

export type TemplateKey =
  | 'visit_choices'      // during or after a visit: "here are the frames you liked"
  | 'left_empty_handed'  // outcome: no next step
  | 'shortlist'          // outcome: deciding at home
  | 'booked_visit'       // outcome: booked the next visit
  | 'purchased_thanks'   // outcome: bought
  | 'follow_up_check_in' // Follow-ups: the one follow-up button
  | 'rx_reminder'        // paid, waiting for Rx at ~14 days
  | 'production_update'  // ~1 week after purchase: lenses being cut
  | 'job_redo'           // job failed the store's check, being redone
  | 'ready_for_pickup';

export interface MessageVars {
  firstName?: string | null;
  staffName?: string | null;
  storeName?: string | null;
  /** "Marais in Crimson and June in Blue" */
  frames?: string | null;
  /** "Thursday, Nov 27" */
  date?: string | null;
}

interface Template {
  label: { en: string; fr: string };
  subject: { en: string; fr: string };
  body: { en: string; fr: string };
}

const TEMPLATES: Record<TemplateKey, Template> = {
  visit_choices: {
    label: { en: 'Send their choices', fr: 'Envoyer leur sélection' },
    subject: { en: 'Your frames from {store}', fr: 'Vos montures de chez {store}' },
    body: {
      en: 'Hi {firstName}, it was lovely seeing you today. Here are the frames you liked: {frames}. Take your time, and reply here with any questions. {staff}, {store}',
      fr: 'Bonjour {firstName}, ce fut un plaisir de vous voir aujourd’hui. Voici les montures que vous avez aimées : {frames}. Prenez votre temps, et répondez ici si vous avez des questions. {staff}, {store}',
    },
  },
  left_empty_handed: {
    label: { en: 'Thanks for coming in', fr: 'Merci de votre visite' },
    subject: { en: 'Thanks for visiting {store}', fr: 'Merci de votre visite chez {store}' },
    body: {
      en: 'Hi {firstName}, thanks for coming in today. If a frame stays on your mind, I can set it aside for you or pull a few more in your style for next time. {staff}, {store}',
      fr: 'Bonjour {firstName}, merci d’être passé·e aujourd’hui. Si une monture vous reste en tête, je peux la mettre de côté ou vous en préparer d’autres dans votre style pour la prochaine fois. {staff}, {store}',
    },
  },
  shortlist: {
    label: { en: 'Your shortlist', fr: 'Votre sélection' },
    subject: { en: 'Your shortlist from {store}', fr: 'Votre sélection de chez {store}' },
    body: {
      en: 'Hi {firstName}, here is your shortlist: {frames}. I’ve noted your fit, so we can pick up right where we left off. Reply anytime. {staff}, {store}',
      fr: 'Bonjour {firstName}, voici votre sélection : {frames}. J’ai noté vos mesures, on pourra reprendre exactement où on s’est arrêtés. Répondez quand vous voulez. {staff}, {store}',
    },
  },
  booked_visit: {
    label: { en: 'See you soon', fr: 'À bientôt' },
    subject: { en: 'See you {date}', fr: 'À {date}' },
    body: {
      en: 'Hi {firstName}, you’re booked for {date}. I’ll have your favourites ready: {frames}. {staff}, {store}',
      fr: 'Bonjour {firstName}, votre rendez-vous est le {date}. J’aurai vos favorites prêtes : {frames}. {staff}, {store}',
    },
  },
  purchased_thanks: {
    label: { en: 'Thank you', fr: 'Merci' },
    subject: { en: 'Thank you from {store}', fr: 'Merci de la part de {store}' },
    body: {
      en: 'Hi {firstName}, thank you for choosing {store}. Your glasses are in good hands; I’ll keep you posted as they come together. {staff}',
      fr: 'Bonjour {firstName}, merci d’avoir choisi {store}. Vos lunettes sont entre de bonnes mains; je vous tiens au courant de leur avancement. {staff}',
    },
  },
  follow_up_check_in: {
    label: { en: 'Check in', fr: 'Prendre des nouvelles' },
    subject: { en: 'Still thinking about {frames}?', fr: 'Vous pensez encore à {frames}?' },
    body: {
      en: 'Hi {firstName}, it’s {staff} from {store}. Still thinking about {frames}? Happy to answer questions or set a time to try them again.',
      fr: 'Bonjour {firstName}, c’est {staff} de chez {store}. Vous pensez encore à {frames}? Je peux répondre à vos questions ou vous proposer un moment pour les réessayer.',
    },
  },
  rx_reminder: {
    label: { en: 'Prescription reminder', fr: 'Rappel d’ordonnance' },
    subject: { en: 'We need your prescription to start your glasses', fr: 'Il nous faut votre ordonnance pour commencer vos lunettes' },
    body: {
      en: 'Hi {firstName}, your glasses are paid for and ready to start as soon as we have your prescription. Reply with a photo of it, or ask your optometrist to send it to us. {staff}, {store}',
      fr: 'Bonjour {firstName}, vos lunettes sont payées et prêtes à partir dès que nous aurons votre ordonnance. Répondez avec une photo, ou demandez à votre optométriste de nous l’envoyer. {staff}, {store}',
    },
  },
  production_update: {
    label: { en: 'Production update', fr: 'Suivi de fabrication' },
    subject: { en: 'Your lenses are being made', fr: 'Vos verres sont en fabrication' },
    body: {
      en: 'Hi {firstName}, a quick update: your lenses are being cut and fitted to your frames. We’ll let you know the moment they’re ready. {store}',
      fr: 'Bonjour {firstName}, petite mise à jour : vos verres sont en cours de taillage et de montage. On vous prévient dès qu’ils sont prêts. {store}',
    },
  },
  job_redo: {
    label: { en: 'Delay: being redone', fr: 'Délai : refaites' },
    subject: { en: 'A short delay on your glasses', fr: 'Un court délai pour vos lunettes' },
    body: {
      en: 'Hi {firstName}, your lenses came back from the lab but didn’t meet our standards, so we’re having them redone. New expected date: {date}. Thanks for your patience. {staff}, {store}',
      fr: 'Bonjour {firstName}, vos verres sont revenus du labo mais ne respectaient pas nos standards; nous les faisons refaire. Nouvelle date prévue : {date}. Merci de votre patience. {staff}, {store}',
    },
  },
  ready_for_pickup: {
    label: { en: 'Ready for pickup', fr: 'Prêtes à récupérer' },
    subject: { en: 'Your glasses are ready', fr: 'Vos lunettes sont prêtes' },
    body: {
      en: 'Hi {firstName}, your glasses are ready to pick up at {store}. Come by anytime during opening hours and we’ll adjust them for you.',
      fr: 'Bonjour {firstName}, vos lunettes sont prêtes chez {store}. Passez quand vous voulez pendant nos heures d’ouverture, on les ajustera pour vous.',
    },
  },
};

export const TEMPLATE_KEYS = Object.keys(TEMPLATES) as TemplateKey[];

/** Which template each end-of-visit outcome preloads (EndSessionSheet outcomes). */
export const OUTCOME_TEMPLATE: Record<'purchased' | 'booked_next_visit' | 'shortlist_emailed' | 'left_empty_handed', TemplateKey> = {
  purchased: 'purchased_thanks',
  booked_next_visit: 'booked_visit',
  shortlist_emailed: 'shortlist',
  left_empty_handed: 'left_empty_handed',
};

function fill(text: string, v: MessageVars, lang: MessageLang): string {
  const fallback = {
    firstName: '',
    staff: v.staffName?.trim() || (lang === 'fr' ? 'L’équipe' : 'The team'),
    store: v.storeName?.trim() || 'Lunettiq',
    frames: v.frames?.trim() || (lang === 'fr' ? 'vos montures' : 'your frames'),
    date: v.date?.trim() || (lang === 'fr' ? 'bientôt' : 'soon'),
  };
  const out = text
    .replace(/\{firstName\}/g, v.firstName?.trim() || fallback.firstName)
    .replace(/\{staff\}/g, fallback.staff)
    .replace(/\{store\}/g, fallback.store)
    .replace(/\{frames\}/g, fallback.frames)
    .replace(/\{date\}/g, fallback.date);
  // "Hi , thanks" → "Hi, thanks" when there is no first name.
  return out.replace(/(Hi|Bonjour) ,/g, '$1,').replace(/\s{2,}/g, ' ').trim();
}

export interface RenderedMessage {
  key: TemplateKey;
  label: string;
  subject: string;
  body: string;
}

export function renderTemplate(key: TemplateKey, lang: MessageLang, vars: MessageVars): RenderedMessage {
  const t = TEMPLATES[key];
  return { key, label: t.label[lang], subject: fill(t.subject[lang], vars, lang), body: fill(t.body[lang], vars, lang) };
}

export function templateLabel(key: TemplateKey, lang: MessageLang): string {
  return TEMPLATES[key].label[lang];
}

/** "Marais in Crimson", "Marais and June", "Marais, June and Hatley" */
export function joinFrames(names: string[], lang: MessageLang): string {
  const clean = names.map((n) => n.trim()).filter(Boolean);
  if (clean.length <= 1) return clean[0] ?? '';
  const and = lang === 'fr' ? ' et ' : ' and ';
  return `${clean.slice(0, -1).join(', ')}${and}${clean[clean.length - 1]}`;
}

/** iOS Messages link with the body filled in. Returns null without a usable number. */
export function smsUrl(phone: string | null | undefined, body: string): string | null {
  const digits = (phone ?? '').replace(/[^\d+]/g, '');
  if (digits.replace(/\D/g, '').length < 7) return null;
  return `sms:${digits}&body=${encodeURIComponent(body)}`;
}

/** Mail link with subject and body. Returns null without an address. */
export function mailUrl(email: string | null | undefined, subject: string, body: string): string | null {
  const to = (email ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return null;
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
