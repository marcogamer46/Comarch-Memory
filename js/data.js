/* ============================================================
   MEMORY.EXE — data.js
   All editable content lives here in clearly separated arrays.
   Add/edit lessons, challenges, glossary, and achievements here.
   ============================================================ */

const DATA = {
  version: "1.0",
  title: "MEMORY.EXE",
  subtitle: "Computer Architecture: Memory — study console",

  /* ---------- Modules (follow the slide flow) ---------- */
  modules: [
    { id: "hier", num: 1, title: "Memory Hierarchy", short: "HIERARCHY",
      desc: "Levels of storage from registers to disk — why small and fast beats big and slow.",
      color: "#00ff41", boss: "BH" },
    { id: "org", num: 2, title: "Memory Organization & Data Fetch", short: "ORGANIZATION",
      desc: "How memory is organized as N words × n bits, and how the fetch cycle reads a word.",
      color: "#00e5ff", boss: "BO" },
    { id: "rom", num: 3, title: "Read-Only Memory", short: "ROM",
      desc: "ROM, PROM, EPROM, EEPROM — firmware and how each type is (or isn't) erasable.",
      color: "#ffb000", boss: "BR" },
    { id: "ram", num: 4, title: "RAM & Its Classifications", short: "RAM",
      desc: "Four classification axes, DRAM vs SRAM, and what volatility means in practice.",
      color: "#c77dff", boss: "BA" },
    { id: "pack", num: 5, title: "Packaging & Standards", short: "PACKAGING",
      desc: "DIP, SIMM, DIMM, SO-DIMM, memory banks, and DDR generations.",
      color: "#ff5c8a", boss: "BP" },
    { id: "vm", num: 6, title: "Virtual Memory", short: "VIRTUAL MEM",
      desc: "Pages, swapping, page hits and faults — how the OS fakes more RAM than you have.",
      color: "#7cf2c0", boss: "BV" }
  ],

  /* ---------- Lessons ---------- */
  lessons: [
    {
      id: "hierarchy", module: "hier", title: "The Memory Hierarchy",
      text:
        "<p>Computers hide enormous speed gaps with a <strong>memory hierarchy</strong>: several levels of storage, fastest and smallest near the CPU, slower and larger further away.</p>" +
        "<ul>" +
        "<li><strong>Level 1 — Registers:</strong> &lt;1&nbsp;KB total, custom multi-port CMOS, ~0.15–0.30&nbsp;ns access, 100,000–1,000,000&nbsp;MB/s. Managed by the <em>compiler</em>, backed by <em>cache</em>.</li>" +
        "<li><strong>Level 2 — Cache:</strong> 32&nbsp;KB–8&nbsp;MB on-chip CMOS SRAM, 0.5–15&nbsp;ns, 10,000–40,000&nbsp;MB/s. Managed by <em>hardware</em>, backed by <em>main memory</em>.</li>" +
        "<li><strong>Level 3 — Main memory:</strong> &lt;512&nbsp;GB CMOS DRAM, 30–200&nbsp;ns, 5,000–20,000&nbsp;MB/s. Managed by the <em>operating system</em>, backed by <em>disk</em>.</li>" +
        "<li><strong>Level 4 — Disk storage:</strong> &gt;1&nbsp;TB magnetic disk, 5,000,000&nbsp;ns, 50–500&nbsp;MB/s. Managed by the <em>OS/operator</em>, backed by <em>other disks and DVD</em>.</li>" +
        "</ul>" +
        "<p>Moving away from the CPU, memory <strong>slows down and gets larger</strong>. Programs exploit <strong>locality</strong> — reusing nearby, recent data — so the fast, small levels do most of the work.</p>",
      why: "When a server feels fast, it's often cache hits doing the heavy lifting. And in forensics, knowing what is volatile vs what lives on disk tells you exactly what survives a power cut.",
      whyExtra: true,
      terms: ["memoryhierarchy", "registers", "cache", "mainmemory", "diskstorage", "accesstime", "bandwidth", "locality", "l1", "l2", "l3"],
      sim: "hierarchyExplorer",
      check: [
        { q: "Which level is closest to the CPU and fastest?", o: ["Registers", "Cache", "Main memory", "Disk"], a: 0 },
        { q: "Which level is managed by hardware and backed by main memory?", o: ["Registers", "Cache", "Main memory", "Disk"], a: 1 },
        { q: "True or false: moving farther from the CPU, memory gets faster.", o: ["True", "False"], a: 1 }
      ]
    },
    {
      id: "organization", module: "org", title: "Memory Organization & Data Fetch",
      text:
        "<p>A memory is organized as <strong>N words</strong>, each word <strong>n bits</strong> wide. Picture a tall list of rows — Address&nbsp;0, Address&nbsp;1, … Address&nbsp;N−1 — each row holding one word.</p>" +
        "<p>A memory with 4096 locations each storing 12 bits is a <strong>4096-word, 12-bit</strong> memory — usually written <strong>4K-word 12-bit</strong>.</p>" +
        "<p class=\"mono\">Number of words is generally 2<sup>k</sup>, where k = number of address bits. <span class=\"extra-tag\" data-kind=\"extra\">extra</span> (the slide reuses n; this is the precise form)</p>" +
        "<p>Reading a word walks a fixed <strong>fetch cycle</strong> through the <strong>MAR</strong> (address) and <strong>MDR</strong> (data) over dedicated buses:</p>" +
        "<ol>" +
        "<li>address goes from a CPU register into the <strong>MAR</strong></li>" +
        "<li>MAR places the address on the <strong>address bus</strong></li>" +
        "<li>memory locates the data</li>" +
        "<li>data travels back on the <strong>data bus</strong> into the <strong>MDR</strong></li>" +
        "<li>data moves from MDR over the CPU internal bus into a CPU register</li>" +
        "</ol>",
      why: "Every load and store your CPU makes walks this exact pipeline. Understanding bus roles lets you read timing diagrams and debug why a 'hung' system is drowning in memory traffic.",
      terms: ["word", "nwordsnbits", "mar", "mdr", "addressbus", "databus", "internalbus", "fetchcycle", "primarysubsystem"],
      sim: "addressDecoder",
      sim2: "fetchStepper",
      check: [
        { q: "A 4K × 12-bit memory stores how many locations?", o: ["4096", "4000", "12", "49,152"], a: 0 },
        { q: "Which register holds the address of the location being accessed?", o: ["MAR", "MDR", "PC", "IR"], a: 0 },
        { q: "Which register receives the data coming back from memory?", o: ["MDR", "MAR", "CSP", "ACC"], a: 0 }
      ]
    },
    {
      id: "rom", module: "rom", title: "Read-Only Memory",
      text:
        "<p><strong>ROM</strong> is nonvolatile storage for <strong>firmware</strong> — the <strong>BIOS</strong> lives here and runs before the OS loads.</p>" +
        "<ul>" +
        "<li><strong>PROM</strong> — programmable once; cannot be erased.</li>" +
        "<li><strong>EPROM</strong> — erased by ultraviolet light through a quartz window (chip removed).</li>" +
        "<li><strong>EEPROM</strong> — erased and rewritten electrically, in-circuit.</li>" +
        "</ul>" +
        "<p>A modern <strong>flash</strong> chip is an EEPROM-style descendant used for BIOS/firmware updates. <span class=\"extra-tag\" data-kind=\"extra\">extra</span></p>",
      why: "Rewritable firmware (BIOS/UEFI, EEPROM reflashing) is both an attack surface and a recovery path — always know who is allowed to write your firmware. <span class=\"extra-tag\" data-kind=\"extra\">extra</span>",
      terms: ["rom", "bios", "prom", "eprom", "eeprom", "firmware", "nonvolatile"],
      sim: "romEraser",
      check: [
        { q: "Which ROM type is erased by ultraviolet light?", o: ["PROM", "EPROM", "EEPROM", "Mask ROM"], a: 1 },
        { q: "Which type can be reprogrammed electrically while installed?", o: ["PROM", "EPROM", "EEPROM"], a: 2 },
        { q: "PROM can be…", o: ["Programmed once, never erased", "Erased with UV", "Erased electrically"], a: 0 }
      ]
    },
    {
      id: "ram", module: "ram", title: "RAM & Its Classifications",
      text:
        "<p>RAM is classified along <strong>four axes</strong>:</p>" +
        "<ul>" +
        "<li><strong>Static / dynamic</strong> — does it hold bits without refresh?</li>" +
        "<li><strong>Volatile / nonvolatile</strong> — does it survive power-off?</li>" +
        "<li><strong>Destructive / non-destructive read</strong> — does reading destroy the value?</li>" +
        "<li><strong>Removable / permanent</strong> — can it be detached from the system?</li>" +
        "</ul>" +
        "<p><strong>DRAM</strong> is dynamic — it stores charge on tiny capacitors that <strong>leak</strong>, so it must be <strong>refreshed</strong> constantly, and its read is <strong>destructive</strong> (the controller immediately restores the value). <strong>SRAM</strong> is static — it holds bits in flip-flops with <strong>no refresh</strong> and non-destructive reads, which is why it's used for on-chip cache.</p>" +
        "<p><strong>Volatile</strong> memory (RAM, cache) loses everything at power-off; <strong>nonvolatile</strong> storage (ROM, disk, flash) keeps it.</p>",
      why: "Volatile memory vanishes at power-off — a cornerstone of digital forensics. Knowing what's removable also tells you what can walk out the door with a USB stick. <span class=\"extra-tag\" data-kind=\"extra\">extra</span>",
      terms: ["dram", "sram", "static", "dynamic", "volatile", "nonvolatile", "destructiveread", "nondestructive", "removable", "permanent", "refresh", "cmos"],
      sim: "dramSramLab",
      sim2: "volatilityDemo",
      sim3: "classifierSorter",
      check: [
        { q: "Which RAM leaks charge and constantly needs refresh?", o: ["DRAM", "SRAM", "ROM", "Flash"], a: 0 },
        { q: "SRAM holds its contents without refresh.", o: ["True", "False"], a: 0 },
        { q: "Which of these is volatile?", o: ["RAM", "Disk", "DVD-R", "Flash drive"], a: 0 }
      ]
    },
    {
      id: "packaging", module: "pack", title: "Packaging & Standards",
      text:
        "<ul>" +
        "<li><strong>DIP</strong> — chips with pins down both sides, soldered/socketed directly on the system board.</li>" +
        "<li><strong>SIMM</strong> — Single Inline Memory Module: 72-pin, 32-bit wide, a row of ~8 chips on a narrow board.</li>" +
        "<li><strong>DIMM</strong> — Dual Inline Memory Module, with notched gold contacts on both edges; standard desktop RAM.</li>" +
        "<li><strong>SO-DIMM</strong> — Small Outline DIMM, the compact variant used in laptops.</li>" +
        "<li><strong>Banks</strong> — groups of sockets populated together (e.g. 4 modules side by side in parallel sockets).</li>" +
        "<li><strong>DDR4</strong> — 4th-gen double-data-rate SDRAM; each generation's key/notch prevents mixing (DDR3 won't fit a DDR4 slot).</li>" +
        "</ul>" +
        "<p><strong>Video RAM</strong> — also called <strong>MPDRAM</strong> (multiport dynamic RAM) — is a special-purpose memory serving the display controller.</p>",
      why: "Upgrading a laptop fails when you buy the wrong module — the notch won't let it seat. Knowing form factors is the difference between a five-minute upgrade and a refund. <span class=\"extra-tag\" data-kind=\"extra\">extra</span>",
      terms: ["dip", "simm", "dimm", "sodimm", "bank", "ddr4", "videoram", "mpdram"],
      sim: "packagingGallery",
      check: [
        { q: "Which module goes in a laptop?", o: ["DIMM", "SIMM", "SO-DIMM", "DIP"], a: 2 },
        { q: "A 72-pin, 32-bit module is a…", o: ["DIP", "SIMM", "DIMM", "SO-DIMM"], a: 1 },
        { q: "A DDR3 stick in a DDR4 slot:", o: ["Fits fine", "Fits with adaptor", "Will not fit"], a: 2 }
      ]
    },
    {
      id: "virtual", module: "vm", title: "Virtual Memory",
      text:
        "<p><strong>Virtual memory</strong> = main memory + a <strong>disk cache</strong> (swap space). The OS presents one large logical address space even when physical RAM is much smaller.</p>" +
        "<p>The address space is split into fixed-size <strong>pages</strong>. When a program touches a page already in physical memory, that's a <strong>page hit</strong>. When it's only on disk, it's a <strong>page fault</strong> — the OS <strong>swaps</strong> the page in (and often evicts another page to make room).</p>",
      why: "Page-fault storms in your logs are the OS begging for memory pressure relief. Knowing 'virtual' vs physical tells you what that mysterious swapped-out swap actually is.",
      terms: ["virtualmemory", "page", "swapping", "pagefault", "pagehit", "diskcache"],
      sim: "virtualPager",
      check: [
        { q: "Virtual memory = main memory + ?", o: ["Registers", "Disk cache", "Cache", "ROM"], a: 1 },
        { q: "A uniform unit of virtual memory moved between RAM and disk is a…", o: ["Page", "Bit", "Word", "Sector"], a: 0 },
        { q: "An access found already in physical memory is a…", o: ["Page fault", "Swap-out", "Page hit"], a: 2 }
      ]
    }
  ],

  /* ---------- Challenges (100 / 200 / 300 pts) ---------- */
  challenges: [
    /* ---- HIERARCHY ---- */
    { id: "H1", module: "hier", title: "Fastest Path", points: 100, difficulty: "easy",
      briefing: "You are benchmarking a new analytical server. Your query scans a cold 4 GB table, and your PM wants the latency explained — in terms of where the data actually lives.",
      artifact: "$ time ./query --scan=table_a\nreal  2m41.207s\n\nPer-level profile (avg access):\n  register      ~0.25 ns\n  cache         ~5 ns\n  main memory   ~100 ns\n  disk          ~5,000,000 ns",
      question: "Sort the four storage levels from fastest to slowest. Enter them comma-separated, fastest first, using exactly these words: register, cache, memory, disk.",
      format: "register, cache, memory, disk",
      aliases: ["register,cache,memory,disk", "registers,cache,main memory,disk", "registers, cache, memory, disk"],
      hints: ["The level physically inside the CPU — in registers — is fastest.", "Disk is the slowest of the four; it's at the bottom of the pyramid."],
      writeup: "Order: register → cache → main memory → disk. Access time grows by orders of magnitude as you move away from the CPU: ~0.25 ns → ~5 ns → ~100 ns → 5,000,000 ns.",
      lesson: "hierarchy" },

    { id: "H2", module: "hier", title: "Mystery Block", points: 100, difficulty: "easy",
      briefing: "A teammate sketches a rough diagram of your machine and labels one block 'managed by hardware' and 'backed by main memory'. You need to name that unit for the report.",
      artifact: "System diagram excerpt:\n  [ CPU ] -> [ ??? : managed by hardware, backed by main memory ]\n  [ ??? ] -> [ Main memory ]",
      question: "Which memory level is managed by hardware and backed by main memory?",
      format: "one word",
      aliases: ["cache", "the cache", "l2 cache", "level 2 cache", "l3 cache", "memory cache"],
      hints: ["It sits between the CPU and main memory.", "Its whole job is to hide main-memory latency."],
      writeup: "That's the cache (L1/L2/L3). The hardware manages it automatically, and its contents are backed by main memory.",
      lesson: "hierarchy" },

    { id: "H3", module: "hier", title: "Orders of Magnitude", points: 200, difficulty: "medium",
      briefing: "“Why is my disk benchmark so sad?” A friend compares specs: a register ticks at ~0.25 ns while disk access runs ~5,000,000 ns. Roughly how many times slower is the disk?",
      artifact: "Register access   = 0.25 ns\nDisk access       = 5,000,000 ns\nratio             = ?",
      question: "Enter the approximate multiplier as a bare number (e.g. 20000000).",
      format: "number",
      aliases: ["20000000", "20 million", "20,000,000", "20000000x", "20 million x", "20000000 times", "20,000,000 times"],
      hints: ["Divide 5,000,000 by 0.25.", "5,000,000 ÷ 0.25 = 20,000,000."],
      writeup: "5,000,000 ÷ 0.25 = 20,000,000. Disk is tens of millions of times slower than a register — the whole reason the hierarchy exists.",
      lesson: "hierarchy" },

    { id: "H4", module: "hier", title: "Chip Spec", points: 100, difficulty: "easy",
      briefing: "You are reading a chip datasheet. One storage level: typical size under 1 KB, custom multi-port CMOS, access 0.15–0.30 ns, managed by the compiler, and 'backed by cache'. Which level is being described?",
      artifact: "LEVEL UNDER TEST\n  size        < 1 KB\n  technology  custom CMOS (multi-port)\n  access      0.15–0.30 ns\n  managed by  compiler\n  backed by   cache",
      question: "Name this memory level.",
      format: "one word",
      aliases: ["registers", "register", "cpu registers", "the registers"],
      hints: ["It lives entirely inside the CPU, holding operands mid-computation.", "It is the very top of the hierarchy pyramid."],
      writeup: "Registers. Tiny (<1 KB total), extremely fast (0.15–0.30 ns), managed largely by the compiler, and 'backed by' the cache.",
      lesson: "hierarchy" },

    { id: "H5", module: "hier", title: "Bottom of the Pyramid", points: 200, difficulty: "medium",
      briefing: "An old slide describes a level: capacity over 1 TB, magnetic, access 5,000,000 ns, managed by the OS/operator, and backed by other disks and DVD. Which level is it?",
      artifact: "LEVEL UNDER TEST\n  capacity   > 1 TB\n  technology magnetic disk\n  access     5,000,000 ns\n  managed by operating system / operator\n  backed by  other disks and DVD",
      question: "Name this memory level.",
      format: "one word",
      aliases: ["disk", "disk storage", "secondary storage", "hard disk"],
      hints: ["It is the bottom of the pyramid — largest and slowest.", "Think about what holds the files when you eject a DVD."],
      writeup: "Disk storage. Capacity >1 TB, magnetic media, ~5,000,000 ns access, managed by the OS/operator, 'backed by' other disks and DVD.",
      lesson: "hierarchy" },

    { id: "BH", module: "hier", title: "BOSS: Seized Workstation", points: 300, difficulty: "hard", boss: true,
      briefing: "A forensic imager hands you a workstation after an incident. Three facts to reconcile: (1) RAM was unpowered for an hour before imaging, (2) a log line describes a level 'managed by hardware, backed by main memory', (3) you must name the nonvolatile tier that held the compromise script at rest.",
      artifact: "IR timeline — workstation seize\n  09:12  power removed\n  10:15  imaging begins\n  ...\nlog lines of interest:\n  [ hw-cache ] managed by hardware; backed by main memory\n  [ storage ] logged; persisted across reboot",
      parts: [
        { q: "Q1 — Name the volatile level that vanishes when power is removed.", format: "one word", aliases: ["ram", "dram", "sram", "main memory", "main", "primary memory"] },
        { q: "Q2 — Name the level that is managed by hardware and backed by main memory.", format: "one word", aliases: ["cache", "l2 cache", "l3 cache", "the cache"] },
        { q: "Q3 — Name the nonvolatile tier that keeps data at rest.", format: "one word", aliases: ["disk", "disk storage", "hard disk", "ssd", "secondary storage"] }
      ],
      hints: ["Volatile + power off = gone (that's RAM).", "Hardware-managed + backed by main memory = cache."],
      writeup: "RAM is volatile → wiped at power-off (a cornerstone of forensics). The hardware-managed level backed by main memory is the cache. Persistent at-rest data lives on disk.",
      lesson: "hierarchy" },

    /* ---- ORGANIZATION ---- */
    { id: "O1", module: "org", title: "Spec-Sheet Name", points: 100, difficulty: "easy",
      briefing: "You open a memory datasheet: 4096 locations, each storing 12 bits. Documentation wants the standard 'X-word Y-bit' name.",
      artifact: "MEMORY DEVICE\n  locations   4096\n  word size   12 bits\n  naming convention: <#words> word <bits>-bit",
      question: "What is this memory called? Give the standard description, e.g. '4K word 12-bit'.",
      format: "4K word 12-bit",
      aliases: ["4k word 12-bit", "4k word 12 bit", "4096 word 12-bit", "4096-word 12-bit memory", "4k x 12-bit", "4k word 12-bit memory", "4k word 12-bit ram"],
      hints: ["4096 locations = 4K (K = 1024).", "Follow the pattern '<words> word <bits>-bit'."],
      writeup: "4096 locations × 12 bits = a 4096-word, 12-bit memory, usually written '4K word 12-bit'. The 4K refers to 4096 (4 × 1024).",
      lesson: "organization" },

    { id: "O2", module: "org", title: "Total Bits", points: 200, difficulty: "medium",
      briefing: "The spec sheet says 4K word 12-bit. Procurement asks: how many bits does it store in total?",
      artifact: "4K x 12-bit\ntotal bits = ?",
      question: "Compute the total number of bits stored (bare number).",
      format: "number",
      aliases: ["49152", "49152 bits", "49,152", "49152bits", "49152b"],
      hints: ["4K = 4096 locations.", "Multiply locations by bits per word: 4096 × 12."],
      writeup: "4096 × 12 = 49,152 bits ≈ 6 KiB. Total storage = number of words × word width.",
      lesson: "organization" },

    { id: "O3", module: "org", title: "Addressable Locations", points: 200, difficulty: "medium",
      briefing: "A memory is wired with a 12-bit address bus. How many distinct locations can it address?",
      artifact: "address bus = 12 bits\nlocations = ?",
      question: "Enter the number of addressable locations (bare number).",
      format: "number",
      aliases: ["4096", "4096 locations", "2^12", "2 to the 12"],
      hints: ["Addresses are binary: 12 bits give 2^12 combinations.", "2^12 = 4096."],
      writeup: "With 12 address bits you can address 2^12 = 4096 locations — which is why '4K' memory needs exactly 12 address lines.",
      lesson: "organization" },

    { id: "O4", module: "org", title: "Address Width", points: 100, difficulty: "easy",
      briefing: "You need to build a memory controller for a 4K-word memory. How many address bits are required to reach all its locations?",
      artifact: "target: address a 4K-word memory\naddress bits = ?",
      question: "How many address bits are needed? (bare number)",
      format: "number",
      aliases: ["12", "12 bits"],
      hints: ["4K = 4096 = 2^12.", "The exponent equals the number of address bits."],
      writeup: "4096 = 2^12, so you need 12 address bits. In general, N locations need log2(N) address bits (N = 2^k).",
      lesson: "organization" },

    { id: "O5", module: "org", title: "Fetch Order", points: 200, difficulty: "medium",
      briefing: "You are tracing one read cycle. Put the five components in the order the data's journey touches them during a fetch: MAR, address bus, memory, data bus, MDR.",
      artifact: "FETCH CYCLE — components involved\n  (1) MAR         (2) address bus\n  (3) memory      (4) data bus\n  (5) MDR\nOrder = ?",
      question: "Enter the five components in order, comma-separated, using exactly: MAR, address bus, memory, data bus, MDR.",
      format: "MAR, address bus, memory, data bus, MDR",
      aliases: ["mar,address bus,memory,data bus,mdr", "mar, address bus, memory, data bus, mdr", "mar,address bus,memory,data bus,mdr"],
      hints: ["The address ends up in the MAR first — step 1 of the fetch.", "After memory locates the data, it returns over the data bus into the MDR."],
      writeup: "MAR → address bus → memory → data bus → MDR. First the address is latched into the MAR, placed on the address bus, memory decodes it, then data returns on the data bus into the MDR. (Final hop: MDR → CPU internal bus → CPU register.)",
      lesson: "organization" },

    { id: "BO", module: "org", title: "BOSS: Garage Retro Machine", points: 300, difficulty: "hard", boss: true,
      briefing: "You diagnose a garage-built retro machine whose arithmetic comes back wrong. You suspect the 4K-word, 12-bit SRAM bank is mis-wired. Walk the interface: count its address bits, its total bit capacity, then name the register that should feed the address bus.",
      artifact: "suspect bank: 4K-word, 12-bit static RAM\ntrace ends at the memory interface:\n  register X feeds the address bus\n  register Y receives the data bus",
      parts: [
        { q: "How many address bits does a 4K-word bank require?", format: "number", aliases: ["12", "12 bits"] },
        { q: "What is the total bit capacity of a 4K × 12-bit bank?", format: "number", aliases: ["49152", "49152 bits"] },
        { q: "Which register places the address onto the address bus?", format: "acronym", aliases: ["mar", "memory address register"] }
      ],
      hints: ["4K = 4096 = 2^12.", "Total bits = 4096 × 12."],
      writeup: "12 address bits; total 49,152 bits; the MAR (Memory Address Register) feeds the address bus, while the MDR handles returned data.",
      lesson: "organization" },

    /* ---- ROM ---- */
    { id: "R1", module: "rom", title: "UV Erase", points: 100, difficulty: "easy",
      briefing: "A technician wants to reprogram old firmware chips. One chip type must be removed from the board and exposed to ultraviolet light to erase. Which type is that?",
      artifact: "Erase methods seen in the lab:\n  [ ] ultraviolet light (chip removed)\n  [ ] electrical signal in-circuit\n  [ ] cannot be erased",
      question: "Which ROM type is erased by ultraviolet light?",
      format: "one acronym",
      aliases: ["eprom", "erasable programmable read-only memory"],
      hints: ["E = Erasable — the whole point.", "It has a clear quartz window to let the UV in."],
      writeup: "EPROM (Erasable Programmable Read-Only Memory). UV light erases it through its quartz window; PROM can't be erased at all, and EEPROM erases electrically.",
      lesson: "rom" },

    { id: "R2", module: "rom", title: "In-Circuit Rewrite", points: 100, difficulty: "easy",
      briefing: "You manage fleet BIOS updates. Which ROM type can be erased and reprogrammed electrically while installed in the circuit — no removal, no UV?",
      artifact: "candidates: PROM / EPROM / EEPROM\ndesired: erase & rewrite in-circuit, electrically",
      question: "Which ROM type supports electrical, in-circuit reprogramming?",
      format: "one acronym",
      aliases: ["eeprom", "electrically erasable programmable read-only memory", "flash"],
      hints: ["The double E means Electrically Erasable.", "BIOS/firmware updates routinely rely on this."],
      writeup: "EEPROM — Electrically Erasable Programmable Read-Only Memory — is erased and rewritten electrically in-circuit. (Flash memory is a modern EEPROM-style descendant — extra.)",
      lesson: "rom" },

    { id: "R3", module: "rom", title: "Expand It", points: 200, difficulty: "medium",
      briefing: "A support ticket says 'reflash the EEPROM'. Spell out the full meaning.",
      artifact: "term: EEPROM\nmeaning: ____ ____ ____ _____-____ ______",
      question: "Expand EEPROM to its full name.",
      format: "four words",
      aliases: ["electrically erasable programmable read-only memory", "electrically erasable programmable readonly memory"],
      hints: ["E = Electrically, E = Erasable.", "P = Programmable; R-O-M = Read-Only Memory."],
      writeup: "Electrically Erasable Programmable Read-Only Memory.",
      lesson: "rom" },

    { id: "R4", module: "rom", title: "BIOS Update Path", points: 200, difficulty: "medium",
      briefing: "A motherboard ships with upgradeable firmware. You push a recovery image to the BIOS ROM — this relies on a ROM class that can be rewritten in place. Which one does that?",
      artifact: "firmware update path: in-circuit rewrite of BIOS ROM",
      question: "Which ROM type makes an in-place firmware (BIOS) update possible?",
      format: "one acronym",
      aliases: ["eeprom", "flash", "flash rom", "electrically erasable programmable read-only memory"],
      hints: ["It erases and rewrites with voltage, no chip removal.", "It powers most modern firmware updates."],
      writeup: "EEPROM (or flash memory). Rewritable firmware is also a security surface — an attacker who can write it can persist code past a reinstall. (extra)",
      lesson: "rom" },

    { id: "R5", module: "rom", title: "Mask ROM Catch", points: 100, difficulty: "easy",
      briefing: "A foundry can burn a very cheap 'mask ROM' for your product, but you realize there's a catch about changing it later. What is the fundamental limitation?",
      artifact: "option: mask ROM (programmed at manufacture)",
      question: "State the fundamental limitation of mask ROM in one short phrase.",
      format: "short phrase",
      aliases: ["cannot be changed", "programmed at manufacture", "fixed at factory", "not programmable", "one-time fixed", "read only", "cannot be reprogrammed", "contents are fixed"],
      hints: ["Its pattern is set during fabrication.", "There is no erase mechanism at all."],
      writeup: "Mask ROM's contents are fixed when it is manufactured; it cannot be changed afterward. Choose PROM/EPROM/EEPROM if you might need to rewrite. (extra — mask ROM is beyond the slide deck.)",
      lesson: "rom" },

    { id: "BR", module: "rom", title: "BOSS: Arcade Board Firmware", points: 300, difficulty: "hard", boss: true,
      briefing: "A laserdisc-era arcade board won't boot. You trace the firmware: one socketed chip with a quartz window reads 0xFF everywhere; another 'one-time programmable' chip shows valid code but is blank in the back half. Match each to its type, then pick which one can't be erased.",
      artifact: "system firmware cart:\n  chip A: quartz window, currently blank (erased)\n  chip B: one-time programmable, partially written",
      parts: [
        { q: "Chip A (quartz window, erases under UV) is what type?", format: "one acronym", aliases: ["eprom", "erasable programmable read-only memory"] },
        { q: "Chip B (one-time programmable) is what type?", format: "one acronym", aliases: ["prom", "programmable read-only memory"] },
        { q: "Which chip cannot be erased? (A or B)", format: "letter", aliases: ["b", "prom", "chip b", "chipb"] }
      ],
      hints: ["UV + erasable = EPROM.", "One-time programmable = PROM."],
      writeup: "Chip A is EPROM (UV-erasable); chip B is PROM (one-time programmable, cannot be erased). Never confuse the two — if you need rewrite capability, pick EPROM/EEPROM.",
      lesson: "rom" },

    /* ---- RAM ---- */
    { id: "A1", module: "ram", title: "Refresh Cycle", points: 100, difficulty: "easy",
      briefing: "A kernel log warns: 'memory controller refreshing DRAM constantly.' Which RAM technology does this describe?",
      artifact: "[memctl] refresh requested for bank 0x3\n[memctl] refresh ... repeated\n[memctl] refresh ... repeated",
      question: "Which RAM type requires constant refresh because it leaks charge?",
      format: "one acronym",
      aliases: ["dram", "dynamic ram", "dynamic random access memory"],
      hints: ["D is for Dynamic.", "It stores charge on tiny capacitors that leak."],
      writeup: "DRAM (Dynamic RAM). Its capacitor cells leak charge, so the controller must refresh them constantly. That's why DRAM is 'dynamic'.",
      lesson: "ram" },

    { id: "A2", module: "ram", title: "Destructive Read", points: 200, difficulty: "medium",
      briefing: "You overhear a memory-architecture term: a read operation that destroys the stored value, forcing an immediate 'restore' cycle. Which RAM technology does this?",
      artifact: "read sequence observed:\n  read -> value on data bus -> value lost internally -> restore",
      question: "Which RAM technology has a destructive read that requires a restore cycle?",
      format: "one acronym",
      aliases: ["dram", "dynamic ram"],
      hints: ["Reading a DRAM cell discharges its capacitor.", "The controller then regenerates (restores) the value."],
      writeup: "DRAM. Reading a cell drains its capacitor (destructive read), so the controller immediately restores the value. SRAM reads are non-destructive.",
      lesson: "ram" },

    { id: "A3", module: "ram", title: "Cache Technology", points: 100, difficulty: "easy",
      briefing: "You are picking a cache memory for a CPU: it must hold data without refresh and read non-destructively. Which technology fits?",
      artifact: "cache tech selector\n  required: no refresh, non-destructive read",
      question: "Which RAM technology holds data without refresh?",
      format: "one acronym",
      aliases: ["sram", "static ram", "static random access memory"],
      hints: ["S is for Static.", "It uses flip-flops, not leaking capacitors."],
      writeup: "SRAM (Static RAM). It holds bits in flip-flops and needs no refresh. It's faster but larger and pricier than DRAM — hence its role as cache.",
      lesson: "ram" },

    { id: "A4", module: "ram", title: "Removable & Nonvolatile", points: 200, difficulty: "medium",
      briefing: "A physical-inventory worksheet lists devices. Count how many are BOTH nonvolatile AND removable: DVD-R, hard disk, flash drive, RAM, optical disk, USB drive, hot-swappable disk.",
      artifact: "devices:\n  DVD-R\n  hard disk\n  flash drive\n  RAM\n  optical disk\n  USB drive\n  hot-swappable disk\n\nnonvolatile AND removable = ?",
      question: "How many of these are both nonvolatile and removable? (bare number)",
      format: "number",
      aliases: ["5", "five"],
      hints: ["Cross out RAM first — it's volatile.", "Internal hard disk is nonvolatile but not removable; DVD/optical/flash/USB/hot-swap are all removable."],
      writeup: "DVD-R, flash drive, optical disk, USB drive, and hot-swappable disk = 5. RAM is volatile; an internal hard disk is nonvolatile but not removable.",
      lesson: "ram" },

    { id: "A5", module: "ram", title: "Power-Off", points: 100, difficulty: "easy",
      briefing: "In an investigation, RAM was powered down before imaging. You must state which class of memory lost everything.",
      artifact: "power removed at 09:12; imaging at 10:15",
      question: "Which type of memory loses its contents at power-off (volatile)?",
      format: "one word",
      aliases: ["ram", "dram", "sram", "main memory", "cache"],
      hints: ["Anything in the RAM family is volatile.", "Cache also dies with power."],
      writeup: "RAM (DRAM/SRAM) and cache are volatile — power-off wipes them. That's why forensics depends on evidence persisting to disk/SSD.",
      lesson: "ram" },

    { id: "A6", module: "ram", title: "SRAM vs DRAM", points: 200, difficulty: "medium",
      briefing: "Pick the statement that is true of SRAM but NOT of DRAM: it needs refresh / it is dynamic / it holds bits without refresh / it uses capacitor storage.",
      artifact: "TRUE of SRAM only:\n  [ ] needs constant refresh\n  [ ] is dynamic\n  [ ] holds bits without refresh\n  [ ] uses capacitor storage",
      question: "Which property belongs to SRAM but not DRAM?",
      format: "short phrase",
      aliases: ["holds bits without refresh", "no refresh", "holds without refresh", "static", "does not need refresh"],
      hints: ["Static holds its state.", "DRAM is the one that must be refreshed."],
      writeup: "SRAM holds bits without refresh (static storage via flip-flops) — unlike DRAM, which leaks and needs refresh.",
      lesson: "ram" },

    { id: "BA", module: "ram", title: "BOSS: Embedded Design Brief", points: 300, difficulty: "hard", boss: true,
      briefing: "An embedded design brief: you need a small, fast, battery-less buffer that keeps its contents while power stays on but may vanish at power-off, and a separate keystore on removable media that must survive reboot. Reconcile the three requirements.",
      artifact: "design targets:\n  1) working buffer: must be FAST, holds while powered, no refresh\n  2) keystore: on a removable stick, must survive power-off",
      parts: [
        { q: "Which RAM technology fits the fast, no-refresh buffer?", format: "one acronym", aliases: ["sram", "static ram"] },
        { q: "This buffer is volatile or notvolatile? Answer volatile or nonvolatile.", format: "word", aliases: ["volatile"] },
        { q: "The removable stick keystore is volatile or nonvolatile? Answer volatile or nonvolatile.", format: "word", aliases: ["nonvolatile", "non-volatile", "not volatile"] }
      ],
      hints: ["Fast + no refresh = static.", "Remember: flash/USB sticks keep data across reboots — that's nonvolatile."],
      writeup: "SRAM for the fast no-refresh buffer. The buffer is volatile (it dies at power-off). The removable stick keystore is nonvolatile — it persists — which is exactly why removable media matter for data at rest.",
      lesson: "ram" },

    /* ---- PACKAGING ---- */
    { id: "P1", module: "pack", title: "Laptop Module", points: 100, difficulty: "easy",
      briefing: "You're upgrading a laptop's RAM and must buy a small-outline module. Which form factor does a laptop take?",
      artifact: "laptop memory slot: compact outline, used for DDR SO-DIMM",
      question: "Which module type is used in laptops?",
      format: "hyphenated name",
      aliases: ["so-dimm", "small outline dimm", "sodimm", "so dimm"],
      hints: ["SO = Small Outline.", "The smaller sibling of a DIMM, for cramped machines."],
      writeup: "SO-DIMM (Small Outline DIMM) — the compact module used in laptops and small-form-factor systems.",
      lesson: "packaging" },

    { id: "P2", module: "pack", title: "Retro Module", points: 200, difficulty: "medium",
      briefing: "A classic 486-era system needs memory: a narrow module, 72 pins, 32 bits wide, chips in a single row. Which module family is this?",
      artifact: "module found in the reader:\n  pins: 72\n  width: 32 bits\n  layout: 8 chips in one row, narrow board",
      question: "Which module type is 72-pin and 32-bit wide?",
      format: "one acronym",
      aliases: ["simm", "single inline memory module"],
      hints: ["Single-sided edge contacts = Single Inline.", "72-pin identifies the classic SIMM."],
      writeup: "SIMM (Single Inline Memory Module) — 72-pin, 32-bit, with a row of chips on a narrow board. DIMM came later and is dual-inline.",
      lesson: "packaging" },

    { id: "P3", module: "pack", title: "DDR Mix-Up", points: 200, difficulty: "medium",
      briefing: "You grab a DDR3 stick and try to seat it in a DDR4 desktop slot. Will it fit?",
      artifact: "stick: DDR3      slot: DDR4\nnotch alignment?: check",
      question: "Will a DDR3 module fit in a DDR4 slot? Answer yes or no.",
      format: "yes / no",
      aliases: ["no", "n", "won't fit", "will not fit", "does not fit", "nah", "nope", "cannot"],
      hints: ["Each DDR generation moves the physical notch/key.", "Mismatched keys make seating impossible."],
      writeup: "No. Each DDR generation (DDR3, DDR4, …) uses a different key/notch position, so a DDR3 stick won't seat in a DDR4 slot — and vice versa.",
      lesson: "packaging" },

    { id: "P4", module: "pack", title: "Vintage Chips", points: 100, difficulty: "easy",
      briefing: "On a vintage board, memory chips stand upright with pins down both sides, soldered or socketed directly on the system board. What package is this?",
      artifact: "board photo note: small rectangular chips, pins on both sides, direct-soldered/socketed",
      question: "Which package has pins on both sides and mounts directly on the system board?",
      format: "one acronym",
      aliases: ["dip", "dual inline package", "dip package"],
      hints: ["Dual Inline Package = two rows of pins.", "The ancestor of today's modules."],
      writeup: "DIP (Dual Inline Package) — chips with pins down both sides, soldered/socketed straight onto the system board.",
      lesson: "packaging" },

    { id: "P5", module: "pack", title: "Fill the Banks", points: 200, difficulty: "medium",
      briefing: "A memory guide says that to add RAM you populate 'banks' — groups of sockets filled together. What is the term for a group of sockets populated together?",
      artifact: "adding memory: fill ______ (groups of sockets) together",
      question: "What is a group of memory sockets populated together called?",
      format: "one word",
      aliases: ["bank", "memory bank", "a bank"],
      hints: ["It's the same word a memory vendor uses for a filled group.", "Plural: banks."],
      writeup: "A bank — a group of memory sockets populated together to add usable memory (for example, matching DIMMs in parallel slots).",
      lesson: "packaging" },

    { id: "BP", module: "pack", title: "BOSS: Refurbisher's Bin", points: 300, difficulty: "hard", boss: true,
      briefing: "A refurbisher sorts a bin of modules and asks three questions: identify the 72-pin, 32-bit single-row module; identify the laptop's small-outline type; and confirm whether a DDR4 module fits a DDR3 board.",
      artifact: "bin contents:\n  72-pin, 32-bit, single-row module\n  small-outline laptop module\n  DDR4 module in hand; DDR3 boards on rack",
      parts: [
        { q: "Identify the 72-pin, 32-bit, single-row module.", format: "one acronym", aliases: ["simm", "single inline memory module"] },
        { q: "Which small-outline module type fits laptops?", format: "hyphenated name", aliases: ["so-dimm", "sodimm", "small outline dimm"] },
        { q: "Can a DDR4 module fit a DDR3 board? Answer yes or no.", format: "yes / no", aliases: ["no", "n", "cannot", "won't fit", "will not fit"] }
      ],
      hints: ["72-pin single row = SIMM.", "DDR generations have different notches — DDR4 ≠ DDR3."],
      writeup: "SIMM for the 72-pin 32-bit row; SO-DIMM for laptops; DDR4 will not fit a DDR3 board (the key placement differs). Always match the module to the board's standard.",
      lesson: "packaging" },

    /* ---- VIRTUAL MEMORY ---- */
    { id: "V1", module: "vm", title: "Swap Storm", points: 100, difficulty: "easy",
      briefing: "A log spams 'page fault' and a process's RSS keeps growing while physical RAM is full. The OS silently moves pages out to the swap area. What is this whole mechanism called?",
      artifact: "[mm] page fault handled: swap-in page 0x14\n[mm] page fault handled: swap-in page 0x21\n[mm] pressure high; swap-out active",
      question: "What is the mechanism of moving pages between RAM and disk called?",
      format: "one word",
      aliases: ["swapping", "paging", "swap", "demand paging"],
      hints: ["The verb for trading pages with the disk.", "When RAM is full, the OS starts doing this."],
      writeup: "Swapping (or paging). The OS moves pages between physical memory and the disk-backed swap/cache area, keeping more address space alive than there is RAM.",
      lesson: "virtual" },

    { id: "V2", module: "vm", title: "The Equation", points: 200, difficulty: "medium",
      briefing: "Your textbook diagram labels a formula: virtual memory equals main memory plus something else that lives on disk. Fill in the missing piece.",
      artifact: "virtual memory = main memory + ________",
      question: "Virtual memory equals main memory plus what?",
      format: "two words",
      aliases: ["disk cache", "swap", "swap space", "disk", "cache on disk", "swap file", "the disk cache"],
      hints: ["The extra storage lives on the disk.", "A short common name starts with 's'."],
      writeup: "Virtual memory = main memory + the disk cache (swap space). The OS presents this combined logical address space to processes; pages spill to disk when RAM is full.",
      lesson: "virtual" },

    { id: "V3", module: "vm", title: "The Unit", points: 200, difficulty: "medium",
      briefing: "During memory management, the OS breaks the address space into uniform fixed-size blocks that move between RAM and disk. What is one such block called?",
      artifact: "unit: fixed-size block of a virtual address space\ntask: moved between physical RAM and disk",
      question: "What is one fixed-size unit of virtual memory moved between RAM and disk called?",
      format: "one word",
      aliases: ["page", "a page", "memory page", "virtual page"],
      hints: ["It's the smallest granularity of paging.", "Same word as the leaves of a book."],
      writeup: "A page — a fixed-size block of a virtual address space. Demand paging moves pages between physical RAM and the disk cache on access.",
      lesson: "virtual" },

    { id: "V4", module: "vm", title: "No Disk Trip", points: 100, difficulty: "easy",
      briefing: "When a program accesses a virtual page that is already resident in physical memory, no disk I/O is needed. What is this event called?",
      artifact: "access to page 0x07 — already resident in RAM\ndisk I/O: none",
      question: "What is it called when an accessed page is already in physical memory?",
      format: "two words",
      aliases: ["page hit", "hit", "a hit"],
      hints: ["The opposite of a fault.", "No disk trip required."],
      writeup: "A page hit — the page is already in physical memory, so no disk transfer happens. The opposite is a page fault (the page must be swapped in).",
      lesson: "virtual" },

    { id: "BV", module: "vm", title: "BOSS: Thrashing DB Node", points: 300, difficulty: "hard", boss: true,
      briefing: "You tune a database VM that keeps hitting the disk under load. Chain the three answers: the fixed-size unit of virtual memory, the event when an accessed page is already in RAM, and what the OS adds to main memory to create virtual memory.",
      artifact: "perf: huge disk pressure under load; RAM 64 GiB; workload footprint ~200 GiB",
      parts: [
        { q: "What is a fixed-size unit of virtual memory called?", format: "one word", aliases: ["page", "a page"] },
        { q: "What is it called when an accessed page is already resident (no disk)?", format: "two words", aliases: ["page hit", "hit"] },
        { q: "Virtual memory = main memory + ?", format: "two words", aliases: ["disk cache", "swap", "disk", "cache"] }
      ],
      hints: ["Fixed-size unit = page.", "Already resident = hit."],
      writeup: "Units are pages; a resident access is a page hit; virtual memory = main memory + disk cache. Heavy page faults mean you're thrashing against the disk — cut the footprint or add RAM.",
      lesson: "virtual" }
  ],

  /* ---------- Glossary (every term in the PDF) ---------- */
  glossary: [
    { id: "memoryhierarchy", term: "Memory hierarchy", def: "Levels of storage between the CPU and permanent media, ordered by speed and size (registers → cache → main memory → disk)." },
    { id: "registers", term: "Registers", def: "Tiny, fastest storage inside the CPU (<1 KB total), holding current operands." },
    { id: "cache", term: "Cache", def: "Small high-speed memory (SRAM) between the CPU and main memory; managed by hardware." },
    { id: "l1", term: "L1", def: "Level-1 cache — on-chip with the CPU core; the smallest and fastest cache." },
    { id: "l2", term: "L2", def: "Level-2 cache — on-chip, larger than L1." },
    { id: "l3", term: "L3", def: "Level-3 cache — outside the CPU chip, shared, larger still." },
    { id: "primarysubsystem", term: "Primary memory subsystem", def: "The CPU plus L1/L2/L3 cache plus main memory behind the divider." },
    { id: "mainmemory", term: "Main memory", def: "Main memory (DRAM), <512 GB, accessed over the system bus; volatile." },
    { id: "diskstorage", term: "Disk storage", def: "Magnetic (or SSD) bulk storage >1 TB; nonvolatile; very slow compared to RAM." },
    { id: "accesstime", term: "Access time", def: "Time to read or write a location; ranges from ~0.25 ns (register) to ~5,000,000 ns (disk)." },
    { id: "bandwidth", term: "Bandwidth", def: "The data transfer rate a memory level can sustain, in MB/sec." },
    { id: "locality", term: "Locality", def: "Programs reuse nearby, recent data — the reason small fast caches pay off." },
    { id: "word", term: "Word", def: "A unit of data a memory reads or writes at once; n bits wide." },
    { id: "nwordsnbits", term: "N words × n bits", def: "Memory organized as N words, each n bits wide — the standard picture." },
    { id: "mar", term: "MAR", def: "Memory Address Register — holds the address of the location being accessed." },
    { id: "mdr", term: "MDR", def: "Memory Data Register — holds data just read from (or to be written to) memory." },
    { id: "addressbus", term: "Address bus", def: "Bus carrying the address from the MAR to memory." },
    { id: "databus", term: "Data bus", def: "Bus carrying data between memory and the MDR." },
    { id: "internalbus", term: "CPU internal bus", def: "Bus inside the CPU that links registers, MAR, and MDR." },
    { id: "fetchcycle", term: "Fetch cycle", def: "The sequence of steps used to read a word from memory (register → MAR → address bus → memory → data bus → MDR → register)." },
    { id: "rom", term: "ROM", def: "Read-Only Memory — nonvolatile; contents are normally fixed." },
    { id: "bios", term: "BIOS", def: "Basic Input/Output System — firmware that boots the machine before the OS." },
    { id: "prom", term: "PROM", def: "Programmable ROM — can be programmed once; not erasable." },
    { id: "eprom", term: "EPROM", def: "Erasable Programmable ROM — erased by ultraviolet light through a quartz window." },
    { id: "eeprom", term: "EEPROM", def: "Electrically Erasable Programmable ROM — erased and rewritten with voltage in-circuit." },
    { id: "firmware", term: "Firmware", def: "Software stored in ROM/EEPROM, such as BIOS or UEFI." },
    { id: "volatile", term: "Volatile", def: "Contents are lost when power is removed (RAM, cache)." },
    { id: "nonvolatile", term: "Nonvolatile", def: "Contents persist without power (ROM, disk, flash)." },
    { id: "dram", term: "DRAM", def: "Dynamic RAM — stores charge on capacitors that leak, so it must be refreshed; its read is destructive." },
    { id: "sram", term: "SRAM", def: "Static RAM — holds bits in flip-flops with no refresh; reads are non-destructive (used for cache)." },
    { id: "static", term: "Static", def: "Storage that holds bits without refresh (SRAM flip-flops)." },
    { id: "dynamic", term: "Dynamic", def: "Storage that leaks and must be refreshed (DRAM capacitors)." },
    { id: "destructiveread", term: "Destructive read", def: "A read that destroys the stored value (DRAM), forcing a restore cycle." },
    { id: "nondestructive", term: "Non-destructive read", def: "A read that leaves the stored value intact (SRAM)." },
    { id: "removable", term: "Removable", def: "Media that can be detached from the system (USB, optical)." },
    { id: "permanent", term: "Permanent", def: "Storage fixed within the system (internal disk, soldered RAM)." },
    { id: "refresh", term: "Refresh", def: "Periodic rewriting of DRAM cells to replenish leaked charge." },
    { id: "cmos", term: "CMOS", def: "Complementary Metal-Oxide-Semiconductor — the technology used for registers, cache, and DRAM." },
    { id: "dip", term: "DIP", def: "Dual Inline Package — a chip with pins on both sides, mounted directly on the system board." },
    { id: "simm", term: "SIMM", def: "Single Inline Memory Module — 72-pin, 32-bit, one row of chips on a narrow board." },
    { id: "dimm", term: "DIMM", def: "Dual Inline Memory Module — contacts on both edges; common desktop RAM." },
    { id: "sodimm", term: "SO-DIMM", def: "Small Outline DIMM — the compact module used in laptops." },
    { id: "bank", term: "Memory bank", def: "A group of memory sockets populated together." },
    { id: "ddr4", term: "DDR4", def: "4th-generation double-data-rate SDRAM; the module's key/notch prevents mixing generations." },
    { id: "videoram", term: "Video RAM", def: "Special RAM for video adapters and 3-D accelerators; also called MPDRAM (multiport dynamic RAM)." },
    { id: "mpdram", term: "MPDRAM", def: "Multiport dynamic RAM — special RAM for video adapters and 3-D accelerators; often a factor determining video performance." },
    { id: "virtualmemory", term: "Virtual memory", def: "Logical address space = main memory + disk cache, presented by the OS." },
    { id: "page", term: "Page", def: "A fixed-size unit of a virtual address space moved between RAM and disk." },
    { id: "swapping", term: "Swapping", def: "Moving pages between physical memory and the disk cache (paging)." },
    { id: "pagefault", term: "Page fault", def: "An access to a page not resident in RAM — triggers a swap-in from disk." },
    { id: "pagehit", term: "Page hit", def: "An access to a page already resident in RAM — no disk I/O." },
    { id: "diskcache", term: "Disk cache", def: "The disk-backed portion of virtual memory (swap space)." }
  ],

  /* ---------- Achievements (15+) ---------- */
  achievements: [
    { id: "firstblood",  name: "First Blood",   desc: "Solve your first challenge.",                       ico: "⚔" },
    { id: "solver10",    name: "File Hunter",    desc: "Solve 10 challenges.",                               ico: "⚬" },
    { id: "solver25",    name: "Cryptarch",      desc: "Solve 25 challenges.",                               ico: "⚬" },
    { id: "allclear",    name: "Clean Sweep",    desc: "Solve all 30 regular challenges.",                   ico: "⚑" },
    { id: "bosslayer",   name: "Boss Slayer",    desc: "Solve a BOSS challenge.",                            ico: "☠" },
    { id: "allboss",     name: "Overlord",       desc: "Solve all 6 BOSS challenges.",                       ico: "☠" },
    { id: "nohints",     name: "No Hints Used",  desc: "Solve 5 challenges without spending any hints.",      ico: "★" },
    { id: "speedrun",    name: "Speed Run",      desc: "Solve a challenge in under 45 seconds.",              ico: "⚡" },
    { id: "scholar",     name: "Scholar",        desc: "Mark all 6 lessons as learned.",                     ico: "⚜" },
    { id: "perfectexam",  name: "Perfect Exam",   desc: "Score 100% on an exam run.",                          ico: "✓" },
    { id: "quickperfect", name: "Quick Clean",    desc: "Answer every quick-check question correctly on a lesson.", ico: "✧" },
    { id: "streak7",     name: "Week One",       desc: "Reach a 7-day streak.",                              ico: "✷" },
    { id: "streak14",    name: "Fortnight",      desc: "Reach a 14-day streak.",                             ico: "✷" },
    { id: "daily1",      name: "Daily Grind",    desc: "Complete a Daily Challenge.",                         ico: "☑" },
    { id: "daily5",      name: "Consistent",     desc: "Complete 5 Daily Challenges.",                        ico: "☑" },
    { id: "hoarder",     name: "Hoarder",        desc: "Unlock 8 achievements.",                             ico: "✤" }
  ],

  /* ---------- Rank ladder (XP thresholds) ---------- */
  ranks: [
    { name: "Bit",       xp: 0 },
    { name: "Byte",      xp: 120 },
    { name: "Word",      xp: 400 },
    { name: "Cache Line", xp: 900 },
    { name: "Page",      xp: 1800 },
    { name: "Kernel",    xp: 3200 },
    { name: "Shell",     xp: 5200 },
    { name: "Daemon",    xp: 8000 },
    { name: "Superuser", xp: 12000 }
  ],

  /* ---------- XP grants ---------- */
  xp: { lesson: 50, quickcheck: 20, bossbonus: 150, daily: 40, examPerfect: 60 }
};
