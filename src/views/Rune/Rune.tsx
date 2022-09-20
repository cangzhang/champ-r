import { useCallback, useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api';

export function Rune() {
    const [championId, setChampionId] = useState(0);
    const [championAlias, setChampionAlias] = useState('');
    const [runes, setRunes] = useState<any[]>([]);
    const [sources, setSources] = useState<any>([])
    const [curSource, setCurSource] = useState('u.gg');

    let ddragon = useRef<any>([]);

    const getRuneList = useCallback(async () => {
        if (!championAlias || !curSource) {
            return;
        }

        if (!ddragon.current.length) {
            ddragon.current = await invoke(`get_ddragon_data`);
            console.log(`ddragon data`, ddragon.current);
            setSources(ddragon.current[0]);
        }

        let r: any = await invoke(`get_available_runes_for_champion`, { sourceName: curSource, championAlias });
        setRunes(r);
    }, [championAlias, curSource]);

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
            unlisten()
        }
    }, []);

    useEffect(() => {
        console.log(`trigger getRuneList`);
        getRuneList();
    }, [getRuneList]);

    return (
        <section>
            <h1>RUNE WINDOW</h1>
            <p>current champion: <code>{championId}</code> <code>{championAlias}</code></p>

            <select className={"select select-bordered"} onChange={ev => setCurSource(ev.target.value)} >
                {sources.map((i: any) => {
                    return (<option key={i.source.value} value={i.source.value}>{i.source.label}</option>)
                })}
            </select>

            <button className={`btn`} onClick={getRuneList}>Get Rune List</button>

            <pre>
                {JSON.stringify(runes, null, 2)}
            </pre>
        </section>
    )
}
