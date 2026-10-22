// ding-dong SANDBOX: in-browser stand-in for firebase/app, firebase/auth and firebase/firestore.
// All data lives in this browser's localStorage (seeded demo data). Nothing is sent to any server.
// Frames on the same origin share the store and sync live via BroadcastChannel + storage events.
import SEED from './seed.json';
const KEY = 'dd_sandbox_db_v1', SEED_AT = 'dd_sandbox_seeded_at';
const LS = typeof localStorage !== 'undefined' ? localStorage : { getItem() { return null; }, setItem() {}, removeItem() {} };
const W = typeof window !== 'undefined' ? window : {};
let DB = {};
const load = () => { try { DB = JSON.parse(LS.getItem(KEY) || 'null') || null; } catch { DB = null; } if (!DB) { DB = JSON.parse(JSON.stringify(SEED)); LS.setItem(KEY, JSON.stringify(DB)); LS.setItem(SEED_AT, String(Date.now())); } };
load();
const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dd-sandbox') : null;
const save = () => { LS.setItem(KEY, JSON.stringify(DB)); bc && bc.postMessage('changed'); };
const onRemote = () => { load(); fireAll(); };
bc && (bc.onmessage = e => { if (e.data === 'changed') onRemote(); if (e.data === 'reset') { authLoad(); onRemote(); fireAuth(); } });
W.addEventListener && W.addEventListener('storage', e => { if (e.key === KEY) onRemote(); });
export const __sandboxReset = () => { LS.removeItem(KEY); load(); bc && bc.postMessage('reset'); fireAll(); };
if (W) W.__ddSandbox = { reset: __sandboxReset, dump: () => DB };

// ---------- app ----------
const APP = { name: '[DEFAULT]', options: { projectId: 'ding-dong-sandbox' } };
export const initializeApp = () => APP; export const getApps = () => [APP]; export const getApp = () => APP;

// ---------- auth ----------
const DEMO = { '+919000000000': '000000', '+919000000001': '111111', '+919000000002': '222222', '+919000000003': '333333', '+919000000004': '444444', '+919000000005': '555555', '+919000000006': '666666', '+919000000007': '777777', '+919000000008': '888888', '+919000000009': '999999' };
const frameKey = () => 'dd_sandbox_auth_' + ((W.name && /^dd-/.test(W.name)) ? W.name : (new URLSearchParams(W.location ? W.location.search : '').get('frame') || 'main'));
const mkUser = phone => phone ? { uid: 'demo-' + phone.replace(/\D/g, ''), phoneNumber: phone, isAnonymous: false, providerData: [], getIdToken: async () => 'sandbox' } : null;
const authObj = { currentUser: null, settings: {}, app: APP, languageCode: 'en', useDeviceLanguage() {} };
const authLoad = () => { authObj.currentUser = mkUser(LS.getItem(frameKey())); };
authLoad();
// One-tap demo login: ?demo=customer|seller|rider|kitchen|cook|pro|leader|admin
const DEMO_AS = { customer: '1', seller: '2', vendor: '2', pharmacy: '3', rider: '4', kitchen: '5', cook: '6', pro: '7', leader: '8', customer2: '9', admin: '0' };
try { const as = new URLSearchParams(W.location.search).get('demo'); if (as && DEMO_AS[as]) { const ph = '+91900000000' + DEMO_AS[as]; if (!authObj.currentUser || authObj.currentUser.phoneNumber !== ph) { LS.setItem(frameKey(), ph); authLoad(); } } } catch {}
const authSubs = new Set();
const fireAuth = () => authSubs.forEach(cb => setTimeout(() => cb(authObj.currentUser), 0));
export const getAuth = () => authObj; export const initializeAuth = () => authObj;
export const getReactNativePersistence = () => ({}); export const browserLocalPersistence = {}; export const inMemoryPersistence = {};
export const connectAuthEmulator = () => {};
export function onAuthStateChanged(a, cb) { const f = typeof cb === 'function' ? cb : cb.next; authSubs.add(f); setTimeout(() => f(authObj.currentUser), 0); return () => authSubs.delete(f); }
export const onIdTokenChanged = onAuthStateChanged;
export class RecaptchaVerifier { constructor() {} render() { return Promise.resolve(0); } clear() {} verify() { return Promise.resolve('sandbox'); } }
export async function signInWithPhoneNumber(a, phone) {
  const p = String(phone).replace(/[^\d+]/g, '');
  if (!DEMO[p]) { const e = new Error('Demo sandbox: use one of the demo numbers, e.g. +91 90000 00001 (code 111111).'); e.code = 'auth/invalid-phone-number'; throw e; }
  return { verificationId: 'sandbox', confirm: async code => { if (String(code) !== DEMO[p]) { const e = new Error('Wrong code. Demo code for this number is ' + DEMO[p] + '.'); e.code = 'auth/invalid-verification-code'; throw e; }
    LS.setItem(frameKey(), p); authLoad(); fireAuth(); fireAll(); return { user: authObj.currentUser }; } };
}
export async function signOut() { LS.removeItem(frameKey()); authLoad(); fireAuth(); fireAll(); }

