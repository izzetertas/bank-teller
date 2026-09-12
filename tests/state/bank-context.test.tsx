import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AccountService } from '@/domain/account-service';
import { BankProvider, useBank } from '@/state/bank-context';

describe('useBank', () => {
  it('throws when used outside <BankProvider>', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useBank())).toThrow(
      'useBank must be used inside <BankProvider>',
    );
    spy.mockRestore();
  });

  function openAccount(
    result: { current: ReturnType<typeof useBank> },
    name: string,
    currency?: string,
  ): string {
    let accountId = '';
    act(() => {
      const outcome = result.current.createAccount(name, currency);
      if (outcome.ok) {
        accountId = outcome.accountId;
      }
    });
    return accountId;
  }

  it('creates, selects, and transacts through its own service', () => {
    const { result } = renderHook(() => useBank(), { wrapper: BankProvider });

    const firstAccountId = openAccount(result, 'Ada');
    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.selectedAccount?.id).toBe(firstAccountId);

    const secondAccountId = openAccount(result, 'Grace', 'EUR');
    expect(result.current.selectedAccount?.id).toBe(secondAccountId);
    expect(result.current.accounts[1]?.currency).toBe('EUR');

    act(() => result.current.selectAccount(firstAccountId));
    expect(result.current.selectedAccount?.id).toBe(firstAccountId);

    let deposit: ReturnType<typeof result.current.deposit> = { ok: false, error: '' };
    act(() => {
      deposit = result.current.deposit(firstAccountId, 1000);
    });
    expect(deposit).toEqual({ ok: true });
    expect(result.current.selectedAccount?.balanceCents).toBe(1000);
    expect(result.current.selectedAccount?.transactions[0]?.id).toBeTruthy();
    expect(result.current.selectedAccount?.transactions[0]?.timestamp).toBeGreaterThan(0);
  });

  it('surfaces the service error when a rejected mutation reaches it', () => {
    const { result } = renderHook(() => useBank(), { wrapper: BankProvider });

    let created: ReturnType<typeof result.current.createAccount> = { ok: true, accountId: '' };
    act(() => {
      created = result.current.createAccount('   ');
    });
    expect(created).toEqual({ ok: false, error: 'Customer name is required' });
    expect(result.current.accounts).toHaveLength(0);

    const accountId = openAccount(result, 'Ada');
    let withdrawal: ReturnType<typeof result.current.withdraw> = { ok: true };
    act(() => {
      withdrawal = result.current.withdraw(accountId, 1);
    });
    expect(withdrawal).toEqual({
      ok: false,
      error: 'Insufficient funds — the balance is $0.00',
    });
    expect(result.current.selectedAccount?.balanceCents).toBe(0);
  });

  it('ignores selecting an unknown account', () => {
    const { result } = renderHook(() => useBank(), { wrapper: BankProvider });
    const accountId = openAccount(result, 'Ada');
    act(() => result.current.selectAccount('nope'));
    expect(result.current.selectedAccount?.id).toBe(accountId);
  });

  describe('when the service rejects a call the UI did not catch', () => {
    // Simulates a backstop actually firing. BankProvider builds its own
    // private service instance, so there is no object to inject or spy on
    // directly — patching the shared class prototype reaches whichever
    // instance the provider constructed, the same way it would for a real
    // unexpected failure.
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('reports failure instead of a false success', () => {
      const { result } = renderHook(() => useBank(), { wrapper: BankProvider });
      const accountId = openAccount(result, 'Ada');

      vi.spyOn(AccountService.prototype, 'deposit').mockImplementation(() => {
        throw new Error('Account not found');
      });
      let deposit: ReturnType<typeof result.current.deposit> = { ok: true };
      act(() => {
        deposit = result.current.deposit(accountId, 100);
      });
      expect(deposit).toEqual({ ok: false, error: 'Account not found' });
      expect(result.current.selectedAccount?.balanceCents).toBe(0);
    });
  });
});
