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

// A light, transient water trail. Drawing sleeps whenever there are no ripples.
const rippleCanvas = document.querySelector('body > .water-ripples');
const rippleContext = rippleCanvas.getContext('2d');
const modalCanvas = document.querySelector('.dialog-ripples');
const modalContext = modalCanvas.getContext('2d');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(pointer: fine)');
let ripples = [];
let rippleFrame = 0;
let lastRipple = {x: -1000, y: -1000, time: 0};
let rippleWidth = 0, rippleHeight = 0;
function sizeRipples() {
  rippleWidth = innerWidth; rippleHeight = innerHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  for (const canvas of [rippleCanvas, modalCanvas]) {
    canvas.width = Math.round(rippleWidth * ratio);
    canvas.height = Math.round(rippleHeight * ratio);
    canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
  }
}
function drawRipples(now) {
  rippleContext.clearRect(0, 0, rippleWidth, rippleHeight);
  modalContext.clearRect(0, 0, rippleWidth, rippleHeight);
  ripples = ripples.filter(ripple => now - ripple.born < 1200);
  const context = dialog.open ? modalContext : rippleContext;
  const bounds = {left:0,top:0};
  for (const ripple of ripples) {
    const age = (now - ripple.born) / 1200;
    const opacity = (1 - age) ** 2;
    const radius = 5 + 83 * (1 - (1 - age) ** 2);
    for (let ring = 0; ring < 3; ring++) {
      const r = radius - ring * 7;
      if (r < 3) continue;
      const x = ripple.x - bounds.left, y = ripple.y - bounds.top;
      context.beginPath();
      context.ellipse(x, y, r, r * .72, -.2, 0, Math.PI * 2);
      context.strokeStyle = `rgba(12, 38, 72, ${opacity * .24 / (ring + 1)})`;
      context.lineWidth = 3;
      context.stroke();
      context.beginPath();
      context.ellipse(x, y - 1, r, r * .72, -.2, 0, Math.PI * 2);
      context.strokeStyle = `rgba(192, 232, 255, ${opacity * .5 / (ring + 1)})`;
      context.lineWidth = .9;
      context.stroke();
    }
  }
  rippleFrame = ripples.length ? requestAnimationFrame(drawRipples) : 0;
}
function clearRipples() {
  cancelAnimationFrame(rippleFrame); rippleFrame = 0; ripples = [];
  rippleContext.clearRect(0, 0, rippleWidth, rippleHeight);
  modalContext.clearRect(0, 0, rippleWidth, rippleHeight);
}
addEventListener('pointermove', event => {
  if (motionPreference.matches || !finePointer.matches || event.pointerType === 'touch') return;
  const now = performance.now();
  if (now - lastRipple.time < 45 || Math.hypot(event.clientX - lastRipple.x, event.clientY - lastRipple.y) < 13) return;
  lastRipple = {x:event.clientX, y:event.clientY, time:now};
  ripples.push({x:event.clientX, y:event.clientY, born:now});
  if (ripples.length > 24) ripples.shift();
  if (!rippleFrame) rippleFrame = requestAnimationFrame(drawRipples);
}, {passive:true});
addEventListener('resize', () => {clearRipples(); sizeRipples();});
motionPreference.addEventListener('change', clearRipples);
addEventListener('visibilitychange', () => {if (document.hidden) clearRipples();});
dialog.addEventListener('close', clearRipples);
sizeRipples();
