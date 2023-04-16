import { Avatar, Badge, Dropdown, Tooltip } from '@nextui-org/react';
import { invoke } from '@tauri-apps/api';
import { UnlistenFn, listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Toaster } from 'react-hot-toast';

import { RunePreview } from 'src/views/RunePreview/RunePreview';
import { Toolbar } from 'src/views/Toolbar/Toolbar';

import { appConf } from 'src/config';
import { blockKeyCombosInProd } from 'src/helper';
import { DDragon, RuneSlot, Source } from 'src/interfaces';

import s from './style.module.scss';

export function RuneOverview() {
  const [championId, setChampionId] = useState(0);
  const [championAlias, setChampionAlias] = useState('');
  const [perks, setPerks] = useState<any[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [curSource, setCurSource] = useState(new Set([]));
  const [version, setVersion] = useState('');
  const [runesReforged, setRunesReforged] = useState<RuneSlot[]>([]);

  let ddragon = useRef<DDragon>(null).current;

  const getRuneList = useCallback(async () => {
    if (!championAlias || !curSource) {
      return;
    }

    const r: any = await invoke(`get_available_perks_for_champion`, {
      sourceName: [...curSource][0],
      championAlias,
    });
    setPerks(r);
  }, [championAlias, curSource]);

  const initData = useCallback(async () => {
    if (!ddragon) {
      ddragon = await invoke(`get_ddragon_data`);
    }

    setRunesReforged(ddragon.rune_list);
    const selectedSources: string[] = await appConf.get('selectedSources');
    let availableSources = ddragon.source_list;
    if (selectedSources?.length > 0) {
      availableSources = ddragon.source_list.filter((i) =>
        selectedSources.includes(i.source.value)
      );
    }
    setSources(availableSources);
    setVersion(ddragon.official_version);

    let runeSource: string = await appConf.get('runeSource');
    if (!runeSource || !selectedSources.includes(runeSource)) {
      runeSource = selectedSources[0];
    }
    setCurSource(new Set([runeSource]));
  }, [championId]);

  useEffect(() => {
    const sourceTab: string = [...curSource][0];
    if (sourceTab) {
      appConf.set('runeSource', sourceTab).then(() => {
        appConf.save();
      });
    }
  }, [curSource]);

  useEffect(() => {
    blockKeyCombosInProd();
  }, []);

  useEffect(() => {
    let unregister: UnlistenFn;
    listen(
      'popup_window::selected_champion',
      ({ payload }: { payload: any }) => {
        console.log(`popup_window::selected_champion`, payload);
        setChampionId(payload.champion_id);
        setChampionAlias(payload.champion_alias);
      }
    ).then((un) => {
      unregister = un;
    });

    return () => {
      unregister();
    };
  }, []);

  useEffect(() => {
    getRuneList();
  }, [getRuneList]);

  useEffect(() => {
    initData();

    return () => {
      appConf.save();
    };
  }, [initData]);

  useEffect(() => {
    if (championId > 0) {
      appWindow.show();
      appWindow.setAlwaysOnTop(true);
      appWindow.unminimize();
    }
  }, [championId]);

  const selectedSource = useMemo(() => [...curSource].join(''), [curSource]);
  const source = sources.find((i) => i.source.value === selectedSource);

  return (
    <>
      <Toolbar />
      <div className={s.overviewContainer}>
        <div className={s.header}>
          <Tooltip content={championAlias} placement={'bottom'}>
            <Avatar
              src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championAlias}.png`}
            />
          </Tooltip>

          <Dropdown>
            <Dropdown.Button flat color={'secondary'}>
              <div className={s.curSource}>{source?.source.label}</div>
            </Dropdown.Button>
            <Dropdown.Menu
              color="secondary"
              disallowEmptySelection
              selectionMode="single"
              selectedKeys={curSource}
              onSelectionChange={(arr) => setCurSource(new Set(arr))}
            >
              {sources.map((i: any) => (
                <Dropdown.Item key={i.source.value} className={s.menuItem}>
                  {i.source.label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          {source?.source.isAram && (
            <>
              <Badge variant="dot" color={'success'} />
              ARAM
            </>
          )}
          {source?.source.isUrf && (
            <>
              <Badge variant="dot" color={'warning'} />
              URF
            </>
          )}
          {!source?.source.isAram && !source?.source.isUrf && (
            <>
              <Badge variant="dot" />
              {`Summoner's Rift`}
            </>
          )}
        </div>

        {runesReforged.length > 0 && (
          <RunePreview perks={perks} runesReforged={runesReforged} />
        )}

        <Toaster position="bottom-center" />
      </div>
    </>
  );
}
