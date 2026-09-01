/* =========================================================
   Curi🧭s — Données de jeu
   Découvertes du parcours, guide, balises, énigmes et quiz.
   NOTE : la variable interne BIRDS désigne les « découvertes »
   (un biais cognitif par balise) — nom conservé pour rester
   compatible avec l'éditeur et le serveur.
   Pour ajouter une photo : remplir `img` (chemin relatif).
   Pour ajouter un vrai son : remplir `audioFile` (chemin relatif)
   sinon une signature sonore synthétique (Web Audio) est jouée.
   ========================================================= */

/* ==== DÉBUT CONTENU GÉNÉRÉ — NE PAS ÉDITER ====
   Source de vérité : content/ (config + packs JSON modulaires).
   Packs actifs : packdemo
   Régénérer : node tools/build-data.mjs
   Vérifier la synchro : node tools/build-data.mjs --check ==== */

const SITE = {
  "name": "Jeu de piste",
  "short": "JDP",
  "region": "Parcours découverte",
  "mapTitle": "Le sentier des découvertes",
  "center": {
    "lat": 50.6314885,
    "lng": 3.0558956
  },
  "proximityRadius": 12,
  "hintRadius": 250,
  "photos": []
};

const TRAIL = {
  "path": [
    [
      36,
      552
    ],
    [
      48,
      500
    ],
    [
      74,
      452
    ],
    [
      110,
      428
    ],
    [
      148,
      400
    ],
    [
      176,
      356
    ],
    [
      200,
      308
    ],
    [
      238,
      292
    ],
    [
      282,
      296
    ],
    [
      320,
      320
    ],
    [
      356,
      352
    ],
    [
      388,
      396
    ],
    [
      406,
      448
    ],
    [
      392,
      500
    ],
    [
      366,
      540
    ],
    [
      330,
      556
    ]
  ],
  "label": "Sentier des découvertes"
};

const BIRDS = [
  {
    "type": "decouverte",
    "version": 1,
    "id": "curios",
    "nom": "Curi>s, le jeu",
    "latin": "Exploration Â· DÃ©couverte",
    "emoji": "ðŸ§­",
    "couleur": "#e67e22",
    "categorie": "diurne",
    "taille": "Astuce : explore chaque balise avant de valider",
    "img": "",
    "audioFile": null,
    "anecdotes": [
      "Le Professeur Curi🧭s a créé la Machine à Comprendre la France : ses fragments sont dispersés à travers la France et les territoires ultramarins.",
      "Prologue : « Bonjour, jeune explorateur. Si tu entends ce message, c’est que la situation est… légèrement catastrophique. »",
      "Mission : retrouver les fragments en observant, mesurant et expérimentant avec ton smartphone."
    ],
    "chant": {
      "tempo": 100,
      "notes": [
        {
          "f": 262,
          "fEnd": 262,
          "d": 0.12,
          "g": 0.07,
          "type": "sine",
          "v": 0.5
        },
        {
          "f": 392,
          "fEnd": 392,
          "d": 0.12,
          "g": 0.07,
          "type": "sine",
          "v": 0.5
        },
        {
          "f": 523,
          "fEnd": 523,
          "d": 0.1,
          "g": 0.15,
          "type": "sine",
          "v": 0.4
        }
      ]
    },
    "pedagogie": {
      "ages": [
        8,
        18
      ],
      "duree_min": 10,
      "objectif": "DÃ©couvrir le fonctionnement global du jeu et ses mÃ©caniques de balise",
      "programme": [
        "cycle 3",
        "cycle 4"
      ]
    },
    "quiz": [
      {
        "q": "Curi>s est avant tout un jeu deâ€¦",
        "options": [
          "CompÃ©tition individuelle",
          "DÃ©couverte et coopÃ©ration",
          "Course contre la montre",
          "Puzzle"
        ],
        "reponse": 1
      },
      {
        "q": "Le jeu peut-il jouer sans connexion internet ?",
        "options": [
          "Non, jamais",
          "Oui, hors-ligne",
          "Seulement le week-end",
          "Uniquement avec un abonnement"
        ],
        "reponse": 1
      }
    ]
  },
  {
    "type": "decouverte",
    "version": 1,
    "id": "equipe",
    "nom": "L'Ã©quipe",
    "latin": "CoopÃ©ration Â· Entraide",
    "emoji": "ðŸ¤",
    "couleur": "#2ecc71",
    "categorie": "diurne",
    "taille": "Astuce : rÃ©partissez les rÃ´les dans l'Ã©quipe",
    "img": "",
    "audioFile": null,
    "anecdotes": [
      "En mode coopÃ©ratif, toute l'Ã©quipe gagne ou perd ensemble.",
      "Partager ses idÃ©es aide Ã  rÃ©soudre les Ã©nigmes difficiles.",
      "Chaque membre peut prendre un rÃ´le : lecteur, explorateur, validateur."
    ],
    "chant": {
      "tempo": 112,
      "notes": [
        {
          "f": 294,
          "fEnd": 294,
          "d": 0.12,
          "g": 0.07,
          "type": "sine",
          "v": 0.5
        },
        {
          "f": 370,
          "fEnd": 370,
          "d": 0.12,
          "g": 0.07,
          "type": "sine",
          "v": 0.5
        },
        {
          "f": 440,
          "fEnd": 440,
          "d": 0.1,
          "g": 0.15,
          "type": "sine",
          "v": 0.4
        }
      ]
    },
    "pedagogie": {
      "ages": [
        8,
        18
      ],
      "duree_min": 8,
      "objectif": "Comprendre l'importance de la coopÃ©ration dans la rÃ©solution de problÃ¨mes",
      "programme": [
        "cycle 3",
        "cycle 4"
      ]
    },
    "quiz": [
      {
        "q": "En mode coopÃ©ratif, qui gagne des Ã©toiles ?",
        "options": [
          "Le meilleur joueur",
          "Toute l'Ã©quipe",
          "Personne",
          "Le capitaine uniquement"
        ],
        "reponse": 1
      },
      {
        "q": "Quel comportement aide le plus une Ã©quipe ?",
        "options": [
          "Garder ses rÃ©ponses pour soi",
          "Partager ses idÃ©es",
          "Se dÃ©pÃªcher seul",
          "Ignorer les autres"
        ],
        "reponse": 1
      }
    ]
  }
];

