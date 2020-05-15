// https://github.com/vacu/electron-google-analytics/blob/master/src/index.js
const { app } = require('electron');
const fetch = require('electron-main-fetch');
const { nanoid } = require('nanoid');

const pkg = require('./package.json');

class Analytics {
  /**
   * Constructor
   *
   * @param {string} trackingID
   * @param {Object} param1
   */
  constructor(trackingID, { userAgent = '', debug = false, version = 1 } = {}) {
    // Debug
    this.globalDebug = debug;
    // User-agent
    this.globalUserAgent = userAgent;
    // Links
    this.globalBaseURL = 'https://www.google-analytics.com';
    this.globalDebugURL = '/debug';
    this.globalCollectURL = '/collect';
    this.globalBatchURL = '/batch';
    // Google generated ID
    this.globalTrackingID = trackingID;
    // Google API version
    this.globalVersion = version;
    // Custom parameters
    this.customParams = {};
  }

  /**
   * Adds custom parameters to requests
   * if value is null, then parameter will be removed
   *
   * @param  {string} key     Parameter name
   * @param  {string} value   Parameter value
   */
  set(key, value) {
    if (value !== null) {
      this.customParams[key] = value;
    } else {
      delete this.customParams[key];
    }
  }

  /**
   * Send a "pageview" request
   *
   * @param  {string} url      Url of the page
   * @param  {string} title    Title of the page
   * @param  {string} hostname Document hostname
   * @param  {string} clientID nanoid
   * @param  {string} sessDuration A string to force start or end a session
   *
   * @return {Promise}
   */
  pageview(hostname, url, title, clientID, sessDuration) {
    const params = {
      dh: hostname,
      dp: url,
      dt: title,
    };

    if (typeof sessDuration !== 'undefined') {
      params.sc = sessDuration;
    }

    return this.send('pageview', params, clientID);
  }

  /**
   * Send a "event" request
   *
   * @param  {string} evCategory Event category
   * @param  {string} evAction   Event action
   * @param  {string} clientID   nanoid
   * @param  {string} evLabel    Event label
   * @param  {string} evValue    Event description
   *
   * @return {Promise}
   */
  event(evCategory, evAction, { evLabel, evValue, clientID } = {}) {
    const params = { ec: evCategory, ea: evAction };

    if (evLabel) params.el = evLabel;
    if (evValue) params.ev = evValue;

    return this.send('event', params, clientID);
  }

  /**
   * Send a "screenview" request
   *
   * @param  {string} appName        App name
   * @param  {string} appVer         App version
   * @param  {string} appID          App Id
   * @param  {string} appInstallerID App Installer Id
   * @param  {string} screenName     Screen name / Content description
   * @param  {string} clientID       nanoid
   *
   * @return {Promise}
   */
  screen(appName, appVer, appID, appInstallerID, screenName, clientID) {
    const params = {
      an: appName,
      av: appVer,
      aid: appID,
      aiid: appInstallerID,
      cd: screenName,
    };

    return this.send('screenview', params, clientID);
  }

  /**
   * Send a "transaction" request
   *
   * @param  {string} trnID    Transaction ID
   * @param  {string} trnAffil Transaction affiliation
   * @param  {string} trnRev   Transaction Revenue
   * @param  {Number} trnShip  Transaction shipping
   * @param  {Number} trnTax   Transaction tax
   * @param  {string} currCode Currency code
   * @param  {string} clientID nanoid
   *
   * @return {Promise}
   */
  transaction(trnID, { trnAffil, trnRev, trnShip, trnTax, currCode } = {}, clientID) {
    const params = { ti: trnID };

    if (trnAffil) params.ta = trnAffil;
    if (trnRev) params.tr = trnRev;
    if (trnShip) params.ts = trnShip;
    if (trnTax) params.tt = trnTax;
    if (currCode) params.cu = currCode;

    return this.send('transaction', params, clientID);
  }

  /**
   * Send a "social" request
   *
   * @param  {string} socialAction  Social Action
   * @param  {string} socialNetwork Social Network
   * @param  {string} socialTarget  Social Target
   * @param  {string} clientID      nanoid
   *
   * @return {Promise}
   */
  social(socialAction, socialNetwork, socialTarget, clientID) {
    const params = { sa: socialAction, sn: socialNetwork, st: socialTarget };

    return this.send('social', params, clientID);
  }

  /**
   * Send a "exception" request
   *
   * @param  {string} exDesc   Exception description
   * @param  {Number} exFatal  Exception is fatal?
   * @param  {string} clientID nanoid
   *
   * @return {Promise}
   */
  exception(exDesc, exFatal, clientID) {
    const params = { exd: exDesc, exf: exFatal };

    return this.send('exception', params, clientID);
  }

