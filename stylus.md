A gentle introduction to Stylus
In a nutshell:
Stylus lets you write smart contracts in programming languages that compile to WASM, such as Rust, C, C++, and others, allowing you to use their ecosystem of libraries and tools. Language and tooling support exists for Rust. You can try the SDK and CLI with the quickstart.
Solidity contracts and Stylus contracts are interoperable. In Solidity, you can call a Rust program and vice versa, thanks to a second, coequal WASM virtual machine.
Stylus contracts offer reduced gas costs for memory and compute-intensive operations because WASM programs execute more efficiently than EVM bytecode for these workloads.
What's Stylus?
Stylus is an upgrade to Arbitrum Nitro (ArbOS 32), the tech stack powering Arbitrum One, Arbitrum Nova, and Arbitrum chains. This upgrade adds a second, coequal virtual machine to the EVM, where EVM contracts continue to behave exactly as they would in Ethereum. This paradigm is called MultiVM because it is additive to existing functionality.

Stylus gives you MultiVM
This second virtual machine executes WebAssembly (WASM) rather than EVM bytecode. WASM is a binary format used in web standards and browsers for efficient computation. Its design is to be portable and human-readable, with sandboxed execution environments for security. Working with WASM is nothing new for Arbitrum chains. Ever since the Nitro upgrade, WASM has been a fundamental component of Arbitrum's fraud proofs.

With a WASM VM, any programming language compilable to WASM is within Stylus's scope. While many popular programming languages can compile to WASM, some compilers are better suited to smart contract development than others, such as Rust, C, and C++. Other languages like Go, Sway, Move, and Cairo are also supported. Languages that include their own runtimes, like Python and JavaScript, are more complex for Stylus to support, although not impossible. WASM programs tend to be more efficient than EVM bytecode for memory-intensive applications. This efficiency comes from mature compiler toolchains for languages like Rust and C, which have benefited from decades of optimization work. The WASM runtime also executes faster than the EVM interpreter. Third-party contributions in the form of libraries for new and existing languages are welcome.

How Stylus works
Bringing a Stylus program to life involves four stages: coding, activation, execution, and proving. The following sections describe each step.

Coding
You write your smart contract in any programming language that compiles to WASM. Rust has the most developed support with an open-source SDK for smart contract development. C and C++ are also supported, so that you can deploy existing contracts in those languages onchain with minimal modifications.

The Stylus SDK for Rust provides the development framework and language features for smart contract development. It also provides access to EVM-specific functionality used by smart contract developers.

Activation
Once you've written your contract, compile it to WASM using the Stylus CLI (or another compiler, like Clang for C/C++). Then you post the compiled WASM onchain.

To make your contract callable, it must undergo an activation process. During activation, the WASM compiles down to a node's native machine code (e.g., ARM or x86). This step also includes safety checks, such as gas metering, depth-checking, and memory charging, to ensure your program runs safely and can be fraud-proven.

Stylus measures computational costs using ink instead of gas. Ink works like gas but is thousands of times smaller. WASM executes faster than the EVM, so a single EVM operation takes as long as thousands of WASM operations. A finer-grained unit makes pricing more precise.

note
Stylus contracts need to be reactivated once per year (365 days) or after any Stylus upgrade. You can do this using cargo-stylus or the ArbWasm precompile. If a contract isn't reactivated, it becomes uncallable.

Execution
When your Stylus program runs, it executes in a fork of Wasmer, a WebAssembly runtime. Because Wasmer compiles to native machine code, it executes faster than Geth's EVM bytecode interpreter. This performance difference reduces gas costs for compute-intensive operations.

EVM contracts continue to work exactly as before. When a contract is called, the system checks whether it's an EVM contract or a WASM program and routes it to the appropriate runtime. Solidity and WASM contracts can call each other, so the language a contract was written in doesn't affect interoperability.

Proving
Stylus builds on Nitro's fraud-proving technology. In normal operation, execution compiles to native code for speed. But if there's a dispute, the execution history compiles to WASM so validators can run interactive fraud proofs on Ethereum.

What makes Stylus possible: Nitro can already replay and verify disputes using WASM. Stylus extends this capability to verify not just execution history, but also the WASM programs you deploy. The result is a system where any program compiled to WASM can be deterministically fraud-proven. For more details, see the Nitro architecture documentation.

Use cases
Stylus can integrate into existing Solidity projects by calling a Stylus contract to optimize specific parts of your app, or you can build an entire app with Stylus. Developers can also port existing applications written in Rust, C, or C++ to run onchain with minimal modifications. Here are some use cases where Stylus may be a good fit:

Onchain verification with zero-knowledge proofs: Reduce gas costs for onchain verification using zero-knowledge proving systems. See case study for an example implementation.
DeFi instruments: Implement custom pricing curves for AMMs, synthetic assets, options, and futures with onchain computation. You can extend existing protocols (such as Uniswap V4 hooks) or build your own.
Memory and compute-intensive applications: Build onchain games, generative art, or other applications that benefit from reduced memory costs. You can write the entire application in Stylus or optimize specific parts of existing Solidity contracts.
Cryptographic applications: Implement applications that require advanced cryptography or other compute-heavy operations that would be cost-prohibitive in Solidity.
Getting started
Follow the quickstart to deploy your first Stylus contract, and explore the Rust SDK documentation.
Join the Stylus Developer Telegram group and Arbitrum Discord for community support.
Browse the Awesome Stylus repository for community-contributed projects, examples, and tools.
Subscribe to the Stylus Saturdays newsletter for tutorials and technical content.
Edit this page
Last




Quickstart: write a smart contract in Rust using Stylus

This guide will get you started with Stylus' basics. We'll cover the following steps:

Setting up your development environment
Creating a Stylus project with cargo stylus
Checking the validity of your contract
Deploying your contract
Exporting your contract's ABIs
Calling your contract
Sending a transaction to your contract
Setting up your development environment
Prerequisites
Rust toolchain
VS Code
Docker
Foundry's Cast
Nitro devnode
Creating a Stylus project with cargo stylus
cargo stylus is a CLI toolkit built to facilitate the development of Stylus contracts.

It is available as a plugin to the standard cargo tool used for developing Rust programs.

Installing cargo stylus
In your terminal, run:

cargo install --force cargo-stylus

Add WASM (WebAssembly) as a build target for the specific Rust toolchain you are using. The below example sets your default Rust toolchain to 1.81 as well as adding the WASM build target:

rustup default 1.81
rustup target add wasm32-unknown-unknown --toolchain 1.81

You can verify that cargo stylus is installed by running cargo stylus --help in your terminal, which will return a list of helpful commands, we will use some of them in this guide:

cargo stylus --help returns:
Cargo command for developing Stylus projects

Usage: cargo stylus <COMMAND>

Commands:
  new         Create a new Stylus project
  init        Initializes a Stylus project in the current directory
  export-abi  Export a Solidity ABI
  activate    Activate an already deployed contract [aliases: a]
  cache       Cache a contract using the Stylus CacheManager for Arbitrum chains
  check       Check a contract [aliases: c]
  deploy      Deploy a contract [aliases: d]
  verify      Verify the deployment of a Stylus contract [aliases: v]
  cgen        Generate c code bindings for a Stylus contract
  replay      Replay a transaction in gdb [aliases: r]
  trace       Trace a transaction [aliases: t]
  help        Print this message or the help of the given command(s)

Options:
  -h, --help     Print help
  -V, --version  Print version

Creating a project
Let's create our first Stylus project by running:

cargo stylus new <YOUR_PROJECT_NAME>

cargo stylus new generates a starter template that implements a Rust version of the Solidity Counter smart contract example:

// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Counter {

   uint count;

  function setCount() public {
    count = count + 1;
  }

  function getCount() view public returns(uint) {
      return count;
  }
}

At this point, you can move on to the next step of this guide or develop your first Rust smart contract. Feel free to use the Stylus Rust SDK reference section as a starting point; it offers many examples to help you quickly familiarize yourself with Stylus.

Checking if your Stylus project is valid
By running cargo stylus check against your first contract, you can check if your program can be successfully deployed and activated onchain.

Important
Ensure your Docker service runs so this command works correctly.

cargo stylus check

cargo stylus check executes a dry run on your project by compiling your contract to WASM and verifying if it can be deployed and activated onchain.

If the command above fails, you'll see detailed information about why your contract would be rejected:

Reading WASM file at bad-export.wat
Compressed WASM size: 55 B
Stylus checks failed: program pre-deployment check failed when checking against
ARB_WASM_ADDRESS 0x0000…0071: (code: -32000, message: program activation failed: failed to parse program)

Caused by:
    binary exports reserved symbol stylus_ink_left

Location:
    prover/src/binary.rs:493:9, data: None

The contract can fail the check for various reasons (on compile, deployment, etc...). Reading the Invalid Stylus WASM Contracts explainer can help you understand what makes a WASM contract valid or not.

If your contract succeeds, you'll see something like this:

Finished release [optimized] target(s) in 1.88s
Reading WASM file at hello-stylus/target/wasm32-unknown-unknown/release/hello-stylus.wasm
Compressed WASM size: 3 KB
Program succeeded Stylus onchain activation checks with Stylus version: 1

Note that running cargo stylus check may take a few minutes, especially if you're verifying a contract for the first time.

See cargo stylus check --help for more options.

Deploying your contract
Once you're ready to deploy your contract onchain, cargo stylus deploy will help you with the deployment and its gas estimation.

Estimating gas
Note: For every transaction, we'll use the testnode pre-funded wallet, you can use 0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659 as your private key.

You can estimate the gas required to deploy your contract by running:

cargo stylus deploy \
  --endpoint='http://localhost:8547' \
  --private-key="0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659" \
  --estimate-gas

The command should return something like this:

deployment tx gas: 7123737
gas price: "0.100000000" gwei
deployment tx total cost: "0.000712373700000000" ETH

Deployment
Let's move on to the contract's actual deployment. Two transactions will be sent onchain: the contract deployment and its activation.

cargo stylus deploy \
  --endpoint='http://localhost:8547' \
  --private-key="0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659"

Once the deployment and activations are successful, you'll see an output similar to this:

deployed code at address: 0x33f54de59419570a9442e788f5dd5cf635b3c7ac
deployment tx hash: 0xa55efc05c45efc63647dff5cc37ad328a47ba5555009d92ad4e297bf4864de36
wasm already activated!

Make sure to save the contract's deployment address for future interactions!

More options are available for sending and outputting your transaction data. See cargo stylus deploy --help for more details.

Exporting the Solidity ABI interface
The cargo stylus tool makes it easy to export your contract's ABI using cargo stylus export-abi.

This command returns the Solidity ABI interface of your smart contract. If you have been running cargo stylus new without modifying the output, cargo stylus export-abi will return:

/**
 * This file was automatically generated by Stylus and represents a Rust program.
 * For more information, please see [The Stylus SDK](https://github.com/OffchainLabs/stylus-sdk-rs).
 */

// SPDX-License-Identifier: MIT-OR-APACHE-2.0
pragma solidity ^0.8.23;

interface ICounter {
    function number() external view returns (uint256);

    function setNumber(uint256 new_number) external;

    function mulNumber(uint256 new_number) external;

    function addNumber(uint256 new_number) external;

    function increment() external;

    function addFromMsgValue() external payable;
}

Ensure you save the console output to a file that you'll be able to use with your decentralized app.

Interacting with your Stylus contract
Stylus contracts are EVM-compatible, you can interact with them with your tool of choice, such as Hardhat, Foundry's Cast, or any other Ethereum-compatible tool.

In this example, we'll use Foundry's Cast to send a call and then a transaction to our contract.

Calling your contract
Our contract is a counter; in its initial state, it should store a counter value of 0. You can call your contract so it returns its current counter value by sending it the following command:

Call to the function: number()(uint256)
cast call --rpc-url 'http://localhost:8547' --private-key 0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659 \
[deployed-contract-address] "number()(uint256)"

Let's break down the command:

cast call command sends a call to your contract
The --rpc-url option is the RPC URL endpoint of our testnode: http://localhost:8547
The --private-key option is the private key of our pre-funded development account. It corresponds to the address 0x3f1eae7d46d88f08fc2f8ed27fcb2ab183eb2d0e
The [deployed-contract-address] is the address we want to interact with, it's the address that was returned by cargo stylus deploy
number()(uint256) is the function we want to call in Solidity-style signature. The function returns the counter's current value
Calling 'number()(uint256)' returns:
0

The number()(uint256) function returns a value of 0, the contract's initial state.

Sending a transaction to your contract
Let's increment the counter by sending a transaction to your contract's increment() function. We'll use Cast's send command to send our transaction.

Sending a transaction to the function: increment()
cast send --rpc-url 'http://localhost:8547' --private-key 0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659 \
[deployed-contract-address] "increment()"

Transaction returns:
blockHash               0xfaa2cce3b9995f3f2e2a2f192dc50829784da9ca4b7a1ad21665a25b3b161f7c
blockNumber             20
contractAddress
cumulativeGasUsed       97334
effectiveGasPrice       100000000
from                    0x3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E
gasUsed                 97334
logs                    []
logsBloom               0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
root
status                  1 (success)
transactionHash         0x28c6ba8a0b9915ed3acc449cf6c645ecc406a4b19278ec1eb67f5a7091d18f6b
transactionIndex        1
type                    2
blobGasPrice
blobGasUsed
authorizationList
to                      0x11B57FE348584f042E436c6Bf7c3c3deF171de49
gasUsedForL1             "0x0"
l1BlockNumber             "0x1223"


