# 🔱 Decentralized Production & Yield Ecosystem

 🌍 **Website(dApp)** Coming Soon

📘 **Facebook** [https://www.facebook.com/crikztoken](https://www.facebook.com/crikztoken)

🐦**X/Twitter** [https://x.com/CrikzToken](https://x.com/CrikzToken)

💻**GitHub:** [https://github.com/Crikz-Staking/Crikz](https://github.com/Crikz-Staking/Crikz)

💬 **Telegram** Coming soon

🎮 **Discord** Coming soon



**License:** [Custom Non-Commercial](./LICENSE) 📜

---

## 🇬🇧 

## 🚀 Project Roadmap 📅

| Phase | Tasks | Status | Key Focus |
| :--- | :--- | :---: | :--- |
| **Contract Core** 🧠 | Architecture design, core logic implementation, and **Integration Testing** | ✅ | Security & Logic |
| **Branding** 🎨 | Naming, logo design, theme selection, social community setup, and legal prep | ⏳ | Community Foundation |
| **DApp Development** 💻 | Frontend setup, UI/UX implementation, optimizations, and contract integration | ⏳ | User Interface |
| **Testnet** 🧪 | BSC Testnet Launch, community testing, and feedback integration | ⏳ | Blockchain Validation |
| **Audit & Fix** 🛡️ | Audit firm selection, code review, and security fixes | ⏳ | Validation & Visibility |
| **Launch** 🚀 | Marketing campaigns, Mainnet deployment of contracts and dApp | ⏳ | Public Launch |
| **Expansion** 📈 | Integration of **NFT Market**, **Blockchain Games**, and ecosystem components | ⏳ | Growth & Utility |

---

## 🏭 What is Crikz? (For Future Producers)

Crikz is a decentralized yield protocol designed for long-term holders. We transform idle tokens into a **Decentralized Production Asset** that constantly generates yield. Instead of simple staking, you initiate a **Production Order**, committing tokens to generate new **tokens** (yield) every second.

### 🌟 The Core Production Mechanism

1.  **Start a Production Order (`createOrder`):** This is your commitment. By locking your Crikz tokens for a chosen duration (**Tier**), you initiate a production cycle. Longer commitment times unlock higher Tiers and more efficient production rates.
2.  **Reputation (Production Efficiency):** Your Reputation score is your weighted stake in the system.  It determines your share of the network's total **Product Distribution Pool**. Commitment duration and the amount of tokens locked are the primary drivers for boosting your Reputation.
3.  **The Production Fund (The Treasury):** The generated yield (**Products**) is paid from a fully transparent, self-sustaining **Production Fund**. This fund is continuously refilled by ecosystem activity (trading taxes, early termination penalties) to guarantee system longevity.
4.  **The Guarantee:** Upon the expiry of your Production Order, you retrieve your full principal deposit plus all generated Products (yield).

---

### 🛠️ Production Commands: Managing Your Yield

These are the simple actions you can perform to manage your decentralized production:

| Command | Concept | Action & Outcome |
| :--- | :--- | :--- |
| **1. Create Order** (`createOrder`) 🏁 | **Commitment** | Lock tokens for a chosen Tier. Instantly credits your **Reputation** and starts yield generation. |
| **2. Claim Products** (`claimProducts`) 💸 | **Harvesting** | Collect the accrued **Products** (yield) since your last harvest. Products are sent directly to your wallet. The Order remains active and continues to produce. |
| **3. Expand Order** (`expandOrder`) 🔄 | **Compounding** | Reinvest your claimed Products back into the active Order. Your principal deposit and **Reputation** are instantly boosted, increasing your future production rate without extending the lock time. |
| **4. Complete Order** (`completeOrder`) ✅ | **Finalization** | Finalize the Order after its lock duration has expired. Your original principal deposit and all remaining Products are unlocked and returned to your wallet. |
| **5. Terminate Early** (`terminateJob`) 🚨 | **Emergency Exit** | Force-close an Order before expiry (for emergency liquidity). **Cost:** A penalty of **1.618%** of the principal is deducted, and all generated Products are forfeited to the Production Fund. |

---

### 💰 Sustaining the Fund: Fees and Penalties

The Crikz Production Fund is sustained by a meticulous fee structure based on the **1.618% Golden Ratio** fee.

| Source | Rate | Mechanism | Benefit to the Fund |
| :--- | :--- | :--- | :--- |
| **Exchange Tax (Buy/Sell)** | **1.618%** | Applied only when Crikz tokens are traded on a recognized Decentralized Exchange (DEX). *Excludes* standard wallet-to-wallet transfers. | Ensures a steady, scalable replenishment stream driven by trading volume. |
| **Early Termination Penalty** | **1.618%** | Deducted from the principal amount if an Order is closed prematurely. | Recycles tokens back into the production pool, rewarding committed, long-term producers. |
| **Forfeited Products** | **100%** | All unclaimed Products (yield) from an early termination are immediately forfeit. | Maintains the fund's integrity and prevents undue drain from premature withdrawals. |

> **Important:** The DEX tax system is dynamically controlled by the Owner to ensure fees are only applied during active trading on registered exchanges, maximizing P2P transfer efficiency.

---

### 📊 Production Tiers: Commitment Rewards

Your potential yield is directly tied to your commitment level. Longer lock-up periods grant a higher `Reputation Multiplier`, boosting your overall share of the Production Fund.

**Reputation Formula:**
$$\text{Reputation} = \frac{\text{Tokens Locked} \times \text{Tier Multiplier}}{10^{18}}$$

| Tier ID | Production Title | Lock Duration | Multiplier | Production Efficiency |
| :---: | :--- | :---: | :---: | :--- |
| **0** | **Apprentice** | 5 Days | **0.618x** | Low commitment, quick cycle |
| **1** | **Journeyman** | 13 Days | **0.787x** | Short-term commitment |
| **2** | **Specialist** | 34 Days | **1.001x** | Standard commitment level |
| **3** | **Expert** | 89 Days | **1.273x** | Mid-term strategic production |
| **4** | **Master** | 233 Days | **1.619x** | High commitment, significant boost |
| **5** | **Grandmaster** | 610 Days | **2.059x** | Long-term dedicated yield |
| **6** | **Legend** | 1597 Days | **2.618x** | Maximum commitment, highest efficiency |

---

### 💻 Smart Contract Architecture (For Developers)

| Icon | File/Directory | Description |
| :---: | :--- | :--- |
| 📝 | `contracts/Crikz.sol` | **The Core Engine.** ERC20 logic, the `_transfer` override for the dynamic DEX tax, and all public production management functions (`createOrder`, `completeOrder`, etc.). Includes **Pausable** and **ReentrancyGuard**. |
| 📚 | `contracts/libraries/ | Centralized math logic and companions, defining the `1.618%` constants, the `6.182%` Base APR, and efficient calculation methods. |
| 🌐 | `dApp/` | The frontend source code for the user interface. |
| 🧪 | `test/` | Comprehensive testing suite using Hardhat and Ethers.js. |

---
---
---

## 🇦🇱 Përkthimi Shqip

## 🚀 Plani i Projektit (Roadmap) 📅

| Faza | Detyrat | Statusi | Qëllimi |
| :--- | :--- | :---: | :--- |
| **Bërthama e Kontratës** 🧠 | Dizajni i arkitekturës, zbatimi i logjikës bazë, dhe **Testimi i Integrimit** | ✅ | Siguria & Logjika |
| **Brendimi** 🎨 | Emërtimi, dizajni i logos, zgjedhja e temës, krijimi i komunitetit dhe përgatitja ligjore | ⏳ | Themelimi i Komunitetit |
| **Zhvillimi i DApp** 💻 | Krijimi i ndërfaqes (frontend), zbatimi i UI/UX, optimizimet dhe integrimi me kontratat | ⏳ | Ndërfaqja e Përdoruesit |
| **Rrjeti Testues** 🧪 | Lançimi në Rrjetin Testues (BSC Testnet), testimi nga komuniteti dhe integrimi i reagimeve | ⏳ | Vërtetimi në Blockchain |
| **Auditimi & Korrigjimet** 🛡️ | Përzgjedhja e studios së auditimit, rishikimi i kodit dhe rregullimet e sigurisë | ⏳ | Validimi & Transparenca |
| **Lançimi** 🚀 | Fushata e Marketingut dhe publikimi i kontratave me dApp në Rrjetin Kryesor (Mainnet) | ⏳ | Lançimi Publik |
| **Zgjerimi** 📈 | Integrimi i **Tregut NFT**, **Lojërave Blockchain**, dhe komponentëve të tjerë të Ekosistemit | ⏳ | Rritja & Dobishmëria |

---

## 🏭 Çfarë është Crikz? (Për Prodhuesit e Ardhshëm)

Crikz është një protokoll fitimi i decentralizuar i krijuar për mbajtësit afatgjatë. Ne i shndërrojmë tokenat pasive në një **Aset Prodhimi të Decentralizuar** që gjeneron fitim vazhdimisht. Në vend të angazhimit të thjeshtë, ju filloni një **Porosi Prodhimi**, duke angazhuar tokena për të gjeneruar **Produkte** të reja (fitim) çdo sekondë.

### 🌟 Mekanizmi Kryesor i Prodhimit

1.  **Krijo një Porosi Prodhimi (`createOrder`):** Ky është angazhimi juaj. Duke bllokuar tokenat tuaj Crikz për një kohëzgjatje të zgjedhur (**Nivel**), ju filloni një cikël prodhimi. Kohëzgjatjet më të gjata të angazhimit zhbllokojnë Nivele më të larta dhe norma prodhimi më efikase.
2.  **Reputacioni (Efikasiteti i Prodhimit):**  Rezultati juaj i Reputacionit është pjesa juaj e peshuar në sistem. Ai përcakton pjesën tuaj të totalit të **Fondit të Shpërndarjes së Produkteve** të rrjetit. Kohëzgjatja e angazhimit dhe sasia e tokenave të bllokuar janë drejtuesit kryesorë për rritjen e Reputacionit tuaj.
3.  **Fondi i Prodhimit (Thesari):** Fitimi i gjeneruar (**Produktet**) paguhet nga një **Fond Prodhimi** plotësisht transparent, i vetë-qëndrueshëm. Ky fond rimbushet vazhdimisht nga aktiviteti i ekosistemit (taksat e tregtimit, penalitetet e ndërprerjes së parakohshme) për të garantuar jetëgjatësinë e sistemit.
4.  **Garancia:** Pas skadimit të Porosisë suaj të Prodhimit, ju merrni mbrapsht depozitën tuaj kryesore të plotë plus të gjitha Produktet (fitimin) e gjeneruara.

---

### 🛠️ Komandat e Prodhimit: Menaxhimi i Fitimit Tuaj

Këto janë veprimet e thjeshta që mund të kryeni për të menaxhuar prodhimin tuaj të decentralizuar:

| Komanda | Koncepti | Veprimi dhe Rezultati |
| :--- | :--- | :--- |
| **1. Krijo Porosi** (`createOrder`) 🏁 | **Angazhimi** | Bllokoni tokenat për një Nivel të zgjedhur. Menjëherë kreditohet **Reputacioni** juaj dhe fillon gjenerimi i fitimit. |
| **2. Kërko Produkte** (`claimProducts`) 💸 | **Korja** | Mblidhni **Produktet** e akumuluara (fitimin) që nga korja juaj e fundit. Produktet dërgohen direkt në kuletën tuaj. Porosia mbetet aktive dhe vazhdon të prodhojë. |
| **3. Zgjero Porosinë** (`expandOrder`) 🔄 | **Riinvestimi** | Riinvestoni Produktet tuaja të fituara në Porosinë aktive. Depozita juaj kryesore dhe **Reputacioni** rriten menjëherë, duke rritur normën tuaj të prodhimit të ardhshëm pa zgjatur kohën e bllokimit. |
| **4. Përfundo Porosinë** (`completeOrder`) ✅ | **Finalizimi** | Finalizoni Porosinë pasi të ketë skaduar kohëzgjatja e bllokimit. Depozita juaj origjinale dhe të gjitha Produktet e mbetura zhbllokohen dhe kthehen në kuletën tuaj. |
| **5. Ndërpre Para Kohe** (`terminateJob`) 🚨 | **Dalja Emergjente** | Mbyllni me forcë një Porosi para skadimit (për likuiditet emergjent). **Kostoja:** Një penalitet prej **1.618%** i shumës kryesore zbritet, dhe të gjitha Produktet e gjeneruara humbasin për Fondin e Prodhimit. |

---

### 💰 Mbështetja e Fondit: Tarifat dhe Penalitetet

Fondi i Prodhimit Crikz mbahet nga një strukturë tarifash e përpiktë e bazuar në tarifën e **Raportit të Artë 1.618%**.

| Burimi | Norma | Mekanizmi | Përfitimi për Fondin |
| :--- | :--- | :--- | :--- |
| **Taksa e Këmbimit (Blerje/Shitje)** | **1.618%** | Zbatohet vetëm kur tokenat Crikz tregtohen në një Këmbim të Decentralizuar (DEX) të njohur. *Përjashton* transfertat standarde nga kuleta në kuletë. | Siguron një rrymë të qëndrueshme, të shkallëzueshme rimbushjeje të drejtuar nga vëllimi i tregtimit. |
| **Penaliteti i Ndërprerjes së Parakohshme** | **1.618%** | Zbritet nga shuma kryesore nëse një Porosi mbyllet para kohe. | Riciklon tokenat përsëri në fondin e prodhimit, duke shpërblyer prodhuesit e angazhuar, afatgjatë. |
| **Produktet e Humbura** | **100%** | Të gjitha Produktet e pambledhura (fitimi) nga një ndërprerje e parakohshme humbasin menjëherë. | Mban integritetin e fondit dhe parandalon shterimin e panevojshëm nga tërheqjet e parakohshme. |

> **E Rëndësishme:** Sistemi i taksave DEX kontrollohet në mënyrë dinamike nga Pronari për të siguruar që tarifat të aplikohen vetëm gjatë tregtimit aktiv në këmbimet e regjistruara, duke maksimizuar efikasitetin e transfertave P2P.

---

### 📊 Nivelet e Prodhimit: Shpërblimet e Angazhimit

Fitimi juaj potencial është drejtpërdrejt i lidhur me nivelin tuaj të angazhimit. Periudhat më të gjata të bllokimit japin një `Shumëzues Reputacioni` më të lartë, duke rritur pjesën tuaj të përgjithshme në Fondin e Prodhimit.

**Formula e Reputacionit:**
$$\text{Reputacioni} = \frac{\text{Tokenat e Bllokuar} \times \text{Shumëzuesi i Nivelit}}{10^{18}}$$

| Niveli | Titulli i Prodhimit | Kohëzgjatja | Shumëzuesi | Efikasiteti i Prodhimit |
| :---: | :--- | :---: | :---: | :--- |
| **0** | **Apprentice (Mësimdhënës)** | 5 Ditë | **0.618x** | Angazhim i ulët, cikël i shpejtë |
| **1** | **Journeyman (Udhëtar)** | 13 Ditë | **0.787x** | Angazhim afatshkurtër |
| **2** | **Specialist** | 34 Ditë | **1.001x** | Nivel standard i angazhimit |
| **3** | **Expert (Ekspert)** | 89 Ditë | **1.273x** | Prodhimi strategjik afatmesëm |
| **4** | **Master (Mjeshtër)** | 233 Ditë | **1.619x** | Angazhim i lartë, nxitje e konsiderueshme |
| **5** | **Grandmaster (Grandmjeshtër)** | 610 Ditë | **2.059x** | Fitim i dedikuar afatgjatë |
| **6** | **Legend (Legjendë)** | 1597 Ditë | **2.618x** | Angazhimi maksimal, efikasiteti më i lartë |

---

### 💻 Arkitektura e Kontratës Smart (Për Zhvilluesit)

| Ikona | Dosja/Direktoria | Përshkrimi |
| :---: | :--- | :--- |
| 📝 | `contracts/Crikz.sol` | **Motori Kryesor.** Logjika ERC20, anulimi i `_transfer` për taksën dinamike DEX, dhe të gjitha funksionet publike të menaxhimit të prodhimit (`createOrder`, `completeOrder`, etj.). Përfshin **Pausable** (Pezullueshmëria) dhe **ReentrancyGuard** (Mbrojtja nga Ri-hyrja). |
| 📚 | `contracts/libraries/CrikzMath.sol` | Logjika e centralizuar e matematikës, duke përcaktuar konstantet `1.618%`, APR-në Bazë `6.182%`, dhe metodat efikase të llogaritjes. |
| 📚 | `contracts/libraries/SalaryDistributor.sol` | Menaxhon llogaritjen e brendshme të **Fondit të Prodhimit** dhe logjikën e shpërndarjes në bazë të kohës për gjenerimin e fitimit. |
| 🌐 | `dApp/` | Kodi burimor i ndërfaqes për përdoruesin. |

| 🧪 | `test/` | Paketa e testimit gjithëpërfshirës duke përdorur Hardhat dhe Ethers.js. |





