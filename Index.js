import { ListingRoom } from './listing-room';

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        // API endpoint (protected)
        if (url.pathname === '/api/online') {
            const key = url.searchParams.get('key');
            if (key !== env.SHOPIFY_SECRET_KEY) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Invalid secret key'
                }), { 
                    status: 401, 
                    headers: { 'Content-Type': 'application/json' } 
                });
            }
            
            return new Response(JSON.stringify({
                success: true,
                count: 0,
                timestamp: Date.now()
            }), { 
                headers: { 'Content-Type': 'application/json' } 
            });
        }
        
        // WebSocket endpoint (protected)
        if (url.pathname === '/ws') {
            const upgradeHeader = request.headers.get('Upgrade');
            if (upgradeHeader !== 'websocket') {
                return new Response('Expected WebSocket', { status: 426 });
            }
            
            const key = url.searchParams.get('key');
            if (key !== env.SHOPIFY_SECRET_KEY) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Invalid secret key'
                }), { 
                    status: 401, 
                    headers: { 'Content-Type': 'application/json' } 
                });
            }
            
            const id = env.LISTING_ROOM.idFromName('global-listing-room');
            const room = env.LISTING_ROOM.get(id);
            return room.fetch(request);
        }
        
        // Health check (public)
        return new Response(JSON.stringify({
            status: 'alive',
            protected: true
        }), { 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
};

export { ListingRoom };
