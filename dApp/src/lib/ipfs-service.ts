import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;

// Optimized Gateway List (Cloudflare & dweb are usually fastest for images)
export const IPFS_GATEWAYS = [
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/'
];

export const uploadToIPFS = async (file: File | Blob): Promise<string> => {
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
        throw new Error("IPFS Keys missing");
    }

    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({ name: `Crikz_Asset_${Date.now()}` });
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

export const getGatewayUrl = (uri: string, gatewayIndex: number = 0): string => {
    if (!uri) return '';
    if (uri.startsWith('http') || uri.startsWith('blob:')) return uri;
    const cid = uri.replace('ipfs://', '');
    const gateway = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
    return `${gateway}${cid}`;
};

export const fetchJSONFromIPFS = async (uri: string) => {
    if (!uri) return null;

    // Try up to 2 gateways for metadata
    for (let i = 0; i < 2; i++) {
        const url = getGatewayUrl(uri, i);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    return await res.json();
                } else {
                    // If it's not JSON, it's likely the raw image asset itself
                    // Return a dummy metadata object pointing to this URI as the image
                    return { 
                        name: "Raw Asset", 
                        description: "No metadata found.", 
                        image: uri 
                    };
                }
            }
        } catch (e) {
            continue;
        }
    }
    
    // If all fetches fail, assume the URI is the image itself
    return { 
        name: "Unknown Asset", 
        description: "Metadata unavailable.", 
        image: uri 
    };
};

export const resolveIPFS = (uri: string) => getGatewayUrl(uri, 0);