import React, { useContext } from 'react';

import AppContext from 'src/share/context';

export default () => {
	const { store: { fetching } } = useContext(AppContext);

	if (!fetching.length)
		return <pre>
				<code>No fetching</code>
			</pre>;

	return <div>
		<h3>Fetching({fetching.length} left)</h3>
		<ul>
			{
				fetching.map(i => <li key={ i }>
					{ i }
				</li>)
			}
		</ul>
	</div>;
}
