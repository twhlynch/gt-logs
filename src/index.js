export default {
	async fetch(request, env, ctx) {
		const headers = new Headers({
			'Content-Type': 'text/plain',
			'Access-Control-Allow-Origin': 'grab-tools.live',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		});

		let allowed = false;
		const origin = request.headers.get('Origin');
		const hostname = new URL(origin).hostname;
		const domain = hostname.split('.').slice(-2).join('.');
		if (domain == 'grab-tools.live' || domain == 'grabvr.tools') {
			headers.set('Access-Control-Allow-Origin', origin);
			allowed = true;
		}

		if (request.method === 'OPTIONS') {
			if (allowed) {
				return new Response(null, { headers });
			}
			return new Response('Not allowed', { headers, status: 403 });
		}

		if (request.method !== 'POST') {
			return new Response('Method Not Allowed', { headers, status: 405 });
		}

		if (request.headers.get('content-type') !== 'application/json') {
			return new Response('Unsupported Media Type', { headers, status: 415 });
		}

		try {
			const data = await request.json();
			const { action, user_id = null, user_name = null, level_id = null } = data;

			const actions = ['LOGIN', 'LOGOUT', 'MIMIC', 'DOWNLOAD', 'EDIT', 'BLOCKED'];
			const actionIndex = actions.indexOf(action.toUpperCase());
			if (actionIndex === -1) {
				return new Response('invalid action', { headers, status: 400 });
			}

			const timestamp = Math.floor(Date.now() / 1000 / 10);

			await env.gt_logs
				.prepare(
					`INSERT INTO logs (timestamp, action, user_id, user_name, level_id)
				VALUES (?, ?, ?, ?, ?)`,
				)
				.bind(timestamp, actionIndex, user_id, user_name, level_id)
				.run();

			return new Response('Success', { headers, status: 200 });
		} catch (err) {
			return new Response('Error: ' + err.message, { headers, status: 500 });
		}
	},
};
