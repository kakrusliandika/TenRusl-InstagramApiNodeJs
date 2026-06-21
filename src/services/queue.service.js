export class AsyncQueue {
  constructor({ concurrency = 1 } = {}) {
    this.concurrency = concurrency;
    this.activeCount = 0;
    this.queue = [];
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.next();
    });
  }

  next() {
    if (this.activeCount >= this.concurrency) return;
    const item = this.queue.shift();
    if (!item) return;

    this.activeCount += 1;

    Promise.resolve()
      .then(item.task)
      .then(item.resolve, item.reject)
      .finally(() => {
        this.activeCount -= 1;
        this.next();
      });
  }

  stats() {
    return {
      concurrency: this.concurrency,
      active: this.activeCount,
      pending: this.queue.length
    };
  }
}
