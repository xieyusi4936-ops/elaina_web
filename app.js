const scenes = [...document.querySelectorAll('.scene')];
const story = document.querySelector('.story');
const dots = [...document.querySelectorAll('.scene-dots button')];
const label = document.querySelector('#scene-label');
const next = document.querySelector('#next');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let current = -1;
function stepSize() { return (story.offsetHeight - innerHeight) / 2; }
function showScene(index) {
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
  video.currentTime = 0;
  video.onplaying = () => {
    if (playback !== active) return;
    layer.classList.add('visible');
    stage.classList.add('transitioning');
  };
  video.onended = finish;
  video.onerror = finish;
  // Network errors or a denied play request must never block navigation.
  active.timer = setTimeout(finish, 15000);
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
update();
const projects = [{title:'初次见面',image:'assets/scene-1.jpg',alt:'银色 Elaina Design 字样与伸手的角色'}, {title:'靠近我的世界',image:'assets/scene-2.jpg',alt:'伸手打招呼的 Elaina 角色'}, {title:'创作进行时',image:'assets/scene-3.jpg',alt:'角色与设计软件方块'}];
const dialog = document.querySelector('#project-dialog');
let opener;
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  const project = projects[Number(button.dataset.project)];
  opener = button;
  document.querySelector('#project-title').textContent = project.title;
  const image = document.querySelector('#detail-image'); image.src = project.image; image.alt = project.alt;
  document.body.classList.add('modal-open'); dialog.showModal(); dialog.scrollTop = 0;
}));
document.querySelectorAll('.close,.close-bottom').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); opener?.focus({preventScroll:true}); });
