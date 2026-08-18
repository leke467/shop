import React from 'react'

/**
 * Renders a visual miniature UI preview/mockup of each storefront template.
 * Matches the actual visual structure, layout, typography style, and color scheme of the template.
 */
export default function TemplatePreview({ templateId }) {
  switch (templateId) {
    case 'honeyspicy':
      return (
        <div className="w-full h-full bg-[#FFF8F0] p-2.5 flex flex-col justify-between select-none overflow-hidden relative font-serif">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-200 pb-1">
            <div className="flex items-center gap-1">
              <span className="text-xs">🍯</span>
              <span className="text-[10px] font-bold text-amber-900 tracking-wider">HONEY GOURMET</span>
            </div>
            <div className="w-8 h-2 bg-amber-400/30 rounded-full"></div>
          </div>
          {/* Hero */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-2 text-white flex items-center justify-between shadow-xs">
            <div>
              <div className="text-[9px] font-bold tracking-wide">CULINARY EXCELLENCE</div>
              <div className="w-12 h-1 bg-amber-200/50 rounded mt-1"></div>
            </div>
            <div className="w-6 h-6 rounded-full bg-amber-300/40 border border-white/40 flex items-center justify-center text-[10px]">🍲</div>
          </div>
          {/* Food Cards Grid */}
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-md p-1 border border-amber-100 shadow-2xs flex flex-col items-center">
                <div className="w-full h-7 bg-amber-100/60 rounded flex items-center justify-center text-xs">🍰</div>
                <div className="w-8 h-1 bg-amber-900/30 rounded mt-1"></div>
                <div className="w-5 h-1 bg-amber-500 rounded mt-0.5"></div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'obsidian':
      return (
        <div className="w-full h-full bg-[#0B0F17] p-2.5 flex flex-col justify-between select-none overflow-hidden relative font-sans text-white">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
          {/* Glass Header */}
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-md px-2 py-1 backdrop-blur-xs">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
              <span className="text-[9px] font-mono tracking-widest text-cyan-300">OBSIDIAN</span>
            </div>
            <div className="w-4 h-1.5 bg-cyan-400/40 rounded"></div>
          </div>
          {/* Glass Hero */}
          <div className="bg-gradient-to-br from-white/10 to-white/0 border border-white/10 rounded-lg p-2 flex justify-between items-center">
            <div className="space-y-1">
              <div className="w-16 h-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded"></div>
              <div className="w-10 h-1 bg-white/30 rounded"></div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-xs text-cyan-300">💎</div>
          </div>
          {/* Cards */}
          <div className="grid grid-cols-2 gap-1.5">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-md p-1.5 space-y-1">
                <div className="w-full h-5 bg-white/10 rounded"></div>
                <div className="w-10 h-1 bg-white/40 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'minimalist':
      return (
        <div className="w-full h-full bg-white p-2.5 flex justify-between select-none overflow-hidden relative font-mono text-gray-800 border border-gray-100">
          {/* Left Vertical Rail */}
          <div className="w-4 border-r border-gray-200 flex flex-col justify-between items-center py-1">
            <span className="text-[7px] rotate-270 font-bold tracking-widest text-gray-400">STUDIO</span>
            <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
          </div>
          {/* Main Area */}
          <div className="flex-1 pl-2 flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-gray-100 pb-1">
              <span className="text-[9px] font-bold tracking-widest">MINIMALIST</span>
              <span className="text-[8px] text-gray-400">[01]</span>
            </div>
            <div className="grid grid-cols-2 gap-2 my-1">
              <div className="border border-gray-200 p-1 flex flex-col justify-between h-14">
                <div className="w-full h-6 bg-gray-100 flex items-center justify-center text-[10px]">🪑</div>
                <div className="w-8 h-1 bg-black rounded mt-1"></div>
              </div>
              <div className="border border-gray-200 p-1 flex flex-col justify-between h-14">
                <div className="w-full h-6 bg-gray-100 flex items-center justify-center text-[10px]">💡</div>
                <div className="w-8 h-1 bg-black rounded mt-1"></div>
              </div>
            </div>
            <div className="text-[7px] text-gray-400 tracking-widest uppercase">Clean Architecture</div>
          </div>
        </div>
      )

    case 'cyberpunk':
      return (
        <div className="w-full h-full bg-[#06060C] p-2.5 flex flex-col justify-between select-none overflow-hidden relative font-mono text-[#00F0FF]">
          {/* Telemetry Header */}
          <div className="flex justify-between items-center border-b border-[#00F0FF]/30 pb-1 text-[8px]">
            <span className="font-bold tracking-widest text-[#FF0055]">NEON_HUD v2.4</span>
            <span className="text-[7px] text-[#00F0FF]/60">[ONLINE]</span>
          </div>
          {/* Glitch Hero Box */}
          <div className="border border-[#00F0FF] bg-[#00F0FF]/5 p-1.5 relative">
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#FF0055]"></div>
            <div className="text-[9px] font-bold text-[#FF0055] tracking-wider">CYBERPUNK</div>
            <div className="w-14 h-1 bg-[#00F0FF] mt-1"></div>
          </div>
          {/* HUD Cards */}
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-[#00F0FF]/40 bg-black p-1 flex flex-col items-center">
                <div className="text-[10px]">⚡</div>
                <div className="w-6 h-0.5 bg-[#FF0055] mt-1"></div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'emerald':
      return (
        <div className="w-full h-full bg-[#FAF8F5] flex select-none overflow-hidden relative font-sans">
          {/* Fixed Dark Green Sidebar */}
          <div className="w-12 bg-[#062C22] p-1.5 flex flex-col justify-between text-emerald-100">
            <div>
              <div className="text-xs">🌿</div>
              <div className="text-[7px] font-bold tracking-wider mt-1 text-emerald-300">VERDANT</div>
            </div>
            <div className="w-4 h-1 bg-emerald-400/40 rounded"></div>
          </div>
          {/* Content Area */}
          <div className="flex-1 p-2 flex flex-col justify-between">
            <div className="text-[9px] font-bold text-[#062C22] border-b border-emerald-100 pb-1">ORGANIC BOTANICALS</div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-white p-1 rounded border border-emerald-100 shadow-2xs">
                <div className="w-full h-6 bg-emerald-50 rounded flex items-center justify-center text-xs">🍃</div>
                <div className="w-8 h-1 bg-[#062C22] rounded mt-1"></div>
              </div>
              <div className="bg-white p-1 rounded border border-emerald-100 shadow-2xs">
                <div className="w-full h-6 bg-emerald-50 rounded flex items-center justify-center text-xs">🍵</div>
                <div className="w-8 h-1 bg-[#062C22] rounded mt-1"></div>
              </div>
            </div>
          </div>
        </div>
      )

    case 'royal':
      return (
        <div className="w-full h-full bg-[#0D0B14] p-2.5 flex flex-col justify-between select-none overflow-hidden relative font-serif text-[#C9A84C]">
          <div className="flex justify-between items-center border-b border-[#C9A84C]/30 pb-1">
            <span className="text-[9px] tracking-widest font-bold">👑 VELVET ROYALTY</span>
            <span className="text-[8px] text-[#C9A84C]/60">LUXURY</span>
          </div>
          {/* Carousel Preview Row */}
          <div className="bg-gradient-to-r from-[#1A1429] to-[#0D0B14] border border-[#C9A84C]/30 rounded-lg p-1.5 flex items-center gap-1.5">
            <div className="w-8 h-8 rounded bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center text-xs shrink-0">💎</div>
            <div className="space-y-1">
              <div className="w-14 h-1.5 bg-gradient-to-r from-[#C9A84C] to-amber-200 rounded"></div>
              <div className="w-8 h-1 bg-[#C9A84C]/40 rounded"></div>
            </div>
          </div>
          {/* Gold Accent Cards */}
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 bg-[#1A1429] border border-[#C9A84C]/20 rounded p-1 flex items-center justify-center">
                <span className="text-[10px]">✨</span>
              </div>
            ))}
          </div>
        </div>
      )

    case 'boho':
      return (
        <div className="w-full h-full bg-[#FAF5F0] p-2.5 flex flex-col justify-between select-none overflow-hidden relative font-sans text-[#8C5E3C]">
          <div className="flex justify-between items-center border-b border-[#E6D5C3] pb-1">
            <span className="text-[9px] font-bold tracking-wide">🏺 TERRACOTTA</span>
            <div className="w-3 h-3 rounded-full bg-[#D9825B]/20"></div>
          </div>
          {/* Arch-top cards grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-t-full border border-[#E6D5C3] p-1 flex flex-col items-center">
                <div className="w-full h-6 rounded-t-full bg-[#F3E5D8] flex items-center justify-center text-[10px]">🪴</div>
                <div className="w-6 h-1 bg-[#D9825B] rounded mt-1"></div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'popart':
      return (
        <div className="w-full h-full bg-[#FFDE00] p-2.5 flex flex-col justify-between select-none overflow-hidden relative font-sans font-black text-black">
          <div className="flex justify-between items-center border-b-2 border-black pb-1">
            <span className="text-[10px] bg-black text-white px-1 rounded-xs">POP ART!</span>
            <span className="text-[8px] bg-[#FF0055] text-white px-1">NEW</span>
          </div>
          <div className="bg-white border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
            <span className="text-[9px]">BOOM! 💥</span>
            <div className="w-4 h-4 bg-[#FF0055] border border-black rounded-full flex items-center justify-center text-[8px] text-white">⚡</div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[1, 2].map((i) => (
              <div key={i} className="bg-[#00E5FF] border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                <span className="text-[10px]">🎨</span>
              </div>
            ))}
          </div>
        </div>
      )

    case 'retro':
      return (
        <div className="w-full h-full bg-[#FEF3C7] p-2.5 flex flex-col justify-between select-none overflow-hidden relative font-sans text-[#92400E]">
          <div className="flex justify-between items-center border-b border-amber-300 pb-1">
            <span className="text-[9px] font-bold">💿 70s VINYL</span>
            <div className="w-2 h-2 rounded-full bg-amber-600"></div>
          </div>
          {/* Turntable circle preview */}
          <div className="bg-amber-100 border border-amber-300 rounded-full p-2 flex items-center justify-center self-center shadow-inner">
            <div className="w-8 h-8 rounded-full bg-[#1C1C1C] flex items-center justify-center text-white border-2 border-amber-500">
              <span className="text-[8px]">🎶</span>
            </div>
          </div>
          <div className="text-[8px] text-center font-bold tracking-widest uppercase">GROOVY ANALOG</div>
        </div>
      )

    case 'pastel':
      return (
        <div className="w-full h-full bg-[#FDF4FF] p-2.5 flex flex-col justify-between select-none overflow-hidden relative font-sans text-purple-900">
          <div className="flex justify-between items-center border-b border-purple-100 pb-1">
            <span className="text-[9px] font-bold">🌸 PASTEL BLOOM</span>
            <div className="w-3 h-1.5 bg-purple-200 rounded-full"></div>
          </div>
          {/* Bento box tiles */}
          <div className="grid grid-cols-3 gap-1">
            <div className="col-span-2 bg-purple-100/60 rounded-xl p-1.5 flex items-center gap-1">
              <span className="text-xs">💅</span>
              <div className="w-10 h-1 bg-purple-400 rounded"></div>
            </div>
            <div className="bg-pink-100/60 rounded-xl p-1 flex items-center justify-center text-xs">✨</div>
          </div>
          <div className="bg-purple-200/50 rounded-xl py-1 px-2 text-[8px] text-purple-700 font-bold text-center">Soft Cosmetics</div>
        </div>
      )

    case 'industrial':
      return (
        <div className="w-full h-full bg-[#1C1C1C] p-2.5 flex flex-col justify-between select-none overflow-hidden relative font-mono text-[#E0D8C8]">
          <div className="h-1 bg-[repeating-linear-gradient(45deg,#F59E0B,#F59E0B_4px,#1C1C1C_4px,#1C1C1C_8px)] -mx-2.5 -mt-2.5 mb-1"></div>
          <div className="flex justify-between items-center border-b border-dashed border-[#3D3D3D] pb-1">
            <span className="text-[8px] font-bold text-[#F59E0B]">⚙️ FORGE WORKS</span>
            <span className="text-[7px] text-gray-500">REV.01</span>
          </div>
          {/* Dotted schematic lines */}
          <div className="border border-dashed border-[#3D3D3D] p-1 space-y-1 bg-[#222]">
            <div className="flex justify-between text-[7px]">
              <span className="text-[#F59E0B]">#01</span>
              <span>HEAVY STEEL</span>
              <span>₦12,000</span>
            </div>
            <div className="flex justify-between text-[7px]">
              <span className="text-[#F59E0B]">#02</span>
              <span>VALVE GEAR</span>
              <span>₦8,500</span>
            </div>
          </div>
        </div>
      )

    case 'zenith':
      return (
        <div className="w-full h-full bg-[#0F172A] p-2.5 flex flex-col justify-between select-none overflow-hidden relative font-sans text-slate-200">
          <div className="flex justify-between items-center bg-[#1E293B] border border-slate-700 rounded px-1.5 py-0.5">
            <span className="text-[9px] font-bold text-indigo-400">⚡ ZENITH</span>
            <div className="flex gap-0.5">
              <div className="w-2 h-1.5 bg-indigo-600 rounded-xs"></div>
              <div className="w-2 h-1.5 bg-slate-700 rounded-xs"></div>
            </div>
          </div>
          {/* Dashboard metric card */}
          <div className="bg-[#1E293B] border border-slate-700 rounded p-1.5 flex justify-between items-center">
            <div>
              <div className="text-[7px] text-slate-400">Total Products</div>
              <div className="text-xs font-bold text-indigo-400">48 Items</div>
            </div>
            <span className="text-xs">📊</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[7px]">
            <div className="bg-[#1E293B] p-1 rounded border border-slate-700 font-semibold">Grid View</div>
            <div className="bg-[#1E293B] p-1 rounded border border-slate-700 text-slate-400">Table View</div>
          </div>
        </div>
      )

    case 'monochrome':
      return (
        <div className="w-full h-full bg-black p-2.5 flex flex-col justify-between select-none overflow-hidden relative font-serif text-white">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-1">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">VOGUE NOIR</span>
            <span className="text-[7px] font-mono text-zinc-500">EDITORIAL</span>
          </div>
          {/* 3:4 High Fashion Box */}
          <div className="bg-zinc-900 border border-zinc-800 h-14 flex items-center justify-center">
            <span className="text-xs text-zinc-400">📸</span>
          </div>
          <div className="text-[8px] tracking-[0.3em] uppercase text-zinc-400 text-center">High Fashion Collection</div>
        </div>
      )

    case 'artisan':
      return (
        <div className="w-full h-full bg-[#FBF8F0] p-2.5 flex flex-col justify-between select-none overflow-hidden relative font-serif text-[#2D2D2D]">
          <div className="text-center border-y-2 border-[#2D2D2D] py-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wider">THE ARTISAN GAZETTE</span>
          </div>
          {/* Broadsheet columns */}
          <div className="grid grid-cols-2 gap-1 text-[7px] text-justify leading-tight">
            <div className="border-r border-[#D4C5A9] pr-1">
              <span className="text-xs font-bold float-left mr-0.5 leading-none">E</span>
              st. {new Date().getFullYear()} Handcrafted quality goods with traditional slow-craft principles.
            </div>
            <div>
              <div className="w-full h-6 bg-[#E8E0D0] mb-0.5 flex items-center justify-center text-[10px]">☕</div>
              <div className="font-bold text-[7px]">CLASSIFIEDS</div>
            </div>
          </div>
        </div>
      )

    case 'futura':
      return (
        <div className="w-full h-full bg-[#0C0015] p-2.5 flex flex-col justify-between select-none overflow-hidden relative font-sans text-white">
          {/* Gradient blobs */}
          <div className="absolute top-1 left-2 w-12 h-12 rounded-full bg-purple-600/30 blur-md pointer-events-none"></div>
          <div className="absolute bottom-1 right-2 w-12 h-12 rounded-full bg-pink-600/30 blur-md pointer-events-none"></div>
          {/* Vision Pro Glass Panel */}
          <div className="relative z-10 bg-white/10 border border-white/20 rounded-xl p-1.5 backdrop-blur-md flex items-center justify-between">
            <div>
              <div className="text-[9px] font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">FUTURA AR</div>
              <div className="w-10 h-1 bg-white/30 rounded mt-0.5"></div>
            </div>
            <span className="text-xs">✦</span>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-1">
            <div className="bg-white/5 border border-white/10 rounded-lg p-1.5 flex items-center justify-center text-xs">🛸</div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-1.5 flex items-center justify-center text-xs">👓</div>
          </div>
        </div>
      )

    case 'lookbook':
      return (
        <div className="w-full h-full bg-[#111111] p-2.5 flex select-none overflow-hidden relative font-sans text-white">
          {/* Main Full-height Slide */}
          <div className="flex-1 bg-zinc-800 rounded p-2 flex flex-col justify-between relative overflow-hidden">
            <span className="text-[20px] font-black text-white/10 leading-none">01</span>
            <div>
              <div className="text-[9px] font-bold tracking-widest uppercase">LOOKBOOK 2026</div>
              <div className="w-12 h-1 bg-white/50 rounded mt-1"></div>
            </div>
          </div>
          {/* Scroll indicators */}
          <div className="w-3 flex flex-col items-center justify-center gap-1 pl-1">
            <div className="w-1.5 h-3 bg-white rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
          </div>
        </div>
      )

    case 'bazaar':
      return (
        <div className="w-full h-full bg-[#F7F7F7] p-2.5 flex flex-col justify-between select-none overflow-hidden relative font-sans text-gray-800">
          {/* Header with Search */}
          <div className="bg-white border-b border-gray-200 p-1 flex items-center justify-between rounded">
            <span className="text-[9px] font-bold text-[#FF6B35]">🛒 BAZAAR</span>
            <div className="w-12 h-2 bg-gray-100 rounded-full border border-[#FF6B35]/40"></div>
          </div>
          {/* Category Pill tags */}
          <div className="flex gap-1 overflow-hidden py-0.5">
            <span className="px-1.5 py-0.5 bg-[#FF6B35] text-white text-[7px] font-bold rounded-full">Best Sellers</span>
            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[7px] rounded-full">Deals</span>
          </div>
          {/* Card with Star Rating */}
          <div className="bg-white border border-gray-200 rounded p-1 flex items-center gap-1.5">
            <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-[10px]">🛍️</div>
            <div>
              <div className="w-10 h-1 bg-gray-800 rounded"></div>
              <div className="text-[7px] text-amber-400">★★★★☆</div>
            </div>
          </div>
        </div>
      )

    case 'timeline':
      return (
        <div className="w-full h-full bg-[#1A1A1A] p-2.5 flex flex-col justify-between select-none overflow-hidden relative font-serif text-[#E8E4DE]">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-1">
            <span className="text-[9px] font-light tracking-widest">GALLERY MUSEUM</span>
            <span className="text-[7px] text-zinc-500">PIECE 1/20</span>
          </div>
          {/* Framed Picture Centerpiece */}
          <div className="bg-[#0F0F0F] border border-zinc-700 p-1 flex flex-col items-center self-center shadow-lg">
            <div className="w-14 h-10 bg-zinc-800 flex items-center justify-center text-sm">🖼</div>
          </div>
          <div className="flex justify-between items-center text-[8px] text-zinc-400 font-sans">
            <span>← PREV</span>
            <span className="text-[#E8E4DE] font-bold">Acquire</span>
            <span>NEXT →</span>
          </div>
        </div>
      )

    case 'department':
      return (
        <div className="w-full h-full bg-white flex select-none overflow-hidden relative font-sans text-gray-800">
          {/* Left Category Sidebar */}
          <div className="w-10 border-r border-gray-200 p-1 bg-gray-50 flex flex-col gap-1 text-[7px]">
            <div className="font-bold text-[#1B3A5C]">DEPTS</div>
            <div className="w-7 h-1 bg-gray-300 rounded"></div>
            <div className="w-6 h-1 bg-gray-200 rounded"></div>
            <div className="w-7 h-1 bg-gray-200 rounded"></div>
          </div>
          {/* Main Product Area */}
          <div className="flex-1 p-1.5 flex flex-col justify-between">
            <div className="bg-[#1B3A5C] text-white p-1 rounded text-[8px] font-bold">DEPARTMENT STORE</div>
            <div className="grid grid-cols-2 gap-1">
              <div className="border border-gray-200 p-1 rounded">
                <div className="w-full h-5 bg-gray-100 rounded"></div>
              </div>
              <div className="border border-gray-200 p-1 rounded">
                <div className="w-full h-5 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      )

    case 'polaroid':
      return (
        <div className="w-full h-full bg-[#C4A882] p-2.5 flex flex-col justify-between select-none overflow-hidden relative font-sans text-[#4A3728]">
          <div className="flex justify-between items-center border-b border-[#B09670] pb-1">
            <span className="text-[9px] font-bold">📸 POLAROID BOARD</span>
            <span className="text-xs">📌</span>
          </div>
          {/* Tilted Polaroid Cards */}
          <div className="flex justify-center gap-1 relative my-1">
            <div className="bg-white p-1 pb-3 shadow-md -rotate-6 w-12 h-14 border border-gray-200">
              <div className="w-full h-8 bg-amber-100 flex items-center justify-center text-[10px]">📷</div>
            </div>
            <div className="bg-white p-1 pb-3 shadow-md rotate-4 w-12 h-14 border border-gray-200">
              <div className="w-full h-8 bg-[#F5E6D3] flex items-center justify-center text-[10px]">🌻</div>
            </div>
          </div>
          <div className="text-[7px] text-center font-bold tracking-wider">SCRAPBOOK CATALOG</div>
        </div>
      )

    default:
      return (
        <div className="w-full h-full bg-gradient-to-br from-amber-50 to-purple-50 flex items-center justify-center">
          <span className="text-2xl">✨</span>
        </div>
      )
  }
}
