import s from './app.module.scss';

import { remote } from 'electron';
import React, { useReducer, useState, useMemo, useEffect } from 'react';

import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';
import { Button } from 'baseui/button';
import { Checkbox, STYLE_TYPE, LABEL_PLACEMENT } from 'baseui/checkbox';
import { StatefulTooltip as Tooltip } from 'baseui/tooltip';
import { Tag, VARIANT } from 'baseui/tag';
import { toaster, ToasterContainer, PLACEMENT } from 'baseui/toast';

import config from 'src/native/config';

import Sources from 'src/share/sources';
import AppContext from 'src/share/context';
import appReducer, {
	initialState,
	init,
	setLolVersion,
	updateItemMap,
	prepareReimport,
} from 'src/share/reducer';

import { removeFolderContent } from 'src/share/file';
import { getUpgradeableCompletedItems } from 'src/service/utils';
import { getLolVer, getItemList } from 'src/service/ddragon';

import fetchOpgg from 'src/service/data-source/op-gg';
import fetchLolqq from 'src/service/data-source/lol-qq';

import Toolbar from 'src/components/toolbar';
import Progress from 'src/components/progress-bar';

const engine = new Styletron();

const App = () => {
	const [store, dispatch] = useReducer(appReducer, initialState, init);

	const [version, setVersion] = useState(config.get(`lolVer`));
	const [lolDir, setLolDir] = useState(config.get(`lolDir`));
	const [keepOld, setKeepOld] = useState(config.get(`keepOldItems`));

	const [selectedSources, toggleSource] = useState([Sources.Opgg, Sources.Lolqq]);
	const [importing, setImporting] = useState(false);

	const toggleKeepOldItems = ev => {
		const { checked } = ev.target;
		setKeepOld(checked);
		config.set(`keepOldItems`, checked);
	};

	const onSelectDir = async () => {
		const { canceled, filePaths } = await remote.dialog.showOpenDialog({
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

	const importFromSources = async () => {
		if (store.fetched.length) {
			dispatch(prepareReimport());
		}

		setImporting(true);

		let cleanFolderTask = () => Promise.resolve();
		if (!keepOld) {
			cleanFolderTask = () => removeFolderContent(`${lolDir}/Game/Config/Champions`).then(() => {
				toaster.positive(`Removed outdated items.`);
			});
		}

		const { itemMap } = store;

		let opggTask = Promise.resolve();
		let lolqqTask = Promise.resolve();

		if (selectedSources.includes(Sources.Opgg)) {
			opggTask = () => fetchOpgg(version, lolDir, itemMap, dispatch)
				.then(() => {
					const content = `[OP.GG] Completed`;
					toaster.positive(content);
				});
		}

		if (selectedSources.includes(Sources.Lolqq)) {
			lolqqTask = () => fetchLolqq(lolDir, itemMap, dispatch)
				.then(() => {
					const content = `[101.QQ.COM] Completed`;
					toaster.positive(content);
				});
		}

		await cleanFolderTask();
		// TODO: show progress
		Promise.all([opggTask(), lolqqTask()])
			.finally(() => {
				setImporting(false);
			});
	};

	const onCheck = val => ev => {
		const { checked } = ev.target;
		if (checked) {
			toggleSource(selectedSources.concat(val));
		} else {
			const idx = selectedSources.indexOf(val);
			toggleSource([
				...selectedSources.slice(0, idx),
				...selectedSources.slice(idx + 1),
			]);
		}
	};

	useEffect(() => {
		const getVerAndItems = async () => {
			const v = await getLolVer();
			await setVersion(v);
			dispatch(setLolVersion(v));
			config.set(`lolVer`, v);

			const language = config.get(`language`);
			const data = await getItemList(v, language);
			const upgradeableCompletedItems = getUpgradeableCompletedItems(data);
			dispatch(updateItemMap({
				...data,
				upgradeableCompletedItems,
			}));
		};

		getVerAndItems();
	}, []);

	const contextValue = useMemo(() => ({ store, dispatch }), [store, dispatch]);
	const shouldDisableImport = !version || !lolDir || !selectedSources.length || !store.itemMap;

	return (
		<AppContext.Provider value={contextValue}>
			<StyletronProvider value={engine}>
				<BaseProvider theme={LightTheme}>
					<Toolbar />
					<div className={s.container}>
						<h2 className={s.title}>
							<span>Champ Remix</span>
						</h2>

						<div className={s.info}>
							LOL folder is
							<Tag
								closeable={!!lolDir}
								kind="accent"
								variant={VARIANT.light}
								onClick={onSelectDir}
								onActionClick={clearFolder}
							>
								<Tooltip content={lolDir && `Click to re-select.`}>
									{lolDir || `Click here to select`}
								</Tooltip>
							</Tag>
						</div>
						<div className={s.info}>
							LOL version is <Tag closeable={false} kind="accent">{version}</Tag>
						</div>

						<div className={s.sources}>
							{
								Object.values(Sources).map(v =>
									<Checkbox
										key={v}
										checked={selectedSources.includes(v)}
										onChange={onCheck(v)}
										overrides={{
											Checkmark: {
												style: ({ $checked, $theme }) => ({
													borderColor: $checked ? $theme.colors.positive : $theme.colors.primary,
													backgroundColor: $checked ? $theme.colors.positive : null,
												}),
											},
										}}
									>
										{v}
									</Checkbox>,
								)
							}
						</div>

						<div className={s.control}>
							<Button
								className={s.import}
								disabled={shouldDisableImport}
								isLoading={importing}
								onClick={importFromSources}
							>
								Import Now!
							</Button>

							<Checkbox
								className={s.keepOld}
								labelPlacement={LABEL_PLACEMENT.right}
								// eslint-disable-next-line
								checkmarkType={STYLE_TYPE.toggle}
								checked={keepOld}
								onChange={toggleKeepOldItems}
								overrides={{
									Root: {
										style: () => ({
											// ...$theme.borders.border100,
											display: `flex`,
											alignSelf: `flex-end`,
											marginLeft: `2ex`,
											marginBottom: `0.8ex`,
										}),
									},
									Checkmark: {
										style: ({ $checked, $theme }) => ({
											backgroundColor: $checked ? $theme.colors.primary50 : null,
										}),
									},
								}}
							>
								Keep old items
							</Checkbox>
						</div>

						{importing && <Progress />}

						<ToasterContainer
							autoHideDuration={1500}
							placement={PLACEMENT.bottom}
							overrides={{
								ToastBody: {
									style: () => ({
										backgroundColor: `#5383e8`,
									}),
								},
							}}
						/>
					</div>
				</BaseProvider>
			</StyletronProvider>
		</AppContext.Provider>
	);
};

export default App;
