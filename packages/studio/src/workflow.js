/* workflow.js — Moteur de workflow guidé du Studio Curios
 *
 * 6 étapes : Objectifs → Public → Territoire → Missions → Tests → Publication
 * Chaque étape a des champs obligatoires et une validation.
 */

export const STEPS = [
  {
    id: "objectifs",
    label: "Objectifs",
    icon: "🎯",
    description: "Définir le titre, la thématique et les objectifs pédagogiques",
    fields: ["title", "theme", "objectives"],
    required: ["title", "theme"],
  },
  {
    id: "public",
    label: "Public",
    icon: "team",
    description: "Cibler le public participants et définir le niveau de difficulté",
    fields: ["audience", "difficulty", "duration"],
    required: ["audience"],
  },
  {
    id: "territoire",
    label: "Territoire",
    icon: "map",
    description: "Choisir le lieu, placer les balises et dessiner le sentier",
    fields: ["location", "trail", "balises"],
    required: ["location"],
  },
  {
    id: "missions",
    label: "Missions",
    icon: "🧩",
    description: "Créer les énigmes, quiz et découvertes pour chaque balise",
    fields: ["discoveries", "enigmas", "quiz"],
    required: ["discoveries"],
  },
  {
    id: "evenements",
    label: "Événements",
    icon: "⚡",
    description: "Configurer les événements dynamiques : déclencheurs, conditions et actions",
    fields: ["events"],
    required: [],
  },
  {
    id: "debriefing",
    label: "Débriefing",
    icon: "📋",
    description: "Préparer le bilan pédagogique et les questions de réflexion",
    fields: ["debriefing"],
    required: [],
  },
  {
    id: "tests",
    label: "Tests",
    icon: "check",
    description: "Vérifier la cohérence, tester les réponses et valider le parcours",
    fields: ["validation", "preview"],
    required: [],
  },
  {
    id: "publication",
    label: "Publication",
    icon: "🚀",
    description: "Exporter le bundle et publier le parcours",
    fields: ["export", "publish"],
    required: [],
  },
];

