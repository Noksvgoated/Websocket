import { ListingRoom } from './listing-room';

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
            
            const id = env.LISTING_ROOM.idFromName('global-room');
            const room = env.LISTING_ROOM.get(id);
            return room.fetch(request);
        }
        
        return new Response(JSON.stringify({
            status: 'alive'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export { ListingRoom };
