import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Container, Dropdown } from '@nextui-org/react';

import { appConf } from '../../config';

import s from './style.module.scss';

export function Rune() {
  const [championId, setChampionId] = useState(0);
  const [championAlias, setChampionAlias] = useState('');
  const [runes, setRunes] = useState<any[]>([]);
  const [sources, setSources] = useState<any>([]);
  const [curSource, setCurSource] = useState(new Set([]));
  const [version, setVersion] = useState('')

  let ddragon = useRef<any>([]).current;

  const getRuneList = useCallback(async () => {
    if (!championAlias || !curSource) {
      return;
    }

    let r: any = await invoke(`get_available_runes_for_champion`, {sourceName: [...curSource][0], championAlias});
    setRunes(r);
  }, [championAlias, curSource]);

  const initData = useCallback(async () => {
    if (!ddragon.length) {
      ddragon = await invoke(`get_ddragon_data`);

      setSources(ddragon.source_list);
      setVersion(ddragon.official_version);
    }

    let sourceList = ddragon.source_list;

    let runeSource: string = await appConf.get('runeSource');
    if (!runeSource) {
      runeSource = sourceList[0].source.value;
    }
    setCurSource(new Set([runeSource]));
  }, []);

  useEffect(() => {
    let sourceTab: string = [...curSource][0];
    if (sourceTab) {
      appConf.set('runeSource', sourceTab);
    }
  }, [curSource]);

  useEffect(() => {
    let unlisten: () => any = () => null;
    listen('popup_window::selected_champion', ({payload}: { payload: any }) => {
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

  let selectedSource = useMemo(() => [...curSource].join(''), [curSource]);

  return (
    <Container>
      <Avatar src={`https://game.gtimg.cn/images/lol/act/img/champion/${championAlias}.png`}/>
      <Avatar src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championAlias}.png`}/>

      <Dropdown>
        <Dropdown.Button flat color={'secondary'}>{selectedSource}</Dropdown.Button>
        <Dropdown.Menu
          color="secondary"
          disallowEmptySelection
          selectionMode="single"
          selectedKeys={curSource}
          // @ts-ignore
          onSelectionChange={setCurSource}
        >
          {sources.map((i: any) => (
            <Dropdown.Item key={i.source.value}>{i.source.label}</Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>

      <button className={`btn`} onClick={getRuneList}>Get Rune List</button>
      <pre>{JSON.stringify(runes, null, 2)}</pre>
    </Container>
  );
}
