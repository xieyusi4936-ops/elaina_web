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
function update() { showScene(Math.max(0, Math.min(2, Math.round((scrollY - story.offsetTop) / stepSize())))); }
let queued = false;
addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { update(); queued = false; }); } }, { passive: true });
addEventListener('resize', update);
function goToScene(index) { scrollTo({ top: story.offsetTop + stepSize() * index, behavior: reduceMotion ? 'instant' : 'smooth' }); }
document.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => goToScene(Number(button.dataset.scene))));
next.addEventListener('click', () => current < 2 ? goToScene(current + 1) : document.querySelector('#projects').scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth' }));
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
