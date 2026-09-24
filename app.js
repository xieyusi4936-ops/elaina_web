// Defer off-screen artwork so a slow connection can finish the first image first.
function loadPicture(picture) {
  if (!picture) return;
  picture.querySelectorAll('source[data-srcset]').forEach(source => {
    source.srcset = source.dataset.srcset;
    source.removeAttribute('data-srcset');
  });
  const image = picture.querySelector('img[data-src]');
  if (image) {image.src = image.dataset.src; image.removeAttribute('data-src');}
}
function loadSceneImage(index) {loadPicture(document.querySelectorAll('.scene picture')[index]);}
const deferredCards = document.querySelectorAll('.cover picture');
if ('IntersectionObserver' in window) {
  const artworkObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {if(entry.isIntersecting){loadPicture(entry.target.querySelector('picture'));artworkObserver.unobserve(entry.target);}});
  },{rootMargin:'150px'});
  deferredCards.forEach(picture => artworkObserver.observe(picture.parentElement));
} else {deferredCards.forEach(loadPicture);}
// Retry failed modern image sources once using the compatible JPEG fallback.
function useImageFallback(image) {
  if (!image.dataset.fallback || image.dataset.retried) return;
  image.dataset.retried = 'true';
  image.closest('picture')?.querySelectorAll('source').forEach(source => source.remove());
  image.src = image.dataset.fallback;
}
document.querySelectorAll('img[data-fallback]').forEach(image => {
  image.addEventListener('error', () => useImageFallback(image));
  if (image.hasAttribute('src') && image.complete && !image.naturalWidth) useImageFallback(image);
});
const scenes = [...document.querySelectorAll('.scene')];
const story = document.querySelector('.story');
const dots = [...document.querySelectorAll('.scene-dots button')];
const label = document.querySelector('#scene-label');
const next = document.querySelector('#next');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let current = -1;
function stepSize() { return (story.offsetHeight - innerHeight) / 2; }
function showScene(index) {
  loadSceneImage(index);
  if (index === current) return;
  current = index;
  scenes.forEach((scene, i) => { scene.classList.toggle('active', i === index); scene.inert = i !== index; scene.setAttribute('aria-hidden', String(i !== index)); });
  dots.forEach((dot, i) => { if (i === index) dot.setAttribute('aria-current', 'step'); else dot.removeAttribute('aria-current'); });
  label.textContent = ['01 — HELLO', '02 — ABOUT ME', '03 — MY JOURNEY'][index];
  next.innerHTML = `${index === 2 ? '浏览作品' : '向下探索'} <span>↓</span>`;
  next.setAttribute('aria-label', index === 2 ? '浏览作品' : '下一幕');
}
const stage = document.querySelector('.stage');
const layer = document.querySelector('.transition-layer');
const videos = [...document.querySelectorAll('.transition-video')];
let desired = 0;
let playback = null;
function stopPlayback() {
  if (!playback) return;
  const active = playback;
  playback = null;
  clearTimeout(active.timer);
  active.video.onended = null;
  active.video.onerror = null;
  active.video.onplaying = null;
  active.video.pause();
  layer.classList.remove('visible');
  stage.classList.remove('transitioning');
  stage.removeAttribute('aria-busy');
}
function continueToDesired() {
  if (playback || desired === current) return;
  if (reduceMotion || desired < current || current < 0) { showScene(desired); return; }
  const destination = current + 1;
  loadSceneImage(destination);
  const video = videos[current];
  const active = { video, destination, timer: null };
  playback = active;
  const finish = () => {
    if (playback !== active) return;
    stopPlayback();
    showScene(destination);
    continueToDesired();
  };
  videos.forEach(item => item.classList.toggle('selected', item === video));
  stage.setAttribute('aria-busy', 'true');
  video.muted = true;
  resetWater();
  if (!video.getAttribute('src')) video.src = video.dataset.src;
  video.currentTime = 0;
  video.onplaying = () => {
    if (playback !== active) return;
    layer.classList.add('visible');
    stage.classList.add('transitioning');
  };
  video.onended = finish;
  video.onerror = finish;
  // Network errors or a denied play request must never block navigation.
  active.timer = setTimeout(finish, 8000);
  video.play().catch(finish);
}
function requestScene(index, skipAnimation = false) {
  desired = index;
  if (skipAnimation || reduceMotion || (playback && index < playback.destination)) {
    stopPlayback();
    showScene(index);
    return;
  }
  continueToDesired();
}
function update() {
  const index = Math.max(0, Math.min(2, Math.round((scrollY - story.offsetTop) / stepSize())));
  const outside = scrollY >= story.offsetTop + story.offsetHeight - innerHeight + 80;
  requestScene(index, outside || document.hidden);
}
addEventListener('visibilitychange', () => { if (document.hidden) { stopPlayback(); showScene(desired); } });
let queued = false;
addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { update(); queued = false; }); } }, { passive: true });
addEventListener('resize', update);
function goToScene(index) { scrollTo({ top: story.offsetTop + stepSize() * index, behavior: 'instant' }); update(); }
document.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => goToScene(Number(button.dataset.scene))));
next.addEventListener('click', () => desired < 2 ? goToScene(desired + 1) : document.querySelector('#projects').scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth' }));
showScene(Math.max(0, Math.min(2, Math.round((scrollY - story.offsetTop) / stepSize()))));
desired = current;
const projects = [{title:'初次见面',image:'assets/scene-1.webp',alt:'银色 Elaina Design 字样与伸手的角色'}, {title:'靠近我的世界',image:'assets/scene-2.webp',alt:'伸手打招呼的 Elaina 角色'}, {title:'创作进行时',image:'assets/scene-3.webp',alt:'角色与设计软件方块'}];
const dialog = document.querySelector('#project-dialog');
let opener;
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  const project = projects[Number(button.dataset.project)];
  opener = button;
  document.querySelector('#project-title').textContent = project.title;
  const image = document.querySelector('#detail-image'); image.src = project.image.replace('.webp', matchMedia('(max-width: 700px)').matches ? '-mobile-v2.jpg' : '-fallback-v2.jpg'); image.alt = project.alt;
  document.body.classList.add('modal-open'); dialog.showModal(); dialog.scrollTop = 0;
}));
document.querySelectorAll('.close,.close-bottom').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); opener?.focus({preventScroll:true}); });

