export class ListingRoom {
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.sessions = new Map();
        this.listings = [];
    }

    async fetch(request) {
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);
        
        server.accept();
        
        const sessionId = crypto.randomUUID();
        this.sessions.set(sessionId, server);
        
        server.send(JSON.stringify({
            type: 'welcome',
            sessionId: sessionId,
            onlineCount: this.sessions.size,
            message: 'Connected to listing server',
            timestamp: Date.now()
        }));
        
        server.send(JSON.stringify({
            type: 'existing_listings',
            listings: this.listings,
            timestamp: Date.now()
        }));
        
        this.broadcastOnlineCount();
        
        server.addEventListener('message', (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(sessionId, message);
            } catch (e) {
                server.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid JSON format',
                    timestamp: Date.now()
                }));
            }
        });
        
        server.addEventListener('close', () => {
            this.sessions.delete(sessionId);
            this.broadcastOnlineCount();
        });
        
        server.addEventListener('error', (error) => {
            console.error(`WebSocket error for ${sessionId}:`, error);
        });
        
        return new Response(null, {
            status: 101,
            webSocket: client
        });
    }

    handleMessage(sessionId, message) {
        const server = this.sessions.get(sessionId);
        if (!server) return;
        
        switch (message.type) {
            case 'new_listing':
                this.handleNewListing(sessionId, message.data, server);
                break;
                
            case 'ping':
                server.send(JSON.stringify({
                    type: 'pong',
                    timestamp: Date.now()
                }));
                break;
                
            case 'get_online':
                server.send(JSON.stringify({
                    type: 'onlineCount',
                    count: this.sessions.size,
                    timestamp: Date.now()
                }));
                break;
                
            case 'get_listings':
                server.send(JSON.stringify({
                    type: 'existing_listings',
                    listings: this.listings,
                    timestamp: Date.now()
                }));
                break;
        }
    }

    handleNewListing(sessionId, data, server) {
        if (!data) return;
        
        const listing = {
            id: crypto.randomUUID(),
            player: data.player || 'Unknown',
            brainrot: data.brainrot || 'Unknown',
            genText: data.genText || '',
            mutation: data.mutation || 'Mutations',
            timestamp: data.timestamp || Date.now(),
            postedBy: sessionId
        };
        
        this.listings.unshift(listing);
        if (this.listings.length > 50) {
            this.listings.pop();
        }
        
        this.broadcastToAll({
            type: 'new_listing',
            data: listing,
            timestamp: Date.now()
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

    broadcastOnlineCount() {
        this.broadcastToAll({
            type: 'onlineCount',
            count: this.sessions.size,
            timestamp: Date.now()
        });
    }
    }
