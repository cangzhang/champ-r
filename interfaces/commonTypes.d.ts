import CSSProperties = React.CSSProperties;

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

export interface ICSSProperties extends CSSProperties {
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
  sortrank?: number;
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
  id: string;
}

export interface IFileResult {
  champion: string;
  position: string;
  stage?: string;
}

export interface IPkgInfo {
  version: string;
  sourceVersion: string;
}

export interface ILcuUserAction {
  summonerId: number;
  championId: number;
  actorCellId: number;
  type: string;
}

export interface ICoordinate {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IFetchStatus {
  $identity: string;
  champion: string;
  source: string;
}

export interface ILcuAuth {
  port: string;
  token: string;
  urlWithAuth: string;
}

export interface IChampionSelectTeamItem {
  cellId: number;
  championId: number;
  summonerId: number;
  team: number;
}

export interface IChampionSelectActionItem {
  actorCellId: number;
  championId: number;
  completed: boolean;
  id: number;
  isAllyAction: boolean;
  isInProgress: boolean;
  pickTurn: number;
  type: string;
}

export interface IChampionSelectRespData {
  myTeam: IChampionSelectTeamItem[];
  actions: IChampionSelectActionItem[][];
  timer: {
    phase: string;
  };
  localPlayerCellId: number;
}

export interface IPopupEventData {
  championId: number;
  noCache?: boolean;
}

export interface IPerkPage {
  current: boolean;
  isDeletable: boolean;
  id: number;
}
