import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';

import { Button, Container } from '@nextui-org/react';
import { IconArrowLeft } from '@tabler/icons';

export function ImportResult() {
  const [result, setResult] = useState<any[]>([]);
  let ids = useRef(new Set()).current;
  let [searchParams] = useSearchParams();

  const applyBuilds = useCallback((sources: string[]) => {
    invoke(`apply_builds`, {sources});
  }, []);

  const updateResult = useCallback((payload: any) => {
    let id = payload.id;
    if (ids.has(payload.id)) {
      return;
    }
    ids.add(id);

    let msg = payload.msg;
    if (payload.done) {
      msg = `[${payload.source}] done`;
    }
    setResult(r => [msg, ...r]);
  }, []);

  useEffect(() => {
    let unlisten = () => {
    };
    listen('main_window::apply_builds_result', h => {
      console.log(h.payload);
      updateResult(h.payload as Array<any>);
    }).then(h => {
      unlisten = h;
    });

    return () => {
      unlisten();
    };
  }, [updateResult]);

  useEffect(() => {
    let sources = searchParams.get('sources').split(',');
    applyBuilds(sources);
  }, [applyBuilds]);

  return (
    <Container>
      <NavLink to={'/'}>
        <Button light icon={<IconArrowLeft/>}>
          Back
        </Button>
      </NavLink>

      <div style={{height: 200, overflow: `auto`}}>
        {result.map((i, idx) => <p key={idx}>{i}</p>)}
      </div>
    </Container>
  );
}