Our transactions returned a status of 1, indicating success, and the counter has been incremented (you can verify this by calling your contract's number()(uint256) function again).

Testing your contract
The Stylus testing framework includes TestVM, a simulation of the Stylus execution environment that enables you to test your contracts without deploying them. Here's a simple example of how to test the counter contract:

#[cfg(test)]
mod test {
    use super::*;
    use alloy_primitives::address;
    use stylus_sdk::testing::*;

    #[test]
    fn test_counter_operations() {
        // Set up test environment
        let vm = TestVM::default();
        // Initialize your contract
        let mut contract = Counter::from(&vm);

        // Test initial state
        assert_eq!(contract.number().unwrap(), U256::ZERO);

        // Test increment
        contract.increment().unwrap();
        assert_eq!(contract.number().unwrap(), U256::from(1));

        // Test set number
        contract.set_number(U256::from(5)).unwrap();
        assert_eq!(contract.number().unwrap(), U256::from(5));
    }
}

To enable testing, you'll need to add the following to your Cargo.toml:

[dev-dependencies]
stylus-sdk = { version = "0.8.4", features = ["stylus-test"] }

Running your tests
You can run your tests using the standard Rust test command:

cargo test

The testing framework allows you to:

Simulate transaction context and block information
Test contract storage operations
Verify state transitions
Mock contract-to-contract interactions
Test various scenarios without deployment costs
For more advanced testing techniques and best practices, see the Testing contracts with Stylus guide.

Conclusion
Congratulations! You've successfully initialized, deployed, and interacted with your first contract using Stylus and Rust.

Feel free to explore the Stylus Rust SDK reference for more information on using Stylus in your Arbitrum projects.








Stylus Rust SDK overview
This section provides an in-depth overview of the features provided by the Stylus Rust SDK. For information about deploying Rust smart contracts, see the cargo stylus CLI Tool. For a conceptual introduction to Stylus, see Stylus: A Gentle Introduction. To deploy your first Stylus smart contract using Rust, refer to the Quickstart.

The Stylus Rust SDK is built on top of Alloy, a collection of crates empowering the Rust Ethereum ecosystem. Because the SDK uses the same Rust primitives for Ethereum types, Stylus is compatible with existing Rust libraries.

The Stylus Rust SDK has been audited in August 2024 at commit #62bd831 by Open Zeppelin which can be viewed on our audits page.

This section contains a set of pages that describe a certain aspect of the Stylus Rust SDK, like how to work with variables, or what ways are there to send ether. Additionally, there's also a page that compiles a set of advanced features that the Stylus Rust SDK provides.

Finally, there's also a Stylus by example portal available that provides most of the information included in this section, as well as many different example contracts.






Structure of a Rust Contract
Contracts in Rust are similar to contracts in Solidity. Each contract can contain declarations of State Variables, Functions, Function Modifiers, Events, Errors, Struct Types, and Enum Types. In addition, Rust contracts can import third-party packages from crates.io as dependencies and use them for advanced functionality.

Project layout
In the most basic example, this is how a Rust contract will be organized. The simplest way to get going with a new project is to follow the Quickstart guide, or if you've already installed all dependencies, just run cargo stylus new <YOUR_PROJECT_NAME> from your terminal to begin a new project. Once installed, your project will include the following required files:

- src
    - lib.rs
    - main.rs
- Cargo.toml
- rust-toolchain.toml

src/lib.rs is the root module of your contract's code. Here, you can import utilities or methods from internal or external modules, define the data layout of your contract's state variables, and define your contract's public API. This module must define a root data struct with the #[entrypoint] macro and provide an impl block annotated with #[public] to define public or external methods. See First App for an example of this. These macros are used to maintain Solidity ABI compatibility to ensure that Rust contracts work with existing Solidity libraries and tooling.

src/main.rs is typically auto-generated by cargo-stylus and does not usually need to be modified. Its purpose is to assist with the generation of JSON describing your contract's public interface, for use with automated tooling and frontend frameworks.

Cargo.toml is a standard file that Rust projects use to define a package's name, repository location, etc, as well as import dependencies and define feature and build flags. From here, you can define required dependencies such as the Stylus SDK itself or import third-party packages from crates.io. See First Steps with Cargo if you are new to Rust.

rust-toolchain.toml is used by public blockchain explorers, like Arbiscan, to assist with source code verification. To ensure that source code can be compiled deterministically, we use this file to include relevant metadata like what version of Rust was used. It can also be used to pin the project to a specific Rust version that it's compatible with.

Your contract may also include other dot files (such as .gitignore, .env, etc), markdown files for docs, or additional subfolders.

State variables
Like Solidity, Rust contracts are able to define state variables. These are variables which are stored on the chain's state trie, which is essentially the chain's database. They differ from standard Rust variables in that they must implement the Storage trait from the Stylus SDK. This trait is used to layout the data in the trie in a Solidity-compatible fashion. The Stylus SDK provides Storage types for all Solidity primitives out-of-the-box, such as StorageAddress, StorageU256, etc. See storage module for more information.

When working with state variables, you can either use Rust-style syntax or Solidity-style syntax to define your data schema. The #[storage] macro is used to define Rust-style state variables while sol_storage! macro is used for Solidity-style state variables. Both styles may have more than one struct but must annotate a single struct as the root struct with #[entrypoint] macro. Below are examples of each.

Rust-style Schema

use stylus_sdk::{prelude::*, storage::{StorageU256, StorageAddress}};

#[storage]
#[entrypoint]
pub struct MyContract {
    owner: StorageAddress,
    version: StorageU256,
}

Solidity-style Schema

use stylus_sdk::{prelude::*};

sol_storage! {
    #[entrypoint]
    pub struct MyContract {
        address owner;
        version: uint256,
    }
}

To read from state or write to it, getters and setters are used:

let new_count = self.count.get() + U256::from(1);
self.count.set(new_count);

See Storage Data Types for more examples of this.

Functions
Contract functions are defined by providing an impl block for your contract's #[entrypoint] struct and annotating that block with #[public] to make the functions part of the contract's public API. The first parameter of each function is &self, which references the struct annotated with #[entrypoint], it's used for reading state variables. By default, methods are view-only and cannot mutate state. To make a function mutable and able to alter state, &mut self must be used. Internal methods can be defined on a separate impl block for the struct that is not annotated with #[public]. Internal methods can access state.

// Defines the public, external methods for your contract
// This impl block must be for the #[entrypoint] struct defined prior
#[public]
impl Counter {
    // By annotating first arg with &self, this indicates a view function
    pub fn get(&self) -> U256 {
        self.count.get()
    }

    // By annotating with &mut self, this is a mutable public function
    pub fn set_count(&mut self, count: U256) {
        self.count.set(count);
    }
}

// Internal methods (NOT part of public API)
impl Counter {
    fn add(a: U256, b: U256) -> U256 {
        a + b
    }
}

Modules
Modules are a way to organize code into logical units. While your contract must have a lib.rs which defines your entrypoint struct, you can also define utility functions, structs, enums, etc., in modules and import them to use in your contract's methods.

For example, with this file structure:

- src
    - lib.rs
    - main.rs
- utils
    - mod.rs
- Cargo.toml
- rust-toolchain.toml

In lib.rs:

// import module
mod utils;

// ..other code
const score = utils::check_score();

See Defining modules in the Rust book for more info on modules and how to use them.

Importing packages
Rust has a robust package manager for managing dependencies and importing third-party libraries to use in your smart contracts. These packages (called crates in Rust) are located at crates.io. To make use of a dependency in your code, you'll need to complete these steps:

Add the package name and version to your Cargo.toml:

# Cargo.toml
[package]
# ...package info here

[dependencies]
rust_decimal = "1.36.0"

Import the package into your contract:

// lib.rs
use rust_decimal_macros::dec;

Use imported types in your contract:

// create a fixed point Decimal value
let price = dec!(72.00);

Note, not all Rust crates are compatible with Stylus since they need to be compiled to WASM and used in a blockchain context, which is more limited than a desktop application. For instance, the rand crate is not usable, as there is no onchain randomness available to smart contracts. In addition, contracts cannot access functions that use networking or filesystem access features. There is also a need to be mindful of the size of the crates you import, since the default contract size limit is 24KB (compressed). Crates that do not use the standard library (no_std crates) tend to work best. See Using public Rust crates for more important details on using public Rust crates as well as a curated list of crates that tend to work well for smart contract development.

Events
Events are used to publicly log values to the EVM. They can be useful for users to understand what occurred during a transaction while inspecting a transaction on a public explorer, like Arbiscan.

sol! {
    event HighestBidIncreased(address bidder, uint256 amount);
}

#[public]
impl AuctionContract {
    pub fn bid() {
        // ...
        evm::log(HighestBidIncreased {
            bidder: Address::from([0x11; 20]),
            amount: U256::from(42),
        });
    }
}

Errors
Errors allow you to define descriptive names for failure situations. These can be useful for debugging or providing users with helpful information for why a transaction may have failed.

sol! {
    error NotEnoughFunds(uint256 request, uint256 available);
}

#[derive(SolidityError)]
pub enum TokenErrors {
    NotEnoughFunds(NotEnoughFunds),
}

#[public]
impl Token {
    pub fn transfer(&mut self, to: Address, amount: U256) -> Result<(), TokenErrors> {
        const balance = self.balances.get(msg::sender());
        if (balance < amount) {
            return Err(TokenErrors::NotEnoughFunds(NotEnoughFunds {
                request: amount,
                available: balance,
            }));
        }
        // .. other code here
    }
}





Hello World
Using the console! macro from the stylus_sdk allows you to print output to the terminal for debugging purposes. To view the output, you'll need to run a local Stylus dev node as described in the Arbitrum docs and set the debug feature flag as shown in line 7 of the Cargo.toml file below.

The console! macro works similar to the built-in println! macro that comes with Rust.

Examples
note
This code has yet to be audited. Please use at your own risk.

// Out: Stylus says: 'hello there!'
console!("hello there!");
// Out: Stylus says: 'format some arguments'
console!("format {} arguments", "some");

let local_variable = "Stylus";
// Out: Stylus says: 'Stylus is awesome!'
console!("{local_variable} is awesome!");
// Out: Stylus says: 'When will you try out Stylus?'
console!("When will you try out {}?", local_variable);

src/main.rs
#![cfg_attr(not(feature = "export-abi"), no_main)]

extern crate alloc;


use stylus_sdk::{console, prelude::*, stylus_proc::entrypoint, ArbResult};

#[storage]
#[entrypoint]
pub struct Hello;


#[public]
impl Hello {
    fn user_main(_input: Vec<u8>) -> ArbResult {
        // Will print 'Stylus says: Hello Stylus!' on your local dev node
        // Be sure to add "debug" feature flag to your Cargo.toml file as
        // shown below.
        console!("Hello Stylus!");
        Ok(Vec::new())
    }
}

Cargo.toml
[package]
name = "stylus_hello_world"
version = "0.1.7"
edition = "2021"
license = "MIT OR Apache-2.0"
keywords = ["arbitrum", "ethereum", "stylus", "alloy"]

[dependencies]
alloy-primitives = "=0.7.6"
alloy-sol-types = "=0.7.6"
mini-alloc = "0.4.2"
stylus-sdk = { version = "0.6.0", features = ["debug"] }
hex = "0.4.3"
sha3 = "0.10"

[dev-dependencies]
tokio = { version = "1.12.0", features = ["full"] }
ethers = "2.0"
eyre = "0.6.8"

[features]
export-abi = ["stylus-sdk/export-abi"]

[lib]
crate-type = ["lib", "cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"








Primitive Data Types
The Stylus SDK makes use of the popular Alloy library (from the developers of ethers-rs and Foundry) to represent various native Solidity types as Rust types and to seamlessly convert between them when needed. These are needed since there are a number of custom types (like address) and large integers that are not natively supported in Rust.

In this section, we'll focus on the following types:

U256
I256
Address
Boolean
Bytes
More in-depth documentation about the available methods and types in the Alloy library can be found in their docs. It also helps to cross-reference with Solidity docs if you don't already have a solid understanding of those types.

Learn More
Alloy docs (v0.7.6)
Address
Signed
Uint
Stylus Rust SDK
Bytes
Solidity docs (v0.8.19)
Integers
Alloy defines a set of convenient Rust types to represent the typically sized integers used in Solidity. The type U256 represents a 256-bit unsigned integer, meaning it cannot be negative. The range for a U256 number is 0 to 2^256 - 1.

Negative numbers are allowed for I types, such as I256. These represent signed integers.

U256 maps to uint256 ... I256 maps to int256
U128 maps to uint128 ... I128 maps to int128
...
U8 maps to uint8 ... I8 maps to int8
Integer Usage
note
This code has yet to be audited. Please use at your own risk.

// Unsigned
let eight_bit: U8 = U8::from(1);
let two_fifty_six_bit: U256 = U256::from(0xff_u64);

// Out: Stylus says: '8-bit: 1 | 256-bit: 255'
console!("8-bit: {} | 256-bit: {}", eight_bit, two_fifty_six_bit);

// Signed
let eight_bit: I8 = I8::unchecked_from(-1);
let two_fifty_six_bit: I256 = I256::unchecked_from(0xff_u64);

// Out: Stylus says: '8-bit: -1 | 256-bit: 255'
console!("8-bit: {} | 256-bit: {}", eight_bit, two_fifty_six_bit);

Expanded Integer Usage
// Use `try_from` if you're not sure it'll fit
let a = I256::try_from(20003000).unwrap();
// Or parse from a string
let b = "100".parse::<I256>().unwrap();
// With hex characters
let c = "-0x138f".parse::<I256>().unwrap();
// Underscores are ignored
let d = "1_000_000".parse::<I256>().unwrap();

// Math works great
let e = a * b + c - d;
// Out: Stylus says: '20003000 * 100 + -5007 - 1000000 = 1999294993'
console!("{} * {} + {} - {} = {}", a, b, c, d, e);

// Useful constants
let f = I256::MAX;
let g = I256::MIN;
let h = I256::ZERO;
let i = I256::MINUS_ONE;

// Stylus says: '5789...9967, -5789...9968, 0, -1'
console!("{f}, {g}, {h}, {i}");
// As hex: Stylus says: '0x7fff...ffff, 0x8000...0000, 0x0, 0xffff...ffff'
console!("{:#x}, {:#x}, {:#x}, {:#x}", f, g, h, i);

Address
Ethereum addresses are 20 bytes in length, or 160 bits. Alloy provides a number of helper utilities for converting to addresses from strings, bytes, numbers, and addresses.

Address Usage
// From a 20 byte slice, all 1s
let addr1 = Address::from([0x11; 20]);
// Out: Stylus says: '0x1111111111111111111111111111111111111111'
console!("{addr1}");

// Use the address! macro to parse a string as a checksummed address
let addr2 = address!("d8da6bf26964af9d7eed9e03e53415d37aa96045");
// Out: Stylus says: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
console!("{addr2}");

// Format compressed addresses for output
// Out: Stylus says: '0xd8dA…6045'
console!("{addr2:#}");

Boolean
Use native Rust primitives where it makes sense and where no equivalent Alloy primitive exists.

Boolean Usage
let frightened: bool = true;
// Out: Stylus says: 'Boo! Did I scare you?'
console!("Boo! Did I scare you?");

let response = match frightened {
    true => "Yes!".to_string(),
    false => "No!".to_string(),
};

// Out: Stylus says: 'Yes!'
console!("{response}");

Bytes
The Stylus SDK provides this wrapper type around Vec<u8> to represent a bytes value in Solidity.

let vec = vec![108, 27, 56, 87];
let b = Bytes::from(vec);
// Out: Stylus says: '0x6c1b3857'
console!(String::from_utf8_lossy(b.as_slice()));

let b = Bytes::from(b"Hello!".to_vec());
// Out: Stylus says: 'Hello!'
console!(String::from_utf8_lossy(b.as_slice()));

Note: Return the Bytes type on your Rust function if you want to return the ABI bytes memory type.

Boilerplate
src/lib.rs
#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;
use alloc::{string::ToString, vec::Vec};

use stylus_sdk::{
    alloy_primitives::{address, Address, I256, I8, U256, U8}, console, prelude::*, ArbResult
};

#[storage]
#[entrypoint]
pub struct Data {
    
}


#[public]
impl Data {
fn user_main(_input: Vec<u8>) -> ArbResult {
    // Use native Rust primitives where they make sense
    // and where no equivalent Alloy primitive exists
    let frightened: bool = true;
    // Out: Stylus says: 'Boo! Did I scare you?'
    console!("Boo! Did I scare you?");

    let _response = match frightened {
        true => "Yes!".to_string(),
        false => "No!".to_string(),
    };

    // Out: Stylus says: 'Yes!'
    console!("{_response}");

    // U256 stands for a 256-bit *unsigned* integer, meaning it cannot be
    // negative. The range for a U256 number is 0 to 2^256 - 1. Alloy provides
    // a set of unsigned integer types to represent the various sizes available
    // in the EVM.
    //    U256 maps to uint256
    //    U128 maps to uint128
    //    ...
    //    U8 maps to uint8
    let _eight_bit: U8 = U8::from(1);
    let _two_fifty_six_bit: U256 = U256::from(0xff_u64);

    // Out: Stylus says: '8-bit: 1 | 256-bit: 255'
    console!("8-bit: {} | 256-bit: {}", _eight_bit, _two_fifty_six_bit);

    // Negative numbers are allowed for I types. These represent signed integers.
    //    I256 maps to int256
    //    I128 maps to int128
    //    ...
    //    I8 maps to int8
    let _eight_bit: I8 = I8::unchecked_from(-1);
    let _two_fifty_six_bit: I256 = I256::unchecked_from(0xff_u64);

    // Out: Stylus says: '8-bit: -1 | 256-bit: 255'
    console!("8-bit: {} | 256-bit: {}", _eight_bit, _two_fifty_six_bit);

    // Additional usage of integers

    // Use `try_from` if you're not sure it'll fit
    let a = I256::try_from(20003000).unwrap();
    // Or parse from a string
    let b = "100".parse::<I256>().unwrap();
    // With hex characters
    let c = "-0x138f".parse::<I256>().unwrap();
    // Underscores are ignored
    let d = "1_000_000".parse::<I256>().unwrap();

    // Math works great
    let _e = a * b + c - d;
    // Out: Stylus says: '20003000 * 100 + -5007 - 1000000 = 1999294993'
    console!("{} * {} + {} - {} = {}", a, b, c, d, _e);

    // Useful constants
    let _f = I256::MAX;
    let _g = I256::MIN;
    let _h = I256::ZERO;
    let _i = I256::MINUS_ONE;

    // Stylus says: '5789...9967, -5789...9968, 0, -1'
    console!("{_f}, {_g}, {_h}, {_i}");
    // As hex: Stylus says: '0x7fff...ffff, 0x8000...0000, 0x0, 0xffff...ffff'
    console!("{:#x}, {:#x}, {:#x}, {:#x}", _f, _g, _h, _i);

    // Ethereum addresses are 20 bytes in length, or 160 bits. Alloy provides a number of helper utilities for converting to addresses from strings, bytes, numbers, and addresses

    // From a 20 byte slice, all 1s
    let _addr1 = Address::from([0x11; 20]);
    // Out: Stylus says: '0x1111111111111111111111111111111111111111'
    console!("{_addr1}");

    // Use the address! macro to parse a string as a checksummed address
    let _addr2 = address!("d8da6bf26964af9d7eed9e03e53415d37aa96045");
    // Out: Stylus says: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    console!("{_addr2}");

    // Format compressed addresses for output
    // Out: Stylus says: '0xd8dA…6045'
    console!("{_addr2:#}");

    Ok(Vec::new())
}
}


Cargo.toml
[package]
name = "stylus_data_example"
version = "0.1.7"
edition = "2021"
license = "MIT OR Apache-2.0"
keywords = ["arbitrum", "ethereum", "stylus", "alloy"]

[dependencies]
alloy-primitives = "=0.7.6"
alloy-sol-types = "=0.7.6"
mini-alloc = "0.4.2"
stylus-sdk = "0.6.0"
hex = "0.4.3"

[dev-dependencies]
tokio = { version = "1.12.0", features = ["full"] }
ethers = "2.0"
eyre = "0.6.8"

[features]
export-abi = ["stylus-sdk/export-abi"]

[lib]
crate-type = ["lib", "cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"






Variables
In Solidity, there are 3 types of variables: local, state, and global. Local variables are not stored on the blockchain, while state variables are (and incur a much higher cost as a result). This is true of Arbitrum Stylus Rust smart contracts as well, although how they're defined is quite different.

In Rust, local variables are just ordinary variables you assign with let or let mut statements. Local variables are far cheaper than state variables, even on the EVM, however, Stylus local variables are more than 100x cheaper to allocate in memory than their Solidity equivalents.

Unlike Solidity, Rust was not built inherently with the blockchain in mind. It is a general purpose programming language. We therefore define specific storage types to explicitly denote values intended to be stored permanently as part of the contract's state. State variables cost the same to store as their Solidity equivalents.

Global variables in Solidity, such as msg.sender and block.timestamp, are available as function calls pulled in from the stylus_sdk with their Rust equivalents being msg::sender() and block::timestamp(), respectively. These variables provide information about the blockchain or the active transaction.

Learn more
Rust Docs - Variables and Mutability
Stylus SDK Rust Docs - Storage
Stylus SDK Guide - Storage
Solidity docs - state variables
Solidity docs - global variables
src/lib.rs
note
This code has yet to be audited. Please use at your own risk.

// Only run this as a WASM if the export-abi feature is not set.
#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;

use stylus_sdk::alloy_primitives::{U16, U256};
use stylus_sdk::prelude::*;
use stylus_sdk::storage::{StorageAddress, StorageBool, StorageU256};
use stylus_sdk::{block, console, msg};

#[storage]
#[entrypoint]
pub struct Contract {
    initialized: StorageBool,
    owner: StorageAddress,
    max_supply: StorageU256,
}

#[public]
impl Contract {
    // State variables are initialized in an `init` function.
    pub fn init(&mut self) -> Result<(), Vec<u8>> {
        // We check if contract has been initialized before.
        // We return if so, we initialize if not.
        let initialized = self.initialized.get();
        if initialized {
            return Ok(());
        }
        self.initialized.set(true);

        // We set the contract owner to the caller,
        // which we get from the global msg module
        self.owner.set(msg::sender());
        self.max_supply.set(U256::from(10_000));

        Ok(())
    }

    pub fn do_something() -> Result<(), Vec<u8>> {
        // Local variables are not saved to the blockchain
        // 16-bit Rust integer
        let _i = 456_u16;
        // 16-bit int inferred from U16 Alloy primitive
        let _j = U16::from(123);

        // Here are some global variables
        let _timestamp = block::timestamp();
        let _amount = msg::value();

        console!("Local variables: {_i}, {_j}");
        console!("Global variables: {_timestamp}, {_amount}");

        Ok(())
    }
}


Cargo.toml
[package]
name = "stylus_variable_example"
version = "0.1.7"
edition = "2021"
license = "MIT OR Apache-2.0"
keywords = ["arbitrum", "ethereum", "stylus", "alloy"]

[dependencies]
alloy-primitives = "=0.7.6"
alloy-sol-types = "=0.7.6"
mini-alloc = "0.4.2"
stylus-sdk = "0.6.0"
hex = "0.4.3"

[dev-dependencies]
tokio = { version = "1.12.0", features = ["full"] }
ethers = "2.0"
eyre = "0.6.8"

[features]
export-abi = ["stylus-sdk/export-abi"]

[lib]
crate-type = ["lib", "cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"




Constants
Constants are values that are bound to a name and cannot change. They are always immutable. In Rust, constants are declared with the const keyword. Unlike variables declared with the let keyword, constants must be annotated with their type.

Constants are valid for the entire length of the transaction. They are essentially inlined wherever they are used, meaning that their value is copied directly into whatever context invokes them.

Since their value is hardcoded, they can save on gas cost as their value does not need to be fetched from storage.

Learn More
Rust docs - Constant items
Solidity docs - Constant variables
src/lib.rs
note
This code has yet to be audited. Please use at your own risk.

// Only run this as a WASM if the export-abi feature is not set.
#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;

use alloc::vec;
use alloc::vec::Vec;

use stylus_sdk::alloy_primitives::Address;
use stylus_sdk::prelude::*;
use stylus_sdk::storage::StorageAddress;

const OWNER: &str = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

#[storage]
#[entrypoint]
pub struct Contract {
    owner: StorageAddress,
}

#[public]
impl Contract {
    pub fn init(&mut self) -> Result<(), Vec<u8>> {
        // Parse the const &str as a local Address variable
        let owner_address = Address::parse_checksummed(OWNER, None).expect("Invalid address");

        // Save the result as the owner
        self.owner.set(owner_address);

        Ok(())
    }
    pub fn owner(&self) -> Result<Address, Vec<u8>> {
        let owner_address = self.owner.get();

        Ok(owner_address)
    }
}


Cargo.toml
[package]
name = "stylus_constants_example"
version = "0.1.7"
edition = "2021"
license = "MIT OR Apache-2.0"
keywords = ["arbitrum", "ethereum", "stylus", "alloy"]

[dependencies]
alloy-primitives = "=0.7.6"
alloy-sol-types = "=0.7.6"
mini-alloc = "0.4.2"
stylus-sdk = "0.6.0"
hex = "0.4.3"

[dev-dependencies]
tokio = { version = "1.12.0", features = ["full"] }
ethers = "2.0"
eyre = "0.6.8"

[features]
export-abi = ["stylus-sdk/export-abi"]

[lib]
crate-type = ["lib", "cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"






Functions
Functions are a fundamental part of any programming language, including Stylus, enabling you to encapsulate logic into reusable components.

This guide covers the syntax and usage of functions, including internal and external functions, and how to return multiple values.

Learn More
Rust docs - Functions
Solidity docs - Functions
Overview
A function in Stylus consists of a name, a set of parameters, an optional return type, and a body.

Just as with storage, Stylus methods are Solidity ABI equivalent. This means that contracts written in different programming languages are fully interoperable.

Functions are declared with the fn keyword. Parameters allow the function to accept inputs, and the return type specifies the output of the function. If no return type is specified, the function returns void.

Following is an example of a function add that takes two uint256 values and returns their sum.

note
This code has yet to be audited. Please use at your own risk.

fn add(a: uint256, b: uint256) -> uint256 {
    return a + b;
}

Function Parameters
Function parameters are the inputs to a function. They are specified as a list of IDENTIFIER: Type pairs, separated by commas.

In this example, the function add_numbers takes two u32 parameters, a and b and returns the sum of the two numbers.

fn add_numbers(a: u32, b: u32) -> u32 {
    a + b
}

Return Types
Return types in functions are an essential part of defining the behavior and expected outcomes of your smart contract methods.

Here, we explain the syntax and usage of return types in Stylus with general examples.

Basic Syntax
A function with a return type in Stylus follows this basic structure. The return type is specified after the -> arrow. Values are returned using the return keyword or implicitly as the last expression of the function. In Rust and Stylus, the last expression in a function is implicitly returned, so the return keyword is often omitted.

pub fn function_name(&self) -> ReturnType {
    // Function body
}

Examples
Function returning a String: This get_greeting function returns a String. The return type is specified as String after the -> arrow.

pub fn get_greeting() -> String {
    "Hello, Stylus!".into()
}

Function returning an Integer: This get_number function returns an unsigned 32-bit integer (u32).

pub fn get_number() -> u32 {
    42
}

Function returning a Result with Ok and Err variants: The perform_operation function returns a Result<u32, CustomError>. The Result type is used for functions that can return either a success value (Ok) or an error (Err). In this case, it returns Ok(value) on success and an error variant of CustomError on failure.

pub enum CustomError {
    ErrorVariant,
}

pub fn perform_operation(value: u32) -> Result<u32, CustomError> {
    if value > 0 {
        Ok(value)
    } else {
        Err(CustomError::ErrorVariant)
    }
}

Public Functions
Public functions are those that can be called by other contracts.

To define a public function in a Stylus contract, you use the #[public] macro. This macro ensures that the function is accessible from outside the contract.

Previously, all public methods were required to return a Result type with Vec<u8> as the error type. This is now optional. Specifically, if a method is "infallible" (i.e., it cannot produce an error), it does not need to return a Result type. Here's what this means:

Infallible methods: Methods that are guaranteed not to fail (no errors possible) do not need to use the Result type. They can return their result directly without wrapping it in Result.

Optional error handling: The Result type with Vec<u8> as the error type is now optional for methods that cannot produce an error.

In the following example, owner is a public function that returns the contract owner's address. Since this function is infallible (i.e., it cannot produce an error), it does not need to return a Result type.

#[external]
impl Contract {
    // Define an external function to get the owner of the contract
    pub fn owner(&self) -> Address {
        self.owner.get()
    }
}

Internal Functions
Internal functions are those that can only be called within the contract itself. These functions are not exposed to external calls.

To define an internal function, you simply include it within your contract's implementation without the #[public] macro.

The choice between public and internal functions depends on the desired level of accessibility and interaction within and across contracts.

In the followinge example, set_owner is an internal function that sets a new owner for the contract. It is only callable within the contract itself.

impl Contract {
    // Define an internal function to set a new owner
    pub fn set_owner(&mut self, new_owner: Address) {
        self.owner.set(new_owner);
    }
}

To mix public and internal functions within the same contract, you should use two separate impl blocks with the same contract name. Public functions are defined within an impl block annotated with the #[public] attribute, signifying that these functions are part of the contract's public interface and can be invoked from outside the contract. In contrast, internal functions are placed within a separate impl block that does not have the #[public] attribute, making them internal to the contract and inaccessible to external entities.

src/lib.rs
// Only run this as a WASM if the export-abi feature is not set.
#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;

use alloc::vec;
use stylus_sdk::alloy_primitives::Address;
use stylus_sdk::prelude::*;
use stylus_sdk::storage::StorageAddress;

use stylus_sdk::alloy_primitives::U256;
use stylus_sdk::storage::StorageU256;
use stylus_sdk::console;


#[storage]
#[entrypoint]
pub struct ExampleContract {
    owner: StorageAddress,
    data: StorageU256,
}

#[public]
impl ExampleContract {
    // External function to set the data
    pub fn set_data(&mut self, value: U256) {
        self.data.set(value);
    }

    // External function to get the data
    pub fn get_data(&self) -> U256 {
        self.data.get()
    }

    // External function to get the contract owner
    pub fn get_owner(&self) -> Address {
        self.owner.get()
    }
}

impl ExampleContract {
    // Internal function to set a new owner
    pub fn set_owner(&mut self, new_owner: Address) {
        self.owner.set(new_owner);
    }

    // Internal function to log data
    pub fn log_data(&self) {
        let _data = self.data.get();
        console!("Current data is: {:?}", _data);
    }
}

Cargo.toml
[package]
name = "stylus-functions"
version = "0.1.0"
edition = "2021"

[dependencies]
alloy-primitives = "=0.7.6"
alloy-sol-types = "=0.7.6"
mini-alloc = "0.4.2"
stylus-sdk = "0.6.0"
hex = "0.4.3"
sha3 = "0.10.8"

[features]
export-abi = ["stylus-sdk/export-abi"]
debug = ["stylus-sdk/debug"]

[lib]
crate-type = ["lib", "cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"






Errors
In Rust Stylus contracts, error handling is a crucial aspect of writing robust and reliable smart contracts. Rust differentiates between recoverable and unrecoverable errors. Recoverable errors are represented using the Result type, which can either be Ok, indicating success, or Err, indicating failure. This allows developers to manage errors gracefully and maintain control over the flow of execution. Unrecoverable errors are handled with the panic! macro, which stops execution, unwinds the stack, and returns a dataless error.

In Stylus contracts, error types are often explicitly defined, providing clear and structured ways to handle different failure scenarios. This structured approach promotes better error management, ensuring that contracts are secure, maintainable, and behave predictably under various conditions. Similar to Solidity and EVM, errors in Stylus will undo all changes made to the state during a transaction by reverting the transaction. Thus, there are two main types of errors in Rust Stylus contracts:

Recoverable Errors: The Stylus SDK provides features that make using recoverable errors in Rust Stylus contracts convenient. This type of error handling is strongly recommended for Stylus contracts.
Unrecoverable Errors: These can be defined similarly to Rust code but are not recommended for smart contracts if recoverable errors can be used instead.
Learn More
Solidity docs: Expressions and Control Structures
#[derive(SolidityError)]
alloy_sol_types::SolError
Error handling: Rust book
Recoverable Errors
Recoverable errors are represented using the Result type, which can either be Ok, indicating success, or Err, indicating failure. The Stylus SDK provides tools to define custom error types and manage recoverable errors effectively.

Example: Recoverable Errors
Here's a simplified Rust Stylus contract demonstrating how to define and handle recoverable errors:

note
This code has yet to be audited. Please use at your own risk.

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;


use alloy_sol_types::sol;
use stylus_sdk::{abi::Bytes, alloy_primitives::{Address, U256}, call::RawCall, prelude::*};

#[storage]
#[entrypoint]
pub struct MultiCall;

// Declare events and Solidity error types
sol! {
    error ArraySizeNotMatch();
    error CallFailed(uint256 call_index);
}

#[derive(SolidityError)]
pub enum MultiCallErrors {
    ArraySizeNotMatch(ArraySizeNotMatch),
    CallFailed(CallFailed),
}

#[public]
impl MultiCall {
    pub fn multicall(
        &self,
        addresses: Vec<Address>,
        data: Vec<Bytes>,
    ) -> Result<Vec<Bytes>, MultiCallErrors> {
        let addr_len = addresses.len();
        let data_len = data.len();
        let mut results: Vec<Bytes> = Vec::new();
        if addr_len != data_len {
            return Err(MultiCallErrors::ArraySizeNotMatch(ArraySizeNotMatch {}));
        }
        for i in 0..addr_len {
            let result: Result<Vec<u8>, Vec<u8>> =
                RawCall::new().call(addresses[i], data[i].to_vec().as_slice());
            let data = match result {
                Ok(data) => data,
                Err(_data) => return Err(MultiCallErrors::CallFailed(CallFailed { call_index: U256::from(i) })),
            };
            results.push(data.into())
        }
        Ok(results)
    }
}

Using SolidityError Derive Macro: The #[derive(SolidityError)] attribute is used for the MultiCallErrors enum, automatically implementing the necessary traits for error handling.
Defining Errors: Custom errors ArraySizeNotMatch and CallFailed is declared in MultiCallErrors enum. CallFailed error includes a call_index parameter to indicate which call failed.
ArraySizeNotMatch Error Handling: The multicall function returns ArraySizeNotMatch if the size of addresses and data vectors are not equal.
CallFailed Error Handling: The multicall function returns a CallFailed error with the index of the failed call if any call fails. Note that we're using match to check if the result of the call is an error or a return data. We'll describe match pattern in the further sections.
Unrecoverable Errors
Here are various ways to handle such errors in the multicall function, which calls multiple addresses and panics in different scenarios:

Using panic!
Directly panics if the call fails, including the index of the failed call.

        for i in 0..addr_len {
            let result = RawCall::new().call(addresses[i], data[i].to_vec().as_slice());
            let data = match result {
                Ok(data) => data,
                Err(_data) => panic!("Call to address {:?} failed at index {}", addresses[i], i),
            };
            results.push(data.into());
}

Handling Call Failure with panic!: The function panics if any call fails and the transaction will be reverted without any data.

Using unwrap
Uses unwrap to handle the result, panicking if the call fails.

        for i in 0..addr_len {
            let result = RawCall::new().call(addresses[i], data[i].to_vec().as_slice()).unwrap();
            results.push(result.into());
}

Handling Call Failure with unwrap: The function uses unwrap to panic if any call fails, including the index of the failed call.

Using match
Uses a match statement to handle the result of call, panicking if the call fails.

        for i in 0..addr_len {
            let result = RawCall::new().call(addresses[i], data[i].to_vec().as_slice());
            let data = match result {
                Ok(data) => data,
                Err(_data) => return Err(MultiCallErrors::CallFailed(CallFailed { call_index: U256::from(i) })),
            };
            results.push(data.into());
}

Handling Call Failure with match: The function uses a match statement to handle the result of call, returning error if any call fails.

Using the ? Operator
Uses the ? operator to propagate the error if the call fails, including the index of the failed call.

        for i in 0..addr_len {
            let result = RawCall::new().call(addresses[i], data[i].to_vec().as_slice())
                .map_err(|_| MultiCallErrors::CallFailed(CallFailed { call_index: U256::from(i) }))?;
            results.push(result.into());
}

Handling Call Failure with ? Operator: The function uses the ? operator to propagate the error if any call fails, including the index of the failed call.

Each method demonstrates a different way to handle unrecoverable errors in the multicall function of a Rust Stylus contract, providing a comprehensive approach to error management.

Note that as mentioned above, it is strongly recommended to use custom error handling instead of unrecoverable error handling.

Boilerplate
src/lib.rs
The lib.rs code can be found at the top of the page in the recoverable error example section.

Cargo.toml
[package]
name = "stylus-multicall-contract"
version = "0.1.7"
edition = "2021"

[dependencies]
alloy-primitives = "=0.7.6"
alloy-sol-types = "=0.7.6"
stylus-sdk = "0.6.0"
hex = "0.4.3"

[dev-dependencies]
tokio = { version = "1.12.0", features = ["full"] }
ethers = "2.0"
eyre = "0.6.8"

[features]
export-abi = ["stylus-sdk/export-abi"]

[[bin]]
name = "stylus-multicall-contract"
path = "src/main.rs"

[lib]
crate-type = ["lib", "cdylib"]

|




Events
Events allow for data to be logged publicly to the blockchain. Log entries provide the contract's address, a series of up to four topics, and some arbitrary length binary data. The Stylus Rust SDK provides a few ways to publish event logs described below.

Learn More
Solidity docs: Events
stylus_sdk::evm::log
alloy_sol_types::SolEvent
Log
Using the evm::log function in the Stylus SDK is the preferred way to log events. It ensures that an event will be logged in a Solidity ABI-compatible format. The log function takes any type that implements Alloy SolEvent trait. It's not recommended to attempt to implement this trait on your own. Instead, make use of the provided sol! macro to declare your Events and their schema using Solidity-style syntax to declare the parameter types. Alloy will create ABI-compatible Rust types which you can instantiate and pass to the evm::log function.

Log Usage
note
This code has yet to be audited. Please use at your own risk.

// sol! macro event declaration
// Up to 3 parameters can be indexed.
// Indexed parameters helps you filter the logs efficiently
sol! {
    event Log(address indexed sender, string message);
    event AnotherLog();
}

#[storage]
#[entrypoint]
pub struct Events {}

#[public]
impl Events {
fn user_main(_input: Vec<u8>) -> ArbResult {
    // emits a 'Log' event, defined above in the sol! macro
    evm::log(Log {
        sender: Address::from([0x11; 20]),
        message: "Hello world!".to_string(),
    });

    // no data, but 'AnotherLog' event will still emit to the chain
    evm::log(AnotherLog {});

    Ok(vec![])
}
}

Raw Log
The evm::raw_log affordance offers the ability to send anonymous events that do not necessarily conform to the Solidity ABI. Instead, up to four raw 32-byte indexed topics are published along with any arbitrary bytes appended as data.

NOTE: It's still possible to achieve Solidity ABI compatibility using this construct. To do so you'll have to manually compute the ABI signature for the event, following the equation set in the Solidity docs. The result of that should be assigned to TOPIC_0, the first topic in the slice passed to raw_log.

Raw Log Usage
// set up local variables
let user = Address::from([0x22; 20]);
let balance = U256::from(10_000_000);

// declare up to 4 topics
// topics must be of type FixedBytes<32>
let topics = &[user.into_word()];

// store non-indexed data in a byte Vec
let mut data: Vec<u8> = vec![];
// to_be_bytes means 'to big endian bytes'
data.extend_from_slice(balance.to_be_bytes::<32>().to_vec().as_slice());

// unwrap() here 'consumes' the Result
evm::raw_log(topics.as_slice(), data.as_ref()).unwrap();

Result
Combining the above examples into the boiler plate provided below this section, deploying to a Stylus chain and then invoking the deployed contract will result in the following three events logged to the chain:

logs
[
  {
    "address": "0x6cf4a18ac8efd6b0b99d3200c4fb9609dd60d4b3",
    "topics": [
      "0x0738f4da267a110d810e6e89fc59e46be6de0c37b1d5cd559b267dc3688e74e0",
      "0x0000000000000000000000001111111111111111111111111111111111111111"
    ],
    "data": "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c48656c6c6f20776f726c64210000000000000000000000000000000000000000",
    "blockHash": "0xfef880025dc87b5ab4695a0e1a6955dd7603166ecba79ce0f503a568b2ec8940",
    "blockNumber": "0x94",
    "transactionHash": "0xc7318dae2164eb441fb80f5b869f844e3e97ae83c24a4639d46ec4d915a30818",
    "transactionIndex": "0x1",
    "logIndex": "0x0",
    "removed": false
  },
  {
    "address": "0x6cf4a18ac8efd6b0b99d3200c4fb9609dd60d4b3",
    "topics": ["0xfe1a3ad11e425db4b8e6af35d11c50118826a496df73006fc724cb27f2b99946"],
    "data": "0x",
    "blockHash": "0xfef880025dc87b5ab4695a0e1a6955dd7603166ecba79ce0f503a568b2ec8940",
    "blockNumber": "0x94",
    "transactionHash": "0xc7318dae2164eb441fb80f5b869f844e3e97ae83c24a4639d46ec4d915a30818",
    "transactionIndex": "0x1",
    "logIndex": "0x1",
    "removed": false
  },
  {
    "address": "0x6cf4a18ac8efd6b0b99d3200c4fb9609dd60d4b3",
    "topics": ["0x0000000000000000000000002222222222222222222222222222222222222222"],
    "data": "0x0000000000000000000000000000000000000000000000000000000000989680",
    "blockHash": "0xfef880025dc87b5ab4695a0e1a6955dd7603166ecba79ce0f503a568b2ec8940",
    "blockNumber": "0x94",
    "transactionHash": "0xc7318dae2164eb441fb80f5b869f844e3e97ae83c24a4639d46ec4d915a30818",
    "transactionIndex": "0x1",
    "logIndex": "0x2",
    "removed": false
  }
]


Boilerplate
src/lib.rs
// Only run this as a WASM if the export-abi feature is not set.
#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;

use alloc::vec::Vec;
use alloc::{string::ToString, vec};

use stylus_sdk::alloy_primitives::U256;
use stylus_sdk::{alloy_primitives::Address, alloy_sol_types::sol, evm, prelude::*, ArbResult};

// sol! macro event declaration
// Up to 3 parameters can be indexed.
// Indexed parameters helps you filter the logs by the indexed parameter
sol! {
    event Log(address indexed sender, string message);
    event AnotherLog();
}

#[storage]
#[entrypoint]
pub struct Events {}

#[public]
impl Events {
fn user_main(_input: Vec<u8>) -> ArbResult {
    // emits a 'Log' event, defined above in the sol! macro
    evm::log(Log {
        sender: Address::from([0x11; 20]),
        message: "Hello world!".to_string(),
    });

    // no data, but event will still log to the chain
    evm::log(AnotherLog {});

    // set up local variables
    let user = Address::from([0x22; 20]);
    let balance = U256::from(10_000_000);

    // declare up to 4 topics
    // topics must be of type FixedBytes<32>
    let topics = &[user.into_word()];

    // store non-indexed data in a byte Vec
    let mut data: Vec<u8> = vec![];
    // to_be_bytes means 'to big endian bytes'
    data.extend_from_slice(balance.to_be_bytes::<32>().to_vec().as_slice());

    // unwrap() here 'consumes' the Result
    evm::raw_log(topics.as_slice(), data.as_ref()).unwrap();

    Ok(Vec::new())
}
}

Cargo.toml
[package]
name = "stylus_events_example"
version = "0.1.7"
edition = "2021"
license = "MIT OR Apache-2.0"
keywords = ["arbitrum", "ethereum", "stylus", "alloy"]

[dependencies]
alloy-primitives = "=0.7.6"
alloy-sol-types = "=0.7.6"
mini-alloc = "0.4.2"
stylus-sdk = "0.6.0"
hex = "0.4.3"

[dev-dependencies]
tokio = { version = "1.12.0", features = ["full"] }
ethers = "2.0"
eyre = "0.6.8"

[features]
export-abi = ["stylus-sdk/export-abi"]

[lib]
crate-type = ["lib", "cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"



Inheritance
The Stylus Rust SDK replicates the composition pattern of Solidity. The #[public] macro provides the Router trait, which can be used to connect types via inheritance, via the #[inherit] macro.

Please note: Stylus doesn't support contract multi-inheritance yet.

Let's see an example:

note
This code has yet to be audited. Please use at your own risk.

#[public]
#[inherit(Erc20)]
impl Token {
    pub fn mint(&mut self, amount: U256) -> Result<(), Vec<u8>> {
        ...
    }
}

#[public]
impl Erc20 {
    pub fn balance_of() -> Result<U256> {
        ...
    }
}

In the above code, we can see how Token inherits from Erc20, meaning that it will inherit the public methods available in Erc20. If someone called the Token contract on the function balanceOf, the function Erc20.balance_of() would be executed.

Additionally, the inheriting type must implement the Borrow trait for borrowing data from the inherited type. In the case above, Token should implement Borrow<Erc20>. For simplicity, #[storage] and sol_storage! provide a #[borrow] annotation that can be used instead of manually implementing the trait:

sol_storage! {
    #[entrypoint]
    pub struct Token {
        #[borrow]
        Erc20 erc20;
        ...
    }

    pub struct Erc20 {
        ...
    }
}

Methods search order
A type can inherit multiple other types (as long as they use the #[public] macro). Since execution begins in the type that uses the #[entrypoint] macro, that type will be first checked when searching a specific method. If the method is not found in that type, the search will continue in the inherited types, in order of inheritance. If the method is not found in any of the inherited methods, the call will revert.

Let's see an example:

#[public]
#[inherit(B, C)]
impl A {
    pub fn foo() -> Result<(), Vec<u8>> {
        ...
    }
}

#[public]
impl B {
    pub fn bar() -> Result<(), Vec<u8>> {
        ...
    }
}

#[public]
impl C {
    pub fn bar() -> Result<(), Vec<u8>> {
        ...
    }

    pub fn baz() -> Result<(), Vec<u8>> {
        ...
    }
}

In the code above:

calling foo() will search the method in A, find it, and execute A.foo()
calling bar() will search the method in A first, then in B, find it, and execute B.bar()
calling baz() will search the method in A, B and finally C, so it will execute C.baz()
Notice that C.bar() won't ever be reached, since the inheritance goes through B first, which has a method named bar() too.

Finally, since the inherited types can also inherit other types themselves, keep in mind that method resolution finds the first matching method by Depth First Search.

Overriding methods
Because methods are checked in the inherited order, if two types implement the same method, the one in the higher level in the hierarchy will override the one in the lower levels, which won’t be callable. This allows for patterns where the developer imports a crate implementing a standard, like ERC-20, and then adds or overrides just the methods they want to without modifying the imported ERC-20 type.

Important warning: The Stylus Rust SDK does not currently contain explicit override or virtual keywords for explicitly marking override functions. It is important, therefore, to carefully ensure that contracts are only overriding the functions.

Let's see an example:

#[public]
#[inherit(B, C)]
impl A {
    pub fn foo() -> Result<(), Vec<u8>> {
        ...
    }
}

#[public]
impl B {
    pub fn foo() -> Result<(), Vec<u8>> {
        ...
    }

    pub fn bar() -> Result<(), Vec<u8>> {
        ...
    }
}

In the example above, even though B has an implementation for foo(), calling foo() will execute A.foo() since the method is searched first in A.

Learn more
Arbitrum documentation
inheritance, #[inherit] and #[borrow]
Router trait
Borrow trait
BorrowMut trait




V affordances
The Stylus Rust SDK contains several modules for interacting with the Virtual Machine (VM), which can be imported from stylus_sdk.

Let's see an example:

note
This code has yet to be audited. Please use at your own risk.

use stylus_sdk::{msg};

let callvalue = msg::value();

This page lists the modules that are available, as well as the methods within those modules.

block
Allows you to inspect the current block:

basefee: gets the basefee of the current block
chainid: gets the unique chain identifier of the Arbitrum chain
coinbase: gets the coinbase of the current block, which on Arbitrum chains is the L1 batch poster's address
gas_limit: gets the gas limit of the current block
number: gets a bounded estimate of the L1 block number at which the sequencer sequenced the transaction. See Block gas limit, numbers and time for more information on how this value is determined
timestamp: gets a bounded estimate of the Unix timestamp at which the sequencer sequenced the transaction. See Block gas limit, numbers and time for more information on how this value is determined
use stylus_sdk::{block};

let basefee = block::basefee();
let chainid = block::chainid();
let coinbase = block::coinbase();
let gas_limit = block::gas_limit();
let number = block::number();
let timestamp = block::timestamp();

contract
Allows you to inspect the contract itself:

address: gets the address of the current program
args: reads the invocation's calldata. The entrypoint macro uses this under the hood
balance: gets the balance of the current program
output: writes the contract's return data. The entrypoint macro uses this under the hood
read_return_data: copies the bytes of the last EVM call or deployment return result. Note: this function does not revert if out of bounds, but rather will copy the overlapping portion
return_data_len: returns the length of the last EVM call or deployment return result, or 0 if neither have happened during the program's execution
use stylus_sdk::{contract};

let address = contract::address();
contract::args();
let balance = contract::balance();
contract::output();
contract::read_return_data();
contract::return_data_len();

crypto
Allows you to access VM-accelerated cryptographic functions:

keccak: efficiently computes the keccak256 hash of the given preimage
use stylus_sdk::{crypto};
use stylus_sdk::alloy_primitives::address;

let preimage = address!("361594F5429D23ECE0A88E4fBE529E1c49D524d8");
let hash = crypto::keccak(&preimage);

evm
Allows you to access affordances for the Ethereum Virtual Machine:

gas_left: gets the amount of gas remaining. See Ink and Gas for more information on Stylus's compute pricing
ink_left: gets the amount of ink remaining. See Ink and Gas for more information on Stylus's compute pricing
log: emits a typed alloy log
pay_for_memory_grow: this function exists to force the compiler to import this symbol. Calling it will unproductively consume gas
raw_log: emits an EVM log from its raw topics and data. Most users should prefer the alloy-typed raw_log
use stylus_sdk::{evm};

let gas_left = evm::gas_left();
let ink_left = evm::ink_left();
evm::log(...);
evm::pay_for_memory_grow();
evm::raw_log(...);

Here's an example of how to emit a Transfer log:

sol! {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

fn foo() {
   ...
   evm::log(Transfer {
      from: Address::ZERO,
      to: address,
      value,
   });
}

msg
Allows you to inspect the current call

reentrant: whether the current call is reentrant
sender: gets the address of the account that called the program. For normal L2-to-L2 transactions the semantics are equivalent to that of the EVM's CALLER opcode, including in cases arising from DELEGATE_CALL
value: gets the ETH value in wei sent to the program
use stylus_sdk::{msg};

let reentrant = msg::reentrant();
let sender = msg::sender();
let value = msg::value();

tx
Allows you to inspect the current transaction

gas_price: gets the gas price in wei per gas, which on Arbitrum chains equals the basefee
gas_to_ink: converts evm gas to ink. See Ink and Gas for more information on Stylus's compute-pricing model
ink_price: gets the price of ink in evm gas basis points. See Ink and Gas for more information on Stylus's compute-pricing model
ink_to_gas: converts ink to evm gas. See Ink and Gas for more information on Stylus's compute-pricing model
origin: gets the top-level sender of the transaction. The semantics are equivalent to that of the EVM's ORIGIN opcode
use stylus_sdk::{tx};

let gas_price = tx::gas_price();
let gas_to_ink = tx::gas_to_ink();
let ink_price = tx::ink_price();
let ink_to_gas = tx::ink_to_gas();
let origin = tx::origin();

Learn More
Arbitrum documentation
Stylus SDK modules
/




Sending Ether
We have three main ways to send Ether in Rust Stylus: using the transfer_eth method, using low level call method, and sending value while calling an external contract.

It's important to note that the transfer_eth method in Rust Stylus invokes the recipient contract, which may subsequently call other contracts. All the gas is supplied to the recipient, which it may burn. Conversely, the transfer method in Solidity is capped at 2300 gas. In Rust Stylus, you can cap the gas by using the low-level call method with a specified gas. An example of this is provided in the code on bottom of the page.

These two methods are exactly equivalent under the hood:

note
This code has yet to be audited. Please use at your own risk.

transfer_eth(recipient, value)?;

call(Call::new_in(self).value(value), recipient, &[])?;

Where to Send Ether
Externally Owned Account (EOA) Addresses: Directly send Ether to an EOA address.

Solidity Smart Contracts with Receive Function (No Calldata): Send Ether to a Solidity smart contract that has a receive function without providing any calldata.

Solidity Smart Contracts with Fallback Function (With Calldata): Send Ether to a Solidity smart contract that has a fallback function by providing the necessary calldata.

Smart Contracts with Payable Methods (both Solidity and Stylus): Send Ether to smart contracts that have defined payable methods. Payable methods are identified by the payable modifier in Solidity, and the #[payable] macro in Rust.

Below you can find examples for each of these methods and how to define them in a Rust Stylus smart contract using the Stylus SDK:

src/lib.rs
// Only run this as a WASM if the export-abi feature is not set.
#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;

use alloy_primitives::Address;
use stylus_sdk::{
    abi::Bytes,
    call::{call, transfer_eth, Call},
    msg::{self},
    prelude::*,
};

sol_interface! {
    interface ITarget {
        function receiveEther() external payable;
    }
}

#[storage]
#[entrypoint]
pub struct SendEther {}

#[public]
impl SendEther {
    // Transfer Ether using the transfer_eth method
    // This can be used to send Ether to an EOA or a Solidity smart contract that has a receive() function implemented
    #[payable]
    pub fn send_via_transfer(to: Address) -> Result<(), Vec<u8>> {
        transfer_eth(to, msg::value())?;
        Ok(())
    }

    // Transfer Ether using a low-level call
    // This can be used to send Ether to an EOA or a Solidity smart contract that has a receive() function implemented
    #[payable]
    pub fn send_via_call(&mut self, to: Address) -> Result<(), Vec<u8>> {
        call(Call::new_in(self).value(msg::value()), to, &[])?;
        Ok(())
    }

    // Transfer Ether using a low-level call with a specified gas limit
    // This can be used to send Ether to an EOA or a Solidity smart contract that has a receive() function implemented
    #[payable]
    pub fn send_via_call_gas_limit(&mut self, to: Address, gas_amount: u64) -> Result<(), Vec<u8>> {
        call(
            Call::new_in(self).value(msg::value()).gas(gas_amount),
            to,
            &[],
        )?;
        Ok(())
    }

    // Transfer Ether using a low-level call with calldata
    // This can be used to call a Solidity smart contract's fallback function and send Ether along with calldata
    #[payable]
    pub fn send_via_call_with_call_data(
        &mut self,
        to: Address,
        data: Bytes,
    ) -> Result<(), Vec<u8>> {
        call(Call::new_in(self).value(msg::value()), to, data.as_slice())?;
        Ok(())
    }

    // Transfer Ether to another smart contract via a payable method on the target contract
    // The target contract can be either a Solidity smart contract or a Stylus contract that has a receiveEther function, which is a payable function
    #[payable]
    pub fn send_to_stylus_contract(&mut self, to: Address) -> Result<(), Vec<u8>> {
        let target = ITarget::new(to);
        let config = Call::new_in(self).value(msg::value());
        target.receive_ether(config)?;
        Ok(())
    }
}


Cargo.toml
[package]
name = "stylus_sending_ether_example"
version = "0.1.7"
edition = "2021"
license = "MIT OR Apache-2.0"
keywords = ["arbitrum", "ethereum", "stylus", "alloy"]

[dependencies]
alloy-primitives = "=0.7.6"
alloy-sol-types = "=0.7.6"
mini-alloc = "0.4.2"
stylus-sdk = "0.6.0"
hex = "0.4.3"

[dev-dependencies]
tokio = { version = "1.12.0", features = ["full"] }
ethers = "2.0"
eyre = "0.6.8"

[features]
export-abi = ["stylus-sdk/export-abi"]

[lib]
crate-type = ["lib", "cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"






Function selector
When a smart contract is called, the first 4 bytes of the calldata sent as part of the request are called the "function selector", and identify which function of the smart contract to call.

You can compute a specific function selector by using the function_selector! macro.

Here's an example that computes the selector of a function named foo:

note
This code has yet to be audited. Please use at your own risk.

function_selector!("foo") // returns 0xc2985578

Functions usually take a number of arguments that you need to pass in order for the call to be successful. For example, here's the signature of a function that takes 2 arguments, an address and a uint256:

function transfer(address recipient, uint256 amount) external returns (bool);

To compute the selector for this function, pass the types of the arguments to the function_selector macro:

function_selector!("transfer", Address, U256) // returns 0xa9059cbb

function_selector will return a byte array containing the encoded function selector.

Learn More
stylus_sdk::function_selector



ABI Encode
The ABI Encode has 2 types which are encode and encode_packed.

encode will concatenate all values and add padding to fit into 32 bytes for each values.
encode_packed will concatenate all values in the exact byte representations without padding. (For example, encode_packed("a", "bc") == encode_packed("ab", "c"))
Suppose we have a tuple of values: (target, value, func, data, timestamp) to encode, and their alloy primitives type are (Address, U256, String, Bytes, U256).

Firstly we need to import those types we need from alloy_primitives, stylus_sdk::abi and alloc::string:

note
This code has yet to be audited. Please use at your own risk.

// Import items from the SDK. The prelude contains common traits and macros.
use stylus_sdk::{alloy_primitives::{U256, Address, FixedBytes}, abi::Bytes, prelude::*};
// Import String from alloc
use alloc::string::String;

Secondly because we will use the method abi_encode_sequence and abi_encode_packed under alloy_sol_types to encode data, we also need to import the types from alloy_sol_types:

// Becauce the naming of alloy_primitives and alloy_sol_types is the same, so we need to re-name the types in alloy_sol_types
use alloy_sol_types::{sol_data::{Address as SOLAddress, String as SOLString, Bytes as SOLBytes, *}, SolType};

encode
Then encode them:

// define sol types tuple
type TxIdHashType = (SOLAddress, Uint<256>, SOLString, SOLBytes, Uint<256>);
// set the tuple
let tx_hash_data = (target, value, func, data, timestamp);
// encode the tuple
let tx_hash_bytes = TxIdHashType::abi_encode_sequence(&tx_hash_data);

encode_packed
There are 2 methods to encode_packed data:

encode_packed them:
// define sol types tuple
type TxIdHashType = (SOLAddress, Uint<256>, SOLString, SOLBytes, Uint<256>);
// set the tuple
let tx_hash_data = (target, value, func, data, timestamp);
// encode the tuple
let tx_hash_data_encode_packed = TxIdHashType::abi_encode_packed(&tx_hash_data);

We can also use the following method to encode_packed them:
let tx_hash_data_encode_packed = [&target.to_vec(), &value.to_be_bytes_vec(), func.as_bytes(), &data.to_vec(), &timestamp.to_be_bytes_vec()].concat();


Full Example code:
src/main.rs
// Allow `cargo stylus export-abi` to generate a main function.
#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;


/// Import items from the SDK. The prelude contains common traits and macros.
use stylus_sdk::{alloy_primitives::{U256, Address, FixedBytes}, abi::Bytes, prelude::*};
use alloc::string::String;
// Becauce the naming of alloy_primitives and alloy_sol_types is the same, so we need to re-name the types in alloy_sol_types
use alloy_sol_types::{sol_data::{Address as SOLAddress, String as SOLString, Bytes as SOLBytes, *}, SolType};
use sha3::{Digest, Keccak256};

// Define some persistent storage using the Solidity ABI.
// `Encoder` will be the entrypoint.
#[storage]
#[entrypoint]
pub struct Encoder;

impl Encoder {
    fn keccak256(&self, data: Bytes) -> FixedBytes<32> {
        // prepare hasher
        let mut hasher = Keccak256::new();
        // populate the data
        hasher.update(data);
        // hashing with keccack256
        let result = hasher.finalize();
        // convert the result hash to FixedBytes<32>
        let result_vec = result.to_vec();
        FixedBytes::<32>::from_slice(&result_vec)   
    }
}

/// Declare that `Encoder` is a contract with the following external methods.
#[public]
impl Encoder {

     // Encode the data and hash it
     pub fn encode(
        &self, 
        target: Address,
        value: U256,
        func: String,
        data: Bytes,
        timestamp: U256
    ) -> Vec<u8> {
        // define sol types tuple
        type TxIdHashType = (SOLAddress, Uint<256>, SOLString, SOLBytes, Uint<256>);
        // set the tuple
        let tx_hash_data = (target, value, func, data, timestamp);
        // encode the tuple
        let tx_hash_data_encode = TxIdHashType::abi_encode_params(&tx_hash_data);
        tx_hash_data_encode
    }

    // Packed encode the data and hash it, the same result with the following one
    pub fn packed_encode(
        &self, 
        target: Address,
        value: U256,
        func: String,
        data: Bytes,
        timestamp: U256
    )-> Vec<u8> {
        // define sol types tuple
        type TxIdHashType = (SOLAddress, Uint<256>, SOLString, SOLBytes, Uint<256>);
        // set the tuple
        let tx_hash_data = (target, value, func, data, timestamp);
        // encode the tuple
        let tx_hash_data_encode_packed = TxIdHashType::abi_encode_packed(&tx_hash_data);
        tx_hash_data_encode_packed
    }

    // Packed encode the data and hash it, the same result with the above one
    pub fn packed_encode_2(
        &self, 
        target: Address,
        value: U256,
        func: String,
        data: Bytes,
        timestamp: U256
    )-> Vec<u8> {
        // set the data to arrary and concat it directly
        let tx_hash_data_encode_packed = [&target.to_vec(), &value.to_be_bytes_vec(), func.as_bytes(), &data.to_vec(), &timestamp.to_be_bytes_vec()].concat();
        tx_hash_data_encode_packed
    }


    // The func example: "transfer(address,uint256)"
    pub fn encode_with_signature(
        &self, 
        func: String, 
        address: Address, 
        amount: U256
    ) -> Vec<u8> {
        type TransferType = (SOLAddress, Uint<256>);
        let tx_data = (address, amount);
        let data = TransferType::abi_encode_params(&tx_data);
        // Get function selector
        let hashed_function_selector = self.keccak256(func.as_bytes().to_vec().into());
        // Combine function selector and input data (use abi_packed way)
        let calldata = [&hashed_function_selector[..4], &data].concat();
        calldata
    }

}


Cargo.toml
[package]
name = "stylus-encode-hashing"
version = "0.1.7"
edition = "2021"
license = "MIT OR Apache-2.0"
keywords = ["arbitrum", "ethereum", "stylus", "alloy"]

[dependencies]
alloy-primitives = "=0.7.6"
alloy-sol-types = "=0.7.6"
mini-alloc = "0.4.2"
stylus-sdk = "0.6.0"
hex = "0.4.3"
sha3 = "0.10"

[dev-dependencies]
tokio = { version = "1.12.0", features = ["full"] }
ethers = "2.0"
eyre = "0.6.8"

[features]
export-abi = ["stylus-sdk/export-abi"]

[lib]
crate-type = ["lib", "cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"



ABI Decode
The decode can not be used for encode_packed data because it ignores padding when encode. (For more information you can refer to ABI Encode)

So here we show an example for using decode on data encoded with abi_encode_sequence:

note
This code has yet to be audited. Please use at your own risk.

// This should always return true
pub fn encode_and_decode(
    &self, 
    target: Address,
    value: U256,
    func: String,
    data: Bytes,
    timestamp: U256
) -> Result<bool, HasherError> {
    // define sol types tuple
    type TxIdHashType = (SOLAddress, Uint<256>, SOLString, SOLBytes, Uint<256>);
    // because the abi_encode_sequence will return alloy_primitives::Bytes rather than stylus_sdk::bytes, so we need to make sure the input and return types are the same
    let primative_data = alloy_primitives::Bytes::copy_from_slice(&data);
    // set the tuple
    let tx_hash_data = (target, value, func, primative_data, timestamp);
    // encode the tuple
    let tx_hash_data_encode = TxIdHashType::abi_encode_sequence(&tx_hash_data);

    let validate = true;
    
    // Check the result
    match TxIdHashType::abi_decode_sequence(&tx_hash_data_encode, validate) {
        Ok(res) => Ok(res == tx_hash_data),
        Err(_) => {
            return Err(HasherError::DecodedFailed(DecodedFailed{}));
        },
    }   
}


Full Example code:
src/lib.rs

#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;


/// Import items from the SDK. The prelude contains common traits and macros.
use stylus_sdk::{alloy_primitives::{U256, Address}, prelude::*};
// Because the naming of `alloy_primitives` and `alloy_sol_types` is the same, we need to rename the types in `alloy_sol_types`.
use alloy_sol_types::{sol_data::{Address as SOLAddress, *}, SolType, sol};


// Define error
sol! {
    error DecodedFailed();
}

// Error types for the MultiSig contract
#[derive(SolidityError)]
pub enum DecoderError{
    DecodedFailed(DecodedFailed)
}

#[storage]
#[entrypoint]
pub struct Decoder;


/// Declare that `Decoder` is a contract with the following external methods.
#[public]
impl Decoder {
    // This should always return true
    pub fn encode_and_decode(
        &self, 
        address: Address, 
        amount: U256
    ) -> Result<bool, DecoderError> {
        // define sol types tuple
        type TxIdHashType = (SOLAddress, Uint<256>);
        // set the tuple
        let tx_hash_data = (address, amount);
        // encode the tuple
        let tx_hash_data_encode = TxIdHashType::abi_encode_params(&tx_hash_data);

        let validate = true;
        
        // Check the result
        match TxIdHashType::abi_decode_params(&tx_hash_data_encode, validate) {
            Ok(res) => Ok(res == tx_hash_data),
            Err(_) => {
                return Err(DecoderError::DecodedFailed(DecodedFailed{}));
            },
        }   
    }

}

Cargo.toml
[package]
name = "stylus-decode-hashing"
version = "0.1.0"
edition = "2021"

[dependencies]
alloy-primitives = "=0.7.6"
alloy-sol-types = "=0.7.6"
mini-alloc = "0.4.2"
stylus-sdk = "0.5.1"

[features]
export-abi = ["stylus-sdk/export-abi"]
debug = ["stylus-sdk/debug"]

[lib]
crate-type = ["lib", "cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"



Hasing with keccak256 • Stylus by Example
Hashing with keccak256
Keccak256 is a cryptographic hash function that takes an input of an arbitrary length and produces a fixed-length output of 256 bits.

Keccak256 is a member of the SHA-3 family of hash functions.

keccak256 computes the Keccak-256 hash of the input.

Some use cases are:

Creating a deterministic unique ID from a input
Commit-Reveal scheme
Compact cryptographic signature (by signing the hash instead of a larger input)
Here we will use stylus-sdk::crypto::keccak to calculate the keccak256 hash of the input data:

note
This code has yet to be audited. Please use at your own risk.

pub fn keccak<T: AsRef<[u8]>>(bytes: T) -> B256

Full Example code:
src/main.rs
// Only run this as a WASM if the export-abi feature is not set.
#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;

/// Import items from the SDK. The prelude contains common traits and macros.
use stylus_sdk::{alloy_primitives::{U256, Address, FixedBytes}, abi::Bytes, prelude::*, crypto::keccak};
use alloc::string::String;
use alloc::vec::Vec;
// Becauce the naming of alloy_primitives and alloy_sol_types is the same, so we need to re-name the types in alloy_sol_types
use alloy_sol_types::{sol_data::{Address as SOLAddress, String as SOLString, Bytes as SOLBytes, *}, SolType};
use alloy_sol_types::sol;

// Define error
sol! {
    error DecodedFailed();
}

// Error types for the MultiSig contract
#[derive(SolidityError)]
pub enum HasherError{
    DecodedFailed(DecodedFailed)
}

#[solidity_storage]
#[entrypoint]
pub struct Hasher {
}
/// Declare that `Hasher` is a contract with the following external methods.
#[public]
impl Hasher {
    
    // Encode the data and hash it
    pub fn encode_and_hash(
        &self, 
        target: Address,
        value: U256,
        func: String,
        data: Bytes,
        timestamp: U256
    ) -> FixedBytes<32> {
        // define sol types tuple
        type TxIdHashType = (SOLAddress, Uint<256>, SOLString, SOLBytes, Uint<256>);
        // set the tuple
        let tx_hash_data = (target, value, func, data, timestamp);
        // encode the tuple
        let tx_hash_data_encode = TxIdHashType::abi_encode_sequence(&tx_hash_data);
        // hash the encoded data
        keccak(tx_hash_data_encode).into()
    }

    // This should always return true
    pub fn encode_and_decode(
        &self, 
        address: Address, 
        amount: U256
    ) -> Result<bool, HasherError> {
        // define sol types tuple
        type TxIdHashType = (SOLAddress, Uint<256>);
        // set the tuple
        let tx_hash_data = (address, amount);
        // encode the tuple
        let tx_hash_data_encode = TxIdHashType::abi_encode_sequence(&tx_hash_data);

        let validate = true;
        
        // Check the result
        match TxIdHashType::abi_decode_sequence(&tx_hash_data_encode, validate) {
            Ok(res) => Ok(res == tx_hash_data),
            Err(_) => {
                return Err(HasherError::DecodedFailed(DecodedFailed{}));
            },
        }   
    }
        
    // Packed encode the data and hash it, the same result with the following one
    pub fn packed_encode_and_hash_1(
        &self, 
        target: Address,
        value: U256,
        func: String,
        data: Bytes,
        timestamp: U256
    )-> FixedBytes<32> {
        // define sol types tuple
        type TxIdHashType = (SOLAddress, Uint<256>, SOLString, SOLBytes, Uint<256>);
        // set the tuple
        let tx_hash_data = (target, value, func, data, timestamp);
        // encode the tuple
        let tx_hash_data_encode_packed = TxIdHashType::abi_encode_packed(&tx_hash_data);
        // hash the encoded data
        keccak(tx_hash_data_encode_packed).into()
    }

    // Packed encode the data and hash it, the same result with the above one
    pub fn packed_encode_and_hash_2(
        &self, 
        target: Address,
        value: U256,
        func: String,
        data: Bytes,
        timestamp: U256
    )-> FixedBytes<32> {
        // set the data to arrary and concat it directly
        let tx_hash_data_encode_packed = [&target.to_vec(), &value.to_be_bytes_vec(), func.as_bytes(), &data.to_vec(), &timestamp.to_be_bytes_vec()].concat();
        // hash the encoded data
        keccak(tx_hash_data_encode_packed).into()
    }


    // The func example: "transfer(address,uint256)"
    pub fn encode_with_signature(
        &self, 
        func: String, 
        address: Address, 
        amount: U256
    ) -> Vec<u8> {
        type TransferType = (SOLAddress, Uint<256>);
        let tx_data = (address, amount);
        let data = TransferType::abi_encode_sequence(&tx_data);
        // Get function selector
        let hashed_function_selector: FixedBytes<32> = keccak(func.as_bytes().to_vec()).into();
        // Combine function selector and input data (use abi_packed way)
        let calldata = [&hashed_function_selector[..4], &data].concat();
        calldata
    }

    // The func example: "transfer(address,uint256)"
    pub fn encode_with_signature_and_hash(
        &self, 
        func: String, 
        address: Address, 
        amount: U256
    ) -> FixedBytes<32> {
        type TransferType = (SOLAddress, Uint<256>);
        let tx_data = (address, amount);
        let data = TransferType::abi_encode_sequence(&tx_data);
        // Get function selector
        let hashed_function_selector: FixedBytes<32> = keccak(func.as_bytes().to_vec()).into();
        // Combine function selector and input data (use abi_packed way)
        let calldata = [&hashed_function_selector[..4], &data].concat();
        keccak(calldata).into()
    }
}


Cargo.toml
[package]
name = "stylus-encode-hashing"
version = "0.1.0"
edition = "2021"

[dependencies]
alloy-primitives = "=0.7.6"
alloy-sol-types = "=0.7.6"
mini-alloc = "0.4.2"
stylus-sdk = "0.6.0"
hex = "0.4.3"
sha3 = "0.10.8"

[features]
export-abi = ["stylus-sdk/export-abi"]
debug = ["stylus-sdk/debug"]

[lib]
crate-type = ["lib", "cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"




Bytes In, Bytes Out
This is a simple bytes in, bytes out contract that shows a minimal entrypoint function (denoted by the #[entrypoint] proc macro). If your smart contract just has one primary function, like computing a cryptographic hash, this can be a great model because it strips out the SDK and acts like a pure function or Unix-style app.

src/main.rs
note
This code has yet to be audited. Please use at your own risk.

#![cfg_attr(not(feature = "export-abi"), no_main)]

extern crate alloc;
use alloc::vec::Vec;

use stylus_sdk::stylus_proc::entrypoint;

#[entrypoint]
fn user_main(input: Vec<u8>) -> Result<Vec<u8>, Vec<u8>> {
    Ok(input)
}

Cargo.toml
[package]
name = "bytes_in_bytes_out"
version = "0.1.7"
edition = "2021"

[dependencies]
stylus-sdk = "0.6.0"

[features]
export-abi = ["stylus-sdk/export-abi"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"

[workspace]






Composition and trait-based routing model
Inheritance allows you to build upon existing smart contract functionality without duplicating code. In Stylus, the Rust SDK provides tools to implement inheritance patterns similar to Solidity, but with some important differences. This guide walks you through implementing trait-based composition in your Stylus smart contracts.

For Solidity developers
There's no direct equivalent of inheritance in Rust, but the following will show you the Rust-way of achieving similar results.

Overview
The Stylus SDK offers trait-based composition using traits and the #[implements] annotation. This approach follows Rust's composition patterns and provides stronger type safety.

Getting started
Before implementing trait-based composition, ensure you have:

Rust toolchain
cargo stylus
Trait-based composition model
The recommended approach to inheritance in Stylus uses traits and the #[implements] annotation, which follows Rust's standard composition patterns:

Basic example of trait-based composition
Trait-Based Inheritance Example: ERC-20
How trait-based composition works
The trait-based composition model follows these principles:

Define traits that represent interfaces (similar to Solidity interfaces)
Implement these traits for your contract
Use the #[implements(...)] attribute to tell the Stylus SDK which traits your contract implements
The router will connect incoming calls to the appropriate implementation
This approach is aligned with Rust's composition patterns and offers better type safety.

Method overriding
If both parent and child implement the same method, the one in the child will override the one in the parent. This allows for customizing inherited functionality.

No explicit override keywords
Stylus does not currently contain explicit override or virtual keywords for marking override functions. It is important to carefully ensure that contracts are only overriding the functions you intend to override.

ABI export considerations with trait-based composition
When using trait-based composition, you need to be careful about function selectors to ensure correct ABI generation. Due to how Rust handles traits, you may need to explicitly set selectors for methods to match Solidity's expected function signatures.

Selector precision
When implementing traits with methods that have matching names, you must manually use the #[selector(name = "ActualName")] attribute to avoid method selector collisions. This is particularly important when implementing standard interfaces like ERC-20 or ERC-721.

Selector issue example: ERC-721
ABI generation and inheritance
The Stylus SDK generates ABIs based on the methods that are available at the entrypoint contract. When using trait-based composition, make sure that all methods you want exposed in the ABI are properly included through the #[implements] attribute.

Methods search order
When using trait-based composition, it's important to understand the order in which methods are searched:

The search starts in the type that uses the #[entrypoint] macro
If the method is not found, the search continues in the implemented traits, in the order specified in the #[implements] annotation
If the method is not found in any implemented trait, the call reverts
In a typical composition chain:

Calling a method first searches in the contract itself
If not found there, it looks in the first trait specified in the inheritance list
If still not found, it searches in the next trait in the list
This continues until the method is found or all possibilities are exhausted









Stylus Rust SDK advanced features
This document provides information about advanced features included in the Stylus Rust SDK, that are not described in the previous pages. For information about deploying Rust smart contracts, see the cargo stylus CLI Tool. For a conceptual introduction to Stylus, see Stylus: A Gentle Introduction. To deploy your first Stylus smart contract using Rust, refer to the Quickstart.

info
Many of the affordances use macros. Though this section details what each does, it may be helpful to use cargo expand to see what they expand into if you’re doing advanced work in Rust.

Storage
This section provides extra information about how the Stylus Rust SDK handles storage. You can find more information and basic examples in Variables.

Rust smart contracts may use state that persists across transactions. There’s two primary ways to define storage, depending on if you want to use Rust or Solidity definitions. Both are equivalent, and are up to the developer depending on their needs.

#[storage]
The #[storage] macro allows a Rust struct to be used in persistent storage.

#[storage]
pub struct Contract {
    owner: StorageAddress,
    active: StorageBool,
    sub_struct: SubStruct,
}

#[storage]
pub struct SubStruct {
    // types implementing the `StorageType` trait.
}

Any type implementing the StorageType trait may be used as a field, including other structs, which will implement the trait automatically when #[storage] is applied. You can even implement StorageType yourself to define custom storage types. However, we’ve gone ahead and implemented the common ones.

Type	Info
| StorageBool | Stores a bool | | StorageAddress | Stores an Alloy Address | | StorageUint | Stores an Alloy Uint | | StorageSigned | Stores an Alloy Signed | | StorageFixedBytes | Stores an Alloy FixedBytes | | StorageBytes | Stores a Solidity bytes | | StorageString | Stores a Solidity string | | StorageVec | Stores a vector of StorageType | | StorageMap | Stores a mapping of StorageKey to StorageType | | StorageArray | Stores a fixed-sized array of StorageType |

Every Alloy primitive has a corresponding StorageType implementation with the word Storage before it. This includes aliases, like StorageU256 and StorageB64.

sol_storage!
The types in #[storage] are laid out in the EVM state trie exactly as they are in Solidity. This means that the fields of a struct definition will map to the same storage slots as they would in EVM programming languages.

Because of this, it is often nice to define your types using Solidity syntax, which makes that guarantee easier to see. For example, the earlier Rust struct can re-written to:

sol_storage! {
    pub struct Contract {
        address owner;                      // becomes a StorageAddress
        bool active;                        // becomes a StorageBool
        SubStruct sub_struct,
    }

    pub struct SubStruct {
        // other solidity fields, such as
        mapping(address => uint) balances;  // becomes a StorageMap
        Delegate delegates[];               // becomes a StorageVec
    }
}

The above will expand to the equivalent definitions in Rust, each structure implementing the StorageType trait. Many contracts, like our example ERC-20, do exactly this.

Because the layout is identical to Solidity’s, existing Solidity smart contracts can upgrade to Rust without fear of storage slots not lining up. You simply copy-paste your type definitions.

Storage layout in contracts using inheritance
One exception to this storage layout guarantee is contracts which utilize inheritance. The current solution in Stylus using #[borrow] and #[inherits(...)] packs nested (inherited) structs into their own slots. This is consistent with regular struct nesting in solidity, but not inherited structs. We plan to revisit this behavior in an upcoming release.

tip
Existing Solidity smart contracts can upgrade to Rust if they use proxy patterns.

Consequently, the order of fields will affect the JSON ABIs produced that explorers and tooling might use. Most developers won’t need to worry about this though and can freely order their types when working on a Rust contract from scratch.

Reading and writing storage
You can access storage types via getters and setters. For example, the Contract struct from earlier might access its owner address as follows.

impl Contract {
    /// Gets the owner from storage.
    pub fn owner(&self) -> Address {
        self.owner.get()
    }

    /// Updates the owner in storage
    pub fn set_owner(&mut self, new_owner: Address) {
        if msg::sender() == self.owner.get() { // we'll discuss msg::sender later
            self.owner.set(new_owner);
        }
    }

    /// Unlike other storage type, stringStorage needs to
    /// use `.set_str()` and `.get_string()` to set and get.
    pub fn set_base_uri(&mut self, base_uri: String) {
        self.base_uri.set_str(base_uri);
    }

    pub fn get_base_uri(&self) -> String {
        self.base_uri.get_string()
    }
}

In Solidity, one has to be very careful about storage access patterns. Getting or setting the same value twice doubles costs, leading developers to avoid storage access at all costs. By contrast, the Stylus SDK employs an optimal storage-caching policy that avoids the underlying SLOAD or SSTORE operations.

tip
Stylus uses storage caching, so multiple accesses of the same variable is virtually free.

However it must be said that storage is ultimately more expensive than memory. So if a value doesn’t need to be stored in state, you probably shouldn’t do it.

Collections
Collections like StorageVec and StorageMap are dynamic and have methods like push, insert, replace, and similar.

impl SubStruct {
   pub fn add_delegate(&mut self, delegate: Address) {
        self.delegates.push(delegate);
    }

    pub fn track_balance(&mut self, address: Address) {
        self.balances.insert(address, address.balance());
    }
}

You may notice that some methods return types like StorageGuard and StorageGuardMut. This allows us to leverage the Rust borrow checker for storage mistakes, just like it does for memory. Here’s an example that will fail to compile.

fn mistake(vec: &mut StorageVec<StorageU64>) -> U64 {
    let value = vec.setter(0);
    let alias = vec.setter(0);
    value.set(32.into());
    alias.set(48.into());
    value.get() // uh, oh. what value should be returned?
}

Under the hood, vec.setter() returns a StorageGuardMut instead of a &mut StorageU64. Because the guard is bound to a &mut StorageVec lifetime, value and alias cannot be alive simultaneously. This causes the Rust compiler to reject the above code, saving you from entire classes of storage aliasing errors.

In this way the Stylus SDK safeguards storage access the same way Rust ensures memory safety. It should never be possible to alias Storage without unsafe Rust.

SimpleStorageType
You may run into scenarios where a collection’s methods like push and insert aren’t available. This is because only primitives, which implement a special trait called SimpleStorageType, can be added to a collection by value. For nested collections, one instead uses the equivalent grow and setter.

fn nested_vec(vec: &mut StorageVec<StorageVec<StorageU8>>) {
    let mut inner = vec.grow();  // adds a new element accessible via `inner`
    inner.push(0.into());        // inner is a guard to a StorageVec<StorageU8>
}

fn nested_map(map: &mut StorageMap<u32, StorageVec<U8>>) {
    let mut slot = map.setter(0);
    slot.push(0);
}

Erase and #[derive(Erase)]
Some StorageType values implement Erase, which provides an erase() method for clearing state. We’ve implemented Erase for all primitives, and for vectors of primitives, but not maps. This is because a solidity mapping does not provide iteration, and so it’s generally impossible to know which slots to set to zero.

Structs may also be Erase if all of the fields are. #[derive(Erase)] lets you do this automatically.

sol_storage! {
    #[derive(Erase)]
    pub struct Contract {
        address owner;              // can erase primitive
        uint256[] hashes;           // can erase vector of primitive
    }

    pub struct NotErase {
        mapping(address => uint) balances; // can't erase a map
        mapping(uint => uint)[] roots;     // can't erase vector of maps
    }
}

You can also implement Erase manually if desired. Note that the reason we care about Erase at all is that you get storage refunds when clearing state, lowering fees. There’s also minor implications for patterns using unsafe Rust.

The storage cache
The Stylus SDK employs an optimal storage-caching policy that avoids the underlying SLOAD or SSTORE operations needed to get and set state. For the vast majority of use cases, this happens in the background and requires no input from the user.

However, developers working with unsafe Rust implementing their own custom StorageType collections, the StorageCache type enables direct control over this data structure. Included are unsafe methods for manipulating the cache directly, as well as for bypassing it altogether.

Immutables and PhantomData
So that generics are possible in sol_interface!, core::marker::PhantomData implements StorageType and takes up zero space, ensuring that it won’t cause storage slots to change. This can be useful when writing libraries.

pub trait Erc20Params {
    const NAME: &'static str;
    const SYMBOL: &'static str;
    const DECIMALS: u8;
}

sol_storage! {
    pub struct Erc20<T> {
        mapping(address => uint256) balances;
        PhantomData<T> phantom;
    }
}

The above allows consumers of Erc20 to choose immutable constants via specialization. See our WETH sample contract for a full example of this feature.

Functions
This section provides extra information about how the Stylus Rust SDK handles functions. You can find more information and basic examples in Functions, Bytes in, bytes out programming, Inheritance and Sending ether.

Pure, View, and Write functions
For non-payable methods the #[public] macro can figure state mutability out for you based on the types of the arguments. Functions with &self will be considered view, those with &mut self will be considered write, and those with neither will be considered pure. Please note that pure and view functions may change the state of other contracts by calling into them, or even this one if the reentrant feature is enabled.

#[entrypoint]
This macro allows you to define the entrypoint, which is where Stylus execution begins. Without it, the contract will fail to pass cargo stylus check. Most commonly, the macro is used to annotate the top level storage struct.

sol_storage! {
    #[entrypoint]
    pub struct Contract {
        ...
    }

    // only one entrypoint is allowed
    pub struct SubStruct {
        ...
    }
}

The above will make the public methods of Contract the first to consider during invocation.

Reentrancy
If a contract calls another that then calls the first, it is said to be reentrant. By default, all Stylus contracts revert when this happens. However, you can opt out of this behavior by enabling the reentrant feature flag.

stylus-sdk = { version = "0.6.0", features = ["reentrant"] }

This is dangerous, and should be done only after careful review––ideally by third-party auditors. Numerous exploits and hacks have in Web3 are attributable to developers misusing or not fully understanding reentrant patterns.

If enabled, the Stylus SDK will flush the storage cache in between reentrant calls, persisting values to state that might be used by inner calls. Note that preventing storage invalidation is only part of the battle in the fight against exploits. You can tell if a call is reentrant via msg::reentrant, and condition your business logic accordingly.

TopLevelStorage
The #[entrypoint] macro will automatically implement the TopLevelStorage trait for the annotated struct. The single type implementing TopLevelStorage is special in that mutable access to it represents mutable access to the entire program’s state. This idea will become important when discussing calls to other programs in later sections.

Inheritance, #[inherit], and #[borrow].
info
Stylus doesn't support contract multi-inheritance yet.

Composition in Rust follows that of Solidity. Types that implement Router, the trait that #[public] provides, can be connected via inheritance.

#[public]
#[inherit(Erc20)]
impl Token {
    pub fn mint(&mut self, amount: U256) -> Result<(), Vec<u8>> {
        ...
    }
}

#[public]
impl Erc20 {
    pub fn balance_of() -> Result<U256> {
        ...
    }
}

Because Token inherits Erc20 in the above, if Token has the #[entrypoint], calls to the contract will first check if the requested method exists within Token. If a matching function is not found, it will then try the Erc20. Only after trying everything Token inherits will the call revert.

Note that because methods are checked in that order, if both implement the same method, the one in Token will override the one in Erc20, which won’t be callable. This allows for patterns where the developer imports a crate implementing a standard, like the ERC-20, and then adds or overrides just the methods they want to without modifying the imported Erc20 type.

warning
Stylus does not currently contain explicit override or virtual keywords for explicitly marking override functions. It is important, therefore, to carefully ensure that contracts are only overriding the functions.

Inheritance can also be chained. #[inherit(Erc20, Erc721)] will inherit both Erc20 and Erc721, checking for methods in that order. Erc20 and Erc721 may also inherit other types themselves. Method resolution finds the first matching method by Depth First Search.

For the above to work, Token must implement Borrow<Erc20>. You can implement this yourself, but for simplicity, #[storage] and sol_storage! provide a #[borrow] annotation.

sol_storage! {
    #[entrypoint]
    pub struct Token {
        #[borrow]
        Erc20 erc20;
        ...
    }

    pub struct Erc20 {
        ...
    }
}

Fallback and receive functions
Starting with SDK version 0.7.0, the Router trait supports the fallback and receive methods, which work similar to their Solidity counterparts:

fallback: This method is called when a transaction is sent to the contract with calldata that doesn't match any function signature. It serves as a catch-all function for contract interactions that don't match any defined interface.

receive: This method is called when a transaction is sent to the contract with no calldata (empty calldata). It allows the contract to receive ETH.

Here's an example implementation:

#[public]
impl Contract {
    // Automatically called when transaction has calldata that doesn't match any function
    #[fallback]
    pub fn fallback(&mut self, calldata: Vec<u8>) -> Result<Vec<u8>, Vec<u8>> {
        // Handle arbitrary calldata
        Ok(Vec::new()) // Return empty response or custom response data
    }

    // Automatically called when transaction has empty calldata
    #[receive]
    pub fn receive(&mut self) -> Result<(), Vec<u8>> {
        // Handle ETH receiving logic
        Ok(())
    }
}

Both methods can be annotated with #[payable] to accept ETH along with the transaction. Without this annotation, transactions that send ETH will be rejected.

Calls
Just as with storage and functions, Stylus SDK calls are Solidity ABI equivalent. This means you never have to know the implementation details of other contracts to invoke them. You simply import the Solidity interface of the target contract, which can be auto-generated via the cargo stylus CLI tool.

tip
You can call contracts in any programming language with the Stylus SDK.

sol_interface!
This macro defines a struct for each of the Solidity interfaces provided.

sol_interface! {
    interface IService {
        function makePayment(address user) payable returns (string);
        function getConstant() pure returns (bytes32)
    }

    interface ITree {
        // other interface methods
    }
}

The above will define IService and ITree for calling the methods of the two contracts.

info
Currently only functions are supported, and any other items in the interface will cause an error.

For example, IService will have a make_payment method that accepts an Address and returns a B256.

pub fn do_call(&mut self, account: IService, user: Address) -> Result<String, Error> {
    account.make_payment(self, user)  // note the snake case
}

Observe the casing change. sol_interface! computes the selector based on the exact name passed in, which should almost always be CamelCase. For aesthetics, the rust functions will instead use snake_case.

Configuring gas and value with Call
Call lets you configure a call via optional configuration methods. This is similar to how one would configure opening a File in Rust.

pub fn do_call(account: IService, user: Address) -> Result<String, Error> {
    let config = Call::new_in()
        .gas(evm::gas_left() / 2)       // limit to half the gas left
        .value(msg::value());           // set the callvalue

    account.make_payment(config, user)
}

By default Call supplies all gas remaining and zero value, which often means Call::new_in() may be passed to the method directly. Additional configuration options are available in cases of reentrancy.

Reentrant calls
Contracts that opt into reentrancy via the reentrant feature flag require extra care. When the storage-cache feature is enabled, cross-contract calls must flush or clear the StorageCache to safeguard state. This happens automatically via the type system.

sol_interface! {
    interface IMethods {
        function pureFoo() external pure;
        function viewFoo() external view;
        function writeFoo() external;
        function payableFoo() external payable;
    }
}

#[public]
impl Contract {
    pub fn call_pure(&self, methods: IMethods) -> Result<(), Vec<u8>> {
        Ok(methods.pure_foo(self)?)    // `pure` methods might lie about not being `view`
    }

    pub fn call_view(&self, methods: IMethods) -> Result<(), Vec<u8>> {
        Ok(methods.view_foo(self)?)
    }

    pub fn call_write(&mut self, methods: IMethods) -> Result<(), Vec<u8>> {
        methods.view_foo(self)?;       // allows `pure` and `view` methods too
        Ok(methods.write_foo(self)?)
    }

    #[payable]
    pub fn call_payable(&mut self, methods: IMethods) -> Result<(), Vec<u8>> {
        methods.write_foo(Call::new_in(self))?;   // these are the same
        Ok(methods.payable_foo(self)?)            // ------------------
    }
}

In the above, we’re able to pass &self and &mut self because Contract implements TopLevelStorage, which means that a reference to it entails access to the entirety of the contract’s state. This is the reason it is sound to make a call, since it ensures all cached values are invalidated and/or persisted to state at the right time.

When writing Stylus libraries, a type might not be TopLevelStorage and therefore &self or &mut self won’t work. Building a Call from a generic parameter via new_in is the usual solution.

pub fn do_call(
    storage: &mut impl TopLevelStorage,  // can be generic, but often just &mut self
    account: IService,                   // serializes as an Address
    user: Address,
) -> Result<String, Error> {

    let config = Call::new_in(storage)   // take exclusive access to all contract storage
        .gas(evm::gas_left() / 2)        // limit to half the gas left
        .value(msg::value());            // set the callvalue

    account.make_payment(config, user)   // note the snake case
}

In the context of a #[public] call, the &mut impl argument will correctly distinguish the method as being write or payable. This means you can write library code that will work regardless of whether the reentrant feature flag is enabled.

Also, that code that previously compiled with reentrancy disabled may require modification in order to type-check. This is done to ensure storage changes are persisted and that the storage cache is properly managed before calls.

call, static_call, and delegate_call
Though sol_interface! and Call form the most common idiom to invoke other contracts, their underlying call and static_call are exposed for direct access.

let return_data = call(Call::new_in(self), contract, call_data)?;

In each case the calldata is supplied as a Vec<u8>. The return result is either the raw return data on success, or a call Error on failure.

delegate_call is also available, though it's unsafe and doesn't have a richly-typed equivalent. This is because a delegate call must trust the other contract to uphold safety requirements. Though this function clears any cached values, the other contract may arbitrarily change storage, spend ether, and do other things one should never blindly allow other contracts to do.

transfer_eth
This method provides a convenient shorthand for transferring ether.

note
This method invokes the other contract, which may in turn call others. All gas is supplied, which the recipient may burn. If this is not desired, the call function may be used instead.

transfer_eth(recipient, value)?;                 // these two are equivalent

call(Call::new_in().value(value), recipient, &[])?; // these two are equivalent

RawCall and unsafe calls
Occasionally, an untyped call to another contract is necessary. RawCall lets you configure an unsafe call by calling optional configuration methods. This is similar to how one would configure opening a File in Rust.

let data = RawCall::new_delegate()   // configure a delegate call
    .gas(2100)                       // supply 2100 gas
    .limit_return_data(0, 32)        // only read the first 32 bytes back
    .flush_storage_cache()           // flush the storage cache before the call
    .call(contract, calldata)?;      // do the call

note
The call method is unsafe when reentrancy is enabled. See flush_storage_cache and clear_storage_cache for more information.

RawDeploy and unsafe deployments
Right now the only way to deploy a contract from inside Rust is to use RawDeploy, similar to RawCall. As with RawCall, this mechanism is inherently unsafe due to reentrancy concerns, and requires manual management of the StorageCache.

note
That the EVM allows init code to make calls to other contracts, which provides a vector for reentrancy. This means that this technique may enable storage aliasing if used in the middle of a storage reference's lifetime and if reentrancy is allowed.

When configured with a salt, RawDeploy will use CREATE2 instead of the default CREATE, facilitating address determinism.



Recommended libraries
Using public Rust crates
Rust provides a package registry at crates.io, which lets developers conveniently access a plethora of open source libraries to utilize as dependencies in their code. Stylus Rust contracts can take advantage of these crates to simplify their development workflow.

While crates.io is a fantastic resource, many of these libraries were not designed with the constraints of a blockchain environment in mind. Some produce large binaries that exceed the 24KB compressed size limit of WASM smart contracts on Arbitrum. Many also take advantage of unsupported features such as:

Random numbers
Multi threading
Floating point numbers and operations
Using the standard Rust library often bloats contract sizes beyond the maximum size. For this reason, libraries designated as no_std are typically much stronger candidates for usage as a smart contract dependency. crates.io has a special tag for marking crates as no_std; however, it's not universally used. Still, it can be a good starting point for locating supported libraries. See "No standard library" crates for more details.

Curated crates
To save developers time on smart contract development for common dependencies, we've curated a list of crates and utilities that we found helpful. Keep in mind that we have not audited this code, and you should always be mindful about pulling dependencies into your codebase, whether they've been audited or not. We provide this list for you to use at your discretion and risk.

rust_decimal: Decimal number implementation written in pure Rust. Suitable for financial and fixed-precision calculations
special: The package provides special functions, which are mathematical functions with special names due to their common usage, such as sin, ln, tan, etc.
hashbrown: Rust port of Google's SwissTable hash map
time: Date and time library
hex: Encoding and decoding data into/from hexadecimal representation
We'll be adding more libraries to this list as we find them. Feel free to suggest an edit if you know of any great crates that would be generally useful here.




Using Stylus CLI
This guide will get you started using cargo stylus, a CLI toolkit to help developers manage, compile, deploy, and optimize their Stylus contracts efficiently.

This overview will help you discover and learn how to uses cargo stylus tools.

Installing cargo stylus
Cargo stylus is a plugin to the standard cargo tool for developing Rust programs.

Prerequisites
Rust toolchain
Docker
Foundry's Cast
Nitro devnode
Installation
In your terminal, run:

cargo install --force cargo-stylus

Add WASM (WebAssembly) as a build target for the specific Rust toolchain you are using. The below example sets your default Rust toolchain to 1.80 as well as adding the WASM build target:

rustup default 1.80
rustup target add wasm32-unknown-unknown --toolchain 1.80

You can verify the cargo stylus installation by running cargo stylus -V in your terminal, returning something like:stylus 0.5.6

Using cargo stylus
Cargo Stylus Commands Reference
Command	Description	Arguments	Options	Example Usage
new	Create a new Stylus project	• name: Project name (required)	• --minimal: Create a minimal contract	cargo stylus new <YOUR_PROJECT_NAME>
init	Initialize a Stylus project in current directory		• --minimal: Create a minimal contract	cargo stylus init --minimal
export-abi	Export a Solidity ABI		• --output: Output file (defaults to stdout)
• --json: Write JSON ABI using solc	cargo stylus export-abi --json
activate	Activate an already deployed contract	• --address: Contract address to activate	• --data-fee-bump-percent: Percent to bump estimated fee (default 20%)
• --estimate-gas: Only estimate gas without sending transaction	cargo stylus activate --address <CONTRACT_ADDRESS>
cache	Cache contract using Stylus CacheManager	• bid: Place bid on contract
• status: Check contract status
• suggest-bid: Get suggested minimum bid		cargo stylus cache bid --address <CONTRACT_ADDRESS>
check	Check a contract		• --wasm-file: WASM file to check
• --contract-address: Deployment address	
deploy	Deploy a contract	• --contract-address <CONTRACT_ADDRESS>: Where to deploy and activate the contract (defaults to a random address)	• --estimate-gas: Only perform estimation
• --no-verify: Skip reproducible container
• --cargo-stylus-version: Version for Docker image
• --source-files-for-project-hash <SOURCE_FILES_FOR_PROJECT_HASH>: Path to source files to include in the project hash
• --max-fee-per-gas-gwei <MAX_FEE_PER_GAS_GWEI>: Optional max fee per gas in gwei units
• --wasm-file <WASM_FILE>: The WASM file to check (defaults to any found in the current directory)	cargo stylus deploy --endpoint='http://localhost:8547' --private-key="<PRIVATE_KEY>" --estimate-gas
verify	Verify contract deployment	• --deployment-tx: Hash of deployment transaction	• --no-verify: Skip reproducible container
• --cargo-stylus-version: Version for Docker image	
cgen	Generate C code bindings	• --input: Input file path
• --out_dir: Output directory path		
replay	Replay transaction in GDB	• -t, --tx <TX>: Transaction to replay	• -p, --project <PROJECT>: Project path (default: .)
• -u, --use-native-tracer: Use the native tracer instead of the JavaScript one (may not be available in the node)
• -s, --stable-rust: Use stable Rust (note that nightly is needed to expand macros)	cargo stylus replay --tx <TX>
trace	Trace a transaction	• --tx: Transaction hash	• --endpoint: RPC endpoint
• --project: Project path
• --use-native-tracer: Use native tracer	
Common options
These options are available across multiple commands:

Option	Description
--endpoint	Arbitrum RPC endpoint (default: http://localhost:8547)
--verbose	Print debug info
--source-files-for-project-hash	Paths to source files for project hash
--max-fee-per-gas-gwei	Optional max fee per gas in gwei
Authentication options
Available for commands involving transactions:

Option	Description
--private-key-path	Path to file containing hex-encoded private key
--private-key	Private key as hex string (exposes to shell history)
--keystore-path	Path to Ethereum wallet keystore file
--keystore-password-path	Keystore password file path
How-tos
Topic	Description
Learn how to optimize WASM binaries	The cargo-stylus tool allows you to optimize WebAssembly (WASM) binaries, ensuring that your contracts are as efficient as possible.
Debug Stylus transactions	A guide to debugging transactions, helping you identify and fix issues. Gain insights into your Stylus contracts by debugging transactions.
Verify contracts	Ensure that your Stylus contracts are correctly verified. Step-by-step instructions on how to verify your contracts using cargo-stylus.
Run a Stylus dev node	Learn how to run a local Arbitrum dev node to test your Stylus contracts.
Additional resources
Troubleshooting: solve the most common issues.
cargo-stylus repository: consult cargo stylus' source code.




How to debug Stylus transactions using Cargo Stylus Replay
Debugging smart contracts can be challenging, especially when dealing with complex transactions. The cargo-stylus crate simplifies the debugging process by allowing developers to replay Stylus transactions. This tool leverages GDB to provide an interactive debugging experience, enabling developers to set breakpoints, inspect state changes, and trace the execution flow step-by-step. This capability is crucial for identifying and resolving issues, ensuring that smart contracts function correctly and efficiently.

Overview
Cargo Stylus is a tool designed to simplify the development and debugging process for smart contracts written in Rust for the Stylus execution environment. One of its powerful features is the cargo stylus subcommand, which provides essential functionalities for developers:

Trace transactions: Perform trace calls against Stylus transactions using Ethereum nodes' debug_traceTransaction RPC. This feature enables developers to analyze the execution flow and state changes of their transactions in a detailed manner.
Debugging with GDB or LLDB: Replay and debug the execution of a Stylus transaction using a debugger. This allows developers to set breakpoints, inspect variables, and step through the transaction execution line by line, providing an in-depth understanding of the transaction's behavior.
Replaying transactions
Requirements
Rust (version 1.77 or higher)
Crate: cargo-stylus
GNU Debugger (GDB) (Linux) or LLDB (MacOS)
Cast (an Ethereum CLI tool)
Arbitrum RPC Provider with tracing endpoints enabled or a local Stylus dev node
cargo stylus replay allows users to debug the execution of a Stylus transaction using GDB or LLDB against the Rust source code.

Installation and setup
Install the required crates and debugger: First, let's ensure that the following crates are installed:
cargo install cargo-stylus

If on Linux, install GDB if it's not already installed:

sudo apt-get install gdb

If on MacOS, install LLDB if it's not already installed:

xcode-select --install

Deploy your Stylus contract: For this guide, we demonstrate how to debug the execution of the increment() method in the stylus-hello-world smart contract. In Rust, it looks something like this, within src/lib.rs:
#[external]
impl Counter {
    ...
    /// Increments number and updates its value in storage.
    pub fn increment(&mut self) {
        let number = self.number.get();
        self.set_number(number + U256::from(1));
    }
    ...
}

Set your RPC endpoint to a node with tracing enabled and your private key:

export RPC_URL=...
export PRIV_KEY=...

and deploy your contract:

cargo stylus deploy --private-key=$PRIV_KEY --endpoint=$RPC_URL

You should see an output similar to:

contract size: 4.0 KB
wasm size: 12.1 KB
contract size: 4.0 KB
deployed code at address: 0x2c8d8a1229252b07e73b35774ad91c0b973ecf71
wasm already activated!

Send a transaction: First, set the address of the deployed contract as an environment variable:
export ADDR=0x2c8d8a1229252b07e73b35774ad91c0b973ecf71

And send a transaction using Cast:

cast send --rpc-url=$RPC_URL --private-key=$PRIV_KEY $ADDR "increment()"

Replay the transaction with the debugger: Now, we can replay the transaction with cargo stylus and the debugger to inspect each step of it against our source code. Make sure GDB is installed and that you are on a Linux, x86 system. Also, you should set the transaction hash as an environment variable:
export TX_HASH=0x18b241841fa0a59e02d3c6d693750ff0080ad792204aac7e5d4ce9e20c466835

And replay the transaction:

cargo stylus replay --tx=$TX_HASH --endpoint=$RPC_URL --use-native-tracer

Options:

--tx: Specifies the transaction hash to replay.
--endpoint: Specifies the RPC endpoint for fetching transaction data.
--use-native-tracer: Uses the native Stylus tracer instead of the default JS tracer. The native tracer has broader support from RPC providers.


note
The --use-native-tracer flag uses stylusTracer instead of jsTracer, which is required for tracing Stylus transactions on most RPC providers. See more details below.

The debugger will load and set a breakpoint automatically at the user_entrypoint internal Stylus function. While the examples below showcase GDB commands, you can find the LLDB equivalents here.

[Detaching after vfork from child process 370003]

Thread 1 "cargo-stylus" hit Breakpoint 1, stylus_hello_world::user_entrypoint (len=4) at src/lib.rs:38
38	    #[entrypoint]
(gdb)

Debugging: Now, set a breakpoint at the increment() method:
(gdb) b stylus_hello_world::Counter::increment
Breakpoint 2 at 0x7ffff7e4ee33: file src/lib.rs, line 69.

Then, type c to continue the execution and you will reach that line where increment is called:

(gdb) c

Once you reach the increment method, inspect the state:

Thread 1 "cargo-stylus" hit Breakpoint 2, stylus_hello_world::Counter::increment (self=0x7fffffff9ae8) at src/lib.rs:69
69	        let number = self.number.get();
(gdb) p number

Trace a transaction
For traditional tracing, cargo stylus supports calls to debug_traceTransaction. To trace a transaction, you can use the following command:

cargo stylus trace [OPTIONS] --tx <TX> --use-native-tracer

Options:

  -e, --endpoint <ENDPOINT>  RPC endpoint [default: http://localhost:8547]
  -t, --tx <TX>              Tx (transaction) to replay
  -p, --project <PROJECT>    Project path [default: .]
  -h, --help                 Print help
  -V, --version              Print version
      --use-native-tracer    Uses the native Stylus tracer instead of the default JS tracer. The native tracer has broader support from RPC providers.


Run the following command to obtain a trace output:

cargo stylus trace --tx=$TX_HASH --endpoint=$RPC_URL --use-native-tracer

This will produce a trace of the functions called and ink left along each method:

[{"args":[0,0,0,4],"endInk":846200000,"name":"user_entrypoint","outs":[],"startInk":846200000},{"args":[],"endInk":846167558,"name":"msg_reentrant","outs":[0,0,0,0],"startInk":846175958},{"args":[],"endInk":846047922,"name":"read_args","outs":[208,157,224,138],"startInk":846061362},{"args":[],"endInk":845914924,"name":"msg_value","outs":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"startInk":845928364},{"args":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"endInk":227196069,"name":"storage_load_bytes32","outs":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"startInk":844944549},{"args":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],"endInk":226716083,"name":"storage_cache_bytes32","outs":[],"startInk":226734563},{"args":[0],"endInk":226418732,"name":"storage_flush_cache","outs":[],"startInk":226486805},{"args":[],"endInk":226362319,"name":"write_result","outs":[],"startInk":226403481},{"args":[],"endInk":846200000,"name":"user_returned","outs":[0,0,0,0],"startInk":846200000}]


RPC endpoint compatibility
Both cargo stylus trace and cargo stylus replay require an RPC endpoint that supports debug_traceTransaction. By default, the jsTracer type is used, which is not supported by most RPC providers. If the --use-native-tracer flag is used, the stylusTracer type is used, which is supported by many RPC providers. Both jsTracer and stylusTracer are available on local nodes, but stylusTracer is more efficient. See this list of RPC providers for tracing support.




Testing Smart Contracts with Stylus
Introduction
The Stylus SDK provides a robust testing framework that allows developers to write and run tests for their contracts directly in Rust without deploying to a blockchain. This guide will walk you through the process of writing and running tests for Stylus contracts using the built-in testing framework.

The Stylus testing framework allows you to:

Simulate a complete Ethereum environment for your tests without the need for running a test node
Test contract storage operations and state transitions
Mock transaction context and block information
Test contract-to-contract interactions with mocked calls
Verify contract logic without deployment costs or delays
Simulate various user scenarios and edge cases
Prerequisites
Before you begin, make sure you have:

Basic familiarity with Rust and smart contract development
Understanding of unit testing concepts
Rust toolchain: follow the instructions on Rust Lang's installation page to install a complete Rust toolchain (v1.81 or newer) on your system. After installation, ensure you can access the programs rustup, rustc, and cargo from your preferred terminal application.
The Stylus Testing Framework
The Stylus SDK includes testing, a module that provides all the tools you need to test your contracts. This module includes:

TestVM: A mock implementation of the Stylus VM that can simulate all host functions
TestVMBuilder: A builder pattern to conveniently configure the test VM
Built-in utilities for mocking calls, storage, and other EVM operations
Key Components
Here are the components you'll use when testing your Stylus contracts:

TestVM: The core component that simulates the Stylus execution environment
Storage accessors: For testing contract state changes
Call mocking: For simulating interactions with other contracts
Block context: For testing time-dependent logic
Example Smart Contract: Cupcake Vending Machine
Let's look at a Rust-based cupcake vending machine smart contract. This contract follows two simple rules:

The vending machine will distribute a cupcake to anyone who hasn't received one in the last 5 seconds
The vending machine tracks each user's cupcake balance
Note
You can find all the code in this tutorial as a Rust workspace in the Quickstart repo

Cupcake Vending Machine Contract
Writing Tests for the Vending Machine
Now, let's write tests for our vending machine contract using the Stylus testing framework. We'll create tests that verify:

Users can get an initial cupcake
Users must wait 5 seconds between cupcakes
Cupcake balances are tracked correctly
The contract state updates properly
Test Structure
Create a test file using standard Rust test patterns. Here's the basic structure:

// Import necessary dependencies
#[cfg(test)]
mod test {
    use super::*;
    use alloy_primitives::address;
    use stylus_sdk::testing::*;

    #[test]
    fn test_give_cupcake_to() {
    // Set up test environment
    let vm = TestVM::default();
    // Initialize your contract
    let mut contract = VendingMachine::from(&vm);

    // Test logic goes here...
}

Using the TestVM
The TestVM simulates the execution environment for your contract, removing the need to run your tests against a test node. The TestVM allows you to control aspects like:

Block timestamp and number
Account balances
Transaction value and sender
Storage state
Let's create a test suite that covers all aspects of our contract, we'll go over the code features one by one:

Test Vending Machine Contract
TestVM: advanced use
This test shows how you can use advanced configuration and usage of the TestVM by creating and configuring a TestVM with custom parameters:

Setting blockchain state (timestamps, block numbers)
Interacting with contract methods
Taking and inspecting VM state snapshots
Mocking external contract calls
Testing time-dependent contract behavior
Testing logs
Advanced TestVM Configuration
Here is a cargo.toml file to add the required dependencies:

cargo.toml
You can find the example above in the stylus-quickstart-vending-machine git repository.

Running Tests
To run your tests, you can use the standard Rust test command:

cargo test

Or with the cargo-stylus CLI tool:

To run a specific test:

cargo test test_give_cupcake

Testing Best Practices
Test Isolation

Create a new TestVM instance for each test
Avoid relying on state from previous tests
Comprehensive Coverage

Test both success and error conditions
Test edge cases and boundary conditions
Verify all public functions and important state transitions
Clear Assertions

Use descriptive error messages in assertions
Make assertions that verify the actual behavior you care about
Realistic Scenarios

Test real-world usage patterns
Include tests for authorization and access control
Gas and Resource Efficiency

For complex contracts, consider testing gas usage patterns
Look for storage optimization opportunities
Migrating from Global Accessors to VM Accessors
As of Stylus SDK 0.8.0, there's a shift away from global host function invocations to using the .vm() method. This is a safer approach that makes testing easier. For example:

// Old style (deprecated)
let timestamp = block::timestamp();

// New style (preferred)
let timestamp = self.vm().block_timestamp();

To make your contracts more testable, make sure they access host methods through the HostAccess trait with the .vm() method.




How to verify contracts for Stylus contracts
caution
This page will walk you through how to verify your Stylus contracts locally. Stylus contract verification is also available on Arbiscan. Please note, however, that Stylus contract verification on Arbiscan is only supported for Stylus contracts deployed using cargo-stylus 0.5.0 or higher.

Background
Stylus contracts written in Rust and deployed onchain can be verified against a local codebase by using the cargo stylus tool.

Goals
To ensure Stylus contract deployments are reproducible by anyone who is running the same architecture as the deployed item
To sandbox the reproducible environment and standardize it as much as possible to prevent foot guns
To guarantee that programs reproducibly deployed with a cargo stylus version >= 0.4.2 are verifiable
Opting out
By default, cargo stylus deploy is reproducible as it runs in a Docker container. Users can opt-out by specifying --no-verify as a flag.

Reproducible deployments
Required knowledge and setup:

System architecture of your host computer (x86 / ARM)
The git commit of your project used for deployment
A Rust stylus project, such as OffchainLabs/stylus-hello-world which contains a rust-toolchain.toml file
Your cargo stylus version (run cargo stylus --version to obtain this value)
Docker installed and running on your machine
Your project's toolchain file must contain the Rust version you wish to use for your deployment, such as major.minor.patch

[toolchain]
channel = "1.79.0"

It cannot be stable, nightly, or beta by itself, as a specific version must be added. For instance, you can specify nightly-YYYY-MM-DD or major.minor.patch for your channel. This is so that deployments have a very specific version to prevent potential mismatches from being more generic.

# Replace {PRIV_KEY} with your actual private key or set it as a local variable
cargo stylus deploy --private-key={PRIV_KEY} --verbose

Upon completion, you will obtain the deployment transaction hash:

deployment tx hash: 0x1d8ae97e245e1db21dd188e5b64ad9025c1fb4e5f82a8d38bc8ae2b7a387600b

Save this transaction hash, as verifiers will need it.

Reproducible verification
To verify a program, the verifier will need Docker installed and also know:

System architecture the deployer used (x86 / ARM). Note: ARM devices that can emulate x86, such as Mac M series via Rosetta, can verify x86 Stylus deployments
The git commit of the project the deployer used
Your cargo stylus version the deployer used
The deployment transaction hash
Navigate to the project's directory and check out the git commit that was used at deployment. Ensure your cargo stylus --version matches what the deployer used.

# Replace {DEPLOYMENT_TX_HASH} with the actual DEPLOYMENT_TX_HASH or set it as a local variable
cargo stylus verify --deployment-tx={DEPLOYMENT_TX_HASH}

This command will run the verification pipeline through a Docker environment, recreate the project metadata hash, and verify that the deployed program matches what the command reconstructed locally.

How it works
On deployment, a keccak256 hash is created from the contents of all Rust source files in the project, sorted by file path, along with a rust-toolchain.toml, Cargo.toml and Cargo.lock files by default. This hash is injected in as a custom section of the user WASM's code. This means all data in the source files will be used for reproducible verification of a Stylus contract, including code comments.

This means the codehash onchain of the program will change due to this deployment metadata hash.

The verification routine fetches the deployment transaction by hash via RPC, then attempts to build the local project to reconstruct the deployment init code and WASM using cargo build. It then checks that the deployment transaction data matches the created init code.

Important details
Docker image The docker container used for reproducibility standardizes all builds to x86, and it looks like this:

FROM --platform=linux/amd64 rust:1.79 as builder
RUN rustup toolchain install $VERSION-x86_64-unknown-linux-gnu
RUN rustup default $VERSION-x86_64-unknown-linux-gnu
RUN rustup target add wasm32-unknown-unknown
RUN rustup target add wasm32-wasi
RUN rustup target add x86_64-unknown-linux-gnu
RUN cargo install cargo-stylus

The docker container uses the rust:1.79 version as a base for all projects. This will install cargo tooling and rust targets, but the toolchain actually used for compilation will be specified by the project being deployed in its rust-toolchain.toml file.

For instance, a future toolchain can be used despite the base image being 1.79, as when cargo stylus is installed, it will use that particular toolchain. Future cargo stylus updates could update this base image but may not impact the compiled WASM as the image will be using the specified toolchain. However, this is why knowing the specific cargo stylus version used for the reproducible verification from the deployer is important.

The build toolchain

All verifiable Stylus contracts in Rust must have a standard rust-toolchain.toml file which specifies the channel for their deployment. It cannot be stable, nightly, or beta by itself, as a specific version must be added. For instance, you can specify nightly-YYYY-MM-DD or major.minor.patch for your channel. This is so that deployments have a very specific version to prevent potential mismatches from being more generic.




Caching contracts with Stylus
Stylus is designed for fast computation and efficiency. However, the initialization process when entering a contract can be resource-intensive and time-consuming.

This initialization process, if repeated frequently, may lead to inefficiencies. To address this, we have implemented a caching strategy. By storing frequently accessed contracts in memory, we can avoid repeated initializations. This approach saves resources and time, significantly enhancing the speed and efficiency of contract execution.

CacheManager contract
The core component of our caching strategy is the CacheManager contract. This smart contract manages the cache, interacts with precompiles, and determines which contracts should be cached. The CacheManager can hold approximately 4,000 contracts in memory.

The CacheManager defines how contracts remain in the cache and how they compete with other contracts for cache space. Its primary purpose is to reduce high initialization costs, ensuring efficient contract activation and usage. The contract includes methods for adding and removing cache entries, querying the status of cached contracts, and managing the lifecycle of cached data.

Key features
The CacheManager plays a crucial role in our caching strategy by keeping a specific set of contracts in memory rather than retrieving them from disk. This significantly reduces the activation time for frequently accessed contracts. The CacheManager contract is an onchain contract that accepts bids for inserting contract code into the cache. It then calls a precompile that loads or unloads the contracts in the ArbOS cache, which follows the onchain cache but operates locally in the client and marks the contract as in or out of the cache in the ArbOS state.

The cache operates through an auction system where dApp developers submit bids to insert their contracts into the cache. If the cache is at capacity, lower bids are evicted to make space for higher bids. The cache maintains a minimum heap of bids for codeHashes, with bids encoded as bid << 64 + index, where index represents the position in the list of all bids. When an insertion exceeds the cache's maximum size, items are popped off the minimum heap and deleted until there is enough space to insert the new item. Contracts with equal bids will be popped in a random order, while the smallest bid is evicted first.

To ensure that developers periodically pay to maintain their position in the cache, we use a global decay parameter computed by decay = block.timestamp * _decay. This inflates the value of bids over time, making newer bids more valuable.

Cache access and costs
During activation, we compute the contract's initialization costs for both non-cached and cached initialization. These costs take into account factors such as the number of functions, types, code size, data length, and memory usage. It's important to note that accessing an uncached contract does not automatically add it to the CacheManager's cache. Only explicit calls to the CacheManager contract will add a contract to the cache. If a contract is removed from the cache, calling the contract becomes more expensive unless it is re-added.

To see how much gas contract initialization would cost, you need to call programInitGas(address) from the ArbWasm precompile. This function returns both the initialization cost when the contract is cached and when it is not.

How to use the CacheManager API
This section provides a practical guide for interacting with the CacheManager contract API, either directly or through the cargo stylus command-line tool.

Step 1: Determine the minimum bid
Before placing a bid, it's important to know the minimum bid required to cache the Stylys contract. This can be done using the getMinBid function, or using the cargo stylus cache suggest-bid command.

Method 1: Direct smart contract call
uint192 minBid = cacheManager.getMinBid(contractAddress);

Method 2: Cargo stylus command
Here, the [contractAddress] is the address of the Stylus contract you want to cache.

cargo stylus cache suggest-bid [contractAddress]

Step 2: Place a bid
You can place a bid using either of the following methods:

Method 1: Direct smart contract call
Here, bidAmount is the amount you want to bid, and contractAddress is the address of the Stylus contract you're bidding for.

cacheManager.placeBid{value: bidAmount}(contractAddress);

Method 2: Cargo stylus command
You can place a bid using the cargo stylus cache bid command:

cargo stylus cache bid <--private-key-path <PRIVATE_KEY_PATH>|--private-key <PRIVATE_KEY>|--keystore-path <KEYSTORE_PATH>> [contractAddress] [bidAmount]


[contractAddress]: The address of the Stylus contract you want to cache.
[bidAmount]: The amount you want to bid. If not specified, the default bid is 0.
If you specify a bid amount using cargo stylus, it will automatically validate that the bid is greater than or equal to the result of the getMinBid function. If the bid is insufficient, the command will fail, ensuring that only valid bids are placed.

Step 3: Check cache status
To check if a specific address is cached, you can use the cargo stylus status command:

cargo stylus cache status --address=[contractAddress]

Additional information
Pausing Bids: The CacheManager contract has an isPaused state that can be toggled by the owner to prevent or allow new bids.
Checking Cache Size: You can monitor the current cache size and decay rate using the getCacheSize and getDecayRate functions respectively.
By following these steps, you can effectively interact with the CacheManager contract, either directly through smart contract calls or using the cargo stylus command-line tool. This ensures that your bids meet the necessary requirements for caching programs on the network, optimizing your contracts for faster and more efficient execution.




How to verify Stylus contracts on Arbiscan
This how-to will show you how to verify deployed contracts using Arbiscan, Arbitrum's block explorer.

Here's an example of a verified contract: the English Auction Stylus contract, which has been verified on Arbitrum Sepolia. You can view the verified contract here.

You can also see a list of all Stylus contracts verified on Arbiscan by visiting:

Verified Stylus Contracts on Arbitrum One.
Verified Stylus Contracts on Arbitrum Sepolia.
Here are the steps to take to verify a contract on Arbiscan:

Step 1: Navigate to the verification page
You have two options to access the contract verification page on Arbiscan:

Direct link: Visit Arbiscan Verify Contract to go directly to the verification form. This option is ideal if you already have the contract address and details ready.
From the contract page: If you're viewing the contract's page on Arbiscan:
Go to the Contract tab.
Click on Verify and Publish.
Verify through the contract page
Both methods will take you to the contract verification form, where you can proceed to the next step.

Step 2: Enter the contract's details
You will need to fill in the following fields on the contract verification page:

Contract address: Enter the contract address you want to verify.
Compiler type: Select Stylus for Stylus contracts.
Compiler version: Choose the cargo stylus version that was used to deploy the contract.
Open source license type: Select the appropriate license for your contract.
Enter contract details
Step 3: Submit source code
After entering the contract details, you’ll need to provide the contract's source code:

Manual submission: Copy and paste the source code into the provided text box.
Fetch from GitHub (Recommended): It's recommended to use the Fetch from Git option, as it's easier and helps automate the process. However, note that contracts located in subdirectories of the repository cannot be verified. Ensure that the contract's code is placed directly in the repository's root for verification to succeed.
Fetch source code
Step 4: Set EVM version
The EVM Version to Target can be left as default unless specific requirements dictate otherwise.

Verify and publish
Step 5: Verify and publish
Click Verify and Publish. The verification process will take a few seconds. Refresh the contract page, and if successful, the contract will be marked as verified.

Verified
Behavior when deploying a verified contract
When deploying another instance of a previously verified contract, if the bytecode matches, Arbiscan will automatically link the new instance to the verified source code, displaying a message like:

"This contract matches the deployed Bytecode of the Source Code for Contract [verified contract address]."

However, the new contract will still appear as "Not Verified" until you explicitly verify it.





How to optimize Stylus WASM binaries
To be deployed onchain, the size of your uncompressed WebAssembly (WASM) file must not exceed 128Kb, while the compressed binary must not exceed 24KB. Stylus conforms with the same contract size limit as the EVM to remain fully interoperable with all smart contracts on Arbitrum chains.

cargo-stylus, the Stylus CLI tool, automatically compresses your WASM programs, but there are additional steps that you can take to further reduce the size of your binaries.

Your options fall into two categories: Rust compiler flags, and third-party optimization tools.

Rust compiler flags
The Rust compiler supports various config options for shrinking binary sizes.

Cargo.toml
[profile.release]
codegen-units = 1        # prefer efficiency to compile time
panic = "abort"          # use simple panics
opt-level = "z"          # optimize for size ("s" may also work)
strip = true             # remove debug info
lto = true               # link time optimization
debug = false            # no debug data
rpath = false            # no run-time search path
debug-assertions = false # prune debug assertions
incremental = false      # no incremental builds

Third-party optimization tooling
Additional WASM-specific tooling exists to shrink binaries. Due to being third party, users should use these at their own risk.

wasm-opt
wasm-opt applies techniques to further reduce binary size, usually netting around 10%.

twiggy
twiggy is a code size profiler for WASM, it can help you estimate the impact of each added component on your binaries' size.

Our team has also curated a list of recommended libraries that are helpful to Stylus development and optimally sized.

Frequently asked questions
Will future releases of Stylus introduce additional optimizations?
Yes! We're actively working on improving WASM sizes generated by Rust code with the Stylus SDK.

Why don't I have to worry about this type of optimization when I use cargo without using Stylus?
On modern platforms, tools like cargo don’t have to worry about the size of the binaries they produce. This is because there’s many orders of magnitude more storage available than even the largest of binaries, and for most applications it’s media like images and videos that constitutes the majority of the footprint.

Resource constraints when building on blockchains are extremely strict. Hence, while not the default option, tooling often provides mechanisms for reducing binary bloat, such as the options outlined in this document.





ERC-20
Any contract that follows the ERC-20 standard is an ERC-20 token.

ERC-20 tokens provide functionalities to

transfer tokens
allow others to transfer tokens on behalf of the token holder
Here is the interface for ERC-20.

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount)
        external
        returns (bool);
    function allowance(address owner, address spender)
        external
        view
        returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount)
        external
        returns (bool);
}

Example implementation of an ERC-20 token contract written in Rust.

src/erc20.rs
note
This code has yet to be audited. Please use at your own risk.

//! Implementation of the ERC-20 standard
//!
//! The eponymous [`Erc20`] type provides all the standard methods,
//! and is intended to be inherited by other contract types.
//!
//! You can configure the behavior of [`Erc20`] via the [`Erc20Params`] trait,
//! which allows specifying the name, symbol, and decimals of the token.
//!
//! Note that this code is unaudited and not fit for production use.

// Imported packages
use alloc::string::String;
use alloy_primitives::{Address, U256};
use alloy_sol_types::sol;
use core::marker::PhantomData;
use stylus_sdk::{
    evm,
    msg,
    prelude::*,
};

pub trait Erc20Params {
    /// Immutable token name
    const NAME: &'static str;

    /// Immutable token symbol
    const SYMBOL: &'static str;

    /// Immutable token decimals
    const DECIMALS: u8;
}

sol_storage! {
    /// Erc20 implements all ERC-20 methods.
    pub struct Erc20<T> {
        /// Maps users to balances
        mapping(address => uint256) balances;
        /// Maps users to a mapping of each spender's allowance
        mapping(address => mapping(address => uint256)) allowances;
        /// The total supply of the token
        uint256 total_supply;
        /// Used to allow [`Erc20Params`]
        PhantomData<T> phantom;
    }
}

// Declare events and Solidity error types
sol! {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    error InsufficientBalance(address from, uint256 have, uint256 want);
    error InsufficientAllowance(address owner, address spender, uint256 have, uint256 want);
}

/// Represents the ways methods may fail.
#[derive(SolidityError)]
pub enum Erc20Error {
    InsufficientBalance(InsufficientBalance),
    InsufficientAllowance(InsufficientAllowance),
}

// These methods aren't exposed to other contracts
// Methods marked as "pub" here are usable outside of the erc20 module (i.e. they're callable from lib.rs)
// Note: modifying storage will become much prettier soon
impl<T: Erc20Params> Erc20<T> {
    /// Movement of funds between 2 accounts
    /// (invoked by the external transfer() and transfer_from() functions )
    pub fn _transfer(
        &mut self,
        from: Address,
        to: Address,
        value: U256,
    ) -> Result<(), Erc20Error> {
        // Decreasing sender balance
        let mut sender_balance = self.balances.setter(from);
        let old_sender_balance = sender_balance.get();
        if old_sender_balance < value {
            return Err(Erc20Error::InsufficientBalance(InsufficientBalance {
                from,
                have: old_sender_balance,
                want: value,
            }));
        }
        sender_balance.set(old_sender_balance - value);

        // Increasing receiver balance
        let mut to_balance = self.balances.setter(to);
        let new_to_balance = to_balance.get() + value;
        to_balance.set(new_to_balance);

        // Emitting the transfer event
        evm::log(Transfer { from, to, value });
        Ok(())
    }

    /// Mints `value` tokens to `address`
    pub fn mint(&mut self, address: Address, value: U256) -> Result<(), Erc20Error> {
        // Increasing balance
        let mut balance = self.balances.setter(address);
        let new_balance = balance.get() + value;
        balance.set(new_balance);

        // Increasing total supply
        self.total_supply.set(self.total_supply.get() + value);

        // Emitting the transfer event
        evm::log(Transfer {
            from: Address::ZERO,
            to: address,
            value,
        });

        Ok(())
    }

    /// Burns `value` tokens from `address`
    pub fn burn(&mut self, address: Address, value: U256) -> Result<(), Erc20Error> {
        // Decreasing balance
        let mut balance = self.balances.setter(address);
        let old_balance = balance.get();
        if old_balance < value {
            return Err(Erc20Error::InsufficientBalance(InsufficientBalance {
                from: address,
                have: old_balance,
                want: value,
            }));
        }
        balance.set(old_balance - value);

        // Decreasing the total supply
        self.total_supply.set(self.total_supply.get() - value);

        // Emitting the transfer event
        evm::log(Transfer {
            from: address,
            to: Address::ZERO,
            value,
        });

        Ok(())
    }
}

// These methods are external to other contracts
// Note: modifying storage will become much prettier soon
#[public]
impl<T: Erc20Params> Erc20<T> {
    /// Immutable token name
    pub fn name() -> String {
        T::NAME.into()
    }

    /// Immutable token symbol
    pub fn symbol() -> String {
        T::SYMBOL.into()
    }

    /// Immutable token decimals
    pub fn decimals() -> u8 {
        T::DECIMALS
    }

    /// Total supply of tokens
    pub fn total_supply(&self) -> U256 {
        self.total_supply.get()
    }

    /// Balance of `address`
    pub fn balance_of(&self, owner: Address) -> U256 {
        self.balances.get(owner)
    }

    /// Transfers `value` tokens from msg::sender() to `to`
    pub fn transfer(&mut self, to: Address, value: U256) -> Result<bool, Erc20Error> {
        self._transfer(msg::sender(), to, value)?;
        Ok(true)
    }

    /// Transfers `value` tokens from `from` to `to`
    /// (msg::sender() must be able to spend at least `value` tokens from `from`)
    pub fn transfer_from(
        &mut self,
        from: Address,
        to: Address,
        value: U256,
    ) -> Result<bool, Erc20Error> {
        // Check msg::sender() allowance
        let mut sender_allowances = self.allowances.setter(from);
        let mut allowance = sender_allowances.setter(msg::sender());
        let old_allowance = allowance.get();
        if old_allowance < value {
            return Err(Erc20Error::InsufficientAllowance(InsufficientAllowance {
                owner: from,
                spender: msg::sender(),
                have: old_allowance,
                want: value,
            }));
        }

        // Decreases allowance
        allowance.set(old_allowance - value);

        // Calls the internal transfer function
        self._transfer(from, to, value)?;

        Ok(true)
    }

    /// Approves the spenditure of `value` tokens of msg::sender() to `spender`
    pub fn approve(&mut self, spender: Address, value: U256) -> bool {
        self.allowances.setter(msg::sender()).insert(spender, value);
        evm::log(Approval {
            owner: msg::sender(),
            spender,
            value,
        });
        true
    }

    /// Returns the allowance of `spender` on `owner`'s tokens
    pub fn allowance(&self, owner: Address, spender: Address) -> U256 {
        self.allowances.getter(owner).get(spender)
    }
}

lib.rs
// Only run this as a WASM if the export-abi feature is not set.
#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;

// Modules and imports
mod erc20;

use alloy_primitives::{Address, U256};
use stylus_sdk::{
    msg,
    prelude::*
};
use crate::erc20::{Erc20, Erc20Params, Erc20Error};

/// Immutable definitions
struct StylusTokenParams;
impl Erc20Params for StylusTokenParams {
    const NAME: &'static str = "StylusToken";
    const SYMBOL: &'static str = "STK";
    const DECIMALS: u8 = 18;
}

// Define the entrypoint as a Solidity storage object. The sol_storage! macro
// will generate Rust-equivalent structs with all fields mapped to Solidity-equivalent
// storage slots and types.
sol_storage! {
    #[entrypoint]
    struct StylusToken {
        // Allows erc20 to access StylusToken's storage and make calls
        #[borrow]
        Erc20<StylusTokenParams> erc20;
    }
}

#[public]
#[inherit(Erc20<StylusTokenParams>)]
impl StylusToken {
    /// Mints tokens
    pub fn mint(&mut self, value: U256) -> Result<(), Erc20Error> {
        self.erc20.mint(msg::sender(), value)?;
        Ok(())
    }

    /// Mints tokens to another address
    pub fn mint_to(&mut self, to: Address, value: U256) -> Result<(), Erc20Error> {
        self.erc20.mint(to, value)?;
        Ok(())
    }

    /// Burns tokens
    pub fn burn(&mut self, value: U256) -> Result<(), Erc20Error> {
        self.erc20.burn(msg::sender(), value)?;
        Ok(())
    }
}


Cargo.toml
[package]
name = "stylus_erc20_example"
version = "0.1.7"
edition = "2021"
license = "MIT OR Apache-2.0"
keywords = ["arbitrum", "ethereum", "stylus", "alloy"]

[dependencies]
alloy-primitives = "=0.7.6"
alloy-sol-types = "=0.7.6"
mini-alloc = "0.4.2"
stylus-sdk = "0.6.0"
hex = "0.4.3"

[dev-dependencies]
tokio = { version = "1.12.0", features = ["full"] }
ethers = "2.0"
eyre = "0.6.8"

[features]
export-abi = ["stylus-sdk/export-abi"]

[lib]
crate-type = ["lib", "cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"






ERC-721
Any contract that follows the ERC-721 standard is an ERC-721 token.

Here is the interface for ERC-721.

interface ERC721 {
    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

    function balanceOf(address _owner) external view returns (uint256);
    function ownerOf(uint256 _tokenId) external view returns (address);
    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes data) external payable;
    function safeTransferFrom(address _from, address _to, uint256 _tokenId) external payable;
    function transferFrom(address _from, address _to, uint256 _tokenId) external payable;
    function approve(address _approved, uint256 _tokenId) external payable;
    function setApprovalForAll(address _operator, bool _approved) external;
    function getApproved(uint256 _tokenId) external view returns (address);
    function isApprovedForAll(address _owner, address _operator) external view returns (bool);
}

Example implementation of an ERC-721 token contract written in Rust.

src/erc721.rs
note
This code has yet to be audited. Please use at your own risk.

//! Implementation of the ERC-721 standard
//!
//! The eponymous [`Erc721`] type provides all the standard methods,
//! and is intended to be inherited by other contract types.
//!
//! You can configure the behavior of [`Erc721`] via the [`Erc721Params`] trait,
//! which allows specifying the name, symbol, and token uri.
//!
//! Note that this code is unaudited and not fit for production use.

use alloc::{string::String, vec, vec::Vec};
use alloy_primitives::{Address, U256, FixedBytes};
use alloy_sol_types::sol;
use core::{borrow::BorrowMut, marker::PhantomData};
use stylus_sdk::{
    abi::Bytes,
    evm,
    msg,
    prelude::*
};

pub trait Erc721Params {
    /// Immutable NFT name.
    const NAME: &'static str;

    /// Immutable NFT symbol.
    const SYMBOL: &'static str;

    /// The NFT's Uniform Resource Identifier.
    fn token_uri(token_id: U256) -> String;
}

sol_storage! {
    /// Erc721 implements all ERC-721 methods
    pub struct Erc721<T: Erc721Params> {
        /// Token id to owner map
        mapping(uint256 => address) owners;
        /// User to balance map
        mapping(address => uint256) balances;
        /// Token id to approved user map
        mapping(uint256 => address) token_approvals;
        /// User to operator map (the operator can manage all NFTs of the owner)
        mapping(address => mapping(address => bool)) operator_approvals;
        /// Total supply
        uint256 total_supply;
        /// Used to allow [`Erc721Params`]
        PhantomData<T> phantom;
    }
}

// Declare events and Solidity error types
sol! {
    event Transfer(address indexed from, address indexed to, uint256 indexed token_id);
    event Approval(address indexed owner, address indexed approved, uint256 indexed token_id);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    // Token id has not been minted, or it has been burned
    error InvalidTokenId(uint256 token_id);
    // The specified address is not the owner of the specified token id
    error NotOwner(address from, uint256 token_id, address real_owner);
    // The specified address does not have allowance to spend the specified token id
    error NotApproved(address owner, address spender, uint256 token_id);
    // Attempt to transfer token id to the Zero address
    error TransferToZero(uint256 token_id);
    // The receiver address refused to receive the specified token id
    error ReceiverRefused(address receiver, uint256 token_id, bytes4 returned);
}

/// Represents the ways methods may fail.
#[derive(SolidityError)]
pub enum Erc721Error {
    InvalidTokenId(InvalidTokenId),
    NotOwner(NotOwner),
    NotApproved(NotApproved),
    TransferToZero(TransferToZero),
    ReceiverRefused(ReceiverRefused),
}

// External interfaces
sol_interface! {
    /// Allows calls to the `onERC721Received` method of other contracts implementing `IERC721TokenReceiver`.
    interface IERC721TokenReceiver {
        function onERC721Received(address operator, address from, uint256 token_id, bytes data) external returns(bytes4);
    }
}

/// Selector for `onERC721Received`, which is returned by contracts implementing `IERC721TokenReceiver`.
const ERC721_TOKEN_RECEIVER_ID: u32 = 0x150b7a02;

// These methods aren't external, but are helpers used by external methods.
// Methods marked as "pub" here are usable outside of the erc721 module (i.e. they're callable from lib.rs).
impl<T: Erc721Params> Erc721<T> {
    /// Requires that msg::sender() is authorized to spend a given token
    fn require_authorized_to_spend(&self, from: Address, token_id: U256) -> Result<(), Erc721Error> {
        // `from` must be the owner of the token_id
        let owner = self.owner_of(token_id)?;
        if from != owner {
            return Err(Erc721Error::NotOwner(NotOwner {
                from,
                token_id,
                real_owner: owner,
            }));
        }

        // caller is the owner
        if msg::sender() == owner {
            return Ok(());
        }

        // caller is an operator for the owner (can manage their tokens)
        if self.operator_approvals.getter(owner).get(msg::sender()) {
            return Ok(());
        }

        // caller is approved to manage this token_id
        if msg::sender() == self.token_approvals.get(token_id) {
            return Ok(());
        }

        // otherwise, caller is not allowed to manage this token_id
        Err(Erc721Error::NotApproved(NotApproved {
            owner,
            spender: msg::sender(),
            token_id,
        }))
    }

    /// Transfers `token_id` from `from` to `to`.
    /// This function does check that `from` is the owner of the token, but it does not check
    /// that `to` is not the zero address, as this function is usable for burning.
    pub fn transfer(&mut self, token_id: U256, from: Address, to: Address) -> Result<(), Erc721Error> {
        let mut owner = self.owners.setter(token_id);
        let previous_owner = owner.get();
        if previous_owner != from {
            return Err(Erc721Error::NotOwner(NotOwner {
                from,
                token_id,
                real_owner: previous_owner,
            }));
        }
        owner.set(to);

        // right now working with storage can be verbose, but this will change upcoming version of the Stylus SDK
        let mut from_balance = self.balances.setter(from);
        let balance = from_balance.get() - U256::from(1);
        from_balance.set(balance);

        let mut to_balance = self.balances.setter(to);
        let balance = to_balance.get() + U256::from(1);
        to_balance.set(balance);

        // cleaning app the approved mapping for this token
        self.token_approvals.delete(token_id);
        
        evm::log(Transfer { from, to, token_id });
        Ok(())
    }

    /// Calls `onERC721Received` on the `to` address if it is a contract.
    /// Otherwise it does nothing
    fn call_receiver<S: TopLevelStorage>(
        storage: &mut S,
        token_id: U256,
        from: Address,
        to: Address,
        data: Vec<u8>,
    ) -> Result<(), Erc721Error> {
        if to.has_code() {
            let receiver = IERC721TokenReceiver::new(to);
            let received = receiver
                .on_erc_721_received(&mut *storage, msg::sender(), from, token_id, data.into())
                .map_err(|_e| Erc721Error::ReceiverRefused(ReceiverRefused {
                    receiver: receiver.address,
                    token_id,
                    returned: alloy_primitives::FixedBytes(0_u32.to_be_bytes()),
                }))?
                .0;

            if u32::from_be_bytes(received) != ERC721_TOKEN_RECEIVER_ID {
                return Err(Erc721Error::ReceiverRefused(ReceiverRefused {
                    receiver: receiver.address,
                    token_id,
                    returned: alloy_primitives::FixedBytes(received),
                }));
            }
        }
        Ok(())
    }

    /// Transfers and calls `onERC721Received`
    pub fn safe_transfer<S: TopLevelStorage + BorrowMut<Self>>(
        storage: &mut S,
        token_id: U256,
        from: Address,
        to: Address,
        data: Vec<u8>,
    ) -> Result<(), Erc721Error> {
        storage.borrow_mut().transfer(token_id, from, to)?;
        Self::call_receiver(storage, token_id, from, to, data)
    }

    /// Mints a new token and transfers it to `to`
    pub fn mint(&mut self, to: Address) -> Result<(), Erc721Error> {
        let new_token_id = self.total_supply.get();
        self.total_supply.set(new_token_id + U256::from(1u8));
        self.transfer(new_token_id, Address::default(), to)?;
        Ok(())
    }

    /// Burns the token `token_id` from `from`
    /// Note that total_supply is not reduced since it's used to calculate the next token_id to mint
    pub fn burn(&mut self, from: Address, token_id: U256) -> Result<(), Erc721Error> {
        self.transfer(token_id, from, Address::default())?;
        Ok(())
    }
}

// these methods are external to other contracts
#[public]
impl<T: Erc721Params> Erc721<T> {
    /// Immutable NFT name.
    pub fn name() -> Result<String, Erc721Error> {
        Ok(T::NAME.into())
    }

    /// Immutable NFT symbol.
    pub fn symbol() -> Result<String, Erc721Error> {
        Ok(T::SYMBOL.into())
    }

    /// The NFT's Uniform Resource Identifier.
    #[selector(name = "tokenURI")]
    pub fn token_uri(&self, token_id: U256) -> Result<String, Erc721Error> {
        self.owner_of(token_id)?; // require NFT exist
        Ok(T::token_uri(token_id))
    }

    /// Gets the number of NFTs owned by an account.
    pub fn balance_of(&self, owner: Address) -> Result<U256, Erc721Error> {
        Ok(self.balances.get(owner))
    }

    /// Gets the owner of the NFT, if it exists.
    pub fn owner_of(&self, token_id: U256) -> Result<Address, Erc721Error> {
        let owner = self.owners.get(token_id);
        if owner.is_zero() {
            return Err(Erc721Error::InvalidTokenId(InvalidTokenId { token_id }));
        }
        Ok(owner)
    }

    /// Transfers an NFT, but only after checking the `to` address can receive the NFT.
    /// It includes additional data for the receiver.
    #[selector(name = "safeTransferFrom")]
    pub fn safe_transfer_from_with_data<S: TopLevelStorage + BorrowMut<Self>>(
        storage: &mut S,
        from: Address,
        to: Address,
        token_id: U256,
        data: Bytes,
    ) -> Result<(), Erc721Error> {
        if to.is_zero() {
            return Err(Erc721Error::TransferToZero(TransferToZero { token_id }));
        }
        storage
            .borrow_mut()
            .require_authorized_to_spend(from, token_id)?;

        Self::safe_transfer(storage, token_id, from, to, data.0)
    }

    /// Equivalent to [`safe_transfer_from_with_data`], but without the additional data.
    ///
    /// Note: because Rust doesn't allow multiple methods with the same name,
    /// we use the `#[selector]` macro attribute to simulate solidity overloading.
    #[selector(name = "safeTransferFrom")]
    pub fn safe_transfer_from<S: TopLevelStorage + BorrowMut<Self>>(
        storage: &mut S,
        from: Address,
        to: Address,
        token_id: U256,
    ) -> Result<(), Erc721Error> {
        Self::safe_transfer_from_with_data(storage, from, to, token_id, Bytes(vec![]))
    }

    /// Transfers the NFT.
    pub fn transfer_from(&mut self, from: Address, to: Address, token_id: U256) -> Result<(), Erc721Error> {
        if to.is_zero() {
            return Err(Erc721Error::TransferToZero(TransferToZero { token_id }));
        }
        self.require_authorized_to_spend(from, token_id)?;
        self.transfer(token_id, from, to)?;
        Ok(())
    }

    /// Grants an account the ability to manage the sender's NFT.
    pub fn approve(&mut self, approved: Address, token_id: U256) -> Result<(), Erc721Error> {
        let owner = self.owner_of(token_id)?;

        // require authorization
        if msg::sender() != owner && !self.operator_approvals.getter(owner).get(msg::sender()) {
            return Err(Erc721Error::NotApproved(NotApproved {
                owner,
                spender: msg::sender(),
                token_id,
            }));
        }
        self.token_approvals.insert(token_id, approved);

        evm::log(Approval {
            approved,
            owner,
            token_id,
        });
        Ok(())
    }

    /// Grants an account the ability to manage all of the sender's NFTs.
    pub fn set_approval_for_all(&mut self, operator: Address, approved: bool) -> Result<(), Erc721Error> {
        let owner = msg::sender();
        self.operator_approvals
            .setter(owner)
            .insert(operator, approved);

        evm::log(ApprovalForAll {
            owner,
            operator,
            approved,
        });
        Ok(())
    }

    /// Gets the account managing an NFT, or zero if unmanaged.
    pub fn get_approved(&mut self, token_id: U256) -> Result<Address, Erc721Error> {
        Ok(self.token_approvals.get(token_id))
    }

    /// Determines if an account has been authorized to managing all of a user's NFTs.
    pub fn is_approved_for_all(&mut self, owner: Address, operator: Address) -> Result<bool, Erc721Error> {
        Ok(self.operator_approvals.getter(owner).get(operator))
    }

    /// Whether the NFT supports a given standard.
    pub fn supports_interface(interface: FixedBytes<4>) -> Result<bool, Erc721Error> {
        let interface_slice_array: [u8; 4] = interface.as_slice().try_into().unwrap();

        if u32::from_be_bytes(interface_slice_array) == 0xffffffff {
            // special cased in the ERC165 standard
            return Ok(false);
        }

        const IERC165: u32 = 0x01ffc9a7;
        const IERC721: u32 = 0x80ac58cd;
        const IERC721_METADATA: u32 = 0x5b5e139f;

        Ok(matches!(u32::from_be_bytes(interface_slice_array), IERC165 | IERC721 | IERC721_METADATA))
    }
}

lib.rs
// Only run this as a WASM if the export-abi feature is not set.
#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;

// Modules and imports
mod erc721;

use alloy_primitives::{U256, Address};
/// Import the Stylus SDK along with alloy primitive types for use in our program.
use stylus_sdk::{
    msg, prelude::*
};
use crate::erc721::{Erc721, Erc721Params, Erc721Error};

/// Immutable definitions
struct StylusNFTParams;
impl Erc721Params for StylusNFTParams {
    const NAME: &'static str = "StylusNFT";
    const SYMBOL: &'static str = "SNFT";

    fn token_uri(token_id: U256) -> String {
        format!("{}{}{}", "https://my-nft-metadata.com/", token_id, ".json")
    }
}

// Define the entrypoint as a Solidity storage object. The sol_storage! macro
// will generate Rust-equivalent structs with all fields mapped to Solidity-equivalent
// storage slots and types.
sol_storage! {
    #[entrypoint]
    struct StylusNFT {
        #[borrow] // Allows erc721 to access StylusNFT's storage and make calls
        Erc721<StylusNFTParams> erc721;
    }
}

#[public]
#[inherit(Erc721<StylusNFTParams>)]
impl StylusNFT {
    /// Mints an NFT
    pub fn mint(&mut self) -> Result<(), Erc721Error> {
        let minter = msg::sender();
        self.erc721.mint(minter)?;
        Ok(())
    }

    /// Mints an NFT to another address
    pub fn mint_to(&mut self, to: Address) -> Result<(), Erc721Error> {
        self.erc721.mint(to)?;
        Ok(())
    }

    /// Burns an NFT
    pub fn burn(&mut self, token_id: U256) -> Result<(), Erc721Error> {
        // This function checks that msg::sender() owns the specified token_id
        self.erc721.burn(msg::sender(), token_id)?;
        Ok(())
    }

    /// Total supply
    pub fn total_supply(&mut self) -> Result<U256, Erc721Error> {
        Ok(self.erc721.total_supply.get())
    }
}

Cargo.toml
[package]
name = "stylus_erc721_example"
version = "0.1.7"
edition = "2021"
license = "MIT OR Apache-2.0"
keywords = ["arbitrum", "ethereum", "stylus", "alloy"]

[dependencies]
alloy-primitives = "=0.7.6"
alloy-sol-types = "=0.7.6"
mini-alloc = "0.4.2"
stylus-sdk = "0.6.0"
hex = "0.4.3"

[dev-dependencies]
tokio = { version = "1.12.0", features = ["full"] }
ethers = "2.0"
eyre = "0.6.8"

[features]
export-abi = ["stylus-sdk/export-abi"]

[lib]
crate-type = ["lib", "cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"




Vending Machine
An example project for writing Arbitrum Stylus programs in Rust using the stylus-sdk. It includes a Rust implementation of a vending machine Ethereum smart contract.

distribute Cupcakes to any given address
count Cupcakes balance of any given address
Here is the interface for Vending Machine.

interface IVendingMachine {
    // Function to distribute a cupcake to a user
    function giveCupcakeTo(address userAddress) external returns (bool);

    // Getter function for the cupcake balance of a user
    function getCupcakeBalanceFor(address userAddress) external view returns (uint);
}

Example implementation of the Vending Machine contract written in Rust.

src/lib.rs
note
This code has yet to be audited. Please use at your own risk.

//!
//! Stylus Cupcake Example
//!
//! The program is ABI-equivalent with Solidity, which means you can call it from both Solidity and Rust.
//! To do this, run `cargo stylus export-abi`.
//!
//! Note: this code is a template-only and has not been audited.
//!

// Allow `cargo stylus export-abi` to generate a main function if the "export-abi" feature is enabled.
#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use alloy_primitives::{Address, Uint};
// Import items from the SDK. The prelude contains common traits and macros.
use stylus_sdk::alloy_primitives::U256;
use stylus_sdk::prelude::*;
use stylus_sdk::{block, console};

// Define persistent storage using the Solidity ABI.
// `VendingMachine` will be the entrypoint for the contract.
sol_storage! {
    #[entrypoint]
    pub struct VendingMachine {
        // Mapping from user addresses to their cupcake balances.
        mapping(address => uint256) cupcake_balances;
        // Mapping from user addresses to the last time they received a cupcake.
        mapping(address => uint256) cupcake_distribution_times;
    }
}

// Declare that `VendingMachine` is a contract with the following external methods.
#[public]
impl VendingMachine {
    // Give a cupcake to the specified user if they are eligible (i.e., if at least 5 seconds have passed since their last cupcake).
    pub fn give_cupcake_to(&mut self, user_address: Address) -> bool {
        // Get the last distribution time for the user.
        let last_distribution = self.cupcake_distribution_times.get(user_address);
        // Calculate the earliest next time the user can receive a cupcake.
        let five_seconds_from_last_distribution = last_distribution + U256::from(5);

        // Get the current block timestamp.
        let current_time = block::timestamp();
        // Check if the user can receive a cupcake.
        let user_can_receive_cupcake =
            five_seconds_from_last_distribution <= Uint::<256, 4>::from(current_time);

        if user_can_receive_cupcake {
            // Increment the user's cupcake balance.
            let mut balance_accessor = self.cupcake_balances.setter(user_address);
            let balance = balance_accessor.get() + U256::from(1);
            balance_accessor.set(balance);

            // Update the distribution time to the current time.
            let mut time_accessor = self.cupcake_distribution_times.setter(user_address);
            let new_distribution_time = block::timestamp();
            time_accessor.set(Uint::<256, 4>::from(new_distribution_time));
            return true;
        } else {
            // User must wait before receiving another cupcake.
            console!(
                "HTTP 429: Too Many Cupcakes (you must wait at least 5 seconds between cupcakes)"
            );
            return false;
        }
    }

    // Get the cupcake balance for the specified user.
    pub fn get_cupcake_balance_for(&self, user_address: Address) -> Uint<256, 4> {
        // Return the user's cupcake balance from storage.
        return self.cupcake_balances.get(user_address);
    }
}


Cargo.toml
[package]
name = "stylus_cupcake_example"
version = "0.1.7"
edition = "2021"
license = "MIT OR Apache-2.0"
keywords = ["arbitrum", "ethereum", "stylus", "alloy"]

[dependencies]
alloy-primitives = "=0.7.6"
alloy-sol-types = "=0.7.6"
mini-alloc = "0.4.2"
stylus-sdk = "0.6.0"
hex = "0.4.3"

[dev-dependencies]
tokio = { version = "1.12.0", features = ["full"] }
ethers = "2.0"
eyre = "0.6.8"

[features]
export-abi = ["stylus-sdk/export-abi"]

[lib]
crate-type = ["lib", "cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"




Multicall
An Arbitrum Stylus version implementation of Solidity Multi Call contract that aggregates multiple queries using a for loop and RawCall.

Example implementation of a Multi Call contract written in Rust: Here is the interface for TimeLock.

/**
 * This file was automatically generated by Stylus and represents a Rust program.
 * For more information, please see [The Stylus SDK](https://github.com/OffchainLabs/stylus-sdk-rs).
 */

// SPDX-License-Identifier: MIT-OR-APACHE-2.0
pragma solidity ^0.8.23;

interface IMultiCall {
    function multicall(address[] memory addresses, bytes[] memory data) external view returns (bytes[] memory);

    error ArraySizeNotMatch();

    error CallFailed(uint256);
}

src/lib.rs
note
This code has yet to be audited. Please use at your own risk.

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

#[global_allocator]
static ALLOC: mini_alloc::MiniAlloc = mini_alloc::MiniAlloc::INIT;

use alloy_primitives::U256;
use alloy_sol_types::sol;
use stylus_sdk::{abi::Bytes, alloy_primitives::Address, call::RawCall, prelude::*};

#[solidity_storage]
#[entrypoint]
pub struct MultiCall;

// Declare events and Solidity error types
sol! {
    error ArraySizeNotMatch();
    error CallFailed(uint256 call_index);
}

#[derive(SolidityError)]
pub enum MultiCallErrors {
    ArraySizeNotMatch(ArraySizeNotMatch),
    CallFailed(CallFailed),
}

#[external]
impl MultiCall {
    pub fn multicall(
        &self,
        addresses: Vec<Address>,
        data: Vec<Bytes>,
    ) -> Result<Vec<Bytes>, MultiCallErrors> {
        let addr_len = addresses.len();
        let data_len = data.len();
        let mut results: Vec<Bytes> = Vec::new();
        if addr_len != data_len {
            return Err(MultiCallErrors::ArraySizeNotMatch(ArraySizeNotMatch {}));
        }
        for i in 0..addr_len {
            let result = RawCall::new().call(addresses[i], data[i].to_vec().as_slice())
                .map_err(|_| MultiCallErrors::CallFailed(CallFailed { call_index: U256::from(i) }))?;
            results.push(result.into());
}
        Ok(results)
    }
}


Cargo.toml
[package]
name = "stylus-multi-call-contract"
version = "0.1.5"
edition = "2021"
license = "MIT OR Apache-2.0"
keywords = ["arbitrum", "ethereum", "stylus", "alloy"]
description = "Stylus multi call example"

[dependencies]
alloy-primitives = "0.3.1"
alloy-sol-types = "0.3.1"
mini-alloc = "0.4.2"
stylus-sdk = "0.5.0"
hex = "0.4.3"

[dev-dependencies]
tokio = { version = "1.12.0", features = ["full"] }
ethers = "2.0"
eyre = "0.6.8"

[features]
export-abi = ["stylus-sdk/export-abi"]

[[bin]]
name = "stylus-multi-call"
path = "src/main.rs"

[lib]
crate-type = ["lib", "cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"






Gas and ink costs
This reference provides the latest gas and ink costs for specific WASM opcodes and host I/Os when using Stylus. For a conceptual introduction to Stylus gas and ink, see Gas and ink (Stylus).

Opcode costs
The Stylus VM charges for WASM opcodes according to the following table, which was determined via a conservative statistical analysis and is expected to change as Stylus matures. Prices may fluctuate across upgrades as our analysis evolves and optimizations are made.

Hex	Opcode	Ink	Gas	Notes
0x00	Unreachable	1	0.0001	
0x01	Nop	1	0.0001	
0x02	Block	1	0.0001	
0x03	Loop	1	0.0001	
0x04	If	765	0.0765	
0x05	Else	1	0.0001	
0x0b	End	1	0.0001	
0x0c	Br	765	0.0765	
0x0d	BrIf	765	0.0765	
0x0e	BrTable	2400 + 325x	0.24 + 0.0325x	Cost varies with table size
0x0f	Return	1	0.0001	
0x10	Call	3800	0.38	
0x11	CallIndirect	13610 + 650x	1.361 + 0.065x	Cost varies with no. of args
0x1a	Drop	9	0.0009	
0x1b	Select	1250	0.125	
0x20	LocalGet	75	0.0075	
0x21	LocalSet	210	0.0210	
0x22	LocalTee	75	0.0075	
0x23	GlobalGet	225	0.0225	
0x24	GlobalSet	575	0.0575	
0x28	I32Load	670	0.067	
0x29	I64Load	680	0.068	
0x2c	I32Load8S	670	0.067	
0x2d	I32Load8U	670	0.067	
0x2e	I32Load16S	670	0.067	
0x2f	I32Load16U	670	0.067	
0x30	I64Load8S	680	0.068	
0x31	I64Load8U	680	0.068	
0x32	I64Load16S	680	0.068	
0x33	I64Load16U	680	0.068	
0x34	I64Load32S	680	0.068	
0x35	I64Load32U	680	0.068	
0x36	I32Store	825	0.0825	
0x37	I64Store	950	0.095	
0x3a	I32Store8	825	0.0825	
0x3b	I32Store16	825	0.0825	
0x3c	I64Store8	950	0.095	
0x3d	I64Store16	950	0.095	
0x3e	I64Store32	950	0.095	
0x3f	MemorySize	3000	0.3	
0x40	MemoryGrow	8050	0.805	
0x41	I32Const	1	0.0001	
0x42	I64Const	1	0.0001	
0x45	I32Eqz	170	0.017	
0x46	I32Eq	170	0.017	
0x47	I32Ne	170	0.017	
0x48	I32LtS	170	0.017	
0x49	I32LtU	170	0.017	
0x4a	I32GtS	170	0.017	
0x4b	I32GtU	170	0.017	
0x4c	I32LeS	170	0.017	
0x4d	I32LeU	170	0.017	
0x4e	I32GeS	170	0.017	
0x4f	I32GeU	170	0.017	
0x50	I64Eqz	225	0.0225	
0x51	I64Eq	225	0.0225	
0x52	I64Ne	225	0.0225	
0x53	I64LtS	225	0.0225	
0x54	I64LtU	225	0.0225	
0x55	I64GtS	225	0.0225	
0x56	I64GtU	225	0.0225	
0x57	I64LeS	225	0.0225	
0x58	I64LeU	225	0.0225	
0x59	I64GeS	225	0.0225	
0x5a	I64GeU	225	0.0225	
0x67	I32Clz	210	0.021	
0x68	I32Ctz	210	0.021	
0x69	I32Popcnt	2650	0.265	
0x6a	I32Add	70	0.007	
0x6b	I32Sub	70	0.007	
0x6c	I32Mul	160	0.016	
0x6d	I32DivS	1120	0.112	
0x6e	I32DivU	1120	0.112	
0x6f	I32RemS	1120	0.112	
0x70	I32RemU	1120	0.112	
0x71	I32And	70	0.007	
0x72	I32Or	70	0.007	
0x73	I32Xor	70	0.007	
0x74	I32Shl	70	0.007	
0x75	I32ShrS	70	0.007	
0x76	I32ShrU	70	0.007	
0x77	I32Rotl	70	0.007	
0x78	I32Rotr	70	0.007	
0x79	I64Clz	210	0.021	
0x7a	I64Ctz	210	0.012	
0x7b	I64Popcnt	6000	0.6	
0x7c	I64Add	100	0.01	
0x7d	I64Sub	100	0.01	
0x7e	I64Mul	160	0.016	
0x7f	I64DivS	1270	0.127	
0x80	I64DivU	1270	0.127	
0x81	I64RemS	1270	0.127	
0x82	I64RemU	1270	0.127	
0x83	I64And	100	0.01	
0x84	I64Or	100	0.01	
0x85	I64Xor	100	0.01	
0x86	I64Shl	100	0.01	
0x87	I64ShrS	100	0.01	
0x88	I64ShrU	100	0.01	
0x89	I64Rotl	100	0.01	
0x8a	I64Rotr	100	0.01	
0xa7	I32WrapI64	100	0.01	
0xac	I64ExtendI32S	100	0.01	
0xad	I64ExtendI32U	100	0.01	
0xc0	I32Extend8S	100	0.01	
0xc1	I32Extend16S	100	0.01	
0xc2	I64Extend8S	100	0.01	
0xc3	I64Extend16S	100	0.01	
0xc4	I64Extend32S	100	0.01	
0xfc0a	MemoryCopy	950 + 100x	0.095 + 0.01x	Cost varies with no. of bytes
0xfc0b	MemoryFill	950 + 100x	0.095 + 0.01x	Cost varies with no. of bytes
Host I/O costs
Certain operations require suspending WASM execution so that the Stylus VM can perform tasks natively in the host. This costs about 0.84 gas to do. Though we’ll publish a full specification later, the following table details the costs of simple operations that run in the host.

Note that the values in this table were determined via a conservative statistical analysis and are expected to change as Stylus matures. Prices may fluctuate across upgrades as our analysis evolves and optimizations are made.

Host I/O	Ink	Gas	Notes
read_args	8400 + 5040b	0.84 + 0.504b	b = bytes after first 32
write_result	8400 + 16381b	0.84 + 1.6381b	b = bytes after first 32
keccak	121800 + 21000w	12.18 + 2.1w	w = EVM words
block_basefee	13440	1.344	
block_coinbase	13440	1.344	
block_gas_limit	8400	0.84	
block_number	8400	0.84	
block_timestmap	8400	0.84	
chain_id	8400	0.84	
contract_address	13440	1.344	
evm_gas_left	8400	0.84	
evm_ink_left	8400	0.84	
msg_reentrant	8400	0.84	
msg_sender	13440	1.344	
msg_value	13440	1.344	
return_data_size	8400	0.84	
tx_ink_price	8400	0.84	
tx_gas_price	13440	1.344	
tx_origin	13440	1.344	
console_log_text	0	0	debug-only
console_log	0	0	debug-only
console_tee	0	0	debug-only
null_host	0	0	debug-only
See also
Gas and ink (Stylus): A conceptual introduction to the "gas" and "ink" primitives



Gas metering
Gas and ink are the pricing primitives that are used to determine the cost of handling specific opcodes and host I/Os on Stylus. For an overview of specific opcode and host I/O costs, see Gas and ink costs.

Stylus gas costs
Stylus introduces new pricing models for WASM programs. Intended for high-compute applications, Stylus makes the following more affordable:

Compute, which is generally 10-100x cheaper depending on the program. This is primarily due to the efficiency of the WASM runtime relative to the EVM, and the quality of the code produced by Rust, C, and C++ compilers. Another factor that matters is the quality of the code itself. For example, highly optimized and audited C libraries that implement a particular cryptographic operation are usually deployable without modification and perform exceptionally well. The fee reduction may be smaller for highly optimized Solidity that makes heavy use of native precompiles vs. an unoptimized Stylus equivalent that doesn't do the same.
Memory, which is 100-500x cheaper due to Stylus's novel exponential pricing mechanism intended to address Vitalik's concerns with the EVM's per-call, quadratic memory pricing policy. For the first time ever, high-memory applications are possible on an EVM-equivalent chain.
Storage, for which the Rust SDK promotes better access patterns and type choices. Note that while the underlying SLOAD and SSTORE operations cost as they do in the EVM, the Rust SDK implements an optimal caching policy that minimizes their use. Exact savings depends on the program.
VM affordances, including common operations like keccak and reentrancy detection. No longer is it expensive to make safety the default.
There are, however, minor overheads to using Stylus that may matter to your application:

The first time a WASM is deployed, it must be activated. This is generally a few million gas, though to avoid testnet DoS, we've set it to a fixed 14 million. Note that you do not have to activate future copies of the same program. For example, the same NFT template can be deployed many times without paying this cost more than once. We will soon make the fees paid depend on the program, so that the gas used is based on the complexity of the WASM instead of this very conservative, worst-case estimate.
Calling a Stylus contract costs 128-2048 gas. We're working with Wasmer to improve setup costs, but there will likely always be some amount of gas one pays to jump into WASM execution. This means that if a contract does next to nothing, it may be cheaper in Solidity. However if a contract starts doing interesting work, the dynamic fees will quickly make up for this fixed-cost overhead.
Though conservative bounds have been chosen for testnet, all of this is subject to change as pricing models mature and further optimizations are made. Since gas numbers will vary across updates, it may make more sense to clock the time it takes to perform an operation rather than going solely by the numbers reported in receipts.

Ink and gas
Because WASM opcodes are orders of magnitude faster than their EVM counterparts, almost every operation that Stylus does costs less than 1 gas. “Fractional gas” isn’t an EVM concept, so the Stylus VM introduces a new unit of payment known as ink that’s orders of magnitude smaller.

1 gas = 10,000 ink

Intuition
To build intuition for why this is the case, consider the ADD instruction.

In the EVM
Pay for gas, requiring multiple look-ups of an in-memory table
Consider tracing, even if disabled
Pop two items of the simulated stack
Add them together
Push the result
In the Stylus VM
Execute a single x86 or ARM ADD instruction
Note that unlike the EVM, which charges for gas before running each opcode, the Stylus VM strategically charges for many opcodes all at once. This cuts fees considerably, since the VM only rarely needs to execute gas charging logic. Additionally, gas charging happens inside the program, removing the need for an in-memory table.

The ink price
The ink price, which measures the amount of ink a single EVM gas buys, is configurable by the chain owner. By default, the exchange rate is 1:10000, but this may be adjusted as the EVM and Stylus VM improve over time.

For example, if the Stylus VM becomes 2x faster, instead of cutting the nominal cost of each operation, the ink price may instead be halved, allowing 1 EVM gas to buy twice as much ink. This provides an elegant mechanism for smoothly repricing resources between the two VMs as each makes independent progress.

User experience
It is important to note that users never need to worry about this notion of ink. Receipts will always be measured in gas, with the exchange rate applied automatically under the hood as the VMs pass execution back and forth.

However, developers optimizing contracts may choose to measure performance in ink to pin down the exact cost of executing various routines. The ink_left function exposes this value, and various methods throughout the Rust SDK optionally accept ink amounts too.

See also
Gas and ink costs: Detailed costs per opcode and host I/O
Caching strategy: Description of the Stylus caching strategy and the CacheManager contract


How to add a new programming language to Stylus
Arbitrum Stylus is a new technology developed for Arbitrum chains which gives smart contract developers superpowers. With Stylus, developers can write EVM-compatible smart contracts in many different programming languages, and reap massive performance gains. Stylus slashes fees, with performance gains ranging from 10-70x, and memory efficiency gains as high as 100-500x.

This is possible thanks to WebAssembly technology, which all Stylus contracts compile to. Stylus smart contracts live under the same Ethereum state trie in Arbitrum nodes, and can fully interoperate with Solidity or Vyper EVM smart contracts. With Stylus, developers can write smart contracts in Rust that talk to Solidity and vice versa without any limitations.

Today, the Stylus testnet also comes with two officially supported SDKs for developers to write contracts in the Rust or C programming languages.

However, anyone can add support for new languages in Stylus. As long as a programming language can compile to WebAssembly, Stylus will let you use it to write EVM-compatible smart contracts. Note that in order to be deployed onchain, your compiled program must fit under the 24Kb brotli-compressed limit, and should meet Stylus gas metering requirements.

In this document, we go over how we added support for the up-and-coming Zig programming language, which is meant to be a spiritual successor to C that comes with great performance and memory safety within 20 lines of code.

Why Zig?

Zig contains memory safety guardrails, requiring developers to think hard about manual memory allocation in a prudent manner
Zig is a C equivalent language, and its tooling is also a C compiler. This means C projects can incrementally adopt Zig when refactoring
Zig is lightning fast and produces small binaries, making it suitable for blockchain applications
Programs written in Zig and deployed to Stylus have a tiny footprint and will have gas costs comparable, if not equal to, C programs.

Requirements
Download and install Zig 0.11.0
Install Rust, which we'll need for the Stylus CLI tool to deploy our program to the Stylus testnet
We'll also be using Rust to run an example script that can call our Zig contract on the Stylus testnet using the popular ethers-rs library.

Once Rust is installed, also install the Stylus CLI tool with

RUSTFLAGS="-C link-args=-rdynamic" cargo install --force cargo-stylus

Using Zig with Stylus
First, let's clone the repository:

git clone https://github.com/offchainlabs/zig-on-stylus && cd zig-on-stylus

then delete everything inside of main.zig. We'll be filling it out ourselves in this tutorial.

To support Stylus, your Zig programs need to define a special entrypoint function, which takes in the length of its input args, len, and returns a status code i32, which is either 0 or 1. We won't need the Zig standard library for this.

One more thing it needs is to use a special function, called memory_grow which can allocate memory for your program. This function is injected into all Stylus contracts as an external import. Internally, we call these vm_hooks, and also refer to them as host-io's, because they give you access to the host, EVM environment.

Go ahead and replace everything in your main.zig function with:

pub extern "vm_hooks" fn memory_grow(len: u32) void;

export fn mark_unused() void {
    memory_grow(0);
    @panic("");
}

// The main entrypoint to use for execution of the Stylus WASM program.
export fn user_entrypoint(len: usize) i32 {
    _ = len;
    return 0;
}

At the top, we declare the memory_grow external function for use.

Next, we can build our Zig library to a freestanding WASM file for our onchain deployment:

zig build-lib ./src/main.zig -target wasm32-freestanding -dynamic --export=user_entrypoint -OReleaseSmall --export=mark_unused

This is enough for us to deploy on the Stylus testnet! We'll use the Stylus CLI tool, which you installed earlier using cargo install:

cargo stylus deploy --private-key=<YOUR_TESTNET_PRIVKEY> --wasm-file=main.wasm

The tool will send two transactions: one to deploy your Zig contract's code onchain, and the other to activate it for usage.

Uncompressed WASM size: 112 B
Compressed WASM size to be deployed onchain: 103 B

You can see that our Zig program is tiny when compiled to WASM. Next, we can call our contract to make sure it works using any of your favorite Ethereum tooling. In this example below, we use the cast CLI tool provided by foundry. The contract above has been deployed to the Stylus testnet at address 0xe0CD04EA8c148C9a5A58Fee1C895bc2cf6896799.

export ADDR=0xe0CD04EA8c148C9a5A58Fee1C895bc2cf6896799
cast call --rpc-url 'https://stylus-testnet.arbitrum.io/rpc' $ADDR '0x'

Calling the contract via RPC should simply return the value 0 as we programmed it to.

0x

Reading input and writing output data
Smart contracts on Ethereum, at the bare minimum, can take in data and output data as bytes. Stylus contracts are no different, and to do anything useful, we need to be able to read from user input also write our output to the caller. To do this, the Stylus runtime provides all Stylus contracts with two additional, useful host-ios:

pub extern "vm_hooks" fn read_args(dest: *u8) void;
pub extern "vm_hooks" fn write_result(data: *const u8, len: usize) void;

Add these near the top of your main.zig file.

The first, read_args takes in a pointer to a byte slice where the input arguments will be written to. The length of this byte slice must equal the length of the program args received in the user_entrypoint. We can write a helper function that uses this vm hook and gives us a byte slice in Zig we can then operate on.

// Allocates a Zig byte slice of length=`len` reads a Stylus contract's calldata
// using the read_args hostio function.
pub fn input(len: usize) ![]u8 {
    var input = try allocator.alloc(u8, len);
    read_args(@ptrCast(*u8, input));
    return input;
}

Next, we implement a helper function that outputs the data bytes to the Stylus contract's caller:

// Outputs data as bytes via the write_result hostio to the Stylus contract's caller.
pub fn output(data: []u8) void {
    write_result(@ptrCast(*u8, data), data.len);
}

Let's put these together:

// The main entrypoint to use for execution of the Stylus WASM program.
// It echoes the input arguments to the caller.
export fn user_entrypoint(len: usize) i32 {
    var in = input(len) catch return 1;
    output(in);
    return 0;
}

We're almost good to go, let's try to compile to WASM and deploy to the Stylus testnet. Let's run our build command again:

src/main.zig:21:20: error: use of undeclared identifier 'allocator'
    var data = try allocator.alloc(u8, len);
                   ^~~~~~~~~

Oops! Looks like we need an allocator to do our job here. Zig, as a language, requires programmers to think carefully about memory allocation and it's a typical pattern to require them to manually provide an allocator. There are many to choose from, but the Zig standard library already has one built specifically for WASM programs. Memory in WASM programs grows in increments of 64Kb, and the allocator from the stdlib has us covered here.

Let's try to use it by adding the following to the top of our main.zig

const std = @import("std");
const allocator = std.heap.WasmAllocator;

Our code compiles, but will it deploy onchain? Run cargo stylus check --wasm-file=main.wasm and see:

Caused by:
    missing import memory_grow

What's wrong? This means that the WasmAllocator from the Zig standard library should actually be using our special memory_grow hostio function underneath the hood. We can fix this by copying over the WasmAllocator.zig file from the standard library, and modifying a single line to use memory_grow.

You can find this file under WasmAllocator.zig in the OffchainLabs/zig-on-stylus repository. We can now use it:

const std = @import("std");
const WasmAllocator = @import("WasmAllocator.zig");

// Uses our custom WasmAllocator which is a simple modification over the wasm allocator
// from the Zig standard library as of Zig 0.11.0.
pub const allocator = std.mem.Allocator{
    .ptr = undefined,
    .vtable = &WasmAllocator.vtable,
};

Building again and running cargo stylus check should now succeed:

Uncompressed WASM size: 514 B
Compressed WASM size to be deployed onchain: 341 B
Connecting to Stylus RPC endpoint: https://stylus-testnet.arbitrum.io/rpc
Stylus program with same WASM code is already activated onchain

Let's deploy it:

cargo stylus deploy --private-key=<YOUR_TESTNET_PRIVKEY> --wasm-file=main.wasm

Now if we try to call it, it will output whatever input we send it, like an echo. Let's send it the input 0x123456:

export ADDR=0x20Aa65a9D3F077293993150C0345f62B50CCb549
cast call --rpc-url 'https://stylus-testnet.arbitrum.io/rpc' $ADDR '0x123456'

0x123456

Works!

Prime number checker implementation
Let's build something a little bit fancier: this time we'll implement a primality checker in Zig using an ancient algorithm called the sieve of erathosthenes. Given a number, our contract will output 1 if it is prime, or 0 otherwise. We'll implement in a pretty naive way, but leverage one of Zig's awesome features: comptime.

The comptime keyword tells the Zig compiler to evaluate the code involved at compile time, allowing you to define computation that would normally make runtime more expensive and do it while your binary is being compiled! Comptime in Zig is extremely flexible. In this example, we use it to define a slice of booleans up to a certain limit at compile time, which we'll use to mark which numbers are prime or not.

fn sieve_of_erathosthenes(comptime limit: usize, nth: u16) bool {
    var prime = [_]bool{true} ** limit;
    prime[0] = false;
    prime[1] = false;
    var i: usize = 2;
    while (i * i < limit) : (i += 1) {
        if (prime[i]) {
            var j = i * i;
            while (j < limit) : (j += i)
                prime[j] = false;
        }
    }
    return prime[nth];
}

Checking if a number N is prime would involve just checking if the value at index N in this prime boolean slice is true. We can then integrate this function into our user_entrypoint:

// The main entrypoint to use for execution of the Stylus WASM program.
export fn user_entrypoint(len: usize) i32 {
    // Expects the input is a u16 encoded as little endian bytes.
    var input = args(len) catch return 1;
    var check_nth_prime = std.mem.readIntSliceLittle(u16, input);
    const limit: u16 = 10_000;
    if (check_nth_prime > limit) {
        @panic("input is greater than limit of 10,000 primes");
    }
    // Checks if the number is prime and returns a boolean using the output function.
    var is_prime = sieve_of_erathosthenes(limit, check_nth_prime);
    var out = input[0..1];
    if (is_prime) {
        out[0] = 1;
    } else {
        out[0] = 0;
    }
    output(out);
    return 0;
}

Let's check and deploy it:

Uncompressed WASM size: 10.8 KB
Compressed WASM size to be deployed onchain: 525 B

Our uncompressed size is big because of that giant array of booleans, but the program is highly compressible because all of them are zeros!

An instance of this program has been deployed to the Stylus testnet at address 0x0c503Bb757b1CaaD0140e8a2700333C0C9962FE4

Interacting With Stylus contracts Using Ethers-rs
An example is included in this repo under rust-example which uses the popular ethers-rs library to interact with our prime sieve contract on the Stylus testnet. To run it, do:

export STYLUS_PROGRAM_ADDRESS=0x0c503Bb757b1CaaD0140e8a2700333C0C9962FE4
cargo run

...and see:

Checking if 2 is_prime = true, took: 404.146917ms
Checking if 3 is_prime = true, took: 154.802083ms
Checking if 4 is_prime = false, took: 123.239583ms
Checking if 5 is_prime = true, took: 109.248709ms
Checking if 6 is_prime = false, took: 113.086625ms
Checking if 32 is_prime = false, took: 280.19975ms
Checking if 53 is_prime = true, took: 123.667958ms

Next steps
The hostios defined in this walkthrough are not the only ones! Check out our stylus-sdk-c to see all the hostios you can use under hostio.h. These include affordances for the EVM, utilities to access storage, and utilities to call other Arbitrum smart contracts.



Troubleshooting Stylus
How does Stylus manage security issues in smart contracts when interacting with so many different languages?
All languages are compiled to WASM for them to be able to work with Stylus. So it just needs to verify that the produced WASM programs behave as they should inside the new virtual machine.

Is there any analogue of the fallback function from Solidity in the Rust Stylus SDK?
Yes, starting with SDK version 0.7.0, the Router trait supports both fallback and receive methods, similar to their Solidity counterparts. The fallback method is called when a transaction has calldata that doesn't match any defined function, while the receive method is called when a transaction has empty calldata. You can find more information in Fallback and receive functions.

For older SDK versions (pre-0.7.0), you can use a minimal entrypoint and perform raw delegate calls, forwarding your calldata. You can find more information in Bytes-in, bytes-out programming and call, static_call and delegate_call.

Is it possible to verify Stylus contracts on the block explorer?
Currently it is not possible to verify contracts compiled to WASM on the block explorer, but we are actively working with providers to have the verification process ready for when Stylus reaches mainnet-ready status.

Do Stylus contracts compile down to EVM bytecode like prior other attempts?
No. Stylus contracts are compiled down to WASM. The user writes a program in Rust / C / C++ which is then compiled down to WebAssembly.

How is a Stylus contract deployed?
Stylus contracts are deployed onchain as a blob of bytes, just like EVM ones. The only difference is that when the contract executes, instead of invoking the EVM, we invoke a separate WASM runtime. Note that a special EOF-inspired prefix distinguishes Stylus contracts from traditional EVM contracts: when a contract's bytecode starts with the magic 0xEFF00000 prefix, it's a Stylus WASM contract.

Is there a new transaction type to deploy Stylus contracts?
You deploy a Stylus contract the same way that Solidity contracts are deployed. There are no special transaction types. As a UX note: a WASM will revert until a special instrumentation operation is performed by a call to the new  ArbWasm precompile, which readies the program for calls on-chain.

You can find instructions for deploying a Stylus contract in our Quickstart.

Do Stylus contracts use a different type of ABI?
Stylus contracts use solidity ABIs. Methods, signatures, logs, calls, etc. work exactly as in the EVM. From a user's / explorer's perspective, it all just looks and behaves like Solidity.

Does the Stylus SDK for Rust support custom data structures?
For in-memory usage, you should be able to use any implementation of custom data structures without problems.

For storage usage, it may be more complicated. Stylus uses the EVM storage system, so you'll need to define the data structure on top of it. However, in the SDK, there's a storage trait that custom types can implement to back their collections with the EVM state trie. The SDK macros are also compatible with them, although it's still fundamentally a global key-value system.

You can read more about it in the Stylus Rust SDK page.

As an alternative solution, you can use entrypoint-style contracts for your custom data structures.

Why do I get an error "no library targets found in package" when trying to compile and old example?
Some of the first Stylus examples were built and deployed using a previous version of cargo-stylus (0.1.x). In that version, Stylus projects were structured as regular Rust binaries.

Since cargo-stylus v0.2.1, Stylus projects are structured as libraries, so when trying to compile old projects you might get an error no library targets found in package.

To solve this, it's usually enough to rename the main.rs file to a lib.rs file.

How can I generate the ABI of my Stylus contract?
The cargo-stylus tool has a command that allows you to export the ABI of your Stylus contract: cargo stylus export-abi.

If you're using the Stylus Rust SDK, you'll need to enable the export-abi feature in your Cargo.toml file like so:

[features]
export-abi = ["stylus-sdk/export-abi"]

You'll also need to have a main.rs file that selects that feature.

This is an example of a main.rs file that allows you to export the ABI of the stylus-hello-world example project:

#![cfg_attr(not(feature = "export-abi"), no_main)]

#[cfg(feature = "export-abi")]
fn main() {
    stylus_hello_world::main();
}




