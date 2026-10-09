/**
 * Public UI copy in the five event languages. Contestant names are never translated.
 * "CONGRATULATIONS!" on the LED winner reveal intentionally stays English (event brief).
 */
export const LOCALES = ["mk", "en", "sv", "sq", "tr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "mk";

export const LOCALE_NAMES: Record<Locale, string> = {
  mk: "Македонски",
  en: "English",
  sv: "Svenska",
  sq: "Shqip",
  tr: "Türkçe",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

type Messages = {
  // phone
  heading: string;
  hint: string;
  confirmLabel: string;
  confirmQuestion: (name: string) => string;
  confirmFinal: string;
  confirmYes: string;
  confirmBack: string;
  submitting: string;
  successTitle: string;
  successThanks: string;
  yourChoice: string;
  registeredAt: (time: string) => string;
  finalNote: string;
  watchScreen: string;
  waitingTitle: string;
  waitingBody: string;
  closedTitle: string;
  closedYourVote: (name: string) => string;
  closedThanks: string;
  winnerLabel: string;
  winnersTieLabel: string;
  winnersLabel: string;
  noVotes: string;
  loading: string;
  offlineTitle: string;
  offlineBody: string;
  retry: string;
  errNetwork: string;
  errRate: string;
  errServer: string;
  errInvalid: string;
  rehearsal: string;
  language: string;
  statusOpen: string;
  statusSoon: string;
  statusClosed: string;
  // LED screen
  screenTitle: string;
  live: string;
  leading: string;
  tie: string;
  tieWinners: (n: number) => string;
  totalVotes: string;
  scanToVote: string;
  scanPrompt: string;
  finalResults: string;
  liveUpdating: string;
  connecting: string;
  reconnecting: string;
  fullscreen: string;
  qrUnavailable: string;
  votes: (n: number) => string;
};

export const MESSAGES: Record<Locale, Messages> = {
  mk: {
    heading: "Гласај за твојот фаворит",
    hint: "Допри тим за да гласаш. Имаш само еден глас.",
    confirmLabel: "Твој избор",
    confirmQuestion: (name) => `Гласаш за ${name}?`,
    confirmFinal: "Гласот е конечен и не може да се промени.",
    confirmYes: "Да, гласај",
    confirmBack: "Назад",
    submitting: "Се испраќа…",
    successTitle: "Твојот глас е успешно регистриран!",
    successThanks: "Ти благодариме што гласаше.",
    yourChoice: "Твој избор",
    registeredAt: (time) => `Регистрирано во ${time}`,
    finalNote: "Гласот е конечен. Во оваа рунда не може да се гласа повторно.",
    watchScreen: "Следи ги резултатите на големиот екран.",
    waitingTitle: "Гласањето наскоро започнува",
    waitingBody: "Остани на оваа страница — гласањето ќе се отвори автоматски.",
    closedTitle: "Гласањето е завршено",
    closedYourVote: (name) => `Твојот глас беше за ${name}. Ти благодариме!`,
    closedThanks: "Ти благодариме на интересот.",
    winnerLabel: "Победник на гласањето на публиката",
    winnersTieLabel: "Нерешено — победници на гласањето на публиката",
    winnersLabel: "Победници на гласањето на публиката",
    noVotes: "Нема регистрирани гласови",
    loading: "Се вчитува…",
    offlineTitle: "Нема врска",
    offlineBody: "Провери ја интернет врската и обиди се повторно.",
    retry: "Обиди се повторно",
    errNetwork: "Гласот не е потврден поради проблем со врската. Обиди се повторно — нема да се брои двапати.",
    errRate: "Премногу обиди од оваа мрежа. Почекај неколку секунди и обиди се повторно.",
    errServer: "Настана грешка. Обиди се повторно.",
    errInvalid: "Неважечки избор. Освежи ја страницата.",
    rehearsal: "ПРОБА",
    language: "Јазик",
    statusOpen: "Гласањето е отворено",
    statusSoon: "Наскоро",
    statusClosed: "Затворено",
    screenTitle: "Гласање на публиката",
    live: "Во живо",
    leading: "Води",
    tie: "Нерешено",
    tieWinners: (n) => `Нерешено — ${n} победници`,
    totalVotes: "Вкупно гласови",
    scanToVote: "Скенирај и гласај",
    scanPrompt: "Скенирај го QR кодот и гласај",
    finalResults: "Конечни резултати",
    liveUpdating: "Резултатите се ажурираат во живо",
    connecting: "Се поврзува…",
    reconnecting: "Повторно поврзување…",
    fullscreen: "Цел екран",
    qrUnavailable: "QR кодот не е достапен.",
    votes: (n) => (n % 10 === 1 && n % 100 !== 11 ? "глас" : "гласови"),
  },
  en: {
    heading: "Vote for your favourite",
    hint: "Tap a team to vote. You have one vote.",
    confirmLabel: "Your choice",
    confirmQuestion: (name) => `Vote for ${name}?`,
    confirmFinal: "Your vote is final and can't be changed.",
    confirmYes: "Yes, cast my vote",
    confirmBack: "Back",
    submitting: "Sending…",
    successTitle: "Your vote has been registered!",
    successThanks: "Thank you for voting.",
    yourChoice: "Your choice",
    registeredAt: (time) => `Registered at ${time}`,
    finalNote: "Your vote is final. You can't vote again in this round.",
    watchScreen: "Follow the results on the big screen.",
    waitingTitle: "Voting starts soon",
    waitingBody: "Stay on this page — voting opens automatically.",
    closedTitle: "Voting has closed",
    closedYourVote: (name) => `You voted for ${name}. Thank you!`,
    closedThanks: "Thanks for joining in.",
    winnerLabel: "Audience vote winner",
    winnersTieLabel: "Tie — audience vote winners",
    winnersLabel: "Audience vote winners",
    noVotes: "No votes were registered",
    loading: "Loading…",
    offlineTitle: "No connection",
    offlineBody: "Check your internet connection and try again.",
    retry: "Try again",
    errNetwork: "Your vote wasn't confirmed because of a connection problem. Try again — it will never count twice.",
    errRate: "Too many attempts from this network. Wait a few seconds and try again.",
    errServer: "Something went wrong. Please try again.",
    errInvalid: "Invalid choice. Please refresh the page.",
    rehearsal: "REHEARSAL",
    language: "Language",
    statusOpen: "Voting is open",
    statusSoon: "Soon",
    statusClosed: "Closed",
    screenTitle: "Audience vote",
    live: "Live",
    leading: "Leading",
    tie: "Tie",
    tieWinners: (n) => `Tie — ${n} winners`,
    totalVotes: "Total votes",
    scanToVote: "Scan to vote",
    scanPrompt: "Scan the QR code to vote",
    finalResults: "Final results",
    liveUpdating: "Results update live",
    connecting: "Connecting…",
    reconnecting: "Reconnecting…",
    fullscreen: "Fullscreen",
    qrUnavailable: "QR code unavailable.",
    votes: (n) => (n === 1 ? "vote" : "votes"),
  },
  sv: {
    heading: "Rösta på din favorit",
    hint: "Tryck på ett lag för att rösta. Du har en röst.",
    confirmLabel: "Ditt val",
    confirmQuestion: (name) => `Rösta på ${name}?`,
    confirmFinal: "Din röst är slutgiltig och kan inte ändras.",
    confirmYes: "Ja, lägg min röst",
    confirmBack: "Tillbaka",
    submitting: "Skickar…",
    successTitle: "Din röst är registrerad!",
    successThanks: "Tack för att du röstade.",
    yourChoice: "Ditt val",
    registeredAt: (time) => `Registrerad ${time}`,
    finalNote: "Din röst är slutgiltig. Du kan inte rösta igen i den här omgången.",
    watchScreen: "Följ resultatet på storskärmen.",
    waitingTitle: "Röstningen börjar snart",
    waitingBody: "Stanna kvar på sidan — röstningen öppnar automatiskt.",
    closedTitle: "Röstningen är stängd",
    closedYourVote: (name) => `Du röstade på ${name}. Tack!`,
    closedThanks: "Tack för att du var med.",
    winnerLabel: "Vinnare av publikomröstningen",
    winnersTieLabel: "Delad seger — vinnare av publikomröstningen",
    winnersLabel: "Vinnare av publikomröstningen",
    noVotes: "Inga röster registrerades",
    loading: "Laddar…",
    offlineTitle: "Ingen anslutning",
    offlineBody: "Kontrollera internetanslutningen och försök igen.",
    retry: "Försök igen",
    errNetwork: "Rösten bekräftades inte på grund av ett anslutningsproblem. Försök igen — den räknas aldrig två gånger.",
    errRate: "För många försök från det här nätverket. Vänta några sekunder och försök igen.",
    errServer: "Något gick fel. Försök igen.",
    errInvalid: "Ogiltigt val. Ladda om sidan.",
    rehearsal: "REPETITION",
    language: "Språk",
    statusOpen: "Röstningen är öppen",
    statusSoon: "Snart",
    statusClosed: "Stängd",
    screenTitle: "Publikomröstning",
    live: "Live",
    leading: "Leder",
    tie: "Oavgjort",
    tieWinners: (n) => `Oavgjort — ${n} vinnare`,
    totalVotes: "Totalt antal röster",
    scanToVote: "Skanna och rösta",
    scanPrompt: "Skanna QR-koden för att rösta",
    finalResults: "Slutresultat",
    liveUpdating: "Resultaten uppdateras live",
    connecting: "Ansluter…",
    reconnecting: "Återansluter…",
    fullscreen: "Helskärm",
    qrUnavailable: "QR-koden är inte tillgänglig.",
    votes: (n) => (n === 1 ? "röst" : "röster"),
  },
  sq: {
    heading: "Voto për të preferuarin tënd",
    hint: "Prek një ekip për të votuar. Ke vetëm një votë.",
    confirmLabel: "Zgjedhja jote",
    confirmQuestion: (name) => `Voton për ${name}?`,
    confirmFinal: "Vota jote është përfundimtare dhe nuk mund të ndryshohet.",
    confirmYes: "Po, voto",
    confirmBack: "Kthehu",
    submitting: "Duke dërguar…",
    successTitle: "Vota jote u regjistrua me sukses!",
    successThanks: "Faleminderit që votove.",
    yourChoice: "Zgjedhja jote",
    registeredAt: (time) => `Regjistruar në ${time}`,
    finalNote: "Vota jote është përfundimtare. Nuk mund të votosh përsëri në këtë raund.",
    watchScreen: "Ndiq rezultatet në ekranin e madh.",
    waitingTitle: "Votimi fillon së shpejti",
    waitingBody: "Qëndro në këtë faqe — votimi hapet automatikisht.",
    closedTitle: "Votimi ka përfunduar",
    closedYourVote: (name) => `Votove për ${name}. Faleminderit!`,
    closedThanks: "Faleminderit për pjesëmarrjen.",
    winnerLabel: "Fituesi i votimit të publikut",
    winnersTieLabel: "Barazim — fituesit e votimit të publikut",
    winnersLabel: "Fituesit e votimit të publikut",
    noVotes: "Nuk u regjistrua asnjë votë",
    loading: "Duke u ngarkuar…",
    offlineTitle: "Nuk ka lidhje",
    offlineBody: "Kontrollo lidhjen me internetin dhe provo përsëri.",
    retry: "Provo përsëri",
    errNetwork: "Vota nuk u konfirmua për shkak të një problemi me lidhjen. Provo përsëri — nuk do të numërohet dy herë.",
    errRate: "Shumë përpjekje nga ky rrjet. Prit disa sekonda dhe provo përsëri.",
    errServer: "Diçka shkoi keq. Provo përsëri.",
    errInvalid: "Zgjedhje e pavlefshme. Rifresko faqen.",
    rehearsal: "PROVË",
    language: "Gjuha",
    statusOpen: "Votimi është i hapur",
    statusSoon: "Së shpejti",
    statusClosed: "Mbyllur",
    screenTitle: "Votimi i publikut",
    live: "Drejtpërdrejt",
    leading: "Prin",
    tie: "Barazim",
    tieWinners: (n) => `Barazim — ${n} fitues`,
    totalVotes: "Vota gjithsej",
    scanToVote: "Skano dhe voto",
    scanPrompt: "Skano kodin QR për të votuar",
    finalResults: "Rezultatet përfundimtare",
    liveUpdating: "Rezultatet përditësohen drejtpërdrejt",
    connecting: "Duke u lidhur…",
    reconnecting: "Duke u rilidhur…",
    fullscreen: "Ekran i plotë",
    qrUnavailable: "Kodi QR nuk është i disponueshëm.",
    votes: (n) => (n === 1 ? "votë" : "vota"),
  },
  tr: {
    heading: "Favorini oyla",
    hint: "Oy vermek için bir takıma dokun. Tek oy hakkın var.",
    confirmLabel: "Seçimin",
    confirmQuestion: (name) => `${name} için oy veriyorsun, emin misin?`,
    confirmFinal: "Oyun kesindir ve değiştirilemez.",
    confirmYes: "Evet, oyumu ver",
    confirmBack: "Geri",
    submitting: "Gönderiliyor…",
    successTitle: "Oyun başarıyla kaydedildi!",
    successThanks: "Oy verdiğin için teşekkürler.",
    yourChoice: "Seçimin",
    registeredAt: (time) => `Kayıt saati ${time}`,
    finalNote: "Oyun kesindir. Bu turda tekrar oy veremezsin.",
    watchScreen: "Sonuçları büyük ekrandan takip et.",
    waitingTitle: "Oylama birazdan başlıyor",
    waitingBody: "Bu sayfada kal — oylama otomatik olarak açılacak.",
    closedTitle: "Oylama sona erdi",
    closedYourVote: (name) => `${name} için oy verdin. Teşekkürler!`,
    closedThanks: "Katıldığın için teşekkürler.",
    winnerLabel: "Seyirci oylamasının kazananı",
    winnersTieLabel: "Beraberlik — seyirci oylamasının kazananları",
    winnersLabel: "Seyirci oylamasının kazananları",
    noVotes: "Hiç oy kaydedilmedi",
    loading: "Yükleniyor…",
    offlineTitle: "Bağlantı yok",
    offlineBody: "İnternet bağlantını kontrol edip tekrar dene.",
    retry: "Tekrar dene",
    errNetwork: "Bağlantı sorunu nedeniyle oyun onaylanamadı. Tekrar dene — oyun asla iki kez sayılmaz.",
    errRate: "Bu ağdan çok fazla deneme yapıldı. Birkaç saniye bekleyip tekrar dene.",
    errServer: "Bir hata oluştu. Lütfen tekrar dene.",
    errInvalid: "Geçersiz seçim. Lütfen sayfayı yenile.",
    rehearsal: "PROVA",
    language: "Dil",
    statusOpen: "Oylama açık",
    statusSoon: "Yakında",
    statusClosed: "Kapandı",
    screenTitle: "Seyirci oylaması",
    live: "Canlı",
    leading: "Önde",
    tie: "Berabere",
    tieWinners: (n) => `Berabere — ${n} kazanan`,
    totalVotes: "Toplam oy",
    scanToVote: "Tara ve oy ver",
    scanPrompt: "Oy vermek için QR kodu tara",
    finalResults: "Kesin sonuçlar",
    liveUpdating: "Sonuçlar canlı güncelleniyor",
    connecting: "Bağlanıyor…",
    reconnecting: "Yeniden bağlanıyor…",
    fullscreen: "Tam ekran",
    qrUnavailable: "QR kod kullanılamıyor.",
    votes: () => "oy",
  },
};

/** Detects the best supported language from the browser's preference list. */
export function detectLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
    if (base === "sr" || base === "bg") return "mk"; // closest Cyrillic neighbours
    if (base === "nb" || base === "no" || base === "da") return "sv";
  }
  return DEFAULT_LOCALE;
}

/** Number formatting per locale, done by hand so server and browser output match. */
export function formatNumber(value: number, locale: Locale): string {
  const sep = locale === "en" ? "," : locale === "sv" ? " " : ".";
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

export function formatPercentFor(value: number, locale: Locale): string {
  const tenths = Math.round(value * 10);
  const decimal = locale === "en" ? "." : ",";
  const body = `${formatNumber(Math.floor(tenths / 10), locale)}${decimal}${tenths % 10}`;
  if (locale === "tr") return `%${body}`;
  if (locale === "sv") return `${body} %`;
  return `${body}%`;
}
