// Screen 7: /dashboard/quizzes/{id} — QCM Editor with AI generation

const SAMPLE_QUESTIONS = [
  {
    id: 'q1',
    prompt: "Quel est le bon ordre dans un pitch deck investor ?",
    options: [
      { id: 'a', text: "Solution → Problème → Traction" },
      { id: 'b', text: "Problème → Solution → Traction", correct: true },
      { id: 'c', text: "Traction → Problème → Solution" },
      { id: 'd', text: "Pitch → Problème → Traction" },
    ],
    explanation: "On commence toujours par le problème (sinon ton fund n'a pas de contexte), avant de présenter la solution et la traction comme preuve.",
  },
  {
    id: 'q2',
    prompt: "La slide 3 d'un pitch deck doit montrer…",
    options: [
      { id: 'a', text: "Le market size (TAM/SAM/SOM)" },
      { id: 'b', text: "La traction (chiffres, MRR, NPS)", correct: true },
      { id: 'c', text: "L'équipe" },
      { id: 'd', text: "Les concurrents" },
    ],
  },
  {
    id: 'q3',
    prompt: "Devant un fund early-stage, quelle métrique single-handedly fait la différence ?",
    options: [
      { id: 'a', text: "Le CAC" },
      { id: 'b', text: "Le LTV/CAC ratio" },
      { id: 'c', text: "La croissance MoM des 6 derniers mois", correct: true },
      { id: 'd', text: "Le runway" },
    ],
  },
  {
    id: 'q4',
    prompt: "Quel est le pire moment pour parler de term sheet dans un pitch ?",
    options: [
      { id: 'a', text: "Slide 1 (ancrage prix)", correct: true },
      { id: 'b', text: "Slide finale" },
      { id: 'c', text: "Dans la Q&A si on te demande" },
      { id: 'd', text: "Dans un follow-up email" },
    ],
  },
  {
    id: 'q5',
    prompt: "Que faire face à une question hostile en Q&A ?",
    options: [
      { id: 'a', text: "Reformuler, valider la préoccupation, répondre", correct: true },
      { id: 'b', text: "Défendre ta position immédiatement" },
      { id: 'c', text: "Renvoyer à un autre membre de l'équipe" },
      { id: 'd', text: "Promettre une réponse écrite plus tard" },
    ],
  },
];

