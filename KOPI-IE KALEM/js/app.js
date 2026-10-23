// State Aplikasi
let currentCart = [];
let currentPaymentMethod = 'cash';
let activeCategory = 'All';
let searchKeyword = '';
let orderCounter = 1;

// Akumulasi Shift Rekap
let shiftCash = 0;
let shiftCashless = 0;

// Format Angka ke Rupiah
function formatIDR(amount) {
  return "Rp " + Number(amount).toLocaleString('id-ID');
}

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  renderCart();
  startLiveClock();
});

// Jam Berjalan & Tanggal
function startLiveClock() {
  const clockEl = document.getElementById('live-clock');
  const dateEl = document.getElementById('live-date');

  function update() {
    const now = new Date();
    clockEl.innerText = now.toLocaleTimeString('id-ID');
    dateEl.innerText = now.toLocaleDateString('id-ID', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  }
  update();
  setInterval(update, 1000);
}

// Render Katalog Menu
function renderMenu() {
  const container = document.getElementById('menu-grid');
  
  const filtered = MENU_DATA.filter(item => {
    const matchesCat = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-3 text-center py-10 text-stone-400 text-xs">Menu tidak ditemukan</div>`;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <button onclick="addToCart(${item.id})" 
      class="p-3 border border-stone-200 rounded-xl bg-stone-50 hover:bg-amber-50 hover:border-amber-700 text-left transition flex flex-col justify-between h-24 group">
      <div>
        <span class="text-[10px] font-semibold uppercase text-stone-400 group-hover:text-amber-800">${item.category}</span>
        <h4 class="font-bold text-stone-800 text-xs leading-snug line-clamp-2">${item.name}</h4>
      </div>
      <span class="text-amber-900 font-extrabold text-xs">${formatIDR(item.price)}</span>
    </button>
  `).join('');
}

// Filter Kategori
function filterCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.btn-category').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
  renderMenu();
}

// Pencarian Menu
function handleSearch(val) {
  searchKeyword = val;
  renderMenu();
}

// Tambah ke Keranjang
function addToCart(id) {
  const found = currentCart.find(i => i.id === id);
  if (found) {
    found.qty += 1;
  } else {
    const item = MENU_DATA.find(m => m.id === id);
    currentCart.push({ ...item, qty: 1 });
  }
  renderCart();
}

// Update Qty
function updateItemQty(id, delta) {
  const item = currentCart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    currentCart = currentCart.filter(i => i.id !== id);
  }
  renderCart();
}

// Render Keranjang
function renderCart() {
  const container = document.getElementById('cart-list');
  
  if (currentCart.length === 0) {
    container.innerHTML = `<div class="text-stone-400 text-xs text-center py-10">Belum ada pesanan aktif</div>`;
  } else {
    container.innerHTML = currentCart.map(i => `
      <div class="py-2 flex justify-between items-center text-xs">
        <div class="pr-2">
          <p class="font-bold text-stone-800 leading-tight">${i.name}</p>
          <span class="text-[11px] text-stone-400">${formatIDR(i.price)} × ${i.qty}</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="font-bold text-stone-800">${formatIDR(i.price * i.qty)}</span>
          <div class="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
            <button onclick="updateItemQty(${i.id}, -1)" class="px-2 py-0.5 hover:bg-stone-200 text-stone-700 font-bold">-</button>
            <span class="px-2 text-xs font-semibold">${i.qty}</span>
            <button onclick="updateItemQty(${i.id}, 1)" class="px-2 py-0.5 hover:bg-stone-200 text-stone-700 font-bold">+</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  const total = currentCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  document.getElementById('label-subtotal').innerText = formatIDR(total);
  document.getElementById('label-total').innerText = formatIDR(total);

  calculateKembalian();
}

// Kosongkan Keranjang
function clearCart() {
  currentCart = [];
  document.getElementById('input-cash').value = '';
  renderCart();
}

// Ganti Tab Pembayaran
function setPaymentMethod(method) {
  currentPaymentMethod = method;
  const btnCash = document.getElementById('btn-cash');
  const btnCashless = document.getElementById('btn-cashless');
  const panelCash = document.getElementById('cash-panel');
  const panelCashless = document.getElementById('cashless-panel');

  if (method === 'cash') {
    btnCash.className = 'py-2.5 rounded-xl border-2 border-amber-900 bg-amber-50 text-amber-950 font-bold text-xs flex items-center justify-center gap-1.5 transition';
    btnCashless.className = 'py-2.5 rounded-xl border-2 border-stone-200 text-stone-600 font-bold text-xs flex items-center justify-center gap-1.5 transition hover:bg-stone-50';
    panelCash.classList.remove('hidden');
    panelCashless.classList.add('hidden');
  } else {
    btnCashless.className = 'py-2.5 rounded-xl border-2 border-amber-900 bg-amber-50 text-amber-950 font-bold text-xs flex items-center justify-center gap-1.5 transition';
    btnCash.className = 'py-2.5 rounded-xl border-2 border-stone-200 text-stone-600 font-bold text-xs flex items-center justify-center gap-1.5 transition hover:bg-stone-50';
    panelCashless.classList.remove('hidden');
    panelCash.classList.add('hidden');
  }
}

// Preset Tombol Cepat Nominal Tunai
function applyPresetCash(val) {
  const total = currentCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const input = document.getElementById('input-cash');
  input.value = val === 'pas' ? total : val;
  calculateKembalian();
}

// Kalkulasi Uang Kembalian
function calculateKembalian() {
  if (currentPaymentMethod !== 'cash') return;
  const total = currentCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const received = Number(document.getElementById('input-cash').value) || 0;
  const diff = received - total;

  const label = document.getElementById('label-kembalian');
  if (diff >= 0) {
    label.innerText = formatIDR(diff);
    label.className = 'font-black text-sm text-emerald-800';
  } else {
    label.innerText = "Kurang " + formatIDR(Math.abs(diff));
    label.className = 'font-black text-sm text-red-600';
  }
}

// Eksekusi Simpan Transaksi
function submitTransaction() {
  if (currentCart.length === 0) {
    alert('Keranjang pesanan masih kosong!');
    return;
  }

  const total = currentCart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  if (currentPaymentMethod === 'cash') {
    const received = Number(document.getElementById('input-cash').value) || 0;
    if (received < total) {
      alert('Nominal uang tunai yang diterima masih kurang!');
      return;
    }
    shiftCash += total;
  } else {
    shiftCashless += total;
  }

  // Update Rekap Harian
  document.getElementById('rekap-cash').innerText = formatIDR(shiftCash);
  document.getElementById('rekap-cashless').innerText = formatIDR(shiftCashless);
  document.getElementById('rekap-total').innerText = formatIDR(shiftCash + shiftCashless);

  alert(`Transaksi Berhasil Disimpan!\nMetode: ${currentPaymentMethod.toUpperCase()}\nTotal: ${formatIDR(total)}`);

  // Lanjut ke pesanan berikutnya
  orderCounter++;
  document.getElementById('order-id').innerText = `#ORD-${String(orderCounter).padStart(3, '0')}`;
  clearCart();
}

// Reset Shift / Tutup Kasir
function resetShiftRekap() {
  if (confirm(`Tutup Shift Kasir Sekarang?\n\nTotal Tunai: ${formatIDR(shiftCash)}\nTotal QRIS: ${formatIDR(shiftCashless)}\nTotal Omzet: ${formatIDR(shiftCash + shiftCashless)}`)) {
    shiftCash = 0;
    shiftCashless = 0;
    document.getElementById('rekap-cash').innerText = 'Rp 0';
    document.getElementById('rekap-cashless').innerText = 'Rp 0';
    document.getElementById('rekap-total').innerText = 'Rp 0';
    clearCart();
    alert('Shift kasir berhasil ditutup dan rekap telah di-reset untuk shift berikutnya.');
  }
}