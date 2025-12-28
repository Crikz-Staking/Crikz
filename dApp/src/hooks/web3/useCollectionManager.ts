import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI } from '@/config/index';

export interface Collection {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
}

export interface ItemMapping {
  [tokenId: string]: string; // tokenId -> collectionId
}

export function useCollectionManager() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  
  const [collections, setCollections] = useState<Collection[]>([]);
  const [itemMapping, setItemMapping] = useState<ItemMapping>({});
  const [soldTokenIds, setSoldTokenIds] = useState<Set<string>>(new Set());
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 1. Load Local State (Wallet Specific)
  useEffect(() => {
    if (!address) {
        setCollections([]); 
        return;
    }
    
    const storedCols = localStorage.getItem(`crikz_cols_${address}`);
    const storedMap = localStorage.getItem(`crikz_map_${address}`);

    if (storedCols) {
        setCollections(JSON.parse(storedCols));
    } else {
        // Initialize default if empty
        const defaults = [{ id: 'default', name: 'General', description: 'Unsorted items', isDefault: true }];
        setCollections(defaults);
        localStorage.setItem(`crikz_cols_${address}`, JSON.stringify(defaults));
    }

    if (storedMap) {
        setItemMapping(JSON.parse(storedMap));
    }
  }, [address]);

  // 2. Fetch Sales History
  useEffect(() => {
    if (!publicClient) return;
    
    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const logs = await publicClient.getContractEvents({
                address: NFT_MARKETPLACE_ADDRESS,
                abi: NFT_MARKETPLACE_ABI,
                eventName: 'ItemSold',
                fromBlock: 0n, 
            });

            const soldIds = new Set<string>();
            logs.forEach(log => {
                const tokenId = log.args.tokenId?.toString();
                if (tokenId) soldIds.add(tokenId);
            });
            
            setSoldTokenIds(soldIds);
        } catch (e) {
            console.error("Failed to fetch sales history", e);
        } finally {
            setLoadingHistory(false);
        }
    };

    fetchHistory();
  }, [publicClient]);

  // --- ACTIONS ---

  const saveCollections = (newCols: Collection[]) => {
      setCollections(newCols);
      if(address) localStorage.setItem(`crikz_cols_${address}`, JSON.stringify(newCols));
  };

  const saveMapping = (newMap: ItemMapping) => {
      setItemMapping(newMap);
      if(address) localStorage.setItem(`crikz_map_${address}`, JSON.stringify(newMap));
  };

  const createCollection = (name: string, description: string) => {
      const newCol = { id: `col_${Date.now()}`, name, description };
      saveCollections([...collections, newCol]);
      return newCol.id;
  };

  const editCollection = (id: string, name: string, description: string) => {
      saveCollections(collections.map(c => c.id === id ? { ...c, name, description } : c));
  };

  const deleteCollection = (id: string): { success: boolean, error?: string } => {
      const itemsInCol = Object.entries(itemMapping).filter(([_, colId]) => colId === id).map(([tid]) => tid);
      
      const hasSoldItems = itemsInCol.some(tid => soldTokenIds.has(tid));
      if (hasSoldItems) {
          return { success: false, error: "Cannot delete: Contains historically traded items." };
      }

      const newMap = { ...itemMapping };
      itemsInCol.forEach(tid => { newMap[tid] = 'default'; });
      
      saveMapping(newMap);
      saveCollections(collections.filter(c => c.id !== id));
      return { success: true };
  };

  const moveItem = (tokenId: string, targetColId: string): { success: boolean, error?: string } => {
      if (soldTokenIds.has(tokenId)) {
          return { success: false, error: "Item is immutable: Has been traded on market." };
      }
      const newMap = { ...itemMapping, [tokenId]: targetColId };
      saveMapping(newMap);
      return { success: true };
  };

  // Called by Minting Page
  const assignToCollection = (tokenId: string, collectionId: string) => {
      const newMap = { ...itemMapping, [tokenId]: collectionId };
      saveMapping(newMap);
  };

  const isItemLocked = (tokenId: string) => soldTokenIds.has(tokenId);

  return {
      collections,
      itemMapping,
      createCollection,
      editCollection,
      deleteCollection,
      moveItem,
      assignToCollection, // New Export
      isItemLocked,
      loadingHistory
  };
}