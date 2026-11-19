/* Learning Zone Anatomy: approved interactive teaching models. */
window.azCleanSceneData={
    hike:{region:'pelvis',title:'Pelvic Hike / Drop',positive:'Pelvic Hike',negative:'Pelvic Drop',pairPositive:'Hike + Internal Rotation',pairNegative:'Drop + External Rotation',local:'The selected side of the pelvis rises or lowers. Hip rotation stays separate in Local view.',chain:'The selected side of the pelvis rises or lowers, paired with hip rotation in this teaching preset.',reference:'Focus: {side} hemipelvis and {side} hip. Pelvic elevation and hip rotation are separate movements.',source:'Jamie Smith, Hip Rotation Continuum, visible at approximately 1:00 in Everyone NEEDS Hip Internal Rotation. The slide pairs hip hike with internal rotation and hip drop with external rotation.',note:'Selected hemipelvis is labeled. This is a paired movement example; hiking the pelvis does not automatically create axial hip rotation.'},
    tilt:{region:'pelvis',title:'Anterior / Posterior Tilt',positive:'Anterior Pelvic Tilt',negative:'Posterior Pelvic Tilt',pairPositive:'Anterior Tilt + IR Orientation',pairNegative:'Posterior Tilt + ER Orientation',local:'Explore the pelvis tilting forward or backward relative to the femurs.',chain:'Explore your proposed pairing of pelvic tilt with hip orientation. Each motion remains separately visible.',reference:'Focus: pelvis relative to femurs. Pelvic tilt and hip axial rotation use different movement axes.',source:'Requested teaching preset: APT with an internal rotation orientation, PPT with an external rotation orientation. Jamie’s material establishes the relative versus orientational distinction, but this exact coupling remains to be verified.',note:'Draft pairing for discussion. The exact reference frame and coupling need source validation before the teaching model is published.'},
    hip:{region:'pelvis',title:'Hip Internal / External Rotation',positive:'Internal Rotation',negative:'External Rotation',pairPositive:'Internal Rotation Chain',pairNegative:'External Rotation Chain',local:'Rotate the selected femur relative to the pelvis. Follow the knee to see the direction.',chain:'Explore the hip rotation continuum, including pelvic orientation and the lower limb.',reference:'Focus: {side} femur relative to the pelvis. Internal and external refer to rotation at the selected hip.',source:'Jamie Smith’s Hip Rotation Continuum and presentation slide 58, Relative Motion vs Orientational Shift.',note:'Schematic paths. Femoral orientation and hip joint rotation must be distinguished in a final calibrated model.'},
    ribs:{region:'ribs',title:'Rib Expansion',positive:'Inhalation / Expansion',negative:'Exhalation / Return',pairPositive:'Inhalation / Expansion',pairNegative:'Exhalation / Return',local:'Explore the ribs elevating and widening. Use Front or Oblique view to follow lateral expansion.',chain:'Explore rib motion with the spine and pelvis visible as context. Breathing stays separate from the global movement presets.',reference:'Reference: thoracic spine. Lateral expansion and a whole ribcage shift are different movements.',source:'Training Model’s ribcage, spine and breathing curriculum; Rami’s movement course, chapter on the axial skeleton and breathing.',note:'Simplified breathing illustration. Regional rib axes and diaphragm motion require anatomical validation. No measured lung volumes are shown.'},
    ribshift:{region:'ribs',title:'Posterior / Anterior Ribcage Shift',positive:'Posterior Shift',negative:'Anterior Shift',pairPositive:'Posterior Shift + Protraction',pairNegative:'Anterior Shift + Retraction',local:'Move the ribcage backward or forward relative to the pelvis, without making it expand.',chain:'Pair the ribcage shift with scapular movement around the thoracic surface.',reference:'Reference: pelvis. Translation of the ribcage is shown separately from rib expansion.',source:'Jamie presentation, slide 61. The pectoralis major example pairs a posterior ribcage shift with scapular protraction, and an anterior shift with retraction.',note:'A contextual teaching association. Rib translation does not automatically cause breathing expansion.'},
    scapula:{region:'scapula',title:'Protraction / Retraction',positive:'Scapular Protraction',negative:'Scapular Retraction',pairPositive:'Protraction + Posterior Shift',pairNegative:'Retraction + Anterior Shift',local:'Watch the scapula move around the ribcage, rather than moving straight out into space.',chain:'Follow scapular motion together with the paired ribcage shift.',reference:'Reference: ribcage. Use Back or Oblique view to see both scapulae clearly.',source:'Jamie presentation, slides 61 and 64, covering scapular and ribcage relationships and proximal reorientation.',note:'Schematic scapulothoracic motion. Protraction/retraction is separate from scapular tilt and upward/downward rotation.'},
    foot:{region:'foot',title:'Pronation / Supination',positive:'Pronation',negative:'Supination',pairPositive:'Pronation + Internal Rotation + Adduction',pairNegative:'Supination + External Rotation + Abduction',local:'Explore the arch and illustrative sole contact at the ground.',chain:'A loaded-leg teaching example links foot pronation with tibial and femoral internal rotation and hip adduction.',reference:'Rearfoot relative to tibia; femur relative to pelvis. The support foot remains planted.',source:'Souza et al. (2010), Temporal couplings between rearfoot-shank complex and hip joint during walking. Chida et al. (2022), Comparing the effects of excessive foot pronation on the pelvis and lower limb alignment between the extended and flexed knee positions. These studies support a contextual loading example.',note:'The shaded sole shows illustrative soft-tissue contact, not measured pressure; bones remain above the ground. Pronation lowers the medial arch and broadens midfoot contact in this loading example; supination raises the arch and reduces medial contact. The pronation and hip adduction association depends on task and knee position. This schematic uses a slightly flexed, loaded leg. Motion paths and amounts illustrate the relationship; they are not recorded participant data. Visual references: BioDigital, Visible Body and Complete Anatomy. Original procedural meshes; their proprietary models have not been copied.'},
    chain:{region:'chain',title:'Coordinated Chain',positive:'Posterior Pattern',negative:'Anterior Pattern',pairPositive:'PPT + Posterior Shift + Protraction',pairNegative:'APT + Anterior Shift + Retraction',local:'Inspect pelvic tilt with the rest of the skeleton as a reference.',chain:'Explore your requested coordinated pattern through the pelvis, ribcage and scapulae.',reference:'Reference: global body position. Each region keeps its own local movement and reference frame.',source:'Requested whole body teaching preset. Rami’s course document describes a global flexion tendency involving PPT and scapular protraction. Jamie’s slide 61 supplies the ribcage/scapula pairing.',note:'A coordinated example for teaching. Regional motions can occur independently and in other combinations.'}
  };

