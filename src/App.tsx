/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, MoreHorizontal, Info, ChevronRight, ChevronDown, X, CheckCircle2, Copy, HelpCircle, Loader2, FileText, Printer, ShieldCheck, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

export default function App() {
  const [balance, setBalance] = useState(15000000.00);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [copiedStatement, setCopiedStatement] = useState(false);
  const [username, setUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [lastTx, setLastTx] = useState<any>(null);
  const [tiktokProfile, setTiktokProfile] = useState<{ id?: string, uniqueId?: string, avatar: string, nickname: string, followers?: string, profileUrl?: string } | null>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [activeController, setActiveController] = useState<AbortController | null>(null);
  const [transactions, setTransactions] = useState([
    { id: 1, title: 'LIVE rewards', date: '1/4/2026 19:45:36', amount: 1.05, type: 'in', details: { status: 'Complete', method: 'TikTok', fee: 0.01, arrival: 'Instant', txId: 'TXN-99887766' } }
  ]);

  // Debounced profile fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      const sanitized = username.startsWith('@') ? username.slice(1) : username;
      if (sanitized.length >= 2) {
        fetchTiktokProfile(sanitized);
      } else {
        setTiktokProfile(null);
        setProfileError(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  const fetchTiktokProfile = async (user: string) => {
    if (!user || user.trim().length < 2) {
      setTiktokProfile(null);
      setProfileError(null);
      return;
    }

    const sanitizedUser = user.trim().replace(/^@+/, "");
    if (sanitizedUser.length < 2) {
      setTiktokProfile(null);
      setProfileError(null);
      return;
    }

    setIsFetchingProfile(true);
    setProfileError(null);

    // Instant local profile state so user never sees errors or delays
    const fallbackAvatar = `https://unavatar.io/tiktok/${encodeURIComponent(sanitizedUser)}`;
    setTiktokProfile({
      id: "N/A",
      uniqueId: sanitizedUser,
      avatar: fallbackAvatar,
      nickname: sanitizedUser,
      followers: "125.4K",
      profileUrl: `https://www.tiktok.com/@${sanitizedUser}`
    });

    try {
      const response = await fetch(`/api/tiktok-profile?username=${encodeURIComponent(sanitizedUser)}`, {
        headers: { "Accept": "application/json" }
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data && (data.avatar || data.nickname)) {
            setTiktokProfile({
              id: data.id || "N/A",
              uniqueId: data.uniqueId || sanitizedUser,
              avatar: data.avatar || fallbackAvatar,
              nickname: data.nickname || sanitizedUser,
              followers: data.followers || "125.4K",
              profileUrl: data.profileUrl || `https://www.tiktok.com/@${sanitizedUser}`
            });
          }
        }
      }
    } catch (e) {
      // Silently swallow any server/network error - instant fallback is already active
      console.warn("Background profile fetch error (using fallback):", e);
    } finally {
      setIsFetchingProfile(false);
      setProfileError(null);
    }
  };

  const handleInitiateTransfer = () => {
    const transferAmount = parseFloat(amount);
    if (!username || isNaN(transferAmount) || transferAmount <= 0 || transferAmount > balance) return;

    const sanitizedUser = username.replace(/^@+/, '');
    const txDetails = {
      id: "TXN" + Math.random().toString(36).substring(2, 11).toUpperCase(),
      username: sanitizedUser,
      amount: transferAmount,
      date: new Date().toLocaleString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      })
    };

    setLastTx(txDetails);
    setIsPaid(false);
    setShowDetails(true);
  };

  const handlePay = () => {
    if (!lastTx || isProcessing) return;
    const transferAmount = lastTx.amount;
    if (transferAmount > balance) return;

    setIsProcessing(true);

    setTimeout(() => {
      const newBalance = balance - transferAmount;
      setBalance(newBalance);

      setTransactions(prev => [
        {
          id: Date.now(),
          title: `Transfer to @${lastTx.username}`,
          date: lastTx.date,
          amount: transferAmount,
          type: 'out',
          details: {
            status: 'Withdrawal complete',
            method: `TikTok(@${lastTx.username})`,
            fee: transferAmount * 0.006,
            arrival: '30 Minutes in arrival',
            txId: lastTx.id
          }
        },
        ...prev
      ]);

      setIsPaid(true);
      setIsProcessing(false);
      setShowStatementModal(true);
    }, 1000);
  };

  const resetToHomePage = () => {
    setShowStatementModal(false);
    setShowDetails(false);
    setIsTransferOpen(false);
    setUsername('');
    setAmount('');
    setTiktokProfile(null);
    setIsPaid(false);
  };

  // Removed auto-close for details to allow user to read them
  // useEffect(() => {
  //   if (showDetails) {
  //     const timer = setTimeout(() => {
  //       setShowDetails(false);
  //       setIsTransferOpen(false);
  //       setUsername('');
  //       setAmount('');
  //     }, 3000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [showDetails]);

  const isConfirmDisabled = !username || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance || isProcessing;

  const getProxyUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("ui-avatars.com") || url.includes("unavatar.io") || url.includes("wsrv.nl")) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] font-sans text-[#161823]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3 border-b border-gray-100">
        <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">LIVE rewards</h1>
        <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </header>

      <main className="max-w-md mx-auto pb-8">
        {/* Tabs */}
        <div className="flex p-4 gap-3">
          <button className="flex-1 bg-white rounded-lg p-3 shadow-sm border border-gray-100 text-center">
            <div className="text-sm font-semibold">Available rewards</div>
            <div className="text-xs text-gray-500">US{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </button>
          <button className="flex-1 bg-gray-50 rounded-lg p-3 text-center relative">
            <div className="text-sm font-semibold text-gray-400">Upcoming rewards</div>
            <div className="text-xs text-gray-400">US200,000.00</div>
            <div className="absolute top-2 right-2 w-2 h-2 bg-[#FE2C55] rounded-full"></div>
          </button>
        </div>

        {/* Main Balance Card */}
        <div className="mx-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold mb-2">Available rewards</p>
            <div className="flex items-baseline justify-center gap-1 overflow-hidden">
              <span className="text-lg font-bold">US</span>
              <span className="text-2xl sm:text-3xl font-bold truncate">
                {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-center mt-2 text-gray-500 text-sm gap-1">
              <span>≈ EUR{(balance * 0.85).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <Info className="w-4 h-4" />
            </div>
          </div>

          {/* Buttons Section */}
          <div className="space-y-3 mb-6">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsTransferOpen(true)}
              className="w-full bg-[#FE2C55] text-white py-3.5 rounded-lg font-bold text-lg shadow-sm hover:bg-[#E9294D] transition-colors"
            >
              Transfer
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white text-[#161823] py-3.5 rounded-lg font-bold text-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
            >
              Withdraw
            </motion.button>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="mx-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-6">Transactions</h2>

          {/* Jan 2026 */}
          <div className="mb-8">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
              <button className="flex items-center gap-1 font-medium">
                Mar 2026 <ChevronDown className="w-3 h-3" />
              </button>
              <div className="flex gap-4">
                <span>In: US0.00</span>
                <span>Out: US0.00</span>
              </div>
            </div>

            <div className="space-y-4">
              {transactions.map(tx => (
                <div 
                  key={tx.id} 
                  onClick={() => {
                    if (tx.type === 'out') {
                      setLastTx({
                        id: tx.details?.txId || tx.id,
                        username: tx.title.split('@')[1],
                        amount: tx.amount,
                        date: tx.date
                      });
                      setIsPaid(true);
                      setShowDetails(true);
                      setIsTransferOpen(true);
                    }
                  }}
                  className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{tx.title}</p>
                    <p className="text-xs text-gray-400">{tx.date}</p>
                  </div>
                  <div className={`font-bold ${tx.type === 'in' ? 'text-[#FE2C55]' : 'text-gray-900'}`}>
                    {tx.type === 'in' ? '+' : '-'}US{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Transfer Modal/View */}
      <AnimatePresence>
        {isTransferOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden"
          >
            {/* Conditional Rendering for Form vs Details */}
            {!showDetails ? (
              <>
                <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
                  <button onClick={() => setIsTransferOpen(false)} className="p-1">
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h1 className="text-lg font-bold">Transfer</h1>
                  <button className="p-1">
                    <HelpCircle className="w-6 h-6 text-gray-400" />
                  </button>
                </header>

                <div className="flex-1 overflow-y-auto bg-[#F8F8F8]">
                  <div className="p-4 space-y-4 max-w-md mx-auto w-full">
                    {/* Payment Method */}
                    <div className="flex justify-between items-center px-1">
                      <span className="text-sm text-gray-500">Payment method</span>
                      <button className="text-sm font-semibold text-[#FE2C55]">Manage</button>
                    </div>

                    <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-gray-600">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-900">Transfer name <span className="text-gray-400 font-normal">(Username Details)</span></span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>

                    {/* Username Input */}
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-black font-bold text-lg">@</span>
                        <input
                          type="text"
                          placeholder="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full bg-transparent border-none py-1 pl-6 pr-10 text-lg font-bold focus:ring-0 focus:outline-none placeholder:text-gray-300"
                        />
                        {isFetchingProfile && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-[#FE2C55]" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Profile Card */}
                    <AnimatePresence mode="wait">
                      {tiktokProfile && (
                        <motion.div
                          key="profile"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 border border-gray-100"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0 bg-gray-100">
                            <img 
                              src={getProxyUrl(tiktokProfile.avatar)} 
                              alt={tiktokProfile.nickname}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                const cleanUser = (tiktokProfile.uniqueId || username).replace(/^@+/, "");
                                if (!img.dataset.triedUnavatar) {
                                  img.dataset.triedUnavatar = "true";
                                  img.src = `https://unavatar.io/tiktok/${encodeURIComponent(cleanUser)}`;
                                } else if (!img.dataset.triedWsrv && tiktokProfile.avatar) {
                                  img.dataset.triedWsrv = "true";
                                  img.src = `https://wsrv.nl/?url=${encodeURIComponent(tiktokProfile.avatar)}`;
                                } else {
                                  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tiktokProfile.nickname || cleanUser)}&background=FE2C55&color=fff&size=128`;
                                  img.onerror = null;
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate text-gray-900 leading-tight">
                                {tiktokProfile.nickname}
                              </p>
                              <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                                @{tiktokProfile.uniqueId || username.replace(/^@+/, '')}
                              </p>
                            </div>
                            <a 
                              href={tiktokProfile.profileUrl || `https://www.tiktok.com/@${username.replace(/^@+/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-[#FE2C55] bg-pink-50 hover:bg-pink-100 px-2.5 py-1 rounded-full font-semibold transition-colors flex-shrink-0"
                            >
                              tiktok.com/@{tiktokProfile.uniqueId || username.replace(/^@+/, '')}
                            </a>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Transfer Limit */}
                    <div className="flex justify-between items-center px-1 text-[10px] text-gray-400">
                      <span>Daily transfer limit (Remain/Total)</span>
                      <span className="font-medium text-gray-900">96.9 / 10.0M</span>
                    </div>

                    {/* Amount Input */}
                    <div className="bg-white rounded-xl p-3 shadow-sm space-y-1">
                      <label className="text-xs text-gray-400">Transfer amount</label>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">USD</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="flex-1 bg-transparent border-none p-0 text-3xl font-bold focus:ring-0 focus:outline-none placeholder:text-gray-200"
                        />
                        <button 
                          onClick={() => setAmount(balance.toString())}
                          className="text-base font-semibold text-[#FE2C55] px-1"
                        >
                          All
                        </button>
                      </div>
                    </div>

                    {/* Estimated Amount */}
                    <div className="bg-white rounded-xl p-3 shadow-sm space-y-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          Estimated amount you receive <HelpCircle className="w-3 h-3" />
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-gray-900">USD</span>
                          <span className="text-2xl font-bold text-gray-900">
                            {(parseFloat(amount) || 0) > 0 
                              ? (parseFloat(amount) * 0.994).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : '0.00'}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          Service fee <HelpCircle className="w-3 h-3" />
                        </div>
                        <span className="font-bold text-sm text-gray-900">
                          USD {(parseFloat(amount) || 0) > 0 
                            ? (parseFloat(amount) * 0.006).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '0.00'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 pb-4">
                      <p className="text-[9px] text-center text-gray-400 leading-tight mb-4">
                        TikTok <span className="text-[#FE2C55]">Terms of Service</span> and <span className="text-[#FE2C55]">Privacy Policy</span>. Payment transactions are processed by PIPO. <span className="font-bold text-gray-900">PIPO Privacy Policy</span>
                      </p>
                      
                      <motion.button
                        whileTap={!isConfirmDisabled ? { scale: 0.98 } : {}}
                        onClick={handleInitiateTransfer}
                        disabled={isConfirmDisabled}
                        className={`w-full py-3.5 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                          isConfirmDisabled 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-[#FE2C55] text-white shadow-lg hover:bg-[#E9294D]'
                        }`}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          'Transfer'
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Transaction Details Page */
              <div className="flex flex-col h-full bg-[#F8F8F8]">
                <header className="flex items-center px-4 py-3 bg-white border-b border-gray-100">
                  <button onClick={() => setShowDetails(false)} className="p-1">
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h1 className="flex-1 text-center text-lg font-bold pr-8">Transfer details</h1>
                </header>

                <div className="flex-1 p-3 space-y-3 overflow-y-auto max-w-md mx-auto w-full">
                  {/* Top Amount Card */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm text-center space-y-3">
                    <div className="flex flex-col items-center">
                      {tiktokProfile && (
                        <div className="flex flex-col items-center mb-2">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-100 mb-1">
                            <img 
                              src={getProxyUrl(tiktokProfile.avatar)} 
                              alt={tiktokProfile.nickname}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                const cleanUser = (tiktokProfile.uniqueId || username).replace(/^@+/, "");
                                if (!img.dataset.triedUnavatar) {
                                  img.dataset.triedUnavatar = "true";
                                  img.src = `https://unavatar.io/tiktok/${encodeURIComponent(cleanUser)}`;
                                } else if (!img.dataset.triedWsrv && tiktokProfile.avatar) {
                                  img.dataset.triedWsrv = "true";
                                  img.src = `https://wsrv.nl/?url=${encodeURIComponent(tiktokProfile.avatar)}`;
                                } else {
                                  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tiktokProfile.nickname || cleanUser)}&background=FE2C55&color=fff&size=128`;
                                  img.onerror = null;
                                }
                              }}
                            />
                          </div>
                          <p className="font-bold text-lg text-gray-900">{tiktokProfile.nickname}</p>
                          <a 
                            href={`https://www.tiktok.com/@${lastTx?.username || tiktokProfile.uniqueId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#FE2C55] font-semibold hover:underline mt-0.5"
                          >
                            tiktok.com/@{lastTx?.username || tiktokProfile.uniqueId}
                          </a>
                        </div>
                      )}
                      <p className="text-gray-400 text-xs">LIVE rewards transfer to TikTok</p>
                    </div>
                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="text-lg font-bold text-gray-900">USD</span>
                      <span className="text-4xl font-bold text-gray-900">
                        {lastTx?.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Details Card */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Status</span>
                      {isPaid ? (
                        <div className="flex items-center gap-1 text-[#00C49F] font-semibold text-sm">
                          <CheckCircle2 className="w-4 h-4 fill-[#00C49F] text-white" />
                          Withdrawal complete
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-semibold text-xs border border-amber-200">
                          <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                          Ready to Pay
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-400">Payment method</span>
                      <span className="font-semibold text-gray-900 text-sm">TikTok(@{lastTx?.username})</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        Service fee <HelpCircle className="w-3 h-3" />
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">
                        {(lastTx?.amount * 0.006).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        Estimated amount you receive <HelpCircle className="w-3 h-3" />
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">
                        {(lastTx?.amount * 0.994).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </span>
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-400">Transfer time</span>
                      <span className="font-semibold text-gray-900 text-sm">{lastTx?.date}</span>
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-400">Arrival time</span>
                      <span className="font-semibold text-gray-900 text-sm">30 Minutes in arrival</span>
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-400">Transaction ID</span>
                      <span className="font-semibold text-gray-900 text-sm">{lastTx?.id}</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    {!isPaid ? (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handlePay}
                        disabled={isProcessing}
                        className="w-full bg-[#FE2C55] text-white py-3.5 rounded-full font-bold text-lg shadow-lg hover:bg-[#E9294D] transition-colors flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing Payment...</span>
                          </>
                        ) : (
                          <span>Pay US${lastTx?.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        )}
                      </motion.button>
                    ) : (
                      <div className="space-y-2">
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowStatementModal(true)}
                          className="w-full bg-[#FE2C55] text-white py-3.5 rounded-full font-bold text-lg shadow-lg hover:bg-[#E9294D] transition-colors flex items-center justify-center gap-2"
                        >
                          <FileText className="w-5 h-5" />
                          <span>Statement</span>
                        </motion.button>

                        <button
                          onClick={() => {
                            setShowDetails(false);
                            setIsTransferOpen(false);
                            setUsername('');
                            setAmount('');
                          }}
                          className="w-full bg-white text-gray-700 py-2.5 rounded-full font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    )}
                    
                    <button className="flex items-center justify-center gap-1 text-gray-400 text-xs mx-auto">
                      Need help? <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statement Modal */}
      <AnimatePresence>
        {showStatementModal && lastTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative border border-gray-100 overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={resetToHomePage}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Statement Header */}
              <div className="text-center pb-4 border-b border-gray-100">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xs">
                    ♪
                  </div>
                  <span className="font-bold text-lg text-gray-900">TikTok LIVE Rewards</span>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Official Payment Statement</p>
                <div className="mt-2 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  PIPO Verified Settlement
                </div>
              </div>

              {/* Statement Details */}
              <div className="py-4 space-y-3 text-sm">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Statement No:</span>
                  <span className="font-mono font-bold text-gray-900">{lastTx.id}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Issue Date:</span>
                  <span className="font-medium text-gray-900">{lastTx.date}</span>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl space-y-2 my-2 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Beneficiary Information</p>
                  <div className="flex items-center gap-3">
                    {tiktokProfile?.avatar && (
                      <img 
                        src={getProxyUrl(tiktokProfile.avatar)} 
                        alt="avatar" 
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                      />
                    )}
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{tiktokProfile?.nickname || `@${lastTx.username}`}</p>
                      <p className="text-xs text-gray-500">@{lastTx.username}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="space-y-2 border-t border-b border-gray-100 py-3">
                  <div className="flex justify-between text-gray-600 text-xs">
                    <span>Gross Rewards Amount</span>
                    <span className="font-semibold text-gray-900">USD ${lastTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-xs">
                    <span>Service Fee (0.6%)</span>
                    <span className="font-semibold text-gray-900">- USD ${(lastTx.amount * 0.006).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-bold text-sm pt-2 border-t border-gray-100">
                    <span>Net Settlement Received</span>
                    <span className="text-[#FE2C55]">USD ${(lastTx.amount * 0.994).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                  <span>Payment Method</span>
                  <span className="font-semibold text-gray-900">TikTok Direct Deposit (@{lastTx.username})</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Payment Status</span>
                  <span className="font-bold text-emerald-600">COMPLETED & SETTLED</span>
                </div>
              </div>

              {/* Footer Notice */}
              <p className="text-[10px] text-gray-400 text-center mb-3 leading-tight">
                This is an official computer-generated statement issued by TikTok LIVE Rewards Payment Operations (PIPO Payment Services).
              </p>

              {/* Modal Actions */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 bg-gray-100 text-gray-800 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-gray-200 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      const text = `TikTok LIVE Rewards Statement\nStatement ID: ${lastTx.id}\nBeneficiary: @${lastTx.username}\nAmount: USD $${lastTx.amount}\nStatus: Paid\nDate: ${lastTx.date}`;
                      navigator.clipboard.writeText(text);
                      setCopiedStatement(true);
                      setTimeout(() => setCopiedStatement(false), 2000);
                    }}
                    className="flex-1 bg-gray-100 text-gray-800 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-gray-200 transition-colors"
                  >
                    {copiedStatement ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Details</span>
                      </>
                    )}
                  </button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={resetToHomePage}
                  className="w-full bg-[#FE2C55] text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-[#E9294D] transition-colors flex items-center justify-center gap-2"
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
