import http from './http';
import { getLcuToken } from 'src/share/file';
import { ILcuUserAction } from 'src/typings/commonTypes'

export default class LCUService {
  public active = false;
  public url: string | null = null;
  public token: string | null = null;
  public port: number | string | null = null;
  public urls: {
    authToken: string;
    curSession: string;
    curPerk: string;
    perks: string;
  } = {
    authToken: ``,
    curSession: ``,
    curPerk: ``,
    perks: ``,
  };
  public auth = {};

  constructor(public lolDir: string) {
  }

  setVars = (token: string | null, port: number | string | null, url: string | null) => {
    this.active = !!token;
    // if (!token) {
    //   console.info(`League client not active!`)
    // }

    this.url = url;
    this.token = token;
    this.port = port;
    this.urls = {
      authToken: `${url}/riotclient/auth-token`,
      curSession: `${url}/lol-champ-select/v1/session`,
      curPerk: `${url}/lol-perks/v1/currentpage`,
      perks: `${url}/lol-perks/v1/pages`,
    };
    this.auth = {
      auth: {
        username: `riot`,
        password: token,
      },
    };
  };

  getAuthToken = async () => {
    const [token, port, url] = await getLcuToken(this.lolDir);
    this.setVars(token, port, url);
    return [token, port, url];
  };

  getLcuStatus = async () => {
    const { urls, auth } = this;

    try {
      const res = await http.get(urls.authToken, auth);
      if (res) {
        return true;
      }
    } finally {
      return false;
    }
  };

  getCurrentSession = async () => {
    const res: {
      actions: ILcuUserAction[][];
      myTeam: { championId: number; summonerId: number; cellId: number; }[];
      localPlayerCellId: number;
    } = await http.get(this.urls.curSession, {
      ...this.auth,
      validateStatus: (status) => status < 500,
    });
    return res;
  };

  getCurPerk = async () => {
    const res = await http.get(this.urls.curPerk, this.auth);
    console.log(res);
  };

  getPerkList = async () => {
    const res: { current: boolean; isDeletable: boolean; id: number; }[] = await http.get(this.urls.perks, this.auth);
    return res;
  };

  deletePerk = async (id: string | number) => {
    const res = await http.delete(`${this.urls.perks}/${id}`, this.auth);
    return res;
  };

  createPerk = async (data: any) => {
    const res = await http.post(this.urls.perks, data);
    return res;
  };

  applyPerk = async (data: any) => {
    const list = await this.getPerkList();
    const current = list.find((i) => i.current && i.isDeletable);

    if (current) {
      await this.deletePerk(current.id);
      await this.createPerk(data);
      return true;
    }

    await this.createPerk(data);
    return true;
  };
}
