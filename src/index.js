export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        // API endpoint
        if (url.pathname === '/api/online') {
            return new Response(JSON.stringify({
                success: true,
                count: 0,
                duelists: [],
                timestamp: Date.now()
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // WebSocket endpoint
        if (url.pathname === '/ws') {
            const pair = new WebSocketPair();
            const [client, server] = Object.values(pair);
            
            server.accept();
            
            server.send(JSON.stringify({
                type: 'welcome',
                message: 'Connected to duel finder!',
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
        
        // Health check
        return new Response(JSON.stringify({
            status: 'alive',
            websocket: 'wss://duel-finder.YOUR_SUBDOMAIN.workers.dev/ws',
            api: 'https://duel-finder.YOUR_SUBDOMAIN.workers.dev/api/online'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
