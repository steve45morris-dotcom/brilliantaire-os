import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalNodeRegistry } from '../../knowledge/NodeRegistry.js';
import { globalEdgeRegistry } from '../../knowledge/EdgeRegistry.js';

export interface RevenueStream {
  category: 'Streaming' | 'Royalties' | 'Shows' | 'Merchandise' | 'Licensing' | 'YouTube' | 'Brand Deals' | 'Affiliate' | 'Other';
  amount: number;
  date: string;
  notes: string;
}

export interface ExpenseRecord {
  description: string;
  amount: number;
  date: string;
}

export class RevenueCenter {
  private income: RevenueStream[] = [
    { category: 'Streaming', amount: 1250, date: '2026-07-01', notes: 'Spotify & Apple Music monthly pay' },
    { category: 'Royalties', amount: 840, date: '2026-07-03', notes: 'Song trust publishing royalties' },
    { category: 'Brand Deals', amount: 2000, date: '2026-07-05', notes: 'AI audio software sponsor payout' },
    { category: 'Merchandise', amount: 450, date: '2026-07-08', notes: 'Mr. 2 Lighter custom tees and chess boards' }
  ];

  private expenses: ExpenseRecord[] = [
    { description: 'Vocal booth studio recording time', amount: 350, date: '2026-07-02' },
    { description: 'Piper TTS voice model training compute runtime', amount: 150, date: '2026-07-04' },
    { description: 'Chess logo visual artwork graphic design', amount: 200, date: '2026-07-06' }
  ];

  public getIncome(): RevenueStream[] {
    return [...this.income];
  }

  public getExpenses(): ExpenseRecord[] {
    return [...this.expenses];
  }

  public recordIncome(stream: RevenueStream): void {
    this.income.push(stream);

    // Register node in Knowledge Graph
    const nodeId = `rev-income-${Date.now()}`;
    globalNodeRegistry.registerNode(nodeId, 'Revenue', {
      category: stream.category,
      amount: stream.amount,
      notes: stream.notes
    });
    globalEdgeRegistry.registerEdge(nodeId, 'system-core', 'PRODUCED_REVENUE');

    // Notify EventBus
    globalEventBus.publish('IcyflamzeRevenueRecorded', { category: stream.category, amount: stream.amount });
  }

  public recordExpense(expense: ExpenseRecord): void {
    this.expenses.push(expense);
    globalEventBus.publish('IcyflamzeExpenseRecorded', { description: expense.description, amount: expense.amount });
  }

  public getProfitMetrics() {
    const totalIncome = this.income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = this.expenses.reduce((sum, item) => sum + item.amount, 0);
    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      currency: 'USD'
    };
  }
}

export const globalRevenueCenter = new RevenueCenter();
