const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeLa0BpzQfWqgPv1EzGB14Z25ZNGEGmnFg3PXcIxR_AVfCsitj7u4tnNEbhUjebE_K/exec';

let repairId = '';
let rCurrentStep = 1;
let selectedRepairData = null;
let allPendingData = [];
let nextSrNo = 1;

// ─── INIT ───────────────────────────────────────────────────────────────────

window.onload = function () {
  const now = new Date();
  const opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  document.getElementById('headerDate').innerHTML =
    now.toLocaleDateString('en-IN', opts) + '<br>' +
    now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('r_receivingDate').value = now.toISOString().split('T')[0];
  document.getElementById('d_dispatchDate').value = now.toISOString().split('T')[0];
  applyProductCategoryRules('Battery');
};

// ─── REPAIR ID ───────────────────────────────────────────────────────────────

function generateRepairId(srNo) {
  const num = String(srNo || 1).padStart(3, '0');
  return 'LTX-R-' + num;
}

// ─── SCREEN NAVIGATION ───────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function goHome() { showScreen('homeScreen'); }

function showReceive() {
  showScreen('receiveScreen');
  fetchNextSrNo();
}

function fetchNextSrNo() {
  document.getElementById('r_srNo').value = '';
  document.getElementById('r_srNo').placeholder = 'Loading...';
  document.getElementById('repairIdDisplay').textContent = '...';

  window.handleSrNoData = function (result) {
    nextSrNo = (result.lastSrNo || 0) + 1;
    document.getElementById('r_srNo').value = nextSrNo;
    document.getElementById('r_srNo').placeholder = '';
    repairId = generateRepairId(nextSrNo);
    document.getElementById('repairIdDisplay').textContent = repairId;
  };

    var oldScript = document.getElementById('srNoScript');
  if (oldScript) oldScript.remove();
  var script = document.createElement('script');
  script.id = 'srNoScript';
  script.onerror = function () {
    document.getElementById('r_srNo').value = '';
    document.getElementById('r_srNo').placeholder = '';
    document.getElementById('repairIdDisplay').textContent = 'Error — reload karo';
    showToast('⚠️ Repair ID load nahi hui, page reload karke dobara try karo');
  };
  script.src = APPS_SCRIPT_URL + '?action=getPending&callback=handleSrNoData';
  document.body.appendChild(script);
}

function showDispatch() {
  showScreen('dispatchScreen');
  loadPendingRepairs();
}

// ─── RECEIVE STEPS ───────────────────────────────────────────────────────────

function updateRSteps() {
  for (let i = 1; i <= 3; i++) {
    const btn = document.getElementById('rStepBtn' + i);
    btn.className = 'step-btn';
    if (i < rCurrentStep) btn.classList.add('done');
    else if (i === rCurrentStep) btn.classList.add('active');
  }
}

function goToRStep(step) {
  if (step > rCurrentStep) return;
  document.getElementById('rSection' + rCurrentStep).classList.remove('active');
  rCurrentStep = step;
  document.getElementById('rSection' + rCurrentStep).classList.add('active');
  updateRSteps();
  window.scrollTo(0, 0);
}

function nextRStep(from) {
  if (!validateSection('rSection' + from)) return;
  document.getElementById('rSection' + from).classList.remove('active');
  rCurrentStep = from + 1;
  document.getElementById('rSection' + rCurrentStep).classList.add('active');
  updateRSteps();
  window.scrollTo(0, 0);
}

function prevRStep(from) {
  document.getElementById('rSection' + from).classList.remove('active');
  rCurrentStep = from - 1;
  document.getElementById('rSection' + rCurrentStep).classList.add('active');
  updateRSteps();
  window.scrollTo(0, 0);
}

// ─── PRODUCT CATEGORY RULES ──────────────────────────────────────────────────

