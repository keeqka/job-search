/**
 * Local Job Search CRM — Google Apps Script API layer.
 *
 * Deploy this script bound to the CRM spreadsheet (Extensions > Apps Script),
 * then deploy it as a Web App ("Execute as: Me", "Who has access: Anyone").
 * See README.md for the full setup walkthrough.
 *
 * IMPORTANT — why everything goes through doGet / doPost:
 * Apps Script web apps only expose two entry points, doGet(e) and doPost(e).
 * There is no native PUT/DELETE handler, and a browser preflight (OPTIONS)
 * request can't be answered with the right CORS headers by Apps Script, so a
 * "real" PUT/DELETE fetch from the browser would fail. To avoid ever
 * triggering a CORS preflight, the frontend:
 *   - uses GET for all reads (?resource=applications&id=123)
 *   - uses POST with Content-Type: text/plain for all writes, with the
 *     intended verb passed inside the JSON body as `method: "POST"|"PUT"|"DELETE"`
 * This keeps every request a "simple request" per the Fetch/CORS spec.
 */

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

var SHEETS = {
  applications: {
    sheetName: 'Applications',
    idPrefix: 'app',
    headers: [
      'id', 'companyId', 'position', 'status', 'source', 'vacancyUrl',
      'applicationUrl', 'dateFound', 'dateApplied', 'lastActivity',
      'nextAction', 'nextActionDate', 'priority', 'salaryMin', 'salaryMax',
      'currency', 'employmentType', 'workType', 'location', 'recruiterId',
      'cvVersion', 'jobDescription', 'coverLetter', 'notes', 'rejectionReason',
    ],
  },
  companies: {
    sheetName: 'Companies',
    idPrefix: 'cmp',
    headers: [
      'id', 'name', 'website', 'linkedin', 'industry', 'location',
      'companySize', 'techStack', 'rating', 'notes',
    ],
  },
  contacts: {
    sheetName: 'Contacts',
    idPrefix: 'ctc',
    headers: [
      'id', 'name', 'companyId', 'role', 'email', 'telegram', 'linkedin',
      'phone', 'firstContact', 'lastContact', 'nextContact', 'notes',
    ],
  },
  interviews: {
    sheetName: 'Interviews',
    idPrefix: 'int',
    headers: [
      'id', 'applicationId', 'date', 'type', 'interviewerId', 'result',
      'questions', 'myAnswers', 'whatWentWell', 'whatWentBad', 'weakTopics',
      'nextStep', 'notes',
    ],
    arrayFields: ['weakTopics'],
  },
  offers: {
    sheetName: 'Offers',
    idPrefix: 'off',
    headers: [
      'id', 'applicationId', 'baseSalary', 'bonus', 'currency', 'grossNet',
      'equity', 'vacation', 'remote', 'probation', 'benefits', 'offerDate',
      'deadline', 'decision', 'notes',
    ],
  },
  'cv-versions': {
    sheetName: 'CV Versions',
    idPrefix: 'cv',
    headers: ['id', 'version', 'targetRole', 'createdDate', 'fileUrl', 'description'],
  },
  tasks: {
    sheetName: 'Tasks',
    idPrefix: 'tsk',
    headers: ['id', 'applicationId', 'type', 'dueDate', 'priority', 'status', 'notes'],
  },
};

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var resource = params.resource;

    if (resource === '__init') {
      initializeSheets();
      return jsonResponse({ success: true, data: 'Sheets initialized' });
    }

    assertValidResource(resource);

    if (params.id) {
      var record = getById(resource, params.id);
      if (!record) return jsonResponse(notFound(resource, params.id));
      return jsonResponse({ success: true, data: record });
    }

    return jsonResponse({ success: true, data: listAll(resource) });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var resource = body.resource;
    var method = (body.method || 'POST').toUpperCase();

    if (resource === '__all__' && method === 'CLEAR_ALL') {
      clearAllData();
      return jsonResponse({ success: true, data: 'All data cleared' });
    }

    assertValidResource(resource);

    if (method === 'POST') {
      var created = createRecord(resource, body.data || {});
      return jsonResponse({ success: true, data: created });
    }

    if (method === 'PUT') {
      if (!body.id) throw new Error('Missing id for update');
      var updated = updateRecord(resource, body.id, body.data || {});
      if (!updated) return jsonResponse(notFound(resource, body.id));
      return jsonResponse({ success: true, data: updated });
    }

    if (method === 'DELETE') {
      if (!body.id) throw new Error('Missing id for delete');
      var deleted = deleteRecord(resource, body.id);
      if (!deleted) return jsonResponse(notFound(resource, body.id));
      return jsonResponse({ success: true, data: { id: body.id } });
    }

    throw new Error('Unsupported method: ' + method);
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

