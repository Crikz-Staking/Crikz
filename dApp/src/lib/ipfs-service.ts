// src/lib/ipfs-service.ts
import axios from 'axios';

/**
 * IPFS Service Implementation
 * Uploads data to IPFS via Pinata for permanent decentralized storage.
 */

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;

export const uploadToIPFS = async (file: File | Blob): Promise<string> => {
    // Safety Check: Ensure keys exist
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
        console.warn("⚠️ IPFS Keys missing. Check .env VITE_PINATA_API_KEY");
        throw new Error("IPFS Configuration Missing: API Keys not found.");
    }

    const formData = new FormData();
    formData.append('file', file);

    // Optional: Add metadata for easier organization in Pinata dashboard
    const metadata = JSON.stringify({
        name: `Crikzling_Memory_${Date.now()}`,
        keyvalues: {
            type: 'neural_snapshot',
            timestamp: Date.now()
        }
    });
    formData.append('pinataMetadata', metadata);

    // Optional: Pinata Options (CID Version 1 is standard for modern IPFS)
    const options = JSON.stringify({
        cidVersion: 1
    });
    formData.append('pinataOptions', options);

    try {
        const response = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            formData,
            {
                maxBodyLength: Infinity,
                headers: {
                    'Content-Type': `multipart/form-data;`,
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_API_SECRET
                }
            }
        );

        const cid = response.data.IpfsHash;
        console.log(`[IPFS] Upload Successful. CID: ${cid}`);
        return cid;

    } catch (error) {
        console.error("IPFS Upload Error:", error);
        throw new Error("Failed to upload memory block to IPFS.");
    }
};

export const downloadFromIPFS = (uri: string) => {
    if (!uri) return '';
    
    // Normalize IPFS Protocol
    if (uri.startsWith('ipfs://')) {
        return uri.replace('ipfs://', 'https://dweb.link/ipfs/');
    }
    
    // Handle raw CID
    if (!uri.startsWith('http')) {
        return `https://dweb.link/ipfs/${uri}`;
    }
    
    return uri;
};