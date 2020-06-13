const Sources = {
  Opgg: 'op.gg',
  Lolqq: 'lol.qq.com',
  MurderBridge: `murderbridge.com`,
};

export const AramModes = [Sources.MurderBridge];

export const isAram = (source) => AramModes.includes(source);

export default Sources;
