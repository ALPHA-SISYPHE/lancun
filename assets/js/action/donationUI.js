/**
 * 海洋行动中心 · 公益支持 UI（阶段 3 · ParticipationHub）
 */
(function donationUIModule() {
  const store = () => window.OceanActionDonation;

  const state = {
    currentBatchIds: [],
    selectedProjectId: null,
    selectedAmount: 10,
    customMode: false,
    lastDonation: null,
    autoTimer: null,
    hoverPaused: false,
    dialogPaused: false,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };

  const AUTO_HINT_DEFAULT = '每 12 秒自动换新';
  const AUTO_HINT_PAUSED = '已暂停自动刷新';

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

  function formatMoney(value) {
    return `¥${Number(value || 0).toLocaleString('zh-CN')}`;
  }

  function formatDate(iso) {
    const date = iso ? new Date(iso) : new Date();
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  function coverStyle(project) {
    if (project.image) return `background-image:url('${project.image}')`;
    return '';
  }

  function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function pickInitialBatch() {
    const all = store().getProjects();
    return shuffle(all).slice(0, 3);
  }

  function pickNextBatch(currentIds) {
    const all = store().getProjects();
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

  function isAnyDonationDialogOpen() {
    return Boolean(
      document.querySelector(
        '[data-donation-detail-dialog][open], [data-donation-thanks-dialog][open], [data-donation-records-dialog][open], [data-impact-detail-dialog][open]',
      ),
    );
  }

  function shouldPauseAutoRotate() {
    const donationTabActive = window.OceanActionParticipationHub?.getActiveTab?.() === 'donation';
    return (
      !donationTabActive
      || state.hoverPaused
      || state.dialogPaused
      || document.hidden
      || state.reducedMotion
      || isAnyDonationDialogOpen()
    );
  }

  function updateAutoHint() {
    const hint = $('[data-donation-auto-hint]');
    if (!hint) return;
    const paused = shouldPauseAutoRotate();
    hint.classList.toggle('is-paused', paused && !state.reducedMotion);
    hint.textContent = paused && !state.reducedMotion ? AUTO_HINT_PAUSED : AUTO_HINT_DEFAULT;
  }

  function syncDialogPause() {
    state.dialogPaused = isAnyDonationDialogOpen();
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

  function setStatus(message, tone = '') {
    const status = $('[data-donation-status]');
    if (!status) return;
    status.textContent = message || '';
    status.className = tone ? `status-message is-${tone}` : 'status-message';
  }

  function renderProjectPanel(projectId) {
    const project = store().findProject(projectId);
    const panel = $('[data-donation-project-panel]');
    if (!project || !panel) return;

    state.selectedProjectId = project.id;
    const raised = store().getEffectiveRaised(project);
    const ratio = project.targetAmount ? Math.min(1, raised / project.targetAmount) : 0;
    const percent = Math.round(ratio * 100);

    panel.innerHTML = `
      <div class="support-fund-brief">
        <p class="support-project-panel__category">${escapeHtml(project.category)}</p>
        <h3 class="support-project-panel__title">${escapeHtml(project.title)}</h3>
        <p class="support-project-panel__summary">${escapeHtml(project.summary)}</p>
        <div class="support-project-panel__raised">
          <div class="support-project-panel__raised-head">
            <span>已筹 ${formatMoney(raised)}</span>
            <span>目标 ${formatMoney(project.targetAmount)}</span>
          </div>
          <div class="support-project-panel__progress" aria-label="筹款进度 ${percent}%">
            <span style="width:${percent}%"></span>
          </div>
        </div>
        <p class="support-project-panel__impact"><span class="support-project-panel__impact-label">预计影响：</span>${escapeHtml(project.impactGoal)}</p>
        <section class="support-fund-section">
          <h4>资金用途</h4>
          <ul class="support-fund-list">
            ${project.useOfFunds.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </section>
        <p class="support-project-panel__organizer">发起方：${escapeHtml(project.organizer)}</p>
      </div>
    `;
  }

  function renderDonationCards(projects) {
    const grid = $('[data-donation-card-grid]');
    if (!grid) return;

    grid.innerHTML = projects
      .map((project) => {
        const raised = store().getEffectiveRaised(project);
        const ratio = project.targetAmount ? Math.min(1, raised / project.targetAmount) : 0;
        const percent = Math.round(ratio * 100);

        return `
          <article class="donation-project-card" data-donation-card="${escapeHtml(project.id)}">
            <div class="donation-project-card__media" style="${coverStyle(project)}" role="img" aria-label="${escapeHtml(project.title)}封面">
              <span class="donation-project-card__tag">${escapeHtml(project.category)}</span>
            </div>
            <div class="donation-project-card__body">
              <h3>${escapeHtml(project.title)}</h3>
              <div class="donation-project-card__raised-head">
                <span>已筹 <strong>${formatMoney(raised)}</strong></span>
                <span>目标 ${formatMoney(project.targetAmount)}</span>
              </div>
              <div class="donation-project-card__progress" aria-label="筹款进度 ${percent}%">
                <span style="width:${percent}%"></span>
              </div>
              <p class="donation-project-card__impact">预计影响：${escapeHtml(project.impactGoal)}</p>
              <p class="donation-project-card__organizer">发起方：${escapeHtml(project.organizer)}</p>
              <div class="donation-project-card__actions">
                <button class="button button-ghost" type="button" data-donation-detail="${escapeHtml(project.id)}">查看详情</button>
                <button class="button button-primary" type="button" data-donation-support="${escapeHtml(project.id)}">支持项目</button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-donation-detail], [data-donation-support]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-donation-detail') || btn.getAttribute('data-donation-support');
        openDetailDialog(id);
      });
    });
  }

  function renderAmountPills(project) {
    const wrap = $('[data-donation-amount-pills]');
    if (!wrap) return;
    const baseAmounts = project?.suggestedAmounts?.length ? project.suggestedAmounts : [10, 30, 50, 100];
    const amounts = [...baseAmounts, 'custom'];

    if (!state.customMode && !baseAmounts.includes(state.selectedAmount)) {
      state.selectedAmount = baseAmounts[0] || 10;
    }

    wrap.innerHTML = amounts
      .map((amount) => {
        const isCustom = amount === 'custom';
        const selected = isCustom ? state.customMode : !state.customMode && state.selectedAmount === amount;
        const label = isCustom ? '自定义' : `¥${amount}`;
        return `<button class="support-pill${selected ? ' is-selected' : ''}" type="button" data-donation-amount="${amount}">${label}</button>`;
      })
      .join('');

    wrap.querySelectorAll('[data-donation-amount]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const raw = btn.getAttribute('data-donation-amount');
        if (raw === 'custom') {
          state.customMode = true;
        } else {
          state.customMode = false;
          state.selectedAmount = Number(raw);
        }
        renderAmountPills(project);
        toggleCustomWrap();
      });
    });
  }

  function toggleCustomWrap() {
    const wrap = $('[data-donation-custom-wrap]');
    if (wrap) wrap.hidden = !state.customMode;
  }

  function getSelectedAmount() {
    if (state.customMode) {
      const value = Number($('[data-donation-custom]')?.value);
      return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 0;
    }
    return state.selectedAmount;
  }

  function setFieldError(input, message) {
    if (!input) return;
    const error = document.getElementById(`${input.id}-error`);
    input.classList.toggle('is-invalid', Boolean(message));
    if (error) error.textContent = message || '';
  }

  function clearFormErrors(form) {
    form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    form.querySelectorAll('.field-error').forEach((el) => {
      el.textContent = '';
    });
  }

  function updateFormState() {
    const form = $('[data-donation-form]');
    const hint = $('[data-donation-login-hint]');
    const loggedIn = isLoggedIn();
    if (hint) hint.hidden = loggedIn;
    if (!form) return;

    form.querySelectorAll('input, select, textarea, button[type="submit"]').forEach((field) => {
      field.disabled = !loggedIn;
    });
  }

  function validateDonationForm(form) {
    clearFormErrors(form);
    let valid = true;

    const projectId = form.project.value;
    const amount = getSelectedAmount();
    const anonymous = form.anonymous.checked;
    const name = form.donorName.value.trim();
    const email = form.email.value.trim();

    if (!projectId) {
      setFieldError(form.project, '请选择支持项目');
      valid = false;
    }
    if (!amount || amount < 1) {
      if (state.customMode) setFieldError(form.customAmount, '请输入大于 0 的金额');
      else setStatus('请选择或输入有效的支持金额。', 'warning');
      valid = false;
    }
    if (!anonymous && !name) {
      setFieldError(form.donorName, '请填写姓名或昵称');
      valid = false;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError(form.email, '请输入有效邮箱');
      valid = false;
    }

    return valid
      ? { projectId, amount, anonymous, name: anonymous ? '匿名支持者' : name, email, message: form.message.value.trim() }
      : null;
  }

  function openDetailDialog(projectId) {
    const project = store().findProject(projectId);
    if (!project) return;

    state.selectedProjectId = project.id;
    state.customMode = false;
    state.selectedAmount = project.suggestedAmounts?.[0] || 10;

    const projectInput = $('[data-donation-project]');
    if (projectInput) projectInput.value = project.id;

    renderProjectPanel(project.id);
    renderAmountPills(project);
    toggleCustomWrap();
    updateFormState();

    const cover = $('[data-donation-detail-cover]');
    if (cover) {
      cover.style.backgroundImage = project.image ? `url('${project.image}')` : '';
      cover.setAttribute('aria-label', `${project.title} 封面`);
    }

    const dialog = $('[data-donation-detail-dialog]');
    const title = $('#donation-detail-title');
    if (title) title.textContent = project.title;
    dialog?.showModal();
    syncDialogPause();
  }

  function openThanksDialog(donation) {
    const dialog = $('[data-donation-thanks-dialog]');
    if (!dialog || !donation) return;

    const setText = (sel, value) => {
      const node = $(sel);
      if (node) node.textContent = value;
    };

    setText('[data-thanks-name]', donation.anonymous ? '匿名支持者' : donation.donorName);
    setText('[data-thanks-project]', donation.projectTitle);
    setText('[data-thanks-amount]', formatMoney(donation.amount));
    setText('[data-thanks-date]', formatDate(donation.createdAt));

    $('[data-donation-detail-dialog]')?.close();
    dialog.showModal();
    syncDialogPause();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!isLoggedIn()) {
      setStatus('请先登录后再提交支持。', 'warning');
      return;
    }

    const form = event.target;
    const validated = validateDonationForm(form);
    if (!validated) return;

    const project = store().findProject(validated.projectId);
    if (!project) return;

    const donation = store().saveDonation({
      projectId: project.id,
      projectTitle: project.title,
      username: getUsername(),
      amount: validated.amount,
      donorName: validated.name,
      anonymous: validated.anonymous,
      message: validated.message,
      email: validated.email || undefined,
    });

    state.lastDonation = donation;
    renderDonationBoard();
    openThanksDialog(donation);
    setStatus('');
    form.message.value = '';
    if (!validated.anonymous) form.donorName.value = validated.name;
  }

  function renderRecordsList() {
    const list = $('[data-donation-records-list]');
    if (!list) return;
    const records = store().getDonationsForUser(getUsername());

    if (!records.length) {
      list.innerHTML = '<p class="donation-records-empty">还没有支持记录</p>';
      return;
    }

    list.innerHTML = records
      .slice()
      .reverse()
      .map(
        (record) => `
        <article class="donation-record-item">
          <div>
            <h4>${escapeHtml(record.projectTitle)}</h4>
            <p class="donation-record-item__meta">${formatMoney(record.amount)} · ${record.anonymous ? '匿名' : escapeHtml(record.donorName)}</p>
            ${record.message ? `<p class="donation-record-item__message">${escapeHtml(record.message)}</p>` : ''}
            <p class="donation-record-item__meta">${formatDate(record.createdAt)}</p>
          </div>
          <button class="button button-ghost" type="button" data-donation-delete="${escapeHtml(record.id)}">删除</button>
        </article>
      `,
      )
      .join('');

    list.querySelectorAll('[data-donation-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-donation-delete');
        if (!window.confirm('确定删除这条本地支持记录？')) return;
        const removed = store().deleteDonation(id);
        if (removed && state.selectedProjectId) renderProjectPanel(state.selectedProjectId);
        renderRecordsList();
        renderDonationBoard();
        setStatus('已删除本地支持记录。', 'success');
      });
    });
  }

  function openRecordsDialog() {
    if (!isLoggedIn()) {
      setStatus('请先登录后查看支持记录。', 'warning');
      return;
    }
    renderRecordsList();
    $('[data-donation-records-dialog]')?.showModal();
    syncDialogPause();
  }

  function rotateBatch() {
    const next = pickNextBatch(state.currentBatchIds);
    state.currentBatchIds = next.map((item) => item.id);
    renderDonationCards(next);
    updateAutoHint();
  }

  function renderDonationBoard() {
    const hint = $('[data-donation-login-hint]');
    if (hint) hint.hidden = isLoggedIn();

    if (!store()?.getProjects()?.length) return;

    if (!state.currentBatchIds.length) {
      const initial = pickInitialBatch();
      state.currentBatchIds = initial.map((item) => item.id);
      renderDonationCards(initial);
    } else {
      const projects = state.currentBatchIds.map((id) => store().findProject(id)).filter(Boolean);
      renderDonationCards(projects);
    }

    updateFormState();
    syncDialogPause();
    updateAutoHint();
  }

  function bindEvents() {
    $('[data-donation-form]')?.addEventListener('submit', handleSubmit);
    $('[data-donation-refresh]')?.addEventListener('click', rotateBatch);

    $('[data-donation-detail-close]')?.addEventListener('click', () => {
      $('[data-donation-detail-dialog]')?.close();
    });
    $('[data-donation-detail-close-footer]')?.addEventListener('click', () => {
      $('[data-donation-detail-dialog]')?.close();
    });

    $('[data-donation-thanks-records]')?.addEventListener('click', () => {
      $('[data-donation-thanks-dialog]')?.close();
      openRecordsDialog();
    });
    $('[data-donation-thanks-continue]')?.addEventListener('click', () => {
      $('[data-donation-thanks-dialog]')?.close();
    });
    $('[data-donation-thanks-close]')?.addEventListener('click', () => {
      $('[data-donation-thanks-dialog]')?.close();
    });
    $('[data-donation-records-close]')?.addEventListener('click', () => {
      $('[data-donation-records-dialog]')?.close();
    });
    $('[data-archive-donations]')?.addEventListener('click', openRecordsDialog);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !shouldPauseAutoRotate()) startAutoRotate();
      else stopAutoRotate();
    });

    document.querySelectorAll(
      '[data-donation-detail-dialog], [data-donation-thanks-dialog], [data-donation-records-dialog]',
    ).forEach((dialog) => {
      dialog.addEventListener('close', syncDialogPause);
      dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        dialog.close();
      });
    });

    let dialogOpener = null;
    document.addEventListener(
      'click',
      (event) => {
        const trigger = event.target.closest(
          '[data-donation-support], [data-donation-detail], [data-donation-form] [type="submit"], [data-archive-donations], [data-donation-thanks-records]',
        );
        if (trigger) dialogOpener = trigger;
      },
      true,
    );
    document.querySelectorAll(
      '[data-donation-detail-dialog], [data-donation-thanks-dialog], [data-donation-records-dialog]',
    ).forEach((dialog) => {
      dialog.addEventListener('close', () => {
        dialogOpener?.focus?.();
        dialogOpener = null;
      });
    });
  }

  function setupSupportHarbor() {
    if (document.body.dataset.page !== 'action') return;
    if (!store() || !window.DONATION_PROJECTS?.length) return;
    bindEvents();
    renderDonationBoard();
    startAutoRotate();
  }

  document.addEventListener('DOMContentLoaded', setupSupportHarbor);

  window.OceanActionDonationUI = {
    renderSupportHarbor: renderDonationBoard,
    renderDonationBoard,
    openRecordsDialog,
    openDetailDialog,
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