window.azAppliedScenes={
 rdl:{
  title:'Romanian Deadlift',labels:['Midfoot','Heel Bias'],ends:['Stand','Hinge'],view:'side',
  captions:{a:['Begin with the bar close and pressure shared across the foot.','The hips move back while the bar stays near the legs.','The pelvis and trunk share the hinge.'],b:['Begin this example with pressure biased toward the heels.','More knee bend and a rounded upper body develop as the bar drifts forward.','Follow the rounding through the spine, neck and shoulder girdle.']},
  source:'Rami’s proposed hinge example. Jamie Smith’s course framework covers foot pressure, centre of mass, base of support and coordinated reorganization. Rami’s course document describes a global flexion pattern.',
  note:'The reviewed Jamie material does not directly establish this entire heel bias, rounding and bar drift sequence. This is a selected teaching strategy. Foot pressure is not a measured whole-body centre of mass; no pressure or force values are calculated.'
 },
 squat:{
  title:'Back Squat',labels:['Reference','Extension Bias'],ends:['Setup','Full Squat'],view:'side',
  captions:{a:['Begin from the reference pelvis and trunk position.','The hips, knees, ankles and trunk share the descent.','The hips descend below knee level while the feet stay planted.'],b:['Anterior pelvic tilt and a lumbar arch are visible at setup.','The extended starting shape changes as the squat gets deeper.','Near the bottom of the full squat, the pelvis tucks into PPT and the lumbar arch reduces.']},
  source:'Jamie Smith course slides 14 and 59. Slide 59 presents butt wink as proximal reorientation and illustrates a pelvic tuck away from anterior tilt near the bottom. Updated course deck: slides 15 and 43.',
  note:'This preset uses a slightly wider stance and modest toe-out to show full squat depth, while keeping the extended setup and later posterior pelvic tilt clear. The sources do not establish that more starting extension always causes a fixed amount or timing of butt wink. Depth also depends on the task, stance, anatomy and available movement options.'
 },
 press:{
  title:'Seated Dumbbell Press',labels:['Feet Down','Feet Raised'],ends:['Rack','Overhead'],view:'oblique',
  captions:{a:['Sit against the slightly reclined backrest with the feet supported.','The upper arms rise as the elbows straighten and the scapulae rotate upward.','Finish with the upper arms overhead and the dumbbells above the shoulders.'],b:['With feet raised, follow the pelvic tuck against the transparent backrest.','The upper arms rise while the pelvis and ribcage stay visible through the backrest.','The arms reach overhead as the elbows straighten.']},
  source:'Rami’s proposed overhead press comparison. Jamie Smith slides 61–62 show scapular protraction with posterior ribcage shift in a feet up machine chest press. That source is not an overhead press demonstration.',
  note:'The transfer to overhead pressing and the stronger PPT are teaching extrapolations. Raised feet do not automatically produce this response or improve overhead range. Ribcage translation, regional rib expansion and thoracic flexion remain distinct.'
 },
 row:{
  title:'Seated Machine Row',labels:['Feet Down','Feet Raised'],ends:['Reach','Pull'],view:'side',
  captions:{a:['Begin with straight arms and the shoulders reaching forward.','The upper arms travel back as the elbows bend.','The upper arms finish behind the trunk, showing shoulder extension.'],b:['With the pelvis tucked, reach forward on straight arms.','The upper arms move back while the scapulae travel around the ribcage.','The shoulders extend as the upper arms finish behind the trunk.']},
  source:'Rami’s proposed row comparison, using Jamie Smith’s relative motion and system framework. Slides 61–62 link scapular protraction and posterior ribcage shift; the illustrated exercise there is a machine chest press.',
  note:'A direct feet raised row demonstration for this entire chain was not found in the reviewed material. The seat, task and handle path are held consistent while the selected pelvis, ribcage and scapular arrangement changes.'
 },
 pullup:{
  title:'Pull-Up',labels:['Stacked Hang','Slight Arch'],ends:['Hang','Top'],view:'side',
  captions:{a:['Begin in a long-arm hang with the upper arms overhead.','The upper arms move down relative to the trunk as the body rises.','The upper arms approach the trunk as the elbows finish the pull.'],b:['The upper back extends slightly and the chest lifts before the pull.','Keep the small upper-back arch visible as the upper arms move down and back.','Fixed hands, a small thoracic arch and upper arms near the trunk.']},
  source:'Rami’s proposed initiation comparison. The reviewed Jamie material does not directly demonstrate this exact comparison. Prinold and Bull (2016) examine pull-up grip techniques rather than stacked versus slightly arched initiation.',
  note:'The arch is localized mainly to the upper back, without a large lumbar arch or kipping swing. This comparison does not establish greater mechanical efficiency or superior muscle recruitment.'
 }
};

