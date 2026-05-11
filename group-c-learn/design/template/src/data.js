// Mira Learn — data fixtures
// Anna Lopez (logged-in persona), 3 mentors, 3 classes, sessions, community members.

window.MiraData = (() => {
  const skills = {
    pitch: { id: 'pitch', label: 'Pitch investor' },
    funding: { id: 'funding', label: 'Funding strategy' },
    storytelling: { id: 'storytelling', label: 'Storytelling' },
    ui: { id: 'ui', label: 'UI Design' },
    figma: { id: 'figma', label: 'Figma' },
    growth: { id: 'growth', label: 'Growth B2B' },
    sales: { id: 'sales', label: 'Sales outbound' },
    publicspeaking: { id: 'publicspeaking', label: 'Public speaking' },
  };

  const mentors = {
    antoine: {
      id: 'antoine',
      name: 'Antoine Martin',
      headline: 'Ex-founder, levée 2M€. Coach pitch & fundraising.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80',
      rating: 4.8, reviews: 47, classes: 2,
    },
    marie: {
      id: 'marie',
      name: 'Marie Dupont',
      headline: 'Product designer SaaS (Pennylane, Lydia). 8 ans.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&q=80',
      rating: 4.9, reviews: 32, classes: 3,
    },
    david: {
      id: 'david',
      name: 'David Cohen',
      headline: 'Growth lead — scale-ups B2B, $0→$10M ARR.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&q=80',
      rating: 4.7, reviews: 28, classes: 2,
    },
  };

  const classes = [
    {
      slug: 'pitch',
      title: 'Pitcher pour lever 500k €',
      subtitle: 'Construis ton deck investor + délivre ton pitch oral avec confiance.',
      mentor: 'antoine',
      price: 80,
      duration: '6 semaines',
      format: 'Hybride',
      cohortSize: 8,
      rating: 4.8, reviews: 47,
      skills: ['pitch', 'funding', 'storytelling'],
      primarySkill: 'pitch',
      photo: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=750&fit=crop&q=80',
      category: 'Business',
      description: `Ce cours t'apprend à construire un narratif investor qui résonne, à designer un deck visuel qui te démarque, et à délivrer ton pitch avec la posture d'un fondateur qui sait où il va. À la fin des 6 semaines, tu as un deck prêt à envoyer et tu as pitché 5 fois devant un panel.\n\nOn travaille en cohorte de 8 max. Tu repars avec un deck validé par 3 investisseurs partenaires de la class, et 1h de coaching individuel avec moi.`,
      modules: [
        { n: 1, title: 'Construire le narratif investor', dur: '3 h', desc: 'Storytelling, problème, solution, why now.' },
        { n: 2, title: 'Design + délivery du deck', dur: '4 h', desc: 'Deck visuel + pitch oral.' },
        { n: 3, title: 'Modélisation financière simple', dur: '2 h', desc: 'Top-down, bottom-up, runway.' },
        { n: 4, title: 'Ronds d\'investisseurs simulés', dur: '3 h', desc: 'Pitch live + Q&A face à 3 VCs.' },
      ],
      sessions: [
        { id: 's1', location: 'Barcelone, Espagne', mode: 'physical', dates: '5–26 juillet 2026', format: 'Hybride', seats: 8, enrolled: 3, waitlist: 1, status: 'open' },
        { id: 's2', location: 'Virtuel — sessions live + replays', mode: 'virtual', dates: 'Démarre 1er sept 2026', format: 'Virtuel', seats: 10, enrolled: 0, waitlist: 0, status: 'open' },
      ],
    },
    {
      slug: 'ui-saas',
      title: 'UI Design pour SaaS B2B',
      subtitle: 'Apprends à designer des produits SaaS qui convertissent et que les équipes adorent.',
      mentor: 'marie',
      price: 60,
      duration: '5 semaines',
      format: 'Virtuel',
      cohortSize: 10,
      rating: 4.9, reviews: 32,
      skills: ['ui', 'figma'],
      primarySkill: 'ui',
      photo: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=1200&h=750&fit=crop&q=80',
      category: 'Design',
      description: `Pour les designers qui veulent passer du visuel au produit. On couvre design systems, dashboards, onboarding, formulaires complexes — bref tout ce qui fait la vie d'un designer SaaS B2B.\n\nLivrable final : ton portfolio repensé avec 2 case studies SaaS solides.`,
      modules: [
        { n: 1, title: 'Design systems pour SaaS', dur: '3 h', desc: 'Tokens, components, accessibilité.' },
        { n: 2, title: 'Dashboards & data dense', dur: '4 h', desc: 'Tables, charts, density.' },
        { n: 3, title: 'Onboarding & first-run UX', dur: '3 h', desc: 'Activation, empty states.' },
        { n: 4, title: 'Case study & portfolio', dur: '3 h', desc: 'Storytelling produit.' },
      ],
      sessions: [
        { id: 's3', location: 'Virtuel — sessions live + replays', mode: 'virtual', dates: '12 mai – 16 juin 2026', format: 'Virtuel', seats: 10, enrolled: 7, waitlist: 0, status: 'open' },
      ],
    },
    {
      slug: 'growth',
      title: 'Growth B2B en 8 semaines',
      subtitle: 'Construis ta machine de growth : outbound, contenu, paid. De $0 à tes 10 premiers clients.',
      mentor: 'david',
      price: 49,
      duration: '8 semaines',
      format: 'Virtuel',
      cohortSize: 12,
      rating: 4.7, reviews: 28,
      skills: ['growth', 'sales'],
      primarySkill: 'growth',
      photo: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1200&h=750&fit=crop&q=80',
      category: 'Business',
      description: `Programme pratique pour fondateurs B2B early-stage. Chaque semaine = une mécanique de growth à tester sur ton propre produit. Tu repars avec ton playbook outbound personnalisé.`,
      modules: [
        { n: 1, title: 'ICP & positionnement', dur: '2 h', desc: 'Qui, où, pourquoi maintenant.' },
        { n: 2, title: 'Outbound qui convertit', dur: '4 h', desc: 'Séquences, tonalité, follow-ups.' },
        { n: 3, title: 'Content engine B2B', dur: '3 h', desc: 'LinkedIn, SEO, distribution.' },
        { n: 4, title: 'Mesure & itération', dur: '2 h', desc: 'Funnels, dashboards, runrate.' },
      ],
      sessions: [
        { id: 's4', location: 'Virtuel — sessions live + replays', mode: 'virtual', dates: 'Démarre 8 juin 2026', format: 'Virtuel', seats: 12, enrolled: 9, waitlist: 0, status: 'open' },
      ],
    },
  ];

  const anna = {
    id: 'anna',
    name: 'Anna Lopez',
    initials: 'AL',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=80',
    headline: 'Nomad designer en transition vers le SaaS',
    city: 'Lisbonne, PT',
    country: 'pt',
    flag: '🇵🇹',
    since: 'nomade depuis 2021',
    skillsTarget: ['pitch', 'funding'],
    primaryTarget: 'pitch',
    skillsValidated: [],
    visibility: 'public',
    enrolments: [
      { classSlug: 'pitch', status: 'applied', when: 'il y a 2 j' },
    ],
    pathGenerated: true,
    pathHorizon: '6 mois',
    pathBudget: 80,
  };

  const community = [
    { id: 'anna', name: 'Anna Lopez', city: 'Lisbonne, PT', flag: '🇵🇹', since: 'nomade depuis 2021', target: ['Pitch investor', 'Funding strategy'], validated: [], avatar: anna.avatar, lat: 38.72, lng: -9.14 },
    { id: 'marco', name: 'Marco Silva', city: 'Florianópolis, BR', flag: '🇧🇷', since: 'nomade depuis 2023', target: ['UI Design'], validated: ['Figma'], avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80', lat: -27.6, lng: -48.5 },
    { id: 'lea', name: 'Léa Bauer', city: 'Berlin, DE', flag: '🇩🇪', since: 'nomade depuis 2024', target: [], validated: [], avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&q=80', lat: 52.52, lng: 13.40 },
    { id: 'tom', name: 'Tom Evans', city: 'Bali, ID', flag: '🇮🇩', since: 'nomade depuis 2020', target: ['Public speaking'], validated: ['Pitch investor', 'Funding strategy'], avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80&sig=2', lat: -8.65, lng: 115.21, completed: true },
    { id: 'sofia', name: 'Sofia Reyes', city: 'Mexico City, MX', flag: '🇲🇽', since: 'nomade depuis 2022', target: ['Growth B2B'], validated: [], avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&q=80', lat: 19.43, lng: -99.13 },
    { id: 'kenji', name: 'Kenji Watanabe', city: 'Chiang Mai, TH', flag: '🇹🇭', since: 'nomade depuis 2019', target: ['Sales outbound'], validated: ['Public speaking'], avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&q=80', lat: 18.78, lng: 98.99 },
  ];

  const testimonials = [
    { author: 'Clara, ex-product manager', quote: 'J\'ai lancé ma SaaS 4 mois après ma class avec Antoine. Le deck a survécu à 18 pitchs.', city: 'Mexico City' },
    { author: 'Yann, full-stack dev', quote: 'Mira Class, c\'est l\'inverse d\'un MOOC. Tu fais, tu rates, on te récupère. Ça change tout.', city: 'Lisbonne' },
    { author: 'Inès, designer', quote: 'Marie m\'a appris à penser produit, pas écran. Mon book a triplé d\'opportunités.', city: 'Bali' },
  ];

  return {
    skills, mentors, classes, anna, community, testimonials,
    classBySlug: (slug) => classes.find(c => c.slug === slug),
    skillLabel: (id) => skills[id]?.label || id,
  };
})();
