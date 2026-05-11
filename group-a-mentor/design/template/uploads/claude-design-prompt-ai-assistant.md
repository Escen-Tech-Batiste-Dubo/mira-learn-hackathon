# Prompt Claude Design — Groupe A — Add-on : assistant IA candidature

> Prompt d'incrément à coller dans Claude Design pour enrichir la maquette `/mentors/apply` déjà générée.

---

## CONTEXTE (RAPPEL TRÈS COURT)

La maquette Mira Mentors (Groupe A — annuaire, fiche détail, formulaire de candidature, backoffice modération) est déjà faite. Mêmes tokens : `#E6332A` mira-red, `#EFEAE5` warm-beige, `#1D1D1B` charcoal, `#D4A853` gold, fonts Manrope + Playfair Display, cards radius 16 sans ombre, boutons 44 px radius 12.

## CE QUI MANQUE DANS LE TUNNEL `/mentors/apply`

Je veux **ajouter deux éléments d'assistance IA** dans l'écran de candidature, pour aider le nomade à se positionner et à se projeter immédiatement comme mentor.

### Élément 1 — Panneau "Mira AI te propose des classes" (must-have)

**Quand ça apparaît** : juste après la section "Skills" du formulaire (donc après que le candidat a saisi ≥ 3 skills, ce qui est requis pour soumettre).

**Comportement** :
- Loader skeleton pendant ~5 s (call OpenRouter) : 3 cards grises pulsantes
- Puis 3 cards de **classes suggérées** générées par IA en croisant : ses skills × demande apprenants × offre mentor actuelle

**Anatomie d'une suggestion card** :
- **Header** : titre suggéré (Playfair Display 20 px) + petit badge demande
- **Description** : 3-4 lignes, ton chaleureux, FR
- **Skills couvertes** : chips (la principale en chip sage-soft primaire)
- **Demand signal** (élément clé) : ligne avec icône + texte coloré
  - Très demandé : `🔥 47 nomades cherchent cette skill — 0 mentor l'enseigne actuellement` (color: mira-red, gras)
  - Demandé : `👥 22 nomades cherchent — 1 mentor l'enseigne` (color: gold)
  - Confort : `🌱 Sujet émergent — peu de demande mais bon positionnement` (color: muted)
- **Footer actions** : 3 boutons
  - `✓ Adopter cette suggestion` (primary — préremplit un draft `mira_class`)
  - `✎ Modifier` (secondary — ouvre l'édition inline)
  - `✗ Pas pour moi` (ghost — rejette + regenerate cette ligne)

**Footer du panneau** :
- Lien discret `↻ Regénérer 3 nouvelles suggestions` (si toutes rejetées ou non satisfaisantes)
- Mention : "Mira AI utilise OpenRouter · ces suggestions sont confidentielles tant que tu n'as pas adopté."

**Important — UX writing** (tutoiement FR chaleureux) :
- Titre du panneau : "Mira AI t'a préparé 3 classes que tu pourrais animer"
- Sous-titre : "On a croisé tes skills avec ce que nos apprenants cherchent. Adopte, modifie, ou demande-nous d'autres idées."

### Élément 2 — Coach Mira flottant (nice-to-have)

**Quand ça apparaît** : sidebar fixe à droite du formulaire (desktop uniquement, hidden mobile), 320 px de large.

**Anatomie** :
- Card sticky : avatar rond illustré "Mira" (dégradé chaleureux beige → rouge), nom "Mira", petit chip "AI Coach"
- Bulles de conseil contextuelles (1 à la fois, transition fade-in à chaque changement de section du form) :
  - **Pendant la bio** : "Vise 150-200 caractères pour ta bio courte. Une phrase = ce que tu fais bien · ce que tu veux transmettre. Exemple : "Ex-VC, j'aide les fondateurs à pitcher pour leur première levée."
  - **Pendant le parcours** : "Mets ton plus gros résultat chiffré en haut. 200K€ ARR, 50M€ closed, 10 ans d'XP — tout ce qui ancre."
  - **Pendant la motivation** : "Ton 'pourquoi' compte plus que ton CV. Pourquoi maintenant ? Qu'est-ce qui te ferait aimer accompagner d'autres nomades ?"
  - **Avant submit** : "Ta candidature est solide. Tu peux la soumettre — un admin te répond sous 48 h."
- Optionnel : input "Demande-moi quelque chose" en bas, pour Q&A libre avec OpenRouter

## CONTRAINTES D'INTÉGRATION

- **Garder l'aspect tunnel** : pas de modal qui interrompt, le panneau IA s'insère naturellement dans le scroll du form. Le coach est en sidebar, non bloquant.
- **Cohérence**: même typographie Playfair sur les titres de cards, Manrope ailleurs. Couleurs uniquement depuis la palette Mira définie.
- **État vide** : si OpenRouter rate, montrer un message bienveillant "Mira AI réfléchit encore — tu peux soumettre sans, tu verras les suggestions dans ton dashboard mentor une fois validé."
- **Loading state** : skeleton pulse beige-deep (pas spinner), 5 s max.
- **Accessibility** : Le panneau et le coach doivent être skippables au clavier (l'utilisateur n'est pas forcé d'interagir avec eux pour soumettre).

## CONTENU RÉALISTE POUR LA MAQUETTE

Si Emma Rossi (candidate démo, headline "Designer brand + content créatrice DTC", skills : Brand design, Content strategy, Webflow) remplit son tunnel, Mira AI lui suggère :

**Suggestion 1 — "Construire ta brand DTC en 30 jours"**
- Description : "De zéro à une identité de marque cohérente : positioning, naming, design system minimaliste. Pour fondateurs solo qui lancent leur première DTC."
- Skills : Brand design (primary), Content strategy
- Demand : 🔥 31 nomades cherchent — 1 mentor l'enseigne actuellement
- Actions : Adopter · Modifier · Pas pour moi

**Suggestion 2 — "Webflow pro : du landing au site converting"**
- Description : "Construire un site Webflow qui convertit, sans dev. CMS, animations, SEO de base — en pratique sur ton propre projet."
- Skills : Webflow (primary), UI Design
- Demand : 👥 22 nomades cherchent — 4 mentors l'enseignent
- Actions : Adopter · Modifier · Pas pour moi

**Suggestion 3 — "Content stratégie pour solo founders"**
- Description : "Définir sa ligne édito, son pipeline de contenu, ses canaux. Pour ceux qui veulent vendre via le contenu sans devenir créateur full-time."
- Skills : Content strategy (primary), Brand design
- Demand : 🌱 Sujet émergent — 12 nomades, 0 mentor
- Actions : Adopter · Modifier · Pas pour moi

## DEMANDE FINALE

Génère **le tunnel `/mentors/apply` enrichi** avec le panneau "Mira AI te propose des classes" intégré entre la section Skills et la section CV, et **optionnellement** la sidebar Coach Mira à droite du form (toggle possible avec une checkbox dans ton output : "Avec coach Mira" / "Sans coach").

Si tu hésites sur le placement du panneau : préfère **inline dans le scroll** (pas modal). Si tu hésites sur le ton du coach : préfère **conseils courts et concrets** (max 2 phrases), pas le ton ChatGPT générique. Si tu hésites sur les illustrations Mira : préfère **un dégradé abstrait warm** (beige → rouge subtil) plutôt qu'une illustration de personnage.
