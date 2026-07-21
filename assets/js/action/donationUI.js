/**
 * 海洋行动中心 · 公益支持 UI（阶段 4）
 */
(function donationUIModule() {
  const store = () => window.OceanActionDonation;

  const state = {
    selectedProjectId: null,
    selectedAmount: 10,
    customMode: false,
    lastDonation: null,
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

  function formatMoney(value) {
    return `¥${Number(value || 0).toLocaleString('zh-CN')}`;
  }

  function formatDate(iso) {
    const date = iso ? new Date(iso) : new Date();
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  function setStatus(message, tone = '') {
    const status = $('[data-donation-status]');
    if (!status) return;
    status.textContent = message || '';
    status.className = tone ? `status-message is-${tone}` : 'status-message';
  }

  function populateProjectSelect() {
    const select = $('[data-donation-project]');
    if (!select) return;
    const projects = store().getProjects();
    select.innerHTML = projects
      .map(
        (project) =>
          `<option value="${escapeHtml(project.id)}">${escapeHtml(project.title)}</option>`,
      )
      .join('');
    if (!state.selectedProjectId && projects[0]) {
      state.selectedProjectId = projects[0].id;
    }
    select.value = state.selectedProjectId || projects[0]?.id || '';
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

  function renderAmountPills() {
    const wrap = $('[data-donation-amount-pills]');
    if (!wrap) return;
    const amounts = [10, 30, 50, 100, 'custom'];

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
        renderAmountPills();
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
      const target = state.customMode ? form.customAmount : form.querySelector('[data-donation-amount].is-selected');
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

    dialog.showModal();
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
    renderProjectPanel(project.id);
    renderSupportHarbor();
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
        if (removed) renderProjectPanel(state.selectedProjectId);
        renderRecordsList();
        renderSupportHarbor();
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
  }

  function bindEvents() {
    $('[data-donation-form]')?.addEventListener('submit', handleSubmit);
    $('[data-donation-project]')?.addEventListener('change', (event) => {
      renderProjectPanel(event.target.value);
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

    document.querySelectorAll('[data-donation-thanks-dialog], [data-donation-records-dialog]').forEach((dialog) => {
      dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        dialog.close();
      });
    });

    let dialogOpener = null;
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest(
        '[data-donation-form] [type="submit"], [data-archive-donations], [data-donation-thanks-records]',
      );
      if (trigger) dialogOpener = trigger;
    }, true);
    document.querySelectorAll('[data-donation-thanks-dialog], [data-donation-records-dialog]').forEach((dialog) => {
      dialog.addEventListener('close', () => {
        dialogOpener?.focus?.();
        dialogOpener = null;
      });
    });
  }

  function renderSupportHarbor() {
    if (!store()?.getProjects()?.length) return;
    populateProjectSelect();
    const projectId = $('[data-donation-project]')?.value || state.selectedProjectId || store().getProjects()[0]?.id;
    renderProjectPanel(projectId);
    renderAmountPills();
    toggleCustomWrap();
    updateFormState();
  }

  function setupSupportHarbor() {
    if (document.body.dataset.page !== 'action') return;
    if (!store() || !window.DONATION_PROJECTS?.length) return;
    bindEvents();
    renderSupportHarbor();
  }

  document.addEventListener('DOMContentLoaded', setupSupportHarbor);

  window.OceanActionDonationUI = { renderSupportHarbor, openRecordsDialog };
})();
