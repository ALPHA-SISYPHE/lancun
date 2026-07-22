/** Builds user menu markup; profileHref is pages/profile.html or profile.html */

window.buildUserMenuHtml = (profileHref) => {
  const actionHref = profileHref.replace(/profile\.html$/, 'action.html');
  const speciesHref = profileHref.replace(/profile\.html$/, 'species.html');

  return `
<div class="user-menu" data-user-menu>
  <button
    type="button"
    class="user-menu-trigger user-menu-trigger--avatar"
    data-user-menu-trigger
    aria-haspopup="menu"
    aria-expanded="false"
    aria-controls="account-menu-panel"
    aria-label="打开守护者账户菜单"
  >
    <span class="header-avatar user-menu-avatar" data-user-menu-avatar aria-hidden="true">澜</span>
    <span class="sr-only" data-user-menu-sr>打开守护者账户菜单</span>
  </button>

  <div
    class="account-menu"
    id="account-menu-panel"
    data-account-menu
    role="menu"
    aria-label="守护者账户菜单"
    hidden
  >
    <div class="account-menu__panel" data-account-menu-guest>
      <div class="account-menu__head">
        <p class="account-menu__title">守护者账户</p>
        <p class="account-menu__lead">登录后可保存你的环保打卡、荣誉证书、志愿报名与公益支持记录。</p>
      </div>
      <p class="account-menu__sync-heading">登录后可同步管理：</p>
      <ul class="account-menu__sync-list">
        <li>环保打卡</li>
        <li>荣誉证书</li>
        <li>志愿报名</li>
        <li>公益支持</li>
        <li>新增物种档案</li>
      </ul>
      <div class="account-menu__actions account-menu__actions--primary">
        <button type="button" class="account-menu__btn account-menu__btn--primary" data-account-action="login" role="menuitem">登录</button>
        <button type="button" class="account-menu__btn account-menu__btn--primary account-menu__btn--outline" data-account-action="register" role="menuitem">创建守护者账户</button>
      </div>
      <div class="account-menu__divider" role="separator"></div>
      <div class="account-menu__actions account-menu__actions--secondary">
        <button type="button" class="account-menu__link" data-account-menu-dismiss role="menuitem">继续以游客身份浏览</button>
        <button type="button" class="account-menu__link" data-account-menu-info role="menuitem">账户能保存什么？</button>
      </div>
      <p class="account-menu__footnote">也可以继续以游客身份浏览，个人记录仅保存在本设备。</p>
    </div>

    <div class="account-menu__panel account-menu__panel--member" data-account-menu-member hidden>
      <div class="account-menu__profile">
        <span class="header-avatar account-menu__profile-avatar" data-menu-avatar aria-hidden="true">海</span>
        <div class="account-menu__profile-meta">
          <strong data-menu-profile-name>海洋观察者</strong>
          <span class="account-menu__username" data-menu-profile-username>demo_guardian</span>
          <span class="account-menu__role" data-menu-profile-role>公益守护者</span>
          <span class="account-menu__badge">蓝色守护者账户</span>
        </div>
      </div>
      <div class="account-menu__stats" data-account-menu-stats aria-label="行动记录摘要">
        <div class="account-menu__stat">
          <span class="account-menu__stat-label">今日行动</span>
          <span class="account-menu__stat-value" data-menu-stat-today>未打卡</span>
        </div>
        <div class="account-menu__stat">
          <span class="account-menu__stat-label">荣誉证书</span>
          <span class="account-menu__stat-value"><span data-menu-stat-badges>0</span> 枚</span>
        </div>
        <div class="account-menu__stat">
          <span class="account-menu__stat-label">志愿报名</span>
          <span class="account-menu__stat-value"><span data-menu-stat-volunteer>0</span> 次</span>
        </div>
        <div class="account-menu__stat">
          <span class="account-menu__stat-label">公益支持</span>
          <span class="account-menu__stat-value"><span data-menu-stat-donations>0</span> 次</span>
        </div>
      </div>
      <div class="account-menu__divider" role="separator"></div>
      <nav class="account-menu__nav" aria-label="个人账户">
        <a class="account-menu__item" href="${profileHref}" data-account-nav="profile" role="menuitem">
          <span class="account-menu__item-icon" aria-hidden="true">◎</span>
          <span>个人信息</span>
        </a>
        <a class="account-menu__item" href="${actionHref}#daily-action-dock" data-account-nav="checkin" role="menuitem">
          <span class="account-menu__item-icon" aria-hidden="true">◆</span>
          <span>我的环保打卡</span>
        </a>
        <a class="account-menu__item" href="${actionHref}#open-badges" data-account-nav="badges" role="menuitem">
          <span class="account-menu__item-icon" aria-hidden="true">▣</span>
          <span>我的荣誉证书</span>
        </a>
        <a class="account-menu__item" href="${actionHref}#open-volunteer-records" data-account-nav="volunteer" role="menuitem">
          <span class="account-menu__item-icon" aria-hidden="true">◇</span>
          <span>志愿报名记录</span>
        </a>
        <a class="account-menu__item" href="${actionHref}#open-donations" data-account-nav="donations" role="menuitem">
          <span class="account-menu__item-icon" aria-hidden="true">○</span>
          <span>公益支持记录</span>
        </a>
        <a class="account-menu__item" href="${speciesHref}#user-added" data-account-nav="species-user" role="menuitem">
          <span class="account-menu__item-icon" aria-hidden="true">▦</span>
          <span>我的新增物种档案</span>
        </a>
        <button type="button" class="account-menu__item account-menu__item--signout" data-account-nav="logout" role="menuitem">
          <span class="account-menu__item-icon" aria-hidden="true">↩</span>
          <span>退出登录</span>
        </button>
      </nav>
      <div class="account-menu__divider" role="separator"></div>
      <p class="account-menu__footnote">当前登录：localStorage 模拟账户</p>
    </div>
  </div>

  <p class="account-menu__toast account-menu__toast--global" data-account-menu-toast hidden aria-live="polite"></p>

  <div class="auth-modal-overlay" data-auth-modal hidden aria-hidden="true">
    <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" data-auth-modal-panel>
      <button type="button" class="auth-modal__close" data-auth-modal-close aria-label="关闭">&times;</button>

      <aside class="auth-modal__brand">
        <p class="auth-modal__brand-eyebrow">澜存 · 海洋守护者</p>
        <h2 class="auth-modal__brand-title" id="auth-modal-title">守护者账户</h2>
        <p class="auth-modal__brand-lead">记录你的每一次打卡、报名、支持与发现，让微小行动持续发生。</p>
        <ul class="auth-modal__benefits">
          <li>保存环保打卡</li>
          <li>解锁荣誉证书</li>
          <li>管理志愿报名</li>
          <li>记录公益支持</li>
          <li>关联个人档案</li>
        </ul>
      </aside>

      <div class="auth-modal__body">
        <div class="auth-modal__tabs" role="tablist" aria-label="登录或注册">
          <button class="auth-modal__tab is-active" type="button" role="tab" aria-selected="true" data-auth-tab="login">登录</button>
          <button class="auth-modal__tab" type="button" role="tab" aria-selected="false" data-auth-tab="register">注册</button>
        </div>

        <section class="auth-modal__panel" data-auth-panel="login">
          <form class="auth-modal__form" novalidate data-login-form>
            <div class="field">
              <label for="menu-login-username">用户名</label>
              <input id="menu-login-username" name="username" autocomplete="username" required />
              <p class="field-error" id="menu-login-username-error" aria-live="polite"></p>
            </div>
            <div class="field">
              <label for="menu-login-password">密码</label>
              <input id="menu-login-password" name="password" type="password" autocomplete="current-password" required minlength="6" />
              <p class="field-error" id="menu-login-password-error" aria-live="polite"></p>
            </div>
            <label class="auth-modal__checkbox">
              <input type="checkbox" name="rememberMe" />
              <span>记住我</span>
            </label>
            <button class="auth-modal__btn auth-modal__btn--primary" type="submit">登录</button>
            <div class="auth-modal__secondary">
              <button class="auth-modal__link" type="button" data-auth-switch="register">创建账户</button>
              <button class="auth-modal__link" type="button" data-auth-guest-dismiss>游客模式继续浏览</button>
            </div>
            <p class="auth-modal__status" data-login-result aria-live="polite"></p>
          </form>
        </section>

        <section class="auth-modal__panel" data-auth-panel="register" hidden>
          <ol class="auth-register__progress" aria-label="注册步骤">
            <li class="is-active" data-register-progress="1"><span>基础账户</span></li>
            <li data-register-progress="2"><span>守护者资料</span></li>
            <li data-register-progress="3"><span>完成确认</span></li>
          </ol>
          <form class="auth-modal__form" novalidate data-register-form>
            <div class="auth-register__step" data-register-step="1">
              <div class="field">
                <label for="menu-register-username">用户名</label>
                <input id="menu-register-username" name="username" autocomplete="username" required minlength="2" maxlength="16" />
                <p class="field-error" id="menu-register-username-error" aria-live="polite"></p>
              </div>
              <div class="field">
                <label for="menu-register-password">密码</label>
                <input id="menu-register-password" name="password" type="password" autocomplete="new-password" required minlength="6" />
                <p class="field-error" id="menu-register-password-error" aria-live="polite"></p>
              </div>
              <div class="field">
                <label for="menu-register-confirm-password">确认密码</label>
                <input id="menu-register-confirm-password" name="confirmPassword" type="password" autocomplete="new-password" required minlength="6" />
                <p class="field-error" id="menu-register-confirm-password-error" aria-live="polite"></p>
              </div>
              <button class="auth-modal__btn auth-modal__btn--primary" type="button" data-register-next>下一步</button>
            </div>

            <div class="auth-register__step" data-register-step="2" hidden>
              <div class="field">
                <label for="menu-register-display-name">显示昵称</label>
                <input id="menu-register-display-name" name="displayName" required maxlength="16" />
                <p class="field-error" id="menu-register-display-name-error" aria-live="polite"></p>
              </div>
              <div class="field">
                <label for="menu-register-role">身份偏好</label>
                <select id="menu-register-role" name="role">
                  <option>公益守护者</option>
                  <option>学生志愿者</option>
                  <option>海洋观察者</option>
                  <option>科普传播者</option>
                </select>
              </div>
              <div class="field">
                <label for="menu-register-email">邮箱（可选）</label>
                <input id="menu-register-email" name="email" type="email" autocomplete="email" />
                <p class="field-error" id="menu-register-email-error" aria-live="polite"></p>
              </div>
              <div class="auth-modal__step-actions">
                <button class="auth-modal__btn auth-modal__btn--ghost" type="button" data-register-back>上一步</button>
                <button class="auth-modal__btn auth-modal__btn--primary" type="button" data-register-next>下一步</button>
              </div>
            </div>

            <div class="auth-register__step" data-register-step="3" hidden>
              <dl class="auth-register__summary" data-register-summary>
                <div><dt>用户名</dt><dd data-summary-username>—</dd></div>
                <div><dt>显示昵称</dt><dd data-summary-display-name>—</dd></div>
                <div><dt>身份偏好</dt><dd data-summary-role>—</dd></div>
              </dl>
              <p class="auth-register__benefits-note">创建账户后，你将可以保存环保打卡、解锁荣誉证书、管理志愿报名与公益支持记录，并关联个人档案。</p>
              <div class="auth-modal__step-actions">
                <button class="auth-modal__btn auth-modal__btn--ghost" type="button" data-register-back>上一步</button>
                <button class="auth-modal__btn auth-modal__btn--primary" type="submit">创建守护者账户</button>
              </div>
            </div>
            <p class="auth-modal__status" data-register-result aria-live="polite"></p>
          </form>
        </section>
      </div>
    </div>
  </div>
</div>`;
};
