/**
 * 海洋生命档案馆 · 分类与轮播分组常量
 * 说明：HABITATS / OCEANS 对应数据字段 ocean[]（大洋与海域类型）；
 * habitat[] 为生态小生境文案（如海草床、河口）。
 */
window.LANCUN_SPECIES_CATEGORIES = (function createSpeciesCategories() {
  const GROUPS = [
    { id: 'cetacean', label: '鲸豚类' },
    { id: 'turtle', label: '海龟类' },
    { id: 'shark-ray', label: '鲨鳐类' },
    { id: 'coral', label: '珊瑚类' },
    { id: 'fish', label: '鱼类' },
    { id: 'seabird', label: '海鸟类' },
    { id: 'shell-crustacean', label: '贝类 / 甲壳类' },
    { id: 'marine-mammal', label: '海洋哺乳动物' },
    { id: 'deep-sea', label: '深海生物' },
  ];

  const IUCN_STATUSES = [
    { id: 'CR', label: 'CR 极危' },
    { id: 'EN', label: 'EN 濒危' },
    { id: 'VU', label: 'VU 易危' },
    { id: 'NT', label: 'NT 近危' },
    { id: 'LC', label: 'LC 无危' },
  ];

  const HABITATS = [
    { id: 'pacific', label: '太平洋' },
    { id: 'atlantic', label: '大西洋' },
    { id: 'indian', label: '印度洋' },
    { id: 'arctic', label: '北冰洋' },
    { id: 'southern', label: '南大洋' },
    { id: 'coral-reef', label: '珊瑚礁' },
    { id: 'coastal', label: '近岸海域' },
    { id: 'deep-sea', label: '深海' },
    { id: 'polar', label: '极地海域' },
  ];

  const THREATS = [
    { id: 'plastic', label: '塑料污染' },
    { id: 'bycatch', label: '误捕' },
    { id: 'habitat-loss', label: '栖息地破坏' },
    { id: 'climate', label: '气候变化' },
    { id: 'acidification', label: '海水酸化' },
    { id: 'overfishing', label: '过度捕捞' },
    { id: 'noise', label: '船舶噪声' },
  ];

  const RAIL_GROUPS = [
    {
      id: 'endangered-cetaceans',
      title: '濒危鲸豚',
      filterFn: (s) => s.group === 'cetacean' && ['CR', 'EN', 'VU'].includes(s.iucnStatus),
    },
    {
      id: 'turtles-reptiles',
      title: '海龟与爬行动物',
      filterFn: (s) => s.group === 'turtle',
    },
    {
      id: 'coral-reef-life',
      title: '珊瑚礁生命',
      filterFn: (s) => s.group === 'coral' || (s.ocean || []).includes('coral-reef'),
    },
    {
      id: 'sharks-large-fish',
      title: '鲨鳐与大型鱼类',
      filterFn: (s) =>
        s.group === 'shark-ray' || (s.group === 'fish' && ['CR', 'EN', 'VU'].includes(s.iucnStatus)),
    },
    {
      id: 'seabirds-coastal',
      title: '海鸟与近岸动物',
      filterFn: (s) =>
        s.group === 'seabird' || s.group === 'marine-mammal' || (s.ocean || []).includes('coastal'),
    },
    {
      id: 'deep-rare',
      title: '深海与稀有物种',
      filterFn: (s) => s.group === 'deep-sea' || (s.ocean || []).includes('deep-sea') || s.iucnStatus === 'CR',
    },
    {
      id: 'user-added',
      title: '用户新增档案',
      filterFn: (s) => s.isUserAdded === true,
    },
  ];

  return {
    GROUPS,
    IUCN_STATUSES,
    HABITATS,
    OCEANS: HABITATS,
    THREATS,
    RAIL_GROUPS,
  };
})();
