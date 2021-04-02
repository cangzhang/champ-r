import React from 'react';

export interface IRuneItem {
  alias: string;
  name: string;
  position: string;
  pickCount: number;
  winRate: string;
  primaryStyleId: number;
  subStyleId: number;
  selectedPerkIds: number[];
  score: number;
}

export interface ICSSProperties extends React.CSSProperties {
  [key: string]: number | string | undefined;
}

export interface IProcessChampionItem {
  source: string;
  champion: string;
  position: string;
  $identity: string;
}

export interface IState {
  fetchingSources: string[];
  fetchedSources: string[];
  fetching: IProcessChampionItem[];
  fetched: IProcessChampionItem[];
  version: string | null;
  itemMap: any;
  selectedSources: string[];
  keepOld: boolean;
  importerInstances: {};
  importPage: {
    success: any[];
    fail: any[];
  };
  dataSourceVersions: {
    [key: string]: string;
  };
}

export interface IBuildBlockItem {
  id: string;
  count: number;
}

export interface IBuildBlock {
  type: string;
  items: IBuildBlockItem[];
}

export interface IChampionBuild {
  fileName: string;
  title: string;
  championId: number | string;
  champion: string;
  position: string;
  blocks: IBuildBlock[];
}

export interface IChampionCdnDataItem {
  index: number;
  id: string;
  version: string;
  officialVersion: string;
  timestamp: number;
  alias: string;
  name: string;
  position: string;
  skills: string[];
  spells: string[];
  itemBuilds: IChampionBuild[];
  runes: IRuneItem[];
}

export interface IChampionInfo {
  key: string;
  alias: string;
  version: string;
  name: string;
}
