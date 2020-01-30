import React, { useContext } from 'react';
import AppContext from '../../context';

export default () => {
	const { store: { fetching } } = useContext(AppContext);

	if (!fetching.length)
		return <pre>
				<code>No fetching</code>
			</pre>;

	return <div>
		<ul>
			{
				fetching.map(i => <li key={ i }>
					{ i }
				</li>)
			}
		</ul>
	</div>;
}
