const Lolqq = 'lol.qq.com';

export const QQServicePrefix = `https://game.gtimg.cn`;

export interface ISourceItem {
  label: string;
  value: string;
  isAram?: boolean;
}

const DefaultExtraPkgs: ISourceItem[] = [
  {
    label: `op.gg`,
    value: `op.gg`,
  },
  {
    label: `murderbridge.com`,
    value: `murderbridge`,
    isAram: true,
  },
  {
    label: `op.gg-aram`,
    value: `op.gg-aram`,
    isAram: true,
  },
];

export const SourceQQ: ISourceItem = {
  label: Lolqq,
  value: Lolqq,
};

export const DefaultSourceList: ISourceItem[] = [SourceQQ, ...DefaultExtraPkgs];

export const DEFAULT_NPM_REGISTRY = 'https://mirrors.cloud.tencent.com/npm'
