/* Learning Zone Anatomy: approved interactive teaching models. */
window.azCleanSceneData={
    hike:{region:'pelvis',title:'Pelvic Hike / Drop',positive:'Pelvic Hike',negative:'Pelvic Drop',pairPositive:'Hike + Internal Rotation',pairNegative:'Drop + External Rotation',local:'The selected side of the pelvis rises or lowers. Hip rotation stays separate in Local view.',chain:'The selected side of the pelvis rises or lowers, paired with hip rotation in this teaching preset.',reference:'Focus: {side} hemipelvis and {side} hip. Pelvic elevation and hip rotation are separate movements.',source:'Jamie Smith, Hip Rotation Continuum, visible at approximately 1:00 in Everyone NEEDS Hip Internal Rotation. The slide pairs hip hike with internal rotation and hip drop with external rotation.',note:'Selected hemipelvis is labeled. This is a paired movement example; hiking the pelvis does not automatically create axial hip rotation.'},
    tilt:{region:'pelvis',title:'Anterior / Posterior Pelvic Tilt',positive:'Anterior Pelvic Tilt',negative:'Posterior Pelvic Tilt',local:'Follow the front and back of the pelvis relative to the stationary femurs.',chain:'See the same tilt in the context of the entire body.',reference:'The pelvis rotates in the sagittal plane about a transverse axis through the hip centers.',source:'Lewis et al. (2017), The Human Pelvis: Variation in Structure and Function During Gait.',note:'During anterior tilt the front of the pelvis moves forward and down relative to the back. Posterior tilt reverses that motion. The whole body view keeps the thighs and trunk as stationary references.'},
    hip:{region:'femur',title:'Femoral Internal / External Rotation at the Hip',positive:'Femoral Internal Rotation',negative:'Femoral External Rotation',local:'Watch the front of the selected femur turn toward or away from the midline.',chain:'The same femoral rotation is shown with the lower leg and the rest of the body visible.',reference:'The pelvis is the reference. The femoral head and the center of the knee define the axis.',source:'Neumann (2010), Kinesiology of the Hip: A Focus on Muscular Actions. Lewis et al. (2017), The Human Pelvis: Variation in Structure and Function During Gait.',note:'This illustration shows the femur moving relative to a stationary pelvis. In a weight-bearing task, the pelvis can also rotate relative to a supported femur.'},
    ribs:{region:'ribs',title:'Rib Motion During Breathing',positive:'Inhalation / Expansion',negative:'Exhalation / Return',pairPositive:'Inhalation / Expansion',pairNegative:'Exhalation / Return',local:'Explore the ribs elevating and widening. Use Front or Oblique view to follow lateral expansion.',chain:'Explore rib motion with the spine and pelvis visible as context. Breathing stays separate from the global movement presets.',reference:'Reference: thoracic spine. Lateral expansion and a whole ribcage shift are different movements.',source:'Training Model’s ribcage, spine and breathing curriculum; Rami’s movement course, chapter on the axial skeleton and breathing.',note:'The animation shows rib and sternum motion. Rib angles are illustrative. The model omits the diaphragm and does not calculate lung volume.'},
    ribshift:{region:'ribs',title:'Posterior / Anterior Ribcage Shift',positive:'Posterior Shift',negative:'Anterior Shift',pairPositive:'Posterior Shift + Protraction',pairNegative:'Anterior Shift + Retraction',local:'Move the ribcage backward or forward relative to the pelvis, without making it expand.',chain:'Pair the ribcage shift with scapular movement around the thoracic surface.',reference:'Reference: pelvis. Translation of the ribcage is shown separately from rib expansion.',source:'Jamie presentation, slide 61. The pectoralis major example pairs a posterior ribcage shift with scapular protraction, and an anterior shift with retraction.',note:'A contextual teaching association. Rib translation does not automatically cause breathing expansion.'},
    scapula:{region:'scapula',title:'Protraction / Retraction',positive:'Scapular Protraction',negative:'Scapular Retraction',pairPositive:'Protraction + Posterior Shift',pairNegative:'Retraction + Anterior Shift',local:'Watch the scapula move around the ribcage, rather than moving straight out into space.',chain:'Follow scapular motion together with the paired ribcage shift.',reference:'Reference: ribcage. Use Back or Oblique view to see both scapulae clearly.',source:'Jamie presentation, slides 61 and 64, covering scapular and ribcage relationships and proximal reorientation.',note:'Schematic scapulothoracic motion. Protraction/retraction is separate from scapular tilt and upward/downward rotation.'},
    foot:{region:'foot',title:'Pronation / Supination',positive:'Pronation',negative:'Supination',pairPositive:'Pronation + Internal Rotation + Adduction',pairNegative:'Supination + External Rotation + Abduction',local:'Explore the arch and illustrative sole contact at the ground.',chain:'A loaded-leg teaching example links foot pronation with tibial and femoral internal rotation and hip adduction.',reference:'Rearfoot relative to tibia; femur relative to pelvis. The support foot remains planted.',source:'Souza et al. (2010), Temporal couplings between rearfoot-shank complex and hip joint during walking. Chida et al. (2022), Comparing the effects of excessive foot pronation on the pelvis and lower limb alignment between the extended and flexed knee positions. These studies support a contextual loading example.',note:'The shaded sole shows illustrative soft-tissue contact, not measured pressure; bones remain above the ground. Pronation lowers the medial arch and broadens midfoot contact in this loading example; supination raises the arch and reduces medial contact. The pronation and hip adduction association depends on task and knee position. This schematic uses a slightly flexed, loaded leg. Motion paths and amounts illustrate the relationship; they are not recorded participant data. Visual references: BioDigital, Visible Body and Complete Anatomy. Original procedural meshes; their proprietary models have not been copied.'},
    chain:{region:'chain',title:'Coordinated Chain',positive:'Posterior Pattern',negative:'Anterior Pattern',pairPositive:'PPT + Posterior Shift + Protraction',pairNegative:'APT + Anterior Shift + Retraction',local:'Inspect pelvic tilt relative to the visible femurs.',chain:'Explore your requested coordinated pattern through the pelvis, ribcage and scapulae.',reference:'Reference: global body position. Each region keeps its own local movement and reference frame.',source:'Requested whole body teaching preset. Rami’s course document describes a global flexion tendency involving PPT and scapular protraction. Jamie’s slide 61 supplies the ribcage/scapula pairing.',note:'A coordinated example for teaching. Regional motions can occur independently and in other combinations.'}
  };

