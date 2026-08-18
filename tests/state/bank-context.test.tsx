import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BankProvider, useBank } from '@/state/bank-context';

describe('useBank', () => {
  it('throws when used outside <BankProvider>', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useBank())).toThrow(
      'useBank must be used inside <BankProvider>',
    );
    spy.mockRestore();
  });

  it('creates, selects, and transacts through the api', () => {
    const { result } = renderHook(() => useBank(), { wrapper: BankProvider });

    let firstAccountId = '';
    act(() => {
      firstAccountId = result.current.createAccount('Ada');
    });
    expect(result.current.state.accounts).toHaveLength(1);
    expect(result.current.state.selectedAccountId).toBe(firstAccountId);

    let secondAccountId = '';
    act(() => {
      secondAccountId = result.current.createAccount('Grace', 'EUR');
    });
    expect(result.current.state.selectedAccountId).toBe(secondAccountId);
    expect(result.current.state.accounts[1]?.currency).toBe('EUR');

    act(() => result.current.selectAccount(firstAccountId));
    expect(result.current.state.selectedAccountId).toBe(firstAccountId);

    act(() => result.current.applyTransaction(firstAccountId, 'deposit', 1000));
    const firstAccount = result.current.state.accounts.find(
      (account) => account.id === firstAccountId,
    );
    expect(firstAccount?.balanceCents).toBe(1000);
    // Ids and timestamps are supplied by this layer, not the reducer.
    expect(firstAccount?.transactions[0]?.id).toBeTruthy();
    expect(firstAccount?.transactions[0]?.timestamp).toBeGreaterThan(0);
  });
});
