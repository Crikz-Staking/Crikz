// src/lib/ipfs-service.ts

/**
 * IPFS Service
 * In a full production environment, this should connect to Pinata, Infura, or Web3.Storage.
 * For this dApp demo without a backend server, we simulate the Content Identifier (CID) generation
 * and use browser Blob URLs to serve content immediately.
 */

export const uploadToIPFS = async (file: File): Promise<string> => {
    // 1. Generate a pseudo-CID or valid Blob URL
    return new Promise((resolve) => {
        // Simulate network latency for realism
        setTimeout(() => {
            // For production: const formData = new FormData(); formData.append('file', file); ... fetch API ...
            
            // For this dApp: Use local blob URL which acts like a gateway URL
            const objectUrl = URL.createObjectURL(file);
            console.log(`[IPFS] Content hashed and stored: ${file.name}`);
            resolve(objectUrl); 
        }, 1500);
    });
};

export const downloadFromIPFS = (uri: string) => {
    // Converts ipfs:// protocol to a gateway URL if necessary
    if (uri.startsWith('ipfs://')) {
        return uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }
    return uri;
};