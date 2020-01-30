import s from './style.module.scss';

import React, { useContext } from 'react';
import AppContext from 'src/share/context';

const ChampionTable = () => {
	const { store: { fetched: data } } = useContext(AppContext);

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
				return <tr key={ `${ i.key }-${ i.position }` }>
					<td>{ i.key }</td>
					<td>{ i.position }</td>
					<td className={ s.spells }>
						{
							i.spellNames.map((n, nIdx) =>
								<ul key={ nIdx }>
									{
										n.map((i, idx) => <li key={ idx }>{ i }</li>)
									}
								</ul>,
							)
						}
					</td>
					<td>{ i.skills }</td>
				</tr>;
			})
		}
		</tbody>
	</table>;
};

export default ChampionTable;
