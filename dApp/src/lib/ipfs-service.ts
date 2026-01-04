import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;

// High-performance public gateways
export const IPFS_GATEWAYS = [
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://4everland.io/ipfs/',
  'https://w3s.link/ipfs/',
  'https://gateway.pinata.cloud/ipfs/'
];

/**
 * Uploads a file to IPFS via Pinata
 */
export const uploadToIPFS = async (file: File | Blob): Promise<string> => {
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
        throw new Error("IPFS Keys missing in .env");
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
 * Converts an IPFS URI (ipfs://...) or CID to a usable HTTP URL
 * using the specified gateway index.
 */
export const getGatewayUrl = (uri: string, gatewayIndex: number = 0): string => {
    if (!uri) return '';
    
    // If it's already HTTP/HTTPS, return as is
    if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('blob:')) {
        return uri;
    }

    // Strip ipfs:// prefix if present
    const cid = uri.replace('ipfs://', '');
    
    // Use the gateway
    const gateway = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
    return `${gateway}${cid}`;
};

/**
 * Fetches JSON metadata. 
 * Handles cases where the URI might point to an image directly instead of JSON.
 */
export const fetchJSONFromIPFS = async (uri: string) => {
    if (!uri) return null;

    // Try up to 3 gateways
    for (let i = 0; i < 3; i++) {
        const url = getGatewayUrl(uri, i);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    return await res.json();
                } else {
                    // It's not JSON (likely an image minted directly as URI)
                    // Return a constructed metadata object pointing to this URL as the image
                    console.warn("Token URI is not JSON, assuming direct image link:", url);
                    return { 
                        name: "Raw Asset", 
                        description: "Metadata not found, displaying raw asset.", 
                        image: uri // Keep original URI for IPFSImage to handle rotation
                    };
                }
            }
        } catch (e) {
            // Continue to next gateway
        }
    }
    return null;
};

export const resolveIPFS = (uri: string) => getGatewayUrl(uri, 0);