function listAll(resource) {
  var sheet = getSheet(resource);
  var config = SHEETS[resource];
  var range = sheet.getDataRange().getValues();
  var headers = range[0];
  var rows = range.slice(1);
  return rows
    .filter(function (row) { return row[0] !== '' && row[0] !== null; })
    .map(function (row) { return rowToObject(headers, row, config); });
}

function getById(resource, id) {
  var sheet = getSheet(resource);
  var config = SHEETS[resource];
  var found = findRow(sheet, id);
  if (!found) return null;
  return rowToObject(found.headers, found.row, config);
}

function createRecord(resource, data) {
  var sheet = getSheet(resource);
  var config = SHEETS[resource];
  var id = config.idPrefix + '_' + Utilities.getUuid().split('-')[0];
  var now = new Date().toISOString();

  var record = Object.assign({}, data, { id: id });
  if (resource === 'applications' && !record.lastActivity) {
    record.lastActivity = now;
  }

  var row = objectToRow(config.headers, record, config);
  sheet.appendRow(row);
  return rowToObject(config.headers, row, config);
}

function updateRecord(resource, id, data) {
  var sheet = getSheet(resource);
  var config = SHEETS[resource];
  var found = findRow(sheet, id);
  if (!found) return null;

  var existing = rowToObject(found.headers, found.row, config);
  var merged = Object.assign({}, existing, data, { id: id });

  if (resource === 'applications') {
    merged.lastActivity = new Date().toISOString();
  }

  var row = objectToRow(config.headers, merged, config);
  sheet.getRange(found.rowIndex, 1, 1, row.length).setValues([row]);
  return rowToObject(config.headers, row, config);
}

function deleteRecord(resource, id) {
  var sheet = getSheet(resource);
  var found = findRow(sheet, id);
  if (!found) return null;
  sheet.deleteRow(found.rowIndex);
  return true;
}

// ---------------------------------------------------------------------------
// Sheet helpers
// ---------------------------------------------------------------------------

function getSheet(resource) {
  var config = SHEETS[resource];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(config.sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(config.sheetName);
    sheet.appendRow(config.headers);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(config.headers);
  }
  return sheet;
}

function findRow(sheet, id) {
  var range = sheet.getDataRange().getValues();
  var headers = range[0];
  for (var i = 1; i < range.length; i++) {
    if (String(range[i][0]) === String(id)) {
      return { headers: headers, row: range[i], rowIndex: i + 1 };
    }
  }
  return null;
}

function rowToObject(headers, row, config) {
  var obj = {};
  var arrayFields = (config && config.arrayFields) || [];
  headers.forEach(function (key, i) {
    var value = row[i];
    if (arrayFields.indexOf(key) !== -1) {
      obj[key] = value ? String(value).split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];
    } else if (value instanceof Date) {
      obj[key] = value.toISOString();
    } else {
      obj[key] = value === '' ? undefined : value;
    }
  });
  return obj;
}

function objectToRow(headers, obj, config) {
  var arrayFields = (config && config.arrayFields) || [];
  return headers.map(function (key) {
    var value = obj[key];
    if (arrayFields.indexOf(key) !== -1 && Array.isArray(value)) {
      return value.join(',');
    }
    return value === undefined || value === null ? '' : value;
  });
}

function initializeSheets() {
  Object.keys(SHEETS).forEach(function (resource) {
    getSheet(resource);
  });
}

/** Wipes every row (keeping headers) across all 7 sheets. Used by Settings > Danger Zone. */
function clearAllData() {
  Object.keys(SHEETS).forEach(function (resource) {
    var sheet = getSheet(resource);
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
  });
}

// ---------------------------------------------------------------------------
// Response / validation helpers
// ---------------------------------------------------------------------------

function assertValidResource(resource) {
  if (!resource || !SHEETS[resource]) {
    throw new Error('Unknown resource: ' + resource);
  }
}

function notFound(resource, id) {
  return { success: false, error: capitalize(singular(resource)) + ' not found: ' + id };
}

function singular(resource) {
  return resource.replace(/s$/, '');
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
