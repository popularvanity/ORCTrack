// Pure localStorage/IndexedDB database — no WASM needed
// This replaces sql.js to avoid WASM loading failures

const DB_PREFIX = 'orcdb_';

interface DBTable {
  [key: string]: any[];
}

let tables: DBTable = {};
let initialized = false;

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_PREFIX + 'tables');
    if (raw) tables = JSON.parse(raw);
  } catch { tables = {}; }
}

function saveDB() {
  try {
    localStorage.setItem(DB_PREFIX + 'tables', JSON.stringify(tables));
  } catch (e) { console.error('DB save error:', e); }
}

function ensureTable(name: string, defaults: any[] = []) {
  if (!tables[name]) {
    tables[name] = defaults;
    saveDB();
  }
}

export async function getDatabase(): Promise<true> {
  if (initialized) return true;
  loadDB();

  ensureTable('users', []);
  ensureTable('activity_log', []);
  ensureTable('site_theme', [{
    id: 1,
    primary_color: '#06b6d4',
    secondary_color: '#a855f7',
    accent_color: '#22c55e',
    bg_color: '#0a0a0f',
    card_bg: 'rgba(17,17,24,0.9)',
    border_radius: '16px',
    font_family: 'Inter',
    glow_intensity: 0.3,
    grid_columns: 3,
    show_hero: 1,
    show_charts: 1,
    show_featured: 1,
    show_quick_links: 1,
    show_timeline: 1,
    layout_mode: 'default',
    custom_css: '',
  }]);
  ensureTable('announcements', []);
  ensureTable('bookmarks', []);
  ensureTable('notes', []);
  ensureTable('scheduled_tasks', []);
  ensureTable('api_keys', []);
  ensureTable('widgets', []);
  ensureTable('backups', []);
  ensureTable('roles', [
    { id: 1, name: 'superadmin', permissions: ['*'], color: '#06b6d4' },
    { id: 2, name: 'admin', permissions: ['edit', 'delete', 'view'], color: '#a855f7' },
    { id: 3, name: 'editor', permissions: ['edit', 'view'], color: '#22c55e' },
    { id: 4, name: 'viewer', permissions: ['view'], color: '#6b7280' },
  ]);
  ensureTable('tags', []);
  ensureTable('media', []);
  ensureTable('comments', []);
  ensureTable('analytics', []);
  ensureTable('custom_pages', []);

  initialized = true;
  return true;
}

export async function persistDatabase() {
  saveDB();
}

// ========== Generic table operations ==========
export function getTable(name: string): any[] {
  return tables[name] || [];
}

export function setTable(name: string, data: any[]) {
  tables[name] = data;
  saveDB();
}

export function insertRow(table: string, row: any): number {
  if (!tables[table]) tables[table] = [];
  const maxId = tables[table].reduce((max: number, r: any) => Math.max(max, r.id || 0), 0);
  row.id = maxId + 1;
  tables[table].push(row);
  saveDB();
  return row.id;
}

export function updateRow(table: string, id: number, updates: any) {
  if (!tables[table]) return;
  const idx = tables[table].findIndex((r: any) => r.id === id);
  if (idx !== -1) {
    tables[table][idx] = { ...tables[table][idx], ...updates };
    saveDB();
  }
}

export function deleteRow(table: string, id: number) {
  if (!tables[table]) return;
  tables[table] = tables[table].filter((r: any) => r.id !== id);
  saveDB();
}

export function queryTable(table: string, filter?: (row: any) => boolean): any[] {
  const rows = tables[table] || [];
  return filter ? rows.filter(filter) : rows;
}