  /**
   * Send a "refund" request
   *
   * @param {string} trnID          Transaction ID
   * @param {string} evCategory     Event category
   * @param {string} evAction       Event action
   * @param {Number} nonInteraction Non-interaction parameter
   * @param {string} prdID          Product ID
   * @param {Number} prdQty         Product quantity
   * @param {string} clientID       nanoid
   *
   * @returns {Promise}
   */
  refund(
    trnID,
    evCategory = 'Ecommerce',
    evAction = 'Refund',
    nonInteraction = 1,
    { prdID, prdQty } = {},
    clientID,
  ) {
    const params = {
      ec: evCategory,
      ea: evAction,
      ni: nonInteraction,
      ti: trnID,
      pa: 'refund',
    };

    if (prdID) params.pr1id = prdID;
    if (prdQty) params.pr1qt = prdQty;

    return this.send('event', params, clientID);
  }

  /**
   * Send a "purchase" request
   * @param  {string} hostname      Document hostname
   * @param  {string} url           Url of the page
   * @param  {string} title         Title of the page
   * @param  {string} transactionID Transaction ID
   * @param  {string} trnAffil      Transaction affiliation
   * @param  {string} trnRev        Transaction Revenue
   * @param  {Number} trnTax        Transaction tax
   * @param  {Number} trnShip       Transaction shipping
   * @param  {string} trnCoupon     Transaction coupon
   * @param  {string} prdID         Product ID
   * @param  {string} prdName       Product name
   * @param  {string} prdCtg        Product category
   * @param  {string} prdBrand      Product brand
   * @param  {string} prdVar        Product variant
   * @param  {string} prdPos        Product position
   * @param  {string} clientID      nanoid
   * @return {Promise}
   */
  purchase(
    hostname,
    url,
    title,
    transactionID,
    {
      trnAffil,
      trnRev,
      trnTax,
      trnShip,
      trnCoupon,
      prdID,
      prdName,
      prdCtg,
      prdBrand,
      prdVar,
      prdPos,
    } = {},
    clientID,
  ) {
    const params = {
      dh: hostname,
      dp: url,
      dt: title,
      ti: transactionID,
      pa: 'purchase',
    };

    // Transaction params
    if (trnAffil) params.ta = trnAffil;
    if (trnRev) params.tr = trnRev;
    if (trnTax) params.tt = trnTax;
    if (trnShip) params.ts = trnShip;
    if (trnCoupon) params.tcc = trnCoupon;
    // Product params
    if (prdID) params.pr1id = prdID;
    if (prdName) params.pr1nm = prdName;
    if (prdCtg) params.pr1ca = prdCtg;
    if (prdBrand) params.pr1br = prdBrand;
    if (prdVar) params.pr1va = prdVar;
    if (prdPos) params.pr1p = prdPos;

    return this.send('pageview', params, clientID);
  }

  /**
   * Send a "checkout" request
   * @param  {string} hostname     Document hostname
   * @param  {string} url          Url of the page
   * @param  {string} title        Title of the page
   * @param  {string} checkoutStep Checkout step
   * @param  {string} checkoutOpt  Checkout step option
   * @param  {string} prdID        Product ID
   * @param  {string} prdName      Product name
   * @param  {string} prdCtg       Product category
   * @param  {string} prdBrand     Product brand
   * @param  {string} prdVar       Product variant
   * @param  {Number} prdPrice     Product price
   * @param  {Number} prdQty       Product category
   * @param  {string} clientID     nanoid
   * @return {Promise}
   */
  checkout(
    hostname,
    url,
    title,
    checkoutStep,
    checkoutOpt,
    { prdID, prdName, prdCtg, prdBrand, prdVar, prdPrice, prdQty } = {},
    clientID,
  ) {
    const params = {
      dh: hostname,
      dp: url,
      dt: title,
      pa: 'checkout',
      cos: checkoutStep,
      col: checkoutOpt,
    };

    if (prdID) params.pr1id = prdID;
    if (prdName) params.pr1nm = prdName;
    if (prdCtg) params.pr1ca = prdCtg;
    if (prdBrand) params.pr1br = prdBrand;
    if (prdVar) params.pr1va = prdVar;
    if (prdPrice) params.pr1pr = prdPrice;
    if (prdQty) params.pr1qt = prdQty;

    return this.send('pageview', params, clientID);
  }

  /**
   * Send a "checkout_option" request
   * @param  {string} evCategory   Event category
   * @param  {string} evAction     Event action
   * @param  {string} checkoutStep Checkout step
   * @param  {string} checkoutOpt  Checkout step option
   * @param  {string} clientID     nanoid
   * @return {Promise}
   */
  checkoutOpt(evCategory, evAction, checkoutStep, checkoutOpt, clientID) {
    const params = {
      ec: evCategory,
      ea: evAction,
      pa: 'checkout_option',
    };

    if (checkoutStep) params.cos = checkoutStep;
    if (checkoutOpt) params.col = checkoutOpt;

    return this.send('event', params, clientID);
  }

  /**
   *
   * @param {*} hostname
   * @param {*} url
   * @param {*} title
   * @param {*} param3
   * @param {*} clientID
   */
  promoImp(hostname, url, title, { promoID, promoName, promoCrt, promoPos } = {}, clientID) {
    const params = {
      dh: hostname,
      dp: url,
      dt: title,
    };

    if (promoID) params.promo1id = promoID;
    if (promoName) params.promo1nm = promoName;
    if (promoCrt) params.promo1cr = promoCrt;
    if (promoPos) params.promo1ps = promoPos;

    return this.send('pageview', params, clientID);
  }