// Refraction distorts the original media pixels. No painted rings or tint overlay.
const waterMotion = matchMedia('(prefers-reduced-motion: reduce)');
const waterPointer = matchMedia('(pointer: fine)');
const svgNamespace = 'http://www.w3.org/2000/svg';
function svgNode(name, attributes = {}) {
  const node = document.createElementNS(svgNamespace, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}
const waterDefinitions = svgNode('svg', {'aria-hidden':'true',class:'water-filter-definitions'});
const waterDefs = svgNode('defs');
waterDefinitions.append(waterDefs); document.body.append(waterDefinitions);
// R/G encode the horizontal/vertical surface normal; neutral gray leaves pixels unchanged.
const normalCanvas = document.createElement('canvas'); normalCanvas.width = normalCanvas.height = 192;
const normalContext = normalCanvas.getContext('2d');
const normalPixels = normalContext.createImageData(192,192);
for (let y = 0; y < 192; y++) for (let x = 0; x < 192; x++) {
  const dx = (x - 95.5) / 95.5, dy = (y - 95.5) / 95.5;
  const radius = Math.hypot(dx,dy);
  const envelope = radius < 1 ? Math.sin(Math.PI * radius) ** 2 * (1 - radius) : 0;
  const wave = Math.sin(radius * Math.PI * 5) * envelope * 2.4;
  const index = (y * 192 + x) * 4;
  normalPixels.data[index] = 128 + 115 * dx / (radius || 1) * wave;
  normalPixels.data[index+1] = 128 + 115 * dy / (radius || 1) * wave;
  normalPixels.data[index+2] = 128;
  normalPixels.data[index+3] = 255;
}
normalContext.putImageData(normalPixels,0,0);
const normalMap = normalCanvas.toDataURL();
const waterMedia = [...document.querySelectorAll('.scene img,.cover img,#detail-image')];
const waterFilters = new Map();
function filterFor(media) {
  if (waterFilters.has(media)) return waterFilters.get(media);
  const id = `water-refraction-${waterFilters.size}`;
  const filter = svgNode('filter',{id,x:'0%',y:'0%',width:'100%',height:'100%','color-interpolation-filters':'sRGB'});
  filter.append(svgNode('feFlood',{'flood-color':'rgb(128,128,128)',result:'neutral'}));
  const waves = [];
  for (let i = 0; i < 1; i++) {
    const map = svgNode('feImage',{href:normalMap,x:0,y:0,width:1,height:1,preserveAspectRatio:'none',result:`normal-${i}`});
    const composite = svgNode('feComposite',{in:`normal-${i}`,in2:'neutral',operator:'over',result:`map-${i}`});
    const displacement = svgNode('feDisplacementMap',{in:i ? `wave-${i-1}`:'SourceGraphic',in2:`map-${i}`,scale:0,xChannelSelector:'R',yChannelSelector:'G',result:`wave-${i}`});
    filter.append(map,composite,displacement); waves.push({map,displacement});
  }
  waterDefs.append(filter);
  const entry = {id,waves}; waterFilters.set(media,entry); return entry;
}
let waterWaves = [], waterFrame = 0;
let lastWater = {x:-1000,y:-1000,time:0};
function resetWater() {
  cancelAnimationFrame(waterFrame); waterFrame = 0; waterWaves = [];
  waterMedia.forEach(media => media.style.removeProperty('filter'));
}
let lastWaterFrame = 0;
function renderWater(now) {
  if (playback || waterMotion.matches || document.hidden) {resetWater(); return;}
  // Limit expensive filter paints to 30fps; collect layout before any SVG writes.
  if (now - lastWaterFrame < 33) {waterFrame = requestAnimationFrame(renderWater); return;}
  lastWaterFrame = now;
  waterWaves = waterWaves.filter(wave => now - wave.born < 850);
  const wave = waterWaves[0];
  const measurements = waterMedia.map(media => {
    const scene = media.closest('.scene');
    if ((dialog.open && media.id !== 'detail-image') || (!dialog.open && media.id === 'detail-image') || (scene && !scene.classList.contains('active'))) return {media};
    return {media,rect:media.getBoundingClientRect(),width:media.clientWidth,height:media.clientHeight};
  });
  let affected = false;
  for (const {media,rect,width,height} of measurements) {
    const nearby = wave && rect && rect.width && rect.bottom > 0 && rect.top < innerHeight && wave.x > rect.left && wave.x < rect.right && wave.y > rect.top && wave.y < rect.bottom;
    if (!nearby || affected) {if(media.style.filter)media.style.removeProperty('filter');continue;}
    affected = true;
    const entry = filterFor(media);
    const sx = width / rect.width, sy = height / rect.height;
    const age = (now - wave.born) / 850;
    const size = 120 + age * 180;
    const strength = Math.sin(Math.min(1,age * 8) * Math.PI / 2) * (1 - age) ** 1.8;
    const {map,displacement} = entry.waves[0];
    map.setAttribute('x',(wave.x - rect.left - size/2)*sx);
    map.setAttribute('y',(wave.y - rect.top - size/2)*sy);
    map.setAttribute('width',size*sx); map.setAttribute('height',size*sy);
    displacement.setAttribute('scale',(24 * strength * sx).toFixed(2));
    if (!media.style.filter) media.style.filter = `url(#${entry.id})`;
  }
  waterFrame = waterWaves.length ? requestAnimationFrame(renderWater) : 0;
}
addEventListener('pointermove', event => {
  if (playback || waterMotion.matches || !waterPointer.matches || event.pointerType === 'touch') return;
  const now = performance.now();
  if (now - lastWater.time < 85 || Math.hypot(event.clientX-lastWater.x,event.clientY-lastWater.y)<10) return;
  lastWater = {x:event.clientX,y:event.clientY,time:now};
  waterWaves.push({x:event.clientX,y:event.clientY,born:now});
  if (waterWaves.length>1) waterWaves.shift();
  if (!waterFrame) waterFrame = requestAnimationFrame(renderWater);
},{passive:true});
addEventListener('resize',resetWater);
addEventListener('scroll',resetWater,{passive:true});
waterMotion.addEventListener('change',resetWater);
addEventListener('visibilitychange',()=>{if(document.hidden)resetWater();});
dialog.addEventListener('close',resetWater);

update();
