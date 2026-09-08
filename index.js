export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        // API endpoint
        if (url.pathname === '/api/online') {
            const key = url.searchParams.get('key');
            if (key !== env.SHOPIFY_SECRET_KEY) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Invalid password'
                }), { status: 401 });
            }
            
            return new Response(JSON.stringify({
                success: true,
                count: 0,
                timestamp: Date.now()
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // WebSocket endpoint
        if (url.pathname === '/ws') {
            const upgradeHeader = request.headers.get('Upgrade');
            if (upgradeHeader !== 'websocket') {
                return new Response('Expected WebSocket', { status: 426 });
            }
            
            const key = url.searchParams.get('key');
            if (key !== env.SHOPIFY_SECRET_KEY) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Invalid password'
                }), { status: 401 });
            }
            
            const pair = new WebSocketPair();
            const [client, server] = Object.values(pair);
            
            server.accept();
            
            server.send(JSON.stringify({
                type: 'welcome',
                message: 'Connected!',
                timestamp: Date.now()
            }));
            
            server.addEventListener('message', (event) => {
                server.send(event.data);
            });
            
            return new Response(null, {
                status: 101,
                webSocket: client
            });
        }
        
        return new Response(JSON.stringify({
            status: 'alive'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
