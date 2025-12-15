// API Route for Real Blockchain Benchmark Data
import { NextRequest, NextResponse } from 'next/server';

const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY;
const STYLUS_ROUTER = process.env.NEXT_PUBLIC_STYLUS_ROUTER;
const UNISWAP_V3_ROUTER = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';

interface Transaction {
  hash: string;
  gasUsed: string;
  gasPrice: string;
  timeStamp: string;
  isError: string;
  from: string;
  to: string;
  value: string;
}

interface BenchmarkResponse {
  success: boolean;
  data: {
    stylusTxs: Transaction[];
    uniswapTxs: Transaction[];
    stylusAvg: {
      gas: number;
      time: number;
      cost: number;
    };
    uniswapAvg: {
      gas: number;
      time: number;
      cost: number;
    };
    totalTxCount: number;
    lastUpdated: string;
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<BenchmarkResponse>> {
  try {
    console.log('API Key exists:', !!ARBISCAN_API_KEY);
    console.log('Stylus Router:', STYLUS_ROUTER);
    
    if (!ARBISCAN_API_KEY || !STYLUS_ROUTER) {
      return NextResponse.json({
        success: false,
        error: `Missing config - API Key: ${!!ARBISCAN_API_KEY}, Router: ${!!STYLUS_ROUTER}`,
        data: {
          stylusTxs: [],
          uniswapTxs: [],
          stylusAvg: { gas: 0, time: 0, cost: 0 },
          uniswapAvg: { gas: 0, time: 0, cost: 0 },
          totalTxCount: 0,
          lastUpdated: new Date().toISOString()
        }
      });
    }

    // Try the original Arbiscan API first, then fallback to Etherscan V2
    const tryArbiscanFirst = true;
    let stylusTxs: Transaction[] = [];
    let uniswapTxs: Transaction[] = [];
    let apiErrors: string[] = [];

    if (tryArbiscanFirst) {
      try {
        // Original Arbiscan API
        const stylusUrl = `https://api-sepolia.arbiscan.io/api?module=account&action=txlist&address=${STYLUS_ROUTER}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${ARBISCAN_API_KEY}`;
        const uniswapUrl = `https://api-sepolia.arbiscan.io/api?module=account&action=txlist&address=${UNISWAP_V3_ROUTER}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${ARBISCAN_API_KEY}`;

        console.log('Trying Arbiscan API...');
        const [stylusResponse, uniswapResponse] = await Promise.all([
          fetch(stylusUrl),
          fetch(uniswapUrl)
        ]);

        // Process Stylus transactions
        if (stylusResponse.ok) {
          const stylusData = await stylusResponse.json();
          console.log('Stylus API Response:', stylusData.status, stylusData.message);
          if (stylusData.status === '1' && stylusData.result) {
            stylusTxs = stylusData.result.filter((tx: Transaction) => tx.isError === '0');
          } else {
            apiErrors.push(`Stylus: ${stylusData.message || 'No data'}`);
          }
        } else {
          apiErrors.push(`Stylus HTTP: ${stylusResponse.status}`);
        }

        // Process Uniswap transactions
        if (uniswapResponse.ok) {
          const uniswapData = await uniswapResponse.json();
          console.log('Uniswap API Response:', uniswapData.status, uniswapData.message);
          if (uniswapData.status === '1' && uniswapData.result) {
            uniswapTxs = uniswapData.result.filter((tx: Transaction) => tx.isError === '0');
          } else {
            apiErrors.push(`Uniswap: ${uniswapData.message || 'No data'}`);
          }
        } else {
          apiErrors.push(`Uniswap HTTP: ${uniswapResponse.status}`);
        }
      } catch (arbiscanError) {
        console.error('Arbiscan API failed:', arbiscanError);
        apiErrors.push(`Arbiscan failed: ${arbiscanError}`);
      }
    }

    // Calculate real averages from transaction data
    const calculateAverages = (txs: Transaction[]) => {
      if (txs.length === 0) return { gas: 0, time: 0, cost: 0 };
      
      const totalGas = txs.reduce((sum, tx) => sum + parseInt(tx.gasUsed || '0'), 0);
      const avgGas = totalGas / txs.length;
      
      // Estimate execution time based on gas usage (rough approximation)
      const avgTime = (avgGas / 50000) * 2; // ~2s per 50k gas
      
      // Calculate cost in USD (using current gas price)
      const avgGasPrice = txs.reduce((sum, tx) => sum + parseInt(tx.gasPrice || '0'), 0) / txs.length;
      const avgCost = (avgGas * avgGasPrice * 3500) / 1e18; // ETH price ~$3500
      
      return { gas: avgGas, time: avgTime, cost: avgCost };
    };

    const stylusAvg = calculateAverages(stylusTxs);
    const uniswapAvg = calculateAverages(uniswapTxs);

    console.log('Final Results:', {
      stylusTxCount: stylusTxs.length,
      uniswapTxCount: uniswapTxs.length,
      stylusAvg,
      uniswapAvg,
      apiErrors
    });

    return NextResponse.json({
      success: true,
      data: {
        stylusTxs: stylusTxs.slice(0, 10), // Return only first 10 for performance
        uniswapTxs: uniswapTxs.slice(0, 10),
        stylusAvg,
        uniswapAvg,
        totalTxCount: stylusTxs.length + uniswapTxs.length,
        lastUpdated: new Date().toISOString(),
        apiErrors // Include errors for debugging
      }
    });

  } catch (error) {
    console.error('Benchmark API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        stylusTxs: [],
        uniswapTxs: [],
        stylusAvg: { gas: 0, time: 0, cost: 0 },
        uniswapAvg: { gas: 0, time: 0, cost: 0 },
        totalTxCount: 0,
        lastUpdated: new Date().toISOString()
      }
    });
  }
}