function applyProductCategoryRules(category) {
  const batterySection  = document.getElementById('grp_batterySection');
  const chargerSection  = document.getElementById('grp_chargerSection');
  const batteryQtyGroup = document.getElementById('grp_batteryQty');
  const chargerQtyGroup = document.getElementById('grp_chargerQty');

  const batteryFields = [
    document.getElementById('r_batteryType'),
    document.getElementById('r_batteryModel'),
    document.getElementById('r_batterySrNo'),
    document.getElementById('r_batteryReceivedQty'),
  ];
  const chargerFields = [
    document.getElementById('r_chargerType'),
    document.getElementById('r_chargerModel'),
    document.getElementById('r_chargerSrNo'),
    document.getElementById('r_chargerReceivedQty'),
  ];

  if (category === 'Battery') {
    setSection(batterySection, batteryFields, true);
    setSection(chargerSection, chargerFields, false);
    batteryQtyGroup.style.display = '';
    chargerQtyGroup.style.display = 'none';
  } else if (category === 'Charger') {
    setSection(batterySection, batteryFields, false);
    setSection(chargerSection, chargerFields, true);
    batteryQtyGroup.style.display = 'none';
    chargerQtyGroup.style.display = '';
  } else if (category === 'Battery+Charger') {
    setSection(batterySection, batteryFields, true);
    setSection(chargerSection, chargerFields, true);
    batteryQtyGroup.style.display = '';
    chargerQtyGroup.style.display = '';
  }
}

function setSection(sectionEl, fields, enabled) {
  sectionEl.classList.toggle('disabled', !enabled);
  fields.forEach(f => {
    if (!f) return;
    f.disabled = !enabled;
    if (!enabled) f.value = '';
  });
}

// ─── DISPATCH CATEGORY RULES ─────────────────────────────────────────────────

function applyDispatchCategoryRules(category) {
  const batGrp = document.getElementById('grp_dBatteryQty');
  const chrGrp = document.getElementById('grp_dChargerQty');
  const batFld = document.getElementById('d_batteryDispatchQty');
  const chrFld = document.getElementById('d_chargerDispatchQty');

  if (category === 'Battery') {
    batGrp.style.display = '';
    chrGrp.style.display = 'none';
    batFld.disabled = false;
    chrFld.disabled = true; chrFld.value = '0';
  } else if (category === 'Charger') {
    batGrp.style.display = 'none';
    chrGrp.style.display = '';
    batFld.disabled = true; batFld.value = '0';
    chrFld.disabled = false;
  } else if (category === 'Battery+Charger') {
    batGrp.style.display = '';
    chrGrp.style.display = '';
    batFld.disabled = false;
    chrFld.disabled = false;
  } else {
    batGrp.style.display = '';
    chrGrp.style.display = '';
    batFld.disabled = false;
    chrFld.disabled = false;
  }
}

// ─── VALIDATION ──────────────────────────────────────────────────────────────

function validateSection(sectionId) {
  const required = document.querySelectorAll('#' + sectionId + ' [required]:not(:disabled)');
  let valid = true, firstInvalid = null;
  required.forEach(el => {
    const val = el.tagName === 'SELECT' ? el.value : el.value.trim();
    if (!val) {
      el.style.borderColor = '#e94560';
      if (!firstInvalid) firstInvalid = el;
      valid = false;
    } else {
      el.style.borderColor = '';
    }
  });
  if (!valid) { if (firstInvalid) firstInvalid.focus(); showToast('⚠️ Sabhi required fields bharein'); }
  return valid;
}

// ─── SUBMIT RECEIVE ──────────────────────────────────────────────────────────

