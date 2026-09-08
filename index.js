export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        if (url.pathname === '/api/online') {
            return new Response(JSON.stringify({
                success: true,
                count: 0,
                timestamp: Date.now()
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (url.pathname === '/ws') {
            const upgradeHeader = request.headers.get('Upgrade');
            if (upgradeHeader !== 'websocket') {
                return new Response('Expected WebSocket', { status: 426 });
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
