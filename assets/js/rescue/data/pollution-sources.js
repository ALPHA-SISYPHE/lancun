/** Classic-script pages read panels from window.LANCUN_DATA; this helper is for optional tooling. */
export const getPollutionPanels = () => window.LANCUN_DATA?.rescuePollutionPanels ?? [];
export const getActionPlans = () => window.LANCUN_DATA?.rescueActionPlans ?? [];