export function createWorkflow() {
  const state = {
    currentStep: 0,
    completedSteps: new Set(),
    data: {
      // Step 1: Objectifs
      title: "",
      theme: "",
      objectives: [],

      // Step 2: Public
      audience: { minAge: 6, maxAge: 99 },
      difficulty: "moyen",
      duration: 60,

      // Step 3: Territoire
      location: {
        name: "",
        region: "",
        center: { lat: 0, lng: 0 },
        proximityRadius: 15,
        hintRadius: 250,
      },
      trail: {
        label: "Sentier",
        path: [],
      },
      balises: [],

      // Step 4: Missions
      discoveries: [],
      enigmas: [],
      quiz: [],

      // Step 5: Événements
      events: [],

      // Step 6: Débriefing
      debriefing: {
        questions: [],
        competences: [],
        summaryTemplate: "",
      },

      // Step 7: Tests
      validation: {
        errors: [],
        warnings: [],
        passed: false,
      },

      // Step 6: Publication
      export: {
        format: "curios-parcours",
        version: 1,
        published: false,
      },
    },
  };

  function canGoNext() {
    const step = STEPS[state.currentStep];
    if (!step) return false;

    // Vérifier les champs obligatoires
    for (const field of step.required) {
      const value = state.data[field];
      if (value === null || value === undefined) return false;
      if (typeof value === "string" && !value.trim()) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (typeof value === "object" && !Array.isArray(value)) {
        // Pour les objets, vérifier qu'au moins un champ est rempli
        if (Object.values(value).every((v) => !v)) return false;
      }
    }

    return true;
  }

  function canGoPrev() {
    return state.currentStep > 0;
  }

  function goNext() {
    if (!canGoNext()) return false;
    state.completedSteps.add(state.currentStep);
    state.currentStep++;
    return true;
  }

  function goPrev() {
    if (!canGoPrev()) return false;
    state.currentStep--;
    return true;
  }

  function goToStep(index) {
    if (index < 0 || index >= STEPS.length) return false;
    // On ne peut aller qu'à une étape déjà complétée ou la suivante
    if (index > state.currentStep + 1) return false;
    if (index > state.currentStep && !canGoNext()) return false;

    if (index > state.currentStep) {
      state.completedSteps.add(state.currentStep);
    }
    state.currentStep = index;
    return true;
  }

  function updateData(path, value) {
    const keys = path.split(".");
    let obj = state.data;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (obj[key] === undefined) obj[key] = {};
      obj = obj[key];
    }
    obj[keys[keys.length - 1]] = value;
  }

  function getData(path) {
    if (!path) return state.data;
    const keys = path.split(".");
    let obj = state.data;
    for (const key of keys) {
      if (obj === undefined) return undefined;
      obj = obj[key];
    }
    return obj;
  }

  function addBalise() {
    const id = `B${state.data.balises.length + 1}`;
    state.data.balises.push({
      id,
      code: `CODE-${id}`,
      label: `Balise ${id}`,
      bird: null,
      x: 0,
      y: 0,
      lat: 0,
      lng: 0,
      enigmes: {
        facile: { text: "", answers: [], indice: "", saviez: "" },
        moyen: { text: "", answers: [], indice: "", saviez: "" },
        difficile: { text: "", answers: [], indice: "", saviez: "" },
      },
    });
    return id;
  }

  function removeBalise(id) {
    state.data.balises = state.data.balises.filter((b) => b.id !== id);
  }

  function addDiscovery() {
    const id = `decouverte-${state.data.discoveries.length + 1}`;
    state.data.discoveries.push({
      id,
      nom: "",
      latin: "",
      emoji: "🔍",
      category: "defaut",
      color: "#073B5C",
      size: "",
      photo: null,
      audioFile: null,
      anecdotes: [],
      quiz: [],
    });
    return id;
  }

  function removeDiscovery(id) {
    state.data.discoveries = state.data.discoveries.filter((d) => d.id !== id);
  }

  function addEvent() {
    const id = `event-${state.data.events.length + 1}`;
    state.data.events.push({
      id,
      type: "BALISE_FOUND",
      trigger: "always",
      conditions: [],
      actions: [],
      description: "",
    });
    return id;
  }

  function removeEvent(id) {
    state.data.events = state.data.events.filter((e) => e.id !== id);
  }

  function addDebriefQuestion() {
    const id = `q-${state.data.debriefing.questions.length + 1}`;
    state.data.debriefing.questions.push({
      id,
      text: "",
      category: "reflection",
    });
    return id;
  }

  function removeDebriefQuestion(id) {
    state.data.debriefing.questions = state.data.debriefing.questions.filter((q) => q.id !== id);
  }

  function addCompetence() {
    state.data.debriefing.competences.push({
      name: "",
      description: "",
      evaluationCriteria: [],
    });
  }

  function removeCompetence(index) {
    state.data.debriefing.competences.splice(index, 1);
  }

  function validate() {
    const errors = [];
    const warnings = [];

    // Step 1
    if (!state.data.title.trim()) errors.push("Titre manquant");
    if (!state.data.theme.trim()) errors.push("Thème manquant");

    // Step 2
    if (state.data.audience.minAge > state.data.audience.maxAge) {
      errors.push("Âge minimum > âge maximum");
    }

    // Step 3
    if (!state.data.location.name.trim()) errors.push("Nom du lieu manquant");
    if (state.data.balises.length === 0) warnings.push("Aucune balise définie");

    // Step 4
    if (state.data.discoveries.length === 0) warnings.push("Aucune découverte définie");

    // Cross-validation
    for (const balise of state.data.balises) {
      if (!balise.label.trim()) errors.push(`Balise ${balise.id} : label manquant`);
      if (balise.lat === 0 && balise.lng === 0) warnings.push(`Balise ${balise.id} : pas de coordonnées GPS`);
      if (!balise.bird) warnings.push(`Balise ${balise.id} : pas de découverte associée`);

      for (const level of ["facile", "moyen", "difficile"]) {
        const enigme = balise.enigmes[level];
        if (!enigme.text.trim()) warnings.push(`Balise ${balise.id} ${level} : énigme vide`);
        if (enigme.answers.length === 0) warnings.push(`Balise ${balise.id} ${level} : pas de réponses`);
      }
    }

    for (const discovery of state.data.discoveries) {
      if (!discovery.nom.trim()) errors.push(`Découverte ${discovery.id} : nom manquant`);
      if (discovery.quiz.length === 0) warnings.push(`Découverte ${discovery.id} : pas de quiz`);
    }

    // Step 5: Événements
    for (const event of state.data.events) {
      if (!event.type) errors.push(`Événement ${event.id} : type manquant`);
      if (!event.description.trim()) warnings.push(`Événement ${event.id} : pas de description`);
    }

    // Step 6: Débriefing
    if (state.data.debriefing.questions.length === 0) {
      warnings.push("Aucune question de débriefing définie");
    }
    for (const q of state.data.debriefing.questions) {
      if (!q.text.trim()) errors.push(`Question ${q.id} : texte manquant`);
    }

    state.data.validation = {
      errors,
      warnings,
      passed: errors.length === 0,
    };

    return { errors, warnings, passed: errors.length === 0 };
  }

  function toParcours() {
    const stations = state.data.balises.map((b) => ({
      id: b.id,
      label: b.label,
      code: b.code,
      lat: b.lat,
      lng: b.lng,
      x: b.x,
      y: b.y,
      birdId: b.bird,
      missions: Object.entries(b.enigmes).flatMap(([level, enigme]) => {
        if (!enigme.text.trim()) return [];
        return [
          {
            id: `${b.id}-${level}`,
            type: "enigme",
            stationId: b.id,
            difficulty: level,
            text: enigme.text,
            answers: enigme.answers,
            indice: enigme.indice,
            saviez: enigme.saviez,
          },
        ];
      }),
    }));

    const missions = state.data.discoveries.flatMap((d) => {
      const quizMissions = d.quiz.map((q, i) => ({
        id: `${d.id}-quiz-${i}`,
        type: "quiz",
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
      }));
      return quizMissions;
    });

    const events = state.data.events.map((e) => ({
      id: e.id,
      type: e.type,
      trigger: e.trigger,
      conditions: e.conditions,
      actions: e.actions,
    }));

    const debriefing = {
      questions: state.data.debriefing.questions.map((q) => ({
        id: q.id,
        text: q.text,
        category: q.category,
      })),
      competences: state.data.debriefing.competences.map((c) => ({
        name: c.name,
        description: c.description,
        evaluationCriteria: c.evaluationCriteria,
      })),
      summaryTemplate: state.data.debriefing.summaryTemplate,
    };

    return {
      $format: "curios-parcours",
      $version: 1,
      id: state.data.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      title: state.data.title,
      metadata: {
        theme: state.data.theme,
        objectives: state.data.objectives,
        version: 1,
        createdAt: new Date().toISOString(),
      },
      audience: state.data.audience,
      location: {
        name: state.data.location.name,
        region: state.data.location.region,
        center: state.data.location.center,
        proximityRadius: state.data.location.proximityRadius,
        hintRadius: state.data.location.hintRadius,
      },
      trail: state.data.trail,
      stations,
      missions,
      events,
      debriefing,
    };
  }

  return {
    STEPS,
    state,
    canGoNext,
    canGoPrev,
    goNext,
    goPrev,
    goToStep,
    updateData,
    getData,
    addBalise,
    removeBalise,
    addDiscovery,
    removeDiscovery,
    addEvent,
    removeEvent,
    addDebriefQuestion,
    removeDebriefQuestion,
    addCompetence,
    removeCompetence,
    validate,
    toParcours,
  };
}
