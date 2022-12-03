import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Picker, Tooltip, Item, StatusLight, TooltipTrigger } from '@adobe/react-spectrum';

import { DDragon, RuneSlot, Source } from '../../interfaces';
import { appConf } from '../../config';
import { blockKeyCombosInProd } from '../../helper';

import { RunePreview } from '../RunePreview/RunePreview';
import { Toolbar } from '../Toolbar/Toolbar';

import s from './style.module.scss';
import { appWindow } from '@tauri-apps/api/window';

export function RuneOverview() {
  const [championId, setChampionId] = useState(0);
  const [championAlias, setChampionAlias] = useState('');
  const [perks, setPerks] = useState<any[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [curSource, setCurSource] = useState('');
  const [version, setVersion] = useState('');
  const [runesReforged, setRunesReforged] = useState<RuneSlot[]>([]);

  let ddragon = useRef<DDragon>(null).current;

  const getRuneList = useCallback(async () => {
    if (!championAlias || !curSource) {
      return;
    }

    let r: any = await invoke(`get_available_perks_for_champion`, { sourceName: curSource, championAlias });
    setPerks(r);
  }, [championAlias, curSource]);

  const initData = useCallback(async () => {
    if (!ddragon) {
      ddragon = await invoke(`get_ddragon_data`);
    }

    setRunesReforged(ddragon.rune_list);
    let selectedSources: string[] = await appConf.get('selectedSources');
    let availableSources = ddragon.source_list;
    if (selectedSources?.length > 0) {
      availableSources = ddragon.source_list.filter(i => selectedSources.includes(i.source.value));
    }
    setSources(availableSources);
    setVersion(ddragon.official_version);

    let sourceList = ddragon.source_list;

    let runeSource: string = await appConf.get('runeSource');
    if (!runeSource || !selectedSources.includes(runeSource)) {
      runeSource = sourceList[0].source.value;
    }
    setCurSource(runeSource);
  }, []);

  useEffect(() => {
    let sourceTab: string = [...curSource][0];
    if (sourceTab) {
      appConf.set('runeSource', sourceTab);
      appConf.save();
    }
  }, [curSource]);

  useEffect(() => {
    blockKeyCombosInProd();
  }, []);

  useEffect(() => {
    let unlisten: () => any = () => null;
    listen('popup_window::selected_champion', ({ payload }: { payload: any }) => {
      console.log(`popup_window::selected_champion`, payload);
      setChampionId(payload.champion_id);
      setChampionAlias(payload.champion_alias);
    }).then(un => {
      unlisten = un;
    });

    return () => {
      unlisten();
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

  let selectedSource = useMemo(() => [...curSource].join(''), [curSource]);
  let source = sources.find(i => i.source.value === selectedSource);

  return (
    <>
      <Toolbar/>
      <div className={s.overviewContainer}>
        <div className={s.header}>
          <TooltipTrigger>
            <img src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championAlias}.png`}/>
            <Tooltip placement={'bottom'}>{championAlias}</Tooltip>
          </TooltipTrigger>

          <Picker selectedKey={curSource}>
            {sources.map((i: any) => (
              <Item key={i.source.value}>{i.source.label}</Item>
            ))}
          </Picker>

          {source?.source.isAram && <StatusLight variant="positive">ARAM</StatusLight>}
          {source?.source.isUrf && <StatusLight variant="positive">URF</StatusLight>}
          {(!source?.source.isAram && !source?.source.isUrf) &&
            <StatusLight variant="positive">Summoner's Rift</StatusLight>}
        </div>

        {runesReforged.length > 0 && <RunePreview perks={perks} runesReforged={runesReforged}/>}

        <Toaster position="bottom-center"/>
      </div>
    </>
  );
}
