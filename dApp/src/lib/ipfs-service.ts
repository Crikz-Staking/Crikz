// src/lib/ipfs-service.ts
import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;

// Public Gateways (Ordered by reliability/speed)
export const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/'
];

/**
 * Uploads a file to IPFS via Pinata
 */
export const uploadToIPFS = async (file: File | Blob): Promise<string> => {
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
        console.warn("⚠️ IPFS Keys missing. Check .env VITE_PINATA_API_KEY");
        throw new Error("IPFS Configuration Missing");
    }

    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
        name: `Crikz_Asset_${Date.now()}`,
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({ cidVersion: 1 });
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
        return response.data.IpfsHash;
    } catch (error) {
        console.error("IPFS Upload Error:", error);
        throw new Error("Failed to upload to IPFS.");
    }
};

/**
 * Resolves an IPFS URI to a HTTP URL using the primary gateway.
 * Use this for simple display where fallback isn't handled by a component.
 */
export const resolveIPFS = (uri: string) => {
    if (!uri) return '';
    if (uri.startsWith('http')) return uri;
    const cid = uri.replace('ipfs://', '');
    return `${IPFS_GATEWAYS[0]}${cid}`;
};

/**
 * Robustly fetches JSON metadata from IPFS by trying multiple gateways.
 */
export const fetchJSONFromIPFS = async (uri: string) => {
    if (!uri) return null;

    // 1. Try direct if it's already HTTP
    if (uri.startsWith('http')) {
        try {
            const res = await fetch(uri);
            if (res.ok) return await res.json();
        } catch (e) { 
            // If direct http fails, check if it contains a CID we can extract
            // e.g. https://ipfs.io/ipfs/Qm... -> extract Qm...
        }
    }

    // 2. Extract CID
    // Matches CIDv0 (Qm...) or CIDv1 (bafy...)
    const cidMatch = uri.match(/(Qm[1-9A-HJ-NP-Za-km-z]{44,}|baf[0-9a-z]{50,})/);
    if (!cidMatch) return null;
    
    const cid = cidMatch[0];

    // 3. Try Gateways
    for (const gateway of IPFS_GATEWAYS) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout per gateway

            const res = await fetch(`${gateway}${cid}`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            continue; // Try next gateway
        }
    }
    
    console.warn(`Failed to fetch metadata for CID: ${cid}`);
    return null;
};

export const downloadFromIPFS = resolveIPFS; // Alias for backward compatibility