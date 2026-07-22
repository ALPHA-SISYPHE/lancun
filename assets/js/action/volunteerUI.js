/**
 * 海洋行动中心 · 志愿任务板 UI（阶段 3）
 */
(function volunteerUIModule() {
  const store = () => window.OceanActionVolunteer;

  const state = {
    currentBatchIds: [],
    selectedActivityId: null,
    autoTimer: null,
    hoverPaused: false,
    dialogPaused: false,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };

  function getStored(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function isLoggedIn() {
    const account = getStored('lancun.account', null);
    const session = getStored('lancun.session', { username: '', loggedIn: false });
    return Boolean(account && session.loggedIn && account.username === session.username);
  }

  function getUsername() {
    return isLoggedIn() ? getStored('lancun.account', null).username : null;
  }

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function escapeHtml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function categorySlug(category) {
    return String(category || 'default').replace(/\s+/g, '-');
  }

  function coverStyle(activity) {
    if (activity.image) {
      return `background-image:url('${activity.image}')`;
    }
    return '';
  }

  function difficultyClass(difficulty) {
    if (difficulty === '轻松') return 'is-easy';
    if (difficulty === '挑战') return 'is-hard';
    return 'is-medium';
  }

  function getImpactHighlight(activity) {
    if (!activity) return '';
    if (activity.impactHighlight) return activity.impactHighlight;
    if (activity.impact?.startsWith('预计')) return activity.impact.split('。')[0];
    const snippet = String(activity.summary || '').slice(0, 20);
    return snippet ? `预计${snippet}${activity.summary.length > 20 ? '…' : ''}` : '预计产生积极海洋影响';
  }

  const AUTO_HINT_DEFAULT = '每 12 秒自动换新';
  const AUTO_HINT_PAUSED = '已暂停自动刷新';

  function updateAutoHint() {
    const hint = $('[data-mission-auto-hint]');
    if (!hint) return;
    const paused = shouldPauseAutoRotate();
    hint.classList.toggle('is-paused', paused && !state.reducedMotion);
    hint.textContent = paused && !state.reducedMotion ? AUTO_HINT_PAUSED : AUTO_HINT_DEFAULT;
  }

  function isAnyVolunteerDialogOpen() {
    return Boolean(
      document.querySelector(
        '[data-volunteer-detail-dialog][open], [data-volunteer-register-dialog][open], [data-volunteer-success-dialog][open], [data-volunteer-records-dialog][open], [data-impact-detail-dialog][open]',
      ),
    );
  }

  function shouldPauseAutoRotate() {
    const volunteerTabActive = window.OceanActionParticipationHub?.getActiveTab?.() !== 'donation';
    return (
      !volunteerTabActive
      || state.hoverPaused
      || state.dialogPaused
      || document.hidden
      || state.reducedMotion
      || isAnyVolunteerDialogOpen()
    );
  }

  function syncDialogPause() {
    state.dialogPaused = isAnyVolunteerDialogOpen();
    updateAutoHint();
    if (!shouldPauseAutoRotate()) startAutoRotate();
  }

  function startAutoRotate() {
    stopAutoRotate();
    if (state.reducedMotion) return;
    state.autoTimer = window.setInterval(() => {
      if (!shouldPauseAutoRotate()) rotateBatch();
    }, 12000);
  }

  function stopAutoRotate() {
    if (state.autoTimer) {
      window.clearInterval(state.autoTimer);
      state.autoTimer = null;
    }
  }

  function pickInitialBatch() {
    const all = store().getActivities();
    const featured = all.filter((item) => item.featured);
    const pool = featured.length >= 3 ? featured : all;
    return shuffle(pool).slice(0, 3);
  }

  function pickNextBatch(currentIds) {
    const all = store().getActivities();
    if (all.length <= 3) return all;

    let attempts = 0;
    while (attempts < 12) {
      const next = shuffle(all).slice(0, 3);
      const nextIds = next.map((item) => item.id).sort().join(',');
      const currentKey = [...currentIds].sort().join(',');
      if (nextIds !== currentKey) return next;
      attempts += 1;
    }
    return shuffle(all).slice(0, 3);
  }

  function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function renderMissionCards(activities) {
    const grid = $('[data-mission-card-grid]');
    if (!grid) return;

    const loggedIn = isLoggedIn();
    const username = getUsername();

    grid.innerHTML = activities
      .map((activity) => {
        const effective = store().getEffectiveRegistered(activity);
        const ratio = activity.capacity ? Math.min(1, effective / activity.capacity) : 0;
        const percent = Math.round(ratio * 100);
        const full = store().isActivityFull(activity);
        const already = username && store().userHasRegistration(username, activity.id);

        let registerLabel = '立即报名';
        let registerDisabled = !loggedIn || full || already;
        if (full) registerLabel = '名额已满';
        else if (already) registerLabel = '已报名';

        const progressClass = ratio >= 0.95 ? 'is-critical' : ratio >= 0.85 ? 'is-warning' : '';

        return `
          <article class="mission-card mission-task-card" data-mission-card="${escapeHtml(activity.id)}">
            <div class="mission-card__media">
              <div class="mission-card__cover" data-category="${escapeHtml(categorySlug(activity.category))}" style="${coverStyle(activity)}" role="img" aria-label="${escapeHtml(activity.title)}封面"></div>
              <div class="mission-card__cover-badges">
                <span class="mission-card__tag">${escapeHtml(activity.category)}</span>
                <span class="mission-card__difficulty ${difficultyClass(activity.difficulty)}">${escapeHtml(activity.difficulty)}</span>
              </div>
            </div>
            <div class="mission-card__body">
              <div class="mission-card__info">
                <h3>${escapeHtml(activity.title)}</h3>
                <ul class="mission-card__meta">
                  <li>${escapeHtml(activity.location)}</li>
                  <li>${escapeHtml(activity.date)} · ${escapeHtml(activity.time)}</li>
                </ul>
              </div>
              <div class="mission-card__slots">
                <div class="mission-card__progress ${progressClass}" aria-label="报名进度 ${percent}%">
                  <span style="width:${percent}%"></span>
                </div>
                <p class="mission-card__slots-label">已报名 <strong>${effective}</strong> / ${activity.capacity} 人</p>
              </div>
              <p class="mission-card__impact">${escapeHtml(getImpactHighlight(activity))}</p>
              <div class="mission-card__actions">
                <button class="button button-ghost" type="button" data-volunteer-detail="${escapeHtml(activity.id)}">查看详情</button>
                <button class="button button-primary" type="button" data-volunteer-register="${escapeHtml(activity.id)}" ${registerDisabled ? 'disabled' : ''}>${registerLabel}</button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-volunteer-detail]').forEach((btn) => {
      btn.addEventListener('click', () => openDetailDialog(btn.getAttribute('data-volunteer-detail')));
    });
    grid.querySelectorAll('[data-volunteer-register]').forEach((btn) => {
      btn.addEventListener('click', () => openRegisterDialog(btn.getAttribute('data-volunteer-register')));
    });
  }

  function renderMissionBoard() {
    const hint = $('[data-volunteer-login-hint]');
    if (hint) hint.hidden = isLoggedIn();

    if (!state.currentBatchIds.length) {
      const initial = pickInitialBatch();
      state.currentBatchIds = initial.map((item) => item.id);
      renderMissionCards(initial);
    } else {
      const activities = state.currentBatchIds
        .map((id) => store().findActivity(id))
        .filter(Boolean);
      renderMissionCards(activities);
    }

    syncDialogPause();
    updateAutoHint();
  }

  function rotateBatch() {
    const next = pickNextBatch(state.currentBatchIds);
    state.currentBatchIds = next.map((item) => item.id);
    renderMissionCards(next);
    updateAutoHint();
  }

  function setDetailContent(activity) {
    if (!activity) return;
    const effective = store().getEffectiveRegistered(activity);
    const full = store().isActivityFull(activity);
    const loggedIn = isLoggedIn();
    const username = getUsername();
    const already = username && store().userHasRegistration(username, activity.id);

    const cover = $('[data-volunteer-detail-cover]');
    if (cover) {
      cover.style.backgroundImage = activity.image ? `url('${activity.image}')` : '';
      cover.dataset.category = categorySlug(activity.category);
      cover.setAttribute('aria-label', `${activity.title}封面`);
    }

    const setText = (sel, value) => {
      const node = $(sel);
      if (node) node.textContent = value ?? '—';
    };

    setText('[data-volunteer-detail-title]', activity.title);
    setText('[data-volunteer-detail-location]', activity.location);
    setText('[data-volunteer-detail-datetime]', `${activity.date} · ${activity.time}`);
    setText('[data-volunteer-detail-duration]', activity.duration);
    setText('[data-volunteer-detail-organizer]', activity.organizer);
    setText('[data-volunteer-detail-contact]', activity.contact);
    setText('[data-volunteer-detail-summary]', activity.summary);
    setText('[data-volunteer-detail-description]', activity.description);
    setText('[data-volunteer-detail-impact-highlight]', getImpactHighlight(activity));
    setText('[data-volunteer-detail-impact]', activity.impact);
    setText('[data-volunteer-detail-slots]', `${effective} / ${activity.capacity} 人`);

    const eyebrow = $('[data-volunteer-detail-eyebrow]');
    if (eyebrow) {
      eyebrow.textContent = `${activity.category} · ${activity.difficulty}`;
    }

    const fillList = (sel, items) => {
      const list = $(sel);
      if (!list) return;
      list.innerHTML = (items || [])
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('');
    };

    fillList('[data-volunteer-detail-requirements]', activity.requirements);
    fillList('[data-volunteer-detail-tasks]', activity.tasks);

    const registerBtn = $('[data-volunteer-detail-register]');
    if (registerBtn) {
      if (full) {
        registerBtn.textContent = '名额已满';
        registerBtn.disabled = true;
      } else if (!loggedIn) {
        registerBtn.textContent = '请先登录后报名';
        registerBtn.disabled = true;
      } else if (already) {
        registerBtn.textContent = '已报名';
        registerBtn.disabled = true;
      } else {
        registerBtn.textContent = '立即报名';
        registerBtn.disabled = false;
      }
    }
  }

  function openDetailDialog(activityId) {
    const activity = store().findActivity(activityId);
    if (!activity) return;
    state.selectedActivityId = activityId;
    setDetailContent(activity);
    const dialog = $('[data-volunteer-detail-dialog]');
    dialog?.showModal();
    syncDialogPause();
  }

  function openRegisterDialog(activityId) {
    if (!isLoggedIn()) {
      setStatus('请先登录后报名。', 'warning');
      return;
    }
    const activity = store().findActivity(activityId);
    if (!activity) return;
    if (store().isActivityFull(activity)) {
      setStatus('名额已满，请选择其他活动。', 'warning');
      return;
    }
    if (store().userHasRegistration(getUsername(), activity.id)) {
      setStatus('你已报名该活动。', 'warning');
      return;
    }

    state.selectedActivityId = activityId;
    const form = $('[data-volunteer-register-form]');
    form?.reset();
    clearRegisterErrors(form);
    const title = $('[data-volunteer-register-title]');
    if (title) title.textContent = `报名 · ${activity.title}`;
    $('[data-volunteer-detail-dialog]')?.close();
    $('[data-volunteer-register-dialog]')?.showModal();
    syncDialogPause();
    form?.name?.focus();
  }

  function clearRegisterErrors(form) {
    if (!form) return;
    form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    form.querySelectorAll('.field-error').forEach((el) => {
      el.textContent = '';
    });
  }

  function setFieldError(input, message) {
    if (!input) return;
    const error = document.getElementById(`${input.id}-error`);
    input.classList.toggle('is-invalid', Boolean(message));
    if (error) error.textContent = message || '';
  }

  function validateRegisterForm(form) {
    clearRegisterErrors(form);
    let valid = true;

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();
    const age = Number(form.age.value);
    const emergency = form.emergencyContact.value.trim();

    if (!name) {
      setFieldError(form.name, '请填写姓名');
      valid = false;
    }
    if (!/^1\d{10}$/.test(phone)) {
      setFieldError(form.phone, '请输入 11 位手机号');
      valid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError(form.email, '请输入有效邮箱');
      valid = false;
    }
    if (!Number.isFinite(age) || age < 1 || age > 120) {
      setFieldError(form.age, '请输入 1–120 的年龄');
      valid = false;
    }
    if (!emergency) {
      setFieldError(form.emergencyContact, '请填写紧急联系人');
      valid = false;
    }

    return valid;
  }

  function setStatus(message, tone = '') {
    const status = $('[data-volunteer-status]');
    if (!status) return;
    status.textContent = message || '';
    status.className = tone ? `status-message is-${tone}` : 'status-message';
  }

  function handleRegisterSubmit(event) {
    event.preventDefault();
    if (!isLoggedIn()) {
      setStatus('请先登录后报名。', 'warning');
      return;
    }

    const form = event.target;
    if (!validateRegisterForm(form)) return;

    const activity = store().findActivity(state.selectedActivityId);
    if (!activity) return;

    const phone = form.phone.value.trim();
    const email = form.email.value.trim();

    if (store().hasDuplicateRegistration(activity.id, phone, email)) {
      setFieldError(form.phone, '该手机号或邮箱已报名此活动');
      setFieldError(form.email, '该手机号或邮箱已报名此活动');
      return;
    }
    if (store().isActivityFull(activity)) {
      setStatus('名额已满，请选择其他活动。', 'warning');
      $('[data-volunteer-register-dialog]')?.close();
      renderMissionBoard();
      return;
    }

    store().saveRegistration({
      activityId: activity.id,
      activityTitle: activity.title,
      username: getUsername(),
      name: form.name.value.trim(),
      phone,
      email,
      age: Number(form.age.value),
      experience: form.experience.value,
      emergencyContact: form.emergencyContact.value.trim(),
      note: form.note.value.trim(),
    });

    $('[data-volunteer-register-dialog]')?.close();
    $('[data-volunteer-success-dialog]')?.showModal();
    setStatus('');
    renderMissionBoard();
    syncDialogPause();
  }

  function renderRecordsList() {
    const list = $('[data-volunteer-records-list]');
    if (!list) return;
    const username = getUsername();
    const records = store().getRegistrationsForUser(username);

    if (!records.length) {
      list.innerHTML = '<p class="volunteer-records-empty">还没有报名记录</p>';
      return;
    }

    list.innerHTML = records
      .slice()
      .reverse()
      .map((record) => {
        const activity = store().findActivity(record.activityId);
        const when = activity ? `${activity.date} · ${activity.time}` : '—';
        const where = activity?.location || '—';
        const created = new Date(record.createdAt).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
        return `
          <article class="volunteer-record-item">
            <div>
              <h4>${escapeHtml(record.activityTitle)}</h4>
              <p class="volunteer-record-item__meta">${escapeHtml(where)} · ${escapeHtml(when)}</p>
              <p class="volunteer-record-item__meta">报名时间：${escapeHtml(created)}</p>
            </div>
            <button class="button button-ghost" type="button" data-volunteer-cancel="${escapeHtml(record.id)}">取消报名</button>
          </article>
        `;
      })
      .join('');

    list.querySelectorAll('[data-volunteer-cancel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-volunteer-cancel');
        if (!window.confirm('确定取消本次报名？')) return;
        store().deleteRegistration(id);
        renderRecordsList();
        renderMissionBoard();
        setStatus('已取消报名，名额已退回。', 'success');
      });
    });
  }

  function openRecordsDialog() {
    if (!isLoggedIn()) {
      setStatus('请先登录后查看报名记录。', 'warning');
      return;
    }
    renderRecordsList();
    $('[data-volunteer-records-dialog]')?.showModal();
    syncDialogPause();
  }

  function bindEvents() {
    $('[data-mission-refresh]')?.addEventListener('click', rotateBatch);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !shouldPauseAutoRotate()) startAutoRotate();
      else stopAutoRotate();
    });

    $('[data-volunteer-detail-register]')?.addEventListener('click', () => {
      if (state.selectedActivityId) openRegisterDialog(state.selectedActivityId);
    });
    $('[data-volunteer-detail-close]')?.addEventListener('click', () => {
      $('[data-volunteer-detail-dialog]')?.close();
    });
    $('[data-volunteer-detail-close-footer]')?.addEventListener('click', () => {
      $('[data-volunteer-detail-dialog]')?.close();
    });

    $('[data-volunteer-register-form]')?.addEventListener('submit', handleRegisterSubmit);
    $('[data-volunteer-register-close]')?.addEventListener('click', () => {
      $('[data-volunteer-register-dialog]')?.close();
    });
    $('[data-volunteer-register-cancel]')?.addEventListener('click', () => {
      $('[data-volunteer-register-dialog]')?.close();
    });

    $('[data-volunteer-success-records]')?.addEventListener('click', () => {
      $('[data-volunteer-success-dialog]')?.close();
      openRecordsDialog();
    });
    $('[data-volunteer-success-continue]')?.addEventListener('click', () => {
      $('[data-volunteer-success-dialog]')?.close();
    });

    $('[data-volunteer-records-close]')?.addEventListener('click', () => {
      $('[data-volunteer-records-dialog]')?.close();
    });
    $('[data-archive-volunteer-records]')?.addEventListener('click', openRecordsDialog);

    document.querySelectorAll(
      '[data-volunteer-detail-dialog], [data-volunteer-register-dialog], [data-volunteer-success-dialog], [data-volunteer-records-dialog]',
    ).forEach((dialog) => {
      dialog.addEventListener('close', syncDialogPause);
      dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        dialog.close();
      });
    });

    let dialogOpener = null;
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest(
        '[data-volunteer-detail], [data-volunteer-register], [data-volunteer-detail-register], [data-archive-volunteer-records], [data-volunteer-success-records]',
      );
      if (trigger) dialogOpener = trigger;
    }, true);
    document.querySelectorAll(
      '[data-volunteer-detail-dialog], [data-volunteer-register-dialog], [data-volunteer-success-dialog], [data-volunteer-records-dialog]',
    ).forEach((dialog) => {
      dialog.addEventListener('close', () => {
        dialogOpener?.focus?.();
        dialogOpener = null;
      });
    });
  }

  function setupVolunteerMission() {
    if (document.body.dataset.page !== 'action') return;
    if (!store() || !window.VOLUNTEER_ACTIVITIES?.length) return;
    bindEvents();
    renderMissionBoard();
    updateAutoHint();
    startAutoRotate();
  }

  document.addEventListener('DOMContentLoaded', setupVolunteerMission);

  window.OceanActionVolunteerUI = {
    renderMissionBoard,
    openRecordsDialog,
    rotateBatch,
    pauseAutoRotate(pause) {
      state.hoverPaused = pause;
      updateAutoHint();
      if (pause) stopAutoRotate();
      else if (!shouldPauseAutoRotate()) startAutoRotate();
    },
    resumeAutoRotate() {
      updateAutoHint();
      if (!shouldPauseAutoRotate()) startAutoRotate();
    },
  };
})();
