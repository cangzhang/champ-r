/* eslint react-hooks/exhaustive-deps: 0 */
import s from 'src/app.module.scss';

import { ipcRenderer, remote } from 'electron';

import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import cn from 'classnames';

import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Checkbox, STYLE_TYPE, LABEL_PLACEMENT } from 'baseui/checkbox';
import { StatefulTooltip as Tooltip } from 'baseui/tooltip';
import { Tag } from 'baseui/tag';
import { ArrowRight } from 'baseui/icon';
import { CornerDownRight } from 'react-feather';

import config from 'src/native/config';
import {
  setLolVersion,
  updateItemMap,
  updateConfig,
} from 'src/share/actions';
import { getItemList, getLolVer } from 'src/service/ddragon';
import { getUpgradeableCompletedItems } from 'src/service/utils';

import Sources from 'src/share/constants/sources';
import AppContext from 'src/share/context';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const [css, theme] = useStyletron();
  const { store, dispatch } = useContext(AppContext);
  const history = useHistory();
  const { t } = useTranslation();

  const [selectedSources, toggleSource] = useState(config.get(`selectedSources`));

  const [version, setVersion] = useState(config.get('lolVer'));
  const [lolDir, setLolDir] = useState(config.get('lolDir'));

  const toggleKeepOldItems = ev => {
    const { checked } = ev.target;
    dispatch(updateConfig('keepOld', checked));
  };

  const onSelectDir = async () => {
    const { canceled, filePaths } = await remote.dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    if (canceled) {
      return;
    }

    const dir = filePaths[0];
    setLolDir(dir);
  };

  const clearFolder = () => {
    setLolDir('');
  };

  const onCheck = value => ev => {
    const { checked } = ev.target;
    let res;
    if (checked) {
      res = selectedSources.concat(value);
    } else {
      const idx = selectedSources.indexOf(value);
      res = [
        ...selectedSources.slice(0, idx),
        ...selectedSources.slice(idx + 1),
      ];
    }

    toggleSource(res);
    dispatch(updateConfig(`selectedSources`, res));
  };

  const startImport = () => {
    history.push(`/import`);
  };

  useEffect(() => {
    const getVerAndItems = async () => {
      const v = await getLolVer();
      await setVersion(v);
      dispatch(setLolVersion(v));

      const appLang = config.get('appLang');
      const language = appLang.replace('-', '_');
      const data = await getItemList(v, language);
      const upgradeableCompletedItems = getUpgradeableCompletedItems(data);

      dispatch(updateItemMap({
        ...data,
        upgradeableCompletedItems,
      }));
    };

    getVerAndItems();
  }, []);

  // useEffect(() => {
  //   ipcRenderer.on(`lol-data-loaded`, (ev, data) => {
  //     console.log(`lol-data-loaded`, data);
  //
  //     dispatch(setLolVersion(data.lolVer));
  //     setVersion(data.lolVer);
  //
  //     const upgradeableCompletedItems = getUpgradeableCompletedItems(data.itemMap);
  //     console.log(upgradeableCompletedItems);
  //     dispatch(updateItemMap({
  //       ...data.itemMap,
  //       upgradeableCompletedItems,
  //     }));
  //   });
  // }, []);

  useEffect(() => {
    // persist user preference
    config.set('keepOldItems', store.keepOld);
    config.set('lolDir', lolDir);
    config.set('lolVer', version);
    config.set(`selectedSources`, selectedSources);
  }, [store.keepOld, lolDir, version, selectedSources]);

  const shouldDisableImport = !version || !lolDir || !selectedSources.length || !store.itemMap;

  return <div className={s.container}>
    <h1 className={s.title}>
      <span>Champ Remix</span>
    </h1>

    <div className={s.info}>
      {t(`lol folder is`)}
      <Tag
        closeable={Boolean(lolDir)}
        kind="accent"
        onClick={onSelectDir}
        onActionClick={clearFolder}
        overrides={{
          Root: {
            style: () => ({
              minWidth: 0,
              maxWidth: `calc(100vw - 14em)`,
              paddingTop: `4px`,
            }),
          },
          Text: {
            style: ({ $theme }) => ({
              fontSize: $theme.sizing.scale550,
              flexGrow: 1,
              maxWidth: `unset`,
              alignSelf: `flex-start`,
            }),
          },
        }}
      >
        <Tooltip content={lolDir && t(`click here to re-select`)}>
          {lolDir || t('click here to select')}
        </Tooltip>
      </Tag>
    </div>
    <code
      className={cn(s.folderTip, css({
        backgroundColor: theme.colors.backgroundLightWarning,
        borderRadius: theme.borders.radius300,
      }))}
    >
      <CornerDownRight size={`1.6em`} color={`#43BF75`} />
      <div dangerouslySetInnerHTML={{ __html: t('installation path of League of Legends') }} />
    </code>

    <div className={s.info}>
      {t(`lol version is`)}
      <Tag
        kind="accent"
        closeable={false}
        overrides={{
          Text: {
            style: ({ $theme }) => ({
              fontSize: $theme.sizing.scale550,
            }),
          },
        }}
      >
        {version}
      </Tag>
    </div>

    <div className={s.sources}>
      {
        Object.values(Sources).map(v =>
          <Checkbox
            key={v}
            checked={selectedSources.includes(v)}
            onChange={onCheck(v)}
            overrides={{
              Root: {
                style: ({ $theme }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  height: '3em',
                  boxShadow: `0px 1px 0 ${$theme.colors.borderTransparent}`,
                }),
              },
              Checkmark: {
                style: ({ $checked, $theme }) => ({
                  borderColor: $checked ? $theme.colors.positive : $theme.colors.backgroundNegative,
                  backgroundColor: $checked ? $theme.colors.positive : $theme.colors.backgroundAlwaysLight,
                }),
              },
              Label: {
                style: ({ $theme }) => ({
                  fontSize: $theme.sizing.scale600,
                }),
              },
            }}
          >
            {v}
          </Checkbox>,
        )
      }
    </div>

    <div className={s.control}>
      <Button
        overrides={{
          BaseButton: {
            style: ({ $theme, $disabled }) => {
              return {
                ':hover': {
                  backgroundColor: $disabled ?
                    $theme.colors.backgroundLightAccent :
                    $theme.colors.accent,
                },
                backgroundColor: $disabled ?
                  $theme.colors.borderAccentLight :
                  $theme.colors.accent500,
              };
            },
          },
        }}
        disabled={shouldDisableImport}
        startEnhancer={() => <ArrowRight size={24} />}
        onClick={startImport}
      >
        {t(`import now`)}!
      </Button>

      <Checkbox
        className={s.keepOld}
        labelPlacement={LABEL_PLACEMENT.right}
        checkmarkType={STYLE_TYPE.toggle_round}
        checked={store.keepOld}
        onChange={toggleKeepOldItems}
        overrides={{
          Root: {
            style: () => ({
              // ...$theme.borders.border100,
              display: 'flex',
              alignSelf: 'flex-end',
              marginLeft: '2ex',
              marginBottom: '0.8ex',
            }),
          },
          Checkmark: {
            style: ({ $checked, $theme }) => ({
              backgroundColor: $checked ? $theme.colors.positive : '#ffffff',
            }),
          },
          ToggleTrack: {
            style: ({ $theme }) => {
              return {
                backgroundColor: $theme.colors.backgroundLightAccent,
              };
            },
          },
          Toggle: {
            style: ({ $theme, $checked }) => {
              return {
                // Outline: `${$theme.colors.warning200} solid`,
                backgroundColor: $checked ? $theme.colors.borderPositive : $theme.colors.backgroundLightAccent,
              };
            },
          },
        }}
      >
        {t('keep old items')}
      </Checkbox>
    </div>

    {
      process.env.NODE_ENV === `development` &&
      <button
        style={{ width: `6em` }}
        onClick={() => {
          const keys = [
            "266",
            "103",
            "84",
            "12",
            "32",
            "34",
            "1",
            "523",
            "22",
            "136",
            "268",
            "432",
            "53",
            "63",
            "201",
            "51",
            "164",
            "69",
            "31",
            "42",
            "122",
            "131",
            "119",
            "36",
            "245",
            "60",
            "28",
            "81",
            "9",
            "114",
            "105",
            "3",
            "41",
            "86",
            "150",
            "79",
            "104",
            "120",
            "74",
            "420",
            "39",
            "427",
            "40",
            "59",
            "24",
            "126",
            "202",
            "222",
            "145",
            "429",
            "43",
            "30",
            "38",
            "55",
            "10",
            "141",
            "85",
            "121",
            "203",
            "240",
            "96",
            "7",
            "64",
            "89",
            "127",
            "236",
            "117",
            "99",
            "54",
            "90",
            "57",
            "11",
            "21",
            "62",
            "82",
            "25",
            "267",
            "75",
            "111",
            "518",
            "76",
            "56",
            "20",
            "2",
            "61",
            "516",
            "80",
            "78",
            "555",
            "246",
            "133",
            "497",
            "33",
            "421",
            "58",
            "107",
            "92",
            "68",
            "13",
            "113",
            "235",
            "875",
            "35",
            "98",
            "102",
            "27",
            "14",
            "15",
            "72",
            "37",
            "16",
            "50",
            "517",
            "134",
            "223",
            "163",
            "91",
            "44",
            "17",
            "412",
            "18",
            "48",
            "23",
            "4",
            "29",
            "77",
            "6",
            "110",
            "67",
            "45",
            "161",
            "254",
            "112",
            "8",
            "106",
            "19",
            "498",
            "101",
            "5",
            "157",
            "83",
            "350",
            "154",
            "238",
            "115",
            "26",
            "142",
            "143",
          ];
          ipcRenderer.send(`show-popup`, {
            championId: keys[Math.floor(Math.random() * keys.length)],
            position: null,
          });
        }}
      >
        apply
      </button>
    }
  </div>;
}
