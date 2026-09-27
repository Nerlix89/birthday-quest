(() => {
  'use strict';

  const DESIGN_WIDTH = 499;
  const DESIGN_HEIGHT = 887;

  const codeBySlide = new Map([
    [3, '*'],
    [4, '1436'],
    [5, '6767'],
    [7, '0928'],
    [11, '2005'],
    [13, '2808'],
  ]);

  const stage = document.getElementById('stage');
  const slides = [...document.querySelectorAll('.slide')];
  const root = document.documentElement;
  let currentSlide = 1;
  let transitionLocked = false;
  let suppressClickUntil = 0;
  let layoutWidth = window.innerWidth;
  let layoutHeight = window.innerHeight;

  function isTextInputActive() {
    const active = document.activeElement;
    return active?.matches?.('input, textarea, [contenteditable="true"]');
  }

  function isKeyboardLikelyOpen() {
    const visualHeight = window.visualViewport?.height;
    return Boolean(visualHeight && isTextInputActive() && visualHeight < layoutHeight * 0.82);
  }

  function fitStage(forceLayoutRefresh = false) {
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    const widthChangedALot = Math.abs(currentWidth - layoutWidth) > 60;

    if (forceLayoutRefresh || widthChangedALot || !isKeyboardLikelyOpen()) {
      layoutWidth = currentWidth;
      layoutHeight = Math.max(layoutHeight, currentHeight, document.documentElement.clientHeight || 0);
    }

    root.style.setProperty('--app-width', `${layoutWidth}px`);
    root.style.setProperty('--app-height', `${layoutHeight}px`);

    const scale = Math.min(layoutWidth / DESIGN_WIDTH, layoutHeight / DESIGN_HEIGHT);
    const stageHeight = layoutHeight / scale;
    const extra = Math.max(0, stageHeight - DESIGN_HEIGHT);
    stage.style.setProperty('--stage-scale', scale);
    stage.style.setProperty('--stage-height', `${stageHeight}px`);
    stage.style.setProperty('--stage-extra', `${extra}px`);
    stage.style.setProperty('--stage-extra-20', `${extra * 0.2}px`);
    stage.style.setProperty('--stage-extra-30', `${extra * 0.3}px`);
    stage.style.setProperty('--stage-extra-35', `${extra * 0.35}px`);
    stage.style.setProperty('--stage-extra-40', `${extra * 0.4}px`);
    stage.style.setProperty('--stage-extra-45', `${extra * 0.45}px`);
    stage.style.setProperty('--stage-extra-55', `${extra * 0.55}px`);
  }

  function syncVideo(slide) {
    document.querySelectorAll('video').forEach(video => {
      if (slide.contains(video)) {
        video.currentTime = 0;
        const playAttempt = video.play();
        if (playAttempt) playAttempt.catch(() => {});
        return;
      }

      video.pause();
    });
  }

  function showSlide(number) {
    if (transitionLocked) return;
    const next = slides.find(slide => Number(slide.dataset.slide) === number);
    if (!next) return;

    transitionLocked = true;
    slides.forEach(slide => slide.classList.remove('active'));
    next.classList.add('active');
    currentSlide = number;

    const input = next.querySelector('.code-input');
    if (input) {
      input.value = '';
      input.classList.remove('wrong');
    }

    syncVideo(next);

    requestAnimationFrame(() => {
      transitionLocked = false;
    });
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  function normalizeCode(value) {
    return value.replace(/\D/g, '').slice(0, 4);
  }

  function handleWrongInput(input) {
    if (navigator.vibrate) navigator.vibrate([45, 40, 45]);
    input.classList.add('wrong');
    window.setTimeout(() => {
      input.value = '';
      input.classList.remove('wrong');
    }, 560);
  }

  function handleCodeInput(event) {
    const input = event.currentTarget;
    const slide = Number(input.closest('.slide').dataset.slide);
    const expected = codeBySlide.get(slide);

    input.value = normalizeCode(input.value);
    input.classList.remove('wrong');

    if (input.value.length !== 4 || !expected) return;

    if (expected === '*' || input.value === expected) {
      if (navigator.vibrate) navigator.vibrate(35);
      window.setTimeout(nextSlide, 90);
      return;
    }

    handleWrongInput(input);
  }

  document.querySelectorAll('[data-next]').forEach(button => {
    button.addEventListener('click', event => {
      if (Date.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      nextSlide();
    });
  });

  document.querySelectorAll('[data-goto]').forEach(button => {
    button.addEventListener('click', () => {
      showSlide(Number(button.dataset.goto));
    });
  });

  document.querySelectorAll('.code-input').forEach(input => {
    if (input.classList.contains('instant-input')) {
      const goToBreakPage = event => {
        event.preventDefault();
        event.stopPropagation();
        suppressClickUntil = Date.now() + 650;
        input.blur();
        showSlide(10);
      };

      input.addEventListener('focus', goToBreakPage);
      input.addEventListener('pointerdown', event => {
        goToBreakPage(event);
      });
      return;
    }

    input.addEventListener('input', handleCodeInput);
    input.addEventListener('paste', event => {
      event.preventDefault();
      const pasted = normalizeCode(event.clipboardData?.getData('text') || '');
      input.value = pasted;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  fitStage(true);
  syncVideo(document.querySelector('.slide.active'));
  window.addEventListener('resize', () => fitStage(), { passive: true });
  window.visualViewport?.addEventListener('resize', () => fitStage(), { passive: true });
  window.addEventListener('orientationchange', () => {
    window.setTimeout(() => {
      layoutWidth = window.innerWidth;
      layoutHeight = window.innerHeight;
      fitStage(true);
    }, 250);
  }, { passive: true });
})();
