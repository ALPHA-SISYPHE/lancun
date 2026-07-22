(() => {
  const R = window.LANCUN_RESCUE;

  const renderModalBody = (host) => {
    if (!host) return;
    const catalog = window.LANCUN_DATA?.rescueDataSourcesCatalog;
    const agencies = catalog?.agencies?.length
      ? catalog.agencies
      : window.LANCUN_DATA?.rescueDeckSources || [];
    const mediaNotes = catalog?.mediaNotes || [];
    const docHref = catalog?.docHref || '../docs/DATA_SOURCES.md';
    const listItems = [
      ...agencies,
      { name: 'docs/DATA_SOURCES.md', href: docHref, note: '本项目数据说明文件' },
    ];

    host.innerHTML = `
      <ul class="rescue-data-dialog__list">
        ${listItems
          .map(
            (item) => `
          <li>
            <strong><a href="${item.href}" target="_blank" rel="noopener noreferrer">${item.name}</a></strong>
            <p>${item.note || ''}</p>
          </li>`
          )
          .join('')}
      </ul>
      ${
        mediaNotes.length
          ? `<section class="rescue-data-dialog__media">
          <h4>图片来源说明</h4>
          <ul>${mediaNotes.map((note) => `<li>${note}</li>`).join('')}</ul>
        </section>`
          : ''
      }`;
  };

  const openDataSourcesModal = () => {
    const dialog = document.querySelector('[data-rescue-data-sources-dialog]');
    if (!dialog) return;
    renderModalBody(document.querySelector('[data-rescue-data-sources-body]'));
    R.setPageState?.({ isDataSourcesOpen: true });
    if (typeof dialog.showModal === 'function') dialog.showModal();
    dialog.querySelector('[data-rescue-data-sources-close]')?.focus();
  };

  const closeDataSourcesModal = () => {
    const dialog = document.querySelector('[data-rescue-data-sources-dialog]');
    if (!dialog) return;
    dialog.close();
    R.setPageState?.({ isDataSourcesOpen: false });
  };

  R.openDataSourcesModal = openDataSourcesModal;
  R.closeDataSourcesModal = closeDataSourcesModal;
  R.renderDataSourcesModal = renderModalBody;

  R.initDataSourcesModal = () => {
    const dialog = document.querySelector('[data-rescue-data-sources-dialog]');
    const body = document.querySelector('[data-rescue-data-sources-body]');
    if (!dialog || !body) return;

    renderModalBody(body);

    document.querySelectorAll('[data-rescue-data-sources-open]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openDataSourcesModal();
      });
    });

    dialog.querySelectorAll('[data-rescue-data-sources-close]').forEach((btn) => {
      btn.addEventListener('click', () => closeDataSourcesModal());
    });

    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      const inDialog =
        e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!inDialog) closeDataSourcesModal();
    });

    dialog.addEventListener('close', () => {
      R.setPageState?.({ isDataSourcesOpen: false });
    });
  };
})();