async function submitReceive() {
  if (!validateSection('rSection3')) return;

  const submitBtn = document.querySelector('.btn-submit-receive');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Submitting...';

  const category = document.getElementById('r_category').value;

  const data = {
    action: 'receive',
    'Repair ID': repairId,
    'Sr No': document.getElementById('r_srNo').value,
    'Receiving Date': document.getElementById('r_receivingDate').value,
    'Customer Name': document.getElementById('r_customerName').value,
    'Contact No': document.getElementById('r_contactNo').value,
    'Email': document.getElementById('r_email').value,
    'Address': document.getElementById('r_address').value,
    'Category': category,
    'Battery Type': document.getElementById('r_batteryType').value,
    'Battery Model': document.getElementById('r_batteryModel').value,
    'Battery Sr No': document.getElementById('r_batterySrNo').value,
    'Battery Qty Received': document.getElementById('r_batteryReceivedQty').value || '0',
    'Charger Model': document.getElementById('r_chargerModel').value,
    'Charger Serial Number': document.getElementById('r_chargerSrNo').value,
    'Charger Type': document.getElementById('r_chargerType').value,
    'Charger Qty Received': document.getElementById('r_chargerReceivedQty').value || '0',
    'Received Mode': document.getElementById('r_receivedMode').value,
    'Problem Type': document.getElementById('r_problemType').value,
    'Problem Description': document.getElementById('r_problemDesc').value,
    'Warranty': document.getElementById('r_warranty').value,
    'Warranty Claim Status': document.getElementById('r_claimStatus').value,
    'Repair Status': 'Received',
    'Received By': document.getElementById('r_receivedBy').value,
    'Accepted By': document.getElementById('r_acceptedBy').value,
    'Estimated Dispatch Date': document.getElementById('r_estimatedDispatchDate').value,
    'Transport Details (Inward)': document.getElementById('r_transportInward').value,
    'Receiving Remarks': document.getElementById('r_remarks').value,
  };

  fetch(APPS_SCRIPT_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  document.getElementById('rSection3').classList.remove('active');
  document.getElementById('receiveSuccess').style.display = 'block';
  document.getElementById('successReceiveId').textContent = repairId;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('receiptDate').textContent = dateStr + ' ' + timeStr;
  document.getElementById('receiptFooterDate').textContent = dateStr + ' ' + timeStr;

  document.getElementById('receiveSummary').innerHTML = `
    <div class="receipt-section">Customer Details</div>
    <table class="receipt-table">
      <tr><td>Customer Name</td><td>${data['Customer Name']}</td></tr>
      <tr><td>Contact No.</td><td>${data['Contact No']}</td></tr>
      <tr><td>Email</td><td>${data['Email'] || '—'}</td></tr>
      <tr><td>Address</td><td>${data['Address'] || '—'}</td></tr>
    </table>
    <div class="receipt-section" style="margin-top:8px;">Product Details</div>
    <table class="receipt-table">
      <tr><td>Category</td><td>${data['Category']}</td></tr>
      <tr><td>Battery Type</td><td>${data['Battery Type'] || '—'}</td></tr>
      <tr><td>Battery Model</td><td>${data['Battery Model'] || '—'}</td></tr>
      <tr><td>Battery Sr. No.</td><td>${data['Battery Sr No'] || '—'}</td></tr>
      <tr><td>Battery Qty Received</td><td>${data['Battery Qty Received']}</td></tr>
      <tr><td>Charger Model</td><td>${data['Charger Model'] || '—'}</td></tr>
      <tr><td>Charger Serial No.</td><td>${data['Charger Serial Number'] || '—'}</td></tr>
      <tr><td>Charger Type</td><td>${data['Charger Type'] || '—'}</td></tr>
      <tr><td>Charger Qty Received</td><td>${data['Charger Qty Received']}</td></tr>
      <tr><td>Received Mode</td><td>${data['Received Mode'] || '—'}</td></tr>
    </table>
    <div class="receipt-section" style="margin-top:8px;">Service Details</div>
    <table class="receipt-table">
      <tr><td>Problem Type</td><td>${data['Problem Type']}</td></tr>
      <tr><td>Problem Description</td><td>${data['Problem Description'] || '—'}</td></tr>
      <tr><td>Warranty</td><td>${data['Warranty'] || '—'}</td></tr>
      <tr><td>Warranty Claim</td><td>${data['Warranty Claim Status'] || '—'}</td></tr>
      <tr><td>Receiving Date</td><td>${data['Receiving Date']}</td></tr>
      <tr><td>Est. Dispatch Date</td><td>${data['Estimated Dispatch Date'] || '—'}</td></tr>
      <tr><td>Received By</td><td>${data['Received By']}</td></tr>
      <tr><td>Accepted By</td><td>${data['Accepted By'] || '—'}</td></tr>
    </table>`;

  submitBtn.disabled = false;
  submitBtn.textContent = 'Submit Entry ✓';
  window.scrollTo(0, 0);
}

function printReceipt() { window.print(); }

function resetReceive() {
  document.getElementById('receiveSuccess').style.display = 'none';
  document.querySelectorAll('#receiveScreen input:not([type=radio]),#receiveScreen select,#receiveScreen textarea').forEach(el => {
    if (el.type === 'date') el.value = new Date().toISOString().split('T')[0];
    else el.value = '';
  });
  document.getElementById('r_category').value = 'Battery';
  document.getElementById('r_warranty').value = '';
  document.querySelectorAll('#receiveScreen .radio-opt').forEach((o, i) => {
    o.classList.remove('selected', 'selected-both');
    if (i === 0) o.classList.add('selected');
  });
  document.querySelectorAll('#receiveScreen .tag-opt').forEach(o => o.classList.remove('selected'));
  applyProductCategoryRules('Battery');
  rCurrentStep = 1;
  document.querySelectorAll('#receiveScreen .form-section').forEach((s, i) => s.classList.toggle('active', i === 0));
  updateRSteps();
  fetchNextSrNo();
  window.scrollTo(0, 0);
}

// ─── DISPATCH ────────────────────────────────────────────────────────────────

function loadPendingRepairs() {
  document.getElementById('loadingBox').style.display = 'block';
  document.getElementById('errorBox').style.display = 'none';
  document.getElementById('pendingList').innerHTML = '';
  document.getElementById('selectedInfoBox').style.display = 'none';
  document.getElementById('d_selectedRepairId').value = '';
  document.getElementById('dNextBtn').disabled = true;
  document.getElementById('dNextBtn').style.opacity = '0.5';

  window.handlePendingData = function (result) {
    document.getElementById('loadingBox').style.display = 'none';
    if (result.data && result.data.length > 0) {
      renderPendingList(result.data);
    } else {
      document.getElementById('pendingList').innerHTML =
        '<div style="text-align:center;padding:30px;color:var(--text2);font-size:14px;">Koi pending repair nahi hai ✅</div>';
    }
  };

  var oldScript = document.getElementById('pendingScript');
  if (oldScript) oldScript.remove();
  var script = document.createElement('script');
  script.id = 'pendingScript';
  script.onerror = function () {
    document.getElementById('loadingBox').style.display = 'none';
    document.getElementById('errorBox').style.display = 'block';
  };
  script.src = APPS_SCRIPT_URL + '?action=getPending&callback=handlePendingData';
  document.body.appendChild(script);
}

function renderPendingList(data) {
  allPendingData = data;
  const list = document.getElementById('pendingList');
  list.innerHTML = `<div class="form-group">
    <label>Repair ID / Customer Name select karo</label>
    <select id="pendingDropdown" style="font-size:14px;padding:10px 14px;width:100%" onchange="onDropdownSelect(this)">
      <option value="">-- Select Repair ID --</option>
    </select>
  </div>`;
  const dropdown = document.getElementById('pendingDropdown');
  data.forEach((row, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = row.repairId + ' — ' + row.customerName +
      ' (' + (row.category || '') + (row.batteryModel ? ' ' + row.batteryModel : '') +
      ') | Pending: ' + row.pendingQty;
    dropdown.appendChild(opt);
  });
}

function onDropdownSelect(sel) {
  if (!sel.value) {
    document.getElementById('selectedInfoBox').style.display = 'none';
    document.getElementById('dNextBtn').disabled = true;
    document.getElementById('dNextBtn').style.opacity = '0.5';
    return;
  }
  const row = allPendingData[parseInt(sel.value)];
  selectPendingCard(row);
}

function selectPendingCard(row) {
  selectedRepairData = row;
  document.getElementById('d_selectedRepairId').value = row.repairId;
  document.getElementById('d_selectedRow').value = row.rowIndex;
  document.getElementById('si_repairId').textContent = row.repairId;
  document.getElementById('si_customer').textContent = row.customerName;
  document.getElementById('si_contact').textContent = row.contactNo;
  document.getElementById('si_product').textContent = (row.category || '') + (row.batteryModel ? ' — ' + row.batteryModel : '');
  document.getElementById('si_batteryRcv').textContent = row.batteryQtyReceived || 0;
  document.getElementById('si_chargerRcv').textContent = row.chargerQtyReceived || 0;
  document.getElementById('si_batteryPending').textContent = row.batteryPending || 0;
  document.getElementById('si_chargerPending').textContent = row.chargerPending || 0;
  document.getElementById('si_pendingQty').textContent = row.pendingQty;
  document.getElementById('si_receivedDate').textContent = row.receivingDate;
  document.getElementById('selectedInfoBox').style.display = 'block';
  document.getElementById('dNextBtn').disabled = false;
  document.getElementById('dNextBtn').style.opacity = '1';
  // Apply dispatch category rules
  applyDispatchCategoryRules(row.category || 'Battery+Charger');
  calcDispatchPending();
}

function goToDStep2() {
  if (!document.getElementById('d_selectedRepairId').value) {
    showToast('⚠️ Pehle ek Repair ID select karo');
    return;
  }
  document.getElementById('dSection1').classList.remove('active');
  document.getElementById('dSection2').classList.add('active');
  window.scrollTo(0, 0);
}

function backToDStep1() {
  document.getElementById('dSection2').classList.remove('active');
  document.getElementById('dSection1').classList.add('active');
  window.scrollTo(0, 0);
}

function calcDispatchPending() {
  const batPending = parseInt(selectedRepairData?.batteryPending) || 0;
  const chrPending = parseInt(selectedRepairData?.chargerPending) || 0;
  const totalPending = parseInt(selectedRepairData?.pendingQty) || 0;

  const batFld = document.getElementById('d_batteryDispatchQty');
  const chrFld = document.getElementById('d_chargerDispatchQty');

  let batDisp = parseInt(batFld?.value) || 0;
  let chrDisp = parseInt(chrFld?.value) || 0;

  // Cap at pending
  if (batDisp > batPending) {
    batDisp = batPending;
    if (batFld) batFld.value = batPending;
    showToast('⚠️ Battery qty ' + batPending + ' se zyada nahi ho sakti');
  }
  if (chrDisp > chrPending) {
    chrDisp = chrPending;
    if (chrFld) chrFld.value = chrPending;
    showToast('⚠️ Charger qty ' + chrPending + ' se zyada nahi ho sakti');
  }

  const totalDisp = batDisp + chrDisp;
  const remaining = Math.max(0, totalPending - totalDisp);
  document.getElementById('d_pendingQty').value = remaining;
}

function submitDispatch() {
  if (!validateSection('dSection2')) return;

  const batPending = parseInt(selectedRepairData?.batteryPending) || 0;
  const chrPending = parseInt(selectedRepairData?.chargerPending) || 0;

  const batQty = parseInt(document.getElementById('d_batteryDispatchQty').value) || 0;
  const chrQty = parseInt(document.getElementById('d_chargerDispatchQty').value) || 0;

  if (batQty === 0 && chrQty === 0) {
    showToast('⚠️ Battery ya Charger dispatch qty bharein');
    return;
  }
  if (batQty > batPending) {
    showToast('⚠️ Battery dispatch qty pending (' + batPending + ') se zyada hai');
    return;
  }
  if (chrQty > chrPending) {
    showToast('⚠️ Charger dispatch qty pending (' + chrPending + ') se zyada hai');
    return;
  }

  const data = {
    action: 'dispatch',
    rowIndex: document.getElementById('d_selectedRow').value,
    'Repair ID': document.getElementById('d_selectedRepairId').value,
    'Dispatch Date': document.getElementById('d_dispatchDate').value,
    'Battery Dispatch Qty': batQty,
    'Charger Dispatch Qty': chrQty,
    'Pending Qty': document.getElementById('d_pendingQty').value,
    'Repair Status': document.getElementById('d_repairStatus').value,
    'Actual Problem Found': document.getElementById('d_actualProblem').value,
    'Transport Details (Outward)': document.getElementById('d_transportOutward').value,
    'Dispatched By': document.getElementById('d_dispatchedBy').value,
    'Any Cost': document.getElementById('d_anyCost').value,
    'Dispatch Remarks': document.getElementById('d_remarks').value,
  };

  fetch(APPS_SCRIPT_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  document.getElementById('dSection2').classList.remove('active');
  document.getElementById('dispatchSuccess').style.display = 'block';
  document.getElementById('successDispatchId').textContent = data['Repair ID'];

  const dNow = new Date();
  const dDateStr = dNow.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const dTimeStr = dNow.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  document.getElementById('dispatchSummary').innerHTML = `
    <div style="background:white;border-radius:12px;border:1px solid #dde1f0;padding:24px;">
      <div class="receipt-header">
        <div>
          <div class="receipt-logo">LITPAX</div>
          <div class="receipt-title">Battery / Charger Service Center</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;color:#5a6080;">Dispatch Slip</div>
          <div style="font-size:11px;color:#8890b0;">${dDateStr} ${dTimeStr}</div>
        </div>
      </div>
      <div style="background:#e8f8f4;border-radius:6px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:11px;color:#00856e;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Repair ID</span>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:700;color:#00856e;">${data['Repair ID']}</span>
      </div>
      <div class="receipt-section">Customer Details</div>
      <table class="receipt-table">
        <tr><td>Customer Name</td><td>${selectedRepairData?.customerName || '—'}</td></tr>
        <tr><td>Contact No.</td><td>${selectedRepairData?.contactNo || '—'}</td></tr>
        <tr><td>Address</td><td>${selectedRepairData?.address || '—'}</td></tr>
      </table>
      <div class="receipt-section" style="margin-top:8px;">Dispatch Details</div>
      <table class="receipt-table">
        <tr><td>Dispatch Date</td><td>${data['Dispatch Date']}</td></tr>
        <tr><td>Battery Dispatched</td><td>${batQty}</td></tr>
        <tr><td>Charger Dispatched</td><td>${chrQty}</td></tr>
        <tr><td>Pending Qty</td><td>${data['Pending Qty']}</td></tr>
        <tr><td>Repair Status</td><td>${data['Repair Status']}</td></tr>
        <tr><td>Actual Problem Found</td><td>${data['Actual Problem Found'] || '—'}</td></tr>
        <tr><td>Any Cost</td><td>${data['Any Cost'] || '—'}</td></tr>
        <tr><td>Transport (Outward)</td><td>${data['Transport Details (Outward)'] || '—'}</td></tr>
        <tr><td>Dispatched By</td><td>${data['Dispatched By']}</td></tr>
        <tr><td>Remarks</td><td>${data['Dispatch Remarks'] || '—'}</td></tr>
      </table>
      <div class="receipt-footer">
        <span>Litpax Technology — Service Management System</span>
        <span>${dDateStr} ${dTimeStr}</span>
      </div>
    </div>`;

  window.scrollTo(0, 0);
}

function resetDispatch() {
  document.getElementById('dispatchSuccess').style.display = 'none';
  document.getElementById('dSection2').classList.remove('active');
  document.getElementById('dSection1').classList.add('active');
  document.querySelectorAll('#dispatchScreen input:not([type=hidden]),#dispatchScreen select,#dispatchScreen textarea').forEach(el => {
    if (el.type === 'date') el.value = new Date().toISOString().split('T')[0];
    else el.value = '';
  });
  selectedRepairData = null;
  loadPendingRepairs();
  window.scrollTo(0, 0);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function selectRadio(el, fieldId, val) {
  const name = el.querySelector('input').name;
  document.querySelectorAll(`[name="${name}"]`).forEach(i => {
    const opt = i.closest('.radio-opt');
    opt.classList.remove('selected', 'selected-both');
  });
  el.classList.add(val === 'Battery+Charger' ? 'selected-both' : 'selected');
  document.getElementById(fieldId).value = val;
  if (fieldId === 'r_category') applyProductCategoryRules(val);
}

function selectTag(el, fieldId, val) {
  el.parentElement.querySelectorAll('.tag-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById(fieldId).value = val;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
