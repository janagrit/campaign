import Table from 'cli-table3';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

type ResultKey = 'passed' | 'failed' | 'knownbug' | 'skipped' | 'flaky';

interface SummaryRow {
  suite: string;
  name: string;
  key: ResultKey;
  duration: string;
}

class TableSummaryReporter implements Reporter {
  private readonly results = new Map<string, SummaryRow>();

  onTestEnd(test: TestCase, result: TestResult): void {
    this.results.set(test.id, {
      suite: test.parent?.title || 'General',
      name: test.title,
      key: this.classify(test, result),
      duration: this.formatDuration(result.duration)
    });
  }

  private classify(test: TestCase, result: TestResult): ResultKey {
    const outcome = test.outcome();

    if (result.status === 'skipped' || outcome === 'skipped') return 'skipped';
    if (outcome === 'expected' && result.status !== 'passed') return 'knownbug';

    if (
      outcome === 'unexpected' ||
      result.status === 'failed' ||
      result.status === 'timedOut'
    ) {
      return 'failed';
    }

    if (outcome === 'flaky') return 'flaky';
    return 'passed';
  }

  private formatDuration(ms: number): string {
    if (!ms) return '0s';
    const seconds = Math.round(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  }

  async onEnd(): Promise<void> {
    const [{ Chalk }, chalkModule] = await Promise.all([
      import('chalk'),
      Promise.resolve(true)
    ]);
    void chalkModule;
    const chalk = new Chalk({ level: 3 });
    const rows = [...this.results.values()];

    if (rows.length === 0) {
      console.log(chalk.yellow('\\nNo test results recorded.'));
      return;
    }

    const labels: Record<ResultKey, string> = {
      passed: chalk.green('Passed'),
      failed: chalk.red('Failed'),
      knownbug: chalk.cyan('Known bug'),
      skipped: chalk.yellow('Skipped'),
      flaky: chalk.magenta('Flaky')
    };

    const table = new Table({
      head: ['Test Suite', 'Test Name', 'Status', 'Duration'],
      colWidths: [26, 56, 14, 10],
      wordWrap: true
    });

    for (const row of rows) {
      table.push([row.suite, row.name, labels[row.key], row.duration]);
    }

    console.log('\\n' + table.toString());

    const count = (key: ResultKey) => rows.filter(row => row.key === key).length;
    console.log(chalk.bold(`\\nTotal: ${rows.length}`));
    console.log(chalk.green(`Passed: ${count('passed')}`));
    console.log(chalk.red(`Failed: ${count('failed')}`));
    console.log(chalk.cyan(`Known bugs (expected fail): ${count('knownbug')}`));
    if (count('flaky')) console.log(chalk.magenta(`Flaky: ${count('flaky')}`));
    console.log(chalk.yellow(`Skipped: ${count('skipped')}`));
  }
}

export default TableSummaryReporter;
