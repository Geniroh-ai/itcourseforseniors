/* ============================================================
   IT Course for Seniors — Main JavaScript
   ============================================================ */

const STORAGE_KEY = 'seniors_course_progress';

function getProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch(e) { return {}; }
}

function saveProgress(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch(e) {}
}

function markModuleComplete(moduleNum) {
  const p = getProgress();
  p[`module_${moduleNum}`] = true;
  saveProgress(p);
}

function isModuleComplete(moduleNum) {
  return !!getProgress()[`module_${moduleNum}`];
}

/* ── Index page: apply "completed" class to cards ── */
function initIndexPage() {
  const cards = document.querySelectorAll('.module-card[data-module]');
  /* also count modules 13-15 which may not have cards yet on older index */
  const p = getProgress();
  let doneCount = 0;
  cards.forEach(card => {
    const num = card.dataset.module;
    if (p[`module_${num}`]) {
      card.classList.add('completed');
      doneCount++;
    }
  });
  const counter = document.getElementById('completed-count');
  if (counter) counter.textContent = doneCount;
}

/* ── Module page: mark-complete button ── */
function initModulePage() {
  const btn = document.getElementById('mark-complete-btn');
  if (!btn) return;
  const num = btn.dataset.module;
  if (isModuleComplete(num)) {
    btn.textContent = '✓ Completed!';
    btn.classList.add('marked');
  }
  btn.addEventListener('click', () => {
    markModuleComplete(num);
    btn.textContent = '✓ Completed!';
    btn.classList.add('marked');
  });
}

/* ── Quiz logic ── */
function initQuiz() {
  const questions = document.querySelectorAll('.quiz-question');
  questions.forEach(q => {
    const options = q.querySelectorAll('.quiz-option');
    const feedback = q.querySelector('.quiz-feedback');
    let answered = false;
    options.forEach(opt => {
      opt.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const isCorrect = opt.dataset.correct === 'true';
        opt.classList.add(isCorrect ? 'correct' : 'incorrect');
        if (!isCorrect) {
          options.forEach(o => { if (o.dataset.correct === 'true') o.classList.add('correct'); });
        }
        if (feedback) {
          feedback.classList.add('show', isCorrect ? 'correct' : 'incorrect');
          feedback.textContent = isCorrect
            ? '✓ Correct! ' + (feedback.dataset.correct || '')
            : '✗ Not quite. ' + (feedback.dataset.incorrect || '');
        }
        options.forEach(o => { o.style.cursor = 'default'; });
      });
    });
  });
}

/* ── Highlight active nav link ── */
function highlightNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.site-nav a').forEach(a => {
    if (path.endsWith('index.html') || path === '/' || path.endsWith('/itcourseforseniors/')) {
      if (a.dataset.page === 'home') a.classList.add('active');
    } else if (path.includes('module-')) {
      if (a.dataset.page === 'modules') a.classList.add('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  highlightNav();
  if (document.querySelector('.module-card')) initIndexPage();
  if (document.getElementById('mark-complete-btn')) initModulePage();
  initQuiz();
});
