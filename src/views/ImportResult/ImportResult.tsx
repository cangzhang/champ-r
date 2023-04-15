import { Button, Container } from '@nextui-org/react';
import { IconArrowLeft } from '@tabler/icons';
import { invoke } from '@tauri-apps/api';
import { UnlistenFn, listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';

import { appConf } from 'src/config';

export function ImportResult() {
  const [result, setResult] = useState<any[]>([]);
  const ids = useRef(new Set()).current;
  const [searchParams] = useSearchParams();

  const applyBuilds = useCallback(async (sources: string[]) => {
    const keepOld = await appConf.get('keepOldBuilds');
    await invoke(`apply_builds`, { sources, keepOld });
  }, []);

  const updateResult = useCallback((payload: any) => {
    const id = payload.id;
    if (ids.has(payload.id)) {
      return;
    }
    ids.add(id);

    let msg = payload.msg;
    if (payload.done) {
      msg = `[${payload.source}] done`;
    }
    setResult((r) => [msg, ...r]);
  }, []);

  useEffect(() => {
    let unregister: UnlistenFn;
    listen('main_window::apply_builds_result', (h) => {
      console.log(h.payload);
      updateResult(h.payload as Array<any>);
    }).then((h) => {
      unregister = h;
    });

    return () => {
      unregister();
    };
  }, [updateResult]);

  useEffect(() => {
    const sources = searchParams.get('sources').split(',');
    applyBuilds(sources);
  }, [applyBuilds]);

  return (
    <Container>
      <NavLink to={'/'}>
        <Button light icon={<IconArrowLeft />}>
          Back
        </Button>
      </NavLink>

      <div style={{ height: 200, overflow: `auto` }}>
        {result.map((i, idx) => (
          <p key={idx}>{i}</p>
        ))}
      </div>
    </Container>
  );
}