const QuizEditor = ({ quizId, navigate }) => {
  const [questions, setQuestions] = React.useState(SAMPLE_QUESTIONS);
  const [generating, setGenerating] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  const runAIGeneration = () => {
    setModalOpen(false);
    setGenerating(true);
    setQuestions([]);
    setTimeout(() => {
      setGenerating(false);
      setQuestions(SAMPLE_QUESTIONS);
      setToast("5 questions générées par Mira AI ✓");
      setTimeout(() => setToast(null), 4000);
    }, 2800);
  };

  return (
    <main className="main" data-screen-label="07 Quiz Editor">
      <TopBar
        crumbs={[
          { label: "Mes classes", onClick: () => navigate('/dashboard/classes') },
          { label: "Pitcher pour lever 500k €", onClick: () => navigate('/dashboard/classes/pitcher-500k') },
          { label: "Module 1 — Construire le narratif", onClick: () => navigate('/dashboard/classes/pitcher-500k?tab=modules') },
          { label: "QCM" }
        ]}
      />
      <div className="page">
        <header className="page-header">
          <div className="page-header-row">
            <div>
              <div className="row gap-8" style={{ alignItems: 'center', marginBottom: 6 }}>
                <button className="btn btn-ghost-muted sm" onClick={() => navigate('/dashboard/classes/pitcher-500k?tab=modules')} style={{padding: '0 6px'}}>
                  <I.ArrowLeft size={14}/> Module "Construire le narratif investor"
                </button>
              </div>
              <div className="row gap-12" style={{alignItems: 'center'}}>
                <h1 className="page-title" style={{fontSize: 28}}>Valider le narratif investor</h1>
                <StatusBadge status="published">Published</StatusBadge>
              </div>
              <p className="page-subtitle">Passing score : 70 % · 1 quiz du module · {questions.length} question{questions.length>1?'s':''}</p>
            </div>
            <div className="row gap-8">
              <Btn variant="secondary" icon={<I.Eye size={14}/>}>Aperçu apprenant</Btn>
              <Btn variant="primary" icon={<I.Sparkles size={14}/>} onClick={() => setModalOpen(true)}>
                Générer 5 questions avec Mira AI
              </Btn>
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'flex-start' }}>
          <div className="col gap-16">
            <Card title="Réglages du QCM" padding>
              <div className="card-section">
                <div className="field-row cols-3" style={{marginBottom: 0}}>
                  <Field label="Passing score" hint="%">
                    <input className="input" type="number" defaultValue="70" min="0" max="100"/>
                  </Field>
                  <Field label="Temps limite" hint="optionnel">
                    <div className="input input-prefix-wrap">
                      <input className="input-bare" type="number" defaultValue="15"/>
                      <span style={{padding: '0 12px', color: 'var(--muted)', fontSize: 12}}>min</span>
                    </div>
                  </Field>
                  <Field label="Tentatives autorisées">
                    <select className="input" defaultValue="2">
                      <option value="1">1 (une seule chance)</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="∞">Illimité</option>
                    </select>
                  </Field>
                </div>
              </div>
            </Card>

            <div className="row between">
              <h3 style={{margin: 0, fontSize: 14, fontWeight: 600}}>Questions ({questions.length})</h3>
              <div className="row gap-8">
                <Btn variant="ghost" size="sm" iconRight={<I.ChevronDown size={14}/>}>Trier</Btn>
                <Btn variant="ghost" size="sm" icon={<I.Sparkles size={14}/>} onClick={() => setModalOpen(true)}>Régénérer avec IA</Btn>
              </div>
            </div>

            {generating && <SkeletonQuestions count={5}/>}

            {!generating && questions.map((q, i) => (
              <QuestionCard key={q.id} q={q} idx={i+1}/>
            ))}

            {!generating && (
              <div style={{ padding: 16, border: '1px dashed var(--rule-strong)', borderRadius: 14, background: 'transparent', textAlign: 'center'}}>
                <Btn variant="ghost" icon={<I.Plus size={14}/>}>Ajouter une question</Btn>
                <span style={{fontSize:12, color:'var(--muted)', marginLeft: 12}}>ou <kbd className="kbd-hint">N</kbd></span>
              </div>
            )}
          </div>

          <div className="col gap-16">
            <Card title="État du QCM">
              <div className="col gap-12">
                <ChecklistItem done label="Au moins 3 questions" sub={`${questions.length} questions`}/>
                <ChecklistItem done label="Chaque question a une bonne réponse"/>
                <ChecklistItem label="Explication ajoutée" sub={`${questions.filter(q=>q.explanation).length}/${questions.length} questions`}/>
                <ChecklistItem done label="Lié à un module" sub="Module 1 — Narratif investor"/>
              </div>
              <div className="divider" style={{margin: '16px 0'}}/>
              <Btn variant="primary" disabled={questions.length < 3} style={{width: '100%', justifyContent: 'center'}} icon={<I.Send size={14}/>}>
                Publier ce QCM
              </Btn>
              <p style={{fontSize: 12, color: 'var(--muted)', margin: '8px 0 0', textAlign: 'center'}}>
                {questions.length < 3 ? `Minimum 3 questions (${questions.length} actuellement)` : 'Visible par les apprenants après publication'}
              </p>
            </Card>

            <Card title="Aperçu apprenant" padding>
              <div className="card-section" style={{padding: 16}}>
                <div className="eyebrow" style={{marginBottom: 4}}>Question 1 / {questions.length}</div>
                <div style={{fontSize: 14, fontWeight: 600, lineHeight: 1.4}}>
                  {questions[0]?.prompt || 'Pas encore de questions.'}
                </div>
                {questions[0] && (
                  <div className="col gap-6" style={{marginTop: 12}}>
                    {questions[0].options.slice(0, 4).map((o, i) => (
                      <div key={o.id} className="row gap-8" style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--rule)',
                        fontSize: 12,
                      }}>
                        <span style={{
                          width: 14, height: 14,
                          borderRadius: 99,
                          border: '1.5px solid var(--muted-soft)',
                          flex: 'none'
                        }}></span>
                        <span style={{color: 'var(--charcoal)', fontSize: 12.5}}>{o.text}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Btn variant="primary" size="sm" style={{marginTop: 14, width: '100%', justifyContent: 'center', height: 32}}>Valider →</Btn>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <AIGenerationModal open={modalOpen} onClose={() => setModalOpen(false)} onGenerate={runAIGeneration}/>

      {toast && (
        <div className="toast-stack">
          <Toast onClose={() => setToast(null)}>{toast}</Toast>
        </div>
      )}

      <AutosaveToast/>
    </main>
  );
};

