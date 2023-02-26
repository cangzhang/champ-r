import { SelectValue } from '@radix-ui/react-select';
import { invoke } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';
import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Toaster } from 'react-hot-toast';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from 'src/components/ui/Select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'src/components/ui/Tooltip';

import { RuneList } from 'src/views/RuneList/RuneList';
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
  const [curSource, setCurSource] = useState('');
  const [version, setVersion] = useState('');
  const [runesReforged, setRunesReforged] = useState<RuneSlot[]>([]);

  let ddragon = useRef<DDragon>(null).current;

  const getRuneList = useCallback(async () => {
    if (!championAlias || !curSource) {
      return;
    }

    const r: any = await invoke(`get_available_perks_for_champion`, {
      sourceName: curSource,
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

    const sourceList = ddragon.source_list;

    let runeSource: string = await appConf.get('runeSource');
    if (!runeSource || !selectedSources.includes(runeSource)) {
      runeSource = sourceList[0].source.value;
    }
    setCurSource(runeSource);
  }, []);

  useEffect(() => {
    const sourceTab: string = curSource;
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
    listen(
      'popup_window::selected_champion',
      ({ payload }: { payload: any }) => {
        console.log(`popup_window::selected_champion`, payload);
        setChampionId(payload.champion_id);
        setChampionAlias(payload.champion_alias);
      }
    ).then((un) => {
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
      appWindow.setDecorations(false);
    }
  }, [championId]);

  return (
    <TooltipProvider>
      <Toolbar />
      <div className={s.overviewContainer}>
        <div className={s.header}>
          <Tooltip>
            <TooltipTrigger>
              <img
                className={clsx('h-10 w-10')}
                src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championAlias}.png`}
                alt={championAlias}
              />
            </TooltipTrigger>
            <TooltipContent>{championAlias}</TooltipContent>
          </Tooltip>

          <Select value={curSource}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              {sources.map((i: any) => (
                <SelectItem key={i.source.value} value={i.source.value}>
                  {i.source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {runesReforged.length > 0 && (
          <RuneList perks={perks} runesReforged={runesReforged} />
        )}

        <Toaster position="bottom-center" />
      </div>
    </TooltipProvider>
  );
}
