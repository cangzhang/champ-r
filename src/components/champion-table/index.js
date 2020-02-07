import s from './style.module.scss';

import React, { useContext } from 'react';
import AppContext from 'src/share/context';

import { getAvatar, getSpellImg } from 'src/service/ddragon';

const ChampionTable = () => {
	const { store: { fetched: data, version } } = useContext(AppContext);

	if (!data.length) {
		return <pre><code>No data</code></pre>;
	}

	return <table>
		<thead>
		<tr>
			<th>Champion</th>
			<th>Position</th>
			<th>Spells</th>
			<th>Skills</th>
		</tr>
		</thead>
		<tbody>
		{
			data.map(i => {
				const avatar = getAvatar(i.key, version);

				return <tr key={ `${ i.key }-${ i.position }` }>
					<td className={ s.avatar }>
						<img src={ avatar } alt={ i.key } />
					</td>
					<td>{ i.position }</td>
					<td className={ s.spells }>
						<ol>
							{
								i.spellNames.map((n, nIdx) =>
									<li key={ nIdx }>
										{ n.map((s, sIdx) => {
											const img = getSpellImg(s, version);

											return <img src={ img } alt={ n } key={ `${ nIdx }-${ sIdx }` } />;
										}) }
									</li>,
								)
							}
						</ol>
					</td>
					<td>{ i.skills }</td>
				</tr>;
			})
		}
		</tbody>
	</table>;
};

export default ChampionTable;
