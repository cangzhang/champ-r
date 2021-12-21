import _noop from 'lodash/noop';

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import cn from 'classnames';
import { useTranslation } from 'react-i18next';

import { CornerDownRight } from 'react-feather';
import { useStyletron } from 'baseui';
import { Button, KIND as BtnKind, SIZE as BtnSize } from 'baseui/button';
import { Checkbox, STYLE_TYPE, LABEL_PLACEMENT } from 'baseui/checkbox';
import { StatefulTooltip as Tooltip } from 'baseui/tooltip';
import { Tag, VARIANT } from 'baseui/tag';
import { ArrowRight } from 'baseui/icon';
import { H6 } from 'baseui/typography';
import { useSnackbar, DURATION } from 'baseui/snackbar';
import { Alert as AlertIcon } from 'baseui/icon';

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
  const [css, theme] = useStyletron();
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
        return Promise.reject({ canceled });
      }

      if (!filePaths) {
        throw new Error(`[home] select folder: got no folder`);
      }
      const dir = filePaths[0];
      setLolDir(dir);
    } catch (err) {
      console.error(err.message);
      return Promise.reject(null);
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

          return i.getPkgInfoFromJsdelivr().then((ver) => {
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
        {t(`lol folder is`)}
        <Tag
          closeable={Boolean(lolDir)}
          kind='accent'
          onClick={onSelectDir}
          onActionClick={clearFolder}
          overrides={{
            Root: {
              style: () => ({
                minWidth: 0,
                maxWidth: `calc(100vw - 14em)`,
                paddingTop: `2px`,
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
          }}>
          <Tooltip content={lolDir && t(`click here to re-select`)}>
            {lolDir || t('click here to select')}
          </Tooltip>
        </Tag>
      </div>
      <code
        className={cn(
          s.folderTip,
          css({
            backgroundColor: theme.colors.backgroundLightWarning,
            borderRadius: theme.borders.radius300,
          }),
        )}>
        <CornerDownRight size={`1.6em`} color={`#43BF75`} />
        <div dangerouslySetInnerHTML={{ __html: t('installation path of League of Legends') }} />
      </code>

      <div className={s.sources}>
        <H6 margin={`0 0 1ex 0`} color={theme.colors.borderInverseOpaque}>
          <div
            className={s.sourceTitle}
            dangerouslySetInnerHTML={{
              __html: t(`data sources`),
            }}
          />
        </H6>

        {sourceList.map((v) => {
          const { isAram, isURF } = v;
          const sourceVer = store.dataSourceVersions[v.value];

          return (
            <Checkbox
              key={v.value}
              checked={selectedSources.includes(v.label)}
              onChange={onCheck(v.label)}
              overrides={{
                Root: {
                  style: ({ $theme }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    height: '3em',
                    boxShadow: `0px 1px 0 ${$theme.colors.borderTransparent}`,
                    minHeight: `48px`,
                  }),
                },
                Checkmark: {
                  style: ({ $checked, $theme }) => ({
                    // borderColor: $checked
                    //   ? $theme.colors.positive
                    //   : $theme.colors.backgroundNegative,
                    backgroundColor: $checked
                      ? $theme.colors.positive
                      : $theme.colors.backgroundAlwaysLight,
                  }),
                },
                Label: {
                  style: ({ $theme }) => ({
                    fontSize: $theme.sizing.scale600,
                    textTransform: `uppercase`,
                    display: `flex`,
                    alignItems: `center`,
                  }),
                },
              }}>
              {v.label}
              {sourceVer && (
                <Tag closeable={false} variant={VARIANT.outlined} kind='warning'>
                  {sourceVer}
                </Tag>
              )}
              {isAram && (
                <Tag closeable={false} variant={VARIANT.light} kind='positive'>
                  {t(`aram`)}
                </Tag>
              )}
              {isURF && (
                <Tag closeable={false} variant={VARIANT.light} kind='positive'>
                  {t(`urf`)}
                </Tag>
              )}
            </Checkbox>
          );
        })}
      </div>

      <div className={s.control}>
        <Button
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
        </Button>

        <Checkbox
          // className={s.keepOld}
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
                  backgroundColor: $checked
                    ? $theme.colors.borderPositive
                    : $theme.colors.backgroundLightAccent,
                };
              },
            },
          }}>
          {t('keep old items')}
        </Checkbox>
      </div>

      <div>
        <Button
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
        </Button>

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
