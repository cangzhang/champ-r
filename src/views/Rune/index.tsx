import React, { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event'

export function Rune() {
    const [championId, setChampionId] = useState(0);

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
        </section>
    )
}