window.azAppliedScenes={
 rdl:{
  title:'Romanian Deadlift',labels:['Midfoot','Heel Bias'],ends:['Stand','Hinge'],view:'side',
  captions:{a:['The teal arrows mark the intended midfoot pressure. Begin with the bar close to the legs.','The hips move back while the bar stays near the legs.','The pelvis and trunk share the hinge.'],b:['The teal arrows mark the intended heel pressure. Compare their position with the midfoot setup.','More knee bend and a rounded upper body develop as the bar drifts forward.','Follow the rounding through the spine, neck and shoulder girdle.']},
  source:'Rami’s proposed hinge example. Jamie Smith’s course framework covers foot pressure, centre of mass, base of support and coordinated reorganization. Rami’s course document describes a global flexion pattern.',
  note:'The reviewed Jamie material does not directly establish this entire heel bias, rounding and bar drift sequence. This is a selected teaching strategy. The arrows illustrate the intended pressure location. Their size is fixed. The model calculates neither foot pressure nor ground reaction force.'
 },
 squat:{
  title:'Back Squat',labels:['Reference','Extension Bias'],ends:['Setup','Full Squat'],view:'side',
  captions:{a:['Begin from the reference pelvis and trunk position.','The hips, knees, ankles and trunk share the descent.','The hips descend below knee level while the feet stay planted.'],b:['Anterior pelvic tilt and a lumbar arch are visible at setup.','The extended starting shape changes as the squat gets deeper.','Near the bottom of the full squat, the pelvis tucks into PPT and the lumbar arch reduces.']},
  source:'Jamie Smith course slides 14 and 59. Slide 59 presents butt wink as proximal reorientation and illustrates a pelvic tuck away from anterior tilt near the bottom. Updated course deck: slides 15 and 43. Knee tracking references: Does the femur roll-back with flexion? (PMID 15330038) and In vivo patellar tracking (PMID 18327809).',
  note:'This preset uses a slightly wider stance and modest toe-out to show full squat depth, while keeping the extended setup and later posterior pelvic tilt clear. The sources do not establish that more starting extension always causes a fixed amount or timing of butt wink. Depth also depends on the task, stance, anatomy and available movement options. Watch the shin glide relative to the femur and the kneecap shift and tilt through flexion. These joint paths are illustrative.'
 },
 press:{
  title:'Seated Dumbbell Press',labels:['Feet on Floor','Feet on Raised Support'],ends:['Rack','Overhead'],view:'oblique',
  captions:{a:['Sit against the slightly reclined backrest with the feet supported.','The upper arms rise as the elbows straighten and the scapulae rotate upward.','Finish with the upper arms overhead and the dumbbells above the shoulders.'],b:['With the feet on the raised support, follow the pelvic tuck against the transparent backrest.','The upper arms rise while the pelvis and ribcage stay visible through the backrest.','The arms reach overhead as the elbows straighten.']},
  source:'Rami’s proposed overhead press comparison. Jamie Smith slides 61–62 show scapular protraction with posterior ribcage shift in a feet up machine chest press. That source is not an overhead press demonstration.',
  note:'The transfer to overhead pressing and the stronger PPT are teaching extrapolations. Raised feet do not automatically produce this response or improve overhead range. Ribcage translation, regional rib expansion and thoracic flexion remain distinct.'
 },
 row:{
  title:'Seated Machine Row',labels:['Feet on Floor','Feet on Raised Support'],ends:['Reach','Pull'],view:'side',
  captions:{a:['Begin with straight arms and the shoulders reaching forward.','The upper arms travel back as the elbows bend.','The upper arms finish behind the trunk, showing shoulder extension.'],b:['With the pelvis tucked, reach forward on straight arms.','The upper arms move back while the scapulae travel around the ribcage.','The shoulders extend as the upper arms finish behind the trunk.']},
  source:'Rami’s proposed row comparison, using Jamie Smith’s relative motion and system framework. Slides 61–62 link scapular protraction and posterior ribcage shift; the illustrated exercise there is a machine chest press.',
  note:'Both setups use the same seat and cable anchor. With the feet on the raised support, the modeled pelvis and trunk change position. The handle starts lower and follows a different path during the pull.'
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
 captions:{a:['Begin supported on the hands and toes with straight elbows.','The elbows bend as the upper arms move relative to the trunk.','The chest touches the floor. Press through the palms to return to the top.'],b:['At the top, the pelvis tucks into PPT and the scapulae protract.','The pelvic tuck remains visible as the chest lowers between the arms.','The chest touches the floor with the pelvis still tucked. Press back up.']},
  source:'Rami’s course describes PPT with scapular protraction as a global flexion pattern and distinguishes fixed hands in a push-up from a supported torso in the bench press. Shin et al. (2018) describe the added protraction of a push-up plus after elbow extension.',
 note:'The toes extend together at the ball of the foot. The smaller joints within each toe keep their shape in this model. Pelvic tilt, ribcage position and scapular movement are displayed as distinct motions rather than as an automatic one-to-one coupling.'
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
  b:['Left leg behind: shift the pelvis toward the rear support in this selected strategy.','Follow the rearward shift separately from the pelvic tilt and rotation.','At the bottom, the pelvis sits farther toward the left rear foot than it does in the front leg example.']
 },
 source:'Rami’s proposed split stance comparison. Jamie Smith’s hip rotation continuum at 1:00 in Everyone NEEDS Hip Internal Rotation associates rotation toward a loaded hip with pelvic hike and medial foot pressure. It is not a universal forward or backward lunge rule.',
 note:'Right is the front leg and left is the rear leg throughout. The two loading patterns are selected teaching examples. Moving weight forward does not require a pelvic hike, and rearward loading does not automatically lower the rear heel. Foot contact, pelvic hike/drop and pelvic rotation are shown as distinct features. More Front Hip Hike makes both the right pelvic hike and the accompanying body shift more pronounced. The colored foot marks the selected support; no forces or centre-of-mass values are calculated.'
};

