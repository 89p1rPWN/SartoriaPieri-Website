// Content for the five outfit process pages. The "process" paragraphs are
// the atelier’s own IL PROCESSO CREATIVO texts, transcribed verbatim from the
// published pages (outfits/<slug>/ — the cream text plates). Emotion lines and
// summaries come from the collection copy in Collection1New.jsx.
import { webSrc, fullSrc, videoSrc } from './webgl/story/photoManifest.js';

export { webSrc, fullSrc, videoSrc };

export const OUTFITS = [
  {
    slug: 'vergogna',
    numeral: 'I',
    name: 'Vergogna',
    emotion: 'Il peso di ciò che nascondiamo sotto la superficie.',
    hero: 'vergogna_main.jpg',
    process: [
      'Essa emerge come inevitabile conseguenza del viaggio perverso.',
      'Incarnata in un abito costruito con sottostruttura e crinolina, esalta le curve e amplifica la sensazione di soffocamento e costrizione.',
      'Le cinture, disposte in vita, al ginocchio e lungo il taglio del fondo, accentuano la tensione.',
      "Un drappeggio di organza soffocante avvolge il corpo, cancellando i connotati e trasmettendo l’angoscia del nascondimento.",
      "Il patchwork ritorna come frammentazione dell’essere e testimonianza di vulnerabilità.",
    ],
    processImages: ['2.jpg', '3.jpg', '4.jpg'],
    craftImages: [
      { file: '6.jpg', caption: 'Il ricamo fissato a pinzette, perla per perla' },
      { file: '7.jpg', caption: 'Il patchwork — frammentazione cucita a mano' },
    ],
    gallery: ['vergogna_main.jpg', '1.jpg', '2.jpg', '3.jpg', '4.jpg', '6.jpg', '7.jpg', '8.jpg'],
  },
  {
    slug: 'dolore',
    numeral: 'II',
    name: 'Dolore',
    emotion: 'Il compagno inevitabile. Il dolore indossato apertamente.',
    hero: 'dolore_main.jpg',
    process: [
      'Il dolore è inevitabile, perché accompagna sempre la vergogna: per questo ne condivide il tessuto.',
      "L’abito è costruito con una mantella a collo alto che stringe il corpo e lo soffoca lievemente.",
      'La gonna, sostenuta da una sottostruttura in crinolina, assume una forma trapezoidale, in contrasto con le linee morbide della mantella.',
      'Il ricamo è ispirato alle lacrime e si alterna a mani cucite che stringono il tessuto: il dolore prende forma in molteplici volti.',
      "L’outfit porta con sé un’anima pesante, e pesante appare allo sguardo, come il dolore stesso.",
    ],
    processImages: ['3.jpg', '4.jpg', '6.jpg'],
    craftImages: [
      { file: '2.jpg', caption: 'Lacrime ricamate, cucite una ad una' },
      { file: '5.jpg', caption: "L’organza ricamata — il dolore in trasparenza" },
    ],
    gallery: ['dolore_main.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg'],
  },
  {
    slug: 'depravazione',
    numeral: 'III',
    name: 'Depravazione',
    emotion: "L’esposizione cruda. Il lusso di non avere più nulla da perdere.",
    hero: '1.jpg',
    process: [
      "L’idea nasce dal desiderio di rappresentare l’istinto più immorale, ciò che va oltre il proibito. La perversione prende qui una forma selvaggia, dove ogni regola viene eliminata.",
      'Il pizzo lascia spazio alla sua manifestazione più viscerale e intima: le mutande.',
      "L’outfit è un drappeggio composto da 69 slip.",
      "L’obiettivo era tradurre a livello modellistico ciò che era già stato esplorato nella sirena con collo alto, ma in una visione più cruda e disinibita.",
      'La corona di spine rappresenta la sofferenza legata alla perdita del controllo, con le mutande sbrindellate che si insinuano tra le punte come simbolo di caos e trasgressione.',
    ],
    processImages: ['2.jpg', '5.jpg'],
    craftImages: [
      { file: '4.jpg', caption: 'La corona di spine, modellata a mano' },
      { file: '7.jpg', caption: 'La struttura della corona sul busto' },
    ],
    gallery: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg'],
  },
  {
    slug: 'perversione',
    numeral: 'IV',
    name: 'Perversione',
    emotion: 'La bellezza distorta fino a diventare altro.',
    hero: '2.jpg',
    process: [
      'La perversione non è altro che il nostro stigma preferito. Come rappresentarla? Il pizzo è stato il punto di partenza, simbolo di eccellenza nel campo sensuale.',
      'Il cartamodello è una sirena con collare: i punti erogeni vengono esposti attraverso un taglio sul centro dietro, che lascia intravedere schiena e glutei.',
      'Per il collo, un tessuto luminoso dona movimento; per il seno e la vulva, fiori ricamati con Swarovski si uniscono a strass, paillettes.',
      "Il cappello segna la fine della gabbia e l’inizio della rivelazione, ispirato all’eleganza dei cappelli dei samurai giapponesi: un “vedo/non vedo” elegante e misterioso, che completa l’outfit.",
    ],
    processImages: ['1.jpg', '5.jpg', '9.jpg'],
    craftImages: [
      { file: '6.jpg', caption: 'Il pizzo del cappello, steso e cerchiato' },
      { file: '7.jpg', caption: 'Il cappello prende forma sul busto' },
    ],
    gallery: ['2.jpg', '1.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '9.jpg'],
  },
  {
    slug: 'trauma',
    numeral: 'V',
    name: 'Trauma',
    emotion: 'La frattura. Il prima, il durante, il dopo.',
    hero: '3.jpg',
    process: [
      'Ho immaginato il trauma come una ferita che non si rimargina, ma che, se accettata, risplende grazie al ricamo.',
      "Il corpino è inciso sulla punta sinistra: un’asimmetria che diventa armonia.",
      "La gonna riprende il cartamodello dell’Abisso, ma porta con sé un taglio che si chiude in una mezzaruota di pelliccia.",
      "Il cappello è un’evoluzione: diverso nella forma, più corto nel velo, svela il mistero invece di nasconderlo. L’organza cangiante, bruciata e sbrandellata, segna l’inizio della rivelazione.",
      'Affrontando il primo stigma, la gabbia inizia a cedere.',
    ],
    processImages: ['1.jpg', '2.jpg', '8.jpg'],
    craftImages: [
      { file: '4.jpg', caption: 'La mezzaruota — struttura della gonna' },
      { file: '6.jpg', caption: "L’organza bruciata, fissata a caldo" },
    ],
    gallery: ['3.jpg', '1.jpg', '2.jpg', '4.jpg', '5.jpg', '6.jpg', '8.jpg', '9.jpg', '10.jpg'],
  },
];

export const outfitBySlug = (slug) => OUTFITS.find((o) => o.slug === slug);

export const GARMENT_DATA = [
  { label: 'Patchwork', value: '' },
  { label: 'Fabric', value: '' },
  { label: 'Cut', value: '' },
  { label: 'Atelier', value: 'Sartoria Pieri, 2026' },
];
