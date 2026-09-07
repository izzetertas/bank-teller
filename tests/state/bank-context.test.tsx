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

  it('transfers between accounts with a distinct id per ledger leg', () => {
    const { result } = renderHook(() => useBank(), { wrapper: BankProvider });

    let sourceAccountId = '';
    let destinationAccountId = '';
    act(() => {
      sourceAccountId = result.current.createAccount('Ada');
      destinationAccountId = result.current.createAccount('Grace');
    });
    act(() => result.current.applyTransaction(sourceAccountId, 'deposit', 1000));
    act(() => result.current.transfer(sourceAccountId, destinationAccountId, 250));

    const findAccount = (id: string) =>
      result.current.state.accounts.find((account) => account.id === id);
    const source = findAccount(sourceAccountId);
    const destination = findAccount(destinationAccountId);
    expect(source?.balanceCents).toBe(750);
    expect(destination?.balanceCents).toBe(250);

    const outgoingId = source?.transactions[0]?.id;
    const incomingId = destination?.transactions[0]?.id;
    expect(outgoingId).toBeTruthy();
    expect(incomingId).toBeTruthy();
    expect(outgoingId).not.toBe(incomingId);
  });
});