const QuestionCard = ({ q, idx }) => (
  <div className="question-card hover-row">
    <div className="row between" style={{alignItems: 'flex-start'}}>
      <div style={{flex: 1}}>
        <div className="row gap-8" style={{alignItems: 'baseline'}}>
          <span className="qnum">Q{idx}.</span>
          <span className="qprompt">{q.prompt}</span>
        </div>
        <div className="qoptions">
          {q.options.map(o => (
            <div key={o.id} className={`qopt ${o.correct ? 'is-correct' : ''}`}>
              <span className="qopt-radio"></span>
              <span className="qopt-text">{o.text}</span>
              {o.correct && <span className="qopt-correct-label">bonne</span>}
            </div>
          ))}
        </div>
        {q.explanation && (
          <div style={{
            marginTop: 12,
            padding: '10px 12px',
            background: 'var(--warm-beige)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--charcoal)',
            lineHeight: 1.5,
            borderLeft: '2px solid var(--gold)',
          }}>
            <span className="eyebrow" style={{marginRight: 8}}>Explication</span>
            {q.explanation}
          </div>
        )}
      </div>
      <div className="row gap-4 reveal">
        <Btn variant="ghost" size="sm">Édit</Btn>
        <button className="btn btn-destructive icon sm"><I.Trash size={14}/></button>
        <button className="btn btn-ghost-muted icon sm"><I.MoreH size={14}/></button>
      </div>
    </div>
  </div>
);

