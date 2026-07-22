/**
 * 海洋行动中心 · 打卡 UI（阶段 2）
 */
(function checkinUIModule() {
  const storage = () => window.OceanActionCheckins;
  const badges = () => window.OceanActionBadges;

  const state = {
    editMode: false,
    optionalExpanded: false,
    pendingImagePreview: null,
    lastCertificate: null,
    historyCalYear: new Date().getFullYear(),
    historyCalMonth: new Date().getMonth(),
  };

  function getStored(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function getAccount() {
    return getStored('lancun.account', null);
  }

  function getSession() {
    return getStored('lancun.session', { username: '', loggedIn: false });
  }

  function isLoggedIn() {
    const account = getAccount();
    const session = getSession();
    return Boolean(account && session.loggedIn && account.username === session.username);
  }

  function getUsername() {
    return isLoggedIn() ? getAccount().username : null;
  }

  function getDisplayName() {
    const account = getAccount();
    return account?.displayName || account?.username || '蓝色行动者';
  }

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((node) => {
      node.textContent = value;
    });
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

  const ACTION_TYPES = [
    '减少一次性塑料',
    '自带水杯',
    '垃圾分类',
    '低碳出行',
    '参与净滩',
    '海洋知识学习',
    '分享环保内容',
    '节约用水',
  ];

  const MINUTE_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  function isOptionalExpanded() {
    const panel = $('[data-checkin-optional]');
    return panel ? !panel.hidden : false;
  }

  function toggleOptionalSection(force) {
    const panel = $('[data-checkin-optional]');
    const toggle = $('[data-checkin-toggle-optional]');
    if (!panel) return;

    const next = typeof force === 'boolean' ? force : !isOptionalExpanded();
    state.optionalExpanded = next;
    panel.hidden = !next;
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(next));
      toggle.textContent = next ? '收起补充' : '补充记录';
    }
  }

  function shouldAutoExpandOptional(checkin) {
    if (!checkin) return false;
    return Boolean(checkin.mood && checkin.mood !== '平静');
  }

  function snapMinutes(totalMinutes) {
    const hours = Math.min(8, Math.floor(totalMinutes / 60));
    let minutes = totalMinutes % 60;
    if (!MINUTE_STEPS.includes(minutes)) {
      minutes = MINUTE_STEPS.reduce((best, step) =>
        Math.abs(step - minutes) < Math.abs(best - minutes) ? step : best,
      );
    }
    if (hours === 8 && minutes > 0) {
      return { hours: 8, minutes: 0 };
    }
    return { hours, minutes };
  }

  function readDuration(form) {
    const hours = Number(form.durationHours?.value ?? 0);
    const minutes = Number(form.durationMinutes?.value ?? 0);
    return hours * 60 + minutes;
  }

  function setDurationFields(form, totalMinutes) {
    const snapped = snapMinutes(Math.max(0, Number(totalMinutes) || 0));
    if (form.durationHours) form.durationHours.value = String(snapped.hours);
    if (form.durationMinutes) form.durationMinutes.value = String(snapped.minutes);
  }

  function setDurationError(form, message) {
    const hours = form.durationHours;
    const minutes = form.durationMinutes;
    const error = document.getElementById('checkin-duration-error');
    hours?.classList.toggle('is-invalid', Boolean(message));
    minutes?.classList.toggle('is-invalid', Boolean(message));
    if (error) error.textContent = message || '';
  }

  function fillFormFromCheckin(checkin) {
    const form = $('.daily-checkin-form');
    if (!form || !checkin) return;

    if (ACTION_TYPES.includes(checkin.actionType)) {
      form.actionType.value = checkin.actionType;
    } else {
      form.actionType.value = '减少一次性塑料';
    }

    form.description.value = checkin.description || '';
    form.mood.value = checkin.mood || '平静';
    setDurationFields(form, checkin.duration ?? 10);

    state.pendingImagePreview = checkin.imagePreview || null;
    renderImagePreview();
    if (shouldAutoExpandOptional(checkin)) toggleOptionalSection(true);
    else toggleOptionalSection(false);
  }

  function resetFormForNewDay() {
    const form = $('.daily-checkin-form');
    if (!form) return;
    form.reset();
    setDurationFields(form, 10);
    if (form.photo) form.photo.value = '';
    state.pendingImagePreview = null;
    renderImagePreview();
    clearFormErrors(form);
    toggleOptionalSection(false);
  }

  function renderImagePreview() {
    const preview = $('[data-checkin-preview]');
    if (!preview) return;
    if (state.pendingImagePreview) {
      preview.innerHTML = `<img src="${state.pendingImagePreview}" alt="行动图片预览" />`;
      preview.hidden = false;
    } else {
      preview.innerHTML = '';
      preview.hidden = true;
    }
  }

  function renderWeekStrip(checkins) {
    const strip = $('[data-checkin-week-strip]');
    if (!strip) return;
    const dateSet = new Set(checkins.map((c) => c.date));
    const today = storage().toIsoDate(new Date());

    strip.innerHTML = '';
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = storage().toIsoDate(d);
      const dow = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
      const checked = dateSet.has(iso);
      const isToday = iso === today;
      strip.insertAdjacentHTML(
        'beforeend',
        `<li class="${checked ? 'is-checked' : ''}${isToday ? ' is-today' : ''}"><span class="daily-week-strip__dow">${dow}</span><span class="daily-week-dot" aria-hidden="true"></span></li>`,
      );
    }
  }

  function renderBadgeStrip(username) {
    const strip = $('[data-checkin-badge-strip]');
    if (!strip || !username) {
      if (strip) strip.innerHTML = '';
      return;
    }
    const store = badges().getBadgeStore(username);
    strip.innerHTML = badges().BADGES.map((badge) => {
      const unlocked = store.unlockedIds.includes(badge.id);
      const levelClass = badge.level ? ` is-level-${badge.level}` : '';
      return `
        <div class="daily-badge-strip__item ${unlocked ? 'is-unlocked' : ''}${levelClass}" title="${badge.name} · 连续 ${badge.requiredStreak} 天">
          <span class="daily-badge-strip__days">${badge.requiredStreak}</span>
          <span class="daily-badge-strip__name">${badge.name}</span>
        </div>
      `;
    }).join('');
  }

  function renderCheckinPanel() {
    const username = getUsername();
    const loggedIn = isLoggedIn();
    const checkins = username ? storage().getCheckins(username) : [];
    const { currentStreak, longestStreak } = storage().calculateStreak(checkins);
    const totalDays = storage().calculateTotalDays(checkins);
    const totalDuration = storage().calculateTotalDuration(checkins);
    const next = badges().getNextBadge(currentStreak);
    const todayCheckin = username ? storage().getTodayCheckin(username) : null;
    const hasToday = Boolean(todayCheckin);

    setText('[data-checkin-current-streak]', currentStreak);
    setText('[data-checkin-longest-streak]', longestStreak);
    setText('[data-checkin-total-days]', totalDays);
    setText('[data-checkin-total-duration]', totalDuration);

    const nextLabel = $('[data-checkin-next-badge]');
    const nextBar = $('[data-checkin-next-badge-bar] span');
    if (next.badge) {
      if (nextLabel) nextLabel.innerHTML = `连续 <strong>${next.badge.requiredStreak}</strong> 天 · ${next.badge.name}`;
      if (nextBar) nextBar.style.width = `${next.progress}%`;
    } else if (nextLabel) {
      nextLabel.textContent = '已解锁全部勋章';
      if (nextBar) nextBar.style.width = '100%';
    }

    renderWeekStrip(checkins);
    if (username) renderBadgeStrip(username);

    const form = $('.daily-checkin-form');
    const hint = $('[data-checkin-login-hint]');
    const submitBtn = $('[data-checkin-submit]');
    const doneBtn = $('[data-checkin-done]');
    const editBtn = $('[data-checkin-edit]');
    const certBtn = $('[data-checkin-view-cert]');
    const status = $('[data-checkin-status]');
    const optionalToggle = $('[data-checkin-toggle-optional]');

    if (optionalToggle && !state.optionalExpanded) {
      optionalToggle.setAttribute('aria-expanded', 'false');
      optionalToggle.textContent = '补充记录';
    }

    if (form) {
      const fields = form.querySelectorAll('input, select, textarea, button[type="button"]');
      fields.forEach((field) => {
        if (field.matches(
          '[data-checkin-edit], [data-checkin-view-cert], [data-checkin-history-open], [data-checkin-toggle-optional]',
        )) return;
        field.disabled = !loggedIn || (hasToday && !state.editMode);
      });
    }

    if (hint) hint.hidden = loggedIn;
    if (submitBtn) {
      submitBtn.hidden = hasToday && !state.editMode;
      submitBtn.textContent = state.editMode ? '保存修改' : '完成今日打卡';
      submitBtn.disabled = !loggedIn;
    }
    if (doneBtn) doneBtn.hidden = !hasToday || state.editMode;
    if (editBtn) editBtn.hidden = !hasToday || state.editMode;
    if (certBtn) certBtn.hidden = !hasToday;

    const clearBtn = $('[data-checkin-clear]');
    if (clearBtn) {
      clearBtn.hidden = hasToday && !state.editMode;
      clearBtn.disabled = !loggedIn || (hasToday && !state.editMode);
    }

    if (hasToday && !state.editMode) {
      resetFormForNewDay();
      if (form) {
        form.querySelectorAll('input, select, textarea').forEach((el) => {
          el.disabled = true;
        });
      }
    } else if (!hasToday && !state.editMode) {
      resetFormForNewDay();
    }

    if (status && !loggedIn) {
      status.textContent = '';
      status.className = 'status-message';
    }

    if (username) {
      badges().syncBadges(username, currentStreak);
    }
  }

  function validateForm(form) {
    clearFormErrors(form);
    let valid = true;

    const actionType = form.actionType.value;

    if (!form.description.value.trim()) {
      setFieldError(form.description, '请填写一句话行动记录');
      valid = false;
    }

    const duration = readDuration(form);
    if (!Number.isFinite(duration) || duration < 1) {
      setDurationError(form, '请选择至少 1 分钟的行动时长');
      valid = false;
    }

    return valid ? { actionType, duration } : null;
  }

  function handleImageFile(file) {
    if (!file) {
      state.pendingImagePreview = null;
      renderImagePreview();
      return;
    }
    if (!file.type.startsWith('image/')) {
      const status = $('[data-checkin-status]');
      if (status) {
        status.textContent = '请选择图片文件';
        status.className = 'status-message is-warning';
      }
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string' && result.length > 500000) {
        const status = $('[data-checkin-status]');
        if (status) {
          status.textContent = '图片过大，未保存预览（请使用更小的图片）';
          status.className = 'status-message is-warning';
        }
        state.pendingImagePreview = null;
      } else {
        state.pendingImagePreview = result;
      }
      renderImagePreview();
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!isLoggedIn()) return;
    const username = getUsername();
    const form = $('.daily-checkin-form');
    const status = $('[data-checkin-status]');
    const validated = validateForm(form);
    if (!validated) return;

    const today = storage().toIsoDate(new Date());
    const existing = storage().getTodayCheckin(username);
    const checkin = storage().saveCheckin(username, {
      id: existing?.id,
      date: today,
      actionType: validated.actionType,
      description: form.description.value.trim(),
      duration: validated.duration,
      mood: form.mood.value,
      imagePreview: state.pendingImagePreview || undefined,
      createdAt: existing?.createdAt || new Date().toISOString(),
    });

    const checkins = storage().getCheckins(username);
    const { currentStreak } = storage().calculateStreak(checkins);
    badges().syncBadges(username, currentStreak);

    state.editMode = false;
    state.lastCertificate = checkin;
    resetFormForNewDay();
    renderCheckinPanel();
    openCertificateDialog(checkin);

    if (status) {
      status.textContent = existing ? '今日打卡已更新。' : '打卡成功！';
      status.className = 'status-message is-success';
    }

    window.renderProfile?.();
  }

  function openCertificateDialog(checkin) {
    const dialog = $('[data-checkin-certificate-dialog]');
    if (!dialog || !checkin) return;
    const username = getUsername();
    const checkins = storage().getCheckins(username);
    const { currentStreak } = storage().calculateStreak(checkins);
    const unlocked = badges().getUnlockedBadges(username);

    setText('[data-cert-recipient]', getDisplayName());
    setText('[data-cert-action]', checkin.actionType);
    setText('[data-cert-date]', checkin.date);
    setText('[data-cert-streak]', currentStreak);
    setText(
      '[data-cert-badges]',
      unlocked.length ? unlocked.map((b) => b.name).join('、') : '暂无',
    );

    dialog.showModal();
  }

  function renderHistoryList(username) {
    const list = $('[data-checkin-history-list]');
    if (!list) return;
    const checkins = storage().getCheckins(username).slice().reverse();
    const today = storage().toIsoDate(new Date());

    if (!checkins.length) {
      list.innerHTML = '<p class="checkin-history-empty">还没有打卡记录</p>';
      return;
    }

    list.innerHTML = checkins
      .map(
        (item) => `
        <article class="checkin-history-item">
          <div>
            <h4>${item.actionType}</h4>
            <p class="checkin-history-item__meta">${item.date} · ${item.duration} 分钟 · ${item.mood}</p>
            <p class="checkin-history-item__desc">${item.description}</p>
          </div>
          <div class="checkin-history-item__actions">
            ${item.date === today ? '<button class="button button-ghost" type="button" data-checkin-history-edit>编辑今日</button>' : ''}
            <button class="button button-ghost" type="button" data-checkin-history-delete="${item.id}">删除</button>
          </div>
        </article>
      `,
      )
      .join('');

    list.querySelectorAll('[data-checkin-history-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        storage().deleteCheckin(username, btn.getAttribute('data-checkin-history-delete'));
        badges().syncBadges(username, storage().calculateStreak(storage().getCheckins(username)).currentStreak);
        renderHistoryList(username);
        renderHistoryCalendar(username);
        renderCheckinPanel();
        window.renderProfile?.();
      });
    });

    list.querySelector('[data-checkin-history-edit]')?.addEventListener('click', () => {
      $('[data-checkin-history-dialog]')?.close();
      state.editMode = true;
      fillFormFromCheckin(storage().getTodayCheckin(username));
      renderCheckinPanel();
      $('.daily-checkin-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function renderHistoryCalendar(username) {
    const grid = $('[data-checkin-history-cal-grid]');
    const label = $('[data-checkin-history-cal-month]');
    if (!grid || !label) return;

    const { historyCalYear, historyCalMonth } = state;
    label.textContent = `${historyCalYear} 年 ${historyCalMonth + 1} 月`;

    const checkins = storage().getCheckins(username);
    const dateSet = new Set(checkins.map((c) => c.date));
    const today = storage().toIsoDate(new Date());
    const firstDay = new Date(historyCalYear, historyCalMonth, 1);
    const daysInMonth = new Date(historyCalYear, historyCalMonth + 1, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push('<span class="checkin-mini-cal__cell is-empty"></span>');
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = storage().toIsoDate(new Date(historyCalYear, historyCalMonth, day));
      const classes = ['checkin-mini-cal__cell'];
      if (dateSet.has(iso)) classes.push('is-checked');
      if (iso === today) classes.push('is-today');
      cells.push(`<span class="${classes.join(' ')}" role="gridcell">${day}</span>`);
    }
    grid.innerHTML = cells.join('');
  }

  function renderHistoryStreak(username) {
    const node = $('[data-checkin-history-streak]');
    if (!node || !username) return;
    const checkins = storage().getCheckins(username);
    const { currentStreak } = storage().calculateStreak(checkins);
    const totalDays = storage().calculateTotalDays(checkins);
    node.textContent = `当前连续 ${currentStreak} 天 · 总打卡 ${totalDays} 次`;
  }

  function openHistoryDialog() {
    const username = getUsername();
    if (!username) return;
    const dialog = $('[data-checkin-history-dialog]');
    if (!dialog) return;
    renderHistoryStreak(username);
    renderHistoryList(username);
    renderHistoryCalendar(username);
    dialog.showModal();
  }

  function renderBadgesDialog() {
    const username = getUsername();
    const grid = $('[data-checkin-badges-grid]');
    if (!grid || !username) return;
    const store = badges().getBadgeStore(username);
    grid.innerHTML = badges().BADGES.map((badge) => {
      const unlocked = store.unlockedIds.includes(badge.id);
      const levelClass = badge.level ? ` is-level-${badge.level}` : '';
      return `
        <article class="checkin-badge-card ${unlocked ? 'is-unlocked' : ''}${levelClass}">
          <span class="checkin-badge-card__icon" aria-hidden="true">${badge.icon}</span>
          <h4>${badge.name}</h4>
          <p>连续 ${badge.requiredStreak} 天</p>
          <p class="checkin-badge-card__desc">${badge.description}</p>
          <span class="checkin-badge-card__state">${unlocked ? '已解锁' : '未解锁'}</span>
        </article>
      `;
    }).join('');
  }

  function openBadgesDialog() {
    if (!isLoggedIn()) return;
    renderBadgesDialog();
    $('[data-checkin-badges-dialog]')?.showModal();
  }

  function bindEvents() {
    const form = $('.daily-checkin-form');
    form?.photo?.addEventListener('change', (e) => {
      handleImageFile(e.target.files?.[0]);
    });

    $('[data-checkin-submit]')?.addEventListener('click', handleSubmit);
    $('[data-checkin-clear]')?.addEventListener('click', () => {
      if (!isLoggedIn()) return;
      const todayCheckin = storage().getTodayCheckin(getUsername());
      if (todayCheckin && !state.editMode) return;
      resetFormForNewDay();
      const status = $('[data-checkin-status]');
      if (status) {
        status.textContent = '表单已清空。';
        status.className = 'status-message';
      }
    });
    $('[data-checkin-edit]')?.addEventListener('click', () => {
      state.editMode = true;
      const username = getUsername();
      fillFormFromCheckin(storage().getTodayCheckin(username));
      renderCheckinPanel();
    });
    $('[data-checkin-view-cert]')?.addEventListener('click', () => {
      const checkin = storage().getTodayCheckin(getUsername()) || state.lastCertificate;
      openCertificateDialog(checkin);
    });
    $('[data-checkin-history-open]')?.addEventListener('click', openHistoryDialog);
    $('[data-checkin-toggle-optional]')?.addEventListener('click', () => toggleOptionalSection());
    $('[data-archive-history]')?.addEventListener('click', openHistoryDialog);
    $('[data-archive-badges]')?.addEventListener('click', openBadgesDialog);

    $('[data-checkin-certificate-close]')?.addEventListener('click', () => {
      $('[data-checkin-certificate-dialog]')?.close();
    });
    $('[data-checkin-certificate-badges]')?.addEventListener('click', () => {
      $('[data-checkin-certificate-dialog]')?.close();
      openBadgesDialog();
    });
    $('[data-checkin-certificate-save]')?.addEventListener('click', () => {
      const status = $('[data-checkin-status]');
      if (status) {
        status.textContent = '证书记录已保存在本机打卡数据中。';
        status.className = 'status-message is-success';
      }
      $('[data-checkin-certificate-dialog]')?.close();
    });

    $('[data-checkin-history-close]')?.addEventListener('click', () => {
      $('[data-checkin-history-dialog]')?.close();
    });
    $('[data-checkin-history-prev]')?.addEventListener('click', () => {
      state.historyCalMonth -= 1;
      if (state.historyCalMonth < 0) {
        state.historyCalMonth = 11;
        state.historyCalYear -= 1;
      }
      renderHistoryCalendar(getUsername());
    });
    $('[data-checkin-history-next]')?.addEventListener('click', () => {
      state.historyCalMonth += 1;
      if (state.historyCalMonth > 11) {
        state.historyCalMonth = 0;
        state.historyCalYear += 1;
      }
      renderHistoryCalendar(getUsername());
    });

    $('[data-checkin-badges-close]')?.addEventListener('click', () => {
      $('[data-checkin-badges-dialog]')?.close();
    });

    document.querySelectorAll('[data-checkin-certificate-dialog], [data-checkin-history-dialog], [data-checkin-badges-dialog]').forEach((dialog) => {
      dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        dialog.close();
      });
    });

    let dialogOpener = null;
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest(
        '[data-checkin-history-open], [data-archive-history], [data-archive-badges], [data-checkin-view-cert], [data-checkin-toggle-optional]',
      );
      if (trigger) dialogOpener = trigger;
    }, true);
    document.querySelectorAll('[data-checkin-certificate-dialog], [data-checkin-history-dialog], [data-checkin-badges-dialog]').forEach((dialog) => {
      dialog.addEventListener('close', () => {
        dialogOpener?.focus?.();
        dialogOpener = null;
      });
    });
  }

  function setupDailyCheckin() {
    if (document.body.dataset.page !== 'action') return;
    bindEvents();
    renderCheckinPanel();
  }

  document.addEventListener('DOMContentLoaded', setupDailyCheckin);

  window.OceanActionCheckinUI = { renderCheckinPanel, openHistoryDialog, openBadgesDialog };
})();