const GUIDE = [
  {
    "type": "guide",
    "version": 1,
    "id": "jeu-balises",
    "nom": "Le jeu de balises",
    "description": "Prologue & fonctionnement : le Professeur Curi🧭s explique que la Machine à Comprendre la France est en panne. Le joueur doit OBSERVER, MESURER, RÉFLÉCHIR et EXPÉRIMENTER pour retrouver les fragments. Le guide détaille balises, niveaux de difficulté, validation et exemples de missions.",
    "pedagogie": {
      "objectif": "Comprendre le dÃ©roulement d'une partie de Curi>s",
      "ages": [
        8,
        18
      ],
      "duree_min": 6
    }
  },
  {
    "type": "guide",
    "version": 1,
    "id": "cooperation",
    "nom": "La coopÃ©ration",
    "description": "L'importance de jouer ensemble et de partager ses idÃ©es pour rÃ©ussir les dÃ©fis du parcours.",
    "pedagogie": {
      "objectif": "DÃ©velopper l'entraide et la communication au sein de l'Ã©quipe",
      "ages": [
        8,
        18
      ],
      "duree_min": 6
    }
  }
];

const BALISES = [
  {
    "type": "balise",
    "version": 1,
    "id": "S01",
    "bird": "curios",
    "code": "DEMO-S01",
    "lat": 48.85837,
    "lng": 2.29448,
    "label": "Tour Eiffel â€” Paris",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "La Tour Eiffel mesure environ 330 m. Si un ascenseur parcourt 2,5 m/s, combien de secondes pour monter 300 m ?",
        "reponses": [
          "120",
          "120 s",
          "120 secondes"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "La Tour Eiffel mesure environ 330 m. Si un ascenseur parcourt 2,5 m/s, combien de secondes pour monter 300 m ?",
        "reponses": [
          "120",
          "120 s",
          "120 secondes"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "La Tour Eiffel mesure environ 330 m. Si un ascenseur parcourt 2,5 m/s, combien de secondes pour monter 300 m ?",
        "reponses": [
          "120",
          "120 s",
          "120 secondes"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S02",
    "bird": "curios",
    "code": "DEMO-S02",
    "lat": 50.6365,
    "lng": 3.0633,
    "label": "Lille â€” Grand'Place",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Sans regarder une carte, tourne ton tÃ©lÃ©phone jusqu'au Nord puis avance de 10 pas. Quel angle approximatif sÃ©pare le Nord et l'Est ?",
        "reponses": [
          "90",
          "90Â°",
          "90 degrÃ©s"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Sans regarder une carte, tourne ton tÃ©lÃ©phone jusqu'au Nord puis avance de 10 pas. Quel angle approximatif sÃ©pare le Nord et l'Est ?",
        "reponses": [
          "90",
          "90Â°",
          "90 degrÃ©s"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Sans regarder une carte, tourne ton tÃ©lÃ©phone jusqu'au Nord puis avance de 10 pas. Quel angle approximatif sÃ©pare le Nord et l'Est ?",
        "reponses": [
          "90",
          "90Â°",
          "90 degrÃ©s"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S03",
    "bird": "curios",
    "code": "DEMO-S03",
    "lat": 48.6361,
    "lng": -1.5115,
    "label": "Mont-Saint-Michel",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Le Mont-Saint-Michel semble surgir de la mer. Si une marÃ©e monte de 8 m en 6 h, quelle est sa vitesse moyenne en cm/min ?",
        "reponses": [
          "2.22",
          "2,22",
          "2.2"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Le Mont-Saint-Michel semble surgir de la mer. Si une marÃ©e monte de 8 m en 6 h, quelle est sa vitesse moyenne en cm/min ?",
        "reponses": [
          "2.22",
          "2,22",
          "2.2"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Le Mont-Saint-Michel semble surgir de la mer. Si une marÃ©e monte de 8 m en 6 h, quelle est sa vitesse moyenne en cm/min ?",
        "reponses": [
          "2.22",
          "2,22",
          "2.2"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S04",
    "bird": "curios",
    "code": "DEMO-S04",
    "lat": 48.8049,
    "lng": 2.1204,
    "label": "Palais de Versailles",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Prends une photo d'un motif symÃ©trique. Combien d'axes de symÃ©trie peux-tu repÃ©rer ?",
        "reponses": [
          "2",
          "3",
          "4",
          "un",
          "deux",
          "trois",
          "quatre"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Prends une photo d'un motif symÃ©trique. Combien d'axes de symÃ©trie peux-tu repÃ©rer ?",
        "reponses": [
          "2",
          "3",
          "4",
          "un",
          "deux",
          "trois",
          "quatre"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Prends une photo d'un motif symÃ©trique. Combien d'axes de symÃ©trie peux-tu repÃ©rer ?",
        "reponses": [
          "2",
          "3",
          "4",
          "un",
          "deux",
          "trois",
          "quatre"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S05",
    "bird": "curios",
    "code": "DEMO-S05",
    "lat": 43.206,
    "lng": 2.3634,
    "label": "Carcassonne",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Fais tourner doucement ton tÃ©lÃ©phone d'un demi-tour. Combien de degrÃ©s as-tu parcourus ?",
        "reponses": [
          "180",
          "180Â°",
          "180 degrÃ©s"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Fais tourner doucement ton tÃ©lÃ©phone d'un demi-tour. Combien de degrÃ©s as-tu parcourus ?",
        "reponses": [
          "180",
          "180Â°",
          "180 degrÃ©s"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Fais tourner doucement ton tÃ©lÃ©phone d'un demi-tour. Combien de degrÃ©s as-tu parcourus ?",
        "reponses": [
          "180",
          "180Â°",
          "180 degrÃ©s"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S06",
    "bird": "curios",
    "code": "DEMO-S06",
    "lat": 43.214,
    "lng": 5.4474,
    "label": "Calanques â€” Marseille",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Marche 20 m puis accÃ©lÃ¨re lÃ©gÃ¨rement pendant 3 s. Quelle grandeur mesure ton tÃ©lÃ©phone pour dÃ©tecter ce changement ?",
        "reponses": [
          "accÃ©lÃ©ration",
          "accelerometre"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Marche 20 m puis accÃ©lÃ¨re lÃ©gÃ¨rement pendant 3 s. Quelle grandeur mesure ton tÃ©lÃ©phone pour dÃ©tecter ce changement ?",
        "reponses": [
          "accÃ©lÃ©ration",
          "accelerometre"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Marche 20 m puis accÃ©lÃ¨re lÃ©gÃ¨rement pendant 3 s. Quelle grandeur mesure ton tÃ©lÃ©phone pour dÃ©tecter ce changement ?",
        "reponses": [
          "accÃ©lÃ©ration",
          "accelerometre"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S07",
    "bird": "curios",
    "code": "DEMO-S07",
    "lat": 45.8326,
    "lng": 6.8652,
    "label": "Mont-Blanc",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Ã€ haute altitude, la pression atmosphÃ©rique diminue. Ton tÃ©lÃ©phone possÃ¨de-t-il un baromÃ¨tre ? Si oui, relÃ¨ve la pression.",
        "reponses": [
          "oui",
          "yes"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Ã€ haute altitude, la pression atmosphÃ©rique diminue. Ton tÃ©lÃ©phone possÃ¨de-t-il un baromÃ¨tre ? Si oui, relÃ¨ve la pression.",
        "reponses": [
          "oui",
          "yes"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Ã€ haute altitude, la pression atmosphÃ©rique diminue. Ton tÃ©lÃ©phone possÃ¨de-t-il un baromÃ¨tre ? Si oui, relÃ¨ve la pression.",
        "reponses": [
          "oui",
          "yes"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S08",
    "bird": "curios",
    "code": "DEMO-S08",
    "lat": 46.6699,
    "lng": 0.367,
    "label": "Futuroscope â€” Poitiers",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Place ton tÃ©lÃ©phone dans une zone claire puis ombragÃ©e. La valeur du capteur de lumiÃ¨re devrait-elle augmenter ou diminuer ?",
        "reponses": [
          "augmenter",
          "diminuer"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Place ton tÃ©lÃ©phone dans une zone claire puis ombragÃ©e. La valeur du capteur de lumiÃ¨re devrait-elle augmenter ou diminuer ?",
        "reponses": [
          "augmenter",
          "diminuer"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Place ton tÃ©lÃ©phone dans une zone claire puis ombragÃ©e. La valeur du capteur de lumiÃ¨re devrait-elle augmenter ou diminuer ?",
        "reponses": [
          "augmenter",
          "diminuer"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S09",
    "bird": "curios",
    "code": "DEMO-S09",
    "lat": 48.8955,
    "lng": 2.387,
    "label": "CitÃ© des sciences â€” Paris",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Tape trois fois dans tes mains. Combien d'impulsions sonores ton micro peut-il dÃ©tecter ?",
        "reponses": [
          "3",
          "trois"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Tape trois fois dans tes mains. Combien d'impulsions sonores ton micro peut-il dÃ©tecter ?",
        "reponses": [
          "3",
          "trois"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Tape trois fois dans tes mains. Combien d'impulsions sonores ton micro peut-il dÃ©tecter ?",
        "reponses": [
          "3",
          "trois"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S10",
    "bird": "curios",
    "code": "DEMO-S10",
    "lat": 45.0535,
    "lng": 1.1686,
    "label": "Lascaux â€” Dordogne",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Ã‰mets un son grave puis un son aigu. Lequel possÃ¨de la frÃ©quence la plus Ã©levÃ©e ?",
        "reponses": [
          "aigu",
          "le son aigu"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Ã‰mets un son grave puis un son aigu. Lequel possÃ¨de la frÃ©quence la plus Ã©levÃ©e ?",
        "reponses": [
          "aigu",
          "le son aigu"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Ã‰mets un son grave puis un son aigu. Lequel possÃ¨de la frÃ©quence la plus Ã©levÃ©e ?",
        "reponses": [
          "aigu",
          "le son aigu"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S11",
    "bird": "curios",
    "code": "DEMO-S11",
    "lat": 42.9369,
    "lng": 0.141,
    "label": "Observatoire â€” Pic du Midi",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Pointe ton tÃ©lÃ©phone vers le Nord, puis vers le Sud. De combien de degrÃ©s environ as-tu changÃ© d'orientation ?",
        "reponses": [
          "180",
          "180Â°",
          "180 degrÃ©s"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Pointe ton tÃ©lÃ©phone vers le Nord, puis vers le Sud. De combien de degrÃ©s environ as-tu changÃ© d'orientation ?",
        "reponses": [
          "180",
          "180Â°",
          "180 degrÃ©s"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Pointe ton tÃ©lÃ©phone vers le Nord, puis vers le Sud. De combien de degrÃ©s environ as-tu changÃ© d'orientation ?",
        "reponses": [
          "180",
          "180Â°",
          "180 degrÃ©s"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S12",
    "bird": "curios",
    "code": "DEMO-S12",
    "lat": 48.5819,
    "lng": 7.7508,
    "label": "Strasbourg â€” CathÃ©drale",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "TÃ©lÃ©phone posÃ© sur une table : dÃ©clenche une vibration et dÃ©cris ce que tu observes. Quelle Ã©nergie est convertie en mouvement ?",
        "reponses": [
          "electrique",
          "Ã©lectrique"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "TÃ©lÃ©phone posÃ© sur une table : dÃ©clenche une vibration et dÃ©cris ce que tu observes. Quelle Ã©nergie est convertie en mouvement ?",
        "reponses": [
          "electrique",
          "Ã©lectrique"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "TÃ©lÃ©phone posÃ© sur une table : dÃ©clenche une vibration et dÃ©cris ce que tu observes. Quelle Ã©nergie est convertie en mouvement ?",
        "reponses": [
          "electrique",
          "Ã©lectrique"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S13",
    "bird": "curios",
    "code": "DEMO-S13",
    "lat": -21.2444,
    "lng": 55.7088,
    "label": "Piton de la Fournaise â€” RÃ©union",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Le Piton de la Fournaise est volcanique. Si une coulÃ©e avance de 600 m en 10 min, quelle est sa vitesse moyenne en m/s ?",
        "reponses": [
          "1",
          "1 m/s",
          "1.0"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Le Piton de la Fournaise est volcanique. Si une coulÃ©e avance de 600 m en 10 min, quelle est sa vitesse moyenne en m/s ?",
        "reponses": [
          "1",
          "1 m/s",
          "1.0"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Le Piton de la Fournaise est volcanique. Si une coulÃ©e avance de 600 m en 10 min, quelle est sa vitesse moyenne en m/s ?",
        "reponses": [
          "1",
          "1 m/s",
          "1.0"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S14",
    "bird": "curios",
    "code": "DEMO-S14",
    "lat": 14.6161,
    "lng": -61.0588,
    "label": "Fort-de-France â€” Martinique",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Cadre un Ã©lÃ©ment rouge, bleu ou blanc. Quelle couleur franÃ§aise manque dans ton cadre ?",
        "reponses": [
          "une des deux autres",
          "rouge",
          "bleu",
          "blanc"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Cadre un Ã©lÃ©ment rouge, bleu ou blanc. Quelle couleur franÃ§aise manque dans ton cadre ?",
        "reponses": [
          "une des deux autres",
          "rouge",
          "bleu",
          "blanc"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Cadre un Ã©lÃ©ment rouge, bleu ou blanc. Quelle couleur franÃ§aise manque dans ton cadre ?",
        "reponses": [
          "une des deux autres",
          "rouge",
          "bleu",
          "blanc"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S15",
    "bird": "curios",
    "code": "DEMO-S15",
    "lat": 16.2411,
    "lng": -61.5331,
    "label": "Pointe-Ã -Pitre â€” Guadeloupe",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Oriente le tÃ©lÃ©phone vers l'Est. Quel point cardinal trouveras-tu aprÃ¨s un quart de tour vers la gauche ?",
        "reponses": [
          "nord",
          "nord"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Oriente le tÃ©lÃ©phone vers l'Est. Quel point cardinal trouveras-tu aprÃ¨s un quart de tour vers la gauche ?",
        "reponses": [
          "nord",
          "nord"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Oriente le tÃ©lÃ©phone vers l'Est. Quel point cardinal trouveras-tu aprÃ¨s un quart de tour vers la gauche ?",
        "reponses": [
          "nord",
          "nord"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S16",
    "bird": "curios",
    "code": "DEMO-S16",
    "lat": 4.9224,
    "lng": -52.3135,
    "label": "Cayenne â€” Guyane",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "En Guyane, la lumiÃ¨re naturelle est forte. Compare la luminositÃ© dehors et Ã  l'ombre : laquelle est la plus Ã©levÃ©e ?",
        "reponses": [
          "dehors",
          "extÃ©rieur"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "En Guyane, la lumiÃ¨re naturelle est forte. Compare la luminositÃ© dehors et Ã  l'ombre : laquelle est la plus Ã©levÃ©e ?",
        "reponses": [
          "dehors",
          "extÃ©rieur"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "En Guyane, la lumiÃ¨re naturelle est forte. Compare la luminositÃ© dehors et Ã  l'ombre : laquelle est la plus Ã©levÃ©e ?",
        "reponses": [
          "dehors",
          "extÃ©rieur"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S17",
    "bird": "curios",
    "code": "DEMO-S17",
    "lat": -12.7806,
    "lng": 45.2278,
    "label": "Mamoudzou â€” Mayotte",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Trouve ta position GPS et donne les deux premiÃ¨res dÃ©cimales de ta latitude.",
        "reponses": [
          "manuel"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Trouve ta position GPS et donne les deux premiÃ¨res dÃ©cimales de ta latitude.",
        "reponses": [
          "manuel"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Trouve ta position GPS et donne les deux premiÃ¨res dÃ©cimales de ta latitude.",
        "reponses": [
          "manuel"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S18",
    "bird": "curios",
    "code": "DEMO-S18",
    "lat": -17.5516,
    "lng": -149.5585,
    "label": "Papeete â€” PolynÃ©sie franÃ§aise",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Enregistre 5 secondes de sons ambiants. Combien de sources sonores diffÃ©rentes peux-tu distinguer ?",
        "reponses": [
          "1",
          "2",
          "3",
          "4",
          "5"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Enregistre 5 secondes de sons ambiants. Combien de sources sonores diffÃ©rentes peux-tu distinguer ?",
        "reponses": [
          "1",
          "2",
          "3",
          "4",
          "5"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Enregistre 5 secondes de sons ambiants. Combien de sources sonores diffÃ©rentes peux-tu distinguer ?",
        "reponses": [
          "1",
          "2",
          "3",
          "4",
          "5"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S19",
    "bird": "curios",
    "code": "DEMO-S19",
    "lat": -22.2758,
    "lng": 166.458,
    "label": "NoumÃ©a â€” Nouvelle-CalÃ©donie",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Fais une rotation lente de 360Â°. Le gyroscope doit-il dÃ©tecter une rotation nulle ou un tour complet ?",
        "reponses": [
          "tour complet",
          "360",
          "360Â°"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Fais une rotation lente de 360Â°. Le gyroscope doit-il dÃ©tecter une rotation nulle ou un tour complet ?",
        "reponses": [
          "tour complet",
          "360",
          "360Â°"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Fais une rotation lente de 360Â°. Le gyroscope doit-il dÃ©tecter une rotation nulle ou un tour complet ?",
        "reponses": [
          "tour complet",
          "360",
          "360Â°"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S20",
    "bird": "curios",
    "code": "DEMO-S20",
    "lat": 46.7811,
    "lng": -56.1773,
    "label": "Saint-Pierre â€” Saint-Pierre-et-Miquelon",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Regarde le niveau de batterie. Si tu as 60 % et que trois dÃ©fis consomment chacun 4 %, combien restera-t-il ?",
        "reponses": [
          "48",
          "48%",
          "48 %"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Regarde le niveau de batterie. Si tu as 60 % et que trois dÃ©fis consomment chacun 4 %, combien restera-t-il ?",
        "reponses": [
          "48",
          "48%",
          "48 %"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Regarde le niveau de batterie. Si tu as 60 % et que trois dÃ©fis consomment chacun 4 %, combien restera-t-il ?",
        "reponses": [
          "48",
          "48%",
          "48 %"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S21",
    "bird": "curios",
    "code": "DEMO-S21",
    "lat": -49.35,
    "lng": 69.35,
    "label": "Terres australes â€” mission virtuelle",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Mission hors-ligne : coupe le rÃ©seau. Le parcours doit-il continuer Ã  fonctionner ?",
        "reponses": [
          "oui",
          "oui, il doit continuer"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Mission hors-ligne : coupe le rÃ©seau. Le parcours doit-il continuer Ã  fonctionner ?",
        "reponses": [
          "oui",
          "oui, il doit continuer"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Mission hors-ligne : coupe le rÃ©seau. Le parcours doit-il continuer Ã  fonctionner ?",
        "reponses": [
          "oui",
          "oui, il doit continuer"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S22",
    "bird": "curios",
    "code": "DEMO-S22",
    "lat": 51.0344,
    "lng": 2.3768,
    "label": "Dunkerque â€” plage",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Marche 10 pas, arrÃªte-toi net. Que mesure principalement l'accÃ©lÃ©romÃ¨tre lors de l'arrÃªt ?",
        "reponses": [
          "une variation d'accÃ©lÃ©ration",
          "accÃ©lÃ©ration"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Marche 10 pas, arrÃªte-toi net. Que mesure principalement l'accÃ©lÃ©romÃ¨tre lors de l'arrÃªt ?",
        "reponses": [
          "une variation d'accÃ©lÃ©ration",
          "accÃ©lÃ©ration"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Marche 10 pas, arrÃªte-toi net. Que mesure principalement l'accÃ©lÃ©romÃ¨tre lors de l'arrÃªt ?",
        "reponses": [
          "une variation d'accÃ©lÃ©ration",
          "accÃ©lÃ©ration"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S23",
    "bird": "curios",
    "code": "DEMO-S23",
    "lat": 47.214,
    "lng": -1.5562,
    "label": "Nantes â€” Machines de l'Ã®le",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "Prends une photo d'une structure mÃ©canique et identifie une piÃ¨ce qui sert de pivot.",
        "reponses": [
          "axe",
          "pivot",
          "roue"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "Prends une photo d'une structure mÃ©canique et identifie une piÃ¨ce qui sert de pivot.",
        "reponses": [
          "axe",
          "pivot",
          "roue"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "Prends une photo d'une structure mÃ©canique et identifie une piÃ¨ce qui sert de pivot.",
        "reponses": [
          "axe",
          "pivot",
          "roue"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  },
  {
    "type": "balise",
    "version": 1,
    "id": "S24",
    "bird": "curios",
    "code": "DEMO-S24",
    "lat": 44.8378,
    "lng": -0.5702,
    "label": "Bordeaux â€” miroir d'eau",
    "hintImg": "",
    "enigmes": {
      "facile": {
        "text": "ChronomÃ¨tre 10 secondes sans regarder l'Ã©cran. Ã€ quel point ton estimation est-elle proche ?",
        "reponses": [
          "10",
          "10 secondes"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          9,
          11
        ]
      },
      "moyen": {
        "text": "ChronomÃ¨tre 10 secondes sans regarder l'Ã©cran. Ã€ quel point ton estimation est-elle proche ?",
        "reponses": [
          "10",
          "10 secondes"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          12,
          15
        ]
      },
      "difficile": {
        "text": "ChronomÃ¨tre 10 secondes sans regarder l'Ã©cran. Ã€ quel point ton estimation est-elle proche ?",
        "reponses": [
          "10",
          "10 secondes"
        ],
        "indice": true,
        "saviez": true,
        "ages": [
          15,
          99
        ]
      }
    },
    "enigme": null,
    "x": null,
    "y": null
  }
];

const DIFFICULTIES = [
  { id: "facile", label: "Facile" },
  { id: "moyen", label: "Moyen" },
  { id: "difficile", label: "Difficile" },
];

/* Thèmes visuels sélectionnables dans Réglages (content/themes/) */
const THEMES = [
  {
    "id": "defaut",
    "nom": "Nuit étoilée",
    "emoji": "🌙",
    "description": "L'ambiance d'origine : nuit bleutée sous les étoiles.",
    "meta": "#101822",
    "fond": null,
    "vars": {
      "--bg": "#101822",
      "--bg-soft": "#15202c",
      "--card": "#1b2735",
      "--card-soft": "#22303f",
      "--ink": "#e8f0f5",
      "--text-muted": "#b9c8d4",
      "--primary": "#2fb97c",
      "--primary-dark": "#1d8a5b",
      "--gold": "#ffce3d",
      "--err": "#ff7878",
      "--ok": "#5fd68f",
      "--line": "#33465a",
      "--shadow": "0 6px 22px rgba(0, 0, 0, 0.45)"
    }
  },
  {
    "id": "nature",
    "nom": "Nature",
    "emoji": "🌿",
    "description": "Sous-bois vert et mousse, pour les sentiers en forêt.",
    "meta": "#122b18",
    "fond": "radial-gradient(1200px 600px at 80% -10%, rgba(67, 196, 99, 0.14), transparent 60%), radial-gradient(900px 500px at -10% 100%, rgba(255, 210, 61, 0.08), transparent 55%)",
    "vars": {
      "--bg": "#0d2013",
      "--bg-soft": "#122b1a",
      "--card": "#173524",
      "--card-soft": "#1d4029",
      "--ink": "#eaf6ec",
      "--text-muted": "#b2cfba",
      "--primary": "#43c463",
      "--primary-dark": "#2b9a48",
      "--gold": "#ffd23d",
      "--err": "#ff7878",
      "--ok": "#71dd8f",
      "--line": "#2c5038",
      "--shadow": "0 6px 22px rgba(0, 0, 0, 0.45)"
    }
  },
  {
    "id": "espace",
    "nom": "Espace",
    "emoji": "🚀",
    "description": "Cosmos profond, nébuleuses et constellations.",
    "meta": "#0d1030",
    "fond": "radial-gradient(1000px 520px at 75% -5%, rgba(129, 106, 255, 0.22), transparent 60%), radial-gradient(800px 420px at 10% 110%, rgba(64, 156, 255, 0.16), transparent 55%)",
    "vars": {
      "--bg": "#0a0e26",
      "--bg-soft": "#101636",
      "--card": "#171f47",
      "--card-soft": "#1f2a58",
      "--ink": "#ecf0ff",
      "--text-muted": "#b7c1ea",
      "--primary": "#6f8cff",
      "--primary-dark": "#4c66d9",
      "--gold": "#ffd76e",
      "--err": "#ff8080",
      "--ok": "#7ee2a8",
      "--line": "#303c72",
      "--shadow": "0 6px 24px rgba(0, 0, 10, 0.55)"
    }
  },
  {
    "id": "futuriste",
    "nom": "Futuriste",
    "emoji": "⚡",
    "description": "Néons cyan et magenta sur asphalte nocturne.",
    "meta": "#08131c",
    "fond": "radial-gradient(900px 480px at 85% -10%, rgba(0, 229, 255, 0.16), transparent 60%), radial-gradient(700px 400px at 0% 105%, rgba(255, 45, 170, 0.13), transparent 55%)",
    "vars": {
      "--bg": "#071119",
      "--bg-soft": "#0b1926",
      "--card": "#0f2334",
      "--card-soft": "#142d42",
      "--ink": "#e6faff",
      "--text-muted": "#9fc9da",
      "--primary": "#00e5ff",
      "--primary-dark": "#00a8bd",
      "--gold": "#ffe066",
      "--err": "#ff5d7a",
      "--ok": "#3dffc0",
      "--line": "#1d4058",
      "--shadow": "0 6px 24px rgba(0, 20, 30, 0.6)"
    }
  },
  {
    "id": "retro",
    "nom": "Rétro",
    "emoji": "📼",
    "description": "Sepia chaud des soirées diapo et cassettes VHS.",
    "meta": "#241a0e",
    "fond": "radial-gradient(1000px 520px at 80% -10%, rgba(255, 170, 60, 0.14), transparent 60%), radial-gradient(800px 460px at 5% 105%, rgba(200, 90, 40, 0.12), transparent 55%)",
    "vars": {
      "--bg": "#221708",
      "--bg-soft": "#2c1f0d",
      "--card": "#382713",
      "--card-soft": "#44301a",
      "--ink": "#fdf3dd",
      "--text-muted": "#d3bd97",
      "--primary": "#ffab40",
      "--primary-dark": "#d98a25",
      "--gold": "#ffd76e",
      "--err": "#ff8674",
      "--ok": "#ffd76e",
      "--line": "#5a4326",
      "--shadow": "0 6px 22px rgba(20, 10, 0, 0.5)"
    }
  }
];

/* Ids des packs actuellement activés (source de vérité : content/manifest.json).
   Permet au parcours ("Choisir un parcours") de marquer le pack joué, même hors-ligne. */
const ACTIVE_PACKS = [
  "packdemo"
];
/* ==== FIN CONTENU GÉNÉRÉ ==== */

/* Toutes les découvertes : celles du parcours + celles du guide embarqué */
function allBirds() { return BIRDS.concat(GUIDE); }

function getBird(id) { return allBirds().find((b) => b.id === id); }
function getBalise(id) { return BALISES.find((b) => b.id === id); }
function getBaliseIndex(id) { return BALISES.findIndex((b) => b.id === id); }
function nextBalise(id) { const i = getBaliseIndex(id); return i >= 0 && i < BALISES.length - 1 ? BALISES[i + 1] : null; }

/* ---- Moteur de jeu externalisé ----
 * normalize, checkAnswer, makeQuiz, getEnigme vivent désormais dans
 * packages/game-engine/src/ (importables en Node.js, testables).
 * js/engine.js (généré par tools/build-engine.mjs) expose ces fonctions
 * via window.CURIOS_ENGINE.
 */
/* normalize, checkAnswer, makeQuiz, getEnigme sont déjà déclarés en
   portée globale par js/engine.js (scripts classiques antérieurs dans
   index.html). Les re-déstructurer ici créait des collisions de
   redéclaration (SyntaxError) qui empêchaient TOUT js/data.js de
   s'exécuter (BALISES, SITE, ACTIVE_PACKS absents au runtime). */

/* ---- Surcharges éditables (admin-data.json) -------------------------
   Applique les modifications sauvegardées par l'éditeur (serveur ou god
   mode) sur les données de base. Mutate les structures SITE / TRAIL /
   BALISES / BIRDS / GUIDE.
   Supporte : modification, AJOUT (balises/découvertes absentes créés) et
   SUPPRESSION (removedBalises / removedBirds). Idempotent. */
function applyAdminData(admin) {
  if (!admin || typeof admin !== "object") return;

  /* --- 0) Suppressions --- */
  if (Array.isArray(admin.removedBirds)) {
    const gone = new Set(admin.removedBirds);
    for (let i = BIRDS.length - 1; i >= 0; i--) {
      if (gone.has(BIRDS[i].id)) BIRDS.splice(i, 1);
    }
    BALISES.forEach((b) => { if (gone.has(b.bird)) b.bird = ""; });
  }
  if (Array.isArray(admin.removedBalises)) {
    const gone = new Set(admin.removedBalises);
    for (let i = BALISES.length - 1; i >= 0; i--) {
      if (gone.has(BALISES[i].id)) BALISES.splice(i, 1);
    }
  }

  /* --- 1) Site (nom, rayon, centre, photos…) --- */
  if (admin.site && typeof admin.site === "object") {
    for (const k of Object.keys(admin.site)) {
      if (k === "center" && admin.site.center && typeof admin.site.center === "object") {
        if (admin.site.center.lat != null) SITE.center.lat = Number(admin.site.center.lat);
        if (admin.site.center.lng != null) SITE.center.lng = Number(admin.site.center.lng);
      } else if (SITE[k] !== undefined) {
        SITE[k] = admin.site[k];
      }
    }
  }
  if (admin.trail && typeof admin.trail === "object") {
    if (Array.isArray(admin.trail.path)) TRAIL.path = admin.trail.path;
    if (admin.trail.label) TRAIL.label = admin.trail.label;
  }
  if (admin.guide && typeof admin.guide === "object") {
    for (const id of Object.keys(admin.guide)) {
      const g = GUIDE.find((x) => x.id === id);
      if (!g) continue;
      const ov = admin.guide[id];
      if (ov && typeof ov === "object") {
        for (const k of Object.keys(ov)) g[k] = ov[k];
      }
    }
  }

  /* --- 2) Découvertes : création (id absent) + modification --- */
  if (admin.birds && typeof admin.birds === "object") {
    for (const id of Object.keys(admin.birds)) {
      const ov = admin.birds[id];
      if (!ov || typeof ov !== "object") continue;
      let bird = getBird(id);
      if (!bird) {
        bird = {
          id: id,
          nom: ov.nom || id,
          latin: ov.latin || "",
          emoji: ov.emoji || "🧠",
          couleur: ov.couleur || "#6a6a6a",
          categorie: ov.categorie || "diurne",
          taille: ov.taille || "?",
          img: ov.img || "",
          audioFile: ov.audioFile || null,
          anecdotes: Array.isArray(ov.anecdotes) ? ov.anecdotes.slice() : [],
          chant: ov.chant || null,
          quiz: Array.isArray(ov.quiz) ? ov.quiz.slice() : [],
        };
        BIRDS.push(bird);
      }
      for (const k of Object.keys(ov)) {
        if (k === "id") continue;
        if (k === "questions" && Array.isArray(ov.questions)) bird.quiz = ov.questions;
        else if (k === "anecdotes" && Array.isArray(ov.anecdotes)) bird.anecdotes = ov.anecdotes.slice();
        else if (k === "quiz" && Array.isArray(ov.quiz)) bird.quiz = ov.quiz.slice();
        else bird[k] = ov[k];
      }
    }
  }

  /* --- 3) Balises : création (id absent) + modification --- */
  if (admin.balises && typeof admin.balises === "object") {
    for (const id of Object.keys(admin.balises)) {
      const ov = admin.balises[id];
      if (!ov || typeof ov !== "object") continue;
      let bal = getBalise(id);
      if (!bal) {
        bal = {
          id: id,
          bird: ov.bird || "",
          code: ov.code || `JDP-${  String(id).toUpperCase()}`,
          x: (ov.x != null && isFinite(Number(ov.x))) ? Number(ov.x) : 200,
          y: (ov.y != null && isFinite(Number(ov.y))) ? Number(ov.y) : 400,
          lat: (ov.lat != null && isFinite(Number(ov.lat))) ? Number(ov.lat) : SITE.center.lat,
          lng: (ov.lng != null && isFinite(Number(ov.lng))) ? Number(ov.lng) : SITE.center.lng,
          label: ov.label || id,
          hintImg: ov.hintImg || "",
          enigmes: {},
          enigme: ov.enigme || null,
        };
        BALISES.push(bal);
      }
      for (const k of Object.keys(ov)) {
        if (k === "id") continue;
        if (k === "enigmes" && ov.enigmes && typeof ov.enigmes === "object") {
          if (!bal.enigmes) bal.enigmes = {};
          for (const diff of Object.keys(ov.enigmes)) {
            if (!bal.enigmes[diff]) bal.enigmes[diff] = {};
            const eo = ov.enigmes[diff];
            if (eo && typeof eo === "object") {
              for (const ek of Object.keys(eo)) {
                bal.enigmes[diff][ek] = eo[ek];
              }
            }
          }
        } else if ((k === "x" || k === "y" || k === "lat" || k === "lng") && ov[k] != null && isFinite(Number(ov[k]))) {
          bal[k] = Number(ov[k]);
        } else {
          bal[k] = ov[k];
        }
      }
    }
  }

  /* --- 4) Quiz : surcharge des questions d'une découverte --- */
  if (admin.quiz && typeof admin.quiz === "object") {
    for (const id of Object.keys(admin.quiz)) {
      const bird = getBird(id);
      if (!bird) continue;
      const ov = admin.quiz[id];
      if (ov && typeof ov === "object") {
        if (ov.q) { bird.quiz = [ov]; continue; }
        for (const k of Object.keys(ov)) {
          if (k === "questions" && Array.isArray(ov.questions)) bird.quiz = ov.questions;
          else bird[k] = ov[k];
        }
      }
    }
  }
}
