const db = new Dexie('MinhasFinancasDB_v11');

db.version(1).stores({
  transactions: 'id, data, tipo, recorrencia, categoria, origem, [data+valor]',
  fixedIncome: 'id, item',
  fixedExpense: 'id, categoria, item',
  goals: 'grupo',
  rotativos: 'id',
  investments: 'id, tipo',
  categories: 'key',
  processedInvoices: 'hash',
  settings: 'key'
});

db.version(2).stores({
  transactions: 'id, data, tipo, recorrencia, categoria, origem, [data+valor]',
  fixedIncome: 'id, item', fixedExpense: 'id, categoria, item', goals: 'grupo',
  rotativos: 'id', investments: 'id, tipo', categories: 'key',
  processedInvoices: 'hash', settings: 'key',
  planejamentos: 'id, status, tipo, natureza, prioridade, certeza, dataInicio'
});

const clone = value => JSON.parse(JSON.stringify(value));

export async function loadState(seed) {
  const initialized = await db.settings.get('initialized');
  if (!initialized) {
    await saveState(seed);
    await db.settings.put({ key: 'initialized', value: true });
    return clone(seed);
  }

  const [transactions, fixedIncome, fixedExpense, goalRows, rotativos, investments, categoryRows, invoiceRows, configRow, planejamentos] = await Promise.all([
    db.transactions.toArray(), db.fixedIncome.toArray(), db.fixedExpense.toArray(), db.goals.toArray(),
    db.rotativos.toArray(), db.investments.toArray(), db.categories.toArray(),
    db.processedInvoices.toArray(), db.settings.get('config'), db.planejamentos.toArray()
  ]);

  const state = clone(seed);
  state.transactions = transactions;
  state.rotativos = rotativos;
  state.investments = investments;
  state.planejamentos = planejamentos;
  state.goals = Object.fromEntries(goalRows.map(x => [x.grupo, x.pct]));
  state.config = { ...state.config, ...(configRow?.value || {}) };
  state.config.receitasFixas = fixedIncome;
  state.config.despesasFixas = fixedExpense;
  state.config.customTaxonomy = Object.fromEntries(categoryRows.map(x => [x.key, x.value]));
  state.config.faturasProcessadas = invoiceRows.map(x => x.hash);
  return state;
}

let writeQueue = Promise.resolve();

async function persistState(state) {
  const config = clone(state.config || {});
  delete config.receitasFixas;
  delete config.despesasFixas;
  delete config.customTaxonomy;
  delete config.faturasProcessadas;

  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.filter(t => t.name !== 'settings').map(t => t.clear()));
    await db.transactions.bulkPut(clone(state.transactions || []));
    await db.fixedIncome.bulkPut(clone(state.config?.receitasFixas || []));
    await db.fixedExpense.bulkPut(clone(state.config?.despesasFixas || []));
    await db.goals.bulkPut(Object.entries(state.goals || {}).map(([grupo, pct]) => ({ grupo, pct })));
    await db.rotativos.bulkPut(clone(state.rotativos || []));
    await db.investments.bulkPut(clone(state.investments || []));
    await db.planejamentos.bulkPut(clone(state.planejamentos || []));
    await db.categories.bulkPut(Object.entries(state.config?.customTaxonomy || {}).map(([key, value]) => ({ key, value })));
    await db.processedInvoices.bulkPut((state.config?.faturasProcessadas || []).map(hash => ({ hash })));
    await db.settings.put({ key: 'config', value: config });
    await db.settings.put({ key: 'initialized', value: true });
  });
}

export function saveState(state) {
  const snapshot = clone(state);
  writeQueue = writeQueue.then(() => persistState(snapshot));
  return writeQueue;
}

export async function resetDatabase(seed) {
  await db.delete();
  await db.open();
  await saveState(seed);
  await db.settings.put({ key: 'initialized', value: true });
}

export async function exportDatabase() {
  const data = {};
  for (const table of db.tables) data[table.name] = await table.toArray();
  return data;
}

export { db };
