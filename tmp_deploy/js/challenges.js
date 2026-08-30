/* =========================================================
   Curi🧭s — Épreuves du tableau de bord organisateur
   Thème : esprit & biais cognitifs.
   Ce fichier n'est chargé QUE par dashboard.html : la réponse
   des épreuves ne part jamais vers les participants (le serveur
   la retire du flux /api/board).
   ========================================================= */

const CHALLENGES = [
  {
    id: "enquete-confirmation", type: "enquete", answer: "le biais de confirmation",
    title: "Avoir toujours raison",
    question: "On ne retient que les preuves qui nous donnent raison et on ignore les autres. De quel biais s'agit-il ?",
    hint: "Pense à ce que fait un « oui-man » de ton cerveau.",
  },
  {
    id: "enquete-ancrage", type: "enquete", answer: "l'effet d'ancrage",
    title: "Le prix barré",
    question: "« Barré à 100 €, vendu 39 € ! » Quel effet cognitif rend cette affaire si séduisante ?",
    hint: "Le premier chiffre reste collé dans la tête, comme un bateau…",
  },
  {
    id: "chant-verite", type: "chant", answer: "l'illusion de la vérité",
    title: "Répète, répète",
    question: "Plus une information est répétée, plus elle paraît vraie — même fausse. Quelle illusion est-ce ?",
    hint: "Écoutez bien le signal sonore : il se répète sans fin.",
  },
  {
    id: "observation-biais", type: "observation", answer: "",
    title: "Chasse aux biais",
    question: "Trouvez en famille UN exemple de biais dans votre journée (pub, discussion, écran). Racontez-le en 3 phrases !",
    hint: "Regardez les slogans, les promos, les horoscopes…",
  },
  {
    id: "rapidite-devin", type: "rapidite", answer: "",
    title: "Le devin Barnum",
    question: "Chaque famille invente une « prédiction » tellement floue qu'elle convient à tout le monde. La meilleure gagne !",
    hint: "« Tu aimes parfois être seul·e… » : attention, ça marche pour tous !",
  },
  {
    id: "enquete-halo", type: "enquete", answer: "l'effet halo",
    title: "L'auréole du champion",
    question: "Une star sourit dans une pub et on croit que son produit est génial. Quel effet joue ici ?",
    hint: "Son nom vient du cercle de lumière des saints.",
  },
  {
    id: "chant-ancrage", type: "chant", answer: "l'effet d'ancrage",
    title: "Le son grave qui tient",
    question: "Quel effet commence toujours par une première information qui « mouille » toute ta réflexion ?",
    hint: "La signature sonore commence par une note très grave.",
  },
  {
    id: "observation-memorie", type: "observation", answer: "",
    title: "Mémoire sélective",
    question: "En 2 minutes, citez chacun UN souvenir de la semaine. Comparez : qui se souvient des mêmes choses ? Pourquoi ?",
    hint: "Ce qui est récent ou émouvant revient plus vite.",
  },
  {
    id: "enquete-dunning", type: "enquete", answer: "l'effet Dunning-Kruger",
    title: "Trop sûr de soi",
    question: "Les grands débutants se surestiment souvent ; les experts doutent. Comment s'appelle cet effet ?",
    hint: "Deux noms de chercheurs collés ensemble.",
  },
  {
    id: "enquete-sunk", type: "enquete", answer: "le coût irrécupérable",
    title: "Le film nul",
    question: "Vous restez jusqu'au bout d'un film ennuyeux « puisque les places sont payées ». Quel sophisme est-ce ?",
    hint: "L'argent dépensé ne reviendra jamais…",
  },
  {
    id: "rapidite-reflexe", type: "rapidite", answer: "",
    title: "Vrai ou faux, vite !",
    question: "L'organisateur lit une info : chaque famille crie « SOURCE ! » dès qu'elle doute. La plus rapide gagne !",
    hint: "Vérifier la source avant de croire : le meilleur réflexe.",
  },
  {
    id: "enquete-dispo", type: "enquete", answer: "le biais de disponibilité",
    title: "Vu à la télé !",
    question: "Un événement très médiatisé semble plus fréquent qu'il ne l'est. Comment s'appelle ce raccourci mental ?",
    hint: "Facile à retrouver en mémoire ≠ fréquent.",
  },
  {
    id: "observation-devinettes", type: "observation", answer: "",
    title: "Devinettes du cerveau",
    question: "Inventez en famille une petite devinette sur un biais vu aujourd'hui, puis posez-la à une autre équipe !",
    hint: "Choisissez votre biais préféré du parcours.",
  },
  {
    id: "enquete-barnum", type: "enquete", answer: "l'effet Barnum",
    title: "Ton portrait robot",
    question: "« Tu es curieux·se, parfois distrait·e, et tu aimes être apprécié·e. » Pourquoi ça convient à presque tout le monde ?",
    hint: "Cirque sous les étoiles : P.T. …",
  },
];

function randomChallenge(type) {
  const pool = type ? CHALLENGES.filter((c) => c.type === type) : CHALLENGES;
  const list = pool.length ? pool : CHALLENGES;
  return list[Math.floor(Math.random() * list.length)];
}

function challengeTypes() {
  const seen = {};
  CHALLENGES.forEach((c) => { seen[c.type] = true; });
  return Object.keys(seen);
}