window.azAppliedScenes.dips={
 title:'Bar Dips',labels:['Arm Motion','Whole Chain'],ends:['Top','Bottom'],view:'side',
 captions:{a:['Begin supported above the bars with the feet suspended.','Shoulder extension and elbow flexion accompany the descent.','At the bottom, the shoulders are in extension and the elbows remain bent.'],b:['Begin tall above the bars, with bent knees and suspended feet.','The trunk closes as the arms move behind it into shoulder extension.','At the bottom, follow the relationship between the arms and the closed trunk.']},
 source:'McKenzie et al. (2022), Bench, Bar, and Ring Dips: Do Kinematics and Muscle Activity Differ? The study describes shoulder extension and elbow flexion on descent, then shoulder flexion and elbow extension on ascent.',
 note:'The trunk closing/opening sequence is Rami’s selected coordination example, not a directly verified Jamie demonstration. Forward lean, thoracic flexion and shoulder extension are distinct. Bottom extension means shoulder extension, not elbow lockout or mandatory maximal range.'
};

window.azAppliedScenes.pushup={
 title:'Push-Up',wholeChainOnly:true,labels:['Arm Motion','Whole Chain'],ends:['Top','Bottom'],view:'side',
 captions:{a:['Begin supported on the hands and toes with straight elbows.','The elbows bend as the upper arms move relative to the trunk.','Press back toward the top while following the shoulder and elbow motion.'],b:['At the top, the pelvis tucks into PPT and the scapulae protract.','The pelvic tuck remains visible as the chest lowers between the arms.','Keep the pelvis tucked at the bottom, then press back up.']},
  source:'Rami’s course describes PPT with scapular protraction as a global flexion pattern and distinguishes fixed hands in a push-up from a supported torso in the bench press. Shin et al. (2018) describe the added protraction of a push-up plus after elbow extension.',
 note:'The whole-chain view is a selected teaching example. Pelvic tilt, ribcage position and scapular movement are displayed as distinct motions rather than as an automatic one-to-one coupling.'
};
window.azAppliedScenes.bench={
 title:'Bench Press',wholeChainOnly:true,labels:['Arm Motion','Whole Chain'],ends:['Top','Bottom'],view:'oblique',
 captions:{a:['Begin supine on the bench with the bar above the shoulders.','The upper arms lower beside the trunk as the elbows bend.','The bar is near the chest and the upper arms are beside the trunk.'],b:['The pelvis is in APT and the scapulae remain retracted against the bench.','Follow the visible scapulae holding relative retraction as the bar lowers.','The lumbar arch and supported pelvis remain visible near the bottom.']},
  source:'Jamie Smith’s course slide 63 links the traditional bench setup with scapular retraction, posterior scapular tilt and anterior ribcage shift. The APT and leg drive combination is Rami’s proposed teaching preset.',
 note:'This is an illustrative setup comparison. Leg drive is represented as a support cue, with no calculated force. The head, upper back and pelvis remain supported by the bench.'
};

window.azAppliedScenes.lunge={
 title:'Lunge',labels:['Front Leg Loading','Rear Leg Loading'],ends:['Top','Lower'],view:'oblique',
 captions:{
  a:['Right foot in front: shift toward the front support in this selected strategy.','The right side of the pelvis hikes slightly as the left side drops.','Follow the front leg supporting the descent, then driving the return.'],
  b:['Left leg behind: shift the pelvis toward the rear support in this selected strategy.','Follow the rearward shift separately from the pelvic tilt and rotation.','The rear heel lowers within this chosen stance as the rear leg supports the return.']
 },
 source:'Rami’s proposed split stance comparison. Jamie Smith’s hip rotation continuum at 1:00 in Everyone NEEDS Hip Internal Rotation associates rotation toward a loaded hip with pelvic hike and medial foot pressure. It is not a universal forward or backward lunge rule.',
 note:'Right is the front leg and left is the rear leg throughout. The two loading patterns are selected teaching examples. Moving weight forward does not require a pelvic hike, and rearward loading does not automatically lower the rear heel. Foot contact, pelvic hike/drop and pelvic rotation are shown as distinct features. More Front Hip Hike makes both the right pelvic hike and the accompanying body shift more pronounced. The colored foot marks the selected support; no forces or centre-of-mass values are calculated.'
};

window.azAppliedScenes.squatcom={
 title:'Squat COM Comparison',wholeChainOnly:true,labels:['',''],ends:['Stand','Full Squat'],view:'oblique',
 captions:{a:['Three setups, full squat depth. The combined COM remains over the foot support.','Three setups, full squat depth. The combined COM remains over the foot support.','Three setups, full squat depth. The combined COM remains over the foot support.'],b:['Three setups, full squat depth. The combined COM remains over the foot support.','Three setups, full squat depth. The combined COM remains over the foot support.','Three setups, full squat depth. The combined COM remains over the foot support.']},
 source:'Selected teaching models comparing a goblet squat, a back squat with heel elevation, and a safety bar squat. Hecker et al. (2019) examine safety bar squat mechanics. Lu et al. (2022) examine heel lift effects during barbell squats.',
 note:'The COM marker is calculated from an illustrative 80 kg body and 20 kg load segment model. It is not measured athlete data. Load placement and heel elevation change different parts of the setup; these presets show the shared balance task. These models use a slightly wider stance and modest toe-out at full depth. Individual responses and available depth vary.'
};