const bodyTypeCaptions=[
 'Compare the four setups with the plates on the floor. The feet and bar stay in place as hip height and trunk angle change.',
 'At the same point in the pull, compare where the bar sits beside the shins and thighs.',
 'At lockout, compare two builds with the same torso length. The longer arms place the bar lower on the thighs.'
];
window.azAppliedScenes.deadlift_types={
 title:'Deadlift Body Types',wholeChainOnly:true,labels:['',''],ends:['Bar on floor','Lockout'],view:'side',
 captions:{a:bodyTypeCaptions,b:bodyTypeCaptions},
 source:'Four conventional deadlift examples use the same legs, bar and stance. Torso and arm lengths vary across the four builds. Each model holds its spinal curves as the hips and knees extend.',
 note:'Torso length varies by 10% and upper arm and forearm lengths by 9% around the model average. Leg lengths, grip width, plate size and starting bar position are shared. The model shows one possible setup for each build.'
};

const squatComCaptions=[
 'Compare three complete setups. Heel height, load placement and trunk angle change together across the panels.',
 'Follow the vertical line from the blue dot to the floor or wedge as you change squat depth.',
 'Compare the knee and trunk positions in the deeper squat. All three models keep the line over the same point relative to the feet.'
];
window.azAppliedScenes.squatcom={
 title:'Squat COM Comparison',wholeChainOnly:true,labels:['',''],ends:['Stand','Full Squat'],view:'oblique',
 captions:{a:squatComCaptions,b:squatComCaptions},
 source:'Selected teaching models comparing a goblet squat, a back squat with heel elevation, and a safety bar squat. Hecker et al. (2019) examine safety bar squat mechanics. Lu et al. (2022) examine heel lift effects during barbell squats.',
 note:'Each setup uses the same illustrative 80 kg lifter and 20 kg load. Upper arm, forearm, thigh and shank centers lie at 43.6%, 43.0%, 43.3% and 43.3% of length from the proximal joint (Winter, Biomechanics and Motor Control of Human Movement, 2009). These adult male reference estimates and illustrative masses represent one teaching model. The model estimates their combined center of mass from the positions and assigned masses of the body segments and the weight. For the safety bar, the plate midpoint represents the full load, including the yoke and handles. Each posture is fitted to the same balance target underfoot. Compare these as complete setups. Several features change together, so the panels cannot isolate the effect of heel height. An individual lifter’s balance path and available depth can vary.'
};

