/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
// Cloudflare Workers - DeepSeek API 请求处理
export default {
	async fetch(request, env, ctx) {
		// 处理 CORS 预检请求
		if (request.method === 'OPTIONS') {
			return this.handleOptions(request);
		}

		// 只允许POST请求
		if (request.method !== 'POST') {
			return new Response('Method not allowed', { status: 405 });
		}

		try {
			// 从环境变量获取DeepSeek API密钥
			const DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY;

			if (!DEEPSEEK_API_KEY) {
				return new Response(JSON.stringify({
					error: 'DeepSeek API key not configured'
				}), {
					status: 500,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
						'Access-Control-Allow-Methods': 'POST, OPTIONS',
						'Access-Control-Allow-Headers': 'Content-Type',
					}
				});
			}

			// 解析请求体
			const requestBody = await request.json();

			// 设置默认参数
			const payload = {
				model: requestBody.model || 'deepseek-chat',
				messages: requestBody.messages || [
					{ role: 'user', content: 'Hello!' }
				],
				max_tokens: requestBody.max_tokens || 1000,
				temperature: requestBody.temperature || 0.7,
				stream: requestBody.stream || false,
				...requestBody // 允许覆盖默认参数
			};

			// 请求DeepSeek API
			const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload)
			});

			// 获取响应数据
			const responseData = await deepseekResponse.json();

			// 返回成功响应
			return new Response(JSON.stringify(responseData), {
				status: deepseekResponse.status,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				}
			});

		} catch (error) {
			// 错误处理
			return new Response(JSON.stringify({
				error: 'Internal server error',
				message: error.message
			}), {
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
				}
			});
		}
	},

	// 处理CORS预检请求  
	async handleOptions(request) {
		return new Response(null, {
			status: 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				'Access-Control-Max-Age': '86400', // 24小时缓存预检请求
			}
		});
	}
};