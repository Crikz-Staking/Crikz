import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI, CRIKZ_NFT_ADDRESS } from '@/config/index';
import { getAddress } from 'viem';

export interface Collection {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  contractAddress?: string; // If specific to a contract
  hasSales?: boolean; // Locked if true
}

// Key format: "contractAddress-tokenId"
export interface ItemMapping {
  [key: string]: string; // Maps to collectionId
}

export interface ImportedNFT {
  contract: string;
  tokenId: string;
}

export function useCollectionManager() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  
  const [collections, setCollections] = useState<Collection[]>([]);
  const [itemMapping, setItemMapping] = useState<ItemMapping>({});
  const [importedItems, setImportedItems] = useState<ImportedNFT[]>([]);
  const [soldItems, setSoldItems] = useState<Set<string>>(new Set());

  // 1. Load State
  useEffect(() => {
    if (!address) {
        setCollections([]);
        return;
    }
    
    const safeAddr = address.toLowerCase();
    const storedCols = localStorage.getItem(`crikz_cols_${safeAddr}`);
    const storedMap = localStorage.getItem(`crikz_map_${safeAddr}`);
    const storedImports = localStorage.getItem(`crikz_imports_${safeAddr}`);

    if (storedCols) {
        setCollections(JSON.parse(storedCols));
    } else {
        const defaults = [
            { id: 'default', name: 'General', description: 'Unsorted items', isDefault: true },
            { id: 'favs', name: 'Favorites', description: 'My top picks' }
        ];
        setCollections(defaults);
        localStorage.setItem(`crikz_cols_${safeAddr}`, JSON.stringify(defaults));
    }

    if (storedMap) setItemMapping(JSON.parse(storedMap));
    if (storedImports) setImportedItems(JSON.parse(storedImports));

  }, [address]);

  // 2. Index Sales History to Enforce Locks
  useEffect(() => {
    if (!publicClient) return;
    
    const checkSales = async () => {
        try {
            // Fetch past sales events
            const logs = await publicClient.getContractEvents({
                address: NFT_MARKETPLACE_ADDRESS,
                abi: NFT_MARKETPLACE_ABI,
                eventName: 'ItemSold',
                fromBlock: 0n,
            });

            const soldSet = new Set<string>();
            const collectionSales = new Set<string>();

            logs.forEach(log => {
                const contract = log.args.nftContract?.toLowerCase();
                const id = log.args.tokenId?.toString();
                if(contract && id) {
                    const key = `${contract}-${id}`;
                    soldSet.add(key);
                    
                    // Identify which local collection this item belonged to
                    const colId = itemMapping[key];
                    if(colId) collectionSales.add(colId);
                }
            });

            setSoldItems(soldSet);

            // Update collection lock status
            setCollections(prev => prev.map(c => ({
                ...c,
                hasSales: c.hasSales || collectionSales.has(c.id)
            })));

        } catch (e) {
            console.error("History Index Error", e);
        }
    };

    if (Object.keys(itemMapping).length > 0) {
        checkSales();
    }
  }, [publicClient, itemMapping]);

  // --- ACTIONS ---

  const save = (cols: Collection[], map: ItemMapping, imports: ImportedNFT[]) => {
      if(!address) return;
      const safeAddr = address.toLowerCase();
      setCollections(cols);
      setItemMapping(map);
      setImportedItems(imports);
      localStorage.setItem(`crikz_cols_${safeAddr}`, JSON.stringify(cols));
      localStorage.setItem(`crikz_map_${safeAddr}`, JSON.stringify(map));
      localStorage.setItem(`crikz_imports_${safeAddr}`, JSON.stringify(imports));
  };

  const createCollection = (name: string, description: string) => {
      const newCol = { id: `col_${Date.now()}`, name, description };
      save([...collections, newCol], itemMapping, importedItems);
      return newCol.id;
  };

  const editCollection = (id: string, name: string, description: string) => {
      const col = collections.find(c => c.id === id);
      if (col?.hasSales) {
          throw new Error("Cannot edit collection with trade history");
      }
      const newCols = collections.map(c => c.id === id ? { ...c, name, description } : c);
      save(newCols, itemMapping, importedItems);
  };

  const deleteCollection = (id: string) => {
      const col = collections.find(c => c.id === id);
      if (col?.isDefault) return;
      if (col?.hasSales) throw new Error("Cannot delete collection with trade history");

      // Move items to default
      const newMap = { ...itemMapping };
      Object.keys(newMap).forEach(key => {
          if (newMap[key] === id) newMap[key] = 'default';
      });

      const newCols = collections.filter(c => c.id !== id);
      save(newCols, newMap, importedItems);
  };

  const moveItem = (contract: string, tokenId: string, targetColId: string) => {
      const key = `${contract.toLowerCase()}-${tokenId}`;
      
      if (soldItems.has(key)) {
          throw new Error("Item has been traded. It is now locked to its collection.");
      }

      const newMap = { ...itemMapping, [key]: targetColId };
      save(collections, newMap, importedItems);
  };

  const importNFT = async (contract: string, tokenId: string) => {
      if (!publicClient || !address) return;
      
      // 1. Verify Ownership
      try {
          const owner = await publicClient.readContract({
              address: contract as `0x${string}`,
              abi: [{ name: 'ownerOf', type: 'function', inputs: [{name:'tokenId',type:'uint256'}], outputs: [{name:'',type:'address'}], stateMutability: 'view' }],
              functionName: 'ownerOf',
              args: [BigInt(tokenId)]
          }) as string;

          if (getAddress(owner) !== getAddress(address)) {
              throw new Error("You do not own this NFT");
          }

          // 2. Add to imports
          const newImport = { contract: contract.toLowerCase(), tokenId: tokenId.toString() };
          // Prevent dupes
          if (importedItems.some(i => i.contract === newImport.contract && i.tokenId === newImport.tokenId)) {
              throw new Error("Already imported");
          }

          const newImports = [...importedItems, newImport];
          
          // 3. Assign to default collection
          const key = `${newImport.contract}-${newImport.tokenId}`;
          const newMap = { ...itemMapping, [key]: 'default' };

          save(collections, newMap, newImports);
          return true;

      } catch (e: any) {
          throw new Error(e.message || "Invalid Contract or ID");
      }
  };

  // Helper for Minting Page
  const assignMintedItem = (tokenId: string, colId: string) => {
      const key = `${CRIKZ_NFT_ADDRESS.toLowerCase()}-${tokenId}`;
      const newMap = { ...itemMapping, [key]: colId };
      save(collections, newMap, importedItems);
  };

  const isLocked = (contract: string, tokenId: string) => {
      return soldItems.has(`${contract.toLowerCase()}-${tokenId}`);
  };

  return {
      collections,
      itemMapping,
      importedItems,
      createCollection,
      editCollection,
      deleteCollection,
      moveItem,
      importNFT,
      assignMintedItem,
      isLocked
  };
}