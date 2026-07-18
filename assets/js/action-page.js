/**
 * 保护行动中心 · Phase 0–4
 * 宪法：docs/ACTION_PAGE.md
 * 全局志愿名额：lancun.action.volunteer.slots（从 mock 初始化，报名 -- / 取消 ++）
 */
(function actionPageModule() {
const ACTION_KEYS = {
  checkinsPrefix: 'lancun.action.checkins.',
  volunteerPrefix: 'lancun.action.volunteer.',
  donationsPrefix: 'lancun.action.donations.',
  volunteerSlots: 'lancun.action.volunteer.slots',
  legacyChecked: 'lancun.checked-days',
  points: 'lancun.points',
  actions: 'lancun.actions',
  account: 'lancun.account',
  session: 'lancun.session',
};

const state = {
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  volunteerTab: 'browse',
  selectedProjectId: null,
  selectedTier: 10,
  pendingDonation: null,
};

function getStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function setStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getAccount() {
  return getStored(ACTION_KEYS.account, null);
}

function getSession() {
  return getStored(ACTION_KEYS.session, { username: '', loggedIn: false });
}

function isLoggedIn() {
  const account = getAccount();
  const session = getSession();
  return Boolean(account && session.loggedIn && account.username === session.username);
}

function getUsername() {
  return isLoggedIn() ? getAccount().username : null;
}

function getPoints() {
  return getStored(ACTION_KEYS.points, 0);
}

function setPoints(value) {
  setStored(ACTION_KEYS.points, value);
}

function getActions() {
  return getStored(ACTION_KEYS.actions, []);
}

function pushAction(entry) {
  const actions = getActions();
  actions.push(entry);
  setStored(ACTION_KEYS.actions, actions);
}

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function emptyCheckinStore() {
  return {
    dates: [],
    lastCheckin: null,
    streak: 0,
    bonusAwarded: { day7: null, day30: null },
  };
}

function checkinKey(username) {
  return `${ACTION_KEYS.checkinsPrefix}${username}`;
}

function getCheckinStore(username) {
  if (!username) return emptyCheckinStore();
  return { ...emptyCheckinStore(), ...getStored(checkinKey(username), emptyCheckinStore()) };
}

function saveCheckinStore(username, store) {
  const unique = [...new Set(store.dates)].sort();
  const payload = {
    ...store,
    dates: unique,
    lastCheckin: unique[unique.length - 1] || null,
    streak: computeStreak(unique),
  };
  setStored(checkinKey(username), payload);
  return payload;
}

function computeStreak(sortedDates) {
  if (!sortedDates?.length) return 0;
  const set = new Set(sortedDates);
  const today = toIsoDate(new Date());
  const yesterday = toIsoDate(addDays(new Date(), -1));
  let cursor = set.has(today) ? today : set.has(yesterday) ? yesterday : null;
  if (!cursor) return 0;

  let streak = 0;
  let current = parseIso(cursor);
  while (set.has(toIsoDate(current))) {
    streak += 1;
    current = addDays(current, -1);
  }
  return streak;
}

function migrateLegacyCheckins() {
  const legacy = getStored(ACTION_KEYS.legacyChecked, null);
  if (!legacy || !Array.isArray(legacy) || !legacy.length) return;

  const username = getUsername();
  if (username) {
    const store = getCheckinStore(username);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    legacy.forEach((day) => {
      const iso = toIsoDate(new Date(year, month, Number(day)));
      if (!store.dates.includes(iso)) store.dates.push(iso);
    });
    saveCheckinStore(username, store);
  }

  localStorage.removeItem(ACTION_KEYS.legacyChecked);
}

function countMonthCheckins(username, year = new Date().getFullYear(), month = new Date().getMonth()) {
  if (!username) return 0;
  const store = getCheckinStore(username);
  return store.dates.filter((iso) => {
    const d = parseIso(iso);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;
}

function getMonthCheckinPoints(username, year, month) {
  if (!username) return 0;
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const store = getCheckinStore(username);
  const base = store.dates.filter((iso) => iso.startsWith(prefix)).length * 10;
  const bonus = getActions()
    .filter((item) => {
      if (!item.date || item.type !== '每日环保打卡') return false;
      const d = new Date(item.date);
      return d.getFullYear() === year && d.getMonth() === month && (item.points || 0) > 10;
    })
    .reduce((sum, item) => sum + ((item.points || 10) - 10), 0);
  return base + bonus;
}

function isCheckedIn(iso, username) {
  return getCheckinStore(username).dates.includes(iso);
}

function initVolunteerSlots() {
  const projects = window.LANCUN_DATA?.actionVolunteerProjects ?? [];
  let slots = getStored(ACTION_KEYS.volunteerSlots, null);
  if (!slots) {
    slots = {};
    projects.forEach((p) => {
      slots[p.id] = p.remainingSlots;
    });
    setStored(ACTION_KEYS.volunteerSlots, slots);
  }
  return slots;
}

function getVolunteerSlots() {
  return getStored(ACTION_KEYS.volunteerSlots, initVolunteerSlots());
}

function setVolunteerSlot(projectId, remaining) {
  const slots = getVolunteerSlots();
  slots[projectId] = Math.max(0, remaining);
  setStored(ACTION_KEYS.volunteerSlots, slots);
}

function volunteerKey(username) {
  return `${ACTION_KEYS.volunteerPrefix}${username}`;
}

function getVolunteerRecords(username) {
  return username ? getStored(volunteerKey(username), []) : [];
}

function saveVolunteerRecords(username, records) {
  setStored(volunteerKey(username), records);
}

function donationsKey(username) {
  return `${ACTION_KEYS.donationsPrefix}${username}`;
}

function getDonations(username) {
  return username ? getStored(donationsKey(username), []) : [];
}

function saveDonations(username, records) {
  setStored(donationsKey(username), records);
}

function resolveMedia(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('../')) return path;
  return `../${path}`;
}

function formatMonthLabel(year, month) {
  return `${year} 年 ${month + 1} 月`;
}

function renderProfileCalendar(selectors, year = new Date().getFullYear(), month = new Date().getMonth()) {
  const username = getUsername();
  const store = getCheckinStore(username);
  const todayIso = toIsoDate(new Date());
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const list = selectors?.length ? selectors : ['[data-profile-calendar]'];
  list.forEach((selector) => {
    document.querySelectorAll(selector).forEach((calendar) => {
      const cells = [];
      for (let i = 0; i < startOffset; i += 1) {
        cells.push('<span aria-hidden="true"></span>');
      }
      for (let day = 1; day <= daysInMonth; day += 1) {
        const iso = toIsoDate(new Date(year, month, day));
        const classes = [];
        if (store.dates.includes(iso)) classes.push('is-checked');
        if (iso === todayIso) classes.push('is-today');
        cells.push(`<span class="${classes.join(' ')}" role="gridcell">${day}</span>`);
      }
      calendar.innerHTML = cells.join('');
    });
  });
}

function setStatus(node, message, type = '') {
  if (!node) return;
  node.textContent = message;
  node.className = type ? `status-message is-${type}` : 'status-message';
}

function performCheckin() {
  const status = document.querySelector('[data-action-checkin-status]');
  if (!isLoggedIn()) return;
  const username = getUsername();
  const todayIso = toIsoDate(new Date());
  const store = getCheckinStore(username);

  if (store.dates.includes(todayIso)) {
    setStatus(status, '今天已经完成过打卡了，明天再来。', 'warning');
    return;
  }

  store.dates.push(todayIso);
  let points = 10;
  const streak = computeStreak(store.dates);

  if (streak === 7 && !store.bonusAwarded.day7) {
    points += 30;
    store.bonusAwarded.day7 = todayIso;
  }
  if (streak === 30 && !store.bonusAwarded.day30) {
    points += 150;
    store.bonusAwarded.day30 = todayIso;
  }

  if (streak < 7) store.bonusAwarded.day7 = null;
  if (streak < 30) store.bonusAwarded.day30 = null;

  saveCheckinStore(username, store);
  setPoints(getPoints() + points);
  pushAction({ type: '每日环保打卡', date: new Date().toISOString(), points });

  setStatus(status, `打卡成功，已获得 ${points} 积分。`, 'success');
  renderCheckinSummary();
  renderCheckinCalendar();
  window.renderProfile?.();
}

function renderCheckinSummary() {
  const username = getUsername();
  const loggedIn = isLoggedIn();
  const todayIso = toIsoDate(new Date());
  const store = getCheckinStore(username);
  const streak = computeStreak(store.dates);
  const checkedToday = store.dates.includes(todayIso);

  const pointsNode = document.querySelector('[data-action-points-total]');
  const streakNode = document.querySelector('[data-action-streak]');
  const statusNode = document.querySelector('[data-action-today-status]');
  const btn = document.querySelector('[data-action-checkin-btn]');
  const hint = document.querySelector('[data-action-checkin-hint]');

  if (pointsNode) pointsNode.textContent = getPoints();
  if (streakNode) streakNode.textContent = streak;
  if (statusNode) statusNode.textContent = checkedToday ? '今日已打卡 ✓' : '今日未打卡';

  if (btn) {
    if (!loggedIn) {
      btn.disabled = true;
      btn.textContent = '立即打卡';
    } else if (checkedToday) {
      btn.disabled = true;
      btn.textContent = '今日已完成';
    } else {
      btn.disabled = false;
      btn.textContent = '立即打卡';
    }
  }

  if (hint) hint.hidden = loggedIn;
}

function renderCheckinCalendar() {
  const username = getUsername();
  const store = getCheckinStore(username);
  const { calYear, calMonth } = state;
  const todayIso = toIsoDate(new Date());

  const monthLabel = document.querySelector('[data-action-cal-month]');
  const grid = document.querySelector('[data-action-cal-grid]');
  const daysNode = document.querySelector('[data-action-cal-month-days]');
  const pointsNode = document.querySelector('[data-action-cal-month-points]');

  if (monthLabel) monthLabel.textContent = formatMonthLabel(calYear, calMonth);

  if (grid) {
    const firstDay = new Date(calYear, calMonth, 1);
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push('<span class="action-cal-cell is-empty" role="presentation"></span>');
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = toIsoDate(new Date(calYear, calMonth, day));
      const cellDate = parseIso(iso);
      const classes = ['action-cal-cell'];
      if (store.dates.includes(iso)) classes.push('is-checked');
      if (iso === todayIso) classes.push('is-today');
      if (cellDate > parseIso(todayIso)) classes.push('is-future');
      const dow = cellDate.getDay();
      if (dow === 0 || dow === 6) classes.push('is-weekend');
      cells.push(`<span class="${classes.join(' ')}" role="gridcell" aria-label="${iso}">${day}</span>`);
    }

    grid.innerHTML = cells.join('');
  }

  if (daysNode) daysNode.textContent = countMonthCheckins(username, calYear, calMonth);
  if (pointsNode) pointsNode.textContent = getMonthCheckinPoints(username, calYear, calMonth);
}

function renderVolunteerProjects() {
  const list = document.querySelector('[data-action-volunteer-list]');
  if (!list) return;

  const projects = window.LANCUN_DATA?.actionVolunteerProjects ?? [];
  const slots = getVolunteerSlots();
  const records = getVolunteerRecords(getUsername());
  const registeredIds = new Set(records.map((r) => r.projectId));

  list.innerHTML = projects
    .map((project) => {
      const remaining = slots[project.id] ?? project.remainingSlots;
      const total = project.totalSlots;
      const ratio = total ? remaining / total : 0;
      const isFull = remaining <= 0;
      const already = registeredIds.has(project.id);
      const progressClass = ratio < 0.3 ? 'is-warning' : '';
      const coverStyle = project.coverImage
        ? `background-image: url('${resolveMedia(project.coverImage)}')`
        : '';

      let btnLabel = '立即报名';
      let btnDisabled = '';
      if (isFull) {
        btnLabel = '名额已满';
        btnDisabled = 'disabled';
      } else if (already) {
        btnLabel = '已报名';
        btnDisabled = 'disabled';
      }

      return `
        <article class="action-volunteer-card">
          <div class="action-volunteer-cover" data-volunteer-cover style="${coverStyle}" role="img" aria-label="${project.title}封面"></div>
          <div class="action-volunteer-body">
            <h3>${project.title}</h3>
            <p class="action-volunteer-meta">
              <span>${project.schedule}</span>
              <span>${project.location}</span>
            </p>
            <p class="action-volunteer-summary">${project.summary}</p>
            <div class="action-volunteer-slots">
              <div class="action-volunteer-slots-label">
                <span>剩余 ${remaining} / ${total} 名</span>
                <span>${Math.round(ratio * 100)}%</span>
              </div>
              <div class="action-progress" aria-hidden="true">
                <div class="action-progress-fill ${progressClass}" style="width:${Math.max(0, Math.min(100, ratio * 100))}%"></div>
              </div>
            </div>
            <button class="button button-primary" type="button" data-action-volunteer-open="${project.id}" ${btnDisabled}>
              ${btnLabel}
            </button>
          </div>
        </article>
      `;
    })
    .join('');

  list.querySelectorAll('[data-action-volunteer-open]').forEach((btn) => {
    btn.addEventListener('click', () => openVolunteerDialog(btn.getAttribute('data-action-volunteer-open')));
  });
}

function renderVolunteerRecords() {
  const container = document.querySelector('[data-action-volunteer-records]');
  if (!container) return;

  const records = getVolunteerRecords(getUsername());
  if (!records.length) {
    container.innerHTML = '<div class="action-empty"><p>还没有报名记录</p></div>';
    return;
  }

  const statusLabel = { upcoming: '未开始', ongoing: '进行中', ended: '已结束' };

  container.innerHTML = records
    .map(
      (record) => `
      <article class="action-record-card">
        <div>
          <h4>${record.projectTitle}</h4>
          <p class="action-record-meta">
            报名时间：${new Date(record.registeredAt).toLocaleString('zh-CN')}
            · 状态：${statusLabel[record.eventStatus] || '未开始'}
          </p>
        </div>
        <button class="button" type="button" data-action-volunteer-cancel-id="${record.id}">取消报名</button>
      </article>
    `,
    )
    .join('');

  container.querySelectorAll('[data-action-volunteer-cancel-id]').forEach((btn) => {
    btn.addEventListener('click', () => cancelVolunteer(btn.getAttribute('data-action-volunteer-cancel-id')));
  });
}

function switchVolunteerTab(tab) {
  state.volunteerTab = tab;
  document.querySelectorAll('[data-action-volunteer-tab]').forEach((node) => {
    const active = node.dataset.actionVolunteerTab === tab;
    node.classList.toggle('is-active', active);
    node.setAttribute('aria-selected', String(active));
  });

  const list = document.querySelector('[data-action-volunteer-list]');
  const records = document.querySelector('[data-action-volunteer-records]');
  if (list) list.hidden = tab !== 'browse';
  if (records) {
    records.hidden = tab !== 'records';
    if (tab === 'records') renderVolunteerRecords();
  }
}

function openVolunteerDialog(projectId) {
  if (!isLoggedIn()) {
    setStatus(document.querySelector('[data-action-volunteer-status]'), '请先登录后再报名。', 'warning');
    return;
  }

  const project = (window.LANCUN_DATA?.actionVolunteerProjects ?? []).find((p) => p.id === projectId);
  if (!project) return;

  const slots = getVolunteerSlots();
  if ((slots[projectId] ?? 0) <= 0) return;

  state.selectedProjectId = projectId;
  const dialog = document.querySelector('[data-action-volunteer-dialog]');
  const nameNode = document.querySelector('[data-action-volunteer-project-name]');
  const form = document.querySelector('[data-action-volunteer-form]');

  if (nameNode) nameNode.textContent = project.title;
  form?.reset();
  clearVolunteerErrors();
  dialog?.showModal();
  document.getElementById('volunteer-dialog-name')?.focus();
}

function closeVolunteerDialog() {
  document.querySelector('[data-action-volunteer-dialog]')?.close();
  state.selectedProjectId = null;
}

function clearVolunteerErrors() {
  ['volunteer-dialog-name', 'volunteer-dialog-phone'].forEach((id) => {
    const input = document.getElementById(id);
    const error = document.getElementById(`${id}-error`);
    input?.classList.remove('is-invalid');
    if (error) error.textContent = '';
  });
}

function validateVolunteerForm(form) {
  clearVolunteerErrors();
  let valid = true;
  const name = form.name.value.trim();
  const phone = form.phone.value.trim();

  if (!name) {
    valid = false;
    form.name.classList.add('is-invalid');
    document.getElementById('volunteer-dialog-name-error').textContent = '请填写姓名';
  }

  if (!/^1\d{10}$/.test(phone)) {
    valid = false;
    form.phone.classList.add('is-invalid');
    document.getElementById('volunteer-dialog-phone-error').textContent = '请输入 11 位手机号';
  }

  return valid;
}

async function submitVolunteerForm(event) {
  event.preventDefault();
  const form = event.target;
  if (!validateVolunteerForm(form)) return;

  const username = getUsername();
  const projectId = state.selectedProjectId;
  const project = (window.LANCUN_DATA?.actionVolunteerProjects ?? []).find((p) => p.id === projectId);
  if (!project || !username) return;

  const submitBtn = form.querySelector('[data-action-volunteer-submit]');
  submitBtn.disabled = true;
  submitBtn.setAttribute('aria-busy', 'true');

  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  const slots = getVolunteerSlots();
  const remaining = slots[projectId] ?? project.remainingSlots;
  if (remaining <= 0) {
    submitBtn.disabled = false;
    submitBtn.removeAttribute('aria-busy');
    setStatus(document.querySelector('[data-action-volunteer-status]'), '名额已满，请选择其他项目。', 'warning');
    closeVolunteerDialog();
    renderVolunteerProjects();
    return;
  }

  setVolunteerSlot(projectId, remaining - 1);

  const record = {
    id: `vol-${Date.now()}`,
    projectId,
    projectTitle: project.title,
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    idCard: form.idCard.value.trim(),
    session: form.session.value.trim(),
    note: form.note.value.trim(),
    registeredAt: new Date().toISOString(),
    eventStatus: 'upcoming',
  };

  const records = getVolunteerRecords(username);
  records.push(record);
  saveVolunteerRecords(username, records);
  pushAction({ type: '志愿报名', date: record.registeredAt, points: 0 });

  submitBtn.disabled = false;
  submitBtn.removeAttribute('aria-busy');
  closeVolunteerDialog();
  setStatus(document.querySelector('[data-action-volunteer-status]'), '报名成功，记录已保存在本机。', 'success');
  renderVolunteerProjects();
  window.renderProfile?.();
}

function cancelVolunteer(recordId) {
  const username = getUsername();
  if (!username) return;

  const records = getVolunteerRecords(username);
  const index = records.findIndex((r) => r.id === recordId);
  if (index < 0) return;

  const record = records[index];
  const slots = getVolunteerSlots();
  const project = (window.LANCUN_DATA?.actionVolunteerProjects ?? []).find((p) => p.id === record.projectId);
  const current = slots[record.projectId] ?? 0;
  const max = project?.totalSlots ?? current + 1;
  setVolunteerSlot(record.projectId, Math.min(max, current + 1));

  records.splice(index, 1);
  saveVolunteerRecords(username, records);
  setStatus(document.querySelector('[data-action-volunteer-status]'), '已取消报名，名额已退回。', 'success');
  renderVolunteerRecords();
  renderVolunteerProjects();
}

function renderDonationTiers() {
  const form = document.querySelector('[data-action-donate-form]');
  const grid = form?.querySelector('.action-tier-grid');
  if (!grid) return;

  const tiers = window.LANCUN_DATA?.actionDonationTiers ?? [];
  grid.innerHTML = tiers
    .map((tier) => {
      const amount = tier.amount;
      const label = amount === 'custom' ? '自定义' : `¥${amount}`;
      const selected = state.selectedTier === amount ? 'is-selected' : '';
      return `
        <button class="action-tier ${selected}" type="button" data-donation-tier="${amount}" aria-pressed="${state.selectedTier === amount}">
          <strong>${label}</strong>
          <span>${tier.label}</span>
        </button>
      `;
    })
    .join('');

  grid.querySelectorAll('[data-donation-tier]').forEach((btn) => {
    btn.addEventListener('click', () => selectDonationTier(btn.getAttribute('data-donation-tier')));
  });
}

function selectDonationTier(raw) {
  state.selectedTier = raw === 'custom' ? 'custom' : Number(raw);
  renderDonationTiers();
  const wrap = document.querySelector('[data-donation-custom-wrap]');
  if (wrap) wrap.hidden = state.selectedTier !== 'custom';
}

function renderFundUses() {
  const list = document.querySelector('[data-action-fund-uses] .action-fund-list');
  if (!list) return;

  const uses = window.LANCUN_DATA?.actionFundUses ?? [];
  list.innerHTML = uses
    .map(
      (item) => `
      <li>
        <span class="action-fund-icon" aria-hidden="true">${item.icon || '◎'}</span>
        <div>
          <h4>${item.title}</h4>
          <p>${item.desc}</p>
        </div>
      </li>
    `,
    )
    .join('');
}

function renderPastProjects() {
  const grid = document.querySelector('[data-action-past-projects]');
  if (!grid) return;

  const projects = window.LANCUN_DATA?.actionPastProjects ?? [];
  grid.innerHTML = projects
    .map((project) => {
      const coverStyle = project.coverImage
        ? `background-image: url('${resolveMedia(project.coverImage)}')`
        : '';
      return `
        <article class="action-past-card">
          <div class="action-past-cover" style="${coverStyle}" role="img" aria-label="${project.title}"></div>
          <div class="action-past-body">
            <h4>${project.title}</h4>
            <p class="action-past-period">${project.period}</p>
            <p class="action-past-highlight">${project.highlight}</p>
            <p class="action-past-summary">${project.summary}</p>
          </div>
        </article>
      `;
    })
    .join('');
}

function getSelectedDonationAmount() {
  if (state.selectedTier === 'custom') {
    const input = document.querySelector('[data-donation-custom]');
    const value = Number(input?.value);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }
  return Number(state.selectedTier) || 0;
}

function getSelectedTierLabel(amount) {
  const tiers = window.LANCUN_DATA?.actionDonationTiers ?? [];
  if (state.selectedTier === 'custom') return '自定义金额';
  const tier = tiers.find((t) => t.amount === amount);
  return tier?.label || '支持海洋保护';
}

function openDonateDialog() {
  const status = document.querySelector('[data-action-donate-status]');
  if (!isLoggedIn()) {
    setStatus(status, '请先登录后再提交支持意向。', 'warning');
    return;
  }

  const amount = getSelectedDonationAmount();
  if (!amount || amount < 1) {
    setStatus(status, '请选择档位或输入有效的自定义金额。', 'warning');
    const input = document.querySelector('[data-donation-custom]');
    input?.classList.add('is-invalid');
    document.getElementById('donation-custom-amount-error').textContent =
      state.selectedTier === 'custom' ? '请输入大于 0 的金额' : '';
    return;
  }

  state.pendingDonation = {
    amount,
    tierLabel: getSelectedTierLabel(amount),
    anonymous: document.querySelector('[data-donation-anonymous]')?.checked ?? false,
  };

  const dialog = document.querySelector('[data-action-donate-dialog]');
  const summary = document.querySelector('[data-action-donate-summary]');
  const body = document.querySelector('[data-action-donate-dialog-body]');
  const thanks = document.querySelector('[data-action-donate-thanks]');

  if (summary) {
    summary.textContent = `您将支持 ¥${amount}（${state.pendingDonation.tierLabel}）。确认后将写入本机演示记录，不会产生真实支付。`;
  }
  if (body) body.hidden = false;
  if (thanks) thanks.hidden = true;
  dialog?.showModal();
}

function closeDonateDialog() {
  document.querySelector('[data-action-donate-dialog]')?.close();
  state.pendingDonation = null;
}

async function confirmDonation() {
  const username = getUsername();
  const pending = state.pendingDonation;
  if (!username || !pending) return;

  const confirmBtn = document.querySelector('[data-action-donate-confirm]');
  confirmBtn.disabled = true;
  confirmBtn.setAttribute('aria-busy', 'true');

  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  const record = {
    id: `don-${Date.now()}`,
    amount: pending.amount,
    tierLabel: pending.tierLabel,
    anonymous: pending.anonymous,
    donatedAt: new Date().toISOString(),
  };

  const records = getDonations(username);
  records.push(record);
  saveDonations(username, records);
  pushAction({ type: '公益支持', date: record.donatedAt, points: 0 });

  confirmBtn.disabled = false;
  confirmBtn.removeAttribute('aria-busy');

  const body = document.querySelector('[data-action-donate-dialog-body]');
  const thanks = document.querySelector('[data-action-donate-thanks]');
  const thanksText = document.querySelector('[data-action-donate-thanks-text]');

  if (body) body.hidden = true;
  if (thanks) thanks.hidden = false;
  if (thanksText) {
    thanksText.textContent = `感谢你的 ¥${pending.amount} 支持意向！本记录已保存在本机，用于课程演示。`;
  }

  setStatus(document.querySelector('[data-action-donate-status]'), '支持意向已记录。', 'success');
  window.renderProfile?.();
}

function bindEvents() {
  document.querySelector('[data-action-checkin-btn]')?.addEventListener('click', performCheckin);

  document.querySelector('[data-action-cal-prev]')?.addEventListener('click', () => {
    state.calMonth -= 1;
    if (state.calMonth < 0) {
      state.calMonth = 11;
      state.calYear -= 1;
    }
    renderCheckinCalendar();
  });

  document.querySelector('[data-action-cal-next]')?.addEventListener('click', () => {
    state.calMonth += 1;
    if (state.calMonth > 11) {
      state.calMonth = 0;
      state.calYear += 1;
    }
    renderCheckinCalendar();
  });

  document.querySelectorAll('[data-action-volunteer-tab]').forEach((tab) => {
    tab.addEventListener('click', () => switchVolunteerTab(tab.dataset.actionVolunteerTab));
  });

  document.querySelector('[data-action-volunteer-form]')?.addEventListener('submit', submitVolunteerForm);
  document.querySelector('[data-action-volunteer-close]')?.addEventListener('click', closeVolunteerDialog);
  document.querySelector('[data-action-volunteer-cancel]')?.addEventListener('click', closeVolunteerDialog);

  document.querySelector('[data-action-donate-submit]')?.addEventListener('click', openDonateDialog);
  document.querySelector('[data-action-donate-close]')?.addEventListener('click', closeDonateDialog);
  document.querySelector('[data-action-donate-cancel]')?.addEventListener('click', closeDonateDialog);
  document.querySelector('[data-action-donate-confirm]')?.addEventListener('click', confirmDonation);
  document.querySelector('[data-action-donate-done]')?.addEventListener('click', closeDonateDialog);
  document.querySelector('[data-action-donate-thanks-close]')?.addEventListener('click', closeDonateDialog);

  document.querySelector('[data-action-volunteer-dialog]')?.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeVolunteerDialog();
  });

  document.querySelector('[data-action-donate-dialog]')?.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDonateDialog();
  });
}

function setupActionPage() {
  if (document.body.dataset.page !== 'action') return;

  migrateLegacyCheckins();
  initVolunteerSlots();
  bindEvents();
  renderCheckinSummary();
  renderCheckinCalendar();
  renderVolunteerProjects();
  renderDonationTiers();
  renderFundUses();
  renderPastProjects();
  switchVolunteerTab('browse');
}

window.LANCUN_setupActionPage = setupActionPage;
window.LANCUN_actionCheckins = {
  migrateLegacyCheckins,
  getCheckinStore,
  countMonthCheckins,
  renderProfileCalendar,
  computeStreak,
  toIsoDate,
};

document.addEventListener('DOMContentLoaded', () => {
  window.LANCUN_setupActionPage?.();
});
})();
