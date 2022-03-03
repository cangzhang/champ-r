import _noop from 'lodash/noop';

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button as OldBtn, KIND as BtnKind, SIZE as BtnSize } from 'baseui/button';
import { ArrowRight } from 'baseui/icon';
import { useSnackbar, DURATION } from 'baseui/snackbar';
import { Alert as AlertIcon } from 'baseui/icon';

import { Tooltip as Tip, ActionIcon, Divider, Button, List, Checkbox, Badge } from '@mantine/core';
import { InformationCircleIcon } from '@heroicons/react/solid';

import { updateConfig, updateDataSourceVersion } from 'src/share/actions';
import { ChampionKeys } from 'src/share/constants/champions';
import AppContext from 'src/share/context';
import LolQQ from 'src/service/data-source/lol-qq';
import CdnService from 'src/service/data-source/cdn-service';

import useSourceList from './useSourceList';

import s from 'src/app.module.scss';
import logo from 'src/assets/app-icon.webp';
import { createIpcPromise } from 'src/service/ipc';

interface IProps {
  onDirChange?: (p: string) => void;
}

export default function Home({ onDirChange = _noop }: IProps) {
  const { enqueue, dequeue } = useSnackbar();
  const history = useHistory();
  const { t } = useTranslation();

  const { store, dispatch } = useContext(AppContext);
  const versionTasker = useRef<number>();
  const instances = useRef<CdnService[]>([]);

  const { loading: fetchingSources, sourceList } = useSourceList();
  const [selectedSources, toggleSource] = useState<string[]>(
    window.bridge.appConfig.get(`selectedSources`) ?? [],
  );
  const [lolDir, setLolDir] = useState(window.bridge.appConfig.get('lolDir') ?? ``);

  const toggleKeepOldItems = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = ev.target;
    dispatch(updateConfig('keepOld', checked));
  };

  const onSelectDir = async () => {
    try {
      const { canceled, filePaths = [] }: any = await createIpcPromise(`openSelectFolderDialog`);
      if (canceled) {
        return;
      }

      if (!filePaths) {
        throw new Error(`[home] select folder: got no folder`);
      }
      const dir = filePaths[0];
      setLolDir(dir);
    } catch (err) {
      console.error(err.message);
    }
  };

  const clearFolder = () => {
    setLolDir('');
  };

  const onCheck = (value: string) => (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = ev.target;
    let res;
    if (checked) {
      res = selectedSources.concat(value);
    } else {
      const idx = selectedSources.indexOf(value);
      res = [...selectedSources.slice(0, idx), ...selectedSources.slice(idx + 1)];
    }

    toggleSource(res);
    dispatch(updateConfig(`selectedSources`, res));
  };

  const startImport = () => {
    history.push(`/import`);
  };

  const resetPopupPosition = () => {
    window.bridge.sendMessage(`popup:reset-position`);
    new window.Notification(t(`done`));
  };

  const fetchVersion = useCallback(
    () =>
      Promise.allSettled([
        LolQQ.getLolVersion().then((v) => {
          dispatch(updateDataSourceVersion(sourceList[0].label, v));
        }),
        ...instances.current.map((i) => {
          if (window.bridge.appConfig.get(`alwaysRequestLatestVersion`)) {
            return i.getPkgInfo().then(({ sourceVersion }) => {
              dispatch(updateDataSourceVersion(i.pkgName, sourceVersion));
            });
          }

          return i.getSourceVersion().then((ver) => {
            dispatch(updateDataSourceVersion(i.pkgName, ver));
          });
        }),
      ]),
    [dispatch, sourceList],
  );

  useEffect(() => {
    // exclude the `qq` source
    instances.current = sourceList.slice(1).map((s) => new CdnService(s.value, dispatch));
  }, [sourceList, dispatch]);

  useEffect(() => {
    fetchVersion().then(() => {
      versionTasker.current = window.setInterval(() => {
        fetchVersion();
      }, 10 * 60 * 1000);
    });

    return () => {
      clearInterval(versionTasker.current);
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    // persist user preference
    window.bridge.appConfig.set('keepOldItems', store.keepOld);
    window.bridge.appConfig.set(`selectedSources`, selectedSources);
  }, [store.keepOld, lolDir, selectedSources]);

  useEffect(() => {
    window.bridge.sendMessage(`updateLolDir`, { lolDir });
    onDirChange(lolDir);

    if (!lolDir) {
      enqueue(
        {
          message: t(`please specify lol dir`),
          startEnhancer: ({ size }) => <AlertIcon size={size} />,
        },
        DURATION.infinite,
      );
      return;
    }

    dequeue();
  }, [lolDir]); // eslint-disable-line

  const shouldDisableImport =
    !store.version || !lolDir || !selectedSources.length || fetchingSources;

  return (
    <div className={s.container}>
      <h1 className={s.title}>
        <img src={logo} alt='' />
        <span>ChampR</span>
      </h1>

      <div className={s.info}>
        <Tip
          className={s.folderTip}
          label={
            <div
              dangerouslySetInnerHTML={{ __html: t('installation path of League of Legends') }}
            />
          }>
          {t(`lol folder is`)}
          <ActionIcon color={`gray`} variant='transparent' size={20}>
            <InformationCircleIcon />
          </ActionIcon>
        </Tip>

        <Button
          className={s.selectFolder}
          onClick={onSelectDir}
          variant='outline'
          size={'xs'}
          radius={'md'}>
          {lolDir || t('click here to select')}
        </Button>
      </div>

      <Divider
        className={s.sourceTitle}
        label={<span className={s.desc} dangerouslySetInnerHTML={{ __html: t(`data sources`) }} />}
        labelPosition='center'
        variant='dashed'
      />

      <List className={s.sources} icon={<></>}>
        {sourceList.map((v) => {
          const { isAram, isURF } = v;
          const sourceVer = store.dataSourceVersions[v.value];

          return (
            <List.Item key={v.value}>
              <Checkbox
                label={
                  <div className={s.sourceItem}>
                    {v.label}
                    {sourceVer && <Badge>{sourceVer}</Badge>}
                    {isAram && <Badge>{t(`aram`)}</Badge>}
                    {isURF && <Badge>{t(`urf`)}</Badge>}
                  </div>
                }
                checked={selectedSources.includes(v.label)}
                onChange={onCheck(v.label)}
              />
            </List.Item>
          );
        })}
      </List>

      <div className={s.control}>
        <OldBtn
          overrides={{
            BaseButton: {
              style: ({ $theme, $disabled }) => {
                return {
                  ':hover': {
                    backgroundColor: $disabled
                      ? $theme.colors.backgroundLightAccent
                      : $theme.colors.accent,
                  },
                  backgroundColor: $disabled
                    ? $theme.colors.borderAccentLight
                    : $theme.colors.accent500,
                };
              },
            },
          }}
          disabled={shouldDisableImport}
          startEnhancer={() => <ArrowRight size={24} />}
          onClick={startImport}>
          {t(`import now`)}
        </OldBtn>

        <Checkbox
          checked={store.keepOld}
          onChange={toggleKeepOldItems}
          label={<div>{t('keep old items')}</div>}
        />
      </div>

      <div>
        <OldBtn
          kind={BtnKind.secondary}
          size={BtnSize.compact}
          onClick={resetPopupPosition}
          overrides={{
            BaseButton: {
              style: () => ({
                alignSelf: `flex-start`,
                marginBottom: `2ex`,
              }),
            },
          }}>
          {t(`reset popup position`)}
        </OldBtn>

        {(process.env.IS_DEV || process.env.SHOW_POPUP_TRIGGER === `true`) && (
          <button
            style={{ width: `6em`, marginLeft: `2ex` }}
            onClick={() => {
              const championId = ChampionKeys[Math.floor(Math.random() * ChampionKeys.length)];
              window.bridge.sendMessage(`showPopup`, {
                championId,
              });
            }}>
            show popup
          </button>
        )}
      </div>
    </div>
  );
}
