

export class DecoratorProfiler {
    private static durations: number[] = [];

    static record(duration: number) {
        this.durations.push(duration);
    }

    static total(): number {
        return this.durations.reduce((sum, d) => sum + d, 0);
    }
}
