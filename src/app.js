// eslint-disable-next-line import/no-webpack-loader-syntax
import TrashIcon from '-!react-svg-loader!ionicons/dist/svg/trash.svg';
import s from './app.module.scss';

import React, { useReducer, useState, useMemo } from 'react';

import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';
import { Button } from 'baseui/button';
import { Checkbox } from 'baseui/checkbox';
import { StatefulTooltip as Tooltip } from 'baseui/tooltip';

import appReducer, { initialState, init, Actions, setLolVersion } from 'src/share/reducer';
import AppContext from 'src/share/context';

import { getLolVer } from 'src/service/ddragon';
import * as Opgg from 'src/service/op-gg';
import { saveToFile } from 'src/share/file';

import ChampionTable from 'src/components/champion-table';
import WaitingList from 'src/components/waiting-list';
import Toolbar from 'src/components/toolbar';

const { dialog } = require('electron').remote;
const config = require('./native/config');

const engine = new Styletron();

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
	const [version, setVersion] = useState(config.get(`lolVer`));
	const [lolDir, setLolDir] = useState(config.get(`lolDir`));

	const onSelectDir = async () => {
		const { canceled, filePaths } = await dialog.showOpenDialog({
			properties: ['openDirectory'],
		});
		if (canceled) return;

		const dir = filePaths[0];
		setLolDir(dir);
		config.set('lolDir', dir);
	};

	const clearFolder = () => {
		setLolDir(``);
		config.set('lolDir', ``);
	};

	const importItems = async () => {
		const v = await getLolVer();
		await setVersion(v);
		dispatch(setLolVersion(v));
		config.set(`lolVer`, v);

		const res = await Opgg.getPositions();
		const tasks = res.reduce((t, item) => {
			const { positions, key } = item;
			const positionTasks = positions.map(position => makeFetchTask(key, position, v, dispatch));

			return t.concat(positionTasks);
		}, []);

		const fetched = await Promise.all(tasks);
		// const res = await saveToFile(dir);

		if (!lolDir) {
			// TODO: notification
			return;
		}

		const t = fetched.map(i => saveToFile(lolDir, i));
		const result = await Promise.all(t);
		console.log(`write to file: ${ result }`);
	};

	const contextValue = useMemo(() => ({ store, dispatch }), [store, dispatch]);

	return (
		<AppContext.Provider value={ contextValue }>
			<StyletronProvider value={ engine }>
				<BaseProvider theme={ LightTheme }>
					<Toolbar />
					<div className={ s.container }>
						<h2>Champ Remix</h2>

						<Checkbox
							checked={ true }
							onChange={ () => null }
						>
							op.gg
						</Checkbox>

						<Button
							className={ s.import }
							disabled={ !lolDir }
							onClick={ importItems }
						>
							import
						</Button>

						<div className={ s.info }>
							LOL version is<code>{ version }</code>
						</div>
						<div className={ s.info }>
							{
								lolDir
									? <>
										LOL folder is
										<Tooltip content={ `Click here to re-select folder` }>
											<code
												onClick={ onSelectDir }
											>
												{ lolDir }
											</code>
										</Tooltip>

										<Tooltip content={ `Clear selected folder` }>
										<span
											onClick={ clearFolder }
										>
											<TrashIcon
												preserveAspectRatio="xMidYMid meet"
												viewBox="0 0 512 512"
												width={ `24` }
												height={ `24` }
											/>
										</span>
										</Tooltip>
									</>
									: <Button onClick={ onSelectDir }>Select LOL folder</Button>
							}
						</div>

						<div className={ s.champions }>
							<WaitingList />
							<ChampionTable />
						</div>
					</div>
				</BaseProvider>
			</StyletronProvider>
		</AppContext.Provider>
	);
};

export default App;
