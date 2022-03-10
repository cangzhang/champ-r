export const SOURCE_QQ_STR = 'lol.qq.com';

export const QQServicePrefix = `https://game.gtimg.cn`;

export const QQChampionAvatarPrefix = `${QQServicePrefix}/images/lol/act/img/champion`;

export interface ISourceItem {
  label: string;
  value: string;
  isAram?: boolean;
  isURF?: boolean;
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
  label: SOURCE_QQ_STR,
  value: SOURCE_QQ_STR,
};

export const DefaultSourceList: ISourceItem[] = [SourceQQ, ...DefaultExtraPkgs];
