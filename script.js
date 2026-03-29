const API_BASE = "http://localhost/milk/php/";

// State
let customersData = [];

// ── INIT ──
window.onload = () => {
  // Check Auth
  if (!localStorage.getItem('dairy_user')) {
    window.location.href = 'login.html';
    return;
  }

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

// ── AUTH ──
window.logout = function() {
  localStorage.removeItem('dairy_user');
  window.location.href = 'login.html';
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
    const activeUserStr = localStorage.getItem('dairy_user');
    const activeUser = activeUserStr ? JSON.parse(activeUserStr) : null;
    const userId = activeUser ? activeUser.id : '';

    const headers = { 
      "Content-Type": "application/json",
      "X-User-Id": userId.toString()
    };
    
    const options = { method, headers };
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
      <td style="text-align: right; white-space: nowrap;">
        <button class="btn btn-xs btn-outline" style="color:var(--amber); border-color:var(--border);" onclick='editCustomer(${JSON.stringify(c).replace(/'/g, "&#39;")})'><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="btn btn-xs" style="color:var(--red); border-color:var(--red); background:none;" onclick='deleteCustomer(${c.id})'><i class="fa-solid fa-trash"></i> Delete</button>
      </td>
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

window.openAddCustomerModal = function() {
  document.getElementById("frm-customer").reset();
  document.getElementById("c-id").value = "";
  document.getElementById("modal-add-customer-title").innerText = "Add New Customer";
  openModal("modal-add-customer");
};

window.editCustomer = function(c) {
  document.getElementById("modal-add-customer-title").innerText = "Edit Customer";
  document.getElementById("c-id").value = c.id;
  document.getElementById("c-code").value = c.customer_code;
  document.getElementById("c-name").value = c.name;
  document.getElementById("c-phone").value = c.phone || "";
  document.getElementById("c-animal").value = c.animal_type;
  document.getElementById("c-address").value = c.address || "";
  openModal("modal-add-customer");
};

window.deleteCustomer = async function(id) {
  if (!confirm("Are you sure you want to delete this customer?")) return;
  const res = await fetchAPI("customers.php", "DELETE", { id });
  if (res.success) {
    showToast("Customer deleted successfully");
    loadCustomers();
    loadDashboard();
  } else {
    showToast(res.error || "Failed to delete customer", "err");
  }
};

async function saveCustomer() {
  const cid = document.getElementById("c-id").value;
  const data = {
    customer_code: document.getElementById("c-code").value,
    name: document.getElementById("c-name").value,
    phone: document.getElementById("c-phone").value,
    animal_type: document.getElementById("c-animal").value,
    address: document.getElementById("c-address").value
  };

  if (cid) data.id = cid;

  const method = cid ? "PUT" : "POST";
  const res = await fetchAPI("customers.php", method, data);
  if (res.success) {
    showToast(cid ? "Customer updated successfully" : "Customer saved successfully");
    closeModal("modal-add-customer");
    document.getElementById("frm-customer").reset();
    document.getElementById("c-id").value = "";
    loadCustomers();
    loadDashboard();
  } else {
    showToast(res.error || "Failed to save customer", "err");
  }
}

// ── RECORDS ──
window.openAddRecordModal = function() {
  document.getElementById("frm-record").reset();
  document.getElementById("r-id").value = "";
  document.getElementById("modal-add-record-title").innerText = "Record Milk Collection";
  document.getElementById('r-date').value = new Date().toISOString().split('T')[0];
  openModal('modal-add-record');
};

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
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-xs btn-outline" style="border-color:var(--border);" onclick='openReceipt(${JSON.stringify(r).replace(/'/g, "&#39;")})'><i class="fa-solid fa-receipt"></i> Print</button>
          <button class="btn btn-xs btn-outline" style="color:var(--amber); border-color:var(--border);" onclick='editRecord(${JSON.stringify(r).replace(/'/g, "&#39;")})'><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="btn btn-xs" style="color:var(--red); border-color:var(--red); background:none;" onclick='deleteRecord(${r.id})'><i class="fa-solid fa-trash"></i> Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

