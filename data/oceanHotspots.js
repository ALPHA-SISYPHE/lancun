/**
 * 首页 · 五大洋地球热点与简介卡片数据
 * 供 globe/markers 与 ocean-preview-card 消费
 */
(function oceanHotspotsModule() {
  window.OCEAN_HOTSPOTS = [
    {
      id: 'pacific',
      index: 0,
      name: '太平洋',
      englishName: 'PACIFIC OCEAN',
      lat: 0,
      lng: -155,
      area: '46%',
      averageDepth: '4280 m',
      ecosystem: '珊瑚礁、深海海沟、远洋洄游',
      threats: '海温异常、塑料污染、过度捕捞',
      description:
        '太平洋是地球上面积最大的海洋，覆盖约三分之一的地表。环太平洋火山带与 El Niño 等现象在这里交织，深刻影响全球气候与生态系统。',
      targetTab: 'pacific',
    },
    {
      id: 'atlantic',
      index: 1,
      name: '大西洋',
      englishName: 'ATLANTIC OCEAN',
      lat: 0,
      lng: -30,
      area: '23%',
      averageDepth: '3646 m',
      ecosystem: '墨西哥湾流、鲸类迁徙、深海热液',
      threats: '航运扰动、过度捕捞、海洋暖化',
      description:
        '大西洋像一条巨大的 S 形水道，连接欧洲、非洲与美洲。墨西哥湾流将温暖与养分送往高纬度海域，也支撑着繁忙的航运与丰富的鲸类迁徙路线。',
      targetTab: 'atlantic',
    },
    {
      id: 'indian',
      index: 2,
      name: '印度洋',
      englishName: 'INDIAN OCEAN',
      lat: -20,
      lng: 80,
      area: '20%',
      averageDepth: '3963 m',
      ecosystem: '季风珊瑚礁、红树林、海草床',
      threats: '塑料污染、过度捕捞、沿岸开发',
      description:
        '印度洋受季风主导，珊瑚礁与海草床为沿岸社区提供食物与防波屏障。这里是海龟、金枪鱼与众多特有物种的关键栖息地。',
      targetTab: 'indian',
    },
    {
      id: 'southern',
      index: 3,
      name: '南大洋',
      englishName: 'SOUTHERN OCEAN',
      lat: -60,
      lng: 20,
      area: '20%（环南极）',
      averageDepth: '4000 m',
      ecosystem: '环南极上升流、磷虾带、企鹅食物网',
      threats: '海洋酸化、渔业压力、气候变暖',
      description:
        '南大洋环绕南极，强劲西风与上升流将深层营养带到表面，形成高生产力的磷虾与企鹅食物网。它是全球碳循环的重要环节。',
      targetTab: 'southern',
    },
    {
      id: 'arctic',
      index: 4,
      name: '北冰洋',
      englishName: 'ARCTIC OCEAN',
      lat: 75,
      lng: 0,
      area: '4%',
      averageDepth: '1205 m',
      ecosystem: '海冰边缘带、极地食物网、露脊鲸',
      threats: '海冰退缩、快速变暖、污染物累积',
      description:
        '北冰洋是面积最小、最浅的洋，海冰为北极熊、海豹与因纽特文化提供依托。快速变暖使冰盖退缩，也改变全球海平面与洋流格局。',
      targetTab: 'arctic',
    },
  ];
})();
