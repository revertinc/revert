export interface UnifiedServer {
    id: string;
    name: string;
    additional: any;
}

export function unifyServer(server: any) {
   
    const unifiedServer: UnifiedServer = {
        id: server.id,
        name: server.name_normalized,
        additional: {},
    };

    // Map additional fields
    Object.keys(server).forEach((key) => {
        if (!(key in unifiedServer)) {
            unifiedServer['additional'][key] = server[key];
        }
    });
    
    return unifiedServer;
}