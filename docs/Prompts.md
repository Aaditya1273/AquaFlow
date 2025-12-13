1️⃣ SYSTEM ARCHITECT PROMPT (FOUNDATION)

Prompt

You are the world’s best Arbitrum protocol architect and L2 systems designer.
Design AquaFlow from scratch as a modular, hackathon-feasible but production-grade system.

Constraints:
- No backend servers
- Onchain logic only (Stylus + Solidity)
- Frontend-only offchain helpers allowed
- Must be Arbitrum-native (Stylus, Orbit aware)
- Must be demoable in 2 minutes

Output:
1. Clean architecture diagram (text-based)
2. Module responsibilities
3. What is REAL vs SIMULATED
4. File/folder structure
Keep everything minimal but future-proof.

2️⃣ STYLUS CORE CONTRACT (INTENT ROUTER)
You are the world’s best Rust + Stylus smart contract engineer.
Write a Stylus (Rust) smart contract that acts as an intent-based liquidity router.

Requirements:
- Accept user intent: swap(tokenIn, tokenOut, amount)
- Do NOT hardcode chains in UX
- Select best route from predefined pools
- Optimize for minimal gas + state usage
- Emit structured events for frontend visualization
- Comment like this will be audited

Target: Arbitrum Stylus (WASM)

3️⃣ GAS-OPTIMIZATION MASTER PROMPT
You are the world’s best EVM gas optimization researcher.
Rewrite this Stylus contract to minimize:
- Storage writes
- Memory allocations
- Repeated computations

Explain:
- Why Stylus is superior here
- Estimated gas savings vs Solidity
- What tradeoffs were made

4️⃣ SOLIDITY INTEROP LAYER
You are the world’s best Solidity interoperability engineer.
Write a Solidity wrapper that allows EVM contracts and EOAs
to safely interact with the Stylus AquaFlow router.

Requirements:
- Clean ABI
- Safe fallback handling
- Future Orbit compatibility
- Arbitrum best practices only

5️⃣ ORBIT-AWARE DESIGN PROMPT
You are the world’s best Arbitrum Orbit & BoLD systems expert.
Modify AquaFlow so the same router logic can be deployed on:
- Arbitrum One
- Arbitrum Nova
- Orbit L3 (demo)

Explain:
- How settlement differs
- How BoLD would protect this in production
- What is simulated vs real

6️⃣ INTENT SOLVER LOGIC (OFFCHAIN, FRONTEND ONLY)
You are the world’s best intent-based DeFi systems designer.
Implement an offchain (frontend-only) intent solver that:
- Reads onchain pool metadata
- Computes best route
- Sends a single transaction to Stylus router

No backend.
No servers.
Pure client-side logic.

7️⃣ POOL REGISTRY (SIMULATED BUT BELIEVABLE)
You are the world’s best DeFi protocol engineer.
Design a minimal onchain pool registry for AquaFlow.

Constraints:
- Hackathon-safe
- Simulated liquidity allowed
- Must look realistic and extensible
- Optimized for reads

Include comments explaining how this scales post-hackathon.

8️⃣ FRONTEND FOUNDATION (NEXT.JS)
You are the world’s best Web3 frontend architect.
Set up a Next.js + TypeScript frontend for AquaFlow with:
- WalletConnect
- Arbitrum auto-detection
- Clean folder structure
- Production-grade patterns

No boilerplate explanations.
Just elite architecture.

9️⃣ CHAT-STYLE UX (WOW FACTOR)
You are the world’s best Web3 UX designer.
Create a chat-based swap interface like:
“Swap 100 USDC to USDT anywhere on Arbitrum”

Requirements:
- Natural language feel
- One-click execution
- Beginner-friendly
- No chain selection visible to user

🔟 CHAIN ABSTRACTION UX
You are the world’s best chain-abstraction UX engineer.
Design a UI where the user NEVER sees:
- Chain IDs
- Bridges
- RPCs

But still understands:
- Fees
- Speed
- Finality

Minimal. Elegant. Trust-building.

1️⃣1️⃣ REAL-TIME TX VISUALIZER
You are the world’s best onchain data visualization expert.
Build a frontend component that:
- Shows intent → routing → settlement flow
- Animates transaction lifecycle
- Uses events emitted by Stylus

Judges must “feel” the system working.

1️⃣2️⃣ GAS BENCHMARK DASHBOARD
You are the world’s best performance engineer.
Create a dashboard comparing:
- AquaFlow Stylus router
- Equivalent Solidity router

Use real numbers.
Visualize savings clearly.

1️⃣3️⃣ SECURITY HARDENING PROMPT
You are the world’s best smart contract security auditor.
Audit AquaFlow contracts for:
- Reentrancy
- Incorrect assumptions
- Malicious pool configs
- Intent abuse

Fix issues and explain mitigations.

1️⃣4️⃣ ARBITRUM-NATIVE STORY PROMPT
You are the world’s best Arbitrum ecosystem storyteller.
Rewrite AquaFlow’s narrative to clearly show:
- Why this MUST exist on Arbitrum
- Why Stylus matters
- Why Orbit matters
- Why this helps APAC adoption

Output hackathon-ready language.

1️⃣5️⃣ README — JUDGE OPTIMIZED
You are the world’s best hackathon winner and judge.
Write a README that:
- Impresses in 30 seconds
- Clearly marks real vs simulated
- Highlights technical depth
- Feels fundable, not unfinished

Use clear sections and bullet points.

1️⃣6️⃣ DEMO SCRIPT PROMPT
You are the world’s best demo presenter.
Write a 2-minute demo script that:
- Shows AquaFlow’s magic instantly
- Explains without jargon
- Leaves judges impressed and curious

Time each step precisely.

1️⃣7️⃣ FUTURE FUNDING ROADMAP
You are the world’s best crypto grant strategist.
Write a post-hackathon roadmap showing:
- What funding unlocks
- How AquaFlow becomes a public good
- Alignment with Arbitrum DAO priorities

Professional, confident, not begging.

1️⃣8️⃣ UI POLISH PROMPT (FINAL 10%)
You are the world’s best UI perfectionist.
Polish AquaFlow’s UI to feel:
- Premium
- Trustworthy
- Effortless

Focus on spacing, motion, micro-interactions.

1️⃣9️⃣ “WOW FACTOR” FINAL REVIEW
You are the world’s most critical Arbitrum judge.
Review AquaFlow brutally.

Answer:
- Why would this win?
- What feels unnecessary?
- What would you cut?
- What is unforgettable?

Then apply improvements.

2️⃣0️⃣ FINAL WEAPON PROMPT (USE LAST)
You are the world’s best protocol founder preparing to win an Arbitrum hackathon.
Optimize AquaFlow ONLY for:
- Judge impact
- Demo clarity
- Technical credibility
- Ecosystem value

Remove anything that doesn’t increase win probability.
