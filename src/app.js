import s from './app.module.scss';

import React, { useState } from 'react';
import { PrimaryButton } from 'office-ui-fabric-react';

import { getLolVer, getChampions } from './service/ddragon';
import * as Opgg from './service/op-gg';

const App = () => {
	const [version, setVersion] = useState(null);
	const [data, setData] = useState([]);

	const importItems = async () => {
		const v = await getLolVer();
		await setVersion(v);
		const champions = await getChampions(v);
		const res = await Opgg.getPositions();

		const tasks = res.reduce((t, item) => {
			const { positions, key } = item;
			const positionTasks = positions.map(pos => Opgg.getItems(key, pos));
			return t.concat(positionTasks);
		}, []);

		const data = await Promise.all(tasks);
		setData(data);
	};

	return (
		<div className={s.container}>
			<h2>Champ Remix</h2>

			<PrimaryButton
				className={s.import}
				onClick={importItems}
			>
				import
			</PrimaryButton>
			<div>LOL version is: <code>{version}</code></div>

			<table>
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
					data.length > 0 &&
					data.map(i => {
						return <tr key={`${i.key}-${i.position}`}>
							<td>{i.key}</td>
							<td>{i.position}</td>
							<td>{i.spells.map(s => <img src={s} alt={s}/>)}</td>
							<td>{i.skills}</td>
						</tr>;
					})
				}
				</tbody>
			</table>
		</div>
	);
};

export default App;
