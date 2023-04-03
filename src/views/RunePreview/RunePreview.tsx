import s from './style.module.scss';

import { invoke } from '@tauri-apps/api';

import { useCallback, useMemo, useState } from 'react';
import { Button } from '@nextui-org/react';
import cn from 'clsx';
import { IconCheck, IconRotateClockwise2, IconSword } from '@tabler/icons';
import toast from 'react-hot-toast';

import { PerkPage, Rune, RuneSlot } from '../../interfaces';
import { sleep } from '../../helper';
// import SimpleBar from 'simplebar-react';

interface RRune extends Rune {
  parent?: number;
}

enum ApplyStage {
  Normal,
  Processing,
  Done,
}

const getStageIcon = (stage: number) => {
  switch (stage) {
    case ApplyStage.Processing:
      return <IconRotateClockwise2 className={s.loading}/>;
    case ApplyStage.Done:
      return <IconCheck/>;
    default:
      return <IconSword/>;
  }
};

export function RunePreview({perks, runesReforged}: { perks: PerkPage[], runesReforged: RuneSlot[] }) {
  const [processing, setProcessing] = useState<{ [key: number]: ApplyStage }>({});

  const getSlots = useCallback((perk: PerkPage) => {
    let primary = runesReforged.find(i => i.id === perk.primaryStyleId);
    let sub = runesReforged.find(i => i.id === perk.subStyleId);

    return {
      primary,
      sub
    };
  }, [runesReforged]);

  const applyPerk = useCallback((p: PerkPage, idx: number) => {
    setProcessing(s => {
      let ss = {...s};
      ss[idx] = ApplyStage.Processing;
      return ss;
    });
    invoke('apply_perk', {perk: JSON.stringify(p)})
    .finally(async () => {
      await sleep(600);
      setProcessing(s => {
        let ss = {...s};
        ss[idx] = ApplyStage.Done;
        return ss;
      });
      toast.success('Applied');
      await sleep(600);
      setProcessing(s => {
        let ss = {...s};
        ss[idx] = ApplyStage.Normal;
        return ss;
      });
    });
  }, []);

  let runesRef = useMemo(() => {
    let r: { [key: number]: RRune } = {};
    runesReforged.forEach(i => {
      i.slots.forEach(j => {
        j.runes.forEach(k => {
          r[k.id] = {
            ...k,
            parent: i.id
          };
        });
      });
    });

    return r;
  }, [runesReforged]);

  return (
    <div className={s.previewCard}>
      {
        perks.map((p, idx) => {
          let {primary, sub} = getSlots(p);
          let stage = processing[idx];

          return (
            <div className={s.item} key={idx}>
              <img
                width={36}
                height={36}
                key={primary.key}
                src={`https://ddragon.leagueoflegends.com/cdn/img/${primary.icon}`}
                alt={primary.name}
                className={s.main}
              />
              {p.selectedPerkIds
              .filter(i => runesRef[i]?.parent === primary.id)
              .map(i => {
                let rune = runesRef[i];
                return (
                  <img
                    key={i}
                    width={24}
                    height={24}
                    src={`https://ddragon.leagueoflegends.com/cdn/img/${runesRef[i].icon}`}
                    alt={runesRef[i].name}
                    className={s.normal}
                  />
                );
              })}

              <img
                key={sub.key}
                src={`https://ddragon.leagueoflegends.com/cdn/img/${sub.icon}`}
                alt={sub.name}
                className={s.main}
              />
              {p.selectedPerkIds
              .filter(i => runesRef[i]?.parent === sub.id)
              .map(i => {
                let rune = runesRef[i];
                return (
                  <img
                    key={i}
                    width={24}
                    height={24}
                    src={`https://ddragon.leagueoflegends.com/cdn/img/${runesRef[i].icon}`}
                    alt={runesRef[i].name}
                    className={s.normal}
                  />
                );
              })}

              <Button
                auto
                flat
                color="success"
                icon={getStageIcon(stage)}
                className={cn(s.applyBtn)}
                onPress={() => applyPerk(p, idx)}
              />
            </div>
          );
        })
      }
    </div>
  );
}