window.openReceipt = function(r) {
  const dateStr = new Date(r.record_date).toLocaleDateString('en-GB');
  document.getElementById('rec-date').innerText = dateStr;
  document.getElementById('rec-shift').innerText = r.shift;
  document.getElementById('rec-name').innerText = r.name;
  document.getElementById('rec-liters').innerText = parseFloat(r.liter_amount).toFixed(2);
  document.getElementById('rec-fat').innerText = parseFloat(r.fat_percentage).toFixed(1);
  document.getElementById('rec-rate').innerText = parseFloat(r.rate_per_liter).toFixed(2);
  document.getElementById('rec-total').innerText = '₹' + parseFloat(r.daily_amount).toFixed(2);
  
  openModal('modal-receipt');
};

window.editRecord = function(r) {
  document.getElementById("modal-add-record-title").innerText = "Edit Milk Record";
  document.getElementById("r-id").value = r.id;
  document.getElementById("r-customer").value = r.customer_id;
  document.getElementById("r-date").value = r.record_date;
  document.getElementById("r-shift").value = r.shift;
  document.getElementById("r-liter").value = r.liter_amount;
  document.getElementById("r-fat").value = r.fat_percentage;
  document.getElementById("r-rate").value = r.rate_per_liter;
  document.getElementById("r-collected").value = r.collected_amount || 0;
  openModal("modal-add-record");
};

window.deleteRecord = async function(id) {
  if (!confirm("Are you sure you want to delete this record?")) return;
  const res = await fetchAPI("records.php", "DELETE", { id });
  if (res.success) {
    showToast("Record deleted successfully");
    loadRecords();
    loadDashboard();
  } else {
    showToast(res.error || "Failed to delete record", "err");
  }
};

async function saveRecord() {
  const rid = document.getElementById("r-id").value;
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
  
  if (rid) {
    data.id = rid;
  }

  const method = rid ? "PUT" : "POST";
  const res = await fetchAPI("records.php", method, data);
  
  if (res.success) {
    showToast(rid ? "Record updated successfully" : "Record saved successfully");
    closeModal("modal-add-record");
    document.getElementById("frm-record").reset();
    document.getElementById("r-id").value = "";
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
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-xs btn-outline" style="color:var(--amber); border-color:var(--border);" onclick='editPayment(${JSON.stringify(p).replace(/'/g, "&#39;")})'><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="btn btn-xs" style="color:var(--red); border-color:var(--red); background:none;" onclick='deletePayment(${p.id})'><i class="fa-solid fa-trash"></i> Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

window.openAddPaymentModal = function() {
  document.getElementById("frm-payment").reset();
  document.getElementById("p-id").value = "";
  document.getElementById("modal-add-payment-title").innerText = "Add Payment";
  document.getElementById('p-date').value = new Date().toISOString().split('T')[0];
  openModal("modal-add-payment");
};

window.editPayment = function(p) {
  document.getElementById("modal-add-payment-title").innerText = "Edit Payment";
  document.getElementById("p-id").value = p.id;
  document.getElementById("p-customer").value = p.customer_id;
  document.getElementById("p-date").value = p.payment_date;
  document.getElementById("p-amount").value = p.amount;
  document.getElementById("p-mode").value = p.mode;
  openModal("modal-add-payment");
};

window.deletePayment = async function(id) {
  if (!confirm("Are you sure you want to delete this payment?")) return;
  const res = await fetchAPI("payments.php", "DELETE", { id });
  if (res.success) {
    showToast("Payment deleted successfully");
    loadPayments();
    loadDashboard();
  } else {
    showToast(res.error || "Failed to delete payment", "err");
  }
};

async function savePayment() {
  const pid = document.getElementById("p-id").value;
  const data = {
    customer_id: document.getElementById("p-customer").value,
    payment_date: document.getElementById("p-date").value,
    amount: document.getElementById("p-amount").value,
    mode: document.getElementById("p-mode").value
  };

  if(!data.customer_id) return showToast("Select customer","err");
  if (pid) data.id = pid;

  const method = pid ? "PUT" : "POST";
  const res = await fetchAPI("payments.php", method, data);
  if (res.success) {
    showToast(pid ? "Payment updated successfully" : "Payment recorded successfully");
    closeModal("modal-add-payment");
    document.getElementById("frm-payment").reset();
    document.getElementById("p-id").value = "";
    document.getElementById('p-date').value = new Date().toISOString().split('T')[0];
    loadPayments();
    loadDashboard();
  } else {
    showToast(res.error || "Failed to save payment", "err");
  }
}