// ---------- firestore ----------
const DELETE = { __op: 'delete' };
export const deleteField = () => DELETE; export const serverTimestamp = () => new Date().toISOString();
const dbObj = { app: APP, type: 'firestore' };
export const getFirestore = () => dbObj; export const initializeFirestore = () => dbObj; export const connectFirestoreEmulator = () => {};
export const persistentLocalCache = () => ({}); export const memoryLocalCache = () => ({});
const autoId = () => Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 8);
class DocRef { constructor(path) { this.path = path; const s = path.split('/'); this.id = s[s.length - 1]; this.type = 'document'; this.firestore = dbObj; } get parent() { return new ColRef(this.path.split('/').slice(0, -1).join('/')); } }
class ColRef { constructor(path) { this.path = path; this.id = path.split('/').pop(); this.type = 'collection'; this.filters = []; this.firestore = dbObj; } }
const segs = (base, rest) => [base && base.path, ...rest].filter(x => x != null && x !== '').join('/');
export function doc(parent, ...rest) { if (parent && parent.type === 'collection') { return new DocRef(parent.path + '/' + (rest.length ? rest.join('/') : autoId())); } return new DocRef(segs(null, rest)); }
export function collection(parent, ...rest) { return new ColRef(parent && parent.type === 'document' ? parent.path + '/' + rest.join('/') : segs(null, rest)); }
export const where = (field, op, value) => ({ kind: 'where', field, op, value });
export const orderBy = (field, dir = 'asc') => ({ kind: 'orderBy', field, dir });
export const limit = n => ({ kind: 'limit', n });
export function query(col, ...cs) { const q = new ColRef(col.path); q.filters = [...(col.filters || []), ...cs]; return q; }
const get = (o, f) => f.split('.').reduce((a, k) => a == null ? a : a[k], o);
const match = (d, w) => { const v = get(d, w.field); switch (w.op) { case '==': return v === w.value; case '!=': return v !== w.value; case '<': return v < w.value; case '<=': return v <= w.value; case '>': return v > w.value; case '>=': return v >= w.value; case 'in': return w.value.includes(v); case 'not-in': return !w.value.includes(v); case 'array-contains': return Array.isArray(v) && v.includes(w.value); case 'array-contains-any': return Array.isArray(v) && v.some(x => w.value.includes(x)); default: return true; } };
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const meta = { fromCache: false, hasPendingWrites: false };
const docSnap = path => { const data = DB[path]; const r = new DocRef(path); return { id: r.id, ref: r, metadata: meta, exists: () => data !== undefined, data: () => clone(data), get: f => clone(get(data || {}, f)) }; };
// --- minimal security model (mirrors the real rules where it matters for a public sandbox)
const me = () => authObj.currentUser; const myDoc = () => me() ? DB['users/' + me().uid] : null;
const isAdmin = () => !!me() && myDoc()?.role === 'admin';
const canList = path => { const c = path.split('/')[0]; if (c === 'users') return isAdmin(); return !!me(); };
function permErr() { const e = new Error('Missing or insufficient permissions. (sandbox)'); e.code = 'permission-denied'; return e; }
const runQuery = q => { const depth = q.path.split('/').length; let docs = Object.keys(DB).filter(k => k.startsWith(q.path + '/') && k.split('/').length === depth + 1).map(docSnap).filter(s => (q.filters || []).filter(f => f.kind === 'where').every(w => match(s.data(), w)));
  const ob = (q.filters || []).find(f => f.kind === 'orderBy'); if (ob) docs.sort((a, b) => { const x = get(a.data(), ob.field), y = get(b.data(), ob.field); return (x > y ? 1 : x < y ? -1 : 0) * (ob.dir === 'desc' ? -1 : 1); });
  const lm = (q.filters || []).find(f => f.kind === 'limit'); if (lm) docs = docs.slice(0, lm.n); return docs; };
const qSnap = (docs, prev) => ({ docs, size: docs.length, empty: !docs.length, metadata: meta, forEach: f => docs.forEach(f), docChanges: () => docs.filter(d => !prev || !prev.has(d.id)).map(d => ({ type: 'added', doc: d })) });
// listeners
const subs = new Set();
function fire(s) { try { if (s.ref.type === 'document') { const snap = docSnap(s.ref.path); const sig = JSON.stringify(DB[s.ref.path] ?? null) + '|' + (me()?.uid || ''); if (sig === s.sig) return; s.sig = sig; s.next(snap); }
  else { if (!canList(s.ref.path)) { if (s.sig !== 'ERR') { s.sig = 'ERR'; s.error && s.error(permErr()); } return; } const docs = runQuery(s.ref); const sig = JSON.stringify(docs.map(d => [d.id, DB[d.ref.path]])); if (sig === s.sig) return; s.sig = sig; s.next(qSnap(docs, s.prev)); s.prev = new Set(docs.map(d => d.id)); } } catch (e) { console.warn('[sandbox] listener', e); } }
