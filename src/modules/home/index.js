import s from 'src/app.module.scss';

import { remote } from 'electron';

import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { Button } from 'baseui/button';
import { Checkbox, STYLE_TYPE, LABEL_PLACEMENT } from 'baseui/checkbox';
import { StatefulTooltip as Tooltip } from 'baseui/tooltip';
import { Tag } from 'baseui/tag';
import { ArrowRight } from 'baseui/icon';

import config from 'src/native/config';
import {
  setLolVersion,
  updateItemMap,
  updateConfig,
} from 'src/share/actions';
import { getItemList, getLolVer } from 'src/service/ddragon';
import { getUpgradeableCompletedItems } from 'src/service/utils';

import Sources from 'src/share/sources';
import AppContext from 'src/share/context';

export default function Home() {
  const { store, dispatch } = useContext(AppContext);
  const history = useHistory();

  const [keepOld, setKeepOld] = useState(config.get('keepOldItems'));
  const [selectedSources, toggleSource] = useState([Sources.Opgg, Sources.Lolqq]);

  const [version, setVersion] = useState(config.get('lolVer'));
  const [lolDir, setLolDir] = useState(config.get('lolDir'));

  const toggleKeepOldItems = ev => {
    const { checked } = ev.target;
    setKeepOld(checked);
    config.set('keepOldItems', checked);
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
    config.set('lolDir', dir);
  };

  const clearFolder = () => {
    setLolDir('');
    config.set('lolDir', '');
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
    dispatch(updateConfig({
      selectedSources: res,
    }));
    config.set(`selectedSources`, res);
  };

  const startImport = () => {
    history.push(`/import`);
  };

  useEffect(() => {
    const getVerAndItems = async () => {
      const v = await getLolVer();
      await setVersion(v);
      dispatch(setLolVersion(v));
      config.set('lolVer', v);

      const language = config.get('language');
      const data = await getItemList(v, language);
      const upgradeableCompletedItems = getUpgradeableCompletedItems(data);
      dispatch(updateItemMap({
        ...data,
        upgradeableCompletedItems,
      }));
    };

    getVerAndItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shouldDisableImport = !version || !lolDir || !selectedSources.length || !store.itemMap;

  return <div className={s.container}>
    <h1 className={s.title}>
      <span>Champ Remix</span>
    </h1>

    <div className={s.info}>
      LOL folder is
      <Tag
        closeable={Boolean(lolDir)}
        kind="accent"
        onClick={onSelectDir}
        onActionClick={clearFolder}
        overrides={{
          Text: {
            style: ({ $theme }) => ({
              fontSize: $theme.sizing.scale550,
            }),
          },
        }}
      >
        <Tooltip content={lolDir && 'Click to re-select.'}>
          {lolDir || 'Click here to select'}
        </Tooltip>
      </Tag>
    </div>
    <div className={s.info}>
      LOL version is
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
        Import Now!
      </Button>

      <Checkbox
        className={s.keepOld}
        labelPlacement={LABEL_PLACEMENT.right}
        checkmarkType={STYLE_TYPE.toggle_round}
        checked={keepOld}
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
        Keep old items
      </Checkbox>
    </div>
  </div>;
}
