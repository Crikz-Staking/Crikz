// src/lib/ipfs-service.ts

/**
 * IPFS Service Abstraction
 * Currently simulates IPFS storage via Local Object URLs and deterministic CID generation.
 * In production, swap `uploadToIPFS` content with a Pinata/Infura API call.
 */

// Simple hash function to generate "fake" CIDs for the demo
async function generateCID(content: string | ArrayBuffer): Promise<string> {
    const msgUint8 = typeof content === 'string' 
        ? new TextEncoder().encode(content) 
        : new Uint8Array(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    // Prefix to look like a V1 CID
    return `bafybeig${hashHex.substring(0, 50)}`;
}

export const uploadToIPFS = async (file: File | Blob): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            // Simulate network latency
            await new Promise(r => setTimeout(r, 1200));

            // Create a local URL for immediate display
            const objectUrl = URL.createObjectURL(file);
            
            // Generate a pseudo-CID based on content
            const arrayBuffer = await file.arrayBuffer();
            const cid = await generateCID(arrayBuffer);
            
            console.log(`[IPFS] Uploaded: ${cid} -> ${objectUrl}`);
            
            // In a real app, you would return `ipfs://${cid}`
            // For this demo, we return the objectUrl so the <img> tags work immediately 
            // without a gateway proxy, but normally you'd resolve the gateway in the component.
            resolve(objectUrl); 
        } catch (error) {
            console.error("IPFS Upload Error:", error);
            reject(error);
        }
    });
};

export const downloadFromIPFS = (uri: string) => {
    // Converts ipfs:// protocol to a gateway URL if necessary
    if (uri.startsWith('ipfs://')) {
        return uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }
    return uri;
};