(function(){
'use strict';
const modelCredits="The skull, pelvis, vertebrae, ribs, sternum, and bones of the limbs, hands and feet use simplified, fitted <a href=\"https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html\" target=\"_blank\" rel=\"noreferrer\">BodyParts3D</a> surfaces, © The Database Center for Life Science, <a href=\"https://creativecommons.org/licenses/by/4.0/\" target=\"_blank\" rel=\"noreferrer\">CC BY 4.0</a>. Three.js is licensed under MIT.";
const markup="<div id=\"lz-anatomy-zone\">\n<section class=\"azc-explorer\" aria-label=\"Interactive movement explorer\">\n      <div class=\"azc-toolbar\">\n        <div class=\"azc-pickers\">\n        <label class=\"azc-movement\" id=\"azc-body-field\">Body Movements<select id=\"azc-body-movement\" class=\"cursor-interaction\">\n          <option value=\"\" disabled selected>Choose a Body Movement</option>\n          <optgroup label=\"Pelvis &amp; Hip\"><option value=\"hike\">Pelvic Hike / Drop</option><option value=\"tilt\">Anterior / Posterior Pelvic Tilt</option><option value=\"hip\">Femoral Internal / External Rotation at the Hip</option></optgroup>\n          <optgroup label=\"Ribcage\"><option value=\"ribs\">Rib Motion During Breathing</option><option value=\"ribshift\">Posterior / Anterior Ribcage Shift</option></optgroup>\n          <optgroup label=\"Scapula\"><option value=\"scapula\">Protraction / Retraction</option></optgroup>\n          <optgroup label=\"Foot &amp; Ankle\"><option value=\"foot\">Pronation / Supination</option></optgroup>\n          <optgroup label=\"Whole Chain\"><option value=\"chain\">Pelvis, Ribcage &amp; Scapula</option></optgroup>\n        </select></label>\n        <label class=\"azc-movement is-active\" id=\"azc-exercise-field\">Exercises<select id=\"azc-exercise\" class=\"cursor-interaction\">\n          <option value=\"\" disabled>Choose an Exercise</option>\n          <option value=\"rdl\">Romanian Deadlift</option><option value=\"deadlift_types\">Deadlift Body Types</option><option value=\"squat\">Back Squat</option><option value=\"squatcom\">Squat COM Comparison</option><option value=\"lunge\" selected>Lunge</option><option value=\"press\">Seated Dumbbell Press</option><option value=\"row\">Seated Machine Row</option><option value=\"pullup\">Pull-Up</option><option value=\"dips\">Bar Dips</option><option value=\"pushup\">Push-Up</option><option value=\"bench\">Bench Press</option><option value=\"tension\">Tension &amp; DOF</option>\n        </select></label>\n        </div>\n<div class=\"azc-loading-controls\"><div class=\"azc-mode\" role=\"group\" aria-label=\"Loading strategy\"><button type=\"button\" class=\"cursor-interaction\" data-azc-mode=\"local\" aria-pressed=\"true\">Front Leg Loading</button><button type=\"button\" class=\"cursor-interaction\" data-azc-mode=\"chain\" aria-pressed=\"false\">Rear Leg Loading</button></div><button id=\"azc-front-hike\" type=\"button\" class=\"azc-hike-option cursor-interaction\" aria-pressed=\"false\">More Front Hip Hike</button></div>\n        <details id=\"azc-options\" class=\"azc-options\"><summary class=\"cursor-interaction\"><i data-lucide=\"sliders-horizontal\" aria-hidden=\"true\"></i>View &amp; Details</summary><div class=\"azc-options-panel\">\n          <label>Camera<select id=\"azc-camera\" class=\"cursor-interaction\"><option value=\"front\">Front</option><option value=\"oblique\">Oblique</option><option value=\"side\">Side</option><option value=\"back\">Back</option><option value=\"top\">Superior (from above)</option><option value=\"bottom\">Inferior (from below)</option></select></label>\n          <label id=\"azc-side-field\">Focus Side<select id=\"azc-side\" class=\"cursor-interaction\"><option value=\"right\">Right</option><option value=\"left\">Left</option></select></label>\n          <label class=\"azc-check\"><input id=\"azc-labels\" type=\"checkbox\">Show Anatomy Labels</label>\n          <label class=\"azc-check\"><input id=\"azc-ghost\" type=\"checkbox\">Show Neutral Reference</label>\n          <div class=\"azc-camera-zoom\" role=\"group\" aria-label=\"Camera zoom\"><button type=\"button\" id=\"azc-zoom-out\" class=\"azc-textbutton cursor-interaction\">Zoom out</button><button type=\"button\" id=\"azc-zoom-in\" class=\"azc-textbutton cursor-interaction\">Zoom in</button></div>\n          <button type=\"button\" id=\"azc-camera-reset\" class=\"azc-textbutton cursor-interaction\">Reset Camera</button>\n          <details id=\"azc-source\"><summary class=\"cursor-interaction\">Model &amp; Sources<i data-lucide=\"chevron-down\" aria-hidden=\"true\"></i></summary><p id=\"azc-source-text\"></p><p id=\"azc-source-note\"></p><p>Jamie Smith course slides · <a href=\"https://pmc.ncbi.nlm.nih.gov/articles/PMC9603242/\" target=\"_blank\" rel=\"noreferrer\">Dips study</a> · <a href=\"https://pmc.ncbi.nlm.nih.gov/articles/PMC6221737/\" target=\"_blank\" rel=\"noreferrer\">Push-Up Plus study</a> · <a href=\"https://www.hrpub.org/journals/article_info.php?aid=7784\" target=\"_blank\" rel=\"noreferrer\">Bench Press Leg Drive study</a></p><p id=\"azc-com-source-links\" hidden><a href=\"https://pubmed.ncbi.nlm.nih.gov/30363042/\" target=\"_blank\" rel=\"noreferrer\">Safety squat bar study</a> · <a href=\"https://pubmed.ncbi.nlm.nih.gov/35877352/\" target=\"_blank\" rel=\"noreferrer\">Heel elevation study</a></p><p>" + modelCredits + "</p></details>\n        </div></details>\n      </div>\n      <div id=\"azc-tension-pane\" hidden></div>\n      <div class=\"azc-stage-area\">\n        <div class=\"azc-stage-title\"><h2 id=\"azc-title\">Lunge</h2><span id=\"azc-focus\">Right Front Leg Loading</span></div>\n        <div id=\"azc-stage\" role=\"img\" aria-label=\"Interactive schematic anatomy. Drag to rotate and scroll to zoom.\"></div>\n        <div id=\"azc-com-grid\" class=\"azc-com-grid\" hidden><section class=\"azc-com-panel\"><h3>Goblet Squat</h3><p>Dumbbell held at the chest</p><div class=\"azc-com-stage\" id=\"azc-com-cgoblet\" role=\"img\" aria-label=\"Goblet squat model\"></div></section><section class=\"azc-com-panel\"><h3>Heels Raised</h3><p>Bar on back, heels on a visible wedge</p><div class=\"azc-com-stage\" id=\"azc-com-cheels\" role=\"img\" aria-label=\"Heel elevated squat model\"></div></section><section class=\"azc-com-panel\"><h3>Safety Bar Squat</h3><p>The model places the 20 kg load at the midpoint between the plates.</p><div class=\"azc-com-stage\" id=\"azc-com-csafety\" role=\"img\" aria-label=\"Safety bar squat model\"></div></section></div><div id=\"azc-com-legend\" class=\"azc-com-legend\" hidden><span aria-hidden=\"true\"></span>The blue dot shows the lifter and load’s combined center of mass. Each posture is fitted to the same balance target underfoot.</div><div class=\"azc-stage-caption\"><span>Drag to rotate <b>·</b> Scroll to zoom</span><span>Schematic anatomy</span></div>\n      </div>\n      <div class=\"azc-bottom\">\n        <p id=\"azc-explanation\" aria-live=\"polite\">Right foot forward, left foot behind. Follow the shift toward the front leg.</p>\n        <div class=\"azc-slider-row\"><span id=\"azc-negative\">Top</span><input id=\"azc-range\" type=\"range\" min=\"0\" max=\"100\" value=\"45\" step=\"1\" aria-label=\"Movement position\"><span id=\"azc-positive\">Lower</span></div>\n        <div class=\"azc-bottom-actions\"><button type=\"button\" id=\"azc-play\" class=\"azc-play cursor-interaction\" aria-pressed=\"false\"><i data-lucide=\"play\" aria-hidden=\"true\"></i><span>Play</span></button><button type=\"button\" id=\"azc-reset\" class=\"azc-reset cursor-interaction\"><i data-lucide=\"rotate-ccw\" aria-hidden=\"true\"></i>Reset</button><span id=\"azc-mode-hint\">Illustrative comparison</span></div>\n      </div>\n    </section>\n</div>";
window.LZAnatomyRuntime={modelCredits,mount(host,opts={}){
  host.innerHTML=markup;
  const root=host.querySelector('#lz-anatomy-zone');
  let viewer,tension=null,tensionActive=false;let comparisonViewers=[],comparisonFrame=0,viewerGeneration=0,comparisonActive=false,comparisonZoom=0,comparisonOrbit=null;const listeners=[];
  try{
  const q=s=>root.querySelector(s),all=s=>Array.from(root.querySelectorAll(s));
  const anatomy=window.azCleanSceneData,exercises=window.azAppliedScenes;
  viewer=window.createAnatomyViewer(q('#azc-stage'));
  const state={movement:'lunge',amount:.45,mode:'chain',scenario:'a',frontHipHike:false,side:'right',labels:false,ghost:false,minimal:true};
  state.bodyType='longLong';
  const {lessons,stages,babyTime,duration}=window.azDevelopmentLessons;
  const development=()=>lessons[state.movement];
  const movementGroup=document.createElement('optgroup');movementGroup.label='Development & Locomotion';
  for(const [value,{title}] of Object.entries(lessons))movementGroup.append(new Option(title,value));
  q('#azc-body-movement').append(movementGroup);
  const balanceLegend=document.createElement('div');
  balanceLegend.className='azc-balance-legend';balanceLegend.hidden=true;
  for(const [symbol,title] of [['mass','Center of mass'],['projection','Floor projection'],['base','Floor support']]){
    const item=document.createElement('span'),key=document.createElement('i');
    key.className='azc-key-'+symbol;key.setAttribute('aria-hidden','true');item.append(key,title);balanceLegend.append(item);
  }
  q('.azc-stage-area').after(balanceLegend);
  const sources=document.createElement('p'),sourceLink=document.createElement('a');
  sourceLink.target='_blank';sourceLink.rel='noreferrer';sources.append(sourceLink);
  const courseLinks=q('#azc-source-note').nextElementSibling;
  q('#azc-source-note').after(sources);sources.hidden=true;
  const bodyTypes=document.createElement('div');
  bodyTypes.className='azc-body-types';bodyTypes.hidden=true;
  bodyTypes.setAttribute('role','group');bodyTypes.setAttribute('aria-label','Deadlift body type');
  for(const [id,build] of Object.entries(window.azDeadliftBuilds)){
    const button=document.createElement('button');button.type='button';button.textContent=build.label;
    button.dataset.bodyType=id;bodyTypes.append(button);
    listen(button,'click',()=>{if(state.movement==='deadlift_types'){pause();state.bodyType=id;render();}});
  }
  q('.azc-loading-controls').after(bodyTypes);
  let playing=false,frame=0,last=0,direction=1,destroyed=false;
  let previousRibWidth=null,ribDirection=1;
  function listen(el,type,fn,options){el.addEventListener(type,fn,options);listeners.push(()=>el.removeEventListener(type,fn,options));}
  const comparison=()=>state.movement==='squatcom';
  const applied=()=>Boolean(exercises[state.movement]);
  const wholeChainOnly=()=>Boolean(exercises[state.movement]?.wholeChainOnly);
  function text(selector,value){const el=q(selector);if(el.textContent!==value)el.textContent=value;}
  function icons(){if(window.lucide)window.lucide.createIcons({attrs:{width:16,height:16}});}
  const short={hike:['Drop','Hike'],tilt:['Posterior Tilt','Anterior Tilt'],hip:['External','Internal'],ribs:['Exhale','Inhale'],ribshift:['Anterior','Posterior'],scapula:['Retract','Protract'],foot:['Supinate','Pronate'],chain:['Anterior Pattern','Posterior Pattern']};
  const transfers=['The head turns as the baby prepares to roll.','The baby brings the hands beneath the shoulders.','The chest lowers as the baby reaches forward.','The hips rise and the knees move under the trunk.','The hips settle back and the legs come forward into sitting.','The baby turns toward the rail, gathers the feet and reaches for support.','The baby releases the rail and shifts weight onto one foot.'];
  const returnCaptions={
    rdl:'The hips extend and the trunk rises as the bar returns toward the thighs.',
    squat:'As the body rises, the hips and knees extend and the feet stay planted.',
    squatcom:'Follow each combined center of mass as the lifters rise from the squat.',
    press:'The dumbbells lower toward the shoulders as the elbows bend and the upper arms descend.',
    row:'The elbows extend and the shoulder blades travel forward around the ribs as the handles return.',
    pullup:'The body lowers from the fixed bar. The elbows extend as the upper arms return overhead relative to the trunk.'
  };
  function detail(){
    if(state.movement==='lunge'&&state.scenario==='a'&&state.frontHipHike)return direction<0?'The right front leg drives the return with the stronger hike and forward body position.':'A stronger right pelvic hike accompanies a shift of the pelvis and trunk toward the right front foot.';
    const example=exercises[state.movement];
    if(state.movement==='deadlift_types')return bodyTypeCaptions[state.amount<.015?0:state.amount>.985?2:1];
    if(direction<0&&state.amount>.025&&state.amount<.999&&returnCaptions[state.movement])return returnCaptions[state.movement];
    if(direction<0&&state.amount>.025&&state.amount<.999){if(state.movement==='lunge')return state.scenario==='a'?'Drive the return through the right front leg while following the pelvis.':'Drive the return through the left rear leg in this selected loading strategy.';if(state.movement==='dips')return state.scenario==='b'?'The trunk opens as the arms return toward shoulder flexion.':'Shoulder flexion and elbow extension accompany the ascent.';if(state.movement==='pushup')return state.scenario==='b'?'The elbows straighten as the scapulae protract, with the pelvis kept tucked.':'The shoulders and elbows coordinate as the body rises from the fixed hands.';if(state.movement==='bench')return state.scenario==='b'?'The arms press the bar up as the feet push into the floor and the upper back stays supported.':'The upper arms move toward the starting position as the elbows straighten.';}if(example){
      if(state.movement==='squat'&&state.scenario==='a')return example.captions.a[state.amount<.15?0:viewer?.squatBelowKnees?2:1];
      if(state.movement==='row')return example.captions[state.scenario][state.amount<.15?0:viewer?.rowPastTrunk?2:1];
      const endpoint=state.movement==='pushup'?1:.75;
      const phase=state.amount<.15?0:state.amount<endpoint?1:2;
      return example.captions[state.scenario][phase];
    }
    const p=state.amount>0,side=state.side==='right'?'right':'left',chain=state.mode==='chain';
    if(state.movement==='ribs'){
      if(state.amount===1)return 'Full inhalation. The ribcage is at its widest.';
      if(state.amount===-1)return 'Full exhalation. The ribcage is at its narrowest.';
      if(playing)return ribDirection>0?'Inhaling. The ribs rise and move outward.':'Exhaling. The ribs lower and move inward.';
      if(state.amount===0)return 'The ribcage is in its neutral position.';
      return p?'The ribs are raised and the ribcage is wider than at neutral.':'The ribs are lowered and the ribcage is narrower than at neutral.';
    }
    if(state.amount===0)return 'Neutral position.';
    switch(state.movement){
      case 'hike':return chain?(p?'Pelvic hike paired with hip internal rotation.':'Pelvic drop paired with hip external rotation.'):'The '+side+' side of the pelvis '+(p?'rises.':'lowers.');
      case 'tilt':return p?'The front of the pelvis tips forward and down about the hip centers. The femurs stay still.':'The front of the pelvis tips backward and up about the hip centers. The femurs stay still.';
      case 'hip':return 'The '+side+' femur turns '+(p?'inward, toward':'outward, away from')+' the midline at the hip. The pelvis stays still.';
      case 'ribshift':return 'The ribcage shifts '+(p?'backward':'forward')+(chain?(p?', paired with scapular protraction.':', paired with scapular retraction.'):' relative to the pelvis.');
      case 'scapula':return p?'The scapulae move around the ribcage into protraction.':'The scapulae move toward the spine into retraction.';
      case 'foot':return chain?(p?'Foot pronation, tibial and femoral internal rotation, and hip adduction.':'Foot supination, tibial and femoral external rotation, and hip abduction.'):'The '+side+' foot '+(p?'pronates as the arch lowers and midfoot ground contact broadens.':'supinates as the arch rises and medial ground contact narrows.');
      case 'chain':return chain?(p?'Posterior pelvic tilt, posterior ribcage shift and scapular protraction.':'Anterior pelvic tilt, anterior ribcage shift and scapular retraction.'):(p?'Posterior pelvic tilt, relative to the visible femurs.':'Anterior pelvic tilt, relative to the visible femurs.');
    }
  }
  function disposeComparison(){
    viewerGeneration++;cancelAnimationFrame(comparisonFrame);comparisonFrame=0;all('.azc-com-error').forEach(el=>el.remove());
    const previous=comparisonViewers;comparisonViewers=[];
    for(const item of previous)item.viewer.dispose();
    for(const id of ['cgoblet','cheels','csafety'])q('#azc-com-'+id).replaceChildren();
  }
  function comparisonState(id){return {...state,movement:id,mode:'chain',labels:false,ghost:false,view:q('#azc-camera').value,ascending:direction<0};}
  function syncViewers(){
    if(comparison()){
      if(!comparisonActive){
        comparisonActive=true;comparisonZoom=0;comparisonOrbit=null;viewer?.dispose();viewer=null;disposeComparison();
        const generation=viewerGeneration,ids=['cgoblet','cheels','csafety'];let index=0;
        function createNext(){
          comparisonFrame=0;if(destroyed||!comparisonActive||generation!==viewerGeneration)return;
          const id=ids[index++],container=q('#azc-com-'+id);
          try{
            const model=window.createAnatomyViewer(container,comparisonState(id),{
              onOrbit(yaw,pitch){
                comparisonOrbit={yaw,pitch};
                for(const other of comparisonViewers)if(other.id!==id)other.viewer.setOrbit(yaw,pitch);
              },
              onZoom(factor){stepZoom(Math.log(factor)/Math.log(1.2));}
            });
            if(destroyed||!comparisonActive||generation!==viewerGeneration){model.dispose();return;}
            if(comparisonOrbit)model.setOrbit(comparisonOrbit.yaw,comparisonOrbit.pitch);
            if(comparisonZoom)model.zoomCamera(1.2**comparisonZoom);
            comparisonViewers.push({id,viewer:model});
            if(index<ids.length)comparisonFrame=requestAnimationFrame(createNext);
          }catch(error){
            disposeComparison();pause();const notice=document.createElement('p');notice.setAttribute('role','alert');notice.className='azc-com-error';notice.textContent='The squat comparison could not load. Choose another movement and reopen it to retry.';q('#azc-com-grid').appendChild(notice);
          }
        }
        comparisonFrame=requestAnimationFrame(createNext);
      }else for(const item of comparisonViewers)item.viewer.update(comparisonState(item.id));
    }else{
      if(comparisonActive){comparisonActive=false;disposeComparison();}
      if(!viewer){viewer=window.createAnatomyViewer(q('#azc-stage'),{...state,view:q('#azc-camera').value,ascending:direction<0});}
      else viewer.update({...state,ascending:direction<0});
    }
  }
  function leaveTension(){if(!tensionActive)return;tension?.destroy();tension=null;tensionActive=false;root.classList.remove('azc-tension-active');q('#azc-tension-pane').hidden=true;}
  function openTension(){
    balanceLegend.hidden=true;
    pause();q('#azc-options').open=false;
    if(tensionActive)return;
    viewer?.dispose();viewer=null;comparisonActive=false;disposeComparison();tensionActive=true;root.classList.add('azc-tension-active');q('#azc-tension-pane').hidden=false;q('#azc-body-movement').value='';q('#azc-exercise').value='tension';q('#azc-body-field').classList.remove('is-active');q('#azc-exercise-field').classList.add('is-active');
    root.anatomyExerciseState={...state,playing:false,section:'tension'};
    try{if(!window.LZAnatomyTension?.mount)throw Error('Tension & DOF could not load. Choose another movement and reopen it to retry.');tension=window.LZAnatomyTension.mount(q('#azc-tension-pane'));}catch(error){const notice=document.createElement('p');notice.setAttribute('role','alert');notice.textContent=error.message;q('#azc-tension-pane').replaceChildren(notice);}
  }
  function setCamera(value){comparisonOrbit=null;if(comparison())for(const item of comparisonViewers)item.viewer.setView(value);else viewer?.setView(value);}
  function stepZoom(step){
    if(!comparison()){viewer?.zoomCamera(1.2**step);return;}
    const next=Math.max(-6,Math.min(6,comparisonZoom+step)),factor=1.2**(next-comparisonZoom);
    comparisonZoom=next;for(const item of comparisonViewers)item.viewer.zoomCamera(factor);
  }
  function resetCamera(){comparisonZoom=0;if(comparison())for(const item of comparisonViewers)item.viewer.resetCamera();else viewer?.resetCamera();}
  function render(){
    if(destroyed||tensionActive)return;
    if(wholeChainOnly()){state.mode='chain';state.scenario='b';}
    const special=development(),baby=state.movement==='baby',chimp=state.movement==='chimp';
    balanceLegend.hidden=!baby;
    const timing=baby?babyTime(state.amount):null;
    const stage=baby?timing.stage+(timing.blend>=.5?1:0):0;
    const ex=exercises[state.movement],d=special||ex||anatomy[state.movement],chain=state.mode==='chain',neutral=state.amount===0;
    q('#azc-body-field').classList.toggle('is-active',!ex);q('#azc-exercise-field').classList.toggle('is-active',Boolean(ex));
    const scrub=q('#azc-range');
    scrub.min=ex||special?'0':'-100';scrub.step=baby?'.1':'1';
    scrub.value=String(baby?Math.round(state.amount*1000)/10:Math.round(state.amount*100));
    if(baby)scrub.setAttribute('aria-valuetext',Math.round(state.amount*duration)+' seconds, '+stages[stage][0]);
    else scrub.removeAttribute('aria-valuetext');
    all('[data-azc-mode]').forEach((b,i)=>{b.setAttribute('aria-pressed',String(ex?state.scenario===(i?'b':'a'):b.dataset.azcMode===state.mode));b.textContent=chimp?(i?'Pelvis':'Walking'):ex?ex.labels[i]:i?(['hip','tilt'].includes(state.movement)?'Whole Body':'Chain'):'Local';});
    q('.azc-mode').setAttribute('aria-label',chimp?'Comparison view':ex?'Setup comparison':'Movement mode');
    q('.azc-mode').hidden=wholeChainOnly()||baby;
    q('.azc-loading-controls').hidden=wholeChainOnly()||baby;

    const deadlift=state.movement==='deadlift_types';
    sources.hidden=!special&&!deadlift;courseLinks.hidden=Boolean(special||deadlift);
    if(deadlift){sourceLink.textContent='Standing shoulder, hip and knuckle heights';sourceLink.href='https://stacks.cdc.gov/view/cdc/218478/cdc_218478_DS1.pdf';}
    if(special){sourceLink.textContent=special.link[0];sourceLink.href=special.link[1];}
    bodyTypes.hidden=state.movement!=='deadlift_types';
    for(const button of bodyTypes.children)button.setAttribute('aria-pressed',String(button.dataset.bodyType===state.bodyType));
    const canHike=state.movement==='lunge'&&state.scenario==='a';q('#azc-front-hike').hidden=!canHike;q('#azc-front-hike').setAttribute('aria-pressed',String(canHike&&state.frontHipHike));
    q('#azc-ghost').parentNode.hidden=Boolean(ex||special);q('#azc-labels').parentNode.hidden=comparison()||Boolean(special);
    q('#azc-stage').hidden=comparison();q('#azc-com-grid').hidden=!comparison();q('#azc-com-legend').hidden=!comparison();q('#azc-com-source-links').hidden=!comparison();q('.azc-stage-area').classList.toggle('is-com',comparison());
    const label=special?d.title:state.movement==='ribs'?d.title:ex?ex.title:neutral?'Neutral Position':state.amount>0?d.positive:d.negative;
    text('#azc-title',label);
    const lower=!ex&&['hike','hip','foot'].includes(state.movement);
    text('#azc-focus',baby?stages[stage][0]:chimp?(chain?'Pelvic shape':'Walking cycle'):state.movement==='deadlift_types'?window.azDeadliftBuilds[state.bodyType].label:state.movement==='lunge'?(state.scenario==='a'?'Right Front Leg Loading'+(state.frontHipHike?' · More Hip Hike':''):'Left Rear Leg Loading'):ex?ex.labels[state.scenario==='a'?0:1]:lower?(state.side==='right'?'Right side':'Left side'):state.movement==='chain'?'Pelvis, ribcage and scapula':'');
    q('#azc-focus').hidden=comparison()||!special&&!ex&&!lower&&state.movement!=='chain';q('#azc-side-field').hidden=!lower;
    text('#azc-negative',baby?'Lying on the back':special?(chimp&&chain?'Front view':'Start'):ex?ex.ends[0]:short[state.movement][0]);text('#azc-positive',baby?'First steps':special?(chimp&&chain?'Turned view':'Finish'):ex?ex.ends[1]:short[state.movement][1]);
    syncViewers();
    if(state.movement==='ribs'){
      const width=viewer.ribWidth;
      if(previousRibWidth!==null&&Math.abs(width-previousRibWidth)>1e-9)ribDirection=Math.sign(width-previousRibWidth);
      previousRibWidth=width;
    }else previousRibWidth=null;
    const explanation=baby?(timing.blend?transfers[timing.stage]:stages[stage][1]):chimp?(chain?
      'Compare the highlighted iliac blades. The human blades are shorter and curve around the sides of the body. The chimpanzee blades are taller and narrower. Turn the models to see the difference.':
      'Follow the points of contact. The human alternates support between the feet while the arms swing. The chimpanzee also bears weight through the knuckles, with a more inclined trunk and longer forelimbs.'):detail();
    text('#azc-explanation',explanation);text('#azc-source-text',d.source);text('#azc-source-note',chimp?'The chimpanzee skeleton is an illustrative reconstruction. The pelvis comparison shows relative shape at a common display scale.':baby?'The gold dot estimates whole body center of mass using illustrative fixed segment masses. Shading outlines the floor area between near-contact surfaces. The model illustrates movement and does not measure forces or predict falls.':d.note);
    text('#azc-mode-hint',baby?'Continuous sequence':chimp?(chain?'Comparative anatomy':'Locomotion comparison'):state.movement==='ribs'?'Ribs and sternum shown':state.movement==='rdl'?'Teal arrows show intended foot pressure':ex?(wholeChainOnly()?'Teaching example':'Illustrative comparison'):state.movement==='tilt'&&chain?'Whole body reference':state.movement==='hip'&&chain?'Whole body reference':state.movement==='foot'&&chain?'Loaded-leg example':chain?'Chain teaching preset':'Local view');
    q('#azc-stage').setAttribute('aria-label','Interactive schematic anatomy. '+label+'. '+explanation+' Drag to rotate and scroll to zoom.');
    root.anatomyExerciseState={...state,playing,section:'movement'};
  }
  function pause(value=false){playing=value;cancelAnimationFrame(frame);last=0;q('#azc-play').innerHTML='<i data-lucide="'+(value?'pause':'play')+'" aria-hidden="true"></i><span>'+(value?'Pause':'Play')+'</span>';q('#azc-play').setAttribute('aria-pressed',String(value));icons();if(playing){if(development()){if(state.amount>=1)state.amount=0;direction=1;render();}else if(state.amount>.97)direction=-1;else if(state.amount<(applied()?.03:-.97))direction=1;frame=requestAnimationFrame(tick);}if(state.movement==='ribs'&&!tensionActive){ribDirection=direction;text('#azc-explanation',detail());q('#azc-stage').setAttribute('aria-label','Interactive schematic anatomy. '+detail()+' Drag to rotate and scroll to zoom.');}root.anatomyExerciseState={...state,playing};}
  function tick(now){if(!playing||destroyed)return;const software=comparison()?comparisonViewers.some(item=>item.viewer.isFallback):viewer?.isFallback;if(software&&last&&now-last<(comparison()?110:65)){frame=requestAnimationFrame(tick);return;}const elapsed=last?(now-last)/1000:0;const dt=Math.min(elapsed,software||comparison()?.25:.06);last=now;if(development()){
    // Keep the next support change visible when a stalled tab resumes.
    const step=state.movement==='baby'?Math.min(elapsed,.25)/duration:elapsed/4;
    state.amount=Math.min(1,state.amount+step);if(state.amount===1)pause();render();if(playing)frame=requestAnimationFrame(tick);return;}state.amount+=direction*dt*(applied()?.20:.28);const minimum=applied()?0:-1;if(state.amount>=1){state.amount=1;direction=-1;}else if(state.amount<=minimum){state.amount=minimum;direction=1;}render();frame=requestAnimationFrame(tick);}
  function setAmount(value){direction=value<state.amount?-1:1;pause();state.amount=Math.max(applied()||development()?0:-1,Math.min(1,value));render();}
  function defaultView(){if(development())return state.movement==='chimp'&&state.mode==='chain'?'front':'oblique';if(applied())return exercises[state.movement].view;return ['tilt','ribshift'].includes(state.movement)?'side':state.movement==='scapula'?'back':state.movement==='hip'?'oblique':state.movement==='foot'?(state.mode==='chain'?'front':'oblique'):'front';}
  function selectMovement(value){if(value==='tension'){openTension();return;}if(!anatomy[value]&&!exercises[value]&&!lessons[value])return;leaveTension();pause();direction=1;state.frontHipHike=false;state.movement=value;state.amount=comparison()?1:value==='deadlift_types'?0:applied()?.12:0;if(!applied())state.mode=value==='chain'?'chain':'local';if(applied()){state.mode='chain';state.scenario=wholeChainOnly()||['pullup','dips'].includes(state.movement)?'b':'a';state.ghost=false;q('#azc-ghost').checked=false;}q('#azc-body-movement').value=applied()?'':value;q('#azc-exercise').value=applied()?value:'';const view=defaultView();q('#azc-camera').value=view;render();setCamera(view);}
  listen(q('#azc-body-movement'),'change',e=>selectMovement(e.target.value));listen(q('#azc-exercise'),'change',e=>selectMovement(e.target.value));
  all('[data-azc-mode]').forEach(b=>listen(b,'click',()=>{if(wholeChainOnly())return;if(state.movement==='chimp'){pause();state.amount=0;state.mode=b.dataset.azcMode;render();const view=defaultView();q('#azc-camera').value=view;setCamera(view);return;}if(applied()){const next=b.dataset.azcMode==='local'?'a':'b';if(next!==state.scenario)state.frontHipHike=false;state.scenario=next;state.mode='chain';}else state.mode=b.dataset.azcMode;render();if(state.movement==='foot'){const view=defaultView();q('#azc-camera').value=view;setCamera(view);}}));
  listen(q('#azc-front-hike'),'click',()=>{if(state.movement!=='lunge'||state.scenario!=='a')return;state.frontHipHike=!state.frontHipHike;render();});
  listen(q('#azc-side'),'change',e=>{state.side=e.target.value;render();if(['foot','hip'].includes(state.movement)&&q('#azc-camera').value==='oblique')setCamera('oblique');});
  listen(q('#azc-range'),'input',e=>setAmount(Number(e.target.value)/100));
  listen(q('#azc-play'),'click',()=>pause(!playing));listen(q('#azc-reset'),'click',()=>setAmount(0));
  listen(q('#azc-camera'),'change',e=>setCamera(e.target.value));
  listen(q('#azc-zoom-in'),'click',()=>stepZoom(-1));listen(q('#azc-zoom-out'),'click',()=>stepZoom(1));
  listen(q('#azc-camera-reset'),'click',()=>{const view=defaultView();resetCamera();q('#azc-camera').value=view;setCamera(view);});
  listen(q('#azc-labels'),'change',e=>{state.labels=e.target.checked;render();});listen(q('#azc-ghost'),'change',e=>{state.ghost=e.target.checked;render();});
  listen(root,'click',e=>{if(!q('#azc-options').contains(e.target))q('#azc-options').open=false;});listen(document,'visibilitychange',()=>{if(document.hidden)pause();});
  q('#azc-body-movement').value=applied()?'':state.movement;q('#azc-exercise').value=applied()?state.movement:'';render();const view=defaultView();q('#azc-camera').value=view;setCamera(view);

  return {
    flush:async()=>{},
    destroy(){
      if(destroyed)return;
      destroyed=true;playing=false;cancelAnimationFrame(frame);frame=0;
      for(const remove of listeners.splice(0))remove();
      tension?.destroy();tension=null;viewer?.dispose();viewer=null;comparisonActive=false;disposeComparison();
      delete root.anatomyExerciseState;
      if(root.parentNode===host)host.replaceChildren();
    }
  };

  }catch(error){for(const remove of listeners.splice(0))remove();tension?.destroy();viewer?.dispose();for(const item of comparisonViewers)item.viewer.dispose();cancelAnimationFrame(comparisonFrame);host.replaceChildren();throw error;}
}};
})();
