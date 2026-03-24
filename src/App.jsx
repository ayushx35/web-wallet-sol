import React, { useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, useWallet, WalletProvider, useConnection } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

export default function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <TopBar />
          <div className="container">
            <header style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h1 className="gradient-text" style={{ fontSize: '42px', margin: '0' }}>Solana Wallet</h1>
            </header>

            <div className="glass-card">
              <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Account Balance</h2>
              <Balance />
            </div>

            <div className="glass-card">
              <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Wallet Address</h2>
              <Address />
            </div>

            <div className="glass-card">
              <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Send Transaction</h2>
              <Send />
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function TopBar() {
  const { publicKey } = useWallet();

  return (
    <nav className="top-bar">
      <div className="wallet-actions">
        {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
      </div>
    </nav>
  );
}

function Send() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendSol() {
    if (!publicKey) {
      alert("Please connect your wallet first!");
      return;
    }
    if (!recipient || !amount) {
      alert("Please enter recipient address and amount!");
      return;
    }

    setLoading(true);
    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipient),
          lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      alert("Transaction sent successfully!\nSignature: " + signature);
      setRecipient('');
      setAmount('');
    } catch (error) {
      alert("Transaction failed: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="input-container">
      <input
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        type="text"
        placeholder="Recipient Address (e.g. 7v...)"
      />
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        type="number"
        placeholder="Amount in SOL"
        step="0.1"
        min="0"
      />
      <button
        onClick={sendSol}
        className="btn-primary"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Send SOL'}
      </button>
    </div>
  );
}

function Balance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (publicKey) {
      const fetchBalance = async () => {
        try {
          const bal = await connection.getBalance(publicKey, "confirmed");
          setBalance(bal / LAMPORTS_PER_SOL);
        } catch (e) {
          console.error("Failed to fetch balance:", e);
        }
      };
      fetchBalance();
      // Setup listener for real-time updates
      const id = connection.onAccountChange(publicKey, (account) => {
        setBalance(account.lamports / LAMPORTS_PER_SOL);
      }, "confirmed");

      return () => {
        connection.removeAccountChangeListener(id);
      };
    } else {
      setBalance(null);
    }
  }, [publicKey, connection]);

  return (
    <div>
      <div style={{ fontSize: '36px', fontWeight: '800', margin: '10px 0' }}>
        {publicKey ? (
          balance !== null ? (
            <span>{balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span style={{ fontSize: '18px', color: 'var(--accent-secondary)' }}>SOL</span></span>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontSize: '24px' }}>Loading...</span>
          )
        ) : (
          <span style={{ color: 'var(--text-secondary)', fontSize: '24px' }}>Wallet Not Connected</span>
        )}
      </div>
    </div>
  );
}

function Address() {
  const { publicKey } = useWallet();

  return (
    <div>
      {publicKey ? (
        <div className="address-tag">
          {publicKey.toString()}
        </div>
      ) : (
        <div style={{ color: 'var(--text-secondary)' }}>Connect a wallet to view your address</div>
      )}
    </div>
  );
}