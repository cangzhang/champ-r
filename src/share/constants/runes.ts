import { ShardSlot } from 'src/types';

export const Precision = {
  8000: [8005, 8008, 8021, 8010, 9101, 9111, 8009, 9104, 9105, 9103, 8014, 8017, 8299],
};

export const Domination = {
  8100: [8112, 8124, 8128, 9923, 8126, 8139, 8143, 8136, 8120, 8138, 8135, 8134, 8105, 8106],
};

export const Sorcery = {
  8200: [8214, 8229, 8230, 8224, 8226, 8275, 8210, 8234, 8233, 8237, 8232, 8236],
};

export const Whimsy = {
  8300: [8351, 8360, 8369, 8306, 8304, 8313, 8321, 8316, 8345, 8347, 8410, 8352],
};

export const Resolve = {
  8400: [8437, 8439, 8465, 8446, 8463, 8401, 8429, 8444, 8473, 8451, 8453, 8242],
};

interface IStyleIdList {
  [id: number]: number[];
}

export const MainStyleIds: IStyleIdList = {
  8000: [8005, 8008, 8010, 8021],
  8100: [8112, 8124, 8128, 9923],
  8200: [8214, 8229, 8230],
  8300: [8351, 8369, 8360],
  8400: [8437, 8439, 8465],
};

export const FragmentMap = [
  [5008, 5005, 5007],
  [5008, 5002, 5003],
  [5001, 5002, 5003],
];

const RuneMap = {
  ...Precision,
  ...Domination,
  ...Sorcery,
  ...Whimsy,
  ...Resolve,
};

export const flatRunes = Object.entries(RuneMap);

export const StatShards: ShardSlot[] = [
  {
    key: 'Offense',
    shards: [
      {
        id: 5008,
        tooltip_desc: '+9 Adaptive Force (5.4 AD or 9 AP)',
        img: 'StatModsAdaptiveForceIcon.png',
        name: 'Adaptive Force',
      },
      {
        id: 5005,
        tooltip_desc: '+10% Attack Speed',
        img: 'StatModsAttackSpeedIcon.png',
        name: 'Attack Speed',
      },
      {
        id: 5007,
        tooltip_desc: '+8 Ability Haste',
        img: 'StatModsCDRScalingIcon.png',
        name: 'Scaling CDR',
      },
    ],
  },
  {
    key: 'Flex',
    shards: [
      {
        id: 5008,
        tooltip_desc: '+9 Adaptive Force (5.4 AD or 9 AP)',
        img: 'StatModsAdaptiveForceIcon.png',
        name: 'Adaptive Force',
      },
      {
        id: 5002,
        tooltip_desc: '+6 Armor',
        img: 'StatModsArmorIcon.png',
        name: 'Armor',
      },
      {
        id: 5003,
        tooltip_desc: '+8 Magic Resist',
        img: 'StatModsMagicResIcon.png',
        name: 'Magic Resist',
      },
    ],
  },
  {
    key: 'Defense',
    shards: [
      {
        id: 5001,
        tooltip_desc: '+15-90 Health (based on level)',
        img: 'StatModsHealthScalingIcon.png',
        name: 'Scaling Bonus Health',
      },
      {
        id: 5002,
        tooltip_desc: '+6 Armor',
        img: 'StatModsArmorIcon.png',
        name: 'Armor',
      },
      {
        id: 5003,
        tooltip_desc: '+8 Magic Resist',
        img: 'StatModsMagicResIcon.png',
        name: 'Magic Resist',
      },
    ],
  },
];

export const ShardIds = StatShards.reduce((cur, i: ShardSlot) => {
  const ids = i.shards.map((j) => j.id);
  return [...cur, ...ids];
}, [] as number[]);
