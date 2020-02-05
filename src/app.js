import s from './app.module.scss';

import React, { useReducer, useState, useMemo } from 'react';
import { PrimaryButton } from 'office-ui-fabric-react';

import appReducer, { initialState, init, Actions, setLolVersion } from 'src/share/reducer';
import AppContext from 'src/share/context';

import { getLolVer } from 'src/service/ddragon';
import * as Opgg from 'src/service/op-gg';
import { saveToFile } from 'src/share/file';

import ChampionTable from 'src/components/champion-table';
import WaitingList from 'src/components/waiting-list';

const { dialog } = require('electron').remote;

const makeFetchTask = (champion, position, v, dispatch) => {
	dispatch({
		type: Actions.ADD_FETCHING,
		payload: `${ champion }-${ position }`,
	});

	return Opgg.getItems(champion, position, v)
		.then(data => {
			dispatch({
				type: Actions.ADD_FETCHED,
				payload: data,
			});

			console.log(data);
			return data;
		});
};

const App = () => {
	const [store, dispatch] = useReducer(appReducer, initialState, init);
	const [version, setVersion] = useState(null);
	const [lolDir, setLolDir] = useState('');

	const onSelectDir = async () => {
		const { fetched } = store;

		const { canceled, filePaths } = await dialog.showOpenDialog({
			properties: ['openDirectory']
		});
		if (canceled) return;

		const dir = filePaths[0];
		setLolDir(dir);

		// const res = await saveToFile(dir);
		const tasks = fetched.map(i => saveToFile(dir, i));
		const res = await Promise.all(tasks);
		console.log(`write to file: ${res}`);
	};

	const importItems = async () => {
		const v = await getLolVer();
		await setVersion(v);
		dispatch(setLolVersion(v));

		const res = await Opgg.getPositions();
		const tasks = res.slice(0, 5).reduce((t, item) => {
			const { positions, key } = item;
			const positionTasks = positions.map(position => makeFetchTask(key, position, v, dispatch));

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

				<div>LOL version is <code>{ version }</code>, LOL dir is <code>{lolDir}</code></div>
				<button
					style={{ width: `6em` }}
					onClick={onSelectDir}
				>
					Select dir
				</button>

				<div className={ s.champions }>
					<WaitingList />
					<ChampionTable />
				</div>
			</div>
		</AppContext.Provider>
	);
};

export default App;
