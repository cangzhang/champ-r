import http from './http';
import { getLcuToken } from 'src/share/file';

export default class LCUService {
  constructor(lolDir) {
    this.lolDir = lolDir;
    this.active = false;
  }

  setVars = (token, port, url) => {
    this.active = !!token;
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
    const res = await http.get(this.urls.curSession, {
      ...this.auth,
      validateStatus: status => status < 500,
    });
    return res;
  };

  getCurPerk = async () => {
    const res = await http.get(this.urls.curPerk, this.auth);
    console.log(res);
  };

  getPerkList = async () => {
    const res = await http.get(this.urls.perks, this.auth);
    return res;
  };

  deletePerk = async id => {
    const res = await http.delete(`${this.urls.perks}/${id}`, this.auth);
    return res;
  };

  createPerk = async data => {
    const res = await http.post(this.urls.perks, data);
    return res;
  };

  applyPerk = async data => {
    const list = await this.getPerkList();
    const current = list.find(i => i.current && i.isDeletable);

    if (current) {
      await this.deletePerk(current.id);
      await this.createPerk(data);
      return true;
    }

    await this.createPerk(data);
    return true;
  };
}
