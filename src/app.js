import s from './app.module.scss';

import React, { useReducer, useState, useMemo } from 'react';
import { PrimaryButton } from 'office-ui-fabric-react';

import appReducer, { initialState, init, Actions } from 'src/share/reducer';
import AppContext from 'src/share/context';

import { getLolVer } from 'src/service/ddragon';
import * as Opgg from 'src/service/op-gg';

import ChampionTable from 'src/components/champion-table';
import WaitingList from 'src/components/waiting-list';

const makeFetchTask = (champion, position, dispatch) => {
	dispatch({
		type: Actions.ADD_FETCHING,
		payload: `${ champion }-${ position }`,
	});

	return Opgg.getItems(champion, position)
		.then(data => {
			dispatch({
				type: Actions.ADD_FETCHED,
				payload: data,
			});

			return data;
		});
};

const App = () => {
	const [store, dispatch] = useReducer(appReducer, initialState, init);
	const [version, setVersion] = useState(null);
	// const [data, setData] = useState([]);

	const importItems = async () => {
		const v = await getLolVer();
		await setVersion(v);

		const res = await Opgg.getPositions();
		const tasks = res.reduce((t, item) => {
			const { positions, key } = item;
			const positionTasks = positions.map(position => makeFetchTask(key, position, dispatch));

			return t.concat(positionTasks);
		}, []);

		await Promise.all(tasks);
	};

	const contextValue = useMemo(() => ({ store, dispatch }), [store, dispatch]);

	return (
		<AppContext.Provider value={ contextValue }>
			<div className={ s.container }>
				<h2>Champ Remix</h2>

				<PrimaryButton
					className={ s.import }
					onClick={ importItems }
				>
					import
				</PrimaryButton>
				<div>LOL version is: <code>{ version }</code></div>

				<div className={s.champions}>
					<WaitingList />
					<ChampionTable />
				</div>
			</div>
		</AppContext.Provider>
	);
};

export default App;
