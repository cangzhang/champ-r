import { IconArrowLeft } from '@tabler/icons';
import { invoke } from '@tauri-apps/api';
import { UnlistenFn, listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';

import { Button } from 'src/components/ui/Button';

export function ImportResult() {
  const [result, setResult] = useState<any[]>([]);
  const ids = useRef(new Set()).current;
  const [searchParams] = useSearchParams();

  const applyBuilds = useCallback((sources: string[]) => {
    invoke(`apply_builds`, { sources });
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
    let unlisten: UnlistenFn;
    listen('main_window::apply_builds_result', (h) => {
      console.log(h.payload);
      updateResult(h.payload as Array<any>);
    }).then((h) => {
      unlisten = h;
    });

    return () => {
      unlisten();
    };
  }, [updateResult]);

  useEffect(() => {
    const sources = searchParams.get('sources').split(',');
    applyBuilds(sources);
  }, [applyBuilds]);

  return (
    <section>
      <NavLink to={'/'}>
        <Button>
          <IconArrowLeft />
          <p>Back</p>
        </Button>
      </NavLink>

      <div style={{ height: 200, overflow: `auto` }}>
        {result.map((i, idx) => (
          <p key={idx}>{i}</p>
        ))}
      </div>
    </section>
  );
}
