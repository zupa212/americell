// Site-wide content constants for the Americell marketing site.

export const SITE = {
  name: "Americell",
  domain: "americell.example",
  tagline: "Μετατρέπουμε αληθινά τηλέφωνα ΗΠΑ σε μηχανισμό τηλεχειρισμού.",
  subtagline:
    "Με το Americell μπορείς να διαχειρίζεσαι, να αυτοματοποιείς και να ελέγχεις ένα αληθινό smartphone ΗΠΑ από οπουδήποτε, ανά πάσα στιγμή.",
};

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Αρχική", href: "/" },
  { label: "Πώς λειτουργεί", href: "/#how" },
  { label: "Τιμές", href: "/#pricing" },
  { label: "Πελάτες", href: "/#clients" },
];

// Stylized social-app tiles for the hero's floating-icon cluster.
// (Provisional, brand-neutral approximations — no third-party logo assets shipped.)
export type AppTile = { name: string; glyph: string; from: string; to: string };

export const APP_TILES: AppTile[] = [
  { name: "Instagram", glyph: "◎", from: "#f9ce34", to: "#ee2a7b" },
  { name: "TikTok", glyph: "♪", from: "#25f4ee", to: "#000000" },
  { name: "X", glyph: "𝕏", from: "#1d1d1f", to: "#000000" },
  { name: "Snapchat", glyph: "👻", from: "#fffc00", to: "#f7d000" },
  { name: "Telegram", glyph: "✈", from: "#2aabee", to: "#229ed9" },
  { name: "Reddit", glyph: "▣", from: "#ff5700", to: "#ff4500" },
  { name: "Tinder", glyph: "🔥", from: "#ff7854", to: "#fd267d" },
  { name: "Settings", glyph: "⚙", from: "#d1d5db", to: "#9ca3af" },
];

export type Feature = { title: string; body: string; icon: string };

export const FEATURES: Feature[] = [
  {
    title: "Αληθινό hardware, όχι emulators",
    body: "Γνήσια iPhone και συσκευές Android σε καθαρή οικιακή συνδεσιμότητα ΗΠΑ — ακριβώς αυτό που βλέπουν οι χρήστες σου και τα app stores.",
    icon: "device",
  },
  {
    title: "Έλεγχος από οπουδήποτε",
    body: "Μια πλήρης ζωντανή οθόνη στον browser σου. Πάτα, πληκτρολόγησε, κάνε swipe και εγκατέστησε — από οποιοδήποτε laptop, οποιαδήποτε ζώνη ώρας, οποιοδήποτε μέλος της ομάδας.",
    icon: "globe",
  },
  {
    title: "Αυτοματοποίησε τη ρουτίνα",
    body: "Δημιούργησε σενάρια για επαναλαμβανόμενες ροές και προγραμμάτισέ τα. Τρέξε ροές εργασίας σε αληθινές συσκευές για testing, QA και ανάπτυξη σε μεγάλη κλίμακα.",
    icon: "bolt",
  },
  {
    title: "Φτιαγμένο για ομάδες",
    body: "Κοινόχρηστες δεξαμενές συσκευών, πρόσβαση ανά θέση και ιστορικό ελέγχου. Διαχειρίσου πολλές συσκευές από ένα καθαρό dashboard.",
    icon: "users",
  },
];

export type Step = { n: number; title: string; body: string };

export const STEPS: Step[] = [
  { n: 1, title: "Διάλεξε συσκευή", body: "Επίλεξε ένα αληθινό τηλέφωνο ΗΠΑ και τοποθεσία από τον στόλο μας — Pixel, Galaxy ή iPhone." },
  { n: 2, title: "Συνδέσου άμεσα", body: "Η συσκευή σου εκκινεί σε ένα datacenter των ΗΠΑ και μεταδίδεται στον browser σου μέσα σε δευτερόλεπτα." },
  { n: 3, title: "Έλεγξε & αυτοματοποίησε", body: "Χειρίσου την ζωντανά ή γράψε ροές που τρέχουν προγραμματισμένα — χωρίς καλώδια, χωρίς τοπικό hardware." },
];

export type Faq = { q: string; a: string };

export const FAQS: Faq[] = [
  {
    q: "Είναι αληθινά τηλέφωνα ή emulators;",
    a: "Αληθινά, φυσικά smartphones που φιλοξενούνται σε datacenters των ΗΠΑ με καθαρή οικιακή συνδεσιμότητα. Χωρίς emulators ή εικονικά images λειτουργικού.",
  },
  {
    q: "Για τι μπορώ να χρησιμοποιήσω το Americell;",
    a: "Νόμιμη εργασία σε αληθινές συσκευές: testing και QA εφαρμογών για κινητά, τοπικό testing στις ΗΠΑ, έλεγχο στο store και διαχείριση των δικών σου λογαριασμών και ροών εργασίας για πρακτορεία και ομάδες ανάπτυξης.",
  },
  {
    q: "Πού βρίσκονται οι συσκευές;",
    a: "Σε διάφορες περιοχές των ΗΠΑ — αυτή τη στιγμή Ashburn (VA), Dallas (TX) και San Jose (CA), με περισσότερες να έρχονται.",
  },
  {
    q: "Μπορώ να αυτοματοποιήσω ενέργειες;",
    a: "Ναι. Μπορείς να χειριστείς μια συσκευή ζωντανά στον browser ή να γράψεις επαναλαμβανόμενες ροές και να τις προγραμματίσεις να τρέχουν στην αληθινή συσκευή.",
  },
  {
    q: "Πώς λειτουργεί η χρέωση;",
    a: "Απλές συνδρομές ανά συσκευή, μηνιαία ή ετήσια (η ετήσια εξοικονομεί ~20%). Ακύρωσε ανά πάσα στιγμή από το dashboard σου.",
  },
  {
    q: "Επιτρέπεται αυτό βάσει των κανόνων των εφαρμογών και των πλατφορμών;",
    a: "Το Americell προορίζεται για νόμιμη χρήση. Είσαι υπεύθυνος να τηρείς τους όρους οποιασδήποτε εφαρμογής ή πλατφόρμας χρησιμοποιείς σε μια συσκευή — δες την πολιτική Αποδεκτής χρήσης μας.",
  },
];

export type Testimonial = { quote: string; name: string; role: string };

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Αντικαταστήσαμε μια ντουλάπα με τηλέφωνα δοκιμών με το Americell. Αληθινές συσκευές ΗΠΑ, αληθινές εκδόσεις λειτουργικού, μηδέν καλώδια.",
    name: "Maya R.",
    role: "Επικεφαλής QA, fintech για κινητά",
  },
  {
    quote: "Το πρακτορείο μας διαχειρίζεται πλέον δεκάδες αληθινές συσκευές από ένα dashboard. Ο ζωντανός έλεγχος είναι πραγματικά άμεσος.",
    name: "Devin K.",
    role: "Ιδρυτής, πρακτορείο ανάπτυξης",
  },
  {
    quote: "Ο έλεγχος στο store και το testing τοπικοποίησης σε πραγματικό hardware ΗΠΑ σταμάτησε επιτέλους να είναι εφιάλτης logistics.",
    name: "Priya S.",
    role: "Υπεύθυνη κυκλοφορίας",
  },
];

export const CLIENT_LOGOS: string[] = [
  "Northbeam",
  "Lattice Labs",
  "Verde QA",
  "Hammerhead",
  "Studio Nine",
  "Pacific Apps",
];
