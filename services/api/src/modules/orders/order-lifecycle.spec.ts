import { ORDER_STATUS_TRANSITIONS, OrderStatus } from '../../common/enums';

/**
 * Guards the order lifecycle state machine. Forward-only progression plus
 * CANCELLED from any non-terminal state; terminal states have no transitions.
 */
describe('ORDER_STATUS_TRANSITIONS', () => {
  it('allows the happy-path progression', () => {
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.PENDING]).toContain(OrderStatus.ASSIGNED);
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.ASSIGNED]).toContain(OrderStatus.ACCEPTED);
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.ACCEPTED]).toContain(OrderStatus.PICKED_UP);
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.PICKED_UP]).toContain(OrderStatus.OUT_FOR_DELIVERY);
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.OUT_FOR_DELIVERY]).toContain(OrderStatus.DELIVERED);
  });

  it('allows cancellation from every non-terminal state', () => {
    for (const s of [
      OrderStatus.PENDING,
      OrderStatus.ASSIGNED,
      OrderStatus.ACCEPTED,
      OrderStatus.PICKED_UP,
      OrderStatus.OUT_FOR_DELIVERY,
    ]) {
      expect(ORDER_STATUS_TRANSITIONS[s]).toContain(OrderStatus.CANCELLED);
    }
  });

  it('treats DELIVERED and CANCELLED as terminal', () => {
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.DELIVERED]).toHaveLength(0);
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.CANCELLED]).toHaveLength(0);
  });

  it('forbids skipping straight from PENDING to DELIVERED', () => {
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.PENDING]).not.toContain(OrderStatus.DELIVERED);
  });
});
