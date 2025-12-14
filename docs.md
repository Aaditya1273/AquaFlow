How to estimate gas in Arbitrum
Looking for Stylus guidance?
Head over to the Stylus gas docs for Stylus-specific guidance.

This how-to is intended for users and developers interested in understanding how gas operates in Arbitrum, how it's calculated, and how to estimate it before submitting transactions. More detailed information about these calculations can be found in this Medium article and the Gas and Fees page.

Skip the formula, focus on practical know-how
Before diving into the specifics and the formula, if you're looking for a practical way to estimate gas for your transaction, you can rely on the standard gas estimation process. This can be achieved by calling an Arbitrum node's eth_estimateGas, which provides a value (gas limit) that should sufficiently cover the entire transaction fee at the specified child chain gas price.

Multiplying the value obtained from eth_estimateGas by the child chain gas price will give you the total amount of Ether required for the transaction to be successful. It's important to note that, for a specific operation, the result of eth_estimateGas value may vary over time due to fluctuations in the parent chain calldata price, see below to learn why!

Alternatively, to obtain the gas limit for your transaction, you can call NodeInterface.gasEstimateComponents() and then use the first result, which is gasEstimate. Next, to find the total cost, you need to multiply this amount by the child chain gas price, which is available in the third result, baseFee.

Note that when working with parent to child chain messages (also known as retryable tickets), you can use the function L1ToL2MessageGasEstimator.estimateAll() of the Arbitrum SDK or NodeInterface.estimateRetryableTicket() to get all the gas information needed to send a successful transaction.

Breaking down the formula
We'll now break down the formula mentioned in the Medium article, moving then to where to get the information of each variable, and finally seeing an example of how to apply the formula in your code as well as other practical ways of estimating gas costs.

However, if you want to jump straight to the code, we have created this script in our tutorials repository that goes through all the calculations explained in this how-to.

As explained in the Medium article, the transaction fees to pay at any given moment are the result of the following product:

Transaction fees (TXFEES) = L2 Gas Price (P) * Gas Limit (G)

This Gas Limit includes the gas of the child chain computation and an additional buffer to cover the parent chain gas to be paid by the Sequencer when posting the batch including this transaction on the parent chain.

Gas Limit (G) = Gas used on L2 (L2G) + Extra Buffer for L1 cost (B)

This buffer takes into account the cost of posting the transaction, batched and compressed, on the parent chain. The parent chain estimated posting cost is calculated by multiplying these two values:

L1S, which estimates the amount of data the transaction will take up in the batch by compressing the transaction with Brotli.
L1P, which is the child chain's estimated view of the current parent chain's price of data (per byte), which the child chain dynamically adjusts over time.
More information is available in this page.

L1 Estimated Cost (L1C) = L1 price per byte of data (L1P) * Size of data to be posted in bytes (L1S)

To calculate the buffer, that estimated cost is divided by the child chain Gas Price.

Extra Buffer (B) = L1 Estimated Cost (L1C) / L2 Gas Price (P)

Finally, using all of the above elements, the formula can be written as follows:

TXFEES = P * (L2G + ((L1P * L1S) / P))

Where do we get all this information from?
We'll use one resource available in Arbitrum: the NodeInterface.

P (L2 Gas Price) ⇒ Price to pay for each gas unit. It starts at 0.01 gwei on Arbitrum One (0.01 gwei on Arbitrum Nova) and can increase depending on the demand for network resources.
Call NodeInterface.GasEstimateComponents() and get the third element, baseFee.
L2G (Gas used on L2) ⇒ Gas used to compute the transaction on the child chain. This does not include the “posting on L1” part of the calculations. The value of L2G will depend on the transaction itself, but having the data of the transaction, we can calculate it as follows:
Call NodeInterface.GasEstimateComponents() with the transaction data and subtract the second element (gasEstimateForL1, which estimates the parent chain part of the fees) from the first (gasEstimate, which includes both the parent and the child chain parts).
L1P (L1 estimated price per byte of data) ⇒ Estimated cost of posting 1 byte of data on the parent chain:
Call NodeInterface.GasEstimateComponents(), get the fourth element l1BaseFeeEstimate and multiply it by 16.
L1S (Size of data to be posted on L1, in bytes) ⇒ This will depend on the data of the transaction. Keep in mind that Arbitrum adds a fixed amount to this number to make up for the static part of the transaction, which is also posted on the parent chain (140 bytes). We can do a small calculation to obtain this value: call NodeInterface.GasEstimateComponents() take the second element, gasEstimateForL1 (this is equivalent to B in our formula), multiply it by P and divide it by L1P.
For Arbitrum Nova (AnyTrust), the size of the data is also a fixed value, as only the Data Availability Certificate (DAC) is posted on the parent chain, as explained here.
note
For L1P and L1S, you can also call NodeInterface.gasEstimateL1Component() to get l1BaseFeeEstimate and gasEstimateForL1

An example of how to apply this formula in your code
Finally, we show an example of how to get the values we just described and how to estimate the gas usage of a transaction in Javascript. We'll use our SDK to connect to the NodeInterface.

We first instantiate a factory object for the NodeInterface, using two methods from the SDK. l2Provider is a regular JSON RPC provider for the child chain network we are using, and NODE_INTERFACE_ADDRESS is the addresses that we need to call to access the NodeInterface methods in said network.

const { NodeInterface__factory } = require("@arbitrum/sdk/dist/lib/abi/factories/NodeInterface__factory");
const { NODE_INTERFACE_ADDRESS } = require("@arbitrum/sdk/dist/lib/dataEntities/constants");

...

// Instantiation of the NodeInterface object
const nodeInterface = NodeInterface__factory.connect(
    NODE_INTERFACE_ADDRESS,
    baseL2Provider
);

For this example, we'll use the method NodeInterface.gasEstimateComponents() to get the information we need. For the gasEstimateComponents() call, we'll pass a destinationAddress (this should be the address that you intend to call in your transaction) and the data we want to send, to get results as accurate as possible. You can also specify a different block number (in hex) in the object passed as the last parameter.

// Getting the gas prices from ArbGasInfo.getPricesInWei()
const gasComponents = await arbGasInfo.callStatic.getPricesInWei();

// And the estimations from NodeInterface.GasEstimateComponents()
const gasEstimateComponents = await nodeInterface.callStatic.gasEstimateComponents(
  destinationAddress,
  false,
  txData,
  {
    blockTag: 'latest',
  },
);

With this, we can now get the values of the four variables we'll use in our formula:

// Getting useful values for calculating the formula
const l1GasEstimated = gasEstimateComponents.gasEstimateForL1;
const l2GasUsed = gasEstimateComponents.gasEstimate.sub(gasEstimateComponents.gasEstimateForL1);
const l2EstimatedPrice = gasEstimateComponents.baseFee;
const l1EstimatedPrice = gasEstimateComponents.l1BaseFeeEstimate.mul(16);

// Calculating some extra values to be able to apply all variables of the formula
// -------------------------------------------------------------------------------
// NOTE: This one might be a bit confusing, but l1GasEstimated (B in the formula) is calculated based on l2 gas fees
const l1Cost = l1GasEstimated.mul(l2EstimatedPrice);
// NOTE: This is similar to 140 + utils.hexDataLength(txData);
const l1Size = l1Cost.div(l1EstimatedPrice);

// Setting the basic variables of the formula
const P = l2EstimatedPrice;
const L2G = l2GasUsed;
const L1P = l1EstimatedPrice;
const L1S = l1Size;

And finally, we estimate the transaction fees applying the formula described in the beginning:

// L1C (L1 Cost) = L1P * L1S
const L1C = L1P.mul(L1S);

// B (Extra Buffer) = L1C / P
const B = L1C.div(P);

// G (Gas Limit) = L2G + B
const G = L2G.add(B);

// TXFEES (Transaction fees) = P * G
const TXFEES = P.mul(G);

Refer to our tutorials repository for a working example of this code.

Final note
Note that gas estimations from the above techniques are approximate and the actual gas fees may differ. We encourage developers to set this expectation explicitly wherever this information is shared with end-users.






Arbitrum chains overview
Arbitrum chains are Child chain solutions built on top of the Ethereum Blockchain, designed to increase scalability and reduce Transaction costs. In this conceptual overview, we’ll learn about the different Arbitrum Chains and how they relate to each other. We’ll describe the available Arbitrum production and testnet chains, their differences, and the technology stacks that these chains use.

What Arbitrum production chains are available?
Arbitrum One
Arbitrum One is a child chain Optimistic Rollup chain that implements the Arbitrum Rollup Protocol and settles to Ethereum's Parent chain. It lets you build high-performance Ethereum dApps with low transaction costs and Ethereum-grade security guarantees, introducing no additional trust assumptions. This is made possible by the Nitro technology stack, a "Geth-at-the-core" architecture that gives Arbitrum One (and Nova) advanced calldata compression, separate contexts for common execution and fault proving, Ethereum parent chain gas compatibility, and more.

Arbitrum Nova
Arbitrum Nova is a high-performance alternative to Arbitrum One's chain. While Arbitrum One implements the purely Trustless Rollup protocol, Arbitrum Nova implements the mostly trustless AnyTrust protocol. The key difference between Rollup and AnyTrust is that the AnyTrust protocol introduces an additional trust assumption in the form of a Data Availability Committee (DAC). This committee (detailed below) is responsible for expediting the process of storing, batching, and posting child chain transaction data to Ethereum's parent chain. This lets you use Arbitrum in scenarios that demand performance and affordability, while Arbitrum One is optimal for scenarios that demand Ethereum's pure trustlessness.

What Arbitrum testnet chains are available?
Arbitrum Sepolia
Arbitrum Sepolia serves as a testnet chain replicating the capabilities of Arbitrum One's main network. Linked to the Sepolia testnet, it offers developers a secure platform to experiment with and evaluate their smart contracts prior to actual deployment on the mainnet.

Arbitrum Goerli
Arbitrum Goerli was a testnet chain that mirrored the functionality of the Arbitrum One mainnet and was connected to the Ethereum Goerli testnet. It was deprecated on November 18th 2023, and deactivated on March 18th, 2024.

caution
The old testnet RinkArby was deprecated on December 20th, 2022.

Stylus testnet
Stylus uses the Nitro technology and allows for efficient Smart Contract creation using languages like Rust, C, and C++. Leveraging Arbitrum's EVM equivalence, Stylus contracts achieve remarkable speed and low gas fees. With full interoperability between Solidity and Stylus contracts, new horizons emerge, while significantly cheaper memory costs unlock novel blockchain use cases.

caution
Stylus testnet was deprecated as of June 17, 2024.

What differences there are between the available Arbitrum chains?
The main differences between the Arbitrum chains lie in their purpose and the environment they operate in.

Arbitrum One and Arbitrum Nova are production chains designed for real-world use. They're connected to the Ethereum mainnet and handle real, valuable transactions. They both use Arbitrum's Nitro technology stack under the hood, but Arbitrum One implements the Rollup protocol, while Nova implements the AnyTrust protocol. Arbitrum One is designed for general use, providing a scalable and cost-effective solution for running Ethereum-compatible smart contracts. On the other hand, Arbitrum Nova is designed for applications that require a higher transaction throughput and don’t require the full decentralization that rollups provide.

Finally, Arbitrum Sepolia is a testnet chain. It's designed for testing purposes and is connected to the Sepolia testnet, which uses test Ether with no real-world value.

What technology stacks use the Arbitrum chains?
Nitro
Nitro is the technology that powers Arbitrum One, Arbitrum Nova (with AnyTrust configuration),and Arbitrum Sepolia. It's designed to offer high throughput and low cost, making it ideal for scaling Ethereum applications. Nitro is a major upgrade to the “Classic” stack, offering several improvements including advanced calldata compression, separate contexts for common execution and fault proving, Ethereum parent chain gas compatibility, and more. You can find more information about Nitro in How Arbitrum works.

AnyTrust (variant of Nitro)
AnyTrust is a variant of the Nitro technology stack that lowers costs by accepting a mild trust assumption. The AnyTrust protocol relies on an external Data Availability Committee (DAC) to store data and provide it on demand. The DAC has N members, of which AnyTrust assumes at least two are honest. Keeping the data offchain in the happy/common case means the system can charge the user significantly lower fees. You can find more information about AnyTrust in Anytrust protocol.

Classic (deprecated)
The Classic technology stack is the original version of Arbitrum. It has been deprecated and replaced by the Nitro technology stack.

Conclusion
Understanding the different Arbitrum chains and their technology stacks is crucial for developers working on blockchain and Web3 applications. Each chain offers a unique set of features and benefits, making them suitable for different use cases. By choosing the right chain and technology stack, developers can ensure their applications are secure, scalable, and cost-effective.






Cross-chain messaging overview
The Arbitrum protocol and related tooling makes it easy for developers to build cross-chain applications; i.e., applications that involve sending messages from Ethereum to an Arbitrum chain, and/or from an Arbitrum chain to Ethereum.

Ethereum-to-Arbitrum messaging
Arbitrary parent to child chain contract calls can be created via the Inbox's createRetryableTicket method; upon publishing the parent chain transaction, the child chain side will typically get included within minutes. Commonly, the child chain execution will automatically succeed, but if reverts, and it can be rexecuted via a call to the redeem method of the ArbRetryableTx precompile.

For details and protocol specification, see Parent to child chain messages.

For an example of retryable tickets in action, see the Greeter tutorial, which uses the Arbitrum SDK.

Arbitrum-to-Ethereum messaging
Similarly, child chain contracts can send Arbitrary messages for execution on the parent chain. These are initiated via calls to the ArbSys precompile contract's sendTxToL1 method. Upon confirmation (about one week later), they can execute by retrieving the relevant data via a call to NodeInterface contract's constructOutboxProof method, and then executing them via the Outbox's executeTransaction method.

For details and protocol specification, see Child to parent chain messages.

For a demo, see the Outbox Tutorial.





SDK support for custom gas token Arbitrum chains
Arbitrum SDK is a TypeScript library for client-side interactions with Arbitrum. It provides common helper functionality as well as access to the underlying smart contract interfaces.

Custom gas token APIs
Custom gas token support in the Arbitrum SDK introduces a suite of APIs designed for the specific purpose of facilitating bridging operations. These APIs are tailored for use cases where there is a need to transfer a native token or an ERC-20 token from the parent chain to an Arbitrum chain utilizing a custom gas token. The process involves an initial step of authorizing the native token on the parent chain. To streamline this, our APIs provide functionalities for token approval and offer a mechanism to verify the current status of this approval. Detailed below is a guide to how each of these APIs can be effectively utilized for distinct purposes:

EthBridger Context:

APIs: getApproveGasTokenRequest and approveGasToken.
Purpose: These APIs are essential for the bridging of native tokens to the Arbitrum chain. They facilitate the necessary approval for native tokens, allowing contracts to manage fund movements. This process includes escrowing a specified amount of the native token on the parent chain and subsequently bridging it to the Arbitrum chain.
note
You should use EthBridger when bridging the native token between the parent chain and the Arbitrum chain.

Erc20Bridger Context:
APIs: getApproveGasTokenRequest and approveGasToken.
Purpose: In the scenario of bridging ERC-20 assets to an Arbitrum chain, these APIs play a crucial role. Token Bridging on Arbitrum Nitro stack uses retryable tickets and needs a specific fee to be paid for the creation and redemption of the ticket. For more information about retryable tickets, please take a look at our chapter about retryable tickets part of our docs. The Arbitrum chain operates as a custom gas token network, necessitating the payment of fees in native tokens for the creation of retryable tickets and their redemption on the Arbitrum chain. To cover the submission and execution fees associated with retryable tickets on the Arbitrum chain, an adequate number of native tokens must be approved and allocated to the parent chain to cover the fees.
Important Notes
You should use Erc20Bridger when bridging an ERC-20 token between the parent chain and the Arbitrum chain.
These APIs are just needed for custom gas token Arbitrum chains and for ETH-powered rollup and AnyTrust Arbitrum chains, you don't need to use them.
When native tokens are transferred to the custom gas token Arbitrum chain, they function equivalently to ETH on EVM chains. This means these tokens will exhibit behavior identical to that of ETH, the native currency on EVM chains. This similarity in functionality is a key feature to consider in transactions and operations within the Arbitrum chain.
everything else is under the hood, and the custom gas token code paths will be executed just if the L2Network object config has a nativeToken field.
Registering a custom token in the Token Bridge
When registering a custom token in the Token Bridge of a custom-gas-token Arbitrum chain, there's an additional step to perform before calling registerTokenToL2.

Since the Token Bridge router and the generic-custom gateway expect to have allowance to transfer the native token from the msg.sender() to the inbox contract, it's usually the token in the parent chain who handles those approvals. In the TestCustomTokenL1, we offer as an example of implementation. We see that the contract transfers the native tokens to itself and then approves the router and gateway contracts. If we follow that implementation, we only need to send an approval transaction to the native token to allow the TestCustomTokenL1 to transfer the native token from the caller of the registerTokenToL2 function to itself.

You can find a tutorial that deploys two tokens and registers them in the Token Bridge of a custom-gas-token-based chain.




Differences between Arbitrum and Ethereum: Overview
Arbitrum's design is to be as compatible and consistent with Ethereum as possible, from its high-level RPCs to its low-level bytecode and everything in between. Decentralized app developers with experience building on Ethereum will likely find that little to no new specific knowledge is required to build on Arbitrum.

This article outlines the key differences, benefits, and potential pitfalls that devs should be aware of when working with Arbitrum. This first page serves as an outline, with links to the relevant pages.

STF in Ethereum
In Ethereum, the STF receives transactions as inputs, processes them via the EVM, and produces the final state as output.

The Ethereum state is a vast data structure represented by a modified Merkle Patricia Trie. This structure holds all accounts, linking them via hashes and reducing the entire state to a single root hash stored on the blockchain.

The Ethereum Virtual Machine (EVM) operates similarly to a mathematical function: given an input, it produces a deterministic output. Ethereum's STF encapsulates this behavior:

Y
(
S
,
T
)
=
S
′
Y(S,T)=S 
′
 
Here, S represents the current state, T denotes the transaction, and S' is the new state resulting from the execution of T.

The EVM operates as a stack machine with a maximum depth of 1024 items. Each item is a 256-bit word, chosen for compatibility with 256-bit cryptography (e.g., Keccak-256 hashes and secp256k1 signatures).

During execution, the EVM uses transient memory (a word-addresses byte array) that only persists for the duration of a transaction. In contrast, each contract maintains a persistent Merkle Patricia storage trie–a word-addressable word array–that forms part of the global state.

smart contract bytecode compiles into a series of EVM opcodes that perform standard stack operations (such as XOR, AND, ADD, SUB) and blockchain-specific operations (such as ADDRESS, BALANCE, BLOCKHASH).

Geth (go-Ethereum) is one of the primary client implementations of Ethereum, serving as the practical embodiment of both the STF and the EVM execution engine. It processes transactions by executing the smart contract's bytecode and updating the global state, ensuring that every state change is deterministic and secure.

In essence, Geth converts transaction inputs into precise computational steps within the EVM, maintaining the intricate data structures that underpin Ethereum's blockchain. Its robust design not only powers the core operations of Ethereum but also provides the foundation for advanced modificaitons in platforms like the Arbitrum Nitro stack.

STF on Arbitrum
The Arbitrum Nitro stack implements a modified version of Ethereum's STF. While it retains the core principles of Ethereum, several Arbitrum-specific features and processes distinguish it from Ethereum's implementation. Key differences include:

Block numbers and time
Time in Arbitrum chains is tricky. The timing assumptions one is used to making about Ethereum blocks don't exactly carry over into the timing of Arbitrum blocks. See Block numbers and time for details about how block numbers and time work in Arbitrum.

RPC methods
Although the majority of RPC methods follow the same behavior as Ethereum, some methods may produce a different result or add additional information when used on an Arbitrum chain. You can find more information about these differences in RPC methods.

Solidity support
You can deploy Solidity contracts onto Arbitrum just like you do on Ethereum. There are only a few minor functional differences. For more information, refer to Solidity support.

Gas accounting
The fees for executing an Arbitrum transaction function similarly to gas fees on Ethereum. However, Arbitrum transactions must also pay a fee component to cover the cost of posting their calldata to the parent chain (for example, calldata on Arbitrum One, a child chain, is posted to Ethereum, a parent chain). Find more information about the two components of gas fees in Gas and fees and parent chain pricing.

Base fee mechanism
Arbitrum chains support arbitrary message passing from a parent chain (e.g., Ethereum) to a child chain (e.g., Arbitrum One). These messages are commonly referred to as "parent chain to child chain messages." Developers using this functionality should familiarize themselves with how messaging works. For more information, refer to Parent chain to child chain messaging.

Similarly, Arbitrum chains can also send messages to the parent chain—more information about this is available in Child Chain to Parent Chain Messaging and the Outbox.

Arbitrum chains support arbitrary message passing from a parent chain (for example, a parent chain like Ethereum) to a child chain (for example, a child chain like Arbitrum One or Arbitrum Nova). These are commonly known as "parent chain to child chain messages". Developers using this functionality should familiarize themselves with how they work. Find more information about it in Parent chain to child chain messaging.

Similarly, Arbitrum chains can also send messages to the parent chain. Find more information about them in Child chain to parent chain messaging and the outbox.

Precompiles
Besides supporting all precompiles available in Ethereum, Arbitrum provides child chain-specific precompiles with methods that smart contracts can call in the same way as Solidity functions. You can find a full reference to them on the Precompiles page.

NodeInterface
The Arbitrum Nitro software includes a special NodeInterface contract, available at address 0xc8, that is only accessible via RPCs (deployed offchain, making it inaccessible to smart contracts). Find more information about this interface in NodeInterface.



Block gas limit, numbers and time
block number vs block.number
Throughout this and other pages, we note that the block number of a chain does not match the value obtained from block.number. When using block.number in a smart contract, the value obtained will be the block of the first non-Arbitrum ancestor chain. That is:

Ethereum, if the chain is a Layer 2 (L2) chain on top of Ethereum, or a Layer 3 (L3) chain on top of an Arbitrum chain
The parent chain, if it's not Ethereum or an Arbitrum chain (for example, a chain that settles to Base)
As with Ethereum, Arbitrum clients submit transactions, and the system executes them later. In Arbitrum, clients submit transactions by posting messages to the Ethereum chain, either through the Sequencer or via the chain's Delayed Inbox.

Once in the chain's core inbox contract, transaction processing occurs in order. Generally, some time will elapse between when a message is put into the inbox (and timestamped) and when the contract processes the message and carries out the transaction requested by the message.

Additionally, since the calldata/blobs of Arbitrum transactions (or the DAC certificate on AnyTrustchains) is posted to Ethereum, the gas paid when executing them includes a component for the parent chain to cover the costs of the batch poster.

This page explains the implications of this mechanism for the block gas limit, block numbers, and the time assumptions associated with transactions submitted to Arbitrum.

Block gas limit
When submitting a transaction to Arbitrum, users incur fees for both the execution cost on Arbitrum and the cost of posting its calldata to Ethereum. Managing the dual cost structure involves adjusting the transaction's gas limit to reflect these two dimensions, resulting in a higher gas limit value than would be seen for pure execution.

The gas limit of an Arbitrum block is set to the sum of all transaction gas limits, including the costs associated with posting parent chain data. To accommodate potential variations in parent chain costs, Arbitrum assigns an artificially large gas limit (1,125,899,906,842,624) for each block. However, the effective execution gas limit has a cap of 32 million. This cap means that, although the visible gas limit may appear very high, the actual execution costs are constrained within this limit. Understanding this distinction helps clarify why querying a block might show an inflated gas limit that doesn't match the effective execution costs.

For a more detailed breakdown of the gas model, refer to this article on Arbitrum's 2-dimensional fee structure.

Block numbers: Arbitrum vs. Ethereum
Arbitrum blocks are assigned their own child chain block numbers, distinct from Ethereum's block numbers.

A single Ethereum block can include multiple Arbitrum blocks; however, an Arbitrum block cannot span across multiple Ethereum blocks. Thus, any given Arbitrum transaction is associated with exactly one Ethereum block and one Arbitrum block.

Ethereum (or parent chain) block numbers within Arbitrum
Accessing block numbers within an Arbitrum smart contract (i.e., block.number in Solidity) will return a value close to (but not necessarily exactly) the block number of the first non-Arbitrum ancestor chain where the sequencer received the transaction.

The "first non-Arbitrum ancestor chain" is:

Ethereum, if the chain is an L2 chain on top of Ethereum, or an L3 chain on top of an Arbitrum chain
The parent chain, if it's not Ethereum or an Arbitrum chain (for example, a chain that settles to Base)
// some Arbitrum contract:
block.number // => returns the approximate block number of the first non-Arbitrum ancestor chain

As a general rule, any timing assumptions a contract makes about block numbers and timestamps should be considered generally reliable in the longer term (i.e., on the order of at least several hours) but unreliable in the shorter term (minutes). (These are generally the same assumptions one should operate under when using block numbers directly on Ethereum!)

EIP-2935 difference
EIP-2935 adds another way to retrieve block hashes by making a call to a contract. The contract is at the same address and has the same interface as the original. It was modified to have a larger buffer and different code, but it remains usable in the same way to retrieve past L2 block hashes.

Arbitrum block numbers
Arbitrum blocks have their own block numbers, starting at 0 at the Arbitrum genesis block and updating sequentially.

ArbOS and the sequencer are responsible for delineating when one Arbitrum block ends and the next one begins. However, block creation depends entirely on chain usage, meaning that block production only occurs when there are transactions to sequence. In active chains, one can expect to see Arbitrum blocks produced at a relatively steady rate. In less active chains, block production might be sporadic depending on the rate at which transactions are received.

A client that queries an Arbitrum node's RPC interface (e.g., transaction receipts) will receive the transaction's Arbitrum block number as the standard block number field. The block number of the first non-Arbitrum ancestor chain will also be included in the added l1BlockNumber field.

const txnReceipt = await arbitrumProvider.getTransactionReceipt('0x...');
/** 
    txnReceipt.l1BlockNumber => Approximate block number of the first non-Arbitrum ancestor chain
*/

The Arbitrum block number can also be retrieved within an Arbitrum contract via ArbSys precompile:

ArbSys(100).arbBlockNumber() // returns Arbitrum block number

Example
The following example illustrates timings on a chain that settles to Ethereum (similar to Arbitrum One), although it also applies to L3 chains that settle to an Arbitrum chain.

Wall clock time	12:00 am	12:00:15 am	12:00:30 am	12:00:45 am	12:01 am	12:01:15 am
Ethereum block.number	1000	1001	1002	1003	1004	1005
Chain's block.number *	1000	1000	1000	1000	1004	1004
Chain's block number (from RPCs) **	370000	370005	370006	370008	370012	370015
Info
txnReceipt.blockNumber => Arbitrum block number

_* The chain's block.number: updated to sync with Ethereum's block.number every 13 to 15 seconds (occasionally longer).

** Chain's block number from RPCs: note that this can be updated multiple times per Ethereum block (this lets the sequencer give sub-Ethereum-block-time transaction receipts.)

Case study: the Multicall contract
The Multicall contract provides a valuable case study for the differences between various block numbers.

The canonical implementation of Multicall returns the value of block.number. When used out of the box, some applications may exhibit unintended behavior.

You can find a version of the adapted Multicall2 deployed on Arbitrum One at 0x842eC2c7D803033Edf55E478F461FC547Bc54EB2.

By default, the getBlockNumber, tryBlockAndAggregate, and aggregate functions return the child chain block number. This function allows you to use this value to compare your state against the tip of the chain.

The getL1BlockNumber function is queriable if applications need to surface the block number of the first non-Arbitrum ancestor chain.

Block timestamps: Arbitrum vs. Ethereum
Block timestamps on Arbitrum are not linked to the timestamp of the parent chain block. They are updated every child chain block based on the sequencer's clock. These timestamps must follow these two rules:

Must always be equal to or greater than the previous child chain block timestamp
Must fall within the established boundaries (24 hours earlier than the current time or one hour in the future). More on this below.
Furthermore, for transactions that are force-included from the parent chain (bypassing the Sequencer), the block timestamp will be equal to either the parent chain timestamp when the transaction was put in the Delayed Inbox on the parent chain (not when it was force-included), or the child chain timestamp of the previous child chain block, whichever of the two timestamps is greater.

Timestamp boundaries of the sequencer
As mentioned, block timestamps are usually set based on the sequencer's clock. Because there's a possibility that the Sequencer fails to post batches on the parent chain (i.e., Ethereum) for a period of time, it should have the ability to slightly adjust the timestamp of the block to account for those delays and prevent any potential reorganizations of the chain. To limit the degree to which the Sequencer can adjust timestamps, some boundaries are set, currently to 24 hours earlier than the current time, and one hour in the future.




RPC methods
Although the majority of RPC methods follow the same behavior as in Ethereum, some methods may produce a different result or add more information when used on an Arbitrum chain. This page covers the differences in response body fields you'll find when calling RPC methods on an Arbitrum chain vs on Ethereum.

info
Comprehensive documentation on all generally available JSON-RPC methods for Ethereum can be found at ethereum.org. As Arbitrum has go-ethereum at its core, most of the documented methods there can be used with no modifications.

Transactions
When calling eth_getTransactionByHash and other methods that return a transaction, Arbitrum includes a few additional fields and leverages some existing fields in different ways than Ethereum.

Transaction types
In addition to the three transaction types currently supported on Ethereum, Arbitrum adds additional types listed below and documented in full detail here.

On RPC calls that return transactions, the type field will reflect the custom codes where applicable.

Transaction type code	Transaction type name	Description
100	ArbitrumDepositTxType	Used to deposit ETH from a parent chain to a child chain via the Arbitrum bridge
101	ArbitrumUnsignedTxType	Used to call a child chain contract from a parent chain, originated by a user through the Arbitrum bridge
102	ArbitrumContractTxType	Used to call a child chain contract from a parent chain, originated by a contract through the Arbitrum bridge
104	ArbitrumRetryTxType	Used to manually redeem a retryable ticket on a child chain that failed to execute automatically (usually due to low gas)
105	ArbitrumSubmitRetryableTxType	Used to submit a retryable ticket via the Arbitrum bridge on the parent chain
106	ArbitrumInternalTxType	Internal transactions created by the ArbOS itself for certain state updates, like the parent chain base fee and the block number
Additional fields
On RPC calls that return transactions, the following fields are added to the returned object.

Field name	Description
requestId	On parent to child chain transactions, this field is added to indicate position in the Inbox queue
Existing fields with different behavior
On RPC calls that return transactions, the following fields will have different content than what's received on Ethereum.

Field name	Description
from	On parent to child chain transactions, this field will contain the aliased version of the parent chain's msg.sender
Transaction receipts
When calling eth_getTransactionReceipt, Arbitrum includes a few additional fields and leverages some existing fields in different ways than Ethereum.

Additional fields
On RPC calls that return transaction receipts, the following fields are added to the returned object.

Field name	Description
l1BlockNumber	The block number of the first non-Arbitrum ancestor chain that is usable for block.number calls. More information in Block numbers and time
gasUsedForL1	The amount of gas spent on parent chain calldata in units of child chain gas. More information in Gas and fees
Blocks
When calling eth_getBlockByHash and other methods that return a block, Arbitrum includes a few additional fields and leverages some existing fields in different ways than Ethereum.

Additional fields
On RPC calls that return a block, the following fields are added to the returned object.

Field name	Description
l1BlockNumber	An approximate block number of the first non-Arbitrum ancestor chain that occurred before this child chain block. More information in Block numbers and time
sendCount	The number of child-to-parent chain messages since Nitro genesis
sendRoot	The Merkle root of the outbox tree state
Existing fields with different behavior
On RPC calls that return a block, the following fields will have different content than what's received on Ethereum.

Field name	Description
extraData	This field is equivalent to sendRoot
mixHash	First 8 bytes are equivalent to sendCount, second 8 bytes are equivalent to l1BlockNumber
difficulty	Fixed at 0x1
gasLimit	Value is fixed at 0x4000000000000, but it's important to note that Arbitrum One currently has a 32M gas limit per block. See Chain params for the gas limit of other chains
Other methods that are slightly different
eth_syncing
Calling eth_syncing returns false when the node is fully synced (just like on Ethereum). If the node is still syncing, eth_syncing returns an object with data about the synchronization status. Here, we provide more details.

Understanding messages, batches, and blocks
Nitro nodes receive transactions from their parent chain and the sequencer feed in the form of messages. These messages may contain multiple transactions that are executed by the node, which then produces blocks. Each message produces exactly one block. In most Nitro chains, the message number and the block number are the same. However, Arbitrum One has pre-Nitro (classic) blocks, so for that chain, message 0 produced block 22207818 (blocks before that one are 'classic' blocks). Keep in mind that the offset between the message and block number remains constant throughout the chain.

On the parent chain, messages appear in batches. The number of messages per batch changes between batches.

Custom eth_syncing fields
info
Note that the exact output for the eth_syncing RPC call of an out-of-sync Nitro node is not considered a stable API. It is still being actively developed and can be modified without notice between versions.

Field name	Description
batchSeen	Last batch number observed on the parent chain
batchProcessed	Last batch that was processed on the parent chain. Processing means dividing the batch into messages
messageOfProcessedBatch	Last message in the last processed batch
msgCount	Number of messages known/queued by the Nitro node
blockNum	Last block created by the Nitro node (up-to-date child chain block the node is synced to)
messageOfLastBlock	Message that was used to produce the block above
broadcasterQueuedMessagesPos	If different than 0, this is expected to be greater than msgCount. This field notes a message that was read from the feed but not processed because earlier messages are still missing
lastL1BlockNum	Last block number of the first non-Arbitrum ancestor chain that Nitro sees. This is for debugging the connection with the parent chain
lastl1BlockHash	Last block hash from the parent chain that Nitro sees. This is for debugging the connection with the parent chain
Potential, but not expected error
If the sync process encounters an error while trying to collect the data above this error will be added to the response.

Understanding common scenarios
If batchSeen > batchProcessed, some batches have still not been processed
If msgCount > messageOfLastBlock, some messages have been processed, but not all relevant blocks have been built (this is usually the longest stage while syncing a new node)
If broadcasterQueuedMessagesPos > msgCount, the feed is ahead of the last message known to the node
debug_traceTransaction
 The Nitro node provides a native tracer for debugging Stylus contracts called stylusTracer, which returns a JSON array with objects containing the metadata for each executed HostIO. HostIOs are calls the WasmVM makes to read and write data in the EVM. With the result of this tracer and the code for the Stylus contract, you have all the data to understand what happened in a Stylus transaction.
info
The cargo-stylus command-line tool uses the stylusTracer to replay transactions locally inside a debugger. More information can be found on How to debug Stylus transactions using Cargo Stylus Replay.

The table below describes each field of the stylusTracer return value.

Field Name	Description
name	Name of the executing HostIO.
args	Arguments of the HostIO encoded as hex.
outs	Outputs of the HostIO encoded as hex.
startInk	Amount of Ink before executing the HostIO.
endInk	Amount of Ink after executing the HostIO.
address	For call HostIOs, the address of the called contract.
steps	For call HostIOs, the steps performed by the called contract.
For example, the command below illustrates how to call this tracer for a transaction:

curl -s \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"debug_traceTransaction","params":["<transaction-hash>", {"tracer": "stylusTracer"}],"id":1}' \
    <nitro-node-rpc>

The result of this call will be something along the lines of:

{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "args": "0x00000024",
      "endInk": 116090000,
      "name": "user_entrypoint",
      "outs": "0x",
      "startInk": 116090000
    },
    {
      "args": "0x",
      "endInk": 116057558,
      "name": "msg_reentrant",
      "outs": "0x00000000",
      "startInk": 116065958
    },
    {
      "args": "0x",
      "endInk": 115937952,
      "name": "read_args",
      "outs": "0x6c5283490000000000000000000000003bdff922e18bc03f1cf7b2a8b65a070cbec944f2",
      "startInk": 115951512
    },
    ...
  ]
}




Solidity support
Arbitrum chains are Ethereum-compatible and, therefore, allow you to trustlessly deploy Solidity smart contracts, as well as contracts written in Vyper or any other language that compiles to EVM bytecode. However, when calling certain properties and functions on a Solidity smart contract, there are some differences between the result you'd obtain if that contract were on Ethereum and the result on Arbitrum.

This page compiles a list of functions and properties that return a different result when called in Arbitrum.

Differences from Solidity on Ethereum
Although Arbitrum supports Solidity code, there are differences in the effects of a few operations, including language features that don't make sense in the child chain context.

