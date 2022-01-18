export enum LcuMessageType {
  WELCOME = 0,
  PREFIX = 1,
  CALL = 2,
  CALLRESULT = 3,
  CALLERROR = 4,
  SUBSCRIBE = 5,
  UNSUBSCRIBE = 6,
  PUBLISH = 7,
  EVENT = 8,
}

export enum LcuEvent {
  SelectedChampion = `SELECTED_CHAMPION`,
  MatchedStartedOrTerminated = `MATCH_STARTED_OR_TERMINATED`,
  OnAuthUpdate = `ON_AUTH_UPDATE`,
}

export enum GamePhase {
  GameStarting = 'GAME_STARTING',
  Finalization = 'FINALIZATION',
}
