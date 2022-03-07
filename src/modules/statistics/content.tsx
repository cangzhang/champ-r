import s from './style.module.scss';

import React, { useEffect, useState } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { QQChampionAvatarPrefix } from 'src/share/constants/sources';
import Loading from 'src/components/loading-spinner';
import { IChampionRank } from '@interfaces/commonTypes';
import { Tabs, Tab } from 'baseui/tabs';
import { getIChampionRankAsync } from './utils';
import cn from 'classnames';

export function Content() {
  const [activeKey, setActiveKey] = useState('0');
  const [championTopRank, setChampionTopRank] = useState<IChampionRank[]>([]);
  const [championJungleRank, setChampionJungleRank] = useState<IChampionRank[]>([]);
  const [championMiddleRank, setChampionMiddleRank] = useState<IChampionRank[]>([]);
  const [championBottomRank, setChampionBottomRank] = useState<IChampionRank[]>([]);
  const [championSupportRank, setChampionSupportRank] = useState<IChampionRank[]>([]);

  async function fetchChampionRank() {
    let [top, jungle, middle, bottom, support] = await getIChampionRankAsync();
    setChampionTopRank(top);
    setChampionJungleRank(jungle);
    setChampionMiddleRank(middle);
    setChampionBottomRank(bottom);
    setChampionSupportRank(support);
  }

  useEffect(() => {
    fetchChampionRank();
  }, []);

  const onTabChange = ({ activeKey }: any) => {
    setActiveKey(activeKey);
  };

  const renderList = (list: IChampionRank[] = []) => {
    const shouldShowList = list.length;

    if (!shouldShowList) {
      return <Loading className={s.listLoading} />;
    }

    return (
      <Scrollbars
        style={{
          height: `calc(100vh - 10em)`,
        }}>
        {list.map((p, idx) => (
          <div className={s.drag}>
            <div className={cn(s.cell, s.rank)}>{p.rank}</div>
            <div className={cn(s.cell, s.image)}>
              <img
                key={p.id}
                className={s.avatar}
                alt={p.rank}
                src={`${QQChampionAvatarPrefix}/${p.id}.png`}
              />
            </div>
            <div className={cn(s.cell, s.champion)}>
              <div>{p.id}</div>
              <div>{p.position}</div>
            </div>
            <div className={cn(s.cell, s.value)}>{p.winRate}</div>
            <div className={cn(s.cell, s.value)}>{p.pickRate}</div>
            <div className={cn(s.cell, s.value, s.tier)}>
              <img key={p.id} alt={p.rank} src={`http:${p.tier}`} />
            </div>
          </div>
        ))}
      </Scrollbars>
    );
  };

  const renderContent = () => {
    return (
      <div className={s.container}>
        <Tabs activeKey={activeKey} onChange={onTabChange}>
          <Tab title='Top'>{renderList(championTopRank)}</Tab>
          <Tab title='Jungle'>{renderList(championJungleRank)}</Tab>
          <Tab title='Middle'>{renderList(championMiddleRank)}</Tab>
          <Tab title='Bottom'>{renderList(championBottomRank)}</Tab>
          <Tab title='Support'>{renderList(championSupportRank)}</Tab>
        </Tabs>
      </div>
    );
  };

  return <div>{renderContent()}</div>;
}