  /**
   *
   * @param {*} evCategory
   * @param {*} evAction
   * @param {*} param2
   * @param {*} clientID
   */
  promoCk(
    evCategory,
    evAction,
    { evLabel, promoID, promoName, promoCrt, promoPos } = {},
    clientID,
  ) {
    const params = {
      ec: evCategory,
      ea: evAction,
      promos: 'click',
    };

    if (evLabel) params.el = evLabel;
    if (promoID) params.promo1id = promoID;
    if (promoName) params.promo1nm = promoName;
    if (promoCrt) params.promo1cr = promoCrt;
    if (promoPos) params.promo1ps = promoPos;

    return this.send('event', params, clientID);
  }

  /**
   * Send a "item" request
   * @param  {string} trnID         Transaction ID
   * @param  {string} itemName      Item name
   * @param  {Number} itemPrice     Item price
   * @param  {string} itemQty       Item quantity
   * @param  {string} itemSku       Item SKU
   * @param  {string} itemVariation Item variation / category
   * @param  {string} currCode      Currency code
   * @param  {string} clientID      nanoid
   * @return {Promise}
   */
  item(trnID, itemName, { itemPrice, itemQty, itemSku, itemVariation, currCode } = {}, clientID) {
    const params = { ti: trnID, in: itemName };

    if (itemPrice) params.ip = itemPrice;
    if (itemQty) params.iq = itemQty;
    if (itemSku) params.ic = itemSku;
    if (itemVariation) params.iv = itemVariation;
    if (currCode) params.cu = currCode;

    return this.send('item', params, clientID);
  }

  /**
   * Send a "timing tracking" request
   * @param  {string} timingCtg     Timing category
   * @param  {string} timingVar     Timing variable
   * @param  {Number} timingTime    Timing time
   * @param  {string} timingLbl     Timing label
   * @param  {Number} dns           DNS load time
   * @param  {Number} pageDownTime  Page download time
   * @param  {Number} redirTime     Redirect time
   * @param  {Number} tcpConnTime   TCP connect time
   * @param  {Number} serverResTime Server response time
   * @param  {string} clientID      nanoid
   * @return {Promise}
   */
  timingTrk(
    timingCtg,
    timingVar,
    timingTime,
    { timingLbl, dns, pageDownTime, redirTime, tcpConnTime, serverResTime } = {},
    clientID,
  ) {
    const params = { utc: timingCtg, utv: timingVar, utt: timingTime };

    if (timingLbl) params.utl = timingLbl;
    if (dns) params.dns = dns;
    if (pageDownTime) params.pdt = pageDownTime;
    if (redirTime) params.rrt = redirTime;
    if (tcpConnTime) params.tcp = tcpConnTime;
    if (serverResTime) params.srt = serverResTime;

    return this.send('timing', params, clientID);
  }

  /**
   * Send a request to google-analytics
   *
   * @param  {string} hitType  Hit type
   * @param  {string} clientID Unique identifier (nanoid)
   * @param  {Object} params   Options
   *
   * @return {Promise}
   */
  send(hitType, params, clientID) {
    const formObj = {
      v: this.globalVersion,
      tid: this.globalTrackingID,
      cid: clientID || nanoid(),
      t: hitType,
    };
    if (params) Object.assign(formObj, params);

    if (Object.keys(this.customParams).length > 0) {
      Object.assign(formObj, this.customParams);
    }

    let url = `${this.globalBaseURL}${this.globalCollectURL}`;
    if (this.globalDebug) {
      url = `${this.globalBaseURL}${this.globalDebugURL}${this.globalCollectURL}`;
    }

    const reqObj = {
      method: 'post',
      body: Object.keys(formObj)
        .map((key) => `${encodeURI(key)}=${encodeURI(formObj[key])}`)
        .join('&'),
    };

    if (this.globalUserAgent !== '') {
      reqObj.headers = { 'User-Agent': this.globalUserAgent };
    }

    return fetch(url, reqObj)
      .then((res) => res.json())
      .then((json) => {
        if (this.globalDebug) {
          if (json.hitParsingResult[0].valid) {
            return { clientID: formObj.cid };
          }
        }

        return { clientID: formObj.cid };
      })
      .catch((err) => {
        return new Error(err);
      });
  }
}

class GA {
  constructor(trackId, userId) {
    const analytics = new Analytics(trackId);
    analytics.set(`uid`, userId);

    this.userId = userId;
    this.trackId = trackId;
    this.analytics = analytics;
  }

  async screen(screenName = `main`) {
    return this.analytics
      .screen(
        pkg.productName,
        app.getVersion(),
        pkg.build.appId,
        pkg.build.appId,
        screenName,
        this.userId,
      )
      .then((res) => console.log(res))
      .catch((err) => console.error(err));
  }
}

module.exports = GA;