Operation	Description
blockhash(x)	Returns a cryptographically insecure, pseudo-random hash for x within the range block.number - 256 <= x < block.number. If x is outside of this range, blockhash(x) will return 0. This hash includes blockhash(block.number), which always returns 0 just like on Ethereum. The returned hashes do not come from the parent chain. ⚠️ Arbitrum's child chain block hashes should not be relied on as a secure source of randomness.
block.coinbase	Returns the designated internal address 0xA4b000000000000000000073657175656e636572 if a sequencer posted the message. If it's a delayed message, it returns the address of the delayed message's poster (Note: the handling of delayed message's block.coinbase will likely be changed in a future ArbOS version).
block.difficulty	Returns the constant 1.
block.prevrandao	Returns the constant 1.
block.number	Returns an "estimate" of the block number of the first non-Arbitrum ancestor chain at which the sequencer received the transaction. For more information, see Block numbers and time.
msg.sender	Works the same way it does on Ethereum for regular child chain to child chain transactions. For transactions submitted via the delayed inbox, it will return the child chain address alias of the parent chain contract that triggered the message. For more information, see address aliasing.
OPCODE PUSH0	This OPCODE was added as part of ArbOS 11 and is now supported.




Oracles
note
This is a conceptual overview of oracles. For more detailed information on how to use oracles in your applications, check out our third-party oracles documentation.

In this conceptual overview, we'll explore oracles, how they work, and some general applications. This overview will provide a foundational understanding and set expectations for developers who want to integrate oracles into their applications.

What are oracles?
Oracles are third-party services that provide smart contracts with external information. They act as a bridge between blockchains and the outside world, which expands their functionality by enabling smart contracts to access data beyond their native networks.

Types of oracles
Oracles can be classified based on their source, direction of information, trust, and how they provide information to smart contracts. Some common types of oracles include:

Inbound and Outbound oracles: Inbound oracles share information from external sources to smart contracts, while outbound oracles send information from smart contracts to the external world.
Centralized and Decentralized oracles: A centralized oracle is a single entity and sole data provider for a smart contract. Decentralized oracles increase reliability by relying on multiple sources of truth and distributing trust among participants.
Push and Pull oracles: Push oracles proactively provide data to smart contracts without being explicitly requested. They push data to the smart contract when a specified event or condition occurs. On the other hand, pull oracles require smart contracts to request data explicitly. They pull data from external sources in response to a query from the smart contract.
Software oracles: These oracles interact with online sources of information, such as databases, servers, or websites, and transmit the data to the blockchain. They often provide real-time information like exchange rates or digital asset prices.
Hardware oracles: These oracles obtain information from the physical world using electronic sensors, barcode scanners, or other reading devices. They "translate" real-world events into digital values that smart contracts can understand.
How do push oracles work?
Push oracles proactively provide data to smart contracts without being explicitly requested. When a specified event or condition occurs, the push oracle triggers the smart contract with the relevant data. For example, a push oracle might send weather data to a smart contract once the temperature reaches a certain threshold.

Push oracle
How do pull oracles work?
Pull oracles require smart contracts to request data explicitly. A smart contract sends a query to the oracle, retrieving and relaying the requested information to the contract. For example, a smart contract might request the current price of a specific digital asset from a pull oracle.

Pull oracle
Use cases for oracles
Oracles serve a purpose in various applications across industries. Some general use cases include:

Prediction markets: Oracles provide real-world data to prediction market platforms, allowing users to bet on future events or outcomes.
Supply chain management: Hardware oracles can track the location and status of goods throughout the supply chain, enabling smart contracts to automate various processes and improve efficiency.
Insurance: Oracles can supply data about events such as natural disasters, accidents, or price fluctuations, allowing smart contracts to automate claims processing and payouts.
Decentralized finance (DeFi): Oracles provide critical price and market data to DeFi applications, enabling them to operate efficiently and securely.
In summary, oracles are a crucial component of the blockchain ecosystem, bridging the gap between onchain and offchain data sources. They enhance the functionality of smart contracts and enable a wide range of applications across various industries. As blockchain technology continues to evolve, developing secure and reliable oracles will remain essential in unlocking the full potential of smart contracts and decentralized applications.

Resources
You can learn more about oracles in our third-party oracles documentation.





Precompiles overview
Precompiles are predefined smart contracts that have special addresses and provide specific functionality which is executed not at the EVM bytecode level, but natively by the Arbitrum client itself. Precompiles are primarily used to introduce specific functions that would be computationally expensive if executed in EVM bytecode, and functions that facilitate the interaction between the parent chain and the child chain. By having them natively in the Arbitrum client, they can be optimized for performance.

Besides supporting all precompiles available in Ethereum, Arbitrum provides child chain-specific precompiles with methods smart contracts can call the same way they can solidity functions. For more details on the addresses these precompiles live, and the specific methods available, please refer to the methods documentation.





Precompiles reference
ArbOS provides child chain-specific precompiles with methods smart contracts can call the same way they can solidity functions. This reference page exhaustively documents the specific calls ArbOS makes available through precompiles. For a more conceptual description of what precompiles are and how they work, please refer to the precompiles conceptual page.

This reference page is divided into two sections. The first one lists all precompiles in a summary table with links to the reference of the specific precompile, along with the address where they live, their purpose and links to the go implementation and solidity interface. The second one details the methods available in each precompile with links to the specific implementation.

General information of precompiles
This section is divided into two tables. We first list precompiles we expect users to most often use, and then the rest of precompiles. However, both tables display the same information: name and purpose of the precompile, address, and links to the solidity interface and the go implementation.

Common precompiles
Precompile	Address	Solidity interface	Go implementation	Purpose
ArbAggregator	0x6d	Interface	Implementation	Configuring transaction aggregation
ArbGasInfo	0x6c	Interface	Implementation	Info about gas pricing
ArbRetryableTx	0x6e	Interface	Implementation	Managing retryables
ArbSys	0x64	Interface	Implementation	System-level functionality
ArbWasm	0x71	Interface	Implementation	Manages Stylus contracts
ArbWasmCache	0x72	Interface	Implementation	Manages Stylus cache
Other precompiles
Precompile	Address	Solidity interface	Go implementation	Purpose
ArbAddressTable	0x66	Interface	Implementation	Supporting compression of addresses
ArbBLS	-	-	-	Disabled (Former registry of BLS public keys)
ArbDebug	0xff	Interface	Implementation	Testing tools
ArbFunctionTable	0x68	Interface	Implementation	No longer used
ArbInfo	0x65	Interface	Implementation	Info about accounts
ArbOwner	0x70	Interface	Implementation	Chain administration, callable only by chain owner
ArbOwnerPublic	0x6b	Interface	Implementation	Info about chain owners
ArbosTest	0x69	Interface	Implementation	No longer used
ArbStatistics	0x6f	Interface	Implementation	Info about the pre-Nitro state
Precompiles reference
ArbAddressTable
ArbAddressTable (Interface | Implementation) provides the ability to create short-hands for commonly used accounts.

Precompile address: 0x0000000000000000000000000000000000000066

Method	Solidity interface	Go implementation	Description
addressExists()	
Interface

Implementation

AddressExists checks if an address exists in the table
compress()	
Interface

Implementation

Compress and returns the bytes that represent the address
decompress()	
Interface

Implementation

Decompress the compressed bytes at the given offset with those of the corresponding account

lookup()	
Interface

Implementation

Lookup the index of an address in the table
lookupIndex()	
Interface

Implementation

LookupIndex for an address in the table by index
register()	
Interface

Implementation

Register adds an account to the table, shrinking its compressed representation
size()	
Interface

Implementation

Size gets the number of addresses in the table
ArbAggregator
ArbAggregator (Interface | Implementation) provides aggregators and their users methods for configuring how they participate in parent chain aggregation. Arbitrum One's default aggregator is the Sequencer, which a user will prefer unless SetPreferredAggregator is invoked to change it.

Compression ratios are measured in basis points. Methods that are checkmarked are access-controlled and will revert if not called by the aggregator, its fee collector, or a chain owner.

Precompile address: 0x000000000000000000000000000000000000006D

Method	Solidity interface	Go implementation	Description
⚠️getPreferredAggregator()

Interface

Implementation

Deprecated: Do not use this method.
⚠️getDefaultAggregator()

Interface

Implementation

Deprecated: Do not use this method.
getBatchPosters()	
Interface

Implementation

GetBatchPosters gets the addresses of all current batch posters
addBatchPoster()	
Interface

Implementation

Adds additional batch poster address
getFeeCollector()	
Interface

Implementation

GetFeeCollector gets a batch poster's fee collector
setFeeCollector(address batchPoster, address newFeeCollector)	
Interface

Implementation

SetFeeCollector sets a batch poster's fee collector (caller must be the batch poster, its fee collector, or an owner)

⚠️getTxBaseFee()

Interface

Implementation

Deprecated: always returns zero
⚠️setTxBaseFee(address aggregator, uint256 feeInL1Gas)

Interface

Implementation

Deprecated: no-op
Note: methods marked with ⚠️ are deprecated and their use is not supported.

ArbBLS
Disabled
This precompile has been disabled. It previously provided a registry of BLS public keys for accounts.

ArbDebug
ArbDebug (Interface | Implementation) provides mechanisms useful for testing. The methods of ArbDebug are only available for chains with the AllowDebugPrecompiles chain parameter set. Otherwise, calls to this precompile will revert.

Precompile address: 0x00000000000000000000000000000000000000ff

Method	Solidity interface	Go implementation	Description
becomeChainOwner()	
Interface

Implementation

Caller becomes a chain owner
overwriteContractCode()	
Interface

Implementation

Overwrite an existing contract's code
events(bool flag, bytes32 value)	
Interface

Implementation

Emits events with values based on the args provided
eventsView()	
Interface

Implementation

Tries (and fails) to emit logs in a view context
customRevert()	
Interface

Implementation

Throws a custom error
panic()	
Interface

Implementation

Halts the chain by panicking in the STF
legacyError()	
Interface

Implementation

Throws a hardcoded error
Event	Solidity interface	Go implementation	Description
Basic	
Interface

Implementation

Emitted in Events for testing

Mixed	
Interface

Implementation

Emitted in Events for testing

Store	
Interface

Implementation

Never emitted (used for testing log sizes)
ArbFunctionTable
ArbFunctionTable (Interface | Implementation) provides aggregators the ability to manage function tables, to enable one form of transaction compression. The Nitro aggregator implementation does not use these, so these methods have been stubbed and their effects disabled. They are kept for backwards compatibility.

Precompile address: 0x0000000000000000000000000000000000000068

Method	Solidity interface	Go implementation	Description
upload()	
Interface

Implementation

Upload does nothing
size()	
Interface

Implementation

Size returns the empty table's size, which is 0
get(address addr, uint256 index)	
Interface

Implementation

Get reverts since the table is empty
ArbGasInfo
ArbGasInfo (Interface | Implementation) provides insight into the cost of using the chain. These methods have been adjusted to account for Nitro's heavy use of calldata compression. Of note to end-users, we no longer make a distinction between non-zero and zero-valued calldata bytes.

Precompile address: 0x000000000000000000000000000000000000006C

Method	Solidity interface	Go implementation	Description
getPricesInWeiWithAggregator()	
Interface

Implementation

GetPricesInWeiWithAggregator gets prices in wei when using the provided aggregator
getPricesInWei()	
Interface

Implementation

GetPricesInWei gets prices in wei when using the caller's preferred aggregator
getPricesInArbGasWithAggregator()	
Interface

Implementation

GetPricesInArbGasWithAggregator gets prices in ArbGas when using the provided aggregator

getPricesInArbGas()	
Interface

Implementation

GetPricesInArbGas gets prices in ArbGas when using the caller's preferred aggregator
getGasAccountingParams()	
Interface

Implementation

GetGasAccountingParams gets the rollup's speed limit, pool size, and block gas limit
getMaxTxGasLimit()	
Interface

Implementation

GetMaxTxGasLimit gets the max tx gas limit
getMinimumGasPrice()	
Interface

Implementation

GetMinimumGasPrice gets the minimum gas price needed for a transaction to succeed
getL1BaseFeeEstimate()	
Interface

Implementation

GetL1BaseFeeEstimate gets the current estimate of the L1 basefee
getL1BaseFeeEstimateInertia()	
Interface

Implementation

GetL1BaseFeeEstimateInertia gets how slowly ArbOS updates its estimate of the L1 basefee

getL1RewardRate()	
Interface

Implementation

GetL1RewardRate gets the L1 pricer reward rate
getL1RewardRecipient()	
Interface

Implementation

GetL1RewardRecipient gets the L1 pricer reward recipient
getL1GasPriceEstimate()	
Interface

Implementation

GetL1GasPriceEstimate gets the current estimate of the L1 basefee
getCurrentTxL1GasFees()	
Interface

Implementation

GetCurrentTxL1GasFees gets the fee in wei paid to the batch poster for posting this tx

getGasBacklog()	
Interface

Implementation

GetGasBacklog gets the backlogged amount of gas burnt in excess of the speed limit
getPricingInertia()	
Interface

Implementation

GetPricingInertia gets how slowly ArbOS updates the L2 basefee in response to backlogged gas

getGasBacklogTolerance()	
Interface

Implementation

GetGasBacklogTolerance gets the forgivable amount of backlogged gas ArbOS will ignore when raising the basefee

getL1PricingSurplus()	
Interface

Implementation

GetL1PricingSurplus gets the surplus of funds for L1 batch posting payments (may be negative)

getPerBatchGasCharge()	
Interface

Implementation

GetPerBatchGasCharge gets the base charge (in L1 gas) attributed to each data batch in the calldata pricer

getAmortizedCostCapBips()	
Interface

Implementation

GetAmortizedCostCapBips gets the cost amortization cap in basis points
getL1FeesAvailable()	
Interface

Implementation

GetL1FeesAvailable gets the available funds from L1 fees
getL1PricingEquilibrationUnits()	
Interface

Implementation

GetL1PricingEquilibrationUnits gets the equilibration units parameter for L1 price adjustment algorithm (Available since ArbOS 20)

getLastL1PricingUpdateTime()	
Interface

Implementation

GetLastL1PricingUpdateTime gets the last time the L1 calldata pricer was updated (Available since ArbOS 20)

getL1PricingFundsDueForRewards()	
Interface

Implementation

GetL1PricingFundsDueForRewards gets the amount of L1 calldata payments due for rewards (per the L1 reward rate) (Available since ArbOS 20)

getL1PricingUnitsSinceUpdate()	
Interface

Implementation

GetL1PricingUnitsSinceUpdate gets the amount of L1 calldata posted since the last update (Available since ArbOS 20)

getLastL1PricingSurplus()	
Interface

Implementation

GetLastL1PricingSurplus gets the L1 pricing surplus as of the last update (may be negative) (Available since ArbOS 20)

getMaxBlockGasLimit()	
Interface

Implementation

GetMaxBlockGasLimit gets the maximum block gas limit
getGasPricingConstraints()	
Interface

Implementation

GetGasPricingConstraints gets the current gas pricing constraints used by the Multi-Constraint Pricer.

ArbInfo
ArbInfo (Interface | Implementation) provides the ability to lookup basic info about accounts and contracts.

Precompile address: 0x0000000000000000000000000000000000000065

Method	Solidity interface	Go implementation	Description
getBalance()	
Interface

Implementation

GetBalance retrieves an account's balance
getCode()	
Interface

Implementation

GetCode retrieves a contract's deployed code
ArbosTest
ArbosTest (Interface | Implementation) provides a method of burning arbitrary amounts of gas, which exists for historical reasons. In Classic, ArbosTest had additional methods only the zero address could call. These have been removed since users don't use them and calls to missing methods revert.

Precompile address: 0x0000000000000000000000000000000000000069

Method	Solidity interface	Go implementation	Description
burnArbGas()	
Interface

Implementation

BurnArbGas unproductively burns the amount of L2 ArbGas
ArbOwner
ArbOwner (Interface | Implementation) provides owners with tools for managing the rollup. Calls by non-owners will always revert.

Most of Arbitrum Classic's owner methods have been removed since they no longer make sense in Nitro:

What were once chain parameters are now parts of ArbOS's state, and those that remain are set at genesis.
ArbOS upgrades happen with the rest of the system rather than being independent
Exemptions to address aliasing are no longer offered. Exemptions were intended to support backward compatibility for contracts deployed before aliasing was introduced, but no exemptions were ever requested.
Precompile address: 0x0000000000000000000000000000000000000070

Method	Solidity interface	Go implementation	Description
addChainOwner()	
Interface

Implementation

AddChainOwner adds account as a chain owner
removeChainOwner()	
Interface

Implementation

RemoveChainOwner removes account from the list of chain owners
isChainOwner()	
Interface

Implementation

IsChainOwner checks if the account is a chain owner
getAllChainOwners()	
Interface

Implementation

GetAllChainOwners retrieves the list of chain owners
setNativeTokenManagementFrom()	
Interface

Implementation

future.
addNativeTokenOwner()	
Interface

Implementation

AddNativeTokenOwner adds account as a native token owner
removeNativeTokenOwner()	
Interface

Implementation

RemoveNativeTokenOwner removes account from the list of native token owners
isNativeTokenOwner()	
Interface

Implementation

IsNativeTokenOwner checks if the account is a native token owner
getAllNativeTokenOwners()	
Interface

Implementation

GetAllNativeTokenOwners retrieves the list of native token owners
setL1BaseFeeEstimateInertia()	
Interface

Implementation

SetL1BaseFeeEstimateInertia sets how slowly ArbOS updates its estimate of the L1 basefee

setL2BaseFee()	
Interface

Implementation

SetL2BaseFee sets the L2 gas price directly, bypassing the pool calculus
setMinimumL2BaseFee()	
Interface

Implementation

SetMinimumL2BaseFee sets the minimum base fee needed for a transaction to succeed
setSpeedLimit()	
Interface

Implementation

SetSpeedLimit sets the computational speed limit for the chain
setMaxTxGasLimit()	
Interface

Implementation

SetMaxTxGasLimit sets the maximum size a tx can be
setMaxBlockGasLimit()	
Interface

Implementation

SetMaxBlockGasLimit sets the maximum size a block can be
setL2GasPricingInertia()	
Interface

Implementation

SetL2GasPricingInertia sets the L2 gas pricing inertia
setL2GasBacklogTolerance()	
Interface

Implementation

SetL2GasBacklogTolerance sets the L2 gas backlog tolerance
getNetworkFeeAccount()	
Interface

Implementation

GetNetworkFeeAccount gets the network fee collector
getInfraFeeAccount()	
Interface

Implementation

GetInfraFeeAccount gets the infrastructure fee collector
setNetworkFeeAccount()	
Interface

Implementation

SetNetworkFeeAccount sets the network fee collector to the new network fee account
setInfraFeeAccount()	
Interface

Implementation

SetInfraFeeAccount sets the infra fee collector to the new network fee account
scheduleArbOSUpgrade(uint64 newVersion, uint64 timestamp)	
Interface

Implementation

ScheduleArbOSUpgrade to the requested version at the requested timestamp
setL1PricingEquilibrationUnits()	
Interface

Implementation

Sets equilibration units parameter for L1 price adjustment algorithm
setL1PricingInertia()	
Interface

Implementation

Sets inertia parameter for L1 price adjustment algorithm
setL1PricingRewardRecipient()	
Interface

Implementation

Sets reward recipient address for L1 price adjustment algorithm
setL1PricingRewardRate()	
Interface

Implementation

Sets reward amount for L1 price adjustment algorithm, in wei per unit
setL1PricePerUnit()	
Interface

Implementation

Set how much ArbOS charges per L1 gas spent on transaction data.
setParentGasFloorPerToken()	
Interface

Implementation

Set how much L1 charges per non-zero byte of calldata
setPerBatchGasCharge()	
Interface

Implementation

Sets the base charge (in L1 gas) attributed to each data batch in the calldata pricer
setBrotliCompressionLevel()	
Interface

Implementation

Sets the Brotli compression level used for fast compression (default level is 1)
setAmortizedCostCapBips()	
Interface

Implementation

Sets the cost amortization cap in basis points
releaseL1PricerSurplusFunds()	
Interface

Implementation

Releases surplus funds from L1PricerFundsPoolAddress for use
setInkPrice()	
Interface

Implementation

Sets the amount of ink 1 gas buys
setWasmMaxStackDepth()	
Interface

Implementation

Sets the maximum depth (in wasm words) a wasm stack may grow
setWasmFreePages()	
Interface

Implementation

Gets the number of free wasm pages a tx gets
setWasmPageGas()	
Interface

Implementation

Sets the base cost of each additional wasm page
setWasmPageLimit()	
Interface

Implementation

Sets the initial number of pages a wasm may allocate
setWasmMaxSize()	
Interface

Implementation

decompression.
setWasmMinInitGas(uint8 gas, uint16 cached)	
Interface

Implementation

Sets the minimum costs to invoke a program
setWasmInitCostScalar()	
Interface

Implementation

Sets the linear adjustment made to program init costs
setWasmExpiryDays()	
Interface

Implementation

Sets the number of days after which programs deactivate
setWasmKeepaliveDays()	
Interface

Implementation

Sets the age a program must be to perform a keepalive
setWasmBlockCacheSize()	
Interface

Implementation

Sets the number of extra programs ArbOS caches during a given block
addWasmCacheManager()	
Interface

Implementation

Adds account as a wasm cache manager
removeWasmCacheManager()	
Interface

Implementation

Removes account from the list of wasm cache managers
setChainConfig()	
Interface

Implementation

Sets serialized chain config in ArbOS state
setCalldataPriceIncrease()	
Interface

Implementation

(EIP-7623)
setGasBacklog()	
Interface

Implementation

SetGasBacklog sets the L2 gas backlog directly (used by single-constraint pricing model only)

setGasPricingConstraints()	
Interface

Implementation

SetGasPricingConstraints sets the gas pricing constraints used by the multi-constraint pricing model

Event	Solidity interface	Go implementation	Description
OwnerActs	
Interface

Implementation

/ Emitted when a successful call is made to this precompile
ArbOwnerPublic
ArbOwnerPublic (Interface | Implementation) provides non-owners with info about the current chain owners.

Precompile address: 0x000000000000000000000000000000000000006b

Method	Solidity interface	Go implementation	Description
isChainOwner()	
Interface

Implementation

IsChainOwner checks if the user is a chain owner
rectifyChainOwner()	
Interface

Implementation

RectifyChainOwner checks if the account is a chain owner (Available since ArbOS 11)
getAllChainOwners()	
Interface

Implementation

GetAllChainOwners retrieves the list of chain owners
getNativeTokenManagementFrom()	
Interface

Implementation

native token management becomes enabled
isNativeTokenOwner()	
Interface

Implementation

IsNativeTokenOwner checks if the account is a native token owner
getAllNativeTokenOwners()	
Interface

Implementation

GetAllNativeTokenOwners retrieves the list of native token owners
getNetworkFeeAccount()	
Interface

Implementation

GetNetworkFeeAccount gets the network fee collector
getInfraFeeAccount()	
Interface

Implementation

GetInfraFeeAccount gets the infrastructure fee collector
getBrotliCompressionLevel()	
Interface

Implementation

GetBrotliCompressionLevel gets the current brotli compression level used for fast compression

getParentGasFloorPerToken()	
Interface

Implementation

Get how much L1 charges per non-zero byte of calldata
getScheduledUpgrade()	
Interface

Implementation

Returns (0, 0, nil) if no ArbOS upgrade is scheduled.
isCalldataPriceIncreaseEnabled()	
Interface

Implementation

(EIP-7623) is enabled
Event	Solidity interface	Go implementation	Description
ChainOwnerRectified	
Interface

Implementation

Emitted when verifying a chain owner
ArbRetryableTx
ArbRetryableTx (Interface | Implementation) provides methods for managing retryables. The model has been adjusted for Nitro, most notably in terms of how retry transactions are scheduled. For more information on retryables, please see the retryable documentation.

Precompile address: 0x000000000000000000000000000000000000006E

Method	Solidity interface	Go implementation	Description
redeem()	
Interface

Implementation

Redeem schedules an attempt to redeem the retryable, donating all of the call's gas to the redeem attempt

getLifetime()	
Interface

Implementation

GetLifetime gets the default lifetime period a retryable has at creation
getTimeout()	
Interface

Implementation

GetTimeout gets the timestamp for when ticket will expire
keepalive()	
Interface

Implementation

Keepalive adds one lifetime period to the ticket's expiry
getBeneficiary()	
Interface

Implementation

GetBeneficiary gets the beneficiary of the ticket
cancel()	
Interface

Implementation

Cancel the ticket and refund its callvalue to its beneficiary
getCurrentRedeemer()	
Interface

Implementation

Gets the redeemer of the current retryable redeem attempt
submitRetryable()	
Interface

Implementation

Do not call. This method represents a retryable submission to aid explorers. Calling it will always revert.

Event	Solidity interface	Go implementation	Description
TicketCreated	
Interface

Implementation

Emitted when creating a retryable
LifetimeExtended	
Interface

Implementation

Emitted when extending a retryable's expiry date
RedeemScheduled	
Interface

Implementation

Emitted when scheduling a retryable
Canceled	
Interface

Implementation

Emitted when cancelling a retryable
Redeemed	
Interface

Implementation

DEPRECATED in favour of new RedeemScheduled event after the nitro upgrade.

ArbStatistics
ArbStatistics (Interface | Implementation) provides statistics about the chain as of just before the Nitro upgrade. In Arbitrum Classic, this was how a user would get info such as the total number of accounts, but there are better ways to get that info in Nitro.

Precompile address: 0x000000000000000000000000000000000000006F

Method	Solidity interface	Go implementation	Description
getStats()	
Interface

Implementation

GetStats returns the current block number and some statistics about the rollup's pre-Nitro state

ArbSys
ArbSys (Interface | Implementation) provides system-level functionality for interacting with the parent chain and understanding the call stack.

Precompile address: 0x0000000000000000000000000000000000000064

Method	Solidity interface	Go implementation	Description
arbBlockNumber()	
Interface

Implementation

ArbBlockNumber gets the current L2 block number
arbBlockHash()	
Interface

Implementation

ArbBlockHash gets the L2 block hash, if sufficiently recent
arbChainID()	
Interface

Implementation

ArbChainID gets the rollup's unique chain identifier
arbOSVersion()	
Interface

Implementation

ArbOSVersion gets the current ArbOS version
getStorageGasAvailable()	
Interface

Implementation

GetStorageGasAvailable returns 0 since Nitro has no concept of storage gas
isTopLevelCall()	
Interface

Implementation

IsTopLevelCall checks if the call is top-level (deprecated)
mapL1SenderContractAddressToL2Alias()	
Interface

Implementation

MapL1SenderContractAddressToL2Alias gets the contract's L2 alias
wasMyCallersAddressAliased()	
Interface

Implementation

WasMyCallersAddressAliased checks if the caller's caller was aliased
myCallersAddressWithoutAliasing()	
Interface

Implementation

MyCallersAddressWithoutAliasing gets the caller's caller without any potential aliasing

withdrawEth()	
Interface

Implementation

WithdrawEth send paid eth to the destination on L1
sendTxToL1()	
Interface

Implementation

SendTxToL1 sends a transaction to L1, adding it to the outbox
sendMerkleTreeState()	
Interface

Implementation

SendMerkleTreeState gets the root, size, and partials of the outbox Merkle tree state (caller must be the 0 address)

Event	Solidity interface	Go implementation	Description
L2ToL1Tx	
Interface

Implementation

Logs a send transaction from L2 to L1, including data for outbox proving
L2ToL1Transaction	
Interface

Implementation

DEPRECATED in favour of the new L2ToL1Tx event above after the nitro upgrade

SendMerkleUpdate	
Interface

Implementation

Logs a new merkle branch needed for constructing outbox proofs
ArbWasm
ArbWasm (Interface | Implementation) provides helper methods for managing Stylus contracts

Precompile address: 0x0000000000000000000000000000000000000071

Method	Solidity interface	Go implementation	Description
activateProgram()	
Interface

Implementation

Compile a wasm program with the latest instrumentation
stylusVersion()	
Interface

Implementation

Gets the latest stylus version
codehashVersion()	
Interface

Implementation

Gets the stylus version that program with codehash was most recently compiled with
codehashKeepalive()	
Interface

Implementation

Extends a program's expiration date (reverts if too soon)
codehashAsmSize()	
Interface

Implementation

Gets a program's asm size in bytes
programVersion()	
Interface

Implementation

Gets the stylus version that program at addr was most recently compiled with
programInitGas()	
Interface

Implementation

Gets the cost to invoke the program
programMemoryFootprint()	
Interface

Implementation

Gets the footprint of program at addr
programTimeLeft()	
Interface

Implementation

Gets returns the amount of time remaining until the program expires
inkPrice()	
Interface

Implementation

Gets the amount of ink 1 gas buys
maxStackDepth()	
Interface

Implementation

Gets the wasm stack size limit
freePages()	
Interface

Implementation

Gets the number of free wasm pages a tx gets
pageGas()	
Interface

Implementation

Gets the base cost of each additional wasm page
pageRamp()	
Interface

Implementation

Gets the ramp that drives exponential memory costs
pageLimit()	
Interface

Implementation

Gets the maximum initial number of pages a wasm may allocate
minInitGas()	
Interface

Implementation

Gets the minimum costs to invoke a program
initCostScalar()	
Interface

Implementation

Gets the linear adjustment made to program init costs
expiryDays()	
Interface

Implementation

Gets the number of days after which programs deactivate
keepaliveDays()	
Interface

Implementation

Gets the age a program must be to perform a keepalive
blockCacheSize()	
Interface

Implementation

Gets the number of extra programs ArbOS caches during a given block.
Event	Solidity interface	Go implementation	Description
ProgramActivated	
Interface

Implementation

Emitted when activating a WASM program
ProgramLifetimeExtended	
Interface

Implementation

Emitted when extending the expiration date of a WASM program
ArbWasmCache
ArbWasmCache (Interface | Implementation) provides helper methods for managing Stylus cache

Precompile address: 0x0000000000000000000000000000000000000072

Method	Solidity interface	Go implementation	Description
isCacheManager()	
Interface

Implementation

See if the user is a cache manager owner.
allCacheManagers()	
Interface

Implementation

Retrieve all authorized address managers.
cacheCodehash()	
Interface

Implementation

Deprecated: replaced with CacheProgram.
cacheProgram()	
Interface

Implementation

Caches all programs with a codehash equal to the given address. Caller must be a cache manager or chain owner.

evictCodehash()	
Interface

Implementation

Evicts all programs with the given codehash. Caller must be a cache manager or chain owner.

codehashIsCached()	
Interface

Implementation

Gets whether a program is cached. Note that the program may be expired.
Event	Solidity interface	Go implementation	Description
UpdateProgramCache	
Interface

Implementation

Emitted when caching a WASM program


NodeInterface overview
The Arbitrum Nitro software includes a special NodeInterface contract available at address 0xc8 that is only accessible via RPCs (it's not actually deployed onchain and thus can't be called by smart contracts). The way it works is that the node uses Geth's InterceptRPCMessage hook to detect messages sent to the address 0xc8, and swaps out the message it's handling before deriving a transaction from it.

The reference page contains information about all methods available in the NodeInterface.





NodeInterface reference
The Arbitrum Nitro software includes a special NodeInterface contract available at address 0xc8 that is only accessible via RPCs (it's not actually deployed onchain, and thus can't be called by smart contracts). This reference page documents the specific calls available in the NodeInterface. For a more conceptual description of what it is and how it works, please refer to the NodeInterface conceptual page.

NodeInterface methods
Method	Solidity interface	Go implementation	Description
estimateRetryableTicket(address sender, uint256 deposit, address to, uint256 l2CallValue, address excessFeeRefundAddress, address callValueRefundAddress, bytes calldata data)

Interface

Implementation

Estimates the gas needed for a retryable submission
constructOutboxProof()	
Interface

Implementation

Constructs an outbox proof of an l2->l1 send's existence in the outbox accumulator
findBatchContainingBlock()	
Interface

Implementation

Finds the L1 batch containing a requested L2 block, reverting if none does
getL1Confirmations()	
Interface

Implementation

Gets the number of L1 confirmations of the sequencer batch producing the requested L2 block

gasEstimateComponents(address to, bool contractCreation, bytes calldata data)	
Interface

Implementation

Same as native gas estimation, but with additional info on the l1 costs
gasEstimateL1Component(address to, bool contractCreation, bytes calldata data)	
Interface

Implementation

Estimates a transaction's l1 costs
legacyLookupMessageBatchProof()	
Interface

Implementation

Returns the proof necessary to redeem a message
nitroGenesisBlock()	
Interface

Implementation

Returns the first block produced using the Nitro codebase
blockL1Num()	
Interface

Implementation

Returns the L1 block number of the L2 block
l2BlockRangeForL1()	
Interface

Implementation

Finds the L2 block number range that has the given L1 block number



Token bridging overview
Token bridging is a fundamental aspect of any Layer 2 (child chain) protocol. Arbitrum uses its ability to pass messages between parent and child chains (see Cross-chain messaging) to enable projects to move assets between Ethereum and an Arbitrum chain trustlessly, and vice versa. Any asset and asset type in principle can be bridged, including ETH, ERC-20 tokens, and ERC-721 tokens, among others.

The following sections provide a series of conceptual documents that explain how asset bridging works and the options available to bridge ETH and other types of assets between layers. Additionally, a series of how-to guides showcases the different methods for making your token bridgeable.

This section has three parts:

ETH bridging: explains how Arbitrum handles bridging ETH, the native token of Ethereum and the Arbitrum chains, between the parent and child chain.
ERC-20 token bridging: explains the architecture of the token bridge for this type of asset, describing the different options available to make a token bridgeable.
Bridge tokens programmatically: goes over the process of making an ERC-20 token bridgeable using the different types of gateways available in the token bridge.



ETH bridging
Ether (ETH) is the native currency of Ethereum and all Arbitrum chains. ETH is used to pay the necessary fees to execute transactions on those chains. Bridging ETH from Ethereum (the parent chain) to an Arbitrum chain (the child chain) follows a different process than the one followed when bridging other types of assets.

Depositing ether
To move ETH from the parent chain to the child chain, you execute a deposit transaction via Inbox.depositEth. This transaction transfers funds to the Bridge contract on the parent chain and credits the same funds to you inside the Arbitrum chain at the specified address.

function depositEth(address destAddr) external payable override returns (uint256)

warning
If the transaction comes from a 7702-enabled account, the destination address on L2 is subject to address aliasing. The ETH will be credited to the aliased address of the sender, not the raw msg.sender. See address aliasing for details.

The following diagram depicts the process that funds follow during a deposit operation.

Depositing Ether
Regarding the parent chain, all deposited funds are held in the Arbitrum Bridge contract. Once finalized, the ETH becomes available on the L2 at the aliased or specified address, depending on the sender type.

Withdrawing ether
Withdrawing ether can be done using the ArbSys precompile's withdrawEth method:

ArbSys(100).withdrawEth{ value: 2300000 }(destAddress)

Upon withdrawal, the Ether balance is burned on the Arbitrum side and will later be made available on the Ethereum side.

ArbSys.withdrawEth is a convenience function equivalent to calling ArbSys.sendTxToL1 with empty calldataForL1. Like any other sendTxToL1 call, it will require an additional call to Outbox.executeTransaction on the parent chain after the dispute period elapses for the user to finalize claiming their funds on the parent chain (see Child to parent chain messaging). Once the withdrawal is executed from the Outbox, the user's ETH balance will be credited on the parent chain.

The following diagram depicts the process that funds follow during a withdrawal operation.

Withdrawing Ether







ERC-20 token bridging
The Arbitrum protocol itself has no notion of token standards and gives no built-in advantage or special recognition to any particular token bridge. In this article, we describe the "canonical bridge," which was implemented by Offchain Labs, and should be the primary bridge most users and applications use; it is (effectively) a decentralized app with contracts on both Ethereum (parent chain) and Arbitrum (child chain) that leverages Arbitrum's cross-chain messaging protocol to achieve basic desired token-bridging functionality. We recommend that you use it!

Design rationale
In our token bridge design, we use the term "gateway" as per this proposal; i.e., one of a pair of contracts on two different domains (i.e., Ethereum and an Arbitrum chain), used to facilitate cross-domain asset transfers.

We now describe some core goals that motivated the design of our bridging system.

Custom gateway functionality
For many ERC-20 tokens, "standard" bridging functionality is sufficient, which entails the following: a token contract on Ethereum is associated with a "paired" token contract on Arbitrum.

Depositing a token involves escrowing a certain amount of the token in a parent chain bridge contract, and minting the same amount at the paired token contract on a child chain. Then, on the child chain, the paired contract behaves much like a normal ERC-20 token contract. Withdrawing entails burning a specific amount of the token in the child chain contract, which can be claimed later from the parent chain bridge contract.

Many tokens, however, require custom gateway systems, the possibilities of which are hard to generalize, e.g.,:

Tokens which accrue interest to their holders need to ensure that the interest is dispersed properly across layers, and doesn't simply accrue to the bridge contracts
Our cross-domain WETH implementations require tokens to be wrapped and unwrapped as they move across layers.
Thus, our bridge architecture must allow not just the standard deposit and withdrawal functionalities, but also for new, custom gateways to be dynamically added over time.

Canonical child chain representation per parent chain token contract
Having multiple custom gateways is beneficial, but we also want to avoid a situation in which a single parent chain token that utilizes our bridging system can be represented at multiple addresses/contracts on the child chain, as this adds significant friction and confusion for users and developers. Thus, we need a way to track which parent chain token uses which gateway, and in turn, to have a canonical address oracle that maps the tokens' addresses across the Ethereum and Arbitrum domains.

Canonical token bridge implementation
With this in mind, we provide an overview of our token bridging architecture.

Our architecture consists of three types of contracts:

Asset contracts: These are the token contracts themselves, i.e., an ERC-20 on the parent chain and its counterpart on Arbitrum.
Gateways: Pairs of contracts (one on the parent chain, one on the child chain) that implement a particular type of cross-chain asset bridging.
Routers: Exactly two contracts (one on the parent chain, one on the child chain) that route each asset to its designated gateway.

All Ethereum-to-Arbitrum token transfers are initiated via the router contract on the parent chain, specifically the L1GatewayRouter contract. L1GatewayRouter forwards the token's deposit call to the appropriate gateway contract on the parent chain, the L1ArbitrumGateway contract. L1GatewayRouter is responsible for mapping the parent chain token addresses to L1Gateway contracts, thus acting as a parent/child chain address oracle and ensuring each token corresponds to only one gateway. The L1ArbitrumGateway then communicates to its counterpart gateway contract on the child chain, the L2ArbitrumGateway contract (typically/expectedly via retryable tickets).


Similarly, Arbitrum-to-Ethereum transfers initiate via the router contract on the child chain, specifically the L2GatewayRouter contract, which in turn calls the token's gateway contract on the child chain. This L2ArbitrumGateway contract in turn communicates to its corresponding gateway contract on the parent chain, the L1ArbitrumGateway contract (typically/expectedly via sending child-to-parent messages to the outbox).


For any given gateway pairing, we require that calls initiate through the corresponding router (L1GatewayRouter or L2GatewayRouter), and that the gateways conform to the TokenGateway interfaces; the TokenGateway interfaces should be flexible and extensible enough to support any bridging functionality a particular token may require.

The standard ERC-20 gateway
By default, any ERC-20 token on a parent chain that isn't registered to a gateway can be bridged permissionlessly through the StandardERC20Gateway.

You can use the bridge UI or follow the instructions in How to bridge tokens via Arbitrum’s standard ERC-20 gateway to bridge a token to a child chain via this gateway.

Example: Standard Arb-ERC-20 deposit and withdraw
To help illustrate what this all looks like in practice, let's go through the steps of what depositing and withdrawing SomeERC20Token via our standard ERC-20 gateway looks like. Here, we're assuming that SomeERC20Token has already been registered in the L1GatewayRouter to use the standard ERC-20 gateway.

Deposits
A user calls L1GatewayRouter.outboundTransferCustomRefund [1] (with SomeERC20Token's parent chain address as an argument).
L1GatewayRouter looks up SomeERC20Token's gateway, and finds that it's the standard ERC-20 gateway (the L1ERC20Gateway contract).
L1GatewayRouter calls L1ERC20Gateway.outboundTransferCustomRefund, forwarding the appropriate parameters.
L1ERC20Gateway escrows the tokens sent and creates a retryable ticket to trigger L2ERC20Gateway's finalizeInboundTransfer method on the child chain.
L2ERC20Gateway.finalizeInboundTransfer mints the appropriate amount of tokens at the arbSomeERC20Token contract on the child chain.
❗️ [1] Please keep in mind that some older custom gateways might not have outboundTransferCustomRefund implemented, and L1GatewayRouter.outboundTransferCustomRefund does not fallback to outboundTransfer. In those cases, please use the function L1GatewayRouter.outboundTransfer.

info
arbSomeERC20Token is an instance of StandardArbERC20, which includes bridgeMint and bridgeBurn methods only callable by the L2ERC20Gateway.

Withdrawals
On Arbitrum, a user calls L2GatewayRouter.outBoundTransfer, which in turn calls outBoundTransfer on arbSomeERC20Token's gateway (i.e., L2ERC20Gateway).
This burns arbSomeERC20Token tokens, and calls ArbSys with an encoded message to L1ERC20Gateway.finalizeInboundTransfer, which will eventually execute on the parent chain.
After the dispute window expires and the assertion with the user's transaction is confirmed, a user can call Outbox.executeTransaction, which in turn calls the encoded L1ERC20Gateway.finalizeInboundTransfer message, releasing the user's tokens from the L1ERC20Gateway contract's escrow.
The Arbitrum generic-custom gateway
Just because a token has requirements beyond the offerings of the standard ERC-20 gateway, that doesn't necessarily mean that a unique gateway needs to be tailor-made for the token in question. Our generic-custom gateway is flexible enough to be suitable for most (but not necessarily all) custom fungible token needs. As a general rule:

If your custom token can increase its supply (i.e., mint) directly on the child chain, and you want the child chain-minted tokens to be withdrawable back to the parent chain and recognized by the parent chain contract, it will probably require its own special gateway. Otherwise, the generic-custom gateway is likely the right solution for you!

Some examples of token features suitable for the generic-custom gateway:

A child chain token contract upgradable via a proxy
A child chain token contract that includes address allowlisting/denylisting
The deployer determines the address of the child chain token contract
Setting up your token with the generic-custom gateway
Follow the steps below to set up your token for use with the generic-custom gateway. You can also find more detailed instructions on the page How to bridge tokens via Arbitrum’s generic-custom gateway.

0. Have a parent chain token

Your token on the parent chain should conform to the ICustomToken interface (see TestCustomTokenL1 for an example implementation). Crucially, it must have an isArbitrumEnabled method in its interface.

1. Deploy your token on Arbitrum

Your token should conform to the minimum IArbToken interface; i.e., it should have bridgeMint and bridgeBurn methods only callable by the L2CustomGateway contract, and the address of its corresponding Ethereum token accessible via l1Address. For an example implementation, see L2GatewayToken.

Token compatibility with available tooling
If you want your token to be compatible out of the box with all the tooling available (e.g., the Arbitrum bridge), we recommend that you keep the implementation of the IArbToken interface as close as possible to the L2GatewayToken implementation example.

For example, if an allowance check is added to the bridgeBurn() function, the token will not be easily withdrawable through the Arbitrum bridge UI, as the UI does not prompt an approval transaction of tokens by default (it expects the tokens to follow the recommended L2GatewayToken implementation).

2. Register your token on the parent chain to your token on the child chain via the L1CustomGateway contract

Have your parent chain token's contract make an external call to L1CustomGateway.registerTokenToL2. Performing the registration can be completed as a chain-owner registration via an Arbitrum DAO proposal.

3. Register your token on the parent chain to the L1GatewayRouter

After your token's registration to the generic-custom gateway is complete, have your parent chain token's contract make an external call to L1GatewayRouter.setGateway; performing the registration can also be completed as a chain-owner registration via an Arbitrum DAO proposal.

We are here to help
If you have questions about your custom token needs, please feel free to reach out to us on our Discord server.

Other flavors of gateways
Note that in the system described above, one pair of gateway contracts handles the bridging of many ERC-20's; i.e., many ERC-20's on the parent chain are each paired with their own ERC-20's on Arbitrum via a single gateway contract pairing. Other gateways may have different relationships with the contracts that they bridge.

Take our wrapped Ether implementation for example: here, a single WETH contract on the parent chain is connected to a single WETH contract on the child chain. When transferring WETH from one domain to another, the parent/child chain gateway architecture is used to unwrap the WETH on domain A, transfer the now-unwrapped Ether, and then re-wrap it on domain B. This process ensures that WETH can behave on Arbitrum in the same way users are accustomed to it behaving on Ethereum, while ensuring that all WETH tokens are always fully collateralized on the layer on which they reside.

Regardless of a token's complexity in bridging needs, it is possible to create a gateway to accommodate it within our canonical bridging system.

You can find an example of implementation of a custom gateway in the page How to bridge tokens via a custom gateway.

Demos
Our How to bridge tokens section provides an example of interacting with Arbitrum's token bridge via the Arbitrum SDK.

A word of caution on bridges (aka, "I've got a bridge to sell you")
Cross-chain bridging is an exciting design space; alternative bridge designs can potentially offer faster withdrawals, interoperability with other chains, and different trust assumptions with their own potentially valuable UX tradeoffs, etc. They can also potentially be completely insecure and/or outright scams. Users should treat other, non-canonical bridge applications the same way they treat any application running on Arbitrum, and exercise caution and due diligence before entrusting them with their value.






Bridge tokens via Arbitrum's standard `ERC-20` gateway
In this how-to, you’ll learn how to bridge your own token between Ethereum (parent chain) and Arbitrum (child chain), using Arbitrum’s standard ERC20 gateway. For alternative ways of bridging tokens, don’t forget to check out this overview.

Familiarity with Arbitrum’s token bridge system, smart contracts, and blockchain development is expected. If you’re new to blockchain development, consider reviewing our Quickstart: Build a dApp with Arbitrum (Solidity, Remix) before proceeding. We will use Arbitrum’s SDK throughout this how-to, although no prior knowledge is required.

We will walk you through all the steps involved in the process. However, if you want to jump straight to the code, we have created this script in our tutorials repository that encapsulates the entire process.

Step 1: Create a token and deploy it on the parent chain
We‘ll begin the process by creating and deploying a sample token to the parent chain. If you already have a token contract on the parent chain, you don’t need to perform this step.

We first create a standard ERC-20 contract using OpenZeppelin’s implementation. We make only one adjustment to that implementation, for simplicity, although it is not required: we specify an initialSupply to be pre-minted and sent to the deployer address upon creation.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DappToken is ERC20 {
    /**
     * @dev See {ERC20-constructor}.
     *
     * An initial supply amount is passed, which is preminted to the deployer.
     */
    constructor(uint256 _initialSupply) ERC20("Dapp Token", "DAPP") {
        _mint(msg.sender, _initialSupply * 10 ** decimals());
    }
}

We now deploy that token to the parent chain.

const { ethers } = require('hardhat');
const { providers, Wallet } = require('ethers');
require('dotenv').config();
const walletPrivateKey = process.env.DEVNET_PRIVKEY;
const l1Provider = new providers.JsonRpcProvider(process.env.L1RPC);
const l1Wallet = new Wallet(walletPrivateKey, l1Provider);

/**
 * For our tests, here we deploy an standard ERC20 token (DappToken) to L1
 * It sends its deployer (us) the initial supply of 1000
 */
const main = async () => {
  console.log('Deploying the test DappToken to L1:');
  const L1DappToken = await (await ethers.getContractFactory('DappToken')).connect(l1Wallet);
  const l1DappToken = await L1DappToken.deploy(1000);

  await l1DappToken.deployed();
  console.log(`DappToken is deployed to L1 at ${l1DappToken.address}`);

  /**
   * Get the deployer token balance
   */
  const tokenBalance = await l1DappToken.balanceOf(l1Wallet.address);
  console.log(`Initial token balance of deployer: ${tokenBalance}`);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

Step 2: Identify the bridge contracts to call (concepts summary)
As stated in the token bridge conceptual page, when using Arbitrum’s standard ERC-20 gateway, you don’t need to do any pre-configuration process. Your token will be “bridgeable” out of the box.

As explained in the conceptual page, there are two contracts that we need to be aware of when bridging tokens:

Router contract: this is the contract that we’ll interact with. It keeps a mapping of the gateway contracts assigned to each token, fallbacking to a default gateway for standard ERC-20 tokens.
Gateway contract: This is the contract that escrows or burns the tokens in the layer of origin and sends the message over to the counterpart layer to mint or release the tokens there.
For simplicity, this how-to will focus on the first case: bridging from the parent chain (Ethereum) to the child chain (Arbitrum).

We’ll explain below what specific contracts and methods need to be called to bridge your token, but you can abstract this whole process of finding the right addresses by using Arbitrum’s SDK. You can use the deposit function of the Erc20Bridger class to bridge your tokens, which will use the appropriate router contract based on the network you’re connected to, and will relay the request to the appropriate gateway contract. You can also use the function getParentGatewayAddress to get the address of the gateway contract that’s going to be used. But don’t worry about any of this yet; we’ll use those functions in the next steps.

Now, here’s an explanation of the contracts and methods that need called to bridge your token manually:

When bridging from the parent chain (Ethereum) to the child chain (Arbitrum), you’ll need to interact with the L1GatewayRouter contract, by calling the outboundTransferCustomRefund method. This router contract will relay your request to the appropriate gateway contract, specifically, the L1ERC20Gateway contract. To get the address of the gateway contract that’s going to be used, you can call the getGateway function in the L1GatewayRouter contract.
When bridging from the child chain (Arbitrum) to the parent chain (Ethereum), you’ll need to interact with the L2GatewayRouter contract by calling the outBoundTransfer method. This router contract will relay your request to the appropriate gateway contract, specifically, the L2ERC20Gateway contract. To get the address of the gateway contract that’s going to be used, you can call the getGateway function in the L2GatewayRouter contract.
You can find the addresses of the contracts involved in the process on this page.

Step 3: Approve token allowance for the gateway contract
The gateway contract will be the one that will transfer the tokens to be bridged over. The next step is to allow the gateway contract to proceed accordingly.

We typically do that by using the approve method of the token. Still, you can use Arbitrum’s SDK to abstract this process by calling the method approveToken of the Erc20Bridger class, which will call the approve method of the token passed by parameter, and set the allowance to the appropriate gateway contract.

/**
 * Use l2Network to create an Arbitrum SDK Erc20Bridger instance
 * We'll use Erc20Bridger for its convenience methods around transferring tokens to L2
 */
const l2Network = await getArbitrumNetwork(l2Provider);
const erc20Bridge = new Erc20Bridger(l2Network);

/**
 * The Standard Gateway contract will ultimately be making the token transfer call; thus, that's the contract we need to approve.
 * erc20Bridger.approveToken handles this approval
 * Arguments required are:
 * (1) l1Signer: The L1 address transferring token to L2
 * (2) erc20L1Address: L1 address of the ERC20 token to be deposited to L2
 */
console.log('Approving:');
const l1Erc20Address = l1DappToken.address;
const approveTx = await erc20Bridger.approveToken({
  parentSigner: l1Wallet,
  erc20ParentAddress: l1Erc20Address,
});

const approveRec = await approveTx.wait();
console.log(
  `You successfully allowed the Arbitrum Bridge to spend DappToken ${approveRec.transactionHash}`,
);

As mentioned before, you can also call the approve method of the token and send as a parameter the address of the gateway contract, which you can find by calling the method getGateway function in the router contract.

Step 4: Start the bridging process through the router contract
After allowing the gateway contract to transfer the tokens, we can now start the bridging process.

You can use Arbitrum’s SDK to abstract this process by calling the method deposit of the Erc20Bridger class, which will estimate the gas parameters (maxGas, gasPriceBid, and maxSubmissionCost, explained below) and call the outboundTransferCustomRefund method of the router contract. You will only need to specify the following parameters:

amount: Amount of tokens to bridge
erc20L1Address: Parent chain address of the ERC-20 token to bridge
l1Signer: Signer object of the account transferring the tokens, connected to the parent chain network
l2Provider: Provider connected to the child chain network
/**
 * Deposit DappToken to L2 using erc20Bridger. This will escrow funds in the Gateway contract on L1, and send a message to mint tokens on L2.
 * The erc20Bridge.deposit method handles computing the necessary fees for automatic-execution of retryable tickets — maxSubmission cost & l2 gas price * gas — and will automatically forward the fees to L2 as callvalue
 * Also note that since this is the first DappToken deposit onto L2, a standard Arb ERC20 contract will automatically be deployed.
 * Arguments required are:
 * (1) amount: The amount of tokens to be transferred to L2
 * (2) erc20L1Address: L1 address of the ERC20 token to be depositted to L2
 * (2) l1Signer: The L1 address transferring token to L2
 * (3) l2Provider: An l2 provider
 */
const depositTx = await erc20Bridger.deposit({
  amount: tokenDepositAmount,
  erc20ParentAddress: l1Erc20Address,
  parentSigner: l1Wallet,
  childProvider: l2Provider,
});


As mentioned before, you can also call the method outboundTransferCustomRefund manually in the router contract and specify the following parameters:

address _token: Parent chain address of the ERC-20 token to bridge
address _refundTo: Account to credit with the excess gas refund on the child chain
address _to: Account to credit with the tokens on the child chain
uint256 _amount: Amount of tokens to bridge
uint256 _maxGas: Max gas deducted from the user’s child chain balance to cover the execution on the child chain
uint256 _gasPriceBid: Gas price for the execution on the child chain
bytes _data: two pieces of data encoded:
uint256 maxSubmissionCost: Max gas deducted from user's child chain balance to cover base submission fee
bytes extraData: “0x”
Step 5: Wait for execution on the child chain
After calling the deposit method (or the outboundTransferCustomRefund if you’re choosing the manual way), you’ll have to wait a bit until the message executes on the child chain. We will verify the status of the underlying retryable ticket created to bridge the tokens. Check this page to learn more about parent-to-child chain messages, also known as retryables.

You can programmatically wait for the execution of the transaction on the child chain using Arbitrum’s SDK. You should first wait for the execution of the submission transaction (the one sent to the router contract) and then the execution of the child chain transaction.

/**
 * Now we wait for L1 and L2 side of transactions to be confirmed
 */
const depositRec = await depositTx.wait();
const l2Result = await depositRec.waitForChildTransactionReceipt(l2Provider);

/**
 * The `complete` boolean tells us if the l1 to l2 message was successful
 */
l2Result.complete
  ? console.log(`L2 message successful: status: ${L1ToL2MessageStatus[l2Result.status]}`)
  : console.log(`L2 message failed: status ${L1ToL2MessageStatus[l2Result.status]}`);

If you’re going the manual way, you can verify if the message executed on the child chain through the Retryables Dashboard. Paste the hash of the transaction submitted to the router contract, and the tool will tell you whether it’s been redeemed or not.

Step 6: Check the new token contract created on the child chain
Finally, let’s find the token contract that has been created on the child chain.

Using Arbitrum’s SDK, you can call method getChildErc20Address of the Erc20Bridger class, which will return the address of the token contract on the child chain that corresponds to the parent chain token contract sent as parameter.

/**
 * Check if our l2Wallet DappToken balance has been updated correctly
 * To do so, we use erc20Bridge to get the l2Token address and contract
 */
const l2TokenAddress = await erc20Bridger.getChildErc20Address(l1Erc20Address, l1Provider);
const l2Token = erc20Bridger.getChildTokenContract(l2Provider, l2TokenAddress);

To do this operation manually, you can call the method calculateL2TokenAddress of the router contract.

If you visit that address on Arbiscan, you’ll notice that it is a copy of the contract StandardArbERC20. This is the standard contract that is automatically created the first time a token that doesn’t exist in Arbitrum is bridged. The token bridge conceptual page has more information about this contract.

Conclusion
After finishing this process, you’ll now have a counterpart token contract automatically created on the child chain. You can bridge tokens between parent and child chains using the original token contract on the parent chain and the standard created contract on the child chain, along with the router and gateway contracts from each layer.

Resources
Concept page: Token Bridge
Arbitrum SDK





Bridge tokens via Arbitrum’s generic-custom gateway
In this how-to, you’ll learn how to bridge your own token between Ethereum (parent chain) and Arbitrum (child chain), using Arbitrum’s generic-custom gateway. For alternative ways of bridging tokens, don’t forget to check out this overview.

Familiarity with Arbitrum’s token bridge system, smart contracts, and blockchain development is expected. If you’re new to blockchain development, consider reviewing our Quickstart: Build a dApp with Arbitrum (Solidity, Hardhat) before proceeding. We will use Arbitrum’s SDK throughout this how-to, although no prior knowledge is required.

We will go through all the steps involved in the process. However, if you want to jump straight to the code, we have created this script in our tutorials repository that encapsulates the entire process.

Step 1: Review the prerequisites
As stated in the token bridge conceptual page, there are a few prerequisites to keep in mind while using this method to make a token bridgeable.

First of all, the parent chain counterpart of the token, must conform to the ICustomToken interface, meaning that:

It must have an isArbitrumEnabled method that returns 0xb1
It must have a method that makes an external call to L1CustomGateway.registerCustomL2Token specifying the address of the child chain contract, and to L1GatewayRouter.setGateway specifying the address of the custom gateway. Make these calls only once to configure the gateway.
These methods are needed to register the token via the gateway contract. If your parent chain contract does not include these methods and it is not upgradeable, you could register in one of these ways:

As a chain-owner, registration via an Arbitrum DAO proposal.
By wrapping your parent chain token and registering the wrapped version of your token.
Please note that registration is a one-time event.

Also, the child chain counterpart of the token, must conform to the IArbToken interface, meaning that:

It must havebridgeMint and bridgeBurn methods only callable by the L2CustomGateway contract
It must have an l1Address view method that returns the address of the token on the parent chain
Token compatibility with available tooling
If you want your token to be compatible out of the box with all the tooling available (e.g., the Arbitrum bridge), we recommend that you keep the implementation of the IArbToken interface as close as possible to the L2GatewayToken implementation example.

For example, if an allowance check is added to the bridgeBurn() function, the token will not be easily withdrawable through the Arbitrum bridge UI, as the UI does not prompt an approval transaction of tokens by default (it expects the tokens to follow the recommended L2GatewayToken implementation).

Step 2: Create a token and deploy it on the parent chain
We‘ll begin the process by creating and deploying a sample token on the parent chain that we will later bridge. If you already have a token contract on the parent chain, you don’t need to perform this step.

However, you will need to upgrade the contract if it doesn’t include the required methods described in the previous step.

We first create a standard ERC-20 contract using OpenZeppelin’s implementation. We make only one adjustment to that implementation, for simplicity, although it is not required: we specify an initialSupply to be pre-minted and sent to the deployer address upon creation.

We’ll also add the required methods to make our token bridgeable via the generic-custom gateway.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/ICustomToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Interface needed to call function registerTokenToL2 of the L1CustomGateway
 */
interface IL1CustomGateway {
    function registerTokenToL2(
        address _l2Address,
        uint256 _maxGas,
        uint256 _gasPriceBid,
        uint256 _maxSubmissionCost,
        address _creditBackAddress
    ) external payable returns (uint256);
}

/**
 * @title Interface needed to call function setGateway of the L2GatewayRouter
 */
interface IL2GatewayRouter {
    function setGateway(
        address _gateway,
        uint256 _maxGas,
        uint256 _gasPriceBid,
        uint256 _maxSubmissionCost,
        address _creditBackAddress
    ) external payable returns (uint256);
}

contract L1Token is Ownable, ICustomToken, ERC20 {
    address private customGatewayAddress;
    address private routerAddress;
    bool private shouldRegisterGateway;

    /**
     * @dev See {ERC20-constructor} and {Ownable-constructor}
     *
     * An initial supply amount is passed, which is preminted to the deployer.
     */
    constructor(address _customGatewayAddress, address _routerAddress, uint256 _initialSupply) ERC20("L1CustomToken", "LCT") {
        customGatewayAddress = _customGatewayAddress;
        routerAddress = _routerAddress;
        _mint(msg.sender, _initialSupply * 10 ** decimals());
    }

    /// @dev we only set shouldRegisterGateway to true when in `registerTokenOnL2`
    function isArbitrumEnabled() external view override returns (uint8) {
        require(shouldRegisterGateway, "NOT_EXPECTED_CALL");
        return uint8(0xb1);
    }

    /// @dev See {ICustomToken-registerTokenOnL2}
    function registerTokenOnL2(
        address l2CustomTokenAddress,
        uint256 maxSubmissionCostForCustomGateway,
        uint256 maxSubmissionCostForRouter,
        uint256 maxGasForCustomGateway,
        uint256 maxGasForRouter,
        uint256 gasPriceBid,
        uint256 valueForGateway,
        uint256 valueForRouter,
        address creditBackAddress
    ) public override payable onlyOwner {
        // we temporarily set `shouldRegisterGateway` to true for the callback in registerTokenToL2 to succeed
        bool prev = shouldRegisterGateway;
        shouldRegisterGateway = true;

        IL1CustomGateway(customGatewayAddress).registerTokenToL2{ value: valueForGateway }(
            l2CustomTokenAddress,
            maxGasForCustomGateway,
            gasPriceBid,
            maxSubmissionCostForCustomGateway,
            creditBackAddress
        );

        IL2GatewayRouter(routerAddress).setGateway{ value: valueForRouter }(
            customGatewayAddress,
            maxGasForRouter,
            gasPriceBid,
            maxSubmissionCostForRouter,
            creditBackAddress
        );

        shouldRegisterGateway = prev;
    }

    /// @dev See {ERC20-transferFrom}
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override(ICustomToken, ERC20) returns (bool) {
        return super.transferFrom(sender, recipient, amount);
    }

    /// @dev See {ERC20-balanceOf}
    function balanceOf(address account) public view override(ICustomToken, ERC20) returns (uint256) {
        return super.balanceOf(account);
    }
}

We now deploy that token to the parent chain.

const { ethers } = require('hardhat');
const { providers, Wallet } = require('ethers');
const { getArbitrumNetwork } = require('@arbitrum/sdk');
require('dotenv').config();

const walletPrivateKey = process.env.DEVNET_PRIVKEY;
const l1Provider = new providers.JsonRpcProvider(process.env.L1RPC);
const l2Provider = new providers.JsonRpcProvider(process.env.L2RPC);
const l1Wallet = new Wallet(walletPrivateKey, l1Provider);

/**
 * For the purpose of our tests, here we deploy an standard ERC20 token (L1Token) to L1
 * It sends its deployer (us) the initial supply of 1000
 */
const main = async () => {
  /**
   * Use l2Network to get the token bridge addresses needed to deploy the token
   */
  const l2Network = await getArbitrumNetwork(l2Provider);

  const l1Gateway = l2Network.tokenBridge.l1CustomGateway;
  const l1Router = l2Network.tokenBridge.l1GatewayRouter;

  /**
   * Deploy our custom token smart contract to L1
   * We give the custom token contract the address of l1CustomGateway and l1GatewayRouter as well as the initial supply (premine)
   */
  console.log('Deploying the test L1Token to L1:');
  const L1Token = await (await ethers.getContractFactory('L1Token')).connect(l1Wallet);
  const l1Token = await L1Token.deploy(l1Gateway, l1Router, 1000);

  await l1Token.deployed();
  console.log(`L1Token is deployed to L1 at ${l1Token.address}`);

  /**
   * Get the deployer token balance
   */
  const tokenBalance = await l1Token.balanceOf(l1Wallet.address);
  console.log(`Initial token balance of deployer: ${tokenBalance}`);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

Step 3: Create a token and deploy it on the child chain
We’ll now create and deploy the counterpart of the token we created on the parent chain to the child chain.

We’ll create a standard ERC-20 contract using OpenZeppelin’s implementation, and add the required methods from IArbToken.

// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./interfaces/IArbToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract L2Token is ERC20, IArbToken {
    address public l2Gateway;
    address public override l1Address;

    modifier onlyL2Gateway() {
        require(msg.sender == l2Gateway, "NOT_GATEWAY");
        _;
    }

    constructor(address _l2Gateway, address _l1TokenAddress) ERC20("L2CustomToken", "LCT") {
        l2Gateway = _l2Gateway;
        l1Address = _l1TokenAddress;
    }

    /**
     * @notice should increase token supply by amount, and should only be callable by the L2Gateway.
     */
    function bridgeMint(address account, uint256 amount) external override onlyL2Gateway {
        _mint(account, amount);
    }

    /**
     * @notice should decrease token supply by amount, and should only be callable by the L2Gateway.
     */
    function bridgeBurn(address account, uint256 amount) external override onlyL2Gateway {
        _burn(account, amount);
    }

        // Add any extra functionality you want your token to have.
}

We now deploy that token to the child chain.

const { ethers } = require('hardhat');
const { providers, Wallet } = require('ethers');
const { getArbitrumNetwork } = require('@arbitrum/sdk');
require('dotenv').config();

const walletPrivateKey = process.env.DEVNET_PRIVKEY;
const l2Provider = new providers.JsonRpcProvider(process.env.L2RPC);
const l2Wallet = new Wallet(walletPrivateKey, l2Provider);

const l1TokenAddress = '<address of the l1 token deployed in the previous step>';

/**
 * For the purpose of our tests, here we deploy an standard ERC20 token (L2Token) to L2
 */
const main = async () => {
  /**
   * Use l2Network to get the token bridge addresses needed to deploy the token
   */
  const l2Network = await getArbitrumNetwork(l2Provider);
  const l2Gateway = l2Network.tokenBridge.childCustomGateway;

  /**
   * Deploy our custom token smart contract to L2
   * We give the custom token contract the address of childCustomGateway as well as the address of the counterpart L1 token
   */
  console.log('Deploying the test L2Token to L2:');
  const L2Token = await (await ethers.getContractFactory('L2Token')).connect(l2Wallet);
  const l2Token = await L2Token.deploy(l2Gateway, l1TokenAddress);

  await l2Token.deployed();
  console.log(`L2Token is deployed to L2 at ${l2Token.address}`);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

Step 4: Register the custom token to the generic-custom gateway
Once we deploy both our contracts on their respective chains, it’s time to register the token in the generic-custom gateway.

As mentioned earlier, the parent chain token must complete the registration, and we’ve implemented the registerTokenOnL2 function to accomplish this. So now we only need to call that function.

When using this function, you will take two actions:

Call the function registerTokenToL2 of L1CustomGateway. This call will change the l1ToL2Token internal mapping it holds and send a retryable ticket to the counterpart L2CustomGateway contract on the child chain, setting its mapping to the new values as well.
Call the function setGateway of L1GatewayRouter. This call will change the l1TokenToGateway internal mapping it holds and will send a retryable ticket to the counterpart L2GatewayRouter contract on the child chain, to also set its mapping to the new values.
To simplify the process, we’ll use Arbitrum’s SDK. We’ll call the method registerCustomToken of the AdminErc20Bridger class, which will call the registerTokenOnL2 method of the token passed by parameter.

/**
 * Register custom token on our custom gateway
 */
const adminTokenBridger = new AdminErc20Bridger(l2Network);
const registerTokenTx = await adminTokenBridger.registerCustomToken(
  l1CustomToken.address,
  l2CustomToken.address,
  l1Wallet,
  l2Provider,
);

const registerTokenRec = await registerTokenTx.wait();
console.log(
  `Registering token txn confirmed on L1! 🙌 L1 receipt is: ${registerTokenRec.transactionHash}`,
);

/**
 * The L1 side is confirmed; now we listen and wait for the L2 side to be executed; we can do this by computing the expected txn hash of the L2 transaction.
 * To compute this txn hash, we need our message's "sequence numbers", unique identifiers of each L1 to L2 message.
 * We'll fetch them from the event logs with a helper method.
 */
const l1ToL2Msgs = await registerTokenRec.getParentToChildMessages(l2Provider);

/**
 * In principle, a single L1 txn can trigger any number of L1-to-L2 messages (each with its own sequencer number).
 * In this case, the registerTokenOnL2 method created 2 L1-to-L2 messages;
 * - (1) one to set the L1 token to the Custom Gateway via the Router, and
 * - (2) another to set the L1 token to its L2 token address via the Generic-Custom Gateway
 * Here, We check if both messages are redeemed on L2
 */
expect(l1ToL2Msgs.length, 'Should be 2 messages.').to.eq(2);

const setTokenTx = await l1ToL2Msgs[0].waitForStatus();
expect(setTokenTx.status, 'Set token not redeemed.').to.eq(ParentToChildMessageStatus.REDEEMED);

const setGateways = await l1ToL2Msgs[1].waitForStatus();
expect(setGateways.status, 'Set gateways not redeemed.').to.eq(ParentToChildMessageStatus.REDEEMED);

console.log(
  'Your custom token is now registered on our custom gateway 🥳  Go ahead and make the deposit!',
);


Conclusion
Upon completion, the parent and child chain tokens will have an established connection through the generic-custom gateway.

You can bridge tokens between the parent and child chain using the origin parent chain token and the custom token deployed on the child chain, along with the router and gateway contracts from each layer.

Suppose you want to see an example of bridging a token from the parent to the child chain using Arbitrum’s SDK. In that case, you can check out How to bridge tokens via Arbitrum’s standard ERC-20 gateway, specifically in Steps 2-5.

Frequently asked questions
Can I run the same register token process multiple times for the same parent chain token?
No, you can only register once a child chain token for the same parent chain token. After that, the call to registerTokenToL2 will revert if it runs again.

What can I do if my parent chain token is not upgradable?
As mentioned on the concept page, completing token registration can alternatively be performed as a chain-owner registration via a Arbitrum DAO proposal.

Can I set up the generic-custom gateway after a standard ERC-20 token exists on the child chain?
Yes, if your token has a standard ERC-20 counterpart on the child chain, you can follow the process of registering your custom child chain token as outlined on this page. At that moment, your parent chain token will have two counterpart tokens on the child chain, but only your new custom child chain token will be minted when depositing tokens from the parent chain (parent-to-child chain bridging). Both child chain tokens will be withdrawable (child-to-parent chain bridging), so users holding the old standard ERC-20 token will be able to withdraw back to the parent chain (using the L2CustomGateway contract instead of the bridge UI) and then deposit to the child chain to get the new custom child chain tokens.

Resources
Concept page: Token Bridge
Arbitrum SDK





How to bridge tokens via a custom gateway
Do you really need a custom gateway?
Before starting to implement and deploy a custom gateway, it is strongly encouraged to analyze the current solutions that Arbitrum’s token bridge provides: the standard gateway and the generic-custom gateway. These solutions provide enough functionality to solve the majority of bridging needs from projects. And if you are in doubt about your current approach, you can always ask for assistance on our Discord server.

In this how-to, you’ll learn how to bridge your own token between Ethereum (the parent chain) and Arbitrum (the child chain), using a custom gateway. For alternative ways of bridging tokens, don’t forget to check out this overview.

Familiarity with Arbitrum’s token bridge system, smart contracts, and blockchain development is expected. If you’re new to blockchain development, consider reviewing our Quickstart: Build a dApp with Arbitrum (Solidity, Remix) before proceeding. We will use Arbitrum’s SDK throughout this how-to, although no prior knowledge is required.

We will go through all the steps involved in the process. However, if you want to jump straight to the code, we have created this script in our tutorials repository that encapsulates the entire process.

Step 0: Review the prerequisites (a.k.a. do I really need a custom gateway?)
Before starting to implement and deploy a custom gateway, it is strongly encouraged to analyze the current solutions that Arbitrum’s token bridge provides: the standard gateway and the generic-custom gateway. These solutions provide enough functionality to solve the majority of bridging needs from projects. And if you are in doubt about your current approach, you can always ask for assistance on our Discord server.

There are several prerequisites to consider when deploying your own custom gateway.

First of all, the parent chain counterpart of the gateway, must conform to the IL1ArbitrumGateway and the ITokenGateway interfaces. This conformity means that it must have, at least:

A method outboundTransferCustomRefund, to handle forwarded calls from L1GatewayRouter.outboundTransferCustomRefund. It should only allow calls from the router.
A method outboundTransfer, to handle forwarded calls from L1GatewayRouter.outboundTransfer. It should only allow calls from the router.
A method finalizeInboundTransfer, to handle messages coming only from the child chain's gateway.
Two methods, calculateL2TokenAddress and getOutboundCalldata, to handle other bridging operations.
Methods to send cross-chain messages through the Inbox contract. You can view an example implementation in sendTxToL2 and sendTxToL2CustomRefund on L1ArbitrumMessenger.
Suppose you intend to use permissionless token registration in your gateway. In that case, your parent chain gateway should also have a registerCustomL2Token method, similar to the one method in Arbitrum’s generic-custom gateway.

On the other hand, the child chain counterpart of the gateway, must conform to the ITokenGateway interface, meaning that it must have, at least:

A method outboundTransfer, to handle external calls, and forwarded calls from L2GatewayRouter.outboundTransfer.
A method finalizeInboundTransfer, to handle messages coming only from the parent chain's gateway.
Two methods, calculateL2TokenAddress and getOutboundCalldata, to handle other bridging operations.
Methods to send cross-chain messages through the ArbSys precompile. An example implementation can be found in sendTxToL1 on L2ArbitrumMessenger.
What about my custom tokens?
If you are deploying custom gateways, you will likely want to support your custom tokens on both the parent chain and the child chain. They also have several requirements they must comply with. You can find more information about it in How to bridge tokens via Arbitrum’s generic-custom gateway.

Step 1: Create a gateway and deploy it on the parent chain
This code is for testing purposes
The code contained within the following sections is meant for testing purposes only and does not guarantee any level of security. It has not undergone any formal audit or security analysis, so it is not ready for production use. Please exercise caution and due diligence while using this code in any environment.

We‘ll begin the process by creating our custom gateway and deploying it on the parent chain. A good example of a custom gateway is Arbitrum’s generic-custom gateway. It includes all methods required, plus more to support the wide variety of tokens that are bridgeable through it.

In this case, we’ll use a simpler approach. We’ll create a gateway that supports only one token and can be enabled or disabled by the contract owner. It will also implement all necessary methods. To simplify the deployment process even further, we won’t worry about setting the addresses of the counterpart gateway and the custom tokens at deployment time. Instead, we will use a function setTokenBridgeInformation that will be called by the contract owner to initialize the gateway.

// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./interfaces/ICustomGateway.sol";
import "./CrosschainMessenger.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Example implementation of a custom gateway to be deployed on L1
 * @dev Inheritance of Ownable is optional. In this case we use it to call the function setTokenBridgeInformation
 * and simplify the test
 */
contract L1CustomGateway is IL1CustomGateway, L1CrosschainMessenger, Ownable {

    // Token bridge state variables
    address public l1CustomToken;
    address public l2CustomToken;
    address public l2Gateway;
    address public router;

    // Custom functionality
    bool public allowsDeposits;

    /**
     * Contract constructor, sets the L1 router to be used in the contract's functions and calls L1CrosschainMessenger's constructor
     * @param router_ L1GatewayRouter address
     * @param inbox_ Inbox address
     */
    constructor(
        address router_,
        address inbox_
    ) L1CrosschainMessenger(inbox_) {
        router = router_;
        allowsDeposits = false;
    }

    /**
     * Sets the information needed to use the gateway. To simplify the process of testing, this function can be called once
     * by the owner of the contract to set these addresses.
     * @param l1CustomToken_ address of the custom token on L1
     * @param l2CustomToken_ address of the custom token on L2
     * @param l2Gateway_ address of the counterpart gateway (on L2)
     */
    function setTokenBridgeInformation(
        address l1CustomToken_,
        address l2CustomToken_,
        address l2Gateway_
    ) public onlyOwner {
        require(l1CustomToken == address(0), "Token bridge information already set");
        l1CustomToken = l1CustomToken_;
        l2CustomToken = l2CustomToken_;
        l2Gateway = l2Gateway_;

        // Allows deposits after the information has been set
        allowsDeposits = true;
    }

    /// @dev See {ICustomGateway-outboundTransfer}
    function outboundTransfer(
        address l1Token,
        address to,
        uint256 amount,
        uint256 maxGas,
        uint256 gasPriceBid,
        bytes calldata data
    ) public payable override returns (bytes memory) {
        return outboundTransferCustomRefund(l1Token, to, to, amount, maxGas, gasPriceBid, data);
    }

    /// @dev See {IL1CustomGateway-outboundTransferCustomRefund}
    function outboundTransferCustomRefund(
        address l1Token,
        address refundTo,
        address to,
        uint256 amount,
        uint256 maxGas,
        uint256 gasPriceBid,
        bytes calldata data
    ) public payable override returns (bytes memory res) {
        // Only execute if deposits are allowed
        require(allowsDeposits == true, "Deposits are currently disabled");

        // Only allow calls from the router
        require(msg.sender == router, "Call not received from router");

        // Only allow the custom token to be bridged through this gateway
        require(l1Token == l1CustomToken, "Token is not allowed through this gateway");

        address from;
        uint256 seqNum;
        {
            bytes memory extraData;
            uint256 maxSubmissionCost;
            (from, maxSubmissionCost, extraData) = _parseOutboundData(data);

            // The inboundEscrowAndCall functionality has been disabled, so no data is allowed
            require(extraData.length == 0, "EXTRA_DATA_DISABLED");

            // Escrowing the tokens in the gateway
            IERC20(l1Token).transferFrom(from, address(this), amount);

            // We override the res field to save on the stack
            res = getOutboundCalldata(l1Token, from, to, amount, extraData);

            // Trigger the crosschain message
            seqNum = _sendTxToL2CustomRefund(
                l2Gateway,
                refundTo,
                from,
                msg.value,
                0,
                maxSubmissionCost,
                maxGas,
                gasPriceBid,
                res
            );
        }

        emit DepositInitiated(l1Token, from, to, seqNum, amount);
        res = abi.encode(seqNum);
    }

    /// @dev See {ICustomGateway-finalizeInboundTransfer}
    function finalizeInboundTransfer(
        address l1Token,
        address from,
        address to,
        uint256 amount,
        bytes calldata data
    ) public payable override onlyCounterpartGateway(l2Gateway) {
        // Only allow the custom token to be bridged through this gateway
        require(l1Token == l1CustomToken, "Token is not allowed through this gateway");

        // Decoding exitNum
        (uint256 exitNum, ) = abi.decode(data, (uint256, bytes));

        // Releasing the tokens in the gateway
        IERC20(l1Token).transfer(to, amount);

        emit WithdrawalFinalized(l1Token, from, to, exitNum, amount);
    }

    /// @dev See {ICustomGateway-getOutboundCalldata}
    function getOutboundCalldata(
        address l1Token,
        address from,
        address to,
        uint256 amount,
        bytes memory data
    ) public pure override returns (bytes memory outboundCalldata) {
        bytes memory emptyBytes = "";

        outboundCalldata = abi.encodeWithSelector(
            ICustomGateway.finalizeInboundTransfer.selector,
            l1Token,
            from,
            to,
            amount,
            abi.encode(emptyBytes, data)
        );

        return outboundCalldata;
    }

    /// @dev See {ICustomGateway-calculateL2TokenAddress}
    function calculateL2TokenAddress(address l1Token) public view override returns (address) {
        if (l1Token == l1CustomToken) {
            return l2CustomToken;
        }

        return address(0);
    }

    /// @dev See {ICustomGateway-counterpartGateway}
    function counterpartGateway() public view override returns (address) {
        return l2Gateway;
    }

    /**
     * Parse data received in outboundTransfer
     * @param data encoded data received
     * @return from account that initiated the deposit,
     *         maxSubmissionCost max gas deducted from user's L2 balance to cover base submission fee,
     *         extraData decoded data
     */
    function _parseOutboundData(bytes memory data)
    internal
    pure
    returns (
        address from,
        uint256 maxSubmissionCost,
        bytes memory extraData
    )
    {
        // Router encoded
        (from, extraData) = abi.decode(data, (address, bytes));

        // User encoded
        (maxSubmissionCost, extraData) = abi.decode(extraData, (uint256, bytes));
    }

    // --------------------
    // Custom methods
    // --------------------
    /**
     * Disables the ability to deposit funds
     */
    function disableDeposits() external onlyOwner {
        allowsDeposits = false;
    }

    /**
     * Enables the ability to deposit funds
     */
    function enableDeposits() external onlyOwner {
        require(l1CustomToken != address(0), "Token bridge information has not been set yet");
        allowsDeposits = true;
    }
}


IL1CustomGateway is an interface very similar to ICustomGateway, and L1CrosschainMessenger implements a method to send the cross-chain message to the child chain through the Inbox.

/**
 * @title Minimum expected implementation of a crosschain messenger contract to be deployed on L1
 */
abstract contract L1CrosschainMessenger {
    IInbox public immutable inbox;

    /**
     * Emitted when calling sendTxToL2CustomRefund
     * @param from account that submitted the retryable ticket
     * @param to account recipient of the retryable ticket
     * @param seqNum id for the retryable ticket
     * @param data data of the retryable ticket
     */
    event TxToL2(
        address indexed from,
        address indexed to,
        uint256 indexed seqNum,
        bytes data
    );

    constructor(address inbox_) {
        inbox = IInbox(inbox_);
    }

    modifier onlyCounterpartGateway(address l2Counterpart) {
        // A message coming from the counterpart gateway was executed by the bridge
        IBridge bridge = inbox.bridge();
        require(msg.sender == address(bridge), "NOT_FROM_BRIDGE");

        // And the outbox reports that the L2 address of the sender is the counterpart gateway
        address l2ToL1Sender = IOutbox(bridge.activeOutbox()).l2ToL1Sender();
        require(l2ToL1Sender == l2Counterpart, "ONLY_COUNTERPART_GATEWAY");

        _;
    }

    /**
     * Creates the retryable ticket to send over to L2 through the Inbox
     * @param to account to be credited with the tokens in the destination layer
     * @param refundTo account, or its L2 alias if it have code in L1, to be credited with excess gas refund in L2
     * @param user account with rights to cancel the retryable and receive call value refund
     * @param l1CallValue callvalue sent in the L1 submission transaction
     * @param l2CallValue callvalue for the L2 message
     * @param maxSubmissionCost max gas deducted from user's L2 balance to cover base submission fee
     * @param maxGas max gas deducted from user's L2 balance to cover L2 execution
     * @param gasPriceBid gas price for L2 execution
     * @param data encoded data for the retryable
     * @return seqnum id for the retryable ticket
     */
    function _sendTxToL2CustomRefund(
        address to,
        address refundTo,
        address user,
        uint256 l1CallValue,
        uint256 l2CallValue,
        uint256 maxSubmissionCost,
        uint256 maxGas,
        uint256 gasPriceBid,
        bytes memory data
    ) internal returns (uint256) {
        uint256 seqNum = inbox.createRetryableTicket{ value: l1CallValue }(
            to,
            l2CallValue,
            maxSubmissionCost,
            refundTo,
            user,
            maxGas,
            gasPriceBid,
            data
        );

        emit TxToL2(user, to, seqNum, data);
        return seqNum;
    }
}

We now deploy that gateway to the parent chain.

const { ethers } = require('hardhat');
const { providers, Wallet, BigNumber } = require('ethers');
const { getArbitrumNetwork, ParentToChildMessageStatus } = require('@arbitrum/sdk');
const {
  AdminErc20Bridger,
  Erc20Bridger,
} = require('@arbitrum/sdk/dist/lib/assetBridger/erc20Bridger');
require('dotenv').config();

/**
 * Set up: instantiate L1 / L2 wallets connected to providers
 */
const walletPrivateKey = process.env.DEVNET_PRIVKEY;
const l1Provider = new providers.JsonRpcProvider(process.env.L1RPC);
const l2Provider = new providers.JsonRpcProvider(process.env.L2RPC);
const l1Wallet = new Wallet(walletPrivateKey, l1Provider);
const l2Wallet = new Wallet(walletPrivateKey, l2Provider);

const main = async () => {
  /**
   * Use l2Network to create an Arbitrum SDK AdminErc20Bridger instance
   * We'll use AdminErc20Bridger for its convenience methods around registering tokens to a custom gateway
   */
  const l2Network = await getArbitrumNetwork(l2Provider);
  const erc20Bridger = new Erc20Bridger(l2Network);
  const adminTokenBridger = new AdminErc20Bridger(l2Network);
  const l1Router = l2Network.tokenBridge.parentGatewayRouter;
  const l2Router = l2Network.tokenBridge.childGatewayRouter;
  const inbox = l2Network.ethBridge.inbox;

  /**
   * Deploy our custom gateway to L1
   */
  const L1CustomGateway = await await ethers.getContractFactory('L1CustomGateway', l1Wallet);
  console.log('Deploying custom gateway to L1');
  const l1CustomGateway = await L1CustomGateway.deploy(l1Router, inbox);
  await l1CustomGateway.deployed();
  console.log(`Custom gateway is deployed to L1 at ${l1CustomGateway.address}`);
  const l1CustomGatewayAddress = l1CustomGateway.address;
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

Step 2: Create a gateway and deploy it on the child chain
We’ll now create the counterpart of the gateway we created on the parent chain and deploy it on the child chain. A good example of a custom gateway on the child chain is Arbitrum’s generic-custom gateway on a child chain.

As we did with the parent chain gateway, we’ll use a simpler approach with the same characteristics as the parent chain: it supports only one token and can be disabled/enabled by the contract owner. It will also have a setTokenBridgeInformation method to be called by the contract owner to initialize the gateway.

// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./interfaces/ICustomGateway.sol";
import "./CrosschainMessenger.sol";
import "./interfaces/IArbToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Example implementation of a custom gateway to be deployed on L2
 * @dev Inheritance of Ownable is optional. In this case we use it to call the function setTokenBridgeInformation
 * and simplify the test
 */
contract L2CustomGateway is IL2CustomGateway, L2CrosschainMessenger, Ownable {
    // Exit number (used for tradeable exits)
    uint256 public exitNum;

    // Token bridge state variables
    address public l1CustomToken;
    address public l2CustomToken;
    address public l1Gateway;
    address public router;

    // Custom functionality
    bool public allowsWithdrawals;

    /**
     * Contract constructor, sets the L2 router to be used in the contract's functions
     * @param router_ L2GatewayRouter address
     */
    constructor(address router_) {
        router = router_;
        allowsWithdrawals = false;
    }

    /**
     * Sets the information needed to use the gateway. To simplify the process of testing, this function can be called once
     * by the owner of the contract to set these addresses.
     * @param l1CustomToken_ address of the custom token on L1
     * @param l2CustomToken_ address of the custom token on L2
     * @param l1Gateway_ address of the counterpart gateway (on L1)
     */
    function setTokenBridgeInformation(
        address l1CustomToken_,
        address l2CustomToken_,
        address l1Gateway_
    ) public onlyOwner {
        require(l1CustomToken == address(0), "Token bridge information already set");
        l1CustomToken = l1CustomToken_;
        l2CustomToken = l2CustomToken_;
        l1Gateway = l1Gateway_;

        // Allows withdrawals after the information has been set
        allowsWithdrawals = true;
    }

    /// @dev See {ICustomGateway-outboundTransfer}
    function outboundTransfer(
        address l1Token,
        address to,
        uint256 amount,
        bytes calldata data
    ) public payable returns (bytes memory) {
        return outboundTransfer(l1Token, to, amount, 0, 0, data);
    }

    /// @dev See {ICustomGateway-outboundTransfer}
    function outboundTransfer(
        address l1Token,
        address to,
        uint256 amount,
        uint256, /* _maxGas */
        uint256, /* _gasPriceBid */
        bytes calldata data
    ) public payable override returns (bytes memory res) {
        // Only execute if deposits are allowed
        require(allowsWithdrawals == true, "Withdrawals are currently disabled");

        // The function is marked as payable to conform to the inheritance setup
        // This particular code path shouldn't have a msg.value > 0
        require(msg.value == 0, "NO_VALUE");

        // Only allow the custom token to be bridged through this gateway
        require(l1Token == l1CustomToken, "Token is not allowed through this gateway");

        (address from, bytes memory extraData) = _parseOutboundData(data);

        // The inboundEscrowAndCall functionality has been disabled, so no data is allowed
        require(extraData.length == 0, "EXTRA_DATA_DISABLED");

        // Burns L2 tokens in order to release escrowed L1 tokens
        IArbToken(l2CustomToken).bridgeBurn(from, amount);

        // Current exit number for this operation
        uint256 currExitNum = exitNum++;

        // We override the res field to save on the stack
        res = getOutboundCalldata(l1Token, from, to, amount, extraData);

        // Trigger the crosschain message
        uint256 id = _sendTxToL1(
            from,
            l1Gateway,
            res
        );

        emit WithdrawalInitiated(l1Token, from, to, id, currExitNum, amount);
        return abi.encode(id);
    }

    /// @dev See {ICustomGateway-finalizeInboundTransfer}
    function finalizeInboundTransfer(
        address l1Token,
        address from,
        address to,
        uint256 amount,
        bytes calldata data
    ) public payable override onlyCounterpartGateway(l1Gateway) {
        // Only allow the custom token to be bridged through this gateway
        require(l1Token == l1CustomToken, "Token is not allowed through this gateway");

        // Abi decode may revert, but the encoding is done by L1 gateway, so we trust it
        (, bytes memory callHookData) = abi.decode(data, (bytes, bytes));
        if (callHookData.length != 0) {
            // callHookData should always be 0 since inboundEscrowAndCall is disabled
            callHookData = bytes("");
        }

        // Mints L2 tokens
        IArbToken(l2CustomToken).bridgeMint(to, amount);

        emit DepositFinalized(l1Token, from, to, amount);
    }

    /// @dev See {ICustomGateway-getOutboundCalldata}
    function getOutboundCalldata(
        address l1Token,
        address from,
        address to,
        uint256 amount,
        bytes memory data
    ) public view override returns (bytes memory outboundCalldata) {
        outboundCalldata = abi.encodeWithSelector(
            ICustomGateway.finalizeInboundTransfer.selector,
            l1Token,
            from,
            to,
            amount,
            abi.encode(exitNum, data)
        );

        return outboundCalldata;
    }

    /// @dev See {ICustomGateway-calculateL2TokenAddress}
    function calculateL2TokenAddress(address l1Token) public view override returns (address) {
        if (l1Token == l1CustomToken) {
            return l2CustomToken;
        }

        return address(0);
    }

    /// @dev See {ICustomGateway-counterpartGateway}
    function counterpartGateway() public view override returns (address) {
        return l1Gateway;
    }

    /**
     * Parse data received in outboundTransfer
     * @param data encoded data received
     * @return from account that initiated the deposit,
     *         extraData decoded data
     */
    function _parseOutboundData(bytes memory data)
    internal
    view
    returns (
        address from,
        bytes memory extraData
    )
    {
        if (msg.sender == router) {
            // Router encoded
            (from, extraData) = abi.decode(data, (address, bytes));
        } else {
            from = msg.sender;
            extraData = data;
        }
    }

    // --------------------
    // Custom methods
    // --------------------
    /**
     * Disables the ability to deposit funds
     */
    function disableWithdrawals() external onlyOwner {
        allowsWithdrawals = false;
    }

    /**
     * Enables the ability to deposit funds
     */
    function enableWithdrawals() external onlyOwner {
        require(l1CustomToken != address(0), "Token bridge information has not been set yet");
        allowsWithdrawals = true;
    }
}

IL2CustomGateway is also an interface very similar to ICustomGateway, and L2CrosschainMessenger implements a method to send the cross-chain message to the parent chain through ArbSys.

/**
 * @title Minimum expected implementation of a crosschain messenger contract to be deployed on L2
 */
abstract contract L2CrosschainMessenger {
    address internal constant ARB_SYS_ADDRESS = address(100);

    /**
     * Emitted when calling sendTxToL1
     * @param from account that submits the L2-to-L1 message
     * @param to account recipient of the L2-to-L1 message
     * @param id id for the L2-to-L1 message
     * @param data data of the L2-to-L1 message
     */
    event TxToL1(
        address indexed from,
        address indexed to,
        uint256 indexed id,
        bytes data
    );

    modifier onlyCounterpartGateway(address l1Counterpart) {
        require(
            msg.sender == AddressAliasHelper.applyL1ToL2Alias(l1Counterpart),
            "ONLY_COUNTERPART_GATEWAY"
        );

        _;
    }

    /**
     * Creates an L2-to-L1 message to send over to L1 through ArbSys
     * @param from account that is sending funds from L2
     * @param to account to be credited with the tokens in the destination layer
     * @param data encoded data for the L2-to-L1 message
     * @return id id for the L2-to-L1 message
     */
    function _sendTxToL1(
        address from,
        address to,
        bytes memory data
    ) internal returns (uint256) {
        uint256 id = ArbSys(ARB_SYS_ADDRESS).sendTxToL1(to, data);

        emit TxToL1(from, to, id, data);
        return id;
    }
}

We now deploy that gateway to the child chain.

const { ethers } = require('hardhat');
const { providers, Wallet, BigNumber } = require('ethers');
const {
  getArbitrumNetwork,
  ParentToChildMessageStatus,
  AdminErc20Bridger,
  Erc20Bridger,
} = require('@arbitrum/sdk');
require('dotenv').config();

/**
 * Set up: instantiate L1 / L2 wallets connected to providers
 */
const walletPrivateKey = process.env.DEVNET_PRIVKEY;
const l1Provider = new providers.JsonRpcProvider(process.env.L1RPC);
const l2Provider = new providers.JsonRpcProvider(process.env.L2RPC);
const l1Wallet = new Wallet(walletPrivateKey, l1Provider);
const l2Wallet = new Wallet(walletPrivateKey, l2Provider);

const main = async () => {
  /**
   * Use l2Network to create an Arbitrum SDK AdminErc20Bridger instance
   * We'll use AdminErc20Bridger for its convenience methods around registering tokens to a custom gateway
   */
  const l2Network = await getArbitrumNetwork(l2Provider);
  const erc20Bridger = new Erc20Bridger(l2Network);
  const adminTokenBridger = new AdminErc20Bridger(l2Network);
  const l1Router = l2Network.tokenBridge.l1GatewayRouter;
  const l2Router = l2Network.tokenBridge.l2GatewayRouter;
  const inbox = l2Network.ethBridge.inbox;

  /**
   * Deploy our custom gateway to L2
   */
  const L2CustomGateway = await await ethers.getContractFactory('L2CustomGateway', l2Wallet);
  console.log('Deploying custom gateway to L2');
  const l2CustomGateway = await L2CustomGateway.deploy(l2Router);
  await l2CustomGateway.deployed();
  console.log(`Custom gateway is deployed to L2 at ${l2CustomGateway.address}`);
  const l2CustomGatewayAddress = l2CustomGateway.address;
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

Step 3: Deploy the custom tokens on the parent and child chains
This step will depend on your setup. In this case, as our simplified gateway supports only one token, we will deploy it on both the parent chain and the child chain to enable calling the setTokenBridgeInformation method on both gateways afterwards.

We won’t go through the process of deploying custom tokens in this How-to, but you can see a detailed explanation of the steps to take in the page How to bridge tokens via Arbitrum’s generic-custom gateway

Step 4: Configure your custom tokens on your gateways
This step will also depend on your setup. In this case, our simplified gateway requires method setTokenBridgeInformation to be called on both gateways to set the addresses of the counterpart gateway and both custom tokens.

/**
 * Set the token bridge information on the custom gateways
 * (This is an optional step that depends on your configuration. In this example, we've added one-shot
 * functions on the custom gateways to set the token bridge addresses in a second step. This could be
 * avoided if you are using proxies or the opcode CREATE2 for example)
 */
console.log('Setting token bridge information on L1CustomGateway:');
const setTokenBridgeInfoOnL1 = await l1CustomGateway.setTokenBridgeInformation(
  l1CustomToken.address,
  l2CustomToken.address,
  l2CustomGatewayAddress,
);

const setTokenBridgeInfoOnL1Rec = await setTokenBridgeInfoOnL1.wait();
console.log(
  `Token bridge information set on L1CustomGateway! L1 receipt is: ${setTokenBridgeInfoOnL1Rec.transactionHash}`,
);

console.log('Setting token bridge information on L2CustomGateway:');
const setTokenBridgeInfoOnL2 = await l2CustomGateway.setTokenBridgeInformation(
  l1CustomToken.address,
  l2CustomToken.address,
  l1CustomGatewayAddress,
);

const setTokenBridgeInfoOnL2Rec = await setTokenBridgeInfoOnL2.wait();
console.log(
  `Token bridge information set on L2CustomGateway! L2 receipt is: ${setTokenBridgeInfoOnL2Rec.transactionHash}`,
);

Step 5: Register the custom token with your custom gateway
Once all contracts are deployed successfully on their respective chains, and they all have the information of the gateways and tokens, it’s time to register the token in your custom gateway.

As mentioned in How to bridge tokens via Arbitrum’s generic-custom gateway, this action needs to be done by the parent chain token, and we’ve implemented the function registerTokenOnL2 to do it. So now we only need to call that function.

In this case, when using this function, a single action occurs:

Call the function setGateway of L1GatewayRouter. This call will change the l1TokenToGateway internal mapping it holds and will send a retryable ticket to the counterpart L2GatewayRouter contract on the child chain, to also set its mapping to the new values.
To simplify the process, we’ll use Arbitrum’s SDK and call the method registerCustomToken of the AdminErc20Bridger class, which will call the registerTokenOnL2 method of the token passed by parameter.

/**
 * Register the custom gateway as the gateway of our custom token
 */
console.log('Registering custom token on L2:');
const registerTokenTx = await adminTokenBridger.registerCustomToken(
  l1CustomToken.address,
  l2CustomToken.address,
  l1Wallet,
  l2Provider,
);

const registerTokenRec = await registerTokenTx.wait();
console.log(
  `Registering token txn confirmed on L1! 🙌 L1 receipt is: ${registerTokenRec.transactionHash}.`,
);
console.log(
  `Waiting for L2 retryable (takes 10-15 minutes); current time: ${new Date().toTimeString()})`,
);

/**
 * The L1 side is confirmed; now we listen and wait for the L2 side to be executed; we can do this by computing the expected txn hash of the L2 transaction.
 * To compute this txn hash, we need our message's "sequence numbers", unique identifiers of each L1 to L2 message.
 * We'll fetch them from the event logs with a helper method.
 */
const l1ToL2Msgs = await registerTokenRec.getParentToChildMessages(l2Provider);

/**
 * In this case, the registerTokenOnL2 method creates 1 L1-to-L2 messages to set the L1 token to the Custom Gateway via the Router
 * Here, We check if that message is redeemed on L2
 */
expect(l1ToL2Msgs.length, 'Should be 1 message.').to.eq(1);

const setGateways = await l1ToL2Msgs[0].waitForStatus();
expect(setGateways.status, 'Set gateways not redeemed.').to.eq(ParentToChildMessageStatus.REDEEMED);

console.log('Your custom token and gateways are now registered on the token bridge 🥳!');


Conclusion
Upon completion of all the steps, registration of your parent chain and child chain gateways in the token bridge will be complete, and both tokens will have connections through your custom gateway.

You can bridge tokens between the parent chain and child chain using the custom tokens, along with the router and gateway contracts from each layer.

Suppose you want to see an example of bridging a token from the parent to the child chain using Arbitrum’s SDK. In that case, you can check out How to bridge tokens via Arbitrum’s standard ERC-20 gateway, specifically in Steps 2-5.

The full code of this how-to and a more extensive deployment and testing scripts can be found in this package of our tutorials repository.

Resources
Concept page: Token Bridge
Arbitrum SDK
Token bridge contract addresses






RPC endpoints and providers
Arbitrum public RPC endpoints
caution
Unlike the RPC Urls, the Sequencer endpoints only support eth_sendRawTransaction and eth_sendRawTransactionConditional calls.
Arbitrum public RPCs do not provide Websocket support.
View the faucets for testnet Sepolia tokens on L2.
This section provides an overview of the available public RPC endpoints for different Arbitrum chains and necessary details to interact with them.

Name	RPC Url(s)	Chain ID	Block explorer	Underlying chain	Tech stack	Sequencer feed URL	Sequencer endpoint⚠️
Arbitrum One	https://arb1.arbitrum.io/rpc	42161	Arbiscan, Blockscout	Ethereum	Nitro (Rollup)	wss://arb1-feed.arbitrum.io/feed	https://arb1-sequencer.arbitrum.io/rpc
Arbitrum Nova	https://nova.arbitrum.io/rpc	42170	Arbiscan, Blockscout	Ethereum	Nitro (AnyTrust)	wss://nova-feed.arbitrum.io/feed	https://nova-sequencer.arbitrum.io/rpc
Arbitrum Sepolia (Testnet)	https://sepolia-rollup.arbitrum.io/rpc	421614	Arbiscan, Blockscout	Sepolia	Nitro (Rollup)	wss://sepolia-rollup.arbitrum.io/feed	https://sepolia-rollup-sequencer.arbitrum.io/rpc
More RPC endpoints
More Arbitrum chain RPC endpoints can be found in Chain Connect: Arbitrum One and Arbitrum Nova.

Alternatively, to interact with public Arbitrum chains, you can rely on many of the same popular node providers that you are already using on Ethereum:

Third-party RPC providers
WANT TO BE LISTED HERE?
Complete this form , if you'd like to see your project added to this list (and the Arbitrum portal).

Provider	Arb One?	Arb Nova?	Arb Sepolia?	Websocket?	Stylus Tracing?
1RPC	✅				
Alchemy	✅	✅	✅	✅	Available on paid plans
Allnodes	✅	✅		✅	
All That Node	✅		✅	✅	
Ankr	✅			✅	Available on paid plans
BlockPi	✅	✅			
Chainbase	✅			✅	
Chainnodes	✅				
Chainstack	✅			✅	Available on paid plans
dRPC	✅	✅	✅	✅	
GetBlock	✅			✅	
Infura	✅		✅	✅	Enabled on request
Lava	✅	✅			
Moralis	✅				
Nirvana Labs	✅	✅	✅	✅	
NodeReal	✅	✅			
NOWNodes	✅				
Pocket Network	✅				
PublicNode	✅	✅	✅		
Quicknode	✅	✅	✅	✅	Testnet supported in free tier
Tenderly	✅	✅	✅	✅	Testnet supported in free tier
Unifra	✅				
Validation Cloud	✅		✅	✅	Testnet supported in free tier




Smart contract addresses
The following information may be useful to those building on Arbitrum. We list the addresses of the smart contracts related to the protocol, the token bridge and precompiles of the different Arbitrum chains.

Protocol smart contracts
Core contracts
The following contracts are deployed on Ethereum (L1)

Arbitrum One	Arbitrum Nova	Arbitrum Sepolia
Rollup	0x4DCe...Cfc0	0xE7E8...B7Bd	0x042B...0Cf4
Sequencer Inbox	0x1c47...82B6	0x211E...c21b	0x6c97...be0D
CoreProxyAdmin	0x5547...2dbD	0x71D7...7148	0x1ed7...0686
Cross-chain messaging contracts
The following contracts are deployed on Ethereum (L1)

Arbitrum One	Arbitrum Nova	Arbitrum Sepolia
Delayed Inbox	0x4Dbd...AB3f	0xc444...3949	0xaAe2...ae21
Bridge	0x8315...ed3a	0xC1Eb...76Bd	0x38f9...33a9
Outbox	0x0B98...4840	0xD4B8...cc58	0x65f0...B78F
Classic Outbox***	0x7607...1A40
0x667e...337a		
***Migrated Network Only

Fraud proof contracts
The following contracts are deployed on Ethereum (L1)

Arbitrum One	Arbitrum Nova	Arbitrum Sepolia
ChallengeManager	0xA556...9fB0	0xFE66...A688	0xC60b...8B4C
OneStepProver0	0x35FB...F731	0x35FB...F731	0x3Fe7...1377
OneStepProverMemory	0xe0ba...C48b	0xe0ba...C48b	0x6268...ec2d
OneStepProverMath	0xaB95...F921	0xaB95...F921	0x42f5...e8Fa
OneStepProverHostIo	0xa07c...71Cf	0xa07c...71Cf	0xdB2c...C165
OneStepProofEntry	0x4397...42d6	0x4397...42d6	0xB9cf...AE80
Token bridge smart contracts
Core contracts
The following contracts are deployed on Ethereum (L1)

Arbitrum One	Arbitrum Nova	Arbitrum Sepolia
L1 Gateway Router	0x72Ce...31ef	0xC840...cD48	0xcE18...8264
L1 ERC20 Gateway	0xa3A7...0EeC	0xB253...21bf	0x902b...3aFF
L1 Arb-Custom Gateway	0xcEe2...180d	0x2312...232f	0xba2F...40F3
L1 Weth Gateway	0xd920...e2db	0xE4E2...0BaE	0xA8aD...0e1E
L1 Weth	0xC02a...6Cc2	0xC02a...6Cc2	0x7b79...E7f9
L1 Proxy Admin	0x9aD4...0aDa	0xa8f7...e560	0xDBFC...44b0
The following contracts are deployed on the corresponding L2 chain

Arbitrum One	Arbitrum Nova	Arbitrum Sepolia
L2 Gateway Router	0x5288...F933	0x2190...DFa8	0x9fDD...43C7
L2 ERC20 Gateway	0x09e9...1EEe	0xcF9b...9257	0x6e24...b502
L2 Arb-Custom Gateway	0x0967...5562	0xbf54...51F4	0x8Ca1...42C5
L2 Weth Gateway	0x6c41...623B	0x7626...D9eD	0xCFB1...556D
L2 Weth	0x82aF...Bab1	0x722E...5365	0x980B...7c73
L2 Proxy Admin	0xd570...2a86	0xada7...d92C	0x715D...5FdF
Third party gateways
The following contracts are deployed on Ethereum (L1)

Arbitrum One
L1 Dai Gateway	0xD3B5...3011
L1 Livepeer Gateway	0x6142...0676
The following contracts are deployed on the corresponding L2 chain

Arbitrum One
L2 Dai Gateway	0x4671...6C65
L2 Livepeer Gateway	0x6D24...D318
Precompiles
The following precompiles are deployed on every L2 chain and always have the same address

Arbitrum One	Arbitrum Nova	Arbitrum Sepolia
ArbAddressTable	0x0000...0066	0x0000...0066	0x0000...0066
ArbAggregator	0x0000...006D	0x0000...006D	0x0000...006D
ArbFunctionTable	0x0000...0068	0x0000...0068	0x0000...0068
ArbGasInfo	0x0000...006C	0x0000...006C	0x0000...006C
ArbInfo	0x0000...0065	0x0000...0065	0x0000...0065
ArbOwner	0x0000...0070	0x0000...0070	0x0000...0070
ArbOwnerPublic	0x0000...006b	0x0000...006b	0x0000...006b
ArbRetryableTx	0x0000...006E	0x0000...006E	0x0000...006E
ArbStatistics	0x0000...006F	0x0000...006F	0x0000...006F
ArbSys	0x0000...0064	0x0000...0064	0x0000...0064
ArbWasm	0x0000...0071	0x0000...0071	0x0000...0071
ArbWasmCache	0x0000...0072	0x0000...0072	0x0000...0072
NodeInterface	0x0000...00C8	0x0000...00C8	0x0000...00C8
Misc
The following contracts are deployed on the corresponding L2 chain

Arbitrum One	Arbitrum Nova	Arbitrum Sepolia
L2 Multicall	0x842e...4EB2	0x5e1e...cB86	0xA115...d092








Chain parameters
Param	Description	Arbitrum One	Arbitrum Nova	Arb Sepolia
Dispute window	Time for assertions to get confirmed during which validators can issue a challenge	45818 blocks (~ 6.4 days )	45818 blocks (~ 6.4 days)	20 blocks (~ 4.0 minutes)
Minimum bond amount	Amount of funds required for a validator to propose assertion on the parent chain	3600 ETH	1 ETH	1 Sepolia ETH
Force-include period	Period after which a delayed message can be included into the inbox without any action from the Sequencer	5760 blocks / 24 hours	5760 blocks / 24 hours	5760 blocks / 24 hours
Gas speed limit	Target gas/sec, over which the congestion mechanism activates	7,000,000 gas/sec	7,000,000 gas/sec	7,000,000 gas/sec
Gas price floor	Minimum gas price	0.01 gwei	0.01 gwei	0.1 gwei
Block gas limit	Maximum amount of gas that all the transactions inside a block are allowed to consume	32,000,000	32,000,000	32,000,000






Development frameworks
KNOW MORE TOOLS?
See something missing? Let us know on the Arbitrum Discord or by opening an issue on GitHub.

The following tools will help you develop and test your decentralized apps (dApps):

Hardhat
Hardhat is a comprehensive development environment designed specifically for Ethereum, Arbitrum and, in general, EVM developers. It streamlines the process of creating, compiling, deploying, testing, and debugging smart contracts. By providing a robust and customizable framework, Hardhat makes it easy to manage complex projects and integrate with other tools in the ecosystem. Its features include a built-in console, advanced debugging capabilities, and support for extending functionality through plugins, allowing developers to create efficient and secure decentralized applications.

Foundry
Foundry is a high-performance, portable, and modular toolkit designed for EVM application development, leveraging the Rust programming language. It offers a comprehensive suite of tools to streamline the process of creating, testing, and deploying smart contracts on the Ethereum, Arbitrum and, in general, any EVM network. Foundry facilitates seamless interaction with EVM smart contracts, transactions, and chain data, while also providing a local node and a user-friendly Solidity REPL environment for efficient development.

thirdweb
thirdweb SDK covers all aspects of the Web3 development stack, including connecting to user’s wallets, interacting with the blockchain and smart contracts, decentralized storage, authentication, and more; enabling you to build scalable and performant Web3 applications on any EVM-compatible blockchain. Out of the box, infrastructure is provided for everything required to create decentralized applications, including connection to the blockchain (RPC), decentralized storage (IPFS + pinning services), and tools to create powerful user experiences; such as gasless transactions, wallet connection components, FIAT on-ramps, data APIs, and more.

Brownie
Brownie is a Python-based framework designed for developing and testing smart contracts on the Ethereum Virtual Machine. It offers full support for Solidity and Vyper programming languages and utilizes pytest for contract testing. Brownie also incorporates trace-based coverage evaluation, property-based and stateful testing with Hypothesis, and powerful debugging tools, including Python-style tracebacks and custom error strings.






Web3 libraries and tools
KNOW MORE TOOLS?
See something missing? Let us know on the Arbitrum Discord or by opening an issue on GitHub.

The following frameworks will help you build your decentralized apps:

Name	Language	Description	Documentation
Ethers.js	TypeScript	Ethers.js is a lightweight library for Ethereum and EVM-compatible blockchains. It offers secure key management, node compatibility, ENS integration and supports JSON wallets, mnemonic phrases, and HD wallets. The library is TypeScript-ready and well-documented under the MIT License.	Ethers.js Documentation
alloy	Rust	Alloy is a collection of utilities and crates for Ethereum development in Rust. It helps create and manage Rust prototypes that support Ethereum-like smart contract execution. Alloy focuses on interoperability and cross-chain communication..	alloy Documentation
thirdweb SDK	TypeScript	thirdweb SDK offers a comprehensive suite for Web3 development on EVM-compatible blockchains. It includes wallet connectivity, blockchain interaction, decentralized storage, and authentication. Gasless transactions, wallet components, FIAT on-ramps, and data APIs are key features.	thirdweb SDK Portal
Viem	TypeScript	Viem is a modular tool for Ethereum and EVM-compatible blockchain development. It provides performance-optimized APIs, JSON-RPC API abstractions, and smart contract interaction tools, and it supports environments like Anvil, Hardhat, and Ganache.	Viem
Web3.js	JavaScript	Web3.js is a JavaScript library for Ethereum and EVM-compatible node interaction. It enables transactions via HTTP, IPC, or WebSocket. Compatible with web browsers, Node.js, and Electron, it's commonly used with MetaMask.	Web3.js GitHub
Web3.py	Python	Web3.py is a Python library for interacting with Ethereum and EVM-compatible blockchains. It facilitates transactions, smart contract operations, and blockchain data access. Tailored for Python developers, it's a versatile tool for Ethereum-based applications.	Web3.py GitHub




Monitoring tools and block explorers
KNOW MORE TOOLS?
See something missing? Let us know on the Arbitrum Discord or by opening an issue on GitHub.

Here, we offer a compilation of tools and blockchain explorers that enable you to examine and oversee transactions, smart contracts, and overall blockchain activity related to decentralized applications (dApps) on different Arbitrum chains.

Tool	Use-cases	Relevant links
Arbiscan	Track/trace transactions and examine addresses on Arbitrum networks	
Arbitrum One: https://arbiscan.io/
Arbitrum Nova: https://nova.arbiscan.io/
Arbitrum Sepolia: https://sepolia.arbiscan.io
Blockscout	Track/trace transactions and examine addresses on Arbitrum networks	
Arbitrum One: https://arbitrum.blockscout.com/
Arbitrum Nova: https://arbitrum-nova.blockscout.com/
Arbitrum Sepolia: https://arbitrum-sepolia.blockscout.com/
Chainbase	Index, transform, and use onchain data at scale	Chainbase
DexGuru	Track/trace transactions and examine addresses on Arbitrum networks	
Arbitrum One: https://arbitrum.dex.guru/
Arbitrum Nova: https://nova.dex.guru/
Dune	Visualize and analyze Arbitrum network data	
Dune
Arbitrum community-created Duune dashboard
OKLINK	Track/trace transactions and examine addresses on Arbitrum One network	
Arbitrum One: https://www.oklink.com/arbitrum







Introduction
The Arbitrum SDK is a powerful TypeScript library that streamlines interactions with Arbitrum networks. It offers robust tools for bridging tokens and passing messages between networks through an intuitive interface to the underlying smart contracts.

Key Features

Token Bridging: Effortlessly bridge tokens between Ethereum and Arbitrum.
Message Passing: Seamlessly pass messages across networks.
Contracts Interface: Leverage a strongly-typed interface for interacting with smart contracts.
Below is an overview of the Arbitrum SDK functionality. See the tutorials for more examples.

Getting Started
Install dependencies

npm
yarn
pnpm
npm install @arbitrum/sdk

Using the Arbitrum SDK
Bridging assets
Arbitrum SDK can be used to bridge assets to or from an Arbitrum Network. The following asset bridgers are currently available:

EthBridger
Erc20Bridger
All asset bridgers have the following methods which accept different parameters depending on the asset bridger type:

deposit - moves assets from the Parent to the Child chain
withdraw - moves assets from the Child to the Parent chain
Example ETH Deposit to Arbitrum One
import { getArbitrumNetwork, EthBridger } from '@arbitrum/sdk'

// get the `@arbitrum/sdk` ArbitrumNetwork object using the chain id of the Arbitrum One chain
const childNetwork = await getArbitrumNetwork(42161)
const ethBridger = new EthBridger(childNetwork)

const ethDepositTxResponse = await ethBridger.deposit({
  amount: utils.parseEther('23'),
  parentSigner, // an ethers v5 signer connected to mainnet ethereum
  childProvider, // an ethers v5 provider connected to Arbitrum One
})

const ethDepositTxReceipt = await ethDepositTxResponse.wait()

Learn more in the Eth Deposit tutorial

Example ETH Withdrawal from Arbitrum One
import { getArbitrumNetwork, EthBridger } from '@arbitrum/sdk'

// get the `@arbitrum/sdk` ArbitrumNetwork object using the chain id of the Arbitrum One chain
const childNetwork = await getArbitrumNetwork(42161)
const ethBridger = new EthBridger(childNetwork)

const withdrawTx = await ethBridger.withdraw({
  amount: utils.parseEther('23'),
  childSigner, // an ethers v5 signer connected to Arbitrum One
  destinationAddress: childWallet.address,
})
const withdrawRec = await withdrawTx.wait()

Learn more in the Eth Withdraw tutorial

Networks
Arbitrum SDK comes pre-configured for Mainnet and Sepolia, and their Arbitrum counterparts. Any other networks that are not pre-configured must be registered before being used.

Configuring Network
To interact with a custom ArbitrumNetwork, you can register it using the registerCustomArbitrumNetwork function.

import { registerCustomArbitrumNetwork } from '@arbitrum/sdk'

registerCustomArbitrumNetwork({
  chainID: 123456,
  name: 'Custom Arbitrum Network',
})

Cross chain messages
When assets are moved by the Parent and Child cross chain messages are sent. The lifecycles of these messages are encapsulated in the classes ParentToChildMessage and ChildToParentMessage. These objects are commonly created from the receipts of transactions that send cross chain messages. A cross chain message will eventually result in a transaction being executed on the destination chain, and these message classes provide the ability to wait for that finalizing transaction to occur.

Redeem a Parent-to-Child Message
import {
  ParentTransactionReceipt,
  ParentToChildMessageStatus,
} from '@arbitrum/sdk'

const parentTxnReceipt = new ParentTransactionReceipt(
  txnReceipt // ethers-js TransactionReceipt of an ethereum tx that triggered a Parent-to-Child message (say depositing a token via a bridge)
)

const parentToChildMessage = (
  await parentTxnReceipt.getParentToChildMessages(
    childSigner // connected ethers-js Wallet
  )
)[0]

const res = await parentToChildMessage.waitForStatus()

if (res.status === ParentToChildMessageStatus.Child) {
  // Message wasn't auto-redeemed; redeem it now:
  const response = await parentToChildMessage.redeem()
  const receipt = await response.wait()
} else if (res.status === ParentToChildMessageStatus.REDEEMED) {
  // Message successfully redeemed
}


Learn more in the Redeem Failed Retryable Tickets tutorial

Inbox Tools
As part of normal operation, the Arbitrum sequencer will send messages into the rollup chain. However, if the sequencer is unavailable and not posting batches, the inbox tools can be used to force the inclusion of transactions into the Arbitrum network.

Here's how you can use the inbox tools to withdraw ether from Arbitrum One without waiting for the sequencer:

const childNetwork = await getArbitrumNetwork(await childWallet.getChainId())

const inboxSdk = new InboxTools(parentWallet, childNetwork)
const arbSys = ArbSys__factory.connect(ARB_SYS_ADDRESS, childProvider)
const arbSysIface = arbSys.interface
const childCalldata = arbSysIface.encodeFunctionData('withdrawEth', [
  parentWallet.address,
])

const txChildRequest = {
  data: childCalldata,
  to: ARB_SYS_ADDRESS,
  value: 1,
}

const childSignedTx = await inboxSdk.signChildTx(txChildRequest, childWallet)
const childTxhash = ethers.utils.parseTransaction(childSignedTx).hash
const resultsParent = await inboxSdk.sendChildSignedTx(childSignedTx)

const inboxRec = await resultsParent.wait()

Learn more in the Delayed Inbox tutorial.

Utils
EventFetcher - A utility to provide typing for the fetching of events
MultiCaller - A utility for executing multiple calls as part of a single RPC request. This can be useful for reducing round trips.
constants - A list of useful Arbitrum related constants
Development
Run Integration tests
Copy the .env-sample file to .env and update the values with your own.
First, make sure you have a Nitro test node running. Follow the instructions here.
After the node has started up (that could take up to 20-30 mins), run yarn gen:network.
Once done, finally run yarn test:integration to run the integration tests.
Defaults to Arbitrum Sepolia, for custom network use --network flag.

Arbitrum Sepolia expects env var ARB_KEY to be prefunded with at least 0.02 ETH, and env var INFURA_KEY to be set. (see integration_test/config.ts)






 
 Migrating from v3 to v4
Introduction
@arbitrum/sdk v4 introduces significant changes to improve support Orbit chains from Offchain Labs. This guide outlines the breaking changes to know before migrating your existing v3 code to v4.

Major Changes Overview
Terminology change from L1/L2 to parent/child
Network types and functions updated
Updates to AssetBridger and Erc20Bridger classes
Changes to Message classes
Detailed Changes
1. Terminology change from L1/L2 to parent/child
Most instances of "L1" and "L2" have been replaced with "parent" and "child" respectively. This change reflects the more general parent-child relationship between chains in the Arbitrum ecosystem.

In most circumstances, when referring to a parent-child relationship between chains, the terms "parent" and "child" are used.
Though, when referring explicitly to "L1", "L2", or "L3", those specific terms are still used.
2. Network types and functions updated
The L1Network is no longer required to be registered before bridging.
Only Arbitrum networks need to be registered.
Arbitrum networks are defined as Arbitrum One, Arbitrum testnets, and any Orbit chain.
If you need a full list of Arbitrum networks, you can use the new getArbitrumNetworks function.
To list all of the children of a network, use the new getChildrenForNetwork function.
v3 Name	v4 Name
L2Network	ArbitrumNetwork
getL2Network	getArbitrumNetwork
l2Networks	getArbitrumNetworks
addCustomNetwork	registerCustomArbitrumNetwork
Network	removed
L1Network	removed
getL1Network	removed
getParentForNetwork	removed
ArbitrumNetwork type
Network type has been replaced with the ArbitrumNetwork type and some properties have been removed or renamed.

v3 Name	v4 Name
chainID	chainId
partnerChainID	parentChainId
explorerUrl	removed
isArbitrum	removed
partnerChainIDs	removed
nitroGenesisBlock	removed
nitroGenesisL1Block	removed
depositTimeout	removed
blockTime	removed
TokenBridge type
The TokenBridge type within theArbitrumNetwork object has been updated.

v3 Name	v4 Name
l1CustomGateway	parentCustomGateway
l1ERC20Gateway	parentErc20Gateway
l1GatewayRouter	parentGatewayRouter
l1MultiCall	parentMultiCall
l1ProxyAdmin	parentProxyAdmin
l1Weth	parentWeth
l1WethGateway	parentWethGateway
l2CustomGateway	childCustomGateway
l2ERC20Gateway	childErc20Gateway
l2GatewayRouter	childGatewayRouter
l2Multicall	childMultiCall
l2ProxyAdmin	childProxyAdmin
l2Weth	childWeth
l2WethGateway	childWethGateway
3. Updates to AssetBridger and Erc20Bridger classes
AssetBridger Class Methods
The AssetBridger class methods and properties have been renamed to reflect the new parent-child terminology.

v3 Name	v4 Name
l2Network	childNetwork
checkL1Network	checkParentNetwork
checkL2Network	checkChildNetwork
AssetBridger Class Method Parameters
The objects passed to the class methods of classes that inherit from AssetBridger (EthBridger and Erc20Bridger) have been renamed.

v3 Name	v4 Name
erc20L1Address	erc20ParentAddress
l1Provider	parentProvider
l2Provider	childProvider
l1Signer	parentSigner
l2Signer	childSigner
Erc20Bridger Class Methods
v3 Name	v4 Name
getL1GatewayAddress	getParentGatewayAddress
getL2GatewayAddress	getChildGatewayAddress
getL2WithdrawalEvents	getWithdrawalEvents
getL1TokenContract	getParentTokenContract
getL1ERC20Address	getParentErc20Address
getL2TokenContract	getChildTokenContract
getL2ERC20Address	getChildErc20Address
l1TokenIsDisabled	isDepositDisabled
l1Provider	parentProvider
getL1GatewaySetEvents	getParentGatewaySetEvents
getL2GatewaySetEvents	getChildGatewaySetEvents
Erc20L1L3Bridger Class Methods
v3 Name	v4 Name
getL2ERC20Address	getL2Erc20Address
getL3ERC20Address	getL3Erc20Address
4. Changes to Message classes
Message classes have been renamed and their methods updated:

v3 Name	v4 Name
L1TransactionReceipt	ParentTransactionReceipt
L1ContractTransaction	ParentContractTransaction
L1ToL2Message	ParentToChildMessage
L1ToL2MessageWriter	ParentToChildMessageWriter
L1ToL2MessageReader	ParentToChildMessageReader
L1ToL2MessageReaderClassic	ParentToChildMessageReaderClassic
L1ToL2MessageStatus	ParentToChildMessageStatus
L1ToL2MessageGasEstimator	ParentToChildMessageGasEstimator
L2TransactionReceipt	ChildTransactionReceipt
L2ContractTransaction	ChildContractTransaction
L2ToL1Message	ChildToParentMessage
L2ToL1MessageWriter	ChildToParentMessageWriter
L2ToL1MessageReader	ChildToParentMessageReader
L2ToL1MessageStatus	ChildToParentMessageStatus
EthDepositStatus	EthDepositMessageStatus
EthDepositMessageWaitResult	EthDepositMessageWaitForStatusResult
L1ToL2MessageWaitResult	ParentToChildMessageWaitForStatusResult
ChildToParentMessageClassic
v3 Name	v4 Name
getL2ToL1Events	getChildToParentEvents
ChildToParentChainMessageNitro
v3 Name	v4 Name
getL2ToL1Events	getChildToParentEvents
ChildTransactionReceipt
v3 Name	v4 Name
getL2ToL1Events	getChildToParentEvents
getL2ToL1Messages	getChildToParentMessages
ParentToChildMessage
v3 Name	v4 Name
EthDepositStatus	EthDepositMessageStatus
ParentToChildMessageStatus
v3 Name	v4 Name
FUNDS_DEPOSITED_ON_L2	FUNDS_DEPOSITED_ON_CHILD
ParentTransactionReceipt
v3 Name	v4 Name
getL1ToL2MessagesClassic	getParentToChildMessagesClassic
getL1ToL2Messages	getParentToChildMessages
ParentEthDepositTransactionReceipt
v3 Name	v4 Name
waitForL2	waitForChildTransactionReceipt
ParentContractCallTransactionReceipt
v3 Name	v4 Name
waitForL2	waitForChildTransactionReceipt



assetBridger
Classes
abstract AssetBridger<DepositParams, WithdrawParams>
Base for bridging assets from parent-to-child and back

Extended by
Erc20Bridger
EthBridger
Type parameters
Type parameter
DepositParams
WithdrawParams
Properties
Property	Modifier	Type	Description
nativeToken?	readonly	string	In case of a chain that uses ETH as its native/gas token, this is either undefined or the zero address

In case of a chain that uses an ERC-20 token from the parent network as its native/gas token, this is the address of said token on the parent network
Accessors
nativeTokenIsEth
get protected nativeTokenIsEth(): boolean

Whether the chain uses ETH as its native/gas token

Returns
boolean

Source
assetBridger/assetBridger.ts:72

Methods
checkChildNetwork()
protected checkChildNetwork(sop: SignerOrProvider): Promise<void>

Check the signer/provider matches the child network, throws if not

Parameters
Parameter	Type	Description
sop	SignerOrProvider	
Returns
Promise<void>

Source
assetBridger/assetBridger.ts:61

checkParentNetwork()
protected checkParentNetwork(sop: SignerOrProvider): Promise<void>

Check the signer/provider matches the parent network, throws if not

Parameters
Parameter	Type	Description
sop	SignerOrProvider	
Returns
Promise<void>

Source
assetBridger/assetBridger.ts:50

deposit()
abstract deposit(params: DepositParams): Promise<ParentContractTransaction<ParentTransactionReceipt>>

Transfer assets from parent-to-child

Parameters
Parameter	Type	Description
params	DepositParams	
Returns
Promise<ParentContractTransaction<ParentTransactionReceipt>>

Source
assetBridger/assetBridger.ts:80

withdraw()
abstract withdraw(params: WithdrawParams): Promise<ChildContractTransaction>

Transfer assets from child-to-parent

Parameters
Parameter	Type	Description
params	WithdrawParams	
Returns
Promise<ChildContractTransaction>

Source
assetBridger/assetBridger.ts:88





erc20Bridger
Classes
AdminErc20Bridger
Admin functionality for the token bridge

Extends
Erc20Bridger
Constructors
new AdminErc20Bridger()
new AdminErc20Bridger(childNetwork: ArbitrumNetwork): AdminErc20Bridger

Bridger for moving ERC20 tokens back and forth between parent-to-child

Parameters
Parameter	Type
childNetwork	ArbitrumNetwork
Returns
AdminErc20Bridger

Inherited from
Erc20Bridger . constructor

Source
assetBridger/erc20Bridger.ts:205

Properties
Property	Modifier	Type	Description	Inherited from
nativeToken?	readonly	string	In case of a chain that uses ETH as its native/gas token, this is either undefined or the zero address

In case of a chain that uses an ERC-20 token from the parent network as its native/gas token, this is the address of said token on the parent network	Erc20Bridger.nativeToken
Accessors
nativeTokenIsEth
get protected nativeTokenIsEth(): boolean

Whether the chain uses ETH as its native/gas token

Returns
boolean

Source
assetBridger/assetBridger.ts:72

Methods
approveGasToken()
approveGasToken(params: ApproveParamsOrTxRequest): Promise<ContractTransaction>

Approves the custom gas token to be spent by the relevant gateway on the parent network

Parameters
Parameter	Type	Description
params	ApproveParamsOrTxRequest	
Returns
Promise<ContractTransaction>

Inherited from
Erc20Bridger . approveGasToken

Source
assetBridger/erc20Bridger.ts:276

approveToken()
approveToken(params: ApproveParamsOrTxRequest): Promise<ContractTransaction>

Approve tokens for deposit to the bridge. The tokens will be approved for the relevant gateway.

Parameters
Parameter	Type	Description
params	ApproveParamsOrTxRequest	
Returns
Promise<ContractTransaction>

Inherited from
Erc20Bridger . approveToken

Source
assetBridger/erc20Bridger.ts:339

checkChildNetwork()
protected checkChildNetwork(sop: SignerOrProvider): Promise<void>

Check the signer/provider matches the child network, throws if not

Parameters
Parameter	Type	Description
sop	SignerOrProvider	
Returns
Promise<void>

Inherited from
Erc20Bridger . checkChildNetwork

Source
assetBridger/assetBridger.ts:61

checkParentNetwork()
protected checkParentNetwork(sop: SignerOrProvider): Promise<void>

Check the signer/provider matches the parent network, throws if not

Parameters
Parameter	Type	Description
sop	SignerOrProvider	
Returns
Promise<void>

Inherited from
Erc20Bridger . checkParentNetwork

Source
assetBridger/assetBridger.ts:50

deposit()
deposit(params: Erc20DepositParams | ParentToChildTxReqAndSignerProvider): Promise<ParentContractCallTransaction>

Execute a token deposit from parent to child network

Parameters
Parameter	Type	Description
params	Erc20DepositParams | ParentToChildTxReqAndSignerProvider	
Returns
Promise<ParentContractCallTransaction>

Inherited from
Erc20Bridger . deposit

Source
assetBridger/erc20Bridger.ts:769

getApproveGasTokenRequest()
getApproveGasTokenRequest(params: ProviderTokenApproveParams): Promise<Required<Pick<TransactionRequest, "to" | "value" | "data">>>


Creates a transaction request for approving the custom gas token to be spent by the relevant gateway on the parent network

Parameters
Parameter	Type	Description
params	ProviderTokenApproveParams	
Returns
Promise<Required<Pick<TransactionRequest, "to" | "value" | "data">>>

Inherited from
Erc20Bridger . getApproveGasTokenRequest

Source
assetBridger/erc20Bridger.ts:260

getApproveTokenRequest()
getApproveTokenRequest(params: ProviderTokenApproveParams): Promise<Required<Pick<TransactionRequest, "to" | "value" | "data">>>

Get a tx request to approve tokens for deposit to the bridge. The tokens will be approved for the relevant gateway.

Parameters
Parameter	Type	Description
params	ProviderTokenApproveParams	
Returns
Promise<Required<Pick<TransactionRequest, "to" | "value" | "data">>>

Inherited from
Erc20Bridger . getApproveTokenRequest

Source
assetBridger/erc20Bridger.ts:306

getChildErc20Address()
getChildErc20Address(erc20ParentAddress: string, parentProvider: Provider): Promise<string>

Get the corresponding child network token address for the provided parent network token

Parameters
Parameter	Type	Description
erc20ParentAddress	string	
parentProvider	Provider	
Returns
Promise<string>

Inherited from
Erc20Bridger . getChildErc20Address

Source
assetBridger/erc20Bridger.ts:491

getChildGatewayAddress()
getChildGatewayAddress(erc20ParentAddress: string, childProvider: Provider): Promise<string>

Get the address of the child gateway for this token

Parameters
Parameter	Type	Description
erc20ParentAddress	string	
childProvider	Provider	
Returns
Promise<string>

Inherited from
Erc20Bridger . getChildGatewayAddress

Source
assetBridger/erc20Bridger.ts:244

getChildGatewaySetEvents()
getChildGatewaySetEvents(
   childProvider: Provider, 
   filter: object, 
customNetworkChildGatewayRouter?: string): Promise<object[]>

Get all the gateway set events on the child gateway router

Parameters
Parameter	Type	Description
childProvider	Provider	The provider for the child network
filter	object	An object containing fromBlock and toBlock to filter events
filter.fromBlock	BlockTag	-
filter.toBlock?	BlockTag	-
customNetworkChildGatewayRouter?	string	Optional address of the custom network child gateway router
Returns
Promise<object[]>

An array of GatewaySetEvent event arguments

Throws
If the network is custom and customNetworkChildGatewayRouter is not provided

Source
assetBridger/erc20Bridger.ts:1233

getChildTokenContract()
getChildTokenContract(childProvider: Provider, childTokenAddr: string): L2GatewayToken

Get the child network token contract at the provided address Note: This function just returns a typed ethers object for the provided address, it doesn't check the underlying form of the contract bytecode to see if it's an erc20, and doesn't ensure the validity of any of the underlying functions on that contract.

Parameters
Parameter	Type	Description
childProvider	Provider	
childTokenAddr	string	
Returns
L2GatewayToken

Inherited from
Erc20Bridger . getChildTokenContract

Source
assetBridger/erc20Bridger.ts:462

getDepositRequest()
getDepositRequest(params: DepositRequest): Promise<ParentToChildTransactionRequest>

Get the arguments for calling the deposit function

Parameters
Parameter	Type	Description
params	DepositRequest	
Returns
Promise <ParentToChildTransactionRequest>

Inherited from
Erc20Bridger . getDepositRequest

Source
assetBridger/erc20Bridger.ts:655

getParentErc20Address()
getParentErc20Address(erc20ChildChainAddress: string, childProvider: Provider): Promise<string>

Get the corresponding parent network address for the provided child network token Validates the returned address against the child network router to ensure it is correctly mapped to the provided erc20ChildChainAddress

Parameters
Parameter	Type	Description
erc20ChildChainAddress	string	
childProvider	Provider	
Returns
Promise<string>

Inherited from
Erc20Bridger . getParentErc20Address

Source
assetBridger/erc20Bridger.ts:514

getParentGatewayAddress()
getParentGatewayAddress(erc20ParentAddress: string, parentProvider: Provider): Promise<string>

Get the address of the parent gateway for this token

Parameters
Parameter	Type	Description
erc20ParentAddress	string	
parentProvider	Provider	
Returns
Promise<string>

Inherited from
Erc20Bridger . getParentGatewayAddress

Source
assetBridger/erc20Bridger.ts:226

getParentGatewaySetEvents()
getParentGatewaySetEvents(parentProvider: Provider, filter: object): Promise<object[]>

Get all the gateway set events on the Parent gateway router

Parameters
Parameter	Type	Description
parentProvider	Provider	The provider for the parent network
filter	object	An object containing fromBlock and toBlock to filter events
filter.fromBlock	BlockTag	-
filter.toBlock	BlockTag	-
Returns
Promise<object[]>

An array of GatewaySetEvent event arguments

Source
assetBridger/erc20Bridger.ts:1207

getParentTokenContract()
getParentTokenContract(parentProvider: Provider, parentTokenAddr: string): ERC20

Get the parent token contract at the provided address Note: This function just returns a typed ethers object for the provided address, it doesnt check the underlying form of the contract bytecode to see if it's an erc20, and doesn't ensure the validity of any of the underlying functions on that contract.

Parameters
Parameter	Type	Description
parentProvider	Provider	
parentTokenAddr	string	
Returns
ERC20

Inherited from
Erc20Bridger . getParentTokenContract

Source
assetBridger/erc20Bridger.ts:478

getWithdrawalEvents()
getWithdrawalEvents(
   childProvider: Provider, 
   gatewayAddress: string, 
   filter: object, 
   parentTokenAddress?: string, 
   fromAddress?: string, 
toAddress?: string): Promise<object & object[]>

Get the child network events created by a withdrawal

Parameters
Parameter	Type	Description
childProvider	Provider	
gatewayAddress	string	
filter	object	
filter.fromBlock	BlockTag	-
filter.toBlock?	BlockTag	-
parentTokenAddress?	string	
fromAddress?	string	
toAddress?	string	-
Returns
Promise<object & object[]>

Inherited from
Erc20Bridger . getWithdrawalEvents

Source
assetBridger/erc20Bridger.ts:367

getWithdrawalRequest()
getWithdrawalRequest(params: Erc20WithdrawParams): Promise<ChildToParentTransactionRequest>

Get the arguments for calling the token withdrawal function

Parameters
Parameter	Type	Description
params	Erc20WithdrawParams	
Returns
Promise <ChildToParentTransactionRequest>

Inherited from
Erc20Bridger . getWithdrawalRequest

Source
assetBridger/erc20Bridger.ts:826

isDepositDisabled()
isDepositDisabled(parentTokenAddress: string, parentProvider: Provider): Promise<boolean>

Whether the token has been disabled on the router

Parameters
Parameter	Type	Description
parentTokenAddress	string	
parentProvider	Provider	
Returns
Promise<boolean>

Inherited from
Erc20Bridger . isDepositDisabled

Source
assetBridger/erc20Bridger.ts:560

isRegistered()
isRegistered(params: object): Promise<boolean>

Checks if the token has been properly registered on both gateways. Mostly useful for tokens that use a custom gateway.

Parameters
Parameter	Type	Description
params	object	
params.childProvider	Provider	
params.erc20ParentAddress	string	
params.parentProvider	Provider	
Returns
Promise<boolean>

Inherited from
Erc20Bridger . isRegistered

Source
assetBridger/erc20Bridger.ts:924

registerCustomToken()
registerCustomToken(
   parentTokenAddress: string, 
   childTokenAddress: string, 
   parentSigner: Signer, 
childProvider: Provider): Promise<ParentContractTransaction<ParentTransactionReceipt>>

Register a custom token on the Arbitrum bridge See https://developer.offchainlabs.com/docs/bridging_assets#the-arbitrum-generic-custom-gateway for more details

Parameters
Parameter	Type	Description
parentTokenAddress	string	Address of the already deployed parent token. Must inherit from https://developer.offchainlabs.com/docs/sol_contract_docs/md_docs/arb-bridge-peripherals/tokenbridge/ethereum/icustomtoken.
childTokenAddress	string	Address of the already deployed child token. Must inherit from https://developer.offchainlabs.com/docs/sol_contract_docs/md_docs/arb-bridge-peripherals/tokenbridge/arbitrum/iarbtoken.
parentSigner	Signer	The signer with the rights to call registerTokenOnL2 on the parent token
childProvider	Provider	Arbitrum rpc provider
Returns
Promise<ParentContractTransaction<ParentTransactionReceipt>>

Source
assetBridger/erc20Bridger.ts:1035

setGateways()
setGateways(
   parentSigner: Signer, 
   childProvider: Provider, 
   tokenGateways: TokenAndGateway[], 
options?: GasOverrides): Promise<ParentContractCallTransaction>

Register the provided token addresses against the provided gateways

Parameters
Parameter	Type	Description
parentSigner	Signer	
childProvider	Provider	
tokenGateways	TokenAndGateway[]	
options?	GasOverrides	-
Returns
Promise<ParentContractCallTransaction>

Source
assetBridger/erc20Bridger.ts:1266

withdraw()
withdraw(params: OmitTyped<Erc20WithdrawParams, "from"> & object | ChildToParentTxReqAndSigner): Promise<ChildContractTransaction>


Withdraw tokens from child to parent network

Parameters
Parameter	Type	Description
params	OmitTyped<Erc20WithdrawParams, "from"> & object | ChildToParentTxReqAndSigner	
Returns
Promise<ChildContractTransaction>

Inherited from
Erc20Bridger . withdraw

Source
assetBridger/erc20Bridger.ts:889

fromProvider()
static fromProvider(childProvider: Provider): Promise<Erc20Bridger>

Instantiates a new Erc20Bridger from a child provider

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise <Erc20Bridger>

Inherited from
Erc20Bridger . fromProvider

Source
assetBridger/erc20Bridger.ts:216

Erc20Bridger
Bridger for moving ERC20 tokens back and forth between parent-to-child

Extends
AssetBridger<Erc20DepositParams | ParentToChildTxReqAndSignerProvider, OmitTyped<Erc20WithdrawParams, "from"> | ChildToParentTransactionRequest>
Extended by
AdminErc20Bridger
Constructors
new Erc20Bridger()
new Erc20Bridger(childNetwork: ArbitrumNetwork): Erc20Bridger

Bridger for moving ERC20 tokens back and forth between parent-to-child

Parameters
Parameter	Type
childNetwork	ArbitrumNetwork
Returns
Erc20Bridger

Overrides
AssetBridger< Erc20DepositParams | ParentToChildTxReqAndSignerProvider, OmitTyped<Erc20WithdrawParams, 'from'> | ChildToParentTransactionRequest >.constructor

Source
assetBridger/erc20Bridger.ts:205

Properties
Property	Modifier	Type	Description	Inherited from
nativeToken?	readonly	string	In case of a chain that uses ETH as its native/gas token, this is either undefined or the zero address

In case of a chain that uses an ERC-20 token from the parent network as its native/gas token, this is the address of said token on the parent network	AssetBridger.nativeToken
Accessors
nativeTokenIsEth
get protected nativeTokenIsEth(): boolean

Whether the chain uses ETH as its native/gas token

Returns
boolean

Source
assetBridger/assetBridger.ts:72

Methods
approveGasToken()
approveGasToken(params: ApproveParamsOrTxRequest): Promise<ContractTransaction>

Approves the custom gas token to be spent by the relevant gateway on the parent network

Parameters
Parameter	Type	Description
params	ApproveParamsOrTxRequest	
Returns
Promise<ContractTransaction>

Source
assetBridger/erc20Bridger.ts:276

approveToken()
approveToken(params: ApproveParamsOrTxRequest): Promise<ContractTransaction>

Approve tokens for deposit to the bridge. The tokens will be approved for the relevant gateway.

Parameters
Parameter	Type	Description
params	ApproveParamsOrTxRequest	
Returns
Promise<ContractTransaction>

Source
assetBridger/erc20Bridger.ts:339

checkChildNetwork()
protected checkChildNetwork(sop: SignerOrProvider): Promise<void>

Check the signer/provider matches the child network, throws if not

Parameters
Parameter	Type	Description
sop	SignerOrProvider	
Returns
Promise<void>

Inherited from
AssetBridger . checkChildNetwork

Source
assetBridger/assetBridger.ts:61

checkParentNetwork()
protected checkParentNetwork(sop: SignerOrProvider): Promise<void>

Check the signer/provider matches the parent network, throws if not

Parameters
Parameter	Type	Description
sop	SignerOrProvider	
Returns
Promise<void>

Inherited from
AssetBridger . checkParentNetwork

Source
assetBridger/assetBridger.ts:50

deposit()
deposit(params: Erc20DepositParams | ParentToChildTxReqAndSignerProvider): Promise<ParentContractCallTransaction>

Execute a token deposit from parent to child network

Parameters
Parameter	Type	Description
params	Erc20DepositParams | ParentToChildTxReqAndSignerProvider	
Returns
Promise<ParentContractCallTransaction>

Overrides
AssetBridger . deposit

Source
assetBridger/erc20Bridger.ts:769

getApproveGasTokenRequest()
getApproveGasTokenRequest(params: ProviderTokenApproveParams): Promise<Required<Pick<TransactionRequest, "to" | "value" | "data">>>


Creates a transaction request for approving the custom gas token to be spent by the relevant gateway on the parent network

Parameters
Parameter	Type	Description
params	ProviderTokenApproveParams	
Returns
Promise<Required<Pick<TransactionRequest, "to" | "value" | "data">>>

Source
assetBridger/erc20Bridger.ts:260

getApproveTokenRequest()
getApproveTokenRequest(params: ProviderTokenApproveParams): Promise<Required<Pick<TransactionRequest, "to" | "value" | "data">>>

Get a tx request to approve tokens for deposit to the bridge. The tokens will be approved for the relevant gateway.

Parameters
Parameter	Type	Description
params	ProviderTokenApproveParams	
Returns
Promise<Required<Pick<TransactionRequest, "to" | "value" | "data">>>

Source
assetBridger/erc20Bridger.ts:306

getChildErc20Address()
getChildErc20Address(erc20ParentAddress: string, parentProvider: Provider): Promise<string>

Get the corresponding child network token address for the provided parent network token

Parameters
Parameter	Type	Description
erc20ParentAddress	string	
parentProvider	Provider	
Returns
Promise<string>

Source
assetBridger/erc20Bridger.ts:491

getChildGatewayAddress()
getChildGatewayAddress(erc20ParentAddress: string, childProvider: Provider): Promise<string>

Get the address of the child gateway for this token

Parameters
Parameter	Type	Description
erc20ParentAddress	string	
childProvider	Provider	
Returns
Promise<string>

Source
assetBridger/erc20Bridger.ts:244

getChildTokenContract()
getChildTokenContract(childProvider: Provider, childTokenAddr: string): L2GatewayToken

Get the child network token contract at the provided address Note: This function just returns a typed ethers object for the provided address, it doesn't check the underlying form of the contract bytecode to see if it's an erc20, and doesn't ensure the validity of any of the underlying functions on that contract.

Parameters
Parameter	Type	Description
childProvider	Provider	
childTokenAddr	string	
Returns
L2GatewayToken

Source
assetBridger/erc20Bridger.ts:462

getDepositRequest()
getDepositRequest(params: DepositRequest): Promise<ParentToChildTransactionRequest>

Get the arguments for calling the deposit function

Parameters
Parameter	Type	Description
params	DepositRequest	
Returns
Promise <ParentToChildTransactionRequest>

Source
assetBridger/erc20Bridger.ts:655

getDepositRequestCallValue()
private getDepositRequestCallValue(depositParams: OmitTyped<ParentToChildMessageGasParams, "deposit">): BigNumber | BigNumber

Get the call value for the deposit transaction request

Parameters
Parameter	Type	Description
depositParams	OmitTyped<ParentToChildMessageGasParams, "deposit">	
Returns
BigNumber | BigNumber

Source
assetBridger/erc20Bridger.ts:593

getDepositRequestOutboundTransferInnerData()
private getDepositRequestOutboundTransferInnerData(depositParams: OmitTyped<ParentToChildMessageGasParams, "deposit">, decimals: number): string


Get the data param for call to outboundTransfer

Parameters
Parameter	Type	Description
depositParams	OmitTyped<ParentToChildMessageGasParams, "deposit">	
decimals	number	-
Returns
string

Source
assetBridger/erc20Bridger.ts:616

getParentErc20Address()
getParentErc20Address(erc20ChildChainAddress: string, childProvider: Provider): Promise<string>

Get the corresponding parent network address for the provided child network token Validates the returned address against the child network router to ensure it is correctly mapped to the provided erc20ChildChainAddress

Parameters
Parameter	Type	Description
erc20ChildChainAddress	string	
childProvider	Provider	
Returns
Promise<string>

Source
assetBridger/erc20Bridger.ts:514

getParentGatewayAddress()
getParentGatewayAddress(erc20ParentAddress: string, parentProvider: Provider): Promise<string>

Get the address of the parent gateway for this token

Parameters
Parameter	Type	Description
erc20ParentAddress	string	
parentProvider	Provider	
Returns
Promise<string>

Source
assetBridger/erc20Bridger.ts:226

getParentTokenContract()
getParentTokenContract(parentProvider: Provider, parentTokenAddr: string): ERC20

Get the parent token contract at the provided address Note: This function just returns a typed ethers object for the provided address, it doesnt check the underlying form of the contract bytecode to see if it's an erc20, and doesn't ensure the validity of any of the underlying functions on that contract.

Parameters
Parameter	Type	Description
parentProvider	Provider	
parentTokenAddr	string	
Returns
ERC20

Source
assetBridger/erc20Bridger.ts:478

getWithdrawalEvents()
getWithdrawalEvents(
   childProvider: Provider, 
   gatewayAddress: string, 
   filter: object, 
   parentTokenAddress?: string, 
   fromAddress?: string, 
toAddress?: string): Promise<object & object[]>

Get the child network events created by a withdrawal

Parameters
Parameter	Type	Description
childProvider	Provider	
gatewayAddress	string	
filter	object	
filter.fromBlock	BlockTag	-
filter.toBlock?	BlockTag	-
parentTokenAddress?	string	
fromAddress?	string	
toAddress?	string	-
Returns
Promise<object & object[]>

Source
assetBridger/erc20Bridger.ts:367

getWithdrawalRequest()
getWithdrawalRequest(params: Erc20WithdrawParams): Promise<ChildToParentTransactionRequest>

Get the arguments for calling the token withdrawal function

Parameters
Parameter	Type	Description
params	Erc20WithdrawParams	
Returns
Promise <ChildToParentTransactionRequest>

Source
assetBridger/erc20Bridger.ts:826

isDepositDisabled()
isDepositDisabled(parentTokenAddress: string, parentProvider: Provider): Promise<boolean>

Whether the token has been disabled on the router

Parameters
Parameter	Type	Description
parentTokenAddress	string	
parentProvider	Provider	
Returns
Promise<boolean>

Source
assetBridger/erc20Bridger.ts:560

isRegistered()
isRegistered(params: object): Promise<boolean>

Checks if the token has been properly registered on both gateways. Mostly useful for tokens that use a custom gateway.

Parameters
Parameter	Type	Description
params	object	
params.childProvider	Provider	
params.erc20ParentAddress	string	
params.parentProvider	Provider	
Returns
Promise<boolean>

Source
assetBridger/erc20Bridger.ts:924

isWethGateway()
private isWethGateway(gatewayAddress: string, parentProvider: Provider): Promise<boolean>

Is this a known or unknown WETH gateway

Parameters
Parameter	Type	Description
gatewayAddress	string	
parentProvider	Provider	
Returns
Promise<boolean>

Source
assetBridger/erc20Bridger.ts:436

looksLikeWethGateway()
private looksLikeWethGateway(potentialWethGatewayAddress: string, parentProvider: Provider): Promise<boolean>

Does the provided address look like a weth gateway

Parameters
Parameter	Type	Description
potentialWethGatewayAddress	string	
parentProvider	Provider	
Returns
Promise<boolean>

Source
assetBridger/erc20Bridger.ts:406

withdraw()
withdraw(params: OmitTyped<Erc20WithdrawParams, "from"> & object | ChildToParentTxReqAndSigner): Promise<ChildContractTransaction>


Withdraw tokens from child to parent network

Parameters
Parameter	Type	Description
params	OmitTyped<Erc20WithdrawParams, "from"> & object | ChildToParentTxReqAndSigner	
Returns
Promise<ChildContractTransaction>

Overrides
AssetBridger . withdraw

Source
assetBridger/erc20Bridger.ts:889

fromProvider()
static fromProvider(childProvider: Provider): Promise<Erc20Bridger>

Instantiates a new Erc20Bridger from a child provider

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise <Erc20Bridger>

Source
assetBridger/erc20Bridger.ts:216



ethBridger
Classes
EthBridger
Bridger for moving either ETH or custom gas tokens back and forth between parent and child networks

Extends
AssetBridger<EthDepositParams | EthDepositToParams | ParentToChildTxReqAndSigner, EthWithdrawParams | ChildToParentTxReqAndSigner>
Properties
Property	Modifier	Type	Description	Inherited from
nativeToken?	readonly	string	In case of a chain that uses ETH as its native/gas token, this is either undefined or the zero address

In case of a chain that uses an ERC-20 token from the parent network as its native/gas token, this is the address of said token on the parent network	AssetBridger.nativeToken
Accessors
nativeTokenIsEth
get protected nativeTokenIsEth(): boolean

Whether the chain uses ETH as its native/gas token

Returns
boolean

Source
assetBridger/assetBridger.ts:72

Methods
approveGasToken()
approveGasToken(params: WithParentSigner<ApproveGasTokenParamsOrTxRequest>): Promise<TransactionResponse>

Approves the custom gas token to be spent by the Inbox on the parent network.

Parameters
Parameter	Type	Description
params	WithParentSigner<ApproveGasTokenParamsOrTxRequest>	
Returns
Promise<TransactionResponse>

Source
assetBridger/ethBridger.ts:223

checkChildNetwork()
protected checkChildNetwork(sop: SignerOrProvider): Promise<void>

Check the signer/provider matches the child network, throws if not

Parameters
Parameter	Type	Description
sop	SignerOrProvider	
Returns
Promise<void>

Inherited from
AssetBridger . checkChildNetwork

Source
assetBridger/assetBridger.ts:61

checkParentNetwork()
protected checkParentNetwork(sop: SignerOrProvider): Promise<void>

Check the signer/provider matches the parent network, throws if not

Parameters
Parameter	Type	Description
sop	SignerOrProvider	
Returns
Promise<void>

Inherited from
AssetBridger . checkParentNetwork

Source
assetBridger/assetBridger.ts:50

deposit()
deposit(params: EthDepositParams | ParentToChildTxReqAndSigner): Promise<ParentEthDepositTransaction>

Deposit ETH from Parent onto Child network

Parameters
Parameter	Type	Description
params	EthDepositParams | ParentToChildTxReqAndSigner	
Returns
Promise<ParentEthDepositTransaction>

Overrides
AssetBridger . deposit

Source
assetBridger/ethBridger.ts:291

depositTo()
depositTo(params: EthDepositToParams | ParentToChildTransactionRequest & object & object): Promise<ParentContractCallTransaction>

Deposit ETH from parent network onto a different child network address

Parameters
Parameter	Type	Description
params	EthDepositToParams | ParentToChildTransactionRequest & object & object	
Returns
Promise<ParentContractCallTransaction>

Source
assetBridger/ethBridger.ts:354

getApproveGasTokenRequest()
getApproveGasTokenRequest(params?: ApproveGasTokenParams): Required<Pick<TransactionRequest, "to" | "value" | "data">>

Creates a transaction request for approving the custom gas token to be spent by the inbox on the parent network

Parameters
Parameter	Type	Description
params?	ApproveGasTokenParams	
Returns
Required<Pick<TransactionRequest, "to" | "value" | "data">>

Source
assetBridger/ethBridger.ts:195

getDepositRequest()
getDepositRequest(params: EthDepositRequestParams): Promise<OmitTyped<ParentToChildTransactionRequest, "retryableData">>

Gets tx request for depositing ETH or custom gas token

Parameters
Parameter	Type	Description
params	EthDepositRequestParams	
Returns
Promise <OmitTyped <ParentToChildTransactionRequest, "retryableData">>

Source
assetBridger/ethBridger.ts:272

getDepositRequestData()
private getDepositRequestData(params: EthDepositRequestParams): string

Gets transaction calldata for a tx request for depositing ETH or custom gas token

Parameters
Parameter	Type	Description
params	EthDepositRequestParams	
Returns
string

Source
assetBridger/ethBridger.ts:245

getDepositToRequest()
getDepositToRequest(params: EthDepositToRequestParams): Promise<ParentToChildTransactionRequest>

Get a transaction request for an ETH deposit to a different child network address using Retryables

Parameters
Parameter	Type	Description
params	EthDepositToRequestParams	
Returns
Promise <ParentToChildTransactionRequest>

Source
assetBridger/ethBridger.ts:316

getWithdrawalRequest()
getWithdrawalRequest(params: EthWithdrawParams): Promise<ChildToParentTransactionRequest>

Get a transaction request for an eth withdrawal

Parameters
Parameter	Type	Description
params	EthWithdrawParams	
Returns
Promise <ChildToParentTransactionRequest>

Source
assetBridger/ethBridger.ts:387

isApproveGasTokenParams()
private isApproveGasTokenParams(params: ApproveGasTokenParamsOrTxRequest): params is WithParentSigner<ApproveGasTokenParams>

Asserts that the provided argument is of type ApproveGasTokenParams and not ApproveGasTokenTxRequest.

Parameters
Parameter	Type	Description
params	ApproveGasTokenParamsOrTxRequest	
Returns
params is WithParentSigner<ApproveGasTokenParams>

Source
assetBridger/ethBridger.ts:185

withdraw()
withdraw(params: ChildToParentTxReqAndSigner | EthWithdrawParams & object): Promise<ChildContractTransaction>

Withdraw ETH from child network onto parent network

Parameters
Parameter	Type	Description
params	ChildToParentTxReqAndSigner | EthWithdrawParams & object	
Returns
Promise<ChildContractTransaction>

Overrides
AssetBridger . withdraw

Source
assetBridger/ethBridger.ts:423

fromProvider()
static fromProvider(childProvider: Provider): Promise<EthBridger>

Instantiates a new EthBridger from a child network Provider

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise <EthBridger>

Source
assetBridger/ethBridger.ts:177






l1l3Bridger
Classes
Erc20L1L3Bridger
Bridger for moving ERC20 tokens from L1 to L3

Extends
BaseL1L3Bridger
Properties
Property	Modifier	Type	Default value	Description
_l1FeeTokenAddress	protected	undefined | string	undefined	If the L3 network uses a custom fee token, this is the address of that token on L1
l2ForwarderFactoryDefaultGasLimit	readonly	BigNumber	...	Default gas limit for L2ForwarderFactory.callForwarder of 1,000,000

Measured Standard: 361746

Measured OnlyGasToken: 220416

Measured NonGasTokenToCustomGas: 373449
l2GasTokenAddress	readonly	undefined | string	undefined	If the L3 network uses a custom (non-eth) fee token, this is the address of that token on L2
teleporter	readonly	Teleporter	undefined	Addresses of teleporter contracts on L2
Methods
_checkL1Network()
protected _checkL1Network(sop: SignerOrProvider): Promise<void>

Check the signer/provider matches the l1Network, throws if not

Parameters
Parameter	Type	Description
sop	SignerOrProvider	
Returns
Promise<void>

Inherited from
BaseL1L3Bridger._checkL1Network

Source
assetBridger/l1l3Bridger.ts:306

_checkL2Network()
protected _checkL2Network(sop: SignerOrProvider): Promise<void>

Check the signer/provider matches the l2Network, throws if not

Parameters
Parameter	Type	Description
sop	SignerOrProvider	
Returns
Promise<void>

Inherited from
BaseL1L3Bridger._checkL2Network

Source
assetBridger/l1l3Bridger.ts:314

_checkL3Network()
protected _checkL3Network(sop: SignerOrProvider): Promise<void>

Check the signer/provider matches the l3Network, throws if not

Parameters
Parameter	Type	Description
sop	SignerOrProvider	
Returns
Promise<void>

Inherited from
BaseL1L3Bridger._checkL3Network

Source
assetBridger/l1l3Bridger.ts:322

_decodeCallForwarderCalldata()
protected _decodeCallForwarderCalldata(data: string): L2ForwarderParamsStruct

Given raw calldata for a callForwarder call, decode the parameters

Parameters
Parameter	Type
data	string
Returns
L2ForwarderParamsStruct

Source
assetBridger/l1l3Bridger.ts:1402

_decodeTeleportCalldata()
protected _decodeTeleportCalldata(data: string): TeleportParamsStruct

Given raw calldata for a teleport tx, decode the teleport parameters

Parameters
Parameter	Type
data	string
Returns
TeleportParamsStruct

Source
assetBridger/l1l3Bridger.ts:1388

_fillPartialTeleportParams()
protected _fillPartialTeleportParams(
   partialTeleportParams: OmitTyped<TeleportParamsStruct, "gasParams">, 
   retryableOverrides: Erc20L1L3DepositRequestRetryableOverrides, 
   l1Provider: Provider, 
   l2Provider: Provider, 
l3Provider: Provider): Promise<object>

Given TeleportParams without the gas parameters, return TeleportParams with gas parameters populated. Does not modify the input parameters.

Parameters
Parameter	Type
partialTeleportParams	OmitTyped<TeleportParamsStruct, "gasParams">
retryableOverrides	Erc20L1L3DepositRequestRetryableOverrides
l1Provider	Provider
l2Provider	Provider
l3Provider	Provider
Returns
Promise<object>

Member	Type
costs	[BigNumber, BigNumber, number, RetryableGasCostsStructOutput] & object
teleportParams	object
teleportParams.amount	BigNumberish
teleportParams.gasParams	RetryableGasParamsStruct
teleportParams.l1Token	string
teleportParams.l1l2Router	string
teleportParams.l2l3RouterOrInbox	string
teleportParams.l3FeeTokenL1Addr	string
teleportParams.to	string
Source
assetBridger/l1l3Bridger.ts:1194

_getL1L2FeeTokenBridgeGasEstimates()
protected _getL1L2FeeTokenBridgeGasEstimates(params: object): Promise<RetryableGasValues>

Estimate the gasLimit and maxSubmissionFee for the L1 to L2 fee token bridge leg of a teleportation

Parameters
Parameter	Type
params	object
params.feeTokenAmount	BigNumber
params.l1GasPrice	BigNumber
params.l1Provider	Provider
params.l2ForwarderAddress	string
params.l2Provider	Provider
params.l3FeeTokenL1Addr	string
Returns
Promise<RetryableGasValues>

Source
assetBridger/l1l3Bridger.ts:1056

_getL1L2TokenBridgeGasEstimates()
protected _getL1L2TokenBridgeGasEstimates(params: object): Promise<RetryableGasValues>

Estimate the gasLimit and maxSubmissionFee for the L1 to L2 token bridge leg of a teleportation

Parameters
Parameter	Type
params	object
params.amount	BigNumberish
params.l1GasPrice	BigNumber
params.l1Provider	Provider
params.l1Token	string
params.l2ForwarderAddress	string
params.l2Provider	Provider
Returns
Promise<RetryableGasValues>

Source
assetBridger/l1l3Bridger.ts:1024

_getL2ForwarderFactoryGasEstimates()
protected _getL2ForwarderFactoryGasEstimates(l1GasPrice: BigNumber, l1Provider: Provider): Promise<RetryableGasValues>

Estimate the gasLimit and maxSubmissionFee for L2ForwarderFactory.callForwarder leg of a teleportation. Gas limit is hardcoded to 1,000,000

Parameters
Parameter	Type
l1GasPrice	BigNumber
l1Provider	Provider
Returns
Promise<RetryableGasValues>

Source
assetBridger/l1l3Bridger.ts:1095

_getL2L3BridgeGasEstimates()
protected _getL2L3BridgeGasEstimates(params: object): Promise<RetryableGasValues>

Estimate the gasLimit and maxSubmissionFee for the L2 -> L3 leg of a teleportation.

Parameters
Parameter	Type
params	object
params.l1Provider	Provider
params.l2ForwarderAddress	string
params.l2GasPrice	BigNumber
params.l2Provider	Provider
params.l3Provider	Provider
params.partialTeleportParams	OmitTyped<TeleportParamsStruct, "gasParams">
Returns
Promise<RetryableGasValues>

Source
assetBridger/l1l3Bridger.ts:1117

_getTokenBridgeGasEstimates()
protected _getTokenBridgeGasEstimates(params: object): Promise<RetryableGasValues>

Estimate the gasLimit and maxSubmissionFee for a token bridge retryable

Parameters
Parameter	Type
params	object
params.amount	BigNumber
params.childProvider	Provider
params.from	string
params.isWeth	boolean
params.parentErc20Address	string
params.parentGasPrice	BigNumber
params.parentGatewayAddress	string
params.parentProvider	Provider
params.to	string
Returns
Promise<RetryableGasValues>

Source
assetBridger/l1l3Bridger.ts:976

_l2ForwarderFactoryCalldataSize()
protected _l2ForwarderFactoryCalldataSize(): number

Returns
number

The size of the calldata for a call to L2ForwarderFactory.callForwarder

Source
assetBridger/l1l3Bridger.ts:1366

approveGasToken()
approveGasToken(params: TxRequestParams | object): Promise<ContractTransaction>

Approve the L3's fee token for teleportation. The tokens will be approved for L1Teleporter. Will throw if the L3 network uses ETH for fees or the fee token doesn't exist on L1.

Parameters
Parameter	Type
params	TxRequestParams | object
Returns
Promise<ContractTransaction>

Source
assetBridger/l1l3Bridger.ts:701

approveToken()
approveToken(params: TxRequestParams | TokenApproveParams & object): Promise<ContractTransaction>

Approve tokens for teleportation. The tokens will be approved for L1Teleporter.

Parameters
Parameter	Type
params	TxRequestParams | TokenApproveParams & object
Returns
Promise<ContractTransaction>

Source
assetBridger/l1l3Bridger.ts:659

deposit()
deposit(params: TxRequestParams | Erc20L1L3DepositRequestParams & object): Promise<ParentContractCallTransaction>

Execute a teleportation of some tokens from L1 to L3.

Parameters
Parameter	Type
params	TxRequestParams | Erc20L1L3DepositRequestParams & object
Returns
Promise<ParentContractCallTransaction>

Source
assetBridger/l1l3Bridger.ts:811

getApproveGasTokenRequest()
getApproveGasTokenRequest(params: object): Promise<Required<Pick<TransactionRequest, "to" | "value" | "data">>>

Get a tx request to approve the L3's fee token for teleportation. The tokens will be approved for L1Teleporter. Will throw if the L3 network uses ETH for fees or the fee token doesn't exist on L1.

Parameters
Parameter	Type
params	object
params.amount?	BigNumber
params.l1Provider	Provider
params.l2Provider	Provider
Returns
Promise<Required<Pick<TransactionRequest, "to" | "value" | "data">>>

Source
assetBridger/l1l3Bridger.ts:682

getApproveTokenRequest()
getApproveTokenRequest(params: TokenApproveParams): Promise<Required<Pick<TransactionRequest, "to" | "value" | "data">>>

Get a tx request to approve tokens for teleportation. The tokens will be approved for L1Teleporter.

Parameters
Parameter	Type
params	TokenApproveParams
Returns
Promise<Required<Pick<TransactionRequest, "to" | "value" | "data">>>

Source
assetBridger/l1l3Bridger.ts:640

getDepositParameters()
getDepositParameters(params: object & TxReference): Promise<object>

Given a teleportation tx, get the L1Teleporter parameters, L2Forwarder parameters, and L2Forwarder address

Parameters
Parameter	Type
params	object & TxReference
Returns
Promise<object>

Member	Type
l2ForwarderAddress	Promise<string>
l2ForwarderParams	L2ForwarderParamsStruct
teleportParams	TeleportParamsStruct
Source
assetBridger/l1l3Bridger.ts:837

getDepositRequest()
getDepositRequest(params: Erc20L1L3DepositRequestParams & object | object): Promise<DepositRequestResult>

Get a tx request for teleporting some tokens from L1 to L3. Also returns the amount of fee tokens required for teleportation.

Parameters
Parameter	Type
params	Erc20L1L3DepositRequestParams & object | object
Returns
Promise<DepositRequestResult>

Source
assetBridger/l1l3Bridger.ts:732

getDepositStatus()
getDepositStatus(params: GetL1L3DepositStatusParams): Promise<Erc20L1L3DepositStatus>

Fetch the cross chain messages and their status

Can provide either the txHash, the tx, or the txReceipt

Parameters
Parameter	Type
params	GetL1L3DepositStatusParams
Returns
Promise<Erc20L1L3DepositStatus>

Source
assetBridger/l1l3Bridger.ts:878

getGasTokenOnL1()
getGasTokenOnL1(l1Provider: Provider, l2Provider: Provider): Promise<string>

If the L3 network uses a custom gas token, return the address of that token on L1. If the fee token is not available on L1, does not use 18 decimals on L1 and L2, or the L3 network uses ETH for fees, throw.

Parameters
Parameter	Type
l1Provider	Provider
l2Provider	Provider
Returns
Promise<string>

Source
assetBridger/l1l3Bridger.ts:431

getL1L2GatewayAddress()
getL1L2GatewayAddress(erc20L1Address: string, l1Provider: Provider): Promise<string>

Given an L1 token's address, get the address of the token's L1 <-> L2 gateway on L1

Parameters
Parameter	Type
erc20L1Address	string
l1Provider	Provider
Returns
Promise<string>

Source
assetBridger/l1l3Bridger.ts:532

getL1TokenContract()
getL1TokenContract(l1TokenAddr: string, l1Provider: Provider): IERC20

Get the L1 token contract at the provided address Note: This function just returns a typed ethers object for the provided address, it doesn't check the underlying form of the contract bytecode to see if it's an erc20, and doesn't ensure the validity of any of the underlying functions on that contract.

Parameters
Parameter	Type
l1TokenAddr	string
l1Provider	Provider
Returns
IERC20

Source
assetBridger/l1l3Bridger.ts:560

getL2Erc20Address()
getL2Erc20Address(erc20L1Address: string, l1Provider: Provider): Promise<string>

Get the corresponding L2 token address for the provided L1 token

Parameters
Parameter	Type
erc20L1Address	string
l1Provider	Provider
Returns
Promise<string>

Source
assetBridger/l1l3Bridger.ts:508

getL2L3GatewayAddress()
getL2L3GatewayAddress(
   erc20L1Address: string, 
   l1Provider: Provider, 
l2Provider: Provider): Promise<string>

Get the address of the L2 <-> L3 gateway on L2 given an L1 token address

Parameters
Parameter	Type
erc20L1Address	string
l1Provider	Provider
l2Provider	Provider
Returns
Promise<string>

Source
assetBridger/l1l3Bridger.ts:545

getL2TokenContract()
getL2TokenContract(l2TokenAddr: string, l2Provider: Provider): L2GatewayToken

Get the L2 token contract at the provided address Note: This function just returns a typed ethers object for the provided address, it doesn't check the underlying form of the contract bytecode to see if it's an erc20, and doesn't ensure the validity of any of the underlying functions on that contract.

Parameters
Parameter	Type
l2TokenAddr	string
l2Provider	Provider
Returns
L2GatewayToken

Source
assetBridger/l1l3Bridger.ts:570

getL3Erc20Address()
getL3Erc20Address(
   erc20L1Address: string, 
   l1Provider: Provider, 
l2Provider: Provider): Promise<string>

Get the corresponding L3 token address for the provided L1 token

Parameters
Parameter	Type
erc20L1Address	string
l1Provider	Provider
l2Provider	Provider
Returns
Promise<string>

Source
assetBridger/l1l3Bridger.ts:518

getL3TokenContract()
getL3TokenContract(l3TokenAddr: string, l3Provider: Provider): L2GatewayToken

Get the L3 token contract at the provided address Note: This function just returns a typed ethers object for the provided address, it doesn't check the underlying form of the contract bytecode to see if it's an erc20, and doesn't ensure the validity of any of the underlying functions on that contract.

Parameters
Parameter	Type
l3TokenAddr	string
l3Provider	Provider
Returns
L2GatewayToken

Source
assetBridger/l1l3Bridger.ts:583

l1TokenIsDisabled()
l1TokenIsDisabled(l1TokenAddress: string, l1Provider: Provider): Promise<boolean>

Whether the L1 token has been disabled on the L1 <-> L2 router given an L1 token address

Parameters
Parameter	Type
l1TokenAddress	string
l1Provider	Provider
Returns
Promise<boolean>

Source
assetBridger/l1l3Bridger.ts:593

l2ForwarderAddress()
l2ForwarderAddress(
   owner: string, 
   routerOrInbox: string, 
   destinationAddress: string, 
l1OrL2Provider: Provider): Promise<string>

Given some L2Forwarder parameters, get the address of the L2Forwarder contract

Parameters
Parameter	Type
owner	string
routerOrInbox	string
destinationAddress	string
l1OrL2Provider	Provider
Returns
Promise<string>

Source
assetBridger/l1l3Bridger.ts:613

l2TokenIsDisabled()
l2TokenIsDisabled(l2TokenAddress: string, l2Provider: Provider): Promise<boolean>

Whether the L2 token has been disabled on the L2 <-> L3 router given an L2 token address

Parameters
Parameter	Type
l2TokenAddress	string
l2Provider	Provider
Returns
Promise<boolean>

Source
assetBridger/l1l3Bridger.ts:603

teleportationType()
teleportationType(partialTeleportParams: Pick<TeleportParamsStruct, "l1Token" | "l3FeeTokenL1Addr">): TeleportationType

Get the type of teleportation from the l1Token and l3FeeTokenL1Addr teleport parameters

Parameters
Parameter	Type
partialTeleportParams	Pick<TeleportParamsStruct, "l1Token" | "l3FeeTokenL1Addr">
Returns
TeleportationType

Source
assetBridger/l1l3Bridger.ts:953

EthL1L3Bridger
Bridge ETH from L1 to L3 using a double retryable ticket

Extends
BaseL1L3Bridger
Methods
_checkL1Network()
protected _checkL1Network(sop: SignerOrProvider): Promise<void>

Check the signer/provider matches the l1Network, throws if not

Parameters
Parameter	Type	Description
sop	SignerOrProvider	
Returns
Promise<void>

Inherited from
BaseL1L3Bridger._checkL1Network

Source
assetBridger/l1l3Bridger.ts:306

_checkL2Network()
protected _checkL2Network(sop: SignerOrProvider): Promise<void>

Check the signer/provider matches the l2Network, throws if not

Parameters
Parameter	Type	Description
sop	SignerOrProvider	
Returns
Promise<void>

Inherited from
BaseL1L3Bridger._checkL2Network

Source
assetBridger/l1l3Bridger.ts:314

_checkL3Network()
protected _checkL3Network(sop: SignerOrProvider): Promise<void>

Check the signer/provider matches the l3Network, throws if not

Parameters
Parameter	Type	Description
sop	SignerOrProvider	
Returns
Promise<void>

Inherited from
BaseL1L3Bridger._checkL3Network

Source
assetBridger/l1l3Bridger.ts:322

deposit()
deposit(params: TxRequestParams | EthL1L3DepositRequestParams & object): Promise<ParentContractCallTransaction>

Deposit ETH to L3 via a double retryable ticket

Parameters
Parameter	Type
params	TxRequestParams | EthL1L3DepositRequestParams & object
Returns
Promise<ParentContractCallTransaction>

Source
assetBridger/l1l3Bridger.ts:1521

getDepositParameters()
getDepositParameters(params: object & TxReference): Promise<object>

Given an L1 transaction, get the retryable parameters for both l2 and l3 tickets

Parameters
Parameter	Type
params	object & TxReference
Returns
Promise<object>

Member	Type
l1l2TicketData	RetryableMessageParams
l2l3TicketData	RetryableMessageParams
Source
assetBridger/l1l3Bridger.ts:1547

getDepositRequest()
getDepositRequest(params: EthL1L3DepositRequestParams & object | object): Promise<ParentToChildTransactionRequest>

Get a tx request to deposit ETH to L3 via a double retryable ticket

Parameters
Parameter	Type
params	EthL1L3DepositRequestParams & object | object
Returns
Promise <ParentToChildTransactionRequest>

Source
assetBridger/l1l3Bridger.ts:1463

getDepositStatus()
getDepositStatus(params: GetL1L3DepositStatusParams): Promise<EthL1L3DepositStatus>

Get the status of a deposit given an L1 tx receipt. Does not check if the tx is actually a deposit tx.

Parameters
Parameter	Type
params	GetL1L3DepositStatusParams
Returns
Promise<EthL1L3DepositStatus>

Information regarding each step of the deposit and EthL1L3DepositStatus.completed which indicates whether the deposit has fully completed.

Source
assetBridger/l1l3Bridger.ts:1577





address
Classes
Address
Ethereum/Arbitrum address class

Constructors
new Address()
new Address(value: string): Address

Ethereum/Arbitrum address class

Parameters
Parameter	Type	Description
value	string	A valid Ethereum address. Doesn't need to be checksum cased.
Returns
Address

Source
dataEntities/address.ts:18

Properties
Property	Modifier	Type	Description
value	readonly	string	A valid Ethereum address. Doesn't need to be checksum cased.
Methods
applyAlias()
applyAlias(): Address

Find the L2 alias of an L1 address

Returns
Address

Source
dataEntities/address.ts:43

undoAlias()
undoAlias(): Address

Find the L1 alias of an L2 address

Returns
Address

Source
dataEntities/address.ts:51






constants
Variables
ADDRESS_ALIAS_OFFSET
const ADDRESS_ALIAS_OFFSET: "0x1111000000000000000000000000000000001111" = '0x1111000000000000000000000000000000001111';

The offset added to an L1 address to get the corresponding L2 address

Source
dataEntities/constants.ts:41

ARB1_NITRO_GENESIS_L1_BLOCK
const ARB1_NITRO_GENESIS_L1_BLOCK: 15447158 = 15447158;

The L1 block at which Nitro was activated for Arbitrum One.

See
https://etherscan.io/block/15447158

Source
dataEntities/constants.ts:71

ARB1_NITRO_GENESIS_L2_BLOCK
const ARB1_NITRO_GENESIS_L2_BLOCK: 22207817 = 22207817;

The L2 block at which Nitro was activated for Arbitrum One.

See
https://arbiscan.io/block/22207817

Source
dataEntities/constants.ts:78

CUSTOM_TOKEN_IS_ENABLED
const CUSTOM_TOKEN_IS_ENABLED: 42161 = 42161;

If a custom token is enabled for arbitrum it will implement a function called isArbitrumEnabled which returns this value. Intger: 0xa4b1

Source
dataEntities/constants.ts:52

DEFAULT_DEPOSIT_TIMEOUT
const DEFAULT_DEPOSIT_TIMEOUT: number;

How long to wait (in milliseconds) for a deposit to arrive before timing out a request.

Finalisation on mainnet can be up to 2 epochs = 64 blocks. We add 10 minutes for the system to create and redeem the ticket, plus some extra buffer of time.

Total timeout: 30 minutes.

Source
dataEntities/constants.ts:64

DISABLED_GATEWAY
const DISABLED_GATEWAY: "0x0000000000000000000000000000000000000001" = '0x0000000000000000000000000000000000000001';

Address of the gateway a token will be assigned to if it is disabled

Source
dataEntities/constants.ts:46





errors
Classes
ArbSdkError
Errors originating in Arbitrum SDK

Extends
Error
Extended by
MissingProviderArbSdkError
MissingProviderArbSdkError
Thrown when a signer does not have a connected provider

Extends
ArbSdkError
/



event
Type Aliases
EventArgs<T>
type EventArgs<T>: T extends TypedEvent<infer _, infer TObj> ? TObj : never;

The type of the event arguments. Gets the second generic arg

Type parameters
Type parameter
T
Source
dataEntities/event.ts:10

EventFromFilter<TFilter>
type EventFromFilter<TFilter>: TFilter extends TypedEventFilter<infer TEvent> ? TEvent : never;

The event type of a filter Gets the first generic arg

Type parameters
Type parameter
TFilter
Source
dataEntities/event.ts:18

TypeChainContractFactory<TContract>
type TypeChainContractFactory<TContract>: object;

Typechain contract factories have additional properties

Type parameters
Type parameter
TContract extends Contract
Type declaration
Member	Type
connect	TContract
createInterface	Interface
Source
dataEntities/event.ts:41

Functions
parseTypedLog()
function parseTypedLog<TContract, TFilterName>(
   contractFactory: TypeChainContractFactory<TContract>, 
   log: Log, 
filterName: TFilterName): null | EventArgs<EventFromFilter<ReturnType<TContract["filters"][TFilterName]>>>

Parse a log that matches a given filter name.

Type parameters
Type parameter
TContract extends Contract
TFilterName extends string
Parameters
Parameter	Type	Description
contractFactory	TypeChainContractFactory<TContract>	
log	Log	The log to parse
filterName	TFilterName	
Returns
null | EventArgs <EventFromFilter<ReturnType<TContract["filters"][TFilterName]>>>

Null if filter name topic does not match log topic

Source
dataEntities/event.ts:53

parseTypedLogs()
function parseTypedLogs<TContract, TFilterName>(
   contractFactory: TypeChainContractFactory<TContract>, 
   logs: Log[], 
   filterName: TFilterName): EventArgs<EventFromFilter<ReturnType<TContract["filters"][TFilterName]>>>[]

Parses an array of logs. Filters out any logs whose topic does not match provided the filter name topic.

Type parameters
Type parameter
TContract extends Contract
TFilterName extends string
Parameters
Parameter	Type	Description
contractFactory	TypeChainContractFactory<TContract>	
logs	Log[]	The logs to parse
filterName	TFilterName	
Returns
EventArgs <EventFromFilter<ReturnType<TContract["filters"][TFilterName]>>>[]

Source
dataEntities/event.ts:78






message
Enumerations
InboxMessageKind
The inbox message kind as defined in: https://github.com/OffchainLabs/nitro/blob/c7f3429e2456bf5ca296a49cec3bb437420bc2bb/contracts/src/libraries/MessageTypes.sol

Enumeration Members
Enumeration Member	Value
L1MessageType_ethDeposit	12
L1MessageType_submitRetryableTx	9
L2MessageType_signedTx	4
Interfaces
RetryableMessageParams
The components of a submit retryable message. Can be parsed from the events emitted from the Inbox.

Properties
Property	Type	Description
callValueRefundAddress	string	Address to credit l2Callvalue on L2 if retryable txn times out or gets cancelled
data	string	Calldata for of the L2 message
destAddress	string	Destination address for L2 message
excessFeeRefundAddress	string	L2 address address to credit (gaslimit x gasprice - execution cost)
gasLimit	BigNumber	Max gas deducted from user's L2 balance to cover L2 execution
l1Value	BigNumber	Value sent at L1
l2CallValue	BigNumber	Call value in L2 message
maxFeePerGas	BigNumber	Gas price for L2 execution
maxSubmissionFee	BigNumber	Max gas deducted from L2 balance to cover base submission fee




networks
Interfaces
ArbitrumNetwork
Represents an Arbitrum chain, e.g. Arbitrum One, Arbitrum Sepolia, or an L3 chain.

Properties
Property	Type	Description
chainId	number	Id of the chain.
confirmPeriodBlocks	number	The time allowed for validators to dispute or challenge state assertions. Measured in L1 blocks.
ethBridge	EthBridge	The core contracts
isBold?	boolean	Has the network been upgraded to bold. True if yes, otherwise undefined
This is a temporary property and will be removed in future if Bold is widely adopted and
the legacy challenge protocol is deprecated
isCustom	boolean	Whether or not the chain was registered by the user.
isTestnet	boolean	Whether or not it is a testnet chain.
name	string	Name of the chain.
nativeToken?	string	In case of a chain that uses ETH as its native/gas token, this is either undefined or the zero address

In case of a chain that uses an ERC-20 token from the parent chain as its native/gas token, this is the address of said token on the parent chain
parentChainId	number	Chain id of the parent chain, i.e. the chain on which this chain settles to.
retryableLifetimeSeconds?	number	Represents how long a retryable ticket lasts for before it expires (in seconds). Defaults to 7 days.
teleporter?	Teleporter	The teleporter contracts.
tokenBridge?	TokenBridge	The token bridge contracts.
L2NetworkTokenBridge
This type is only here for when you want to achieve backwards compatibility between SDK v3 and v4.

Please see TokenBridge for the latest type.

Deprecated
since v4

Type Aliases
L2Network
type L2Network: Prettify<Omit<ArbitrumNetwork, "chainId" | "parentChainId" | "tokenBridge"> & object>;

This type is only here for when you want to achieve backwards compatibility between SDK v3 and v4.

Please see ArbitrumNetwork for the latest type.

Deprecated
since v4

Source
dataEntities/networks.ts:94

Functions
assertArbitrumNetworkHasTokenBridge()
function assertArbitrumNetworkHasTokenBridge<T>(network: T): asserts network is T & Object

Asserts that the given object has a token bridge. This is useful because not all Arbitrum network operations require a token bridge.

Type parameters
Type parameter
T extends ArbitrumNetwork
Parameters
Parameter	Type	Description
network	T	ArbitrumNetwork object
Returns
asserts network is T & Object

Throws
ArbSdkError if the object does not have a token bridge

Source
dataEntities/networks.ts:554

getArbitrumNetwork()
function getArbitrumNetwork(chainId: number): ArbitrumNetwork

Returns the Arbitrum chain associated with the given signer, provider or chain id.

Parameters
Parameter	Type
chainId	number
Returns
ArbitrumNetwork

Note
Throws if the chain is not an Arbitrum chain.

Source
dataEntities/networks.ts:316

getArbitrumNetworkInformationFromRollup()
function getArbitrumNetworkInformationFromRollup(rollupAddress: string, parentProvider: Provider): Promise<ArbitrumNetworkInformationFromRollup>


Returns all the information about an Arbitrum network that can be fetched from its Rollup contract.

Parameters
Parameter	Type	Description
rollupAddress	string	Address of the Rollup contract on the parent chain
parentProvider	Provider	Provider for the parent chain
Returns
Promise<ArbitrumNetworkInformationFromRollup>

An ArbitrumNetworkInformationFromRollup object

Source
dataEntities/networks.ts:376

getArbitrumNetworks()
function getArbitrumNetworks(): ArbitrumNetwork[]

Returns all Arbitrum networks registered in the SDK, both default and custom.

Returns
ArbitrumNetwork[]

Source
dataEntities/networks.ts:359

getChildrenForNetwork()
function getChildrenForNetwork(parentChainOrChainId: number | ArbitrumNetwork): ArbitrumNetwork[]

Returns a list of children chains for the given chain or chain id.

Parameters
Parameter	Type
parentChainOrChainId	number | ArbitrumNetwork
Returns
ArbitrumNetwork[]

Source
dataEntities/networks.ts:298

isParentNetwork()
function isParentNetwork(parentChainOrChainId: number | ArbitrumNetwork): boolean

Determines if a chain is a parent of any other chain. Could be an L1 or an L2 chain.

Parameters
Parameter	Type
parentChainOrChainId	number | ArbitrumNetwork
Returns
boolean

Source
dataEntities/networks.ts:283

mapL2NetworkToArbitrumNetwork()
function mapL2NetworkToArbitrumNetwork(l2Network: object): ArbitrumNetwork

Maps the old L2Network (from SDK v3) to ArbitrumNetwork (from SDK v4).

Parameters
Parameter	Type	Description
l2Network	object	-
l2Network.chainID	number	-
l2Network.confirmPeriodBlocks	number	The time allowed for validators to dispute or challenge state assertions. Measured in L1 blocks.
l2Network.ethBridge	EthBridge	The core contracts
l2Network.isBold?	boolean	Has the network been upgraded to bold. True if yes, otherwise undefined
This is a temporary property and will be removed in future if Bold is widely adopted and
the legacy challenge protocol is deprecated
l2Network.isCustom	boolean	Whether or not the chain was registered by the user.
l2Network.isTestnet	boolean	Whether or not it is a testnet chain.
l2Network.name	string	Name of the chain.
l2Network.nativeToken?	string	In case of a chain that uses ETH as its native/gas token, this is either undefined or the zero address

In case of a chain that uses an ERC-20 token from the parent chain as its native/gas token, this is the address of said token on the parent chain
l2Network.partnerChainID	number	-
l2Network.retryableLifetimeSeconds?	number	Represents how long a retryable ticket lasts for before it expires (in seconds). Defaults to 7 days.
l2Network.teleporter?	Teleporter	The teleporter contracts.
l2Network.tokenBridge	L2NetworkTokenBridge	-
Returns
ArbitrumNetwork

Source
dataEntities/networks.ts:534

mapL2NetworkTokenBridgeToTokenBridge()
function mapL2NetworkTokenBridgeToTokenBridge(input: L2NetworkTokenBridge): TokenBridge

Maps the old L2Network.tokenBridge (from SDK v3) to ArbitrumNetwork.tokenBridge (from SDK v4).

Parameters
Parameter	Type
input	L2NetworkTokenBridge
Returns
TokenBridge

Source
dataEntities/networks.ts:510

registerCustomArbitrumNetwork()
function registerCustomArbitrumNetwork(network: ArbitrumNetwork, options?: object): ArbitrumNetwork

Registers a custom Arbitrum network.

Parameters
Parameter	Type	Description
network	ArbitrumNetwork	ArbitrumNetwork to be registered
options?	object	Additional options
options.throwIfAlreadyRegistered?	boolean	Whether or not the function should throw if the network is already registered, defaults to false
Returns
ArbitrumNetwork

Source
dataEntities/networks.ts:415




retryableData
Classes
RetryableDataTools
Tools for parsing retryable data from errors. When calling createRetryableTicket on Inbox.sol special values can be passed for gasLimit and maxFeePerGas. This causes the call to revert with the info needed to estimate the gas needed for a retryable ticket using L1ToL2GasPriceEstimator.

Properties
Property	Modifier	Type	Default value	Description
ErrorTriggeringParams	static	object	...	The parameters that should be passed to createRetryableTicket in order to induce
a revert with retryable data
ErrorTriggeringParams.gasLimit	public	BigNumber	...	-
ErrorTriggeringParams.maxFeePerGas	public	BigNumber	...	-
Methods
tryParseError()
static tryParseError(ethersJsErrorOrData: string | Error | object): null | RetryableData

Try to parse a retryable data struct from the supplied ethersjs error, or any explicitly supplied error data

Parameters
Parameter	Type	Description
ethersJsErrorOrData	string | Error | object	
Returns
null | RetryableData

Source
dataEntities/retryableData.ts:114






rpc
Interfaces
ArbTransactionReceipt
Eth transaction receipt with additional arbitrum specific fields

Extends
TransactionReceipt
Properties
Property	Type	Description
gasUsedForL1	BigNumber	Amount of gas spent on l1 computation in units of l2 gas
l1BlockNumber	number	The l1 block number that would be used for block.number calls
that occur within this transaction.
See https://developer.offchainlabs.com/docs/time_in_arbitrum



signerOrProvider
Classes
SignerProviderUtils
Utility functions for signer/provider union types

Methods
checkNetworkMatches()
static checkNetworkMatches(signerOrProvider: SignerOrProvider, chainId: number): Promise<void>

Checks that the signer/provider that's provider matches the chain id Throws if not.

Parameters
Parameter	Type	Description
signerOrProvider	SignerOrProvider	
chainId	number	
Returns
Promise<void>

Source
dataEntities/signerOrProvider.ts:56

getProvider()
static getProvider(signerOrProvider: SignerOrProvider): undefined | Provider

If signerOrProvider is a provider then return itself. If signerOrProvider is a signer then return signer.provider

Parameters
Parameter	Type	Description
signerOrProvider	SignerOrProvider	
Returns
undefined | Provider

Source
dataEntities/signerOrProvider.ts:24

signerHasProvider()
static signerHasProvider(signer: Signer): signer is Signer & Object

Check if the signer has a connected provider

Parameters
Parameter	Type	Description
signer	Signer	
Returns
signer is Signer & Object

Source
dataEntities/signerOrProvider.ts:44




transactionRequest
Interfaces
ChildToParentTransactionRequest
A transaction request for a transaction that will trigger a child to parent message

Properties
Property	Type	Description
estimateParentGasLimit	(l1Provider: Provider) => Promise<BigNumber>	Estimate the gas limit required to execute the withdrawal on the parent chain.
Note that this is only a rough estimate as it may not be possible to know
the exact size of the proof straight away, however the real value should be
within a few thousand gas of this estimate.
ParentToChildTransactionRequest
A transaction request for a transaction that will trigger some sort of execution on the child chain

Properties
Property	Type	Description
retryableData	OmitTyped<ParentToChildMessageNoGasParams, "excessFeeRefundAddress" | "callValueRefundAddress"> & Partial<ParentToChildMessageNoGasParams> & ParentToChildMessageGasParams	Information about the retryable ticket, and it's subsequent execution, that
will occur on the child chain
txRequest	Required<Pick<TransactionRequest, "to" | "value" | "data" | "from">>	Core fields needed to form the parent component of the transaction request
Methods
isValid()
isValid(): Promise<boolean>

If this request were sent now, would it have enough margin to reliably succeed

Returns
Promise<boolean>

Source
dataEntities/transactionRequest.ts:28

Functions
isChildToParentTransactionRequest()
function isChildToParentTransactionRequest<T>(possibleRequest: ChildToParentTransactionRequest | IsNotTransactionRequest<T>): possibleRequest is ChildToParentTransactionRequest


Check if an object is of ChildToParentTransactionRequest type

Type parameters
Type parameter
T
Parameters
Parameter	Type	Description
possibleRequest	ChildToParentTransactionRequest | IsNotTransactionRequest<T>	
Returns
possibleRequest is ChildToParentTransactionRequest

Source
dataEntities/transactionRequest.ts:70

isParentToChildTransactionRequest()
function isParentToChildTransactionRequest<T>(possibleRequest: ParentToChildTransactionRequest | IsNotTransactionRequest<T>): possibleRequest is ParentToChildTransactionRequest


Check if an object is of ParentToChildTransactionRequest type

Type parameters
Type parameter
T
Parameters
Parameter	Type	Description
possibleRequest	ParentToChildTransactionRequest | IsNotTransactionRequest<T>	
Returns
possibleRequest is ParentToChildTransactionRequest

Source
dataEntities/transactionRequest.ts:57





inbox
Classes
InboxTools
Tools for interacting with the inbox and bridge contracts

Properties
Property	Modifier	Type	Description
parentProvider	private	Provider	Parent chain provider
Methods
estimateArbitrumGas()
private estimateArbitrumGas(childTransactionRequest: RequiredTransactionRequestType, childProvider: Provider): Promise<GasComponentsWithChildPart>


We should use nodeInterface to get the gas estimate is because we are making a delayed inbox message which doesn't need parent calldata gas fee part.

Parameters
Parameter	Type
childTransactionRequest	RequiredTransactionRequestType
childProvider	Provider
Returns
Promise<GasComponentsWithChildPart>

Source
inbox/inbox.ts:156

findFirstBlockBelow()
private findFirstBlockBelow(blockNumber: number, blockTimestamp: number): Promise<Block>

Find the first (or close to first) block whose number is below the provided number, and whose timestamp is below the provided timestamp

Parameters
Parameter	Type	Description
blockNumber	number	
blockTimestamp	number	
Returns
Promise<Block>

Source
inbox/inbox.ts:87

forceInclude()
forceInclude<T>(messageDeliveredEvent?: T, overrides?: Overrides): Promise<T extends ForceInclusionParams ? ContractTransaction : null | ContractTransaction>


Force includes all eligible messages in the delayed inbox. The inbox contract doesn't allow a message to be force-included until after a delay period has been completed.

Type parameters
Type parameter
T extends undefined | ForceInclusionParams
Parameters
Parameter	Type	Description
messageDeliveredEvent?	T	Provide this to include all messages up to this one. Responsibility is on the caller to check the eligibility of this event.
overrides?	Overrides	-
Returns
Promise<T extends ForceInclusionParams ? ContractTransaction : null | ContractTransaction>

The force include transaction, or null if no eligible message were found for inclusion

Source
inbox/inbox.ts:356

getEventsAndIncreaseRange()
private getEventsAndIncreaseRange(
   bridge: Bridge, 
   searchRangeBlocks: number, 
   maxSearchRangeBlocks: number, 
rangeMultiplier: number): Promise<FetchedEvent<MessageDeliveredEvent>[]>

Look for force includable events in the search range blocks, if no events are found the search range is increased incrementally up to the max search range blocks.

Parameters
Parameter	Type	Description
bridge	Bridge	
searchRangeBlocks	number	
maxSearchRangeBlocks	number	
rangeMultiplier	number	-
Returns
Promise<FetchedEvent<MessageDeliveredEvent>[]>

Source
inbox/inbox.ts:256

getForceIncludableBlockRange()
private getForceIncludableBlockRange(blockNumberRangeSize: number): Promise<object>

Get a range of blocks within messages eligible for force inclusion emitted events

Parameters
Parameter	Type	Description
blockNumberRangeSize	number	
Returns
Promise<object>

Member	Type	Value
endBlock	number	firstEligibleBlock.number
startBlock	number	...
Source
inbox/inbox.ts:186

getForceIncludableEvent()
getForceIncludableEvent(
   maxSearchRangeBlocks: number, 
   startSearchRangeBlocks: number, 
rangeMultiplier: number): Promise<null | ForceInclusionParams>

Find the event of the latest message that can be force include

Parameters
Parameter	Type	Default value	Description
maxSearchRangeBlocks	number	undefined	The max range of blocks to search in.
Defaults to 3 * 6545 ( = ~3 days) prior to the first eligible block
startSearchRangeBlocks	number	100	The start range of block to search in.
Moves incrementally up to the maxSearchRangeBlocks. Defaults to 100;
rangeMultiplier	number	2	The multiplier to use when increasing the block range
Defaults to 2.
Returns
Promise<null | ForceInclusionParams>

Null if non can be found.

Source
inbox/inbox.ts:307

sendChildSignedTx()
sendChildSignedTx(signedTx: string): Promise<null | ContractTransaction>

Send Child Chain signed tx using delayed inbox, which won't alias the sender's address It will be automatically included by the sequencer on Chain, if it isn't included within 24 hours, you can force include it

Parameters
Parameter	Type	Description
signedTx	string	A signed transaction which can be sent directly to chain,
you can call inboxTools.signChainMessage to get.
Returns
Promise<null | ContractTransaction>

The parent delayed inbox's transaction itself.

Source
inbox/inbox.ts:401

signChildTx()
signChildTx(txRequest: RequiredTransactionRequestType, childSigner: Signer): Promise<string>

Sign a transaction with msg.to, msg.value and msg.data. You can use this as a helper to call inboxTools.sendChainSignedMessage above.

Parameters
Parameter	Type	Description
txRequest	RequiredTransactionRequestType	A signed transaction which can be sent directly to chain,
tx.to, tx.data, tx.value must be provided when not contract creation, if
contractCreation is true, no need provide tx.to. tx.gasPrice and tx.nonce
can be overrided. (You can also send contract creation transaction by set tx.to
to zero address or null)
childSigner	Signer	ethers Signer type, used to sign Chain transaction
Returns
Promise<string>

The parent delayed inbox's transaction signed data.

Source
inbox/inbox.ts:429





ChildToParentMessage
Classes
ChildToParentMessage
Base functionality for Child-to-Parent messages

Extended by
ChildToParentMessageReader
Methods
fromEvent()
static fromEvent<T>(
   parentSignerOrProvider: T, 
   event: ChildToParentTransactionEvent, 
parentProvider?: Provider): ChildToParentMessageReaderOrWriter<T>

Instantiates a new ChildToParentMessageWriter or ChildToParentMessageReader object.

Type parameters
Type parameter
T extends SignerOrProvider
Parameters
Parameter	Type	Description
parentSignerOrProvider	T	Signer or provider to be used for executing or reading the Child-to-Parent message.
event	ChildToParentTransactionEvent	The event containing the data of the Child-to-Parent message.
parentProvider?	Provider	Optional. Used to override the Provider which is attached to ParentSignerOrProvider in case you need more control. This will be a required parameter in a future major version update.
Returns
ChildToParentMessageReaderOrWriter<T>

Source
message/ChildToParentMessage.ts:76

getChildToParentEvents()
static getChildToParentEvents(
   childProvider: Provider, 
   filter: object, 
   position?: BigNumber, 
   destination?: string, 
   hash?: BigNumber, 
indexInBatch?: BigNumber): Promise<ChildToParentTransactionEvent & object[]>

Get event logs for ChildToParent transactions.

Parameters
Parameter	Type	Description
childProvider	Provider	
filter	object	Block range filter
filter.fromBlock	BlockTag	-
filter.toBlock?	BlockTag	-
position?	BigNumber	The batchnumber indexed field was removed in nitro and a position indexed field was added.
For pre-nitro events the value passed in here will be used to find events with the same batchnumber.
For post nitro events it will be used to find events with the same position.
destination?	string	The parent destination of the ChildToParent message
hash?	BigNumber	The uniqueId indexed field was removed in nitro and a hash indexed field was added.
For pre-nitro events the value passed in here will be used to find events with the same uniqueId.
For post nitro events it will be used to find events with the same hash.
indexInBatch?	BigNumber	The index in the batch, only valid for pre-nitro events. This parameter is ignored post-nitro
Returns
Promise<ChildToParentTransactionEvent & object[]>

Any classic and nitro events that match the provided filters.

Source
message/ChildToParentMessage.ts:109

ChildToParentMessageReader
Provides read-only access for Child-to-Parent messages

Extends
ChildToParentMessage
Extended by
ChildToParentMessageWriter
Methods
getFirstExecutableBlock()
getFirstExecutableBlock(childProvider: Provider): Promise<null | BigNumber>

Estimates the Parent block number in which this Child-to-Parent tx will be available for execution. If the message can or already has been executed, this returns null

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise<null | BigNumber>

expected Parent block number where the Child-to-Parent message will be executable. Returns null if the message can or already has been executed

Source
message/ChildToParentMessage.ts:273

status()
status(childProvider: Provider): Promise<ChildToParentMessageStatus>

Get the status of this message In order to check if the message has been executed proof info must be provided.

Parameters
Parameter	Type
childProvider	Provider
Returns
Promise<ChildToParentMessageStatus>

Source
message/ChildToParentMessage.ts:237

waitUntilReadyToExecute()
waitUntilReadyToExecute(childProvider: Provider, retryDelay: number): Promise<CONFIRMED | EXECUTED>

Waits until the outbox entry has been created, and will not return until it has been. WARNING: Outbox entries are only created when the corresponding node is confirmed. Which can take 1 week+, so waiting here could be a very long operation.

Parameters
Parameter	Type	Default value	Description
childProvider	Provider	undefined	-
retryDelay	number	500	
Returns
Promise<CONFIRMED | EXECUTED>

outbox entry status (either executed or confirmed but not pending)

Source
message/ChildToParentMessage.ts:252

fromEvent()
static fromEvent<T>(
   parentSignerOrProvider: T, 
   event: ChildToParentTransactionEvent, 
parentProvider?: Provider): ChildToParentMessageReaderOrWriter<T>

Instantiates a new ChildToParentMessageWriter or ChildToParentMessageReader object.

Type parameters
Type parameter
T extends SignerOrProvider
Parameters
Parameter	Type	Description
parentSignerOrProvider	T	Signer or provider to be used for executing or reading the Child-to-Parent message.
event	ChildToParentTransactionEvent	The event containing the data of the Child-to-Parent message.
parentProvider?	Provider	Optional. Used to override the Provider which is attached to ParentSignerOrProvider in case you need more control. This will be a required parameter in a future major version update.
Returns
ChildToParentMessageReaderOrWriter<T>

Inherited from
ChildToParentMessage . fromEvent

Source
message/ChildToParentMessage.ts:76

getChildToParentEvents()
static getChildToParentEvents(
   childProvider: Provider, 
   filter: object, 
   position?: BigNumber, 
   destination?: string, 
   hash?: BigNumber, 
indexInBatch?: BigNumber): Promise<ChildToParentTransactionEvent & object[]>

Get event logs for ChildToParent transactions.

Parameters
Parameter	Type	Description
childProvider	Provider	
filter	object	Block range filter
filter.fromBlock	BlockTag	-
filter.toBlock?	BlockTag	-
position?	BigNumber	The batchnumber indexed field was removed in nitro and a position indexed field was added.
For pre-nitro events the value passed in here will be used to find events with the same batchnumber.
For post nitro events it will be used to find events with the same position.
destination?	string	The parent destination of the ChildToParent message
hash?	BigNumber	The uniqueId indexed field was removed in nitro and a hash indexed field was added.
For pre-nitro events the value passed in here will be used to find events with the same uniqueId.
For post nitro events it will be used to find events with the same hash.
indexInBatch?	BigNumber	The index in the batch, only valid for pre-nitro events. This parameter is ignored post-nitro
Returns
Promise<ChildToParentTransactionEvent & object[]>

Any classic and nitro events that match the provided filters.

Inherited from
ChildToParentMessage . getChildToParentEvents

Source
message/ChildToParentMessage.ts:109

ChildToParentMessageWriter
Provides read and write access for Child-to-Parent messages

Extends
ChildToParentMessageReader
Constructors
new ChildToParentMessageWriter()
new ChildToParentMessageWriter(
   parentSigner: Signer, 
   event: ChildToParentTransactionEvent, 
   parentProvider?: Provider): ChildToParentMessageWriter

Instantiates a new ChildToParentMessageWriter object.

Parameters
Parameter	Type	Description
parentSigner	Signer	The signer to be used for executing the Child-to-Parent message.
event	ChildToParentTransactionEvent	The event containing the data of the Child-to-Parent message.
parentProvider?	Provider	Optional. Used to override the Provider which is attached to parentSigner in case you need more control. This will be a required parameter in a future major version update.
Returns
ChildToParentMessageWriter

Overrides
ChildToParentMessageReader.constructor

Source
message/ChildToParentMessage.ts:296

Methods
execute()
execute(childProvider: Provider, overrides?: Overrides): Promise<ContractTransaction>

Executes the ChildToParentMessage on Parent chain. Will throw an error if the outbox entry has not been created, which happens when the corresponding assertion is confirmed.

Parameters
Parameter	Type
childProvider	Provider
overrides?	Overrides
Returns
Promise<ContractTransaction>

Source
message/ChildToParentMessage.ts:325

getFirstExecutableBlock()
getFirstExecutableBlock(childProvider: Provider): Promise<null | BigNumber>

Estimates the Parent block number in which this Child-to-Parent tx will be available for execution. If the message can or already has been executed, this returns null

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise<null | BigNumber>

expected Parent block number where the Child-to-Parent message will be executable. Returns null if the message can or already has been executed

Inherited from
ChildToParentMessageReader . getFirstExecutableBlock

Source
message/ChildToParentMessage.ts:273

status()
status(childProvider: Provider): Promise<ChildToParentMessageStatus>

Get the status of this message In order to check if the message has been executed proof info must be provided.

Parameters
Parameter	Type
childProvider	Provider
Returns
Promise<ChildToParentMessageStatus>

Inherited from
ChildToParentMessageReader . status

Source
message/ChildToParentMessage.ts:237

waitUntilReadyToExecute()
waitUntilReadyToExecute(childProvider: Provider, retryDelay: number): Promise<CONFIRMED | EXECUTED>

Waits until the outbox entry has been created, and will not return until it has been. WARNING: Outbox entries are only created when the corresponding node is confirmed. Which can take 1 week+, so waiting here could be a very long operation.

Parameters
Parameter	Type	Default value	Description
childProvider	Provider	undefined	-
retryDelay	number	500	
Returns
Promise<CONFIRMED | EXECUTED>

outbox entry status (either executed or confirmed but not pending)

Inherited from
ChildToParentMessageReader . waitUntilReadyToExecute

Source
message/ChildToParentMessage.ts:252

fromEvent()
static fromEvent<T>(
   parentSignerOrProvider: T, 
   event: ChildToParentTransactionEvent, 
parentProvider?: Provider): ChildToParentMessageReaderOrWriter<T>

Instantiates a new ChildToParentMessageWriter or ChildToParentMessageReader object.

Type parameters
Type parameter
T extends SignerOrProvider
Parameters
Parameter	Type	Description
parentSignerOrProvider	T	Signer or provider to be used for executing or reading the Child-to-Parent message.
event	ChildToParentTransactionEvent	The event containing the data of the Child-to-Parent message.
parentProvider?	Provider	Optional. Used to override the Provider which is attached to ParentSignerOrProvider in case you need more control. This will be a required parameter in a future major version update.
Returns
ChildToParentMessageReaderOrWriter<T>

Inherited from
ChildToParentMessageReader . fromEvent

Source
message/ChildToParentMessage.ts:76

getChildToParentEvents()
static getChildToParentEvents(
   childProvider: Provider, 
   filter: object, 
   position?: BigNumber, 
   destination?: string, 
   hash?: BigNumber, 
indexInBatch?: BigNumber): Promise<ChildToParentTransactionEvent & object[]>

Get event logs for ChildToParent transactions.

Parameters
Parameter	Type	Description
childProvider	Provider	
filter	object	Block range filter
filter.fromBlock	BlockTag	-
filter.toBlock?	BlockTag	-
position?	BigNumber	The batchnumber indexed field was removed in nitro and a position indexed field was added.
For pre-nitro events the value passed in here will be used to find events with the same batchnumber.
For post nitro events it will be used to find events with the same position.
destination?	string	The parent destination of the ChildToParent message
hash?	BigNumber	The uniqueId indexed field was removed in nitro and a hash indexed field was added.
For pre-nitro events the value passed in here will be used to find events with the same uniqueId.
For post nitro events it will be used to find events with the same hash.
indexInBatch?	BigNumber	The index in the batch, only valid for pre-nitro events. This parameter is ignored post-nitro
Returns
Promise<ChildToParentTransactionEvent & object[]>

Any classic and nitro events that match the provided filters.

Inherited from
ChildToParentMessageReader . getChildToParentEvents

Source
message/ChildToParentMessage.ts:109

Type Aliases
ChildToParentMessageReaderOrWriter<T>
type ChildToParentMessageReaderOrWriter<T>: T extends Provider ? ChildToParentMessageReader : ChildToParentMessageWriter;

Conditional type for Signer or Provider. If T is of type Provider then ChildToParentMessageReaderOrWriter<T> will be of type ChildToParentMessageReader. If T is of type Signer then ChildToParentMessageReaderOrWriter<T> will be of type ChildToParentMessageWriter.

Type parameters
Type parameter
T extends SignerOrProvider
Source
message/ChildToParentMessage.ts:54






ChildToParentMessageClassic
Classes
ChildToParentMessageReaderClassic
Provides read-only access for classic Child-to-Parent-messages

Extends
ChildToParentMessageClassic
Extended by
ChildToParentMessageWriterClassic
Properties
Property	Modifier	Type	Default value	Description	Inherited from
batchNumber	readonly	BigNumber	undefined	The number of the batch this message is part of	ChildToParentMessageClassic.batchNumber
indexInBatch	readonly	BigNumber	undefined	The index of this message in the batch	ChildToParentMessageClassic.indexInBatch
outboxAddress	protected	null | string	null	Contains the classic outbox address, or set to zero address if this network
did not have a classic outbox deployed	-
Methods
getFirstExecutableBlock()
getFirstExecutableBlock(childProvider: Provider): Promise<null | BigNumber>

Estimates the Parent Chain block number in which this Child-to-Parent tx will be available for execution

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise<null | BigNumber>

Always returns null for classic chainToParentChain messages since they can be executed in any block now.

Source
message/ChildToParentMessageClassic.ts:386

getOutboxAddress()
protected getOutboxAddress(childProvider: Provider, batchNumber: number): Promise<string>

Classic had 2 outboxes, we need to find the correct one for the provided batch number

Parameters
Parameter	Type	Description
childProvider	Provider	
batchNumber	number	
Returns
Promise<string>

Source
message/ChildToParentMessageClassic.ts:211

hasExecuted()
hasExecuted(childProvider: Provider): Promise<boolean>

Check if given outbox message has already been executed

Parameters
Parameter	Type
childProvider	Provider
Returns
Promise<boolean>

Source
message/ChildToParentMessageClassic.ts:301

status()
status(childProvider: Provider): Promise<ChildToParentMessageStatus>

Get the status of this message In order to check if the message has been executed proof info must be provided.

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise<ChildToParentMessageStatus>

Source
message/ChildToParentMessageClassic.ts:339

tryGetProof()
tryGetProof(childProvider: Provider): Promise<null | MessageBatchProofInfo>

Get the execution proof for this message. Returns null if the batch does not exist yet.

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise<null | MessageBatchProofInfo>

Source
message/ChildToParentMessageClassic.ts:285

waitUntilOutboxEntryCreated()
waitUntilOutboxEntryCreated(childProvider: Provider, retryDelay: number): Promise<CONFIRMED | EXECUTED>

Waits until the outbox entry has been created, and will not return until it has been. WARNING: Outbox entries are only created when the corresponding node is confirmed. Which can take 1 week+, so waiting here could be a very long operation.

Parameters
Parameter	Type	Default value	Description
childProvider	Provider	undefined	-
retryDelay	number	500	
Returns
Promise<CONFIRMED | EXECUTED>

outbox entry status (either executed or confirmed but not pending)

Source
message/ChildToParentMessageClassic.ts:364

fromBatchNumber()
static fromBatchNumber<T>(
   parentSignerOrProvider: T, 
   batchNumber: BigNumber, 
   indexInBatch: BigNumber, 
parentProvider?: Provider): ChildToParentMessageReaderOrWriterClassic<T>

Instantiates a new ChildToParentMessageWriterClassic or ChildToParentMessageReaderClassic object.

Type parameters
Type parameter
T extends SignerOrProvider
Parameters
Parameter	Type	Description
parentSignerOrProvider	T	Signer or provider to be used for executing or reading the Child-to-Parent message.
batchNumber	BigNumber	The number of the batch containing the Child-to-Parent message.
indexInBatch	BigNumber	The index of the Child-to-Parent message within the batch.
parentProvider?	Provider	Optional. Used to override the Provider which is attached to parentSignerOrProvider in case you need more control. This will be a required parameter in a future major version update.
Returns
ChildToParentMessageReaderOrWriterClassic<T>

Inherited from
ChildToParentMessageClassic.fromBatchNumber

Source
message/ChildToParentMessageClassic.ts:128

ChildToParentMessageWriterClassic
Provides read and write access for classic Child-to-Parent-messages

Extends
ChildToParentMessageReaderClassic
Constructors
new ChildToParentMessageWriterClassic()
new ChildToParentMessageWriterClassic(
   parentSigner: Signer, 
   batchNumber: BigNumber, 
   indexInBatch: BigNumber, 
   parentProvider?: Provider): ChildToParentMessageWriterClassic

Instantiates a new ChildToParentMessageWriterClassic object.

Parameters
Parameter	Type	Description
parentSigner	Signer	The signer to be used for executing the Child-to-Parent message.
batchNumber	BigNumber	The number of the batch containing the Child-to-Parent message.
indexInBatch	BigNumber	The index of the Child-to-Parent message within the batch.
parentProvider?	Provider	Optional. Used to override the Provider which is attached to parentSigner in case you need more control. This will be a required parameter in a future major version update.
Returns
ChildToParentMessageWriterClassic

Overrides
ChildToParentMessageReaderClassic.constructor

Source
message/ChildToParentMessageClassic.ts:406

Properties
Property	Modifier	Type	Default value	Description	Inherited from
batchNumber	readonly	BigNumber	undefined	The number of the batch this message is part of	ChildToParentMessageReaderClassic.batchNumber
indexInBatch	readonly	BigNumber	undefined	The index of this message in the batch	ChildToParentMessageReaderClassic.indexInBatch
outboxAddress	protected	null | string	null	Contains the classic outbox address, or set to zero address if this network
did not have a classic outbox deployed	ChildToParentMessageReaderClassic.outboxAddress
parentSigner	private	Signer	undefined	The signer to be used for executing the Child-to-Parent message.	-
Methods
execute()
execute(childProvider: Provider, overrides?: Overrides): Promise<ContractTransaction>

Executes the ChildToParentMessage on Parent Chain. Will throw an error if the outbox entry has not been created, which happens when the corresponding assertion is confirmed.

Parameters
Parameter	Type
childProvider	Provider
overrides?	Overrides
Returns
Promise<ContractTransaction>

Source
message/ChildToParentMessageClassic.ts:421

getFirstExecutableBlock()
getFirstExecutableBlock(childProvider: Provider): Promise<null | BigNumber>

Estimates the Parent Chain block number in which this Child-to-Parent tx will be available for execution

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise<null | BigNumber>

Always returns null for classic chainToParentChain messages since they can be executed in any block now.

Inherited from
ChildToParentMessageReaderClassic . getFirstExecutableBlock

Source
message/ChildToParentMessageClassic.ts:386

getOutboxAddress()
protected getOutboxAddress(childProvider: Provider, batchNumber: number): Promise<string>

Classic had 2 outboxes, we need to find the correct one for the provided batch number

Parameters
Parameter	Type	Description
childProvider	Provider	
batchNumber	number	
Returns
Promise<string>

Inherited from
ChildToParentMessageReaderClassic . getOutboxAddress

Source
message/ChildToParentMessageClassic.ts:211

hasExecuted()
hasExecuted(childProvider: Provider): Promise<boolean>

Check if given outbox message has already been executed

Parameters
Parameter	Type
childProvider	Provider
Returns
Promise<boolean>

Inherited from
ChildToParentMessageReaderClassic . hasExecuted

Source
message/ChildToParentMessageClassic.ts:301

status()
status(childProvider: Provider): Promise<ChildToParentMessageStatus>

Get the status of this message In order to check if the message has been executed proof info must be provided.

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise<ChildToParentMessageStatus>

Inherited from
ChildToParentMessageReaderClassic . status

Source
message/ChildToParentMessageClassic.ts:339

tryGetProof()
tryGetProof(childProvider: Provider): Promise<null | MessageBatchProofInfo>

Get the execution proof for this message. Returns null if the batch does not exist yet.

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise<null | MessageBatchProofInfo>

Inherited from
ChildToParentMessageReaderClassic . tryGetProof

Source
message/ChildToParentMessageClassic.ts:285

waitUntilOutboxEntryCreated()
waitUntilOutboxEntryCreated(childProvider: Provider, retryDelay: number): Promise<CONFIRMED | EXECUTED>

Waits until the outbox entry has been created, and will not return until it has been. WARNING: Outbox entries are only created when the corresponding node is confirmed. Which can take 1 week+, so waiting here could be a very long operation.

Parameters
Parameter	Type	Default value	Description
childProvider	Provider	undefined	-
retryDelay	number	500	
Returns
Promise<CONFIRMED | EXECUTED>

outbox entry status (either executed or confirmed but not pending)

Inherited from
ChildToParentMessageReaderClassic . waitUntilOutboxEntryCreated

Source
message/ChildToParentMessageClassic.ts:364

fromBatchNumber()
static fromBatchNumber<T>(
   parentSignerOrProvider: T, 
   batchNumber: BigNumber, 
   indexInBatch: BigNumber, 
parentProvider?: Provider): ChildToParentMessageReaderOrWriterClassic<T>

Instantiates a new ChildToParentMessageWriterClassic or ChildToParentMessageReaderClassic object.

Type parameters
Type parameter
T extends SignerOrProvider
Parameters
Parameter	Type	Description
parentSignerOrProvider	T	Signer or provider to be used for executing or reading the Child-to-Parent message.
batchNumber	BigNumber	The number of the batch containing the Child-to-Parent message.
indexInBatch	BigNumber	The index of the Child-to-Parent message within the batch.
parentProvider?	Provider	Optional. Used to override the Provider which is attached to parentSignerOrProvider in case you need more control. This will be a required parameter in a future major version update.
Returns
ChildToParentMessageReaderOrWriterClassic<T>

Inherited from
ChildToParentMessageReaderClassic . fromBatchNumber

Source
message/ChildToParentMessageClassic.ts:128

Type Aliases
ChildToParentMessageReaderOrWriterClassic<T>
type ChildToParentMessageReaderOrWriterClassic<T>: T extends Provider ? ChildToParentMessageReaderClassic : ChildToParentMessageWriterClassic;


Conditional type for Signer or Provider. If T is of type Provider then ChildToParentMessageReaderOrWriter<T> will be of type ChildToParentMessageReader. If T is of type Signer then ChildToParentMessageReaderOrWriter<T> will be of type ChildToParentMessageWriter.

Type parameters
Type parameter
T extends SignerOrProvider
Source
message/ChildToParentMessageClassic.ts:98





ChildToParentMessageNitro
Classes
ChildToParentMessageNitro
Base functionality for nitro Child->Parent messages

Extended by
ChildToParentMessageReaderNitro
Methods
fromEvent()
static fromEvent<T>(
   parentSignerOrProvider: T, 
   event: object, 
parentProvider?: Provider): ChildToParentMessageReaderOrWriterNitro<T>

Instantiates a new ChildToParentMessageWriterNitro or ChildToParentMessageReaderNitro object.

Type parameters
Type parameter
T extends SignerOrProvider
Parameters
Parameter	Type	Description
parentSignerOrProvider	T	Signer or provider to be used for executing or reading the Child-to-Parent message.
event	object	The event containing the data of the Child-to-Parent message.
event.arbBlockNum	BigNumber	-
event.caller?	string	-
event.callvalue?	BigNumber	-
event.data?	string	-
event.destination?	string	-
event.ethBlockNum?	BigNumber	-
event.hash?	BigNumber	-
event.position?	BigNumber	-
event.timestamp?	BigNumber	-
parentProvider?	Provider	Optional. Used to override the Provider which is attached to parentSignerOrProvider in case you need more control. This will be a required parameter in a future major version update.
Returns
ChildToParentMessageReaderOrWriterNitro<T>

Source
message/ChildToParentMessageNitro.ts:148

ChildToParentMessageReaderNitro
Provides read-only access nitro for child-to-parent-messages

Extends
ChildToParentMessageNitro
Extended by
ChildToParentMessageWriterNitro
Methods
getFirstExecutableBlock()
getFirstExecutableBlock(childProvider: Provider): Promise<null | BigNumber>

Estimates the L1 block number in which this L2 to L1 tx will be available for execution. If the message can or already has been executed, this returns null

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise<null | BigNumber>

expected parent chain block number where the child chain to parent chain message will be executable. Returns null if the message can be or already has been executed

Source
message/ChildToParentMessageNitro.ts:596

getRollupAndUpdateNetwork()
private getRollupAndUpdateNetwork(arbitrumNetwork: ArbitrumNetwork): Promise<RollupUserLogic | BoldRollupUserLogic>

If the local network is not currently bold, checks if the remote network is bold and if so updates the local network with a new rollup address

Parameters
Parameter	Type	Description
arbitrumNetwork	ArbitrumNetwork	
Returns
Promise<RollupUserLogic | BoldRollupUserLogic>

The rollup contract, bold or legacy

Source
message/ChildToParentMessageNitro.ts:567

hasExecuted()
protected hasExecuted(childProvider: Provider): Promise<boolean>

Check if this message has already been executed in the Outbox

Parameters
Parameter	Type
childProvider	Provider
Returns
Promise<boolean>

Source
message/ChildToParentMessageNitro.ts:225

isBold()
private isBold(arbitrumNetwork: ArbitrumNetwork, parentProvider: Provider): Promise<undefined | string>

Check whether the provided network has a BoLD rollup

Parameters
Parameter	Type	Description
arbitrumNetwork	ArbitrumNetwork	
parentProvider	Provider	
Returns
Promise<undefined | string>

Source
message/ChildToParentMessageNitro.ts:531

status()
status(childProvider: Provider): Promise<ChildToParentMessageStatus>

Get the status of this message In order to check if the message has been executed proof info must be provided.

Parameters
Parameter	Type
childProvider	Provider
Returns
Promise<ChildToParentMessageStatus>

Source
message/ChildToParentMessageNitro.ts:240

waitUntilReadyToExecute()
waitUntilReadyToExecute(childProvider: Provider, retryDelay: number): Promise<CONFIRMED | EXECUTED>

Waits until the outbox entry has been created, and will not return until it has been. WARNING: Outbox entries are only created when the corresponding node is confirmed. Which can take 1 week+, so waiting here could be a very long operation.

Parameters
Parameter	Type	Default value	Description
childProvider	Provider	undefined	-
retryDelay	number	500	
Returns
Promise<CONFIRMED | EXECUTED>

outbox entry status (either executed or confirmed but not pending)

Source
message/ChildToParentMessageNitro.ts:507

fromEvent()
static fromEvent<T>(
   parentSignerOrProvider: T, 
   event: object, 
parentProvider?: Provider): ChildToParentMessageReaderOrWriterNitro<T>

Instantiates a new ChildToParentMessageWriterNitro or ChildToParentMessageReaderNitro object.

Type parameters
Type parameter
T extends SignerOrProvider
Parameters
Parameter	Type	Description
parentSignerOrProvider	T	Signer or provider to be used for executing or reading the Child-to-Parent message.
event	object	The event containing the data of the Child-to-Parent message.
event.arbBlockNum	BigNumber	-
event.caller?	string	-
event.callvalue?	BigNumber	-
event.data?	string	-
event.destination?	string	-
event.ethBlockNum?	BigNumber	-
event.hash?	BigNumber	-
event.position?	BigNumber	-
event.timestamp?	BigNumber	-
parentProvider?	Provider	Optional. Used to override the Provider which is attached to parentSignerOrProvider in case you need more control. This will be a required parameter in a future major version update.
Returns
ChildToParentMessageReaderOrWriterNitro<T>

Inherited from
ChildToParentMessageNitro . fromEvent

Source
message/ChildToParentMessageNitro.ts:148

ChildToParentMessageWriterNitro
Provides read and write access for nitro child-to-Parent-messages

Extends
ChildToParentMessageReaderNitro
Constructors
new ChildToParentMessageWriterNitro()
new ChildToParentMessageWriterNitro(
   parentSigner: Signer, 
   event: object, 
   parentProvider?: Provider): ChildToParentMessageWriterNitro

Instantiates a new ChildToParentMessageWriterNitro object.

Parameters
Parameter	Type	Description
parentSigner	Signer	The signer to be used for executing the Child-to-Parent message.
event	object	The event containing the data of the Child-to-Parent message.
event.arbBlockNum	BigNumber	-
event.caller?	string	-
event.callvalue?	BigNumber	-
event.data?	string	-
event.destination?	string	-
event.ethBlockNum?	BigNumber	-
event.hash?	BigNumber	-
event.position?	BigNumber	-
event.timestamp?	BigNumber	-
parentProvider?	Provider	Optional. Used to override the Provider which is attached to parentSigner in case you need more control. This will be a required parameter in a future major version update.
Returns
ChildToParentMessageWriterNitro

Overrides
ChildToParentMessageReaderNitro.constructor

Source
message/ChildToParentMessageNitro.ts:724

Properties
Property	Modifier	Type	Description
parentSigner	private	Signer	The signer to be used for executing the Child-to-Parent message.
Methods
execute()
execute(childProvider: Provider, overrides?: Overrides): Promise<ContractTransaction>

Executes the ChildToParentMessage on Parent Chain. Will throw an error if the outbox entry has not been created, which happens when the corresponding assertion is confirmed.

Parameters
Parameter	Type
childProvider	Provider
overrides?	Overrides
Returns
Promise<ContractTransaction>

Source
message/ChildToParentMessageNitro.ts:738

getFirstExecutableBlock()
getFirstExecutableBlock(childProvider: Provider): Promise<null | BigNumber>

Estimates the L1 block number in which this L2 to L1 tx will be available for execution. If the message can or already has been executed, this returns null

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise<null | BigNumber>

expected parent chain block number where the child chain to parent chain message will be executable. Returns null if the message can be or already has been executed

Inherited from
ChildToParentMessageReaderNitro . getFirstExecutableBlock

Source
message/ChildToParentMessageNitro.ts:596

hasExecuted()
protected hasExecuted(childProvider: Provider): Promise<boolean>

Check if this message has already been executed in the Outbox

Parameters
Parameter	Type
childProvider	Provider
Returns
Promise<boolean>

Inherited from
ChildToParentMessageReaderNitro . hasExecuted

Source
message/ChildToParentMessageNitro.ts:225

status()
status(childProvider: Provider): Promise<ChildToParentMessageStatus>

Get the status of this message In order to check if the message has been executed proof info must be provided.

Parameters
Parameter	Type
childProvider	Provider
Returns
Promise<ChildToParentMessageStatus>

Inherited from
ChildToParentMessageReaderNitro . status

Source
message/ChildToParentMessageNitro.ts:240

waitUntilReadyToExecute()
waitUntilReadyToExecute(childProvider: Provider, retryDelay: number): Promise<CONFIRMED | EXECUTED>

Waits until the outbox entry has been created, and will not return until it has been. WARNING: Outbox entries are only created when the corresponding node is confirmed. Which can take 1 week+, so waiting here could be a very long operation.

Parameters
Parameter	Type	Default value	Description
childProvider	Provider	undefined	-
retryDelay	number	500	
Returns
Promise<CONFIRMED | EXECUTED>

outbox entry status (either executed or confirmed but not pending)

Inherited from
ChildToParentMessageReaderNitro . waitUntilReadyToExecute

Source
message/ChildToParentMessageNitro.ts:507

fromEvent()
static fromEvent<T>(
   parentSignerOrProvider: T, 
   event: object, 
parentProvider?: Provider): ChildToParentMessageReaderOrWriterNitro<T>

Instantiates a new ChildToParentMessageWriterNitro or ChildToParentMessageReaderNitro object.

Type parameters
Type parameter
T extends SignerOrProvider
Parameters
Parameter	Type	Description
parentSignerOrProvider	T	Signer or provider to be used for executing or reading the Child-to-Parent message.
event	object	The event containing the data of the Child-to-Parent message.
event.arbBlockNum	BigNumber	-
event.caller?	string	-
event.callvalue?	BigNumber	-
event.data?	string	-
event.destination?	string	-
event.ethBlockNum?	BigNumber	-
event.hash?	BigNumber	-
event.position?	BigNumber	-
event.timestamp?	BigNumber	-
parentProvider?	Provider	Optional. Used to override the Provider which is attached to parentSignerOrProvider in case you need more control. This will be a required parameter in a future major version update.
Returns
ChildToParentMessageReaderOrWriterNitro<T>

Inherited from
ChildToParentMessageReaderNitro . fromEvent

Source
message/ChildToParentMessageNitro.ts:148

Type Aliases
ChildToParentMessageReaderOrWriterNitro<T>
type ChildToParentMessageReaderOrWriterNitro<T>: T extends Provider ? ChildToParentMessageReaderNitro : ChildToParentMessageWriterNitro;


Conditional type for Signer or Provider. If T is of type Provider then ChildToParentMessageReaderOrWriter<T> will be of type ChildToParentMessageReader. If T is of type Signer then ChildToParentMessageReaderOrWriter<T> will be of type ChildToParentMessageWriter.

Type parameters
Type parameter
T extends SignerOrProvider
Source
message/ChildToParentMessageNitro.ts:64




ChildTransaction
Classes
ChildTransactionReceipt
Extension of ethers-js TransactionReceipt, adding Arbitrum-specific functionality

Implements
TransactionReceipt
Methods
getBatchConfirmations()
getBatchConfirmations(childProvider: JsonRpcProvider): Promise<BigNumber>

Get number of parent chain confirmations that the batch including this tx has

Parameters
Parameter	Type	Description
childProvider	JsonRpcProvider	
Returns
Promise<BigNumber>

number of confirmations of batch including tx, or 0 if no batch included this tx

Source
message/ChildTransaction.ts:138

getBatchNumber()
getBatchNumber(childProvider: JsonRpcProvider): Promise<BigNumber>

Get the number of the batch that included this tx (will throw if no such batch exists)

Parameters
Parameter	Type	Description
childProvider	JsonRpcProvider	
Returns
Promise<BigNumber>

number of batch in which tx was included, or errors if no batch includes the current tx

Source
message/ChildTransaction.ts:151

getChildToParentEvents()
getChildToParentEvents(): ChildToParentTransactionEvent[]

Get ChildToParentTransactionEvent events created by this transaction

Returns
ChildToParentTransactionEvent[]

Source
message/ChildTransaction.ts:97

getChildToParentMessages()
getChildToParentMessages<T>(parentSignerOrProvider: T): Promise<ChildToParentMessageReaderOrWriter<T>[]>

Get any child-to-parent-messages created by this transaction

Type parameters
Type parameter
T extends SignerOrProvider
Parameters
Parameter	Type	Description
parentSignerOrProvider	T	
Returns
Promise <ChildToParentMessageReaderOrWriter<T>[]>

Source
message/ChildTransaction.ts:119

getRedeemScheduledEvents()
getRedeemScheduledEvents(): object[]

Get event data for any redeems that were scheduled in this transaction

Returns
object[]

Source
message/ChildTransaction.ts:111

isDataAvailable()
isDataAvailable(childProvider: JsonRpcProvider, confirmations: number): Promise<boolean>

Whether the data associated with this transaction has been made available on parent chain

Parameters
Parameter	Type	Default value	Description
childProvider	JsonRpcProvider	undefined	
confirmations	number	10	The number of confirmations on the batch before data is to be considered available
Returns
Promise<boolean>

Source
message/ChildTransaction.ts:173

monkeyPatchWait()
static monkeyPatchWait(contractTransaction: ContractTransaction): ChildContractTransaction

Replaces the wait function with one that returns an L2TransactionReceipt

Parameters
Parameter	Type	Description
contractTransaction	ContractTransaction	
Returns
ChildContractTransaction

Source
message/ChildTransaction.ts:187

toRedeemTransaction()
static toRedeemTransaction(redeemTx: ChildContractTransaction, childProvider: Provider): RedeemTransaction

Adds a waitForRedeem function to a redeem transaction

Parameters
Parameter	Type	Description
redeemTx	ChildContractTransaction	
childProvider	Provider	
Returns
RedeemTransaction

Source
message/ChildTransaction.ts:208







ParentToChildMessage
Classes
EthDepositMessage
A message for Eth deposits from Parent to Child

Constructors
new EthDepositMessage()
new EthDepositMessage(
   childProvider: Provider, 
   childChainId: number, 
   messageNumber: BigNumber, 
   from: string, 
   to: string, 
   value: BigNumber): EthDepositMessage

Parameters
Parameter	Type	Description
childProvider	Provider	
childChainId	number	
messageNumber	BigNumber	
from	string	-
to	string	Recipient address of the ETH on Chain
value	BigNumber	
Returns
EthDepositMessage

Source
message/ParentToChildMessage.ts:852

Properties
Property	Modifier	Type	Description
childChainId	readonly	number	-
childProvider	private	Provider	-
messageNumber	readonly	BigNumber	-
to	readonly	string	Recipient address of the ETH on Chain
value	readonly	BigNumber	-
Methods
fromEventComponents()
static fromEventComponents(
   childProvider: Provider, 
   messageNumber: BigNumber, 
   senderAddr: string, 
inboxMessageEventData: string): Promise<EthDepositMessage>

Create an EthDepositMessage from data emitted in event when calling ethDeposit on Inbox.sol

Parameters
Parameter	Type	Description
childProvider	Provider	
messageNumber	BigNumber	The message number in the Inbox.InboxMessageDelivered event
senderAddr	string	The sender address from Bridge.MessageDelivered event
inboxMessageEventData	string	The data field from the Inbox.InboxMessageDelivered event
Returns
Promise <EthDepositMessage>

Source
message/ParentToChildMessage.ts:823

parseEthDepositData()
static private parseEthDepositData(eventData: string): object

Parse the data field in event InboxMessageDelivered(uint256 indexed messageNum, bytes data);

Parameters
Parameter	Type	Description
eventData	string	
Returns
object

destination and amount

Member	Type
to	string
value	BigNumber
Source
message/ParentToChildMessage.ts:802

Type Aliases
ParentToChildMessageReaderOrWriter<T>
type ParentToChildMessageReaderOrWriter<T>: T extends Provider ? ParentToChildMessageReader : ParentToChildMessageWriter;

Conditional type for Signer or Provider. If T is of type Provider then ParentToChildMessageReaderOrWriter<T> will be of type ParentToChildMessageReader. If T is of type Signer then ParentToChildMessageReaderOrWriter<T> will be of type ParentToChildMessageWriter.

Type parameters
Type parameter
T extends SignerOrProvider
Source
message/ParentToChildMessage.ts:98

ParentToChildMessageWaitForStatusResult
type ParentToChildMessageWaitForStatusResult: object | object;

If the status is redeemed, childTxReceipt is populated. For all other statuses childTxReceipt is not populated

Source
message/ParentToChildMessage.ts:240








ParentToChildMessageCreator
Classes
ParentToChildMessageCreator
Creates retryable tickets by directly calling the Inbox contract on Parent chain

Methods
createRetryableTicket()
createRetryableTicket(
   params: OmitTyped<ParentToChildMessageNoGasParams, "excessFeeRefundAddress" | "callValueRefundAddress"> & Partial<ParentToChildMessageNoGasParams> & object | ParentToChildTransactionRequest & object, 
   childProvider: Provider, 
options?: GasOverrides): Promise<ParentContractTransaction<ParentTransactionReceipt>>


Creates a retryable ticket by directly calling the Inbox contract on Parent chain

Parameters
Parameter	Type
params	OmitTyped<ParentToChildMessageNoGasParams, "excessFeeRefundAddress" | "callValueRefundAddress"> & Partial<ParentToChildMessageNoGasParams> & object | ParentToChildTransactionRequest & object
childProvider	Provider
options?	GasOverrides
Returns
Promise<ParentContractTransaction<ParentTransactionReceipt>>

Source
message/ParentToChildMessageCreator.ts:206

getTicketCreationRequest()
static getTicketCreationRequest(
   params: ParentToChildMessageParams, 
   parentProvider: Provider, 
   childProvider: Provider, 
options?: GasOverrides): Promise<ParentToChildTransactionRequest>

Generate a transaction request for creating a retryable ticket

Parameters
Parameter	Type	Description
params	ParentToChildMessageParams	
parentProvider	Provider	
childProvider	Provider	
options?	GasOverrides	
Returns
Promise <ParentToChildTransactionRequest>

Source
message/ParentToChildMessageCreator.ts:139

getTicketCreationRequestCallData()
static protected getTicketCreationRequestCallData(
   params: ParentToChildMessageParams, 
   estimates: Pick<RetryableData, ParentToChildGasKeys>, 
   excessFeeRefundAddress: string, 
   callValueRefundAddress: string, 
   nativeTokenIsEth: boolean): string

Prepare calldata for a call to create a retryable ticket

Parameters
Parameter	Type	Description
params	ParentToChildMessageParams	
estimates	Pick<RetryableData, ParentToChildGasKeys>	
excessFeeRefundAddress	string	
callValueRefundAddress	string	
nativeTokenIsEth	boolean	
Returns
string

Source
message/ParentToChildMessageCreator.ts:92

getTicketEstimate()
static protected getTicketEstimate(
   params: ParentToChildMessageNoGasParams, 
   parentProvider: Provider, 
   childProvider: Provider, 
retryableGasOverrides?: GasOverrides): Promise<Pick<RetryableData, ParentToChildGasKeys>>

Gets a current estimate for the supplied params

Parameters
Parameter	Type	Description
params	ParentToChildMessageNoGasParams	
parentProvider	Provider	
childProvider	Provider	
retryableGasOverrides?	GasOverrides	
Returns
Promise<Pick<RetryableData, ParentToChildGasKeys>>

Source
message/ParentToChildMessageCreator.ts:66





ParentToChildMessageGasEstimator
Type Aliases
PercentIncrease
type PercentIncrease: object;

An optional big number percentage increase

Type declaration
Member	Type	Description
base	BigNumber	If provided, will override the estimated base
percentIncrease	BigNumber	How much to increase the base by. If not provided system defaults may be used.
Source
message/ParentToChildMessageGasEstimator.ts:43







ParentTransaction
Classes
ParentContractCallTransactionReceipt
A ParentTransactionReceipt with additional functionality that only exists if the transaction created a single call to a child chain contract - this includes token deposits.

Extends
ParentTransactionReceipt
Methods
getEthDeposits()
getEthDeposits(childProvider: Provider): Promise<EthDepositMessage[]>

Get any eth deposit messages created by this transaction

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise <EthDepositMessage[]>

Inherited from
ParentTransactionReceipt.getEthDeposits

Source
message/ParentTransaction.ts:191

getInboxMessageDeliveredEvents()
getInboxMessageDeliveredEvents(): object[]

Get any InboxMessageDelivered events that were emitted during this transaction

Returns
object[]

Inherited from
ParentTransactionReceipt.getInboxMessageDeliveredEvents

Source
message/ParentTransaction.ts:134

getMessageDeliveredEvents()
getMessageDeliveredEvents(): object[]

Get any MessageDelivered events that were emitted during this transaction

Returns
object[]

Inherited from
ParentTransactionReceipt.getMessageDeliveredEvents

Source
message/ParentTransaction.ts:126

getMessageEvents()
getMessageEvents(): object[]

Get combined data for any InboxMessageDelivered and MessageDelivered events emitted during this transaction

Returns
object[]

Inherited from
ParentTransactionReceipt.getMessageEvents

Source
message/ParentTransaction.ts:147

getParentToChildMessages()
getParentToChildMessages<T>(childSignerOrProvider: T): Promise<ParentToChildMessageReaderOrWriter<T>[]>

Get any parent-to-child messages created by this transaction

Type parameters
Type parameter
T extends SignerOrProvider
Parameters
Parameter	Type	Description
childSignerOrProvider	T	
Returns
Promise <ParentToChildMessageReaderOrWriter<T>[]>

Inherited from
ParentTransactionReceipt.getParentToChildMessages

Source
message/ParentTransaction.ts:248

getParentToChildMessagesClassic()
getParentToChildMessagesClassic(childProvider: Provider): Promise<ParentToChildMessageReaderClassic[]>

Get classic parent-to-child messages created by this transaction

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise<ParentToChildMessageReaderClassic[]>

Inherited from
ParentTransactionReceipt.getParentToChildMessagesClassic

Source
message/ParentTransaction.ts:216

getTokenDepositEvents()
getTokenDepositEvents(): object[]

Get any token deposit events created by this transaction

Returns
object[]

Inherited from
ParentTransactionReceipt.getTokenDepositEvents

Source
message/ParentTransaction.ts:298

isClassic()
isClassic<T>(childSignerOrProvider: T): Promise<boolean>

Check if is a classic transaction

Type parameters
Type parameter
T extends SignerOrProvider
Parameters
Parameter	Type	Description
childSignerOrProvider	T	
Returns
Promise<boolean>

Inherited from
ParentTransactionReceipt.isClassic

Source
message/ParentTransaction.ts:106

waitForChildTransactionReceipt()
waitForChildTransactionReceipt<T>(
   childSignerOrProvider: T, 
   confirmations?: number, 
timeout?: number): Promise<object & ParentToChildMessageWaitForStatusResult>

Wait for the transaction to arrive and be executed on the child chain

Type parameters
Type parameter
T extends SignerOrProvider
Parameters
Parameter	Type	Description
childSignerOrProvider	T	-
confirmations?	number	Amount of confirmations the retryable ticket and the auto redeem receipt should have
timeout?	number	Amount of time to wait for the retryable ticket to be created
Defaults to 15 minutes, as by this time all transactions are expected to be included on the child chain. Throws on timeout.
Returns
Promise<object & ParentToChildMessageWaitForStatusResult>

The wait result contains complete, a status, a ParentToChildMessage and optionally the childTxReceipt. If complete is true then this message is in the terminal state. For contract calls this is true only if the status is REDEEMED.

Source
message/ParentTransaction.ts:407

monkeyPatchContractCallWait()
static monkeyPatchContractCallWait(contractTransaction: ContractTransaction): ParentContractCallTransaction

Replaces the wait function with one that returns a ParentContractCallTransactionReceipt

Parameters
Parameter	Type	Description
contractTransaction	ContractTransaction	
Returns
ParentContractCallTransaction

Inherited from
ParentTransactionReceipt.monkeyPatchContractCallWait

Source
message/ParentTransaction.ts:343

monkeyPatchEthDepositWait()
static monkeyPatchEthDepositWait(contractTransaction: ContractTransaction): ParentEthDepositTransaction

Replaces the wait function with one that returns a ParentEthDepositTransactionReceipt

Parameters
Parameter	Type	Description
contractTransaction	ContractTransaction	
Returns
ParentEthDepositTransaction

Inherited from
ParentTransactionReceipt.monkeyPatchEthDepositWait

Source
message/ParentTransaction.ts:327

monkeyPatchWait()
static monkeyPatchWait(contractTransaction: ContractTransaction): ParentContractTransaction<ParentTransactionReceipt>

Replaces the wait function with one that returns a ParentTransactionReceipt

Parameters
Parameter	Type	Description
contractTransaction	ContractTransaction	
Returns
ParentContractTransaction<ParentTransactionReceipt>

Inherited from
ParentTransactionReceipt.monkeyPatchWait

Source
message/ParentTransaction.ts:311

ParentEthDepositTransactionReceipt
A ParentTransactionReceipt with additional functionality that only exists if the transaction created a single eth deposit.

Extends
ParentTransactionReceipt
Methods
getEthDeposits()
getEthDeposits(childProvider: Provider): Promise<EthDepositMessage[]>

Get any eth deposit messages created by this transaction

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise <EthDepositMessage[]>

Inherited from
ParentTransactionReceipt.getEthDeposits

Source
message/ParentTransaction.ts:191

getInboxMessageDeliveredEvents()
getInboxMessageDeliveredEvents(): object[]

Get any InboxMessageDelivered events that were emitted during this transaction

Returns
object[]

Inherited from
ParentTransactionReceipt.getInboxMessageDeliveredEvents

Source
message/ParentTransaction.ts:134

getMessageDeliveredEvents()
getMessageDeliveredEvents(): object[]

Get any MessageDelivered events that were emitted during this transaction

Returns
object[]

Inherited from
ParentTransactionReceipt.getMessageDeliveredEvents

Source
message/ParentTransaction.ts:126

getMessageEvents()
getMessageEvents(): object[]

Get combined data for any InboxMessageDelivered and MessageDelivered events emitted during this transaction

Returns
object[]

Inherited from
ParentTransactionReceipt.getMessageEvents

Source
message/ParentTransaction.ts:147

getParentToChildMessages()
getParentToChildMessages<T>(childSignerOrProvider: T): Promise<ParentToChildMessageReaderOrWriter<T>[]>

Get any parent-to-child messages created by this transaction

Type parameters
Type parameter
T extends SignerOrProvider
Parameters
Parameter	Type	Description
childSignerOrProvider	T	
Returns
Promise <ParentToChildMessageReaderOrWriter<T>[]>

Inherited from
ParentTransactionReceipt.getParentToChildMessages

Source
message/ParentTransaction.ts:248

getParentToChildMessagesClassic()
getParentToChildMessagesClassic(childProvider: Provider): Promise<ParentToChildMessageReaderClassic[]>

Get classic parent-to-child messages created by this transaction

Parameters
Parameter	Type	Description
childProvider	Provider	
Returns
Promise<ParentToChildMessageReaderClassic[]>

Inherited from
ParentTransactionReceipt.getParentToChildMessagesClassic

Source
message/ParentTransaction.ts:216

getTokenDepositEvents()
getTokenDepositEvents(): object[]

Get any token deposit events created by this transaction

Returns
object[]

Inherited from
ParentTransactionReceipt.getTokenDepositEvents

Source
message/ParentTransaction.ts:298

isClassic()
isClassic<T>(childSignerOrProvider: T): Promise<boolean>

Check if is a classic transaction

Type parameters
Type parameter
T extends SignerOrProvider
Parameters
Parameter	Type	Description
childSignerOrProvider	T	
Returns
Promise<boolean>

Inherited from
ParentTransactionReceipt.isClassic

Source
message/ParentTransaction.ts:106

waitForChildTransactionReceipt()
waitForChildTransactionReceipt(
   childProvider: Provider, 
   confirmations?: number, 
timeout?: number): Promise<object & EthDepositMessageWaitForStatusResult>

Wait for the funds to arrive on the child chain

Parameters
Parameter	Type	Description
childProvider	Provider	-
confirmations?	number	Amount of confirmations the retryable ticket and the auto redeem receipt should have
timeout?	number	Amount of time to wait for the retryable ticket to be created
Defaults to 15 minutes, as by this time all transactions are expected to be included on the child chain. Throws on timeout.
Returns
Promise<object & EthDepositMessageWaitForStatusResult>

The wait result contains complete, a status, the ParentToChildMessage and optionally the childTxReceipt If complete is true then this message is in the terminal state. For eth deposits complete this is when the status is FUNDS_DEPOSITED, EXPIRED or REDEEMED.

Source
message/ParentTransaction.ts:369

monkeyPatchContractCallWait()
static monkeyPatchContractCallWait(contractTransaction: ContractTransaction): ParentContractCallTransaction

Replaces the wait function with one that returns a ParentContractCallTransactionReceipt

Parameters
Parameter	Type	Description
contractTransaction	ContractTransaction	
Returns
ParentContractCallTransaction

Inherited from
ParentTransactionReceipt.monkeyPatchContractCallWait

Source
message/ParentTransaction.ts:343

monkeyPatchEthDepositWait()
static monkeyPatchEthDepositWait(contractTransaction: ContractTransaction): ParentEthDepositTransaction

Replaces the wait function with one that returns a ParentEthDepositTransactionReceipt

Parameters
Parameter	Type	Description
contractTransaction	ContractTransaction	
Returns
ParentEthDepositTransaction

Inherited from
ParentTransactionReceipt.monkeyPatchEthDepositWait

Source
message/ParentTransaction.ts:327

monkeyPatchWait()
static monkeyPatchWait(contractTransaction: ContractTransaction): ParentContractTransaction<ParentTransactionReceipt>

Replaces the wait function with one that returns a ParentTransactionReceipt

Parameters
Parameter	Type	Description
contractTransaction	ContractTransaction	
Returns
ParentContractTransaction<ParentTransactionReceipt>

Inherited from
ParentTransactionReceipt.monkeyPatchWait

Source
message/ParentTransaction.ts:311

Edit this page




arbProvider
Classes
ArbitrumProvider
Arbitrum specific formats

Extends
Web3Provider
Constructors
new ArbitrumProvider()
new ArbitrumProvider(provider: JsonRpcProvider, network?: Networkish): ArbitrumProvider

Arbitrum specific formats

Parameters
Parameter	Type	Description
provider	JsonRpcProvider	Must be connected to an Arbitrum network
network?	Networkish	Must be an Arbitrum network
Returns
ArbitrumProvider

Overrides
Web3Provider.constructor

Source
utils/arbProvider.ts:77



byte_serialize_params
Functions
argSerializerConstructor()
function argSerializerConstructor(arbProvider: Provider): (params: PrimativeOrPrimativeArray[]) => Promise<Uint8Array>

to use:

const mySerializeParamsFunction = argSerializerConstructor("rpcurl")
mySerializeParamsFunction(["4","5", "6"])

Parameters
Parameter	Type
arbProvider	Provider
Returns
Function

Parameters
Parameter	Type
params	PrimativeOrPrimativeArray[]
Returns
Promise<Uint8Array>

Source
utils/byte_serialize_params.ts:102

serializeParams()
function serializeParams(params: PrimativeOrPrimativeArray[], addressToIndex: (address: string) => Promise<number>): Promise<Uint8Array>


Parameters
Parameter	Type	Description
params	PrimativeOrPrimativeArray[]	array of serializable types to
addressToIndex	(address: string) => Promise<number>	optional getter of address index registered in table
Returns
Promise<Uint8Array>

Source
utils/byte_serialize_params.ts:138




eventFetcher
Classes
EventFetcher
Fetches and parses blockchain logs

Methods
getEvents()
getEvents<TContract, TEventFilter>(
   contractFactory: TypeChainContractFactory<TContract>, 
   topicGenerator: (t: TContract) => TEventFilter, 
filter: object): Promise<FetchedEvent<TEventOf<TEventFilter>>[]>

Fetch logs and parse logs

Type parameters
Type parameter
TContract extends Contract
TEventFilter extends TypedEventFilter<TypedEvent<any, any>>
Parameters
Parameter	Type	Description
contractFactory	TypeChainContractFactory<TContract>	A contract factory for generating a contract of type TContract at the addr
topicGenerator	(t: TContract) => TEventFilter	Generator function for creating
filter	object	Block and address filter parameters
filter.address?	string	-
filter.fromBlock	BlockTag	-
filter.toBlock	BlockTag	-
Returns
Promise<FetchedEvent<TEventOf<TEventFilter>>[]>

Source
utils/eventFetcher.ts:57







lib
Functions
getFirstBlockForL1Block()
function getFirstBlockForL1Block(__namedParameters: GetFirstBlockForL1BlockProps): Promise<number | undefined>

This function performs a binary search to find the first Arbitrum block that corresponds to a given L1 block number. The function returns a Promise that resolves to a number if a block is found, or undefined otherwise.

Parameters
Parameter	Type
__namedParameters	GetFirstBlockForL1BlockProps
Returns
Promise<number | undefined>

A Promise that resolves to a number if a block is found, or undefined otherwise.
Source
utils/lib.ts:90

getTransactionReceipt()
function getTransactionReceipt(
   provider: Provider, 
   txHash: string, 
   confirmations?: number, 
timeout?: number): Promise<null | TransactionReceipt>

Waits for a transaction receipt if confirmations or timeout is provided Otherwise tries to fetch straight away.

Parameters
Parameter	Type	Description
provider	Provider	
txHash	string	
confirmations?	number	
timeout?	number	
Returns
Promise<null | TransactionReceipt>

Source
utils/lib.ts:33





multicall
Classes
MultiCaller
Util for executing multi calls against the MultiCallV2 contract

Properties
Property	Modifier	Type	Description
address	readonly	string	Address of multicall contract
Methods
getBlockNumberInput()
getBlockNumberInput(): CallInput<BigNumber>

Get the call input for the current block number

Returns
CallInput<BigNumber>

Source
utils/multicall.ts:133

getCurrentBlockTimestampInput()
getCurrentBlockTimestampInput(): CallInput<BigNumber>

Get the call input for the current block timestamp

Returns
CallInput<BigNumber>

Source
utils/multicall.ts:149

getTokenData()
getTokenData<T>(erc20Addresses: string[], options?: T): Promise<TokenInputOutput<T>[]>

Multicall for token properties. Will collect all the requested properies for each of the supplied token addresses.

Type parameters
Type parameter
T extends undefined | TokenMultiInput
Parameters
Parameter	Type	Description
erc20Addresses	string[]	
options?	T	Defaults to just 'name'
Returns
Promise<TokenInputOutput<T>[]>

Source
utils/multicall.ts:231

multiCall()
multiCall<T, TRequireSuccess>(params: T, requireSuccess?: TRequireSuccess): Promise<DecoderReturnType<T, TRequireSuccess>>

Executes a multicall for the given parameters Return values are order the same as the inputs. If a call failed undefined is returned instead of the value.

To get better type inference when the individual calls are of different types create your inputs as a tuple and pass the tuple in. The return type will be a tuple of the decoded return types. eg.

  const inputs: [
    CallInput<Awaited<ReturnType<ERC20['functions']['balanceOf']>>[0]>,
    CallInput<Awaited<ReturnType<ERC20['functions']['name']>>[0]>
  ] = [
    {
      targetAddr: token.address,
      encoder: () => token.interface.encodeFunctionData('balanceOf', ['']),
      decoder: (returnData: string) =>
        token.interface.decodeFunctionResult('balanceOf', returnData)[0],
    },
    {
      targetAddr: token.address,
      encoder: () => token.interface.encodeFunctionData('name'),
      decoder: (returnData: string) =>
        token.interface.decodeFunctionResult('name', returnData)[0],
    },
  ]

  const res = await multiCaller.call(inputs)

Type parameters
Type parameter
T extends CallInput<unknown>[]
TRequireSuccess extends boolean
Parameters
Parameter	Type	Description
params	T	
requireSuccess?	TRequireSuccess	Fail the whole call if any internal call fails
Returns
Promise<DecoderReturnType<T, TRequireSuccess>>

Source
utils/multicall.ts:197

fromProvider()
static fromProvider(provider: Provider): Promise<MultiCaller>

Finds the correct multicall address for the given provider and instantiates a multicaller

Parameters
Parameter	Type	Description
provider	Provider	
Returns
Promise <MultiCaller>

Source
utils/multicall.ts:125

Type Aliases
CallInput<T>
type CallInput<T>: object;

Input to multicall aggregator

Type parameters
Type parameter
T
Type declaration
Member	Type	Description
decoder	(returnData: string) => T	Function to decode the result of the call
encoder	() => string	Function to produce encoded call data
targetAddr	string	Address of the target contract to be called
Source
utils/multicall.ts:30





types
Type Aliases
OmitTyped<T, K>
type OmitTyped<T, K>: Omit<T, K>;

Omit doesnt enforce that the seconds generic is a keyof the first OmitTyped guards against the underlying type prop names being refactored, and not being updated in the usage of OmitTyped

Type parameters
Type parameter
T
K extends keyof T
Source
utils/types.ts:6

PartialPick<T, K>
type PartialPick<T, K>: OmitTyped<T, K> & Partial<T>;

Make the specified properties optional

Type parameters
Type parameter
T
K extends keyof T
Source
utils/types.ts:11

RequiredPick<T, K>
type RequiredPick<T, K>: Required<Pick<T, K>> & T;

Make the specified properties required

Type parameters
Type parameter
T
K extends keyof T
Source
utils/types.ts:16






Arbitrum Sepolia (Testnet)	https://sepolia-rollup.arbitrum.io/rpc	421614	Arbiscan, Blockscout	Sepolia	Nitro (Rollup)	wss://sepolia-rollup.arbitrum.io/feed	https://sepolia-rollup-sequencer.arbitrum.io/rpc



