"use client"
import { useWallet } from "./wallet/WalletProvider"
import { useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { useState } from "react"

export default function Navbar() {
  const { address, connect, disconnect, connecting } = useWallet()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleConnect = async () => {
    await connect()
    setIsOpen(false)
  }

  const handleDisconnect = async () => {
    await disconnect()
    setIsOpen(false)
  }

  return (
    <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-md border-b border-white/10 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
            <span className="text-black font-bold text-lg">D</span>
          </div>
          <span className="text-white font-bold text-lg hidden sm:inline">DeepWork</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-300 hover:text-white transition-colors text-sm">
            Features
          </a>
          <a href="#about" className="text-gray-300 hover:text-white transition-colors text-sm">
            About
          </a>
        </div>

        {/* Auth Button - Desktop */}
        <div className="hidden md:flex items-center gap-4">
          {address ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-300 text-sm">
                {address.slice(0, 4)}...{address.slice(-4)}
              </span>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="px-6 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm"
            >
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white p-2">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-md">
          <div className="px-4 py-4 space-y-4">
            <a href="#features" className="block text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#about" className="block text-gray-300 hover:text-white transition-colors">
              About
            </a>
            <div className="pt-4 border-t border-white/10">
              {address ? (
                <div className="space-y-3">
                  <p className="text-gray-400 text-sm">
                    {address.slice(0, 6)}...{address.slice(-6)}
                  </p>
                  <button
                    onClick={handleDisconnect}
                    className="w-full px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {connecting ? "Connecting..." : "Connect Wallet"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

