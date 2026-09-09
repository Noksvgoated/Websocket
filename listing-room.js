export class ListingRoom {
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.sessions = new Map();
    }

    async fetch(request) {
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);
        
        server.accept();
        
        const sessionId = crypto.randomUUID();
        this.sessions.set(sessionId, server);
        
        server.send(JSON.stringify({
            type: 'welcome',
            onlineCount: this.sessions.size,
            message: 'Connected!',
            timestamp: Date.now()
        }));
        
        this.broadcastToAll({
            type: 'onlineCount',
            count: this.sessions.size,
            timestamp: Date.now()
        });
        
        server.addEventListener('message', (event) => {
            try {
                const message = JSON.parse(event.data);
                
                if (message.type === 'new_listing') {
                    this.broadcastToAll({
                        type: 'new_listing',
                        data: message.data,
                        timestamp: Date.now()
                    });
                }
            } catch (e) {
                server.send('{"type":"error","message":"Invalid JSON"}');
            }
        });
        
        server.addEventListener('close', () => {
            this.sessions.delete(sessionId);
            this.broadcastToAll({
                type: 'onlineCount',
                count: this.sessions.size,
                timestamp: Date.now()
            });
        });
        
        return new Response(null, {
            status: 101,
            webSocket: client
        });
    }

    broadcastToAll(data) {
        const message = JSON.stringify(data);
        for (const [id, server] of this.sessions) {
            if (server.readyState === WebSocket.OPEN) {
                server.send(message);
            }
        }
    }
}