// ========== SQL-like query parser ==========
export async function runQuery(sql: string): Promise<{ columns: string[]; values: any[][]; changes?: number; error?: string }> {
  try {
    await getDatabase();
    const trimmed = sql.trim();

    // SHOW TABLES
    if (/^(SHOW\s+TABLES|SELECT\s+name\s+FROM\s+sqlite_master)/i.test(trimmed)) {
      const names = Object.keys(tables);
      return { columns: ['name'], values: names.map(n => [n]) };
    }

    // SELECT * FROM table
    const selectMatch = trimmed.match(/^SELECT\s+\*\s+FROM\s+(\w+)(\s+LIMIT\s+(\d+))?/i);
    if (selectMatch) {
      const tableName = selectMatch[1];
      const limit = selectMatch[3] ? parseInt(selectMatch[3]) : undefined;
      const rows = tables[tableName] || [];
      if (rows.length === 0) return { columns: ['result'], values: [['Empty table']] };
      const cols = Object.keys(rows[0]);
      const data = (limit ? rows.slice(0, limit) : rows).map(r => cols.map(c => r[c]));
      return { columns: cols, values: data };
    }

    // SELECT COUNT(*) FROM table
    const countMatch = trimmed.match(/^SELECT\s+COUNT\(\*\)\s+FROM\s+(\w+)/i);
    if (countMatch) {
      const tableName = countMatch[1];
      const count = (tables[tableName] || []).length;
      return { columns: ['count'], values: [[count]] };
    }

    // DELETE FROM table WHERE id = N
    const deleteMatch = trimmed.match(/^DELETE\s+FROM\s+(\w+)(\s+WHERE\s+id\s*=\s*(\d+))?/i);
    if (deleteMatch) {
      const tableName = deleteMatch[1];
      const id = deleteMatch[3] ? parseInt(deleteMatch[3]) : null;
      if (id) {
        deleteRow(tableName, id);
        return { columns: ['result'], values: [['1 row deleted']], changes: 1 };
      } else {
        const count = (tables[tableName] || []).length;
        tables[tableName] = [];
        saveDB();
        return { columns: ['result'], values: [[`${count} rows deleted`]], changes: count };
      }
    }

    // DROP TABLE
    const dropMatch = trimmed.match(/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i);
    if (dropMatch) {
      delete tables[dropMatch[1]];
      saveDB();
      return { columns: ['result'], values: [['Table dropped']], changes: 1 };
    }

    // CREATE TABLE
    const createMatch = trimmed.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
    if (createMatch) {
      ensureTable(createMatch[1]);
      return { columns: ['result'], values: [['Table created']], changes: 0 };
    }

    return { columns: ['result'], values: [['Query executed (basic parser — complex queries may not be supported)']] };
  } catch (e: any) {
    return { columns: ['error'], values: [[e.message || 'Unknown error']], error: e.message };
  }
}

// ========== Auth helpers ==========
function hashPassword(password: string): string {
  return btoa(password + '_orc_salt_' + password.split('').reverse().join(''));
}

