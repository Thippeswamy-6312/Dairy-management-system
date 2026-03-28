const API_BASE = "http://localhost/milk/php/";

// State
let customersData = [];

// ── INIT ──
window.onload = () => {
  // Set Date Chip
  document.getElementById("currentDateChip").innerText = new Date().toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  
  // Set Default Dates in Modals
  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById('r-date').value = todayStr;
  document.getElementById('p-date').value = todayStr;

  // Setup Sidebar Navigation
  document.querySelectorAll('.sb-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
      el.classList.add('active');
      const pageId = el.getAttribute('data-page');
      showPage(pageId);
    });
  });

  // Initial loads
  loadDashboard();
  loadCustomers();
  loadRecords();
  loadPayments();
};

// ── NAVIGATION ──
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');

  const titles = {
    'dashboard': 'Overview Dashboard',
    'customers': 'Customer Management',
    'records': 'Milk Collections',
    'payments': 'Payment Tracker'
  };
  document.getElementById('pageTitle').innerText = titles[pageId] || '';
  
  // Refresh data based on page
  if (pageId === 'dashboard') loadDashboard();
  if (pageId === 'customers') loadCustomers();
  if (pageId === 'records') loadRecords();
  if (pageId === 'payments') loadPayments();
}

// ── MODALS ──
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ── TOASTS ──
function showToast(msg, type = "ok") {
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  let icon = 'check-circle';
  if(type==='err') icon = 'circle-xmark';
  if(type==='info') icon = 'circle-info';
  t.innerHTML = `<i class="fa-solid fa-${icon}"></i> ${msg}`;
  document.getElementById("toasts").appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ── API HELPERS ──
async function fetchAPI(endpoint, method = "GET", data = null) {
  try {
    const options = { method, headers: { "Content-Type": "application/json" } };
    if (data) options.body = JSON.stringify(data);
    const res = await fetch(API_BASE + endpoint, options);
    return await res.json();
  } catch (err) {
    console.error(err);
    showToast("Server communication error", "err");
    return { success: false, error: "Network Error" };
  }
}

// ── DASHBOARD ──
async function loadDashboard() {
  const res = await fetchAPI("dashboard.php");
  if (res.success) {
    document.getElementById("stat-customers").innerText = res.data.total_customers || 0;
    document.getElementById("stat-milk").innerText = res.data.today_milk || '0.0';
    document.getElementById("stat-collection").innerText = res.data.today_collection || '0.00';
  }
}

// ── CUSTOMERS ──
async function loadCustomers() {
  const res = await fetchAPI("customers.php");
  if (res.success) {
    customersData = res.data;
    renderCustomersTable(customersData);
    populateCustomerDropdowns();
  }
}

function renderCustomersTable(data) {
  const tbody = document.querySelector("#tbl-customers tbody");
  tbody.innerHTML = "";
  data.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="chip chip-tan">${c.customer_code}</span></td>
      <td style="font-weight:600;">${c.name}</td>
      <td class="mono">${c.phone || '-'}</td>
      <td><span class="chip ${c.animal_type==='cow'?'chip-A':(c.animal_type==='buffalo'?'chip-B':'chip-C')}">${c.animal_type.toUpperCase()}</span></td>
      <td>${c.address || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function filterCustomers() {
  const q = document.getElementById("search-customer").value.toLowerCase();
  const f = customersData.filter(c => 
    c.name.toLowerCase().includes(q) || c.customer_code.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
  );
  renderCustomersTable(f);
}

function populateCustomerDropdowns() {
  const options = `<option value="">Select Customer...</option>` + 
    customersData.map(c => `<option value="${c.id}">${c.customer_code} - ${c.name}</option>`).join("");
  document.getElementById("r-customer").innerHTML = options;
  document.getElementById("p-customer").innerHTML = options;
}

async function saveCustomer() {
  const data = {
    customer_code: document.getElementById("c-code").value,
    name: document.getElementById("c-name").value,
    phone: document.getElementById("c-phone").value,
    animal_type: document.getElementById("c-animal").value,
    address: document.getElementById("c-address").value
  };

  const res = await fetchAPI("customers.php", "POST", data);
  if (res.success) {
    showToast("Customer saved successfully");
    closeModal("modal-add-customer");
    document.getElementById("frm-customer").reset();
    loadCustomers();
    loadDashboard();
  } else {
    showToast(res.error || "Failed to save customer", "err");
  }
}

// ── RECORDS ──
async function loadRecords() {
  const res = await fetchAPI("records.php");
  if (res.success) {
    const tbody = document.querySelector("#tbl-records tbody");
    tbody.innerHTML = "";
    res.data.forEach(r => {
      const tr = document.createElement("tr");
      const dateStr = new Date(r.record_date).toLocaleDateString('en-GB');
      tr.innerHTML = `
        <td>${dateStr}</td>
        <td><i class="fa-solid fa-${r.shift==='morning'?'sun':'moon'}" style="color:${r.shift==='morning'?'var(--amber)':'var(--blue)'};"></i> ${r.shift}</td>
        <td style="font-weight:600;">${r.name}</td>
        <td class="mono">${parseFloat(r.liter_amount).toFixed(2)} L</td>
        <td class="mono">${parseFloat(r.fat_percentage).toFixed(1)}%</td>
        <td class="mono">₹${parseFloat(r.rate_per_liter).toFixed(2)}</td>
        <td class="mono" style="font-weight:700;">₹${parseFloat(r.daily_amount).toFixed(2)}</td>
        <td class="mono" style="color:var(--red);">₹${parseFloat(r.balance).toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

async function saveRecord() {
  const data = {
    customer_id: document.getElementById("r-customer").value,
    record_date: document.getElementById("r-date").value,
    shift: document.getElementById("r-shift").value,
    liter_amount: document.getElementById("r-liter").value,
    fat_percentage: document.getElementById("r-fat").value,
    rate_per_liter: document.getElementById("r-rate").value,
    collected_amount: document.getElementById("r-collected").value || 0
  };

  if(!data.customer_id) return showToast("Select customer","err");

  const res = await fetchAPI("records.php", "POST", data);
  if (res.success) {
    showToast("Record saved successfully");
    closeModal("modal-add-record");
    document.getElementById("frm-record").reset();
    document.getElementById('r-date').value = new Date().toISOString().split('T')[0];
    loadRecords();
    loadDashboard();
  } else {
    showToast(res.error || "Failed to save record", "err");
  }
}

// ── PAYMENTS ──
async function loadPayments() {
  const res = await fetchAPI("payments.php");
  if (res.success) {
    const tbody = document.querySelector("#tbl-payments tbody");
    tbody.innerHTML = "";
    res.data.forEach(p => {
      const tr = document.createElement("tr");
      const dateStr = new Date(p.payment_date).toLocaleDateString('en-GB');
      tr.innerHTML = `
        <td>${dateStr}</td>
        <td style="font-weight:600;">${p.name}</td>
        <td><span class="chip chip-blue" style="text-transform:uppercase;">${p.mode}</span></td>
        <td class="mono" style="text-align:right;font-weight:700;color:var(--green);">+ ₹${parseFloat(p.amount).toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

async function savePayment() {
  const data = {
    customer_id: document.getElementById("p-customer").value,
    payment_date: document.getElementById("p-date").value,
    amount: document.getElementById("p-amount").value,
    mode: document.getElementById("p-mode").value
  };

  if(!data.customer_id) return showToast("Select customer","err");

  const res = await fetchAPI("payments.php", "POST", data);
  if (res.success) {
    showToast("Payment recorded successfully");
    closeModal("modal-add-payment");
    document.getElementById("frm-payment").reset();
    document.getElementById('p-date').value = new Date().toISOString().split('T')[0];
    loadPayments();
  } else {
    showToast(res.error || "Failed to save payment", "err");
  }
}