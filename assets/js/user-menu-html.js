/** Builds user menu markup; profileHref is pages/profile.html or profile.html */

window.buildUserMenuHtml = (profileHref) => {

  const actionHref = profileHref.replace(/profile\.html$/, 'action.html');

  return `

<div class="user-menu" data-user-menu>

  <button type="button" class="user-menu-trigger user-menu-trigger--avatar" data-user-menu-trigger aria-haspopup="true" aria-expanded="false" aria-controls="user-menu-dropdown">

    <span class="header-avatar user-menu-avatar" data-user-menu-avatar aria-hidden="true">澜</span>

    <span class="sr-only" data-user-menu-sr>登录或注册</span>

  </button>



  <div class="auth-modal-overlay" data-auth-modal hidden aria-hidden="true">

    <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" data-auth-modal-panel>

      <div class="user-menu-guest" data-user-menu-guest>

        <p class="user-menu-title" id="auth-modal-title">守护者账户</p>

        <div class="auth-tabs auth-tabs--compact" role="tablist" aria-label="登录或注册">

          <button class="auth-tab is-active" type="button" role="tab" aria-selected="true" data-auth-tab="login">登录</button>

          <button class="auth-tab" type="button" role="tab" aria-selected="false" data-auth-tab="register">注册</button>

        </div>

        <section data-auth-panel="login">

          <form class="auth-form auth-form--compact" novalidate data-login-form>

            <div class="field"><label for="menu-login-username">用户名</label><input id="menu-login-username" name="username" autocomplete="username" required /><p class="field-error" id="menu-login-username-error" aria-live="polite"></p></div>

            <div class="field"><label for="menu-login-password">密码</label><input id="menu-login-password" name="password" type="password" autocomplete="current-password" required minlength="6" /><p class="field-error" id="menu-login-password-error" aria-live="polite"></p></div>

            <button class="button button-primary button-block" type="submit">登录</button>

            <p class="status-message" data-login-result aria-live="polite"></p>

          </form>

        </section>

        <section data-auth-panel="register" hidden>

          <form class="auth-form auth-form--compact" novalidate data-register-form>

            <div class="field"><label for="menu-register-username">用户名</label><input id="menu-register-username" name="username" autocomplete="username" required minlength="2" maxlength="16" /><p class="field-error" id="menu-register-username-error" aria-live="polite"></p></div>

            <div class="field"><label for="menu-register-display-name">显示昵称</label><input id="menu-register-display-name" name="displayName" required maxlength="16" /><p class="field-error" id="menu-register-display-name-error" aria-live="polite"></p></div>

            <div class="field"><label for="menu-register-password">密码</label><input id="menu-register-password" name="password" type="password" autocomplete="new-password" required minlength="6" /><p class="field-error" id="menu-register-password-error" aria-live="polite"></p></div>

            <div class="field"><label for="menu-register-confirm-password">确认密码</label><input id="menu-register-confirm-password" name="confirmPassword" type="password" autocomplete="new-password" required minlength="6" /><p class="field-error" id="menu-register-confirm-password-error" aria-live="polite"></p></div>

            <div class="field"><label for="menu-register-role">身份偏好</label><select id="menu-register-role" name="role"><option>公众守护者</option><option>海洋爱好者</option><option>小小观察员</option></select></div>

            <div class="field"><label for="menu-register-email">邮箱（可选）</label><input id="menu-register-email" name="email" type="email" autocomplete="email" /><p class="field-error" id="menu-register-email-error" aria-live="polite"></p></div>

            <button class="button button-primary button-block" type="submit">注册并登录</button>

            <p class="form-note">密码仅保存在当前浏览器，用于课程演示。</p>

            <p class="status-message" data-register-result aria-live="polite"></p>

          </form>

        </section>

      </div>

    </div>

  </div>



  <div class="user-menu-dropdown" id="user-menu-dropdown" data-user-menu-dropdown hidden>

    <div class="user-menu-dropdown-header">

      <span class="header-avatar user-menu-dropdown-avatar" data-menu-avatar aria-hidden="true"></span>

      <div class="user-menu-dropdown-meta">

        <strong data-menu-profile-name>守护者</strong>

        <p data-menu-profile-role>公众守护者</p>

      </div>

    </div>

    <div class="user-menu-dropdown-divider" role="separator"></div>

    <nav class="user-menu-dropdown-nav" aria-label="账户快捷链接">

      <a class="user-menu-dropdown-link" data-profile-enter href="${profileHref}">进入我的</a>

      <a class="user-menu-dropdown-link" href="${actionHref}">行动中心</a>

    </nav>

    <div class="user-menu-dropdown-divider" role="separator"></div>

    <button type="button" class="user-menu-dropdown-signout" data-logout>退出登录</button>

  </div>

</div>`;

};