(function(){
'use strict';
const markup="<div id=\"lz-anatomy-zone\">\n<section class=\"azc-explorer\" aria-label=\"Interactive movement explorer\">\n      <div class=\"azc-toolbar\">\n        <div class=\"azc-pickers\">\n        <label class=\"azc-movement\" id=\"azc-body-field\">Body Movements<select id=\"azc-body-movement\" class=\"cursor-interaction\">\n          <option value=\"\" disabled selected>Choose a Body Movement</option>\n          <optgroup label=\"Pelvis &amp; Hip\"><option value=\"hike\">Pelvic Hike / Drop</option><option value=\"tilt\">Anterior / Posterior Tilt</option><option value=\"hip\">Hip Internal / External Rotation</option></optgroup>\n          <optgroup label=\"Ribcage\"><option value=\"ribs\">Breathing &amp; Lateral Expansion</option><option value=\"ribshift\">Posterior / Anterior Ribcage Shift</option></optgroup>\n          <optgroup label=\"Scapula\"><option value=\"scapula\">Protraction / Retraction</option></optgroup>\n          <optgroup label=\"Foot &amp; Ankle\"><option value=\"foot\">Pronation / Supination</option></optgroup>\n          <optgroup label=\"Whole Chain\"><option value=\"chain\">Pelvis, Ribcage &amp; Scapula</option></optgroup>\n        </select></label>\n        <label class=\"azc-movement is-active\" id=\"azc-exercise-field\">Exercises<select id=\"azc-exercise\" class=\"cursor-interaction\">\n          <option value=\"\" disabled>Choose an Exercise</option>\n          <option value=\"rdl\">Romanian Deadlift</option><option value=\"squat\">Back Squat</option><option value=\"squatcom\">Squat COM Comparison</option><option value=\"lunge\" selected>Lunge</option><option value=\"press\">Seated Dumbbell Press</option><option value=\"row\">Seated Machine Row</option><option value=\"pullup\">Pull-Up</option><option value=\"dips\">Bar Dips</option><option value=\"pushup\">Push-Up</option><option value=\"bench\">Bench Press</option><option value=\"tension\">Tension &amp; DOF</option>\n        </select></label>\n        </div>\n        <div class=\"azc-skin-controls\" aria-label=\"Johnny appearance\"><button id=\"azc-skin-toggle\" type=\"button\" aria-pressed=\"false\" class=\"cursor-interaction\">Skin</button><label id=\"azc-skin-sex-field\" hidden>Model<select id=\"azc-skin-sex\" class=\"cursor-interaction\" aria-label=\"Human skin\"><option value=\"male\">Male</option><option value=\"female\">Female</option></select></label><span id=\"azc-skin-status\" role=\"status\" aria-live=\"polite\"></span></div>\n<div class=\"azc-loading-controls\"><div class=\"azc-mode\" role=\"group\" aria-label=\"Loading strategy\"><button type=\"button\" class=\"cursor-interaction\" data-azc-mode=\"local\" aria-pressed=\"true\">Front Leg Loading</button><button type=\"button\" class=\"cursor-interaction\" data-azc-mode=\"chain\" aria-pressed=\"false\">Rear Leg Loading</button></div><button id=\"azc-front-hike\" type=\"button\" class=\"azc-hike-option cursor-interaction\" aria-pressed=\"false\">More Front Hip Hike</button></div>\n        <details id=\"azc-options\" class=\"azc-options\"><summary class=\"cursor-interaction\"><i data-lucide=\"sliders-horizontal\" aria-hidden=\"true\"></i>View &amp; Details</summary><div class=\"azc-options-panel\">\n          <label>Camera<select id=\"azc-camera\" class=\"cursor-interaction\"><option value=\"front\">Front</option><option value=\"oblique\">Oblique</option><option value=\"side\">Side</option><option value=\"back\">Back</option></select></label>\n          <label id=\"azc-side-field\">Focus Side<select id=\"azc-side\" class=\"cursor-interaction\"><option value=\"right\">Right</option><option value=\"left\">Left</option></select></label>\n          <label class=\"azc-check\"><input id=\"azc-labels\" type=\"checkbox\">Show Anatomy Labels</label>\n          <label class=\"azc-check\"><input id=\"azc-ghost\" type=\"checkbox\">Show Neutral Reference</label>\n          <button type=\"button\" id=\"azc-camera-reset\" class=\"azc-textbutton cursor-interaction\">Reset Camera</button>\n          <details id=\"azc-source\"><summary class=\"cursor-interaction\">Model &amp; Sources<i data-lucide=\"chevron-down\" aria-hidden=\"true\"></i></summary><p id=\"azc-source-text\"></p><p id=\"azc-source-note\"></p><p>Jamie Smith course slides \u00b7 <a href=\"https://pmc.ncbi.nlm.nih.gov/articles/PMC9603242/\" target=\"_blank\" rel=\"noreferrer\">Dips study</a> \u00b7 <a href=\"https://pmc.ncbi.nlm.nih.gov/articles/PMC6221737/\" target=\"_blank\" rel=\"noreferrer\">Push-Up Plus study</a> \u00b7 <a href=\"https://www.hrpub.org/journals/article_info.php?aid=7784\" target=\"_blank\" rel=\"noreferrer\">Bench Press Leg Drive study</a></p><p id=\"azc-com-source-links\" hidden><a href=\"https://pubmed.ncbi.nlm.nih.gov/30363042/\" target=\"_blank\" rel=\"noreferrer\">Safety squat bar study</a> \u00b7 <a href=\"https://pubmed.ncbi.nlm.nih.gov/35877352/\" target=\"_blank\" rel=\"noreferrer\">Heel elevation study</a></p><p>Skull and pelvic meshes: <a href=\"https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html\" target=\"_blank\" rel=\"noreferrer\">BodyParts3D</a>, \u00a9 The Database Center for Life Science, <a href=\"https://creativecommons.org/licenses/by/4.0/\" target=\"_blank\" rel=\"noreferrer\">CC Attribution 4.0</a>. Simplified and rescaled.</p></details>\n        </div></details>\n      </div>\n      <div id=\"azc-tension-pane\" hidden></div>\n      <div class=\"azc-stage-area\">\n        <div class=\"azc-stage-title\"><h2 id=\"azc-title\">Lunge</h2><span id=\"azc-focus\">Right Front Leg Loading</span></div>\n        <div id=\"azc-stage\" role=\"img\" aria-label=\"Interactive schematic anatomy. Drag to rotate and scroll to zoom.\"></div>\n        <div id=\"azc-com-grid\" class=\"azc-com-grid\" hidden><section class=\"azc-com-panel\"><h3>Goblet Squat</h3><p>Dumbbell held at the chest</p><div class=\"azc-com-stage\" id=\"azc-com-cgoblet\" role=\"img\" aria-label=\"Goblet squat model\"></div></section><section class=\"azc-com-panel\"><h3>Heels Raised</h3><p>Bar on back, heels on a visible wedge</p><div class=\"azc-com-stage\" id=\"azc-com-cheels\" role=\"img\" aria-label=\"Heel elevated squat model\"></div></section><section class=\"azc-com-panel\"><h3>Safety Bar Squat</h3><p>Shoulder pads, camber and front handles</p><div class=\"azc-com-stage\" id=\"azc-com-csafety\" role=\"img\" aria-label=\"Safety bar squat model\"></div></section></div><div id=\"azc-com-legend\" class=\"azc-com-legend\" hidden><span aria-hidden=\"true\"></span>Model COM, lifter and load combined</div><div class=\"azc-stage-caption\"><span>Drag to rotate <b>\u00b7</b> Scroll to zoom</span><span>Schematic anatomy</span></div>\n      </div>\n      <div class=\"azc-bottom\">\n        <p id=\"azc-explanation\" aria-live=\"polite\">Right foot forward, left foot behind. Follow the shift toward the front leg.</p>\n        <div class=\"azc-slider-row\"><span id=\"azc-negative\">Top</span><input id=\"azc-range\" type=\"range\" min=\"0\" max=\"100\" value=\"45\" step=\"1\" aria-label=\"Movement position\"><span id=\"azc-positive\">Lower</span></div>\n        <div class=\"azc-bottom-actions\"><button type=\"button\" id=\"azc-play\" class=\"azc-play cursor-interaction\" aria-pressed=\"false\"><i data-lucide=\"play\" aria-hidden=\"true\"></i><span>Play</span></button><button type=\"button\" id=\"azc-reset\" class=\"azc-reset cursor-interaction\"><i data-lucide=\"rotate-ccw\" aria-hidden=\"true\"></i>Reset</button><span id=\"azc-mode-hint\">Illustrative comparison</span></div>\n      </div>\n    </section>\n</div>";
window.LZAnatomyRuntime={mount(host,opts={}){
  host.innerHTML=markup;
  const root=host.querySelector('#lz-anatomy-zone');
  let viewer,tension=null,tensionActive=false;let comparisonViewers=[],comparisonFrame=0,viewerGeneration=0,comparisonActive=false;const listeners=[];
  try{
  const q=s=>root.querySelector(s),all=s=>Array.from(root.querySelectorAll(s));
  const anatomy=window.azCleanSceneData,exercises=window.azAppliedScenes;
  viewer=window.createAnatomyViewer(q('#azc-stage'));
  const state={movement:'lunge',amount:.45,mode:'chain',scenario:'a',frontHipHike:false,side:'right',labels:false,ghost:false,minimal:true,skin:'johnny'};
  let playing=false,frame=0,last=0,direction=1,destroyed=false,skinSex='male',skinSceneError=null;
  let lastSkinProblem=null;
  function listen(el,type,fn,options){el.addEventListener(type,fn,options);listeners.push(()=>el.removeEventListener(type,fn,options));}
  function activeSkinViewers(){return tensionActive?(tension?[tension]:[]):comparisonActive?comparisonViewers.map(x=>x.viewer):viewer?[viewer]:[];}
  function refreshSkinUI(){
    if(destroyed)return;
    const viewers=activeSkinViewers();
    const results=viewers.map(v=>v.getSkinState?.()||{requested:state.skin,active:'johnny',status:'unavailable',error:'Human skins need WebGL. Johnny remains available in this browser.'});
    const failure=results.find(v=>v.requested===state.skin&&(v.status==='unavailable'||v.status==='error'));
    if(state.skin!=='johnny'&&failure){
      lastSkinProblem={status:failure.status,error:failure.error};
      state.skin='johnny';
      for(const model of viewers)model.setSkin?.('johnny');
      refreshSkinUI();
      return;
    }
    const problem=skinSceneError?{status:'unavailable',error:skinSceneError}:lastSkinProblem;
    const loading=state.skin!=='johnny'&&(!results.length||results.some(v=>v.requested!==state.skin||v.status==='loading')||(comparisonActive&&results.length<3));
    const human=state.skin!=='johnny';
    q('#azc-skin-toggle').setAttribute('aria-pressed',String(human));q('#azc-skin-sex-field').hidden=!human;q('#azc-skin-sex').value=skinSex;
    text('#azc-skin-status',problem?.error||(loading?'Loading '+skinSex+' skin…':''));
    root.anatomySkinState={requested:state.skin,sex:skinSex,status:problem?.status||(loading?'loading':'ready'),views:results};
    root.anatomyExerciseState={...state,playing,section:tensionActive?'tension':'movement'};
  }
  function skinCallback(){Promise.resolve().then(refreshSkinUI);}
  function applySkin(model){Promise.resolve(model.setSkin?.(state.skin)).then(refreshSkinUI);refreshSkinUI();}
  function setSkin(type){lastSkinProblem=null;state.skin=['male','female'].includes(type)?type:'johnny';if(state.skin!=='johnny')skinSex=state.skin;for(const model of activeSkinViewers())applySkin(model);refreshSkinUI();}
  const comparison=()=>state.movement==='squatcom';
  const applied=()=>Boolean(exercises[state.movement]);
  const wholeChainOnly=()=>Boolean(exercises[state.movement]?.wholeChainOnly);
  function text(selector,value){const el=q(selector);if(el.textContent!==value)el.textContent=value;}
  function icons(){if(window.lucide)window.lucide.createIcons({attrs:{width:16,height:16}});}
  const short={hike:['Drop','Hike'],tilt:['Posterior Tilt','Anterior Tilt'],hip:['External','Internal'],ribs:['Exhale','Inhale'],ribshift:['Anterior','Posterior'],scapula:['Retract','Protract'],foot:['Supinate','Pronate'],chain:['Anterior Pattern','Posterior Pattern']};
  function detail(){
    if(state.movement==='lunge'&&state.scenario==='a'&&state.frontHipHike)return direction<0?'The right front leg drives the return with the stronger hike and forward body position.':'A stronger right pelvic hike accompanies a shift of the pelvis and trunk toward the right front foot.';
    const example=exercises[state.movement];if(direction<0&&state.amount>.025){if(state.movement==='lunge')return state.scenario==='a'?'Drive the return through the right front leg while following the pelvis.':'Drive the return through the left rear leg in this selected loading strategy.';if(state.movement==='dips')return state.scenario==='b'?'The trunk opens as the arms return toward shoulder flexion.':'Shoulder flexion and elbow extension accompany the ascent.';if(state.movement==='pushup')return state.scenario==='b'?'The elbows straighten as the scapulae protract, with the pelvis kept tucked.':'The shoulders and elbows coordinate as the body rises from the fixed hands.';if(state.movement==='bench')return state.scenario==='b'?'The arms press the bar up as the feet push into the floor and the upper back stays supported.':'The upper arms move toward the starting position as the elbows straighten.';}if(example){const phase=state.amount<.15?0:state.amount<.75?1:2;return example.captions[state.scenario][phase];}
    const p=state.amount>0,side=state.side==='right'?'right':'left',chain=state.mode==='chain';
    if(Math.abs(state.amount)<.025)return 'Neutral position.';
    switch(state.movement){
      case 'hike':return chain?(p?'Pelvic hike paired with hip internal rotation.':'Pelvic drop paired with hip external rotation.'):'The '+side+' side of the pelvis '+(p?'rises.':'lowers.');
      case 'tilt':return chain?(p?'Anterior tilt paired with an internal rotation orientation.':'Posterior tilt paired with an external rotation orientation.'):'The pelvis tilts '+(p?'forward':'backward')+' relative to the femurs.';
      case 'hip':return 'The '+side+' femur rotates '+(p?'internally':'externally')+(chain?', with the lower limb chain.':' relative to the pelvis.');
      case 'ribs':return p?'The ribs elevate and the ribcage widens.':'The ribs move down and inward toward rest.';
      case 'ribshift':return 'The ribcage shifts '+(p?'backward':'forward')+(chain?(p?', paired with scapular protraction.':', paired with scapular retraction.'):' relative to the pelvis.');
      case 'scapula':return p?'The scapulae move around the ribcage into protraction.':'The scapulae move toward the spine into retraction.';
      case 'foot':return chain?(p?'Foot pronation, tibial and femoral internal rotation, and hip adduction.':'Foot supination, tibial and femoral external rotation, and hip abduction.'):'The '+side+' foot '+(p?'pronates as the arch lowers and midfoot ground contact broadens.':'supinates as the arch rises and medial ground contact narrows.');
      case 'chain':return chain?(p?'Posterior pelvic tilt, posterior ribcage shift and scapular protraction.':'Anterior pelvic tilt, anterior ribcage shift and scapular retraction.'):(p?'Posterior pelvic tilt, with the trunk as a reference.':'Anterior pelvic tilt, with the trunk as a reference.');
    }
  }
  function disposeComparison(){
    viewerGeneration++;cancelAnimationFrame(comparisonFrame);comparisonFrame=0;all('.azc-com-error').forEach(el=>el.remove());
    const previous=comparisonViewers;comparisonViewers=[];
    for(const item of previous)item.viewer.dispose();
    for(const id of ['cgoblet','cheels','csafety'])q('#azc-com-'+id).replaceChildren();
  }
  function comparisonState(id){return {...state,movement:id,mode:'chain',labels:false,ghost:false,view:q('#azc-camera').value,ascending:direction<0,onSkinState:skinCallback};}
  function syncViewers(){
    if(comparison()){
      if(!comparisonActive){
        comparisonActive=true;viewer?.dispose();viewer=null;disposeComparison();
        const generation=viewerGeneration,ids=['cgoblet','cheels','csafety'];let index=0;
        function createNext(){
          comparisonFrame=0;if(destroyed||!comparisonActive||generation!==viewerGeneration)return;
          const id=ids[index++],container=q('#azc-com-'+id);
          try{
            const model=window.createAnatomyViewer(container,comparisonState(id));
            if(destroyed||!comparisonActive||generation!==viewerGeneration){model.dispose();return;}
            comparisonViewers.push({id,viewer:model});refreshSkinUI();
            if(index<ids.length)comparisonFrame=requestAnimationFrame(createNext);
          }catch(error){
            disposeComparison();pause();skinSceneError='The comparison is unavailable. Choose another movement and reopen it to retry.';refreshSkinUI();const notice=document.createElement('p');notice.setAttribute('role','alert');notice.className='azc-com-error';notice.textContent='The squat comparison could not load. Choose another movement and reopen it to retry.';q('#azc-com-grid').appendChild(notice);
          }
        }
        comparisonFrame=requestAnimationFrame(createNext);
      }else for(const item of comparisonViewers)item.viewer.update(comparisonState(item.id));
    }else{
      if(comparisonActive){comparisonActive=false;disposeComparison();}
      if(!viewer){viewer=window.createAnatomyViewer(q('#azc-stage'),{...state,view:q('#azc-camera').value,ascending:direction<0,onSkinState:skinCallback});refreshSkinUI();}
      else viewer.update({...state,ascending:direction<0});
    }
  }
  function leaveTension(){if(!tensionActive)return;tension?.destroy();tension=null;tensionActive=false;root.classList.remove('azc-tension-active');q('#azc-tension-pane').hidden=true;}
  function openTension(){
    pause();q('#azc-options').open=false;
    if(tensionActive)return;
    viewer?.dispose();viewer=null;comparisonActive=false;disposeComparison();tensionActive=true;root.classList.add('azc-tension-active');q('#azc-tension-pane').hidden=false;q('#azc-body-movement').value='';q('#azc-exercise').value='tension';q('#azc-body-field').classList.remove('is-active');q('#azc-exercise-field').classList.add('is-active');
    try{if(!window.LZAnatomyTension?.mount)throw Error('Tension & DOF could not load. Choose another movement and reopen it to retry.');tension=window.LZAnatomyTension.mount(q('#azc-tension-pane'),{skin:state.skin,onSkinState:skinCallback});root.anatomyExerciseState={...state,playing:false,section:'tension'};refreshSkinUI();}catch(error){skinSceneError='Tension & DOF is unavailable. Choose another movement and reopen it to retry.';refreshSkinUI();const notice=document.createElement('p');notice.setAttribute('role','alert');notice.textContent=error.message;q('#azc-tension-pane').replaceChildren(notice);}
  }
  function setCamera(value){if(comparison())for(const item of comparisonViewers)item.viewer.setView(value);else viewer?.setView(value);}
  function resetCamera(){if(comparison())for(const item of comparisonViewers)item.viewer.resetCamera();else viewer?.resetCamera();}
  function render(){
    if(destroyed||tensionActive)return;
    if(wholeChainOnly()){state.mode='chain';state.scenario='b';}
    const ex=exercises[state.movement],d=ex||anatomy[state.movement],chain=state.mode==='chain',neutral=Math.abs(state.amount)<.025;
    q('#azc-body-field').classList.toggle('is-active',!ex);q('#azc-exercise-field').classList.toggle('is-active',Boolean(ex));
    q('#azc-range').min=ex?'0':'-100';q('#azc-range').value=String(Math.round(state.amount*100));
    all('[data-azc-mode]').forEach((b,i)=>{b.setAttribute('aria-pressed',String(ex?state.scenario===(i?'b':'a'):b.dataset.azcMode===state.mode));b.textContent=ex?ex.labels[i]:i?'Chain':'Local';});
    q('.azc-mode').setAttribute('aria-label',ex?'Setup comparison':'Movement mode');
    q('.azc-mode').hidden=wholeChainOnly();
    q('.azc-loading-controls').hidden=wholeChainOnly();
    const canHike=state.movement==='lunge'&&state.scenario==='a';q('#azc-front-hike').hidden=!canHike;q('#azc-front-hike').setAttribute('aria-pressed',String(canHike&&state.frontHipHike));
    q('#azc-ghost').parentNode.hidden=Boolean(ex);q('#azc-labels').parentNode.hidden=comparison();
    q('#azc-stage').hidden=comparison();q('#azc-com-grid').hidden=!comparison();q('#azc-com-legend').hidden=!comparison();q('#azc-com-source-links').hidden=!comparison();q('.azc-stage-area').classList.toggle('is-com',comparison());
    const label=ex?ex.title:neutral?'Neutral Position':state.amount>0?d.positive:d.negative;
    text('#azc-title',label);
    const lower=!ex&&['hike','tilt','hip','foot'].includes(state.movement);
    text('#azc-focus',state.movement==='lunge'?(state.scenario==='a'?'Right Front Leg Loading'+(state.frontHipHike?' · More Hip Hike':''):'Left Rear Leg Loading'):ex?ex.labels[state.scenario==='a'?0:1]:lower?(state.side==='right'?'Right side':'Left side'):state.movement==='chain'?'Pelvis, ribcage and scapula':'');
    q('#azc-focus').hidden=comparison()||!ex&&!lower&&state.movement!=='chain';q('#azc-side-field').hidden=!lower;
    text('#azc-negative',ex?ex.ends[0]:short[state.movement][0]);text('#azc-positive',ex?ex.ends[1]:short[state.movement][1]);
    text('#azc-explanation',detail());text('#azc-source-text',d.source);text('#azc-source-note',d.note);
    text('#azc-mode-hint',ex?(wholeChainOnly()?'Teaching example':'Illustrative comparison'):state.movement==='tilt'&&chain?'Proposed teaching pairing':state.movement==='foot'&&chain?'Loaded-leg example':chain?'Chain teaching preset':'Local view');
    q('#azc-stage').setAttribute('aria-label','Interactive schematic anatomy. '+label+'. '+detail()+' Drag to rotate and scroll to zoom.');
    syncViewers();root.anatomyExerciseState={...state,playing};refreshSkinUI();
  }
  function pause(value=false){playing=value;cancelAnimationFrame(frame);last=0;q('#azc-play').innerHTML='<i data-lucide="'+(value?'pause':'play')+'" aria-hidden="true"></i><span>'+(value?'Pause':'Play')+'</span>';q('#azc-play').setAttribute('aria-pressed',String(value));icons();if(playing){if(state.amount>.97)direction=-1;else if(state.amount<(applied()?.03:-.97))direction=1;frame=requestAnimationFrame(tick);}root.anatomyExerciseState={...state,playing};}
  function tick(now){if(!playing||destroyed)return;if(comparison()&&last&&comparisonViewers.some(item=>item.viewer.isFallback)&&now-last<110){frame=requestAnimationFrame(tick);return;}const dt=last?Math.min((now-last)/1000,comparison()?.25:.06):0;last=now;state.amount+=direction*dt*(applied()?.20:.28);const minimum=applied()?0:-1;if(state.amount>=1){state.amount=1;direction=-1;}else if(state.amount<=minimum){state.amount=minimum;direction=1;}render();frame=requestAnimationFrame(tick);}
  function setAmount(value){direction=value<state.amount?-1:1;pause();state.amount=Math.max(applied()?0:-1,Math.min(1,value));render();}
  function defaultView(){if(applied())return exercises[state.movement].view;return ['tilt','ribshift'].includes(state.movement)?'side':state.movement==='scapula'?'back':state.movement==='foot'?(state.mode==='chain'?'front':'oblique'):'front';}
  function selectMovement(value){skinSceneError=null;lastSkinProblem=null;if(value==='tension'){openTension();return;}if(!anatomy[value]&&!exercises[value])return;leaveTension();pause();direction=1;state.frontHipHike=false;state.movement=value;state.amount=comparison()?1:applied()?.12:.55;if(applied()){state.mode='chain';state.scenario=wholeChainOnly()||['pullup','dips'].includes(state.movement)?'b':'a';state.ghost=false;q('#azc-ghost').checked=false;}q('#azc-body-movement').value=applied()?'':value;q('#azc-exercise').value=applied()?value:'';const view=defaultView();q('#azc-camera').value=view;render();setCamera(view);}
  listen(q('#azc-skin-toggle'),'click',()=>setSkin(state.skin==='johnny'?skinSex:'johnny'));
  listen(q('#azc-skin-sex'),'change',e=>setSkin(e.target.value));
  listen(q('#azc-body-movement'),'change',e=>selectMovement(e.target.value));listen(q('#azc-exercise'),'change',e=>selectMovement(e.target.value));
  all('[data-azc-mode]').forEach(b=>listen(b,'click',()=>{if(wholeChainOnly())return;if(applied()){const next=b.dataset.azcMode==='local'?'a':'b';if(next!==state.scenario)state.frontHipHike=false;state.scenario=next;state.mode='chain';}else state.mode=b.dataset.azcMode;render();if(state.movement==='foot'){const view=defaultView();q('#azc-camera').value=view;setCamera(view);}}));
  listen(q('#azc-front-hike'),'click',()=>{if(state.movement!=='lunge'||state.scenario!=='a')return;state.frontHipHike=!state.frontHipHike;render();});
  listen(q('#azc-side'),'change',e=>{state.side=e.target.value;render();});
  listen(q('#azc-range'),'input',e=>setAmount(Number(e.target.value)/100));
  listen(q('#azc-play'),'click',()=>pause(!playing));listen(q('#azc-reset'),'click',()=>setAmount(0));
  listen(q('#azc-camera'),'change',e=>setCamera(e.target.value));
  listen(q('#azc-camera-reset'),'click',()=>{resetCamera();q('#azc-camera').value='front';});
  listen(q('#azc-labels'),'change',e=>{state.labels=e.target.checked;render();});listen(q('#azc-ghost'),'change',e=>{state.ghost=e.target.checked;render();});
  listen(root,'click',e=>{if(!q('#azc-options').contains(e.target))q('#azc-options').open=false;});listen(document,'visibilitychange',()=>{if(document.hidden)pause();});
  q('#azc-body-movement').value=applied()?'':state.movement;q('#azc-exercise').value=applied()?state.movement:'';render();const view=defaultView();q('#azc-camera').value=view;setCamera(view);

  return {
    flush:async()=>{},setSkin,getSkinState:()=>root.anatomySkinState,
    destroy(){
      if(destroyed)return;
      destroyed=true;playing=false;cancelAnimationFrame(frame);frame=0;
      for(const remove of listeners.splice(0))remove();
      tension?.destroy();tension=null;viewer?.dispose();viewer=null;comparisonActive=false;disposeComparison();
      delete root.anatomyExerciseState;delete root.anatomySkinState;
      if(root.parentNode===host)host.replaceChildren();
    }
  };

  }catch(error){for(const remove of listeners.splice(0))remove();tension?.destroy();viewer?.dispose();for(const item of comparisonViewers)item.viewer.dispose();cancelAnimationFrame(comparisonFrame);host.replaceChildren();throw error;}
}};
})();