export async function registerUser(username: string, password: string): Promise<{ success: boolean; error?: string; userId?: number }> {
  try {
    await getDatabase();
    const existing = queryTable('users', (u: any) => u.username === username);
    if (existing.length > 0) {
      return { success: false, error: 'Username already exists' };
    }
    const hash = hashPassword(password);
    const userId = insertRow('users', {
      username,
      password: hash,
      role: 'admin',
      avatar: '',
      created_at: new Date().toISOString(),
      last_login: null,
    });
    await logActivity(userId, 'register', `User ${username} registered`);
    return { success: true, userId };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function loginUser(username: string, password: string): Promise<{ success: boolean; error?: string; user?: { id: number; username: string; role: string; avatar: string } }> {
  try {
    await getDatabase();
    const hash = hashPassword(password);
    const users = queryTable('users', (u: any) => u.username === username && u.password === hash);
    if (users.length === 0) {
      return { success: false, error: 'Invalid username or password' };
    }
    const u = users[0];
    updateRow('users', u.id, { last_login: new Date().toISOString() });
    const user = { id: u.id, username: u.username, role: u.role, avatar: u.avatar || '' };
    await logActivity(user.id, 'login', `User ${username} logged in`);
    return { success: true, user };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getUsers(): Promise<any[]> {
  await getDatabase();
  return queryTable('users').map((u: any) => ({
    id: u.id, username: u.username, role: u.role, avatar: u.avatar,
    created_at: u.created_at, last_login: u.last_login,
  }));
}

export async function deleteUser(id: number) {
  await getDatabase();
  deleteRow('users', id);
}

export async function logActivity(userId: number | null, action: string, detail: string = '') {
  await getDatabase();
  insertRow('activity_log', {
    user_id: userId,
    action,
    detail,
    timestamp: new Date().toISOString(),
    username: userId ? (queryTable('users', u => u.id === userId)[0]?.username || 'system') : 'system',
  });
}

export async function getActivityLog(): Promise<any[]> {
  await getDatabase();
  return queryTable('activity_log')
    .sort((a: any, b: any) => (b.id || 0) - (a.id || 0))
    .slice(0, 100);
}

export async function getTheme(): Promise<Record<string, any>> {
  await getDatabase();
  const themes = queryTable('site_theme');
  return themes[0] || {};
}

export async function updateTheme(updates: Record<string, any>) {
  await getDatabase();
  const themes = queryTable('site_theme');
  if (themes.length > 0) {
    updateRow('site_theme', themes[0].id, updates);
  }
}

export async function getDBSize(): Promise<string> {
  const raw = localStorage.getItem(DB_PREFIX + 'tables') || '';
  const bytes = new Blob([raw]).size;
  const kb = bytes / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`;
}

export async function getTableList(): Promise<string[]> {
  await getDatabase();
  return Object.keys(tables);
}

// ========== Advanced features ==========
export async function getAnnouncements(): Promise<any[]> {
  await getDatabase();
  return queryTable('announcements').sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
}

export function addAnnouncement(data: { title: string; content: string; type: string; pinned: boolean }) {
  return insertRow('announcements', { ...data, created_at: new Date().toISOString(), active: true });
}

export function deleteAnnouncement(id: number) {
  deleteRow('announcements', id);
}

export function getNotes(): any[] {
  return queryTable('notes').sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
}

export function addNote(data: { title: string; content: string; color: string }) {
  return insertRow('notes', { ...data, created_at: new Date().toISOString() });
}

export function deleteNote(id: number) {
  deleteRow('notes', id);
}

export function getBookmarks(): any[] {
  return queryTable('bookmarks');
}

export function addBookmark(data: { name: string; url: string; category: string }) {
  return insertRow('bookmarks', { ...data, created_at: new Date().toISOString() });
}

export function deleteBookmark(id: number) {
  deleteRow('bookmarks', id);
}

export function getRoles(): any[] {
  return queryTable('roles');
}

export function addRole(data: { name: string; permissions: string[]; color: string }) {
  return insertRow('roles', data);
}

export function deleteRole(id: number) {
  deleteRow('roles', id);
}

export function getTags(): any[] {
  return queryTable('tags');
}

export function addTag(data: { name: string; color: string }) {
  return insertRow('tags', data);
}

export function deleteTag(id: number) {
  deleteRow('tags', id);
}

export function getMedia(): any[] {
  return queryTable('media').sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
}

export function addMedia(data: { name: string; url: string; type: string; size?: string }) {
  return insertRow('media', { ...data, uploaded_at: new Date().toISOString() });
}

export function deleteMedia(id: number) {
  deleteRow('media', id);
}

export function getCustomPages(): any[] {
  return queryTable('custom_pages');
}

export function addCustomPage(data: { title: string; slug: string; content: string; published: boolean }) {
  return insertRow('custom_pages', { ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
}

export function updateCustomPage(id: number, updates: any) {
  updateRow('custom_pages', id, { ...updates, updated_at: new Date().toISOString() });
}

export function deleteCustomPage(id: number) {
  deleteRow('custom_pages', id);
}

export function getScheduledTasks(): any[] {
  return queryTable('scheduled_tasks');
}

export function addScheduledTask(data: { name: string; schedule: string; action: string; enabled: boolean }) {
  return insertRow('scheduled_tasks', { ...data, last_run: null, created_at: new Date().toISOString() });
}

export function deleteScheduledTask(id: number) {
  deleteRow('scheduled_tasks', id);
}

export function getApiKeys(): any[] {
  return queryTable('api_keys');
}

export function addApiKey(data: { name: string; key: string; permissions: string[]; expires?: string }) {
  return insertRow('api_keys', { ...data, created_at: new Date().toISOString(), last_used: null, calls: 0 });
}

export function deleteApiKey(id: number) {
  deleteRow('api_keys', id);
}

export function getWidgets(): any[] {
  return queryTable('widgets');
}

export function addWidget(data: { name: string; type: string; position: string; config: any; enabled: boolean }) {
  return insertRow('widgets', data);
}

export function deleteWidget(id: number) {
  deleteRow('widgets', id);
}

export function updateWidget(id: number, updates: any) {
  updateRow('widgets', id, updates);
}

export function createBackup(): number {
  const allData = localStorage.getItem(DB_PREFIX + 'tables') || '{}';
  return insertRow('backups', {
    data: allData,
    created_at: new Date().toISOString(),
    size: new Blob([allData]).size,
    label: `Backup ${new Date().toLocaleString()}`,
  });
}

export function getBackups(): any[] {
  return queryTable('backups').sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
}

export function restoreBackup(id: number): boolean {
  const backups = queryTable('backups');
  const backup = backups.find((b: any) => b.id === id);
  if (!backup) return false;
  try {
    const data = JSON.parse(backup.data);
    tables = data;
    saveDB();
    return true;
  } catch {
    return false;
  }
}

export function deleteBackup(id: number) {
  deleteRow('backups', id);
}

// Wipe everything
export function nukeDatabase() {
  tables = {};
  localStorage.removeItem(DB_PREFIX + 'tables');
  initialized = false;
}
