import { useCallback, useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api';

export function Rune() {
    const [championId, setChampionId] = useState(0);
    const [championAlias, setChampionAlias] = useState('');
    const [runes, setRunes] = useState<any[]>([]);

    let runesReforged = useRef<any>([]);

    const getRuneList = useCallback(async () => {
        if (!championAlias) {
            return;
        }

        if (!runesReforged.current.length) {
            runesReforged.current = await invoke(`get_ddragon_data`);
            console.log(`ddragon data`, runesReforged.current);
        }

        let r: any = await invoke(`get_available_runes_for_champion`, { sourceName: "u.gg", championAlias });
        setRunes(r);
    }, [championAlias]);

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
        getRuneList();
    }, [getRuneList]);

    return (
        <section>
            <h1>RUNE WINDOW</h1>
            <p>current champion: <code>{championId}</code> <code>{championAlias}</code></p>
            <button onClick={getRuneList}>Get Rune List</button>

            <pre>
                {JSON.stringify(runes, null, 2)}
            </pre>
        </section>
    )
}
