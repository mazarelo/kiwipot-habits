// The tracker's words, by the app's language (kiwipot.ui.current.locale); English where there are none

export interface Strings {
  title: string;
  add: string;
  newHabit: string;
  placeholder: string;
  empty: string;
  options: string;
  rename: string;
  delete: string;
  deleteQuestion: string;
  deleteText: string;
  cancel: string;
  save: string;
  // {day}: the day's name; {habit}: the habit's
  toggle: string;
  // {n}
  streak: string;
  best: string;
  thisMonth: string;
  open: string;
}

const en: Strings = {
  title: 'Habits',
  add: 'Add a habit',
  newHabit: 'New habit',
  placeholder: 'Read 20 minutes, walk, water the plants…',
  empty: 'What do you want to do every day?',
  options: 'Options for {habit}',
  rename: 'Rename',
  delete: 'Delete',
  deleteQuestion: 'Delete “{habit}”?',
  deleteText: 'Its days go with it.',
  cancel: 'Cancel',
  save: 'Save',
  toggle: '{habit} on {day}',
  streak: '{n} in a row',
  best: 'Best: {n} in a row',
  thisMonth: '{n} days in the last 30',
  open: 'See the month',
};

const TRANSLATIONS: Record<string, Partial<Strings>> = {
  de: {
    title: 'Gewohnheiten',
    add: 'Gewohnheit hinzufügen',
    newHabit: 'Neue Gewohnheit',
    placeholder: '20 Minuten lesen, spazieren gehen, Pflanzen gießen…',
    empty: 'Was willst du jeden Tag tun?',
    options: 'Optionen für {habit}',
    rename: 'Umbenennen',
    delete: 'Löschen',
    deleteQuestion: '„{habit}“ löschen?',
    deleteText: 'Ihre Tage werden mitgelöscht.',
    cancel: 'Abbrechen',
    save: 'Speichern',
    toggle: '{habit} am {day}',
    streak: '{n} in Folge',
    best: 'Bestwert: {n} in Folge',
    thisMonth: '{n} Tage in den letzten 30',
    open: 'Monat ansehen',
  },
  es: {
    title: 'Hábitos',
    add: 'Añadir un hábito',
    newHabit: 'Nuevo hábito',
    placeholder: 'Leer 20 minutos, caminar, regar las plantas…',
    empty: '¿Qué quieres hacer cada día?',
    options: 'Opciones de {habit}',
    rename: 'Cambiar nombre',
    delete: 'Eliminar',
    deleteQuestion: '¿Eliminar «{habit}»?',
    deleteText: 'Sus días se eliminan con él.',
    cancel: 'Cancelar',
    save: 'Guardar',
    toggle: '{habit} el {day}',
    streak: '{n} seguidos',
    best: 'Mejor racha: {n} seguidos',
    thisMonth: '{n} días de los últimos 30',
    open: 'Ver el mes',
  },
  fr: {
    title: 'Habitudes',
    add: 'Ajouter une habitude',
    newHabit: 'Nouvelle habitude',
    placeholder: 'Lire 20 minutes, marcher, arroser les plantes…',
    empty: 'Que voulez-vous faire chaque jour ?',
    options: 'Options de {habit}',
    rename: 'Renommer',
    delete: 'Supprimer',
    deleteQuestion: 'Supprimer « {habit} » ?',
    deleteText: 'Ses jours sont supprimés avec elle.',
    cancel: 'Annuler',
    save: 'Enregistrer',
    toggle: '{habit} le {day}',
    streak: '{n} d’affilée',
    best: 'Record : {n} d’affilée',
    thisMonth: '{n} jours sur les 30 derniers',
    open: 'Voir le mois',
  },
  it: {
    title: 'Abitudini',
    add: 'Aggiungi un’abitudine',
    newHabit: 'Nuova abitudine',
    placeholder: 'Leggere 20 minuti, camminare, annaffiare le piante…',
    empty: 'Cosa vuoi fare ogni giorno?',
    options: 'Opzioni per {habit}',
    rename: 'Rinomina',
    delete: 'Elimina',
    deleteQuestion: 'Eliminare «{habit}»?',
    deleteText: 'I suoi giorni vengono eliminati con lei.',
    cancel: 'Annulla',
    save: 'Salva',
    toggle: '{habit} il {day}',
    streak: '{n} di fila',
    best: 'Record: {n} di fila',
    thisMonth: '{n} giorni negli ultimi 30',
    open: 'Vedi il mese',
  },
  pt: {
    title: 'Hábitos',
    add: 'Adicionar um hábito',
    newHabit: 'Novo hábito',
    placeholder: 'Ler 20 minutos, caminhar, regar as plantas…',
    empty: 'O que quer fazer todos os dias?',
    options: 'Opções de {habit}',
    rename: 'Mudar o nome',
    delete: 'Eliminar',
    deleteQuestion: 'Eliminar «{habit}»?',
    deleteText: 'Os seus dias são eliminados com ele.',
    cancel: 'Cancelar',
    save: 'Guardar',
    toggle: '{habit} em {day}',
    streak: '{n} seguidos',
    best: 'Melhor sequência: {n} seguidos',
    thisMonth: '{n} dias nos últimos 30',
    open: 'Ver o mês',
  },
};

/** The strings in a language ("pt-BR" uses "pt"), English where it has none */
export const stringsFor = (locale: string): Strings => ({ ...en, ...TRANSLATIONS[locale.split('-')[0]] });

/** A string with its {placeholders} filled in */
export const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
