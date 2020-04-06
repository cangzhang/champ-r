import http from './http';

export default class LCUService {
  constructor(lolDir, token, port, url) {
    this.lolDir = lolDir;
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
  }

    getLcuStatus = async () => {
      const { urls, auth } = this;

      try {
        const res = await http.get(urls.authToken, null, auth);
        if (res) {
          return true;
        }
      } finally {
        return false;
      }
    }

    getCurrentSession = async () => {
      const res = await http.get(this.urls.curSession)
      console.log(res);
    }

    getCurPerk = async () => {
      const res = await http.get(this.urls.curPerk)
      console.log(res);
    }
}
