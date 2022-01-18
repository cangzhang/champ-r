import WebSocket from 'ws';

import { LcuEvent, LcuMessageType } from '../constants/events';
import { LcuWatcher } from './lcu';
import { IChampionSelectRespData } from '@interfaces/commonTypes';

interface WsData {
  eventType: string;
  uri: string;
  data: any;
}

type LcuWsResponse = [number, string, WsData];

export class LcuWsClient {
  private watcher: LcuWatcher | null = null;
  private ws: WebSocket | null = null;

  constructor(watcher: LcuWatcher) {
    this.watcher = watcher;
    this.watcher.addListener(LcuEvent.OnAuthUpdate, (lcuUrl: string) => {
      this.createWsClient(lcuUrl);
    });
  }

  public createWsClient = (url: string) => {
    const ws = new WebSocket(`wss://${url}`);
    ws.on(`open`, () => {
      const msg = [LcuMessageType.SUBSCRIBE, `OnJsonApiEvent`];
      ws.send(JSON.stringify(msg));
    });

    ws.on(`message`, this.onLcuMessage);

    this.ws = ws;
  };

  public onLcuMessage = (msg: string) => {
    let rawData: LcuWsResponse = [0, '', {} as WsData];
    try {
      rawData = JSON.parse(msg);
    } catch {
      return;
    }

    // @ts-ignore
    const [t, evName, data] = rawData;
    switch (t) {
      case LcuMessageType.EVENT: {
        if (data.uri === `/lol-champ-select/v1/session`) {
          let championId = this.watcher?.getChampionIdFromLcuData(data.data) ?? 0;
          if (championId > 0) {
            this.watcher?.evBus?.emit(LcuEvent.SelectedChampion, {
              championId,
            });
          } else {
            this.watcher?.hidePopup();
          }
        }
        break;
      }
      default:
        break;
    }
  };
}