let pending = false; function fireAll() { if (pending) return; pending = true; setTimeout(() => { pending = false; subs.forEach(fire); }, 0); }
export function onSnapshot(ref, ...args) { let o = args[0]; if (o && typeof o === 'object' && !o.next && 'includeMetadataChanges' in o) args = args.slice(1); o = args[0];
  const s = typeof o === 'function' ? { ref, next: o, error: args[1] } : { ref, next: o.next?.bind(o), error: o.error?.bind(o) }; subs.add(s); setTimeout(() => fire(s), 0); return () => subs.delete(s); }
// writes
const applyPatch = (base, patch) => { const out = clone(base || {}); for (const [k, v] of Object.entries(patch)) { const parts = k.split('.'); let t = out; for (let i = 0; i < parts.length - 1; i++) t = (t[parts[i]] = (t[parts[i]] && typeof t[parts[i]] === 'object') ? t[parts[i]] : {}); const last = parts[parts.length - 1]; if (v === DELETE || (v && v.__op === 'delete')) delete t[last]; else t[last] = clone(v); } return out; };
const stripDel = o => { const r = {}; for (const [k, v] of Object.entries(o)) if (!(v && v.__op === 'delete')) r[k] = v; return r; };
function checkWrite(path, next, prev) { const [c] = path.split('/');
  if (c === 'users' && !isAdmin() && prev && ['role', 'storeId', 'riderId', 'cookId', 'proId', 'communityId', 'phone'].some(k => JSON.stringify(prev[k]) !== JSON.stringify(next[k]))) throw permErr();
  if (c === 'orders' && prev && next.status === 'delivered' && prev.status !== 'delivered' && next.deliveryCode != null) { const sec = DB['orderSecrets/' + path.split('/')[1]]; if (sec && String(sec.otp) !== String(next.deliveryCode)) throw permErr(); } }
function doSet(path, data, opts) { const prev = DB[path]; const next = opts && (opts.merge || opts.mergeFields) ? applyPatch(prev, data) : applyPatch({}, stripDel(data)); checkWrite(path, next, prev); DB[path] = next; }
function doUpdate(path, data) { const prev = DB[path]; if (prev === undefined) { const e = new Error('No document to update: ' + path); e.code = 'not-found'; throw e; } const next = applyPatch(prev, data); checkWrite(path, next, prev); DB[path] = next; }
const commit = fn => { const snapshot = JSON.stringify(DB); try { fn(); } catch (e) { DB = JSON.parse(snapshot); throw e; } save(); fireAll(); };
const tick = () => new Promise(r => setTimeout(r, 30));
export async function setDoc(ref, data, opts) { await tick(); commit(() => doSet(ref.path, data, opts)); }
export async function updateDoc(ref, data, ...more) { await tick(); if (typeof data === 'string') { const o = {}; const a = [data, ...more]; for (let i = 0; i < a.length; i += 2) o[a[i]] = a[i + 1]; data = o; } commit(() => doUpdate(ref.path, data)); }
export async function addDoc(col, data) { const r = doc(col); await setDoc(r, data); return r; }
export async function deleteDoc(ref) { await tick(); commit(() => { delete DB[ref.path]; }); }
export async function getDoc(ref) { await tick(); return docSnap(ref.path); }
export const getDocFromServer = getDoc;
export async function getDocs(q) { await tick(); if (!canList(q.path)) throw permErr(); return qSnap(runQuery(q)); }
export function writeBatch() { const ops = []; const b = { set(r, d, o) { ops.push(() => doSet(r.path, d, o)); return b; }, update(r, d) { ops.push(() => doUpdate(r.path, d)); return b; }, delete(r) { ops.push(() => { delete DB[r.path]; }); return b; }, async commit() { await tick(); commit(() => ops.forEach(f => f())); } }; return b; }
export async function runTransaction(db, fn) { await tick(); const ops = []; const tx = { get: async r => docSnap(r.path), set(r, d, o) { ops.push(() => doSet(r.path, d, o)); return tx; }, update(r, d) { ops.push(() => doUpdate(r.path, d)); return tx; }, delete(r) { ops.push(() => { delete DB[r.path]; }); return tx; } };
  const res = await fn(tx); commit(() => ops.forEach(f => f())); return res; }
export const increment = n => n; export const arrayUnion = (...a) => a; export const Timestamp = { now: () => ({ toDate: () => new Date(), toMillis: () => Date.now() }) };
export const enableIndexedDbPersistence = async () => {}; export const terminate = async () => {};
