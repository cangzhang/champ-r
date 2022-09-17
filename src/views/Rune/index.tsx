import React, { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api';

export function Rune() {
    const [championId, setChampionId] = useState(0);

    const getRuneList = () => {
        invoke(`get_runes`, { championId: 107, sourceName: "u.gg", championAlias: "Rengar" }).then((ret) => {
          console.log(ret);
        });
      }

    useEffect(() => {
        let unlisten: () => any = () => null;
        listen('popup_window::selected_champion', ({ payload }: { payload: any }) => {
            console.log(payload);
            setChampionId(payload.champion_id);
        }).then(un => {
            unlisten = un;
        });

        return () => {
            unlisten()
        }
    }, []);

    return (
        <section>
            <h1>RUNE WINDOW</h1>
            <p>current champion id is <code>{championId}</code></p>

            <button onClick={getRuneList}>Get Rune List</button>
        </section>
    )
}
