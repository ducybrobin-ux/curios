/* ============================================================================
 * catalogue-data.js — Données embarquées du Catalogue premium Curi🧭s.
 *
 * Source éditée : content/catalog/packs/<id>.json  (ne pas dupliquer ici).
 * Ce fichier est la version EMBARQUÉE (précachée par le service worker) pour
 * garantir que le catalogue reste consultable hors-ligne, à l'image de js/data.js.
 *
 * Variables exposées :
 *   window.CATALOGUE_DATA  -> { version, packs: [...], collections: [...] }
 *
 * Chaque pack embarqué est fusionné, côté page, avec l'état réel renvoyé par
 * GET /api/packs (lorsque disponible en ligne) : actif, stations, missions, ages.
 * ========================================================================== */
(function (global) {
  "use strict";

  var packs = [
    {
      id: "demo",
      nom: "Démo Curi>s — Découverte du jeu",
      tagline: "Prends le jeu en main en 15 minutes",
      cover: "demo",
      accent: "#e67e22",
      emoji: "🧭",
      difficulty: "facile",
      durationMin: 20,
      players: [1, 6],
      location: "Partout (sans GPS)",
      environment: "intérieur / extérieur",
      skills: ["Prise en main", "Coopération", "Découverte"],
      material: ["Smartphone"],
      goals: ["Découvrir le jeu de balises", "Comprendre les niveaux de difficulté", "Expérimenter la coopération"],
      staff: false,
      badges: ["Démo", "Prise en main"],
      collection: "Démos",
      featured: true,
      nbBalises: 3
    },
    {
      id: "biais-cognitifs",
      nom: "Biais cognitifs",
      tagline: "Déjouez les pièges du cerveau",
      cover: "biais-cognitifs",
      accent: "#9b59b6",
      emoji: "🧠",
      difficulty: "moyen",
      durationMin: 80,
      players: [1, 6],
      location: "Le long du sentier",
      environment: "extérieur",
      skills: ["Esprit critique", "Réflexion", "Conscience de soi"],
      material: ["Smartphone", "Carnet de route"],
      goals: ["Comprendre les biais cognitifs", "Identifier les pièges mentaux du quotidien", "Entraîner l'esprit critique"],
      staff: false,
      badges: ["Éducatif", "Sciences"],
      collection: "Sciences & esprit critique",
      featured: false,
      nbBalises: 8
    },
    {
      id: "cemea-education-populaire",
      nom: "CEMÉA & éducation populaire",
      tagline: "Coopérer, apprendre, s'émanciper",
      cover: "cemea-education-populaire",
      accent: "#e74c3c",
      emoji: "🤝",
      difficulty: "facile",
      durationMin: 110,
      players: [2, 12],
      location: "En salle ou en plein air",
      environment: "mixte",
      skills: ["Coopération", "Méthodes actives", "Émancipation"],
      material: ["Smartphone", "Matériel d'animation"],
      goals: ["Découvrir l'éducation populaire", "Expérimenter la coopération", "S'initier aux pédagogies actives"],
      staff: true,
      badges: ["Éducatif", "Collectif"],
      collection: "Éducation & coopération",
      featured: true,
      nbBalises: 11
    },
    {
      id: "cristaux-de-balto",
      nom: "Les Cristaux de Balto",
      tagline: "La meute, le traîneau, la légende",
      cover: "cristaux-de-balto",
      accent: "#f39c12",
      emoji: "🐺",
      difficulty: "facile",
      durationMin: 90,
      players: [1, 6],
      location: "Élevage de Charron (Creuse)",
      environment: "extérieur",
      skills: ["Observation", "Connaissance du vivant", "Culture"],
      material: ["Smartphone"],
      goals: ["Découvrir le husky de Sibérie", "Comprendre le métier de musher", "Explorer la légende de Balto"],
      staff: false,
      badges: ["Nature", "Éducatif"],
      collection: "Nature & vivant",
      featured: true,
      nbBalises: 9
    },
    {
      id: "cosmos-mission-orion",
      nom: "Cosmos — Mission Orion",
      tagline: "Enquête dans le ciel étoilé",
      cover: "cosmos-mission-orion",
      accent: "#6c5ce7",
      emoji: "🔭",
      difficulty: "moyen",
      durationMin: 110,
      players: [1, 6],
      location: "Sous un ciel étoilé",
      environment: "extérieur",
      skills: ["Astronomie", "Investigation scientifique", "Orientation"],
      material: ["Smartphone", "Disque de chiffrement", "Carte du ciel"],
      goals: ["S'orienter dans le ciel nocturne", "Comprendre la méthode scientifique", "Agir contre la pollution lumineuse"],
      staff: false,
      badges: ["Sciences", "Nature"],
      collection: "Sciences & espace",
      featured: true,
      nbBalises: 7
    },
    {
      id: "passeur-relais",
      nom: "Les Passeurs",
      tagline: "Transmets, toi aussi",
      cover: "passeur-relais",
      accent: "#00a6a6",
      emoji: "🔗",
      difficulty: "facile",
      durationMin: 45,
      players: [2, 6],
      location: "En ville, en parc ou en salle",
      environment: "mixte",
      skills: ["Coopération", "Transmission", "Responsabilité"],
      material: ["Smartphone", "QR code", "Feuille & enveloppe"],
      goals: ["Comprendre la transmission des savoirs", "Coopérer en relais", "Prendre soin du groupe"],
      staff: true,
      badges: ["Éducatif", "Collectif"],
      collection: "Coopération & transmission",
      featured: true,
      nbBalises: 6
    },
    {
      id: "harcelement-scolaire",
      nom: "Harcèlement scolaire",
      tagline: "Témoigner, protéger, alerter",
      cover: "harcelement-scolaire",
      accent: "#2980b9",
      emoji: "🛡️",
      difficulty: "facile",
      durationMin: 60,
      players: [1, 8],
      location: "Milieu scolaire",
      environment: "mixte",
      skills: ["Empathie", "Prévention", "Esprit civique"],
      material: ["Smartphone"],
      goals: ["Comprendre le harcèlement", "Apprendre les bons réflexes", "Sensibiliser à l'entraide"],
      staff: true,
      badges: ["Éducatif", "Citoyenneté"],
      collection: "Citoyenneté & climat scolaire",
      featured: false,
      nbBalises: 6
    },
    {
      id: "metiers-tension",
      nom: "Métiers en tension",
      tagline: "Explorez les métiers qui recrutent",
      cover: null,
      accent: "#d35400",
      emoji: "🔧",
      difficulty: "facile",
      durationMin: 80,
      players: [1, 10],
      location: "En classe ou sur le terrain",
      environment: "mixte",
      skills: ["Orientation", "Découverte des métiers", "Projet professionnel"],
      material: ["Smartphone"],
      goals: ["Découvrir des métiers en tension", "Comprendre l'orientation", "Construire son projet"],
      staff: true,
      badges: ["Orientation", "Éducatif"],
      collection: "Orientation & métiers",
      featured: false,
      nbBalises: 8
    },
    {
      id: "phantom-cybersecurite",
      nom: "Phantom — Cybersécurité",
      tagline: "L'ennemi, ce sont nos décisions",
      cover: "phantom-cybersecurite",
      accent: "#1a1a2e",
      emoji: "👻",
      difficulty: "moyen",
      durationMin: 90,
      players: [1, 6],
      location: "Roeulx (France)",
      environment: "extérieur",
      skills: ["Cybersécurité", "Esprit critique", "Vie privée"],
      material: ["Smartphone"],
      goals: ["Reconnaître le phishing", "Protéger son identité numérique", "Comprendre l'ingénierie sociale"],
      staff: false,
      badges: ["Éducatif", "Numérique"],
      collection: "Cybersécurité & numérique",
      featured: true,
      nbBalises: 9
    },
    {
      id: "tsle1-ornithologie",
      nom: "La toile sous les étoiles",
      tagline: "Écoutez les chants d'oiseaux",
      cover: "tsle1-ornithologie",
      accent: "#16a085",
      emoji: "🦉",
      difficulty: "facile",
      durationMin: 80,
      players: [1, 8],
      location: "Camping nature d'Auzances (Creuse)",
      environment: "extérieur",
      skills: ["Observation", "Écoute", "Connaissance du vivant"],
      material: ["Smartphone"],
      goals: ["Identifier les oiseaux par le chant", "Observer la faune locale", "Se reconnecter à la nature"],
      staff: false,
      badges: ["Nature", "Éducatif"],
      collection: "Nature & vivant",
      featured: true,
      nbBalises: 8
    }
  ];

  var byCollection = {};
  packs.forEach(function (p) {
    if (!byCollection[p.collection]) byCollection[p.collection] = [];
    byCollection[p.collection].push(p.id);
  });

  var collections = Object.keys(byCollection)
    .sort()
    .map(function (name) {
      return { nom: name, packs: byCollection[name] };
    });

  global.CATALOGUE_DATA = {
    version: 1,
    packs: packs,
    collections: collections
  };
})(typeof window !== "undefined" ? window : this);
