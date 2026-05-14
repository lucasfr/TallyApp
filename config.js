// ============================================================
//  TALLY APP — CONFIGURATION
//  Edit COUNTRIES to match the actual Grand Final running order.
//  TEST_JURY_SCORES are fake scores for testing — remove or
//  leave them in; they're only used by the "Fill test data" button.
// ============================================================

const TALLY_CONFIG = {

  EVENT_NAME: 'Eurovision 2026 · Basel',

  COUNTRIES: [
    { flag: '🇦🇹', country: 'Austria',        artist: 'Cosmó',                             song: 'Tanzschein',          image: 'images/Austria.webp'        },
    { flag: '🇦🇿', country: 'Azerbaijan',      artist: 'Jiva',                              song: 'Just Go',             image: 'images/Azerbaijan.webp'     },
    { flag: '🇦🇺', country: 'Australia',       artist: 'Delta Goodrem',                     song: 'Eclipse',             image: 'images/Australia.webp'      },
    { flag: '🇧🇬', country: 'Bulgaria',        artist: 'Dara',                              song: 'Bangaranga',          image: 'images/Bulgaria.webp'       },
    { flag: '🇭🇷', country: 'Croatia',         artist: 'Lelek',                             song: 'Andromeda',           image: 'images/Croatia.webp'        },
    { flag: '🇨🇿', country: 'Czechia',         artist: 'Daniel Žižka',                      song: 'Crossroads',          image: 'images/Czechia.webp'        },
    { flag: '🇩🇰', country: 'Denmark',         artist: 'Søren Torpegaard Lund',             song: 'Før vi går hjem',     image: 'images/Denmark.webp'        },
    { flag: '🇪🇪', country: 'Estonia',         artist: 'Vanilla Ninja',                     song: 'Too Epic to Be True', image: 'images/Estonia.webp'        },
    { flag: '🇫🇮', country: 'Finland',         artist: 'Linda Lampenius x Pete Parkkonen',  song: 'Liekinheitin',        image: 'images/Finland.webp'        },
    { flag: '🇫🇷', country: 'France',          artist: 'Monroe',                            song: 'Regarde!',            image: 'images/France.webp'         },
    { flag: '🇩🇪', country: 'Germany',         artist: 'Sarah Engels',                      song: 'Fire',                image: 'images/Germany.webp'        },
    { flag: '🇬🇷', country: 'Greece',          artist: 'Akylas',                            song: 'Ferto',               image: 'images/Greece.webp'         },
    { flag: '🇮🇱', country: 'Israel',          artist: 'Noam Bettan',                       song: 'Michelle',            image: 'images/Israel.webp'         },
    { flag: '🇮🇹', country: 'Italy',           artist: 'Sal Da Vinci',                      song: 'Per sempre sì',       image: 'images/Italy.webp'          },
    { flag: '🇱🇻', country: 'Latvia',          artist: 'Atvara',                            song: 'Ēnā',                 image: 'images/Latvia.webp'         },
    { flag: '🇱🇹', country: 'Lithuania',       artist: 'Lion Ceccah',                       song: 'Sólo quiero más',     image: 'images/Lithuania.webp'      },
    { flag: '🇱🇺', country: 'Luxembourg',      artist: 'Eva Marija',                        song: 'Mother Nature',       image: 'images/Luxembourg.webp'     },
    { flag: '🇲🇹', country: 'Malta',           artist: 'Aidan',                             song: 'Bella',               image: 'images/Malta.webp'          },
    { flag: '🇲🇩', country: 'Moldova',         artist: 'Satoshi',                           song: 'Viva, Moldova!',      image: 'images/Moldova.webp'        },
    { flag: '🇳🇴', country: 'Norway',          artist: 'Jonas Lovv',                        song: 'Ya Ya Ya',            image: 'images/Norway.webp'         },
    { flag: '🇵🇹', country: 'Portugal',        artist: 'Bandidos do Cante',                 song: 'Rosa',                image: 'images/Portugal.webp'       },
    { flag: '🇷🇴', country: 'Romania',         artist: 'Alexandra Căpitănescu',             song: 'Choke Me',            image: 'images/Romania.webp'        },
    { flag: '🇷🇸', country: 'Serbia',          artist: 'Lavina',                            song: 'Kraj mene',           image: 'images/Serbia.webp'         },
    { flag: '🇸🇪', country: 'Sweden',          artist: 'FELICIA',                           song: 'My System',           image: 'images/Sweden.webp'         },
    { flag: '🇨🇭', country: 'Switzerland',     artist: 'Veronica Fusaro',                   song: 'Alice',               image: 'images/Switzerland.webp'    },
    { flag: '🇬🇧', country: 'United Kingdom',  artist: 'Look Mum No Computer',              song: 'Eins, Zwei, Drei',    image: 'images/United Kingdom.webp' },
  ],

  // Fake jury scores for testing — keyed by country name.
  // Delete this block (or set to {}) before the real show.
  TEST_JURY_SCORES: {
    'Austria':        176,
    'Azerbaijan':       4,
    'Australia':       45,
    'Bulgaria':        27,
    'Croatia':         65,
    'Czechia':         10,
    'Denmark':         52,
    'Estonia':         87,
    'Finland':         98,
    'France':          22,
    'Germany':          0,
    'Greece':         112,
    'Israel':          14,
    'Italy':           32,
    'Latvia':          58,
    'Lithuania':       38,
    'Luxembourg':     128,
    'Malta':           18,
    'Moldova':        143,
    'Norway':          76,
    'Portugal':         7,
    'Romania':        155,
    'Serbia':           2,
    'Sweden':         238,
    'Switzerland':    252,
    'United Kingdom': 198,
  },
};
