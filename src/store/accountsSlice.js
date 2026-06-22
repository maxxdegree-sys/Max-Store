import { createSlice } from '@reduxjs/toolkit';
import { transactions as seed } from '../data/accounts';

const accountsSlice = createSlice({
  name: 'accounts',
  initialState: { items: seed },
  reducers: {
    addTransaction: {
      reducer(state, { payload }) { state.items.unshift(payload); },
      prepare(input) {
        return {
          payload: {
            id: 't' + Date.now(),
            type: input.type === 'expense' ? 'expense' : 'income',
            category: input.category || 'Misc',
            description: (input.description || '').trim(),
            amount: Math.max(0, Math.round(Number(input.amount) || 0)),
            date: input.date || new Date().toISOString().slice(0, 10),
            method: input.method || 'Cash',
            status: input.status === 'pending' ? 'pending' : 'cleared',
            reference: (input.reference || '').trim()
          }
        };
      }
    },
    updateTransaction(state, { payload }) {
      const t = state.items.find((x) => x.id === payload.id);
      if (t) Object.assign(t, payload);
    },
    markCleared(state, { payload }) {
      const t = state.items.find((x) => x.id === payload);
      if (t) t.status = 'cleared';
    },
    deleteTransaction(state, { payload }) {
      state.items = state.items.filter((x) => x.id !== payload);
    }
  }
});

export const { addTransaction, updateTransaction, markCleared, deleteTransaction } = accountsSlice.actions;

// Selectors
export const selectTransactions = (s) => s.accounts.items;

export const selectTotals = (s) => {
  const items = s.accounts.items;
  let income = 0, expense = 0, receivable = 0;
  items.forEach((t) => {
    if (t.type === 'income') {
      if (t.status === 'cleared') income += t.amount;
      else receivable += t.amount; // pending income = money still to collect
    } else {
      expense += t.amount;
    }
  });
  return { income, expense, receivable, net: income - expense };
};

export const selectExpenseByCategory = (s) => {
  const map = {};
  s.accounts.items.forEach((t) => {
    if (t.type === 'expense') map[t.category] = (map[t.category] || 0) + t.amount;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
};

export const selectIncomeByCategory = (s) => {
  const map = {};
  s.accounts.items.forEach((t) => {
    if (t.type === 'income' && t.status === 'cleared') map[t.category] = (map[t.category] || 0) + t.amount;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
};

export default accountsSlice.reducer;