const ChecklistItem = ({ done, label, sub }) => (
  <div className="row gap-10" style={{alignItems: 'flex-start'}}>
    <span style={{
      width: 18, height: 18,
      borderRadius: 99,
      background: done ? 'var(--success)' : 'transparent',
      border: done ? 'none' : '1.5px solid var(--rule-strong)',
      display: 'grid', placeItems: 'center',
      flex: 'none',
      marginTop: 1,
    }}>
      {done && <I.Check size={11} style={{color: 'white', strokeWidth: 3}}/>}
    </span>
    <div style={{flex: 1, fontSize: 13, lineHeight: 1.4}}>
      <div style={{ color: 'var(--charcoal)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const SkeletonQuestions = ({ count = 5 }) => (
  <div className="col gap-12">
    {Array.from({length: count}).map((_, i) => (
      <div key={i} className="question-card" style={{opacity: 1 - i * 0.1}}>
        <div className="row gap-8" style={{alignItems: 'baseline'}}>
          <span className="qnum" style={{opacity: 0.5}}>Q{i+1}.</span>
          <div className="skel" style={{height: 16, width: `${60 + Math.random()*30}%`}}/>
        </div>
        <div className="qoptions" style={{marginTop: 14}}>
          {Array.from({length: 4}).map((_, j) => (
            <div key={j} className="qopt" style={{cursor: 'default'}}>
              <span className="qopt-radio"></span>
              <div className="skel" style={{height: 12, width: `${40 + Math.random()*40}%`, flex: 1}}/>
            </div>
          ))}
        </div>
      </div>
    ))}
    <div className="row gap-8" style={{justifyContent: 'center', color: 'var(--muted)', fontSize: 13, padding: 12}}>
      <I.Sparkles size={14} style={{color: 'var(--mira-red)'}}/>
      Mira AI rédige tes 5 questions…
    </div>
  </div>
);

const AIGenerationModal = ({ open, onClose, onGenerate }) => {
  const [count, setCount] = React.useState(5);
  const [model, setModel] = React.useState('haiku');
  const stops = [3, 5, 7, 10];
  return (
    <Modal open={open} onClose={onClose}>
      <div className="drawer-header" style={{ borderBottom: '1px solid var(--rule)'}}>
        <div className="row gap-10">
          <div style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #E6332A 0%, #F39200 60%, #D4A853 100%)',
            display: 'grid', placeItems: 'center',
            color: 'white',
          }}>
            <I.Sparkles size={18}/>
          </div>
          <div>
            <h2 className="drawer-title">Mira AI te génère un QCM</h2>
            <p className="drawer-subtitle">Édite la description du module, je rédige les questions et choisis les bonnes réponses.</p>
          </div>
        </div>
        <button className="btn btn-ghost-muted icon sm" onClick={onClose}><I.X size={16}/></button>
      </div>
      <div className="drawer-body" style={{padding: '20px 24px'}}>
        <Field label="Description & niveau attendu" hint="je m'en sers comme contexte">
          <textarea className="textarea" rows={5} defaultValue="Module 1 — Construire le narratif investor. Niveau intermédiaire. L'apprenant doit savoir structurer un pitch en problème/solution/traction, identifier les slides clés d'un deck, et anticiper les questions hostiles de Q&A. Référence : framework Sequoia + best practices YC."/>
        </Field>

        <Field label="Nombre de questions">
          <div className="row gap-12">
            <input
              className="slider"
              type="range" min="3" max="10" value={count}
              onChange={e => setCount(+e.target.value)}
            />
            <div className="slider-stops">
              {stops.map(s => (
                <button key={s} className={`slider-stop ${count === s ? 'is-active' : ''}`} onClick={() => setCount(s)}>{s}</button>
              ))}
            </div>
          </div>
        </Field>

        <Field label="Modèle">
          <div className="col gap-8">
            <button
              className="row gap-10"
              onClick={() => setModel('haiku')}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                border: `1.5px solid ${model === 'haiku' ? 'var(--mira-red)' : 'var(--rule)'}`,
                background: model === 'haiku' ? 'rgba(230, 51, 42, 0.04)' : 'white',
                textAlign: 'left',
                cursor: 'pointer',
              }}>
              <span style={{
                width: 16, height: 16,
                borderRadius: 99,
                border: `1.5px solid ${model === 'haiku' ? 'var(--mira-red)' : 'var(--muted-soft)'}`,
                position: 'relative',
                flex: 'none',
              }}>
                {model === 'haiku' && <span style={{
                  position: 'absolute', inset: 3,
                  borderRadius: 99,
                  background: 'var(--mira-red)',
                }}/>}
              </span>
              <div style={{flex: 1}}>
                <div className="row gap-6">
                  <span style={{fontWeight: 600, fontSize: 13.5}}>Claude Haiku 4.5</span>
                  <Chip>rapide · ~10 s</Chip>
                </div>
                <div style={{fontSize: 12, color: 'var(--muted)', marginTop: 2}}>Idéal pour de la génération brouillon. Tu peaufines après.</div>
              </div>
            </button>
            <button
              className="row gap-10"
              onClick={() => setModel('sonnet')}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                border: `1.5px solid ${model === 'sonnet' ? 'var(--mira-red)' : 'var(--rule)'}`,
                background: model === 'sonnet' ? 'rgba(230, 51, 42, 0.04)' : 'white',
                textAlign: 'left',
                cursor: 'pointer',
              }}>
              <span style={{
                width: 16, height: 16,
                borderRadius: 99,
                border: `1.5px solid ${model === 'sonnet' ? 'var(--mira-red)' : 'var(--muted-soft)'}`,
                position: 'relative',
                flex: 'none',
              }}>
                {model === 'sonnet' && <span style={{
                  position: 'absolute', inset: 3,
                  borderRadius: 99,
                  background: 'var(--mira-red)',
                }}/>}
              </span>
              <div style={{flex: 1}}>
                <div className="row gap-6">
                  <span style={{fontWeight: 600, fontSize: 13.5}}>Claude Sonnet 4.5</span>
                  <Chip>qualité · ~30 s</Chip>
                </div>
                <div style={{fontSize: 12, color: 'var(--muted)', marginTop: 2}}>Questions plus subtiles, explications détaillées.</div>
              </div>
            </button>
          </div>
        </Field>

        <div style={{
          padding: '10px 12px',
          borderRadius: 10,
          background: 'var(--warm-beige)',
          fontSize: 12.5,
          color: 'var(--muted)',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start',
        }}>
          <I.Quiz size={14} style={{color: 'var(--gold)', marginTop: 1}}/>
          Tu pourras éditer chaque question avant de publier. Mira AI ne publie jamais sans ta validation.
        </div>
      </div>
      <div className="drawer-footer">
        <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
        <Btn variant="primary" icon={<I.Sparkles size={14}/>} iconRight={<I.ArrowRight size={14}/>} onClick={onGenerate}>
          Générer {count} questions
        </Btn>
      </div>
    </Modal>
  );
};

window.QuizEditor = QuizEditor;
